# Collection View — Phase 4: Tab Views

## Objective

Introduce a tabbed interface to separate "All games" from "Scanned but not in collection", giving
users a quick way to identify gaps between their scan history and BGG collection.

---

## Tabs

| Tab | Content |
|-----|---------|
| **All Games** | Every game currently in the user's BGG collection (existing Phase 1–3 list). |
| **Not in Collection** | Games present in local scan history that are **not** found in the BGG collection. |

---

## Tab Behaviour

- Tab switcher rendered above the list (below the page header / refresh button).
- Selecting a tab updates the displayed list immediately.
- Filtering and sorting (Phase 3) apply independently within the active tab.
- Each tab retains its own filter text, sort field, and sort direction in persisted state.

---

## State Persistence

- Extend the `localStorage` persistence from Phase 3 to include the **active tab**.
- On page load, restore the last-active tab.

---

## "Not in Collection" Logic

- Compare scan history entries (from Dexie) against the user's stored BGG collection.
- Match on BGG game ID where available; fall back to UPC / title matching.
- If the BGG collection has not been refreshed yet, show a prompt to refresh first.

---

## Empty States per Tab

- **All Games** (empty): reuse the Phase 1 empty state message and CTA.
- **Not in Collection** (empty): show "All scanned games are already in your collection. 🎉"

---

## Accessibility

- Tab list uses `role="tablist"`, each tab `role="tab"`, panel `role="tabpanel"`.
- Active tab indicated with `aria-selected="true"`.
- Keyboard navigation: Arrow keys move between tabs; Enter/Space activates.
- When switching tabs, move focus to the tab panel or first interactive element within it.

---

## Out of Scope for Phase 4

- Editing / bulk actions
- Additional tabs beyond the two defined above

