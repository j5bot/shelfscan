'use client';

import {
    deleteGameUPCMatch,
    fetchGameDataForUpc,
    postGameUPCMatch,
    warmupGameUPCApi
} from '@/app/lib/services/gameupc/server';
import { GameUPCData } from '@/app/lib/types/GameUPCData';
import { useEffect, useState, useTransition } from 'react';

export type UseGameUPCApiOptions = {
    updaterId?: string;
};

export const useGameUPCApi = (options?: UseGameUPCApiOptions) => {
    const { updaterId = 'ShelfScan' } = options ?? {};

    const [gameUPCUserId, setGameUPCUserId] = useState<string>(updaterId);

    const setUpdater = (username?: string) => {
        setGameUPCUserId(updaterId + (username ? `/${username}` : ''));
    };

    const [isGetPending, startGetTransition] = useTransition();
    const [isWarmPending, startWarmTransition] = useTransition();
    const [isSubmitPending, startSubmitTransition] = useTransition();
    const [isRemovePending, startRemoveTransition] = useTransition();

    const [warmed, setWarmed] = useState<boolean>(false);
    const [gameDataMap, setGameDataMap] = useState<Record<string, GameUPCData>>({});
    const [gameUPCs, setGameUPCs] = useState<string[]>([]);
    const [fetchingGameUPCs, setFetchingGameUPCs] = useState<string[]>([]);

    const gameUPCApiPostUserBody = JSON.stringify({
        user_id: gameUPCUserId,
    });

    useEffect(() => {
        let warming = false;
        if (!(warmed || warming)) {
            warming = true;
            startWarmTransition(async () => {
                warmupGameUPCApi().then();
                setWarmed(true);
            });
        }
        return () => { warming = false; };
    }, [warmed]);

    const getGameData = async (upc: string, search?: string): Promise<GameUPCData | undefined> => {
        if (fetchingGameUPCs.includes(upc)) {
            return undefined;
        }
        if (gameUPCs.includes(upc) && (!search || search?.length === 0)) {
            return gameDataMap[upc];
        }

        fetchingGameUPCs.push(upc);
        setFetchingGameUPCs(fetchingGameUPCs);

        startGetTransition(async () => {
            const gameData = fetchGameDataForUpc(upc, search)
                .then(data => {
                    gameUPCs.push(upc);
                    setGameUPCs(gameUPCs);
                    setFetchingGameUPCs(
                        fetchingGameUPCs.filter(gameUPC => gameUPC !== upc),
                    );
                    return data;
                });

            gameDataMap[upc] = await gameData;
            setGameDataMap(gameDataMap);
        });
    };

    const submitOrVerifyGame = (upc: string, bggId: number, version: number = -1) => {
        startSubmitTransition(async () => {
            gameDataMap[upc] = await postGameUPCMatch(upc, bggId, version, gameUPCApiPostUserBody);
            setGameDataMap(gameDataMap);
        });
    };

    const removeGame = (upc: string, bggId: number, version: number = -1) => {
        startRemoveTransition(async () => {
            gameDataMap[upc] = await deleteGameUPCMatch(upc, bggId, version, gameUPCApiPostUserBody);
            setGameDataMap(gameDataMap);
        });
    };

    return {
        gameDataMap,
        getGameData,
        removeGame,
        setUpdater,
        submitOrVerifyGame,
        isWarmPending,
        isGetPending,
        isSubmitPending,
        isRemovePending,
    };
};
