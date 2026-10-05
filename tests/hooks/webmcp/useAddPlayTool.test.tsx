import { describe, it, expect, beforeEach, afterEach } from '../../setup';
import { vi } from 'vitest';
import { addPlay } from '@/app/lib/extension/messaging/addPlay';
import { useAddPlayTool } from '@/app/lib/hooks/webmcp/extension/useAddPlayTool';
import { makeStore } from '@/app/lib/redux/store';
import { todayString } from '@/app/lib/utils/date';
import { act, ReactNode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { WebMCPProvider } from 'webmcp-react';

vi.mock('@/app/lib/extension/messaging/addPlay', () => ({
    addPlay: vi.fn(),
}));

const USER_ID = '4317241';
const USERNAME = 'shelfscan';

type ProbeProps = { userId?: string; username?: string };

type ToolInfo = { name: string; inputSchema?: { properties?: Record<string, unknown> } };
type ToolResult = { isError?: boolean; content: { type: string; text: string }[] };
type ModelContext = {
    getTools: () => Promise<ToolInfo[]>;
    // like the native API, the polyfill resolves with the result serialized as JSON
    executeTool: (tool: { name: string }, input: object) => Promise<string>;
};

const Probe = ({ userId, username }: ProbeProps) => {
    useAddPlayTool(userId, username);
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

const lastAddPlayParams = () => vi.mocked(addPlay).mock.calls.at(-1)?.[0];

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('useAddPlayTool', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        vi.mocked(addPlay).mockReset();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    const mount = async (node: ReactNode) => {
        act(() => root.render(
            <Provider store={makeStore()}>
                <WebMCPProvider name="test" version="1.0">{node}</WebMCPProvider>
            </Provider>
        ));
        await flush();
    };

    it('registers the unavailable stub without a loaded user', async () => {
        await mount(<Probe />);
        const [tool] = await modelContext().getTools();
        expect(tool.name).toBe('log_bgg_play');
        expect(tool.inputSchema?.properties ?? {}).toEqual({});
    });

    it('logs a quick play for today', async () => {
        vi.mocked(addPlay).mockResolvedValue({ response: { playid: 7, numplays: 3 } } as never);
        await mount(<Probe userId={USER_ID} username={USERNAME} />);

        const result = await execute({ bggId: 342942, gameName: 'Ark Nova' });

        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain('3 plays');
        expect(lastAddPlayParams()).toMatchObject({
            userId: USER_ID,
            username: USERNAME,
            bggId: 342942,
            name: 'Ark Nova',
            date: todayString(),
            entries: { playdate: todayString() },
        });
    });

    it('sends the detailed play fields the extension reads', async () => {
        vi.mocked(addPlay).mockResolvedValue({ response: { playid: 8 } } as never);
        await mount(<Probe userId={USER_ID} username={USERNAME} />);

        await execute({
            bggId: 342942,
            playdate: '2026-10-04',
            location: 'Home',
            durationMinutes: 120,
            quantity: 3,
            incomplete: false,
            players: [{ name: 'Ana', username: 'ana', score: '101', win: true }, { name: 'Guest' }],
        });

        const entries = lastAddPlayParams()?.entries ?? {};
        expect(entries).toMatchObject({
            playdate: '2026-10-04',
            location: 'Home',
            duration: '120',
            quantity: '3',
            incomplete: '',
        });
        expect(JSON.parse(entries.players)).toEqual([
            { name: 'Ana', username: 'ana', score: '101', win: true },
            { name: 'Guest', username: '' },
        ]);
    });

    it('rejects a badly formatted play date', async () => {
        await mount(<Probe userId={USER_ID} username={USERNAME} />);
        const result = await execute({ bggId: 342942, playdate: '10/04/2026' });
        expect(result.isError).toBe(true);
        expect(addPlay).not.toHaveBeenCalled();
    });

    it('reports BGG errors from the extension', async () => {
        vi.mocked(addPlay).mockResolvedValue({ response: { error: true, message: 'play logging operation' } } as never);
        await mount(<Probe userId={USER_ID} username={USERNAME} />);
        const result = await execute({ bggId: 342942 });
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('play logging operation');
    });
});
