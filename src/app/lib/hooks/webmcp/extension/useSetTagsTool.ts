import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { confirmCollectionItemId } from '@/app/lib/extension/messaging/collectionResponse';
import { loadCollectionItem } from '@/app/lib/extension/messaging/loadCollectionItem';
import { withExtensionTimeout } from '@/app/lib/extension/messaging/withExtensionTimeout';
import { CollectionItemInput } from '@/app/lib/hooks/webmcp/extension/collectionItemInput';
import { makeUnavailableTool } from '@/app/lib/hooks/webmcp/extension/unavailableTool';
import { ExtensionToolAccess } from '@/app/lib/types/extensionToolAccess';
import {
    applyTagChange,
    HASHTAG_PATTERN,
    SINGLE_TAG_PATTERN,
    TAG_LOCATION_NAMES,
    TagLocations,
} from '@/app/lib/utils/tags';
import { McpToolConfigZod, useMcpTool } from 'webmcp-react';
import { z } from 'zod';

const LOCATION_NAMES = TAG_LOCATION_NAMES
    .map(location => `${location} (${TagLocations[location].description})`)
    .join(', ');

// a versionId would also change the item's version, so tag edits leave it out
const SetTagsInput = CollectionItemInput.omit({ versionId: true }).extend({
    // required: tags are only kept on an existing collection item
    collectionId: CollectionItemInput.shape.collectionId.unwrap()
        .describe('The collection item to tag'),
    tags: z.array(z.string().trim().regex(SINGLE_TAG_PATTERN, 'Use a tag like #pnp or a value tag like #best-at=2'))
        .describe('Tags, with or without the leading #, e.g. #pnp, or value tags such as #best-at=2'),
    action: z.enum(['add', 'remove', 'set'])
        .default('add')
        .describe('add (default): add the tags, a value tag replacing the same tag\'s other value; remove: remove '
                  + 'the tags, a bare tag also removing its value tags; set: replace every tag in the location '
                  + 'with these, an empty list removing them all'),
    location: z.enum(TAG_LOCATION_NAMES)
        .default('wishlist')
        .describe(`Where the tags are stored on BGG: ${LOCATION_NAMES}. Defaults to wishlist`),
});

const TOOL_BASE = {
    name: 'set_bgg_collection_tags',
    title: 'Set BGG collection item tags',
    description: 'Add, remove or replace the hashtags on an item in the logged in user\'s BGG collection. Tags are '
                 + 'kept as hashtags in one of the item\'s text fields (the tag location); other text there is kept. '
                 + 'The browser must have the ShelfScan extension installed and have a subscription in order to '
                 + 'use this tool.',
};

const listTags = (text: string) => (text.match(HASHTAG_PATTERN) ?? []).join(' ') || 'no tags';

export const useSetTagsTool = (access: ExtensionToolAccess) => {
    const { userId, canUseExtension, unavailableMessage } = access;
    const { dispatchExtensionMessage } = useExtensionMessaging();

    // useMcpTool re-registers when the schema changes and always calls the latest handler,
    // so the config is derived on every render rather than kept in state
    const setTagsConfig: McpToolConfigZod<typeof SetTagsInput> = {
        ...TOOL_BASE,
        input: SetTagsInput,
        annotations: { readOnlyHint: false },
        handler: async (params) => {
            const { bggId, gameName, collectionId, tags, action, location } = params;
            if (!userId) {
                throw new Error('No BGG user is loaded in ShelfScan');
            }
            if (tags.length === 0 && action !== 'set') {
                throw new Error(`Give the tags to ${action}`);
            }
            const { field, description } = TagLocations[location];
            const name = gameName ?? `BGG game ${bggId}`;

            // the field's current text, so other text and tags in it are kept
            const item = await loadCollectionItem({ userId, collectionId, bggId, dispatchExtensionMessage });
            const previous = item.textfield?.[field]?.value ?? '';
            const text = applyTagChange(previous, tags, action);

            if (text === previous) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: `No change to the tags in ${description} of ${name} (collection item ${collectionId}): `
                              + `${listTags(text)}.`,
                    }],
                    structuredContent: { collectionId, location, field, previous, text, changed: false },
                };
            }

            const result = await withExtensionTimeout(Promise.resolve(dispatchExtensionMessage({
                userId,
                type: 'tags',
                collectionId,
                gameId: bggId,
                name: gameName,
                // the extension only writes the tag fields it is sent; an empty string clears the field
                formValues: { [field]: text },
            })));
            const { collid, response } = confirmCollectionItemId(result, 'tags', bggId);

            return {
                content: [{
                    type: 'text' as const,
                    text: `Updated the tags in ${description} of ${name} (collection item ${collid}) for BGG user `
                          + `${userId}. Before: ${listTags(previous)}. Now: ${listTags(text)}.`,
                }],
                structuredContent: { collectionId: collid, location, field, previous, text, changed: true, response },
            };
        },
    };
    const config = (canUseExtension && userId
                    ? setTagsConfig
                    : makeUnavailableTool(TOOL_BASE, unavailableMessage)) as McpToolConfigZod;

    useMcpTool(config);

    return config;
};
