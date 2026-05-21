# Collection View — Phase 2: BGG Data Refresh

## Objective

Add the ability to refresh collection data from BGG and reflect updates in the collection view.

---

## Refresh Button

- Add a **"Refresh Collection"** button to the collection view header.
- While a refresh is in progress:
  - Spin the button icon and disable it.
  - Prevent duplicate concurrent requests.
- On completion, update the displayed list without a full page reload.

---

## Data Flow

- Use the existing BGG Server Action in `src/app/lib/actions.ts` to fetch latest collection data.
- Persist the refreshed data back to **Dexie** (`db`).
- The collection view reacts to the Dexie update and re-renders.

---

## Loading State (Refresh)

- While refresh is in progress, show the spinning/disabled button state.
- The existing list remains visible during refresh (no full skeleton replacement).

---

## Error Handling

- If the BGG request fails, surface a toast or inline error message.
- The Retry button from Phase 1 should also trigger a refresh attempt.

---

## Security

- External links to BGG pages must use `rel="noopener noreferrer"`.

---

## Accessibility

- The refresh button must be keyboard-accessible.
- Announce refresh completion to screen readers via an ARIA live region.

---

## Out of Scope for Phase 2

- Filtering and sorting
- Tab views
- UI state persistence
- Editing / bulk actions

