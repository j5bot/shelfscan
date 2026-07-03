import userReducer from '@/app/lib/redux/bgg/user/slice';
import collectionReducer from '@/app/lib/redux/bgg/collection/slice';
import geeklistReducer from '@/app/lib/redux/bgg/geeklist/slice';
import { combineReducers } from '@reduxjs/toolkit';

export const reducer = combineReducers({
    user: userReducer,
    collection: collectionReducer,
    geeklist: geeklistReducer,
});

export type BggSliceState = ReturnType<typeof reducer>;

export default reducer;
