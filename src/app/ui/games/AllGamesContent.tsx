import { useSelector } from '@/app/lib/hooks';
import { CollectionLoadStatuses, type CollectionLoadStatusData } from '@/app/lib/hooks/useCollectionData';
import { type CollectionFilters, type FilterPreset } from '@/app/lib/hooks/useCollectionFilters';
import { type SortFieldDef, type SortDirection } from '@/app/lib/hooks/useFilterSort';
import { CollectionViews, type CollectionView } from '@/app/lib/hooks/useCollectionView';
import { RootState } from '@/app/lib/redux/store';
import { type BggCollectionItem } from '@/app/lib/types/bgg';
import { CollectionControls } from '@/app/ui/games/CollectionControls';
import { ListGame } from '@/app/ui/games/ListGame';
import { ListGameRow } from '@/app/ui/games/ListGameRow';
import Link from 'next/link';
import React, {
    forwardRef,
    memo,
    type CSSProperties,
    type ReactNode,
    type RefObject,
} from 'react';
import {
    FaBarcode,
    FaCheck,
    FaEye,
    FaHeart,
    FaRecycle,
} from 'react-icons/fa6';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';

export type AllGamesSortField = 'name' | 'lastModified' | 'dateLastScanned' | 'yearPublished' | 'rating' | 'averageRating' | 'plays';

const THUMBNAIL_SIZE = 100;

const GridClasses = {
    small: `grid gap-2 grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10`,
    large: `grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6`,
} as const;
type GridClassSize = keyof typeof GridClasses;

const ThumbnailSizes = {
    small: 100,
    large: 200,
} as const;

type GridContainerProps = {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
};

const makeGridContainer = (size: GridClassSize) => {
    const gridClass = GridClasses[size];

    const Result = forwardRef<HTMLDivElement, GridContainerProps>(
        ({ children, style, className }, ref) => (
            <div
                ref={ref}
                className={`${gridClass} ${className}`}
                style={style}
            >
                {children}
            </div>
        ),
    );
    Result.displayName = 'GridContainer';
    return Result;
};

const SkeletonItem = () => (
    <div className="relative rounded-md bg-white dark:bg-gray-900" aria-hidden="true">
        <div className="flex flex-col pt-1 p-3 md:p-4 md:pt-2 gap-2 animate-pulse">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />
            <div
                className="bg-gray-200 dark:bg-gray-700 rounded-md mx-auto"
                style={{ width: `${THUMBNAIL_SIZE}px`, height: `${THUMBNAIL_SIZE}px` }}
            />
        </div>
    </div>
);

type ModeMap = {
    batchRating: boolean;
};

export type SizeKey = keyof typeof ThumbnailSizes;

type GridItemProps = {
    collectionId: number;
    sizeKey: SizeKey;
    thumbnailSize: number;
    modeMap: ModeMap;
    onSelectItem: (item: BggCollectionItem) => void;
};

const GridItem = ({ collectionId, sizeKey, thumbnailSize, modeMap, onSelectItem }: GridItemProps) => {
    const item = useSelector((state: RootState) => {
        const username = state.bgg.user.user?.toLowerCase() ?? '';
        return state.bgg.collection.users[username].items[collectionId]
    });

    if (!item) {
        return null;
    }

    const thumbnailUrl = item.version?.image ?? item.image ?? item.thumbnail ?? '';
    let statusText: string;
    let cornerIcon: ReactNode;
    switch (true) {
        case item.statuses.fortrade:
            statusText = 'For Trade';
            cornerIcon = <FaRecycle title={statusText} className="shrink-0" />;
            break;
        case item.statuses.own:
            statusText = 'Owned';
            cornerIcon = <FaCheck title={statusText} className="shrink-0" />;
            break;
        case item.statuses.wishlist:
            statusText = 'Wishlist';
            cornerIcon = <FaHeart title={statusText} className="shrink-0" />;
            break;
        default:
            statusText = '';
            cornerIcon = <FaEye size={15} className="shrink-0" />;
            break;
    }
    return (
        <ListGame
            size={sizeKey}
            collectionId={item.collectionId!}
            rating={item.rating}
            averageRating={item.averageRating}
            modeMap={modeMap}
            keyValue={item.collectionId.toString()}
            name={item.name}
            thumbnailUrl={thumbnailUrl}
            thumbnailSize={thumbnailSize}
            statusText={statusText}
            cornerIcon={cornerIcon}
            statusIcon={null}
            detailUrl={`https://boardgamegeek.com/boardgame/${item.objectId}`}
            detailUrlTarget="_blank"
            detailUrlRel="noopener noreferrer"
            onClick={() => onSelectItem(item)}
        />
    );
};

