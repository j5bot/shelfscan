import { useEffect, useState } from "react";

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
    upc: string, bggId: string, body: string,
    del: boolean = false) => {
    return await fetch(
        `${gameUPCHost}/upc/${upc}/bgg/${bggId}`,
        Object.assign(
            { body, method: del ? 'DELETE' : 'POST' },
            gameUPCFetchOptions
        ),
    ).then(response => response.json());
};

const postGameUPCMatch = async (upc: string, bggId: string, body: string) => {
    return postOrDeleteGameUPCMatch(upc, bggId, body, false);
};

const deleteGameUPCMatch = async (upc: string, bggId: string, body: string) => {
    return postOrDeleteGameUPCMatch(upc, bggId, body, false);
};

export type UseGameUPCApiOptions = {
    updaterId?: string;
};

export const useGameUPCApi = (options: UseGameUPCApiOptions) => {
    const { updaterId = 'gameupc-scanner' } = options;

    const [warmed, setWarmed] = useState<boolean>(false);
    const [gameDataMap, setGameDataMap] = useState<Record<string, Promise<any>>>({});
    const [gameUPCs, setGameUPCs] = useState<string[]>([]);
    const [fetchingGameUPCs, setFetchingGameUPCs] = useState<string[]>([]);

    const gameUPCApiPostUserBody = JSON.stringify({
        user_id: updaterId,
    });

    useEffect(() => {
        let warming = true;

        if (!warmed) {
            warmupGameUPCApi().then(() => setWarmed(true));
        }
        return () => { warming = false; };
    }, [warmed, setWarmed]);

    const getGameData = async (upc: string) => {
        if (fetchingGameUPCs.includes(upc)) {
            return;
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

        gameDataMap[upc] = gameData;
        setGameDataMap(gameDataMap);

        return await gameData;
    };

    const submitOrVerifyGame = async (upc: string, bggId: string) => {
        const gameData = await postGameUPCMatch(upc, bggId, gameUPCApiPostUserBody);
        gameDataMap[upc] = gameData;
        setGameDataMap(gameDataMap);
        return gameData;
    };

    const removeGame = async (upc: string, bggId: string) => {
        const gameData = await deleteGameUPCMatch(upc, bggId, gameUPCApiPostUserBody);
        gameDataMap[upc] = gameData;
        setGameDataMap(gameDataMap);
        return gameData;
    };

    return {
        getGameData,
        removeGame,
        submitOrVerifyGame,
    };
};
