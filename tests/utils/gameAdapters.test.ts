import { describe, it, expect } from '../setup';
import { PossibleStatuses } from '@/app/lib/types/bgg';
import { bggSearchResultToCollectionItem, collectionItemToGameUPCInfo } from '@/app/lib/utils/gameAdapters';

describe('bggSearchResultToCollectionItem', () => {
    const item = bggSearchResultToCollectionItem({
        objectId: 822,
        name: 'Carcassonne',
        subType: 'boardgame',
        yearPublished: 2000,
        imageId: 8621446,
        source: 'extension',
    });

    it('keeps the game id, name, type and year', () => {
        expect(item).toMatchObject({ objectId: 822, name: 'Carcassonne', subType: 'boardgame', yearPublished: 2000 });
    });

    it('has a falsy collection id, so collection-only UI stays off', () => {
        expect(item.collectionId).toBe(0);
        expect(!!item.collectionId).toBe(false);
    });

    it('has every status, all false', () => {
        expect(Object.keys(item.statuses).sort()).toEqual([...PossibleStatuses].sort());
        expect(Object.values(item.statuses).every(status => !status)).toBe(true);
    });

    it('has no image, rating, plays or version', () => {
        expect(item.image).toBeUndefined();
        expect(item.thumbnail).toBeUndefined();
        expect(item.rating).toBeUndefined();
        expect(item.plays).toBeUndefined();
        expect(item.version).toBeUndefined();
        expect(item.lastModified).toBe('');
    });

    it('adapts to GameUPC info for the item modal without versions', () => {
        const info = collectionItemToGameUPCInfo(item);
        expect(info).toMatchObject({ id: 822, name: 'Carcassonne', collectionId: 0, versions: [] });
    });
});
