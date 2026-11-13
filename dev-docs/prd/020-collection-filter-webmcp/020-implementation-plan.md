# 020 Collection Filtering WebMCP Tool — Implementation Plan

Parent spec: [020-collection-filter-webmcp.md](./020-collection-filter-webmcp.md)

## Goal

Let an agent:

1. **Ask questions about the user's collection** ("how many games do I own that play with 2 players?")
   by filtering, sorting and summarising it, **without touching what the user sees**.
2. **Change the collection view** — filters, sort, games/expansions toggle — **only when it asks to**.

## Where things stand

- `src/app/lib/hooks/webmcp/useCollectionFilterTool.ts` is a staged stub. It calls
  `useCollectionFilters()`, `useCollectionData()` and `useAllGamesFilter()` and registers nothing. It is
  not wired into `McpToolsProvider`.
- The stub can't be finished as written:
  - **`useCollectionFilters()` owns its own `useState`.** A second instance in the tool has filter state
    separate from the page's, so it can't read or change the displayed view.
  - **That hook also has a side effect.** An effect rewrites the URL (`history.replaceState`) and
    `localStorage['collection-filters']` whenever its filters change. A query tool running it on every page
    would overwrite the URL and the user's saved view. That breaks the "don't change the view" requirement.
  - **`useCollectionData()` carries the page's load and refresh machinery.** On mount it reloads the
    collection from Dexie into Redux, on whatever page the tool is mounted.
- **The filter logic is trapped in the hook.** `makeFilterFn` closes over hook state, and the sort
  comparators live inside `useAllGamesFilter`. Neither can be called with arbitrary filters.
- **The collection is only in Redux after the collection page has loaded it** (or after
  `load_bgg_collection` runs). On the scanner page, Redux can be empty even though Dexie has the collection.
- **Player count and play time aren't parsed.** The collection request already sends `stats=1`, and BGG
  returns `<stats minplayers maxplayers minplaytime maxplaytime playingtime numowned>` (the test fixture
  in `tests/services/bgg/service.test.ts` has it). `parseCollectionXml` only reads the rating. The PRD's
  own example question can't be answered until this is fixed.

## Design

### Three tools, split by side effect

| Tool | Registered | Read-only | Purpose |
|---|---|---|---|
| `query_bgg_collection` | Always (`McpTools`) | Yes | Filter, sort and summarise the active user's collection with filters the agent provides. Never reads or writes view state. |
| `get_collection_view` | Only while a collection page is mounted | Yes | Return the filters, sort, games/expansions mode and visible count the user is looking at right now. |
| `set_collection_view` | Only while a collection page is mounted | No | Apply filters/sort/mode to the displayed collection. |

Why split them:

- **The `readOnlyHint` annotation stays honest.** Agents and hosts can call the query tool freely and gate
  the write tool, and the PRD's "only when requested" rule is enforced by which tool exists, not by a flag
  the agent might set wrong.
- **The view tools only exist when there's a view.** Registering them from `CollectionPageContent`
  (`/collection`, `/swap`, `/trade`, `/math-trade/[id]`) gives them the page's live
  `useCollectionFilters` / `useAllGamesFilter` instances, with no new provider or shared state. When the
  user leaves the page, `useMcpTool` unregisters them on unmount.
- An off-page fallback (navigate to `/collection?<filters>`) is listed under Follow-ups. It isn't needed
  for the first version.

### One filter vocabulary: `CollectionFilters`

Both tools accept the same input shape, and it maps 1:1 onto the existing `CollectionFilters` type, the
URL query parameters and saved presets. Each option's enum values are the UI's own (`own`, `prevowned`,
`fortrade`, …). `'default'` is expressed by leaving the field out. Numbers are numbers in the schema and
are converted to the strings `CollectionFilters` stores.

