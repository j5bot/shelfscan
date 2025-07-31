import { usePlugins } from '@/app/lib/PluginMapProvider';
import { useSelectVersionContext } from '@/app/lib/SelectVersionProvider';
import { DynamicIcon } from '@/app/ui/DynamicIcon';
import { ThumbnailBox } from '@/app/ui/games/Thumbnail';
import { template } from '@blakeembrey/template';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { ReactNode, SyntheticEvent, useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { FaCaretRight } from 'react-icons/fa6';

const getVersionUrl = (versionId: number) =>
    `https://boardgamegeek.com/boardgameversion/${versionId}`;

export const GameDetails = (
    { children }: { children: ReactNode }
) => {
    const searchParams = useSearchParams();
    const { defaultImageUrl, id, info, infos, searchGameUPC, version } = useSelectVersionContext();
    const detailTemplates = usePlugins('link.details');

    const searchQuery = searchParams.get('q');

    const [searchFormOpen, setSearchFormOpen] = useState<boolean>(!infos?.length || !!searchQuery);
    const [searchString, setSearchString] = useState<string>(searchQuery ?? '');

    useEffect(() => {
        setSearchFormOpen(!infos || !!searchQuery);
    }, [infos, searchQuery]);

    const searchBlurHandler = (e: SyntheticEvent<HTMLInputElement>) => {
        const searchString = e.currentTarget.value;
        const url = new URL(window.location.href);
        url.searchParams.set('q', searchString);
        window.history.pushState(undefined, '', url.toString());
        setSearchString(searchString);
    };

    const searchClickHandler = () => {
        searchGameUPC(searchString);
    };

    return <div
        id="game-details"
        className="mt-22 md:mt-27 pt-3 bg-overlay min-w-2/3"
    >
        <h2 className="mb-1 text-center text-balance uppercase flex gap-1 justify-center items-center">
            {info?.page_url ?
             <Link className="hover:underline" href={info.page_url} target="_blank">{info?.name ?? id}</Link> :
             info?.name ?? id}
            {info && detailTemplates.game?.map(plugin => {
                const templateFn = template(plugin.template);
                return <Link className="mb-2"
                             key={plugin.template}
                             title={plugin.title}
                             href={templateFn(info ?? { upc: id })}
                             target="_blank"
                >
                    <DynamicIcon icon={plugin.icon} size={plugin.iconSize ?? 12} className="text-gray-400 ml-1" />
                </Link>;
            })}
        </h2>
        <div className="flex gap-2 items-stretch justify-center pb-2">
            <div className="flex items-start">
                <ThumbnailBox
                    alt={version?.name ?? 'Default Game Image'}
                    url={version?.thumbnail_url ?? defaultImageUrl}
                    size={150}
                />
            </div>
            <div className="flex flex-col gap-1 w-full grow lg:max-w-2/3">
                {version?.name && <div className="grow">
                    <div className="border-b-1 border-b-gray-200 pb-1 flex gap-1 text-balance">
                        <span className="grow">
                            {version?.version_id ?
                             <Link href={getVersionUrl(version.version_id)} target="_blank">{version.name}</Link> :
                                   version?.name}
                        </span>
                        {version?.version_id && detailTemplates.version?.length && <div className="shrink">
                            {detailTemplates.version?.map(plugin => {
                                const templateFn = template(plugin.template);
                                return <Link key={plugin.template}
                                             title={plugin.title}
                                             href={templateFn({
                                                 ...version,
                                                 page_url: getVersionUrl(version.version_id),
                                             })}
                                             target="_blank">
                                    <DynamicIcon
                                        icon={plugin.icon}
                                        size={8}
                                        className="text-gray-400 inline-block align-super ml-1"
                                    />
                                </Link>;
                            })}
                        </div>}
                    </div>
                    <h4 className="pb-0.5">{version?.published || 'Unknown'}</h4>
                </div>}
                {children && <div className={`grow max-w-60 pb-0.5 ${version ? '' : 'pt-1'}`}>
                    {info?.id && children}
                </div>}
                <div id="search-game-form" className="shrink pb-1 flex gap-0.5 items-center">
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
                </div>
            </div>
        </div>
    </div>
};