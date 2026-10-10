# PRD 019 Non-Collection Game Operations

## Overview

Users of ShelfScan may wish to register plays, add items to their collection, or
do other operations without scanning a UPC or already having a game in their
collection.

Add functionality to the collection view which allows for this. Specifically,
if a search for a game does not result in items from the collection, run the
text part of the search through BGG in order to get games which match the search
but are not yet part of the user's collection in any way.

Games which are not part of a user's collection should have an alternate
presentation in the grid/list. For the first version, have them appear on a
dark background with light text/icons when in light mode, and on a light background
with dark text/icons when in dark mode.

## Goals

- A user can find any BGG board game or expansion from the search box on any collection page,
  even if it isn't in their collection, and act on it (add to collection with any status, log a
  play, rate, open on BGG) with the same modal used for collection items. On trade pages, the
  only action is adding it to the collection, after which it can be traded.
- Results come from the extension when it supports search (fast, logged-in, relevance-ranked),
  and from the BGG XML API v2 otherwise.
- Non-collection results are visually unmistakable from collection items.

## Non-goals (v1)

- Images for non-collection results (use the no-image default; see Future work).
- Searching accessories, RPGs, video games or other BGG subtypes.
- Showing BGG results alongside a non-empty collection result set (see Future work).
- Batch operations (selection, batch add, batch rating, tags, swap/trade export, math trade) on
  non-collection results.
- A WebMCP tool for BGG search (see Future work).

## Terminology

The collection page already has a **"Not in Collection" tab** (scanned UPCs that aren't in the
collection — PRD 007). To avoid confusion, this PRD calls the new items **BGG results**, and the
UI must not label them "Not in Collection".

## User stories

1. I search my collection for "Carcassonne", which I don't own. Instead of "No games match your
   filter", I see Carcassonne and its expansions from BGG, can open one, and add it to my wishlist.
2. I played a friend's copy of "Heat". I search for it, open it, and log a play — without adding
   it to my collection.
3. I don't have the extension. I can still search and open BGG results; the modal tells me what
   the extension would let me do.

## Requirements

### R1 — When a BGG search runs

A BGG search runs when **all** of these hold:

1. The page renders `ui/CollectionPageContent.tsx`: `/collection`, `/swap`, `/trade` and
   `/math-trade/[geeklistId]` (D5). Trade pages offer fewer operations (R8).
2. The collection has finished loading (`CollectionLoadStatuses.LOADED`).
3. The search box yields a **BGG query** (R2) of at least **3 characters**.
4. The filtered collection list is empty (the branch that currently renders
   "No games match your filter." in `AllGamesContent.tsx`).

Further rules:

- **Debounce** 500 ms after the last keystroke (`searchText` updates on every keystroke).
- **Stale responses** are discarded: only the response for the current query is ever rendered
  (`active` flag / request key). Server actions can't be aborted, so an abandoned XML search
  still completes and is cached, but is never rendered.
- If the query becomes shorter than 3 characters or the collection list becomes non-empty, the
  BGG section disappears and any in-flight search is abandoned.
- The same query is not re-requested within a session (in-memory cache keyed by normalized
  query + source; see Decision D6).

### R2 — Extracting the BGG query from the search box

Search text is parsed by `parseUnifiedSearch()` (`lib/hooks/useCollectionFilters.ts`). The BGG
query is derived from that parse:

| Search mode | Input example | BGG query |
|---|---|---|
| `all`, no prefixes | `carcassonne` | `anyTextQuery` → `carcassonne` |
| `all`, with prefixes | `carc #owned version:2nd` | `nameQuery` (text before the first prefix, or `name:` value) → `carc` |
| `all`, only `version:` / `tags:` / `#tag` | `#PnP` | none — no BGG search |
| `name` | `carc` | `nameQuery` → `carc` |
| `version` | `2nd edition` | none — BGG search doesn't search versions |
| `tags` | `#PnP` | none |

