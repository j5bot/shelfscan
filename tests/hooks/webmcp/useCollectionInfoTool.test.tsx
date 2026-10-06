import { describe, it, expect, beforeEach, afterEach } from '../../setup';
import { vi } from 'vitest';
import { addToCollection } from '@/app/lib/extension/messaging/addToCollection';
import { useCollectionInfoTool } from '@/app/lib/hooks/webmcp/extension/useCollectionInfoTool';
import { updateCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { setBggUser } from '@/app/lib/redux/bgg/user/slice';
import { makeStore } from '@/app/lib/redux/store';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { act, ReactNode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { WebMCPProvider } from 'webmcp-react';

const dispatchExtensionMessage = vi.fn();

vi.mock('@/app/lib/extension/messaging/addToCollection', () => ({
    addToCollection: vi.fn(),
}));

vi.mock('@/app/lib/extension/ExtensionMessagingProvider', () => ({
    useExtensionMessaging: () => ({ dispatchExtensionMessage }),
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

// BGG's collection item, as the extension's infoLoad reply carries it
const LOADED_ITEM = {
    collid: String(ARK_NOVA_ITEM),
    objectid: String(ARK_NOVA_ID),
    pricepaid: '54.5',
    pp_currency: 'USD',
    status: { own: true, fortrade: false },
    textfield: { privatecomment: { value: 'Gift from Sam' }, conditiontext: { value: '' } },
};

type ProbeProps = { userId?: string };

type ToolInfo = { name: string; inputSchema?: { properties?: Record<string, unknown>; required?: string[] } };
type ToolResult = {
    isError?: boolean;
    content: { type: string; text: string }[];
    structuredContent?: Record<string, unknown>;
};
type ModelContext = {
    getTools: () => Promise<ToolInfo[]>;
    // like the native API, the polyfill resolves with the result serialized as JSON
    executeTool: (tool: { name: string }, input: object) => Promise<string>;
};

const Probe = ({ userId }: ProbeProps) => {
    useCollectionInfoTool({ canUseExtension: !!userId, userId });
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

const lastParams = () => vi.mocked(addToCollection).mock.calls.at(-1)?.[0];

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('useCollectionInfoTool', () => {
    let container: HTMLDivElement;
    let root: Root;
    let store: ReturnType<typeof makeStore>;

    beforeEach(() => {
        store = makeStore();
        vi.mocked(addToCollection).mockReset();
        dispatchExtensionMessage.mockReset();
        dispatchExtensionMessage.mockResolvedValue({ response: { collectionItem: LOADED_ITEM } });
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    const mount = async (node: ReactNode) => {
        act(() => root.render(<Provider store={store}>
            <WebMCPProvider name="test" version="1.0">{node}</WebMCPProvider>
        </Provider>));
        await flush();
    };

    it('registers the unavailable stub without a loaded user', async () => {
        await mount(<Probe />);
        const [tool] = await modelContext().getTools();
        expect(tool.name).toBe('bgg_collection_item_info');
        expect(tool.inputSchema?.properties ?? {}).toEqual({});
    });

    it('takes the info form fields as optional inputs', async () => {
        await mount(<Probe userId={USER_ID} />);
        const [tool] = await modelContext().getTools();
        expect(Object.keys(tool.inputSchema?.properties ?? {})).toEqual([
            'bggId', 'gameName', 'versionId', 'collectionId', 'read', 'preload',
            'privatecomment', 'statuses', 'tradecondition', 'pp_currency', 'pricepaid',
            'cv_currency', 'currvalue', 'acquisitiondate', 'acquiredfrom', 'invdate', 'invlocation',
        ]);
        expect(tool.inputSchema?.required).toEqual(['bggId', 'collectionId']);
    });

    it('reads the info without saving it', async () => {
        await mount(<Probe userId={USER_ID} />);

        const result = await execute({
            bggId: ARK_NOVA_ID, gameName: 'Ark Nova', collectionId: ARK_NOVA_ITEM, read: true,
        });

        expect(result.isError).toBeFalsy();
        expect(dispatchExtensionMessage).toHaveBeenCalledWith(expect.objectContaining({
            type: 'infoLoad', userId: USER_ID, collectionId: ARK_NOVA_ITEM, gameId: ARK_NOVA_ID,
        }));
        expect(addToCollection).not.toHaveBeenCalled();
        expect(result.content[0].text).toContain('Private Comment: Gift from Sam');
        expect(result.structuredContent?.info).toEqual({
            pricepaid: '54.5', pp_currency: 'USD', privatecomment: 'Gift from Sam', statuses: 'own',
        });
    });

    it('refuses info fields when only reading', async () => {
        await mount(<Probe userId={USER_ID} />);
        const result = await execute({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, read: true, invlocation: 'x' });
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('invlocation');
        expect(dispatchExtensionMessage).not.toHaveBeenCalled();
    });

    it('needs info fields or read: true', async () => {
        await mount(<Probe userId={USER_ID} />);
        const result = await execute({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM });
        expect(result.isError).toBe(true);
        expect(dispatchExtensionMessage).not.toHaveBeenCalled();
        expect(addToCollection).not.toHaveBeenCalled();
    });

    it('saves only the given fields without a preload', async () => {
        vi.mocked(addToCollection).mockResolvedValue(
            { response: { collectionItem: { collid: ARK_NOVA_ITEM } } } as never);
        await mount(<Probe userId={USER_ID} />);

        const result = await execute({
            bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, currvalue: 60, cv_currency: 'EUR',
        });

        expect(result.isError).toBeFalsy();
        expect(dispatchExtensionMessage).not.toHaveBeenCalled();
        expect(lastParams()).toMatchObject({ mode: 'info', collectionId: ARK_NOVA_ITEM });
        expect(lastParams()?.entries).toEqual({ currvalue: '60', cv_currency: 'EUR' });
        expect(result.content[0].text).not.toContain('Before:');
    });

    it('saves the given fields over the preloaded info', async () => {
        vi.mocked(addToCollection).mockResolvedValue(
            { response: { collectionItem: { collid: ARK_NOVA_ITEM } } } as never);
        await mount(<Probe userId={USER_ID} />);

        const result = await execute({
            bggId: ARK_NOVA_ID,
            collectionId: ARK_NOVA_ITEM,
            preload: true,
            statuses: ['own', 'fortrade'],
            currvalue: 60,
            cv_currency: 'EUR',
            acquisitiondate: '2024-01-05',
        });

        expect(result.isError).toBeFalsy();
        expect(lastParams()).toMatchObject({
            mode: 'info',
            userId: USER_ID,
            bggId: ARK_NOVA_ID,
            collectionId: ARK_NOVA_ITEM,
            entries: {
                privatecomment: 'Gift from Sam',
                pricepaid: '54.5',
                pp_currency: 'USD',
                statuses: 'own,fortrade',
                currvalue: '60',
                cv_currency: 'EUR',
                acquisitiondate: '2024-01-05',
            },
        });
        expect(result.content[0].text).toContain('Before:');
        expect(result.structuredContent?.previous).toMatchObject({ statuses: 'own' });
    });

    it('refuses to change a preloaded item that belongs to another game', async () => {
        await mount(<Probe userId={USER_ID} />);
        const result = await execute({ bggId: 1, collectionId: ARK_NOVA_ITEM, preload: true, privatecomment: 'x' });
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('nothing was changed');
        expect(addToCollection).not.toHaveBeenCalled();
    });

    it('checks the loaded collection for the right game without a preload', async () => {
        act(() => {
            store.dispatch(setBggUser({ user: 'ShelfScan', id: USER_ID }));
            store.dispatch(updateCollectionItems({
                username: 'shelfscan',
                items: {
                    [ARK_NOVA_ITEM]: {
                        objectId: ARK_NOVA_ID,
                        collectionId: ARK_NOVA_ITEM,
                        name: 'Ark Nova',
                        statuses: {
                            own: true, prevowned: false, fortrade: false, want: false,
                            wanttoplay: false, wanttobuy: false, wishlist: false, preordered: false,
                        },
                    } as BggCollectionItem,
                },
            }));
        });
        await mount(<Probe userId={USER_ID} />);
        const result = await execute({ bggId: 1, collectionId: ARK_NOVA_ITEM, privatecomment: 'x' });
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Ark Nova');
        expect(addToCollection).not.toHaveBeenCalled();
    });

    it('rejects values the info form does not offer', async () => {
        await mount(<Probe userId={USER_ID} />);
        const badCurrency = await execute({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, pp_currency: 'XYZ' });
        const badStatus = await execute({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, statuses: ['owned'] });
        const badDate = await execute({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, invdate: '5/1/2024' });
        expect([badCurrency.isError, badStatus.isError, badDate.isError]).toEqual([true, true, true]);
        expect(dispatchExtensionMessage).not.toHaveBeenCalled();
    });

    it('reports an error when the extension cannot load the item', async () => {
        dispatchExtensionMessage.mockResolvedValue(undefined);
        await mount(<Probe userId={USER_ID} />);
        const result = await execute({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, read: true });
        expect(result.isError).toBe(true);
        expect(addToCollection).not.toHaveBeenCalled();
    });
});
