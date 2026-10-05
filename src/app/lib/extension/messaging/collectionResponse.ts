import { DocumentMessageResponseDetail } from '@/app/lib/extension/messageTypes';

/**
 * The collection item id from an extension reply to a collection action, or throws when the extension
 * didn't confirm it. The item may be nested under `collectionItem`, as ExtensionMessagingProvider reads it.
 */
export const confirmCollectionItemId = (
    // dispatchExtensionMessage resolves void when the message isn't sent
    result: DocumentMessageResponseDetail | undefined | void,
    action: string,
    bggId: number,
) => {
    const response = result?.response as Record<string, unknown> | undefined;
    const collectionItem = (response?.collectionItem ?? response) as Record<string, unknown> | undefined;
    const collid = collectionItem?.collid as string | number | undefined;
    if (!collid) {
        throw new Error(`The extension did not confirm the ${action} for BGG game ${bggId}`);
    }
    return { collid, response };
};
