import { addImageDataToCache, getImageDataFromCache, makeImageCacheId } from '@/app/lib/database/cacheDatabase';
import { useImagePropsWithCache } from '@/app/lib/hooks/useImagePropsWithCache';
import React, { CSSProperties } from 'react';
import { FaQuestion } from 'react-icons/fa6';

export type ThumbnailBoxProps = {
    alt: string;
    url: string;
    className?: string;
    styles?: CSSProperties;
    size: number;
};

export const Thumbnail = (props: ThumbnailBoxProps) => {
    const {alt = props.url, className, url, size} = props;

    const imageProps = useImagePropsWithCache({
        alt,
        src: url,
        getImageId: makeImageCacheId,
        getImageDataFromCache,
        addImageDataToCache,
        width: size,
        height: size,
    }, [url]);

    return <img className={`object-contain ${className}`} {...imageProps} />;
};

export const ThumbnailBox = (props: ThumbnailBoxProps) => {
    const {alt = props.url, url, styles, size} = props;

    const imageProps = useImagePropsWithCache({
        alt,
        src: url,
        fill: true,
        getImageId: makeImageCacheId,
        getImageDataFromCache,
        addImageDataToCache,
    }, [url]);

    return imageProps.src ? (
        <div className="flex justify-center p-1">
            <div className={`
                    relative
                    bg-orange-50
                    flex justify-center items-center
                    rounded-md overflow-clip
                    focus:overflow-visible focus:scale-150
                    hover:overflow-visible hover:scale-150
                `}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    ...styles,
                }}
            >
                <img
                    className="object-contain"
                    {...imageProps}
                />
            </div>
        </div>
    ) : (
         <FaQuestion className="self-center m-2 fill-orange-500" title="No Image" size={64} />
    );
};