```ts
// lib/utils/collectionQuery.ts (shape only)
const CollectionFilterInput = z.object({
    ownership: z.enum(['own', 'prevowned', 'notowned']).optional(),
    trade: z.enum(['fortrade', 'nottrade']).optional(),
    want: z.enum(['want', 'wanttoplay', 'wanttobuy']).optional(),
    wishlist: z.enum(['wishlist', 'notwishlist']).optional(),
    wishlistPriority: z.number().int().min(1).max(5).optional(),
    preorder: z.enum(['preordered', 'notpreordered']).optional(),
    condition: z.enum(['has', 'not']).optional(),        // has a trade condition text
    version: z.enum(['versioned', 'notversioned']).optional(),
    scan: z.enum(['scanned', 'notscanned']).optional(),
    verification: z.enum(['verified', 'notverified']).optional(),
    rating: z.object({ rated: z.boolean(), source: z.enum(['user', 'average']).optional(),
                       min: z.number().optional(), max: z.number().optional() }).optional(),
    plays: z.object({ played: z.boolean(), min: z.number().int().optional(),
                      max: z.number().int().optional() }).optional(),
    players: z.number().int().min(1).optional(),         // NEW: minPlayers <= n <= maxPlayers
    maxPlayTime: z.number().int().min(1).optional(),     // NEW: playingTime <= n minutes
    search: z.object({ text: z.string(), mode: z.enum(['all', 'name', 'version', 'tags']).optional() }).optional(),
    tags: z.array(z.string()).optional(),                // sugar: AND-ed, `!tag` negates; merged into search
    subType: z.enum(['boardgame', 'boardgameexpansion']).optional(), // the games/expansions toggle
});
```

Every field's `.describe()` text explains the semantics in plain words, e.g. "`ownership: 'notowned'`
means neither owned nor previously owned". Agents rely on these descriptions.

Player count and play time are added to `CollectionFilters` as well (not just to the tool), so that
`set_collection_view` can show the same result in the UI that `query_bgg_collection` computed, and a
player-count filter can be saved in a preset or a link.

## Phases

Each phase can ship on its own.

### Phase 1 — Pure filter and sort logic (refactor, no behaviour change)

Move the logic out of the hooks so a tool can call it with any filters.

- **New `src/app/lib/utils/collectionFilters.ts`:**
  - `DEFAULT_FILTERS`, `FILTER_KEYS`, `getSerializableFilters`, `getPresetFilters`, `parseTagFilter`,
    `parseUnifiedSearch` (and its types), moved from `useCollectionFilters.ts`. Keep the hook's
    re-exports of the types so imports elsewhere don't churn, or update the imports, whichever touches
    fewer files.
  - `createCollectionFilterFn(filters, context, options?)`, where
    `context = { scannedSet, verifiedSet, tagMap }`: the body of today's `makeFilterFn`, unchanged.
  - `hasActiveFilters(filters)`: the boolean currently in the hook's `useMemo`.
- **`useCollectionFilters.makeFilterFn`** becomes a `useCallback` that delegates to
  `createCollectionFilterFn(filters, …)`.
- **New `src/app/lib/utils/collectionSort.ts`:**
  - Move the `AllGamesSortField` type from `ui/games/AllGamesContent.tsx` here. `AllGamesContent`
    imports it back, and a lib hook no longer imports from `ui/`.
  - `getCollectionSortFields(lastScannedMap)` returns the `SortFieldDef[]` now built inside
    `useAllGamesFilter`. `modifiedOrAcquired` moves with it.
  - `sortCollection(items, field, direction, sortFields)`, the comparator application from
    `useFilterSort`.
- **New `src/app/lib/utils/scanSets.ts`:** `getScannedSets(scanHistory)` returns
  `{ scannedSet, verifiedSet }`, replacing the two `useMemo` loops in `useAllGamesFilter`.
- **Tests** (`tests/utils/collectionFilters.test.ts`, `tests/utils/collectionSort.test.ts`): one case
  per filter dimension, both directions, rating/plays ranges, tag negation, and the
  `ignoreNameSearch` option. `parseUnifiedSearch.test.ts` keeps passing where it is.

**Done when:** `pnpm test`, `pnpm lint` and `pnpm build` pass, and the collection page filters and sorts
exactly as before.

### Phase 2 — Player count and play time data

- **`BggCollectionItem`** (`lib/types/bgg.ts`): add `minPlayers?`, `maxPlayers?`, `minPlayTime?`,
  `maxPlayTime?`, `playingTime?` (all `number`).
- **`parseCollectionXml`** (`lib/services/bgg/service.ts`): read them from the `stats` element's
  attributes. Treat `0` as unknown, since BGG uses `0` for "not set".
