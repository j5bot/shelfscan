import { bggGetThingsXml } from '@/app/lib/actions';
import { addResponseToCache, getResponseFromCache } from '@/app/lib/database/cacheDatabase';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { SelectVersionContext } from '@/app/lib/SelectVersionProvider';
import { bggGetVersionsFromXML } from '@/app/lib/services/bgg/service';
import { type BggCollectionItem, BggVersion } from '@/app/lib/types/bgg';
import {
    collectionItemToGame,
    collectionVersionToGameUPCVersion,
    collectionVersionToVersion,
    createSlug,
    gameUPCVersionToVersion
} from '@/app/lib/utils/gameAdapters';
import { CollapsibleList, CollapsibleListProps } from '@/app/ui/CollapsibleList';
import { GameDetails, GameDetailsProps } from '@/app/ui/games/GameDetails';
import {
    renderSelectedCollectionItem,
    renderVersionItem
} from '@/app/ui/games/renderers';
import { PlaysIcon } from '@/app/ui/icons/PlaysIcon';
import { RatingIcon } from '@/app/ui/icons/RatingIcon';
import { GameUPCBggInfo, GameUPCBggVersion } from 'gameupc-hooks/types';
import Link from 'next/link';
import React, { type ReactNode, useEffect, useState, useTransition } from 'react';
import { type IconType } from 'react-icons';
import { FaCheck, FaEye, FaHeart, FaRecycle } from 'react-icons/fa6';

type CollectionHeaderIcon = {
    title: string;
    Icon: IconType;
};

const statusIconsMap = {
    own: { title: 'Own', Icon: FaCheck },
    fortrade: { title: 'For Trade', Icon: FaRecycle },
    wishlist: { title: 'Wishlist', Icon: FaHeart },
    all: { title: 'Found', Icon: FaEye },
} as const;

const computeCollectionHeader = (item: BggCollectionItem): ReactNode => {
    const icons: CollectionHeaderIcon[] = [];
    const rating = item.rating ?? item.averageRating ?? 0;
    const isAverage = !item.rating;
    const plays = item.plays ?? 0;

    const ratingIcon = rating > 0 ? <div className="scale-80 md:scale-none"><RatingIcon
        isAverage={isAverage}
        rating={rating}
        height={40}
    /></div> : null;

    const playsIcon = plays > 0 ? <div className="scale-80 md:scale-none">
        <Link href={`https://boardgamegeek.com/boardgame/${item.objectId}/${createSlug(item.name)}/mygames/plays`} target="_blank">
            <PlaysIcon
                plays={plays}
                height={40}
                backgroundColor="var(--color-blue-400)"
                strokeColor="var(--color-blue-800)"
            />
        </Link>
    </div> : null;

    Object.keys(statusIconsMap).reduce((acc: CollectionHeaderIcon[], statusKey: string) => {
        if (!item.statuses[statusKey as keyof typeof item.statuses]) {
            return acc;
        }
        acc.push(statusIconsMap[statusKey as keyof typeof statusIconsMap]);
        return acc;
    }, icons);

    return <>
        {ratingIcon} {playsIcon}
        {icons.map(({ title, Icon }) => (
            <div
                key={title}
                className="tooltip bg-gray-400 scale-80 md:scale-none flex items-center justify-center h-10 w-10 rounded-full"
                data-tooltip={title}
            >
                <Icon size={24} className="tooltip text-white" title={title} />
            </div>
        ))}
    </>;
};

type CollectionGameDetailsProps = Omit<GameDetailsProps, 'view'> & {
    item: BggCollectionItem;
    setVersion: (version: GameUPCBggVersion) => void;
};

const versionTitle = <h4 className="uppercase tracking-[0.25rem] text-center block">Select Version</h4>

/**
 * Wrapper around GameDetails for display of a game from the user's BGG
 * collection. Adapts BggCollectionItem to the common Game/Version types and
 * renders without a search form. Accepts children for future BGG-specific
 * information such as rating and play count.
 */
