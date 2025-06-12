import { getBggUser } from '@/app/lib/services/bgg/service';
import { BggUser } from '@/app/lib/types/BggUser';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export type BggUserSliceState = Partial<BggUser>;

const SLICE_TITLE = 'BGG_USER';

const initialState: BggUserSliceState = {};

export const fetchBggUser = createAsyncThunk(
    `${SLICE_TITLE}/fetch/user`,
    async (username: string) => {
        return await getBggUser(username);
    },
);

export const bggUserSlice = createSlice({
    name: `${SLICE_TITLE}_SLICE`,
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<Partial<BggUser>>) => {
            Object.assign(state, action.payload);
        },
    },
    extraReducers: builder => builder
        .addCase(fetchBggUser.fulfilled, (state, action: PayloadAction<Partial<BggUser>>) => {
            // it makes more sense not to use the other reducer but leaving it
            // here just to demonstrate redux more
            void state;
            setUser(action.payload);
        }),
});

export const {
    setUser,
} = bggUserSlice.actions;

export default bggUserSlice.reducer;
