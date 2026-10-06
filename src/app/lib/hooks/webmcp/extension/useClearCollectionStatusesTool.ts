import { CollectionItemInput } from '@/app/lib/hooks/webmcp/extension/collectionItemInput';
import { useCollectionActionTool } from '@/app/lib/hooks/webmcp/extension/useCollectionActionTool';
import { ExtensionToolAccess } from '@/app/lib/types/extensionToolAccess';

const ClearCollectionStatusesInput = CollectionItemInput.extend({
    // required: without an existing item the extension would add a new item with no statuses
    collectionId: CollectionItemInput.shape.collectionId.unwrap()
        .describe('The collection item whose statuses to clear'),
});

const TOOL_BASE = {
    name: 'clear_bgg_collection_statuses',
    title: 'Clear BGG collection item statuses',
    description: 'Turn off every status (own, previously owned, for trade, want, wishlist, preordered, ...) on an '
                 + 'existing item in the logged in user\'s BGG collection. The item itself stays in the collection. '
                 + 'The browser must have the ShelfScan extension installed and have a subscription in order to '
                 + 'use this tool.',
};

export const useClearCollectionStatusesTool = (access: ExtensionToolAccess) => useCollectionActionTool({
    base: TOOL_BASE,
    input: ClearCollectionStatusesInput,
    mode: 'clear',
    access,
    describeResult: ({ bggId, gameName }, collid) =>
        `Cleared all statuses on ${gameName ?? `BGG game ${bggId}`} (collection item ${collid}) `
        + `for BGG user ${access.userId}.`,
});