type AllGamesContentProps = {
    state: CollectionLoadStatusData;
    sentinelRef: RefObject<HTMLDivElement | null>;
    stickyTop: number;
    view: CollectionView;
    modeMap: ModeMap;
    scannedSet: Set<number>;
    verifiedSet: Set<number>;
    sortFields: SortFieldDef<BggCollectionItem, AllGamesSortField>[];
    sortField: AllGamesSortField;
    sortDirection: SortDirection;
    onSortClick: (field: AllGamesSortField) => void;
    filterText: string;
    onFilterChange: (text: string) => void;
    displayItems: BggCollectionItem[];
    filters: CollectionFilters;
    setFilter: <K extends keyof CollectionFilters>(key: K, value: CollectionFilters[K]) => void;
    hasActiveFilters: boolean;
    resetFilters: () => void;
    savedFilters: FilterPreset[];
    onSaveFilters: () => void;
    onLoadFilter: (preset: FilterPreset) => void;
    onRenameFilter: (id: number) => void;
    onDeleteFilter: (id: number) => void;
    onDuplicateFilter: (id: number) => void;
    refreshCollection: () => void;
    onSelectItem: (item: BggCollectionItem) => void;
};

export const AllGamesContent = memo(({
    state,
    sentinelRef,
    stickyTop,
    view,
    modeMap,
    scannedSet,
    verifiedSet,
    sortFields,
    sortField,
    sortDirection,
    onSortClick,
    filterText,
    onFilterChange,
    displayItems,
    filters,
    setFilter,
    hasActiveFilters,
    resetFilters,
    savedFilters,
    onSaveFilters,
    onLoadFilter,
    onRenameFilter,
    onDeleteFilter,
    onDuplicateFilter,
    refreshCollection,
    onSelectItem,
}: AllGamesContentProps) => {
    const username = useSelector((state: RootState) => state.bgg.user.user);

    switch (state.status) {
        case CollectionLoadStatuses.LOADING:
            return (
                <div
                    className={`${GridClasses['small']} pt-2`}
                    aria-label="Loading collection"
                    aria-busy="true"
                >
                    {Array.from({ length: 36 }).map((_, i) => (
                        <SkeletonItem key={i} />
                    ))}
                </div>
            );

        case CollectionLoadStatuses.ERROR:
            return (
                <div
                    className="flex flex-col items-center gap-4 p-8 pt-10 text-center"
                    role="alert"
                >
                    <p className="text-lg">Error loading collection. Please try refreshing.</p>
                    <button className="btn btn-primary" onClick={() => refreshCollection()}>
                        Retry
                    </button>
                </div>
            );

        case CollectionLoadStatuses.EMPTY:
            return (
                <div className="flex flex-col items-center gap-4 p-8 pt-10 text-center">
                    <p className="text-lg">
                        {username ?
                         `Your collection is empty. Start scanning games to see them here!`
                             : `We can't display your collection without your BGG username ... please fill out the form above!`
                        }
                    </p>
                    <Link
                        href="/"
                        title="Go to scanner"
                        className={`scan-button cursor-pointer rounded-2xl
                            flex justify-start items-center
                            bg-gray-400 text-white
                            p-6 pt-2 pb-2
                            text-4xl`}
                    >
                        <FaBarcode className="w-12 h-9" />
                        <div className="p-1.5 font-semibold uppercase">Scan</div>
                    </Link>
                </div>
            );

        case CollectionLoadStatuses.LOADED: {
            let content: ReactNode = displayItems.length === 0 ? (
                <p className="text-center py-8 text-base-content/60">
                    No games match your filter.
                </p>
            ) : undefined;

            if (displayItems.length > 0) {
                switch (view) {
                    case CollectionViews.LIST:
                        content = <Virtuoso
                            useWindowScroll
                            totalCount={displayItems.length}
                            itemContent={index => (
                                <div className="pt-1">
                                    <ListGameRow
                                        collectionId={displayItems[index].collectionId}
                                        detailUrl={`https://boardgamegeek.com/boardgame/${displayItems[index].objectId}`}
                                        detailUrlTarget="_blank"
                                        detailUrlRel="noopener noreferrer"
                                        isScanned={scannedSet.has(displayItems[index].objectId)}
                                        isVerified={verifiedSet.has(displayItems[index].objectId)}
                                        onClick={() => onSelectItem(displayItems[index])}
                                    />
                                </div>
                            )}
                        />;
                        break;
                    case CollectionViews.LARGE_GRID:
                        content = <VirtuosoGrid
                            useWindowScroll
                            totalCount={displayItems.length}
                            components={{ List: makeGridContainer('large') }}
                            itemContent={index => <GridItem
                                sizeKey="large"
                                collectionId={displayItems[index].collectionId} thumbnailSize={ThumbnailSizes['large']}
                                onSelectItem={onSelectItem} modeMap={modeMap}
                            />}
                        />;
                        break;
                    case CollectionViews.SMALL_GRID:
                        content = <VirtuosoGrid
                            useWindowScroll
                            totalCount={displayItems.length}
                            components={{ List: makeGridContainer('small') }}
                            itemContent={index => <GridItem
                                sizeKey="small"
                                collectionId={displayItems[index].collectionId} thumbnailSize={ThumbnailSizes['small']}
                                onSelectItem={onSelectItem} modeMap={modeMap}
                            />}                        />;
                        break;
                }
            }

            return (
                <>
                    <div ref={sentinelRef} aria-hidden="true" style={{ height: 0 }} />
                    <CollectionControls
                        sortFields={sortFields}
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSortClick={onSortClick}
                        filterId="all-games-filter-input"
                        filterValue={filterText}
                        onFilterChange={onFilterChange}
                        filters={filters}
                        setFilter={setFilter}
                        hasActiveFilters={hasActiveFilters}
                        resetFilters={resetFilters}
                        savedFilters={savedFilters}
                        onSaveFilters={onSaveFilters}
                        onLoadFilter={onLoadFilter}
                        onRenameFilter={onRenameFilter}
                        onDeleteFilter={onDeleteFilter}
                        onDuplicateFilter={onDuplicateFilter}
                        stickyTop={stickyTop}
                    />
                    {content}
                </>
            );
        }
    }
}, (prevProps, nextProps) => {
    return Object.keys(nextProps).reduce((equal, key) => {
        if (!equal) {
            return equal;
        }
        const resolvedKey = key as keyof AllGamesContentProps;
        switch (resolvedKey) {
            case 'displayItems':
                equal = equal && prevProps.displayItems === nextProps.displayItems || (
                    nextProps.displayItems
                        .every((item, index) =>
                            item.collectionId === prevProps.displayItems[index]?.collectionId)
                );
                break;
            default:
                equal = equal &&
                        Object.is(prevProps[resolvedKey], nextProps[resolvedKey]);
                break;
        }
        return equal;
    }, true);
});

AllGamesContent.displayName = 'AllGamesContent';
