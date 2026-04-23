# Collection View — Implementation Requirements

- Route: `/collection` (accessible from main menu)
- Purpose: Display all games in the user’s collection, including UPCs and matched BGG data.
- Display: Use `GameListContainer` and `ListGame` components for consistency with ScanList.
- Data Source: User’s collection data from IndexedDB (Dexie). Use `react-virtuoso` for virtualization.
- Performance: Must efficiently handle up to 10,000 games.
- UI: Match overall ShelfScan style (Tailwind, DaisyUI).
- Accessibility: Fully accessible (semantic HTML, keyboard navigation, screen reader support, 
  focus management).
  - Mobile / Responsive: Must work well on mobile and desktop.

## Accessibility (a11y)
   - Keyboard Navigation: Specify that all interactive elements (tabs, sorting headers, refresh 
   button, game links) must be keyboard accessible.
   - Screen Reader Support: Ensure ARIA roles/labels for tabs, list items, and actions.
   - Focus Management: When switching tabs or updating the list, focus should be managed for 
     usability.

## Mobile & Responsiveness
   - Mobile Layout: the collection view is fully responsive, with touch-friendly controls and 
   readable tables/lists on small screens.
   - Sticky Headers/Actions: filters and sorting controls should remain accessible on mobile as 
     users scroll through their collection.

## Error & Empty States

- No Data: show the message "Your collection is empty. Start scanning games to see them here!" 
  with a call-to-action button to the scanning page (as on the SelectVersion component).
- Error State: if there’s an error fetching collection data, show "Error loading collection. Please try refreshing." with a retry button.

## Loading State

- Spin the "Refresh Collection" button and disable it while fetching data from BGG.
- Show a skeleton loader in the game list area while loading collection data.

## State Persistence

- Persist the following UI state in local storage so it’s retained across sessions: selected tab, filter text, sorting options (field and direction).
- On page load, read persisted state and apply it to the collection view.

## Security & Privacy

- External Links: When opening BGG pages, use `rel="noopener noreferrer"` on links for security.

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

The maximum collection size that the collection view will support in the initial implementation 
is 10,000 games.  Average collections are expected to be around 300-500 games.