import { enqueueFetch } from '@/app/lib/utils/fetchQueue';
import { getImageDataFromCache as getFromCache, hasCachedImage } from '@/app/lib/database/cacheDatabase';
import { ImageProps } from 'next/image';
import { useLayoutEffect, useMemo, useRef } from 'react';

const MAX_NORMAL_IMAGE_SIZE = 400;
const NORMAL_IMAGE_QUALITY = 0.9;
const NORMAL_IMAGE_CACHE_QUALITY = 90;

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
    imageId: string;
    placeholderPromise: Promise<ResolvedImageProps | undefined>;
    cachePromise: Promise<ResolvedImageProps | undefined>;
};

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
    const ImageBlobReduce = (window as unknown as Record<string, unknown>)['ImageBlobReduce'] as {
        new (): { toCanvas: (blob: Blob, opts: { max: number }) => Promise<HTMLCanvasElement> };
    };
    const reduce = new ImageBlobReduce();
    const canvas = await reduce.toCanvas(blob, { max: MAX_NORMAL_IMAGE_SIZE });
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (b: Blob | null) => (b ? resolve(b) : reject(
                new Error('canvas.toBlob returned null')
            )),
            'image/jpeg',
            NORMAL_IMAGE_QUALITY,
        );
    });
};

export const useCachedImage = (
    params: ImagePropsWithCacheParams,
): UseCachedImage => {
    const {
        getImageId,
        addImageDataToCache,
        alt,
        src,
        placeholderSrc,
    } = params;

    const normalSrc = rewriteImageSrc(src?.toString() ?? placeholderSrc ?? '');
    const placeholder = placeholderSrc ? rewriteImageSrc(placeholderSrc) : undefined;

    const normalImageId = getImageId({
        alt,
        src: normalSrc,
        width: MAX_NORMAL_IMAGE_SIZE,
        height: MAX_NORMAL_IMAGE_SIZE,
        quality: NORMAL_IMAGE_CACHE_QUALITY,
    } as ImageProps);

    const placeholderSrcPromise =
        useMemo(() => Promise.withResolvers<ResolvedImageProps | undefined>(),
            [normalSrc, placeholder, normalImageId]);
    const cachedSrcPromise =
        useMemo(() => Promise.withResolvers<ResolvedImageProps | undefined>(),
            [normalSrc, placeholder, normalImageId]);

    const urlRef = useRef<string | undefined>(undefined);

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

    const resizeRawBlob = async (rawBlob: Blob) => {
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

    useLayoutEffect(() => {
        if (!normalSrc || normalSrc.length === 0) {
            return;
        }

        let active = true;

        (async () => {
            const isCached = await checkCache(normalImageId);
            if (!active) {
                return;
            }
            if (isCached) {
                const blob = await getCachedBlob(normalImageId);
                if (!active) {
                    return;
                }
                if (!blob) {
                    // hmmm....
                }
                const url = URL.createObjectURL(blob!);
                if (urlRef.current) {
                    URL.revokeObjectURL(urlRef.current);
                }
                urlRef.current = url;
                placeholderSrcPromise.resolve(undefined);
                cachedSrcPromise.resolve({
                    alt,
                    src: url,
                    srcSet: undefined,
                    type: 'cached',
                });
                return;
            }

            // since we're uncached, we can resolve the placeholder promise
            placeholderSrcPromise.resolve({
                alt,
                src: placeholder,
                srcSet: undefined,
                type: 'placeholder',
            });

            queueFetchBlob()
                .then(blob => {
                    if (!active) {
                        return;
                    }
                    if (!blob) {
                        cachedSrcPromise.resolve({
                            alt,
                            src: placeholder,
                            srcSet: undefined,
                            type: 'unknown',
                        });
                        return;
                    }
                    return resizeRawBlob(blob)
                        .then(blob => {
                            if (!active) {
                                return;
                            }
                            cacheBlob(normalImageId, blob);
                            const url = URL.createObjectURL(blob);
                            if (urlRef.current) {
                                URL.revokeObjectURL(urlRef.current);
                            }
                            urlRef.current = url;
                            cachedSrcPromise.resolve({
                                alt,
                                src: url,
                                srcSet: undefined,
                                type: 'cached',
                            });
                        });
                });
        })();

        return () => {
            active = false;
            if (urlRef.current) {
                URL.revokeObjectURL(urlRef.current);
                urlRef.current = undefined;
            }
        };
    }, [normalSrc, placeholder, normalImageId]);

    return {
        imageId: normalImageId,
        placeholderPromise: placeholderSrcPromise.promise,
        cachePromise: cachedSrcPromise.promise,
    };
};
