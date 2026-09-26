import { useGameDetailsSearch } from '@/app/lib/hooks/useGameDetailsSearch';
import { usePlugins } from '@/app/lib/PluginMapProvider';
import { type Game, type Version } from '@/app/lib/types/game';
import { firstNonEmptyOrUndefined } from '@/app/lib/utils';
import { DynamicIcon } from '@/app/ui/DynamicIcon';
import { TagsSection } from '@/app/ui/games/TagsSection';
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
    /** The UPC code or ID for the game details **/
    code?: string;
    /** The parent view **/
    view: 'version' | 'collection';
    /** The selected game to display. */
    game?: Game;
    defaultGame?: Game;
    /** The selected version to display. */
    version?: Version;
    /** Fallback image URL when neither game nor version provides one. */
    defaultImageUrl?: string;
    /** When provided, a search form is rendered inside the component. */
    search?: GameDetailsSearchProps;
    header?: ReactNode;
    versionSelect?: ReactNode;
    children?: ReactNode;
    /** Thumbnail size in px. When >= 250, a vertical stacked layout is used. Defaults to 150. */
    thumbnailSize?: number;
};

type DetailTemplates = ReturnType<typeof usePlugins>;
type PluginTemplates = DetailTemplates['game'];

type PluginLinksProps = {
    plugins: PluginTemplates | undefined;
    data: object;
    linkClassName?: string;
    iconClassName: string;
    defaultIconSize: number;
};

/** Icon links built from `link.details` plugin URL templates. */
const PluginLinks = (props: PluginLinksProps) => {
    const { plugins, data, linkClassName, iconClassName, defaultIconSize } = props;

    return plugins?.map(plugin => {
        const templateFn = template(plugin.template);
        return <Link
            className={linkClassName}
            key={plugin.template}
            title={plugin.title}
            href={templateFn(data)}
            target="_blank"
        >
            <DynamicIcon icon={plugin.icon} size={plugin.iconSize ?? defaultIconSize} className={iconClassName} />
        </Link>;
    });
};

type VersionInfoProps = {
    version: Version;
    isLarge: boolean;
    plugins: PluginTemplates | undefined;
};

const VersionInfo = ({ version, isLarge, plugins }: VersionInfoProps) =>
    <div className={isLarge ? 'w-full mt-2' : 'grow'}>
        <div className="border-b border-b-gray-200 pb-1 flex gap-1 text-balance">
            <span className="grow">
                {version.versionId ?
                 <Link href={version.pageUrl} target="_blank">{version.name}</Link> :
                 version.name}
            </span>
            {!!version.versionId && (plugins?.length ?? 0) > 0 && (
                <div className="shrink">
                    <PluginLinks
                        plugins={plugins}
                        data={version}
                        defaultIconSize={8}
                        iconClassName="text-gray-400 inline-block align-super ml-1"
                    />
                </div>
            )}
        </div>
        <h4 className="pb-0.5">{version.published || 'Unknown'}</h4>
    </div>;

const GameSearchForm = ({ search }: { search: GameDetailsSearchProps }) => {
    const { searchFormOpen, setSearchFormOpen, searchString, searchBlurHandler, searchClickHandler } =
        useGameDetailsSearch(search);

    return <div id="search-game-form" className="shrink pb-1 flex gap-0.5 items-center">
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
                    aria-label="Search"
                    onClick={searchClickHandler}
                    className="bg-gray-400 p-0.5 rounded-full"
            >
                <FaCaretRight className="text-white"/>
            </button>
        </div>
    </div>;
};

const getHeaderClasses = (header: ReactNode, view: GameDetailsProps['view']) => {
    if (!header) {
        return 'h-15';
    }
    return view === 'version' ? 'h-22' : 'h-12 md:h-12 mt-[-1rem]';
};

