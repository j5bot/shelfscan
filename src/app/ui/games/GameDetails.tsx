import { usePlugins } from '@/app/lib/PluginMapProvider';
import { useSelectVersionContext } from '@/app/lib/SelectVersionProvider';
import { DynamicReactIcon } from '@/app/ui/DynamicReactIcon';
import { ThumbnailBox } from '@/app/ui/games/ThumbnailBox';
import { template } from '@blakeembrey/template';
import Link from 'next/link';
import React, { SyntheticEvent, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { FaCaretRight } from 'react-icons/fa6';

const getVersionUrl = (versionId: number) => `https://boardgamegeek.com/boardgameversion/${versionId}`;

export const GameDetails = () => {
    const { defaultImageUrl, id, info, searchGameUPC, version } = useSelectVersionContext();
    const detailTemplates = usePlugins('link.details');

    const [searchString, setSearchString] = useState<string>('');

    const searchBlurHandler = (e: SyntheticEvent<HTMLInputElement>) => {
        const searchString = e.currentTarget.value;
        setSearchString(searchString);
    };

    const searchClickHandler = () => {
        searchGameUPC(searchString);
    };

    return <div
        id="game-details"
        className="mt-20 md:mt-30 pt-3 bg-overlay min-w-2/3"
    >
        <h2 className="mb-1 text-center uppercase">
            {info?.page_url ?
             <Link className="hover:underline" href={info.page_url} target="_blank">{info?.name ?? id}</Link> :
             info?.name ?? id}
            {info && detailTemplates.game?.map(plugin => {
                const templateFn = template(plugin.template);
                return <Link key={plugin.template} title={plugin.title} href={templateFn(info ?? { upc: id })} target="_blank">
                    <DynamicReactIcon icon={plugin.icon} size={9} className="text-gray-400 inline-block align-super ml-1" />
                </Link>;
            })}
        </h2>
        <div className="flex gap-2 items-stretch justify-center">
            <ThumbnailBox
                alt={version?.name ?? 'Default Game Image'}
                url={version?.thumbnail_url ?? defaultImageUrl}
                size={150}
            />
            <div className="flex flex-col gap-2 w-content lg:max-w-2/3">
                {version?.name && <div className="grow">
                    <div className="border-b-1 border-b-gray-300">
                        {version?.version_id ?
                         <Link href={getVersionUrl(version.version_id)} target="_blank">{version.name}</Link> :
                         version?.name}
                        {version?.version_id && detailTemplates.version?.map(plugin => {
                            const templateFn = template(plugin.template);
                            return <Link key={plugin.template}
                                         title={plugin.title}
                                         href={templateFn({ ...version, page_url: getVersionUrl(version.version_id) })}
                                         target="_blank">
                                <DynamicReactIcon icon={plugin.icon} size={8} className="text-gray-400 inline-block align-super ml-1" />
                            </Link>;
                        })}
                    </div>
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
};