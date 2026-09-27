import { useTradeMode } from '@/app/lib/hooks/useTradeMode';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { ComponentModeMap } from '@/app/lib/types/modes';
import { RatingForm } from '@/app/ui/extension/RatingForm';
import { MathTradeSection } from '@/app/ui/games/MathTradeSection';
import { TagsSection } from '@/app/ui/games/TagsSection';
import { SizeKey } from '@/app/ui/grids/gridSizes';
import { CollectionItemSwapSection, ScanSwapSection } from '@/app/ui/games/SwapSection';
import { ThumbnailBox } from '@/app/ui/games/Thumbnail';
import { RatingIcon } from '@/app/ui/icons/RatingIcon';
import Link from 'next/link';
import React, { CSSProperties, memo, ReactNode } from 'react';
import { FaCheck, FaArrowUpRightFromSquare } from 'react-icons/fa6';

export type ListGameProps = {
    code?: string;
    // constructed bgg coll. item from GameUPC results
    item?: Partial<BggCollectionItem>;
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

type CardSectionsProps = Pick<ListGameProps, 'code' | 'item' | 'collectionId'> & { modeMap: ComponentModeMap };

/** Optional per-card sections: batch rating, tags, and the math trade / swap editors for the current mode. */
const CardSections = (props: CardSectionsProps) => {
    const { code, item, collectionId, modeMap } = props;

    const { hasExport, isBatchTrade, isCollection, isMathTrade } = useTradeMode();

    return <>
        {!!collectionId && modeMap.batchRating && <RatingForm collectionId={collectionId} />}
        {!!collectionId && <TagsSection collectionId={collectionId} className="pt-2" />}
        {!!collectionId && isMathTrade && <MathTradeSection collectionId={collectionId} />}
        {!!collectionId && isCollection && hasExport && <CollectionItemSwapSection collectionId={collectionId} />}
        {code && item && isBatchTrade && hasExport && <ScanSwapSection upc={code} item={item} />}
    </>;
};

type CardThumbnailProps = Pick<ListGameProps,
    'name' | 'thumbnailUrl' | 'imageUrl' | 'thumbnailSize' | 'imageContainerStyles' |
    'rating' | 'averageRating' | 'onClick'
> & {
    size: SizeKey;
    mathTradeSelected: boolean;
};

const CardThumbnail = (props: CardThumbnailProps) => {
    const {
        name,
        thumbnailUrl,
        imageUrl,
        thumbnailSize,
        imageContainerStyles,
        rating,
        averageRating,
        size,
        mathTradeSelected,
        onClick,
    } = props;

    const resolvedRating = rating ?? averageRating ?? 0;

    return <div className="relative">
        <ThumbnailBox
            alt={name}
            url={thumbnailUrl}
            imageUrl={imageUrl}
            size={thumbnailSize}
            className={mathTradeSelected ? `p-2 border-4 border-brand-background` : ''}
            styles={imageContainerStyles}
        />
        {resolvedRating > 0 && <div className="absolute flex justify-center bottom-[-3] w-full z-9">
            <RatingIcon
                isAverage={!rating}
                rating={resolvedRating}
                height={size === 'small' ? 24 : 30}
            />
        </div>}
        {mathTradeSelected && (
            <div className={`w-14 h-14 absolute top-3 left-4 flex items-center justify-center
                bg-brand-background/90 rounded-full z-10 pointer-events-none`}>
                <FaCheck className="text-white w-10 h-10 drop-shadow" aria-hidden="true" />
            </div>
        )}
        {mathTradeSelected && onClick && (
            <button
                type="button"
                className="absolute top-2.5 right-4 z-20 pointer-events-auto
                    bg-gray-500 dark:bg-gray-800/80 rounded-full p-2 shadow
                    text-white cursor-pointer"
                onClick={e => { e.stopPropagation(); onClick(); }}
                aria-label={`Edit ${name}`}
            >
                <FaArrowUpRightFromSquare className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
        )}
    </div>;
};

type ThumbnailActionProps = Pick<ListGameProps,
    'name' | 'detailUrl' | 'detailUrlTarget' | 'detailUrlRel' | 'onClick' | 'onMathTradeToggle'
> & {
    mathTradeSelected: boolean;
    children: ReactNode;
};

/** In a trade mode the thumbnail toggles selection; otherwise it opens details (action or link). */
const ThumbnailAction = (props: ThumbnailActionProps) => {
    const {
        name,
        detailUrl,
        detailUrlTarget,
        detailUrlRel,
        onClick,
        onMathTradeToggle,
        mathTradeSelected,
        children,
    } = props;

    const { hasTrade } = useTradeMode();
    const togglesSelection = hasTrade && !!onMathTradeToggle;
    const clickHandler = togglesSelection ? onMathTradeToggle : onClick;

    if (clickHandler) {
        return <button
            type="button"
            className="w-full text-left cursor-pointer"
            onClick={clickHandler}
            aria-label={togglesSelection
                ? `${mathTradeSelected ? 'Deselect' : 'Select'} ${name} for math trade`
                : `View details for ${name}`}
            aria-pressed={togglesSelection ? mathTradeSelected : undefined}
        >
            {children}
        </button>;
    }
    if (detailUrl) {
        return <Link href={detailUrl} target={detailUrlTarget} rel={detailUrlRel}>
            {children}
        </Link>;
    }
    return children;
};

export const ListGame = memo((props: ListGameProps) => {
    const {
        code,
        item,
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
            <ThumbnailAction
                name={name}
                detailUrl={detailUrl}
                detailUrlTarget={detailUrlTarget}
                detailUrlRel={detailUrlRel}
                onClick={onClick}
                onMathTradeToggle={onMathTradeToggle}
                mathTradeSelected={mathTradeSelected}
            >
                <CardThumbnail
                    name={name}
                    thumbnailUrl={thumbnailUrl}
                    imageUrl={imageUrl}
                    thumbnailSize={thumbnailSize}
                    imageContainerStyles={imageContainerStyles}
                    rating={rating}
                    averageRating={averageRating}
                    size={size}
                    mathTradeSelected={mathTradeSelected}
                    onClick={onClick}
                />
            </ThumbnailAction>
            <CardSections code={code} item={item} collectionId={collectionId} modeMap={modeMap} />
        </div>
    </li>;
});
ListGame.displayName = 'ListGame';
