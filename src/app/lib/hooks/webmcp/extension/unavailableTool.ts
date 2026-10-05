import { McpToolConfigZod } from 'webmcp-react';
import { z } from 'zod';

type ToolBase = Pick<McpToolConfigZod, 'name' | 'title' | 'description'>;

/** The stand-in registered for an extension tool while the extension, a subscription or a BGG user is missing. */
export const makeUnavailableTool = (base: ToolBase): McpToolConfigZod => ({
    ...base,
    input: z.object({}),
    handler: async () => {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Unavailable when ShelfScan extension is not' +
                          ' installed or there is no subscription'
                }
            ],
        };
    },
});
