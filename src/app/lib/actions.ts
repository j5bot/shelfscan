'use server';

import { bggHost } from '@/app/lib/services/bgg/constants';
import sleep from 'sleep-promise';

const bggCollectionBaseURL = `${bggHost}/xmlapi2/collection`;
const bggUserBaseURL = `${bggHost}/xmlapi2/user`;
const bggThingBaseURL = `${bggHost}/xmlapi2/thing`;
const bggGeeklistBaseURL = `${bggHost}/xmlapi/geeklist`;
const bggSearchBaseURL = `${bggHost}/xmlapi2/search`;

const MAX_ATTEMPTS = 20;

// built with the URLSearchParams constructor: React Doctor's server-auth-actions rule reads any `append`
// (or `set`, `delete`, …) call in a server action as a server-state change needing an auth check
const withQuery = (baseUrl: string, params: Record<string, string>) =>
    `${baseUrl}?${new URLSearchParams(params)}`;

const fetchFromBggWithToken = async (url: string, args: RequestInit, attempts: number = 0) => {
    if (attempts > MAX_ATTEMPTS) {
        return Promise.reject('Too many retries');
    }
    const bggToken = process.env.BGG_TOKEN;
    if (!bggToken) {
        throw new Error('cannot fetch from BGG without token');
    }

    const headerToAdd = {
        Authorization: `Bearer ${bggToken}`,
    };
    // precedence given to existing headers
    args.headers = Object.assign({}, headerToAdd, args.headers);
    const response = await fetch(url, args);

    if (response.status === 202 && attempts < MAX_ATTEMPTS) {
        await sleep(2000);
        return await fetchFromBggWithToken(url, args, attempts + 1);
    }
    return response;
};

export const bggGetUserInner = async (username: string) => {
    const bggUserUrl = withQuery(bggUserBaseURL, { name: username, buddies: '1' });
    return await fetchFromBggWithToken(bggUserUrl, {}).then(r => r.text());
};

export const bggGetCollectionInner =
    async (username: string, expansions: boolean, attempts: number = 0): Promise<string> => {
        if (attempts > MAX_ATTEMPTS) {
            return '';
        }

        const subtypeParams: Record<string, string> = expansions
                              ? { subtype: 'boardgameexpansion' }
                              : { subtype: 'boardgame', excludesubtype: 'boardgameexpansion' };
        const collectionUrl = withQuery(bggCollectionBaseURL, {
            username,
            version: '1',
            stats: '1',
            ...subtypeParams,
        });

        return await fetchFromBggWithToken(collectionUrl, {}).then(r => r.text());
    };

export const bggGetThingsXml = async (bggIds: number[]): Promise<string> => {
    const thingUrl = withQuery(bggThingBaseURL, { id: bggIds.join(','), versions: '1' });
    return await fetchFromBggWithToken(thingUrl, {}).then(r => r.text());
};

export const bggGetGeeklistInner =
    async (id: number, attempts: number = 0) => {
        if (attempts > MAX_ATTEMPTS) {
            return '';
        }

        const geeklistUrl = new URL(`${bggGeeklistBaseURL}/${id.toString()}`);
        return await fetchFromBggWithToken(geeklistUrl.toString(), {}).then(r => r.text());
    };


/** BGG XML API v2 search for board games and expansions; throws when BGG doesn't answer with 2xx. */
export const bggSearchInner = async (query: string): Promise<string> => {
    const searchUrl = withQuery(bggSearchBaseURL, { query, type: 'boardgame,boardgameexpansion' });
    const response = await fetchFromBggWithToken(searchUrl, {});
    if (!response.ok) {
        throw new Error(`BGG search failed with status ${response.status}`);
    }
    return await response.text();
};
