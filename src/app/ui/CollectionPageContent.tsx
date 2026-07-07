'use client';

import { bggGetGeeklistInner } from '@/app/lib/actions';
import { useSync } from '@/app/lib/extension/useSync';
import { useBatchSync } from '@/app/lib/extension/useBatchSync';
import { CollectionTabs, useActiveCollectionTab } from '@/app/lib/hooks/useActiveCollectionTab';
import { useMathTrade } from '@/app/lib/hooks/useMathTrade';
import { getBggImageFromItem } from '@/app/lib/utils/bggImageId';
import { buildMathTradeBody } from '@/app/lib/utils/mathTradeFormat';
import { CollectionLoadStatuses, useCollectionData } from '@/app/lib/hooks/useCollectionData';
import { parseUnifiedSearch, useCollectionFilters } from '@/app/lib/hooks/useCollectionFilters';
import { CollectionViews, useCollectionView } from '@/app/lib/hooks/useCollectionView';
import { useFilterSort, SortFieldDef } from '@/app/lib/hooks/useFilterSort';
import { useNotInCollection, NotInCollectionEntry } from '@/app/lib/hooks/useNotInCollection';
import { useStickyBar } from '@/app/lib/hooks/useStickyBar';
import { useTitle } from '@/app/lib/hooks/useTitle';
import { useDispatch, useSelector, useStore } from '@/app/lib/hooks';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { RootState } from '@/app/lib/redux/store';
import { getCollectionInfoByObjectId, selectTagMap } from '@/app/lib/redux/bgg/collection/selectors';
import {
    loadGeeklistError,
    loadGeeklistStart,
    loadGeeklistSuccess,
    setActiveGeekList,
} from '@/app/lib/redux/bgg/geeklist/slice';
import { bggGetGeeklistFromXML } from '@/app/lib/services/bgg/service';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { BggCollectionForm } from '@/app/ui/BggCollectionForm';
import { GeekListSwitcher } from '@/app/ui/GeekListSwitcher';
import { MathTradeDialog } from '@/app/ui/MathTradeDialog';
import { AllGamesContent, type AllGamesSortField } from '@/app/ui/games/AllGamesContent';
import { CollectionItemModal } from '@/app/ui/games/CollectionItemModal';
import { NotInCollectionContent } from '@/app/ui/games/NotInCollectionContent';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { type GameUPCBggInfo } from 'gameupc-hooks/types';
import { usePathname, useRouter } from 'next/navigation';
import { KeyboardEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FaArrowsRotate,
    FaBorderAll,
    FaCloudArrowUp,
    FaList,
    FaPlus,
    FaRightLeft,
    FaStar,
    FaTableCells,
    FaXmark,
} from 'react-icons/fa6';

type NotInCollectionSortField = 'name' | 'lastScanned';

type CollectionPageContentProps = {
    initialMathTradeGeeklistId?: number;
    title?: string;
    heading?: string;
};

