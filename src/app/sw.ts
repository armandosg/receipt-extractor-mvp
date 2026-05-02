import { defaultCache } from "@serwist/next/worker";
import { Serwist, type PrecacheEntry } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

/** Cache name used to temporarily store files shared via the Web Share Target API. */
const SHARE_TARGET_CACHE = "share-target-files";

/** Cache key under which the shared receipt file is stored. */
const SHARED_RECEIPT_KEY = "/shared-receipt";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [{ url: "/~offline", matcher({ request }) { return request.destination === "document"; } }],
  },
});

/**
 * Intercept POST requests to `/share-target` from the Web Share Target API.
 *
 * When a user shares a file to this PWA, the OS sends a POST with the file as
 * multipart/form-data. The service worker extracts the first file, stores it in
 * the Cache API under a well-known key, and redirects the client to `/` where
 * the {@link useSharedFile} hook picks it up.
 */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === "/share-target" && event.request.method === "POST") {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const file = formData.get("receipt");

        if (file) {
          const cache = await caches.open(SHARE_TARGET_CACHE);
          await cache.put(
            SHARED_RECEIPT_KEY,
            new Response(file, {
              headers: {
                "Content-Type": (file as File).type,
                "X-File-Name": (file as File).name,
              },
            }),
          );
        }

        return Response.redirect("/", 303);
      })(),
    );
    return;
  }
});

serwist.addEventListeners();
