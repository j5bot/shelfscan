import { describe, it, expect, beforeEach, afterEach } from '../../setup';
import { vi } from 'vitest';
import { addToCollection } from '@/app/lib/extension/messaging/addToCollection';
import { useAddToWishlistTool } from '@/app/lib/hooks/webmcp/extension/useAddToWishlistTool';
import { act, ReactNode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { WebMCPProvider } from 'webmcp-react';

vi.mock('@/app/lib/extension/messaging/addToCollection', () => ({
    addToCollection: vi.fn(),
}));

const USER_ID = '4317241';

type ProbeProps = { userId?: string };

type ToolInfo = { name: string; inputSchema?: { properties?: Record<string, unknown> } };
type ToolResult = { isError?: boolean; content: { type: string; text: string }[] };
type ModelContext = {
    getTools: () => Promise<ToolInfo[]>;
    // like the native API, the polyfill resolves with the result serialized as JSON
    executeTool: (tool: { name: string }, input: object) => Promise<string>;
};

const Probe = ({ userId }: ProbeProps) => {
    useAddToWishlistTool({ canUseExtension: !!userId, userId });
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

describe('useAddToWishlistTool', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        vi.mocked(addToCollection).mockReset();
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
        expect(tool.name).toBe('add_to_bgg_wishlist');
        expect(tool.inputSchema?.properties ?? {}).toEqual({});
    });

    it('adds a new wishlist item with the default priority when no collectionId is given', async () => {
        vi.mocked(addToCollection).mockResolvedValue({ response: { collectionItem: { collid: 91 } } } as never);
        await mount(<Probe userId={USER_ID} />);

        const result = await execute({ bggId: 342942, gameName: 'Ark Nova' });

        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('as a new collection item');
        expect(result.content[0].text).toContain('priority 3, Like to Have');
        expect(lastParams()).toMatchObject({
            mode: 'wishlist',
            entries: { priority: '3' },
            userId: USER_ID,
            bggId: 342942,
            collectionId: undefined,
        });
    });

    it('updates the given collection item with the given priority', async () => {
        vi.mocked(addToCollection).mockResolvedValue({ response: { collectionItem: { collid: 77 } } } as never);
        await mount(<Probe userId={USER_ID} />);

        const result = await execute({ bggId: 342942, priority: 1, collectionId: 77 });

        expect(result.content[0].text).toContain('priority 1, Must Have');
        expect(result.content[0].text).not.toContain('new collection item');
        expect(lastParams()).toMatchObject({ entries: { priority: '1' }, collectionId: 77 });
    });

    it('rejects a priority outside 1-5', async () => {
        await mount(<Probe userId={USER_ID} />);
        const result = await execute({ bggId: 342942, priority: 6 });
        expect(result.isError).toBe(true);
        expect(addToCollection).not.toHaveBeenCalled();
    });

    it('reports an error when the extension does not confirm the wishlist add', async () => {
        vi.mocked(addToCollection).mockResolvedValue(undefined);
        await mount(<Probe userId={USER_ID} />);
        const result = await execute({ bggId: 342942 });
        expect(result.isError).toBe(true);
    });
});
