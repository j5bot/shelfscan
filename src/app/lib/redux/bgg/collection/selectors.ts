import { RootState } from '@/app/lib/redux/store';
import {
    BggItemTagMap,
    BggTagMap,
    PossibleStatusWithAll
} from '@/app/lib/types/bgg';
import { GameUPCBggInfo } from 'gameupc-hooks/types';
import { memoize } from 'proxy-memoize';

// prefers rated item
const EMPTY_TAG_MAP: BggTagMap = {};

export const selectTagMap = memoize(([state]: [RootState]): BggTagMap => {
    const username = state.bgg.user?.user?.toLowerCase();
    if (!username) { return EMPTY_TAG_MAP; }
    return state.bgg.collection.users[username]?.tags ?? EMPTY_TAG_MAP;
}, { size: 10 });

export const EMPTY_TAGS: string[] = [];

const EMPTY_ITEM_TAG_MAP: BggItemTagMap = {};

export const selectTagsByCollectionId = memoize(([state]: [RootState]): BggItemTagMap => {
    const username = state.bgg.user?.user?.toLowerCase();
    if (!username) { return EMPTY_ITEM_TAG_MAP; }
    return state.bgg.collection.users[username]?.tagsByItem ?? EMPTY_ITEM_TAG_MAP;
}, { size: 10 });

export const getCollectionItemsByObjectId =
    memoize(([state, id]: [RootState, number | undefined]) => {
        if (id === undefined) {
            return [];
        }

        const collection = state.bgg.collection
            .users[state.bgg.user?.user?.toLowerCase() ?? ''];
        if (!collection) {
            return [];
        }

        const allCollectionItems = collection?.objects.all[id];
        if (!allCollectionItems?.length) {
            return [];
        }

        return allCollectionItems.map(collectionId => collection.items[collectionId]);
    }, { size: 2000 });

export const getCollectionInfoByObjectId =
    memoize(([state, id, incomingCollectionId]: [RootState, number | undefined, number | undefined]) => {
        if (id === undefined) {
            return {};
        }
        const collection = state.bgg.collection
            .users[state.bgg.user?.user?.toLowerCase() ?? ''];
        if (!collection) {
            return {};
        }

        const allCollectionItems = collection?.objects.all[id];

        if (!allCollectionItems?.length) {
            return {};
        }

        if (incomingCollectionId) {
            return {
                collectionId: incomingCollectionId,
                collection,
            };
        }

        const collectionIdArray = Array.from(allCollectionItems?.filter(collectionId => {
            return (collection?.items[collectionId]?.rating ?? 0) > 0;
        }))?.sort();

        const collectionId = collectionIdArray.length > 0 ?
                             collectionIdArray[0] :
                             Array.from(allCollectionItems).sort()[0];

        return {
            collectionId,
            collectionItems: allCollectionItems.map(
                collectionId => collection.items[collectionId]
            ),
            collection,
        };
    }, { size: 2000 });

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
