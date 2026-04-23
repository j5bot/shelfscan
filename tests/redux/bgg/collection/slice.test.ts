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
}> = {}): BggCollectionMap => {
    const {
        objectId = 1,
        collectionId = 10,
        name = 'Test Game',
        versionId = undefined,
        own = true,
        fortrade = false,
    } = overrides;

    return {
        [collectionId]: {
            objectId,
            collectionId,
            name,
            yearPublished: 2020,
            subType: 'boardgame',
            ...(versionId !== undefined ? { versionId } : {}),
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

            expect(nextState.users['carol'].objects.all[5]).toContain('50');
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

            expect(nextState.users['dave'].objects.own[6]).toContain('60');
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

            expect(nextState.users['frank'].versions.all[800]).toContain('80');
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
});
