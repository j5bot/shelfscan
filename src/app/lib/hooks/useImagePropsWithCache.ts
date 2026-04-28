import { enqueueFetch } from '@/app/lib/utils/fetchQueue';
import { ImageProps } from 'next/image';
import { useEffect, useRef, useState } from 'react';

export type ImagePropsWithCacheParams = ImageProps & {
    getImageId: (props: ImageProps) => string;
    getImageDataFromCache: (id: string) => Promise<Blob | undefined>;
    addImageDataToCache: (id: string, data: Blob) => Promise<string>;
};

export type ResolvedImageProps = {
    alt: string;
    src: string | undefined;
    srcSet: undefined;
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

export const useImagePropsWithCache = (params: ImagePropsWithCacheParams, dependencies: Array<unknown>): Promise<ResolvedImageProps> => {
    const {
        getImageId,
        getImageDataFromCache,
        addImageDataToCache,
        alt,
        src,
    } = params;

    const imageProps = {
        alt,
        src: rewriteImageSrc(src.toString()),
    };

    const [imageBlob, setImageBlob] = useState<Blob>();
    const [resolvedSrc, setResolvedSrc] = useState<string>();
    const [imageLoadFailed, setImageLoadFailed] = useState(false);

    useEffect(() => {
        if (!imageBlob) {
            return;
        }
        const url = URL.createObjectURL(imageBlob);
        setResolvedSrc(url);
        return () => {
            URL.revokeObjectURL(url);
        };
    }, [imageBlob]);

    useEffect(() => {
        let active = true;
        (async () => {
            if (!imageProps.src) {
                setImageLoadFailed(true);
                return;
            }

            const id = getImageId(imageProps);

            let cachedImage: Blob | undefined;
            try {
                cachedImage = await getImageDataFromCache(id);
            } catch (e) {
                console.info('getting cached image', id);
                console.error(e);
                void e;
            }

            let blob: Blob | undefined;

            if (cachedImage) {
                blob = cachedImage;
            } else {
                const accept = getAcceptHeader(src.toString());
                blob = await enqueueFetch(() =>
                    fetch(imageProps.src!, { headers: { accept } })
                        .then(r =>  r.blob())
                        .catch((error: unknown) => {
                            console.error(error);
                            return undefined;
                        }),
                ) ?? undefined;

                if (!active) {
                    return;
                }
                if (!blob) {
                    setImageLoadFailed(true);
                    return;
                }
                void addImageDataToCache(id, blob);
            }

            if (!active || !blob) {
                return;
            }

            setImageBlob(blob);
        })();

        return () => {
            active = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);


    const resolvedProps: ResolvedImageProps = {
        ...imageProps,
        srcSet: undefined,
        src: resolvedSrc,
    };

    const promiseRef = useRef<{ resolve: ResolveImageFn; promise: Promise<ResolvedImageProps> } | null>(null);

    if (!promiseRef.current) {
        let resolve!: ResolveImageFn;
        const promise = new Promise<ResolvedImageProps>(r => { resolve = r; });
        promiseRef.current = { resolve, promise };
    }

    const prevDepsRef = useRef<Array<unknown>>(dependencies);
    const isNewDeps = dependencies.some((d, i) => d !== prevDepsRef.current[i]);
    if (isNewDeps) {
        prevDepsRef.current = dependencies;
        setImageLoadFailed(false);
        let resolve!: (v: ResolvedImageProps) => void;
        const promise = new Promise<ResolvedImageProps>(r => { resolve = r; });
        promiseRef.current = { resolve, promise };
    }

    if (resolvedProps.src !== undefined || imageLoadFailed) {
        promiseRef.current.resolve(resolvedProps);
    }

    return promiseRef.current.promise;
};
