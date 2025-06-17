import userReducer from '@/app/lib/redux/bgg/user/slice';
import collectionReducer from '@/app/lib/redux/bgg/collection/slice';
import { combineReducers } from '@reduxjs/toolkit';

export const reducer = combineReducers({
    user: userReducer,
    collection: collectionReducer,
});

export type BggSliceState = ReturnType<typeof reducer>;

export default reducer;
