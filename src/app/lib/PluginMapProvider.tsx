import {
    ShelfScanPluginKey,
    ShelfScanPluginMap,
    ShelfScanPluginSection,
} from '@/app/lib/types/plugins';
import { makePluginMap } from '@/app/lib/utils/plugins';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export const PluginMapContext =
    createContext<ShelfScanPluginMap>({} as ShelfScanPluginMap);

export const usePluginMap = (key?: string) => {
    const pluginMap = useContext<ShelfScanPluginMap>(PluginMapContext);

    if (!key) {
        return pluginMap as ShelfScanPluginSection;
    }
    if (Object.keys(pluginMap).length === 0) {
        return {} as ShelfScanPluginSection;
    }

    const segments = (key.split('.') as unknown) as ShelfScanPluginKey[];
    return segments.reduce(
        (map, segment) =>
            map[segment] as ShelfScanPluginSection,
        pluginMap as ShelfScanPluginSection,
    );
};

export const PluginMapProvider = ({ children }: { children: ReactNode }) => {
    const [pluginMap, setPluginMap] = useState<ShelfScanPluginMap>({} as ShelfScanPluginMap);

    useEffect(() => {
        (async () => {
            setPluginMap(await makePluginMap());
        })();
    }, []);

    return <PluginMapContext.Provider value={pluginMap}>
        {children}
    </PluginMapContext.Provider>
};
