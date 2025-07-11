'use client';

import { useSelectVersion } from '@/app/lib/hooks/useSelectVersion';
import {
    GameUPCBggInfo,
    GameUPCBggVersion,
    GameUPCStatus
} from '@/app/lib/types/GameUPCData';
import { CollapsibleList } from '@/app/ui/CollapsibleList';
import { GameDetails } from '@/app/ui/games/GameDetails';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { SvgCssGauge } from '@/app/ui/SvgCssGauge';
import Image from 'next/image';
import React, { ReactNode, SyntheticEvent, useLayoutEffect, useState } from 'react';
import { FaCheck, FaPlus, FaThumbsDown, FaThumbsUp } from 'react-icons/fa6';

const getConfidenceLevelColor = (confidence: number) => {
    switch (true) {
        case confidence >= 90:
            return 'lightgreen';
        case confidence >= 60:
            return 'lightblue';
        case confidence >= 45:
            return 'gold';
        case confidence >= 30:
            return 'orange';
        default:
            return 'crimson';
    }
};

export const SelectVersion = ({ id }: { id: string }) => {
    const {
        currentInfoIndex,
        currentVersionIndex,
        defaultImageUrl,
        hasInfos,
        status,
        currentInfoInCollection,
        currentVersionInCollection,
        info,
        version,
        infos,
        versions,
        isInfoInCollection,
        isVersionInCollection,
        infoClickHandler,
        gameClickHandler,
        versionClickHandler,
        versionHoverHandler,
        versionNameClickHandler,
        updateGameUPC,
        removeGameUPC,
        searchGameUPC,
        isUpdating,
        isRemoving,
    } = useSelectVersion(id);

    const [syncOn, setSyncOn] = useState<boolean>(false);

    useLayoutEffect(() =>
        setSyncOn(document.body.getAttribute('data-shelfscan-sync') === 'on'), [version]);

    const addToCollection = (e: SyntheticEvent<HTMLButtonElement>) => {
        const ce = new CustomEvent('shelfscan-sync', {
            detail: {
                name: version?.name,
                gameId: info?.id,
                versionId: version?.version_id,
            },
        });
        document.dispatchEvent(ce);

        const target = e.currentTarget.previousElementSibling as HTMLDivElement;
        void target.offsetWidth;
        target.classList.add('add-pulse');
        setTimeout(() => target.classList.remove('add-pulse'), 2500);
    };

    const renderItem = (info: GameUPCBggInfo, index: number): ReactNode => {
        const { confidence, name } = info;
        const confidenceLevelColor = getConfidenceLevelColor(confidence);

        return <div className="flex items-center justify-start gap-2">
            <div>{name}{
                isInfoInCollection(index) && <FaCheck />
            }</div>
            <SvgCssGauge className="confidence-level shrink-0 m-0.5"
                         color={confidenceLevelColor}
                         fill={confidenceLevelColor}
                         value={confidence} />
        </div>;
    };

    const renderVersionItem = (item: GameUPCBggVersion, index: number): ReactNode => {
        const { confidence, name, language, published } = item;
        const confidenceLevelColor = getConfidenceLevelColor(confidence);

        return <div className="flex flex-col items-start">
            <div className="flex gap-2 items-center">
                <div className="flex gap-2">{name}{
                    isVersionInCollection(index) && <FaCheck />
                }</div>
                <SvgCssGauge className="confidence-level shrink-0 m-0.5"
                             color={confidenceLevelColor}
                             fill={confidenceLevelColor}
                             value={confidence} />
            </div>
            <div className="text-accent">{language} {published}</div>
        </div>
    };

    const renderSelectedItem = (item: GameUPCBggInfo | GameUPCBggVersion) => {
        if (!item) {
            return;
        }
        const { confidence } = item;
        const confidenceLevelColor = getConfidenceLevelColor(confidence);

        const isInfo = (item as GameUPCBggInfo)?.id >= 0;
        const inCollection = isInfo ?
                             currentInfoInCollection :
                             currentVersionInCollection;
        const showUpdate = (isInfo && currentVersionIndex === -1 ) || (!isInfo && currentVersionIndex !== -1);
        const showRemove = isInfo ? status === GameUPCStatus.verified : info?.version_status === GameUPCStatus.verified;

        const selectedItemClasses = `flex gap-1 items-center relative ${syncOn && showUpdate ? 'pr-10' : ''}`;

        return <div className="flex gap-1 items-center justify-between">
            <div className="flex items-center gap-3">
                {item?.name}{
                inCollection &&
                        <FaCheck className="tooltip inline-block" data-tooltip="In Collection" />
                }
            </div>
            <div className={selectedItemClasses} data-confidence={item?.confidence}>
                <SvgCssGauge
                    className="confidence-level m-0.5"
                    duration={0.5}
                    fill={confidenceLevelColor}
                    color={confidenceLevelColor}
                    value={confidence}
                />
                {showUpdate && (
                    <>
                        <button
                            disabled={isUpdating}
                            onClick={updateGameUPC}
                            className="update-button text-gray-500 h-6 w-6 md:w-fit p-1 btn flex text-xs"
                        >
                            <FaThumbsUp  className="md:w-2.5 md:h-2.5" />
                            <span className="hidden md:block">Update</span>
                        </button>
                    </>
                )} {showRemove && (
                    <button
                        disabled={isRemoving}
                        onClick={removeGameUPC}
                        className="remove-button text-gray-500 h-6 w-6 md:w-fit p-1 btn flex text-xs"
                    >
                        <FaThumbsDown className="md:w-2.5 md:h-2.5" />
                        <span className="hidden md:block">Remove</span>
                    </button>
                )}
                {showUpdate && syncOn && <>
                    <div className="rounded-full border-0 border-[#e07ca4ff] absolute top-[-0.25rem] right-0 w-8 h-8"></div>
                    <button
                        className={`collection-button cursor-pointer rounded-full
                            bg-[#e07ca4dc] border-[#e07ca4ff] text-white
                            absolute top-[-0.25rem] right-0 h-8 w-8 p-2.5
                            flex text-xs`}
                        onClick={addToCollection}
                    >
                        <FaPlus className="rounded-full md:w-3.5 md:h-3.5" />
                    </button>
                </>}
            </div>
        </div>;
    };

    return <>
        <NavDrawer />
        <div className="flex flex-col items-center h-full p-3">
            <GameDetails
                defaultImageUrl={defaultImageUrl}
                searchGameUPC={searchGameUPC}
                id={id}
                info={info}
                version={version}
            />
            {hasInfos && <div className="bg-overlay w-fit min-w-1/3 lg:min-w-1/4">
                <div id="select-game" className="flex gap-2 items-center">
                    <div id="game-symbol" className="tooltip shrink-0 flex flex-col items-center w-fit" data-tip="Game">
                        <Image
                            className="inline-block w-6 h-6 md:w-8 md:h-8"
                            src={'/icons/box-game.png'} alt="Game" width={32} height={32}
                        />
                    </div>
                    <CollapsibleList
                        className="text-sm md:text-md overflow-scroll h-50"
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
                {currentInfoIndex !== null && versions && <div
                    id="select-version"
                    className="flex items-center gap-1.5"
                >
                    <div id="version-symbol" className="tooltip shrink-0 flex flex-col items-center w-fit" data-tip="Version">
                        <Image
                            className="inline-block w-6 h-6 md:w-8 md:h-8"
                        src={'/icons/box-version.png'}
                        alt="Version" width={32} height={32}
                        />
                    </div>
                    <CollapsibleList
                        className="text-sm md:text-md overflow-scroll h-65 md:h-80 lg:h-100"
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
            </div>}
        </div>
    </>;
};