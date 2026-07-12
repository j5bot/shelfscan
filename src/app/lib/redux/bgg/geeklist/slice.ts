import { GeekList, GeekListItem } from '@/app/lib/types/geeklist';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const UNKNOWN_GEEKLIST_ITEM_ID = -1;

type GeekListItemID = number;
type GameID = number;
type VersionID = number;
type CollectionID = number;

export type GeekListItemOptions = Record<string, string | number>;

type GeekListStatus = 'idle' | 'loading' | 'error' | 'loaded';

export type GeekListEntryState = {
    geekList: GeekList | null;
    status: GeekListStatus;
    // submitted mappings — updated after a successful add
    geeklistItems: Record<GeekListItemID, GeekListItem & { options?: GeekListItemOptions }>;
    games: Record<GameID, GeekListItemID[]>;
    versions: Record<VersionID, GeekListItemID[]>;
    collectionItems: Record<CollectionID, GeekListItemID[]>;
    userItems: Record<string, GeekListItemID[]>;
};

export type GeeklistItemData = {
    geekListItemID: GeekListItemID;
    bodyText: string;
    copies: number;
};

export type GeeklistSliceState = {
    activeGeekListId: number | null;
    geekLists: Record<number, GeekListEntryState>;
    // per-item editing state — bodyText/copies as entered in the UI, not yet submitted
    data: Record<CollectionID, GeeklistItemData>;
};

const SLICE_TITLE = 'BGG_GEEKLIST';

const initialState: GeeklistSliceState = {
    activeGeekListId: null,
    geekLists: {},
    data: {},
};

const makeEmptyGeekListState = (): GeekListEntryState => ({
    geekList: null,
    status: 'idle',
    geeklistItems: {},
    games: {},
    versions: {},
    collectionItems: {},
    userItems: {},
});

const getOptionsProperties = (description: string) => {
    const lines = description.split('\n');
    const optionsIndex = lines.findIndex(line => line.startsWith('%Options%'));
    const endIndex = lines.findIndex(line => line.startsWith('%End%'));

    if (optionsIndex < 0 || endIndex <= 0) {
        return {};
    }

    const optionsLines = lines.slice(optionsIndex + 1, endIndex - 1);

    return optionsLines.reduce((acc, line) => {
        const segments = line.trim().split(': ');
        const property = segments[0];
        const value = Number.isInteger(segments[1]) ? parseInt(segments[1], 10) : segments[1];
        Object.assign(acc, {[property]: value });
        return acc;
    }, {} as GeekListItemOptions);
};

export type LoadGeekListPayload = {
    geekListId: number;
    username?: string;
};

export type LoadGeekListSuccessPayload = {
    geekList: GeekList;
    username?: string;
};

export const geeklistSlice = createSlice({
    name: `${SLICE_TITLE}_SLICE`,
    initialState,
    reducers: {
        loadGeeklistStart: (state, action: PayloadAction<LoadGeekListPayload>) => {
            const { geekListId: id } = action.payload;
            if (!state.geekLists[id]) {
                state.geekLists[id] = makeEmptyGeekListState();
            }
            state.geekLists[id].status = 'loading';
        },
        loadGeeklistSuccess: (state, action: PayloadAction<LoadGeekListSuccessPayload>) => {
            const { geekList, username } = action.payload;
            const id = geekList.id;
            if (!state.geekLists[id]) {
                state.geekLists[id] = makeEmptyGeekListState();
            }
            const entry = state.geekLists[id];
            entry.geekList = geekList;
            entry.status = 'loaded';
            entry.geeklistItems = {};
            entry.games = {};
            entry.versions = {};
            for (const item of geekList.items) {
                if (item.listItemId === undefined) {
                    continue;
                }

                entry.geeklistItems[item.listItemId] = item;
                if (!entry.games[item.id]) {
                    entry.games[item.id] = [];
                }
                entry.games[item.id].push(item.listItemId);

                if (item.username) {
                    if (!entry.userItems[item.username]) {
                        entry.userItems[item.username] = [];
                    }
                    entry.userItems[item.username].push(item.listItemId);
                }

                if (!(
                    item.listDescription?.includes('%Options%') &&
                    item.listDescription?.includes('%End%')
                )) {
                    continue;
                }

                const itemProperties = getOptionsProperties(item.listDescription);
                entry.geeklistItems[item.listItemId].options = itemProperties;
                
                if (itemProperties['CollectionID']) {
                    const collectionId = itemProperties['CollectionID'] as number;
                    if (!entry.collectionItems[collectionId]) {
                        entry.collectionItems[collectionId] = [];
                    }
                    entry.collectionItems[collectionId].push(item.listItemId);
                }
                if (itemProperties['VersionID']) {
                    const versionId = itemProperties['VersionID'] as number;
                    if (!entry.versions[versionId]) {
                        entry.versions[versionId] = [];
                    }
                    entry.versions[versionId].push(item.listItemId);
                }
            }
            state.activeGeekListId = id;
        },
        loadGeeklistError: (state, action: PayloadAction<number>) => {
            const id = action.payload;
            if (!state.geekLists[id]) {
                state.geekLists[id] = makeEmptyGeekListState();
            }
            state.geekLists[id].status = 'error';
        },
        setItemData: (
            state,
            action: PayloadAction<{ collectionId: CollectionID; bodyText: string; copies: number }>,
        ) => {
            const { collectionId, bodyText, copies } = action.payload;
            const existing = state.data[collectionId];
            state.data[collectionId] = {
                geekListItemID: existing?.geekListItemID ?? UNKNOWN_GEEKLIST_ITEM_ID,
                bodyText,
                copies,
            };
        },
        setActiveGeekList: (state, action: PayloadAction<number>) => {
            state.activeGeekListId = action.payload;
        },
        recordAdd: (
            state,
            action: PayloadAction<{
                collectionId: CollectionID;
                geeklistItemId: GeekListItemID;
                geekListId: number;
                gameId: number;
                versionId?: number;
            }>,
        ) => {
            const { collectionId, geeklistItemId, geekListId, gameId, versionId } = action.payload;
            const entry = state.geekLists[geekListId];
            if (!entry) { return; }

            if (!entry.collectionItems[collectionId]) {
                entry.collectionItems[collectionId] = [];
            }
            if (!entry.collectionItems[collectionId].includes(geeklistItemId)) {
                entry.collectionItems[collectionId].push(geeklistItemId);
            }

            if (!entry.games[gameId]) {
                entry.games[gameId] = [];
            }
            if (!entry.games[gameId].includes(geeklistItemId)) {
                entry.games[gameId].push(geeklistItemId);
            }

            if (versionId !== undefined) {
                if (!entry.versions[versionId]) {
                    entry.versions[versionId] = [];
                }
                if (!entry.versions[versionId].includes(geeklistItemId)) {
                    entry.versions[versionId].push(geeklistItemId);
                }
            }

            const existing = state.data[collectionId];
            if (existing !== undefined) {
                existing.geekListItemID = geeklistItemId;
            }
        },
    },
});

export const {
    loadGeeklistStart,
    loadGeeklistSuccess,
    loadGeeklistError,
    setActiveGeekList,
    setItemData,
    recordAdd,
} = geeklistSlice.actions;

export default geeklistSlice.reducer;
