import { http, HttpResponse } from "msw";

/**
 * Default mock receipt data returned by the Gemini handler.
 * Matches the {@link Receipt} schema from `src/lib/schemas/receipt.ts`.
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
 * Builds the Google Generative AI API response envelope expected by the
 * Vercel AI SDK (`@ai-sdk/google`).
 * @param data - The structured JSON object to embed in the response text.
 * @returns A response body matching the Gemini `generateContent` format.
 */
export function geminiResponse(data: unknown) {
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
 * MSW request handlers for test-time network interception.
 *
 * Includes a handler for the Google Generative AI `generateContent` endpoint
 * used by the Vercel AI SDK when calling Gemini models.
 */
export const handlers = [
  /**
   * Intercepts POST requests to the Gemini `generateContent` endpoint and
   * returns a mock receipt extraction response.
   */
  http.post(
    String.raw`https://generativelanguage.googleapis.com/v1beta/models/:modelId\:generateContent`,
    () => {
      return HttpResponse.json(geminiResponse(MOCK_RECEIPT));
    },
  ),
];
