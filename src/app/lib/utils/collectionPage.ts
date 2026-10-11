import { type TradeMode } from '@/app/lib/hooks/useTradeMode';

export type CollectionPageFlagsParams = {
    isAllGamesTab: boolean;
    isLoaded: boolean;
    // games shown in the All Games tab after filtering
    displayCount: number;
    canBatchAdd: boolean;
    mathTradeMode: boolean;
    syncOn: boolean;
    tradeMode: Pick<TradeMode, 'hasExport' | 'isMathTrade'>;
};

/** What the collection page shows, from its tab, load state, filters and trade mode. */
export const getCollectionPageFlags = (params: CollectionPageFlagsParams) => {
    const { isAllGamesTab, isLoaded, displayCount, canBatchAdd, mathTradeMode, syncOn, tradeMode } = params;
    const allGamesLoaded = isAllGamesTab && isLoaded;

    return {
        // the sticky filter bar follows the loaded All Games list
        stickyBar: allGamesLoaded,
        // BGG is searched when nothing in the collection matches
        bggSearch: allGamesLoaded && displayCount === 0,
        noDisplayItems: displayCount === 0,
        addToCollectionBar: canBatchAdd && !isAllGamesTab,
        // swap/trade pages always export; math trades need the extension to post
        tradeActionBar: (mathTradeMode && syncOn) || tradeMode.hasExport,
        canBatchRate: syncOn && !tradeMode.isMathTrade,
    };
};
