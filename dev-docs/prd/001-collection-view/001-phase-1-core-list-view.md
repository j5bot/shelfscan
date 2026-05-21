# Collection View — Phase 1: Core List View

## Objective

Implement the `/collection` route with a basic, read-only list of all games in the user's
collection, matching the existing ShelfScan UI patterns.

---

## Route

`/collection` — accessible from the main navigation menu.

---

## Data Source

- Read collection data from **IndexedDB via Dexie** (existing `db` database).
- No BGG API calls in this phase; display whatever is already stored locally.

---

## Display

- Use existing `GameListContainer` and `ListGame` components for consistency with ScanList.
- Show only fields currently present in `ListGame`.
- Use **`react-virtuoso`** for list virtualization to support up to 10,000 games efficiently.

---

## Empty State

- If the collection is empty, show:
  > "Your collection is empty. Start scanning games to see them here!"
- Include a call-to-action button that navigates to the scanning page (mirror the pattern used
  in `SelectVersion`).

---

## Error State

- If collection data cannot be loaded, show:
  > "Error loading collection. Please try refreshing."
- Include a **Retry** button that re-attempts the data fetch.

---

## Loading State

- Show a **skeleton loader** in the game list area while collection data is being read.

---

## UI & Styling

- Match overall ShelfScan style: **Tailwind CSS v4 + DaisyUI v5**.
- Fully responsive — must work on mobile and desktop.
- Touch-friendly controls on small screens.

---

## Accessibility

- Semantic HTML throughout.
- All interactive elements keyboard-accessible.
- Appropriate ARIA roles and labels on list items.

---

## Out of Scope for Phase 1

- BGG data refresh
- Filtering and sorting
- Tab views
- State persistence
- Editing / actions beyond navigation

