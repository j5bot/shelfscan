'use client';

import { useExtension } from '@/app/lib/extension/useExtension';
import { useTitle } from '@/app/lib/hooks/useTitle';
import { usePlugins } from '@/app/lib/PluginMapProvider';
import { useSelectVersionContext } from '@/app/lib/SelectVersionProvider';
import { PossibleStatusWithAll } from '@/app/lib/types/bgg';
import {
    GameUPCBggInfo,
    GameUPCBggVersion,
} from '@/app/lib/types/GameUPCData';
import { CollapsibleList } from '@/app/ui/CollapsibleList';
import { DynamicIcon } from '@/app/ui/DynamicIcon';
import { GameDetails } from '@/app/ui/games/GameDetails';
import { renderItem, renderSelectedItem, renderVersionItem } from '@/app/ui/games/renderers';
import { NavDrawer } from '@/app/ui/NavDrawer';
import { template } from '@blakeembrey/template';
import Link from 'next/link';
import React, { SyntheticEvent } from 'react';
import { IconType } from 'react-icons';
import { FaBarcode, FaCheck, FaEye, FaHeart, FaRecycle } from 'react-icons/fa6';

type HeaderCollectionIcon = {
    title: string;
    Icon: IconType;
};

type HeaderCollectionIconMap = Record<PossibleStatusWithAll, HeaderCollectionIcon>;

const HeaderCollectionIconMap = {
    own: { title: 'Own', Icon: FaCheck },
    fortrade: { title: 'For Trade', Icon: FaRecycle },
    wishlist: { title: 'Wishlist', Icon: FaHeart },
    all: { title: 'Found', Icon: FaEye },
} as HeaderCollectionIconMap;

const gameTitle = <h4 className="uppercase tracking-[0.25rem] text-center block">Select Game</h4>
const versionTitle = <h4 className="uppercase tracking-[0.25rem] text-center block">Select Version</h4>

const actionTemplateOnClick = (e: SyntheticEvent<HTMLButtonElement>)=> {
    const target = e.currentTarget.parentElement?.previousElementSibling as HTMLDivElement;
    void target.offsetWidth;
    target.classList.add('add-pulse');
    setTimeout(() => target.classList.remove('add-pulse'), 2500);
};

