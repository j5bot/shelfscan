# 014 Math Trade — Phase 2: Extension Integration

Parent spec: [014-math-trade.md](./014-math-trade.md)
Depends on: [Phase 1](./014-math-trade-phase-1.md)

## Goal

Add the extension-powered path: single adds via the extension, thumbnail-click multi-selection,
and a bulk "Add X selected" trigger with per-item failure feedback.

## Scope

### Single add via extension

- When the ShelfScan browser extension is detected, the single add button sends a `mathTrade`
  message instead of opening a new tab:
  ```
  type: 'mathTrade'
  games: [Game]   // single-item array
  ```
  The `Game` entry's `formValues.body` contains the full formatted body text (body text +
  `%Options%...%End%` block)
- On a success ack from the extension: dispatch `recordAdd(collectionId, geeklistItemId)` with
  the real geeklist item ID returned in the ack
- On a failure ack: surface an error toast or inline error indicator on the affected item; do not
  update the slice's submitted mapping

### Thumbnail selection

- When the extension is installed, clicking a collection item's thumbnail image toggles that item's
  selected state (same visual pattern as the existing selection mode)
- Selected items are tracked in local component state (not the Redux slice)
- A selected item shows a visual indicator on its thumbnail (e.g. a checkmark overlay or
  highlighted border)

### Bulk send

- Once at least one item is selected, a sticky "Add X selected" button appears in the page
  header/action bar (consistent with how the existing selection mode surfaces a count)
- Clicking it constructs a `mathTrade` message with `games` containing one `Game` entry per
  selected item, each with `formValues.body` set to the full formatted body text for that item
- On completion: dispatch `recordAdd` for each item in the ack; surface per-item errors for any
  failures

### Slice additions

- No new slice shape changes required; `recordAdd` from phase 1 accepts the real geeklist item ID
  from the extension ack

## Out of scope

- Switching between multiple loaded geeklists (phase 3)
