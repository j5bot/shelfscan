'use client';

import { useGameSelections } from '@/app/lib/GameSelectionsProvider';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { useSelector } from '@/app/lib/hooks';
import {
    getIndexesInCollectionFromInfos,
} from '@/app/lib/redux/bgg/collection/selectors';
import { GameUPCBggInfo, GameUPCBggVersion } from '@/app/lib/types/GameUPCData';
import { CollapsibleList, CollapsibleListProps } from '@/app/ui/CollapsibleList';
import { ThumbnailBox } from '@/app/ui/games/ThumbnailBox';
import Image from 'next/image';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { FaCheck } from 'react-icons/fa6';

export const SelectVersion = ({ id }: { id: string }) => {
    const {
        getGameData,
        gameDataMap,
    } = useGameUPCData();

    const {
        gameSelections,
        setGameSelections,
    } = useGameSelections();

    const { bgg_info: infos } = gameDataMap[id] ?? {};

    const [currentInfoIndex, setCurrentInfoIndex] = useState<number | null>(infos?.length === 1 ? 0 : null);
    const [currentVersionIndex, setCurrentVersionIndex] = useState<number | null>(infos?.[currentInfoIndex ?? 0]?.versions.length === 1 ? 0 : null);

    const [selectedInfoId, setSelectedInfoId] = useState<number>();
    const [selectedVersionId, setSelectedVersionId] = useState<number>();

    const [hoverVersionIndex, setHoverVersionIndex] = useState<number | null>(null);

    const info = infos?.[currentInfoIndex ?? 0];
    const versions = info?.versions;
    const version = versions?.[hoverVersionIndex ?? currentVersionIndex ?? 0];

    const {
        infoIndexes: infoIndexesInCollection,
        versionIndexes: versionIndexesInCollection,
    } = useSelector(state => getIndexesInCollectionFromInfos(state, infos));

    // const collectionItems = useSelector(state => getItemsInCollectionById(state, info?.id));
    // const collectionVersions = useSelector(state => getVersionsInCollectionById(state, version?.version_id));
    //
    // const infoUpdateUrl = info?.update_url;
    // const versionUpdateUrl = version?.update_url;

    useEffect(() => {
        if (!id) {
            return;
        }
        if (gameDataMap[id]) {
            return;
        }
        getGameData(id).then();
    }, [id, gameDataMap[id]]);

    const setCurrentSelection = useCallback((infoIndex: number, versionIndex: number) => {
        if (infoIndex === -1) {
            delete gameSelections[id];
            setGameSelections(gameSelections);
            return;
        }
        if (versionIndex === -1) {
            gameSelections[id] = [infos[infoIndex].id];
            setGameSelections(gameSelections);
            return;
        }
        gameSelections[id] = [infos[infoIndex].id, versions[versionIndex].version_id];
        setGameSelections(gameSelections);
    }, [gameSelections, setGameSelections, infos, versions]);

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

    useEffect(() => {
        if (infos?.length === 1) {
            setCurrentInfoIndex(0);
            setCurrentSelection(0, -1);
            return;
        }
        if ((selectedInfoId ?? -1) > -1) {
            return;
        }
        setCurrentInfoIndex(null);
        setCurrentVersionIndex(null);
        setHoverVersionIndex(null);
    }, [
        id,
        gameDataMap[id],
        infos?.length,
        setCurrentInfoIndex,
    ]);

    useEffect(() => {
        if (currentInfoIndex === null) {
            return;
        }
        if (infos?.[currentInfoIndex].versions.length === 1) {
            setCurrentVersionIndex(0);
            setCurrentSelection(currentInfoIndex, 0);
            return;
        }
        if ((selectedVersionId ?? -1) > -1) {
            return;
        }
        setCurrentVersionIndex(null);
        setHoverVersionIndex(null);
    }, [
        id,
        gameDataMap[id],
        currentInfoIndex,
        infos?.[currentInfoIndex ?? 0]?.versions.length,
        setCurrentVersionIndex,
        setCurrentSelection,
        setHoverVersionIndex,
    ]);

    useEffect(() => {
        restorePreviousSelection();
    }, [id]);

    if (!infos) {
        return null;
    }

    const infoClickHandler = ((e: React.MouseEvent<HTMLLIElement>) => {
        const index = e.currentTarget.getAttribute('data-info-index') ?? null;

        if (index === null) {
            return;
        }

        const currentInfo = parseInt(index, 10);
        setCurrentInfoIndex(currentInfo);
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

    const renderItem = (info: GameUPCBggInfo, index: number): ReactNode => {
        return <div className="flex items-center justify-start gap-2">{info.name}{
            infoIndexesInCollection.includes(index) && <FaCheck />
        }</div>;
    };

    const renderVersionItem = (version: GameUPCBggVersion, index: number): ReactNode => {
        return <div className="flex flex-col items-start">
            <div className="flex gap-2 items-center">{version.name}{
                versionIndexesInCollection.includes(index) && <FaCheck />
            }</div>
            <div className="text-accent">{version.language} {version.published}</div>
        </div>
    };

    const renderSelectedItem = (item: GameUPCBggInfo | GameUPCBggVersion) => {
        return <div className="flex gap-1 items-center">{item.name}{
            ((item as GameUPCBggInfo).id ?
                infoIndexesInCollection.includes(currentInfoIndex ?? -1) :
                versionIndexesInCollection.includes(currentVersionIndex ?? -1))
            && <FaCheck />
        }</div>;
    };

    return <div className="flex flex-col items-center h-full p-3">
        <div className="mt-20 md:mt-30 pt-3 bg-overlay min-w-2/3">
            <h2 className="mb-1 text-center">{infos[currentInfoIndex ?? -1]?.name}</h2>
            <div className="flex gap-2 items-center justify-center">
                <ThumbnailBox
                    alt={version?.name}
                    url={version?.thumbnail_url}
                    size={150}
                />
                <div className="max-w-1/3">
                    <div className="border-b-1 border-b-gray-300">{version?.name}</div>
                    <h4>{version?.published}</h4>
                </div>
            </div>
            <h4 className="mb-1 text-center">{versions[hoverVersionIndex ?? -1]?.name}</h4>
        </div>
        <div className="bg-overlay min-w-1/2">
            <div className="flex gap-1 items-center">
                <div className="tooltip shrink-0" data-tip="Game"><Image
                    className="inline-block"
                    src={'/icons/box-game.png'} alt="Game" width={32} height={32}
                /></div>
                <CollapsibleList
                    className="overflow-scroll h-50"
                    type="info"
                    items={infos}
                    selectedItemIndex={currentInfoIndex}
                    onClick={gameClickHandler}
                    onSelect={infoClickHandler}
                    getItemKey={(info: GameUPCBggInfo) => info.id.toString()}
                    renderItem={renderItem}
                    renderSelectedItem={renderSelectedItem}
                />
            </div>
            {currentInfoIndex !== null && versions && <div className="flex items-center gap-1.5">
                <div className="tooltip shrink-0" data-tip="Version"><Image
                    className="inline-block"
                    src={'/icons/box-version.png'}
                    alt="Version" width={32} height={32}
                /></div>
                <CollapsibleList
                    className="overflow-scroll h-65 md:h-80 lg:h-100"
                    type="version"
                    items={versions}
                    selectedItemIndex={currentVersionIndex}
                    onClick={versionNameClickHandler}
                    onHover={versionHoverHandler}
                    onSelect={versionClickHandler}
                    getItemKey={(version: GameUPCBggVersion) => version.version_id.toString()}
                    renderItem={renderVersionItem}
                    renderSelectedItem={renderSelectedItem}
                />
            </div>}
        </div>
    </div>;
};