import { RootState } from '@/app/lib/redux/store';
import {
    BggCollectionStatuses,
    PossibleStatuses,
    PossibleStatusWithAll
} from '@/app/lib/types/bgg';
import { GameUPCBggInfo } from '@/app/lib/types/GameUPCData';
import { memoize } from 'proxy-memoize';

// prefers rated item
export const getItemInCollectionByObjectId =
    memoize(([state, id]: [RootState, number | undefined]) => {
        if (id === undefined) {
            return {};
        }
        const collection = state.bgg.collection
            .users[state.bgg.user?.user ?? ''];
        if (!collection) {
            return {};
        }

        const allCollectionItems = collection.objects.all[id];

        if (!allCollectionItems?.length) {
            return {};
        }

        const collectionIdArray = allCollectionItems?.filter(collectionId => {
            return (collection?.items[collectionId]?.rating ?? 0) > 0;
        })?.sort() ?? allCollectionItems?.sort();

        const collectionId = collectionIdArray[0];

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
    },
    { size: 2000 }
);

export type InfosAndVersionsInCollection = {
    infoIndexes: Record<PossibleStatusWithAll, number[]>;
    versionIndexes: Record<PossibleStatusWithAll, number[]>;
};

const emptyCollectionFromInfos = { infoIndexes: {}, versionIndexes: {} } as
    InfosAndVersionsInCollection;

export const getIndexesInCollectionFromInfos =
    memoize((
        [state, infos, statuses]:
        [RootState, GameUPCBggInfo[], PossibleStatusWithAll[]]
    ) => {
        if (!(infos?.length && statuses.length)) {
            return emptyCollectionFromInfos;
        }
        const username = state.bgg.user.user;
        if (!username) {
            return emptyCollectionFromInfos;
        }
        const collection = state.bgg.collection.users[username];
        if (!collection) {
            return emptyCollectionFromInfos;
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
        } as InfosAndVersionsInCollection) ?? emptyCollectionFromInfos;
    }, { size: 2000 });
