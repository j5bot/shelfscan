import { ComponentModeMap } from '@/app/lib/types/modes';
import { RatingForm } from '@/app/ui/extension/RatingForm';
import { SizeKey } from '@/app/ui/games/AllGamesContent';
import { ThumbnailBox } from '@/app/ui/games/Thumbnail';
import { RatingIcon } from '@/app/ui/icons/RatingIcon';
import Link from 'next/link';
import React, { CSSProperties, memo, ReactNode } from 'react';

export type ListGameProps = {
    collectionId?: number;
    rating?: number;
    averageRating?: number;
    bottomLeftIcon?: ReactNode;
    cornerIcon?: ReactNode;
    detailUrl?: string;
    detailUrlTarget?: string;
    detailUrlRel?: string;
    imageContainerStyles?: CSSProperties;
    keyValue: string;
    name: string;
    size?: SizeKey;
    thumbnailSize: number;
    statusIcon: ReactNode;
    statusText: string;
    thumbnailUrl: string;
    imageUrl?: string;
    /** When provided, clicking the thumbnail opens an action (e.g. a modal) instead of navigating. */
    onClick?: () => void;
    modeMap?: ComponentModeMap;
};

const emptyModeMap = {} as ComponentModeMap;

export const ListGame = memo((props: ListGameProps) => {
    const {
        collectionId,
        rating,
        averageRating,
        bottomLeftIcon,
        cornerIcon,
        detailUrl,
        detailUrlTarget,
        detailUrlRel,
        imageContainerStyles,
        keyValue,
        name,
        size = 'small',
        thumbnailSize,
        statusIcon,
        statusText,
        thumbnailUrl,
        imageUrl,
        onClick,
        modeMap = emptyModeMap,
    } = props;

    const resolvedRating = rating ?? averageRating ?? 0;
    const isAverage = !rating;

    const ratingIcon = resolvedRating > 0 ? <RatingIcon
        isAverage={isAverage}
        rating={resolvedRating}
        height={size === 'small' ? 24 : 30}
    /> : null;

    const ratingForm = collectionId && modeMap.batchRating ? <RatingForm
        collectionId={collectionId}
    /> : null;

    const thumbnail = <div className="relative">
        <ThumbnailBox
            alt={name}
            url={thumbnailUrl}
            imageUrl={imageUrl}
            size={thumbnailSize}
            styles={imageContainerStyles}
        />
        {ratingIcon && <div className="absolute flex justify-center bottom-[-3] w-full z-9">{ratingIcon}</div>}
    </div>;

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
                    className="w-fit h-5.5 overflow-ellipsis overflow-hidden text-nowrap"
                    title={name}
                >
                    {name}
                </div>
            </div>
            {thumbnailContent}
            {ratingForm}
        </div>
    </li>;
});
ListGame.displayName = 'ListGame';
