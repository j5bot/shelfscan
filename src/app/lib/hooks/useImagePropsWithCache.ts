import { useObjectUrl } from '@reactuses/core';
import { getImageProps, ImageProps } from 'next/image';
import { useEffect, useState } from 'react';

export type ImagePropsWithCacheParams = ImageProps & {
    getImageId: (props: ImageProps) => string;
    getImageDataFromCache: (id: string) => Promise<Blob | undefined>;
    addImageDataToCache: (id: string, data: Blob) => Promise<string>;
};

const blobForUndefined = new Blob();

export const useImagePropsWithCache = (params: ImagePropsWithCacheParams, dependencies: Array<unknown>) => {
    const {
        getImageId,
        getImageDataFromCache,
        addImageDataToCache,
        ...paramsForGetImageProps
    } = params;

    const [imageBlob, setImageBlob] = useState<Blob>();
    const { props: imageProps } = getImageProps(paramsForGetImageProps);

    useEffect(() => {
        let getting: boolean = true;
        (async () => {
            if (imageProps.src === '' || !imageProps.src) {
                return;
            }

            const id = getImageId(imageProps);

            if (!getting) {
                return;
            }
            const cachedImage = await getImageDataFromCache(id);

            let blob: Blob;

            if (cachedImage) {
                blob = cachedImage;
            } else {
                blob = await fetch(imageProps.src, {
                    headers: {
                        accept: 'image/avif',
                    },
                }).then(r => r.blob());

                if (!getting) {
                    return;
                }
                await addImageDataToCache(id, blob);
            }

            if (!blob) {
                return;
            }

            setImageBlob(blob);
        })();

        return () => {
            getting = false;
        };
    }, dependencies);

    const src  = useObjectUrl(imageBlob ?? blobForUndefined);

    return {
        ...imageProps,
        srcSet: undefined, src: imageBlob ? src : undefined,
    };
};
