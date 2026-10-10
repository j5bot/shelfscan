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

/**
 * Searches BGG through the extension ('doSearch'); its items are at `response.data.items`. Throws an
 * `ExtensionTimeoutError` when it doesn't reply in time, and an `ExtensionSearchResponseError` when the reply has
 * no items array — which is also how the extension reports not being logged in to BGG or BGG failing.
 */
export const searchBgg = async (params: SearchBggParams): Promise<BggExtensionSearchItem[]> => {
    const { query, dispatchExtensionMessage, timeoutMs = SEARCH_TIMEOUT_MS } = params;
    const result = await withExtensionTimeout(
        Promise.resolve(dispatchExtensionMessage({ type: 'doSearch', query })),
        timeoutMs,
    );
    const items = (result?.response as { data?: { items?: unknown } } | undefined)?.data?.items;
    if (!Array.isArray(items)) {
        throw new ExtensionSearchResponseError('The extension did not return search results');
    }
    return items as BggExtensionSearchItem[];
};
