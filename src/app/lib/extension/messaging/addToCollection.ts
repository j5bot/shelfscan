import { AddToCollectionParams } from '@/app/lib/extension/useExtension';

export const addToCollection = async (params: AddToCollectionParams) => {
    const {
        mode,
        modeSetting,
        entries,
        userId,
        collectionId,
        bggId,
        versionId,
        name,
        dispatchExtensionMessage,
    } = params;

    if (modeSetting.validator && (Object.keys(entries).length === 0 || !modeSetting.validator(entries))) {
        // TODO: handle invalid cases
        return;
    }

    return dispatchExtensionMessage({
        userId,
        type: mode,
        collectionId,
        name,
        gameId: bggId,
        versionId,
        formValues: entries,
    });
};
