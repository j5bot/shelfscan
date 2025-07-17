'use client';

import { useSelectVersionContext } from '@/app/lib/SelectVersionProvider';
import {
    GameUPCBggInfo,
    GameUPCBggVersion,
} from '@/app/lib/types/GameUPCData';
import { CollapsibleList } from '@/app/ui/CollapsibleList';
import { GameDetails } from '@/app/ui/games/GameDetails';
import { renderItem, renderSelectedItem, renderVersionItem } from '@/app/ui/games/renderers';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Image from 'next/image';

export const SelectVersion = () => {
    const selectVersionContext = useSelectVersionContext();
    const {
        currentInfoIndex,
        currentVersionIndex,
        hasInfos,
        infos,
        versions,
        infoClickHandler,
        gameClickHandler,
        versionClickHandler,
        versionHoverHandler,
        versionNameClickHandler,
    } = selectVersionContext;

    const renderItemFn = renderItem.bind(null, selectVersionContext);
    const renderVersionItemFn = renderVersionItem.bind(null, selectVersionContext);
    const renderSelectedItemFn = renderSelectedItem.bind(null, selectVersionContext);

    return <>
        <NavDrawer />
        <div className="flex flex-col items-center h-full p-3">
            <GameDetails />
            {hasInfos && <div className="bg-overlay pt-2 w-fit min-w-1/2 lg:min-w-1/3">
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
                        renderItem={renderItemFn}
                        renderSelectedItem={renderSelectedItemFn}
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
                        renderItem={renderVersionItemFn}
                        renderSelectedItem={renderSelectedItemFn}
                    />
                </div>}
            </div>}
        </div>
    </>;
};