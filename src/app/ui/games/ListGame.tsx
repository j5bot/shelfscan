import { ThumbnailBox } from '@/app/ui/games/Thumbnail';
import Link from 'next/link';
import { CSSProperties, ReactNode } from 'react';

export type ListGameProps = {
    bottomLeftIcon?: ReactNode;
    cornerIcon?: ReactNode;
    detailUrl?: string;
    detailUrlTarget?: string;
    detailUrlRel?: string;
    imageContainerStyles?: CSSProperties;
    keyValue: string;
    name: string;
    thumbnailSize: number;
    statusIcon: ReactNode;
    statusText: string;
    thumbnailUrl: string;
    imageUrl?: string;
    /** When provided, clicking the thumbnail opens an action (e.g. a modal) instead of navigating. */
    onClick?: () => void;
};

export const ListGame = (props: ListGameProps) => {
    const {
        bottomLeftIcon,
        cornerIcon,
        detailUrl,
        detailUrlTarget,
        detailUrlRel,
        imageContainerStyles,
        keyValue,
        name,
        thumbnailSize,
        statusIcon,
        statusText,
        thumbnailUrl,
        imageUrl,
        onClick,
    } = props;

    const thumbnail = <ThumbnailBox
        alt={name}
        url={thumbnailUrl}
        imageUrl={imageUrl}
        size={thumbnailSize}
        styles={imageContainerStyles}
    />;

    const thumbnailContent = onClick ? (
        <button
            type="button"
            className="w-full text-left cursor-pointer"
            onClick={onClick}
            aria-label={`View details for ${name}`}
        >
            {thumbnail}
        </button>
    ) : detailUrl ? (
        <Link href={detailUrl} target={detailUrlTarget} rel={detailUrlRel}>
            {thumbnail}
        </Link>
    ) : thumbnail;

    return <li className="list-none relative rounded-md bg-white dark:bg-gray-900" key={keyValue}>
        {bottomLeftIcon}
        {detailUrl ? (
            <Link
                href={detailUrl}
                className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1"
                title={statusText}
                target={detailUrlTarget}
                rel={detailUrlRel}
            >
                {statusIcon}
            </Link>
        ) : (
            <span title={statusText}>{statusIcon}</span>
        )}
        <div className="flex flex-col pt-1 p-3 md:p-4 md:pt-2 w-full">
            <div className="flex justify-center items-center gap-1.5">
                {cornerIcon}
                <div
                    className="w-fit overflow-ellipsis overflow-hidden text-nowrap"
                    title={name}
                >
                    {name}
                </div>
            </div>
            {thumbnailContent}
        </div>
    </li>;
};