- **Existing stored collections** don't have these fields until they're refreshed. Don't migrate them;
  the query tool reports how many matched items lack player data (see Phase 3), and the agent can call
  `load_bgg_collection` to refresh.
- **`CollectionFilters`:** add `players: ''` and `maxPlayTime: ''` (strings, like `ratingMin`), handled
  in `createCollectionFilterFn`, `hasActiveFilters` and `getSerializableFilters`.
  - Items with unknown player counts **don't match** a `players` filter. They're listed separately in the
    query result rather than silently counted either way.
- **UI:** a compact number input for "Plays with N players" and "Max play time" in the filter panel,
  next to the existing rating/plays range controls. Locate the exact spot under
  `ui/games/filters/` / `CollectionControls.tsx` when building it. Without visible controls, a view
  filter set by an agent would be invisible to the user and impossible to clear except by
  "Reset". `resetFilters` clears them like any other filter.
- **Tests:** extend `tests/services/bgg/service.test.ts` (the fixture already has the `stats`
  attributes) and add the new filter cases to `collectionFilters.test.ts`.

### Phase 3 — `query_bgg_collection` (read-only)

Rewrite `useCollectionFilterTool.ts` as **`useCollectionQueryTool.ts`**, registered in `McpTools`.

- **The hook does not call** `useCollectionFilters`, `useCollectionData` or `useAllGamesFilter`, for the
  side-effect reasons above. It reads only:
  - `state.bgg.user.user` (`useSelector`)
  - the active user's collection items from Redux
  - `selectTagMap`
  - `scanHistory` / `lastScannedMap` from `useScanHistory()`
- **Collection availability**, in the handler:
  - No user → `isError` with "Load a collection first with `load_bgg_collection`".
  - Redux has no items for the user → read `getCollection(username)` from Dexie, dispatch
    `updateCollectionItems`, and continue. Put this in a small `lib/services/bgg/` helper so the page
    and the tool share it, rather than reaching into `useCollectionData`.
  - Still empty → `isError` explaining that the collection is empty or not loaded.
- **Input:** `CollectionFilterInput` (above), plus:
  - `sort?: { field: AllGamesSortField; direction?: 'asc' | 'desc' }` (default `name` / `asc`)
  - `limit?: number` (default 25, max 200; `0` = summary only)
  - `offset?: number` (paging)
  - `fields?: ('statuses' | 'rating' | 'plays' | 'players' | 'playTime' | 'version' | 'tags' | 'tradeCondition' | 'comment')[]`
    — extra per-item fields. The defaults are `objectId`, `collectionId`, `name`, `yearPublished` and
    `subType`, which keeps answers token-cheap.
- **Pure core**, in `lib/utils/collectionQuery.ts`, so it can be unit-tested without React:
  - `toCollectionFilters(input)` → `{ filters: CollectionFilters, subType }`. It merges `tags` into
    `search` with a `tags:` prefix (keeping any name/version text), and folds `wishlistPriority` in only
    when a `wishlist` filter is set, matching the UI rule.
  - `runCollectionQuery(items, input, context)` → `{ total, games, expansions, statuses, missingPlayerData, items }`.
    The status counts come from `summarizeCollection` applied to the *filtered* set.
- **Output:**
  - `structuredContent`: the full result, plus the normalised `filters` that were applied. The agent can
    pass these straight to `set_collection_view`.
  - `content`: a one-line answer first ("37 owned games play with 2 players (12 owned items have no
    player-count data — refresh with load_bgg_collection)"), then the item list.
  - `annotations: { readOnlyHint: true, untrustedContentHint: true }`. Names, comments and tags are
    user-entered text from BGG.
- **Delete** the stub `useCollectionFilterTool.ts`, or rename it if git history matters.
- **Tests:**
  - `tests/utils/collectionQuery.test.ts`: input→filters mapping, tag sugar, paging bounds, summary
    counts, `missingPlayerData`.
  - `tests/hooks/webmcp/useCollectionQueryTool.test.tsx`, following the `WebMCPProvider` + polyfill
    pattern in `useSetTagsTool.test.tsx`: the registered schema, the no-user error, and a query against
    a seeded store.

### Phase 4 — `get_collection_view` and `set_collection_view`

Registered from **`CollectionPageContent`** through a `useCollectionViewTools({ collectionFilters, allGames, activeTab, setActiveTab })`
hook in `lib/hooks/webmcp/`. The tools only exist while a collection page is mounted.

