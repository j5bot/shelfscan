type MergeTypes<TypesArray extends any[], Res = {}> = TypesArray extends [
                 infer Head,
                 ...infer Rem,
             ]
  ? MergeTypes<Rem, Res & Head>
  : Res;

type OnlyFirst<F, S> = F & { [Key in keyof Omit<S, keyof F>]?: never };

export type OneOf<
    TypesArray extends any[],
    Res = never,
    AllProperties = MergeTypes<TypesArray>,
> = TypesArray extends [infer Head, ...infer Rem]
    ? OneOf<Rem, Res | OnlyFirst<Head, AllProperties>, AllProperties>
    : Res;

export type Game = {
    userId: string;
    name: string;
    collectionId?: number;
    gameId: number;
    versionId: number;
    formValues?: Record<string, unknown>;
    timestamp: number;
};

export type Trade = Game;

export type Wishlist = Game;

export type Rating = Game;

export type Play = Game & {
    date: string;
    location?: string;
    players?: string;
    versionId?: number;
};

export type ShelfScanEntry = Game | Trade | Wishlist | Play;

export type DocumentMessageDetailType =
    | 'ack'
    | 'add'
    | 'clear'
    | 'getData'
    | 'info'
    | 'infoLoad'
    | 'needsAuth'
    | 'previous'
    | 'ratings'
    | 'recheckAuth'
    | 'plays'
    | 'sell'
    | 'setData'
    | 'storeAccount'
    | 'trade'
    | 'wishlist';

export type DocumentMessageDetailResponseType =
    `${DocumentMessageDetailType}-response`;

export type DocumentMessageNeedsAuthDetail = {
    needsAuth: boolean;
};

export type DocumentMessageLookupDetail = {
    userId: string;
    lookupMap: unknown;
};

export type DocumentMessageSourceDetail = {
    type: DocumentMessageDetailType;
    timestamp: number;
} & OneOf<
    [
        DocumentMessageNeedsAuthDetail,
        DocumentMessageLookupDetail,
        ShelfScanEntry,
    ]
>;

export type DocumentMessageResponseDetail = {
    type: DocumentMessageDetailResponseType;
    response: unknown;
    timestamp: number;
    sourceMessage: DocumentMessageSourceDetail;
};

export type DocumentMessageDetail =
    | DocumentMessageSourceDetail
    | DocumentMessageResponseDetail;