'use client';

import { GeekMarketProduct } from '@/app/lib/types/market';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type MarketSliceState = {
    users: Record<string, GeekMarketProduct[]>;
};

const SLICE_TITLE = 'BGG_MARKET';

const initialState: MarketSliceState = {
    users: {},
};

export const bggMarketSlice = createSlice({
    name: `${SLICE_TITLE}_SLICE`,
    initialState,
    reducers: {
        setMarketListings: (
            state,
            action: PayloadAction<{
                username: string;
                products: GeekMarketProduct[];
            }>,
        ) => {
            const { username: user, products } = action.payload;
            const username = user.toLowerCase();
            state.users[username] = products;
        },
        clearMarketListings: (
            state,
            action: PayloadAction<{ username: string }>,
        ) => {
            const username = action.payload.username.toLowerCase();
            delete state.users[username];
        },
    },
});

export const { setMarketListings, clearMarketListings } = bggMarketSlice.actions;

export default bggMarketSlice.reducer;
