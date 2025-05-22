import { RootState } from '@/app/lib/redux/store';
import { getCollectionItems, GetCollectionItemsParams } from '@/app/lib/services/bgg/collectionData';
import { BggUser } from '@/app/lib/types/BggUser';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CollectionId = string;
export type UserId = string;
export type VersionId = string;

type CollectionStatus = 'own' | 'trade';

export type CollectionItem = {
    collid: string;
    versionid: string | null;
    objecttype: 'thing';
    objectid: string;
    objectname: string;
    imageid: string;
    images?: {
        micro?: string;
        thumb?: string;
    };
    status: Record<CollectionStatus, boolean>;
}

export type CollectionData = {
    items: CollectionItem[];
};

export type BggUserCollectionItems = Record<CollectionId, VersionId[]>;

export type BggCollectionSliceState = {
    users: Record<UserId, BggUserCollectionItems>;
};

const SLICE_TITLE = 'BGG_COLLECTION';

const initialState: BggCollectionSliceState = {
    users: {},
};

export const fetchCollectionItems = createAsyncThunk(
    `${SLICE_TITLE}/fetch/item`,
    async (params: Partial<GetCollectionItemsParams>, { dispatch, getState }) => {
        const state: RootState = getState() as unknown as RootState;
        const { id: userId, cookie } = state.bgg.user;
        const data = await getCollectionItems({ userId, cookie, data: params.data });

        return data;
    }
);

export const bggCollectionSlice = createSlice({
    name: `${SLICE_TITLE}_SLICE`,
    initialState,
    reducers: {
        addUpdateCollectionItem: (
            state,
            action: PayloadAction<BggUserCollectionItems & { userId: UserId }>,
        ) => {
            const { userId, ...data } = action.payload;
            Object.assign(state.users[userId], data);
        },
    },
    extraReducers: builder =>
        builder
            .addCase(fetchCollectionItems.fulfilled, (state, action) => {
                const { items } = action.payload;

            })
});

export const {
    addUpdateCollectionItem,
} = bggCollectionSlice.actions;

export default bggCollectionSlice.reducer;
