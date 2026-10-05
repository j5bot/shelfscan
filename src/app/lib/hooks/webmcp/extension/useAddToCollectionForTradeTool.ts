import { CollectionItemInput } from '@/app/lib/hooks/webmcp/extension/collectionItemInput';
import { useCollectionActionTool } from '@/app/lib/hooks/webmcp/extension/useCollectionActionTool';
import { z } from 'zod';

const AddToCollectionForTradeInput = CollectionItemInput.extend({
    tradeCondition: z.string()
        .trim()
        .min(1, 'A trade condition is required')
        .describe('Condition of the copy being traded, shown to other traders, e.g. "Like new, cards sleeved"'),
    collectionId: CollectionItemInput.shape.collectionId
        .describe('Existing collection item to mark for trade; leave out to add a new item marked for trade'),
});

const TOOL_BASE = {
    name: 'add_to_bgg_collection_for_trade',
    title: 'Add game to BGG collection for trade',
    description: 'Mark a game as for trade in the logged in user\'s BGG collection, with its trade condition. '
                 + 'Updates the existing collection item when a collectionId is given, otherwise adds a new item '
                 + 'marked for trade. The browser must have the ShelfScan extension installed and have a '
                 + 'subscription in order to use this tool.',
};

// a collectionId updates that item; without one the extension adds a new item marked for trade
export const useAddToCollectionForTradeTool = (userId?: string) => useCollectionActionTool({
    base: TOOL_BASE,
    input: AddToCollectionForTradeInput,
    mode: 'trade',
    userId,
    // the extension saves formValues.tradecondition as the item's condition text
    makeEntries: ({ tradeCondition }) => ({ tradecondition: tradeCondition }),
    describeResult: ({ bggId, gameName, collectionId, tradeCondition }, collid) =>
        `${collectionId ? 'Marked' : 'Added'} ${gameName ?? `BGG game ${bggId}`} for trade for BGG user ${userId} `
        + `(condition: ${tradeCondition}); collection item id: ${collid}.`,
});
