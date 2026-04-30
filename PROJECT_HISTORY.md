# ShelfScan Project History & Design Notes

ShelfScan began with the idea of addressing two problems, both involving working with large quantities of games.

First, how to most quickly research games to decide which you're interested in when at a store or swap event.

Second, how to manage a large board game library with frequent influx, sales, and trades.

For research, the best information was going to come from BoardGameGeek.  So too, de facto collection management through BoardGameGeek made sense.  While the BGG collection interface leaves a lot to be desired, there was always an intention to eventually provide an alternate interface with better UI/UX.

When I read about the GameUPC.com API project, its promise to allow users to cross-reference games on BoardGameGeek by UPC made the initial workflows feasible.

## GameUPC

GameUPC and its API exists to curate a community created and management database mapping verified UPCs to game/version entries on BGG.  As part of using the API and based on my own desire to help the community of fellow board game enthusiasts, the decision was made to make the identification and verification of associations of UPCs to games and versions a primary concern and not a hidden consideration.

## Early Development: Barcode Scanning

Development of ShelfScan began with barcode scanning.  I determined that it was a good separate project to take on; one that would prove the feasibility of a larger application based on scanning.

My initial efforts did not bear much fruit.  The computer webcams I tested with did not focus well at the distances needed to scan games.

The phones and tablets didn't fare much better. I found that the multiple cameras of modern phones were a hindrance rather than a help.  The browser APIs and devices' own APIs did not surface each camera as a media device accessible by my client-side JavaScript code at the time.

I developed strategies involving scaling video in an attempt to provide a better scanning experience.  While I judged scanning to be less-than-ideal with my solutions, I decided to press forward with an app to connect web/phone camera barcode scanning with the GameUPC API.

After the initial launch of ShelfScan, I was able to overcome these limitations as device vendors' camera definitions and browser APIs matured and offer a smooth scanning experience from phone and tablet cameras.

## Design Considerations / Technical Limitations

The primary technical limitation that I set for myself when designing the project is that it would be (as much as possible)
a purely client-side application.  Caching and local data persistence would be paramount considerations, technically.

Barcode scanning as the first step in the workflow would be front-and-center.  The interface should strongly encourage the user to get scanning and surface the other features as a second or even third step in the workflow.

Gather first, process second.

## Tech Stack

The tech stack would grow to be:

  - Language: Typescript/JavaScript
  - Styling: TailwindCSS and DaisyUI
  - Framework: NextJS for application routing & server logic
  - UI: React for presentation and application logic (along with Server Side Rendering - SSR)
  - Scanning: Homegrown @react-barcode-scanner/components library
  - State: Redux, Redux-Toolkit, and React Context
  - Data: BoardGameGeek XMLAPI and GameUPC JSON API (via homegrown gameupc-hooks library)
  - Source Control: Git / GitHub
  - Deployment: Vercel for hosting and deployment
  - Caching & Database: IndexedDB (via Dexie)
  - Persistence: IndexedDB (via Dexie) and local storage
  - Image Processing: image-blob-reduce / pica for resizing

## Technical Implementation

### Server Actions

In order to avoid leaking ShelfScan's the API tokens for BGG and GameUPC, Next/React's server actions are employed.  In combination with a `useTransition` hook to integrate server-side calls with client-side code, the same functions that I developed before the need for BGG tokens, and while working with GameUPC's API using the available test endpoint and token,
are leveraged without security concerns.

### BGG Collection State

The decision was made early to use Redux for state management, at least of the data for a user's BGG collection.  Again, I had some patterns and code from previous projects that I could adapt for this purpose.

After receiving a response from the BGG XMLAPI `collection` endpoint, I transform the data into JSON objects and store it in state for use throughout the application.

### BGG XMLAPI Caching

To avoid frequent calls to the BoardGameGeek XMLAPI, the application implements a response cache via the Dexie database.
Should it ever be deemed necessary, this caching approach could be extended to the GameUPC API easily.

### BGG Image Resizing & Caching

Requests for images from BoardGameGeek are made through a proxy (NextJS rewrites, currently) to enable access to the
raw data.  The blobs obtained through this process are processed by the image-blob-reduce library (a wrapper around pica)
in order to resize them down to 400 x 400 pixels maximum size.  Requests are queued and while the fetches and resizing
are being done, the BGG thumbnails are shown.

Resized blobs are cached in IndexedDB via Dexie, similarly to the XMLAPI responses, keyed by the URL of the image and the
max size.

### Plugins / Interaction with External Sites

Since there is such easy access to the BoardGameGeek game and version ids retrieved through GameUPC, and looking at the
code I wrote for providing links to them, it became obvious that I could provide the ability to interact with external
apps, through a plugin system.

I added the ability to import plugins in JSON format into the application through a management interface in 'Settings'.

The application provides built-in plugins which can be enabled for integration with BGG market and BG Stats, in addition
to the always-enabled plugins for links to BGG game and version.

### Breakpoint & Dark Mode Detection

I wanted easy access to which TailwindCSS breakpoint was in effect via JavaScript and whether dark mode was being used.
A React Context provider does DOM size probing, finding when elements have `.clientWidth` and setting the context
provider value appropriately for the breakpoint that is in effect and whether dark mode is in effect.

