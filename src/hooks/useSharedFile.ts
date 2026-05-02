"use client";

import { useEffect, useState } from "react";

/** Cache name matching the one used by the service worker's share target handler. */
const SHARE_TARGET_CACHE = "share-target-files";

/** Cache key matching the one used by the service worker's share target handler. */
const SHARED_RECEIPT_KEY = "/shared-receipt";

/**
 * Retrieves a file shared via the Web Share Target API.
 *
 * On mount the hook checks the Cache API for a file stored by the service
 * worker's share-target fetch handler. If found, it converts the cached
 * response back into a {@link File} object, deletes the cache entry, and
 * returns it. Subsequent renders return `null`.
 * @returns An object with `sharedFile` (the retrieved {@link File} or `null`)
 *          and `isLoading` (`true` while the cache lookup is in progress).
 */
export function useSharedFile() {
  const [sharedFile, setSharedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkForSharedFile() {
      try {
        if (!("caches" in window)) return;

        const cache = await caches.open(SHARE_TARGET_CACHE);
        const response = await cache.match(SHARED_RECEIPT_KEY);

        if (!response) return;

        const blob = await response.blob();
        const fileName =
          response.headers.get("X-File-Name") ?? "shared-receipt";
        const file = new File([blob], fileName, { type: blob.type });

        // Clean up the cache entry so it isn't re-read on next navigation
        await cache.delete(SHARED_RECEIPT_KEY);

        setSharedFile(file);
      } finally {
        setIsLoading(false);
      }
    }

    checkForSharedFile();
  }, []);

  return { sharedFile, isLoading };
}
