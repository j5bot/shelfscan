import {
    BggCollection,
    BggCollectionMap,
    BggObjectsByStatus, BggVersionsByStatus,
    PossibleStatuses
} from '@/app/lib/types/bgg';
import { conditionalAddToArray } from '@/app/lib/utils/array';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

        const {
            objectId,
            versionId,
            statuses,
        } = item;

        PossibleStatuses.forEach(status => {
            const statusObjects = state.objects[status] ?? {};
            const statusVersions = state.versions[status] ?? {};
            if (!statuses[status]) {
                return;
            }
            statusObjects[objectId] = conditionalAddToArray(id, statusObjects[objectId]);
            state.objects[status] = statusObjects;
            if (!versionId) {
                return;
            }
            statusVersions[versionId] = conditionalAddToArray(id, statusVersions[versionId]);
            state.versions[status] = statusVersions;
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
            action: PayloadAction<{username: string; items: BggCollectionMap}>,
        ) => {
            const { username: user, items } = action.payload;
            const username = user.toLowerCase();
            // // if (!state.users[username]) {
            // for now we are always starting from scratch instead of a real update
            state.users[username] = {
                items: {},
                images: {},
                objects: {} as BggObjectsByStatus,
                versions: {} as BggVersionsByStatus,
            };
            // // }
            innerUpdateCollectionItems(state.users[username], items);
        },
    },
});

export const {
    updateCollectionItems,
} = bggCollectionSlice.actions;

export default bggCollectionSlice.reducer;
