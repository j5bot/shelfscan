# Copilot Instructions — ShelfScan

> This file is the single source of truth for GitHub Copilot cloud agent. It combines the project
> architecture guide and the code-style guide into one place. Read it fully before making changes.

---

## Project Overview

ShelfScan is a **board game UPC barcode scanner** web application. Users scan board game barcodes
(via webcam or phone camera), look up game data through the
[GameUPC API](https://gameupc.com), and manage their [BoardGameGeek (BGG)](https://boardgamegeek.com)
collections. A companion Firefox browser extension enables actions like adding games to a BGG
collection or posting to the BGG GeekMarket.

**Live site:** https://shelfscan.io

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | **Next.js** (App Router) | 16.x |
| Language | **TypeScript** | 6.x |
| UI | **React** | 19.x |
| Styling | **Tailwind CSS** v4 + **DaisyUI** v5 | 4.2 / 5.5 |
| State (global) | **Redux Toolkit** + `react-redux` | 2.x / 9.x |
| State (local) | React Context providers | — |
| Client DB | **Dexie** (IndexedDB wrapper) | 4.x |
| Barcode scanning | `@react-barcode-scanner/components`, `@undecaf/zbar-wasm` | custom / 0.11 |
| Animation | `motion` (Framer Motion successor) | 12.x |
| Validation | **Zod** v4 | 4.x |
| Analytics | `@vercel/analytics` | 2.x |
| Tours | `nextstepjs` | 2.x |
| Package manager | **pnpm** | — |
| Deployment | **Vercel** | — |
| Linting | ESLint 10 + `eslint-config-next` (flat config) | 10.x |

---

## Critical First Steps for the Agent

1. **Install dependencies**: `pnpm install` — use pnpm only (not npm or yarn).
2. **Validate changes**: Run `pnpm lint` after every change (ESLint + TypeScript via `next lint`).
3. **Check the build**: Run `pnpm build` when making structural or API-level changes.
4. **No test suite** — there are no test files or test runner configured.

```bash
pnpm install          # Install all dependencies (including patched ones)
pnpm dev              # Start dev server (next dev)
pnpm build            # Production build — what Vercel runs
pnpm start            # Start production server
pnpm lint             # ESLint + TypeScript type-checking
```

> **Known environment issue:** `pnpm install` applies a patch to
> `@undecaf/barcode-detector-polyfill@0.9.23` automatically. If you see import errors related to
> `zbar-wasm`, ensure the patch in `patches/` was applied correctly. The patched dependency
> list is in `package.json` under `pnpm.patchedDependencies`.

---

## Environment Variables

Both variables are **server-side only** — never expose to the client:

| Variable | Purpose |
|---|---|
| `BGG_TOKEN` | Bearer token for BGG XML API v2 (used in `src/app/lib/actions.ts`) |
| `GAMEUPC_TOKEN` | API key for GameUPC API (used in `gameupc-hooks/server`) |

If these are absent during development, the GameUPC service falls back to a test endpoint.
BGG calls will fail without a token.

---

## Project Structure

```
shelfscan/
├── .github/
│   ├── copilot-instructions.md       # ← this file
│   └── workflows/
│       └── copilot-setup-steps.yml   # pre-installs deps for Copilot agent
├── public/                           # Static assets (images, sounds, videos, .xpi)
├── patches/                          # pnpm patch for @undecaf/barcode-detector-polyfill
├── assets/                           # Source design files and blog drafts (not deployed)
├── copilot-instructions.md           # Code style guide (also read this)
├── AGENTS.md                         # Extended project guide
├── src/
│   └── app/                          # Next.js App Router root
│       ├── layout.tsx                # Root layout (Server Component) — fonts, metadata
│       ├── globals.css               # Global styles (Tailwind v4, DaisyUI, custom variants)
│       ├── Provider.tsx              # Redux <Provider> wrapper (client component)
│       ├── (overview)/               # Route group — main app shell
│       │   ├── layout.tsx            # Client layout — all context providers nested here
│       │   ├── page.tsx              # Home / scanner page
│       │   ├── loading.tsx           # Suspense loading fallback
│       │   ├── about/                # /about page
│       │   ├── extension/            # /extension page
│       │   └── upc/[id]/             # /upc/:id — UPC detail page (async Server Component)
│       ├── lib/                      # Shared logic (non-UI)
│       │   ├── actions.ts            # Server Actions — BGG API proxy with auth
│       │   ├── utils.ts              # Fetch-with-retry helper
│       │   ├── CodesProvider.tsx
│       │   ├── GameSelectionsProvider.tsx
│       │   ├── GameUPCDataProvider.tsx
│       │   ├── NextStepProvider.tsx
│       │   ├── PluginMapProvider.tsx
│       │   ├── SelectVersionProvider.tsx
│       │   ├── SettingsProvider.tsx
│       │   ├── TailwindProvider.tsx
│       │   ├── database/
│       │   │   ├── database.ts       # Main DB (settings, plugins, collections)
│       │   │   └── cacheDatabase.ts  # Cache DB (images, responses)
│       │   ├── extension/            # Browser extension communication
│       │   ├── hooks/                # Custom React hooks (index.ts = typed Redux hooks)
│       │   ├── plugins/              # Plugin system (built-in + JSON definitions)
│       │   ├── redux/
│       │   │   ├── store.ts          # makeStore() factory + type exports
│       │   │   └── bgg/
│       │   │       ├── bggSlice.ts   # combineReducers(user, collection)
│       │   │       ├── user/slice.ts
│       │   │       └── collection/slice.ts
│       │   ├── services/
│       │   │   ├── bgg/              # BGG XML API parsing
│       │   │   └── gameupc/          # GameUPC REST API (server.ts = Server Actions)
│       │   ├── tours/                # nextstepjs tour definitions
│       │   ├── types/                # TypeScript type definitions
│       │   └── utils/                # Pure utility functions (array, image, size, transforms, xml)
│       └── ui/                       # React UI components
│           ├── Scanner.tsx           # Barcode scanner component
│           ├── NavDrawer.tsx         # Navigation drawer
│           ├── games/                # Scanlist, GameDetails, SelectVersion, Thumbnail
│           ├── settings/             # Settings management UI
│           ├── extension/            # Extension-related UI
│           ├── forms/                # Form input components
│           └── tour/                 # Tour card component
```

---

## Architecture & Key Patterns

### Next.js App Router
- Uses **App Router** (not Pages Router). Root `layout.tsx` is a Server Component.
- The `(overview)` route group wraps the app in a **client-side layout** with all context providers.
- `/upc/[id]` uses an **async Server Component** with `params: Promise<{id}>` (Next.js 16 pattern).
- **Server Actions** (`'use server'`) in `actions.ts` and `gameupc-hooks/server` proxy external API
  calls to keep tokens secret. Never call external APIs with auth tokens from client components.

### State Management — Hybrid Approach

1. **Redux Toolkit** — Global state for BGG user + collection data.
   - Store created per-request via `makeStore()`.
   - Always import typed hooks from `@/app/lib/hooks` (not directly from `react-redux`).
2. **React Context** — Feature-specific state via providers.
   - All providers are nested in `src/app/(overview)/layout.tsx`.
   - When adding a new provider, register it in that layout.
3. **Dexie (IndexedDB)** — Persistent client-side storage.
   - Two databases: `db` (settings, plugins, collections) and `cache` (images, responses).

### Barcode Scanning
- Uses `@react-barcode-scanner/components` → `@undecaf/zbar-wasm` (WASM-based detection).
- `@undecaf/zbar-wasm` is in `serverExternalPackages` in `next.config.ts` — do not bundle it on server.
- pnpm override pins `@undecaf/zbar-wasm` to `^0.11.0`.

### Plugin System
- Plugins are JSON-defined templates stored in Dexie.
- Templates use `{{mustache}}` syntax (via `@blakeembrey/template`) for URL generation.
- `type` field: `link`; `location` field: `details` | `actions`.
- Built-in plugins: BGG Links, BGG Market, Board Game Stats.
- To add a plugin: create JSON in `src/app/lib/plugins/`, register in `plugins.ts`.

### Styling
- **Tailwind CSS v4** via `@tailwindcss/postcss` (not the legacy PostCSS plugin).
- **DaisyUI v5** loaded via `@plugin 'daisyui'` in `globals.css`.
- Custom CSS variants: `ios-safari`, `xs` (max-width: 375px).
- Responsive breakpoints detected programmatically via `TailwindProvider` (DOM probing).
- Google Fonts: Geist, Geist Mono, Share Tech.

### External APIs
1. **BGG XML API v2** — collection/user data; requires `BGG_TOKEN`; retries up to 20× on 202.
2. **GameUPC API** (`api.gameupc.com`) — UPC lookup; requires `GAMEUPC_TOKEN`.

### Browser Extension
- Firefox extension `.xpi` files live in `public/extension/firefox/`.
- Extension types and hooks: `src/app/lib/extension/`.

---

## Key Files Reference

| File | Purpose |
|---|---|
| `src/app/(overview)/layout.tsx` | Provider nesting order — all context providers composed here |
| `src/app/(overview)/page.tsx` | Main scanner page |
| `src/app/lib/actions.ts` | Server Actions — BGG API proxy |
| `gameupc-hooks/server` | Server Actions — GameUPC API proxy |
| `src/app/lib/GameUPCDataProvider.tsx` | GameUPC context backed by `gameupc-hooks/useGameUPC` |
| `src/app/lib/database/database.ts` | Dexie schema — settings, plugins, collections |
| `src/app/lib/database/cacheDatabase.ts` | Dexie schema — image and response caching |
| `src/app/lib/redux/store.ts` | Redux store factory |
| `src/app/lib/plugins/plugins.ts` | Plugin system — built-in plugins and plugin map |
| `src/app/ui/Scanner.tsx` | Barcode scanner UI |
| `next.config.ts` | `serverExternalPackages`, image domains, dev origins |
| `package.json` | `pnpm.overrides`, `pnpm.patchedDependencies`, peer rules |
| `copilot-instructions.md` | Full code style guide (formatting, naming, patterns) |

---

## Dependency Notes & Gotchas

- **pnpm only** — never use `npm install` or `yarn`. The project relies on pnpm overrides and patches.
- **Patched dependency**: `@undecaf/barcode-detector-polyfill@0.9.23` is patched to use a local
  `zbar-wasm` import instead of a CDN URL. If this package is upgraded, regenerate the patch.
- **pnpm overrides**: `@undecaf/zbar-wasm` pinned to `^0.11.0` across all transitive dependencies.
- **Peer dependency rules**: TypeScript 6 and ESLint 10 explicitly allowed in `pnpm.peerDependencyRules`.
- **`next.lock/`**: Locks CDN resources used by Next.js — not a standard lockfile, do not delete.
- **No tests**: No test files, no test runner. Lint + build are the only automated quality gates.
- **Node version**: v24 (see `.nvmrc`). Use `nvm use` if your node version differs.
- **`@bpmn-io/form-js`**: Listed as a dependency but may be an experimental/future feature.
  Do not remove it without verifying it's unused across the whole codebase.

---

## Code Style (Summary)

The full style guide is in `copilot-instructions.md` at the repository root. Key rules:

### Formatting
- **Indentation**: 4 spaces. No tabs. No Prettier.
- **Semicolons**: Always.
- **Quotes**: Single quotes in TS/TSX; backticks for templates; double quotes only in JSX string attributes.
- **Trailing commas**: Yes, in multi-line object literals, arrays, parameter lists, import lists.

### TypeScript Naming
- Types/interfaces: `PascalCase`, always `type` keyword (not `interface`).
- True constants: `UPPER_SNAKE_CASE`.
- Const objects used as enums/maps: `PascalCase`.
- Variables/functions: `camelCase`. React components: `PascalCase`. Hooks: `camelCase` prefixed `use`.
- Context providers: `PascalCase` suffixed `Provider`. Redux slices: file named `slice.ts`.

### Imports
- Always use `@/*` path alias for internal imports (never `../../`).
- Import typed Redux hooks only from `@/app/lib/hooks`.
- Group: internal `@/` imports first, then external library imports.
- Use `import type` or `import { type X }` for type-only imports.

### Functions
- Prefer `const` arrow functions for everything except Next.js page/layout components.
- Use `function` declarations only for `export default function Page()` / `Layout()`.
- Guard clauses at top of functions; always use braces for `if` blocks.

### React Components
- Return fragments (`<>`) for multiple top-level elements.
- Conditional rendering: `&&` for presence, ternary for alternatives.
- Destructure props in parameters.
- Use `void expression` to suppress unused-variable warnings on intentionally unused values.

### Context Provider Pattern
```typescript
const FeatureContext = createContext<{ value: T; setValue: (v: T) => void }>({ ... });
export const useFeature = () => useContext(FeatureContext);
export const FeatureProvider = ({ children }: { children: ReactNode }) => {
    const [value, setValue] = useState<T>(initial);
    return <FeatureContext.Provider value={{ value, setValue }}>
        {children}
    </FeatureContext.Provider>;
};
```

### Redux Slice Pattern
```typescript
const SLICE_TITLE = 'FEATURE';
const initialState: FeatureState = {};
export const featureSlice = createSlice({
    name: `${SLICE_TITLE}_SLICE`,
    initialState,
    reducers: { ... },
});
export const { actionName } = featureSlice.actions;
export default featureSlice.reducer;
```

### Async Patterns
- `.then()` for fire-and-forget: `getGameData(code).then();`
- `await` when result is needed.
- `useTransition` for non-blocking async state updates.
- `useEffect` cleanup pattern: `let active = true; return () => { active = false; };`

### Styling (Tailwind)
- Template literals for multi-line class strings.
- Template literal interpolation for conditional classes: `${condition ? 'class-a' : 'class-b'}`.
- Use DaisyUI classes directly: `btn`, `modal`, `badge`, `loading`, `collapse`, `tooltip`, etc.
- CSS custom properties via `style={{ '--prop': 'value' } as CSSProperties}`.

---

## Common Recipes

### Add a new page
1. Create `src/app/(overview)/feature/page.tsx`.
2. Add `'use client';` if interactive.
3. It inherits all context providers from `(overview)/layout.tsx` automatically.

### Add a new context provider
1. Create `src/app/lib/FeatureProvider.tsx` following the provider pattern above.
2. Add it to the nested provider chain in `src/app/(overview)/layout.tsx`.
3. Export a `useFeature` hook from the file.

### Add a new Redux slice
1. Create `src/app/lib/redux/bgg/feature/slice.ts` following the slice pattern above.
2. Add a `selectors.ts` file in the same directory for computed values.
3. Register the reducer in `bggSlice.ts` (`combineReducers`) or in `store.ts`.

### Add a new plugin
1. Create a JSON file in `src/app/lib/plugins/` following the `ShelfScanPlugin` type.
2. Register it in `plugins.ts` under `builtInPlugins`.

### Add a server action
1. Create or edit a `'use server'` file (`actions.ts` for BGG, `server.ts` for domain-specific).
2. Export named async arrow functions — no classes.
3. Access `process.env.*` tokens only inside server action files.
4. Use `Object.assign` (not spread) for merging headers.

---

## Deployment

- Deployed to **Vercel** on push to main (`pnpm build`).
- Set `BGG_TOKEN` and `GAMEUPC_TOKEN` in Vercel environment settings.
- `@vercel/analytics` is integrated in the root layout.
