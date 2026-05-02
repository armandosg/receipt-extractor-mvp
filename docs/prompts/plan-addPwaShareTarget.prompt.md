# Plan: Convert App to PWA with Web Share Target

## TL;DR
Convert the receipt extractor into a Progressive Web App using @serwist/next for service worker management and the Web Share Target API so users can share receipt images/PDFs from other phone apps (gallery, email, etc.) directly into the app. The service worker intercepts the shared file, stores it temporarily, and redirects to the main page where it's auto-loaded into the uploader.

## Steps

### Phase A: PWA Foundation (steps 1–5)

1. **Install dependencies**
   - `npm install @serwist/next` and `npm install -D serwist`

2. **Create PWA icons**
   - Generate and place icon files in `public/icons/`: `icon-192x192.png`, `icon-512x512.png`, `icon-maskable-192x192.png`, `icon-maskable-512x512.png`
   - Also add an Apple touch icon `apple-touch-icon.png` (180×180)

3. **Create web app manifest** — `src/app/manifest.ts`
   - Use Next.js `MetadataRoute.Manifest` type
   - Set `name`, `short_name`, `description`, `start_url: "/"`, `display: "standalone"`, `theme_color`, `background_color`, icons array
   - Add `share_target` config:
     - `action: "/share-target"` (POST endpoint)
     - `method: "POST"`, `enctype: "multipart/form-data"`
     - `params.files: [{ name: "receipt", accept: ["image/jpeg", "image/png", "image/webp", "application/pdf", "image/*"] }]`

4. **Update `src/app/layout.tsx` metadata**
   - Update `metadata` export: set `applicationName`, proper `title`, `description`, `appleWebApp` config
   - Add `viewport` export with `themeColor`

5. **Configure Serwist in `next.config.ts`**
   - Wrap config with `withSerwist()` from `@serwist/next`
   - Set `swSrc: "src/app/sw.ts"`, `swDest: "public/sw.js"`
   - Update `tsconfig.json`: add `"@serwist/next/typings"` to `compilerOptions.types`, add `"WebWorker"` to `compilerOptions.lib`
   - Add `public/sw*` and `public/swe-worker*` to `.gitignore`

### Phase B: Service Worker + Share Target Handling (steps 6–8)

6. **Create service worker** — `src/app/sw.ts`
   - Initialize Serwist with precache entries, `skipWaiting`, `clientsClaim`, default runtime caching
   - Add custom `fetch` event listener **before** `serwist.addEventListeners()` to intercept POST requests to `/share-target`:
     - Extract file from `event.request.formData()`
     - Store the file in the Cache API under a known key (e.g., cache name `"share-target-files"`, key `"/shared-receipt"`)
     - Respond with `Response.redirect("/", 303)` to navigate user to the main page

7. **Create share target route** — `src/app/share-target/route.ts`
   - Next.js Route Handler as fallback (if SW doesn't intercept for some reason)
   - `POST` handler: extract file from request formData, store in a temporary mechanism or just redirect to `/`
   - This ensures the URL `/share-target` exists and doesn't 404 during manifest validation

8. **Create offline fallback page** — `src/app/~offline/page.tsx`
   - Simple page indicating the user is offline
   - Precached by Serwist for offline navigation fallback

### Phase C: Frontend Integration (steps 9–10)

9. **Create shared file hook** — `src/hooks/useSharedFile.ts`
   - On mount, check Cache API for a stored shared file under the known key
   - If found, retrieve it as a `File` object, delete the cache entry, and return it
   - Returns `{ sharedFile: File | null, isLoading: boolean }`

10. **Update `src/app/page.tsx`** to consume shared files
    - Use `useSharedFile()` hook
    - When a shared file is detected, pass it to `ReceiptUploader` via a new `initialFile` prop
    - *Parallel with step 11*

11. **Update `src/components/ReceiptUploader.tsx`** to accept shared files
    - Add optional `initialFile?: File` prop
    - When `initialFile` changes (and is non-null), call existing `handleFile()` logic to load and preview it
    - Optionally auto-trigger processing (or just load the file and let user tap "Process Receipt")
    - *Parallel with step 10*

### Phase D: Testing & Verification (steps 12–14)

12. **Write unit tests for the share target route handler**
    - Test that POST with a file returns a 303 redirect
    - Test that POST without a file returns a 303 redirect (graceful degradation)

13. **Write unit test for `useSharedFile` hook**
    - Mock Cache API — test that it retrieves and clears the cached file
    - Test that it returns null when no shared file exists

14. **Manual verification on mobile**
    - Build production: `npm run build && npm start`
    - Open on phone (or use Chrome DevTools mobile emulation + Lighthouse)
    - Install PWA from browser
    - Share an image from the phone's gallery to the app
    - Verify the file auto-loads in the uploader

## Relevant files

- `next.config.ts` — wrap with `withSerwist()` (currently minimal config)
- `src/app/manifest.ts` — **new file**, web app manifest with `share_target`
- `src/app/sw.ts` — **new file**, service worker with share target fetch handler
- `src/app/layout.tsx` — update `metadata` and add `viewport` export
- `src/app/page.tsx` — add `useSharedFile()` hook integration, pass `initialFile` to uploader
- `src/app/share-target/route.ts` — **new file**, fallback route handler for share target
- `src/app/~offline/page.tsx` — **new file**, offline fallback page
- `src/hooks/useSharedFile.ts` — **new file**, hook to retrieve shared files from Cache API
- `src/components/ReceiptUploader.tsx` — add `initialFile` prop, wire into `handleFile()`
- `tsconfig.json` — add Serwist typings and WebWorker lib
- `.gitignore` — add `public/sw*` entries
- `public/icons/` — **new directory**, PWA icon assets

## Verification

1. `npm run build` — production build succeeds (Serwist compiles SW)
2. `npm run lint` — no ESLint errors
3. `npm test -- --run` — all existing + new tests pass
4. Run Lighthouse PWA audit on `http://localhost:3000` — passes installability checks
5. On Android Chrome: install PWA → share image from Gallery → app opens with file loaded → process receipt works
6. Verify that the normal upload flow (drag-and-drop, click-to-browse) still works unchanged

## Decisions

- **Service worker library**: @serwist/next (maintained Workbox-based solution, recommended by Next.js docs)
- **Share target data flow**: SW intercepts POST → stores file in Cache API → redirects to `/` → page reads from cache. This avoids needing server-side file storage.
- **Cache API over IndexedDB**: Cache API is simpler for storing Request/Response pairs and accessible from both SW and main thread
- **Auto-process on share**: No — load the file into the uploader and let the user tap "Process Receipt" (matches existing UX, avoids surprise API calls)
- **Offline support**: Minimal — offline fallback page only. The app requires an API call to function, so full offline mode is out of scope.
- **Browser support**: Chrome/Edge 89+ on Android. Safari and Firefox do NOT support Web Share Target API. iOS Safari supports PWA installation but not share targets.

## Resolved Questions

1. **PWA Icons**: No existing brand assets — create simple placeholder icons for MVP.
2. **Auto-process after share**: No auto-process. Load file into uploader, user taps "Process Receipt" to confirm.
3. **Theme colors**: `theme_color: "#2563EB"`, `background_color: "#F9FAFB"`.
4. **App name**: Keep "Receipt Extractor" as both `name` and `short_name`.
5. **Share target file types**: Accept `image/*` broadly in manifest (+ `application/pdf`). Server action still validates supported types — user gets a clear error if they share an unsupported format.
