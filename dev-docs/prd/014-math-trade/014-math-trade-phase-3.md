# 014 Math Trade — Phase 3: Multi-Geeklist UI

Parent spec: [014-math-trade.md](./014-math-trade.md)
Depends on: [Phase 1](./014-math-trade-phase-1.md), [Phase 2](./014-math-trade-phase-2.md)

## Goal

Expose the multi-geeklist capability already supported by the Redux slice: let the user load
additional geeklists and switch between them without leaving math trade mode.

## Scope

### Loading an additional geeklist

- While math trade mode is active, a secondary "Load another geeklist" or "+" control is available
  (placement TBD — likely near the active geeklist title in the header)
- Clicking it opens the same URL dialog used in phase 1
- The newly loaded geeklist is added to `geekLists` in the slice and becomes the active geeklist
  (`activeGeekListId` is updated)

### Switching the active geeklist

- When more than one geeklist is loaded, a switcher control appears near the active geeklist title
  (e.g. a dropdown or tab set) listing all loaded geeklists by title
- Selecting a geeklist dispatches a new `setActiveGeekList(id)` action, updating
  `activeGeekListId`
- Per-item editing state (`data`) is shared across geeklists; submitted mappings
  (`collectionItems`) are per-geeklist inside each `GeekListState`

### Slice additions

- `setActiveGeekList(id: number)` action — sets `activeGeekListId`

## Notes

The slice shape already supports multiple geeklists from phase 1. Phase 3 is purely UI work to
expose switching.
