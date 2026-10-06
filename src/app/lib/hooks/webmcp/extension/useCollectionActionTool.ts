import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { addToCollection } from '@/app/lib/extension/messaging/addToCollection';
import { confirmCollectionItemId } from '@/app/lib/extension/messaging/collectionResponse';
import { withExtensionTimeout } from '@/app/lib/extension/messaging/withExtensionTimeout';
import { CollectionModes, FormValues, ModeSetting } from '@/app/lib/extension/types';
import { CollectionItemInputValues } from '@/app/lib/hooks/webmcp/extension/collectionItemInput';
import { makeUnavailableTool } from '@/app/lib/hooks/webmcp/extension/unavailableTool';
import { ExtensionToolAccess } from '@/app/lib/types/extensionToolAccess';
import { McpToolConfigZod, useMcpTool } from 'webmcp-react';
import { ZodObjectSchema } from 'webmcp-react/types';
import { z } from 'zod';

type ToolBase = {
    name: string;
    title: string;
    description: string;
};

type ActionParams<T extends ZodObjectSchema> = z.output<T> & CollectionItemInputValues;

export type CollectionActionToolOptions<T extends ZodObjectSchema> = {
    /** Name, title and description, shared by the real tool and its unavailable stand-in */
    base: ToolBase;
    /** Input schema, usually CollectionItemInput extended with the action's own fields */
    input: T;
    /** The extension's collection mode for this action, or a function choosing it per call */
    mode: CollectionModes | ((params: ActionParams<T>) => CollectionModes);
    /** The active ShelfScan BGG user (set by load_bgg_collection) when the tool can run, otherwise why not */
    access: ExtensionToolAccess;
    /** Form values the extension reads for this mode */
    makeEntries?: (params: ActionParams<T>) => FormValues;
    /** Runs before anything is sent; throw to refuse the call */
    check?: (params: ActionParams<T>) => void;
    /** The success message */
    describeResult: (params: ActionParams<T>, collid: string | number) => string;
};

/** A WebMCP tool that runs one extension collection action (addToCollection in a given mode). */
export const useCollectionActionTool = <T extends ZodObjectSchema>(options: CollectionActionToolOptions<T>) => {
    const { base, input, mode, access, makeEntries, check, describeResult } = options;
    const { userId, canUseExtension, unavailableMessage } = access;
    const { dispatchExtensionMessage } = useExtensionMessaging();

    // useMcpTool re-registers when the schema changes and always calls the latest handler,
    // so the config is derived on every render rather than kept in state
    const actionConfig: McpToolConfigZod<T> = {
        ...base,
        input,
        annotations: { readOnlyHint: false },
        handler: async (rawParams) => {
            const params = rawParams as ActionParams<T>;
            const { bggId, gameName, versionId, collectionId } = params;
            if (!userId) {
                throw new Error('No BGG user is loaded in ShelfScan');
            }
            check?.(params);
            const actionMode = typeof mode === 'function' ? mode(params) : mode;

            const result = await withExtensionTimeout(Promise.resolve(addToCollection({
                mode: actionMode,
                modeSetting: {} as ModeSetting,
                entries: makeEntries?.(params) ?? {},
                userId,
                collectionId,
                bggId,
                versionId,
                name: gameName,
                dispatchExtensionMessage,
            })));

            const { collid, response } = confirmCollectionItemId(result, actionMode, bggId);

            return {
                content: [{ type: 'text' as const, text: describeResult(params, collid) }],
                structuredContent: { collectionId: collid, updated: !!collectionId, response },
            };
        },
    };
    const config = (canUseExtension && userId
                    ? actionConfig
                    : makeUnavailableTool(base, unavailableMessage)) as McpToolConfigZod;

    useMcpTool(config);

    return config;
};