export const CollectionPageContent = ({
    initialMathTradeGeeklistId,
    title,
    heading = 'Collection'
}: CollectionPageContentProps) => {
    useTitle(title ?? 'ShelfScan | Collection');

    const dispatch = useDispatch();
    const username = useSelector((state: RootState) => state.bgg.user?.user);
    const { scanHistory, lastScannedMap } = useScanHistory();
    const { syncOn } = useSync();
    const { canBatch, addGameToCollection } = useBatchSync();
    const { sendViaExtension } = useMathTrade();
    const [batchRate, setBatchRate] = useState<boolean>(false);
    const [mathTradeMode, setMathTradeMode] = useState(!!initialMathTradeGeeklistId);
    const [showMathTradeDialog, setShowMathTradeDialog] = useState(false);
    const [selectedMathTradeIds, setSelectedMathTradeIds] = useState<Set<number>>(new Set());
    const [isBulkMathTradeAdding, setIsBulkMathTradeAdding] = useState(false);
    const [mathTradeError, setMathTradeError] = useState<string | null>(null);

    const initialMathTradeGeeklistStatus = useSelector(
        (state: RootState) => initialMathTradeGeeklistId ?
                              state.bgg.geeklist.geekLists[initialMathTradeGeeklistId]?.status
                              : undefined
    );
    const activeGeekListId = useSelector(
        (state: RootState) => state.bgg.geeklist.activeGeekListId,
    );
    const activeGeekListStatus = useSelector((state: RootState) =>
        activeGeekListId !== null
            ? state.bgg.geeklist.geekLists[activeGeekListId]?.status
            : undefined,
    );
    const activeGeekListTitle = useSelector((state: RootState) =>
        activeGeekListId !== null
            ? state.bgg.geeklist.geekLists[activeGeekListId]?.geekList?.title
            : undefined,
    );
    const allGeekLists = useSelector((state: RootState) =>
        Object.entries(state.bgg.geeklist.geekLists)
            .filter(([, entry]) => entry.status === 'loaded')
            .map(([id, entry]) => ({
                id: parseInt(id, 10),
                title: entry.geekList?.title ?? `Geeklist ${id}`,
            })),
    );

    const pathname = usePathname();
    const router = useRouter();
    const isMathTradeRoute = pathname?.startsWith('/math-trade') ?? false;

    const store = useStore();

    // Auto-load the geeklist and enter math trade mode when an ID is provided via route params.
    // Skips the network request if the geeklist is already loaded in Redux (e.g. after a dialog
    // load followed by router navigation to the same ID).
    useEffect(() => {
        if (!initialMathTradeGeeklistId) { return; }
        if (initialMathTradeGeeklistStatus === 'loaded') {
            dispatch(setActiveGeekList(initialMathTradeGeeklistId));
            setMathTradeMode(true);
            return;
        }
        let active = true;
        dispatch(loadGeeklistStart(initialMathTradeGeeklistId));
        void bggGetGeeklistInner(initialMathTradeGeeklistId).then(xml => {
            if (!active) { return; }
            if (!xml) {
                dispatch(loadGeeklistError(initialMathTradeGeeklistId));
                return;
            }
            const geekList = bggGetGeeklistFromXML(xml);
            if (!geekList) {
                dispatch(loadGeeklistError(initialMathTradeGeeklistId));
                return;
            }
            dispatch(loadGeeklistSuccess(geekList));
            setMathTradeMode(true);
        });
        return () => { active = false; };
    }, [initialMathTradeGeeklistId, dispatch, store]);

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
        setSelectedMathTradeIds(prev => {
            const next = new Set(prev);
            if (next.has(collectionId)) {
                next.delete(collectionId);
            } else {
                next.add(collectionId);
            }
            return next;
        });
    }, []);

    const handleBulkMathTradeAdd = useCallback(async () => {
        if (selectedMathTradeIds.size === 0) { return; }
        setIsBulkMathTradeAdding(true);
        setMathTradeError(null);

        const reduxState = store.getState();
        const user = reduxState.bgg.user?.user?.toLowerCase() ?? '';
        const collectionUsers = reduxState.bgg.collection.users[user];
        const geeklistData = reduxState.bgg.geeklist.data;

        const items = Array.from(selectedMathTradeIds).flatMap(collectionId => {
            const item = collectionUsers?.items[collectionId];
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
                imageId: getBggImageFromItem(item),
            }];
        });

        const results = await sendViaExtension(items);
        setIsBulkMathTradeAdding(false);

        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
            setMathTradeError(
                `${failures.length} item${failures.length !== 1 ? 's' : ''} failed to add`,
            );
        } else {
            setSelectedMathTradeIds(new Set());
        }
    }, [selectedMathTradeIds, store, sendViaExtension]);

    const modeMap = useMemo(() => ({
        batchRating: view === CollectionViews.LARGE_GRID && syncOn && batchRate,
        mathTrade: mathTradeMode,
    }), [syncOn, batchRate, view, mathTradeMode]);

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
            const { collectionId } = getCollectionInfoByObjectId([reduxState, entry.bggId!]);
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
                        <div className="w-full flex items-center gap-1.5">
                            <GeekListSwitcher
                                activeId={activeGeekListId}
                                lists={allGeekLists}
                                onSelect={id => {
                                    dispatch(setActiveGeekList(id));
                                    if (isMathTradeRoute) {
                                        router.replace(`/math-trade/${id}`);
                                    }
                                }}
                            />
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
                    {mathTradeMode && syncOn && (
                        <div className="flex items-center justify-between gap-2 pt-2 p-2 bg-overlay">
                            <span className="text-xs text-base-content/60">
                                {selectedMathTradeIds.size > 0
                                    && `${selectedMathTradeIds.size} selected`
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
                                        ${isBulkMathTradeAdding ? 'opacity-75 cursor-not-allowed' : 'hover:bg-[#d06b93] cursor-pointer'}`}
                                    onClick={() => void handleBulkMathTradeAdd()}
                                    disabled={isBulkMathTradeAdding}
                                    aria-label={`Add ${selectedMathTradeIds.size} game${selectedMathTradeIds.size !== 1 ? 's' : ''} to math trade geeklist`}
                                >
                                    {isBulkMathTradeAdding
                                        ? <span className="loading loading-bars loading-sm" />
                                        : <FaRightLeft className="w-4 h-4" />
                                    }
                                    Add {selectedMathTradeIds.size} to Math Trade
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
        </>
    );
};
