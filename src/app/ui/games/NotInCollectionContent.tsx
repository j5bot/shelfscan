import { type CollectionFilters } from '@/app/lib/hooks/useCollectionFilters';
import { CollectionViews, type CollectionView } from '@/app/lib/hooks/useCollectionView';
import { type SortDirection, type SortFieldDef } from '@/app/lib/hooks/useFilterSort';
import { type NotInCollectionEntry } from '@/app/lib/hooks/useNotInCollection';
import { CollectionControls } from '@/app/ui/games/CollectionControls';
import { ListGame } from '@/app/ui/games/ListGame';
import { ListGameRow } from '@/app/ui/games/ListGameRow';
import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import { FaArrowsRotate, FaBarcode, FaCheck, FaCloudArrowUp } from 'react-icons/fa6';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';

type NotInCollectionSortField = 'name' | 'lastScanned';

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
            <div ref={ref} className={`${gridClass} ${className}`} style={style}>
                {children}
            </div>
        ),
    );
    Result.displayName = 'GridContainer';
    return Result;
};

type NotInCollectionContentProps = {
    collectionHasData: boolean;
    username: string | undefined;
    isRefreshing: boolean;
    refreshCollection: () => void;
    view: CollectionView;
    notInCollectionItems: NotInCollectionEntry[];
    scanHistoryLength: number;
    sortFields: SortFieldDef<NotInCollectionEntry, NotInCollectionSortField>[];
    sortField: NotInCollectionSortField;
    sortDirection: SortDirection;
    onSortClick: (field: NotInCollectionSortField) => void;
    filterText: string;
    onFilterChange: (text: string) => void;
    displayItems: NotInCollectionEntry[];
    filters: CollectionFilters;
    setFilter: <K extends keyof CollectionFilters>(key: K, value: CollectionFilters[K]) => void;
    hasActiveFilters: boolean;
    resetFilters: () => void;
    // Selection mode
    canSelect: boolean;
    selectionMode: boolean;
    selectedIds: Set<number>;
    onToggleSelectionMode: () => void;
    onToggleSelection: (entry: NotInCollectionEntry) => void;
    onRequestAddSelected: () => void;
    isAdding: boolean;
};

