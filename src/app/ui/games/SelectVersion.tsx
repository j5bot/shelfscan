'use client';

import { useSelectVersionContext } from '@/app/lib/SelectVersionProvider';
import {
    GameUPCBggInfo,
    GameUPCBggVersion,
} from '@/app/lib/types/GameUPCData';
import { CollapsibleList } from '@/app/ui/CollapsibleList';
import { GameDetails } from '@/app/ui/games/GameDetails';
import { ItemRenderer, SelectedItemRenderer, VersionItemRenderer } from '@/app/ui/games/renderers';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Image from 'next/image';

export const SelectVersion = () => {
    const {
        id,
        currentInfoIndex,
        currentVersionIndex,
        defaultImageUrl,
        hasInfos,
        info,
        version,
        infos,
        versions,
        infoClickHandler,
        gameClickHandler,
        versionClickHandler,
        versionHoverHandler,
        versionNameClickHandler,
        searchGameUPC,
    } = useSelectVersionContext();

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
                        renderItem={ItemRenderer}
                        renderSelectedItem={SelectedItemRenderer}
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
                        renderItem={VersionItemRenderer}
                        renderSelectedItem={SelectedItemRenderer}
                    />
                </div>}
            </div>}
        </div>
    </>;
};