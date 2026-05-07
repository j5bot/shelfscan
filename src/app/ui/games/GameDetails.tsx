import { useGameDetailsSearch } from '@/app/lib/hooks/useGameDetailsSearch';
import { usePlugins } from '@/app/lib/PluginMapProvider';
import { type Game, type Version } from '@/app/lib/types/game';
import { DynamicIcon } from '@/app/ui/DynamicIcon';
import { ThumbnailBox } from '@/app/ui/games/Thumbnail';
import { template } from '@blakeembrey/template';
import Link from 'next/link';
import React, { type ReactNode } from 'react';
import { FaSearch } from 'react-icons/fa';
import { FaCaretRight } from 'react-icons/fa6';

export type GameDetailsSearchProps = {
    onSearch: (search: string) => void;
    initialQuery?: string;
    initialOpen?: boolean;
};

export type GameDetailsProps = {
    /** The parent view **/
    view: 'version' | 'collection';
    /** The selected game to display. */
    game?: Game;
    /** The selected version to display. */
    version?: Version;
    /** Fallback image URL when neither game nor version provides one. */
    defaultImageUrl?: string;
    /** When provided, a search form is rendered inside the component. */
    search?: GameDetailsSearchProps;
    header?: ReactNode;
    children?: ReactNode;
    /** Thumbnail size in px. When >= 250, a vertical stacked layout is used. Defaults to 150. */
    thumbnailSize?: number;
};

export const GameDetails = ({
    game,
    version,
    defaultImageUrl,
    search,
    header,
    children,
    view,
    thumbnailSize = 150,
}: GameDetailsProps) => {
    const detailTemplates = usePlugins('link.details');
    const isLarge = thumbnailSize >= 250;

    const { searchFormOpen, setSearchFormOpen, searchString, searchBlurHandler, searchClickHandler } =
        useGameDetailsSearch({
            onSearch: search?.onSearch ?? (() => {}),
            initialQuery: search?.initialQuery,
            initialOpen: search?.initialOpen,
        });

    const versionInfo = version?.name && (
        <div className={isLarge ? 'w-full mt-2' : 'grow'}>
            <div className="border-b-1 border-b-gray-200 pb-1 flex gap-1 text-balance">
                <span className="grow">
                    {version?.versionId ?
                     <Link href={version.pageUrl} target="_blank">{version.name}</Link> :
                     version?.name}
                </span>
                {version?.versionId && detailTemplates.version?.length && (
                    <div className="shrink">
                        {detailTemplates.version?.map(plugin => {
                            const templateFn = template(plugin.template);
                            return (
                                <Link
                                    key={plugin.template}
                                    title={plugin.title}
                                    href={templateFn(version)}
                                    target="_blank"
                                >
                                    <DynamicIcon
                                        icon={plugin.icon}
                                        size={8}
                                        className="text-gray-400 inline-block align-super ml-1"
                                    />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
            <h4 className="pb-0.5">{version?.published || 'Unknown'}</h4>
        </div>
    );

    const headerClasses = view === 'version' ? 'h-22 md:h-27' : 'h-12 md:h-12 mt-[-1rem]';

    return <div id="game-details">
        {header && (<>
            <div className={`${headerClasses} flex justify-center items-center md:gap-2`}>
                {header}
            </div>
        </>)}
        <div className="pt-3 bg-overlay min-w-23">
            <h2 className="mb-1 text-center text-balance uppercase flex gap-1 justify-center items-center">
                {game?.pageUrl ?
                 <Link className="hover:underline" href={game.pageUrl} target="_blank">{game?.name ?? game?.id}</Link> :
                 game?.name ?? game?.id}
                {game && detailTemplates.game?.map(plugin => {
                    const templateFn = template(plugin.template);
                    return <Link className="mb-2"
                                 key={plugin.template}
                                 title={plugin.title}
                                 href={templateFn(game)}
                                 target="_blank"
                    >
                        <DynamicIcon icon={plugin.icon} size={plugin.iconSize ?? 12} className="text-gray-400 ml-1" />
                    </Link>;
                })}
            </h2>
            {view === 'collection' && children && <div className={`grow max-w-full pb-0.5 ${version ? '' : 'pt-1'}`}>
                {game?.id && children}
            </div>}
            {isLarge ? (
                <div className="flex flex-col items-center pb-2">
                    <ThumbnailBox
                        alt={version?.name ?? game?.name ?? 'Game Image'}
                        url={version?.thumbnailUrl ?? game?.thumbnailUrl ?? defaultImageUrl ?? ''}
                        imageUrl={version?.imageUrl ?? game?.imageUrl ?? defaultImageUrl}
                        size={thumbnailSize}
                        styles={{
                            width: `min(${thumbnailSize}px, calc(100dvw - 4rem))`,
                            height: `min(${thumbnailSize}px, calc(100dvw - 4rem))`,
                        }}
                    />
                    {versionInfo}
                </div>
            ) : (
                <div className="flex gap-2 items-stretch justify-center pb-2">
                    <div className="flex items-start">
                        <ThumbnailBox
                            alt={version?.name ?? 'Default Game Image'}
                            url={version?.thumbnailUrl ?? game?.thumbnailUrl ?? defaultImageUrl ?? ''}
                            imageUrl={version?.imageUrl ?? game?.imageUrl ?? defaultImageUrl}
                            size={thumbnailSize}
                        />
                    </div>
                    <div className="flex flex-col gap-1 w-full grow xs:max-w-[185px] lg:max-w-2/3">
                        {versionInfo}
                        {view === 'version' && children && <div className={`grow max-w-60 pb-0.5 ${version ? '' : 'pt-1'}`}>
                            {game?.id && children}
                        </div>}
                        {search && <div id="search-game-form" className="shrink pb-1 flex gap-0.5 items-center">
                            <div className="cursor-pointer align-middle text-gray-500 border-base-300 btn h-7 w-7 p-0 mr-1">
                                <FaSearch className="w-4 m-2" onClick={() => {
                                    setSearchFormOpen(!searchFormOpen);
                                }} />
                            </div>
                            <div className={`align-middle items-center gap-1 ${searchFormOpen ? 'flex' : 'hidden'}`}>
                                <input tabIndex={0}
                                       type="text"
                                       className="input h-7 text-xs max-w-fit"
                                       name="search"
                                       placeholder="Search for game"
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
                        </div>}
                    </div>
                </div>
            )}
        </div>
    </div>;
};