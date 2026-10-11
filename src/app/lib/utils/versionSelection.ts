import { type BggCollectionItem } from '@/app/lib/types/bgg';
import { type Version } from '@/app/lib/types/game';
import { collectionVersionToVersion, gameUPCVersionToVersion } from '@/app/lib/utils/gameAdapters';
import { type GameUPCBggVersion, type GameUPCData } from 'gameupc-hooks/types';

/** A clicked version, with the versions / item version it was chosen against. */
export type VersionSelection = {
    index: number;
    versions: GameUPCBggVersion[];
    versionId: number | undefined;
};

/**
 * The version to select: a click is kept while the versions and the item's version stay the same; once either
 * changes, the item's own version (if it is in the list) is selected again.
 */
export const resolveCurrentVersionIndex = (
    versions: GameUPCBggVersion[],
    versionId: number | undefined,
    selection: VersionSelection | undefined,
): number | null => {
    const itemVersionIndex = versionId ? versions.findIndex(version => version.version_id === versionId) : -1;
    const selectionIsCurrent = selection?.versions === versions && selection?.versionId === versionId;
    return itemVersionIndex >= 0 && !selectionIsCurrent ? itemVersionIndex : selection?.index ?? null;
};

/** The version to show: the item's own version, else the selected one. */
export const resolveDisplayVersion = (
    item: BggCollectionItem,
    versions: GameUPCBggVersion[],
    currentVersionIndex: number | null,
): Version | undefined => {
    if (item.version) {
        return collectionVersionToVersion(item.version);
    }
    return currentVersionIndex !== null ? gameUPCVersionToVersion(versions[currentVersionIndex]) : undefined;
};

export type ScannedVersionsParams = {
    objectId: number | undefined;
    upcMap: Map<number, string>;
    gameDataMap: Record<string, GameUPCData>;
};

/** The game's versions from GameUPC data, when it was scanned; undefined otherwise. */
export const getScannedVersions = (params: ScannedVersionsParams): GameUPCBggVersion[] | undefined => {
    const { objectId, upcMap, gameDataMap } = params;
    const upc = objectId ? upcMap.get(objectId) : undefined;
    const info = upc ? gameDataMap[upc]?.bgg_info?.find(bggInfo => bggInfo.id === objectId) : undefined;
    return info?.versions;
};
