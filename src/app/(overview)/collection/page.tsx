'use client';

import { CollectionTabs, useActiveCollectionTab } from '@/app/lib/hooks/useActiveCollectionTab';
import { CollectionLoadStatuses, useCollectionData } from '@/app/lib/hooks/useCollectionData';
import { useCollectionRefresh } from '@/app/lib/hooks/useCollectionRefresh';
import { useFilterSort, SortFieldDef } from '@/app/lib/hooks/useFilterSort';
import { useNotInCollection, NotInCollectionEntry } from '@/app/lib/hooks/useNotInCollection';
import { useStickyBar } from '@/app/lib/hooks/useStickyBar';
import { useTitle } from '@/app/lib/hooks/useTitle';
import { useSelector } from '@/app/lib/hooks';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { RootState } from '@/app/lib/redux/store';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { getImageSizeFromUrl } from '@/app/lib/utils/image';
import { ListGame } from '@/app/ui/games/ListGame';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';
import { CSSProperties, forwardRef, KeyboardEvent, ReactNode, useMemo } from 'react';
import {
    FaArrowDown,
    FaArrowUp,
    FaArrowsRotate,
    FaBarcode,
    FaCheck,
    FaEye,
    FaHeart,
    FaRecycle
} from 'react-icons/fa6';
import { VirtuosoGrid } from 'react-virtuoso';

// ─── Types ────────────────────────────────────────────────────────────────────

type AllGamesSortField = 'name' | 'lastModified' | 'dateLastScanned' | 'yearPublished';
type NotInCollectionSortField = 'name' | 'lastScanned';

// ─── Constants ────────────────────────────────────────────────────────────────

const THUMBNAIL_SIZE = 100;

const GRID_CLASS = `grid gap-2 grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7
    xl:grid-cols-8 2xl:grid-cols-10`;

const STICKY_CLASS = `sticky z-10 bg-[#f1eff9] dark:bg-yellow-700 pt-2 pb-2 flex flex-col gap-2`;

// ─── Sub-components ───────────────────────────────────────────────────────────

type GridContainerProps = {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
};

const GridContainer = forwardRef<HTMLDivElement, GridContainerProps>(
    ({ children, style, className }, ref) => (
        <div
            ref={ref}
            className={`${GRID_CLASS}${className ? ` ${className}` : ''}`}
            style={style}
        >
            {children}
        </div>
    ),
);
GridContainer.displayName = 'GridContainer';

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

// ─── Sort controls shared UI ──────────────────────────────────────────────────

type SortControlsProps<F extends string> = {
    sortFields: { field: F; label: string }[];
    sortField: F;
    sortDirection: 'asc' | 'desc';
    onSortClick: (field: F) => void;
    filterId: string;
    filterValue: string;
    onFilterChange: (value: string) => void;
    stickyTop: number;
};

