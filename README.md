# ShelfScan

See the app at https://ShelfScan.io!

Read about what you can
do with it - and watch demo videos - on the
[BGG blog](https://boardgamegeek.com/blog/16520/shelfscan-news).

This app began as a demo / implementation app for the
https://gameupc.com APIs.

Its purpose is to allow someone to scan
board game UPCs and work with the associated games
returned by GameUPC.

With just the app, you can help update the GameUPC database
and audit your BoardGameGeek game collection.

A browser extension (in testing) which works along with
the app allows you to do things like:

- Add the game to your BoardGameGeek collection
- Post a copy of the game for sale in the BGG GeekMarket
- Log a basic game play on BoardGameGeek

A 'plugin' manager allows you to integrate other web apps with
ShelfScan using simple JSON.

The app is built with `TypeScript`, `React`, `Next.js`,
`tailwindcss`, and more, and utilizes my library
`@react-barcode-scanner/components` for barcode
scanning using a webcam or phone camera.

At this time the app is not licensed for modification.  Message me
if you'd like to discuss contributing or forking the app.

### Barcode Images
- [Sample barcodes to scan](./assets/game-barcodes/UPCs.md)

### Barcode Links

- [Sample verified game link](https://shelfscan.io/upc/111111111111)
- [Sample needs-verification game link](https://shelfscan.io/upc/222222222222)
- [Sample no information game link](https://shelfscan.io/upc/333333333333)
<!-- - [Official testing barcodes](./assets/game-barcodes/testing/UPCs.md) -->