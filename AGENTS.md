# AGENT.md — ShelfScan Project Guide

## Project Overview

ShelfScan is a **board game UPC barcode scanner** web application. Users scan board game barcodes (via webcam/phone camera), look up game data through the [GameUPC API](https://gameupc.com), and interact with [BoardGameGeek (BGG)](https://boardgamegeek.com). A companion browser extension (Chrome, Edge, Firefox, Safari; source in the sibling `shelfscan-extension` repo) enables additional actions like adding games to a BGG collection, logging plays, rating, posting to the BGG GeekMarket, and adding items to math-trade geeklists.

Beyond scanning, the app covers collection browsing and filtering, batch add, and **math trades** — OLWLG geeklists (`/math-trade`), Swaptagon (`/swap`, `/swapscan`) and Atlas Realms / trade exports (`/trade`, `/tradescan`), plus step-by-step workflow guides under `/workflows` (see also `docs/Workflows.md`).

**Live site:** https://shelfscan.io

---

## Tech Stack

| Layer | Technology | Version (approx) |
|---|---|---|
| Framework | **Next.js** (App Router) | 16.x |
| Language | **TypeScript** | 6.x |
| UI | **React** | 19.3 |
| Styling | **Tailwind CSS** v4 + **DaisyUI** v5 | 4.2 / 5.5 |
| State (global) | **Redux Toolkit** (`@reduxjs/toolkit`) + `react-redux` | 2.x / 9.x |
| State (local) | React Context providers (many) | — |
| Client DB | **Dexie** (IndexedDB wrapper) | 4.x |
| Barcode scanning | `@react-barcode-scanner/components`, `@undecaf/zbar-wasm` | custom / 0.11 |
| Animation | `motion` (Framer Motion successor) | 12.x |
| Validation | **Zod** v4 | 4.x |
| Analytics | `@vercel/analytics` + **PostHog** (`posthog-js`, init in `instrumentation-client.ts`) | 2.x / 1.x |
| Tours | `nextstepjs` | 2.x |
| Package manager | **pnpm** | — |
| Deployment | **Vercel** | — |
| Linting | ESLint 10 + `eslint-config-next` (flat config); React Doctor via `pnpm doctor` | 10.x |
| PostCSS | `@tailwindcss/postcss` | 4.x |

---

## Build & Run Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (next dev)
pnpm build            # Production build (next build) — used by Vercel
pnpm start            # Start production server (next start)
pnpm lint             # Run ESLint (pnpm exec eslint .)
pnpm test             # Run tests once (vitest run)
pnpm test:watch       # Run tests in watch mode (vitest)
pnpm test:coverage    # Run tests with coverage (vitest run --coverage)
pnpm doctor           # React Doctor scan (npx react-doctor@latest)
```

Requires **Node 24.x** (`.nvmrc`, `engines`) and **pnpm 12** (`packageManager`).

**Test suite**: Vitest with jsdom environment. Tests live in `tests/` (mirrors `src/` structure). All test files import testing primitives from `tests/setup.ts` (re-exports `describe`, `it`, `expect`, `vi`, etc. from vitest — swap runner by changing only that file). Config: `vitest.config.mts`.

---

## Environment Variables

Defined in `.env` (local) and Vercel environment settings (production):

| Variable | Purpose |
|---|---|
| `BGG_TOKEN` | Bearer token for authenticated BGG XML API v2 requests (server-side only) |
| `GAMEUPC_TOKEN` | API key for GameUPC API requests (server-side only, sent as `x-api-key` header) |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | PostHog project token (client) |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog ingestion host (reverse proxy, `https://rpt.shelfscan.io`) |
| `NEXT_PUBLIC_POSTHOG_UI_HOST` | PostHog UI host |

`BGG_TOKEN` and `GAMEUPC_TOKEN` are used exclusively in **Server Actions** (`src/app/lib/actions.ts`, `gameupc-hooks/server`) and are never exposed to the client. The PostHog variables are read by `instrumentation-client.ts`; in development it **throws** if the token or host is missing. See `.env.example`.

---

## Project Structure

```
shelfscan/
├── public/                    # Static assets (images, favicons, sounds, videos, extension .xpi)
├── patches/                   # pnpm patch for @undecaf/barcode-detector-polyfill
├── assets/                    # Source design files and blog drafts (not deployed)
├── docs/                      # User-facing docs (Workflows.md, extension privacy policy)
├── dev-docs/                  # Product requirement docs
├── instrumentation-client.ts  # PostHog client init
├── pnpm-workspace.yaml        # pnpm overrides, patches, allowed builds, supply-chain policy
├── src/
│   ├── userscripts/           # Userscripts importing ShelfScan exports into Swaptagon / Atlas Realms
│   └── app/                   # Next.js App Router root
│       ├── layout.tsx         # Root layout (Server Component) — fonts, metadata, global chrome
│       ├── globals.css        # Global styles (Tailwind v4, DaisyUI plugin, custom variants)
│       ├── Provider.tsx       # Redux <Provider> wrapper (client component)
│       ├── (overview)/        # Route group — the main app shell
│       │   ├── layout.tsx     # Client layout — context providers, SubscribeBanner, ExtensionNotice
│       │   ├── page.tsx       # Home / scanner page
│       │   ├── loading.tsx    # Suspense loading fallback (pages stream; redirect() is streamed)
│       │   ├── upc/[id]/      # /upc/:id — single UPC detail page (async Server Component)
│       │   ├── collection/    # /collection — BGG collection viewer ─┐
│       │   ├── math-trade/    # /math-trade, /math-trade/:geeklistId  ├─ all render ui/CollectionPageContent
│       │   ├── swap/ trade/   # /swap, /trade — Swaptagon / trade   ─┘
│       │   ├── batch/         # /batch — batch-add games ─┐
│       │   ├── swapscan/      # /swapscan               ├─ all render ui/batch/BatchView
│       │   ├── tradescan/     # /tradescan             ─┘
│       │   ├── workflows/     # /workflows, /workflows/trades, /workflows/trades/:type
│       │   ├── data-builder/  # /data-builder — experimental BPMN form builder
│       │   ├── extension/ subscribe/ why-subscribe/ support/ why-support/ alternate/
│       │   └── about/ privacy/
│       ├── lib/               # Shared logic (non-UI)
│       │   ├── actions.ts     # Next.js Server Actions (BGG API proxy)
│       │   ├── utils.ts       # Fetch-with-retry helper, string helpers
│       │   ├── constants.ts
│       │   ├── *Provider.tsx  # Codes, GameSelections, GameUPCData, NextStep, PluginMap,
│       │   │                  #   ScanHistory, SelectVersion, Settings, Tailwind providers
│       │   ├── *Context.ts    # Exported contexts kept out of component files
│       │   │                  #   (PluginMapContext, SelectVersionContext, SettingsContext)
│       │   ├── database/      # Dexie IndexedDB schemas & helpers
│       │   │   ├── database.ts      # Main DB (settings, plugins, collections, scanned,
│       │   │   │                    #   dataforms, scanHistory, filters)
│       │   │   └── cacheDatabase.ts # Cache DB (images, responses)
│       │   ├── extension/     # Browser extension bridge
│       │   │   ├── ExtensionMessagingProvider.tsx  # postMessage bridge (origin-checked)
│       │   │   ├── SyncProvider.tsx / SyncContext.ts / useSync.ts  # extension + subscription status
│       │   │   ├── PlayDataProvider.tsx            # players / locations / play data for play logging
│       │   │   ├── useExtension.tsx                # per-game extension actions & mode forms
│       │   │   ├── ExtPay.browser.js               # ExtensionPay port for plain web pages
│       │   │   └── messageTypes.ts, types.ts, useBatchSync.ts, useRating.ts, utils.tsx, version.ts
│       │   ├── hooks/         # Custom React hooks (useSelectVersion, useTradeMode, useCachedImage,
│       │   │                  #   useCollectionFilters, useOLWLGMathTrade, useMathTrade, ...)
│       │   ├── plugins/       # Plugin system (plugins.ts built-ins + example JSON definitions)
│       │   ├── redux/         # Redux store, slices
│       │   │   ├── store.ts   # configureStore({ bgg, swap }) + type exports
│       │   │   ├── bgg/       # BGG feature reducers
│       │   │   │   ├── bggSlice.ts            # combineReducers(user, collection, geeklist)
│       │   │   │   ├── user/                  # slice + selectors
│       │   │   │   ├── collection/            # slice + selectors
│       │   │   │   └── geeklist/slice.ts      # math-trade geeklists & matching
│       │   │   └── swap/slice.ts              # per-item swap/trade export data
│       │   ├── services/bgg/  # BGG XML API parsing
│       │   ├── types/         # TypeScript type definitions (bgg, game, geeklist, trade, workflows, ...)
│       │   ├── workers/       # Web workers (dbBackupWorker — backup PNG encode/decode)
│       │   └── utils/         # Pure utility functions
│       │       ├── fetchQueue.ts     # p-queue throttle wrapper — use enqueueFetch() for API calls
│       │       ├── gameAdapters.ts   # Adapters between BGG/GameUPC types and internal Game/Version types
│       │       ├── gameSelection.ts  # resolveGameSelection() — current info/version for a UPC
│       │       ├── scanHistory.ts    # findRecentDuplicate() — 5-minute duplicate window
│       │       ├── dbBackup.ts, backupCodec.ts  # backup/restore
│       │       ├── swapExport.ts, trade.ts, mathTradeFormat.ts, condition.ts, rating.ts
│       │       └── array, image, size, transforms, xml, object, bggImageId, formKeyTransform
│       └── ui/                # React UI components
│           ├── Scanner.tsx    # Barcode scanner component
│           ├── NavDrawer.tsx  # Navigation drawer (+ Settings and Tours dialogs)
│           ├── CollectionPageContent.tsx  # Collection / swap / trade / math-trade page body
│           ├── CollapsibleList.tsx        # Game/version picker list
│           ├── DismissibleToast.tsx       # Click/keyboard-dismissible toast
│           ├── DataBuilder.tsx  # BPMN form builder UI (@bpmn-io/form-js)
│           ├── ScanToasts.tsx   # Toast notifications for scan events
│           ├── games/         # Game display components (Scanlist, GameDetails, SelectVersion, Thumbnail,
│           │                  #   CollectionGameDetails, CollectionItemModal, CollectionControls,
│           │                  #   SwapSection, MathTradeSection, ListGame, ListGameRow, renderers, ...)
│           ├── batch/         # BatchView, BatchAddButton, SwapAddButton
│           ├── settings/      # Settings management UI
│           ├── extension/     # Extension-related UI (mode forms, play logging, ratings)
│           ├── forms/         # Form input components
│           ├── workflows/     # Workflow guide sections + math-trades/ per-platform guides
│           ├── tours/         # nextstepjs tour definitions + step content components
│           ├── tour/          # Tour card component
│           ├── grids/ icons/
```

---

## Architecture & Key Patterns

### Next.js App Router
- Uses the **App Router** (not Pages Router). The root `layout.tsx` is a **Server Component**.
- The `(overview)` route group wraps the main app in a **client-side layout** that provides all context providers.
- The `/upc/[id]` and `/workflows/trades/[type]` routes use **async Server Component** pages with `params: Promise<{...}>` (Next.js 16 pattern). Validate params and `redirect()` on the server rather than redirecting from a client effect.
- **Server Actions** (`'use server'`) in `actions.ts` and `gameupc-hooks/server` proxy external API calls to keep tokens secret.

### State Management — Hybrid Approach
1. **Redux Toolkit** — Global state: `bgg` (user, collection, geeklist) and `swap` (swap/trade export data per item). Store created per-request via `makeStore()` pattern. Typed hooks exported from `lib/hooks/index.ts`. Keep state serializable (use arrays, not `Set`/`Map`).
2. **React Context** — Feature-specific state via provider components. Current nesting order in `(overview)/layout.tsx` (outermost → innermost): `Provider` (Redux) → `SettingsProvider` → `TailwindProvider` → `PluginMapProvider` → `CodesProvider` → `GameSelectionsProvider` → `GameUPCDataProvider` → `ScanHistoryProvider` → `NextStepProvider` → `SyncProvider` → `ExtensionMessagingProvider` → `PlayDataProvider`. Provider `value`s are memoized (`useMemo`/`useCallback`).
3. **Dexie (IndexedDB)** — Persistent client-side storage for settings, plugins, collections, scanned codes, data forms, scan history, saved filters, and cached images/responses. Two databases: `db` (main) and `cache`. Backup/restore: `lib/utils/dbBackup.ts`.

### Game Selection
- The chosen `[infoId, versionId]` for each UPC lives in `GameSelectionsProvider`; the scan list, batch add (`BatchAddButton`) and swap export (`SwapAddButton`) all read it.
- `useSelectVersion` derives the current info/version with `resolveGameSelection()` (`lib/utils/gameSelection.ts`): a stored selection wins; otherwise a lone info / lone version is auto-selected, and that auto-selection is written back to the store so batch add uses it too.
- Always update with functional updates (`setGameSelections(prev => ({ ...prev, [upc]: [...] }))`) — many providers write concurrently.

### Trade Modes
- `useTradeMode()` derives `isMathTrade` / `isSwap` / `isTrade` / `isBatchTrade` etc. from the pathname, so the same components (`CollectionPageContent`, `BatchView`, `SwapSection`, `MathTradeSection`) adapt per route.

### Barcode Scanning
- Uses `@react-barcode-scanner/components` (author's own library) which internally uses `@undecaf/zbar-wasm` for WASM-based barcode detection.
- A **pnpm patch** on `@undecaf/barcode-detector-polyfill@0.9.23` rewrites its CDN import of `zbar-wasm` to a local package import.
- `@undecaf/zbar-wasm` is listed in `serverExternalPackages` in `next.config.ts` to avoid bundling the WASM on the server.
- A pnpm **override** pins `@undecaf/zbar-wasm` to `^0.11.0` across all transitive dependencies.

### Plugin System
- Plugins are JSON-defined templates (built-in and user-managed) stored in Dexie.
- Templates use `{{mustache}}` syntax (via `@blakeembrey/template`) for URL generation.
- Plugins have `type` (e.g., `link`) and `location` (e.g., `details`, `actions`).
- Built-in plugins are defined inline in `plugins.ts`: enabled by default — BGG Link, BGG Collection Link; available but disabled by default — BGG Market, Board Game Stats, Board Record, Dust & Dice. Users enable/disable/add plugins under Settings → Installed Plugins.
- The `*.json` files in `src/app/lib/plugins/` (BGG, Board Game Stats, Dice Tower) are example definitions users can paste into Settings; they are not imported by the app.

### Styling
- **Tailwind CSS v4** with the `@tailwindcss/postcss` plugin (not the legacy PostCSS plugin).
- **DaisyUI v5** loaded as a Tailwind plugin via `@plugin 'daisyui'` in CSS.
- Custom CSS variants: `ios-safari` (for `-webkit-touch-callout` support detection), `xs` (max-width: 375px).
- Responsive breakpoint detection done programmatically via `TailwindProvider` (DOM element size probing), not just CSS.
- Three Google Fonts: Geist, Geist Mono, Share Tech.

### External APIs
1. **BoardGameGeek XML API v2** — Collection and user data. Requires `BGG_TOKEN`. Has retry logic for 202 "please wait" responses (up to 20 retries with 2s delay).
2. **GameUPC API** (`api.gameupc.com`) — UPC lookup, game matching, verification. Requires `GAMEUPC_TOKEN`. Falls back to test endpoint if token missing.

### Browser Extension
- Extension types, hooks, and context are in `src/app/lib/extension/`.
- The web app dispatches `shelfscan-sync` CustomEvents; the extension's content script forwards them to a hidden `boardgamegeek.com/404` iframe and replies via `postMessage`. **Always check `event.origin`** in `message` listeners (the page's own origin for the content script, `bggHost` for the iframe).
- `SyncProvider` / `useSync()` expose whether the extension is installed (`syncOn`) and subscription status; extension UI renders only when `syncOn && userId`, so it never renders on the server.
- `ExtensionMessagingProvider` provides `dispatchExtensionMessage`; `PlayDataProvider` holds players/locations for play logging. Consume via `useExtension`, `useSync`, `useBatchSync`, `useRating`, `usePlayData`.
- `ExtPay.browser.js` is ShelfScan's port of ExtensionPay for plain web pages; the extension reads its key from the page's `localStorage`.

### Scan History
- `ScanHistoryProvider` stores per-scan records (UPC, match status, game name, BGG ID, timestamps) in the main Dexie `db` under the `scanHistory` table.
- Cap: 20,000 entries; unmatched entries older than 30 days are pruned automatically.
- Duplicate suppression: same UPC within 5 minutes is treated as a duplicate (`findRecentDuplicate()` in `lib/utils/scanHistory.ts`). Entry timestamps are Unix **seconds** — convert `Date.now()` before comparing.
- Consume via `useScanHistory()` — exposes `scanHistory`, `lastScannedMap`, `upcMap`, `unmatchedScans`, `scanError`, `recordScan`, `updateEntry`, `clearHistory`, `associateScans`, `exportHistory`, `importHistory`.
- Types: `src/app/lib/types/scanHistory.ts` (`ScanHistoryEntry`, `ScanHistoryMatchStatus`, `ScanHistoryError`).

### API Fetch Queue
- All external API calls that need throttling should go through `enqueueFetch()` from `src/app/lib/utils/fetchQueue.ts`.
- Backed by `p-queue` (concurrency 1, 300 ms interval) to prevent BGG/GameUPC rate-limiting.

### Game Type Adapters
- `src/app/lib/utils/gameAdapters.ts` provides conversion functions between the external types (`BggCollectionItem`, `GameUPCBggInfo`, `BggVersion`, `GameUPCBggVersion`) and the internal `Game` / `Version` types.
- Use these adapters rather than inline mapping when bridging API responses to UI state.

---

## Key Files to Know

| File | Why It Matters |
|---|---|
| `src/app/(overview)/layout.tsx` | Provider nesting order — all context providers are composed here |
| `src/app/(overview)/page.tsx` | Main scanner page — ties together scanning, UPC lookup, and display |
| `src/app/(overview)/collection/page.tsx` | BGG collection viewer |
| `src/app/(overview)/batch/page.tsx` | Batch-add games to BGG collection |
| `src/app/lib/actions.ts` | Server Actions — BGG API proxy with auth |
| `gameupc-hooks/server` | Server Actions — GameUPC API proxy with auth |
| `src/app/lib/GameUPCDataProvider.tsx` | GameUPC context provider backed by `gameupc-hooks/useGameUPC` |
| `src/app/lib/ScanHistoryProvider.tsx` | Scan history context — records, updates, clears scan entries |
| `src/app/lib/hooks/useSelectVersion.ts` | Game/version selection for a UPC |
| `src/app/lib/hooks/useTradeMode.ts` | Trade-mode flags derived from the pathname |
| `src/app/ui/CollectionPageContent.tsx` | Collection / swap / trade / math-trade page body |
| `src/app/ui/batch/BatchView.tsx` | Batch / swapscan / tradescan page body |
| `src/app/lib/extension/ExtensionMessagingProvider.tsx` | Browser extension messaging context |
| `src/app/lib/database/database.ts` | Dexie schema — settings, plugins, collections, scanHistory |
| `src/app/lib/database/cacheDatabase.ts` | Dexie schema — image and response caching |
| `src/app/lib/redux/store.ts` | Redux store factory |
| `src/app/lib/redux/bgg/collection/selectors.ts` | Memoized collection selectors |
| `src/app/lib/plugins/plugins.ts` | Plugin system — built-in plugins and plugin map construction |
| `src/app/lib/utils/fetchQueue.ts` | Throttled fetch queue via `p-queue` (`enqueueFetch`) |
| `src/app/lib/utils/gameAdapters.ts` | Type adapters between BGG/GameUPC and internal Game/Version types |
| `src/app/ui/Scanner.tsx` | Barcode scanner UI — responsive sizing, camera selection |
| `next.config.ts` | `serverExternalPackages`, image rewrites, allowed image domains, dev origins |
| `pnpm-workspace.yaml` | `overrides`, `patchedDependencies`, `allowBuilds`, `peerDependencyRules`, supply-chain policy |
| `instrumentation-client.ts` | PostHog initialisation |
| `vitest.config.mts` | Vitest configuration (jsdom, coverage) |
| `tests/setup.ts` | Vitest re-export shim — all test files import primitives from here |

---

## Dependency Notes & Gotchas

- **pnpm only** — the project uses pnpm workspace features (overrides, patched dependencies), configured in `pnpm-workspace.yaml`. Do not use npm or yarn.
- **Supply-chain policy** (`pnpm-workspace.yaml`): `minimumReleaseAge: 1440` refuses package versions less than a day old, and `trustPolicy: no-downgrade` refuses versions whose provenance weakens (`trustPolicyExclude` lists exact old versions published before their maintainers adopted provenance). pnpm 12 applies both to the existing lockfile too — if an install is blocked, wait or add a narrowly scoped `minimumReleaseAgeExclude`; don't remove the policy.
- **Patched dependency**: `@undecaf/barcode-detector-polyfill@0.9.23` is patched to import `@undecaf/zbar-wasm` from the local package instead of a CDN URL. If this package is upgraded, the patch may need to be regenerated.
- **pnpm overrides**: `@undecaf/zbar-wasm` is overridden to `^0.11.0` to ensure all transitive deps use the same version.
- **Peer dependency rules**: TypeScript 6 and ESLint 10 are explicitly allowed for packages that haven't updated their peer dep ranges.
- **`next.lock/`**: Contains locked CDN resources used by Next.js. Not a typical lockfile.
- **Test framework**: Vitest (jsdom). Run `pnpm test`. Coverage via `pnpm test:coverage`. All test primitives imported from `tests/setup.ts`.
- **`react-scan`** (devDependency): React performance profiler — active only in dev, not deployed.

---

## Development Workflow

1. **Install**: `pnpm install`
2. **Run locally**: `pnpm dev` — accessible on localhost and `192.168.0.*` (configured in `next.config.ts` `allowedDevOrigins`)
3. **Lint**: `pnpm lint`
4. **Build**: `pnpm build` — this is what Vercel runs for deployment
5. **Test on mobile**: Connect phone to same LAN; access via `http://192.168.0.X:3000`

### Adding a New Page
1. Create a directory under `src/app/(overview)/` with a `page.tsx`.
2. It will automatically inherit all context providers from `(overview)/layout.tsx`.
3. Use `'use client'` directive if the page needs client-side interactivity.

### Adding a New Context Provider
1. Create a `*Provider.tsx` file in `src/app/lib/`.
2. Add it to the provider nesting chain in `src/app/(overview)/layout.tsx`.
3. Export a `use*` hook for consuming components.
4. Memoize the provider `value` with `useMemo` and wrap its functions in `useCallback`.
5. If the context object itself must be exported, put `createContext` in a sibling `*Context.ts` — component files should export only components/hooks/types (Fast Refresh).

### Adding a New Redux Slice
1. BGG-derived state: a new directory under `src/app/lib/redux/bgg/`, registered in `bggSlice.ts`. Anything else: a sibling of `bgg/` (like `swap/`), registered in `store.ts`.
2. Export a slice with `createSlice` from `@reduxjs/toolkit`.
3. Add a `selectors.ts` sibling file for memoized/computed selectors (use `memoize` from `proxy-memoize`; see `collection/selectors.ts`).

### Adding a New Plugin
1. For a built-in: add a `ShelfScanPlugin` object (id `plugin.internal.*`) to `builtInPlugins` (on by default) or `disabledBuiltInPlugins` (off by default) in `plugins.ts`.
2. For a shareable example: add a JSON file in `src/app/lib/plugins/` that users can paste into Settings → Installed Plugins.

---

## Deployment

- Deployed to **Vercel** automatically (likely on push to main).
- Vercel runs `pnpm build` (`next build`).
- Environment variables (`BGG_TOKEN`, `GAMEUPC_TOKEN`) must be set in Vercel project settings.
- `@vercel/analytics` is integrated in the root layout.

---

## Path Aliases

- `@/*` → `./src/*` (configured in `tsconfig.json`)
- Example: `import { useSettings } from '@/app/lib/SettingsProvider'`

---

## Common Patterns

### Server Actions as API Proxy
```typescript
// In a 'use server' file:
export const fetchSomething = async (param: string) => {
    const token = process.env.SECRET_TOKEN;
    return await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json());
};
// Called from client components directly — Next.js handles the RPC.
```

### Context Provider Pattern
```typescript
// 1. Create context with default value
const MyContext = createContext<MyType>(defaultValue);

// 2. Export hook
export const useMyContext = () => useContext(MyContext);

// 3. Provider component wraps children; memoize the value so consumers
//    only re-render when something in it actually changes
export const MyProvider = ({ children }) => {
    const [items, setItems] = useState<Item[]>([]);
    const addItem = useCallback((item: Item) => setItems(prev => [...prev, item]), []);
    const value = useMemo(() => ({ items, addItem }), [items, addItem]);
    return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};
```

### Effects, State and Accessibility
- **Derive, don't mirror**: compute from props/state during render; don't copy props into state via effects. Drafts committed on blur use uncontrolled `defaultValue` + `key={committedValue}`.
- **`useEffectEvent`** for effect code that needs the latest props without re-running the effect.
- **Clean up** timers, listeners, observers and `fetch`es (`AbortController`); guard post-`await` updates with an `active` flag.
- **Never mutate state in place** (`Object.assign(state, …)` + `setState(state)` doesn't re-render); use spreads or functional updates.
- Reset loading flags in `finally`; check `response.ok`; `.catch()` promises started in event handlers.
- Clickable things are native `<button>`/`<a>`; rows containing controls use a **stretched button** (`CollapsibleList`, `ListGameRow`); dismiss-on-click notices use `DismissibleToast`.
- `<form method="dialog">` close buttons must be `type="submit"`; every `<dialog>` needs `aria-label`/`aria-labelledby`; labels use `htmlFor`.

### Typed Redux Hooks
```typescript
import { useSelector, useDispatch } from '@/app/lib/hooks';
// These are pre-typed with RootState and AppDispatch — no need for type params.
```

