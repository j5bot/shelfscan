import { formatBytes } from '@/app/lib/utils/size';
import Dexie, { EntityTable } from 'dexie';
import { ImageProps } from 'next/image';

export type CachedImage = {
    id: string;
    data: Blob;
    timestamp?: number;
    size?: number;
};

export type CachedTextResponse = {
    id: string;
    method: string;
    payload?: string;
    response: string;
    size?: number;
};

export const cacheDatabase = new Dexie('cache') as Dexie & {
    images: EntityTable<CachedImage, 'id'>;
    responses: EntityTable<CachedTextResponse, 'id'>;
};

cacheDatabase.version(1).stores({
    images: '++id',
});

cacheDatabase.version(2).stores({
    images: '++id',
    responses: '++id',
});

const getImageCacheSize = async () => {
    const allImages = await cacheDatabase.images.toArray();
    const totalSize = (await Promise.all(allImages)).reduce((acc, image) => {
        return acc + (image.size ?? image.data.size);
    }, 0);
    return { entries: allImages.length, size: totalSize };
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
        return cacheDatabase.images.put({ id, data: blob, size: blob.size, timestamp: new Date().valueOf() });
    } else {
        return cacheDatabase.images.add({ id, data: blob, size: blob.size, timestamp: new Date().valueOf() });
    }
};

export const getImageCacheUsage = async () => {
    const entry = await getImageCacheSize();
    const size = formatBytes(entry.size, 1);
    const avgSize = entry.entries > 0 ? formatBytes(entry.size / entry.entries) : '0';
    return `${entry.entries} images, ${size} (avg. ${avgSize}/image)`;
};

export const clearImageCache = async () => {
    return cacheDatabase.images.clear();
};

export const getResponseFromCache = async (id: string) =>
    (await cacheDatabase.responses.get(id))?.response;

export const addResponseToCache = async (cachedResponse: CachedTextResponse) => {
    const previousResponse = await cacheDatabase.responses.get(cachedResponse.id);
    if (previousResponse) {
        return cacheDatabase.responses.put(cachedResponse);
    } else {
        return cacheDatabase.responses.add(cachedResponse);
    }
};
