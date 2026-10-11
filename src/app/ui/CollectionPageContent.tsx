'use client';

import { useSync } from '@/app/lib/extension/useSync';
import { useSelector } from '@/app/lib/hooks';
import {
    CollectionTabs,
    getPanelId,
    getTabId,
    useActiveCollectionTab,
} from '@/app/lib/hooks/useActiveCollectionTab';
import { useAddToCollectionSelection } from '@/app/lib/hooks/useAddToCollectionSelection';
import { useAllGamesFilter } from '@/app/lib/hooks/useAllGamesFilter';
import { useCollectionBggSearch } from '@/app/lib/hooks/useCollectionBggSearch';
import { CollectionLoadStatuses, useCollectionData } from '@/app/lib/hooks/useCollectionData';
import { useCollectionFilters } from '@/app/lib/hooks/useCollectionFilters';
import { useCollectionTradeActions } from '@/app/lib/hooks/useCollectionTradeActions';
import { CollectionViews, useCollectionView } from '@/app/lib/hooks/useCollectionView';
import { useNotInCollectionFilter } from '@/app/lib/hooks/useNotInCollectionFilter';
import { useOLWLGMathTrade } from '@/app/lib/hooks/useOLWLGMathTrade';
import { useStickyBar } from '@/app/lib/hooks/useStickyBar';
import { useTitle } from '@/app/lib/hooks/useTitle';
import { useTradeMode } from '@/app/lib/hooks/useTradeMode';
import { useTradeSelection } from '@/app/lib/hooks/useTradeSelection';
import { RootState } from '@/app/lib/redux/store';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { getCollectionPageFlags } from '@/app/lib/utils/collectionPage';
import { BggCollectionForm } from '@/app/ui/BggCollectionForm';
import { AddToCollectionBar } from '@/app/ui/collection/AddToCollectionBar';
import { BggSearchResults } from '@/app/ui/collection/BggSearchResults';
import { CollectionHeader } from '@/app/ui/collection/CollectionHeader';
import { CollectionOverlays } from '@/app/ui/collection/CollectionOverlays';
import { CollectionTabList } from '@/app/ui/collection/CollectionTabList';
import { MathTradeGeeklistBar } from '@/app/ui/collection/MathTradeGeeklistBar';
import { TradeActionBar } from '@/app/ui/collection/TradeActionBar';
import { AllGamesContent } from '@/app/ui/games/AllGamesContent';
import { NotInCollectionContent } from '@/app/ui/games/NotInCollectionContent';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { Suspense, useCallback, useMemo, useState } from 'react';

export type CollectionPageModeOptions = {
    mathTradeGeeklistId?: number;
    swapId?: number;
};

