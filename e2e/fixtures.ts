import { test as base, type APIRequestContext } from "@playwright/test";
import { MOCK_PORT } from "./mock-server";

/**
 * Mock receipt data matching the shape from src/mocks/handlers.ts.
 * Used for asserting expected values in tests.
 */
export const MOCK_RECEIPT = {
  date: "15/04/2026",
  merchant: "Oxxo",
  totalAmount: 125.5,
  currency: "MXN",
  expenseType: "Daily Expense",
  paymentMethod: "Cash",
  accountNumber: "xxxx0354",
};

/**
 * Switch the mock Gemini server to error mode via its control endpoint.
 * @param request - Playwright API request context.
 */
export async function setMockError(request: APIRequestContext) {
  await request.post(`http://localhost:${MOCK_PORT}/__control/error`);
}

/**
 * Switch the mock Gemini server back to success mode via its control endpoint.
 * @param request - Playwright API request context.
 */
export async function setMockSuccess(request: APIRequestContext) {
  await request.post(`http://localhost:${MOCK_PORT}/__control/success`);
}

/**
 * Extended Playwright test fixture that resets the mock server to success
 * mode after each test to prevent cross-test contamination.
 */
export const test = base.extend<{ mockReset: void }>({
  mockReset: [
    async ({ request }, use) => {
      await use();
      await setMockSuccess(request);
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
