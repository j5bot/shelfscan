import { useGameSelections } from '@/app/lib/GameSelectionsProvider';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { useSelector } from '@/app/lib/hooks/index';
import { getIndexesInCollectionFromInfos } from '@/app/lib/redux/bgg/collection/selectors';
import { RootState } from '@/app/lib/redux/store';
import { PossibleStatusWithAll } from '@/app/lib/types/bgg';
import { resolveGameSelection } from '@/app/lib/utils/gameSelection';
import { CollapsibleListProps } from '@/app/ui/CollapsibleList';
import { GameUPCBggInfo, GameUPCBggVersion } from 'gameupc-hooks/types';
import React, { useCallback, useEffect, useState } from 'react';

type UseSelectVersionParams = {
    id?: string;
    infos?: GameUPCBggInfo[];
    versions?: GameUPCBggVersion[];
};

export const useSelectVersion = ({
    id,
    infos: infosParam = [],
    versions: versionsParam = [],
}: UseSelectVersionParams) => {
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

    const { bgg_info_status: status, bgg_info: infos = infosParam } = gameDataMap[id ?? ''] ?? {};

    const defaultImageUrl = infos?.[0]?.image_url;

    // the shared gameSelections store is the source of truth
    const {
        currentInfoIndex,
        currentVersionIndex,
        selectedInfoId,
        selectedVersionId,
    } = resolveGameSelection(infos, id ? gameSelections[id] : undefined);

    const info = infos?.[currentInfoIndex ?? -1];
    const versions = info?.versions ?? versionsParam;

    // hover belongs to the info it happened in, so it clears when the info changes
    const [hover, setHover] = useState<{ infoIndex: number | null; versionIndex: number } | null>(null);
    const hoverVersionIndex = hover?.infoIndex === currentInfoIndex ? hover.versionIndex : null;

    const version = versions?.[hoverVersionIndex ?? currentVersionIndex ?? -1];

    const updateGameUPC = () => {
        if (!(selectedInfoId && id) || isSubmitPending) {
            return;
        }
        submitOrVerifyGame(id, selectedInfoId, selectedVersionId);
    };

    const removeGameUPC = () => {
        if (!(selectedInfoId && id) || isRemovePending) {
            return;
        }
        removeGame(id, selectedInfoId, selectedVersionId);
    }

    const {
        infoIndexes: infoIndexesInCollection,
        versionIndexes: versionIndexesInCollection,
    } = useSelector(state =>
        getIndexesInCollectionFromInfos([state, infos, ['own', 'fortrade', 'wishlist', 'all']]));

    const gameData = gameDataMap[id ?? ''];

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
        if (!id) {
            return;
        }
        getGameData(id, search).then();
    };

    const setCurrentSelection = useCallback((infoIndex: number, versionIndex: number) => {
        if (!id) {
            return;
        }
        if (infoIndex === -1) {
            setGameSelections(prev => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { [id]: _, ...rest } = prev;
                return rest;
            });
            return;
        }
        const infoId = infos[infoIndex].id;
        if (versionIndex === -1) {
            setGameSelections(prev => ({ ...prev, [id]: [infoId] }));
            return;
        }
        const versionId = versions[versionIndex].version_id;
        setGameSelections(prev => ({ ...prev, [id]: [infoId, versionId] }));
    }, [id, setGameSelections, infos, versions]);

    // record automatic selections in the shared store too, so batch add and
    // swap export (which only read gameSelections) use the same game/version
    useEffect(() => {
        if (!id || selectedInfoId === undefined) {
            return;
        }
        setGameSelections(prev => {
            const [prevInfoId, prevVersionId] = prev[id] ?? [];
            if (prevInfoId === selectedInfoId && prevVersionId === selectedVersionId) {
                return prev;
            }
            return {
                ...prev,
                [id]: selectedVersionId === undefined ? [selectedInfoId] : [selectedInfoId, selectedVersionId],
            };
        });
    }, [id, selectedInfoId, selectedVersionId, setGameSelections]);

    const infoClickHandler = ((e: React.MouseEvent<HTMLLIElement>) => {
        const index = e.currentTarget.getAttribute('data-info-index') ?? null;

        if (index === null) {
            return;
        }

        setCurrentSelection(parseInt(index, 10), -1);
    }) as CollapsibleListProps<unknown>['onSelect'];

    const gameClickHandler = () => {};

    const versionClickHandler = ((e: React.MouseEvent<HTMLLIElement>) => {
        const index = e.currentTarget.getAttribute('data-version-index') ?? null;

        if (index === null) {
            return;
        }

        setCurrentSelection(currentInfoIndex ?? -1, parseInt(index, 10));
    }) as CollapsibleListProps<unknown>['onSelect'];

    const versionNameClickHandler = () => {};

    const versionHoverHandler = ((e: React.MouseEvent) => {
        const index = e.currentTarget.getAttribute('data-version-index') ?? null;

        if (index === null) {
            return;
        }

        if (e.type === 'mouseleave') {
            setHover(null);
            return;
        }

        setHover({ infoIndex: currentInfoIndex, versionIndex: parseInt(index, 10) });
    }) as CollapsibleListProps<unknown>['onHover'];

    const isInfoInCollection = (index: number, status: PossibleStatusWithAll = 'own') => infoIndexesInCollection[status]?.includes(index);
    const isVersionInCollection = (index: number, status: PossibleStatusWithAll = 'own') => versionIndexesInCollection[status]?.includes(index);

    const isCurrentInfoInCollection = (status: PossibleStatusWithAll = 'own') =>
        currentInfoIndex !== null && infoIndexesInCollection[status]?.includes(currentInfoIndex);
    const isCurrentVersionInCollection = (status: PossibleStatusWithAll = 'own') =>
        currentVersionIndex !== null && versionIndexesInCollection[status]?.includes(currentVersionIndex);

    return {
        id,
        currentInfoIndex,
        currentVersionIndex,
        defaultImageUrl,
        hasInfos: infos?.length > 0,
        isCurrentInfoInCollection,
        isCurrentVersionInCollection,
        info,
        infos,
        version,
        hoverVersion: versions?.[hoverVersionIndex ?? -1],
        versions,
        isInfoInCollection,
        isVersionInCollection,
        infoIndexesInCollection,
        versionIndexesInCollection,
        infoClickHandler,
        gameClickHandler,
        versionClickHandler,
        versionNameClickHandler,
        versionHoverHandler,
        setCurrentSelection,
        searchGameUPC,
        updateGameUPC,
        removeGameUPC,
        isUpdating: isSubmitPending,
        isRemoving: isRemovePending,
        status,
    };
}