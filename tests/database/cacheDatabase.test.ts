import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from '../setup';
import {
    addImageDataToCache,
    addResponseToCache,
    cacheDatabase,
    getImageDataFromCache,
    getResponseFromCache,
} from '@/app/lib/database/cacheDatabase';

describe('cacheDatabase', () => {
    beforeEach(async () => {
        await cacheDatabase.images.clear();
        await cacheDatabase.responses.clear();
    });

    // two components loading the same image / response both miss the cache, then both write
    it('caches the same image concurrently without a ConstraintError', async () => {
        const blob = new Blob(['image'], { type: 'image/png' });
        await expect(Promise.all([
            addImageDataToCache('a|1|1|75', blob),
            addImageDataToCache('a|1|1|75', blob),
        ])).resolves.toBeDefined();
        expect(await getImageDataFromCache('a|1|1|75')).toBeTruthy();
    });

    it('caches the same response concurrently without a ConstraintError', async () => {
        await expect(Promise.all([
            addResponseToCache({ id: 'thing|1', method: 'GET', response: 'one' }),
            addResponseToCache({ id: 'thing|1', method: 'GET', response: 'two' }),
        ])).resolves.toBeDefined();
        expect(await getResponseFromCache('thing|1')).toBe('two');
    });
});
