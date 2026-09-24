import {
    getSettings,
    setSetting,
    ShelfScanSetting,
} from '@/app/lib/database/database';
import { useLoadUser } from '@/app/lib/hooks/useLoadUser';
import { SettingsContext, SettingsProviderContextValue } from '@/app/lib/SettingsContext';
import { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<SettingsProviderContextValue['settings']>({});
    const { loadUser } = useLoadUser();

    const loadSettings = useCallback(async () => {
        const loadedSettings = await getSettings();
        setSettings(loadedSettings);
        return loadedSettings;
    }, []);

    const setIndividualSetting = useCallback(async (setting: string, value: ShelfScanSetting) => {
        await setSetting(setting, value);
        await loadSettings();
    }, [loadSettings]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadSettings().then(loadedSettings => {
            const { username } = loadedSettings;
            if (!username) {
                return;
            }
            loadUser(username as string);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const value = useMemo(() => ({
        loadSettings,
        setSetting: setIndividualSetting,
        settings,
    }), [loadSettings, setIndividualSetting, settings]);

    return <SettingsContext.Provider value={value}>
        {children}
    </SettingsContext.Provider>
};
