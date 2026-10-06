import { McpToolConfigZod } from 'webmcp-react';
import { z } from 'zod';

type ToolBase = Pick<McpToolConfigZod, 'name' | 'title' | 'description'>;

const DEFAULT_UNAVAILABLE_MESSAGE = 'Unavailable when ShelfScan extension is not installed or there is no subscription';

/**
 * The stand-in registered for an extension tool while it can't run (no extension, subscription or BGG user,
 * or the extension is logged in as a different BGG user); calling it explains why.
 */
export const makeUnavailableTool = (base: ToolBase, message = DEFAULT_UNAVAILABLE_MESSAGE): McpToolConfigZod => ({
    ...base,
    input: z.object({}),
    handler: async () => {
        return {
            content: [{ type: 'text', text: message }],
        };
    },
});
