'use server';

import { gameUPCHost } from '@/app/lib/services/gameupc/constants';

const gameUPCFetchOptions = {
    headers: new Headers({
        'x-api-key': process.env.GAMEUPC_TOKEN ?? 'test_test_test_test_test',
    })
};

export const warmupGameUPCApi = async () => {
    await fetch(`${gameUPCHost}/warmup`, gameUPCFetchOptions);
};

export const fetchGameDataForUpc = async (upc: string, search?: string) => {
    const url = new URL(`${gameUPCHost}/upc/${upc}`);
    if (search && search.length > 0) {
        url.searchParams.append('search', search);
    }
    return await fetch(url.toString(), gameUPCFetchOptions)
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

export const postGameUPCMatch = async (upc: string, bggId: number, version: number = -1, body: string) => {
    return postOrDeleteGameUPCMatch(upc, bggId, version, body, false);
};

export const deleteGameUPCMatch = async (upc: string, bggId: number, version: number = -1, body: string) => {
    return postOrDeleteGameUPCMatch(upc, bggId, version, body, false);
};
