'use client';

import { useSync } from '@/app/lib/extension/useSync';
import { CollectionTabs, useActiveCollectionTab } from '@/app/lib/hooks/useActiveCollectionTab';
import { CollectionLoadStatuses, useCollectionData } from '@/app/lib/hooks/useCollectionData';
import { useCollectionFilters } from '@/app/lib/hooks/useCollectionFilters';
import { CollectionViews, useCollectionView } from '@/app/lib/hooks/useCollectionView';
import { useFilterSort, SortFieldDef } from '@/app/lib/hooks/useFilterSort';
import { useNotInCollection, NotInCollectionEntry } from '@/app/lib/hooks/useNotInCollection';
import { useStickyBar } from '@/app/lib/hooks/useStickyBar';
import { useTitle } from '@/app/lib/hooks/useTitle';
import { useSelector } from '@/app/lib/hooks';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { RootState } from '@/app/lib/redux/store';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { AllGamesContent, type AllGamesSortField } from '@/app/ui/games/AllGamesContent';
import { CollectionItemModal } from '@/app/ui/games/CollectionItemModal';
import { NotInCollectionContent } from '@/app/ui/games/NotInCollectionContent';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { KeyboardEvent, useCallback, useMemo, useState } from 'react';
import {
    FaArrowsRotate,
    FaBorderAll,
    FaList,
    FaStar,
    FaTableCells,
} from 'react-icons/fa6';

type NotInCollectionSortField = 'name' | 'lastScanned';


export default function CollectionPage() {
    useTitle('ShelfScan | Collection');

    const username = useSelector((state: RootState) => state.bgg.user?.user);
    const { scanHistory } = useScanHistory();
    const { syncOn } = useSync();
    const [batchRate, setBatchRate] = useState<boolean>(false);

    const { activeTab, setActiveTab } = useActiveCollectionTab();
    const { view, setView } = useCollectionView();
    const { filters, setFilter, resetFilters, hasActiveFilters, makeFilterFn } = useCollectionFilters();
    const [selectedItem, setSelectedItem] = useState<BggCollectionItem | null>(null);

    const modeMap = useMemo(() => ({
        batchRating: view === CollectionViews.LARGE_GRID && syncOn && batchRate,
    }), [syncOn, batchRate, view]);

    const {
        reduxItems,
        state,
        isRefreshing,
        refreshCollection,
        refreshError,
        clearRefreshError,
        announceText,
    } = useCollectionData({ username });

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
            field: 'rating',
            label: 'Rating',
            compare: (a, b) => (a.rating ?? 0) - (b.rating ?? 0),
        },
        {
            field: 'averageRating',
            label: 'Avg. Rating',
            compare: (a, b) => (a.averageRating ?? 0) - (b.averageRating ?? 0),
        },
        {
            field: 'plays',
            label: 'Plays',
            compare: (a, b) => (a.plays ?? 0) - (b.plays ?? 0),
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

    const allGamesFilterFn = useCallback(
        (item: BggCollectionItem, query: string) => item.name.toLowerCase().includes(query),
        [],
    );

    const allGamesFilter = useFilterSort<BggCollectionItem, AllGamesSortField>({
        items: reduxItems,
        filterFn: allGamesFilterFn,
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
              ? new Set(reduxItems?.map(item => item.objectId) ?? [])
              : undefined,
        [state.status, reduxItems],
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

    const notInCollectionFilterFn = useCallback(
        (item: NotInCollectionEntry, query: string) =>
            (item.gameName ?? item.upc).toLowerCase().includes(query),
        [],
    );

    const notInCollectionFilter = useFilterSort<NotInCollectionEntry, NotInCollectionSortField>({
        items: notInCollectionItems,
        filterFn: notInCollectionFilterFn,
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
            <div className="page-content w-full pt-15 flex justify-center">
                <div className="w-12/12 md:w-11/12 p-3 xs:p-2 md:p-4 pb-10 rounded-xl bg-base-100 text-sm">
                    <div className="flex justify-center items-center gap-3 relative">
                        <h1 className="text-3xl text-center">Collection</h1>
                        <div className="flex justify-start gap-1">
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
                            {view === CollectionViews.LARGE_GRID && syncOn && (
                                <button
                                    className={`btn btn-sm rounded-md ${
                                        batchRate ? 'btn-primary' : ''
                                    }`}
                                    onClick={() => setBatchRate(!batchRate)}
                                    aria-label="Toggle Bulk Rating"
                                    aria-pressed={batchRate}
                                >
                                    <FaStar
                                        aria-hidden="true"
                                    />
                                </button>
                            )}
                        </div>
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
                        className="tabs tabs-border mt-2 mb-2"
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
                        {activeTab === CollectionTabs.ALL_GAMES && (
                            <AllGamesContent
                                state={state}
                                sentinelRef={sentinelRef}
                                stickyTop={stickyTop}
                                view={view}
                                modeMap={modeMap}
                                scannedSet={scannedSet}
                                verifiedSet={verifiedSet}
                                sortFields={allGamesSortFields}
                                sortField={allGamesFilter.sortField}
                                sortDirection={allGamesFilter.sortDirection}
                                onSortClick={allGamesFilter.handleSortClick}
                                filterText={allGamesFilter.filterText}
                                onFilterChange={allGamesFilter.setFilterText}
                                displayItems={allGamesFilter.displayItems}
                                filters={filters}
                                setFilter={setFilter}
                                hasActiveFilters={hasActiveFilters}
                                resetFilters={resetFilters}
                                refreshCollection={refreshCollection}
                                onSelectItem={setSelectedItem}
                            />
                        )}
                        {activeTab === CollectionTabs.NOT_IN_COLLECTION && (
                            <NotInCollectionContent
                                collectionHasData={collectionHasData}
                                username={username}
                                isRefreshing={isRefreshing}
                                refreshCollection={refreshCollection}
                                view={view}
                                notInCollectionItems={notInCollectionItems}
                                scanHistoryLength={scanHistory.length}
                                sortFields={notInCollectionSortFields}
                                sortField={notInCollectionFilter.sortField}
                                sortDirection={notInCollectionFilter.sortDirection}
                                onSortClick={notInCollectionFilter.handleSortClick}
                                filterText={notInCollectionFilter.filterText}
                                onFilterChange={notInCollectionFilter.setFilterText}
                                displayItems={notInCollectionFilter.displayItems}
                                filters={filters}
                                setFilter={setFilter}
                                hasActiveFilters={hasActiveFilters}
                                resetFilters={resetFilters}
                            />
                        )}
                    </section>
                </div>
            </div>
            <CollectionItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        </>
    );
}
