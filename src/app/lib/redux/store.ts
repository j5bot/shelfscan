import { configureStore } from '@reduxjs/toolkit'
import bgg from '@/app/lib/redux/bgg/bggSlice';

export const makeStore = () => configureStore({
    reducer: {
        bgg
    },
});

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch'];
