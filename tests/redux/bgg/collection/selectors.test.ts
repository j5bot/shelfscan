import { describe, it, expect } from '../../../setup.js';
import {
    getCollectionInfoByObjectId,
    getIndexesInCollectionFromInfos,
} from '@/app/lib/redux/bgg/collection/selectors';
import type { RootState } from '@/app/lib/redux/store';
import type {
    BggCollectionItem,
    BggCollectionMap,
    BggCollectionStatuses,
    BggObjectsByStatus,
    BggVersionsByStatus,
} from '@/app/lib/types/bgg';
import type { GameUPCBggInfo } from 'gameupc-hooks/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultStatuses: BggCollectionStatuses = {
    own: true,
    prevowned: false,
    fortrade: false,
    want: false,
    wanttoplay: false,
    wanttobuy: false,
    wishlist: false,
    preordered: false,
};

const makeCollectionItem = (
    collectionId: number,
    objectId: number,
    rating = 0,
): BggCollectionItem => ({
    objectId,
    collectionId,
    name: `Game ${objectId}`,
    yearPublished: 2020,
    subType: 'boardgame',
    statuses: { ...defaultStatuses },
    rating,
    lastModified: '',
    image: undefined,
    thumbnail: undefined,
});

const makeState = ({
    username = 'alice',
    items = {},
    objectsAll = {},
    objectsOwn = {},
    versionsAll = {},
    versionsOwn = {},
}: {
    username?: string;
    items?: BggCollectionMap;
    objectsAll?: Record<number, string[]>;
    objectsOwn?: Record<number, string[]>;
    versionsAll?: Record<number, string[]>;
    versionsOwn?: Record<number, string[]>;
} = {}): RootState =>
    ({
        bgg: {
            user: { user: username },
            collection: {
                users: {
                    [username]: {
                        items,
                        images: {},
                        objects: {
                            all: objectsAll,
                            own: objectsOwn,
                        } as unknown as BggObjectsByStatus,
                        versions: {
                            all: versionsAll,
                            own: versionsOwn,
                        } as unknown as BggVersionsByStatus,
                    },
                },
            },
        },
    }) as unknown as RootState;

