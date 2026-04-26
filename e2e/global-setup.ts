import { startMockServer, stopMockServer } from "./mock-server";

/**
 * Playwright global setup: starts the mock Gemini API server
 * before any tests run.
 * @returns A teardown function that stops the mock server.
 */
async function globalSetup() {
  await startMockServer();
  console.log("[E2E] Mock Gemini server started on port 3099");

  return async () => {
    await stopMockServer();
    console.log("[E2E] Mock Gemini server stopped");
  };
}

export default globalSetup;
