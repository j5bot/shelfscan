import { formatBytes } from '@/app/lib/utils/size';
import Dexie, { EntityTable } from 'dexie';
import { ImageProps } from 'next/image';

export type CacheSize = {
    id: string;
    size: number;
    entries: number;
}

export type CachedImage = {
    id: string;
    data: Blob;
    timestamp?: number;
};

export type CachedTextResponse = {
    id: string;
    method: string;
    payload?: string;
    response: string;
};

export const cacheDatabase = new Dexie('cache') as Dexie & {
    images: EntityTable<CachedImage, 'id'>;
    responses: EntityTable<CachedTextResponse, 'id'>;
    sizes: EntityTable<CacheSize, 'id'>;
};

cacheDatabase.version(1).stores({
    images: '++id',
});

cacheDatabase.version(2).stores({
    images: '++id',
    responses: '++id',
});

cacheDatabase.version(3).stores({
    images: '++id',
    responses: '++id',
    sizes: '++id',
});

const getCacheSizeEntry = async (id: string) => {
    const entry = await cacheDatabase.sizes.get(id);
    if (!entry) {
        await cacheDatabase.sizes.add({ id, size: 0, entries: 0 });
    }
    return entry ?? { id, size: 0, entries: 0 };
};

const updateCacheSize = async (id: string, data: Blob | string, remove: boolean = false) => {
    const multiplier = remove ? -1 : 1;
    const cacheSizeEntry = await getCacheSizeEntry(id);
    const size = typeof data === 'string' ? data.length : data.size;
    const newEntry = Object.assign({
        id,
        size: 0,
        entries: 0,
    }, cacheSizeEntry, {
        size: Math.max(0, cacheSizeEntry.size  + (size * multiplier)),
        entries: Math.max(0, cacheSizeEntry.entries + multiplier),
    });
    await cacheDatabase.sizes.put(newEntry);
};

export const makeImageCacheId = (imageProps: ImageProps) => [
        imageProps.src,
        imageProps.width,
        imageProps.height,
        imageProps.quality
    ].join('|');

export const getImageDataFromCache = async (id: string) =>
    (await cacheDatabase.images.get(id))?.data;

export const addImageDataToCache = async (id: string, blob: Blob) => {
    const previousImage = await cacheDatabase.images.get(id);
    if (previousImage) {
        const result = await cacheDatabase.images.put({ id, data: blob });
        await updateCacheSize('images', previousImage.data, true);
        return result;
    } else {
        const result = cacheDatabase.images.add({ id, data: blob });
        await updateCacheSize('images', blob, false);
        return result;
    }
};

export const getImageCacheUsage = async () => {
    const entry = await getCacheSizeEntry('images');
    const size = formatBytes(entry.size);
    const avgSize = formatBytes(entry.size / entry.entries);
    return `${entry.entries} images, ${size} (avg. ${avgSize}/image)`;
};

export const clearImageCache = async () => {
    await cacheDatabase.sizes.delete('images');
    return cacheDatabase.images.clear();
};

export const getResponseFromCache = async (id: string) =>
    (await cacheDatabase.responses.get(id))?.response;

export const addResponseToCache = async (cachedResponse: CachedTextResponse) => {
    const previousResponse = await cacheDatabase.responses.get(cachedResponse.id);
    if (previousResponse) {
        const result = cacheDatabase.responses.put(cachedResponse);
        await updateCacheSize('responses', previousResponse.response, true);
        await updateCacheSize('responses', cachedResponse.response, false);
        return result;
    } else {
        const result = cacheDatabase.responses.add(cachedResponse);
        await updateCacheSize('responses', cachedResponse.response, false);
        return result;
    }
};
