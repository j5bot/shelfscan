'use client';

import { CollectionTabs, useActiveCollectionTab } from '@/app/lib/hooks/useActiveCollectionTab';
import { CollectionLoadStatuses, useCollectionData } from '@/app/lib/hooks/useCollectionData';
import { useCollectionFilters } from '@/app/lib/hooks/useCollectionFilters';
import { useCollectionRefresh } from '@/app/lib/hooks/useCollectionRefresh';
import { CollectionViews, useCollectionView } from '@/app/lib/hooks/useCollectionView';
import { useFilterSort, SortFieldDef } from '@/app/lib/hooks/useFilterSort';
import { useNotInCollection, NotInCollectionEntry } from '@/app/lib/hooks/useNotInCollection';
import { useStickyBar } from '@/app/lib/hooks/useStickyBar';
import { useTitle } from '@/app/lib/hooks/useTitle';
import { useSelector } from '@/app/lib/hooks';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { RootState } from '@/app/lib/redux/store';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { getImageSizeFromUrl } from '@/app/lib/utils/image';
import { CollectionControls } from '@/app/ui/games/CollectionControls';
import { ListGame } from '@/app/ui/games/ListGame';
import { ListGameRow } from '@/app/ui/games/ListGameRow';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import { CSSProperties, forwardRef, KeyboardEvent, ReactNode, useMemo } from 'react';
import {
    FaArrowsRotate,
    FaBarcode,
    FaBorderAll,
    FaCheck,
    FaEye,
    FaHeart,
    FaList,
    FaRecycle,
    FaTableCells,
} from 'react-icons/fa6';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';

type AllGamesSortField = 'name' | 'lastModified' | 'dateLastScanned' | 'yearPublished';
type NotInCollectionSortField = 'name' | 'lastScanned';

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


