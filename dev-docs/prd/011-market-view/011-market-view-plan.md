# 011 Market View — Implementation Plan

## Overview

Add a Market tab to the collection page that shows the user's BGG Marketplace listings.
Data is loaded via the `marketLoad` extension message, persisted in IndexedDB, and stored in
Redux. A new collection filter lets users see which owned games are (or aren't) listed for sale.

---

## Step 1 — Fix and extend market types

**File:** `src/app/lib/types/market.ts`

The existing type has several mismatches with the real API response in `sampleData/product.json`:

- `GeekMarketRawProductVersion.descriptors` has `{ name, value }` but JSON uses `{ name, displayValue }`
- `GeekMarketRawProductVersion.imagesets` is lowercase, JSON uses `imageSets`
- `GeekMarketProduct` is missing: `productstate`, `itemlocation`, `itemlocation_code`, `objectlink`, `linkeduser`, `images`

Actions:
- Rename `GeekMarketProductVersionDescriptor.value` → `displayValue`
- Rename `imagesets` → `imageSets` in `GeekMarketRawProductVersion`
- Add `productstate`, `itemlocation`, `itemlocation_code`, `images` fields to `GeekMarketProduct`
- Add minimal `GeekMarketObjectLink` type for `objectlink` (needs `id`, `name`, `href`)
- Export a `GeekMarketProductMap` type: `Record<string, GeekMarketProduct>` (keyed by `productid`)

---

## Step 2 — Add market persistence to the database

**File:** `src/app/lib/database/database.ts`

- Add `MarketEntity = { id: string; value: GeekMarketProduct[] }` type
- Add `markets: EntityTable<MarketEntity, 'id'>` to the Dexie instance
- Add version 7 migration: `{ ...(version 6 tables), markets: '++id' }`
- Add helpers:
  - `getMarket(id: string): Promise<GeekMarketProduct[] | undefined>`
  - `setMarket(id: string, value: GeekMarketProduct[]): Promise<void>`

---

## Step 3 — Redux slice for market listings

**New files:**
- `src/app/lib/redux/bgg/market/slice.ts`
- `src/app/lib/redux/bgg/market/selectors.ts`

### `slice.ts`

```
type MarketSliceState = {
    users: Record<string, GeekMarketProduct[]>;
};
```

Actions:
- `setMarketListings({ username: string; products: GeekMarketProduct[] })` — replaces all listings for a user
- `clearMarketListings({ username: string })` — removes a user's listings

### `selectors.ts`

- `selectMarketListings([state, username]): GeekMarketProduct[]` — returns user's listings (empty array default)
- `selectMarketObjectIds([state, username]): Set<string>` — returns a Set of `objectid` strings for fast "is listed" lookup

Both selectors receive state as a tuple `[state, username]` per the project's `proxy-memoize` convention.

### Wire into `bggSlice.ts`

**File:** `src/app/lib/redux/bgg/bggSlice.ts`

Add `market: marketReducer` to the `combineReducers` call.

---

## Step 4 — Game adapters for market listings

**File:** `src/app/lib/utils/gameAdapters.ts`

Add two new adapter functions:

- `geekMarketProductToGame(product: GeekMarketProduct): Game`
  - `id`: `Number(product.objectid)`
  - `name`: `product.version.name`
  - `pageUrl`: `https://boardgamegeek.com${product.producthref}`
  - `thumbnailUrl`: `product.version.imageSets?.square100?.src ?? product.imagesets?.square100?.src`
  - `imageUrl`: same source, prefer higher res

- `geekMarketProductToVersion(product: GeekMarketProduct): Version`
  - `versionId`: `Number(product.version.id)`
  - `name`: `product.version.name`
  - `pageUrl`: `https://boardgamegeek.com${product.version.href ?? ''}`
  - `thumbnailUrl`: `product.version.imageSets?.square100?.src`
  - `published`: year from `product.version.descriptors.find(d => d.name === 'yearpublished')?.displayValue`

---

## Step 5 — Handle `marketLoad` response in ExtensionMessagingProvider

**File:** `src/app/lib/extension/ExtensionMessagingProvider.tsx`

In the `messageHandler`, after the existing collection-item update logic, add a branch:

```
if (detail.type === 'marketLoad-response' && Array.isArray(detail.response?.products)) {
    const products = detail.response.products as GeekMarketProduct[];
    dispatch(setMarketListings({ username, products }));
    setMarket(username, products).then();
}
```

Also add `DocumentMessageMarketLoadDetail` to `messageTypes.ts`:
```
export type DocumentMessageMarketLoadDetail = BaseDocumentMessageDetail & {
    userId: string;
};
```
And add it to the `OneOf<>` union in `DocumentMessageSourceDetail`.

---

## Step 6 — `useMarketData` hook

**New file:** `src/app/lib/hooks/useMarketData.ts`

Responsibilities:
1. On mount (when `username` is available): read from Dexie via `getMarket(username)`
   - If found: dispatch `setMarketListings` to populate Redux
   - If not found: dispatch `marketLoad` extension message with `{ type: 'marketLoad', userId }`
2. Expose `loadMarket()` function that dispatches the `marketLoad` message unconditionally (for refresh)
3. Return `{ products, isLoading, loadMarket }`

```typescript
// Rough shape
export const useMarketData = () => {
    const dispatch = useDispatch();
    const { dispatchExtensionMessage } = useExtensionMessaging();
    const username = useSelector((state: RootState) => state.bgg.user?.user);
    const userId = useSelector((state: RootState) => state.bgg.user?.id);
    const products = useSelector((state: RootState) =>
        username ? selectMarketListings([state, username]) : []
    );
    const [isLoading, setIsLoading] = useState(false);

    const loadMarket = useCallback(() => {
        if (!userId) { return; }
        setIsLoading(true);
        dispatchExtensionMessage({ type: 'marketLoad', userId })
            ?.then(() => setIsLoading(false));
    }, [userId, dispatchExtensionMessage]);

    useEffect(() => {
        if (!username || products.length > 0) { return; }
        let active = true;
        getMarket(username).then(stored => {
            if (!active) { return; }
            if (stored?.length) {
                dispatch(setMarketListings({ username, products: stored }));
            } else {
                loadMarket();
            }
        });
        return () => { active = false; };
    }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

    return { products, isLoading, loadMarket };
};
```

Note: `isLoading` also goes to `false` when `products` becomes non-empty (via a `useEffect` watching `products.length`).

---

## Step 7 — Add MARKET tab to collection page

**File:** `src/app/lib/hooks/useActiveCollectionTab.ts`

Add `MARKET: 'market'` to the `CollectionTabs` const and `CollectionTab` type.
Update `readStoredTab` to accept `'market'` as a valid stored value.
Update keyboard navigation in `collection/page.tsx` to cycle through three tabs.

---

## Step 8 — Create `MarketContent` UI component

**New file:** `src/app/ui/games/MarketContent.tsx`

Props:
```typescript
type MarketContentProps = {
    products: GeekMarketProduct[];
    isLoading: boolean;
    onRefresh: () => void;
    syncOn: boolean;
};
```

Behavior:
- If `!syncOn`: render a prompt explaining the extension is needed to load market data
- If `syncOn && isLoading`: render a loading spinner
- If `syncOn && !isLoading && products.length === 0`: render empty-state message
- Otherwise: render a list/grid of market listing cards

Each listing card displays (re-using existing card components where possible):
- Game thumbnail (from `version.imageSets.square100`)
- Game name (from `version.name`)
- Price: `${product.currencysymbol}${product.price}`
- Condition: `product.prettycondition`
- Listed date: formatted `product.listdate`
- Link to the BGG marketplace listing via `product.producthref`

Include a refresh button (with `FaArrowsRotate`) next to the tab heading that calls `onRefresh`.

---

## Step 9 — Add "In Marketplace" filter to collection All Games view

**File:** `src/app/lib/hooks/useCollectionFilters.ts`

- Add `MarketFilter = 'default' | 'inMarket' | 'notInMarket'` type
- Add `market: MarketFilter` to `CollectionFilters` and `DEFAULT_FILTERS`
- The `makeFilterFn` already receives `scannedSet` and `verifiedSet`; extend its signature to also accept `marketObjectIds: Set<string> | undefined`
- When `marketObjectIds` is defined and `filters.market !== 'default'`:
  - `'inMarket'`: include item only if `marketObjectIds.has(String(item.objectId))`
  - `'notInMarket'`: include item only if `!marketObjectIds.has(String(item.objectId))`
- Add the filter control to the filter panel UI in `AllGamesContent` (only render when `marketObjectIds` is non-empty)

---

## Step 10 — Wire everything into the collection page

**File:** `src/app/(overview)/collection/page.tsx`

- Call `useMarketData()` at the top of `CollectionPage`
- Pass `marketObjectIds` (derived from `selectMarketObjectIds`) to `makeFilterFn` and the filter UI
- Add the MARKET tab button with keyboard navigation (ArrowLeft/ArrowRight cycling through all three tabs)
- Render `<MarketContent>` in the MARKET tab panel, passing `products`, `isLoading`, `onRefresh: loadMarket`, `syncOn`
- The tab `stickyTop` sentinel should also activate on the MARKET tab when loading is complete

---

## Step 11 — Tests

**New/updated test files:**
- `tests/lib/redux/bgg/market/slice.test.ts` — test `setMarketListings` and `clearMarketListings`
- `tests/lib/redux/bgg/market/selectors.test.ts` — test `selectMarketListings` and `selectMarketObjectIds`
- `tests/lib/utils/gameAdapters.test.ts` — add cases for `geekMarketProductToGame` and `geekMarketProductToVersion` using the sample data from `sampleData/product.json`

---

## Dependency order

```
Step 1 (types)
  → Step 2 (DB)
  → Step 3 (Redux slice)       ← depends on Step 1
  → Step 4 (adapters)          ← depends on Step 1
  → Step 5 (extension handler) ← depends on Steps 1, 3
  → Step 6 (useMarketData)     ← depends on Steps 2, 3, 5
  → Step 7 (tab constant)
  → Step 8 (MarketContent UI)  ← depends on Steps 1, 4, 6
  → Step 9 (filter)            ← depends on Steps 1, 3
  → Step 10 (page wiring)      ← depends on Steps 6, 7, 8, 9
  → Step 11 (tests)            ← depends on Steps 1–4
```

Steps 1–4 can largely be done in parallel. Step 5 unblocks Steps 6 and 8.
Steps 7 and 9 are independent of each other and can be done alongside Step 8.
