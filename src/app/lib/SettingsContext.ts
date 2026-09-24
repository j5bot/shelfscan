import { ShelfScanSetting, ShelfScanSettings } from '@/app/lib/database/database';
import { createContext } from 'react';

export type SettingsProviderContextValue = {
    loadSettings: () => Promise<ShelfScanSettings>;
    setSetting: (setting: string, value: ShelfScanSetting) => Promise<void>;
    settings: ShelfScanSettings;
};

export const SettingsContext =
    createContext<SettingsProviderContextValue>({
        loadSettings: async () => ({}),
        setSetting: async () => undefined,
        settings: {},
    });
