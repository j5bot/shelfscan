import { CollectionItemInput } from '@/app/lib/hooks/webmcp/extension/collectionItemInput';
import { useCollectionActionTool } from '@/app/lib/hooks/webmcp/extension/useCollectionActionTool';
import { z } from 'zod';

// BGG's wishlist priorities, worded as in the collection's wishlist priority filter
const WishlistPriorityLabels: Record<number, string> = {
    1: 'Must Have',
    2: 'Love to Have',
    3: 'Like to Have',
    4: 'Considering',
    5: 'Don\'t Buy',
};

const AddToWishlistInput = CollectionItemInput.extend({
    priority: z.number()
        .int()
        .min(1)
        .max(5)
        .default(3)
        .describe('Wishlist priority: 1 Must Have, 2 Love to Have, 3 Like to Have (default), '
                  + '4 Considering, 5 Don\'t Buy'),
    collectionId: CollectionItemInput.shape.collectionId
        .describe('Existing collection item to add to the wishlist; leave out to add a new wishlist item'),
});

const TOOL_BASE = {
    name: 'add_to_bgg_wishlist',
    title: 'Add game to BGG wishlist',
    description: 'Add a game to the logged in user\'s BGG wishlist with a wishlist priority. '
                 + 'Updates the existing collection item when a collectionId is given, otherwise adds a new item '
                 + 'on the wishlist. The browser must have the ShelfScan extension installed and have a '
                 + 'subscription in order to use this tool.',
};

// a collectionId updates that item; without one the extension adds a new item on the wishlist
export const useAddToWishlistTool = (userId?: string) => useCollectionActionTool({
    base: TOOL_BASE,
    input: AddToWishlistInput,
    mode: 'wishlist',
    userId,
    // the extension reads the wishlist priority from formValues.priority
    makeEntries: ({ priority }) => ({ priority: String(priority) }),
    describeResult: ({ bggId, gameName, collectionId, priority }, collid) =>
        `Added ${gameName ?? `BGG game ${bggId}`} to the wishlist${collectionId ? '' : ' as a new collection item'} `
        + `for BGG user ${userId} (priority ${priority}, ${WishlistPriorityLabels[priority]}); `
        + `collection item id: ${collid}.`,
});
