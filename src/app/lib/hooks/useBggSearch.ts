import { bggSearchInner } from '@/app/lib/actions';
import { useExtensionMessaging } from '@/app/lib/extension/ExtensionMessagingProvider';
import { searchBgg } from '@/app/lib/extension/messaging/searchBgg';
import { useSync } from '@/app/lib/extension/useSync';
import { bggGetSearchResultsFromXML } from '@/app/lib/services/bgg/service';
import { BggSearchResult, BggSearchSource } from '@/app/lib/types/bgg';
import {
    BggSearchError,
    BggSearchErrorReason,
    isBggSearchQueryLongEnough,
    runBggSearch,
} from '@/app/lib/utils/bggSearch';
import { DO_SEARCH_MIN_EXTENSION_VERSION, isVersionAtLeast } from '@/app/lib/utils/extensionVersion';
import { enqueueFetch } from '@/app/lib/utils/fetchQueue';
import posthog from 'posthog-js';
import { useCallback, useEffect, useState } from 'react';

const SEARCH_DEBOUNCE_MS = 500;
const MAX_CACHED_SEARCHES = 50;

// successful searches for this session, by source and query, least recently used first
const searchCache = new Map<string, BggSearchResult[]>();

const getCacheKey = (source: BggSearchSource, query: string) => `${source}|${query}`;

const readCache = (key: string) => searchCache.get(key);

const writeCache = (key: string, results: BggSearchResult[]) => {
    searchCache.delete(key);
    searchCache.set(key, results);
    if (searchCache.size > MAX_CACHED_SEARCHES) {
        searchCache.delete(searchCache.keys().next().value!);
    }
};

const searchXml = async (query: string): Promise<BggSearchResult[]> => {
    let xml: string;
    try {
        xml = await enqueueFetch(() => bggSearchInner(query));
    } catch (error) {
        throw new BggSearchError('error', 'xmlapi', error instanceof Error ? error.message : String(error));
    }
    try {
        return bggGetSearchResultsFromXML(xml);
    } catch (error) {
        throw new BggSearchError('bad_response', 'xmlapi', error instanceof Error ? error.message : String(error));
    }
};

export type BggSearchStatus = 'idle' | 'loading' | 'success' | 'error';

type BggSearchState = {
    requestKey: string;
    source: BggSearchSource;
    results: BggSearchResult[];
    fallback: boolean;
    errorReason?: BggSearchErrorReason;
};

export type UseBggSearchOptions = {
    // the BGG query from getBggSearchQuery
    query: string;
    // false when the collection shows results, or isn't loaded
    enabled: boolean;
};

export type UseBggSearchResult = {
    status: BggSearchStatus;
    source: BggSearchSource | undefined;
    results: BggSearchResult[];
    fallback: boolean;
    errorReason: BggSearchErrorReason | undefined;
    retry: () => void;
};

const NO_RESULTS: BggSearchResult[] = [];

/**
 * Searches BGG for `query` once typing pauses: through the extension when it supports search, falling back to the
 * XML API. Only the current query's results are returned; successful searches are cached for the session.
 */
export const useBggSearch = (options: UseBggSearchOptions): UseBggSearchResult => {
    const { query, enabled } = options;

    const { syncOn, syncChecked, extensionVersion } = useSync();
    const { dispatchExtensionMessage } = useExtensionMessaging();
    const [attempt, setAttempt] = useState(0);
    const [state, setState] = useState<BggSearchState | null>(null);

    const canSearch = enabled && syncChecked && isBggSearchQueryLongEnough(query);
    const useExtension = syncOn && !!extensionVersion
                         && isVersionAtLeast(extensionVersion, DO_SEARCH_MIN_EXTENSION_VERSION);
    const preferredSource: BggSearchSource = useExtension ? 'extension' : 'xmlapi';
    const cacheKey = getCacheKey(preferredSource, query);
    const requestKey = `${cacheKey}|${attempt}`;
    const cached = canSearch ? readCache(cacheKey) : undefined;

    useEffect(() => {
        if (!canSearch || readCache(cacheKey)) {
            return;
        }

        let active = true;
        const timer = setTimeout(() => {
            const startedAt = performance.now();
            runBggSearch({
                query,
                useExtension,
                searchExtension: extensionQuery => searchBgg({ query: extensionQuery, dispatchExtensionMessage }),
                searchXml,
                onExtensionError: reason => {
                    posthog.capture('bgg_search_error', { query, source: 'extension', reason });
                },
            }).then(outcome => {
                writeCache(getCacheKey(outcome.source, query), outcome.results);
                posthog.capture('bgg_search', {
                    query,
                    source: outcome.source,
                    fallback: outcome.fallback,
                    resultCount: outcome.results.length,
                    durationMs: Math.round(performance.now() - startedAt),
                });
                if (active) {
                    setState({ requestKey, ...outcome });
                }
            }).catch((error: unknown) => {
                const reason = error instanceof BggSearchError ? error.reason : 'error';
                posthog.capture('bgg_search_error', { query, source: 'xmlapi', reason });
                if (active) {
                    setState({
                        requestKey,
                        source: 'xmlapi',
                        results: NO_RESULTS,
                        fallback: useExtension,
                        errorReason: reason,
                    });
                }
            });
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [canSearch, cacheKey, requestKey, query, useExtension, dispatchExtensionMessage]);

    const retry = useCallback(() => setAttempt(prev => prev + 1), []);

    let status: BggSearchStatus = 'loading';
    let current: Omit<BggSearchState, 'requestKey'> | undefined;
    switch (true) {
        case !enabled || !isBggSearchQueryLongEnough(query):
            status = 'idle';
            break;
        case !!cached:
            status = 'success';
            current = { source: preferredSource, results: cached!, fallback: false };
            break;
        case state?.requestKey === requestKey:
            status = state!.errorReason ? 'error' : 'success';
            current = state!;
            break;
    }

    return {
        status,
        source: current?.source,
        results: current?.results ?? NO_RESULTS,
        fallback: current?.fallback ?? false,
        errorReason: current?.errorReason,
        retry,
    };
};
