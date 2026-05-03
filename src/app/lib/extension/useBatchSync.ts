'use client';

import { useExtensionMessaging } from '@/app/lib/extension/useExtension';
import { useSync } from '@/app/lib/extension/useSync';
import { GameUPCBggInfo } from 'gameupc-hooks/types';
import { useCallback } from 'react';

export const useBatchSync = () => {
    const { syncOn, userId, currentUsername } = useSync();
    const { dispatchExtensionMessage } = useExtensionMessaging();

    const canBatch = !!(syncOn && userId && currentUsername);

    const addGameToCollection = useCallback((
        info: GameUPCBggInfo,
        collectionId: number | undefined,
    ) => {
        if (!userId) {
            return Promise.resolve(false);
        }
        return dispatchExtensionMessage({
            userId,
            type: 'add',
            collectionId,
            name: info.name,
            gameId: info.id,
            formValues: {},
        });
    }, [userId]);

    return {
        syncOn,
        userId,
        currentUsername,
        canBatch,
        addGameToCollection,
    };
};

