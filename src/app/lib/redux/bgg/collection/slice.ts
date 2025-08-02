import { setCollection } from '@/app/lib/database/database';
import {
    BggCollection,
    BggCollectionMap,
    BggObjectsByStatus, BggVersionsByStatus,
    PossibleStatuses
} from '@/app/lib/types/bgg';
import { conditionalAddToArray, removeFromArray } from '@/app/lib/utils/array';
import { createSlice, current, PayloadAction } from '@reduxjs/toolkit';

/*
 We'll be storing state for a user's collection as
 - the raw items, by collection id
 - a map of <image id, collection id[]>
 - a map of <version id, collection id[]>
 - a map of <object id, collection id[]>

 on update of a collection item, we'll update the related maps
 if the image id has changed, we'll remove the item from the previous image id map
 if the version id has changed, we'll remove the item from the previous version id map
 the object id won't ever change
 */
const innerUpdateCollectionItems = (
    state: BggCollection,
    payload: BggCollectionMap,
) => {
    const ids = (Object.keys(payload) as unknown[]) as number[];
    for (const id of ids) {
        const item = payload[id];
        const previousItem = state.items[id] ?? {};

        const {
            objectId,
            versionId,
            statuses,
        } = item;

        const {
            versionId: previousVersionId,
            statuses: previousStatuses,
        } = previousItem;

        PossibleStatuses.forEach(status => {
            const statusObjects = state.objects[status] ?? {};
            const statusVersions = state.versions[status] ?? {};
            if (!statuses[status]) {
                if (previousStatuses?.[status]) {
                    statusObjects[objectId] = removeFromArray(id, statusObjects[objectId]);
                    state.objects[status] = statusObjects;
                }
                if (previousVersionId) {
                    statusVersions[previousVersionId] = removeFromArray(id, statusVersions[previousVersionId]);
                    state.versions[status] = statusVersions;
                }
            } else {
                statusObjects[objectId] = conditionalAddToArray(id, statusObjects[objectId]);
                state.objects[status] = statusObjects;

                if (!versionId) {
                    if (previousVersionId) {
                        statusVersions[previousVersionId] = removeFromArray(id, statusVersions[previousVersionId]);
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
        allObjects[objectId] = conditionalAddToArray(id, allObjects[objectId]);
        state.objects.all = allObjects;
        if (versionId) {
            allVersions[versionId] = conditionalAddToArray(id, allVersions[versionId]);
            state.versions.all = allVersions;
        }
        state.items[id] = item;
    }
    return state.items;
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
            }>,
        ) => {
            const { username: user, items, update = false } = action.payload;
            const username = user.toLowerCase();

            if (!update) {
                state.users[username] = {
                    items: {},
                    images: {},
                    objects: {} as BggObjectsByStatus,
                    versions: {} as BggVersionsByStatus,
                };
            }
            innerUpdateCollectionItems(state.users[username], items);
            const newState =
                current<BggCollectionSliceState>(state);

            setCollection(
                username,
                newState?.users[username].items
            ).then();
        },
    },
});

export const {
    updateCollectionItems,
} = bggCollectionSlice.actions;

export default bggCollectionSlice.reducer;
