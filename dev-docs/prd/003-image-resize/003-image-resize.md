# PRD 003 — Image Resize and Cache

## Problem

`thumbnail_url` on `BggInfo` and `BggVersion` (from `gameupc-hooks/types`) is a small BGG CDN
image (typically ~100×100px). When rendered at 250–350px in `ThumbnailBox` / `Thumbnail` via
`object-contain`, the browser upscales it, producing a blurry result.

`image_url` on the same types points to the full-resolution BGG image (often 600–800px+), but it
is not currently fetched or cached. Downloading and resizing it client-side, then storing the blob
in the existing Dexie `cacheDatabase.images` table, will produce sharp thumbnails with no backend
changes.

---

## Goal

1. **Immediate display** — render the `thumbnail_url` at the target size instantly, slightly
   blurred, using only the browser's built-in image scaling (no extra fetch).
2. **Background upgrade** — fetch `image_url` in the background, resize it to a max of 350px on
   its longest side, as a jpg image at 0.9 quality, using `image-blob-reduce`, then swap in the 
   sharpened result 
   and persist the
   resized blob to the Dexie image cache.
3. **Cache hit** — on subsequent renders, load the cached resized blob immediately (no blur, no
   background fetch).

---

## Scope

### Files to change

| File | Change |
|---|---|
| `src/app/lib/hooks/useImagePropsWithCache.ts` | Core logic — add two-phase loading (placeholder → upgraded) |
| `src/app/ui/games/Thumbnail.tsx` | Pass `image_url` (normal URL) alongside `thumbnail_url` (placeholder URL); apply blur class during loading phase |
| `src/app/lib/database/cacheDatabase.ts` | No schema change needed; cache key convention change (see below) |

### New dependency

Add `image-blob-reduce` via `pnpm add image-blob-reduce @types/image-blob-reduce`.
This library uses a canvas/OffscreenCanvas pipeline to resize image blobs without a server round-trip.

---

## Detailed Behaviour

### Hook: `useImagePropsWithCache`

Add a second optional param `placeholderSrc?: string` alongside the existing `src` (which becomes
the "normal" / high-res URL).

**Phase 1 — placeholder (synchronous, no fetch)**
- If `placeholderSrc` is provided and no cache entry exists for the normal-image ID, immediately
  resolve the promise with `src = rewriteImageSrc(placeholderSrc)` and `isPlaceholder = true`.
- This is a plain URL string — the browser fetches and renders it natively, no JS download needed.

**Phase 2 — background upgrade**
- In `useEffect`, check the Dexie cache for the normal-image ID (key: `src|maxSize`, e.g.
  `https://…/image_url|350`).
- **Cache hit**: load the blob, create an object URL, re-resolve the promise with the object URL
  and `isPlaceholder = false`.
- **Cache miss**: `enqueueFetch` the normal `src` URL (using the existing fetch queue), run the
  response blob through `image-blob-reduce` at `maxSize: 350`, call `addImageDataToCache`, then
  re-resolve as above.
- Guard all async steps with an `active` flag (already the pattern in this hook).

**Promise re-resolution**
The existing `promiseRef` pattern re-creates the promise on deps change. For Phase 2, call
`promiseRef.current.resolve(updatedProps)` once the upgraded blob is ready — components using
`use(promise)` will re-render automatically because the promise resolves with a new value.
If the promise has already resolved (Phase 1 value), create and immediately resolve a new promise
so `use()` picks up the upgrade without a Suspense boundary re-triggering.

### Cache key

Use the normal image URL + max dimension as the cache ID, e.g.:
```
makeImageCacheId({ src: normalUrl, width: 350, height: 350, quality: 80 })
```
This keeps the key consistent with the existing `makeImageCacheId` helper.

### Components: `Thumbnail` and `ThumbnailBox`

- Receive both `url` (thumbnail / placeholder) and `imageUrl` (normal / high-res) as props, or
  derive `imageUrl` from `url` by stripping BGG `fit-in` size parameters if `imageUrl` is not
  separately available from the data layer.
- Pass `src = imageUrl`, `placeholderSrc = url` to `useImagePropsWithCache`.
- Apply `blur-sm` Tailwind class (or `style={{ filter: 'blur(2px)' }}`) while `isPlaceholder` is
  `true`; remove on upgrade. Use a CSS transition (`transition-[filter] duration-200`) for a
  smooth crossfade.
- Display size target: `350px` for `ThumbnailBox`.

---

## Acceptance Criteria

1. On first scan of a UPC, the thumbnail appears immediately (blurred) from the browser-native
   `thumbnail_url`; within a few seconds (network permitting) it sharpens to the resized
   `image_url` version and the blur fades out.
2. On subsequent renders (page reload, re-navigation), the sharp image loads immediately from
   the Dexie cache with no blur.
3. The Dexie cache stores one entry per normal image URL (not one per thumbnail URL), keyed as
   described above.
4. No regression in the `ImageCacheManager` settings UI — `getImageCacheUsage()` still accurately
   reports blob sizes and entry count.
5. `pnpm lint` and `pnpm build` pass with no new errors.

---

## Out of Scope

- Server-side image resizing or a Next.js `/_next/image` proxy.
- Resizing avatar images in `NavDrawer` (separate concern).
- Changing the `rewriteImageSrc` proxy routes.
