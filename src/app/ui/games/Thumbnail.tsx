import { addImageDataToCache, makeImageCacheId } from '@/app/lib/database/cacheDatabase';
import { useCachedImage, type ResolvedImageProps } from '@/app/lib/hooks/useCachedImage';
import React, { CSSProperties, memo, Suspense, use } from 'react';
import { FaTriangleExclamation } from 'react-icons/fa6';

export type ThumbnailBoxProps = {
    alt: string;
    url: string;
    /** Caches the image under this id instead of one made from its URL (ThumbnailBox only). */
    cacheId?: string;
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

const ThumbnailInner = (props: ThumbnailInnerProps) => {
    const { src, placeholderPromise, cachePromise, className } = props;

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
    className?: string;
    styles?: CSSProperties;
};

const ThumbnailBoxImage = ({ promise, className }: { promise: ResolvedImageProps | undefined | Promise<ResolvedImageProps | undefined>; className?: string })=> {
    const resolved = promise instanceof Promise ? use(promise) : promise;

    if (!resolved) {
        return null;
    }

    const { alt, type, ...imageProps } = resolved;
    return <img alt={alt}
         className={`object-contain transition-[filter] duration-200 rounded-xs ${type === 'placeholder' ? 'blur-xs' : ''} ${className ?? ''}`}
         {...imageProps}
    />;
};

const ThumbnailBoxInner = (props: ThumbnailBoxInnerProps) => {
    const {
        src,
        placeholderPromise,
        cachePromise,
        size,
        className = '',
        styles,
    } = props;

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
                    z-[9] hover:z-13 focus:z-13
                    ${className}
                `}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    ...styles,
                }}
                tabIndex={-1}
            >
                <Suspense fallback={<ThumbnailBoxImage promise={placeholder} />}>
                    <ThumbnailBoxImage promise={cachePromise} />
                </Suspense>
            </div>
        </div>
    );
};

export const ThumbnailBox = memo((props: ThumbnailBoxProps) => {
    const { alt = props.url, url, cacheId, imageUrl, className, styles, size } = props;

    const cachedImageProps = useCachedImage({
        alt,
        src: imageUrl ?? url,
        placeholderSrc: url,
        fill: true,
        getImageId: cacheId ? () => cacheId : makeImageCacheId,
        addImageDataToCache,
    });

    if (!url || url.length === 0) {
        return <div className="flex justify-center p-1">
            <div
                className="rounded-md"
                style={{ width: `${size}px`, height: `${size}px`, ...styles }}
            >
                <FaTriangleExclamation
                    className="fill-gray-300"
                    style={{
                        width: `${size * 0.8}px`,
                        height: `${size * 0.8}px`,
                        margin: `${size * 0.1}px`
                    }} />
            </div>
        </div>;
    }

    const fallback = <div className="flex justify-center p-1">
        <div
            className="skeleton rounded-md"
            style={{ width: `${size}px`, height: `${size}px`, ...styles }}
        />
    </div>;

    return (
        <Suspense fallback={fallback}>
            <ThumbnailBoxInner src={imageUrl ?? url} className={className} {...cachedImageProps} size={size} styles={styles} />
        </Suspense>
    );
});
ThumbnailBox.displayName = 'ThumbnailBox';