export const CollectionGameDetails = ({
    item,
    header,
    children,
    thumbnailSize,
    setVersion,
}: CollectionGameDetailsProps) => {
    const username = useSelector((state: RootState) => state.bgg.user?.user);
    const liveItem = useSelector(state => username ? state.bgg.collection.users[username].items[item.collectionId] : undefined);
    const bggId = liveItem?.objectId;
    const versionId = liveItem?.versionId;

    const { upcMap } = useScanHistory();
    const { gameDataMap, getGameData, isGetPending } = useGameUPCData();

    const upc = liveItem?.objectId ? upcMap.has(liveItem.objectId) ? upcMap.get(liveItem.objectId) : undefined : undefined;
    const infos: GameUPCBggInfo[] | undefined = upc ? gameDataMap[upc]?.bgg_info : undefined;
    const info = infos?.find(info => info.id === liveItem?.objectId);
    const infoVersions = info?.versions;

    const [versions, setVersions] = useState<GameUPCBggVersion[]>(infoVersions ?? []);

    const [currentVersionIndex, setCurrentVersionIndex] = useState<number | null>(null);

    const versionClickHandler = ((e: React.MouseEvent<HTMLLIElement>) => {
        const index = e.currentTarget.getAttribute('data-version-index') ?? null;

        if (index === null) {
            return;
        }

        const currentVersion = parseInt(index, 10);
        setCurrentVersionIndex(currentVersion);
        setVersion(versions[currentVersion]);
    }) as CollapsibleListProps<unknown>['onSelect'];

    const [isLoading, startGetVersions] = useTransition();

    const game = collectionItemToGame(liveItem ?? item);
    const adaptedVersion = (liveItem ?? item).version ? collectionVersionToVersion((liveItem ?? item).version!) : currentVersionIndex !== null
        ? gameUPCVersionToVersion(versions[currentVersionIndex]) : undefined;
    const computedHeader = header ?? computeCollectionHeader(liveItem ?? item);

    const renderVersionItemFn = renderVersionItem.bind(null, { currentVersionIndex } as SelectVersionContext);

    useEffect(() => {
        let active = true;

        if (!bggId || isLoading || isGetPending || versions.length > 0) {
            return;
        }

        startGetVersions(async () => {
            if (!active) {
                return;
            }

            let xml: string | undefined;
            const cacheId = `thing|${bggId}`;

            try {
                xml = await getResponseFromCache(cacheId);
            } catch (e) {
                console.error('error getting from cache', cacheId);
            }

            if (!xml) {
                xml = await bggGetThingsXml([bggId]);
                if (!xml.startsWith('<error>')) {
                    addResponseToCache({ id: cacheId, method: 'GET', response: xml }).then();
                } else {
                    return;
                }
            }

            const newVersions = bggGetVersionsFromXML(xml)
                .map(version => collectionVersionToGameUPCVersion(version as BggVersion));
            setVersions(newVersions);
        });

        return () => {
            active = false;
        };
    }, [bggId, isGetPending, isLoading, versions]);

    useEffect(() => {
        if (!versionId) {
            return;
        }
        const versionIndex = versions?.findIndex(
            version => version.version_id === versionId
        );
        if (versionIndex < 0) {
            return;
        }
        setCurrentVersionIndex(versionIndex);
    }, [versions]);

    const versionsContent = <div
        id="select-version"
        className="flex items-center gap-2"
    >
        <CollapsibleList
            title={versionTitle}
            className="text-sm flex justify-start md:text-md overflow-x-scroll overflow-y-visible min-h-27.5"
            type="version"
            items={versions}
            selectedItemIndex={currentVersionIndex}
            onClick={() => {}}
            onSelect={versionClickHandler}
            getItemKey={(version: GameUPCBggVersion) => version.version_id.toString()}
            renderItem={renderVersionItemFn}
            renderSelectedItem={renderSelectedCollectionItem}
        />
    </div>;

    return <>
        <GameDetails
            view="collection"
            game={game}
            version={adaptedVersion}
            header={computedHeader}
            versionSelect={versionsContent}
            thumbnailSize={thumbnailSize}
        >
            {children}
        </GameDetails>
    </>;
};
