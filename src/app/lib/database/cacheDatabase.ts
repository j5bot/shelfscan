import Dexie, { EntityTable } from 'dexie';
import { ImageProps } from 'next/image';

export type CachedImage = {
    id: string;
    data: Blob;
};

export const cacheDatabase = new Dexie('cache') as Dexie & {
    images: EntityTable<CachedImage, 'id'>;
};

cacheDatabase.version(1).stores({
    images: '++id',
});

export const makeImageCacheId = (imageProps: ImageProps) => [
        imageProps.src,
        imageProps.width,
        imageProps.height,
        imageProps.quality
    ].join('|');

export const getImageDataFromCache = async (id: string) =>
    (await cacheDatabase.images.get(id))?.data;

export const addImageDataToCache = async (id: string, blob: Blob) =>
    cacheDatabase.images.add({ id, data: blob });
