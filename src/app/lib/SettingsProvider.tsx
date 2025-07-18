import { getSettings, ShelfScanSettings } from '@/app/lib/database/database';
import { useLoadUser } from '@/app/lib/hooks/useLoadUser';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type SettingsProviderContextValue = {
    loadSettings: () => PromiseLike<ShelfScanSettings>;
    settings: ShelfScanSettings;
};

export const SettingsContext =
    createContext<SettingsProviderContextValue>({
        loadSettings: async () => ({}),
        settings: {},
    });

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<SettingsProviderContextValue['settings']>({});
    const { loadUser } = useLoadUser();

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
        settings,
    }}>
        {children}
    </SettingsContext.Provider>
};
