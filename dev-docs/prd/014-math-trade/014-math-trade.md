# 014 Math Trade

## Overview

Similar to the bulk rating functionality, users want the ability to add entries to geek lists, either
in bulk with the browser extension or one at a time by opening new tabs to BGG.

This is especially true for users involved in math trades, where a specific format is required 
in the geeklist item body.

## Requirements

- Create a new 'view' in the Collection page `collection/page.tsx` which functions similarly to 
  bulk rating.  It should be enabled using a button as well and for the initial version trigger 
  math trade geeklist functionality
- When the mode is triggered, a dialog should open which requests the geeklist url and parses 
  the url to determine the geeklist id (url format /.*\/geeklist\/([0-9]+)/)
- Once the geeklist id is known, the server action to load the geeklist should be taken and the 
  geeklist stored in redux in a new slice
- The new slice should contain mappings of game ids, version ids, and collection ids to geeklist 
  items
- When adding a single geeklist item is triggered, either via the single add button or via a 
  bulk operation, the slice should be updated.  if the add happens without the browser extension,
  the mapping should be to a special 'unknown' id of `-1` (use a constant)
- When the view is enabled, a section should appear below each collection entry which displays the
  information which will be added for that collection item to the geeklist as the body text of the
  geeklist item
- The default content of the body text should be the trade condition of the collection item
- Clicking on the section should make it a form with a textarea for the body text and a numeric 
  input which sets the number of copies to enter into the math trade, defaulting to 1
- When the shelfscan browser extension is installed, collection items should be selectable by 
  clicking on the thumbnail image
- A pink, rounded button similar to extension buttons should appear below the geeklist item 
  section which triggers adding the individual item to the geeklist either automatically via the 
  extension or manually via opening a new browser tab when the extension is not present

## Details

When adding an item to a math trade, the format is:

```
{body text}

%Options%
VersionID: {version id}
Copies: {number of copies}
CollectionID: {collection item id}
%End%
```

When the version of a collection item is known, the VersionID line should be present.

When the number of copies is greater than 1, the Copies line should be present.

When there is no trade condition info / body text is available, there should be no newline above the
%Options% line

For opening a new browser tab to add a geeklist item, the url format is:

- Base url: https://boardgamegeek.com/geeklist/{geeklistId}
- Parameters:
  - addListitem: 1
  - addListitemType: things
  - addListitemId: {collection game id}
  - addListitemImageid: {collection thumbnail / image id} (defaults to 0 if not present)
  - addListitemBody: {body text and options block}

When adding a math trade geeklist item or geeklist items via the extension, the message format is:

- type: 'mathTrade'
- games: Game[]

For each Game entry, the body text should be in FormValues as key 'body'

## Decisions

### 1. Redux slice state shape

Multiple geeklists are supported (the user may participate in more than one math trade simultaneously). `activeGeekListId` tracks which one the UI is currently operating on.

`data` holds **per-item editing state** (bodyText and copies as currently entered in the UI — ephemeral, not yet submitted). `collectionItems` inside each `GeekListState` holds the **submitted mapping** (updated after a successful add).

```typescript
import { GeekList, GeekListItem } from './geeklist';

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
  // per-item editing state — bodyText/copies as entered in the UI, not yet submitted
  data: Record<CollectionID, {
    geekListItemID: GeekListItemID;
    bodyText: string;
    copies: number;
  }>;
};
```

### 2. Dialog re-entry behaviour

Clicking the math trade button while the mode is already active toggles the mode off (same pattern as the existing "Select Items / Exit Select" toggle). The URL dialog does not re-open on toggle-off.

### 3. Image ID extraction for the new-tab URL

`addListitemImageid` requires a numeric BGG image ID. Extract it from the `thumbnail` or `image` URL string using a utility function with the regex `/pic(\d+)\./`. Returns `0` if no match is found (BGG falls back to the game's default image).

### 4. Filtering in math trade mode

Show all collection items according to the current collection filters. No additional `fortrade` filter is applied — the user may want to enter items not yet marked for trade.

### 5. Collapsed preview content

The collapsed (non-editing) state shows the **full formatted block** including `%Options%...%End%`, so the user can review exactly what will be sent before clicking add.

### 6. Bulk send trigger

A sticky "Add X selected" button appears in the page header/action bar once at least one item is selected (consistent with how the existing selection mode surfaces a selected count). Clicking it sends all selected items as a single `mathTrade` message when the extension is present, or opens new tabs sequentially when it is not.

### 7. Error handling

- Invalid URL or URL with no parseable geeklist ID — inline error message shown inside the dialog
- Geeklist API fetch failure — `status: 'error'` in the slice, surfaced as an error message in the UI where the geeklist title/info would appear
- Extension add failure — a failure ack from the extension surfaces an error toast or inline indicator on the affected item

### 8. Geeklist ownership validation

No ownership validation is performed. The geeklist is expected to be owned by the user or to allow entries by non-owning users.

### 9. Role of the `geeklistLoad` extension message type

`geeklistLoad` is **not used in this feature**. The server action is the only load path for the geeklist data.

### 10. Mode exit

The same button that enables math trade mode becomes the exit button when the mode is active (consistent with the existing "Select Items / Exit Select" pattern).