/** The version's images win, then the game's, then the default game's, then the fallback. */
const getGameImages = (props: GameDetailsProps) => {
    const { version, game, defaultGame, defaultImageUrl } = props;

    return {
        alt: version?.name ?? game?.name ?? defaultGame?.name ?? 'Game Image',
        imageUrl: firstNonEmptyOrUndefined(version?.imageUrl, game?.imageUrl, defaultGame?.imageUrl, defaultImageUrl),
        thumbnailUrl: firstNonEmptyOrUndefined(
            version?.thumbnailUrl, game?.thumbnailUrl, defaultGame?.thumbnailUrl, defaultImageUrl,
        ) ?? '',
    };
};

type ChildrenSlotProps = {
    game?: Game;
    defaultGame?: Game;
    hasVersion: boolean;
    className: string;
    children: ReactNode;
};

/** Children (e.g. extension actions) render only once a game is known. */
const ChildrenSlot = (props: ChildrenSlotProps) => {
    const { game, defaultGame, hasVersion, className, children } = props;

    return <div className={`${className} pb-0.5 ${hasVersion ? '' : 'pt-1'}`}>
        {!!(game?.id ?? defaultGame?.id) && children}
    </div>;
};

export const GameDetails = (props: GameDetailsProps) => {
    const {
        code,
        game,
        defaultGame,
        version,
        search,
        header,
        children,
        versionSelect,
        view,
        thumbnailSize = 150,
    } = props;

    const detailTemplates = usePlugins('link.details');
    const isLarge = thumbnailSize >= 250;
    const isCollectionView = view === 'collection';
    const { collectionId } = game ?? {};
    const images = getGameImages(props);

    const versionInfo = version?.name && <VersionInfo version={version} isLarge={isLarge} plugins={detailTemplates.version} />;
    const childrenSlot = (className: string) => children && (
        <ChildrenSlot game={game} defaultGame={defaultGame} hasVersion={!!version} className={className}>
            {children}
        </ChildrenSlot>
    );

    return <div id="game-details">
        <div className={`${getHeaderClasses(header, view)} flex justify-center items-center md:gap-2`}>
            {header}
        </div>
        <div className={`pt-3 bg-overlay min-w-23`}>
            <h2 className="mb-1 text-center text-balance uppercase flex gap-1 justify-center items-center">
                {game?.pageUrl ?
                 <Link className="hover:underline" href={game.pageUrl} target="_blank">{game.name}</Link> :
                 game?.name ?? code}
                {game && <PluginLinks
                    plugins={detailTemplates.game}
                    data={game}
                    linkClassName="mb-2"
                    defaultIconSize={12}
                    iconClassName="text-gray-400 ml-1"
                />}
            </h2>
            {isCollectionView && !!collectionId && <TagsSection collectionId={collectionId} className="justify-center" />}
            {isCollectionView && childrenSlot('grow max-w-full')}
            {isLarge ? (
                <div className="flex flex-col items-center pb-2">
                    <ThumbnailBox
                        alt={images.alt}
                        url={images.thumbnailUrl}
                        imageUrl={images.imageUrl}
                        size={thumbnailSize}
                        styles={{
                            width: `min(${thumbnailSize}px, calc(100dvw - 4rem))`,
                            height: `min(${thumbnailSize}px, calc(100dvw - 4rem))`,
                        }}
                    />
                    {versionInfo}
                    {isCollectionView && (
                        <div className="flex flex-col gap-1 w-full grow">
                            {versionSelect}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex gap-2 items-stretch justify-center pb-2">
                    <div className="flex items-start">
                        <ThumbnailBox
                            alt={images.alt}
                            url={images.thumbnailUrl}
                            imageUrl={images.imageUrl}
                            size={thumbnailSize}
                        />
                    </div>
                    <div className="flex flex-col gap-1 w-full grow xs:max-w-46.25 lg:max-w-2/3">
                        {versionInfo}
                        {isCollectionView && versionSelect}
                        {view === 'version' && childrenSlot('grow max-w-60')}
                        {search && <GameSearchForm search={search} />}
                    </div>
                </div>
            )}
        </div>
    </div>;
};
