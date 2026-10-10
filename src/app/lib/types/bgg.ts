export type BggUserProfile = {
    user: string;
    lastLogin?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    placeName?: string;
    tradeRating?: number;
    marketRating?: number;
    tradeGalleryLink?: string;
    tradeQuantity?: number;
    tradeExpansionsGalleryLink?: string;
    tradeExpansionsQuantity?: number;
    tradeAccessoriesGalleryLink?: string;
    tradeAccessoriesQuantity?: number;
};

export type BggUser = {
    id?: string;
    user: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    country?: string;
    avatarUrl?: string;
} & BggUserProfile;

export const PossibleStatuses = [
    'own',
    'prevowned',
    'fortrade',
    'want',
    'wanttoplay',
    'wanttobuy',
    'wishlist',
    'preordered',
] as const;
export const PossibleStatusesLabels = [
    'Owned',
    'Prev. Owned',
    'For Trade',
    'Want',
    'Want to Play',
    'Want to Buy',
    'Wishlist',
    'Preordered',
] as const;
export type PossibleStatuses = typeof PossibleStatuses;
export type PossibleStatus = PossibleStatuses[number];
export type PossibleStatusWithAll = PossibleStatus | 'all';
export type PossibleStatusWithAllAndNone = PossibleStatusWithAll | 'none';

export type BggCollectionStatuses = Record<PossibleStatus, boolean>;

export type BggObjectsByStatus = Record<PossibleStatusWithAll, BggCollectionObjectMap>;
export type BggVersionsByStatus = Record<PossibleStatusWithAll, BggCollectionVersionMap>;

export type BggVersion = {
    id: number;
    image: string | undefined;
    languages: string[] | undefined;
    name: string | undefined;
    productCode: string | undefined;
    yearPublished: number | undefined;
    publisher: string | undefined;
};

export type BggCollectionItem = {
    objectId: number;
    subType: string;
    collectionId: number;
    name: string;
    image: string | undefined;
    thumbnail: string | undefined;
    yearPublished: number | undefined;
    versionId?: number;
    version?: BggVersion;
    statuses: BggCollectionStatuses;
    wishlistPriority?: number;
    lastModified: string;
    tradeCondition?: string;
    comment?: string;
    wishlistcomment?: string;
    rating?: number;
    averageRating?: number;
    plays?: number;
    // private info
    privatecomment?: string;
    pricepaid?: number;
    pp_currency?: string;
    currvalue?: number;
    cv_currency?: string;
    acquisitiondate?: string;
    acquiredfrom?: string;
    invdate?: string;
    invlocation?: string;
    haspartslist?: string;
    wantpartslist?: string;
};

export type BggRawObject = {
    [index: string]: string | undefined | unknown;
    ['textfield']?: Record<string, Record<string, string>>;
};

export type BggCollectionId = number;
export type BggImageId = number;
export type BggObjectId = number;
export type BggVersionId = number;

export type BggCollectionMap = Record<BggCollectionId, BggCollectionItem>;
export type BggCollectionImageMap = Record<BggImageId, BggCollectionId[]>;
export type BggCollectionObjectMap = Record<BggObjectId, BggCollectionId[]>;
export type BggCollectionVersionMap = Record<BggVersionId, BggCollectionId[]>;
export type BggTagMap = Record<string, BggCollectionId[]>;
export type BggItemTagMap = Record<BggCollectionId, string[]>;

export type BggCollection = {
    images: BggCollectionImageMap;
    items: BggCollectionMap;
    objects: BggObjectsByStatus;
    versions: BggVersionsByStatus;
    tags: BggTagMap;
    tagsByItem: BggItemTagMap;
};

export type BggSearchSubType = 'boardgame' | 'boardgameexpansion';
export type BggSearchSource = 'extension' | 'xmlapi';

/** A board game or expansion found by a BGG search, from either the extension or the XML API. */
export type BggSearchResult = {
    objectId: number;
    name: string;
    subType: BggSearchSubType;
    yearPublished?: number;
    // the extension's rep_imageid, unused for now
    imageId?: number;
    source: BggSearchSource;
};

/** A search result with the user's collection items for that game that the filters show; empty when it isn't in the collection. */
export type BggSearchEntry = BggSearchResult & {
    collectionIds: BggCollectionId[];
};

/** An item of the extension's doSearch reply (`response.data.items`); BGG sends ids as strings. */
export type BggExtensionSearchItem = {
    objectid?: string | number;
    subtype?: string;
    primaryname?: string;
    nameid?: string;
    yearpublished?: number | string | null;
    ordtitle?: string;
    rep_imageid?: number | string | null;
    objecttype?: string;
    name?: string;
    sortindex?: string;
    type?: string;
    id?: string;
    href?: string;
};

export type BggPlayer = {
    name: string;
    userid?: number;
    username: string;
    repeat?: boolean;
    selected?: boolean;
    avatar?: string;
    avatarfile?: string;
    disambiguator?: number;
};

export type BggPlayerPlay = BggPlayer & {
    score?: string;
    rating?: string;
    color?: string;
    startPosition?: number;
    win?: boolean;
};

export type BggLocation = {
    location: string;
};
export type BggLocations = {
    locations: BggLocation[];
};
