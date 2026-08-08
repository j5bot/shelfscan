import { configureStore } from '@reduxjs/toolkit'
import bgg from '@/app/lib/redux/bgg/bggSlice';
import swap from '@/app/lib/redux/swap/slice';

export const makeStore = () => configureStore({
    reducer: {
        bgg,
        swap,
    },
    devTools: true,
});

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch'];
