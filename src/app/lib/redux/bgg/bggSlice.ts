import userReducer from '@/app/lib/redux/bgg/user/slice';
import collectionReducer from '@/app/lib/redux/bgg/collection/slice';
import marketReducer from '@/app/lib/redux/bgg/market/slice';
import { combineReducers } from '@reduxjs/toolkit';

export const reducer = combineReducers({
    user: userReducer,
    collection: collectionReducer,
    market: marketReducer,
});

export type BggSliceState = ReturnType<typeof reducer>;

export default reducer;