export default function CollectionPage() {
    useTitle('ShelfScan | Collection');

    const username = useSelector((state: RootState) => state.bgg.user?.user);
    const { scanHistory } = useScanHistory();

    const { activeTab, setActiveTab } = useActiveCollectionTab();
    const { state, setState } = useCollectionData(username);
    const { view, setView } = useCollectionView();
    const { filters, setFilter, resetFilters, hasActiveFilters, makeFilterFn } = useCollectionFilters();

    const { isRefreshing, refreshCollection, refreshError, clearRefreshError, announceText } =
        useCollectionRefresh({
            username,
            onSuccess: items => setState({ status: CollectionLoadStatuses.LOADED, items }),
        });

    const { sentinelRef, sectionRef, stickyTop } = useStickyBar(
        activeTab === CollectionTabs.ALL_GAMES && state.status === CollectionLoadStatuses.LOADED,
    );

    const lastScannedMap = useMemo(() => {
        const map = new Map<number, number>();
        for (const entry of scanHistory) {
            if (entry.bggId !== undefined) {
                const existing = map.get(entry.bggId) ?? 0;
                if (entry.timestamp > existing) {
                    map.set(entry.bggId, entry.timestamp);
                }
            }
        }
        return map;
    }, [scanHistory]);

    const scannedSet = useMemo(() => {
        const set = new Set<number>();
        for (const entry of scanHistory) {
            if (entry.bggId !== undefined) { set.add(entry.bggId); }
        }
        return set;
    }, [scanHistory]);

    const verifiedSet = useMemo(() => {
        const set = new Set<number>();
        for (const entry of scanHistory) {
            if (entry.bggId !== undefined && entry.verified) { set.add(entry.bggId); }
        }
        return set;
    }, [scanHistory]);

    const extraFilterFn = useMemo(
        () => makeFilterFn(scannedSet, verifiedSet),
        [makeFilterFn, scannedSet, verifiedSet],
    );

    const loadedItems = useMemo(
        () => (
            state.status === CollectionLoadStatuses.LOADED ? state.items : []
        ),
        [state],
    );

    const allGamesSortFields = useMemo<
        SortFieldDef<BggCollectionItem, AllGamesSortField>[]
    >(() => [
        {
            field: 'name',
            label: 'Name',
            compare: (a, b) => a.name?.localeCompare(b.name),
        },
        {
            field: 'lastModified',
            label: 'Modified',
            compare: (a, b) => {
                const aMod = a.lastModified
                             ? new Date(a.lastModified).valueOf()
                             : (
                                 a.acquisitiondate ? new Date(a.acquisitiondate).valueOf() : 0
                             );
                const bMod = b.lastModified
                             ? new Date(b.lastModified).valueOf()
                             : (
                                 b.acquisitiondate ? new Date(b.acquisitiondate).valueOf() : 0
                             );
                return aMod - bMod;
            },
        },
        {
            field: 'dateLastScanned',
            label: 'Scanned',
            compare: (a, b) =>
                (
                    lastScannedMap.get(a.objectId) ?? 0
                ) - (
                    lastScannedMap.get(b.objectId) ?? 0
                ),
        },
        {
            field: 'yearPublished',
            label: 'Year',
            compare: (a, b) => (
                                   a.yearPublished ?? 0
                               ) - (
                                   b.yearPublished ?? 0
                               ),
        },
    ], [lastScannedMap]);

    const allGamesFilter = useFilterSort<BggCollectionItem, AllGamesSortField>({
        items: loadedItems,
        filterFn: (item, query) => item.name.toLowerCase().includes(query),
        extraFilterFn,
        sortFields: allGamesSortFields,
        defaultSortField: 'name',
        storageKeyPrefix: 'collection-all',
    });

    // ── "Not in Collection" filter/sort ───────────────────────────────────────
    const collectionObjectIds = useMemo(
        () => (
                  state.status === CollectionLoadStatuses.LOADED || state.status === CollectionLoadStatuses.EMPTY
              )
              ? new Set(loadedItems?.map(item => item.objectId) ?? [])
              : undefined,
        [state.status, loadedItems],
    );

    const { notInCollectionItems, collectionHasData } = useNotInCollection(
        collectionObjectIds,
        scanHistory,
        state.status === CollectionLoadStatuses.LOADED || state.status === CollectionLoadStatuses.EMPTY,
    );

    const notInCollectionSortFields = useMemo<SortFieldDef<NotInCollectionEntry, NotInCollectionSortField>[]>(
        () => [
            {
                field: 'name',
                label: 'Name',
                compare: (a, b) =>
                    (
                        a.gameName ?? a.upc
                    ).localeCompare(b.gameName ?? b.upc),
            },
            {
                field: 'lastScanned',
                label: 'Last Scanned',
                compare: (a, b) => a.timestamp - b.timestamp,
            },
        ],
        [],
    );

    const notInCollectionFilter = useFilterSort<NotInCollectionEntry, NotInCollectionSortField>({
        items: notInCollectionItems,
        filterFn: (item, query) =>
            (
                item.gameName ?? item.upc
            ).toLowerCase().includes(query),
        sortFields: notInCollectionSortFields,
        defaultSortField: 'name',
        storageKeyPrefix: 'collection-not-in',
    });

    // ── Tab keyboard navigation ────────────────────────────────────────────────
    const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, tab: typeof activeTab) => {
        if (e.key === 'ArrowRight' && tab === CollectionTabs.ALL_GAMES) {
            setActiveTab(CollectionTabs.NOT_IN_COLLECTION);
        } else if (e.key === 'ArrowLeft' && tab === CollectionTabs.NOT_IN_COLLECTION) {
            setActiveTab(CollectionTabs.ALL_GAMES);
        }
    };

    // ── Render helpers ─────────────────────────────────────────────────────────
    const renderAllGamesContent = () => {
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
                            Your collection is empty. Start scanning games to see them here!
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
                const {
                    filterText,
                    setFilterText,
                    sortField,
                    sortDirection,
                    handleSortClick,
                    displayItems,
                } = allGamesFilter;

                const renderGridItem = (item: BggCollectionItem, thumbnailSize: number) => {
                    const thumbnailUrl = item.version?.image ?? item.image ?? item.thumbnail ?? '';
                    let statusText = '';
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
                        />
                    );
                };

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
                                            item={displayItems[index]}
                                            detailUrl={`https://boardgamegeek.com/boardgame/${displayItems[index].objectId}`}
                                            detailUrlTarget="_blank"
                                            detailUrlRel="noopener noreferrer"
                                            isScanned={scannedSet.has(displayItems[index].objectId)}
                                            isVerified={verifiedSet.has(displayItems[index].objectId)}
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
                                itemContent={index => renderGridItem(displayItems[index],
                                    ThumbnailSizes['large'])}
                            />;
                            break;
                        case CollectionViews.SMALL_GRID:
                            content = <VirtuosoGrid
                                useWindowScroll
                                totalCount={displayItems.length}
                                components={{ List: makeGridContainer('small') }}
                                itemContent={index => renderGridItem(displayItems[index],
                                    ThumbnailSizes['small'])}
                            />;
                            break;
                    }
                }

                return (
                    <>
                        <div ref={sentinelRef} aria-hidden="true" style={{ height: 0 }} />
                        <CollectionControls
                            sortFields={allGamesSortFields}
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSortClick={handleSortClick}
                            filterId={`${CollectionTabs.ALL_GAMES}-filter-input`}
                            filterValue={filterText}
                            onFilterChange={setFilterText}
                            filters={filters}
                            setFilter={setFilter}
                            hasActiveFilters={hasActiveFilters}
                            resetFilters={resetFilters}
                            stickyTop={stickyTop}
                        />
                        {content}
                    </>
                );
            }
        }
    };

    const renderNotInCollectionContent = () => {
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

        const {
            filterText, setFilterText, sortField, sortDirection, handleSortClick, displayItems,
        } = notInCollectionFilter;

        const renderNotInCollectionGridItem = (entry: NotInCollectionEntry, thumbnailSize: number) => {
            const displayName = entry.gameName ?? entry.upc;
            const thumbnailUrl = entry.thumbnailUrl ?? '';
            return (
                <ListGame
                    keyValue={entry.id.toString()}
                    name={displayName}
                    thumbnailUrl={thumbnailUrl}
                    thumbnailSize={thumbnailSize}
                    statusText="Not in collection"
                    cornerIcon={<FaBarcode className="shrink-0" title="Scanned" />}
                    statusIcon={null}
                    detailUrl={`/upc/${entry.upc}`}
                />
            );
        };

        let content: ReactNode = displayItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-base-content/60">
                    {notInCollectionItems.length === 0 && scanHistory.length === 0
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
                    content = <Virtuoso
                        useWindowScroll
                        totalCount={displayItems.length}
                        itemContent={index => {
                            const entry = displayItems[index];
                            return (
                                <div className="pt-1">
                                    <ListGameRow
                                        name={entry.gameName ?? entry.upc}
                                        thumbnailUrl={entry.thumbnailUrl ?? ''}
                                        detailUrl={`/upc/${entry.upc}`}
                                        isScanned={true}
                                    />
                                </div>
                            );
                        }}
                    />;
                    break;
                case CollectionViews.LARGE_GRID:
                    content = <VirtuosoGrid
                        useWindowScroll
                        totalCount={displayItems.length}
                        components={{ List: makeGridContainer('large') }}
                        itemContent={index => renderNotInCollectionGridItem(displayItems[index],
                            ThumbnailSizes['large'])}
                    />;
                    break;
                case CollectionViews.SMALL_GRID:
                    content = <VirtuosoGrid
                        useWindowScroll
                        totalCount={displayItems.length}
                        components={{ List: makeGridContainer('small') }}
                        itemContent={index => renderNotInCollectionGridItem(displayItems[index],
                            ThumbnailSizes['small'])}
                    />;
                    break;
            }
        }

        return (
            <>
                <CollectionControls
                    sortFields={notInCollectionSortFields}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortClick={handleSortClick}
                    filterId={`${CollectionTabs.NOT_IN_COLLECTION}-filter-input`}
                    filterValue={filterText}
                    onFilterChange={setFilterText}
                    filters={filters}
                    setFilter={setFilter}
                    hasActiveFilters={hasActiveFilters}
                    resetFilters={resetFilters}
                    stickyTop={0}
                />
                {content}
            </>
        );
    };

    const allGamesTabId = `tab-${CollectionTabs.ALL_GAMES}`;
    const allGamesPanelId = `panel-${CollectionTabs.ALL_GAMES}`;
    const notInCollectionTabId = `tab-${CollectionTabs.NOT_IN_COLLECTION}`;
    const notInCollectionPanelId = `panel-${CollectionTabs.NOT_IN_COLLECTION}`;

    return (
        <>
            <NavDrawer />
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {announceText}
            </div>
            {refreshError && (
                <div className="toast toast-top toast-center z-50">
                    <div role="alert" className="alert alert-error shadow-lg">
                        <span className="text-sm">{refreshError}</span>
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={clearRefreshError}
                            aria-label="Dismiss error"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
            <div className="page-content w-screen pt-15 flex justify-center">
                <div className="w-11/12 p-4 pb-10 rounded-xl bg-base-100 text-sm">
                    <div className="flex justify-center items-center gap-3 relative">
                        <h1 className="text-3xl text-center">Collection</h1>
                        {username && (
                            <button
                                className="btn btn-sm rounded-md"
                                onClick={() => refreshCollection()}
                                disabled={isRefreshing}
                                aria-label={isRefreshing ? 'Refreshing collection…' : 'Refresh collection from BGG'}
                                title={isRefreshing ? 'Refreshing…' : 'Refresh from BGG'}
                            >
                                <FaArrowsRotate
                                    className={isRefreshing ? 'animate-spin' : ''}
                                    aria-hidden="true"
                                />
                            </button>
                        )}

                        <div
                            className="absolute top-1 right-0 flex items-center gap-0.5"
                            role="group"
                            aria-label="View mode"
                        >
                            <button
                                type="button"
                                className={`btn btn-xs pl-1 pr-1 rounded-md ${view === CollectionViews.LIST ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setView(CollectionViews.LIST)}
                                aria-label="List view"
                                title="List view"
                                aria-pressed={view === CollectionViews.LIST}
                            >
                                <FaList aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                className={`btn btn-xs pl-1 pr-1 rounded-md ${view === CollectionViews.SMALL_GRID ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setView(CollectionViews.SMALL_GRID)}
                                aria-label="Small grid view"
                                title="Small grid view"
                                aria-pressed={view === CollectionViews.SMALL_GRID}
                            >
                                <FaTableCells aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                className={`btn btn-xs pl-1 pr-1 rounded-md ${view === CollectionViews.LARGE_GRID ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setView(CollectionViews.LARGE_GRID)}
                                aria-label="Large grid view"
                                title="Large grid view"
                                aria-pressed={view === CollectionViews.LARGE_GRID}
                            >
                                <FaBorderAll aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    <div
                        role="tablist"
                        aria-label="Collection views"
                        className="tabs tabs-border mt-4 mb-2"
                    >
                        <button
                            id={allGamesTabId}
                            role="tab"
                            aria-selected={activeTab === CollectionTabs.ALL_GAMES}
                            aria-controls={allGamesPanelId}
                            tabIndex={activeTab === CollectionTabs.ALL_GAMES ? 0 : -1}
                            className={`tab${activeTab === CollectionTabs.ALL_GAMES ? ' tab-active' : ''}`}
                            onClick={() => setActiveTab(CollectionTabs.ALL_GAMES)}
                            onKeyDown={e => handleTabKeyDown(e, CollectionTabs.ALL_GAMES)}
                        >
                            All Games
                        </button>
                        <button
                            id={notInCollectionTabId}
                            role="tab"
                            aria-selected={activeTab === CollectionTabs.NOT_IN_COLLECTION}
                            aria-controls={notInCollectionPanelId}
                            tabIndex={activeTab === CollectionTabs.NOT_IN_COLLECTION ? 0 : -1}
                            className={`tab${activeTab === CollectionTabs.NOT_IN_COLLECTION ? ' tab-active' : ''}`}
                            onClick={() => setActiveTab(CollectionTabs.NOT_IN_COLLECTION)}
                            onKeyDown={e => handleTabKeyDown(e, CollectionTabs.NOT_IN_COLLECTION)}
                        >
                            Not in Collection
                        </button>
                    </div>

                    <section
                        ref={sectionRef}
                        id={activeTab === CollectionTabs.ALL_GAMES ? allGamesPanelId : notInCollectionPanelId}
                        role="tabpanel"
                        aria-labelledby={activeTab === CollectionTabs.ALL_GAMES ? allGamesTabId : notInCollectionTabId}
                        className="w-full bg-[#f1eff9] dark:bg-yellow-700 rounded-md p-2 pt-0"
                    >
                        {activeTab === CollectionTabs.ALL_GAMES && renderAllGamesContent()}
                        {activeTab === CollectionTabs.NOT_IN_COLLECTION && renderNotInCollectionContent()}
                    </section>
                </div>
            </div>
        </>
    );
}
