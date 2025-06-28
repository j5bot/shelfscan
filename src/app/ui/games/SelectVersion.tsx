'use client';

import { useSelectVersion } from '@/app/lib/hooks/useSelectVersion';
import {
    GameUPCBggInfo,
    GameUPCBggVersion,
    GameUPCStatus
} from '@/app/lib/types/GameUPCData';
import { CollapsibleList } from '@/app/ui/CollapsibleList';
import { ThumbnailBox } from '@/app/ui/games/ThumbnailBox';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { SvgCssGauge } from '@/app/ui/SvgCssGauge';
import Image from 'next/image';
import React, { ReactNode, SyntheticEvent, useLayoutEffect, useMemo, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { FaCaretRight, FaCheck, FaPlus, FaThumbsDown, FaThumbsUp } from 'react-icons/fa6';

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

    const [searchString, setSearchString] = useState<string>('');
    const [syncOn, setSyncOn] = useState<boolean>(false);

    useLayoutEffect(() =>
        setSyncOn(document.body.getAttribute('data-shelfscan-sync') === 'on'), [version]);

    if (!hasInfos) {
        return null;
    }

    const addToCollection = () => {
        const ce = new CustomEvent('shelfscan-sync', {
            detail: {
                name: version?.name,
                gameId: info?.id,
                versionId: version?.version_id,
            },
        });
        document.dispatchEvent(ce);
    };

    const searchBlurHandler = (e: SyntheticEvent<HTMLInputElement>) => {
        const searchString = e.currentTarget.value;
        setSearchString(searchString);
    };

    const searchClickHandler = () => {
        searchGameUPC(searchString);
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
        const { confidence } = item;
        const confidenceLevelColor = getConfidenceLevelColor(confidence);

        const isInfo = (item as GameUPCBggInfo)?.id >= 0;
        const inCollection = isInfo ?
                             currentInfoInCollection :
                             currentVersionInCollection;
        const showUpdate = (isInfo && currentVersionIndex === -1 ) || (!isInfo && currentVersionIndex !== -1);
        const showRemove = isInfo ? status === GameUPCStatus.verified : info?.version_status === GameUPCStatus.verified;

        return <div className="flex gap-1 items-center justify-between">
            <div className="flex items-center gap-3">
                {item?.name}{
                inCollection &&
                        <FaCheck className="tooltip inline-block" data-tooltip="In Collection" />
                }
            </div>
            <div className="flex gap-0.5 items-center" data-confidence={item?.confidence}>
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
                        {syncOn && <button
                            onClick={addToCollection}
                            className="collection-button text-gray-500 h-6 w-6 md:w-fit p-1 btn flex text-xs"
                        >
                            <FaPlus className="md:w-2.5 md:h-2.5" />
                            <span className="hidden md:block">Add</span>
                        </button>}
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
            </div>
        </div>;
    };

    return <>
        <NavDrawer />
        <div className="flex flex-col items-center h-full p-3">
            <div id="game-details" className="mt-20 md:mt-30 pt-3 bg-overlay min-w-2/3">
                <h2 className="mb-1 text-center uppercase">{info?.name}</h2>
                <div className="flex gap-2 items-stretch justify-center">
                    <ThumbnailBox
                        alt={version?.name ?? 'Default Game Image'}
                        url={version?.thumbnail_url ?? defaultImageUrl}
                        size={150}
                    />
                    <div className="flex flex-col gap-2 w-content lg:max-w-2/3">
                        {version?.name && <div className="grow">
                            <div className="border-b-1 border-b-gray-300">{version?.name}</div>
                            <h4>{version?.published || 'Unknown'}</h4>
                        </div>}
                        <div className="shrink pb-1">
                            <details className="inline-flex gap-1.5 items-center">
                                <summary className="align-middle text-gray-500 btn h-7 w-7 p-0">
                                    <FaSearch className="w-4 m-2" />
                                </summary>
                                <div className="align-middle inline-flex items-center gap-1 w-fit">
                                    <input tabIndex={0}
                                           type="text"
                                           className="input h-7 text-xs w-fit"
                                           name="search"
                                           defaultValue={searchString}
                                           onBlur={searchBlurHandler}
                                    />
                                    <button tabIndex={0}
                                            onClick={searchClickHandler}
                                            className="inline-flex bg-gray-400 p-0.5 rounded-full"
                                    >
                                        <FaCaretRight className="text-white"/>
                                    </button>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-overlay w-fit min-w-1/3 lg:min-w-1/4">
                <div id="select-game" className="flex gap-2 items-center">
                    <div id="game-symbol" className="tooltip shrink-0 flex flex-col items-center w-fit" data-tip="Game">
                        <Image
                            className="inline-block w-6 h-6 md:w-8 md:h-8"
                            src={'/icons/box-game.png'} alt="Game" width={32} height={32}
                        />
                        {/*<span className="text-xs">Game</span>*/}
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
                        {/*<span className="text-xs">Version</span>*/}
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
            </div>
        </div>
    </>;
};