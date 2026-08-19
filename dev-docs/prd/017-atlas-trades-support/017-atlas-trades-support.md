# PRD 017 Atlas Trades Support

In addition to the Swaptagon trade platform, another platform exists called
Atlas Realms (or Atlas for short).

ShelfScan should support this platform and its format via the same export
functionality as the Swaptagon platform.

Write code to support this platform / format.  Rather than produce another
export format, modify the existing `swapExport` and `importSwap.user.js` to
export and consume a new interop format, respectively.

This format is already created as `trades.ts::TradeItemInteropFormat`

Export functions should check data rows to see whether each column should appear
in the file. If any row has data in the column, it should appear.

SwapItemData should be the source of truth for available fields, otherwise,
BggCollectionItem should be used (e.g. for Version info).  For the batch scan
swap, utilize the adapted objects.

The scope of the first phase is simply to replace the existing swaptagon export
and import with an export to and import from the interop format.