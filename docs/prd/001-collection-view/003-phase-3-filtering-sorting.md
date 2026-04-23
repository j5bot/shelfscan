# Collection View — Phase 3: Filtering & Sorting

## Objective

Add interactive filtering and sorting to the collection list, with UI state persisted across
sessions.

---

## Filtering

- Add a **text input** above the list to filter games by name.
- Filter is applied live as the user types (no submit required).
- Design the filter component extensibly so additional filter fields (e.g., publisher, year) can
  be added in a future phase without restructuring.

---

## Sorting

- Support sorting by: **Name**, **Date Added**, **Date Last Scanned**, **Year Published**.
- Sorting is triggered by clicking column headers.
- Each click toggles between ascending and descending order.
- An indicator (arrow icon) shows the active sort field and direction.
- Design extensibly for additional sort fields in the future.

---

## Sticky Controls

- Filter input and sorting controls must remain accessible (sticky) as the user scrolls through
  a long list on both mobile and desktop.

---

## State Persistence

- Persist the following UI state in **`localStorage`** so it survives page reloads:
  - Active filter text
  - Active sort field
  - Sort direction (ascending / descending)
- On page load, read persisted state and apply it before the first render.

---

## Accessibility

- Filter input: labelled (`<label>` or `aria-label`), keyboard-accessible.
- Sorting column headers: use `aria-sort` attribute to communicate current sort state to screen
  readers.
- Focus management: after filtering or sorting, focus should not be lost unexpectedly.

---

## Mobile & Responsiveness

- Controls are touch-friendly and readable on small screens.
- Sticky header behaviour works correctly on iOS Safari (use `-webkit-sticky` where needed).

---

## Out of Scope for Phase 3

- Tab views
- Editing / bulk actions

