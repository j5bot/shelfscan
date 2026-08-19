# 014 Math Trade

## Overview

Similar to the bulk rating functionality, users want the ability to add entries to geek lists, either
in bulk with the browser extension or one at a time by opening new tabs to BGG.

This is especially true for users involved in math trades, where a specific format is required
in the geeklist item body.

Implementation is split into three phases:

- [Phase 1](./014-math-trade-phase-1.md) — Foundation: mode toggle, geeklist load, per-item
  preview/form, single add via new browser tab
- [Phase 2](./014-math-trade-phase-2.md) — Extension integration: extension-based adds, thumbnail
  selection, bulk send
- [Phase 3](./014-math-trade-phase-3.md) — Multi-geeklist UI: switch between loaded geeklists

## Requirements

### Mode

- A math trade mode button in the collection page enables and disables the mode, following the
  same toggle pattern as the existing "Select Items / Exit Select" button
- When the mode is triggered and no geeklist is active, a dialog opens requesting a geeklist URL
- The URL is parsed to determine the geeklist ID (regex: `/.*\/geeklist\/([0-9]+)/`)
- If the URL is invalid or contains no parseable geeklist ID, an inline error is shown in the dialog
- Once the geeklist ID is known, the server action loads the geeklist and stores it in the Redux
  slice; if the fetch fails, an error state is shown where the geeklist title would appear
- The slice supports multiple simultaneously loaded geeklists; `activeGeekListId` tracks which one
  the UI is currently operating on
- Clicking the mode button while the mode is active toggles the mode off; the URL dialog does not
  re-open on toggle-off

### Collection Item Display

- When the mode is active, a section appears below each collection entry showing the full formatted
  block (body text + `%Options%...%End%`) that will be submitted — this lets the user review
  exactly what will be sent before clicking add
- The default body text is the trade condition (`conditiontext`) of the collection item
- Clicking the section expands it into a form with a textarea for the body text and a numeric input
  for the number of copies, defaulting to 1
- All collection items are shown according to the current collection filters; no additional
  `fortrade` filter is applied

### Adding Items

- A pink rounded button (consistent with extension button styling) appears below the math trade
  section for each item
- When the extension is not present, clicking the button opens a new browser tab to BGG with
  pre-filled parameters (see Details)
- When the extension is present, clicking the button sends a `mathTrade` message to the extension
- After a successful add, the Redux slice's submitted mapping (`collectionItems`) is updated with
  the new geeklist item ID
- When an add occurs without the extension the mapping uses the constant `UNKNOWN_GEEKLIST_ITEM_ID`
  with a value of `-1`

### Bulk Operations (extension only)

- When the extension is installed, collection items are selectable by clicking the thumbnail image
- Once at least one item is selected, a sticky "Add X selected" button appears in the page
  header/action bar, consistent with how the existing selection mode surfaces a selected count
- Clicking it sends all selected items as a single `mathTrade` message to the extension
- A failure ack from the extension surfaces an error toast or inline indicator on the affected item

## Details

### Body text format

When adding an item to a math trade, the format is:

```
{body text}

%Options%
VersionID: {version id}
Copies: {number of copies}
CollectionID: {collection item id}
%End%
```

- The `VersionID` line is present only when the version of the collection item is known
- The `Copies` line is present only when the number of copies is greater than 1
- When there is no body text (no trade condition), the blank line above `%Options%` is omitted

### New browser tab URL

- Base URL: `https://boardgamegeek.com/geeklist/{geeklistId}`
- Parameters:
  - `addListitem`: `1`
  - `addListitemType`: `things`
  - `addListitemId`: `{collection game id}`
  - `addListitemImageid`: `{BGG image ID}` — extracted from the `thumbnail` or `image` URL using
    the regex `/pic(\d+)\./`; defaults to `0` if no match is found
  - `addListitemBody`: `{body text and options block}`

### Extension message format

```
type: 'mathTrade'
games: Game[]
```

For each `Game` entry, the full formatted body text (including the `%Options%` block) is in
`formValues` as key `'body'`.

## Architecture

### Redux slice

The geeklist slice is located at `src/app/lib/redux/bgg/geeklist/slice.ts`.

`data` holds per-item **editing state** (description and copies as entered in the UI, not yet
submitted). `collectionItems` inside each `GeekListState` holds the **submitted mapping**, updated
after a successful add.

```typescript
import { GeekList, GeekListItem } from '@/app/lib/types/geeklist';

type GeekListItemID = number;
type GameID = number;
type VersionID = number;
type CollectionID = number;

type GeekListState = {
    geekList: GeekList | null;
    status: 'idle' | 'loading' | 'error' | 'loaded';
    // submitted mappings — updated after a successful add
    geeklistItems: Record<GeekListItemID, GeekListItem>;
    games: Record<GameID, GeekListItemID[]>;
    versions: Record<VersionID, GeekListItemID[]>;
    collectionItems: Record<CollectionID, GeekListItemID[]>;
};

type SliceState = {
    activeGeekListId: number | null;
    geekLists: Record<number, GeekListState>;
    // per-item editing state — description/copies as entered in the UI, not yet submitted
    data: Record<CollectionID, {
        geekListItemID: GeekListItemID;
        description: string;
        copies: number;
    }>;
};
```

### Image ID utility

Add a utility function (e.g. `getBggImageId`) in `src/app/lib/utils/` that accepts a BGG image URL
string and returns the numeric image ID parsed with `/pic(\d+)\./`, or `0` if no match is found.
