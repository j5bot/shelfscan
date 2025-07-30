import { getUsername } from '@/app/lib/redux/bgg/user/selectors';
import { RootState } from '@/app/lib/redux/store';
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

export const hasItemInCollectionById = createSelector(
    [
        getUserCollection,
        (_state: RootState, id: number) => id,
    ],
    (collection, id) => collection.objects[id].length > 0,
);

export const getItemsInCollectionById = createSelector(
    [
        getUserCollection,
        (_state: RootState, id?: number) => id,
    ],
    (collection, id) =>
        id !== undefined ? collection?.objects[id]?.map(collectionId => collection.items[collectionId]) : [],
);

export const getRatingInCollectionById = createSelector(
    [
        getUserCollection,
        (_state: RootState, id?: number) => id,
    ],
    (collection, id) => {
        if (id === undefined) {
            return {};
        }
        const collectionId = collection?.objects[id]?.find(collectionId => {
            return (collection?.items[collectionId]?.rating ?? 0) > 0;
        }) ?? collection?.objects[id]?.[0];

        return {
            collectionId,
            collectionRating: collection?.items[collectionId]?.rating
        };
    }
);

export const getVersionsInCollectionById = createSelector(
    [
        getUserCollection,
        (_state: RootState, id?: number) => id,
    ],
    (collection, id) =>
        id !== undefined ? collection?.versions[id]?.
            map(collectionId => collection?.items[collectionId]?.version)
            .filter(x => x !== undefined) : [],
);

export type ItemIdsAndVersionIdsInCollection = {
    itemIds: number[];
    versionIds: number[];
};

export type InfosAndVersionsInCollection = {
    infoIndexes: number[];
    versionIndexes: number[];
};

export const getInCollectionFromInfos = createSelector(
    [
        getUserCollection,
        (_state: RootState, infos: GameUPCBggInfo[]) => infos,
    ],
    (collection, infos) => {
        return infos.reduce((acc: ItemIdsAndVersionIdsInCollection, info) => {
            if (info.versions) {
                Object.assign(acc, {
                    versionIds: info.versions?.reduce(
                        (acc: number[], version) => {
                            if (!collection?.versions?.[version.version_id]?.length) {
                                return acc;
                            }
                            acc.push(version.version_id);
                            return acc;
                        }, acc.versionIds) ?? [],
                });
            }
            if (!collection?.objects?.[info.id]?.length) {
                return acc;
            }
            acc.itemIds.push(info.id);
            return acc;
        }, {
            itemIds: [], versionIds: [],
        });
    },
);

export const getIndexesInCollectionFromInfos = createSelector(
    [
        getUserCollection,
        (_state: RootState, infos: GameUPCBggInfo[]) => infos,
    ],
    (collection, infos) => {
        return infos?.reduce((acc: InfosAndVersionsInCollection, info, index) => {
            if (info.versions) {
                Object.assign(acc, {
                    versionIdsInCollection: info.versions?.reduce(
                        (acc: number[], version, index) => {
                            if (!collection?.versions?.[version.version_id]?.length) {
                                return acc;
                            }
                            acc.push(index);
                            return acc;
                        }, acc.versionIndexes) ?? [],
                });
            }
            if (!collection?.objects?.[info.id]?.length) {
                return acc;
            }
            acc.infoIndexes.push(index);
            return acc;
        }, {
            infoIndexes: [], versionIndexes: []
        }) ?? {
            infoIndexes: [], versionIndexes: [],
        };
    },
);

