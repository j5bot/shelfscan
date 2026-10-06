import { useStore } from '@/app/lib/hooks';
import { getMatchingCollectionItem } from '@/app/lib/hooks/webmcp/extension/collectionItemGuard';
import { CollectionItemInput } from '@/app/lib/hooks/webmcp/extension/collectionItemInput';
import { useCollectionActionTool } from '@/app/lib/hooks/webmcp/extension/useCollectionActionTool';
import { ExtensionToolAccess } from '@/app/lib/types/extensionToolAccess';
import { z } from 'zod';

const RemoveCollectionItemInput = CollectionItemInput.extend({
    collectionId: CollectionItemInput.shape.collectionId.unwrap()
        .describe('The collection item to permanently delete; it must be in the loaded collection and be '
                  + 'this bggId\'s item'),
    confirmPermanentDelete: z.literal(true)
        .describe('Must be true. Confirms the user explicitly asked to permanently delete this collection item '
                  + 'and understands it cannot be undone'),
});

const TOOL_BASE = {
    name: 'remove_bgg_collection_item',
    title: 'Permanently delete BGG collection item (cannot be undone)',
    description: 'IRREVERSIBLE: permanently deletes an item from the logged in user\'s BGG collection, including '
                 + 'its statuses, rating, comments, trade condition, wishlist details and private info. This cannot '
                 + 'be undone. Only use it when the user has explicitly asked to delete this specific item. To stop '
                 + 'owning a game use set_bgg_previously_owned, and to drop its statuses but keep the item use '
                 + 'clear_bgg_collection_statuses. The item must be in the loaded collection (load_bgg_collection) '
                 + 'and match bggId, otherwise nothing is deleted. The browser must have the ShelfScan extension '
                 + 'installed and have a subscription in order to use this tool.',
};

export const useRemoveCollectionItemTool = (access: ExtensionToolAccess) => {
    const store = useStore();

    return useCollectionActionTool({
        base: TOOL_BASE,
        input: RemoveCollectionItemInput,
        mode: 'clear',
        access,
        // the extension deletes (rather than clears) the item when formValues.shouldRemove is set
        makeEntries: () => ({ shouldRemove: 'remove' }),
        // a wrong or guessed collection id must not delete some other game
        check: ({ collectionId, bggId }) => {
            getMatchingCollectionItem(store.getState(), collectionId, bggId);
        },
        describeResult: ({ bggId, gameName, collectionId }) =>
            `Permanently deleted ${gameName ?? `BGG game ${bggId}`} (collection item ${collectionId}) `
            + `from BGG user ${access.userId}'s collection. This cannot be undone.`,
    });
};
