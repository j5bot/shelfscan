import { ShelfScanPluginMap } from '@/app/lib/types/plugins';
import { createContext } from 'react';

export type PluginMapProviderValue = {
    loadPlugins: () => PromiseLike<void>;
    plugins: ShelfScanPluginMap;
};

export const PluginMapContext =
    createContext<PluginMapProviderValue>({
        loadPlugins: async () => undefined,
        plugins: {} as ShelfScanPluginMap,
    });
