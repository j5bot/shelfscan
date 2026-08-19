export type ResolvedImage = {
    path: string;
    mediaType: string;
    data: ArrayBuffer;
    widthIn: number;
    heightIn: number;
};

export type TradeItemInteropFormat = {
    type?: 'boardgame' | 'boardgameexpansion' | 'boardgameaccessory';
    name: string;
    bggId?: number;
    year?: number;
    condition?: 'New' | 'Like New' | 'Very Good' | 'Good' | 'Acceptable' | 'Other';
    description?: string;
    options?: {
        sweeteners?: string;
        copies?: number;
        compareValue?: number;
    };
    cashValue?: number;
    versionName?: string;
    versionYear?: number;
    versionId?: number;
    versionLanguage?: string;
    versionPublisher?: string;
    imageUrl?: string;
    image?: ResolvedImage;
};

export const TradeItemInteropFormatColumnHeaders = {
    type: 'Type',
    name: 'Name',
    bggId: 'BGG ID',
    year: 'Game Year',
    condition: 'Condition',
    description: 'Description',
    options: 'Options',
    cashValue: 'Cash Value',
    versionName: 'Version Name',
    versionYear: 'Version Year',
    versionId: 'Version ID',
    versionLanguage: 'Version Language',
    versionPublisher: 'Version Publisher',
    imageUrl: 'Image URL',
    image: 'Image',
} as const;
export const TradeItemInteropFormatProperties = Object.keys(TradeItemInteropFormatColumnHeaders) as
    TradeItemInteropFormatProperties[];
export type TradeItemInteropFormatProperties = keyof TradeItemInteropFormat;

export type AtlasTradeItemPayload = {
    type: 'game';
    subtype: 'boardgame' | 'boardgameexpansion' | 'boardgameaccessory';
    game_title: string;
    bgg_id: number;
    year?: number;
    condition: string;
    condition_details: string;
    sweeteners?: string;
    accepts_cash?: boolean;
    cash_threshold?: number;
    edition_data?: {
        name: string;
        year?: number;
        language: string;
        thumbnail?: string | null;
        image?: string | null;
        publisher?: string;
    };
};