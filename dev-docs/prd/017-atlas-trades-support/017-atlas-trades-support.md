# PRD 017 Atlas Trades Support

## Overview

In addition to the Swaptagon trade platform, another platform exists called
Atlas Realms (or Atlas for short).

ShelfScan should eventually support exporting to and importing from both
platforms through one shared file format instead of a platform-specific one.
That shared format already exists as `TradeItemInteropFormat` in
`src/app/lib/types/trade.ts`.

**Phase 1 scope is narrower than the title implies**: this phase does not add
an Atlas-facing import flow. It only replaces the Swaptagon-specific ODS
layout produced by `swapExport.ts` / consumed by `importSwap.user.js` with one
built from `TradeItemInteropFormat`. The import target stays `swaptagon.com`.
Atlas Realms gets nothing user-visible yet — Phase 1 exists so the file that
comes out of ShelfScan is already the right shape for an Atlas importer to
consume later, without a second migration.

### Non-goals (deferred to a later phase)

- An Atlas-side import flow (userscript, extension, or otherwise) built on
  `AtlasTradeItemPayload`.
- Populating `condition` from `BggCollectionItem.tradeCondition`. Phase 1
  leaves `condition` unset; existing behavior (folding `tradeCondition` into
  the free-text `description`) is unchanged. Since empty columns are omitted
  (see below), the `Condition` column will typically not appear at all in
  Phase 1 output.
- Any UI/copy changes. The scan/collection pages still say "Swaptagon" —
  only the file's internal format changes.

## Data mapping

Per item, resolve `TradeItemInteropFormat` fields in this priority order:
1. `SwapItemData` — source of truth where a field exists directly on it.
2. `SwapItemData.collectionItem` (`BggCollectionItem`) — used for everything
   `SwapItemData` doesn't carry itself (type, bggId, year, version info).

| `TradeItemInteropFormat` field | Source |
|---|---|
| `name` | `SwapItemData.name` |
| `description` | `SwapItemData.description` |
| `cashValue` | `SwapItemData.cashValue` |
| `options.compareValue` | `SwapItemData.compareValue` |
| `type` | `collectionItem.subType` |
| `bggId` | `collectionItem.objectId` |
| `year` | `collectionItem.yearPublished` |
| `versionId` | `collectionItem.versionId` |
| `versionName` | `collectionItem.version.name` |
| `versionYear` | `collectionItem.version.yearPublished` |
| `versionLanguage` | `collectionItem.version.languages` (joined) |
| `versionPublisher` | `collectionItem.version.publisher` |
| `imageUrl` | `collectionItem.version?.image ?? collectionItem.image ?? collectionItem.thumbnail` |
| `image` | resolved embedded image (unchanged from current cache-lookup behavior, keyed by `SwapItemData.imageKey`) |
| `condition` | *(not populated in Phase 1 — see Non-goals)* |
| `options.sweeteners`, `options.copies` | *(no current source — leave unset)* |

### Batch scan wiring (`SwapAddButton.tsx`)

Today, batch-scan swap items are built without a `collectionItem`, so
everything in the second half of the table above would be blank for batch
scans. Populate `SwapItemData.collectionItem` there using the existing
adapters in `gameAdapters.ts`:
- `gameUPCInfoAndVersionToCollectionItem(info, version)` when a version is
  selected.
- `gameUPCInfoToCollectionItem(info)` otherwise.

## `TradeItemInteropFormatColumnHeaders` fix

`versionId` is a field on `TradeItemInteropFormat` but has no entry in
`TradeItemInteropFormatColumnHeaders` (14 headers for 15 fields). Add a
`versionId: 'Version ID'` entry as part of this phase so the field round-trips
like its siblings.

## ODS export requirements (`swapExport.ts`)

- Column set and left-to-right order follow `TradeItemInteropFormatProperties`
  (the key order of `TradeItemInteropFormatColumnHeaders`), except:
  - `options` is not a single column. Emit `Sweeteners`, `Copies`, and
    `Compare Value` as separate columns in place of it, each following the
    same presence rule individually.
- **Column presence is data-driven, not fixed**: for each candidate column,
  include it in the header row (and every data row) only if at least one item
  being exported has a defined value for it. An all-empty column is omitted
  entirely, not emitted blank.
- `image` (embedded picture) and `imageUrl` (text URL) are independent
  columns, each governed by the presence rule on its own — an item can have
  one, both, or neither.
- Rename the generic ODS internals that still say "Swaptagon" for clarity:
  table name (`Swaptagon Export`), the exported filename default
  (`swaptagon-export.ods`), and the `[swapExport]` log prefix are fine to
  leave as-is if renaming them creates churn elsewhere — flag during
  implementation if a neutral name is preferred instead.

## Userscript import requirements (`importSwap.user.js`)

- Because columns are no longer fixed-position, stop destructuring cells by
  index (`cells[0]`, `cells[1]`, ...). Read the header row first, build a
  column-name → index map from `TradeItemInteropFormatColumnHeaders` values,
  and look up each cell by name. Missing columns (omitted because they were
  empty on export) must resolve to `undefined`, not throw.
- Keep the existing Swaptagon POST behavior (`addItem`, `uploadImage`)
  unchanged — only the parsing of the incoming `.ods` changes. Continue
  filtering out rows missing the fields Swaptagon actually requires
  (`name`, `description`, `compareValue`, `cashValue`) before submitting,
  using the interop field names rather than the current
  `bodyText`/`sellFor` aliases.
- Bump the userscript `@version` header since the file it accepts is a
  breaking change from 1.1.2's fixed 6-column layout.

## Testing

`tests/utils/swapExport.test.ts` currently asserts a fixed 6-column layout by
position and will need to be rewritten around the new column set, including
cases for: a column disappearing when no row has data for it, `options`
sub-fields appearing as independent columns, and both `image`/`imageUrl`
present/absent independently.
