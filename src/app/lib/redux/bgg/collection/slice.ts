'use client';

import { setCollection, updateCollectionItemNumPlays } from '@/app/lib/database/database';
import {
    BggCollection,
    BggCollectionMap,
    BggItemTagMap,
    BggObjectsByStatus,
    BggTagMap,
    BggVersionsByStatus,
    PossibleStatuses
} from '@/app/lib/types/bgg';
import {
    conditionalAddToArray,
    removeAndDeletePropertyIfArrayEmpty,
} from '@/app/lib/utils/array';
import { createSlice, current, PayloadAction } from '@reduxjs/toolkit';

const innerUpdateCollectionItems = (
    state: BggCollection,
    payload: {
        items: BggCollectionMap;
        remove: boolean;
        extend?: boolean;
    },
) => {
    const { items, remove, extend } = payload;
    const ids = Object.keys(items);

    for (const stringId of ids) {
        const id = parseInt(stringId, 10);
        const item = items[id];
        const previousItem = state.items[id] ?? {};

        const {
            objectId,
            versionId,
            statuses,
            comment,
            wishlistcomment,
            collectionId,
            haspartslist,
            wantpartslist,
        } = item;

        const {
            versionId: previousVersionId,
            statuses: previousStatuses,
            comment: previousComment,
            wishlistcomment: previousWishlistComment,
            haspartslist: previousHaspartslist,
            wantpartslist: previousWantpartslist,
        } = previousItem;

        PossibleStatuses.forEach(status => {
            const statusObjects = state.objects[status] ?? {};
            const statusVersions = state.versions[status] ?? {};
            if (!statuses[status] || remove) {
                if (previousStatuses?.[status] || statusObjects[objectId]?.includes(id)) {
                    removeAndDeletePropertyIfArrayEmpty(id, statusObjects, objectId);
                    state.objects[status] = statusObjects;
                }
                if (versionId && statusVersions[versionId]?.includes(id)) {
                    removeAndDeletePropertyIfArrayEmpty(id, statusVersions, versionId);
                    state.versions[status] = statusVersions;
                }
                if (previousVersionId) {
                    removeAndDeletePropertyIfArrayEmpty(id, statusVersions, previousVersionId);
                    state.versions[status] = statusVersions;
                }
            } else {
                statusObjects[objectId] = conditionalAddToArray(id, statusObjects[objectId]);
                state.objects[status] = statusObjects;

                if (!versionId) {
                    if (previousVersionId) {
                        removeAndDeletePropertyIfArrayEmpty(id, statusVersions, previousVersionId);
                        state.versions[status] = statusVersions;
                    }
                } else {
                    statusVersions[versionId] = conditionalAddToArray(id, statusVersions[versionId]);
                    state.versions[status] = statusVersions;
                }
            }
        });

        const allObjects = state.objects.all ?? {};
        const allVersions = state.versions.all ?? {};

        if (remove) {
            removeAndDeletePropertyIfArrayEmpty(id, allObjects, objectId);
            if (versionId) {
                removeAndDeletePropertyIfArrayEmpty(id, allVersions, versionId);
            }
            delete state.items[id];
        } else {
            allObjects[objectId] = conditionalAddToArray(id, allObjects[objectId]);
            if (versionId) {
                allVersions[versionId] = conditionalAddToArray(id, allVersions[versionId]);
            }
            const nextItem = extend ? { ...state.items[id], ...item } : { ...item };
            if (previousItem.subType === 'boardgameexpansion' && nextItem.subType === 'boardgame') {
                nextItem.subType = previousItem.subType;
            }
            state.items[id] = nextItem;
        }
        state.objects.all = allObjects;
        state.versions.all = allVersions;

        // Tags: extract hashtags from comments and parts and update tag map
        const tagMap: BggTagMap = state.tags ?? {};
        const tagsByItem: BggItemTagMap = state.tagsByItem ?? {};

        const previousTagContainers = [
            previousComment,
            previousWishlistComment,
            previousHaspartslist,
            previousWantpartslist
        ];
        const tagContainers = [
            comment,
            wishlistcomment,
            haspartslist,
            wantpartslist
        ];

        previousTagContainers.forEach(container => {
            if (!container) {
                return;
            }
            const tags = extractHashtags(container);
            tags.forEach(tag => {
                const ids = tagMap[tag];
                if (ids) {
                    const idx = ids.indexOf(collectionId);
                    if (idx !== -1) { ids.splice(idx, 1); }
                    if (ids.length === 0) { delete tagMap[tag]; }
                }
            })
        })

        if (!remove) {
            tagContainers.forEach(container => {
                if (!container) {
                    return;
                }
                const tags = extractHashtags(container);
                tags.forEach(tag => {
                    if (!tagMap[tag]) {
                        tagMap[tag] = [];
                    }
                    if (!tagMap[tag].includes(collectionId)) {
                        tagMap[tag].push(collectionId);
                    }
                });
            })
        }

        // Keep the inverted, display-ready view in sync with the forward map: of
        // every tag this item touched, keep the ones the forward map still lists
        // it under, then drop bare prefixes covered by a value tag.
        if (remove) {
            delete tagsByItem[collectionId];
        } else {
            const candidateTags = new Set<string>();
            [...previousTagContainers, ...tagContainers].forEach(container => {
                if (!container) {
                    return;
                }
                extractHashtags(container).forEach(tag => candidateTags.add(tag));
            });
            const itemTags = Array.from(candidateTags).filter(
                tag => tagMap[tag]?.includes(collectionId),
            );
            if (itemTags.length > 0) {
                tagsByItem[collectionId] = stripRedundantPrefixTags(itemTags);
            } else {
                delete tagsByItem[collectionId];
            }
        }

        state.tags = tagMap;
        state.tagsByItem = tagsByItem;
    }
    return state.items;
};

