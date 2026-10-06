import { CollectionItemInput } from '@/app/lib/hooks/webmcp/extension/collectionItemInput';
import { useCollectionActionTool } from '@/app/lib/hooks/webmcp/extension/useCollectionActionTool';
import { ExtensionToolAccess } from '@/app/lib/types/extensionToolAccess';

const SetPreviouslyOwnedInput = CollectionItemInput.extend({
    collectionId: CollectionItemInput.shape.collectionId
        .describe('Existing collection item to set as previously owned; leave out to add a new item '
                  + 'as previously owned'),
});

const TOOL_BASE = {
    name: 'set_bgg_previously_owned',
    title: 'Set BGG collection item as previously owned',
    description: 'Mark a game as previously owned in the logged in user\'s BGG collection, which also turns off '
                 + '"own". Updates the existing collection item when a collectionId is given, otherwise adds a new '
                 + 'item as previously owned. The browser must have the ShelfScan extension installed and have a '
                 + 'subscription in order to use this tool.',
};

export const useSetPreviouslyOwnedTool = (access: ExtensionToolAccess) => useCollectionActionTool({
    base: TOOL_BASE,
    input: SetPreviouslyOwnedInput,
    mode: 'previous',
    access,
    describeResult: ({ bggId, gameName, collectionId }, collid) =>
        `Set ${gameName ?? `BGG game ${bggId}`} as previously owned`
        + `${collectionId ? '' : ' as a new collection item'} for BGG user ${access.userId}; collection item id: ${collid}.`,
});
