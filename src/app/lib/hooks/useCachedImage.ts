import { enqueueFetch } from '@/app/lib/utils/fetchQueue';
import { getImageDataFromCache as getFromCache, hasCachedImage } from '@/app/lib/database/cacheDatabase';
import { ImageProps } from 'next/image';
import { useEffect, useRef, useState } from 'react';

const MAX_NORMAL_IMAGE_SIZE = 400;
const NORMAL_IMAGE_QUALITY = 0.9;
const NORMAL_IMAGE_CACHE_QUALITY = 90;
/** Maximum time (ms) to wait for an image before resolving with the fallback. */
const IMAGE_LOAD_TIMEOUT_MS = 20000;

export type ImagePropsWithCacheParams = ImageProps & {
    getImageId: (props: ImageProps) => string;
    addImageDataToCache: (id: string, data: Blob) => Promise<string>;
    placeholderSrc?: string;
};

export type ResolvedImageProps = {
    alt: string;
    src: string | undefined;
    srcSet: undefined;
    type: 'placeholder' | 'cached' | 'unknown';
};

export type UseCachedImage = {
    placeholderPromise: Promise<ResolvedImageProps | undefined>;
    cachePromise: Promise<ResolvedImageProps | undefined>;
};

type ResolveImageFn = (v: ResolvedImageProps) => void;

const getAcceptHeader = (src: string): string => {
    switch (src.split('.').slice(-1)[0]) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        case 'avif':
            return 'image/avif';
        default:
            return 'image/*';
    }
};

const rewriteImageSrc = (src: string): string => src
    .replace('https://cf.geekdo-images.com/', '/bgg-images/')
    .replace('https://cf.geekdo-static.com/', '/bgg-static/')
    .replace('https://gameupc.com/assets/img/', '/gameupc-images/');

// @ts-ignore
const resizeBlob = async (blob: Blob): Promise<Blob> => {
    const ImageBlobReduce = (window as any).ImageBlobReduce;
    const reduce = new ImageBlobReduce();
    const canvas = await reduce.toCanvas(blob, { max: MAX_NORMAL_IMAGE_SIZE });
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (b: Blob | null) => (b ? resolve(b) : reject(new Error('canvas.toBlob returned null'))),
            'image/jpeg',
            NORMAL_IMAGE_QUALITY,
        );
    });
};

