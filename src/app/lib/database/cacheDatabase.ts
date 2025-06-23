import Dexie, { EntityTable } from 'dexie';
import { ImageProps } from 'next/image';

export type CachedImage = {
    id: string;
    data: Blob;
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
};

cacheDatabase.version(1).stores({
    images: '++id',
});

cacheDatabase.version(2).stores({
    images: '++id',
    responses: '++id',
});

export const makeImageCacheId = (imageProps: ImageProps) => [
        imageProps.src,
        imageProps.width,
        imageProps.height,
        imageProps.quality
    ].join('|');

export const getImageDataFromCache = async (id: string) =>
    (await cacheDatabase.images.get(id))?.data;

export const addImageDataToCache = async (id: string, blob: Blob) => {
    if ((await cacheDatabase.images.get(id))) {
        return cacheDatabase.images.put({ id, data: blob });
    } else {
        return cacheDatabase.images.add({ id, data: blob });
    }
};

export const getResponseFromCache = async (id: string) =>
    (await cacheDatabase.responses.get(id))?.response;

export const addResponseToCache = async (cachedResponse: CachedTextResponse) => {
    if ((await cacheDatabase.responses.get(cachedResponse.id))) {
        cacheDatabase.responses.put(cachedResponse);
    } else {
        cacheDatabase.responses.add(cachedResponse);
    }
};