- **Small additions to the existing hooks:**
  - `useCollectionFilters`: `replaceFilters(next: CollectionFilters)`, a single `setFilters` call so an
    agent's change is one render and one URL write, not N.
  - `useFilterSort`: `setSort(field, direction)`. `handleSortClick` only toggles.
  - `useAllGamesFilter`: expose `setGamesAndExpansionsMode`. Map `subType` ↔ mode with the existing
    `GamesAndExpansionsModeSubTypes`.
- **`get_collection_view`** (read-only) returns:
  - the current filters, in the same input vocabulary as `query_bgg_collection`
  - the sort, the games/expansions mode and the active tab
  - `displayItems.length`
  - the first N visible names (`limit`, default 25)
  - the trade mode from `useTradeMode()`, when it's set
- **`set_collection_view`** (`readOnlyHint: false`):
  - Input: `CollectionFilterInput`, plus `sort?` and `mode: 'replace' | 'merge'` (default `replace`).
    `replace` starts from `DEFAULT_FILTERS` but keeps the user's search text unless `search` is given,
    like `loadFilterPreset`. `merge` overlays the given fields. A `reset: true` shortcut calls
    `resetFilters` + `resetGamesAndExpansionsMode`.
  - Switches to the All Games tab when it isn't active, since the filters act on that tab's list.
  - Returns the same payload as `get_collection_view` after the change. Because state updates are
    async, compute it from the *applied* filters with `runCollectionQuery` rather than reading
    `displayItems` in the same tick.
  - The existing `useCollectionFilters` effect handles the URL and `localStorage` update, so the agent's
    view is linkable and survives a reload.
- **Tests:** the mapping and reset logic live in `collectionQuery.ts` and are covered there. Add one
  hook test that the tools appear when `useCollectionViewTools` mounts and disappear on unmount.

### Phase 5 — Docs and verification

- **`docs/webmcp-tools.md`:** a new "Collection queries and view" section with the three tools. Update
  the tool count (15 → 18) and say that the view tools only appear on collection pages.
- **`CLAUDE.md`'s key files table:** add `lib/utils/collectionFilters.ts`, since `useCollectionFilters`
  is no longer where the filter logic lives.
- **Manual check** with the webmcp-server MCP bridge (`/mcp`), on a loaded collection:
  - From the **scanner page**: `query_bgg_collection { ownership: 'own', subType: 'boardgame', players: 2, limit: 0 }`
    returns a count, and the URL and `localStorage['collection-filters']` are unchanged.
  - `get_collection_view` / `set_collection_view` are **absent** on the scanner page and **present** on
    `/collection`.
  - On `/collection`: `set_collection_view` with the filters from a query result shows the same count in
    the UI, the URL gains the query params, and Reset clears everything including `players`.
  - A collection stored before Phase 2 reports `missingPlayerData`. After `load_bgg_collection`, the
    count drops to ~0.

## Out of scope

- **The "best at N players" community poll** (BGG `thing` API `suggested_numplayers`). It needs a
  per-game thing fetch and is not in collection XML. Users can already tag `#best-at=2`, which the tags
  filter handles.
- **Weight/complexity, categories, mechanics, designers.** These aren't in collection XML either. They'd
  need a thing-data cache and are a natural PRD 021.
- **The Not-in-Collection tab** as a view target. `set_collection_view` acts on All Games only.
- **Saving, renaming or deleting filter presets via MCP.** The current preset functions use
  `window.prompt`, so they'd need refactoring first.

## Follow-ups / open questions

1. **Off-page `set_collection_view`.** It could always be registered and, when no collection page is
   mounted, `router.push('/collection?' + params)` after writing the sort keys to localStorage. This
   needs a small context so the page can claim the tool. Worth it only if agents commonly start from the
   scanner page.
   DON'T IMPLEMENT
2. **Server-side aggregation.** For large collections (thousands of items), consider a `groupBy` input
   (e.g. counts per `players`, per `yearPublished` decade) so agents don't page through items to answer
   distribution questions.
   IMPLEMENT GROUP BY
3. **Naming.** `query_bgg_collection` matches the `*_bgg_collection` family. The view tools say
   `collection_view` because they act on ShelfScan's UI, not BGG.
   NAME AS SUGGESTED