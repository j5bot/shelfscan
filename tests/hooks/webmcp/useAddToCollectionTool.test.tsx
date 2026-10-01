import { describe, it, expect, beforeEach, afterEach } from '../../setup';
import { vi } from 'vitest';
import { addToCollection } from '@/app/lib/extension/messaging/addToCollection';
import { useAddToCollectionTool } from '@/app/lib/hooks/webmcp/extension/useAddToCollectionTool';
import { BGGLoadCollectionInput } from '@/app/lib/hooks/webmcp/useBGGCollectionTool';
import { act, ReactNode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useMcpTool, WebMCPProvider } from 'webmcp-react';

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
    useAddToCollectionTool(userId);
    return <span>ok</span>;
};

// stands in for useBGGCollectionTool, which is registered alongside in McpToolsProvider
const LoadCollectionStub = () => {
    useMcpTool({
        name: 'bgg_load_collection',
        description: 'stub',
        input: BGGLoadCollectionInput,
        handler: () => ({ content: [] }),
    });
    return undefined;
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

describe('useAddToCollectionTool', () => {
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

    it('mounts without throwing', async () => {
        await expect(mount(<Probe userId={USER_ID} />)).resolves.toBeUndefined();
        expect(container.textContent).toBe('ok');
    });

    it('registers the collection-action input schema when enabled', async () => {
        await mount(<Probe userId={USER_ID} />);
        const tools = await modelContext().getTools();
        expect(tools).toHaveLength(1);
        expect(Object.keys(tools[0].inputSchema?.properties ?? {}).sort())
            .toEqual(['bggId', 'collectionId', 'gameName', 'type', 'versionId']);
    });

    it('does not collide with bgg_load_collection', async () => {
        await mount(<>
            <LoadCollectionStub />
            <Probe userId={USER_ID} />
        </>);
        const names = (await modelContext().getTools()).map(tool => tool.name);
        expect(names).toContain('bgg_load_collection');
        expect(names).toHaveLength(2);
    });

    it('rejects an unknown collection action type', async () => {
        await mount(<Probe userId={USER_ID} />);
        const result = await execute({ type: 'bogus', bggId: 1 });
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('invalid_value');
    });

    it('accepts a valid collection action', async () => {
        await mount(<Probe userId={USER_ID} />);
        vi.mocked(addToCollection).mockResolvedValue({ response: { collid: 99 } } as never);
        const result = await execute({ bggId: 342942, gameName: 'Ark Nova' });
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('99');
        expect(vi.mocked(addToCollection).mock.calls[0][0]).toMatchObject({
            mode: 'add',
            userId: USER_ID,
            bggId: 342942,
            name: 'Ark Nova',
        });
    });

    it('reads the collection item id when it is nested under collectionItem', async () => {
        vi.mocked(addToCollection).mockResolvedValue({ response: { collectionItem: { collid: 123 } } } as never);
        await mount(<Probe userId={USER_ID} />);
        const result = await execute({ bggId: 342942 });
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('123');
    });

    it('reports an error when the extension does not confirm the add', async () => {
        vi.mocked(addToCollection).mockResolvedValue(undefined);
        await mount(<Probe userId={USER_ID} />);
        const result = await execute({ bggId: 342942 });
        expect(result.isError).toBe(true);
    });

    it('registers the unavailable stub without a logged in user', async () => {
        await mount(<Probe />);
        const [tool] = await modelContext().getTools();
        expect(tool.inputSchema?.properties ?? {}).toEqual({});
    });
});
