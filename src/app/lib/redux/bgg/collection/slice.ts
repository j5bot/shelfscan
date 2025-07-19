import { BggCollection, BggCollectionMap } from '@/app/lib/types/bgg';
import { conditionalAddToArray, removeFromArray } from '@/app/lib/utils/array';
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
            objectId: previousObjectId,
            versionId: previousVersionId,
        } = state.items[id] ?? {};

        const {
            objectId,
            versionId,
        } = item;

        if (previousObjectId && objectId !== previousObjectId) {
            state.objects[previousObjectId] = removeFromArray(id, state.objects[previousObjectId]);
        } else if (objectId) {
            state.objects[objectId] = conditionalAddToArray(id, state.objects[objectId]);
        }
        if (previousVersionId && versionId !== previousVersionId) {
            state.versions[previousVersionId] = removeFromArray(id,
                state.versions[previousVersionId]);
        } else if (versionId) {
            state.versions[versionId] = conditionalAddToArray(id, state.versions[versionId]);
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
            if (!state.users[username]) {
                state.users[username] = {
                    items: {},
                    images: {},
                    objects: {},
                    versions: {},
                };
            }
            innerUpdateCollectionItems(state.users[username], items);
        },
    },
});

export const {
    updateCollectionItems,
} = bggCollectionSlice.actions;

export default bggCollectionSlice.reducer;
