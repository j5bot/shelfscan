# Ghostbusters Virginia — Fundraising Data Fetcher

A simple, dependency-free JavaScript application that queries the
**Blackbaud Luminate Online TeamRaiser API** to retrieve the fundraising
goal and current amount raised for the *Ghostbusters Virginia* Make-A-Wish
team — without an API key.

---

## What this project does

- Calls `https://site.wish.org/site/CRTeamraiserAPI` with `fr_id=7464` and
  `team_id=58435`.
- Tries multiple method names in sequence until one succeeds:
  1. `getTeamProgress`
  2. `getFundraisingResults`
  3. `getEventSummary`
- Displays the **fundraising goal**, **amount raised**, and a **progress bar**
  in the browser.
- Logs the full raw JSON response to the browser console for debugging.
- Can also be run directly in **Node.js 18+** (which has `fetch` built-in).

---

## How to run

### Option A — Serve locally (recommended, avoids CORS issues)

```bash
npx serve .
```

Then open **http://localhost:3000** (or whichever port `serve` picks) in your
browser and click **Fetch Fundraising Data**.

### Option B — Open the file directly in a browser

```
ghostbusters-wish/index.html
```

> **Note:** Some browsers block `fetch()` requests from `file://` URLs due to
> CORS restrictions. If you see an error, use Option A instead.

### Option C — Node.js (no browser needed)

Requires Node.js 18 or later (built-in `fetch`):

```bash
node fetch.js
```

---

## API details

| Parameter         | Value                                   |
|-------------------|-----------------------------------------|
| Base URL          | `https://site.wish.org/site/CRTeamraiserAPI` |
| `fr_id`           | `7464`                                  |
| `team_id`         | `58435`                                 |
| `v`               | `1.0`                                   |
| `response_format` | `json`                                  |
| `api_key`         | *(omitted — testing unauthenticated access)* |

Example full URL:

```
https://site.wish.org/site/CRTeamraiserAPI?method=getTeamProgress&fr_id=7464&team_id=58435&v=1.0&response_format=json
```

---

## CORS notes

The API is hosted on a different domain (`site.wish.org`). Browsers enforce
the **Same-Origin Policy**, so a `fetch()` call from a `file://` URL (or a
different domain) may be blocked with a CORS error.

**What to try if you see a CORS error:**

1. **Serve locally** — run `npx serve .` and open `http://localhost:3000`.
   Some APIs allow requests from `localhost`.
2. **Check the browser console** — look for `Access-Control-Allow-Origin`
   headers in the network response.
3. **Use a CORS proxy** — wrap the URL with a proxy like
   `https://corsproxy.io/?<encoded-url>` (only for development/testing).
4. **Server-side fetch** — move the `fetch()` call to a small backend
   (e.g., Node.js/Express, Python/Flask) which is not subject to CORS.

---

## Trying different method names

If `getTeamProgress` returns an error like `"Invalid method"` or `"API key
required"`, the app automatically falls back to:

- `getFundraisingResults` — returns aggregate event totals; may include team
  breakdown depending on the event configuration.
- `getEventSummary` — broader event-level summary; useful to confirm that the
  API is reachable at all.

The raw JSON from every attempt is logged to the browser console. Open
**DevTools → Console** to inspect the response structure and identify the
correct field names for `goal` and `raised`.

---

## Files

| File         | Description                                      |
|--------------|--------------------------------------------------|
| `index.html` | Browser UI — button, stat boxes, progress bar    |
| `fetch.js`   | API logic — builds URL, fetches, parses, updates UI |
| `README.md`  | This file                                        |
