# ShelfScan

This app is a demo / implementation app for the
https://gameupc.com APIs.

Its purpose is to allow someone to scan
board game UPCs and display BGG game info for the
scanned games.

Future extensions will allow you to add a
game to your BGG collection by scanning it,
including assigning the correct version when
possible.

The app is built with `Next.js` and utilizes
my library
`@react-barcode-scanner/components` for barcode
scanning using a webcam or phone camera.

### Barcode Images
- [Sample barcodes to scan](./assets/game-barcodes/UPCs.md)
- [Official testing barcodes](./assets/game-barcodes/testing/UPCs.md)