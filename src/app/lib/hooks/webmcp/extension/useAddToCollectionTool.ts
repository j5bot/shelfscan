import { CollectionItemInput } from '@/app/lib/hooks/webmcp/extension/collectionItemInput';
import { useCollectionActionTool } from '@/app/lib/hooks/webmcp/extension/useCollectionActionTool';
import { ExtensionToolAccess } from '@/app/lib/types/extensionToolAccess';

const AddToCollectionInput = CollectionItemInput;

const TOOL_BASE = {
    name: 'add_to_bgg_collection',
    title: 'Add game to BGG collection',
    description: 'Add a game to the logged in user\'s BGG collection. The browser must have' +
                 ' the ShelfScan extension installed and have a subscription in order to use' +
                 ' this tool.',
};

// access holds the active ShelfScan BGG user (set by load_bgg_collection); the tool is unavailable without it
export const useAddToCollectionTool = (access: ExtensionToolAccess) => useCollectionActionTool({
    base: TOOL_BASE,
    input: AddToCollectionInput,
    mode: 'add',
    access,
    describeResult: ({ bggId, gameName }, collid) =>
        `Add of ${gameName ?? `BGG game ${bggId}`} for BGG user ${access.userId} `
        + `succeeded; collection item id: ${collid}.`,
});
