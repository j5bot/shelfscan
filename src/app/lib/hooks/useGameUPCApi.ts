'use client';

import { useEffect, useState } from "react";
import { GameUPCData } from '@/app/lib/types/GameUPCData';

const gameUPCHost = 'https://api.gameupc.com/dev';
const gameUPCFetchOptions = {
    headers: new Headers({
        'x-api-key': 'test_test_test_test_test',
    })
};

const warmupGameUPCApi = async () => {
    return await fetch(`${gameUPCHost}/warmup`, gameUPCFetchOptions);
};

const fetchGameDataForUpc = async (upc: string) => {
    return await fetch(`${gameUPCHost}/upc/${upc}`, gameUPCFetchOptions)
        .then(response => response.json());
};

const postOrDeleteGameUPCMatch = async (
    upc: string, bggId: number, version: number = -1, body: string,
    del: boolean = false) => {
    const postOrDeleteVersion = version >= 0 ? `/version/${version}` : '';
    return await fetch(
        `${gameUPCHost}/upc/${upc}/bgg_id/${bggId}${postOrDeleteVersion}`,
        Object.assign(
            { body, method: del ? 'DELETE' : 'POST' },
            gameUPCFetchOptions
        ),
    ).then(response => response.json());
};

const postGameUPCMatch = async (upc: string, bggId: number, version: number = -1, body: string) => {
    return postOrDeleteGameUPCMatch(upc, bggId, version, body, false);
};

const deleteGameUPCMatch = async (upc: string, bggId: number, version: number = -1, body: string) => {
    return postOrDeleteGameUPCMatch(upc, bggId, version, body, false);
};

export type UseGameUPCApiOptions = {
    updaterId?: string;
};

export const useGameUPCApi = (options: UseGameUPCApiOptions) => {
    const { updaterId = 'gameupc-scanner' } = options;

    const [warmed, setWarmed] = useState<boolean>(false);
    const [gameDataMap, setGameDataMap] = useState<Record<string, GameUPCData>>({});
    const [gameUPCs, setGameUPCs] = useState<string[]>([]);
    const [fetchingGameUPCs, setFetchingGameUPCs] = useState<string[]>([]);

    const gameUPCApiPostUserBody = JSON.stringify({
        user_id: updaterId,
    });

    useEffect(() => {
        let warming = true;

        if (!(warmed || warming)) {
            warmupGameUPCApi().then(() => setWarmed(true));
        }
        return () => { warming = false; };
    }, [warmed, setWarmed]);

    const getGameData = async (upc: string): Promise<GameUPCData | undefined> => {
        if (fetchingGameUPCs.includes(upc)) {
            return undefined;
        }
        if (gameUPCs.includes(upc)) {
            return gameDataMap[upc];
        }

        fetchingGameUPCs.push(upc);
        setFetchingGameUPCs(fetchingGameUPCs);

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

        return gameDataMap[upc];
    };

    const submitOrVerifyGame = async (upc: string, bggId: number, version: number = -1) => {
        const gameData = await postGameUPCMatch(upc, bggId, version, gameUPCApiPostUserBody);
        gameDataMap[upc] = gameData;
        setGameDataMap(gameDataMap);
        return gameData;
    };

    const removeGame = async (upc: string, bggId: number, version: number = -1) => {
        const gameData = await deleteGameUPCMatch(upc, bggId, version, gameUPCApiPostUserBody);
        gameDataMap[upc] = gameData;
        setGameDataMap(gameDataMap);
        return gameData;
    };

    return {
        gameDataMap,
        getGameData,
        removeGame,
        submitOrVerifyGame,
    };
};
