import { BggUser } from '@/app/lib/types/bgg';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type BggUserSliceState = Partial<BggUser>;

const SLICE_TITLE = 'BGG_USER';

const initialState: BggUserSliceState = {};

export const bggUserSlice = createSlice({
    name: `${SLICE_TITLE}_SLICE`,
    initialState,
    reducers: {
        setBggUser: (state, action: PayloadAction<Partial<BggUser> | undefined>) => {
            if (!action.payload) {
                return initialState;
            }
            Object.assign(state, action.payload);
        },
    },
});

export const {
    setBggUser,
} = bggUserSlice.actions;

export default bggUserSlice.reducer;
