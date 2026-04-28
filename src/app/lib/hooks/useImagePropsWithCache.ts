import { enqueueFetch } from '@/app/lib/utils/fetchQueue';
import { getImageDataFromCache as getFromCache, hasCachedImage } from '@/app/lib/database/cacheDatabase';
import ImageBlobReduce from 'image-blob-reduce';
import { ImageProps } from 'next/image';
import { useEffect, useRef, useState } from 'react';

const MAX_NORMAL_IMAGE_SIZE = 350;
const NORMAL_IMAGE_QUALITY = 0.9;
const NORMAL_IMAGE_CACHE_QUALITY = 90;

export type ImagePropsWithCacheParams = ImageProps & {
    getImageId: (props: ImageProps) => string;
    getImageDataFromCache: (id: string) => Promise<Blob | undefined>;
    addImageDataToCache: (id: string, data: Blob) => Promise<string>;
    placeholderSrc?: string;
};

export type ResolvedImageProps = {
    alt: string;
    src: string | undefined;
    srcSet: undefined;
    isPlaceholder: boolean;
};

export type UseImagePropsWithCacheResult = {
    promise: Promise<ResolvedImageProps>;
    upgradedProps: ResolvedImageProps | undefined;
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

const resizeBlob = async (blob: Blob): Promise<Blob> => {
    const reduce = new ImageBlobReduce();
    const canvas = await reduce.toCanvas(blob, { max: MAX_NORMAL_IMAGE_SIZE });
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            b => (b ? resolve(b) : reject(new Error('canvas.toBlob returned null'))),
            'image/jpeg',
            NORMAL_IMAGE_QUALITY,
        );
    });
};

export const useImagePropsWithCache = (
    params: ImagePropsWithCacheParams,
    dependencies: Array<unknown>,
): UseImagePropsWithCacheResult => {
    const {
        getImageId,
        getImageDataFromCache,
        addImageDataToCache,
        alt,
        src,
        placeholderSrc,
    } = params;

    const normalSrc = rewriteImageSrc(src.toString());
    const placeholder = placeholderSrc ? rewriteImageSrc(placeholderSrc) : undefined;

    const [cacheStatus, setCacheStatus] = useState<'pending' | 'miss' | 'hit'>('pending');
    const [imageBlob, setImageBlob] = useState<Blob>();
    const [blobSrc, setBlobSrc] = useState<string>();
    const [imageLoadFailed, setImageLoadFailed] = useState(false);

    useEffect(() => {
        if (!imageBlob) {
            return;
        }
        const url = URL.createObjectURL(imageBlob);
        setBlobSrc(url);
        return () => {
            URL.revokeObjectURL(url);
        };
    }, [imageBlob]);

    useEffect(() => {
        // Reset all derived state synchronously at the start of each new effect run
        // so stale values from the previous URL cannot leak into Phase 1.
        setCacheStatus('pending');
        setImageBlob(undefined);
        setBlobSrc(undefined);

        let active = true;
        (async () => {
            if (!normalSrc) {
                setCacheStatus('miss');
                return;
            }

            const normalImageId = getImageId({
                alt,
                src: normalSrc,
                width: MAX_NORMAL_IMAGE_SIZE,
                height: MAX_NORMAL_IMAGE_SIZE,
                quality: NORMAL_IMAGE_CACHE_QUALITY,
            } as ImageProps);

            // Check cache existence first — determines whether to show the
            // placeholder (miss) or wait silently for the cached blob (hit).
            let isCached = false;
            try {
                isCached = await hasCachedImage(normalImageId);
            } catch (e) {
                console.error('cache check failed', normalImageId, e);
                void e;
            }

            if (!active) {
                return;
            }

            if (isCached) {
                setCacheStatus('hit');
                let cachedBlob: Blob | undefined;
                try {
                    cachedBlob = await getFromCache(normalImageId);
                } catch (e) {
                    console.error('cache read failed', normalImageId, e);
                    void e;
                }
                if (!active || !cachedBlob) {
                    return;
                }
                setImageBlob(cachedBlob);
                return;
            }

            // Cache miss: allow placeholder to be shown while we fetch and resize.
            setCacheStatus('miss');

            const accept = getAcceptHeader(src.toString());
            const rawBlob = await enqueueFetch(() =>
                fetch(normalSrc, { headers: { accept } })
                    .then(r => r.blob())
                    .catch((error: unknown) => {
                        console.error(error);
                        return undefined;
                    }),
            ) ?? undefined;

            if (!active || !rawBlob) {
                return;
            }

            let blob: Blob | undefined;
            try {
                blob = await resizeBlob(rawBlob);
            } catch (e) {
                console.error('image resize failed, using raw blob', e);
                blob = rawBlob;
            }

            if (!active || !blob) {
                return;
            }
            void addImageDataToCache(normalImageId, blob);
            setImageBlob(blob);
        })();

        return () => {
            active = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);

    // Phase 1: resolve Suspense promise immediately with placeholder (if provided),
    // or wait for the blob (existing behaviour when no placeholder).
    //
    // Guard: when deps just changed, force undefined so the stale cacheStatus from
    // the previous URL cannot immediately resolve the new promise with wrong data.
    // The effect will reset cacheStatus to 'pending' on its next tick.
    const prevDepsRef = useRef<Array<unknown>>(dependencies);
    const isNewDeps = dependencies.some((d, i) => d !== prevDepsRef.current[i]);
    if (isNewDeps) {
        prevDepsRef.current = dependencies;
    }

    const phase1Src: string | undefined = (() => {
        if (isNewDeps) {
            return undefined; // always suspend until effect resets cacheStatus
        }
        if (cacheStatus === 'pending') {
            return undefined; // suspend while cache check is in progress
        }
        if (cacheStatus === 'miss' && placeholder) {
            return placeholder; // show placeholder immediately on cache miss
        }
        return blobSrc; // cache hit path: undefined until blob is ready, then the object URL
    })();

    const phase1Props: ResolvedImageProps = {
        alt: alt as string,
        src: phase1Src,
        srcSet: undefined,
        isPlaceholder: cacheStatus === 'miss' && !!placeholder && !blobSrc,
    };

    const promiseRef = useRef<{ resolve: ResolveImageFn; promise: Promise<ResolvedImageProps> } | null>(null);

    if (!promiseRef.current) {
        let resolve!: ResolveImageFn;
        const promise = new Promise<ResolvedImageProps>(r => { resolve = r; });
        promiseRef.current = { resolve, promise };
    }

    if (isNewDeps) {
        let resolve!: (v: ResolvedImageProps) => void;
        const promise = new Promise<ResolvedImageProps>(r => { resolve = r; });
        promiseRef.current = { resolve, promise };
    }

    if (phase1Props.src !== undefined || imageLoadFailed) {
        promiseRef.current.resolve(phase1Props);
    }

    // Phase 2: resized blob arrived after a cache-miss placeholder was shown.
    // Without a placeholder (or on cache-hit path), blobSrc is already in phase1Props.
    const upgradedProps: ResolvedImageProps | undefined =
        (cacheStatus === 'miss' && placeholder && blobSrc) ? {
            alt: alt as string,
            src: blobSrc,
            srcSet: undefined,
            isPlaceholder: false,
        } : undefined;

    return { promise: promiseRef.current.promise, upgradedProps };
};
