import { DispatchExtensionMessage } from '@/app/lib/extension/ExtensionMessagingProvider';
import { syncNumPlays } from '@/app/lib/extension/messaging/syncNumPlays';
import { updateNumPlays } from '@/app/lib/redux/bgg/collection/slice';
import { Dispatch } from '@reduxjs/toolkit';

export type AddPlayParams = {
    entries: Record<string, string>;
    userId: string;
    username: string;
    collectionId?: number;
    bggId: number;
    versionId?: number;
    name?: string;
    date: string;
    dispatch: Dispatch<ReturnType<typeof updateNumPlays>>;
    dispatchExtensionMessage: DispatchExtensionMessage;
};

export const addPlay = (params: AddPlayParams) => {
    const {
        entries,
        userId,
        collectionId,
        bggId,
        versionId,
        name,
        date,
        dispatchExtensionMessage,
    } = params;

    return dispatchExtensionMessage({
        userId,
        collectionId,
        type: 'plays',
        name,
        gameId:  bggId,
        versionId,
        date,
        playdate: date,
        formValues: entries,
    })?.then(details => {
        syncNumPlays(params, details);
        return details;
    });
};
