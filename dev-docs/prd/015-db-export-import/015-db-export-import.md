# 015 Database Export & Import

## Overview

In order to back up ShelfScan data and be able to transfer it to another device, users need the
ability to export and import a full ShelfScan database backup as a single PNG image file.

This generalizes the existing scan-history-only export/import (`src/app/lib/utils/scanHistoryImage.ts`)
into a reusable, multi-table backup utility; `ScanHistoryManager` migrates onto it.

The core export/import blob is generated with `dexie-export-import` (already a dependency,
`^4.4.0`) rather than a hand-rolled JSON format — it already handles table filtering, schema/version
metadata, chunked streaming, and primary-key-safe replace, all of which would otherwise need to be
reimplemented. `png-compressor` is used only for the outer PNG envelope.

## Requirements

### Scope

- Backup operates on the `db` Dexie database only (`src/app/lib/database/database.ts`). The `cache`
  database (`images`, `responses`) is excluded — it's regenerable and not user data.
- The full backup includes these tables: `settings`, `plugins`, `collections`, `dataforms`,
  `scanHistory`, `filters`.
- `scanned` (in-progress scan session state) is excluded — it's transient, not durable user data.
- Table selection is enforced via `dexie-export-import`'s `skipTables` option, both at export time
  and defensively at import time — there is no per-table picker in this phase. `skipTables` (not
  `filter`) is the correct mechanism: `filter` only filters rows *within* tables that are already
  included, whereas `skipTables` removes a table from the export's metadata and data entirely
  (source-verified at `dexie-export-import.mjs`'s `exportDB`/`importInto` — `targetTables = db.tables
  .filter(x => !skipTables.includes(x.name))`). Using `filter` to exclude a table would leave it
  present in the manifest with `rowCount: 0`, which `clearTablesBeforeImport` would then still clear
  on import — the opposite of "without overwriting other tables."

### Export

1. Write a utility function that calls `database.export({ skipTables: <table names not in the
   requested set> })` to produce the backup blob. This is a Dexie-native JSON export
   (`formatName: 'dexie'`) already containing per-table schema and row counts — no separate manifest
   needs to be authored.
2. Write a utility function to create a PNG image envelope and embed the export blob into the image
   using `png-compressor`. The PNG image envelope presents to the user (when viewed outside the app)
   as a viewable image showing: title/filename, export date, total blob size, and the list of
   included tables with row counts (read from the blob's own `data.tables` metadata — no duplicate
   bookkeeping required).
   - The export blob's bytes are embedded as a single binary data block (`shelfscan-backup-data`),
     to avoid a redundant JSON stringify/parse round-trip.
   - Filename convention: `shelfscan-backup-{YYYY-MM-DD}.png`.
   - Reuse/generalize the existing `createLabelPng` / `shareOrDownload` helpers from
     `scanHistoryImage.ts` rather than duplicating them.
3. Write a utility function to read an embedded blob from the PNG image envelope:
   - If the file isn't a valid PNG, or has no `shelfscan-backup-data` block, throw a clear,
     user-facing error (matching the existing `importScanHistory` behavior).
   - Reconstruct a `Blob` from the extracted bytes and call `peakImportFile(blob)` (from
     `dexie-export-import`) to get table names/row counts for the confirmation UI, without
     committing anything to the database.
4. Write a utility function to import the tables present in the blob without touching any table not
   included in the backup, via `database.import(blob, options)`:
   - `clearTablesBeforeImport: true`, `overwriteValues: true` — replace semantics within each
     included table (clear, then re-add), matching current scan-history behavior.
   - **Verified during implementation (and caught by the scoping test):** `clearTablesBeforeImport`
     clears every table in the local database except those named in `skipTables` — including tables
     that are absent from the import blob entirely, such as `scanned`. `skipTables` must therefore be
     computed from `database.tables` (the full local table list), **not** from the blob's own
     `data.tables` manifest — computing it from the manifest leaves any table the blob doesn't
     mention (e.g. `scanned`) unprotected and it gets wiped. This is the same computation used on the
     export side.
   - `acceptMissingTables: true`, `acceptVersionDiff: true`, `acceptChangedPrimaryKey: true` — the
     backup won't always come from a schema version identical to the current app's.
   - Import runs inside `dexie-export-import`'s own transaction (the default; `noTransaction` is
     left unset) — atomic across all included tables without needing a hand-rolled
     `database.transaction()` wrapper.
   - The import UI must show a confirmation dialog (populated from `peakImportFile`) before running,
     naming which tables will be replaced and their row counts.

### UI

- New `src/app/ui/settings/BackupManager.tsx`, following the existing manager pattern
  (`PluginManager.tsx`, `DataFormManager.tsx`, etc.): an export button (share-or-download, reusing
  the existing Web Share API fallback) and a file input for import, with the pre-import confirmation
  dialog described above.
- `ScanHistoryManager.tsx` migrates its export/import buttons onto the new generic utility, scoped to
  just the `scanHistory` table, and `scanHistoryImage.ts` is removed.

## Details

### Table scope constant

```typescript
type BackupTableName =
    | 'settings'
    | 'plugins'
    | 'collections'
    | 'dataforms'
    | 'scanHistory'
    | 'filters';

const INCLUDED_TABLES: BackupTableName[] = [
    'settings', 'plugins', 'collections', 'dataforms', 'scanHistory', 'filters',
];
```

### Error handling

| Condition | Behavior |
| --- | --- |
| Not a valid PNG | Throw: "File is not a valid PNG or could not be read." |
| No `shelfscan-backup-data` block | Throw: "This PNG does not contain a ShelfScan backup." |
| `peakImportFile` / `database.import` rejects (corrupt JSON, unrecoverable schema mismatch) | Catch and surface `dexie-export-import`'s error message in a user-facing toast/dialog rather than an unhandled rejection. |

### Side-effect import

`dexie-export-import` extends `Dexie`/`Dexie.prototype` as a side effect of importing it
(`import 'dexie-export-import'`), adding `.export()` / `.import()` to the `database` instance. This
import should live once in `src/app/lib/database/database.ts` alongside the `database` definition,
not in `dbBackup.ts`, so the augmentation is guaranteed to apply before any consumer uses it.

### Non-functional note

Because the export blob is embedded in the PNG (via `png-compressor`), the blob is fully
materialized in memory at both export and import time — `dexie-export-import`'s chunked/streaming
design is not preserved end-to-end through the PNG round trip. This is an accepted tradeoff given
current data volumes (`scanHistory` capped at 20k rows per `ScanHistoryProvider`).

The export blob is **not** embedded as a single `shelfscan-backup-data` block — `png-compressor`
encodes each binary block via `String.fromCharCode.apply(null, ...)` (`data-blocks.js`), which
throws "Maximum call stack size exceeded" once a block's byte length exceeds the JS engine's
argument-spread limit (~65k). The blob is split into fixed-size chunks (`CHUNK_SIZE_BYTES`, 32KB)
and encoded as multiple blocks sharing the `shelfscan-backup-data` key — `png-compressor` supports
this natively (`encodeImageDataBlocks`/`getDataBlocks`, one key mapping to an array of blocks).
`readBackupBlob` reassembles them in order via `new Blob(chunks, ...)`. Covered by a regression test
with a large `scanHistory` payload in `tests/utils/dbBackup.test.ts`.

## Architecture

| File | Purpose |
| --- | --- |
| `src/app/lib/utils/dbBackup.ts` | `INCLUDED_TABLES`, export/import utility functions, PNG envelope embed/extract |
| `src/app/lib/database/database.ts` | Adds the `import 'dexie-export-import'` side-effect import |
| `src/app/ui/settings/BackupManager.tsx` | Export/import UI, confirmation dialog populated via `peakImportFile` |

`scanHistoryImage.ts` and its usage in `ScanHistoryProvider.tsx` / `ScanHistoryManager.tsx` are
removed as part of this change; `ScanHistoryManager` calls into `dbBackup.ts` scoped to
`['scanHistory']`.

## Testing

- Round-trip test: export the fixed table set, import it back into a fresh Dexie instance, assert
  data matches per table.
- Scoping test: seed `scanned` (and a table outside `INCLUDED_TABLES`) with data, run an export +
  import cycle, assert that table is untouched.
- `peakImportFile` test: assert the confirmation-dialog data (table names, row counts) matches what
  was actually exported, without any table being written to first.
- Error-path tests: non-PNG file, PNG with no `shelfscan-backup-data` block, and a corrupted/truncated
  embedded blob.
