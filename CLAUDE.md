# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build (what Vercel runs)
pnpm lint             # ESLint (flat config, eslint.config.mjs)
pnpm test             # Run tests once (vitest run)
pnpm test:watch       # Vitest watch mode
pnpm test:coverage    # Vitest with v8 coverage
pnpm doctor           # React Doctor scan (npx react-doctor@latest)
```

Run a single test file: `pnpm exec vitest run tests/utils.test.ts`

**Package manager: pnpm only.** Never use npm or yarn — the project uses pnpm overrides and patched dependencies.

**Node version**: 24.x (see `.nvmrc`). **pnpm** 12 (`packageManager` in `package.json`).

**Env vars**: `BGG_TOKEN` and `GAMEUPC_TOKEN` (server-only, see Server Actions below), plus `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_POSTHOG_UI_HOST` for PostHog (initialised in `instrumentation-client.ts`; `pnpm dev` throws if the token or host is missing). See `.env.example`.

## Architecture

ShelfScan is a board game UPC barcode scanner web app. Users scan barcodes via webcam/phone camera, look up game data via the [GameUPC API](https://gameupc.com), and interact with [BoardGameGeek (BGG)](https://boardgamegeek.com). A companion browser extension (Chrome, Edge, Firefox, Safari — source in the sibling `shelfscan-extension` repo) enables BGG collection, play, rating and market actions, and math-trade geeklist posting. Beyond scanning, the app covers collection browsing/filtering, batch add, and math trades (OLWLG geeklists, Swaptagon, Atlas Realms) — trade mode is derived from the URL by `useTradeMode()` (`/math-trade`, `/swap`, `/trade`, `/swapscan`, `/tradescan`).

**Stack**: Next.js 16 (App Router) · React 19.3 · TypeScript 6 · Tailwind CSS v4 + DaisyUI v5 · Redux Toolkit · Dexie (IndexedDB) · PostHog + Vercel Analytics · Vitest · Deployed on Vercel.

### Next.js App Router layout

- `src/app/layout.tsx` — Server Component root; fonts, metadata, global chrome.
- `src/app/(overview)/layout.tsx` — **Client layout**; composes the entire context provider chain (see below). All pages under `(overview)/` inherit every provider automatically.
- `src/app/(overview)/page.tsx` — Main scanner page.
- `/upc/[id]` — Async Server Component page for single UPC details.
- `/workflows/trades/[type]` — Async Server Component; unknown `type`s are rejected server-side with `redirect()` (not a client `router.replace` in an effect).
- `/collection`, `/swap`, `/trade`, `/math-trade/[geeklistId]` all render `ui/CollectionPageContent.tsx`; `/batch`, `/swapscan`, `/tradescan` all render `ui/batch/BatchView.tsx`.

### State management — three layers

1. **Redux Toolkit** (`src/app/lib/redux/`) — Store created via `makeStore()` with two top-level reducers: `bgg` (combines `user`, `collection`, `geeklist`) and `swap` (per-item swap/trade export data). Always import typed hooks from `@/app/lib/hooks`, never directly from `react-redux`. Redux state must stay serializable (arrays, not `Set`s).
2. **React Context** — Feature-specific state. Provider nesting order in `(overview)/layout.tsx` (outer → inner): `Provider` (Redux) → `SettingsProvider` → `TailwindProvider` → `PluginMapProvider` → `CodesProvider` → `GameSelectionsProvider` → `GameUPCDataProvider` → `ScanHistoryProvider` → `NextStepProvider` → `SyncProvider` → `ExtensionMessagingProvider` → `PlayDataProvider`. New providers go here.
3. **Dexie (IndexedDB)** — Persistent client storage. Two databases: `db` (settings, plugins, collections, scanned, dataforms, scanHistory, filters) and `cache` (images, responses). Schemas in `src/app/lib/database/`. Backup/restore lives in `lib/utils/dbBackup.ts` (PNG-wrapped export, encoded off-thread by `lib/workers/dbBackupWorker.ts`).

**Game selection**: the chosen `[infoId, versionId]` per UPC lives in `GameSelectionsProvider` (shared by the scan list, batch add and swap export). `useSelectVersion` derives the current info/version from it with `resolveGameSelection()` (`lib/utils/gameSelection.ts`), which auto-selects a lone info/version; always update selections with functional `setGameSelections(prev => …)`.

### Server Actions (API proxy)

`src/app/lib/actions.ts` and `gameupc-hooks/server` contain all `'use server'` functions. These proxy BGG XML API v2 and GameUPC REST API calls, keeping `BGG_TOKEN` and `GAMEUPC_TOKEN` server-side only. All `process.env` access belongs in these files.

BGG API has a retry loop for 202 "please wait" responses (up to 20 retries, 2 s delay). All throttled external calls go through `enqueueFetch()` in `src/app/lib/utils/fetchQueue.ts` (p-queue, concurrency 1, 300 ms interval).

### Key files

| File | Purpose |
|---|---|
| `src/app/(overview)/layout.tsx` | Provider nesting order |
| `src/app/lib/actions.ts` | BGG Server Actions |
| `src/app/lib/database/database.ts` | Dexie schema |
| `src/app/lib/redux/store.ts` | Redux store factory + type exports |
| `src/app/lib/redux/bgg/collection/selectors.ts` | Memoized selectors (use `memoize` from `proxy-memoize`, not `createSelector`) |
| `src/app/lib/utils/fetchQueue.ts` | `enqueueFetch()` — throttled fetch |
| `src/app/lib/utils/gameAdapters.ts` | Adapters between BGG/GameUPC types and internal `Game`/`Version` types |
| `src/app/lib/ScanHistoryProvider.tsx` | Scan history (Dexie-backed, capped at 20k, 5-min dedupe via `lib/utils/scanHistory.ts`; timestamps are Unix **seconds**) |
| `src/app/lib/hooks/useSelectVersion.ts` | Game/version selection for a UPC (see Game selection above) |
| `src/app/lib/hooks/useTradeMode.ts` | Swap / trade / math-trade mode flags derived from the pathname |
| `src/app/lib/extension/` | Extension bridge: `ExtensionMessagingProvider` (postMessage, origin-checked), `SyncProvider` / `useSync` (extension + subscription status), `PlayDataProvider`, `useExtension` |
| `src/app/ui/DismissibleToast.tsx` | Click- or keyboard-dismissible toast — use for dismiss-on-click notices |
| `src/app/ui/Scanner.tsx` | Barcode scanner UI |
| `next.config.ts` | `serverExternalPackages`, image rewrites (`/bgg-images`, `/gameupc-images`), allowed image domains |
| `pnpm-workspace.yaml` | pnpm overrides, patched deps, allowed builds, peer rules, supply-chain policy |
| `src/userscripts/` | Userscripts that import ShelfScan exports into Swaptagon / Atlas Realms (bump `@version` when changing) |
| `tests/setup.ts` | Re-exports all Vitest primitives — import from here, not vitest directly |

## Coding conventions

Full style guide is in `copilot-instructions.md`. Key points:

- **4 spaces** indentation, always semicolons, single quotes (double only in JSX string attributes).
- **`type` not `interface`**. `PascalCase` for types/components, `camelCase` for variables/hooks, `UPPER_SNAKE_CASE` for true constants, `PascalCase` for const objects used as enums/maps.
- **`const` arrow functions** for everything except Next.js page/layout default exports (those use `function`).
- **Parameter destructuring**: destructure in the parameter list only for **3 or fewer** properties. With more, take `props` (components), `options` (hooks/helpers) or `params` (`…Params` types) and destructure on the first line of the body.
- **`@/*` path alias** for all internal imports (`@/app/lib/...`). Never use `../../` relative paths. Group imports: `@/` first, then external packages.
- **No barrel files** — each module exports its own symbols. Exception: `lib/hooks/index.ts` re-exports typed Redux hooks.
- **`void` operator** to suppress unused-variable warnings and mark intentionally discarded `.then()` results.
- **Always use block bodies** for `if` statements — never omit braces.
- **`switch (true)`** for range-based conditional logic.
- **`.then()` chaining** for fire-and-forget calls; `await` when the result is needed.
- **`useEffect` cleanup**: use an `active` flag pattern for async effects.
- **`useTransition`** for non-blocking async state updates triggered by user interaction.
- Selectors use `memoize` from `proxy-memoize` and receive state as a tuple `[state, id]`.
- Always create a named `type` for complex objects — never inline multi-property shapes in function signatures. Use `{} as ReturnType<typeof useHook>` for context defaults where a real default isn't feasible.
- Components never return `null` — use `&&` short-circuit or implicit `undefined`. `null` appears only in `useState<T | null>(null)`.
- **Component files export only components** (plus hooks and types) so Fast Refresh works. Put exported contexts in a sibling `FeatureContext.ts` (see `SettingsContext.ts`, `SyncContext.ts`), and shared helpers/constants in `lib/utils/` (e.g. `lib/utils/rating.ts`).

### Effects and derived state

- **Derive, don't mirror.** Compute values from props/state during render instead of copying them into state with an effect. When the user can override a prop-driven value, store only the override plus the prop value it was made against (see `useGameDetailsSearch`). For "type a draft, commit on blur" inputs, use an uncontrolled `defaultValue` with `key={committedValue}` (see `ui/forms/TextInput.tsx`).
- **`useEffectEvent`** (React 19.2+) for effect logic that must read the latest props/state without re-running the effect (e.g. calling a `nextStep`/`onClose` prop, "send once per item"). Call it only from inside the effect.
- **Always clean up**: clear timers, remove listeners, disconnect observers, and abort in-flight `fetch`es (`AbortController`) in the effect's cleanup. Guard post-`await` state updates with the `active` flag.
- **Never mutate state in place** — `Object.assign(state, …)` + `setState(sameObject)` does not re-render. Use spreads or functional updates (`setX(prev => ({ ...prev, key }))`).
- **Async UI flags**: reset loading/busy flags in `finally`; check `response.ok` before reading a `fetch` body; add `.catch()` to promises started in event handlers.

### Accessibility

- Anything clickable is a native `<button type="…">` or `<a>`. Never put `onClick` on a `div`/`li`/`span`.
- Rows or cards that contain other controls use a **stretched button** (an absolutely positioned `<button>` covering the row, with inner controls raised above it) — see `CollapsibleList.tsx`, `ListGameRow.tsx`.
- Click-to-dismiss notices use `DismissibleToast`.
- Buttons that close a `<dialog>` via `<form method="dialog">` must be `type="submit"` (`type="button"` does nothing there). Every `<dialog>` needs `aria-label` or `aria-labelledby`.
- Tie `<label>`s to controls with `htmlFor`/`id` (`useId()` for unique ids).

### Complex JSX conditionals

Prepare nodes in variables before the return statement when there are multiple alternatives; use `switch` rather than chains of ternaries:

```typescript
let content: ReactNode = <DefaultView />;
switch (status) {
    case 'loading': content = <Spinner />; break;
    case 'error':   content = <ErrorMsg />; break;
}
return <div>{content}</div>;
```

### Redux slice conventions

```typescript
const SLICE_TITLE = 'FEATURE_NAME';   // UPPER_SNAKE_CASE
const initialState: FeatureSliceState = { ... };

export const featureSlice = createSlice({
    name: `${SLICE_TITLE}_SLICE`,
    initialState,
    reducers: { ... },
});

export const { actionOne, actionTwo } = featureSlice.actions;
export default featureSlice.reducer;
```

BGG-derived state goes in the `bgg` combiner (`src/app/lib/redux/bgg/bggSlice.ts`); other features get a top-level reducer registered in `store.ts` (like `swap`).

### Context provider pattern

```typescript
const MyContext = createContext<MyType>({} as MyType);
export const useMyFeature = () => useContext(MyContext);
export const MyProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<Item[]>([]);
    const addItem = useCallback((item: Item) => setItems(prev => [...prev, item]), []);
    // never pass an inline object: every consumer would re-render on every render
    const value = useMemo(() => ({ items, addItem }), [items, addItem]);
    return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};
```

If the context must be exported (e.g. read with `useContext` elsewhere), define it in `MyContext.ts` and import it into the provider.

### File placement

| Category | Location |
|---|---|
| Pages | `src/app/(overview)/feature/page.tsx` |
| UI components | `src/app/ui/ComponentName.tsx` or `src/app/ui/feature/` |
| Context providers | `src/app/lib/FeatureProvider.tsx` (exported context: `src/app/lib/FeatureContext.ts`) |
| Hooks | `src/app/lib/hooks/useHookName.ts` |
| Redux slices | `src/app/lib/redux/domain/feature/slice.ts` |
| Selectors | `src/app/lib/redux/domain/feature/selectors.ts` |
| Types | `src/app/lib/types/TypeName.ts` |
| Server actions | `src/app/lib/actions.ts` or `src/app/lib/services/*/server.ts` |
| Utilities | `src/app/lib/utils/utilName.ts` |

## Testing

Tests live in `tests/` (mirrors `src/`). Import all test primitives from `tests/setup.ts`:

```typescript
import { describe, it, expect, vi } from '../setup';
```

Vitest config: `vitest.config.mts` (jsdom environment, `resolve.tsconfigPaths` for `@/` alias resolution).

Tests cover pure logic (utils, services, redux, plugins); there are no component tests. Prefer extracting logic from hooks/components into a pure `lib/utils/` function and testing that (e.g. `resolveGameSelection`, `findRecentDuplicate`).

## Dependency gotchas

- pnpm settings live in **`pnpm-workspace.yaml`** (not `package.json`): `overrides`, `patchedDependencies`, `allowBuilds`, `peerDependencyRules`.
- **Supply-chain policy** (`pnpm-workspace.yaml`): `minimumReleaseAge: 1440` (versions under a day old are refused) and `trustPolicy: no-downgrade` (with exact-version `trustPolicyExclude` entries for old releases published before their maintainers adopted provenance). pnpm 12 also checks the existing lockfile, so if an install is blocked, wait for the release to age or add a scoped `minimumReleaseAgeExclude` for an urgent fix — don't remove the policy.
- `@undecaf/barcode-detector-polyfill@0.9.23` is **patched** (see `patches/`) to import zbar-wasm from the local package instead of CDN. If upgraded, regenerate the patch.
- `@undecaf/zbar-wasm` is **overridden** to `^0.11.0` across all transitive deps.
- `@undecaf/zbar-wasm` is in `serverExternalPackages` in `next.config.ts` — do not bundle it on the server.
- `next.lock/` is Next.js's CDN resource lock, not a standard lockfile.
- `react-scan` (devDependency) is a React performance profiler — dev only.