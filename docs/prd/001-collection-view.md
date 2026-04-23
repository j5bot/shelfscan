# Collection View — Implementation Requirements

- Route: `/collection` (accessible from main menu)
- Purpose: Display all games in the user’s collection, including UPCs and matched BGG data.
- Display: Use `GameListContainer` and `ListGame` components for consistency with ScanList.
- Data Source: User’s collection data from IndexedDB (Dexie). Use `react-virtuoso` for virtualization.
- Performance: Must efficiently handle up to 10,000 games.
- UI: Match overall ShelfScan style (Tailwind, DaisyUI).

## Tabs

- Tab 1: All games in collection.
- Tab 2: Scanned games not in collection (compare scan history to collection data).

## Data Refresh

- Users refresh collection data from BGG using the existing "Refresh Collection" button.
- Collection view must update after refresh completes.

## Fields Displayed

- Show only fields present in `ListGame` for now. Design extensibly for future fields.

## Filtering

- Initial: Filter by game name only (text input, live filter as user types).
- Future: Structure for additional filters (e.g., publisher, year).

## Sorting

- Sort by: Name, date added, date last scanned, year published.
- Sorting is triggered by clicking column headers; toggles ascending/descending.
- Structure for future sort options.

## Editing

- No editing actions in v1 (read-only view).
- Design extensibly for future editing (e.g., remove, edit notes).

## Actions

- Click game: Open BGG page in new tab.
- Button: "Refresh Collection" — fetch latest data from BGG and update view.
- Structure for future actions (e.g., add to collection, bulk actions).

## Collection Size

- Must support up to 10,000 games efficiently.
- Average expected: 300–500 games.
