# ShelfScan

See the app at https://ShelfScan.io!

Read about workflows and using the app [here](https://ShelfScan.io/workflows/)!

Read about what you can
do with it - and watch demo videos - on the
[BGG blog](https://boardgamegeek.com/blog/16520/shelfscan-news).

---

ShelfScan is a board game UPC barcode scanner and board game collection management web app.

Scan game barcodes with your mobile device camera or webcam, look up game data via the
[GameUPC API](https://gameupc.com), and interact with your
[BoardGameGeek](https://boardgamegeek.com) collection — all from the browser.

With just the app, you can:

- Scan game UPCs and identify games via the GameUPC database
- Audit your collection by comparing physical games against your BGG data
- Load and browse your BGG collection with rich filtering and sorting
- View scan history and see which scanned games are missing from your collection
- Help update the GameUPC database by verifying game/version associations

A browser extension for **Firefox/Android** and **[Gear](https://gear4.app)/iOS** and compatible desktop browsers works alongside the app
and enables direct BGG updates. Updating is available to [BoardGameGeek supporters](https://boardgamegeek.com/support) with a low-cost subscription:

- Add games to your BGG collection (individually or in bulk via Batch Scan)
- Post games for sale in the BGG GeekMarket
- Log game plays on BoardGameGeek
- Set previously owned, for trade, wishlist, and other statuses
- Much more — see the [Workflows page](https://shelfscan.io/workflows/)

A **plugin manager** lets you integrate other web apps and sites (e.g.
[BG Stats](https://bgstatsapp.com), [Dust & Dice](https://dustanddice.app), 
[Dice Tower](https://dicetower.com)) with ShelfScan using simple JSON definitions.

---

### Tech Stack

| | |
|---|---|
| **Language** | TypeScript 6 |
| **Framework** | Next.js 16 (App Router, Server Actions) |
| **UI** | React 19 |
| **Styling** | Tailwind CSS v4 + DaisyUI v5 |
| **Scanning** | [`@react-barcode-scanner/components`](https://github.com/jmparsons/react-barcode-scanner) backed by [`@undecaf/zbar-wasm`](https://github.com/undecaf/zbar-wasm) |
| **State** | Redux Toolkit + React Context |
| **Persistence** | Dexie (IndexedDB) + localStorage |
| **Data APIs** | BGG XML API v2 · GameUPC JSON API (via `gameupc-hooks`) |
| **Testing** | Vitest |
| **Package manager** | pnpm |
| **Deployment** | Vercel |

At this time the app is not licensed for modification. Message me
if you'd like to discuss contributing or forking the app.

---

### Sample Session

- [Sample scanning session](https://shelfscan.io/?u=auhgeaaf.a6qhsifv.8xpr0k48.19ep3ngxq.1wa2w78td.bcpzlcgs.2ui4plrn9.1bzdy84iq.1c3wzemki.8ejpqxn5.auib8nrk.9azysvve)

### Barcode Images
- [Sample barcodes to scan](./assets/game-barcodes/UPCs.md)

### Barcode Links

- [Sample verified game link](https://shelfscan.io/upc/111111111111)
- [Sample needs-verification game link](https://shelfscan.io/upc/222222222222)
- [Sample no information game link](https://shelfscan.io/upc/333333333333)
