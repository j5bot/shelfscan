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