export const NotInCollectionContent = ({
    collectionHasData,
    username,
    isRefreshing,
    refreshCollection,
    view,
    notInCollectionItems,
    scanHistoryLength,
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
    canSelect,
    selectionMode,
    selectedIds,
    onToggleSelectionMode,
    onToggleSelection,
    onRequestAddSelected,
    isAdding,
}: NotInCollectionContentProps) => {
    if (!collectionHasData) {
        return (
            <div className="flex flex-col items-center gap-4 p-8 pt-10 text-center">
                <p className="text-lg">
                    Refresh your BGG collection to see which scanned games are missing from it.
                </p>
                {username && (
                    <button
                        className="btn btn-primary gap-2"
                        onClick={() => refreshCollection()}
                        disabled={isRefreshing}
                    >
                        <FaArrowsRotate
                            className={isRefreshing ? 'animate-spin' : ''}
                            aria-hidden="true"
                        />
                        Refresh Collection
                    </button>
                )}
            </div>
        );
    }

    const renderGridItem = (entry: NotInCollectionEntry, thumbnailSize: number) => {
        const isSelected = selectedIds.has(entry.id);
        const canSelectEntry = entry.bggId !== undefined;
        return (
            <div
                className={`relative${selectionMode && canSelectEntry ? ' cursor-pointer' : ''}${selectionMode && !canSelectEntry ? ' opacity-40' : ''}`}
                onClick={selectionMode && canSelectEntry ? () => onToggleSelection(entry) : undefined}
            >
                <ListGame
                    keyValue={entry.id.toString()}
                    name={entry.gameName ?? entry.upc}
                    thumbnailUrl={entry.thumbnailUrl ?? ''}
                    thumbnailSize={thumbnailSize}
                    statusText="Not in collection"
                    cornerIcon={<FaBarcode className="shrink-0" title="Scanned" />}
                    statusIcon={null}
                    detailUrl={selectionMode ? undefined : `/upc/${entry.upc}`}
                />
                {selectionMode && isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-primary/20 rounded-md pointer-events-none">
                        <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow">
                            <FaCheck className="text-primary text-2xl" aria-hidden="true" />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    let content: ReactNode = displayItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-base-content/60">
                {notInCollectionItems.length === 0 && scanHistoryLength === 0
                 ? 'Scan some games to see which ones aren\'t in your collection yet.'
                 : notInCollectionItems.length === 0
                   ? 'All scanned games are already in your collection. 🎉'
                   : 'No games match your filter.'
                }
            </p>
        </div>
    ) : undefined;

    if (displayItems.length > 0) {
        switch (view) {
            case CollectionViews.LIST:
                content = (
                    <Virtuoso
                        useWindowScroll
                        totalCount={displayItems.length}
                        itemContent={index => {
                            const entry = displayItems[index];
                            const isSelected = selectedIds.has(entry.id);
                            const canSelectEntry = entry.bggId !== undefined;
                            return (
                                <div className={`pt-1${selectionMode && !canSelectEntry ? ' opacity-40' : ''}`}>
                                    <ListGameRow
                                        name={entry.gameName ?? entry.upc}
                                        thumbnailUrl={entry.thumbnailUrl ?? ''}
                                        detailUrl={`/upc/${entry.upc}`}
                                        isScanned={true}
                                        onClick={selectionMode && canSelectEntry ? () => onToggleSelection(entry) : undefined}
                                        extraBadges={selectionMode && isSelected
                                            ? <FaCheck size={13} className="text-primary" aria-label="Selected" />
                                            : undefined
                                        }
                                    />
                                </div>
                            );
                        }}
                    />
                );
                break;
            case CollectionViews.LARGE_GRID:
                content = (
                    <VirtuosoGrid
                        useWindowScroll
                        totalCount={displayItems.length}
                        components={{ List: makeGridContainer('large') }}
                        itemContent={index => renderGridItem(displayItems[index], ThumbnailSizes['large'])}
                    />
                );
                break;
            case CollectionViews.SMALL_GRID:
                content = (
                    <VirtuosoGrid
                        useWindowScroll
                        totalCount={displayItems.length}
                        components={{ List: makeGridContainer('small') }}
                        itemContent={index => renderGridItem(displayItems[index], ThumbnailSizes['small'])}
                    />
                );
                break;
        }
    }

    return (
        <>
            {canSelect && (
                <div className="flex items-center justify-between gap-2 pt-2 pb-1">
                    <button
                        type="button"
                        className={`btn btn-sm rounded-md ${selectionMode ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={onToggleSelectionMode}
                        aria-pressed={selectionMode}
                    >
                        {selectionMode ? 'Cancel' : 'Select Items'}
                    </button>
                    {selectionMode && (
                        <span className="text-xs text-base-content/60">
                            {selectedIds.size > 0
                                ? `${selectedIds.size} selected`
                                : 'Tap items to select'
                            }
                        </span>
                    )}
                </div>
            )}
            <CollectionControls
                sortFields={sortFields}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortClick={onSortClick}
                filterId="not-in-collection-filter-input"
                filterValue={filterText}
                onFilterChange={onFilterChange}
                filters={filters}
                setFilter={setFilter}
                hasActiveFilters={hasActiveFilters}
                resetFilters={resetFilters}
                stickyTop={0}
            />
            {content}
            {selectionMode && selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none">
                    <button
                        type="button"
                        className={`btn rounded-full shadow-lg pointer-events-auto
                            bg-[#e07ca4] text-white
                            flex items-center justify-center gap-2
                            uppercase text-base font-sharetech
                            pl-6 pr-6 pt-2 pb-2
                            ${isAdding ? 'opacity-75 cursor-not-allowed' : 'hover:bg-[#d06b93] cursor-pointer'}`}
                        onClick={onRequestAddSelected}
                        disabled={isAdding}
                        aria-label={`Add ${selectedIds.size} game${selectedIds.size !== 1 ? 's' : ''} to collection`}
                    >
                        {isAdding
                            ? <span className="loading loading-bars loading-sm" />
                            : <FaCloudArrowUp className="w-4 h-4" />
                        }
                        Add {selectedIds.size} Game{selectedIds.size !== 1 ? 's' : ''} to Collection
                    </button>
                </div>
            )}
        </>
    );
};

