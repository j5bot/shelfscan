import { beforeEach, describe, expect, it } from '../../setup';
import { vi } from 'vitest';
import { bggGetCollectionInner, bggGetUserInner } from '@/app/lib/actions';
import { addResponseToCache } from '@/app/lib/database/cacheDatabase';
import { BggLoadError, fetchFreshBggUserDataWithRetry } from '@/app/lib/services/bgg/loadUser';

vi.mock('@/app/lib/actions', () => ({
    bggGetCollectionInner: vi.fn(),
    bggGetUserInner: vi.fn(),
}));

vi.mock('@/app/lib/database/cacheDatabase', () => ({
    addResponseToCache: vi.fn().mockResolvedValue(undefined),
    getResponseFromCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('posthog-js', () => ({ default: {} }));

const USER_XML = '<user id="42" name="tester"></user>';
const UNKNOWN_USER_XML = '<user id="" name=""></user>';
const COLLECTION_XML = `<items totalitems="1">
    <item objecttype="thing" objectid="13" subtype="boardgame" collid="100">
        <name>Catan</name><status own="1" />
    </item>
</items>`;
const EMPTY_COLLECTION_XML = '<items totalitems="0"></items>';
const RATE_LIMIT_XML = '<error><message>Rate limit exceeded</message></error>';
const INVALID_USERNAME_XML = '<errors><error><message>Invalid username specified</message></error></errors>';

const getCollection = vi.mocked(bggGetCollectionInner);
const getUser = vi.mocked(bggGetUserInner);

const mockResponses = (collectionXml: string, userXml = USER_XML) => {
    getCollection.mockImplementationOnce(async (_username, expansions) =>
        expansions ? EMPTY_COLLECTION_XML : collectionXml);
    getCollection.mockImplementationOnce(async (_username, expansions) =>
        expansions ? EMPTY_COLLECTION_XML : collectionXml);
    getUser.mockResolvedValueOnce(userXml);
};

describe('fetchFreshBggUserDataWithRetry', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(addResponseToCache).mockResolvedValue('');
    });

    it('returns the user and collection on success', async () => {
        mockResponses(COLLECTION_XML);
        const { user, items } = await fetchFreshBggUserDataWithRetry('tester', { retryDelay: 0 });
        expect(user.id).toEqual('42');
        expect(Object.keys(items)).toEqual(['100']);
        expect(getUser).toHaveBeenCalledTimes(1);
    });

    it('retries transient BGG errors until one succeeds', async () => {
        mockResponses(RATE_LIMIT_XML);
        mockResponses(RATE_LIMIT_XML);
        mockResponses(COLLECTION_XML);
        const { items } = await fetchFreshBggUserDataWithRetry('tester', { retryDelay: 0 });
        expect(Object.keys(items)).toEqual(['100']);
        expect(getUser).toHaveBeenCalledTimes(3);
    });

    it('retries network errors', async () => {
        getCollection.mockRejectedValueOnce(new Error('fetch failed'));
        getCollection.mockResolvedValueOnce(EMPTY_COLLECTION_XML);
        getUser.mockResolvedValueOnce(USER_XML);
        mockResponses(COLLECTION_XML);
        const { items } = await fetchFreshBggUserDataWithRetry('tester', { retryDelay: 0 });
        expect(Object.keys(items)).toEqual(['100']);
    });

    it('gives up after the retry limit', async () => {
        getCollection.mockResolvedValue(RATE_LIMIT_XML);
        getUser.mockResolvedValue(USER_XML);
        await expect(fetchFreshBggUserDataWithRetry('tester', { retries: 2, retryDelay: 0 }))
            .rejects.toThrow('Rate limit exceeded');
        expect(getUser).toHaveBeenCalledTimes(3);
    });

    it('does not retry an unknown user', async () => {
        mockResponses(INVALID_USERNAME_XML, UNKNOWN_USER_XML);
        await expect(fetchFreshBggUserDataWithRetry('nobody', { retryDelay: 0 }))
            .rejects.toBeInstanceOf(BggLoadError);
        expect(getUser).toHaveBeenCalledTimes(1);
    });

    it('does not retry an invalid username error', async () => {
        mockResponses(INVALID_USERNAME_XML);
        await expect(fetchFreshBggUserDataWithRetry('nobody', { retryDelay: 0 }))
            .rejects.toThrow('Invalid username specified');
        expect(getUser).toHaveBeenCalledTimes(1);
    });

    it('stops waiting when aborted', async () => {
        getCollection.mockResolvedValue(RATE_LIMIT_XML);
        getUser.mockResolvedValue(USER_XML);
        const controller = new AbortController();
        const result = fetchFreshBggUserDataWithRetry('tester', {
            signal: controller.signal,
            retryDelay: 60000,
        });
        await vi.waitFor(() => expect(getUser).toHaveBeenCalledTimes(1));
        controller.abort(new Error('aborted'));
        await expect(result).rejects.toThrow('aborted');
        expect(getUser).toHaveBeenCalledTimes(1);
    });
});
