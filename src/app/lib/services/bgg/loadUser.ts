import { bggGetCollectionInner, bggGetUserInner } from '@/app/lib/actions';
import { addResponseToCache } from '@/app/lib/database/cacheDatabase';
import {
    getBggUser,
    getBggXmlError,
    getCollectionFromXml
} from '@/app/lib/services/bgg/service';
import { BggCollectionMap, BggUser } from '@/app/lib/types/bgg';
import posthog from 'posthog-js';

export type BggUserData = {
    user: BggUser;
    items: BggCollectionMap;
};

export const getUserCacheIds = (username: string) => {
    const name = username.toLowerCase();
    return {
        collection: `collection|${name}`,
        expansions: `collection-expansions|${name}`,
        user: `user|${name}`,
    };
};

export const identifyBggUser = (user: BggUser) => {
    if (!user.id) {
        return;
    }
    const distinctId = `bgg:${user.user}`;
    const currentDistinctId = posthog.get_distinct_id();

    if (currentDistinctId.startsWith('bgg:') && currentDistinctId !== distinctId) {
        posthog.reset();
    }

    posthog.identify(distinctId, {
        bgg_username: user.user,
    });
};

// Failures that retrying can't fix (e.g. an unknown username) are marked not retryable
export class BggLoadError extends Error {
    constructor(message: string, readonly retryable: boolean) {
        super(message);
        this.name = 'BggLoadError';
    }
}

const INVALID_USERNAME = 'Invalid username specified';

// Bypasses the response cache and the stored Dexie collection, then refreshes the response cache
export const fetchFreshBggUserData = async (username: string): Promise<BggUserData> => {
    const [xml, expansionsXml, userXml] = await Promise.all([
        bggGetCollectionInner(username, false, 0),
        bggGetCollectionInner(username, true, 0),
        bggGetUserInner(username),
    ]);

    // BGG answers an unknown username with an empty <user id=""> element
    const user = getBggUser(userXml);
    const userError = getBggXmlError(userXml);
    if (!(userError || user.id)) {
        throw new BggLoadError(`BGG user "${username}" not found`, false);
    }

    const error = userError ?? getBggXmlError(xml) ?? getBggXmlError(expansionsXml);
    if (error) {
        throw new BggLoadError(
            `Could not load collection for "${username}": ${error}`,
            error !== INVALID_USERNAME,
        );
    }

    const items = getCollectionFromXml(xml, expansionsXml) ?? {};

    const cacheIds = getUserCacheIds(username);
    addResponseToCache({ id: cacheIds.collection, method: 'GET', response: xml }).then();
    addResponseToCache({ id: cacheIds.expansions, method: 'GET', response: expansionsXml }).then();
    addResponseToCache({ id: cacheIds.user, method: 'GET', response: userXml }).then();

    return { user, items };
};

export type FetchWithRetryOptions = {
    signal?: AbortSignal;
    retries?: number;
    retryDelay?: number;
};

const RETRIES = 5;
const RETRY_DELAY = 10000;

const wait = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
    // an 'abort' that fired before the listener is added would never be heard
    if (signal?.aborted) {
        reject(signal.reason);
        return;
    }
    const onAbort = () => {
        clearTimeout(timer);
        reject(signal?.reason);
    };
    const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
});

// Retries transient failures (BGG errors, rate limits, network errors) like the collection form does
export const fetchFreshBggUserDataWithRetry = async (
    username: string,
    options: FetchWithRetryOptions = {},
): Promise<BggUserData> => {
    const { signal, retries = RETRIES, retryDelay = RETRY_DELAY } = options;

    for (let attempt = 0; ; attempt++) {
        signal?.throwIfAborted();
        try {
            return await fetchFreshBggUserData(username);
        } catch (error) {
            const retryable = !(error instanceof BggLoadError) || error.retryable;
            if (!retryable || attempt >= retries) {
                throw error;
            }
            await wait(retryDelay, signal);
        }
    }
};
