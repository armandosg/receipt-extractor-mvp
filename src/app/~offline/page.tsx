/**
 * Offline fallback page displayed when the user navigates to the app
 * without a network connection. Precached by the service worker so it
 * is always available.
 * @returns A JSX element representing the offline fallback page.
 */
export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">
        You&apos;re offline
      </h1>
      <p className="max-w-md text-gray-600">
        Receipt Extractor needs an internet connection to process receipts.
        Please check your connection and try again.
      </p>
    </main>
  );
}
