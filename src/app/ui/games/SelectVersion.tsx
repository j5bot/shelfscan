'use client';

import { useSelectVersion } from '@/app/lib/hooks/useSelectVersion';
import {
    GameUPCBggInfo,
    GameUPCBggVersion,
    GameUPCStatus
} from '@/app/lib/types/GameUPCData';
import { CollapsibleList } from '@/app/ui/CollapsibleList';
import { ThumbnailBox } from '@/app/ui/games/ThumbnailBox';
import { ConfidenceLevelIcon } from '@/app/ui/gameupc/ConfidenceLevelIcon';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Image from 'next/image';
import React, { ReactNode, SyntheticEvent, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { FaCaretRight, FaCheck, FaThumbsDown, FaThumbsUp } from 'react-icons/fa6';

// const renderDictionaryListItem = (term: ReactNode, definition: ReactNode, className?: string) =>
//     (<div className={className}>
//         <dt>{term}</dt>
//         <dd>{definition}</dd>
//     </div>);

// const glossary = [
//     {
//         term: <Image
//             className="inline-block"
//             src={'/icons/box-game.png'} alt="Game" width={32} height={32}
//         />,
//         definition: 'Game',
//     },
//     {
//         term: <Image
//             className="inline-block"
//             src={'/icons/box-version.png'}
//             alt="Version" width={32} height={32}
//         />,
//         definition: 'Version',
//     },
//     {
//         term: <FaCheck />,
//         definition: 'In Collection',
//     },
//     {
//         term: <FaThumbsUp />,
//         definition: 'Update GameUPC',
//     },
// ];

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
        hoverVersion,
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
    } = useSelectVersion(id);

    const [searchString, setSearchString] = useState<string>('');

    if (!hasInfos) {
        return null;
    }

    const searchBlurHandler = (e: SyntheticEvent<HTMLInputElement>) => {
        const searchString = e.currentTarget.value;
        setSearchString(searchString);
    };

    const searchClickHandler = () => {
        searchGameUPC(searchString);
    };

    const renderItem = (info: GameUPCBggInfo, index: number): ReactNode => {
        return <div className="flex items-center justify-start gap-2">{info.name}{
            isInfoInCollection(index) && <FaCheck />
        } <ConfidenceLevelIcon
            confidence={info.confidence}
        /></div>;
    };

    const renderVersionItem = (version: GameUPCBggVersion, index: number): ReactNode => {
        return <div className="flex flex-col items-start">
            <div className="flex gap-2 items-center">{version.name}{
                isVersionInCollection(index) && <FaCheck />
            } <ConfidenceLevelIcon
                confidence={version.confidence}
            /></div>
            <div className="text-accent">{version.language} {version.published}</div>
        </div>
    };

    const renderSelectedItem = (item: GameUPCBggInfo | GameUPCBggVersion) => {
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
            <div className="flex gap-2 items-center" data-confidence={item?.confidence}>
                <ConfidenceLevelIcon
                    confidence={item?.confidence}
                    barColor={item?.confidence >= 90 ? 'green' : item?.confidence < 20 ? 'red' : 'currentColor' }
                />
                {showUpdate && (
                    <button onClick={updateGameUPC} className="text-gray-500 btn flex text-xs">
                        <FaThumbsUp />
                        <span className="hidden md:block">Update</span>
                    </button>
                )} {showRemove && (
                    <button onClick={removeGameUPC} className="text-gray-500 btn flex text-xs">
                        <FaThumbsDown />
                        <span className="hidden md:block">Remove</span>
                    </button>
                )}
            </div>
        </div>;
    };

    return <>
        <NavDrawer />
        <div className="flex flex-col items-center h-full p-3">
            <div className="mt-20 md:mt-30 pt-3 bg-overlay min-w-2/3">
                <h2 className="mb-1 text-center">{info?.name}</h2>
                <div className="flex gap-2 items-stretch justify-center">
                    <ThumbnailBox
                        alt={version?.name ?? 'Default Game Image'}
                        url={version?.thumbnail_url ?? defaultImageUrl}
                        size={150}
                    />
                    <div className="flex flex-col gap-2 w-content lg:max-w-2/3">
                        <div className="grow">
                            <div className="border-b-1 border-b-gray-300">{version?.name}</div>
                            <h4>{version?.published}</h4>
                        </div>
                        <div className="shrink pb-1">
                            <details className="flex gap-1.5">
                                <summary className="text-gray-500 btn h-7 p-0">
                                    <FaSearch className="w-4 m-2" />
                                </summary>
                                <div className="flex items-center gap-1">
                                    <input tabIndex={0}
                                           type="text"
                                           className="input h-7 text-xs w-11/12"
                                           name="search"
                                           defaultValue={searchString}
                                           onBlur={searchBlurHandler}
                                    />
                                    <button tabIndex={0}
                                            onClick={searchClickHandler}
                                            className="bg-gray-400 p-0.5 rounded-full"
                                    >
                                        <FaCaretRight className="text-white"/>
                                    </button>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
                <h4 className="mb-1 text-center">{hoverVersion?.name}</h4>
            </div>
            <div className="bg-overlay min-w-1/2">
                <div className="flex gap-2 items-center">
                    <div className="tooltip shrink-0 flex flex-col items-center w-11" data-tip="Game">
                        <Image
                            className="inline-block"
                            src={'/icons/box-game.png'} alt="Game" width={32} height={32}
                        />
                        <span className="text-xs">Game</span>
                    </div>
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
                    <div className="tooltip shrink-0 flex flex-col items-center w-11" data-tip="Version">
                        <Image
                        className="inline-block"
                        src={'/icons/box-version.png'}
                        alt="Version" width={32} height={32}
                        />
                        <span className="text-xs">Version</span>
                    </div>
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
        </div>
        {/*<div className="absolute bottom-2 right-4 border-2 p-3 bg-overlay rounded-xl border-gray-200">*/}
        {/*    <dl>*/}
        {/*        {glossary.map(entry =>*/}
        {/*            renderDictionaryListItem(*/}
        {/*                entry.term,*/}
        {/*                entry.definition,*/}
        {/*                'grid grid-cols-2'*/}
        {/*            )*/}
        {/*        )}*/}
        {/*    </dl>*/}
        {/*</div>*/}
    </>;
};