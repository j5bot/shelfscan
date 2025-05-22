import userReducer from '@/app/lib/redux/bgg/user/slice';
import { combineReducers } from '@reduxjs/toolkit';

export const reducer = combineReducers({
    user: userReducer,
});

export type BggSliceState = ReturnType<typeof reducer>;

export default reducer;