export const useCachedImage = (
    params: ImagePropsWithCacheParams,
    dependencies: Array<unknown>,
): UseCachedImage => {
    const {
        getImageId,
        addImageDataToCache,
        alt,
        src,
        placeholderSrc,
    } = params;

    const normalSrc = rewriteImageSrc(src.toString());
    const placeholder = placeholderSrc ? rewriteImageSrc(placeholderSrc) : undefined;

    const normalImageId = getImageId({
        alt,
        src: normalSrc,
        width: MAX_NORMAL_IMAGE_SIZE,
        height: MAX_NORMAL_IMAGE_SIZE,
        quality: NORMAL_IMAGE_CACHE_QUALITY,
    } as ImageProps);

    const placeholderProps = {
        alt,
        src: placeholder,
        srcSet: undefined,
        type: 'placeholder',
    };
    const placeholderSrcPromiseRef =
        useRef<PromiseWithResolvers<ResolvedImageProps | undefined>>(
            Promise.withResolvers<ResolvedImageProps | undefined>()
        );
    const cachedSrcPromiseRef =
        useRef<PromiseWithResolvers<ResolvedImageProps | undefined>>(
            Promise.withResolvers<ResolvedImageProps | undefined>()
        );

    /* Functions for Async Portion */
    const checkCache = async (id: string) => {
        try {
            return await hasCachedImage(id);
        } catch (e) {
            console.error('cache check failed', id, e);
        }
        return false;
    };

    const getCachedBlob = async (id: string) => {
        try {
            return await getFromCache(id);
        } catch (e) {
            console.error('cache read failed', id, e);
        }
        return undefined;
    };

    const queueFetchBlob = async () => {
        const accept = getAcceptHeader(src.toString());
        try {
            return await enqueueFetch(() =>
                fetch(normalSrc, { headers: { accept } })
                    .then(r => r.blob())
                    .catch((error: unknown) => {
                        console.error('fetch failed', normalSrc, error);
                        return undefined;
                    }),
            ) ?? undefined;
        } catch (e) {
            console.error('enqueueFetch threw', normalSrc, e);
        }
        return undefined;
    };

    const resizeBlob = async (rawBlob: Blob) => {
        try {
            return await resizeBlob(rawBlob);
        } catch (e) {
            console.error('image resize failed, using raw blob', e);
            return rawBlob;
        }
    };

    const cacheBlob = async (id: string, blob: Blob) => {
        try {
            void addImageDataToCache(id, blob);
        } catch (e) {
            console.error('caching blob failed', id, e);
        }
        return blob;
    };

    useEffect(() => {
        let url: string;

        (async () => {
            const isCached = await checkCache(normalImageId);
            if (isCached) {
                const blob = await getCachedBlob(normalImageId);
                if (!blob) {
                    // hmmm....
                }
                url = URL.createObjectURL(blob!);
                placeholderSrcPromiseRef.current.resolve(undefined);
                cachedSrcPromiseRef.current.resolve({
                    alt,
                    src: url,
                    srcSet: undefined,
                    type: 'cached',
                });
                return;
            }

            // since we're uncached, we can resolve the placeholder promise
            placeholderSrcPromiseRef.current.resolve({
                alt,
                src: placeholder,
                srcSet: undefined,
                type: 'placeholder',
            });

            queueFetchBlob()
                .then(blob => {
                    if (!blob) {
                        cachedSrcPromiseRef.current.resolve({
                            alt,
                            src: placeholder,
                            srcSet: undefined,
                            type: 'unknown',
                        });
                        return;
                    }
                    return resizeBlob(blob)
                        .then(blob => {
                            cacheBlob(normalImageId, blob);
                            url = URL.createObjectURL(blob);
                            cachedSrcPromiseRef.current.resolve({
                                alt,
                                src: url,
                                srcSet: undefined,
                                type: 'cached',
                            });
                        });
                });
        })();

        return () => {
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [normalImageId]);

    return {
        placeholderPromise: placeholderSrcPromiseRef.current.promise,
        cachePromise: cachedSrcPromiseRef.current.promise,
    };

    // const [cacheStatus, setCacheStatus] = useState<'pending' | 'miss' | 'hit'>('pending');
    // const [imageBlob, setImageBlob] = useState<Blob>();
    // const [blobSrc, setBlobSrc] = useState<string>();
    //
    // useEffect(() => {
    //     if (!imageBlob) {
    //         return;
    //     }
    //     const url = URL.createObjectURL(imageBlob);
    //     setBlobSrc(url);
    //     return () => {
    //         URL.revokeObjectURL(url);
    //     };
    // }, [imageBlob]);
    //
    // useEffect(() => {
    //     // Reset all derived state synchronously at the start of each new effect run
    //     // so stale values from the previous URL cannot leak into Phase 1.
    //     setCacheStatus('pending');
    //     setImageBlob(undefined);
    //     setBlobSrc(undefined);
    //
    //     let active = true;
    //
    //     // Capture the resolve for the promise that was current when this effect
    //     // started (promiseRef is declared later in the render body but closed over
    //     // by reference — it is always initialised before any effect fires).
    //     // This lets async error/timeout paths resolve the promise directly without
    //     // an extra state-update round-trip.
    //     const currentResolve = promiseRef.current?.resolve;
    //     const fallbackProps: ResolvedImageProps = {
    //         alt: alt as string,
    //         src: undefined,
    //         srcSet: undefined,
    //         isPlaceholder: false,
    //     };
    //
    //     const resolveWithFallback = () => {
    //         if (active) {
    //             currentResolve?.(fallbackProps);
    //         }
    //     };
    //
    //     const timeoutId = setTimeout(() => {
    //         if (active) {
    //             console.warn('useImagePropsWithCache: load timed out for', normalSrc);
    //             resolveWithFallback();
    //         }
    //     }, IMAGE_LOAD_TIMEOUT_MS);
    //
    //     (async () => {
    //         if (!normalSrc) {
    //             setCacheStatus('miss');
    //             resolveWithFallback();
    //             return;
    //         }
    //
    //         const normalImageId = getImageId({
    //             alt,
    //             src: normalSrc,
    //             width: MAX_NORMAL_IMAGE_SIZE,
    //             height: MAX_NORMAL_IMAGE_SIZE,
    //             quality: NORMAL_IMAGE_CACHE_QUALITY,
    //         } as ImageProps);
    //
    //         // Check cache existence first — determines whether to show the
    //         // placeholder (miss) or wait silently for the cached blob (hit).
    //         let isCached = false;
    //         try {
    //             isCached = await hasCachedImage(normalImageId);
    //         } catch (e) {
    //             console.error('cache check failed', normalImageId, e);
    //         }
    //
    //         if (!active) {
    //             return;
    //         }
    //
    //         if (isCached) {
    //             setCacheStatus('hit');
    //             let cachedBlob: Blob | undefined;
    //             try {
    //                 cachedBlob = await getFromCache(normalImageId);
    //             } catch (e) {
    //                 console.error('cache read failed', normalImageId, e);
    //             }
    //             if (!active) {
    //                 return;
    //             }
    //             if (cachedBlob) {
    //                 setImageBlob(cachedBlob);
    //                 return;
    //             }
    //             // Cache read failed — fall through to network fetch, treat as miss.
    //             setCacheStatus('miss');
    //         } else {
    //             // Cache miss: allow placeholder to be shown while we fetch and resize.
    //             setCacheStatus('miss');
    //         }
    //
    //         const accept = getAcceptHeader(src.toString());
    //         let rawBlob: Blob | undefined;
    //         try {
    //             rawBlob = await enqueueFetch(() =>
    //                 fetch(normalSrc, { headers: { accept } })
    //                     .then(r => r.blob())
    //                     .catch((error: unknown) => {
    //                         console.error('fetch failed', normalSrc, error);
    //                         return undefined;
    //                     }),
    //             ) ?? undefined;
    //         } catch (e) {
    //             console.error('enqueueFetch threw', normalSrc, e);
    //         }
    //
    //         if (!active) {
    //             return;
    //         }
    //
    //         if (!rawBlob) {
    //             // Fetch failed: resolve promise with fallback so Suspense never hangs.
    //             resolveWithFallback();
    //             return;
    //         }
    //
    //         let blob: Blob | undefined;
    //         try {
    //             blob = await resizeBlob(rawBlob);
    //         } catch (e) {
    //             console.error('image resize failed, using raw blob', e);
    //             blob = rawBlob;
    //         }
    //
    //         if (!active) {
    //             return;
    //         }
    //
    //         if (!blob) {
    //             resolveWithFallback();
    //             return;
    //         }
    //
    //         void addImageDataToCache(normalImageId, blob);
    //         setImageBlob(blob);
    //     })();
    //
    //     return () => {
    //         active = false;
    //         clearTimeout(timeoutId);
    //     };
    // // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, dependencies);
    //
    // // Phase 1: resolve Suspense promise immediately with placeholder (if provided),
    // // or wait for the blob (existing behaviour when no placeholder).
    // //
    // // Guard: when deps just changed, force undefined so the stale cacheStatus from
    // // the previous URL cannot immediately resolve the new promise with wrong data.
    // // The effect will reset cacheStatus to 'pending' on its next tick.
    // const prevDepsRef = useRef<Array<unknown>>(dependencies);
    // const isNewDeps = dependencies.some((d, i) => d !== prevDepsRef.current[i]);
    // if (isNewDeps) {
    //     prevDepsRef.current = dependencies;
    // }
    //
    // const phase1Src: string | undefined = (() => {
    //     if (isNewDeps) {
    //         return undefined; // always suspend until effect resets cacheStatus
    //     }
    //     if (cacheStatus === 'pending') {
    //         return undefined; // suspend while cache check is in progress
    //     }
    //     if (cacheStatus === 'miss' && placeholder) {
    //         return placeholder; // show placeholder immediately on cache miss
    //     }
    //     return blobSrc; // cache hit path: undefined until blob is ready, then the object URL
    // })();
    //
    // const phase1Props: ResolvedImageProps = {
    //     alt: alt as string,
    //     src: phase1Src,
    //     srcSet: undefined,
    //     isPlaceholder: cacheStatus === 'miss' && !!placeholder && !blobSrc,
    // };
    //
    // const promiseRef = useRef<{ resolve: ResolveImageFn; promise: Promise<ResolvedImageProps> } | null>(null);
    //
    // if (!promiseRef.current) {
    //     let resolve!: ResolveImageFn;
    //     const promise = new Promise<ResolvedImageProps>(r => { resolve = r; });
    //     promiseRef.current = { resolve, promise };
    // }
    //
    // if (isNewDeps) {
    //     let resolve!: (v: ResolvedImageProps) => void;
    //     const promise = new Promise<ResolvedImageProps>(r => { resolve = r; });
    //     promiseRef.current = { resolve, promise };
    // }
    //
    // if (phase1Props.src !== undefined) {
    //     promiseRef.current.resolve(phase1Props);
    // }
    //
    // // Phase 2: resized blob arrived after a cache-miss placeholder was shown.
    // // Without a placeholder (or on cache-hit path), blobSrc is already in phase1Props.
    // const upgradedProps: ResolvedImageProps | undefined =
    //     (cacheStatus === 'miss' && placeholder && blobSrc) ? {
    //         alt: alt as string,
    //         src: blobSrc,
    //         srcSet: undefined,
    //         isPlaceholder: false,
    //     } : undefined;

    // return { promise: promiseRef.current.promise, upgradedProps };
};
