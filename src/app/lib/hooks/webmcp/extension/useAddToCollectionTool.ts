import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { addToCollection } from '@/app/lib/extension/messaging/addToCollection';
import { withExtensionTimeout } from '@/app/lib/extension/messaging/withExtensionTimeout';
import { CollectionModes, ModeSetting } from '@/app/lib/extension/types';
import { McpToolConfigZod, useMcpTool } from 'webmcp-react';
import { z } from 'zod';

const AddToCollectionInputBaseSchema = {
    type: z.enum(CollectionModes)
        .describe('Type of collection action')
        .optional()
        .default('add'),
    collectionId: z.number()
        .min(1)
        .describe('User\'s collection id to update')
        .optional(),
    bggId: z.number()
        .min(1)
        .describe('BoardGameGeek game id'),
    versionId: z.number()
        .min(1)
        .describe('BoardGameGeek game version id')
        .optional(),
    gameName: z.string()
        .min(1)
        .describe('The BGG game name')
        .optional(),
};

const AddToCollectionInput = z.object(AddToCollectionInputBaseSchema);

const TOOL_BASE = {
    name: 'add_to_bgg_collection',
    title: 'Add game to BGG collection',
    description: 'Add a game to the logged in user\'s BGG collection. The browser must have' +
                 ' the ShelfScan extension installed and have a subscription in order to use' +
                 ' this tool.',
};

const UNAVAILABLE_TOOL: McpToolConfigZod = {
    ...TOOL_BASE,
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
};

// userId is the active ShelfScan BGG user (set by bgg_load_collection); the tool is unavailable without one
export const useAddToCollectionTool = (userId?: string) => {
    const { dispatchExtensionMessage } = useExtensionMessaging();

    // useMcpTool re-registers when the schema changes and always calls the latest handler,
    // so the config is derived on every render rather than kept in state
    const addConfig: McpToolConfigZod<typeof AddToCollectionInput> = {
        ...TOOL_BASE,
        input: AddToCollectionInput,
        annotations: { readOnlyHint: false },
        handler: async (params) => {
            const { type, collectionId, bggId, versionId, gameName } = params;
            if (!userId) {
                throw new Error('No BGG user is logged in to the ShelfScan extension');
            }

            const result = await withExtensionTimeout(Promise.resolve(addToCollection({
                mode: type,
                modeSetting: {} as ModeSetting,
                entries: {},
                userId,
                collectionId,
                bggId,
                versionId,
                name: gameName,
                dispatchExtensionMessage,
            })));

            const response = result?.response as Record<string, unknown> | undefined;
            // same shape ExtensionMessagingProvider reads: the item may be nested under collectionItem
            const collectionItem = (response?.collectionItem ?? response) as Record<string, unknown> | undefined;
            const collid = collectionItem?.collid;
            if (!collid) {
                throw new Error(`The extension did not confirm the ${type} for BGG game ${bggId}`);
            }

            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `${type} of ${gameName ?? `BGG game ${bggId}`} for BGG user ${userId} `
                              + `succeeded; collection item id: ${collid}.`,
                    }
                ],
                structuredContent: { collectionId: collid, response },
            };
        },
    };
    const config = (userId ? addConfig : UNAVAILABLE_TOOL) as McpToolConfigZod;

    useMcpTool(config);

    return config;
};
