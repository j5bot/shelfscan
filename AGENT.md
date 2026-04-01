# AGENT.md — ShelfScan Project Guide

## Project Overview

ShelfScan is a **board game UPC barcode scanner** web application. Users scan board game barcodes (via webcam/phone camera), look up game data through the [GameUPC API](https://gameupc.com), and interact with [BoardGameGeek (BGG)](https://boardgamegeek.com). A companion Firefox browser extension enables additional actions like adding games to a BGG collection or posting to the BGG GeekMarket.

**Live site:** https://shelfscan.io

---

## Tech Stack

| Layer | Technology | Version (approx) |
|---|---|---|
| Framework | **Next.js** (App Router) | 16.x |
| Language | **TypeScript** | 6.x |
| UI | **React** | 19.x |
| Styling | **Tailwind CSS** v4 + **DaisyUI** v5 | 4.2 / 5.5 |
| State (global) | **Redux Toolkit** (`@reduxjs/toolkit`) + `react-redux` | 2.x / 9.x |
| State (local) | React Context providers (many) | — |
| Client DB | **Dexie** (IndexedDB wrapper) | 4.x |
| Barcode scanning | `@react-barcode-scanner/components`, `@undecaf/zbar-wasm` | custom / 0.11 |
| Animation | `motion` (Framer Motion successor) | 12.x |
| Validation | **Zod** v4 | 4.x |
| Analytics | `@vercel/analytics` | 2.x |
| Tours | `nextstepjs` | 2.x |
| Package manager | **pnpm** | — |
| Deployment | **Vercel** | — |
| Linting | ESLint 10 + `eslint-config-next` (flat config) | 10.x |
| PostCSS | `@tailwindcss/postcss` | 4.x |

---

## Build & Run Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (next dev)
pnpm build            # Production build (next build) — used by Vercel
pnpm start            # Start production server (next start)
pnpm lint             # Run ESLint (next lint)
```

There is **no test suite** configured (no test files, no test runner).

---

## Environment Variables

Defined in `.env` (local) and Vercel environment settings (production):

| Variable | Purpose |
|---|---|
| `BGG_TOKEN` | Bearer token for authenticated BGG XML API v2 requests (server-side only) |
| `GAMEUPC_TOKEN` | API key for GameUPC API requests (server-side only, sent as `x-api-key` header) |

Both are used exclusively in **Server Actions** (`src/app/lib/actions.ts`, `src/app/lib/services/gameupc/server.ts`) and are never exposed to the client.

---

## Project Structure

```
shelfscan/
├── public/                    # Static assets (images, favicons, sounds, videos, extension .xpi)
├── patches/                   # pnpm patch for @undecaf/barcode-detector-polyfill
├── assets/                    # Source design files and blog drafts (not deployed)
├── src/
│   └── app/                   # Next.js App Router root
│       ├── layout.tsx         # Root layout (Server Component) — fonts, metadata, global chrome
│       ├── globals.css        # Global styles (Tailwind v4, DaisyUI plugin, custom variants)
│       ├── Provider.tsx       # Redux <Provider> wrapper (client component)
│       ├── (overview)/        # Route group — the main app shell
│       │   ├── layout.tsx     # Client layout — deeply nested context providers
│       │   ├── page.tsx       # Home / scanner page
│       │   ├── loading.tsx    # Suspense loading fallback
│       │   ├── about/         # /about page
│       │   ├── extension/     # /extension page
│       │   └── upc/[id]/     # /upc/:id — single UPC detail page
│       ├── lib/               # Shared logic (non-UI)
│       │   ├── actions.ts     # Next.js Server Actions (BGG API proxy)
│       │   ├── utils.ts       # Fetch-with-retry helper
│       │   ├── CodesProvider.tsx
│       │   ├── GameSelectionsProvider.tsx
│       │   ├── GameUPCDataProvider.tsx
│       │   ├── NextStepProvider.tsx
│       │   ├── PluginMapProvider.tsx
│       │   ├── SelectVersionProvider.tsx
│       │   ├── SettingsProvider.tsx
│       │   ├── TailwindProvider.tsx
│       │   ├── database/      # Dexie IndexedDB schemas & helpers
│       │   │   ├── database.ts      # Main DB (settings, plugins, collections)
│       │   │   └── cacheDatabase.ts # Cache DB (images, responses)
│       │   ├── extension/     # Browser extension communication
│       │   ├── hooks/         # Custom React hooks
│       │   ├── plugins/       # Plugin system (built-in + JSON definitions)
│       │   ├── redux/         # Redux store, slices
│       │   │   ├── store.ts   # configureStore + type exports
│       │   │   └── bgg/       # BGG feature slice
│       │   │       ├── bggSlice.ts       # combineReducers(user, collection)
│       │   │       ├── user/slice.ts     # User state
│       │   │       └── collection/slice.ts # Collection state
│       │   ├── services/      # External API service layers
│       │   │   ├── bgg/       # BGG XML API parsing
│       │   │   └── gameupc/   # GameUPC REST API (server.ts = Server Actions)
│       │   ├── tours/         # nextstepjs tour definitions
│       │   ├── types/         # TypeScript type definitions
│       │   └── utils/         # Pure utility functions (array, image, size, transforms, xml)
│       └── ui/                # React UI components
│           ├── Scanner.tsx    # Barcode scanner component
│           ├── NavDrawer.tsx  # Navigation drawer
│           ├── games/         # Game display components (Scanlist, GameDetails, SelectVersion, Thumbnail)
│           ├── settings/      # Settings management UI
│           ├── extension/     # Extension-related UI
│           ├── forms/         # Form input components
│           └── tour/          # Tour card component
```

---

## Architecture & Key Patterns

### Next.js App Router
- Uses the **App Router** (not Pages Router). The root `layout.tsx` is a **Server Component**.
- The `(overview)` route group wraps the main app in a **client-side layout** that provides all context providers.
- The `/upc/[id]` route uses an **async Server Component** page with `params: Promise<{id}>` (Next.js 16 pattern).
- **Server Actions** (`'use server'`) in `actions.ts` and `services/gameupc/server.ts` proxy external API calls to keep tokens secret.

### State Management — Hybrid Approach
1. **Redux Toolkit** — Global state for BGG user and collection data. Store created per-request via `makeStore()` pattern. Typed hooks exported from `lib/hooks/index.ts`.
2. **React Context** — Feature-specific state via provider components (Codes, GameSelections, GameUPCData, Settings, Plugins, TailwindBreakpoint, SelectVersion, NextStep). These are nested in `(overview)/layout.tsx`.
3. **Dexie (IndexedDB)** — Persistent client-side storage for settings, plugins, collections, and cached images/responses. Two databases: `db` (main) and `cache`.

### Barcode Scanning
- Uses `@react-barcode-scanner/components` (author's own library) which internally uses `@undecaf/zbar-wasm` for WASM-based barcode detection.
- A **pnpm patch** on `@undecaf/barcode-detector-polyfill@0.9.23` rewrites its CDN import of `zbar-wasm` to a local package import.
- `@undecaf/zbar-wasm` is listed in `serverExternalPackages` in `next.config.ts` to avoid bundling the WASM on the server.
- A pnpm **override** pins `@undecaf/zbar-wasm` to `^0.11.0` across all transitive dependencies.

### Plugin System
- Plugins are JSON-defined templates (built-in and user-managed) stored in Dexie.
- Templates use `{{mustache}}` syntax (via `@blakeembrey/template`) for URL generation.
- Plugins have `type` (e.g., `link`) and `location` (e.g., `details`, `actions`).
- Built-in plugins: BGG Links, BGG Market, Board Game Stats.

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
- A **Firefox extension** (`.xpi` files in `public/extension/firefox/`) communicates with the web app.
- Extension types and hooks are in `src/app/lib/extension/`.

---

## Key Files to Know

| File | Why It Matters |
|---|---|
| `src/app/(overview)/layout.tsx` | Provider nesting order — all context providers are composed here |
| `src/app/(overview)/page.tsx` | Main scanner page — ties together scanning, UPC lookup, and display |
| `src/app/lib/actions.ts` | Server Actions — BGG API proxy with auth |
| `src/app/lib/services/gameupc/server.ts` | Server Actions — GameUPC API proxy with auth |
| `src/app/lib/hooks/useGameUPCApi.ts` | Core hook — manages UPC data fetching, submission, and removal |
| `src/app/lib/database/database.ts` | Dexie schema — settings, plugins, collections |
| `src/app/lib/database/cacheDatabase.ts` | Dexie schema — image and response caching |
| `src/app/lib/redux/store.ts` | Redux store factory |
| `src/app/lib/plugins/plugins.ts` | Plugin system — built-in plugins and plugin map construction |
| `src/app/ui/Scanner.tsx` | Barcode scanner UI — responsive sizing, camera selection |
| `next.config.ts` | `serverExternalPackages`, allowed image domains, dev origins |
| `package.json` | `pnpm.overrides`, `pnpm.patchedDependencies`, `peerDependencyRules` |

---

## Dependency Notes & Gotchas

- **pnpm only** — the project uses pnpm workspaces features (overrides, patched dependencies). Do not use npm or yarn.
- **Patched dependency**: `@undecaf/barcode-detector-polyfill@0.9.23` is patched to import `@undecaf/zbar-wasm` from the local package instead of a CDN URL. If this package is upgraded, the patch may need to be regenerated.
- **pnpm overrides**: `@undecaf/zbar-wasm` is overridden to `^0.11.0` to ensure all transitive deps use the same version.
- **Peer dependency rules**: TypeScript 6 and ESLint 10 are explicitly allowed for packages that haven't updated their peer dep ranges.
- **`next.lock/`**: Contains locked CDN resources used by Next.js. Not a typical lockfile.
- **No test framework**: There are no tests. If adding tests, consider Vitest (aligns with the Vite ecosystem Next.js 16 uses) or Jest.

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

### Adding a New Redux Slice
1. Create a new directory under `src/app/lib/redux/bgg/` (or a sibling to `bgg/`).
2. Export a slice with `createSlice` from `@reduxjs/toolkit`.
3. Register it in the appropriate `combineReducers` call or in `store.ts`.

### Adding a New Plugin
1. Create a JSON file in `src/app/lib/plugins/` following the `ShelfScanPlugin` type.
2. Register it in `plugins.ts` under `builtInPlugins` or `disabledBuiltInPlugins`.

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

// 3. Provider component wraps children
export const MyProvider = ({ children }) => {
    const value = useMyLogic();
    return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};
```

### Typed Redux Hooks
```typescript
import { useSelector, useDispatch } from '@/app/lib/hooks';
// These are pre-typed with RootState and AppDispatch — no need for type params.
```

