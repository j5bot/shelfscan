import { BggCollectionMap } from '@/app/lib/types/bgg';
import { MarketPreferences } from '@/app/lib/types/market';
import Dexie, { EntityTable } from 'dexie';
import { type ShelfScanPlugin } from '../types/plugins';
import { AuditEntry } from '../types/audit';

export type ShelfScanSetting = string | string[] | boolean | unknown | MarketPreferences;

export type SettingEntity = {
    id: string;
    value: ShelfScanSetting;
};

export type CollectionEntity = {
    id: string;
    value: BggCollectionMap;
};

export type AuditEntity = AuditEntry;

export type ScannedEntity = {
    id: string;
    codes: string[];
};

export type DataFormEntity = {
    id?: number;
    name: string;
    schema: object & { id: string };
};

export type PluginEntity = ShelfScanPlugin;
export type ShelfScanSettings = Record<string, SettingEntity['value']>;

export const database = new Dexie('db') as Dexie & {
    settings: EntityTable<SettingEntity, 'id'>;
    plugins: EntityTable<PluginEntity, 'id'>;
    collections: EntityTable<CollectionEntity, 'id'>;
    scanned: EntityTable<ScannedEntity, 'id'>;
    audits: EntityTable<AuditEntity, 'id'>;
    dataforms: EntityTable<DataFormEntity, 'id'>;
};

database.version(1).stores({
    settings: '++id',
    plugins: '++id',
    collections: '++id',
});

database.version(2).stores({
    settings: '++id',
    plugins: '++id',
    collections: '++id',
    scannedCodes: '++id',
});

database.version(3).stores({
    settings: '++id',
    plugins: '++id',
    collections: '++id',
    scanned: '++id',
});

database.version(4).stores({
    settings: '++id',
    plugins: '++id',
    collections: '++id',
    scanned: '++id',
    dataforms: '++id',
});

database.version(5).stores({
    settings: '++id',
    plugins: '++id',
    collections: '++id',
    scanned: '++id',
    dataforms: '++id',
    audits: '++id, gameId, collectionId',
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
    await database.plugins.get(id);

export const addAudit = async (auditEntry: AuditEntry) =>
    await database.audits.add(auditEntry);

export const getScanned = async (id: string) =>
    (await database.scanned.get(id))?.codes;

export const setScanned = async (id: string, codes: string[]) => {
    const hasEntry = await database.scanned.get(id);
    if (hasEntry) {
        await database.scanned.put({ id, codes });
    } else {
        await database.scanned.add({ id, codes });
    }
};

export const removeScanned = async (id: string) =>
    await database.scanned.delete(id);
