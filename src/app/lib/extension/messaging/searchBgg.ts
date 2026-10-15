import { DispatchExtensionMessage } from '@/app/lib/extension/ExtensionMessagingProvider';
import { withExtensionTimeout } from '@/app/lib/extension/messaging/withExtensionTimeout';
import { BggExtensionSearchItem } from '@/app/lib/types/bgg';

// short, so the XML API fallback still answers in reasonable time
export const SEARCH_TIMEOUT_MS = 10_000;

export class ExtensionSearchResponseError extends Error {
    name = 'ExtensionSearchResponseError';
}

export type SearchBggParams = {
    query: string;
    dispatchExtensionMessage: DispatchExtensionMessage;
    timeoutMs?: number;
};

type DoSearchResponse = { items?: unknown; data?: { items?: unknown } } | undefined;

/**
 * The items of a doSearch reply. The extension passes on BGG's `/search/boardgame` JSON (`{ items }`) as the
 * response; `{ data: { items } }` is accepted too, in case it is ever wrapped.
 */
export const getDoSearchItems = (response: unknown): unknown => {
    const reply = response as DoSearchResponse;
    return reply?.items ?? reply?.data?.items;
};

/**
 * Searches BGG through the extension ('doSearch'); see `getDoSearchItems` for where the items are. Throws an
 * `ExtensionTimeoutError` when it doesn't reply in time, and an `ExtensionSearchResponseError` when the reply has
 * no items array — which is also how the extension reports not being logged in to BGG or BGG failing.
 */
export const searchBgg = async (params: SearchBggParams): Promise<BggExtensionSearchItem[]> => {
    const { query, dispatchExtensionMessage, timeoutMs = SEARCH_TIMEOUT_MS } = params;
    const result = await withExtensionTimeout(
        Promise.resolve(dispatchExtensionMessage({ type: 'doSearch', query })),
        timeoutMs,
    );
    const items = getDoSearchItems(result?.response);
    if (!Array.isArray(items)) {
        throw new ExtensionSearchResponseError('The extension did not return search results');
    }
    return items as BggExtensionSearchItem[];
};
