import { DispatchExtensionMessage } from '@/app/lib/extension/ExtensionMessagingProvider';
import { withExtensionTimeout } from '@/app/lib/extension/messaging/withExtensionTimeout';
import { InfoLoadItem } from '@/app/lib/utils/collectionInfo';

export type LoadCollectionItemParams = {
    userId: string;
    collectionId: number;
    bggId: number;
    versionId?: number;
    dispatchExtensionMessage: DispatchExtensionMessage;
};

/**
 * The collection item as it is on BGG now, loaded by the extension (infoLoad). Throws when it can't be loaded,
 * or when it is some other game's item, so a wrong or guessed collection id can't change some other game.
 */
export const loadCollectionItem = async (params: LoadCollectionItemParams): Promise<InfoLoadItem> => {
    const { userId, collectionId, bggId, versionId, dispatchExtensionMessage } = params;
    const loadResult = await withExtensionTimeout(Promise.resolve(dispatchExtensionMessage({
        userId,
        type: 'infoLoad',
        collectionId,
        gameId: bggId,
        versionId,
    })));
    const item = (loadResult?.response as { collectionItem?: InfoLoadItem } | undefined)?.collectionItem;
    if (!item) {
        throw new Error(`The extension could not load collection item ${collectionId} from BGG`);
    }
    if (item.objectid != null && Number(item.objectid) !== bggId) {
        throw new Error(`Collection item ${collectionId} is BGG game ${item.objectid}, not BGG game ${bggId}; `
                        + 'nothing was changed');
    }
    return item;
};
