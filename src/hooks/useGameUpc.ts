import { useEffect, useMemo, useState } from "react";

const gameUpcHost = 'https://api.gameupc.com/dev';
const gameUpcFetchOptions = {
    headers: new Headers({
        'x-api-key': 'test_test_test_test_test',
    })
};

const gameUpcUpdateBody = JSON.stringify({
    user_id: 'gameupc-scanner',
});

const warmupGameUpcApi = async () => {
    return await fetch(`${gameUpcHost}/warmup`, gameUpcFetchOptions);
};

const fetchGameDataForUpc = async (upc: string) => {
    return await fetch(`${gameUpcHost}/upc/${upc}`, gameUpcFetchOptions)
        .then(response => response.json());
};

const postGameUpcMatch = async (upc: string, bggId: string, body: string) => {
    return await fetch(
        `${gameUpcHost}/upc/${upc}/bgg/${bggId}`,
        Object.assign({ body, method: 'POST' }, gameUpcFetchOptions),
    ).then(response => response.json());
};

export type UseGameUpcApiOptions = {
    updaterId?: string;
};

export const useGameUpcApi = (options: UseGameUpcApiOptions) => {
    const { updaterId = 'gameupc-scanner' } = options;

    const [warmed, setWarmed] = useState<boolean>(false);
    const [gameData, setGameData] = useState<Record<string, any>>({});

    const gameUpcApiPostUserBody = JSON.stringify({
        user_id: updaterId,
    });

    useEffect(() => {
        let warming = true;

        if (!warmed) {
            warmupGameUpcApi().then(() => setWarmed(true));
        }
        return () => { warming = false; };
    }, [warmed, setWarmed]);

    const getGameData = async (upc: string) => {
        return gameData[upc] ??
            await fetchGameDataForUpc(upc)
                .then(data => gameData[upc] = data);
    };

    const submitOrVerifyGame = async (upc: string, bggId: string) => {
        return await postGameUpcMatch(upc, bggId, gameUpcApiPostUserBody);
    };

    return {
        getGameData,
        submitOrVerifyGame,
    };
};
