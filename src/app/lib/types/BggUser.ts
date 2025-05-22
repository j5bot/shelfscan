export type BggUser = {
    id?: string;
    user: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    country?: string;
} & BggUserProfile;

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
