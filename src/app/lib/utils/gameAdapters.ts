import { type BggCollectionItem, type BggVersion } from '@/app/lib/types/bgg';
import { type Game, type Version } from '@/app/lib/types/game';
import { type GeekMarketProduct } from '@/app/lib/types/market';
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

export const collectionItemToGameUPCInfo = (item: BggCollectionItem): GameUPCBggInfo => ({
    id: item.objectId,
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

export const geekMarketProductToGame = (product: GeekMarketProduct): Game => ({
    id: Number(product.objectid),
    name: product.objectlink?.name ?? product.version.name,
    pageUrl: `https://boardgamegeek.com${product.objectlink?.href ?? product.producthref}`,
    thumbnailUrl: product.version.imageSets?.square100?.src,
    imageUrl: product.version.imageSets?.mediacard?.src,
});

export const geekMarketProductToVersion = (product: GeekMarketProduct): Version => {
    const yearDescriptor = product.version.descriptors.find(d => d.name === 'yearpublished');
    const published = yearDescriptor ? Number(yearDescriptor.displayValue) : undefined;
    return {
        versionId: Number(product.version.id),
        name: product.version.name,
        pageUrl: `https://boardgamegeek.com${product.version.href ?? ''}`,
        thumbnailUrl: product.version.imageSets?.square100?.src,
        imageUrl: product.version.imageSets?.mediacard?.src,
        published: Number.isNaN(published) ? undefined : published,
    };
};

