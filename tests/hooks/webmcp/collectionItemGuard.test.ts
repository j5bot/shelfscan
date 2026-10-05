import { describe, it, expect, beforeEach } from '../../setup';
import { vi } from 'vitest';
import { getMatchingCollectionItem } from '@/app/lib/hooks/webmcp/extension/collectionItemGuard';
import { updateCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { setBggUser } from '@/app/lib/redux/bgg/user/slice';
import { makeStore } from '@/app/lib/redux/store';
import { BggCollectionItem } from '@/app/lib/types/bgg';

// updateCollectionItems persists the collection; keep IndexedDB out of the test
vi.mock('@/app/lib/database/database', () => ({
    setCollection: vi.fn().mockResolvedValue(undefined),
    database: {},
    getPlugin: vi.fn(),
    getSetting: vi.fn(),
}));

const ARK_NOVA: BggCollectionItem = {
    objectId: 342942,
    collectionId: 150072898,
    name: 'Ark Nova',
    subType: 'boardgame',
    image: undefined,
    thumbnail: undefined,
    yearPublished: 2021,
    statuses: {
        own: true, prevowned: false, fortrade: false, want: false,
        wanttoplay: false, wanttobuy: false, wishlist: false, preordered: false,
    },
} as BggCollectionItem;

describe('getMatchingCollectionItem', () => {
    let store: ReturnType<typeof makeStore>;

    beforeEach(() => {
        store = makeStore();
    });

    const loadArkNova = () => {
        store.dispatch(setBggUser({ user: 'ShelfScan', id: '4317241' }));
        store.dispatch(updateCollectionItems({ username: 'shelfscan', items: { [ARK_NOVA.collectionId]: ARK_NOVA } }));
    };

    it('refuses when no collection is loaded', () => {
        expect(() => getMatchingCollectionItem(store.getState(), ARK_NOVA.collectionId, 342942))
            .toThrow(/No BGG collection is loaded/);
    });

    it('refuses a collection id that is not in the loaded collection', () => {
        loadArkNova();
        expect(() => getMatchingCollectionItem(store.getState(), 1, 342942))
            .toThrow(/Collection item 1 is not in the loaded collection/);
    });

    it('refuses a collection id that belongs to another game', () => {
        loadArkNova();
        expect(() => getMatchingCollectionItem(store.getState(), ARK_NOVA.collectionId, 13))
            .toThrow(/is Ark Nova \(BGG game 342942\), not BGG game 13; nothing was changed/);
    });

    it('returns the item when the collection id and game match', () => {
        loadArkNova();
        expect(getMatchingCollectionItem(store.getState(), ARK_NOVA.collectionId, 342942).name).toBe('Ark Nova');
    });
});
