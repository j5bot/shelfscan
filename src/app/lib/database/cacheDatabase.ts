import Dexie, { EntityTable } from 'dexie';

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