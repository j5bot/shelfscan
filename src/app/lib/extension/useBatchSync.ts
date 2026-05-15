import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { useSync } from '@/app/lib/extension/useSync';
import { GameUPCBggInfo } from 'gameupc-hooks/types';
import { useCallback } from 'react';

export const useBatchSync = () => {
    const { syncOn, userId, currentUsername } = useSync();
    const { dispatchExtensionMessage } = useExtensionMessaging();

    const canBatch = !!(syncOn && userId && currentUsername);

    const addGameToCollection = useCallback((
        info: GameUPCBggInfo,
        versionId?: number,
        collectionId?: number,
    ) => {
        if (!userId) {
            return Promise.resolve(undefined);
        }
        return dispatchExtensionMessage({
            userId,
            type: 'add',
            collectionId,
            name: info.name,
            gameId: info.id,
            versionId: versionId,
            info,
            formValues: {},
        });
    }, [userId, dispatchExtensionMessage]);

    return {
        syncOn,
        userId,
        currentUsername,
        canBatch,
        addGameToCollection,
    };
};

