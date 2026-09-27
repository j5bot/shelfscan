import { describe, it, expect } from '../../../setup';
import { selectLoadedGeekLists } from '@/app/lib/redux/bgg/geeklist/selectors';
import { GeekListEntryState } from '@/app/lib/redux/bgg/geeklist/slice';
import { RootState } from '@/app/lib/redux/store';

type EntryOptions = {
    status: GeekListEntryState['status'];
    title?: string;
    matched?: number[];
};

const entry = ({ status, title, matched = [] }: EntryOptions) => ({
    geekList: title ? { title } : null,
    status,
    matched,
}) as unknown as GeekListEntryState;

const makeState = (geekLists: Record<number, GeekListEntryState>) =>
    ({ bgg: { geeklist: { geekLists } } }) as unknown as RootState;

describe('selectLoadedGeekLists', () => {
    it('lists only loaded geeklists, falling back to a generic title', () => {
        const state = makeState({
            1: entry({ status: 'loaded', title: 'Spring Trade' }),
            2: entry({ status: 'loading' }),
            3: entry({ status: 'loaded' }),
        });
        expect(selectLoadedGeekLists([state])).toEqual([
            { id: 1, title: 'Spring Trade' },
            { id: 3, title: 'Geeklist 3' },
        ]);
    });

    it('returns the same array when only unrelated list data changes', () => {
        const before = makeState({ 1: entry({ status: 'loaded', title: 'Spring Trade' }) });
        const after = makeState({ 1: entry({ status: 'loaded', title: 'Spring Trade', matched: [42] }) });
        expect(selectLoadedGeekLists([after])).toBe(selectLoadedGeekLists([before]));
    });

    it('returns a new array when a list loads or is renamed', () => {
        const first = selectLoadedGeekLists([makeState({ 1: entry({ status: 'loading' }) })]);
        const loaded = selectLoadedGeekLists([makeState({ 1: entry({ status: 'loaded', title: 'A' }) })]);
        const renamed = selectLoadedGeekLists([makeState({ 1: entry({ status: 'loaded', title: 'B' }) })]);
        expect(loaded).not.toBe(first);
        expect(renamed).not.toBe(loaded);
        expect(renamed).toEqual([{ id: 1, title: 'B' }]);
    });
});
