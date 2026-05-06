import { addImageDataToCache, makeImageCacheId } from '@/app/lib/database/cacheDatabase';
import { useCachedImage, type ResolvedImageProps } from '@/app/lib/hooks/useCachedImage';
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
    placeholderPromise: Promise<ResolvedImageProps | undefined>;
    cachePromise: Promise<ResolvedImageProps | undefined>;
    className?: string;
};

const ThumbnailInner = ({ placeholderPromise, cachePromise, className }: ThumbnailInnerProps) => {
    const placeholder = use(placeholderPromise);
    const cache = use(cachePromise);

    const isPlaceholder = placeholder?.type === 'placeholder' || cache?.type === 'placeholder';

    if (!(placeholder || cache)) {
        return null;
    }

    const { type: _type, alt, ...imageProps } = cache ?? placeholder ?? {};

    return <img alt={alt}
        className={`object-contain transition-[filter] duration-200 ${isPlaceholder ? 'blur-xs' : ''} ${className ?? ''}`}
        {...imageProps}
    />;
};

export const Thumbnail = (props: ThumbnailBoxProps) => {
    const { alt = props.url, className, url, imageUrl, size } = props;
    const cachedImageProps = useCachedImage({
        alt,
        src: imageUrl ?? url,
        placeholderSrc: imageUrl ? url : undefined,
        getImageId: makeImageCacheId,
        addImageDataToCache,
        width: size,
        height: size,
    });
    return (
        <Suspense fallback={null}>
            <ThumbnailInner {...cachedImageProps} className={className} />
        </Suspense>
    );
};

type ThumbnailBoxInnerProps = {
    placeholderPromise: Promise<ResolvedImageProps | undefined>;
    cachePromise: Promise<ResolvedImageProps | undefined>;
    size: number;
    styles?: CSSProperties;
};

const ThumbnailBoxInner = ({ placeholderPromise, cachePromise, size, styles }: ThumbnailBoxInnerProps) => {
    const placeholder = use(placeholderPromise);
    const cache = use(cachePromise);

    const isPlaceholder = placeholder?.type === 'placeholder' || cache?.type === 'placeholder';

    const scalePercent = size < 200 ? 'scale-250' : size < 300 ? 'scale-150' : 'scale-100';

    if (!(placeholder || cache)) {
        return null;
    }

    const { type: _type, alt, ...imageProps } = cache ?? placeholder ?? {};

    return (
        <div className="flex justify-center p-1 relative">
            <div className={`
                    relative
                    bg-[#f1eff9]
                    flex justify-center items-center
                    rounded-md overflow-clip
                    focus:overflow-visible focus:${scalePercent}
                    hover:overflow-visible hover:${scalePercent}
                    focus:z-40 hover:z-40
                `}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    ...styles,
                }}
                tabIndex={0}
            >
                <img alt={alt}
                    className={`object-contain transition-[filter] duration-200 rounded-xs ${isPlaceholder ? 'blur-xs' : ''}`}
                    {...imageProps}
                />
            </div>
        </div>
    );
};

export const ThumbnailBox = (props: ThumbnailBoxProps) => {
    const { alt = props.url, url, imageUrl, styles, size } = props;

    // Hook must be called before any conditional return (Rules of Hooks).
    // The hook gracefully handles an empty src by resolving with undefined.
    const cachedImageProps = useCachedImage({
        alt,
        src: imageUrl ?? url,
        placeholderSrc: imageUrl ? url : undefined,
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

    if (!url) {
        return fallback;
    }

    return (
        <Suspense fallback={fallback}>
            <ThumbnailBoxInner {...cachedImageProps} size={size} styles={styles} />
        </Suspense>
    );
};