type CollectionPageContentProps = {
    modeOptions?: CollectionPageModeOptions;
    title?: string;
    heading?: string;
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
    const { syncOn } = useSync();
    const tradeMode = useTradeMode();

    const { activeTab, setActiveTab } = useActiveCollectionTab();
    const { view, setView } = useCollectionView();
    const collectionFilters = useCollectionFilters();
    const [selectedItem, setSelectedItem] = useState<BggCollectionItem | null>(null);
    const [batchRate, setBatchRate] = useState<boolean>(false);

    const mathTrade = useOLWLGMathTrade({ username, collection, initialMathTradeGeeklistId });
    const tradeSelection = useTradeSelection({
        collection,
        activeGeekListId: mathTrade.activeGeekListId,
        geeklist: mathTrade.geeklist,
        geeklistData: mathTrade.geeklistData,
        submitMathTrade: mathTrade.submitMathTrade,
    });

    const {
        reduxItems,
        state,
        isRefreshing,
        refreshCollection,
        refreshError,
        clearRefreshError,
        announceText,
    } = useCollectionData({ username });

    const allGames = useAllGamesFilter({ items: reduxItems, makeFilterFn: collectionFilters.makeFilterFn });
    const notInCollection = useNotInCollectionFilter({
        status: state.status,
        collectionItems: reduxItems,
        filters: collectionFilters.filters,
    });
    const addSelection = useAddToCollectionSelection(notInCollection.notInCollectionItems);
    const tradeActions = useCollectionTradeActions({ mathTrade, tradeSelection });

    const show = getCollectionPageFlags({
        isAllGamesTab: activeTab === CollectionTabs.ALL_GAMES,
        isLoaded: state.status === CollectionLoadStatuses.LOADED,
        displayCount: allGames.filter.displayItems.length,
        canBatchAdd: addSelection.canBatch,
        mathTradeMode: mathTrade.mathTradeMode,
        syncOn,
        tradeMode,
    });

    const bggSearch = useCollectionBggSearch({
        searchText: collectionFilters.filters.searchText,
        searchMode: collectionFilters.filters.searchMode,
        enabled: show.bggSearch,
        collection,
        isShownIgnoringName: allGames.isShownIgnoringName,
        subType: allGames.subType,
    });
    const { clearFiltersKeepSearch } = collectionFilters;
    const { resetGamesAndExpansionsMode } = allGames;
    const clearFiltersForBggSearch = useCallback(() => {
        clearFiltersKeepSearch();
        resetGamesAndExpansionsMode();
    }, [clearFiltersKeepSearch, resetGamesAndExpansionsMode]);

    const { sentinelRef, sectionRef, stickyTop } = useStickyBar(show.stickyBar);

    const modeMap = useMemo(() => ({
        batchRating: view === CollectionViews.LARGE_GRID && syncOn && batchRate,
    }), [syncOn, batchRate, view]);

    // filter and saved-preset props shared by both tabs
    const filterProps = {
        filters: collectionFilters.filters,
        setFilter: collectionFilters.setFilter,
        hasActiveFilters: collectionFilters.hasActiveFilters,
        resetFilters: collectionFilters.resetFilters,
        savedFilters: collectionFilters.savedFilters,
        onSaveFilters: collectionFilters.saveFilterPreset,
        onLoadFilter: collectionFilters.loadFilterPreset,
        onRenameFilter: collectionFilters.renameFilterPreset,
        onDeleteFilter: collectionFilters.deleteFilterPreset,
        onDuplicateFilter: collectionFilters.duplicateFilterPreset,
    };

    let tabContent = <AllGamesContent
        state={state}
        sentinelRef={sentinelRef}
        stickyTop={stickyTop}
        view={view}
        modeMap={modeMap}
        scannedSet={allGames.scannedSet}
        verifiedSet={allGames.verifiedSet}
        sortFields={allGames.sortFields}
        sortField={allGames.filter.sortField}
        sortDirection={allGames.filter.sortDirection}
        onSortClick={allGames.filter.handleSortClick}
        displayItems={allGames.filter.displayItems}
        {...filterProps}
        refreshCollection={refreshCollection}
        onSelectItem={setSelectedItem}
        mathTradeSelectedIds={tradeSelection.selectedMathTradeIds}
        onMathTradeToggle={tradeSelection.handleMathTradeToggle}
        emptyContent={show.noDisplayItems && <BggSearchResults
            query={bggSearch.query}
            search={bggSearch.search}
            prepared={bggSearch.prepared}
            view={view}
            scannedSet={allGames.scannedSet}
            verifiedSet={allGames.verifiedSet}
            onSelectItem={setSelectedItem}
            mathTradeSelectedIds={tradeSelection.selectedMathTradeIds}
            onMathTradeToggle={tradeSelection.handleMathTradeToggle}
            onClearFilters={clearFiltersForBggSearch}
            modeMap={modeMap}
        />}
    />;
    if (activeTab === CollectionTabs.NOT_IN_COLLECTION) {
        tabContent = <NotInCollectionContent
            collectionHasData={notInCollection.collectionHasData}
            username={username ?? ''}
            isRefreshing={isRefreshing}
            refreshCollection={refreshCollection}
            view={view}
            notInCollectionItems={notInCollection.notInCollectionItems}
            scanHistoryLength={notInCollection.scanHistoryLength}
            sortFields={notInCollection.sortFields}
            sortField={notInCollection.filter.sortField}
            sortDirection={notInCollection.filter.sortDirection}
            onSortClick={notInCollection.filter.handleSortClick}
            displayItems={notInCollection.filter.displayItems}
            {...filterProps}
            selectionMode={addSelection.selectionMode}
            selectedIds={addSelection.selectedIds}
            onToggleSelection={addSelection.toggleSelection}
        />;
    }

    return (
        <>
            <NavDrawer />
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {announceText}
            </div>
            <div className="page-content w-full pt-15 flex justify-center">
                <div className="w-12/12 md:w-11/12 p-3 xs:p-2 md:p-4 pb-10 rounded-xl bg-base-100 text-sm">
                    <CollectionHeader
                        heading={heading}
                        activeTab={activeTab}
                        gamesAndExpansionsMode={allGames.gamesAndExpansionsMode}
                        onCycleGamesAndExpansions={allGames.cycleGamesAndExpansionsMode}
                        canRefresh={!!username}
                        isRefreshing={isRefreshing}
                        onRefresh={() => refreshCollection()}
                        canBatchRate={show.canBatchRate}
                        batchRate={batchRate}
                        onToggleBatchRate={() => {
                            setView(CollectionViews.LARGE_GRID);
                            setBatchRate(!batchRate);
                        }}
                        view={view}
                        setView={setView}
                    />
                    {mathTrade.mathTradeMode && (
                        <MathTradeGeeklistBar
                            activeGeekListId={mathTrade.activeGeekListId}
                            allGeekLists={mathTrade.allGeekLists}
                            isRefreshingGeeklist={mathTrade.isRefreshingGeeklist}
                            onRefreshGeeklist={() => void mathTrade.handleRefreshGeeklist()}
                            onSelectGeeklist={tradeActions.selectGeeklist}
                            onLoadAnother={() => mathTrade.setShowMathTradeDialog(true)}
                        />
                    )}

                    <CollectionTabList activeTab={activeTab} setActiveTab={setActiveTab} />

                    <Suspense>
                        <BggCollectionForm />
                    </Suspense>
                    {show.addToCollectionBar && (
                        <AddToCollectionBar
                            selectionMode={addSelection.selectionMode}
                            selectedCount={addSelection.selectedIds.size}
                            isAdding={addSelection.isAdding}
                            onToggleSelectionMode={addSelection.toggleSelectionMode}
                            onRequestAdd={addSelection.requestAdd}
                        />
                    )}
                    {show.tradeActionBar && (
                        <TradeActionBar
                            mode={tradeMode}
                            selectedCount={tradeSelection.selectedMathTradeIds.size}
                            actionableCount={tradeSelection.actionableTradeItemsCount}
                            isBusy={tradeActions.isTradeActionBusy}
                            onAction={tradeActions.runTradeAction}
                        />
                    )}
                    {username && <section
                        ref={sectionRef}
                        id={getPanelId(activeTab)}
                        role="tabpanel"
                        aria-labelledby={getTabId(activeTab)}
                        className="w-full bg-[#f1eff9] dark:bg-green-800 rounded-md p-2 pt-0"
                    >
                        {tabContent}
                    </section>}
                </div>
            </div>
            <CollectionOverlays
                refreshError={refreshError}
                onDismissRefreshError={clearRefreshError}
                selectedItem={selectedItem}
                onCloseItem={() => setSelectedItem(null)}
                onGeeklistLoaded={tradeActions.openGeeklist}
                mathTrade={mathTrade}
                tradeSelection={tradeSelection}
                addSelection={addSelection}
            />
        </>
    );
};
