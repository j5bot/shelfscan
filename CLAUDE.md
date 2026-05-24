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
```

Run a single test file: `pnpm exec vitest run tests/utils.test.ts`

**Package manager: pnpm only.** Never use npm or yarn — the project uses pnpm overrides and patched dependencies.

**Node version**: 24.x (see `.nvmrc`).

## Architecture

ShelfScan is a board game UPC barcode scanner web app. Users scan barcodes via webcam/phone camera, look up game data via the [GameUPC API](https://gameupc.com), and interact with [BoardGameGeek (BGG)](https://boardgamegeek.com). A companion Firefox extension enables BGG collection actions.

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript 6 · Tailwind CSS v4 + DaisyUI v5 · Redux Toolkit · Dexie (IndexedDB) · Vitest · Deployed on Vercel.

### Next.js App Router layout

- `src/app/layout.tsx` — Server Component root; fonts, metadata, global chrome.
- `src/app/(overview)/layout.tsx` — **Client layout**; composes the entire context provider chain (see below). All pages under `(overview)/` inherit every provider automatically.
- `src/app/(overview)/page.tsx` — Main scanner page.
- `/upc/[id]` — Async Server Component page for single UPC details.

### State management — three layers

1. **Redux Toolkit** (`src/app/lib/redux/`) — Global BGG user + collection state. Store created via `makeStore()`. Always import typed hooks from `@/app/lib/hooks`, never directly from `react-redux`.
2. **React Context** — Feature-specific state. Provider nesting order in `(overview)/layout.tsx` (outer → inner): `Provider` (Redux) → `SettingsProvider` → `TailwindProvider` → `PluginMapProvider` → `CodesProvider` → `GameSelectionsProvider` → `GameUPCDataProvider` → `ScanHistoryProvider` → `NextStepProvider` → `ExtensionMessagingProvider`. New providers go here.
3. **Dexie (IndexedDB)** — Persistent client storage. Two databases: `db` (settings, plugins, collections, scanHistory) and `cache` (images, responses). Schemas in `src/app/lib/database/`.

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
| `src/app/lib/ScanHistoryProvider.tsx` | Scan history (Dexie-backed, capped at 20k, 5-min dedupe) |
| `src/app/ui/Scanner.tsx` | Barcode scanner UI |
| `next.config.ts` | `serverExternalPackages`, allowed image domains |
| `tests/setup.ts` | Re-exports all Vitest primitives — import from here, not vitest directly |

## Coding conventions

Full style guide is in `copilot-instructions.md`. Key points:

- **4 spaces** indentation, always semicolons, single quotes (double only in JSX string attributes).
- **`type` not `interface`**. `PascalCase` for types/components, `camelCase` for variables/hooks, `UPPER_SNAKE_CASE` for true constants, `PascalCase` for const objects used as enums/maps.
- **`const` arrow functions** for everything except Next.js page/layout default exports (those use `function`).
- **`@/*` path alias** for all internal imports (`@/app/lib/...`). Never use `../../` relative paths.
- **No barrel files** — each module exports its own symbols. Exception: `lib/hooks/index.ts` re-exports typed Redux hooks.
- **`void` operator** to suppress unused-variable warnings and mark intentionally discarded `.then()` results.
- **Always use block bodies** for `if` statements — never omit braces.
- **`switch (true)`** for range-based conditional logic.
- **`.then()` chaining** for fire-and-forget calls; `await` when the result is needed.
- **`useEffect` cleanup**: use an `active` flag pattern for async effects.
- Selectors use `memoize` from `proxy-memoize` and receive state as a tuple `[state, id]`.

### Context provider pattern

```typescript
const MyContext = createContext<MyType>(defaultValue);
export const useMyFeature = () => useContext(MyContext);
export const MyProvider = ({ children }: { children: ReactNode }) => {
    const value = useMyLogic();
    return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};
```

### File placement

| Category | Location |
|---|---|
| Pages | `src/app/(overview)/feature/page.tsx` |
| UI components | `src/app/ui/ComponentName.tsx` or `src/app/ui/feature/` |
| Context providers | `src/app/lib/FeatureProvider.tsx` |
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

Vitest config: `vitest.config.ts` (jsdom environment, `vite-tsconfig-paths` for `@/` alias resolution).

## Dependency gotchas

- `@undecaf/barcode-detector-polyfill@0.9.23` is **patched** (see `patches/`) to import zbar-wasm from the local package instead of CDN. If upgraded, regenerate the patch.
- `@undecaf/zbar-wasm` is **overridden** to `^0.11.0` across all transitive deps.
- `@undecaf/zbar-wasm` is in `serverExternalPackages` in `next.config.ts` — do not bundle it on the server.
- `next.lock/` is Next.js's CDN resource lock, not a standard lockfile.
- `react-scan` (devDependency) is a React performance profiler — dev only.