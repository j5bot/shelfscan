import { useStore } from '@/app/lib/hooks';
import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { addToCollection } from '@/app/lib/extension/messaging/addToCollection';
import { loadCollectionItem } from '@/app/lib/extension/messaging/loadCollectionItem';
import { confirmCollectionItemId } from '@/app/lib/extension/messaging/collectionResponse';
import { withExtensionTimeout } from '@/app/lib/extension/messaging/withExtensionTimeout';
import { ModeSetting } from '@/app/lib/extension/types';
import { CollectionItemInput } from '@/app/lib/hooks/webmcp/extension/collectionItemInput';
import { makeUnavailableTool } from '@/app/lib/hooks/webmcp/extension/unavailableTool';
import { ExtensionToolAccess } from '@/app/lib/types/extensionToolAccess';
import { PossibleStatuses, PossibleStatusesLabels } from '@/app/lib/types/bgg';
import {
    INFO_FORM_FIELD_NAMES,
    InfoFieldKind,
    InfoFormField,
    InfoFormFields,
    InfoUpdates,
    InfoValues,
    mergeInfoFormValues,
    readLoadedInfo,
} from '@/app/lib/utils/collectionInfo';
import { CURRENCY_CODES } from '@/app/lib/utils/currencies';
import { McpToolConfigZod, useMcpTool } from 'webmcp-react';
import { z } from 'zod';

const STATUS_NAMES = PossibleStatuses
    .map((status, index) => `${status} (${PossibleStatusesLabels[index]})`)
    .join(', ');

const CLEARS = 'an empty string clears it';

type InfoFieldInput = {
    schema: z.ZodType;
    /** Appended to the field's description */
    hint?: string;
};

// each kind of info form control, as the value an agent may send for it
const InfoFieldInputs: Record<InfoFieldKind, InfoFieldInput> = {
    currency: { schema: z.enum(CURRENCY_CODES) },
    date: {
        schema: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'), z.literal('')]),
        hint: CLEARS,
    },
    price: { schema: z.union([z.number().min(0), z.literal('')]), hint: CLEARS },
    statuses: { schema: z.array(z.enum(PossibleStatuses)), hint: `any of ${STATUS_NAMES}` },
    text: { schema: z.string(), hint: CLEARS },
};

// the info form's fields, each optional: a field left out keeps its value on BGG
const InfoFieldsShape = Object.fromEntries(INFO_FORM_FIELD_NAMES.map(field => {
    const { kind, description } = InfoFormFields[field];
    const { schema, hint } = InfoFieldInputs[kind];
    return [field, schema.optional().describe(hint ? `${description}; ${hint}` : description)];
})) as Record<InfoFormField, z.ZodOptional<z.ZodType>>;

const CollectionInfoInput = CollectionItemInput.extend({
    // required: info is only kept on an existing collection item
    collectionId: CollectionItemInput.shape.collectionId.unwrap()
        .describe('The collection item whose private info to read or update'),
    read: z.boolean()
        .default(false)
        .describe('true to only read the item\'s current info from BGG; nothing is saved and no info fields '
                  + 'may be sent'),
    preload: z.boolean()
        .default(false)
        .describe('true to load the item\'s current info from BGG before saving, so unchanged fields are re-sent '
                  + 'as they are and the previous values are returned'),
    ...InfoFieldsShape,
});

type CollectionInfoParams = z.output<typeof CollectionInfoInput>;

const TOOL_BASE = {
    name: 'bgg_collection_item_info',
    title: 'Read or update BGG collection item private info',
    description: 'Read or update the private info of an item in the logged in user\'s BGG collection (private '
                 + 'comment, statuses, trade condition, price paid, current value, acquisition and inventory '
                 + 'details). With read: true it returns the current info and saves nothing. Otherwise the info '
                 + 'fields sent are saved and fields left out keep their current value; add preload: true to also '
                 + 'get the values from before the update. The browser must have the ShelfScan extension installed '
                 + 'and have a subscription in order to use this tool.',
};

