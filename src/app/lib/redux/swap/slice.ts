import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type CollectionID = number;

export type SwapItemData = {
    swapItemId?: number;
    collectionId?: number;
    bodyText: string;
    compareValue?: number;
    imageKey?: string;
    sellFor?: number;
};

export type SwapSliceState = {
    activeSwapId: number | null;
    data: Record<CollectionID, SwapItemData>;
};

const SLICE_TITLE = 'SWAP';

const initialState: SwapSliceState = {
    activeSwapId: null,
    data: {},
};

// const getOptionsProperties = (description: string) => {
//     const lines = description.split(/(\r|)&#10;/);
//     const optionsIndex = lines.findIndex(line => line.startsWith('%Options%'));
//     const endIndex = lines.findIndex(line => line.startsWith('%End%'));
//
//     if (optionsIndex < 0 || endIndex <= 0) {
//         return {};
//     }
//
//     const optionsLines = lines.slice(optionsIndex + 1, endIndex);
//
//     return optionsLines.reduce((acc, line) => {
//         const segments = line.trim().split(/:\s*/ig);
//         if (segments.length !== 2) {
//             return acc;
//         }
//         const property = segments[0];
//         const value = !isNaN(parseInt(segments[1], 10)) ? parseInt(segments[1], 10) : segments[1];
//
//         Object.assign(acc, {[property.toLowerCase()]: value });
//
//         return acc;
//     }, {} as GeekListItemOptions);
// };

export const swapSlice = createSlice({
    name: `${SLICE_TITLE}_SLICE`,
    initialState,
    reducers: {
        setItemData: (
            state,
            action: PayloadAction<SwapItemData>,
        ) => {
            const { collectionId, bodyText, compareValue, imageKey, sellFor, swapItemId } = action.payload;
            state.data[collectionId?] = {
                imageKey,
                swapItemId,
                bodyText,
                compareValue,
                sellFor,
            };
        },
        setActiveSwap: (state, action: PayloadAction<number>) => {
            state.activeSwapId = action.payload;
        },
    },
});

export const {
    setActiveSwap,
    setItemData,
} = swapSlice.actions;

export default swapSlice.reducer;