// Matches plain hashtags (#PnP) and "value tags" (#best-at=2, #best-at=5+),
// where the part before `=` is registered as its own tag and the whole string
// as another.
const HASHTAG_PATTERN = /#[\w-]+(?:=[\w#+-]+)?/g;

const extractHashtags = (text: string): string[] => {
    const matches = text.match(HASHTAG_PATTERN);
    if (!matches) {
        return [];
    }
    const tags = new Set<string>();
    matches.forEach(match => {
        const tag = match.toLowerCase();
        tags.add(tag);
        const eqIndex = tag.indexOf('=');
        if (eqIndex !== -1) {
            tags.add(tag.slice(0, eqIndex));
        }
    });
    return Array.from(tags);
};

// Sorted tag list with bare prefixes dropped when a value tag covers them, so an
// item tagged `#best-at=2` shows just that rather than `#best-at #best-at=2`.
const stripRedundantPrefixTags = (tags: string[]): string[] => {
    const valuePrefixes = new Set(
        tags.filter(tag => tag.includes('=')).map(tag => tag.slice(0, tag.indexOf('='))),
    );
    return tags
        .filter(tag => tag.includes('=') || !valuePrefixes.has(tag))
        .sort();
};

export type BggCollectionSliceState = {
    users: Record<string, BggCollection>;
};

const SLICE_TITLE = 'BGG_COLLECTION';

const initialState: BggCollectionSliceState = {
    users: {},
};

export const bggCollectionSlice = createSlice({
    name: `${SLICE_TITLE}_SLICE`,
    initialState,
    reducers: {
        updateCollectionItems: (
            state,
            action: PayloadAction<{
                username: string;
                items: BggCollectionMap;
                update?: boolean;
                remove?: boolean;
                extend?: boolean;
            }>,
        ) => {
            const { username: user, items, update = false, remove = false, extend = false } = action.payload;
            const username = user.toLowerCase();

            if (!update) {
                state.users[username] = {
                    items: {},
                    images: {},
                    objects: {} as BggObjectsByStatus,
                    versions: {} as BggVersionsByStatus,
                    tags: {},
                    tagsByItem: {},
                };
            }
            innerUpdateCollectionItems(state.users[username], { items, remove, extend });
            const newState =
                current<BggCollectionSliceState>(state);

            setCollection(
                username,
                newState?.users[username].items
            ).then();
        },
        updateNumPlays: (
            state,
            action: PayloadAction<{
                username: string;
                collectionId: number;
                numplays: number;
            }>,
        ) => {
            const { username: user, collectionId, numplays } = action.payload;
            const username = user.toLowerCase();
            const item = state.users[username]?.items[collectionId];
            if (!item) {
                return;
            }
            item.plays = numplays;
            updateCollectionItemNumPlays(username, collectionId, numplays).then();
        },
    },
});

export const {
    updateCollectionItems,
    updateNumPlays,
} = bggCollectionSlice.actions;

export default bggCollectionSlice.reducer;