- Extract as a pure function `getBggSearchQuery(searchText, searchMode): string`
  (`lib/utils/bggSearch.ts`) so it is unit-testable.
- Trim and collapse whitespace. Case doesn't matter (BGG search is case-insensitive).
- Strip stray hashtag tokens (`HASHTAG_PATTERN` from `lib/utils/tags.ts`) left in the text.

### R3 — Search source selection

```
extension present AND extension version ≥ 0.12.0 (D1)  →  extension 'doSearch'
                                                         ↳ on failure → XML API fallback
otherwise                                               →  XML API (server action)
```

- **Failure** means: timeout, a rejected/errored dispatch, the extension not logged in to BGG,
  or a reply without an array at `response.data.items` (D2). Any failure → XML search.
- **A successful but empty extension result is final** — no XML fallback (D2/D3).

- While extension presence is still unknown (`useExtensionPresence()` returns `null`), wait —
  don't start an XML search that would be immediately superseded.
- The extension's version is currently only read inside `ui/extension/ExtensionNotice.tsx`
  (from the extension's shadow-DOM version element). Extract that into a hook
  (`useExtensionVersion`) and a pure comparison helper (`isVersionAtLeast`, in
  `lib/utils/extensionVersion.ts`) so both the notice and this feature use it.

### R4 — Extension search (`doSearch`)

Send a `doSearch` message with the query as a `query` parameter, and wait for the response. The
items are at **`response.data.items`** of the `dispatchExtensionMessage` result (D2) — an array
of **at most 20** items, in relevance order, with this shape:

```
{
    "objectid": "822",
    "subtype": "boardgame",
    "primaryname": "1",
    "nameid": "736",
    "yearpublished": 2000,
    "ordtitle": "Carcassonne",
    "rep_imageid": 8621446,
    "objecttype": "thing",
    "name": "Carcassonne",
    "sortindex": "1",
    "type": "things",
    "id": "822",
    "href": "/boardgame/822/carcassonne"
}
```

- Add `'doSearch'` to `DocumentMessageDetailType` and a `DocumentMessageDoSearchDetail`
  (`{ query: string }`) to `DocumentMessageSourceDetail` in `lib/extension/messageTypes.ts`.
- Add `lib/extension/messaging/searchBgg.ts`, following `loadCollectionItem.ts`: dispatch via
  `dispatchExtensionMessage`, wrap in `withExtensionTimeout` with a **10 s** timeout (not the
  default 25 s — the XML fallback still has to run).
- Treat a reply without an array at `response.data.items` as a failure (→ fallback). This is
  also how "not logged in" and BGG errors reach the app.
- **Keep the extension's order** (D3) — no re-sorting. Normalization below only filters and
  deduplicates, keeping the first occurrence's position.
- Normalization:
  - Keep only `subtype` `boardgame` and `boardgameexpansion`.
  - `objectid` is a string → `Number()`; drop items where it isn't a positive integer.
  - Deduplicate by `objectid` (alternate-name matches can return the same game more than once):
    keep the first occurrence's position, but take the name from the entry with
    `primaryname === "1"` when there is one.
  - `yearpublished` may be missing, `0` or `null` → treat as unknown.
  - Keep `rep_imageid` on the normalized result (unused in v1; see Future work).

### R5 — XML API search (no extension, or extension fallback)

Add a server action in `lib/actions.ts`:

```
https://boardgamegeek.com/xmlapi2/search?query=<query>&type=boardgame,boardgameexpansion
```

- Always search both `boardgame` and `boardgameexpansion` types.
- Use `fetchFromBggWithToken` (bearer token, 202 retry loop); build the URL with
  `URL.searchParams` so the query is encoded. Return the XML text; parse on the client with
  `getPageDOM` in `lib/services/bgg/service.ts` (like `bggGetVersionsFromXML`).
- Response shape: `<items total="N"><item type="boardgame" id="822"><name type="primary"
  value="Carcassonne"/><yearpublished value="2000"/></item>…</items>`.
- Normalization:
  - **BGG lists most expansions twice** — once as `boardgame` and once as
    `boardgameexpansion`. Deduplicate by `id`; if any entry is `boardgameexpansion`, the result is
    an expansion.
  - `name type` may be `alternate` (the query matched an alternate title). Display the returned
    name in v1.
  - `<yearpublished>` may be absent → unknown.
  - An `<error>` body, non-2xx status or missing token → error state (R7).

### R6 — Ordering and limits

**XML API results** come in no particular order. Order them so that **boardgame items are
first**, then by **published year descending**, then **expansions** by **published year
descending**. Within the same year, order by name (locale compare), then id. Unknown years sort
after known years within their group.

- **Extension results keep the extension's relevance order** (D3). Ordering therefore differs
  by source; this is accepted.
- **XML results** are capped at **100** (D7). When more matched, show "Showing 100 of N results
  from BoardGameGeek — refine your search." (A 3-letter query can match thousands of games.)
  Extension results are at most 20, so no cap message is shown for them.
- Order of operations (XML): dedupe → sort → match to the collection → cap.
- **Results that are already in the collection are shown as collection items, not as BGG
  results.** Each result is matched by BGG id against
  `state.bgg.collection.users[username].objects.all` (any status). A match is rendered as the
  user's own collection item(s) for that game — the normal card/row, normal colors, normal click
  behavior — at the result's position. A game with several collection items (e.g. two copies)
  shows all of them there. Only unmatched results get the inverted BGG-result presentation.
- **The BGG title match replaces only the name search; the other filters still apply** —
  including `version:` and `#tag` terms in the search box (e.g. "carc #pnp" only shows matched
  games tagged #pnp) and the games / expansions toggle, which also limits the BGG results. A
  matched collection item is shown only if the collection's filters, ignoring the search text,
  show it (e.g. a game found by an alternate title the collection search doesn't match). If all
  of a game's collection items are hidden by filters, the result is dropped — never shown as a
  BGG-result card — and counted for the hint below.
- **"Hidden by filters" hint:** when one or more results were dropped that way, show "N games in
  your collection match this search but are hidden by your filters — Clear filters". Clear
  filters resets every filter and the games / expansions toggle, but keeps the search
  (`clearFiltersKeepSearch`; `resetFilters` clears the search too).

### R7 — Display

The BGG results render where "No games match your filter." is rendered today, as their own
section:

- Heading: **"From BoardGameGeek"** (with result count), plus a short sub-line: "Not in your
  collection". The section is a `<section aria-labelledby>`.
- Respects the current view (list / large grid / small grid).
- **Inverted colors**: `bg-gray-900 text-white dark:bg-white dark:text-gray-900` on each
  card/row (`inverted` prop on `ListGame` / `ListGameRow`) — the exact reverse of the cards'
  existing `bg-white dark:bg-gray-900`, so it follows the same dark-mode switch. Icons use
  `currentColor`.
  Verify WCAG AA contrast for the rating/badge text in both themes.
- **Image**: none in v1 — the no-image default.
- **Corner icon / status text**: a distinct "not in collection" icon (e.g. `FaPlus`) with title
  "Not in your collection".
- **Name**: show the year in the name, e.g. "Carcassonne (2000)", since BGG has many same-named
  games. Show an **Expansion** badge for expansions.
- Detail link: `https://boardgamegeek.com/boardgame/<id>` (`/boardgameexpansion/<id>` also
  redirects; one form is enough), new tab.
- None of these per-card sections render: tags, batch rating, math trade, swap/trade export,
  scanned/verified badges. (They are all guarded by a truthy `collectionId`; see R9.)

States:

| State | Shown |
|---|---|
| Query < 3 chars (and collection list empty) | "No games match your filter. Type at least 3 characters to search BoardGameGeek." |
| Searching | "Searching BoardGameGeek…" with a spinner (`aria-live="polite"`) |
| Results | The section |
| No results | "No games match your filter, and nothing on BoardGameGeek matches '<query>'." |
| Error | "Couldn't search BoardGameGeek." + **Retry** button |

### R8 — Operations on a BGG result

Clicking a card/row opens `CollectionItemModal` with a synthesized item (R9). In the modal:

- **With extension**: the same primary actions as for collection items (`useExtension` with
  `view: 'collection'`): add to collection (any status), log play, rate, plus plugin link
  actions. `useExtension` already looks the game up by object id and treats it as a new add when
  there is no collection id.
- **Versions** are lazy-loaded by `CollectionGameDetails` from `bggGetThingsXml` (already
  cached in Dexie as `thing|<id>`), so a version can be chosen before adding.
- **Without extension**: BGG link and plugin link actions only, plus the existing "get the
  extension" prompt.
- **On trade pages** (`/swap`, `/trade`, `/math-trade/[geeklistId]`) — D5: **add to collection
  only**. No log play, rating, tags or data forms. Once added, the game is an ordinary
  collection item and gets that page's trade actions (swap/trade export, math-trade selection).
  `useExtension` builds `[addToCollectionBlock, addPlayBlock, addRatingBlock, editTagsBlock]`
  unconditionally, so it needs an option to return only the add block (e.g.
  `actions: 'addOnly'`).
- **On trade pages the add block is the default (and only) action**, and it uses the user's
  existing default collection mode (the saved `extensionModes.collection`), exactly as for
  collection items. Don't override or overwrite that mode.
- **No "log in to BGG" note.** When the extension is installed but not logged in, results still
  show (via the XML fallback); the modal's actions behave as they do for collection items today.
- After an add, the game is in the collection, so the same search shows it as a collection item
  (R6) — or, if the user's filters hide it, counts it in the "hidden by filters" hint.
- **After a successful add**, the game must appear in the collection and leave the BGG results
  (the collection list is then non-empty, so the BGG section hides by R1). See Action plan
  phase 4 — how the scan page's add updates Redux needs verifying.
- **Logging a play** must not add the game to the collection. `addPlay` → `syncNumPlays` with no
  collection id must not throw.

### R9 — Data mapping for cards

Fields required to render a card/row (`ListGame`, `ListGameRow`) and the modal
(`CollectionItemModal` takes a `BggCollectionItem`), and where they come from:

| `BggCollectionItem` field | Required? | Extension | XML API | v1 default |
|---|---|---|---|---|
| `objectId` | yes | `objectid` (string) | `@id` | — |
| `name` | yes | `name` | `name/@value` | — |
| `subType` | yes | `subtype` | `@type` (after dedupe) | — |
| `yearPublished` | no | `yearpublished` | `yearpublished/@value` | `undefined` |
| `collectionId` | yes (type) | **missing** | **missing** | `0` |
| `statuses` | yes | **missing** | **missing** | all `false` |
| `lastModified` | yes | **missing** | **missing** | `''` |
| `image`, `thumbnail` | no | **missing** (`rep_imageid` only) | **missing** | `undefined` → no-image default |
| `rating`, `averageRating`, `plays` | no | **missing** | **missing** | `undefined` |
| `version`, `versionId` | no | **missing** | **missing** | `undefined` (lazy-loaded in the modal) |

Notes:

- **`collectionId: 0`, not a negative number.** Existing guards use truthiness
  (`!!collectionId` in `ListGame`'s `CardSections`, `!!collectionId && updateChoice` in
  `useExtension`); `-1` is truthy and would turn on collection-only UI and "update" mode.
- Grid cards can't use `GridItem` in `AllGamesContent.tsx` — it reads the item from Redux by
  collection id. Add a `BggResultGridItem` that passes `name`/`thumbnailUrl`/`item` to
  `ListGame` directly. List rows use `ListGameRow`'s existing "simple" (no `collectionId`)
  variant.
- Keep BGG results out of Redux (they aren't collection state); hold them in the search hook.
- The adapter lives in `lib/utils/gameAdapters.ts`: `bggSearchResultToCollectionItem()`.

Normalized type (`lib/types/bgg.ts`):

```typescript
export type BggSearchResult = {
    objectId: number;
    name: string;
    subType: 'boardgame' | 'boardgameexpansion';
    yearPublished?: number;
    imageId?: number;      // extension's rep_imageid, unused in v1
    source: 'extension' | 'xmlapi';
};
```

### R10 — Analytics

PostHog events, including the search text (game names aren't sensitive):

- `bgg_search` — `{ query, source, fallback: boolean, resultCount, durationMs }` (`resultCount`
  is before collection matching and the cap)
- `bgg_search_error` — `{ query, source, reason: 'timeout' | 'error' | 'bad_response' }`
- `bgg_search_result_opened` — `{ query, objectId, subType, page }` (`page`: collection / swap /
  trade / math-trade)

`query` is the derived BGG query (R2), not the raw search box text.

## Corner cases

| Case | Expected behavior |
|---|---|
| Matching collection items are hidden by **non-search filters** (e.g. "Owned" filter, user only has it wishlisted) | BGG search runs; the game is dropped from the results and counted in "N games in your collection match this search but are hidden by your filters — Clear filters". |
| Search by an alternate title (e.g. "Die Burg") that the collection search doesn't match | The collection item appears in the results via the BGG id match. |
| Game with several collection items | The ones the filters show appear at the result's position. |
| Query matches only expansions | Section shows expansions only, ordered by year. |
| Same name, different games ("Dune" 1979 vs 2019) | Year in the name distinguishes them. |
| Expansion listed twice by the XML API | Deduped; marked as expansion. |
| Alternate-title match (e.g. a translated title) | Shown under the returned name; deduped against the primary entry by id. |
| Unknown year | Sorted last in its group; no "(year)" suffix. |
| Very short / very broad query ("the") | Below 3 chars: no search. XML: capped at 100 with the "refine" message. Extension: its top 20. |
| Extension returns 20 results, all already in the collection | Shown as collection items where the filters allow; the rest counted in the hint. No XML fallback. |
| Extension returns 0 items (logged in) | Final "No results" state; no XML fallback. |
| Same query, extension vs XML (e.g. extension failed once) | Different order and count; cached per source, so a later extension success doesn't reuse XML results. |
| Special characters (`&`, `:`, quotes, non-Latin scripts) | Encoded with `URLSearchParams`; extension receives the raw string. |
| User types quickly | Debounce; only the latest query's results render. |
| User clears the search while searching | Section disappears; in-flight result discarded. |
| Extension present but older than the minimum | XML API path, no error shown. |
| Extension times out / errors / no array at `response.data.items` | Silent fallback to XML API; `bgg_search_error` event. |
| Extension not logged in to BGG, or BGG fails inside the extension | Failure → XML fallback (D2). No "log in to BGG" note. |
| User's saved collection mode is e.g. "Wishlist", opening a BGG result on a trade page | Modal's add block uses "Wishlist" (the existing default mode); nothing overrides it. |
| BGG returns 202 repeatedly / 429 / 5xx | Error state with Retry. |
| `BGG_TOKEN` missing (local dev) | Error state; server action throws a clear message. |
| Collection still loading | No BGG search until loaded. |
| No BGG username set | Collection page already handles this; BGG search doesn't run. |
| Game added to collection from the modal | Appears in the collection; BGG section hides (search now matches). |
| Play logged from the modal | Game stays a BGG result (no collection entry created). |
| Trade / swap / math-trade pages | BGG search runs; modal offers add to collection only. After adding, the game gets the page's trade actions (D5). |
| Collection loaded via another user's name | Exclusion uses the loaded collection; actions are still the logged-in extension user's — same as today for collection items. |

## Decisions (resolved 2026-10-10)

- **D1 — Minimum extension version: ≥ 0.12.0.** 0.12.0 is the first version with `doSearch`.
  Keep the constant in one place, and bump `lib/extension/version.ts` (currently `0.11.0`) when
  the extension ships.
- **D2 — `doSearch` reply.** Items are at `response.data.items`, at most 20. If the extension is
  not logged in to BGG, or the search fails, fall back to the XML search. A successful empty
  result is final — no fallback.
- **D3 — Extension result order: keep the extension's relevance order.** Only XML results get
  the boardgame → expansion, year-descending order.
- **D4 — Placeholder defaults: as in the R9 table.** `collectionId: 0`, all statuses `false`,
  `lastModified: ''`, everything else `undefined`.
- **D5 — Pages: all collection pages**, including `/swap`, `/trade` and
  `/math-trade/[geeklistId]`. On trade pages the modal offers add to collection only; once
  added, the game gets the page's trade actions.
- **D6 — Caching: in memory per session** (module-level `Map`, at most ~50 queries, keyed by
  normalized query + source), not Dexie.
- **D7 — Limits:** 3-character minimum, 500 ms debounce, 100-result cap (XML only).
- **D8 — Trade-page add mode:** add to collection is the default (only) action; it uses the
  user's existing default collection mode, which is neither overridden nor overwritten.
- **D9 — Analytics:** log the search text (R10).
- **D10 — No "log in to BGG" note** when the extension isn't logged in.

## Action plan

### Phase 1 — Pure logic (all unit-tested)
1. `lib/types/bgg.ts`: `BggSearchResult`.
2. `lib/utils/bggSearch.ts`:
   - `getBggSearchQuery(searchText, searchMode)` (R2)
   - `normalizeExtensionSearchItems(items)` (R4) — filter + dedupe, order preserved
   - `sortBggSearchResults(results)` (R6) — XML results only
   - `matchCollectionObjects(results, { objects, isShown })` (R6) → `BggSearchEntry` with the
     shown `collectionIds`, plus the hidden-by-filters count
   - `prepareXmlSearchResults` (sort → match → cap) and `prepareExtensionSearchResults`
     (normalize → match)
3. `lib/services/bgg/service.ts`: `bggGetSearchResultsFromXML(xml)` with expansion dedupe (R5).
4. `lib/utils/extensionVersion.ts`: `parseExtensionVersion`, `isVersionAtLeast`.
5. `lib/utils/gameAdapters.ts`: `bggSearchResultToCollectionItem(result)` (R9).
6. Tests in `tests/` mirroring those paths, covering the corner-case table (dedupe, unknown
   years, alternate names, prefix parsing, version comparison including `0.12.0` vs `0.12.1` vs
   `0.9.9`).

### Phase 2 — Data sources
1. `lib/actions.ts`: `bggSearchInner(query)` server action (R5).
2. `lib/extension/messageTypes.ts`: `doSearch` message types.
3. `lib/extension/messaging/searchBgg.ts`: extension search with 10 s timeout; reads
   `response.data.items` and throws when it isn't an array.
4. `lib/extension/syncHooks/useExtensionVersion.ts`, extracted from `ExtensionNotice.tsx`
   (refactor `ExtensionNotice` to use it).
5. `lib/hooks/useBggSearch.ts`: `({ query, enabled }) → { status, source, results, fallback,
   errorReason, retry }`. Debounce, `active` flag, session cache, analytics events. Source choice
   and fallback live in the pure `runBggSearch` (`lib/utils/bggSearch.ts`); collection matching
   and the cap happen at render with `prepareBggSearchResults`, since filters change without a
   new search.
6. `SyncContext` gains `syncChecked` (presence check has run) and `extensionVersion`, read once in
   `SyncProvider`; `ExtensionNotice` uses them instead of its own observer.

### Phase 3 — UI
1. `ui/collection/BggSearchResults.tsx`: section, heading, states (R7), list/grid rendering via
   `ListGameRow` (simple variant) and a new `BggResultGridItem` (wraps `ListGame`).
2. Inverted-color styling and the "not in collection" corner icon / expansion badge / year.
3. Wire into `AllGamesContent.tsx` at the empty-result branch; pass the derived BGG query,
   `objects.all` ids and the modal opener from `CollectionPageContent.tsx`.
4. Clicking a result opens `CollectionItemModal` with the adapted item. On trade pages
   (`useTradeMode()`), pass an add-only option through to `useExtension` (R8), which also
   keeps the user's saved collection mode.
5. Entries with `collectionIds` render the existing collection card/row (`GridItem` /
   `ListGameRow` with `collectionId`) for each id; entries without render the BGG-result card.
6. `isShown`: the collection filter function with the search text left out (`makeFilterFn` in
   `useCollectionFilters` with an empty `searchText`), looked up by collection id.
7. "Hidden by filters" hint with **Clear filters** (check whether `resetFilters` keeps the search
   text; it should).

### Phase 4 — Operations end to end
1. Verify add-to-collection from the modal with no collection id (each status, with and without
   a version).
2. Verify how a successful add updates `state.bgg.collection` today (scan page path). If the
   collection isn't updated until reload, add an update (reload the single item via the
   extension's `infoLoad` / `loadCollectionItem`, or insert from the add response).
3. Verify log play with no collection id (`syncNumPlays` must not throw), and rating.

### Phase 5 — Polish and release
1. Accessibility pass: section labelling, `aria-live` status, keyboard access to cards, contrast
   of the inverted theme in every DaisyUI theme the app ships.
2. `pnpm lint`, `pnpm test`, `pnpm doctor`, `pnpm build`.
3. Manual test matrix: Chrome with extension ≥ min, Chrome with older extension, Firefox/Safari
   without extension, light and dark themes, list / large / small grid, mobile width.
4. Bump `lib/extension/version.ts` when the extension release with `doSearch` ships.

## Acceptance criteria

- [ ] With no matching collection items, a ≥ 3-character name search on any collection page
      (`/collection`, `/swap`, `/trade`, `/math-trade/[id]`) shows BGG results within the
      debounce + request time.
- [ ] No BGG search runs for version-only or tag-only searches.
- [ ] Results that are in the collection (any status) show as the user's collection item(s),
      with normal presentation, at the result's position — only where the non-search filters
      show them; otherwise they are counted in the "hidden by filters" hint.
- [ ] XML results: board games before expansions, each group year-descending, unknown years
      last, at most 100. Extension results: extension order, at most 20. No duplicate ids.
- [ ] Extension ≥ 0.12.0 is used when present; any extension failure (including not logged in)
      falls back to the XML API without a user-visible error; an empty successful extension
      result does not fall back.
- [ ] On trade pages the modal offers only add to collection, using the user's existing
      default collection mode (not overridden or overwritten); after adding, the game shows the
      page's trade actions.
- [ ] PostHog search events include the derived query text.
- [ ] BGG result cards are inverted-color in both light and dark modes, show the no-image
      default, the year, and an expansion badge where relevant.
- [ ] Opening a result shows the item modal; with the extension, the user can add it (any status,
      optional version), log a play, and rate it.
- [ ] After adding, the game shows as a collection item without a page reload.
- [ ] Loading, empty, error (with Retry) and "hidden by filters" states render as specified.
- [ ] New pure functions have unit tests; lint, tests and build pass.

## Future work

- Images: build image URLs from the extension's `rep_imageid`, or fetch thumbnails via
  `bggGetThingsXml` for visible results (batch ids, cached).
- Show BGG results below collection results (e.g. a "Search BoardGameGeek" button) even when the
  collection has matches.
- Exact-match search (`exact=1`) when the query is quoted.
- WebMCP `search_bgg` tool (`lib/hooks/use…Tool` + `McpTools`).
- Batch add from BGG results (reuse PRD 007's selection mode and `BatchAddButton`).
