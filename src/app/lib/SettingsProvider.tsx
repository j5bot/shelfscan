import {
    getSettings,
    setSetting,
    ShelfScanSetting,
    ShelfScanSettings
} from '@/app/lib/database/database';
import { useLoadUser } from '@/app/lib/hooks/useLoadUser';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type SettingsProviderContextValue = {
    loadSettings: () => PromiseLike<ShelfScanSettings>;
    setSetting: (setting: string, value: ShelfScanSetting) => PromiseLike<void>;
    settings: ShelfScanSettings;
};

export const SettingsContext =
    createContext<SettingsProviderContextValue>({
        loadSettings: async () => ({}),
        setSetting: async () => undefined,
        settings: {},
    });

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<SettingsProviderContextValue['settings']>({});
    const { loadUser } = useLoadUser();

    const setIndividualSetting = async (setting: string, value: ShelfScanSetting) => {
        await setSetting(setting, value);
        await loadSettings();
    };

    const loadSettings = async () => {
        const loadedSettings = await getSettings();
        setSettings(loadedSettings);
        return loadedSettings;
    };

    useEffect(() => {
        loadSettings().then(loadedSettings => {
            const { rememberMe, username } = loadedSettings;
            if (!(rememberMe && username)) {
                return;
            }
            loadUser(username as string, rememberMe as boolean, true);
        });
    }, []);

    return <SettingsContext.Provider value={{
        loadSettings,
        setSetting: setIndividualSetting,
        settings,
    }}>
        {children}
    </SettingsContext.Provider>
};
