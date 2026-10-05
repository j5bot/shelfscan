import { describe, it, expect, beforeEach, afterEach } from '../../setup';
import { vi } from 'vitest';
import { addToCollection } from '@/app/lib/extension/messaging/addToCollection';
import { useClearCollectionStatusesTool } from '@/app/lib/hooks/webmcp/extension/useClearCollectionStatusesTool';
import { useRemoveCollectionItemTool } from '@/app/lib/hooks/webmcp/extension/useRemoveCollectionItemTool';
import { useSetPreviouslyOwnedTool } from '@/app/lib/hooks/webmcp/extension/useSetPreviouslyOwnedTool';
import { updateCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { setBggUser } from '@/app/lib/redux/bgg/user/slice';
import { makeStore } from '@/app/lib/redux/store';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { act, ReactNode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { WebMCPProvider } from 'webmcp-react';

vi.mock('@/app/lib/extension/messaging/addToCollection', () => ({
    addToCollection: vi.fn(),
}));

// updateCollectionItems persists the collection; keep IndexedDB out of the test
vi.mock('@/app/lib/database/database', () => ({
    setCollection: vi.fn().mockResolvedValue(undefined),
    database: {},
    getPlugin: vi.fn(),
    getSetting: vi.fn(),
}));

const USER_ID = '4317241';
const ARK_NOVA_ID = 342942;
const ARK_NOVA_ITEM = 150072898;

type ToolInfo = { name: string; title?: string; description: string; inputSchema?: { properties?: Record<string, unknown>; required?: string[] } };
type ToolResult = { isError?: boolean; content: { type: string; text: string }[] };
type ModelContext = {
    getTools: () => Promise<ToolInfo[]>;
    // like the native API, the polyfill resolves with the result serialized as JSON
    executeTool: (tool: { name: string }, input: object) => Promise<string>;
};

const PreviouslyOwnedProbe = () => {
    useSetPreviouslyOwnedTool(USER_ID);
    return <span>ok</span>;
};
const ClearProbe = () => {
    useClearCollectionStatusesTool(USER_ID);
    return <span>ok</span>;
};
const RemoveProbe = ({ userId }: { userId?: string }) => {
    useRemoveCollectionItemTool(userId);
    return <span>ok</span>;
};

const modelContext = () => (document as unknown as { modelContext: ModelContext }).modelContext;

const flush = () => act(async () => {
    await Promise.resolve();
});

const getTool = async () => (await modelContext().getTools())[0];

const execute = async (input: object): Promise<ToolResult> => {
    const tool = await getTool();
    let json = '';
    await act(async () => {
        json = await modelContext().executeTool(tool, input);
    });
    return JSON.parse(json);
};

// a refused call either errors in the handler or is rejected by the schema check before it runs
const isRefused = async (input: object) => {
    try {
        return (await execute(input)).isError === true;
    } catch {
        return true;
    }
};

const lastParams = () => vi.mocked(addToCollection).mock.calls.at(-1)?.[0];

const storeWithArkNova = () => {
    const store = makeStore();
    store.dispatch(setBggUser({ user: 'shelfscan', id: USER_ID }));
    store.dispatch(updateCollectionItems({
        username: 'shelfscan',
        items: {
            [ARK_NOVA_ITEM]: {
                objectId: ARK_NOVA_ID,
                collectionId: ARK_NOVA_ITEM,
                name: 'Ark Nova',
                subType: 'boardgame',
                statuses: { own: true },
            } as BggCollectionItem,
        },
    }));
    return store;
};

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('collection status tools', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        vi.mocked(addToCollection).mockReset();
        vi.mocked(addToCollection).mockResolvedValue({ response: { collectionItem: { collid: ARK_NOVA_ITEM } } } as never);
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    const mount = async (node: ReactNode, store = makeStore()) => {
        act(() => root.render(
            <Provider store={store}>
                <WebMCPProvider name="test" version="1.0">{node}</WebMCPProvider>
            </Provider>
        ));
        await flush();
    };

    describe('set_bgg_previously_owned', () => {
        it('adds a new item as previously owned when no collectionId is given', async () => {
            await mount(<PreviouslyOwnedProbe />);
            const result = await execute({ bggId: ARK_NOVA_ID, gameName: 'Ark Nova' });
            expect(result.content[0].text).toContain('as a new collection item');
            expect(lastParams()).toMatchObject({ mode: 'previous', collectionId: undefined, entries: {} });
        });

        it('updates the given collection item', async () => {
            await mount(<PreviouslyOwnedProbe />);
            const result = await execute({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM });
            expect(result.content[0].text).not.toContain('new collection item');
            expect(lastParams()).toMatchObject({ mode: 'previous', collectionId: ARK_NOVA_ITEM });
        });
    });

    describe('clear_bgg_collection_statuses', () => {
        it('requires a collectionId', async () => {
            await mount(<ClearProbe />);
            expect((await getTool()).inputSchema?.required).toEqual(['bggId', 'collectionId']);
            expect(await isRefused({ bggId: ARK_NOVA_ID })).toBe(true);
            expect(addToCollection).not.toHaveBeenCalled();
        });

        it('clears the item without checking the loaded collection', async () => {
            await mount(<ClearProbe />);
            const result = await execute({ bggId: ARK_NOVA_ID, collectionId: 999 });
            expect(result.isError).toBeFalsy();
            expect(lastParams()).toMatchObject({ mode: 'clear', collectionId: 999, entries: {} });
        });
    });

    describe('remove_bgg_collection_item', () => {
        it('says it is irreversible', async () => {
            await mount(<RemoveProbe userId={USER_ID} />, storeWithArkNova());
            const tool = await getTool();
            expect(tool.title).toContain('cannot be undone');
            expect(tool.description).toMatch(/^IRREVERSIBLE/);
            expect(tool.inputSchema?.required).toEqual(['bggId', 'collectionId', 'confirmPermanentDelete']);
        });

        it('requires the explicit confirmation', async () => {
            await mount(<RemoveProbe userId={USER_ID} />, storeWithArkNova());
            for (const confirmPermanentDelete of [undefined, false, 'yes']) {
                expect(await isRefused({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, confirmPermanentDelete }))
                    .toBe(true);
            }
            expect(addToCollection).not.toHaveBeenCalled();
        });

        it('refuses a collection item that is not this game', async () => {
            await mount(<RemoveProbe userId={USER_ID} />, storeWithArkNova());
            const result = await execute({ bggId: 13, collectionId: ARK_NOVA_ITEM, confirmPermanentDelete: true });
            expect(result.isError).toBe(true);
            expect(result.content[0].text).toContain('nothing was changed');
            expect(addToCollection).not.toHaveBeenCalled();
        });

        it('refuses when the collection is not loaded', async () => {
            await mount(<RemoveProbe userId={USER_ID} />);
            const result = await execute({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, confirmPermanentDelete: true });
            expect(result.isError).toBe(true);
            expect(addToCollection).not.toHaveBeenCalled();
        });

        it('deletes a confirmed, matching item', async () => {
            await mount(<RemoveProbe userId={USER_ID} />, storeWithArkNova());
            const result = await execute({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, confirmPermanentDelete: true });
            expect(result.isError).toBeFalsy();
            expect(result.content[0].text).toContain('Permanently deleted');
            expect(lastParams()).toMatchObject({
                mode: 'clear',
                collectionId: ARK_NOVA_ITEM,
                entries: { shouldRemove: 'remove' },
            });
        });

        it('registers the unavailable stub without a loaded user', async () => {
            await mount(<RemoveProbe />);
            expect((await getTool()).inputSchema?.properties ?? {}).toEqual({});
        });
    });
});
