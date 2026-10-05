import { CollectionItemInput } from '@/app/lib/hooks/webmcp/extension/collectionItemInput';
import { useCollectionActionTool } from '@/app/lib/hooks/webmcp/extension/useCollectionActionTool';

const AddToCollectionInput = CollectionItemInput;

const TOOL_BASE = {
    name: 'add_to_bgg_collection',
    title: 'Add game to BGG collection',
    description: 'Add a game to the logged in user\'s BGG collection. The browser must have' +
                 ' the ShelfScan extension installed and have a subscription in order to use' +
                 ' this tool.',
};

// userId is the active ShelfScan BGG user (set by bgg_load_collection); the tool is unavailable without one
export const useAddToCollectionTool = (userId?: string) => useCollectionActionTool({
    base: TOOL_BASE,
    input: AddToCollectionInput,
    mode: 'add',
    userId,
    describeResult: ({ bggId, gameName }, collid) =>
        `Add of ${gameName ?? `BGG game ${bggId}`} for BGG user ${userId} `
        + `succeeded; collection item id: ${collid}.`,
});
