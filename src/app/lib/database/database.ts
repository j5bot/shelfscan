import Dexie, { EntityTable } from 'dexie';
import { type ShelfScanPlugin } from '../types/plugins';

export type SettingEntity = {
    id: string;
    value: string | string[] | boolean;
};

export type PluginEntity = ShelfScanPlugin;
export type ShelfScanSettings = Record<string, SettingEntity['value']>;

export const database = new Dexie('db') as Dexie & {
    settings: EntityTable<SettingEntity, 'id'>;
    plugins: EntityTable<PluginEntity, 'id'>;
};

database.version(1).stores({
    settings: '++id',
    plugins: '++id',
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

export const getPlugin = async (id: string) =>
    (await database.plugins.get(id));
