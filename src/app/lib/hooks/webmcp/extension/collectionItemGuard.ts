import { RootState } from '@/app/lib/redux/store';
import { BggCollectionItem } from '@/app/lib/types/bgg';

/**
 * The loaded collection's item for `collectionId`, checked against the game it should be. Destructive tools
 * call this first so a wrong or guessed collection id can't change or delete some other game.
 */
export const getMatchingCollectionItem = (
    state: RootState,
    collectionId: number,
    bggId: number,
): BggCollectionItem => {
    const username = state.bgg.user?.user?.toLowerCase();
    const collection = username ? state.bgg.collection.users[username] : undefined;
    if (!collection) {
        throw new Error('No BGG collection is loaded in ShelfScan; load the user\'s collection first '
                        + 'so the collection item can be checked');
    }
    const item = collection.items[collectionId];
    if (!item) {
        throw new Error(`Collection item ${collectionId} is not in the loaded collection; reload the collection `
                        + 'and use a collection id from it');
    }
    if (item.objectId !== bggId) {
        throw new Error(`Collection item ${collectionId} is ${item.name} (BGG game ${item.objectId}), `
                        + `not BGG game ${bggId}; nothing was changed`);
    }
    return item;
};
