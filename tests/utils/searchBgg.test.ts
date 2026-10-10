import { describe, it, expect, vi } from '../setup';
import { DocumentMessageResponseDetail } from '@/app/lib/extension/messageTypes';
import { ExtensionSearchResponseError, getDoSearchItems, searchBgg } from '@/app/lib/extension/messaging/searchBgg';
import { ExtensionTimeoutError } from '@/app/lib/extension/messaging/withExtensionTimeout';

const reply = (response: unknown) => ({ type: 'doSearch-response', response } as DocumentMessageResponseDetail);
const ITEMS = [{ objectid: '822', name: 'Carcassonne' }];

describe('getDoSearchItems', () => {
    it('reads BGG search JSON as the extension passes it on', () => {
        expect(getDoSearchItems({ items: ITEMS })).toBe(ITEMS);
    });

    it('reads items wrapped in data', () => {
        expect(getDoSearchItems({ data: { items: ITEMS } })).toBe(ITEMS);
    });

    it('is undefined for other replies', () => {
        expect(getDoSearchItems(undefined)).toBeUndefined();
        expect(getDoSearchItems({ error: true })).toBeUndefined();
    });
});

describe('searchBgg', () => {
    it('sends the query as a doSearch message and returns the items', async () => {
        const dispatchExtensionMessage = vi.fn(async () => reply({ items: ITEMS }));
        await expect(searchBgg({ query: 'carc', dispatchExtensionMessage })).resolves.toBe(ITEMS);
        expect(dispatchExtensionMessage).toHaveBeenCalledWith({ type: 'doSearch', query: 'carc' });
    });

    it('throws a response error when the reply has no items (not logged in, BGG error)', async () => {
        const dispatchExtensionMessage = vi.fn(async () => reply({ error: true }));
        await expect(searchBgg({ query: 'carc', dispatchExtensionMessage }))
            .rejects.toBeInstanceOf(ExtensionSearchResponseError);
    });

    it('throws a response error without the extension (no reply)', async () => {
        const dispatchExtensionMessage = vi.fn(() => undefined);
        await expect(searchBgg({ query: 'carc', dispatchExtensionMessage }))
            .rejects.toBeInstanceOf(ExtensionSearchResponseError);
    });

    it('times out when the extension does not reply', async () => {
        const dispatchExtensionMessage = vi.fn(() => new Promise<undefined>(() => undefined));
        await expect(searchBgg({ query: 'carc', dispatchExtensionMessage, timeoutMs: 10 }))
            .rejects.toBeInstanceOf(ExtensionTimeoutError);
    });
});