export const SelectVersion = () => {
    const selectVersionContext = useSelectVersionContext();
    const {
        id,
        currentInfoIndex,
        currentVersionIndex,
        isInfoInCollection,
        isVersionInCollection,
        hasInfos,
        infos,
        versions,
        info,
        version,
        infoClickHandler,
        gameClickHandler,
        versionClickHandler,
        versionNameClickHandler,
    } = selectVersionContext;

    useTitle(`${version?.name ?? info?.name ?? id} | ShelfScan`);

    const { primaryActions, secondaryActions, settings } = useExtension(info, version);
    const actionTemplates = usePlugins('link.actions');

    const pluginActions = actionTemplates?.game?.map(((actionPlugin, index) => {
        const { className, icon, template: pluginTemplate, title } = actionPlugin;
        const templateFn = template(pluginTemplate);

        return <div key={index} className={`relative shrink-0 xs:h-7 h-8 ${className} mr-0.5`}>
            <div className={`rounded-full ${className} border-0 border-[#e07ca4] absolute top-0 left-0 xs:h-7 h-8 ${className}`}></div>
            <Link title={title} href={templateFn(info ?? { id })} target="_blank">
                <button
                    className={`collection-button cursor-pointer rounded-full
                        relative w-full
                        flex justify-start items-center
                        bg-[#e07ca4] text-white
                        p-1 xs:pl-1.5 pl-2 pr-1.5 xs:h-7 h-8
                        xs:font-stretch-semi-condensed xs:tracking-tight
                        text-sm`}
                    onClick={actionTemplateOnClick}
                >
                    <DynamicIcon icon={icon} size={20} className="w-4 h-4" />
                    <div className="p-0.5 font-semibold uppercase">{title}</div>
                </button>
            </Link>
        </div>;
    }));

    const renderItemFn = renderItem.bind(null, selectVersionContext);
    const renderVersionItemFn = renderVersionItem.bind(null, selectVersionContext);
    const renderSelectedItemFn =
        renderSelectedItem.bind(null, selectVersionContext);

    const collectionStatusChecks = [
        [isVersionInCollection, currentVersionIndex, version],
        [isInfoInCollection, currentInfoIndex, info],
    ] as Array<[
            (index: number, status: PossibleStatusWithAll) => boolean,
            number | null,
            GameUPCBggVersion | GameUPCBggInfo
        ]>;

    const collectionStatusIcons = info ?
        (['own', 'fortrade', 'wishlist'] as PossibleStatusWithAll[])
            .reduce((acc: HeaderCollectionIcon[], status: PossibleStatusWithAll) => {
                collectionStatusChecks.find(([fn, index, item]) => {
                    if (item && index !== null && fn(index, status)) {
                        acc.push(HeaderCollectionIconMap[status]);
                        return true;
                    } else if (status === 'own' &&
                        item && index !== null && fn(index, 'all')) {
                        acc.push(HeaderCollectionIconMap.all);
                    }
                });

                return acc;
        }, []) : [];

    const header = collectionStatusIcons.length > 0 ? <>
        {collectionStatusIcons.map(icon => {
            const { title, Icon } = icon;
            return <div key={title} className={`tooltip bg-gray-400 scale-80 md:scale-none
                flex items-center justify-center h-12 w-12 rounded-full`}
                        data-tooltip={title}>
                <Icon size={34} className={`tooltip text-white`}
                      title={title} />
            </div>
        })}
    </> : null;

    return <>
        <NavDrawer />
        <div className="flex flex-col items-center h-full p-3">
            <GameDetails header={header}>
                <div className="flex flex-wrap justify-start gap-1.5">
                    {primaryActions}
                    {pluginActions}
                    {settings}
                </div>
            </GameDetails>
            {hasInfos && <div className="bg-overlay w-full md:w-2/3 min-w-1/2 lg:min-w-1/3">
                <div id="select-game" className="flex gap-2 items-center">
                    <CollapsibleList
                        title={gameTitle}
                        className="text-sm flex justify-start items-center md:text-md overflow-x-scroll overflow-y-visible min-h-[125px]"
                        type="info"
                        items={infos}
                        selectedItemIndex={currentInfoIndex}
                        onClick={gameClickHandler}
                        onSelect={infoClickHandler}
                        getItemKey={(info: GameUPCBggInfo) => info.id.toString()}
                        renderItem={renderItemFn}
                        renderSelectedItem={renderSelectedItemFn}
                    />
                </div>
                {currentInfoIndex !== null && versions && <div
                    id="select-version"
                    className="flex items-center gap-2"
                >
                    <CollapsibleList
                        title={versionTitle}
                        className="text-sm flex justify-start md:text-md overflow-x-scroll overflow-y-visible min-h-[110px]"
                        type="version"
                        items={versions}
                        selectedItemIndex={currentVersionIndex}
                        onClick={versionNameClickHandler}
                        onSelect={versionClickHandler}
                        getItemKey={(version: GameUPCBggVersion) => version.version_id.toString()}
                        renderItem={renderVersionItemFn}
                        renderSelectedItem={renderSelectedItemFn}
                    />
                </div>}
                {secondaryActions && <div className="flex justify-center min-h-17 items-center">{secondaryActions}</div>}
            </div>}
            <div className="flex justify-center pt-10">
                <Link title={'Scan More Games'} href="/">
                    <button
                        className={`scan-button cursor-pointer rounded-2xl
                        flex justify-start items-center
                        bg-gray-400 text-white
                        p-6 pt-2 pb-2
                        text-4xl`}
                    >
                        <FaBarcode className="w-12 h-9" />
                        <div className="p-1.5 font-semibold uppercase">Scan</div>
                    </button>
                </Link>
            </div>
        </div>
    </>;
};