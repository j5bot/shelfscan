import { useGameSelections } from '@/app/lib/GameSelectionsProvider';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { useSelector } from '@/app/lib/hooks/index';
import { useExtension } from '@/app/lib/hooks/useExtension';
import { getIndexesInCollectionFromInfos } from '@/app/lib/redux/bgg/collection/selectors';
import { RootState } from '@/app/lib/redux/store';
import { CollapsibleListProps } from '@/app/ui/CollapsibleList';
import React, { useCallback, useEffect, useState } from 'react';

export const useSelectVersion = (id: string) => {
    const username = useSelector((state: RootState) => state.bgg.user?.user);

    const {
        getGameData,
        gameDataMap,
        submitOrVerifyGame,
        removeGame,
        setUpdater,
        isSubmitPending,
        isRemovePending,
    } = useGameUPCData();

    const {
        gameSelections,
        setGameSelections,
    } = useGameSelections();

    useEffect(() => {
        setUpdater(username);
    }, [username, setUpdater]);

    const { bgg_info_status: status, bgg_info: infos } = gameDataMap[id] ?? {};

    const defaultImageUrl = infos?.[0]?.image_url;
    const [currentInfoIndex, setCurrentInfoIndex] = useState<number | null>(infos?.length === 1 ? 0 : null);
    const [currentVersionIndex, setCurrentVersionIndex] = useState<number | null>(infos?.[currentInfoIndex ?? 0]?.versions.length === 1 ? 0 : null);

    const [selectedInfoId, setSelectedInfoId] = useState<number>();
    const [selectedVersionId, setSelectedVersionId] = useState<number>();

    const [hoverVersionIndex, setHoverVersionIndex] = useState<number | null>(null);

    const info = infos?.[currentInfoIndex ?? -1];
    const versions = info?.versions;
    const version = versions?.[hoverVersionIndex ?? currentVersionIndex ?? -1];

    const { syncOn, extensionRenderBlock } = useExtension(info, version);

    const updateGameUPC = () => {
        if (!selectedInfoId || isSubmitPending) {
            return;
        }
        submitOrVerifyGame(id, selectedInfoId, selectedVersionId);
    };

    const removeGameUPC = () => {
        if (!selectedInfoId || isRemovePending) {
            return;
        }
        removeGame(id, selectedInfoId, selectedVersionId);
    }

    const {
        infoIndexes: infoIndexesInCollection,
        versionIndexes: versionIndexesInCollection,
    } = useSelector(state => getIndexesInCollectionFromInfos(state, infos));

    const gameData = gameDataMap[id];

    useEffect(() => {
        if (!id) {
            return;
        }
        if (gameData) {
            return;
        }
        getGameData(id).then();
    }, [id, gameData, getGameData]);

    const searchGameUPC = (search: string) => {
        getGameData(id, search).then();
    };

    const setCurrentSelection = useCallback((infoIndex: number, versionIndex: number) => {
        if (infoIndex === -1) {
            delete gameSelections[id];
            setGameSelections(gameSelections);
            return;
        }
        if (versionIndex === -1) {
            setSelectedInfoId(infos[infoIndex].id);
            gameSelections[id] = [infos[infoIndex].id];
            setGameSelections(gameSelections);
            return;
        }
        setSelectedInfoId(infos[infoIndex].id);
        setSelectedVersionId(versions[versionIndex].version_id);
        gameSelections[id] = [infos[infoIndex].id, versions[versionIndex].version_id];
        setGameSelections(gameSelections);
    }, [id, gameSelections, setGameSelections, infos, versions]);

    const restorePreviousSelection = () => {
        if (!gameSelections[id]) {
            return;
        }
        const selection = gameSelections[id];
        const gameSelectionIndex = infos?.findIndex(info => info.id === selection[0]);
        const versionSelectionIndex = infos?.
            [gameSelectionIndex]?.versions?.
        findIndex(
            version => version.version_id === selection[1]
        );

        if (gameSelectionIndex > -1) {
            setCurrentInfoIndex(gameSelectionIndex);
            setSelectedInfoId(gameSelections[id][0]);
        }
        if (versionSelectionIndex > -1) {
            setCurrentVersionIndex(versionSelectionIndex);
            setSelectedVersionId(gameSelections[id][1]);
        }
    }

    const infosLength = infos?.length;
    const firstInfo = infos?.[0];
    useEffect(() => {
        if (infosLength === 1) {
            setCurrentInfoIndex(0);
            setCurrentSelection(0, -1);
            setSelectedInfoId(firstInfo.id);
            return;
        }
        if ((selectedInfoId ?? -1) > -1) {
            return;
        }
        setCurrentInfoIndex(null);
        setCurrentVersionIndex(null);
        setSelectedInfoId(undefined);
        setHoverVersionIndex(null);
    }, [
        id,
        selectedInfoId,
        gameDataMap[id],
        firstInfo,
        infosLength,
        setCurrentInfoIndex,
        setCurrentVersionIndex,
        setSelectedVersionId,
        setCurrentSelection,
    ]);

    const versionsLength = infos?.[currentInfoIndex ?? 0]?.versions?.length;
    useEffect(() => {
        if (currentInfoIndex === null) {
            return;
        }
        if (infos?.[currentInfoIndex]?.versions?.length === 1) {
            setCurrentVersionIndex(0);
            setCurrentSelection(currentInfoIndex, 0);
            setSelectedVersionId(infos?.[currentInfoIndex]?.versions?.[0]?.version_id);
            return;
        }
        if ((selectedVersionId ?? -1) > -1) {
            return;
        }
        setCurrentVersionIndex(null);
        setSelectedVersionId(undefined);
        setHoverVersionIndex(null);
    }, [
        id,
        gameData,
        currentInfoIndex,
        versionsLength,
        setCurrentVersionIndex,
        setCurrentSelection,
        setHoverVersionIndex,
    ]);

    useEffect(() => {
        restorePreviousSelection();
    }, [id]);

    const infoClickHandler = ((e: React.MouseEvent<HTMLLIElement>) => {
        const index = e.currentTarget.getAttribute('data-info-index') ?? null;

        if (index === null) {
            return;
        }

        const currentInfo = parseInt(index, 10);
        setCurrentInfoIndex(currentInfo);
        setCurrentVersionIndex(null);
        setCurrentSelection(currentInfo, -1);
    }) as CollapsibleListProps<unknown>['onSelect'];

    const gameClickHandler = () => {};

    const versionClickHandler = ((e: React.MouseEvent<HTMLLIElement>) => {
        const index = e.currentTarget.getAttribute('data-version-index') ?? null;

        if (index === null) {
            return;
        }

        const currentVersion = parseInt(index, 10);
        setCurrentVersionIndex(currentVersion);
        setCurrentSelection(currentInfoIndex ?? -1, currentVersion);
    }) as CollapsibleListProps<unknown>['onSelect'];

    const versionNameClickHandler = () => {};

    const versionHoverHandler = ((e: React.MouseEvent) => {
        const index = e.currentTarget.getAttribute('data-version-index') ?? null;

        if (index === null) {
            return;
        }

        if (e.type === 'mouseleave') {
            setHoverVersionIndex(null);
            return;
        }

        setHoverVersionIndex(parseInt(index, 10));
    }) as CollapsibleListProps<unknown>['onHover'];

    const isInfoInCollection = (index: number) => infoIndexesInCollection.includes(index);
    const isVersionInCollection = (index: number) => versionIndexesInCollection.includes(index);

    return {
        id,
        currentInfoIndex,
        currentVersionIndex,
        defaultImageUrl,
        hasInfos: infos?.length > 0,
        currentInfoInCollection: currentInfoIndex !== null && infoIndexesInCollection.includes(currentInfoIndex),
        currentVersionInCollection: currentVersionIndex !== null && versionIndexesInCollection.includes(currentVersionIndex),
        info,
        infos,
        version,
        hoverVersion: versions?.[hoverVersionIndex ?? -1],
        versions,
        isInfoInCollection,
        isVersionInCollection,
        infoIndexesInCollection,
        versionIndexesInCollection,
        extensionRenderBlock,
        infoClickHandler,
        gameClickHandler,
        versionClickHandler,
        versionNameClickHandler,
        versionHoverHandler,
        setCurrentSelection,
        restorePreviousSelection,
        searchGameUPC,
        updateGameUPC,
        removeGameUPC,
        isUpdating: isSubmitPending,
        isRemoving: isRemovePending,
        status,
        syncOn,
    };
}