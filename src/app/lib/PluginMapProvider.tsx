import { PluginMapContext, PluginMapProviderValue } from '@/app/lib/PluginMapContext';
import {
    ShelfScanPluginKey,
    ShelfScanPluginMap,
    ShelfScanPluginSection,
} from '@/app/lib/types/plugins';
import { makePluginMap } from '@/app/lib/plugins/plugins';
import { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const usePlugins = (key?: string) => {
    const { plugins } = useContext<PluginMapProviderValue>(PluginMapContext);

    if (!key) {
        return plugins as ShelfScanPluginSection;
    }
    if (Object.keys(plugins).length === 0) {
        return {} as ShelfScanPluginSection;
    }

    const segments = (key.split('.') as unknown) as ShelfScanPluginKey[];
    return segments.reduce(
        (map, segment) =>
            map[segment] as ShelfScanPluginSection,
        plugins as ShelfScanPluginSection,
    );
};

export const PluginMapProvider = ({ children }: { children: ReactNode }) => {
    const [plugins, setPlugins] = useState<ShelfScanPluginMap>({} as ShelfScanPluginMap);

    const loadPlugins = useCallback(async () => {
        setPlugins(await makePluginMap());
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadPlugins().then();
    }, [loadPlugins]);

    const value = useMemo(() => ({
        loadPlugins,
        plugins,
    }), [loadPlugins, plugins]);

    return <PluginMapContext.Provider value={value}>
        {children}
    </PluginMapContext.Provider>
};
