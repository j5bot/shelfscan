'use client';

import { thingPrefix, versionPrefix } from '@/app/lib/constants';
import { useSync } from '@/app/lib/extension/useSync';
import { useBatchSync } from '@/app/lib/extension/useBatchSync';
import { CollectionTabs, useActiveCollectionTab } from '@/app/lib/hooks/useActiveCollectionTab';
import { useOLWLGMathTrade } from '@/app/lib/hooks/useOLWLGMathTrade';
import { bggHost } from '@/app/lib/services/bgg/constants';
import { getBggImageFromItem } from '@/app/lib/utils/bggImageId';
import { buildMathTradeBody } from '@/app/lib/utils/mathTradeFormat';
import { downloadSwapExport, getSwapItemImageCacheKey } from '@/app/lib/utils/swapExport';
import { CollectionLoadStatuses, useCollectionData } from '@/app/lib/hooks/useCollectionData';
import { parseUnifiedSearch, useCollectionFilters } from '@/app/lib/hooks/useCollectionFilters';
import { CollectionViews, useCollectionView } from '@/app/lib/hooks/useCollectionView';
import { useFilterSort, SortFieldDef } from '@/app/lib/hooks/useFilterSort';
import { useNotInCollection, NotInCollectionEntry } from '@/app/lib/hooks/useNotInCollection';
import { useStickyBar } from '@/app/lib/hooks/useStickyBar';
import { useTitle } from '@/app/lib/hooks/useTitle';
import { useSelector, useStore } from '@/app/lib/hooks';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { RootState } from '@/app/lib/redux/store';
import { SwapItemData } from '@/app/lib/redux/swap/slice';
import { getCollectionInfoByObjectId, selectTagMap } from '@/app/lib/redux/bgg/collection/selectors';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { BggCollectionForm } from '@/app/ui/BggCollectionForm';
import { GeekListSwitcher } from '@/app/ui/GeekListSwitcher';
import { MathTradeDialog } from '@/app/ui/MathTradeDialog';
import { AllGamesContent, type AllGamesSortField } from '@/app/ui/games/AllGamesContent';
import { CollectionItemModal } from '@/app/ui/games/CollectionItemModal';
import { NotInCollectionContent } from '@/app/ui/games/NotInCollectionContent';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { type GameUPCBggInfo } from 'gameupc-hooks/types';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { KeyboardEvent, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import {
    FaArrowsRotate,
    FaBorderAll,
    FaCloudArrowUp,
    FaFileExport,
    FaList,
    FaPlus,
    FaRightLeft,
    FaStar,
    FaTableCells,
    FaXmark,
} from 'react-icons/fa6';

type NotInCollectionSortField = 'name' | 'lastScanned';

export type CollectionPageModeOptions = {
    mathTradeGeeklistId?: number;
    swapId?: number;
};

type CollectionPageContentProps = {
    modeOptions?: CollectionPageModeOptions;
    title?: string;
    heading?: string;
};

const makeDescription = (
    bodyText: string,
    item: Partial<BggCollectionItem>,
) => {
    return `${bodyText}

${thingPrefix}${item.objectId}${item.versionId !== undefined ? `
${versionPrefix}${item.versionId}` : ''}`;
};

export const CollectionPageContent = ({
    modeOptions = {},
    title,
    heading = 'Collection'
}: CollectionPageContentProps) => {
    useTitle(title ?? 'ShelfScan | Collection');

    const { mathTradeGeeklistId: initialMathTradeGeeklistId } = modeOptions;

    const username = useSelector((state: RootState) => state.bgg.user?.user);
    const collection = useSelector((state: RootState) => state.bgg.collection?.users[username?.toLowerCase() ?? ''] ?? undefined);
    const { scanHistory, lastScannedMap } = useScanHistory();
    const { syncOn } = useSync();
    const { canBatch, addGameToCollection } = useBatchSync();
    const [batchRate, setBatchRate] = useState<boolean>(false);
    const [selectedMathTradeIds, setSelectedMathTradeIds] = useState<Set<number>>(new Set());
    const [pendingMathTradeToggleId, setPendingMathTradeToggleId] = useState<number | null>(null);
    const [isExportingSwap, setIsExportingSwap] = useState(false);
    const swapData = useSelector((state: RootState) => state.swap.data);

    const {
        mathTradeMode,
        setMathTradeMode,
        showMathTradeDialog,
        setShowMathTradeDialog,
        isBulkMathTradeAdding,
        mathTradeError,
        setMathTradeError,
        isRefreshingGeeklist,
        geeklistData,
        activeGeekListId,
        geeklist,
        activeGeekListStatus,
        activeGeekListTitle,
        allGeekLists,
        setActiveGeekListId,
        handleRefreshGeeklist,
        submitMathTrade,
    } = useOLWLGMathTrade({ username, collection, initialMathTradeGeeklistId });

    const pathname = usePathname();
    const router = useRouter();
    const isMathTradeRoute = pathname?.startsWith('/math-trade') ?? false;
    const isSwapRoute = pathname?.startsWith('/swap') ?? false;

    const store = useStore();

    const { activeTab, setActiveTab } = useActiveCollectionTab();
    const { view, setView } = useCollectionView();
    const {
        filters,
        setFilter,
        resetFilters,
        hasActiveFilters,
        makeFilterFn,
        savedFilters,
        saveFilterPreset,
        loadFilterPreset,
        renameFilterPreset,
        deleteFilterPreset,
        duplicateFilterPreset,
    } = useCollectionFilters();
    const [selectedItem, setSelectedItem] = useState<BggCollectionItem | null>(null);

    // ── Not-in-collection selection state ─────────────────────────────────────
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [addedNames, setAddedNames] = useState<string[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const addToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMathTradeClick = useCallback(() => {
        if (mathTradeMode) {
            setMathTradeMode(false);
            setSelectedMathTradeIds(new Set());
            return;
        }
        if (activeGeekListId !== null && activeGeekListStatus === 'loaded') {
            setMathTradeMode(true);
        } else {
            setShowMathTradeDialog(true);
        }
    }, [mathTradeMode, activeGeekListId, activeGeekListStatus]);

    const handleMathTradeToggle = useCallback((collectionId: number) => {
        if (!selectedMathTradeIds.has(collectionId)) {
            const item = collection?.items[collectionId];
            if (item && activeGeekListId !== null) {
                const inGeeklist = (geeklist?.games[item.objectId]?.length ?? 0) > 0;
                if (inGeeklist) {
                    setPendingMathTradeToggleId(collectionId);
                    return;
                }
            }
        }
        setSelectedMathTradeIds(prev => {
            const next = new Set(prev);
            if (next.has(collectionId)) {
                next.delete(collectionId);
            } else {
                next.add(collectionId);
            }
            return next;
        });
    }, [store, activeGeekListId, selectedMathTradeIds]);

    const handleBulkMathTradeAdd = useCallback(async () => {
        if (selectedMathTradeIds.size === 0) { return; }

        const items = Array.from(selectedMathTradeIds).flatMap(collectionId => {
            const item = collection?.items[collectionId];
            if (!item) { return []; }
            const savedData = geeklistData[collectionId];
            const bodyText = savedData?.bodyText ?? item.tradeCondition ?? '';
            const copies = savedData?.copies ?? 1;
            return [{
                collectionId,
                gameId: item.objectId,
                versionId: item.versionId,
                name: item.name,
                body: buildMathTradeBody(bodyText, item, copies, collectionId),
                description: bodyText,
                copies,
                imageId: getBggImageFromItem(item),
            }];
        });

        const success = await submitMathTrade(items);
        if (success) {
            setSelectedMathTradeIds(new Set());
        }
    }, [selectedMathTradeIds, collection, geeklistData, submitMathTrade]);

    const handleSwapExport = useCallback(async () => {
        if (selectedMathTradeIds.size === 0) { return; }

        const items: SwapItemData[] = Array.from(selectedMathTradeIds).flatMap(collectionId => {
            const item = collection?.items[collectionId];
            if (!item) { return []; }
            const savedData = swapData[collectionId];
            return [{
                collectionItem: item,
                collectionId,
                swapItemId: savedData?.swapItemId,
                name: item.version?.name ? `${item.name} (${item.version.name})`
                       : (savedData?.name ?? item.name),
                description: makeDescription(
                    savedData?.description ?? item.tradeCondition ?? '',
                    item,
                ),
                compareValue: savedData?.compareValue ?? 1,
                cashValue: savedData?.cashValue ?? 0,
                imageKey: savedData?.imageKey ?? getSwapItemImageCacheKey(item),
            }];
        });

        setIsExportingSwap(true);
        try {
            await downloadSwapExport(items);
            setSelectedMathTradeIds(new Set());
        } finally {
            setIsExportingSwap(false);
        }
    }, [selectedMathTradeIds, collection, swapData]);

    const modeMap = useMemo(() => ({
        batchRating: view === CollectionViews.LARGE_GRID && syncOn && batchRate,
        mathTrade: mathTradeMode,
        swap: isSwapRoute,
    }), [syncOn, batchRate, view, mathTradeMode, isSwapRoute]);

    const {
        reduxItems,
        state,
        isRefreshing,
        refreshCollection,
        refreshError,
        clearRefreshError,
        announceText,
    } = useCollectionData({ username });

    // ── Selection mode handlers ────────────────────────────────────────────────
    const handleToggleSelectionMode = useCallback(() => {
        setSelectionMode(v => !v);
        setSelectedIds(new Set());
    }, []);

    const handleToggleSelection = useCallback((entry: NotInCollectionEntry) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(entry.id)) {
                next.delete(entry.id);
            } else {
                next.add(entry.id);
            }
            return next;
        });
    }, []);

    const handleRequestAddSelected = useCallback(() => {
        if (selectedIds.size === 0) { return; }
        setShowConfirmModal(true);
    }, [selectedIds.size]);

    const { sentinelRef, sectionRef, stickyTop } = useStickyBar(
        activeTab === CollectionTabs.ALL_GAMES && state.status === CollectionLoadStatuses.LOADED,
    );

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

    const tagMap = useSelector((state: RootState) => selectTagMap([state]));

    const extraFilterFn = useMemo(
        () => makeFilterFn(scannedSet, verifiedSet, tagMap),
        [makeFilterFn, scannedSet, verifiedSet, tagMap],
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

    const allGamesFilter = useFilterSort<BggCollectionItem, AllGamesSortField>({
        items: reduxItems,
        filterFn: () => true,
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

    const notInCollectionExtraFilterFn = useCallback(
        (item: NotInCollectionEntry): boolean => {
            if (!filters.searchText.trim() || filters.searchMode === 'tags') { return true; }
            const { nameQuery, anyTextQuery } = parseUnifiedSearch(filters.searchText, filters.searchMode);
            const query = nameQuery || anyTextQuery;
            if (!query) { return true; }
            return (item.gameName ?? item.upc).toLowerCase().includes(query);
        },
        [filters.searchText, filters.searchMode],
    );

    const notInCollectionFilter = useFilterSort<NotInCollectionEntry, NotInCollectionSortField>({
        items: notInCollectionItems,
        filterFn: () => true,
        extraFilterFn: notInCollectionExtraFilterFn,
        sortFields: notInCollectionSortFields,
        defaultSortField: 'name',
        storageKeyPrefix: 'collection-not-in',
    });

    const handleAddSelected = useCallback(async () => {
        setShowConfirmModal(false);
        setIsAdding(true);

        const reduxState = store.getState();
        const selectedEntries = notInCollectionItems.filter(
            e => selectedIds.has(e.id) && e.bggId !== undefined,
        );

        const promises = selectedEntries.map(entry => {
            const { collectionId } = getCollectionInfoByObjectId([reduxState, entry.bggId!, undefined]);
            const info: GameUPCBggInfo = {
                id: entry.bggId!,
                name: entry.gameName ?? entry.upc,
                confidence: 100,
                thumbnail_url: entry.thumbnailUrl ?? '',
                page_url: `https://boardgamegeek.com/boardgame/${entry.bggId}`,
                image_url: entry.thumbnailUrl ?? '',
                data_url: '',
                update_url: '',
                version_status: 'none',
                versions: [],
            };
            return addGameToCollection(info, undefined, collectionId)?.then(
                result => result ? (entry.gameName ?? entry.upc) : undefined,
            );
        });

        const results = await Promise.all(promises);
        const names = results.filter((r): r is string => r !== undefined);

        setIsAdding(false);
        setSelectionMode(false);
        setSelectedIds(new Set());

        if (names.length > 0) {
            setAddedNames(names);
            if (addToastTimerRef.current !== null) { clearTimeout(addToastTimerRef.current); }
            addToastTimerRef.current = setTimeout(() => {
                addToastTimerRef.current = null;
                setAddedNames([]);
            }, 5000);
        }
    }, [selectedIds, notInCollectionItems, store, addGameToCollection]);

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
                    <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 relative pl-18 pr-18">
                        <h1 className="text-3xl text-center">{heading}</h1>
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
                            {syncOn && !isMathTradeRoute && (
                                <button
                                    className={`btn btn-sm rounded-md ${
                                        batchRate ? 'btn-primary' : ''
                                    }`}
                                    onClick={() => {
                                        setView(CollectionViews.LARGE_GRID);
                                        setBatchRate(!batchRate);
                                    }}
                                    aria-label="Toggle Bulk Rating"
                                    aria-pressed={batchRate}
                                >
                                    <FaStar aria-hidden="true" />
                                </button>
                            )}
                            {activeTab === CollectionTabs.ALL_GAMES && !isMathTradeRoute && (
                                <button
                                    className={`btn btn-sm rounded-md ${mathTradeMode ? 'btn-primary' : ''}`}
                                    onClick={handleMathTradeClick}
                                    aria-label={mathTradeMode ? 'Exit Math Trade mode' : 'Enter Math Trade mode'}
                                    aria-pressed={mathTradeMode}
                                    title={mathTradeMode && activeGeekListTitle ? activeGeekListTitle : 'Math Trade'}
                                >
                                    <FaRightLeft aria-hidden="true" />
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
                    {mathTradeMode && (
                        <div className="w-full flex items-center justify-center gap-0.5">
                            {activeGeekListId !== null && (
                                <button
                                    type="button"
                                    className="btn btn-xs btn-ghost rounded-md shrink-0"
                                    onClick={() => void handleRefreshGeeklist()}
                                    disabled={isRefreshingGeeklist}
                                    aria-label={isRefreshingGeeklist ? 'Refreshing geeklist…' : 'Refresh geeklist'}
                                    title={isRefreshingGeeklist ? 'Refreshing…' : 'Refresh geeklist'}
                                >
                                    <FaArrowsRotate
                                        className={isRefreshingGeeklist ? 'animate-spin' : ''}
                                        aria-hidden="true"
                                    />
                                </button>
                            )}
                            <GeekListSwitcher
                                activeId={activeGeekListId}
                                lists={allGeekLists}
                                onSelect={id => {
                                    setActiveGeekListId(id);
                                    if (isMathTradeRoute) {
                                        router.replace(`/math-trade/${id}`);
                                    }
                                }}
                            />
                            <Link
                                className="btn btn-xs btn-ghost rounded-md shrink-0"
                                href={`${bggHost}/geeklist/${activeGeekListId}`}
                                rel="noreferrer noopener"
                                aria-label="Open math trade list"
                                title="Open math trade list"
                                target="_blank"
                                ><FaExternalLinkAlt aria-hidden="true" /></Link>
                            <button
                                type="button"
                                className="btn btn-xs btn-ghost rounded-md shrink-0"
                                onClick={() => setShowMathTradeDialog(true)}
                                aria-label="Load another geeklist"
                                title="Load another geeklist"
                            >
                                <FaPlus aria-hidden="true" />
                            </button>
                        </div>
                    )}

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

                    <Suspense>
                        <BggCollectionForm />
                    </Suspense>
                    {canBatch && activeTab === CollectionTabs.NOT_IN_COLLECTION && (
                        <div className="flex items-center justify-between gap-2 pt-2 p-2 bg-overlay">
                            <button
                                type="button"
                                className={`btn btn-sm rounded-md ${selectionMode ? 'btn-primary' : 'text-base-content/70'}`}
                                onClick={handleToggleSelectionMode}
                                aria-pressed={selectionMode}
                            >
                                {selectionMode ? 'Exit Select' : 'Select Items'}
                            </button>
                            {selectionMode && selectedIds.size > 0 && (
                                <button
                                    type="button"
                                    className={`btn rounded-full pointer-events-auto
                                        bg-[#e07ca4] text-white
                                        flex items-center justify-center gap-2
                                        uppercase text-base font-sharetech
                                        pl-6 pr-6 pt-2 pb-2
                                        ${isAdding ? 'opacity-75 cursor-not-allowed' : 'hover:bg-[#d06b93] cursor-pointer'}`}
                                    onClick={handleRequestAddSelected}
                                    disabled={isAdding}
                                    aria-label={`Add ${selectedIds.size} game${selectedIds.size !== 1 ? 's' : ''} to collection`}
                                >
                                    {isAdding
                                     ? <span className="loading loading-bars loading-sm" />
                                     : <FaCloudArrowUp className="w-4 h-4" />
                                    }
                                    Add {selectedIds.size} Game{selectedIds.size !== 1 ? 's' : ''} to Collection
                                </button>
                            )}
                            {selectionMode && (
                                <span className="text-xs text-base-content/60 pr-1">
                                    {selectedIds.size > 0
                                     ? `${selectedIds.size} selected`
                                     : ''
                                    }
                                </span>
                            )}
                        </div>
                    )}
                    {((mathTradeMode && syncOn) || isSwapRoute) && (
                        <div className="flex items-center justify-between gap-2 pt-2 p-2 bg-overlay">
                            <span className="text-xs text-base-content/60">
                                {selectedMathTradeIds.size > 0
                                    ? `${selectedMathTradeIds.size} selected`
                                    : isSwapRoute
                                        ? 'Click image to select for Swap export'
                                        : 'Click image to select for Math Trade'
                                }
                            </span>
                            {selectedMathTradeIds.size > 0 && (
                                <button
                                    type="button"
                                    className={`btn rounded-full pointer-events-auto
                                        bg-[#e07ca4] text-white
                                        flex items-center justify-center gap-2
                                        uppercase text-base font-sharetech
                                        pl-6 pr-6 pt-2 pb-2
                                        ${(isSwapRoute ? isExportingSwap : isBulkMathTradeAdding) ? 'opacity-75 cursor-not-allowed' : 'hover:bg-[#d06b93] cursor-pointer'}`}
                                    onClick={() => void (isSwapRoute ? handleSwapExport() : handleBulkMathTradeAdd())}
                                    disabled={isSwapRoute ? isExportingSwap : isBulkMathTradeAdding}
                                    aria-label={isSwapRoute
                                        ? `Export ${selectedMathTradeIds.size} game${selectedMathTradeIds.size !== 1 ? 's' : ''} to ODS`
                                        : `Add ${selectedMathTradeIds.size} game${selectedMathTradeIds.size !== 1 ? 's' : ''} to math trade geeklist`
                                    }
                                >
                                    {(isSwapRoute ? isExportingSwap : isBulkMathTradeAdding)
                                        ? <span className="loading loading-bars loading-sm" />
                                        : isSwapRoute ? <FaFileExport className="w-4 h-4" /> : <FaRightLeft className="w-4 h-4" />
                                    }
                                    {isSwapRoute
                                        ? `Export ${selectedMathTradeIds.size} for Swaptagon`
                                        : `Add ${selectedMathTradeIds.size} to Math Trade`
                                    }
                                </button>
                            )}
                        </div>
                    )}
                    {mathTradeError && (
                        <div className="toast toast-top toast-center z-50">
                            <div
                                role="alert"
                                className="alert alert-error shadow-lg cursor-pointer"
                                onClick={() => setMathTradeError(null)}
                            >
                                <span className="text-sm">{mathTradeError}</span>
                            </div>
                        </div>
                    )}
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
                                displayItems={allGamesFilter.displayItems}
                                filters={filters}
                                setFilter={setFilter}
                                hasActiveFilters={hasActiveFilters}
                                resetFilters={resetFilters}
                                savedFilters={savedFilters}
                                onSaveFilters={saveFilterPreset}
                                onLoadFilter={loadFilterPreset}
                                onRenameFilter={renameFilterPreset}
                                onDeleteFilter={deleteFilterPreset}
                                onDuplicateFilter={duplicateFilterPreset}
                                refreshCollection={refreshCollection}
                                onSelectItem={setSelectedItem}
                                mathTradeSelectedIds={selectedMathTradeIds}
                                onMathTradeToggle={handleMathTradeToggle}
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
                                displayItems={notInCollectionFilter.displayItems}
                                filters={filters}
                                setFilter={setFilter}
                                hasActiveFilters={hasActiveFilters}
                                resetFilters={resetFilters}
                                savedFilters={savedFilters}
                                onSaveFilters={saveFilterPreset}
                                onLoadFilter={loadFilterPreset}
                                onRenameFilter={renameFilterPreset}
                                onDeleteFilter={deleteFilterPreset}
                                onDuplicateFilter={duplicateFilterPreset}
                                selectionMode={selectionMode}
                                selectedIds={selectedIds}
                                onToggleSelection={handleToggleSelection}
                            />
                        )}
                    </section>
                </div>
            </div>
            <CollectionItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            <MathTradeDialog
                isOpen={showMathTradeDialog}
                onClose={() => setShowMathTradeDialog(false)}
                onLoaded={(id: number) => {
                    if (isMathTradeRoute) {
                        router.replace(`/math-trade/${id}`);
                        return;
                    }
                    setMathTradeMode(true)
                }}
            />
            {addedNames.length > 0 && (
                <div
                    className="toast toast-top toast-center z-50"
                    onClick={() => setAddedNames([])}
                >
                    <div role="status" className="alert alert-success shadow-lg cursor-pointer">
                        <span className="text-sm">
                            Added {addedNames.length} game{addedNames.length !== 1 ? 's' : ''} to collection:&nbsp;
                            {addedNames.join(', ')}
                        </span>
                    </div>
                </div>
            )}
            {showConfirmModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                    onClick={() => setShowConfirmModal(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Confirm add to collection"
                >
                    <div
                        className="relative bg-base-100 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
                            onClick={() => setShowConfirmModal(false)}
                            aria-label="Close"
                        >
                            <FaXmark />
                        </button>
                        <h2 className="text-lg font-semibold mb-2">
                            Add to BGG Collection?
                        </h2>
                        <p className="text-sm text-base-content/70 mb-3">
                            Add {selectedIds.size} game{selectedIds.size !== 1 ? 's' : ''} to your BGG collection:
                        </p>
                        <ul className="text-sm mb-5 max-h-48 overflow-y-auto space-y-1 pl-3">
                            {notInCollectionItems
                                .filter(e => selectedIds.has(e.id) && e.bggId !== undefined)
                                .map(e => (
                                    <li key={e.id} className="truncate list-disc text-base-content/80">
                                        {e.gameName ?? e.upc}
                                    </li>
                                ))
                            }
                        </ul>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-primary gap-1"
                                onClick={handleAddSelected}
                                disabled={isAdding}
                            >
                                {isAdding
                                    ? <span className="loading loading-bars loading-xs" />
                                    : <FaCloudArrowUp />
                                }
                                Add to Collection
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {pendingMathTradeToggleId !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                    onClick={() => setPendingMathTradeToggleId(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Already in geeklist"
                >
                    <div
                        className="relative bg-base-100 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold mb-2">Already in Geeklist</h2>
                        <p className="text-sm text-base-content/70 mb-4">
                            This game is already in your math trade geeklist. Select it to add again?
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                onClick={() => setPendingMathTradeToggleId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-warning"
                                onClick={() => {
                                    const id = pendingMathTradeToggleId;
                                    setPendingMathTradeToggleId(null);
                                    setSelectedMathTradeIds(prev => {
                                        const next = new Set(prev);
                                        next.add(id);
                                        return next;
                                    });
                                }}
                            >
                                Add Again
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
