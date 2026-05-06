import { useCodes } from '@/app/lib/CodesProvider';
import { useGameSelections } from '@/app/lib/GameSelectionsProvider';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { useSelector } from '@/app/lib/hooks/index';
import { getIndexesInCollectionFromInfos } from '@/app/lib/redux/bgg/collection/selectors';
import { PossibleStatusWithAll, PossibleStatusWithAllAndNone } from '@/app/lib/types/bgg';
import { useMemo } from 'react';

export type UseInfoCollectionStatus = Record<PossibleStatusWithAllAndNone, string[]> & {
    codes: string[];
    enrichedCodes: Record<string, Record<PossibleStatusWithAllAndNone, boolean>>;
    removeCode: (code: string) => void;
    setCodes: (codes: string[]) => void;
};

export const useInfoCollectionStatus = (): UseInfoCollectionStatus => {
    const { gameDataMap } = useGameUPCData();

    const infos = Object.values(gameDataMap).flatMap(data => data.bgg_info ?? []);

    const {
        infoIndexes: infoIndexesInCollection,
    } = useSelector(state =>
        getIndexesInCollectionFromInfos([state, infos, ['own', 'fortrade', 'wishlist', 'all']]));

    const { codes, removeCode, setCodes } = useCodes();
    const { gameSelections } = useGameSelections();

    return useMemo(() => {
        return codes.reduce((acc, code) => {
            const {
                bgg_info: bggInfo,
            } = gameDataMap[code] ?? {};

            const [infoId] = gameSelections[code] ?? [];

            let infoIndex = infos?.
                findIndex(info => info.id === (infoId ?? bggInfo?.[0]?.id));

            infoIndex = infoIndex > -1 ? infoIndex : 0;

            const statusesToCheck = ['fortrade', 'own', 'prevowned'] as PossibleStatusWithAll[];

            let found = false;
            const statuses = statusesToCheck.reduce((statusAcc, status) => {
                if (found) {
                    return statusAcc;
                }
                if (!infoIndexesInCollection?.[status]?.includes(infoIndex ?? -1)) {
                    return statusAcc;
                }
                acc[status] = acc[status] ?? [];
                acc[status].push(code);

                // store in all
                acc.all = acc.all ?? [];
                acc.all.push(code);

                found = true;
                return Object.assign(statusAcc, { [status]: true })
            }, {});

            acc.enrichedCodes = Object.assign(acc.enrichedCodes, {
                [code]: statuses,
            });

            acc.none = codes.filter(code => !acc.all?.includes(code));
            acc.none.forEach(code => {
                if (!acc.enrichedCodes[code]) {
                    return;
                }
                acc.enrichedCodes[code].none = true
            });

            return acc;
        }, { codes, removeCode, setCodes, enrichedCodes: {} } as UseInfoCollectionStatus);
    }, [codes, gameDataMap, infoIndexesInCollection, gameSelections, setCodes]);
};
