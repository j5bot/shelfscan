# ShelfScan WebMCP tools

ShelfScan registers 15 WebMCP tools. The 9 BGG collection and play tools need the ShelfScan extension, a
subscription and a loaded BGG user. Without them, each is registered as a stand-in that only explains why it
can't run.

## Scanning and GameUPC lookup

| Tool | What it does | Writes data? |
|---|---|---|
| `scan_upc` | Reads UPC barcodes from an image (a data URI or an image blob). | No |
| `list_scanned_upcs` | Lists the UPCs in ShelfScan's scan list, in the order they were scanned. | No |
| `gameupc_data_from_upc` | Gets GameUPC's data for a UPC-A or UPC-E code. An optional `search` title helps when the UPC has no verified match. | No |
| `gameupc_submit_game` | Submits a new UPC → BGG game/version mapping to GameUPC, or verifies an existing one. `updater` defaults to "ShelfScan MCP". | Yes |
| `gameupc_remove_game` | Removes a UPC → game mapping that a given updater submitted. | Yes |

## BGG collection

| Tool | What it does | Writes data? |
|---|---|---|
| `load_bgg_collection` | Fetches a fresh copy of a BGG user's collection, games and expansions, and makes that user ShelfScan's active user. It retries temporary BGG errors for up to a minute and returns item counts by status. The extension tools need this user loaded first. | Yes (ShelfScan's active user and collection, not BGG) |

## Extension tools (BGG collection and plays)

These act on the active ShelfScan user's BGG collection through the extension, and all of them write data.
Where the table says `collectionId` is required, the tool only works on an existing collection item.

| Tool | What it does |
|---|---|
| `add_to_bgg_collection` | Adds a game as owned. |
| `add_to_bgg_collection_for_trade` | Marks a game for trade with a required trade condition. Updates the item if a `collectionId` is given, otherwise adds a new one. |
| `add_to_bgg_wishlist` | Adds a game to the wishlist with a priority from 1 to 5 (default 3, "Like to Have"). Updates or adds, like the trade tool. |
| `set_bgg_previously_owned` | Marks a game as previously owned, which turns off "own". Updates or adds. |
| `clear_bgg_collection_statuses` | Turns off every status on an existing item, but keeps the item. `collectionId` is required. |
| `remove_bgg_collection_item` | **Permanently deletes** an item and everything on it. It needs `confirmPermanentDelete: true`, and the item must be in the loaded collection and belong to `bggId`. |
| `bgg_collection_item_info` | Reads (`read: true`) or updates an item's private info: comment, statuses, trade condition, price paid, current value, acquisition and inventory details. Fields you don't send keep their values. `preload: true` also returns the values from before the update. Values must be ones the info form offers (BGG statuses, the form's currencies, `YYYY-MM-DD` dates). `collectionId` is required. |
| `set_bgg_collection_tags` | Adds, removes or replaces the hashtag tags on an item. `location` picks where they're stored: the wishlist comment (default), the want-parts list or the has-parts list. Other text in that field is kept, and value tags like `#best-at=2` are supported. `collectionId` is required. |
| `log_bgg_play` | Logs a play with an optional date (defaults to today), location, duration, quantity, an "incomplete" flag, comments and players. Each player can have a name, BGG username, score, win, colour, start position and rating. |

The info, tags and delete tools refuse to act when the collection item belongs to a different game than
`bggId`. The info tool can only check this when it loads the item first, or when the item is in the loaded
collection.
