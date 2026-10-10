import {
    type BggCollectionItem,
    type BggSearchCollectionItem,
    type BggSearchResult,
    type BggVersion,
} from '@/app/lib/types/bgg';
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

export const gameUPCInfoToCollectionItem =
    (info: GameUPCBggInfo): Partial<BggCollectionItem> => ({
        objectId: info.id,
        name: info.name,
        thumbnail: info.thumbnail_url,
        image: info.image_url,
    });

export const gameUPCVersionToBggVersion = (version: GameUPCBggVersion): BggVersion => ({
    id: version.version_id,
    name: version.name,
    image: version.image_url,
    languages: version.language ? [version.language] : undefined,
    productCode: undefined,
    yearPublished: version.published,
    publisher: undefined,
});

export const gameUPCInfoAndVersionToCollectionItem = (
    info: GameUPCBggInfo,
    version: GameUPCBggVersion,
): Partial<BggCollectionItem> => ({
    ...gameUPCInfoToCollectionItem(info),
    versionId: version.version_id,
    version: gameUPCVersionToBggVersion(version),
});

export const collectionItemToGame = (item: BggCollectionItem): Game => ({
    id: item.objectId,
    collectionId: item.collectionId,
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

export const collectionVersionToGameUPCVersion = (version: BggVersion): GameUPCBggVersion => ({
    version_id: version.id,
    name: version.name ?? '',
    published: version.yearPublished ?? 0,
    confidence: -1,
    thumbnail_url: version.image ?? '',
    image_url: version.image ?? '',
    update_url: '',
    language: version.languages?.join(', ') ?? '',
});

export const collectionItemToGameUPCInfo = (item: BggCollectionItem): GameUPCBggInfo & {
    collectionId?: number;
} => ({
    id: item.objectId,
    collectionId: item.collectionId,
    name: item.name,
    confidence: -1,
    thumbnail_url: item.thumbnail ?? '',
    page_url: `https://boardgamegeek.com/boardgame/${item.objectId}`,
    image_url: item.image ?? '',
    data_url: '',
    update_url: '',
    version_status: 'none',
    versions: item.version ? [collectionVersionToGameUPCVersion(item.version)] : [],
});


/**
 * A BGG search result as a collection item, for the cards and the item modal. It isn't in the collection: no
 * collection id (0, which every collection-only check treats as absent), no statuses, no image, rating or plays.
 * Its image id (extension results only) is kept so the modal can show the image cached for the search.
 */
export const bggSearchResultToCollectionItem = (result: BggSearchResult): BggSearchCollectionItem => ({
    objectId: result.objectId,
    subType: result.subType,
    collectionId: 0,
    name: result.name,
    image: undefined,
    thumbnail: undefined,
    yearPublished: result.yearPublished,
    statuses: {
        own: false,
        prevowned: false,
        fortrade: false,
        want: false,
        wanttoplay: false,
        wanttobuy: false,
        wishlist: false,
        preordered: false,
    },
    lastModified: '',
    searchImageId: result.imageId,
});
