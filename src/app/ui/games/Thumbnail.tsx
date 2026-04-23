import { addImageDataToCache, getImageDataFromCache, makeImageCacheId } from '@/app/lib/database/cacheDatabase';
import { useImagePropsWithCache, type ResolvedImageProps } from '@/app/lib/hooks/useImagePropsWithCache';
import React, { CSSProperties, Suspense, use } from 'react';
import { FaQuestion } from 'react-icons/fa6';

export type ThumbnailBoxProps = {
    alt: string;
    url: string;
    className?: string;
    styles?: CSSProperties;
    size: number;
};

type ThumbnailInnerProps = {
    promise: Promise<ResolvedImageProps>;
    className?: string;
};

const ThumbnailInner = ({ promise, className }: ThumbnailInnerProps) => {
    const imageProps = use(promise);
    return <img className={`object-contain ${className}`} {...imageProps} />;
};

export const Thumbnail = (props: ThumbnailBoxProps) => {
    const { alt = props.url, className, url, size } = props;
    const promise = useImagePropsWithCache({
        alt,
        src: url,
        getImageId: makeImageCacheId,
        getImageDataFromCache,
        addImageDataToCache,
        width: size,
        height: size,
    }, [url]);
    return (
        <Suspense fallback={null}>
            <ThumbnailInner promise={promise} className={className} />
        </Suspense>
    );
};

type ThumbnailBoxInnerProps = {
    promise: Promise<ResolvedImageProps>;
    size: number;
    styles?: CSSProperties;
};

const ThumbnailBoxInner = ({ promise, size, styles }: ThumbnailBoxInnerProps) => {
    const imageProps = use(promise);
    return imageProps.src ? (
        <div className="flex justify-center p-1">
            <div className={`
                    relative
                    bg-[#f1eff9]
                    flex justify-center items-center
                    rounded-md overflow-clip
                    focus:overflow-visible focus:scale-150
                    hover:overflow-visible hover:scale-150
                    hover:z-40
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

export const ThumbnailBox = (props: ThumbnailBoxProps) => {
    const { alt = props.url, url, styles, size } = props;

    if (!url) {
        return <FaQuestion className="self-center m-2 fill-orange-500" title="No Image" size={64} />;
    }

    const promise = useImagePropsWithCache({
        alt,
        src: url,
        fill: true,
        getImageId: makeImageCacheId,
        getImageDataFromCache,
        addImageDataToCache,
    }, [url]);

    const fallback = <div className="flex justify-center p-1">
        <div
            className="skeleton rounded-md"
            style={{ width: `${size}px`, height: `${size}px`, ...styles }}
        />
    </div>;

    return (
        <Suspense fallback={fallback}>
            <ThumbnailBoxInner promise={promise} size={size} styles={styles} />
        </Suspense>
    );
};
