import { ComponentModeMap } from '@/app/lib/types/modes';
import { RatingForm } from '@/app/ui/extension/RatingForm';
import { MathTradeSection } from '@/app/ui/games/MathTradeSection';
import { SizeKey } from '@/app/ui/games/AllGamesContent';
import { SwapSection } from '@/app/ui/games/SwapSection';
import { ThumbnailBox } from '@/app/ui/games/Thumbnail';
import { RatingIcon } from '@/app/ui/icons/RatingIcon';
import Link from 'next/link';
import React, { CSSProperties, memo, ReactNode } from 'react';
import { FaCheck, FaArrowUpRightFromSquare } from 'react-icons/fa6';

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
    mathTradeSelected?: boolean;
    onMathTradeToggle?: () => void;
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
        mathTradeSelected = false,
        onMathTradeToggle,
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

    const mathTradeSection = collectionId && modeMap.mathTrade ? <MathTradeSection
        collectionId={collectionId}
    /> : null;

    const swapSection = collectionId && modeMap.swap ? <SwapSection
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
        {mathTradeSelected && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#e07ca4]/50 rounded-md z-10 pointer-events-none">
                <FaCheck className="text-white w-6 h-6 drop-shadow" aria-hidden="true" />
            </div>
        )}
        {mathTradeSelected && onClick && (
            <div
                className="absolute top-1 right-1 z-20 pointer-events-auto
                    bg-white/80 dark:bg-gray-800/80 rounded-full p-1 shadow
                    text-base-content/60 hover:text-base-content"
                onClick={e => { e.stopPropagation(); onClick(); }}
                aria-label={`Edit ${name}`}
            >
                <FaArrowUpRightFromSquare className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
        )}
    </div>;

    const thumbnailClickHandler = (modeMap.mathTrade || modeMap.swap) && onMathTradeToggle
        ? onMathTradeToggle
        : onClick;

    const thumbnailAriaLabel = (modeMap.mathTrade || modeMap.swap) && onMathTradeToggle
        ? `${mathTradeSelected ? 'Deselect' : 'Select'} ${name} for math trade`
        : `View details for ${name}`;

    const thumbnailContent = thumbnailClickHandler ? (
        <button
            type="button"
            className="w-full text-left cursor-pointer"
            onClick={thumbnailClickHandler}
            aria-label={thumbnailAriaLabel}
            aria-pressed={(modeMap.mathTrade || modeMap.swap) &&
                          onMathTradeToggle ? mathTradeSelected : undefined}
        >
            {thumbnail}
        </button>
    ) : detailUrl ? (
        <Link href={detailUrl} target={detailUrlTarget} rel={detailUrlRel}>
            {thumbnail}
        </Link>
    ) : thumbnail;

    return <li
        className={`list-none relative rounded-md bg-white dark:bg-gray-900
            ${mathTradeSelected ? 'mt-0.5 outline-2 outline-[#e07ca4]' : ''}`}
        key={keyValue}
    >
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
                    className="w-fit h-5.5 text-ellipsis overflow-hidden text-nowrap"
                    title={name}
                >
                    {name}
                </div>
            </div>
            {thumbnailContent}
            {ratingForm}
            {mathTradeSection}
            {swapSection}
        </div>
    </li>;
});
ListGame.displayName = 'ListGame';
