import { cacheDatabase } from '@/app/lib/database/cacheDatabase';
import { useObjectUrl } from '@reactuses/core';
import { getImageProps, ImageProps } from 'next/image';
import { useEffect, useState } from 'react';

const imageSizeRegExp = /\/fit-in\/(\d+)x(\d+)\//;

export const getImageSizeFromUrl = (url: string) => {
    const matches = imageSizeRegExp.exec(url);
    if (!matches) {
        return { height: 200, width: 200 };
    }

    return { height: parseInt(matches[2], 10), width: parseInt(matches[1], 10) };
};

export const useImagePropsWithCache = (props: ImageProps) => {
    const [imageBlob, setImageBlob] = useState<Blob>();
    const { props: imageProps } = getImageProps(props);

    useEffect(() => {
        (async () => {
            if (imageProps.src === '') {
                return;
            }

            const id = [
                imageProps.src,
                imageProps.width,
                imageProps.height,
                imageProps.quality
            ].join(
                '|');

            const cachedImage = await cacheDatabase.images.get(id);

            let blob: Blob;

            if (cachedImage?.data) {
                blob = cachedImage.data;
            } else {
                blob = await fetch(imageProps.src, {
                    headers: {
                        accept: 'image/avif',
                    },
                }).then(r => r.blob());

                await cacheDatabase.images.add({ id, data: blob });
            }

            if (!blob) {
                return;
            }

            setImageBlob(blob);
        })();
    }, [props.src, props.quality]);

    const src  = useObjectUrl(imageBlob ?? new Blob());

    return { ...imageProps, srcSet: undefined, src: imageBlob ? src : undefined };
};
