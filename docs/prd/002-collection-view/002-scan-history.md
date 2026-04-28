# Scan History — Implementation Requirements

## Purpose

- Persistently store a history of all scanned games (UPCs) for each BGG user, including relevant 
  metadata, to support features such as identifying games not in the collection and audit/review of past scans.
- If a user is not logged in to BGG, store scan history locally without a username association, 
  and allow retroactive association if they log in later, through the scan history settings.

## Data Model

- Each scan history entry must include:
  - Match status (e.g., matched to collection, unmatched, duplicate) (integer enum)
    - Enum values are: 0 = unmatched, 1 = matched, 2 = duplicate (same UPC scanned within 5 
      minutes of a previous scan, regardless of match status).
  - GameUPC verification status (boolean - true if verified, false if any other status)
  - UPC (string)
  - Scan timestamp (epoch seconds)
  - Update timestamp (epoch seconds, for tracking retroactive updates if user logs in or if any 
    values change after initial scan)
  - Game title (if available at scan time) (string, optional)
  - BGG ID (if matched at scan time, optional) (number, optional)
  - Image thumbnail canonical url (optional, if captured) (string, optional).  this is the url 
    provided by GameUPC at scan or verification time: a BGG image url.
  - Any error (e.g., not found, matched, duplicate) (integer enum, optional).
    - This is not exclusive and can be used in combination with match status (e.g., a scan could be unmatched with a "not found" error, or could be matched but have a "duplicate" error if the same UPC was scanned within 5 minutes).
    - Enum values are: 0 = no error, 1 = not found, 2 = GameUPC verification failed, 255 = other 
      error (3-254 reserved for future specific error types).
  - BGG Collection ids as an array (if matched at scan time, optional) (array of numbers, optional)
  - BGG Collection statuses, mapped by collection id (if matched at scan time, optional) (object mapping collection id to status, optional)
  - Current BGG Username (if available at scan time, optional) (string, optional)
  - Schema version (integer, for future extensibility)
- Store scan history in IndexedDB (Dexie) in a dedicated table. repurpose the `audits` table / 
  types as these are not currently used.
- Support up to 20,000 scan entries per user.

## API/Access

- Provide functions/hooks to:
  - Add a new scan entry (on every successful scan, regardless of match status)
  - Update an existing scan entry (e.g., to update match status after collection matching or if GameUPC verification status changes)
    - Leave the scan timestamp unchanged on updates, but update the update timestamp to reflect when the entry was last modified.
  - Retrieve all scan entries (optionally sorted/filtered by date, UPC, etc.)
  - Delete a scan entry (for future extensibility)
  - Clear all scan history (for privacy/user control)

## Integration

- On scan, always add to scan history before any collection matching logic.
- When matching a scan to the collection, update the corresponding scan history entry with match 
  results (BGG ID, GameUPC verification status, collection status, etc.).
- When rendering the collection view's "Scanned games not in collection" tab, compare scan history UPCs to collection UPCs.
- Ensure scan history is available to all relevant UI components via context/provider or hooks.
- If a duplicate scan is attempted (same UPC within 5 minutes), handle as follows:
  - if the previous scan is unmatched, add a new entry with "duplicate" status and an appropriate error message.
  - if the previous scan is matched, and there are multiple copies of the game in the user's 
    collection, do not add a new entry and show a message indicating the game is already in the collection with the number of copies.
- Scan history is not automatically updated retroactively if the user updates their collection. It 
  only reflects the state at the time of each scan.
- if a upc is verified by GameUPC after initially being unmatched, update the corresponding scan history entry to reflect the new verification status and any matched BGG data.

## UI/UX

- No dedicated scan history page in v1; scan history is only surfaced in the collection view for unmatched scans.
- For future: design extensibly for a possible scan history page (with filtering, export, etc.).
- If scan history is empty, show appropriate empty state in the unmatched tab.

## Privacy & Security

- Scan history is stored locally and never synced to the server or external APIs.
- Provide a clear history function to allow users to delete all scan history data via the 
  Settings component (similar to the ImageCacheManager's clear cache function).

## Performance

- Efficiently handle up to 20,000 scan entries.
- Use indexed fields for fast lookup by match status, bgg username, bgg collection ids, UPC, and 
  date.

## Data Retention

- If the scan history exceeds 20,000 entries, first prune unmatched entries that are more than 1 
  month old. If the history still exceeds 20,000 entries after pruning old unmatched entries, 
  prompt the user to clear their history before adding new entries.

## Error Handling

- Errors in scan history management (e.g., IndexedDB errors) should be gracefully handled with 
  appropriate user feedback and logging for debugging.

## Extensibility

- Structure for future fields (e.g., location, device info, user notes).
- Structure for future sync/export features.

