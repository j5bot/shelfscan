import { useGameSelections } from '@/app/lib/GameSelectionsProvider';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { gameUPCInfoAndVersionToCollectionItem } from '@/app/lib/utils/gameAdapters';

export const useScannedItem = () => {
    const { gameDataMap: gameUPCResults } = useGameUPCData();
    const { gameSelections } = useGameSelections();

    const getScannedItem = (code: string) => {
        const {
            bgg_info: bggInfo,
        } = gameUPCResults[code] ?? {};

        const [infoId, versionId] = gameSelections[code] ?? [];

        let infoIndex = bggInfo?.findIndex(info => info.id === infoId);
        let versionIndex = bggInfo?.[infoIndex]?.versions.findIndex(version => version.version_id === versionId);

        infoIndex = infoIndex > -1 ? infoIndex : 0;
        versionIndex = versionIndex > -1 ? versionIndex : 0;

        const info = bggInfo?.[infoIndex] ?? {};
        const version = bggInfo?.[infoIndex]?.versions?.[versionIndex] ?? bggInfo?.[infoIndex] ?? {};

        return gameUPCInfoAndVersionToCollectionItem(info, version);
    };

    return {
        getScannedItem,
    };
};
