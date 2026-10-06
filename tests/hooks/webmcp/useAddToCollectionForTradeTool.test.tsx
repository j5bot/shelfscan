import { describe, it, expect, beforeEach, afterEach } from '../../setup';
import { vi } from 'vitest';
import { addToCollection } from '@/app/lib/extension/messaging/addToCollection';
import { useAddToCollectionForTradeTool } from '@/app/lib/hooks/webmcp/extension/useAddToCollectionForTradeTool';
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
    useAddToCollectionForTradeTool({ canUseExtension: !!userId, userId });
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

describe('useAddToCollectionForTradeTool', () => {
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
        expect(tool.name).toBe('add_to_bgg_collection_for_trade');
        expect(tool.inputSchema?.properties ?? {}).toEqual({});
    });

    it('adds a new item in trade mode with its condition when no collectionId is given', async () => {
        vi.mocked(addToCollection).mockResolvedValue({ response: { collectionItem: { collid: 55 } } } as never);
        await mount(<Probe userId={USER_ID} />);

        const result = await execute({ bggId: 342942, gameName: 'Ark Nova', tradeCondition: 'Like new' });

        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('Added Ark Nova for trade');
        expect(lastParams()).toMatchObject({
            mode: 'trade',
            entries: { tradecondition: 'Like new' },
            userId: USER_ID,
            bggId: 342942,
            collectionId: undefined,
        });
    });

    it('updates the given collection item when a collectionId is given', async () => {
        vi.mocked(addToCollection).mockResolvedValue({ response: { collectionItem: { collid: 77 } } } as never);
        await mount(<Probe userId={USER_ID} />);

        const result = await execute({ bggId: 342942, tradeCondition: 'Worn box', collectionId: 77 });

        expect(result.content[0].text).toContain('Marked BGG game 342942 for trade');
        expect(lastParams()?.collectionId).toBe(77);
    });

    it('requires a trade condition', async () => {
        await mount(<Probe userId={USER_ID} />);
        const result = await execute({ bggId: 342942, tradeCondition: '   ' });
        expect(result.isError).toBe(true);
        expect(addToCollection).not.toHaveBeenCalled();
    });

    it('reports an error when the extension does not confirm the trade', async () => {
        vi.mocked(addToCollection).mockResolvedValue(undefined);
        await mount(<Probe userId={USER_ID} />);
        const result = await execute({ bggId: 342942, tradeCondition: 'Like new' });
        expect(result.isError).toBe(true);
    });
});
