'use client';

import { useGameSelections } from '@/app/lib/GameSelectionsProvider';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { GameUPCBggInfo, GameUPCBggVersion } from '@/app/lib/types/GameUPCData';
import { CollapsibleList, CollapsibleListProps } from '@/app/ui/CollapsibleList';
import { ThumbnailBox } from '@/app/ui/games/ThumbnailBox';
import Image from 'next/image';
import React, { useCallback, useEffect, useState } from 'react';

const renderVersionItem = (version: GameUPCBggVersion) => {
    return <div className="flex flex-col items-start">
        <div>{version.name}</div>
        <div className="text-accent">{version.language} {version.published}</div>
    </div>
};

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

    const [currentInfo, setCurrentInfo] = useState<number | null>(infos?.length === 1 ? 0 : null);
    const [currentVersion, setCurrentVersion] = useState<number | null>(infos?.[currentInfo ?? 0]?.versions.length === 1 ? 0 : null);

    const [selectedInfoId, setSelectedInfoId] = useState<number>();
    const [selectedVersionId, setSelectedVersionId] = useState<number>();

    const [hoverVersion, setHoverVersion] = useState<number | null>(null);

    const info = infos?.[currentInfo ?? 0];
    const versions = info?.versions;
    const version = versions?.[hoverVersion ?? currentVersion ?? -1];

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
            setCurrentInfo(gameSelectionIndex);
            setSelectedInfoId(gameSelections[id][0]);
        }
        if (versionSelectionIndex > -1) {
            setCurrentVersion(versionSelectionIndex);
            setSelectedVersionId(gameSelections[id][1]);
        }
    }

    useEffect(() => {
        if (infos?.length === 1) {
            setCurrentInfo(0);
            setCurrentSelection(0, -1);
            return;
        }
        if ((selectedInfoId ?? -1) > -1) {
            return;
        }
        setCurrentInfo(null);
        setCurrentVersion(null);
        setHoverVersion(null);
    }, [
        id,
        gameDataMap[id],
        infos?.length,
        setCurrentInfo,
    ]);

    useEffect(() => {
        if (currentInfo === null) {
            return;
        }
        if (infos?.[currentInfo].versions.length === 1) {
            setCurrentVersion(0);
            setCurrentSelection(currentInfo, 0);
            return;
        }
        if ((selectedVersionId ?? -1) > -1) {
            return;
        }
        setCurrentVersion(null);
        setHoverVersion(null);
    }, [
        id,
        gameDataMap[id],
        currentInfo,
        infos?.[currentInfo ?? 0]?.versions.length,
        setCurrentVersion,
        setCurrentSelection,
        setHoverVersion,
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
        setCurrentInfo(currentInfo);
        setCurrentSelection(currentInfo, -1);
    }) as CollapsibleListProps<unknown>['onSelect'];

    const gameClickHandler = () => {};

    const versionClickHandler = ((e: React.MouseEvent<HTMLLIElement>) => {
        const index = e.currentTarget.getAttribute('data-version-index') ?? null;

        if (index === null) {
            return;
        }

        const currentVersion = parseInt(index, 10);
        setCurrentVersion(currentVersion);
        setCurrentSelection(currentInfo ?? -1, currentVersion);
    }) as CollapsibleListProps<unknown>['onSelect'];

    const versionNameClickHandler = () => {};

    const versionHoverHandler = ((e: React.MouseEvent) => {
        const index = e.currentTarget.getAttribute('data-version-index') ?? null;

        if (index === null) {
            return;
        }

        if (e.type === 'mouseleave') {
            setHoverVersion(null);
            return;
        }

        setHoverVersion(parseInt(index, 10));
    }) as CollapsibleListProps<unknown>['onHover'];

    return <div className="flex flex-col items-center h-full p-3">
        <div className="mt-20 md:mt-30 pt-3 bg-overlay min-w-2/3">
            <h2 className="mb-1 text-center">{infos[currentInfo ?? -1]?.name}</h2>
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
            <h4 className="mb-1 text-center">{versions[hoverVersion ?? -1]?.name}</h4>
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
                    selectedItemIndex={currentInfo}
                    onClick={gameClickHandler}
                    onSelect={infoClickHandler}
                    getItemKey={(info: GameUPCBggInfo) => info.id.toString()}
                    renderItem={(info: GameUPCBggInfo) => <>{info.name}</>}
                    renderSelectedItem={(info: GameUPCBggInfo) => <>{info.name}</>}
                />
            </div>
            {currentInfo !== null && versions && <div className="flex items-center gap-1.5">
                <div className="tooltip shrink-0" data-tip="Version"><Image
                    className="inline-block"
                    src={'/icons/box-version.png'}
                    alt="Version" width={32} height={32}
                /></div>
                <CollapsibleList
                    className="overflow-scroll h-65 md:h-80 lg:h-100"
                    type="version"
                    items={versions}
                    selectedItemIndex={currentVersion}
                    onClick={versionNameClickHandler}
                    onHover={versionHoverHandler}
                    onSelect={versionClickHandler}
                    getItemKey={(version: GameUPCBggVersion) => version.version_id.toString()}
                    renderItem={renderVersionItem}
                    renderSelectedItem={(version: GameUPCBggVersion) => <>{version.name}</>}
                />
            </div>}
        </div>
    </div>;
};