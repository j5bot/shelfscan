# Code Instructions — ShelfScan Style Guide

This document defines the coding conventions used throughout the ShelfScan project. Follow these rules precisely when writing or modifying code.

---

## General Formatting

- **Indentation**: 4 spaces. Never tabs.
- **Semicolons**: Always use semicolons at the end of statements.
- **Quotes**: Single quotes (`'`) for all string literals in TypeScript/TSX. Use backticks (`` ` ``) for template literals. Double quotes (`"`) only inside JSX attribute values where the value is a plain string (but single quotes are also acceptable — the codebase mixes both; prefer single quotes for consistency with the majority).
- **Trailing commas**: Use trailing commas in multi-line object literals, arrays, parameter lists, and import lists.
- **No Prettier**: There is no Prettier config. Formatting is manual/IDE-driven.
- **Line length**: No hard limit, but long Tailwind class strings are broken across lines using template literals or multi-line `className` strings.

---

## TypeScript

### Naming Conventions
- **Types and interfaces**: `PascalCase`. Use `type` keyword, not `interface`.
  ```typescript
  export type BggUser = { ... };
  export type ScannerProps = { ... };
  ```
- **Constants (true constants)**: `UPPER_SNAKE_CASE` for immutable configuration objects and numeric constants.
  ```typescript
  const MAX_ATTEMPTS = 20;
  const SCANNER_SIZES = { NONE: ..., XS: ..., SM: ... };
  const SLICE_TITLE = 'BGG_USER';
  ```
- **Const objects used as enums or maps**: `PascalCase`.
  ```typescript
  export const PossibleStatuses = ['own', 'prevowned', ...] as const;
  export const TemplateTypes = { GAME: 'game', VERSION: 'version' } as const;
  export const ScannerSizes = { loading: ..., mobile: ... } as const;
  export const GameUPCStatus: Record<GameUPCStatus, GameUPCStatus> = { ... };
  ```
- **Variables and functions**: `camelCase`.
- **React components**: `PascalCase` — both the function name and the file name.
- **Custom hooks**: `camelCase` prefixed with `use`. File name matches: `useGameUPCApi.ts`.
- **Context providers**: `PascalCase` suffixed with `Provider`. File name matches: `SettingsProvider.tsx`.
- **Redux slices**: File named `slice.ts` inside a feature directory.
- **Selectors**: File named `selectors.ts` inside a feature directory.

### Type Declarations
- Prefer `type` over `interface`. The codebase uses `type` exclusively.
- Use `export type` for all types that are used across files.
- Co-locate types with the code that uses them when they're small, or place them in `lib/types/` when shared broadly.
- Use `Record<K, V>` for dictionary/map types.
  ```typescript
  export type BggCollectionMap = Record<BggCollectionId, BggCollectionItem>;
  export type ShelfScanSettings = Record<string, SettingEntity['value']>;
  ```
- Use `as const` for constant objects and arrays that should have narrow literal types.
- Use union types for status-like values:
  ```typescript
  export type GameUPCStatus = 'verified' | 'none' | 'choose_from_versions' | ...;
  ```
- For indexed/lookup access on types, use bracket notation:
  ```typescript
  export type TemplateType = ValueOf<typeof TemplateTypes>;
  export type PossibleStatus = PossibleStatuses[number];
  ```
- Props type for small components can be inline:
  ```typescript
  export const CodesProvider = ({ children }: { children: ReactNode }) => { ... };
  ```
- Props type for larger components should be a named `type`:
  ```typescript
  export type ScannerProps = { onScan: (code: string) => void };
  export function Scanner(props: ScannerProps) { ... }
  ```

### Type Assertions
- Use `as` keyword for type assertions.
  ```typescript
  const ids = (Object.keys(items) as unknown[]) as number[];
  ```
- Use `{} as Type` for context default values where a real default isn't available:
  ```typescript
  createContext<ReturnType<typeof useGameUPCApi>>({} as ReturnType<typeof useGameUPCApi>);
  ```

### Imports
- Use the `@/*` path alias for all internal imports. Never use relative paths that go up more than one directory (`../`). The only acceptable relative import is `../lib/tours` or similar single-parent references — prefer `@/` even for these.
  ```typescript
  import { useSettings } from '@/app/lib/SettingsProvider';
  import { RootState } from '@/app/lib/redux/store';
  ```
- Group imports by source, separated by newlines (though not rigidly enforced):
  1. Internal `@/` imports
  2. External library imports (`next/*`, `react`, `react-redux`, etc.)
- Use `import type` or `import { type X }` when importing only types, where it makes the intent clearer:
  ```typescript
  import type { Metadata } from 'next';
  import { type ShelfScanPlugin } from '../types/plugins';
  ```
- Destructure named exports in import statements:
  ```typescript
  import { createContext, ReactNode, useContext, useState } from 'react';
  ```

### Generics
- Use generics on utility functions:
  ```typescript
  export const removeFromArray = <T>(id: T, array: T[] = []) => ...;
  ```
- Multi-line generic constraints use standard indentation:
  ```typescript
  export const transformObjectKeys =
      <T extends string | number | symbol = string>(
          obj: Record<T, unknown>,
          transformFunction: (str: string) => string = snakeToLowerCamelCase,
      ) => ...;
  ```

---

## Functions & Arrow Functions

- **Prefer `const` arrow functions** for everything except page/layout components:
  ```typescript
  export const getBggUser = (response: string) => { ... };
  export const useTitle = (title: string) => { ... };
  export const CodesProvider = ({ children }: Props) => { ... };
  ```
- **Use `function` declarations** only for Next.js page and layout components (default exports):
  ```typescript
  export default function Page() { ... }
  export default function RootLayout({ children }: ...) { ... }
  export function Scanner(props: ScannerProps) { ... }
  ```
- Arrow function bodies: Use concise body (no braces) for one-liners. Use block body for multi-line.
  ```typescript
  export const getSetting = async (id: string) =>
      (await database.settings.get(id))?.value;
  
  export const setSetting = async (id: string, value: SettingEntity['value']) => {
      const hasSetting = await database.settings.get(id);
      // ...
  };
  ```
- Multi-line arrow function signatures: Break after `=` and indent the parameter list.
  ```typescript
  export const bggGetCollectionInner =
      async (username: string, attempts: number = 0): Promise<string> => {
          // ...
      };
  ```

---

## React Components

### File Structure
- One primary component export per file.
- Related helper functions and sub-components can live in the same file.
- Files in `ui/` are React components. Files in `lib/` are hooks, providers, services, types, or utilities.

### Component Declaration
- Page components: `export default function Page() { ... }` — named `Page`, `Layout`, or a descriptive `PascalCase` name.
- Non-default-export components: `export const ComponentName = (props: Props) => { ... };`
- Pages that need a named export at the bottom:
  ```typescript
  const ExtensionPage = () => { ... };
  export default ExtensionPage;
  ```

### `'use client'` Directive
- Place `'use client'` as the very first line of any file that uses React hooks, browser APIs, or event handlers.
- The `(overview)/layout.tsx` is a client component. All pages under it can be client components.
- Server Components do not have the directive (e.g., root `layout.tsx`, `upc/[id]/page.tsx`).
- Server Actions files use `'use server'` as the first line.

### JSX Patterns
- **Return fragments** (`<>...</>`) for components returning multiple top-level elements. Never wrap in unnecessary `<div>`.
- **Inline returns**: For short components, return JSX directly without assigning to a variable.
  ```typescript
  return <>
      <NavDrawer />
      <div>...</div>
  </>;
  ```
- **Opening `return` on same line**: The opening `<>` or `<div` goes on the same line as `return`.
  ```typescript
  return <div className="...">
      {children}
  </div>;
  ```
- **Conditional rendering**: Use `&&` for conditional presence, ternary for conditional alternatives.
  ```typescript
  {version?.name && <div>...</div>}
  {codes.length > 0 ? <Scanlist ... /> : <div>...</div>}
  ```
- **Logical short-circuit returns**: Components can return falsy to render nothing.
  ```typescript
  return compressedCodes.length > 0 && <div>...</div>;
  ```

### Props
- **Destructure props** at the top of the component or in parameters:
  ```typescript
  const { onScan } = props;
  // or
  export const CodesProvider = ({ children }: { children: ReactNode }) => { ... };
  ```
- Use `Readonly<{ children: React.ReactNode }>` for layout props (Next.js convention).
- Spread props onto elements when forwarding:
  ```typescript
  return <img className={...} {...imageProps} />;
  ```

### Hooks
- Destructure hook return values:
  ```typescript
  const { gameDataMap, getGameData, submitOrVerifyGame, removeGame } = useGameUPCData();
  ```
- Use `void expression` to suppress unused-variable warnings for intentionally unused destructured values:
  ```typescript
  void submitOrVerifyGame;
  void removeGame;
  void setForcedSize;
  ```
- Use `void e` for intentionally caught-and-ignored errors:
  ```typescript
  } catch (e) {
      void e;
      return { play: () => Promise.resolve() };
  }
  ```

---

## React Context Provider Pattern

This project uses a consistent pattern for all context providers. Follow it exactly:

```typescript
// 1. Import dependencies
import { createContext, ReactNode, useContext, useState } from 'react';

// 2. Define context value type (if complex)
export type Codes = string[];

// 3. Create context with default value
const CodesContext =
    createContext<{
        codes: Codes;
        setCodes: (codes: Codes) => void;
    }>({ codes: [], setCodes: () => undefined });

// 4. Define Props type (always { children: ReactNode })
type Props = {
    children: ReactNode;
};

// 5. Export consumer hook
export const useCodes = () =>
    useContext(CodesContext);

// 6. Export provider component
export const CodesProvider = ({ children }: Props) => {
    const [codes, setCodes] = useState<Codes>([]);

    return <CodesContext.Provider value={{ codes, setCodes }}>
        {children}
    </CodesContext.Provider>;
};
```

Key conventions:
- Context variable name: `PascalCaseContext` (e.g., `SettingsContext`, `CodesContext`).
- Hook name: `use` + feature name (e.g., `useSettings`, `useCodes`, `useGameUPCData`).
- Provider name: feature name + `Provider` (e.g., `SettingsProvider`, `CodesProvider`).
- Default context value: use `() => undefined` for function stubs, `{}` for empty objects, `{} as Type` when a real default isn't feasible.
- The `<Context.Provider>` JSX opening tag goes on the same line as `return`.
- Register new providers in `(overview)/layout.tsx` in the nested provider chain.

---

## Redux Toolkit Patterns

### Store
```typescript
export const makeStore = () => configureStore({
    reducer: { bgg },
});
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
```

### Slices
- File: `slice.ts` inside a feature directory.
- `SLICE_TITLE` constant in `UPPER_SNAKE_CASE`.
- Slice name: `${SLICE_TITLE}_SLICE`.
- Initial state as a typed constant.
- Export individual actions via destructuring.
- Default export the reducer.
```typescript
const SLICE_TITLE = 'BGG_USER';
const initialState: BggUserSliceState = {};

export const bggUserSlice = createSlice({
    name: `${SLICE_TITLE}_SLICE`,
    initialState,
    reducers: { ... },
});

export const { setBggUser } = bggUserSlice.actions;
export default bggUserSlice.reducer;
```

### Selectors
- File: `selectors.ts`.
- Use `memoize` from `proxy-memoize` for computed selectors, not `createSelector`.
- Selectors receive state as a tuple for `memoize` compatibility:
  ```typescript
  export const getCollectionInfoByObjectId =
      memoize(([state, id]: [RootState, number | undefined]) => { ... });
  ```

### Typed Hooks
- Always import `useSelector`, `useDispatch`, `useStore` from `@/app/lib/hooks` (pre-typed), never directly from `react-redux`.
  ```typescript
  import { useSelector, useDispatch } from '@/app/lib/hooks';
  ```

---

## Server Actions

- File starts with `'use server';` directive.
- Export individual async functions — no classes.
- Keep all `process.env` access inside server action files.
- Name pattern: verb + noun (e.g., `fetchGameDataForUpc`, `bggGetUserInner`, `warmupGameUPCApi`).
- Use `Object.assign` for merging headers/options (project convention, not spread):
  ```typescript
  args.headers = Object.assign({}, headerToAdd, args.headers);
  ```

---

## Styling (Tailwind CSS + DaisyUI)

### Class Names
- Use Tailwind utility classes directly in `className` attributes.
- For multi-line class lists, use **template literals** across multiple lines:
  ```tsx
  <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
      p-4 pb-10 rounded-xl
      bg-base-100 text-sm`}>
  ```
- For conditional classes, use template literal interpolation:
  ```tsx
  <div className={`relative w-full h-full
      ${currentUsername ? 'rounded-lg' : 'rounded-b-lg'}`}>
  ```
- For smart default prevention in utility components:
  ```tsx
  className={`svg-css-gauge
      ${className.includes('w-') ? '' : 'w-4'}
      ${className.includes('h-') ? '' : 'h-4'}
      ${className}`}
  ```

### DaisyUI
- Use DaisyUI component classes directly: `btn`, `btn-sm`, `modal`, `modal-box`, `badge`, `loading`, `loading-bars`, `checkbox`, `join`, `join-item`, `collapse`, `tooltip`, etc.
- DaisyUI theme tokens: `bg-base-100`, `bg-overlay`, etc.

### CSS Custom Properties
- Pass CSS custom properties via `style` with `as CSSProperties` cast:
  ```tsx
  style={{
      '--bgg-head-fill': 'currentColor',
  } as CSSProperties}
  ```

### Dark Mode
- Use Tailwind's `dark:` prefix for dark mode variants.
- The project detects dark mode programmatically via `TailwindProvider`.

### Inline Styles
- Use inline `style` objects for truly dynamic values (sizes, positions).
- Define reusable style objects as `const` within the component:
  ```typescript
  const formStyle = { fontSize: '0.8em' };
  const labelStyle = { fontSize: '0.7em', '--size-selector': '0.2rem' };
  ```

---

## Async Patterns

- **Use `.then()` chaining** for fire-and-forget calls:
  ```typescript
  warmupGameUPCApi().then();
  loadSettings().then();
  getGameData(code).then();
  ```
- **Use `await`** when the result is needed or for sequential operations:
  ```typescript
  const xml = await bggGetCollectionInner(username, 0);
  ```
- **Use `useTransition`** for non-blocking async state updates:
  ```typescript
  const [isPending, startTransition] = useTransition();
  startTransition(async () => { ... });
  ```
- **Cleanup pattern** in `useEffect` for async operations:
  ```typescript
  useEffect(() => {
      let active = true;
      (async () => {
          if (!active) return;
          // ... do work
      })();
      return () => { active = false; };
  }, dependencies);
  ```

---

## Error Handling

- Minimal `try/catch` — only where failure is expected and a fallback is needed.
- Use `void e` when catching an error that will be intentionally ignored.
- For fetch operations, prefer `.then()` chaining with implicit error propagation.
- Null/undefined: Use optional chaining (`?.`) and nullish coalescing (`??`) extensively:
  ```typescript
  const name = user?.getAttribute('name')?.toLowerCase();
  const rating = document.querySelector('traderating')?.getAttribute('value') ?? '0';
  ```

---

## File Organization Rules

| Category | Location | Naming |
|---|---|---|
| Pages | `src/app/(overview)/feature/page.tsx` | `page.tsx` |
| Layouts | `src/app/(overview)/layout.tsx` | `layout.tsx` |
| UI Components | `src/app/ui/ComponentName.tsx` | `PascalCase.tsx` |
| UI Sub-components | `src/app/ui/feature/ComponentName.tsx` | `PascalCase.tsx` |
| Hooks | `src/app/lib/hooks/useHookName.ts` | `camelCase.ts` |
| Context Providers | `src/app/lib/FeatureProvider.tsx` | `PascalCase.tsx` |
| Redux Slices | `src/app/lib/redux/domain/feature/slice.ts` | `slice.ts` |
| Redux Selectors | `src/app/lib/redux/domain/feature/selectors.ts` | `selectors.ts` |
| Type Definitions | `src/app/lib/types/TypeName.ts` | `PascalCase.ts` or `camelCase.ts` |
| Services | `src/app/lib/services/provider/service.ts` | `service.ts` or `server.ts` |
| Server Actions | `src/app/lib/actions.ts` or `services/*/server.ts` | `server.ts` for domain-specific |
| Pure Utilities | `src/app/lib/utils/utilName.ts` | `camelCase.ts` |
| CSS | `src/app/globals.css` or co-located `.css` | `PascalCase.css` matching component |
| Constants | Co-located `constants.ts` | `constants.ts` |

---

## Miscellaneous Conventions

- **`void` operator**: Used to suppress TypeScript unused-variable errors for intentionally unused values. Also used to mark `.then()` calls whose result is intentionally discarded.
- **`Object.assign`**: Preferred over spread (`...`) for merging objects in several places (especially headers, reducer state). Both are used, but `Object.assign` appears in more performance-sensitive code.
- **No `null` returns from components**: Components return `undefined` (implicit) or falsy via `&&` short-circuit. `null` is used only in `useState<T | null>(null)`.
- **Boolean-ish checks**: Use `!!value` for truthy coercion. Use bare `if (!value)` for early returns.
- **Early returns**: Guard clauses at the top of functions for invalid state:
  ```typescript
  if (!item) { return; }
  if (!id) { return undefined; }
  ```
- **Multi-line ternaries**: Indent with `?` and `:` on new lines, aligned:
  ```typescript
  upc.includes('.') || upc.length < 12 ?
      convertFromCompressedCodes(upc.split('.')) :
      upc.split(',')
  ```
- **Switch/case with complex returns**: Use `switch (true)` for range-based matching:
  ```typescript
  switch (true) {
      case confidence >= 90:
          return 'lightgreen';
      case confidence >= 60:
          return 'lightblue';
      default:
          return 'crimson';
  }
  ```
- **`React` import**: Import `React` explicitly (not just for JSX — it's used for types like `React.ReactNode`, `ReactNode`, `SyntheticEvent`, etc.).
- **No barrel files**: Each module exports its own symbols. The only index file is `hooks/index.ts` for re-exporting typed Redux hooks.

