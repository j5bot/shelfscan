'use client';

import { useExtension } from '@/app/lib/hooks/useExtension';
import { usePlugins } from '@/app/lib/PluginMapProvider';
import { useSelectVersionContext } from '@/app/lib/SelectVersionProvider';
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

    const { primaryActions, secondaryActions } = useExtension(info, version);
    const actionTemplates = usePlugins('link.actions');

    const pluginActions = actionTemplates?.game?.map(((actionPlugin, index) => {
        const { className, icon, template: pluginTemplate, title } = actionPlugin;
        const templateFn = template(pluginTemplate);

        return <div key={index} className={`relative shrink-0 h-8.5 ${className}`}>
            <div className={`rounded-full border-0 border-[#e07ca4] absolute top-0 left-0 h-8.5 ${className}`}></div>
            <Link title={title} href={templateFn(info ?? { id })} target="_blank">
                <button
                    className={`collection-button cursor-pointer rounded-full
                        relative
                        flex justify-start items-center
                        bg-[#e07ca4] text-white
                        p-2 h-8.5
                        text-sm`}
                    onClick={actionTemplateOnClick}
                >
                    <DynamicIcon icon={icon} size={20} className="w-4.5 h-4.5" />
                    <div className="p-1.5 font-semibold uppercase">{title}</div>
                </button>
            </Link>
        </div>;
    }));

    const renderItemFn = renderItem.bind(null, selectVersionContext);
    const renderVersionItemFn = renderVersionItem.bind(null, selectVersionContext);
    const renderSelectedItemFn =
        renderSelectedItem.bind(null, selectVersionContext);

    return <>
        <NavDrawer />
        <div className="flex flex-col items-center h-full p-3">
            <GameDetails>
                <div className="flex flex-wrap justify-start gap-1.5">
                    {primaryActions}
                    {pluginActions}
                </div>
            </GameDetails>
            {hasInfos && <div className="bg-overlay pt-2 w-fit min-w-1/2 lg:min-w-1/3">
                <div id="select-game" className="flex gap-2 items-center">
                    <CollapsibleList
                        title={gameTitle}
                        className="text-sm w-full flex justify-center md:text-md overflow-x-scroll overflow-y-hidden max-h-50"
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
                    className="flex items-center gap-1.5"
                >
                    <CollapsibleList
                        title={versionTitle}
                        className="text-sm md:text-md overflow-x-scroll h-65 md:h-80 lg:h-100"
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
                {secondaryActions && <div className="flex justify-center h-17 items-center">{secondaryActions}</div>}
            </div>}
        </div>
    </>;
};