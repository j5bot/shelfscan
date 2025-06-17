import { RootState } from '@/app/lib/redux/store';
import { createSelector } from '@reduxjs/toolkit';

export const getUserState = (state: RootState) =>
    state.bgg.user;

export const getUsername = createSelector(
    [getUserState],
    user => user.user
);