const describeInfo = (info: InfoValues) =>
    Object.entries(info)
        .map(([field, value]) => `${InfoFormFields[field as InfoFormField]?.label ?? field}: ${value}`)
        .join('; ') || 'no private info';

export const useCollectionInfoTool = (access: ExtensionToolAccess) => {
    const { userId, canUseExtension, unavailableMessage } = access;
    const { dispatchExtensionMessage } = useExtensionMessaging();

    const store = useStore();

    // without a preload, the loaded ShelfScan collection (when it has the item) guards against a wrong collection id
    const checkLoadedCollectionItem = (params: CollectionInfoParams) => {
        const { bggId, collectionId } = params;
        const state = store.getState();
        const username = state.bgg.user?.user?.toLowerCase();
        const item = username ? state.bgg.collection.users[username]?.items[collectionId] : undefined;
        if (item && item.objectId !== bggId) {
            throw new Error(`Collection item ${collectionId} is ${item.name} (BGG game ${item.objectId}), `
                            + `not BGG game ${bggId}; nothing was changed`);
        }
    };

    // useMcpTool re-registers when the schema changes and always calls the latest handler,
    // so the config is derived on every render rather than kept in state
    const infoConfig: McpToolConfigZod<typeof CollectionInfoInput> = {
        ...TOOL_BASE,
        input: CollectionInfoInput,
        annotations: { readOnlyHint: false },
        handler: async (params) => {
            const { bggId, gameName, versionId, collectionId, read, preload } = params;
            if (!userId) {
                throw new Error('No BGG user is loaded in ShelfScan');
            }
            const name = gameName ?? `BGG game ${bggId}`;

            const updates = Object.fromEntries(INFO_FORM_FIELD_NAMES
                .filter(field => params[field] !== undefined)
                .map(field => [field, params[field]])) as InfoUpdates;
            const hasUpdates = Object.keys(updates).length > 0;
            if (read && hasUpdates) {
                throw new Error(`read: true only reads the info; leave out ${Object.keys(updates).join(', ')} `
                                + 'or set read: false to save them');
            }
            if (!(read || hasUpdates)) {
                throw new Error('Send the info fields to update, or read: true to read the current info');
            }

            // the item's current info from BGG, checked against the game it should be
            const loaded = read || preload
                ? readLoadedInfo(await loadCollectionItem({
                    userId, collectionId, bggId, versionId, dispatchExtensionMessage,
                }))
                : undefined;
            if (read) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: `Private info of ${name} (collection item ${collectionId}): `
                              + `${describeInfo(loaded ?? {})}.`,
                    }],
                    structuredContent: { collectionId, info: loaded },
                };
            }
            if (!loaded) {
                checkLoadedCollectionItem(params);
            }

            const entries = mergeInfoFormValues(loaded ?? {}, updates);
            const result = await withExtensionTimeout(Promise.resolve(addToCollection({
                mode: 'info',
                modeSetting: {} as ModeSetting,
                entries,
                userId,
                collectionId,
                bggId,
                versionId,
                name: gameName,
                dispatchExtensionMessage,
            })));
            const { collid, response } = confirmCollectionItemId(result, 'info', bggId);

            const before = loaded ? ` Before: ${describeInfo(loaded)}.` : '';
            return {
                content: [{
                    type: 'text' as const,
                    text: `Updated the private info of ${name} (collection item ${collid}) for BGG user ${userId}.`
                          + `${before} Saved: ${describeInfo(entries)}.`,
                }],
                structuredContent: { collectionId: collid, previous: loaded, info: entries, response },
            };
        },
    };
    const config = (canUseExtension && userId
                    ? infoConfig
                    : makeUnavailableTool(TOOL_BASE, unavailableMessage)) as McpToolConfigZod;

    useMcpTool(config);

    return config;
};
