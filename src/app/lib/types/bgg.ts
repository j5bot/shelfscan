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
    'preordered'
] as const;
export type PossibleStatuses = typeof PossibleStatuses;
export type PossibleStatus = PossibleStatuses[number];
export type PossibleStatusWithAll = PossibleStatus | 'all';

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
};

export type BggCollectionItem = {
    objectId: number;
    subType: string;
    collectionId: number;
    name: string;
    yearPublished: number | undefined;
    versionId?: number;
    version?: BggVersion;
    statuses: BggCollectionStatuses;
    rating?: number;
};

export type BggCollectionId = number;
export type BggImageId = number;
export type BggObjectId = number;
export type BggVersionId = number;

export type BggCollectionMap = Record<BggCollectionId, BggCollectionItem>;
export type BggCollectionImageMap = Record<BggImageId, BggCollectionId[]>;
export type BggCollectionObjectMap = Record<BggObjectId, BggCollectionId[]>;
export type BggCollectionVersionMap = Record<BggVersionId, BggCollectionId[]>;

export type BggCollection = {
    images: BggCollectionImageMap;
    items: BggCollectionMap;
    objects: BggObjectsByStatus;
    versions: BggVersionsByStatus;
};

export type BGGPlayer = {
    name: string;
    userid: number;
    username: string;
    repeat: boolean;
    avatar?: string;
    avatarfile?: string;
};
