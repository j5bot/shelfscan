import { addImageDataToCache, makeImageCacheId } from '@/app/lib/database/cacheDatabase';
import { useCachedImage, type ResolvedImageProps } from '@/app/lib/hooks/useCachedImage';
import React, { CSSProperties, memo, Suspense, use } from 'react';

export type ThumbnailBoxProps = {
    alt: string;
    url: string;
    imageUrl?: string;
    className?: string;
    styles?: CSSProperties;
    size: number;
};

type ThumbnailInnerProps = {
    src?: string;
    placeholderPromise: Promise<ResolvedImageProps | undefined>;
    cachePromise: Promise<ResolvedImageProps | undefined>;
    className?: string;
};

const ThumbnailInner = ({ src, placeholderPromise, cachePromise, className }: ThumbnailInnerProps) => {
    if (!src || src.length === 0) {
        return null;
    }

    const placeholder = use(placeholderPromise);

    return (
        <Suspense fallback={<ThumbnailBoxImage promise={placeholder} className={className} />}>
            <ThumbnailBoxImage promise={cachePromise} className={className} />
        </Suspense>
    );
};

export const Thumbnail = (props: ThumbnailBoxProps) => {
    const { alt = props.url, url, imageUrl, className, size } = props;

    const cachedImageProps = useCachedImage({
        alt,
        src: imageUrl ?? url,
        placeholderSrc: url,
        fill: true,
        getImageId: makeImageCacheId,
        addImageDataToCache,
        width: size,
        height: size,
    });

    const fallback = <div className="flex justify-center p-1">
        <div
            className="skeleton rounded-md"
            style={{ width: `${size}px`, height: `${size}px` }}
        />
    </div>;

    if (!url || url.length === 0) {
        return fallback;
    }

    return (
        <Suspense fallback={fallback}>
            <ThumbnailInner src={imageUrl ?? url} {...cachedImageProps} className={className} />
        </Suspense>
    );
};

type ThumbnailBoxInnerProps = {
    src?: string;
    placeholderPromise: Promise<ResolvedImageProps | undefined>;
    cachePromise: Promise<ResolvedImageProps | undefined>;
    size: number;
    styles?: CSSProperties;
};

const ThumbnailBoxImage = ({ promise, className }: { promise: ResolvedImageProps | undefined | Promise<ResolvedImageProps | undefined>; className?: string })=> {
    const resolved = promise instanceof Promise ? use(promise) : promise;

    if (!resolved) {
        return null;
    }

    const { alt, type, ...imageProps } = resolved;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt}
         className={`object-contain transition-[filter] duration-200 rounded-xs ${type === 'placeholder' ? 'blur-xs' : ''} ${className ?? ''}`}
         {...imageProps}
    />;
};

const ThumbnailBoxInner = ({ src, placeholderPromise, cachePromise, size, styles }: ThumbnailBoxInnerProps) => {
    if (!src || src.length === 0) {
        return null;
    }

    const placeholder = use(placeholderPromise);
    const scalePercent = size < 200 ? 'focus:scale-250 hover:scale-250' : size < 300 ? 'focus:scale-150 hover:scale-150' : 'focus:scale-100 hover:scale-100';

    return (
        <div className="flex justify-center p-1 relative">
            <div className={`
                    relative
                    bg-[#f1eff9]
                    flex justify-center items-center
                    rounded-md overflow-clip
                    focus:overflow-visible ${scalePercent}
                    hover:overflow-visible
                    z-[9] hover:z-10 focus:z-10
                `}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    ...styles,
                }}
                tabIndex={0}
            >
                <Suspense fallback={<ThumbnailBoxImage promise={placeholder} />}>
                    <ThumbnailBoxImage promise={cachePromise} />
                </Suspense>
            </div>
        </div>
    );
};

export const ThumbnailBox = memo((props: ThumbnailBoxProps) => {
    const { alt = props.url, url, imageUrl, styles, size } = props;

    const cachedImageProps = useCachedImage({
        alt,
        src: imageUrl ?? url,
        placeholderSrc: url,
        fill: true,
        getImageId: makeImageCacheId,
        addImageDataToCache,
    });

    const fallback = <div className="flex justify-center p-1">
        <div
            className="skeleton rounded-md"
            style={{ width: `${size}px`, height: `${size}px`, ...styles }}
        />
    </div>;

    if (!url || url.length === 0) {
        return fallback;
    }

    return (
        <Suspense fallback={fallback}>
            <ThumbnailBoxInner src={imageUrl ?? url} {...cachedImageProps} size={size} styles={styles} />
        </Suspense>
    );
});
ThumbnailBox.displayName = 'ThumbnailBox';
