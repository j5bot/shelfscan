'use client';

import { useSync } from '@/app/lib/extension/useSync';
import { GameUPCBggInfo } from 'gameupc-hooks/types';
import { useCallback } from 'react';

export const useBatchSync = () => {
    const { syncOn, userId, currentUsername } = useSync();

    const canBatch = !!(syncOn && userId && currentUsername);

    const addGameToCollection = useCallback((
        info: GameUPCBggInfo,
        collectionId: number | undefined,
    ) => {
        if (!userId) {
            return;
        }
        const ce = new CustomEvent('shelfscan-sync', {
            detail: {
                userId,
                type: 'add',
                collectionId,
                name: info.name,
                gameId: info.id,
                timestamp: Date.now(),
                formValues: {},
            },
        });
        document.dispatchEvent(ce);
    }, [userId]);

    return {
        syncOn,
        userId,
        currentUsername,
        canBatch,
        addGameToCollection,
    };
};

