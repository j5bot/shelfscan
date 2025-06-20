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
    username?: string;
};

export const useGameUPCApi = (options?: UseGameUPCApiOptions) => {
    const { updaterId = 'ShelfScan' } = options ?? {};

    const [gameUPCUserId, setGameUPCUserId] = useState<string>(updaterId);

    const setUpdater = (username?: string) => {
        setGameUPCUserId(updaterId + username ? `/${username}` : '');
    };

    const [isPending, startTransition] = useTransition();
    void isPending;

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
            startTransition(async () => {
                warmupGameUPCApi().then();
                setWarmed(true);
            });
        }
        return () => { warming = false; };
    }, [warmed]);

    const getGameData = async (upc: string): Promise<GameUPCData | undefined> => {
        if (fetchingGameUPCs.includes(upc)) {
            return undefined;
        }
        if (gameUPCs.includes(upc)) {
            return gameDataMap[upc];
        }

        fetchingGameUPCs.push(upc);
        setFetchingGameUPCs(fetchingGameUPCs);

        startTransition(async () => {
            const gameData = fetchGameDataForUpc(upc)
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
        startTransition(async () => {
            gameDataMap[upc] = await postGameUPCMatch(upc, bggId, version, gameUPCApiPostUserBody);
            setGameDataMap(gameDataMap);
        });
    };

    const removeGame = (upc: string, bggId: number, version: number = -1) => {
        startTransition(async () => {
            gameDataMap[upc] = await deleteGameUPCMatch(upc, bggId, version, gameUPCApiPostUserBody);
            setGameDataMap(gameDataMap);
        });
    };

    return {
        gameDataMap,
        getGameData,
        removeGame,
        submitOrVerifyGame,
        setUpdater,
    };
};
