export type GameUPCVersionStatus = 'verified' | 'none' | 'choose_from_versions' | 'choose_from_bgg_info_or_search' | 'choose_from_versions_or_search';
export const GameUPCVersionStatus: Record<GameUPCVersionStatus, GameUPCVersionStatus> = {
    verified: 'verified',
    none: 'none',
    choose_from_versions: 'choose_from_versions',
    choose_from_bgg_info_or_search: 'choose_from_bgg_info_or_search',
    choose_from_versions_or_search: 'choose_from_versions_or_search',
};

export const GameUPCVersionStatusText: Record<GameUPCVersionStatus, string> = {
    verified: 'Verified',
    none: 'Not found',
    choose_from_versions: 'Choose from the available versions',
    choose_from_bgg_info_or_search: 'Choose a game, or search for something not in the list',
    choose_from_versions_or_search: `Choose from the available versions, or search for something
 not in the list`
};

export type GameUPCData = {
    status: 'ok' | 'error';
    upc: string;
    name: string;
    searched_for: string;
    bgg_info_status: GameUPCVersionStatus;
    bgg_info: GameUPCBggInfo[];
};

export type GameUPCBggInfo = {
    id: number;
    name: string;
    confidence: number;
    thumbnail_url: string;
    page_url: string;
    image_url: string;
    data_url: string;
    update_url: string;
    version_status: GameUPCVersionStatus;
    versions: GameUPCBggVersion[];
};

export type GameUPCBggVersion = {
    name: string;
    version_id: number;
    published: number;
    confidence: number;
    thumbnail_url: string;
    image_url: string;
    update_url: string;
    language: string;
};
