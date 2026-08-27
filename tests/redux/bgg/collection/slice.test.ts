import { describe, it, expect, beforeEach } from '../../../setup.js';
import { vi } from 'vitest';
import collectionReducer, {
    updateCollectionItems,
} from '@/app/lib/redux/bgg/collection/slice';
import type { BggCollectionSliceState } from '@/app/lib/redux/bgg/collection/slice';
import type { BggCollectionMap } from '@/app/lib/types/bgg';

// Mock the database module so no IndexedDB calls are made
vi.mock('@/app/lib/database/database', () => ({
    setCollection: vi.fn().mockResolvedValue(undefined),
    database: {},
    getPlugin: vi.fn(),
    getSetting: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeItem = (overrides: Partial<{
    objectId: number;
    collectionId: number;
    name: string;
    versionId: number;
    own: boolean;
    fortrade: boolean;
    image: string;
    thumbnail: string;
    lastModified: string;
    subType: string;
}> = {}): BggCollectionMap => {
    const {
        objectId = 1,
        collectionId = 10,
        name = 'Test Game',
        versionId = undefined,
        own = true,
        fortrade = false,
        image = undefined,
        thumbnail = undefined,
        lastModified = new Date().toISOString(),
        subType = 'boardgame',
    } = overrides;

    return {
        [collectionId]: {
            objectId,
            collectionId,
            name,
            image,
            thumbnail,
            lastModified,
            yearPublished: 2020,
            subType,
            ...(Number.isInteger(versionId) ? { versionId } : {}),
            statuses: {
                own,
                prevowned: false,
                fortrade,
                want: false,
                wanttoplay: false,
                wanttobuy: false,
                wishlist: false,
                preordered: false,
            },
        },
    };
};

const emptyState = (): BggCollectionSliceState => ({ users: {} });

describe('bgg/collection/slice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('#updateCollectionItems (initial load — update=false)', () => {
        it('creates a user entry and adds items on the first load', () => {
            const state = emptyState();
            const items = makeItem({ objectId: 1, collectionId: 10 });

            const nextState = collectionReducer(
                state,
                updateCollectionItems({ username: 'alice', items }),
            );

            expect(nextState.users['alice']).toBeDefined();
            expect(nextState.users['alice'].items[10]).toBeDefined();
        });

        it('lowercases the username', () => {
            const state = emptyState();
            const nextState = collectionReducer(
                state,
                updateCollectionItems({ username: 'Alice', items: makeItem() }),
            );
            expect(nextState.users['alice']).toBeDefined();
            expect(nextState.users['Alice']).toBeUndefined();
        });

        it('replaces the existing collection on a non-update load', () => {
            // First load
            const after1 = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'bob',
                    items: makeItem({ objectId: 1, collectionId: 10 }),
                }),
            );

            // Second full reload with a different item
            const after2 = collectionReducer(
                after1,
                updateCollectionItems({
                    username: 'bob',
                    items: makeItem({ objectId: 2, collectionId: 20 }),
                    update: false,
                }),
            );

            // The first item should be gone, the new one present
            expect(after2.users['bob'].items[10]).toBeUndefined();
            expect(after2.users['bob'].items[20]).toBeDefined();
        });
    });

    describe('#updateCollectionItems object-index maps', () => {
        it('adds the collectionId to the objects.all map indexed by objectId', () => {
            const state = emptyState();
            const nextState = collectionReducer(
                state,
                updateCollectionItems({
                    username: 'carol',
                    items: makeItem({ objectId: 5, collectionId: 50 }),
                }),
            );

            expect(nextState.users['carol'].objects.all[5]).toContain(50);
        });

        it('adds the collectionId to the objects[status] map when status is active', () => {
            const state = emptyState();
            const nextState = collectionReducer(
                state,
                updateCollectionItems({
                    username: 'dave',
                    items: makeItem({ objectId: 6, collectionId: 60, own: true }),
                }),
            );

            expect(nextState.users['dave'].objects.own[6]).toContain(60);
        });

        it('does not add to status map when status is false', () => {
            const state = emptyState();
            const nextState = collectionReducer(
                state,
                updateCollectionItems({
                    username: 'eve',
                    items: makeItem({ objectId: 7, collectionId: 70, own: false }),
                }),
            );

            expect(nextState.users['eve'].objects.own?.[7]).toBeUndefined();
        });
    });

    describe('#updateCollectionItems version-index maps', () => {
        it('adds the collectionId to versions.all when a versionId is present', () => {
            const state = emptyState();
            const nextState = collectionReducer(
                state,
                updateCollectionItems({
                    username: 'frank',
                    items: makeItem({ objectId: 8, collectionId: 80, versionId: 800 }),
                }),
            );

            expect(nextState.users['frank'].versions.all[800]).toContain(80);
        });

        it('does not add to versions.all when there is no versionId', () => {
            const state = emptyState();
            const nextState = collectionReducer(
                state,
                updateCollectionItems({
                    username: 'grace',
                    items: makeItem({ objectId: 9, collectionId: 90 }),
                }),
            );

            // versions.all should be empty or not contain entry 90
            const allVersions = nextState.users['grace'].versions.all;
            const anyEntry = Object.values(allVersions ?? {}).flat();
            expect(anyEntry).not.toContain(90);
        });
    });

    describe('#updateCollectionItems remove=true', () => {
        it('removes an item from state.items', () => {
            const loaded = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'helen',
                    items: makeItem({ objectId: 10, collectionId: 100 }),
                }),
            );

            const removed = collectionReducer(
                loaded,
                updateCollectionItems({
                    username: 'helen',
                    items: makeItem({ objectId: 10, collectionId: 100 }),
                    update: true,
                    remove: true,
                }),
            );

            expect(removed.users['helen'].items[100]).toBeUndefined();
        });

        it('removes the collectionId from objects.all after removal', () => {
            const loaded = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'ivan',
                    items: makeItem({ objectId: 11, collectionId: 110 }),
                }),
            );

            const removed = collectionReducer(
                loaded,
                updateCollectionItems({
                    username: 'ivan',
                    items: makeItem({ objectId: 11, collectionId: 110 }),
                    update: true,
                    remove: true,
                }),
            );

            expect(removed.users['ivan'].objects.all[11]).toBeUndefined();
        });
    });

    describe('#updateCollectionItems incremental update (update=true)', () => {
        it('merges new items without wiping existing ones', () => {
            const after1 = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'judy',
                    items: makeItem({ objectId: 12, collectionId: 120 }),
                }),
            );

            const after2 = collectionReducer(
                after1,
                updateCollectionItems({
                    username: 'judy',
                    items: makeItem({ objectId: 13, collectionId: 130 }),
                    update: true,
                }),
            );

            expect(after2.users['judy'].items[120]).toBeDefined();
            expect(after2.users['judy'].items[130]).toBeDefined();
        });
    });

    describe('#updateCollectionItems expansion subType protection', () => {
        it('does not let an extended merge downgrade a boardgameexpansion item to boardgame', () => {
            const after1 = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'kim',
                    items: makeItem({ objectId: 14, collectionId: 140, subType: 'boardgameexpansion' }),
                }),
            );

            const after2 = collectionReducer(
                after1,
                updateCollectionItems({
                    username: 'kim',
                    items: makeItem({ objectId: 14, collectionId: 140, subType: 'boardgame' }),
                    update: true,
                    extend: true,
                }),
            );

            expect(after2.users['kim'].items[140].subType).toEqual('boardgameexpansion');
        });

        it('does not let a full item replacement downgrade a boardgameexpansion item to boardgame', () => {
            const after1 = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'liam',
                    items: makeItem({ objectId: 15, collectionId: 150, subType: 'boardgameexpansion' }),
                }),
            );

            const after2 = collectionReducer(
                after1,
                updateCollectionItems({
                    username: 'liam',
                    items: makeItem({ objectId: 15, collectionId: 150, subType: 'boardgame' }),
                    update: true,
                }),
            );

            expect(after2.users['liam'].items[150].subType).toEqual('boardgameexpansion');
        });

        it('still allows other fields to update when subType is protected', () => {
            const after1 = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'mona',
                    items: makeItem({ objectId: 16, collectionId: 160, subType: 'boardgameexpansion', own: true }),
                }),
            );

            const after2 = collectionReducer(
                after1,
                updateCollectionItems({
                    username: 'mona',
                    items: makeItem({ objectId: 16, collectionId: 160, subType: 'boardgame', own: false, fortrade: true }),
                    update: true,
                    extend: true,
                }),
            );

            expect(after2.users['mona'].items[160].subType).toEqual('boardgameexpansion');
            expect(after2.users['mona'].items[160].statuses.fortrade).toBe(true);
        });
    });

    describe('#updateCollectionItems tag map', () => {
        const itemWithComment = (
            comment: string,
            overrides: Parameters<typeof makeItem>[0] = {},
        ): BggCollectionMap => {
            const base = makeItem(overrides);
            const [collectionId] = Object.keys(base);
            base[Number(collectionId)].comment = comment;
            return base;
        };

        it('indexes plain hashtags from an item comment', () => {
            const nextState = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'nora',
                    items: itemWithComment('#PnP #Review', { objectId: 1, collectionId: 10 }),
                }),
            );

            expect(nextState.users['nora'].tags['#pnp']).toEqual([10]);
            expect(nextState.users['nora'].tags['#review']).toEqual([10]);
        });

        it('registers a value tag under both its prefix and its full string', () => {
            const nextState = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'omar',
                    items: itemWithComment('#best-at=2', { objectId: 1, collectionId: 10 }),
                }),
            );

            expect(nextState.users['omar'].tags['#best-at']).toEqual([10]);
            expect(nextState.users['omar'].tags['#best-at=2']).toEqual([10]);
        });

        it('keeps a trailing + in a value tag suffix', () => {
            const nextState = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'rex',
                    items: itemWithComment('#best-at=5+', { objectId: 1, collectionId: 10 }),
                }),
            );

            expect(nextState.users['rex'].tags['#best-at']).toEqual([10]);
            expect(nextState.users['rex'].tags['#best-at=5+']).toEqual([10]);
        });

        it('groups differing values of the same prefix under one prefix tag', () => {
            const after1 = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'pam',
                    items: itemWithComment('#best-at=2', { objectId: 1, collectionId: 10 }),
                }),
            );
            const after2 = collectionReducer(
                after1,
                updateCollectionItems({
                    username: 'pam',
                    items: itemWithComment('#best-at=4', { objectId: 2, collectionId: 20 }),
                    update: true,
                }),
            );

            expect(after2.users['pam'].tags['#best-at']).toEqual([10, 20]);
            expect(after2.users['pam'].tags['#best-at=2']).toEqual([10]);
            expect(after2.users['pam'].tags['#best-at=4']).toEqual([20]);
        });

        it('drops the value tag when the comment changes but keeps a still-referenced prefix', () => {
            const after1 = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'quinn',
                    items: itemWithComment('#best-at=2', { objectId: 1, collectionId: 10 }),
                }),
            );
            const after2 = collectionReducer(
                after1,
                updateCollectionItems({
                    username: 'quinn',
                    items: itemWithComment('#best-at=4', { objectId: 1, collectionId: 10 }),
                    update: true,
                    extend: true,
                }),
            );

            expect(after2.users['quinn'].tags['#best-at=2']).toBeUndefined();
            expect(after2.users['quinn'].tags['#best-at=4']).toEqual([10]);
            expect(after2.users['quinn'].tags['#best-at']).toEqual([10]);
        });
    });

    describe('#updateCollectionItems tagsByItem (inverted view)', () => {
        const itemWithComment = (
            comment: string,
            overrides: Parameters<typeof makeItem>[0] = {},
        ): BggCollectionMap => {
            const base = makeItem(overrides);
            const [collectionId] = Object.keys(base);
            base[Number(collectionId)].comment = comment;
            return base;
        };

        it('stores a sorted per-item tag list', () => {
            const nextState = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'sam',
                    items: itemWithComment('#Review #PnP', { objectId: 1, collectionId: 10 }),
                }),
            );

            expect(nextState.users['sam'].tagsByItem[10]).toEqual(['#pnp', '#review']);
        });

        it('drops the bare prefix when the item also carries a value tag for it', () => {
            const nextState = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'tess',
                    items: itemWithComment('#pnp #best-at=2', { objectId: 1, collectionId: 10 }),
                }),
            );

            expect(nextState.users['tess'].tagsByItem[10]).toEqual(['#best-at=2', '#pnp']);
        });

        it('keeps a bare prefix tag with no matching value tag', () => {
            const nextState = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'uma',
                    items: itemWithComment('#best-at #pnp', { objectId: 1, collectionId: 10 }),
                }),
            );

            expect(nextState.users['uma'].tagsByItem[10]).toEqual(['#best-at', '#pnp']);
        });

        it('updates the entry when the comment changes and clears it when tags are gone', () => {
            const after1 = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'vic',
                    items: itemWithComment('#best-at=2', { objectId: 1, collectionId: 10 }),
                }),
            );
            expect(after1.users['vic'].tagsByItem[10]).toEqual(['#best-at=2']);

            const after2 = collectionReducer(
                after1,
                updateCollectionItems({
                    username: 'vic',
                    items: itemWithComment('#best-at=4', { objectId: 1, collectionId: 10 }),
                    update: true,
                    extend: true,
                }),
            );
            expect(after2.users['vic'].tagsByItem[10]).toEqual(['#best-at=4']);

            const after3 = collectionReducer(
                after2,
                updateCollectionItems({
                    username: 'vic',
                    items: itemWithComment('no tags here', { objectId: 1, collectionId: 10 }),
                    update: true,
                    extend: true,
                }),
            );
            expect(after3.users['vic'].tagsByItem[10]).toBeUndefined();
        });

        it('removes the item entry when the item is removed', () => {
            const after1 = collectionReducer(
                emptyState(),
                updateCollectionItems({
                    username: 'wes',
                    items: itemWithComment('#pnp', { objectId: 1, collectionId: 10 }),
                }),
            );
            expect(after1.users['wes'].tagsByItem[10]).toEqual(['#pnp']);

            const after2 = collectionReducer(
                after1,
                updateCollectionItems({
                    username: 'wes',
                    items: itemWithComment('#pnp', { objectId: 1, collectionId: 10 }),
                    update: true,
                    remove: true,
                }),
            );
            expect(after2.users['wes'].tagsByItem[10]).toBeUndefined();
        });
    });
});
