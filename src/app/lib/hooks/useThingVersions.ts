import { bggGetThingsXml } from '@/app/lib/actions';
import { addResponseToCache, getResponseFromCache } from '@/app/lib/database/cacheDatabase';
import { bggGetVersionsFromXML } from '@/app/lib/services/bgg/service';
import { BggVersion } from '@/app/lib/types/bgg';
import { collectionVersionToGameUPCVersion } from '@/app/lib/utils/gameAdapters';
import { GameUPCBggVersion } from 'gameupc-hooks/types';
import { useEffect, useState, useTransition } from 'react';

/** The game's thing XML (with versions), from the Dexie cache or BGG (then cached); undefined on a BGG error. */
const loadThingXml = async (bggId: number): Promise<string | undefined> => {
    const cacheId = `thing|${bggId}`;
    try {
        const cached = await getResponseFromCache(cacheId);
        if (cached) {
            return cached;
        }
    } catch (e) {
        console.error('error getting from cache', cacheId, e);
    }

    const xml = await bggGetThingsXml([bggId]);
    if (xml.startsWith('<error>')) {
        return undefined;
    }
    addResponseToCache({ id: cacheId, method: 'GET', response: xml }).then();
    return xml;
};

export type UseThingVersionsOptions = {
    bggId: number | undefined;
    // versions already known (e.g. from a scan); loaded from BGG when empty
    initialVersions: GameUPCBggVersion[] | undefined;
    // GameUPC data is loading and may still provide them
    isGetPending: boolean;
};

/** The game's versions: those already known, else loaded from BGG's thing XML (cached in Dexie). */
export const useThingVersions = (options: UseThingVersionsOptions) => {
    const { bggId, initialVersions, isGetPending } = options;
    const [versions, setVersions] = useState<GameUPCBggVersion[]>(initialVersions ?? []);
    const [isLoading, startGetVersions] = useTransition();

    useEffect(() => {
        if (!bggId || isLoading || isGetPending || versions.length > 0) {
            return;
        }

        let active = true;
        startGetVersions(async () => {
            const xml = active ? await loadThingXml(bggId) : undefined;
            if (!xml) {
                return;
            }
            setVersions(bggGetVersionsFromXML(xml)
                .map(version => collectionVersionToGameUPCVersion(version as BggVersion)));
        });

        return () => {
            active = false;
        };
    }, [bggId, isGetPending, isLoading, versions]);

    return versions;
};
