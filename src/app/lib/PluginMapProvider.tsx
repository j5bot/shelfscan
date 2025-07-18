import {
    ShelfScanPluginKey,
    ShelfScanPluginMap,
    ShelfScanPluginSection,
} from '@/app/lib/types/plugins';
import { makePluginMap } from '@/app/lib/utils/plugins';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type PluginMapProviderValue = {
    loadPlugins: () => PromiseLike<void>;
    plugins: ShelfScanPluginMap;
}

export const PluginMapContext =
    createContext<PluginMapProviderValue>({
        loadPlugins: async () => undefined,
        plugins: {} as ShelfScanPluginMap,
    });

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

    const loadPlugins = async () => {
        setPlugins(await makePluginMap());
    };

    useEffect(() => {
        loadPlugins().then();
    }, []);

    return <PluginMapContext.Provider value={{
        loadPlugins,
        plugins
    }}>
        {children}
    </PluginMapContext.Provider>
};
