import { describe, it, expect, beforeEach, afterEach } from '../../setup';
import { vi } from 'vitest';
import { useCollectionQueryTool } from '@/app/lib/hooks/webmcp/useCollectionQueryTool';
import { updateCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { setBggUser } from '@/app/lib/redux/bgg/user/slice';
import { makeStore } from '@/app/lib/redux/store';
import { readStoredCollection } from '@/app/lib/services/bgg/storedCollection';
import { BggCollectionItem, BggCollectionMap, BggCollectionStatuses } from '@/app/lib/types/bgg';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { WebMCPProvider } from 'webmcp-react';

// updateCollectionItems persists the collection; keep IndexedDB out of the test
vi.mock('@/app/lib/database/database', () => ({
    setCollection: vi.fn().mockResolvedValue(undefined),
    database: {},
    getPlugin: vi.fn(),
    getSetting: vi.fn(),
}));

vi.mock('@/app/lib/services/bgg/storedCollection', () => ({
    readStoredCollection: vi.fn(),
}));

vi.mock('@/app/lib/ScanHistoryProvider', () => ({
    useScanHistory: () => ({ scanHistory: [], lastScannedMap: new Map() }),
}));

const USERNAME = 'Alice';

const makeItem = (
    collectionId: number,
    name: string,
    overrides: Partial<BggCollectionItem> = {},
): BggCollectionItem => ({
    objectId: collectionId + 1000,
    collectionId,
    subType: 'boardgame',
    name,
    image: undefined,
    thumbnail: undefined,
    yearPublished: 2020,
    lastModified: '',
    statuses: { own: true } as BggCollectionStatuses,
    ...overrides,
});

const COLLECTION: BggCollectionMap = {
    1: makeItem(1, 'Patchwork', { minPlayers: 2, maxPlayers: 2 }),
    2: makeItem(2, 'Ark Nova', { minPlayers: 1, maxPlayers: 4 }),
    3: makeItem(3, 'Gloomhaven', { minPlayers: 1, maxPlayers: 4,
        statuses: { wishlist: true } as BggCollectionStatuses }),
};

type ToolInfo = { name: string; annotations?: Record<string, unknown> };
type ToolResult = {
    isError?: boolean;
    content: { type: string; text: string }[];
    structuredContent?: Record<string, unknown>;
};
type ModelContext = {
    getTools: () => Promise<ToolInfo[]>;
    executeTool: (tool: { name: string }, input: object) => Promise<string>;
};

const Probe = () => {
    useCollectionQueryTool();
    return <span>ok</span>;
};

const modelContext = () => (document as unknown as { modelContext: ModelContext }).modelContext;

const flush = () => act(async () => {
    await Promise.resolve();
});

const execute = async (input: object): Promise<ToolResult> => {
    const [tool] = await modelContext().getTools();
    let json = '';
    await act(async () => {
        json = await modelContext().executeTool(tool, input);
    });
    return JSON.parse(json);
};

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('useCollectionQueryTool', () => {
    let container: HTMLDivElement;
    let root: Root;
    let store: ReturnType<typeof makeStore>;

    beforeEach(() => {
        store = makeStore();
        vi.mocked(readStoredCollection).mockReset();
        vi.mocked(readStoredCollection).mockResolvedValue(undefined);
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    const mount = async () => {
        act(() => root.render(<Provider store={store}>
            <WebMCPProvider name="test" version="1.0"><Probe /></WebMCPProvider>
        </Provider>));
        await flush();
    };

    const loadUser = () => store.dispatch(setBggUser({ user: USERNAME }));

    it('registers a read-only query tool', async () => {
        await mount();
        const [tool] = await modelContext().getTools();
        expect(tool.name).toBe('query_bgg_collection');
        expect(tool.annotations).toMatchObject({ readOnlyHint: true });
    });

    it('fails without a loaded user', async () => {
        await mount();
        const result = await execute({});
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('load_bgg_collection');
    });

    it('fails when neither Redux nor IndexedDB has the collection', async () => {
        loadUser();
        await mount();
        const result = await execute({});
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('empty or hasn\'t been loaded');
        expect(readStoredCollection).toHaveBeenCalledWith(USERNAME);
    });

    it('queries the collection in Redux', async () => {
        loadUser();
        store.dispatch(updateCollectionItems({ username: USERNAME, items: COLLECTION }));
        await mount();

        const result = await execute({ ownership: 'own', players: 2 });

        expect(result.isError).toBeFalsy();
        expect(result.content[0].text.split('\n')[0]).toBe('2 matching items (2 games, 0 expansions).');
        expect(result.structuredContent).toMatchObject({ username: USERNAME, total: 2 });
        const items = result.structuredContent?.items as { name: string }[];
        expect(items.map(item => item.name)).toEqual(['Ark Nova', 'Patchwork']);
        expect(readStoredCollection).not.toHaveBeenCalled();
    });

    it('loads the saved collection into Redux when it is not there yet', async () => {
        loadUser();
        vi.mocked(readStoredCollection).mockResolvedValue(COLLECTION);
        await mount();

        const result = await execute({ wishlist: 'wishlist', limit: 0 });

        expect(result.structuredContent).toMatchObject({ total: 1, items: [] });
        expect(Object.keys(store.getState().bgg.collection.users.alice.items)).toHaveLength(3);
    });

    it('does not change the page URL or saved filters', async () => {
        loadUser();
        store.dispatch(updateCollectionItems({ username: USERNAME, items: COLLECTION }));
        window.history.replaceState(null, '', '/collection?ownership=own');
        await mount();

        await execute({ trade: 'fortrade', players: 4 });

        expect(window.location.search).toBe('?ownership=own');
        expect(localStorage.getItem('collection-filters')).toBeNull();
    });

    it('rejects input outside the schema', async () => {
        loadUser();
        store.dispatch(updateCollectionItems({ username: USERNAME, items: COLLECTION }));
        await mount();
        const result = await execute({ ownership: 'mine' });
        expect(result.isError).toBe(true);
    });
});
