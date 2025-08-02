import { BggCollectionMap } from '@/app/lib/types/bgg';
import Dexie, { EntityTable } from 'dexie';
import { type ShelfScanPlugin } from '../types/plugins';

export type SettingEntity = {
    id: string;
    value: string | string[] | boolean | unknown;
};

export type CollectionEntity = {
    id: string;
    value: BggCollectionMap;
};

export type PluginEntity = ShelfScanPlugin;
export type ShelfScanSettings = Record<string, SettingEntity['value']>;

export const database = new Dexie('db') as Dexie & {
    settings: EntityTable<SettingEntity, 'id'>;
    plugins: EntityTable<PluginEntity, 'id'>;
    collections: EntityTable<CollectionEntity, 'id'>;
};

database.version(1).stores({
    settings: '++id',
    plugins: '++id',
    collections: '++id',
});

export const getSetting = async (id: string) =>
    (await database.settings.get(id))?.value;

export const setSetting = async (id: string, value: SettingEntity['value']) => {
    const hasSetting = await database.settings.get(id);
    if (hasSetting) {
        await database.settings.put({ id, value });
    } else {
        await database.settings.add({ id, value });
    }
};

export const removeSetting = async (id: string) =>
    await database.settings.delete(id);

export const getSettings = async () => {
    const settings = (
        await database.settings.toArray()
    ).reduce((acc, setting) => {
        return Object.assign(acc, { [setting.id]: setting.value });
    }, {} as Record<string, SettingEntity['value']>);
    settings.loaded = true;

    return settings;
};

export const getCollection = async (id: string) =>
    (await database.collections.get(id))?.value;

export const setCollection = async (id: string, value: BggCollectionMap) => {
    const hasCollection = await database.collections.get(id);
    if (hasCollection) {
        await database.collections.put({ id, value });
    } else {
        await database.collections.add({ id, value });
    }
};

export const getPlugin = async (id: string) =>
    (await database.plugins.get(id));
