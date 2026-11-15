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

**Env vars**: `BGG_TOKEN` and `GAMEUPC_TOKEN` (server-only, see Server Actions below), `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` and `CONTACT_TO_EMAIL` (server-only, used by the `/contact` form via Resend), plus `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_POSTHOG_UI_HOST` for PostHog (initialised in `instrumentation-client.ts`; `pnpm dev` throws if the token or host is missing). Build-time only: `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` — when both are set, `withPostHogConfig` in `next.config.ts` generates browser source maps, uploads them to PostHog error tracking and deletes them from the output; otherwise no source maps are emitted. See `.env.example`.

## Architecture

ShelfScan is a board game UPC barcode scanner web app. Users scan barcodes via webcam/phone camera, look up game data via the [GameUPC API](https://gameupc.com), and interact with [BoardGameGeek (BGG)](https://boardgamegeek.com). A companion browser extension (Chrome, Edge, Firefox, Safari — source in the sibling `shelfscan-extension` repo) enables BGG collection, play, rating and market actions, and math-trade geeklist posting. Beyond scanning, the app covers collection browsing/filtering, batch add, and math trades (OLWLG geeklists, Swaptagon, Atlas Realms) — trade mode is derived from the URL by `useTradeMode()` (`/math-trade`, `/swap`, `/trade`, `/swapscan`, `/tradescan`).

**Stack**: Next.js 16 (App Router) · React 19.3 · TypeScript 7 · Tailwind CSS v4 + DaisyUI v5 · Redux Toolkit · Dexie (IndexedDB) · PostHog + Vercel Analytics · Vitest · Deployed on Vercel.

### Next.js App Router layout

- `src/app/layout.tsx` — Server Component root; fonts, metadata, global chrome.
- `src/app/(overview)/layout.tsx` — **Client layout**; composes the entire context provider chain (see below). All pages under `(overview)/` inherit every provider automatically.
- `src/app/(overview)/page.tsx` — Main scanner page.
- `/upc/[id]` — Async Server Component page for single UPC details.
- `/workflows/trades/[type]` — Async Server Component; unknown `type`s are rejected server-side with `redirect()` (not a client `router.replace` in an effect).
- `/collection`, `/swap`, `/trade`, `/math-trade/[geeklistId]` all render `ui/CollectionPageContent.tsx`; `/batch`, `/swapscan`, `/tradescan` all render `ui/batch/BatchView.tsx`.

### State management — three layers

1. **Redux Toolkit** (`src/app/lib/redux/`) — Store created via `makeStore()` with two top-level reducers: `bgg` (combines `user`, `collection`, `geeklist`) and `swap` (per-item swap/trade export data). Always import typed hooks from `@/app/lib/hooks`, never directly from `react-redux`. Redux state must stay serializable (arrays, not `Set`s).
2. **React Context** — Feature-specific state. Provider nesting order in `(overview)/layout.tsx` (outer → inner): `Provider` (Redux) → `SettingsProvider` → `TailwindProvider` → `PluginMapProvider` → `CodesProvider` → `GameSelectionsProvider` → `GameUPCDataProvider` → `ScanHistoryProvider` → `NextStepProvider` → `SyncProvider` → `ExtensionMessagingProvider` → `PlayDataProvider` → `McpToolsProvider`. New providers go here.
3. **Dexie (IndexedDB)** — Persistent client storage. Two databases: `db` (settings, plugins, collections, scanned, dataforms, scanHistory, filters) and `cache` (images, responses). Schemas in `src/app/lib/database/`. Backup/restore lives in `lib/utils/dbBackup.ts` (PNG-wrapped export, encoded off-thread by `lib/workers/dbBackupWorker.ts`).

**Game selection**: the chosen `[infoId, versionId]` per UPC lives in `GameSelectionsProvider` (shared by the scan list, batch add and swap export). `useSelectVersion` derives the current info/version from it with `resolveGameSelection()` (`lib/utils/gameSelection.ts`), which auto-selects a lone info/version; always update selections with functional `setGameSelections(prev => …)`.

### Server Actions (API proxy)

`src/app/lib/actions.ts`, `lib/services/contact/server.ts` (contact form → Resend) and `gameupc-hooks/server` contain all `'use server'` functions. These proxy BGG XML API v2 and GameUPC REST API calls, keeping `BGG_TOKEN` and `GAMEUPC_TOKEN` server-side only. All `process.env` access belongs in these files.

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
| `src/app/lib/McpToolsProvider.tsx` | `WebMCPProvider` (webmcp-react) + registration of WebMCP tools; each tool is a `use…Tool` hook in `lib/hooks/` called from `McpTools` |
| `src/app/ui/DismissibleToast.tsx` | Click- or keyboard-dismissible toast — use for dismiss-on-click notices |
| `src/app/ui/Scanner.tsx` | Barcode scanner UI |
| `next.config.ts` | `serverExternalPackages`, image rewrites (`/bgg-images`, `/gameupc-images`), allowed image domains |
| `pnpm-workspace.yaml` | pnpm overrides, patched deps, allowed builds, peer rules, supply-chain policy |
| `src/userscripts/` | Userscripts that import ShelfScan exports into Swaptagon / Atlas Realms (bump `@version` when changing) |
| `tests/setup.ts` | Re-exports all Vitest primitives — import from here, not vitest directly |

## Coding conventions

All code style and standards rules (formatting, naming, TypeScript, React/JSX, effects, accessibility, context/Redux patterns, async, file placement, testing) live in **`CODE_STYLES.md`** — follow it for every change:

@CODE_STYLES.md

## Testing

Tests live in `tests/` (mirrors `src/`). Import all test primitives from `tests/setup.ts`:

```typescript
import { describe, it, expect, vi } from '../setup';
```

Vitest config: `vitest.config.mts` (jsdom environment, `resolve.tsconfigPaths` for `@/` alias resolution).

Tests cover pure logic (utils, services, redux, plugins); there are no component tests (see Testing in `CODE_STYLES.md`).

## Dependency gotchas

- pnpm settings live in **`pnpm-workspace.yaml`** (not `package.json`): `overrides`, `patchedDependencies`, `allowBuilds`, `peerDependencyRules`.
- **ESLint runs on TypeScript 6**: typescript-eslint doesn't support TypeScript 7 yet, so `.pnpmfile.cjs` turns `eslint-config-next`'s `typescript` peer into a dependency on 6.0.3 (pnpm overrides and `packageExtensions` can't redirect a peer). `tsc` and `next build` use 7. Remove the hook once typescript-eslint supports 7.
- **Supply-chain policy** (`pnpm-workspace.yaml`): `minimumReleaseAge: 1440` (versions under a day old are refused) and `trustPolicy: no-downgrade` (with exact-version `trustPolicyExclude` entries for old releases published before their maintainers adopted provenance). pnpm 12 also checks the existing lockfile, so if an install is blocked, wait for the release to age or add a scoped `minimumReleaseAgeExclude` for an urgent fix — don't remove the policy.
- `@undecaf/barcode-detector-polyfill@0.9.23` is **patched** (see `patches/`) to import zbar-wasm from the local package instead of CDN. If upgraded, regenerate the patch.
- `@undecaf/zbar-wasm` is **overridden** to `^0.11.0` across all transitive deps.
- `@undecaf/zbar-wasm` is in `serverExternalPackages` in `next.config.ts` — do not bundle it on the server.
- `next.lock/` is Next.js's CDN resource lock, not a standard lockfile.
- `react-scan` (devDependency) is a React performance profiler — dev only.