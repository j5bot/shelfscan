# GameUPC Scanner

This app is a demo / implementation app for the
https://gameupc.com APIs.

Its purpose is to allow someone to scan
board game UPCs and help update the BGG
game and GameUPC databases with the proper
UPCs for each version of a game.

Future extensions may allow you to add a
game to your BGG collection by scanning it,
including assigning the correct version when
possible.

The app is built with `Next.js` and utilizes
`@react-barcode-scanner/hooks` for barcode
scanning using a webcam or phone camera.h