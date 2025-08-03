import { RootState } from '@/app/lib/redux/store';

export const getUsername = (state: RootState) =>
    state.bgg.user?.user;
