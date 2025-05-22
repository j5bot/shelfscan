import { getBggUser } from '@/app/lib/services/bgg/service';
import { BggUser } from '@/app/lib/types/BggUser';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export type BggUserSliceState = Partial<BggUser> & {
    cookie?: string;
    loggedIn?: boolean;
};

const SLICE_TITLE = 'BGG_USER';

const initialState: BggUserSliceState = {
    loggedIn: false,
};

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
        setCookie: (state, action: PayloadAction<string>) => {
            state.cookie = action.payload;
        },
        setLoggedIn: (state, action: PayloadAction<boolean>) => {
            state.loggedIn = action.payload;
        },
        setUser: (state, action: PayloadAction<Partial<BggUser>>) => {
            Object.assign(state, action.payload);
        },
    },
    extraReducers: builder => builder
        .addCase(fetchBggUser.fulfilled, (state, action: PayloadAction<BggUser>) => {
            Object.assign(state, action.payload);
        }),
});

export const {
    setCookie,
    setLoggedIn,
} = bggUserSlice.actions;

export default bggUserSlice.reducer;
