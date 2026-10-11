import { DispatchExtensionMessage } from '@/app/lib/extension/ExtensionMessagingProvider';
import { ModeSetting } from '@/app/lib/extension/types';
import { BggCollectionItem } from '@/app/lib/types/bgg';
import { useEffect, useEffectEvent } from 'react';

export type UseModeMessageOptions = {
    modeSetting: ModeSetting | undefined;
    userId: string | undefined;
    collectionItem: BggCollectionItem | undefined;
    dispatchExtensionMessage: DispatchExtensionMessage;
};

/**
 * Sends the mode's message (e.g. loading the item's info) once per user / item / mode; the item's own updates
 * (often caused by this message's response) must not re-send it.
 */
export const useModeMessage = (options: UseModeMessageOptions) => {
    const { modeSetting, userId, collectionItem, dispatchExtensionMessage } = options;

    const sendModeMessage = useEffectEvent(() => {
        if (modeSetting?.message && userId && collectionItem) {
            modeSetting.message(userId, dispatchExtensionMessage, collectionItem);
        }
    });

    const hasModeMessage = !!modeSetting?.message;
    const collectionId = collectionItem?.collectionId;
    useEffect(() => {
        sendModeMessage();
    }, [hasModeMessage, userId, collectionId]);
};