const makeInfo = (
    id: number,
    versionIds: number[] = [],
): GameUPCBggInfo => ({
    id,
    name: `Game ${id}`,
    confidence: 1.0,
    thumbnail_url: '',
    page_url: '',
    image_url: '',
    data_url: '',
    update_url: '',
    version_status: 'verified',
    versions: versionIds.map(vid => ({
        name: 'Version',
        version_id: vid,
        published: 2020,
        confidence: 1.0,
        thumbnail_url: '',
        image_url: '',
        update_url: '',
        language: 'English',
    })),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('bgg/collection/selectors', () => {
    describe('#getCollectionInfoByObjectId', () => {
        it('returns an empty object when id is undefined', () => {
            const state = makeState();
            expect(getCollectionInfoByObjectId([state, undefined])).toEqual({});
        });

        it('returns an empty object when there is no collection for the current user', () => {
            const state = makeState({ username: 'nobody' });
            // State has no collection entry for 'nobody'
            const emptyUsersState = ({
                bgg: {
                    user: { user: 'nobody' },
                    collection: { users: {} },
                },
            }) as unknown as RootState;
            expect(getCollectionInfoByObjectId([emptyUsersState, 1])).toEqual({});
        });

        it('returns an empty object when the objectId is not in the collection', () => {
            const state = makeState({ objectsAll: {} });
            expect(getCollectionInfoByObjectId([state, 99])).toEqual({});
        });

        it('returns collectionId and collection when a matching item exists', () => {
            const collectionId = 10;
            const objectId = 5;
            const items = {
                [collectionId]: makeCollectionItem(collectionId, objectId),
            };
            const state = makeState({
                items,
                objectsAll: { [objectId]: [String(collectionId)] },
            });

            const result = getCollectionInfoByObjectId([state, objectId]);
            expect(result.collectionId).toBe(String(collectionId));
            expect(result.collection).toBeDefined();
        });

        it('prefers the rated item when multiple collection ids exist for the same objectId', () => {
            const objectId = 7;
            // collectionId 20 is unrated, collectionId 21 has a rating
            const items = {
                20: makeCollectionItem(20, objectId, 0),
                21: makeCollectionItem(21, objectId, 8.5),
            };
            const state = makeState({
                items,
                objectsAll: { [objectId]: ['20', '21'] },
            });

            const result = getCollectionInfoByObjectId([state, objectId]);
            expect(result.collectionId).toBe('21');
        });
    });

    describe('#getIndexesInCollectionFromInfos', () => {
        it('returns empty indexes when infos array is empty', () => {
            const state = makeState();
            const result = getIndexesInCollectionFromInfos([state, [], ['all']]);
            expect(result).toEqual({ infoIndexes: {}, versionIndexes: {} });
        });

        it('returns empty indexes when statuses array is empty', () => {
            const state = makeState();
            const result = getIndexesInCollectionFromInfos([state, [makeInfo(1)], []]);
            expect(result).toEqual({ infoIndexes: {}, versionIndexes: {} });
        });

        it('returns empty indexes when no user is set', () => {
            const noUserState = ({
                bgg: {
                    user: {},
                    collection: { users: {} },
                },
            }) as unknown as RootState;
            const result = getIndexesInCollectionFromInfos([
                noUserState,
                [makeInfo(1)],
                ['all'],
            ]);
            expect(result).toEqual({ infoIndexes: {}, versionIndexes: {} });
        });

        it('returns empty indexes when user has no collection', () => {
            const stateNoCollection = ({
                bgg: {
                    user: { user: 'alice' },
                    collection: { users: {} },
                },
            }) as unknown as RootState;
            const result = getIndexesInCollectionFromInfos([
                stateNoCollection,
                [makeInfo(1)],
                ['all'],
            ]);
            expect(result).toEqual({ infoIndexes: {}, versionIndexes: {} });
        });

        it('includes index in infoIndexes when the objectId is in the collection under the given status', () => {
            const objectId = 42;
            const collectionId = 100;
            const items = {
                [collectionId]: makeCollectionItem(collectionId, objectId),
            };
            const state = makeState({
                items,
                objectsAll: { [objectId]: [String(collectionId)] },
            });

            const result = getIndexesInCollectionFromInfos([
                state,
                [makeInfo(objectId)],
                ['all'],
            ]);
            expect(result.infoIndexes['all']).toContain(0);
        });

        it('does not include index when the objectId is not in the collection', () => {
            const state = makeState({ objectsAll: {} });
            const result = getIndexesInCollectionFromInfos([
                state,
                [makeInfo(99)],
                ['all'],
            ]);
            expect(result.infoIndexes['all'] ?? []).not.toContain(0);
        });

        it('includes version index when the versionId is in the collection', () => {
            const objectId = 55;
            const versionId = 555;
            const collectionId = 200;
            const items = {
                [collectionId]: { ...makeCollectionItem(collectionId, objectId), versionId },
            };
            const state = makeState({
                items,
                objectsAll: { [objectId]: [String(collectionId)] },
                versionsAll: { [versionId]: [String(collectionId)] },
            });

            const result = getIndexesInCollectionFromInfos([
                state,
                [makeInfo(objectId, [versionId])],
                ['all'],
            ]);
            // The version at index 0 of the info.versions array should appear in versionIndexes
            expect(result.versionIndexes['all']).toContain(0);
        });

        it('handles multiple infos and returns correct indexes', () => {
            const objectId1 = 10;
            const objectId2 = 20;
            const collectionId1 = 1;
            const collectionId2 = 2;
            const items = {
                [collectionId1]: makeCollectionItem(collectionId1, objectId1),
                [collectionId2]: makeCollectionItem(collectionId2, objectId2),
            };
            const state = makeState({
                items,
                objectsAll: {
                    [objectId1]: [String(collectionId1)],
                    [objectId2]: [String(collectionId2)],
                },
            });

            const result = getIndexesInCollectionFromInfos([
                state,
                [makeInfo(objectId1), makeInfo(objectId2)],
                ['all'],
            ]);
            expect(result.infoIndexes['all']).toContain(0);
            expect(result.infoIndexes['all']).toContain(1);
        });
    });
});
