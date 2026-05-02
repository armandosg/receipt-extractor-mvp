import { NextResponse } from "next/server";

/**
 * Fallback POST handler for the Web Share Target endpoint.
 * In normal operation the service worker intercepts POST requests to
 * `/share-target` before they reach the server. This route handler exists as a
 * fallback so that:
 * 1. The URL `/share-target` resolves during manifest validation (no 404).
 * 2. If the SW hasn't activated yet, the user is still redirected to `/`.
 * @returns A redirect response to the home page.
 *
 * Note: The actual file handling logic is implemented in the service worker (`src/app/sw.ts`), which intercepts the POST request, extracts the shared file, and stores it in the Cache API. This route handler simply ensures that the endpoint exists and provides a fallback redirect.
 */
export async function POST() {
  return NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
    303,
  );
}
