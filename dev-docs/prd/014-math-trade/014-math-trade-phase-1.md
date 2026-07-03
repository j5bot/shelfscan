# 014 Math Trade — Phase 1: Foundation

Parent spec: [014-math-trade.md](./014-math-trade.md)

## Goal

Deliver the complete no-extension path: users can load a geeklist, review the formatted entry for
each collection item, edit the body text and copy count, and add items one at a time by opening a
pre-filled BGG tab.

## Scope

### Redux slice

- Create `src/app/lib/redux/bgg/geeklist/slice.ts` with the `SliceState` shape defined in the
  parent spec
- Initial state: `activeGeekListId: null`, `geekLists: {}`, `data: {}`
- Actions:
  - `loadGeeklistStart(id)` — sets `status: 'loading'` for the given geeklist ID
  - `loadGeeklistSuccess(geekList)` — stores the loaded geeklist, sets `status: 'loaded'`,
    sets `activeGeekListId` to the loaded ID
  - `loadGeeklistError(id)` — sets `status: 'error'`
  - `setItemData(collectionId, { bodyText, copies })` — updates per-item editing state in `data`
  - `recordAdd(collectionId, geeklistItemId)` — updates the submitted mapping in the active
    geeklist's `collectionItems`; uses `UNKNOWN_GEEKLIST_ITEM_ID = -1` when no extension

### Server action

- Wire the existing `bggGetGeeklistInner` action to dispatch `loadGeeklistStart`,
  `loadGeeklistSuccess`, and `loadGeeklistError` from a new thunk or server action caller

### Image ID utility

- Add `getBggImageId(url: string): number` to `src/app/lib/utils/bggImageId.ts`
- Extracts the numeric ID from a BGG image URL using `/pic(\d+)\./`; returns `0` if no match

### Mode toggle

- Add a math trade mode button to `collection/page.tsx` alongside the existing controls
- Clicking while inactive: if no geeklist is loaded, open the URL dialog; otherwise enter mode
  directly with the active geeklist
- Clicking while active: exit mode (no dialog)
- Button label mirrors the "Select Items / Exit Select" toggle pattern

### URL dialog

- Modal dialog with a text input for the geeklist URL
- On submit: parse the geeklist ID with `/.*\/geeklist\/([0-9]+)/`
- On parse failure: show an inline error message, keep the dialog open
- On parse success: dispatch the load thunk, close the dialog, enter mode
- While loading: show a loading indicator in the UI where the geeklist title would appear
- On load failure: show an error message where the geeklist title would appear

### Per-item math trade section

- Rendered below each collection entry when mode is active
- **Collapsed state**: displays the full formatted block (body text + `%Options%...%End%`) as
  read-only text, using the item's `conditiontext` as the default body text
- **Expanded state** (on click): textarea pre-filled with the current body text, numeric input
  for copies defaulting to `1`; changes are written to `data` in the slice via `setItemData`
- The formatted block is derived from `data` if an entry exists, otherwise from the collection
  item's `conditiontext`

### Single add button

- Pink rounded button below the math trade section, styled like extension action buttons
- Always visible in phase 1 (extension path is added in phase 2)
- Constructs the BGG new-tab URL per the parent spec:
  - Uses `getBggImageId` on the item's `thumbnail` or `image` field
  - Encodes the full formatted body text as `addListitemBody`
- Opens the URL in a new browser tab
- Dispatches `recordAdd(collectionId, UNKNOWN_GEEKLIST_ITEM_ID)` after opening the tab

## Out of scope

- Extension-based adds (phase 2)
- Thumbnail selection and bulk send (phase 2)
- Switching between multiple loaded geeklists (phase 3)
