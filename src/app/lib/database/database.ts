import Dexie, { EntityTable } from 'dexie';
import { type ShelfScanPlugin } from '../types/plugins';

export type SettingEntity = {
    id: string;
    value: string | string[];
};

export type PluginEntity = {
    id: string;
    plugin: ShelfScanPlugin;
};

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

export const getPlugin = async (id: string) =>
    (await database.plugins.get(id))?.plugin;

export const getEnabledPlugins = async () => {
    const pluginList = (await getSetting('plugins') as string[]) ?? [];
    return await Promise.all(pluginList.map(pluginId => getPlugin(pluginId)));
};
