'use client';

import { useSelector } from '@/app/lib/hooks/index';
import { RootState } from '@/app/lib/redux/store';
import { GameUPCBggInfo } from '@/app/lib/types/GameUPCData';
import { useCallback, useLayoutEffect, useState } from 'react';

export const useBatchSync = () => {
    const [syncOn, setSyncOn] = useState<boolean>(false);

    const userId = useSelector(
        (state: RootState) => state.bgg.user?.id,
    );

    const currentUsername = useSelector(
        (state: RootState) => state.bgg.user?.user,
    );

    useLayoutEffect(() => {
        const newValue = document.body.getAttribute('data-shelfscan-sync') === 'on';
        if (syncOn === newValue) {
            return;
        }
        setSyncOn(newValue);
    });

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
                versionId: undefined,
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

