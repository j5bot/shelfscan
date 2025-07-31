import { getUsername } from '@/app/lib/redux/bgg/user/selectors';
import { RootState } from '@/app/lib/redux/store';
import {
    BggCollectionStatuses,
    PossibleStatuses,
    PossibleStatusWithAll
} from '@/app/lib/types/bgg';
import { GameUPCBggInfo } from '@/app/lib/types/GameUPCData';
import { createSelector } from '@reduxjs/toolkit';

export const getCollectionsState = (state: RootState) =>
    state.bgg.collection;

export const getUserCollection = createSelector(
    [
        getCollectionsState,
        getUsername
    ],
    (collections, username = '') => collections.users[username],
);

// prefers rated item
export const getItemInCollectionByObjectId = createSelector(
    [
        getUserCollection,
        (_state: RootState, id?: number) => id,
    ],
    (collection, id) => {
        if (id === undefined) {
            return {};
        }

        const allCollectionItems = collection?.objects.all[id];

        const collectionId = allCollectionItems?.filter(collectionId => {
            return (collection?.items[collectionId]?.rating ?? 0) > 0;
        })?.sort()[0] ?? allCollectionItems?.sort()[0];

        const collectionStatuses = allCollectionItems?.reduce((acc, collectionId) => {
            const collectionItem = collection?.items[collectionId];
            PossibleStatuses.forEach(status => {
                if (acc[status]) {
                    return;
                }
                if (collectionItem?.statuses[status]) {
                    acc[status] = true;
                }
            })
            return acc;
        }, {} as BggCollectionStatuses);

        return {
            collectionId,
            collectionItem: collection?.items[collectionId],
            allCollectionItems,
            collectionStatuses,
        };
    }
);

export type InfosAndVersionsInCollection = {
    infoIndexes: Record<PossibleStatusWithAll, number[]>;
    versionIndexes: Record<PossibleStatusWithAll, number[]>;
};

export const getIndexesInCollectionFromInfos = createSelector(
    [
        getUserCollection,
        (_state: RootState, infos: GameUPCBggInfo[]) => infos,
        (_state: RootState, _infos: GameUPCBggInfo[], statuses: PossibleStatusWithAll[]) => statuses,
    ],
    (collection, infos, statuses) => {
        if (!(collection && infos)) {
            return { infoIndexes: {}, versionIndexes: {} } as InfosAndVersionsInCollection;
        }
        return infos?.reduce((acc: InfosAndVersionsInCollection, info, index) => {
            statuses.forEach(status => {
                acc.versionIndexes[status] = acc.versionIndexes[status] ?? [];
                acc.infoIndexes[status] = acc.infoIndexes[status] ?? [];
                if (info.versions) {
                    Object.assign(acc.versionIndexes, {
                        [status]: info.versions?.reduce(
                            (acc, version, index) => {
                                if (!collection?.versions?.[status]?.[version.version_id]?.length) {
                                    return acc;
                                }
                                if (acc.includes(index)) {
                                    return acc;
                                }
                                acc.push(index);
                                return acc;
                            }, acc.versionIndexes[status]) ?? [],
                    });
                }
                if (!collection?.objects?.[status]?.[info.id]?.length) {
                    return acc;
                }
                if (acc.infoIndexes[status].includes(index)) {
                    return acc
                }
                acc.infoIndexes[status].push(index);
                return acc;
            });
            return acc;
        }, {
            infoIndexes: {}, versionIndexes: {}
        } as InfosAndVersionsInCollection) ?? {
            infoIndexes: {}, versionIndexes: {},
        } as InfosAndVersionsInCollection;
    },
);

