import http from "node:http";

/**
 * Mock receipt data returned by the mock Gemini server.
 * Matches the Receipt schema from src/lib/schemas/receipt.ts.
 */
const MOCK_RECEIPT = {
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
 * Vercel AI SDK.
 * @param data - The structured JSON object to embed in the response.
 * @returns A response body matching the Gemini generateContent format.
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

/** Current mock server response mode. */
let mode: "success" | "error" = "success";

const server = http.createServer((req, res) => {
  // Drain the request body to avoid connection issues
  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => chunks.push(chunk));
  req.on("end", () => {
    // Control endpoints for per-test mode switching
    if (req.method === "POST" && req.url === "/__control/error") {
      mode = "error";
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
      return;
    }

    if (req.method === "POST" && req.url === "/__control/success") {
      mode = "success";
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
      return;
    }

    // Gemini generateContent endpoint
    if (req.method === "POST" && req.url?.includes(":generateContent")) {
      if (mode === "error") {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: { message: "Internal server error" } }),
        );
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(geminiResponse(MOCK_RECEIPT)));
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });
});

/** Port the mock server listens on. */
export const MOCK_PORT = 3099;

/**
 * Start the mock Gemini API server.
 * @returns A promise that resolves when the server is listening.
 */
export function startMockServer(): Promise<void> {
  return new Promise((resolve) => {
    server.listen(MOCK_PORT, () => resolve());
  });
}

/**
 * Stop the mock Gemini API server.
 * @returns A promise that resolves when the server has closed.
 */
export function stopMockServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}
