# ShelfScan Project History & Design Notes

ShelfScan began with the idea of addressing two problems, both involving working with large quantities of games.

First, how to most quickly research games to decide which you're interested in when at a store or swap event.

Second, how to manage a large board game library with frequent influx, sales, and trades.

For research, the best information was going to come from [BoardGameGeek](https://boardgamegeek.com). So too, de facto collection management through BoardGameGeek made sense. While the BGG collection interface leaves a lot to be desired, there was always an intention to eventually provide an alternate interface with better UI/UX.

When I read about the [GameUPC.com](https://gameupc.com) API project, its promise to allow users to cross-reference games on BoardGameGeek by UPC made the initial workflows feasible.

## GameUPC

[GameUPC](https://gameupc.com) and its API exists to curate a community created and managed database mapping verified UPCs to game/version entries on BGG. As part of using the API and based on my own desire to help the community of fellow board game enthusiasts, the decision was made to make the identification and verification of associations of UPCs to games and versions a primary concern and not a hidden consideration.

## Early Development: Barcode Scanning

Development of ShelfScan began with barcode scanning. I determined that it was a good separate project to take on; one that would prove the feasibility of a larger application based on scanning.

My initial efforts did not bear much fruit. The computer webcams I tested with did not focus well at the distances needed to scan games.

The phones and tablets didn't fare much better. I found that the multiple cameras of modern phones were a hindrance rather than a help. The [browser `MediaDevices` API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) and devices' own APIs did not surface each camera as a media device accessible by my client-side JavaScript code at the time.

I developed strategies involving scaling video in an attempt to provide a better scanning experience. While I judged scanning to be less-than-ideal with my solutions, I decided to press forward with an app to connect web/phone camera barcode scanning with the GameUPC API.

After the initial launch of ShelfScan, I was able to overcome these limitations as device vendors' camera definitions and browser APIs matured and offer a smooth scanning experience from phone and tablet cameras.

## Design Considerations / Technical Limitations

The primary technical limitation that I set for myself when designing the project is that it would be (as much as possible)
a purely client-side application. Caching and local data persistence would be paramount considerations, technically.

Barcode scanning as the first step in the workflow would be front-and-center. The interface should strongly encourage the user to get scanning and surface the other features as a second or even third step in the workflow.

Gather first, process second.

## Tech Stack

The tech stack would grow to be:

  - **Language:** [TypeScript](https://www.typescriptlang.org/) / JavaScript
  - **Styling:** [Tailwind CSS](https://tailwindcss.com/) and [DaisyUI](https://daisyui.com/) [^globals-css]
  - **Framework:** [Next.js](https://nextjs.org/) for application routing & server logic [^next-config]
  - **UI:** [React](https://react.dev/) for presentation and application logic (along with Server Side Rendering — SSR) [^layout]
  - **Scanning:** Homegrown [`@react-barcode-scanner/components`](https://github.com/jmparsons/react-barcode-scanner) library backed by [`@undecaf/zbar-wasm`](https://github.com/undecaf/zbar-wasm) [^scanner]
  - **State:** [Redux](https://redux.js.org/), [Redux Toolkit](https://redux-toolkit.js.org/), and [React Context](https://react.dev/reference/react/createContext) [^store] [^providers]
  - **Data:** [BoardGameGeek XML API v2](https://boardgamegeek.com/wiki/page/BGG_XML_API2) and [GameUPC JSON API](https://gameupc.com) (via homegrown `gameupc-hooks` library) [^actions] [^gameupc-hooks]
  - **Source Control:** [Git](https://git-scm.com/) / [GitHub](https://github.com/)
  - **Deployment:** [Vercel](https://vercel.com/) for hosting and deployment
  - **Caching & Database:** [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via [Dexie.js](https://dexie.org/)) [^database]
  - **Persistence:** IndexedDB (via Dexie) and [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
  - **Image Processing:** [`image-blob-reduce`](https://github.com/nodeca/image-blob-reduce) / [`pica`](https://github.com/nodeca/pica) for resizing [^image-utils]

## Technical Implementation

### Server Actions

In order to avoid leaking ShelfScan's API tokens for BGG and GameUPC, [Next.js / React Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) are employed. [^actions] In combination with a [`useTransition`](https://react.dev/reference/react/useTransition) hook to integrate server-side calls with client-side code, the same functions that I developed before the need for BGG tokens, and while working with GameUPC's API using the available test endpoint and token, are leveraged without security concerns.

### BGG Collection State

The decision was made early to use [Redux Toolkit](https://redux-toolkit.js.org/) for state management, at least of the data for a user's BGG collection. [^store] Again, I had some patterns and code from previous projects that I could adapt for this purpose.

After receiving a response from the [BGG XML API v2](https://boardgamegeek.com/wiki/page/BGG_XML_API2) `collection` endpoint, I transform the data into JSON objects [^bgg-service] and store it in state for use throughout the application.

### BGG XMLAPI Caching

To avoid frequent calls to the BoardGameGeek XMLAPI, the application implements a response cache via the [Dexie](https://dexie.org/) database. [^cache-db] Should it ever be deemed necessary, this caching approach could be extended to the GameUPC API easily.

### BGG Image Resizing & Caching

Requests for images from BoardGameGeek are made through a proxy ([Next.js rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites), currently) to enable access to the raw data. [^next-config] The blobs obtained through this process are processed by the [`image-blob-reduce`](https://github.com/nodeca/image-blob-reduce) library (a wrapper around [`pica`](https://github.com/nodeca/pica)) in order to resize them down to 400 × 400 pixels maximum size. Requests are queued and while the fetches and resizing are being done, the BGG thumbnails are shown.

Resized blobs are cached in [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) via [Dexie](https://dexie.org/), similarly to the XMLAPI responses, keyed by the URL of the image and the max size. [^cache-db]

### Plugins / Interaction with External Sites

Since there is such easy access to the BoardGameGeek game and version IDs retrieved through GameUPC, and looking at the code I wrote for providing links to them, it became obvious that I could provide the ability to interact with external apps through a plugin system.

I added the ability to import plugins in JSON format into the application through a management interface in **Settings**. [^plugins]

The application provides built-in plugins which can be enabled for integration with [BGG GeekMarket](https://boardgamegeek.com/market) and [BG Stats](https://www.bgstatsapp.com/), in addition to the always-enabled plugins for links to BGG game and version pages. [^plugins]

### Breakpoint & Dark Mode Detection

I wanted easy access to which [Tailwind CSS breakpoint](https://tailwindcss.com/docs/responsive-design) was in effect via JavaScript and whether dark mode was being used. A React Context provider does DOM size probing, finding when elements have `.clientWidth` and setting the context provider value appropriately for the breakpoint that is in effect and whether dark mode is in effect. [^tailwind-provider]

---

## Footnotes

[^globals-css]: Tailwind CSS v4 and DaisyUI v5 are configured in [`src/app/globals.css`](src/app/globals.css) via `@import "tailwindcss"` and `@plugin "daisyui"`.

[^next-config]: Next.js configuration — including image proxy rewrites, `serverExternalPackages` for `@undecaf/zbar-wasm`, and allowed dev origins — lives in [`next.config.ts`](next.config.ts).

[^layout]: The root Server Component layout (fonts, metadata, `<Analytics />`) is in [`src/app/layout.tsx`](src/app/layout.tsx). The client-side app shell with all context providers is in [`src/app/(overview)/layout.tsx`](src/app/(overview)/layout.tsx).

[^scanner]: The barcode scanner UI component, including responsive sizing and camera selection, is in [`src/app/ui/Scanner.tsx`](src/app/ui/Scanner.tsx). `@undecaf/zbar-wasm` is pinned via a pnpm override and a patch in [`patches/@undecaf__barcode-detector-polyfill@0.9.23.patch`](patches/@undecaf__barcode-detector-polyfill@0.9.23.patch).

[^store]: The Redux store factory (`makeStore`) and typed `RootState` / `AppDispatch` exports are in [`src/app/lib/redux/store.ts`](src/app/lib/redux/store.ts). The BGG feature reducer (combining `user` and `collection` slices) is in [`src/app/lib/redux/bgg/bggSlice.ts`](src/app/lib/redux/bgg/bggSlice.ts).

[^providers]: All React Context providers (Codes, GameSelections, GameUPCData, Settings, Plugins, SelectVersion, NextStep, TailwindBreakpoint) are composed in [`src/app/(overview)/layout.tsx`](src/app/(overview)/layout.tsx). Individual providers live in `src/app/lib/` — e.g. [`CodesProvider.tsx`](src/app/lib/CodesProvider.tsx), [`SettingsProvider.tsx`](src/app/lib/SettingsProvider.tsx).

[^actions]: BGG API proxy Server Actions (collection, user, thing endpoints; up to 20 retries on HTTP 202) are in [`src/app/lib/actions.ts`](src/app/lib/actions.ts). GameUPC proxy Server Actions are in `gameupc-hooks/server`.

[^gameupc-hooks]: GameUPC data fetching and context are wired together in [`src/app/lib/GameUPCDataProvider.tsx`](src/app/lib/GameUPCDataProvider.tsx) via the `gameupc-hooks/useGameUPC` hook.

[^bgg-service]: BGG XML API response parsing (collection items, user data, statuses) is in [`src/app/lib/services/bgg/service.ts`](src/app/lib/services/bgg/service.ts). XML DOM helpers are in [`src/app/lib/utils/xml.ts`](src/app/lib/utils/xml.ts).

[^database]: Main Dexie database (settings, plugins, collections, scan history, data forms) schema and helpers are in [`src/app/lib/database/database.ts`](src/app/lib/database/database.ts).

[^cache-db]: The Dexie cache database (images and XML API responses, keyed by URL + size) is defined in [`src/app/lib/database/cacheDatabase.ts`](src/app/lib/database/cacheDatabase.ts).

[^image-utils]: Image processing helpers (size extraction from BGG URLs) are in [`src/app/lib/utils/image.ts`](src/app/lib/utils/image.ts). Fetch queuing logic is in [`src/app/lib/utils/fetchQueue.ts`](src/app/lib/utils/fetchQueue.ts).

[^plugins]: Built-in plugin definitions (BGG Links, BGG Market, Board Game Stats, Dice Tower) are JSON files in [`src/app/lib/plugins/`](src/app/lib/plugins/) and registered in [`src/app/lib/plugins/plugins.ts`](src/app/lib/plugins/plugins.ts). The plugin management UI is in [`src/app/ui/settings/PluginManager.tsx`](src/app/ui/settings/PluginManager.tsx).

[^tailwind-provider]: Breakpoint and dark mode detection via hidden DOM elements and `clientWidth` probing is implemented in [`src/app/lib/TailwindProvider.tsx`](src/app/lib/TailwindProvider.tsx). It exports `useTailwindBreakpoint()` and `useTailwindDarkMode()` hooks for use throughout the app.
