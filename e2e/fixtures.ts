import { test as base, type Page } from "@playwright/test";

/**
 * Mock receipt data matching the shape from src/mocks/handlers.ts.
 * Used by the Gemini API route mock to return deterministic responses.
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
 * Builds the Gemini generateContent response envelope expected by the
 * Vercel AI SDK (`@ai-sdk/google`).
 * @param data - The structured JSON object to embed in the response.
 * @returns A response body matching the Gemini `generateContent` format.
 */
function geminiResponse(data: unknown) {
  return {
    candidates: [
      {
        content: {
          parts: [{ text: JSON.stringify(data) }],
          role: "model",
        },
        finishReason: "STOP",
      },
    ],
    usageMetadata: {
      promptTokenCount: 100,
      candidatesTokenCount: 50,
      totalTokenCount: 150,
    },
  };
}

/**
 * Intercepts Gemini API requests on the given page and returns a
 * successful mock receipt response.
 * @param page - The Playwright page to intercept requests on.
 */
export async function mockGeminiAPI(page: Page) {
  await page.route(
    "**/generativelanguage.googleapis.com/**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(geminiResponse(MOCK_RECEIPT)),
      });
    },
  );
}

/**
 * Intercepts Gemini API requests on the given page and returns an error.
 * @param page - The Playwright page to intercept requests on.
 */
export async function mockGeminiAPIError(page: Page) {
  await page.route(
    "**/generativelanguage.googleapis.com/**",
    async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: "Internal server error" } }),
      });
    },
  );
}

/**
 * Extended Playwright test fixture that automatically mocks the Gemini API
 * with a successful response before each test.
 */
export const test = base.extend<{ geminiMock: void }>({
  geminiMock: [
    async ({ page }, use) => {
      await mockGeminiAPI(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
