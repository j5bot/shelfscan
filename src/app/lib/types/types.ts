export type BggInfo = {
    id: number;
    name: string;
    thumbnail_url: string;
    page_url: string;
    image_url: string;
    versions: BggVersion[];
};

export type BggVersion = {
    name: string;
    version_id: number;
    published: number;
    thumbnail_url: string;
    image_url: string;
    language: string;
};
