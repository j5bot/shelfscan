import { getCollection } from '@/app/lib/database/database';
import { BggCollectionMap } from '@/app/lib/types/bgg';

/** The collection saved in IndexedDB for a BGG user, or undefined when none or an empty one is stored. */
export const readStoredCollection = async (username: string): Promise<BggCollectionMap | undefined> => {
    const map = await getCollection(username.toLowerCase());
    if (!map || Object.keys(map).length === 0) {
        return undefined;
    }
    return map;
};
