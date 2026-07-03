import { GeekList, GeekListItem } from '@/app/lib/types/geeklist';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const UNKNOWN_GEEKLIST_ITEM_ID = -1;

type GeekListItemID = number;
type GameID = number;
type VersionID = number;
type CollectionID = number;

type GeekListStatus = 'idle' | 'loading' | 'error' | 'loaded';

export type GeekListEntryState = {
    geekList: GeekList | null;
    status: GeekListStatus;
    // submitted mappings — updated after a successful add
    geeklistItems: Record<GeekListItemID, GeekListItem>;
    games: Record<GameID, GeekListItemID[]>;
    versions: Record<VersionID, GeekListItemID[]>;
    collectionItems: Record<CollectionID, GeekListItemID[]>;
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
});

export const geeklistSlice = createSlice({
    name: `${SLICE_TITLE}_SLICE`,
    initialState,
    reducers: {
        loadGeeklistStart: (state, action: PayloadAction<number>) => {
            const id = action.payload;
            if (!state.geekLists[id]) {
                state.geekLists[id] = makeEmptyGeekListState();
            }
            state.geekLists[id].status = 'loading';
        },
        loadGeeklistSuccess: (state, action: PayloadAction<GeekList>) => {
            const geekList = action.payload;
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
                if (item.listItemId !== undefined) {
                    entry.geeklistItems[item.listItemId] = item;
                }
                if (item.listItemId !== undefined) {
                    if (!entry.games[item.id]) {
                        entry.games[item.id] = [];
                    }
                    entry.games[item.id].push(item.listItemId);
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
            state.data[collectionId] = {
                geekListItemID: geeklistItemId,
                bodyText: existing?.bodyText ?? '',
                copies: existing?.copies ?? 1,
            };
        },
    },
});

export const {
    loadGeeklistStart,
    loadGeeklistSuccess,
    loadGeeklistError,
    setItemData,
    recordAdd,
} = geeklistSlice.actions;

export default geeklistSlice.reducer;
