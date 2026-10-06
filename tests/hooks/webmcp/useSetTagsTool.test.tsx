import { describe, it, expect, beforeEach, afterEach } from '../../setup';
import { vi } from 'vitest';
import { useSetTagsTool } from '@/app/lib/hooks/webmcp/extension/useSetTagsTool';
import { act, ReactNode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { WebMCPProvider } from 'webmcp-react';

const dispatchExtensionMessage = vi.fn();

vi.mock('@/app/lib/extension/ExtensionMessagingProvider', () => ({
    useExtensionMessaging: () => ({ dispatchExtensionMessage }),
}));

const USER_ID = '4317241';
const ARK_NOVA_ID = 342942;
const ARK_NOVA_ITEM = 150072898;

// BGG's collection item, as the extension's infoLoad reply carries it
const LOADED_ITEM = {
    collid: String(ARK_NOVA_ITEM),
    objectid: String(ARK_NOVA_ID),
    textfield: {
        wishlistcomment: { value: 'Want the deluxe #PnP' },
        haspartslist: { value: '' },
    },
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
    useSetTagsTool({ canUseExtension: !!userId, userId });
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

// replies to infoLoad with the item, and to tags with the saved item
const replyLikeExtension = () => dispatchExtensionMessage.mockImplementation(async (detail: { type: string }) =>
    detail.type === 'infoLoad'
        ? { response: { collectionItem: LOADED_ITEM } }
        : { response: { collectionItem: { collid: ARK_NOVA_ITEM } } });

const tagsMessage = () => dispatchExtensionMessage.mock.calls
    .map(([detail]) => detail)
    .find(detail => detail.type === 'tags');

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('useSetTagsTool', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        dispatchExtensionMessage.mockReset();
        replyLikeExtension();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    const mount = async (node: ReactNode) => {
        act(() => root.render(<WebMCPProvider name="test" version="1.0">{node}</WebMCPProvider>));
        await flush();
    };

    it('registers the unavailable stub without a loaded user', async () => {
        await mount(<Probe />);
        const [tool] = await modelContext().getTools();
        expect(tool.name).toBe('set_bgg_collection_tags');
        expect(tool.inputSchema?.properties ?? {}).toEqual({});
    });

    it('takes the tags, action and tag location, but no version', async () => {
        await mount(<Probe userId={USER_ID} />);
        const [tool] = await modelContext().getTools();
        expect(Object.keys(tool.inputSchema?.properties ?? {}))
            .toEqual(['bggId', 'gameName', 'collectionId', 'tags', 'action', 'location']);
        expect(tool.inputSchema?.required).toEqual(['bggId', 'collectionId', 'tags']);
    });

    it('adds tags to the wishlist comment by default, keeping its other text', async () => {
        await mount(<Probe userId={USER_ID} />);

        const result = await execute({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, tags: ['solo'] });

        expect(result.isError).toBeFalsy();
        expect(tagsMessage()).toMatchObject({
            userId: USER_ID,
            collectionId: ARK_NOVA_ITEM,
            gameId: ARK_NOVA_ID,
            formValues: { wishlistcomment: 'Want the deluxe #PnP #solo' },
        });
        expect(tagsMessage()?.versionId).toBeUndefined();
        expect(result.content[0].text).toContain('Now: #PnP #solo');
    });

    it('stores tags in the chosen location', async () => {
        await mount(<Probe userId={USER_ID} />);

        await execute({
            bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, tags: ['#missing-card'], location: 'hasparts',
        });

        expect(tagsMessage()?.formValues).toEqual({ haspartslist: '#missing-card' });
    });

    it('sends nothing when the tags would not change', async () => {
        await mount(<Probe userId={USER_ID} />);

        const result = await execute({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, tags: ['pnp'] });

        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('No change');
        expect(tagsMessage()).toBeUndefined();
    });

    it('refuses to tag an item that belongs to another game', async () => {
        await mount(<Probe userId={USER_ID} />);
        const result = await execute({ bggId: 1, collectionId: ARK_NOVA_ITEM, tags: ['solo'] });
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('nothing was changed');
        expect(tagsMessage()).toBeUndefined();
    });

    it('rejects malformed tags, unknown locations and an empty add', async () => {
        await mount(<Probe userId={USER_ID} />);
        const badTag = await execute({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, tags: ['two words'] });
        const badLocation = await execute({
            bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, tags: ['solo'], location: 'comment',
        });
        const emptyAdd = await execute({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, tags: [] });
        expect([badTag.isError, badLocation.isError, emptyAdd.isError]).toEqual([true, true, true]);
        expect(dispatchExtensionMessage).not.toHaveBeenCalled();
    });

    it('reports an error when the extension does not confirm the tags', async () => {
        dispatchExtensionMessage.mockImplementation(async (detail: { type: string }) =>
            detail.type === 'infoLoad' ? { response: { collectionItem: LOADED_ITEM } } : undefined);
        await mount(<Probe userId={USER_ID} />);
        const result = await execute({ bggId: ARK_NOVA_ID, collectionId: ARK_NOVA_ITEM, tags: ['solo'] });
        expect(result.isError).toBe(true);
    });
});
