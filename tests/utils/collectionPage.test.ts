import { describe, it, expect } from '../setup';
import { getCollectionPageFlags } from '@/app/lib/utils/collectionPage';

const base = {
    isAllGamesTab: true,
    isLoaded: true,
    displayCount: 3,
    canBatchAdd: false,
    mathTradeMode: false,
    syncOn: true,
    tradeMode: { hasExport: false, isMathTrade: false },
};

describe('getCollectionPageFlags', () => {
    it('sticks the filter bar to the loaded All Games list', () => {
        expect(getCollectionPageFlags(base).stickyBar).toBe(true);
        expect(getCollectionPageFlags({ ...base, isLoaded: false }).stickyBar).toBe(false);
        expect(getCollectionPageFlags({ ...base, isAllGamesTab: false }).stickyBar).toBe(false);
    });

    it('searches BGG only when the loaded All Games list is empty', () => {
        expect(getCollectionPageFlags(base).bggSearch).toBe(false);
        expect(getCollectionPageFlags({ ...base, displayCount: 0 }).bggSearch).toBe(true);
        expect(getCollectionPageFlags({ ...base, displayCount: 0, isLoaded: false }).bggSearch).toBe(false);
        expect(getCollectionPageFlags({ ...base, displayCount: 0, isAllGamesTab: false }).bggSearch).toBe(false);
    });

    it('notes when nothing is shown', () => {
        expect(getCollectionPageFlags({ ...base, displayCount: 0 }).noDisplayItems).toBe(true);
        expect(getCollectionPageFlags(base).noDisplayItems).toBe(false);
    });

    it('shows the add-to-collection bar on the Not in Collection tab when items can be added', () => {
        expect(getCollectionPageFlags({ ...base, isAllGamesTab: false, canBatchAdd: true }).addToCollectionBar).toBe(true);
        expect(getCollectionPageFlags({ ...base, canBatchAdd: true }).addToCollectionBar).toBe(false);
        expect(getCollectionPageFlags({ ...base, isAllGamesTab: false }).addToCollectionBar).toBe(false);
    });

    it('shows the trade action bar on export pages, or in math trade mode with the extension', () => {
        expect(getCollectionPageFlags(base).tradeActionBar).toBe(false);
        expect(getCollectionPageFlags({ ...base, tradeMode: { hasExport: true, isMathTrade: false } }).tradeActionBar).toBe(true);
        expect(getCollectionPageFlags({ ...base, mathTradeMode: true }).tradeActionBar).toBe(true);
        expect(getCollectionPageFlags({ ...base, mathTradeMode: true, syncOn: false }).tradeActionBar).toBe(false);
    });

    it('allows batch rating with the extension, outside math trades', () => {
        expect(getCollectionPageFlags(base).canBatchRate).toBe(true);
        expect(getCollectionPageFlags({ ...base, syncOn: false }).canBatchRate).toBe(false);
        expect(getCollectionPageFlags({ ...base, tradeMode: { hasExport: false, isMathTrade: true } }).canBatchRate).toBe(false);
    });
});
