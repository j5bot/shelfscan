export type GeekList = {
    id: number;
    postTimestamp: number;
    editTimestamp: number;
    title: string;
    description: string;
    items: GeekListItem[];
};

export type GeekListItem = {
    id: number;
    name: string;
    body?: string;
    found?: boolean;
    disabled?: boolean;
    published?: string;
    publishedYear?: number;
    username: string;
    listDescription?: string;
    imageId?: number;
    listId?: number;
    listItemId?: number;
    collectionImage?: string;
    collectionThumb?: string;
};

export type RawGeekListItem = {
    body?: string;
    id: string;
    imageid?: number;
    imageOverridden: boolean;
    item: {
        id?: string;
        name: string;
    };
};

export type RawGeekListItems = {
    listitem: RawGeekListItem
}[];