const SortControls = <F extends string>({
    sortFields,
    sortField,
    sortDirection,
    onSortClick,
    filterId,
    filterValue,
    onFilterChange,
    stickyTop,
}: SortControlsProps<F>) => (
    <div className={STICKY_CLASS} style={{ top: stickyTop }}>
        <label htmlFor={filterId} className="sr-only">Filter by name</label>
        <input
            id={filterId}
            type="search"
            aria-label="Filter by name"
            placeholder="Filter by name…"
            value={filterValue}
            onChange={e => onFilterChange(e.target.value)}
            className="input input-bordered input-sm w-full"
        />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Sort games">
            {sortFields.map(({ field, label }) => {
                const isActive = sortField === field;
                const direction = isActive ? sortDirection : undefined;
                return (
                    <button
                        key={field}
                        onClick={() => onSortClick(field)}
                        className={`btn btn-xs gap-1 ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                        aria-sort={isActive
                                   ? (
                                       sortDirection === 'asc' ? 'ascending' : 'descending'
                                   )
                                   : 'none'
                        }
                        aria-label={`Sort by ${label}${direction ?
                                                       `, ${direction === 'asc' ? 'ascending' : 'descending'}` :
                                                       ''}`}
                    >
                        {label}
                        {isActive && (
                            sortDirection === 'asc'
                            ? <FaArrowUp size={10} aria-hidden="true" />
                            : <FaArrowDown size={10} aria-hidden="true" />
                        )}
                    </button>
                );
            })}
        </div>
    </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CollectionPage() {
    useTitle('ShelfScan | Collection');

    const username = useSelector((state: RootState) => state.bgg.user?.user);
    const { scanHistory } = useScanHistory();

    // ── Tab state ──────────────────────────────────────────────────────────────
    const { activeTab, setActiveTab } = useActiveCollectionTab();

    // ── BGG collection data ────────────────────────────────────────────────────
    const { state, setState } = useCollectionData(username);

    const { isRefreshing, refreshCollection, refreshError, clearRefreshError, announceText } =
        useCollectionRefresh({
            username,
            onSuccess: items => setState({ status: CollectionLoadStatuses.LOADED, items }),
        });

    // ── Sticky controls (only active for "All Games" tab) ─────────────────────
    const { sentinelRef, sectionRef, stickyTop } = useStickyBar(
        activeTab === CollectionTabs.ALL_GAMES && state.status === CollectionLoadStatuses.LOADED,
    );

    // ── "All Games" filter/sort ────────────────────────────────────────────────
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
            label: 'Last Modified',
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
            label: 'Last Scanned',
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
                        className={`${GRID_CLASS} pt-2`}
                        aria-label="Loading collection"
                        aria-busy="true"
                    >
                        {Array.from({ length: 12 }).map((_, i) => (
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
                    displayItems
                } = allGamesFilter;
                return (
                    <>
                        <div ref={sentinelRef} aria-hidden="true" style={{ height: 0 }} />
                        <SortControls
                            sortFields={allGamesSortFields}
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSortClick={handleSortClick}
                            filterId={`${CollectionTabs.ALL_GAMES}-filter-input`}
                            filterValue={filterText}
                            onFilterChange={setFilterText}
                            stickyTop={stickyTop}
                        />
                        {displayItems.length === 0 ? (
                            <p className="text-center py-8 text-base-content/60">
                                No games match your filter.
                            </p>
                        ) : (
                             <VirtuosoGrid
                                 useWindowScroll
                                 totalCount={displayItems.length}
                                 components={{ List: GridContainer }}
                                 itemContent={index => {
                                     const item = displayItems[index];
                                     const thumbnailUrl = item.version?.image ?? item.thumbnail ?? '';
                                     const { height, width } = getImageSizeFromUrl(thumbnailUrl);
                                     const size = Math.ceil(Math.min(height, width) * 2 / 3);

                                     let statusText = '';
                                     let cornerIcon: ReactNode;
                                     switch (true) {
                                         case item.statuses.fortrade:
                                             statusText = 'For Trade';
                                             cornerIcon = <FaRecycle title={statusText}
                                                                     className="shrink-0" />;
                                             break;
                                         case item.statuses.own:
                                             statusText = 'Owned';
                                             cornerIcon = <FaCheck title={statusText}
                                                                   className="shrink-0" />;
                                             break;
                                         case item.statuses.wishlist:
                                             statusText = 'Wishlist';
                                             cornerIcon = <FaHeart title={statusText}
                                                                   className="shrink-0" />;
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
                                             smallSquareSize={size}
                                             statusText={statusText}
                                             cornerIcon={cornerIcon}
                                             statusIcon={null}
                                             detailUrl={`https://boardgamegeek.com/boardgame/${item.objectId}`}
                                             detailUrlTarget="_blank"
                                             detailUrlRel="noopener noreferrer"
                                         />
                                     );
                                 }}
                             />
                         )}
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

        return (
            <>
                <SortControls
                    sortFields={notInCollectionSortFields}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortClick={handleSortClick}
                    filterId={`${CollectionTabs.NOT_IN_COLLECTION}-filter-input`}
                    filterValue={filterText}
                    onFilterChange={setFilterText}
                    stickyTop={0}
                />
                {displayItems.length === 0 ? (
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
                ) : (
                     <div className="flex flex-col gap-1 w-full pt-2">
                         {displayItems.map(entry => {
                             const displayName = entry.gameName ?? entry.upc;
                             const thumbnailUrl = entry.thumbnailUrl ?? '';
                             const { height, width } = getImageSizeFromUrl(thumbnailUrl);
                             const size = Math.ceil(Math.min(height,
                                 width) * 2 / 3) || THUMBNAIL_SIZE;

                             return (
                                 <ListGame
                                     key={entry.id}
                                     keyValue={entry.id.toString()}
                                     name={displayName}
                                     thumbnailUrl={thumbnailUrl}
                                     smallSquareSize={size}
                                     statusText="Not in collection"
                                     cornerIcon={<FaBarcode className="shrink-0" title="Scanned" />}
                                     statusIcon={null}
                                     detailUrl={`/upc/${entry.upc}`}
                                 />
                             );
                         })}
                     </div>
                 )}
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
                    <div className="flex items-center justify-center gap-3 mb-0">
                        <h1 className="text-3xl text-center">Collection</h1>
                        {username && (
                            <button
                                className="btn btn-sm btn-ghost"
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
                        className="w-full bg-[#f1eff9] dark:bg-yellow-700 rounded-md p-4 pt-2"
                    >
                        {activeTab === CollectionTabs.ALL_GAMES && renderAllGamesContent()}
                        {activeTab === CollectionTabs.NOT_IN_COLLECTION && renderNotInCollectionContent()}
                    </section>
                </div>
            </div>
        </>
    );
}
