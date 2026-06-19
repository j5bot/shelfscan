/**
 * Common types for game and version data, usable across both the GameUPC search
 * context and the BGG collection context.
 */

export type Game = {
    id: number;
    name: string;
    pageUrl: string;
    thumbnailUrl?: string;
    imageUrl?: string;
    statusText?: string;
};

export type Version = {
    versionId: number;
    name: string;
    pageUrl: string;
    thumbnailUrl?: string;
    imageUrl?: string;
    published?: number;
    language?: string;
    statusText?: string;
};

