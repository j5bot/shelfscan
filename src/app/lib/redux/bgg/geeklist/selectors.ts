import { RootState } from '@/app/lib/redux/store';
import { memoize } from 'proxy-memoize';

export type GeekListSummary = {
    id: number;
    title: string;
};

/**
 * Loaded geeklists as id/title pairs. Memoized on what it reads (each list's
 * status and title), so it keeps returning the same array while those are unchanged.
 */
export const selectLoadedGeekLists = memoize(([state]: [RootState]): GeekListSummary[] =>
    Object.entries(state.bgg.geeklist.geekLists)
        .filter(([, entry]) => entry.status === 'loaded')
        .map(([id, entry]) => ({
            id: parseInt(id, 10),
            title: entry.geekList?.title ?? `Geeklist ${id}`,
        })),
);
