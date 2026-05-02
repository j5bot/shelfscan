import { type BggCollectionItem, type BggVersion } from '@/app/lib/types/bgg';
import { type Game, type Version } from '@/app/lib/types/game';
import { type GameUPCBggInfo, type GameUPCBggVersion } from 'gameupc-hooks/types';

export const createSlug = (name: string): string => name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const gameUPCInfoToGame = (info: GameUPCBggInfo): Game => ({
    id: info.id,
    name: info.name,
    pageUrl: `${info.page_url}/${createSlug(info.name)}`,
    thumbnailUrl: info.thumbnail_url,
    imageUrl: info.image_url,
});

export const gameUPCVersionToVersion = (version: GameUPCBggVersion): Version => ({
    versionId: version.version_id,
    name: version.name,
    pageUrl: `https://boardgamegeek.com/boardgameversion/${version.version_id}/${createSlug(version.name)}`,
    thumbnailUrl: version.thumbnail_url,
    imageUrl: version.image_url,
    published: version.published,
    language: version.language,
});

export const collectionItemToGame = (item: BggCollectionItem): Game => ({
    id: item.objectId,
    name: item.name,
    pageUrl: `https://boardgamegeek.com/boardgame/${item.objectId}/${createSlug(item.name)}`,
    thumbnailUrl: item.thumbnail,
    imageUrl: item.image,
});

export const collectionVersionToVersion = (version: BggVersion): Version => ({
    versionId: version.id,
    name: version.name ?? '',
    pageUrl: `https://boardgamegeek.com/boardgameversion/${version.id}/${createSlug(version.name ?? '')}`,
    thumbnailUrl: version.image,
    imageUrl: version.image,
    published: version.yearPublished,
    language: version.languages?.join(', '),
});

