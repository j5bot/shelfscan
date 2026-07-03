import { GameUPCBggInfo } from 'gameupc-hooks/types';

export type Game = {
    userId: string;
    name: string;
    collectionId?: number;
    gameId: number;
    versionId: number;
    formValues?: Record<string, unknown>;
    timestamp: number;
    info?: GameUPCBggInfo;
};

export type Games = {
    games: Game[];
};

export type Trade = Game;

export type Wishlist = Game;

export type Rating = Game;

export type Play = Game & {
    date: string;
    playdate: string;
    versionId?: number;
};

export type DocumentMessageDetailType =
    | 'ack'
    | 'add'
    | 'clear'
    | 'geeklistLoad'
    | 'getData'
    | 'getLocations'
    | 'getPlayers'
    | 'info'
    | 'infoLoad'
    | 'mathTrade'
    | 'needsAuth'
    | 'previous'
    | 'ratings'
    | 'recheckAuth'
    | 'plays'
    | 'searchPlayer'
    | 'sell'
    | 'setData'
    | 'storeAccount'
    | 'trade'
    | 'wishlist';

export type BaseDocumentMessageDetail = {
    type: DocumentMessageDetailType;
    timestamp: number;
};

export type ShelfScanEntry = BaseDocumentMessageDetail & (Game | Trade | Wishlist | Play | Games);

export type DocumentMessageDetailResponseType =
    `${DocumentMessageDetailType}-response`;

export type DocumentMessageNeedsAuthDetail = BaseDocumentMessageDetail & {
    needsAuth: boolean;
};

export type DocumentMessageLookupDetail = BaseDocumentMessageDetail & {
    userId: string;
    lookupMap: unknown;
};

export type DocumentMessageSearchPlayerDetail = BaseDocumentMessageDetail &{
    query: string;
};

export type DocumentMessageSourceDetail =
    | DocumentMessageNeedsAuthDetail
    | DocumentMessageLookupDetail
    | DocumentMessageSearchPlayerDetail
    | ShelfScanEntry;

export type DocumentMessageResponseDetail = {
    type: DocumentMessageDetailResponseType;
    response: unknown;
    timestamp: number;
    sourceMessage: DocumentMessageSourceDetail;
};

export type DocumentMessageDetail =
    | DocumentMessageSourceDetail
    | DocumentMessageResponseDetail;