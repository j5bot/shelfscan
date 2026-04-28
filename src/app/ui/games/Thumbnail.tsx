import { addImageDataToCache, makeImageCacheId } from '@/app/lib/database/cacheDatabase';
import { useImagePropsWithCache, type ResolvedImageProps } from '@/app/lib/hooks/useImagePropsWithCache';
import React, { CSSProperties, Suspense, use } from 'react';
import { FaQuestion } from 'react-icons/fa6';

export type ThumbnailBoxProps = {
    alt: string;
    url: string;
    imageUrl?: string;
    className?: string;
    styles?: CSSProperties;
    size: number;
};

type ThumbnailInnerProps = {
    promise: Promise<ResolvedImageProps>;
    upgradedProps: ResolvedImageProps | undefined;
    className?: string;
};

const noImageFallback = <div className="flex justify-center p-1">
    <FaQuestion className="self-center m-2 fill-orange-500" title="No Image" size={64} />
</div>;

const ThumbnailInner = ({ promise, upgradedProps, className }: ThumbnailInnerProps) => {
    const initial = use(promise);
    const imageProps = upgradedProps ?? initial;
    const isPlaceholder = initial.isPlaceholder && !upgradedProps;
    return <img
        className={`object-contain transition-[filter] duration-200 ${isPlaceholder ? 'blur-sm' : ''} ${className ?? ''}`}
        {...imageProps}
    />;
};

export const Thumbnail = (props: ThumbnailBoxProps) => {
    const { alt = props.url, className, url, imageUrl, size } = props;
    const { promise, upgradedProps } = useImagePropsWithCache({
        alt,
        src: imageUrl ?? url,
        placeholderSrc: imageUrl ? url : undefined,
        getImageId: makeImageCacheId,
        addImageDataToCache,
        width: size,
        height: size,
    }, [url, imageUrl]);
    return (
        <Suspense fallback={null}>
            <ThumbnailInner promise={promise} upgradedProps={upgradedProps} className={className} />
        </Suspense>
    );
};

type ThumbnailBoxInnerProps = {
    promise: Promise<ResolvedImageProps>;
    upgradedProps: ResolvedImageProps | undefined;
    size: number;
    styles?: CSSProperties;
};

const ThumbnailBoxInner = ({ promise, upgradedProps, size, styles }: ThumbnailBoxInnerProps) => {
    const initial = use(promise);
    const imageProps = upgradedProps ?? initial;
    const isPlaceholder = initial.isPlaceholder && !upgradedProps;
    return imageProps.src ? (
        <div className="flex justify-center p-1">
            <div className={`
                    relative
                    bg-[#f1eff9]
                    flex justify-center items-center
                    rounded-md overflow-clip
                    focus:overflow-visible focus:scale-300
                    hover:overflow-visible hover:scale-300
                    hover:z-40
                `}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    ...styles,
                }}
            >
                <img
                    className={`object-contain transition-[filter] duration-200 ${isPlaceholder ? 'blur-sm' : ''}`}
                    {...imageProps}
                />
            </div>
        </div>
    ) : noImageFallback;
};

export const ThumbnailBox = (props: ThumbnailBoxProps) => {
    const { alt = props.url, url, imageUrl, styles, size } = props;

    if (!url) {
        return noImageFallback;
    }

    const { promise, upgradedProps } = useImagePropsWithCache({
        alt,
        src: imageUrl ?? url,
        placeholderSrc: imageUrl ? url : undefined,
        fill: true,
        getImageId: makeImageCacheId,
        addImageDataToCache,
    }, [url, imageUrl]);

    const fallback = <div className="flex justify-center p-1">
        <div
            className="skeleton rounded-md"
            style={{ width: `${size}px`, height: `${size}px`, ...styles }}
        />
    </div>;

    return (
        <Suspense fallback={fallback}>
            <ThumbnailBoxInner promise={promise} upgradedProps={upgradedProps} size={size} styles={styles} />
        </Suspense>
    );
};
