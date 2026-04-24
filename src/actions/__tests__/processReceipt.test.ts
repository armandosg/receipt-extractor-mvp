// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { MOCK_RECEIPT, geminiResponse } from "@/mocks/handlers";
import { processReceipt } from "@/actions/processReceipt";

beforeAll(() => {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
});

/**
 * Helper to build a FormData with a receipt file attached.
 *
 * @param name - File name including extension.
 * @param type - MIME type of the file.
 * @param content - Optional raw string content for the file blob.
 * @returns A FormData with the file under the `receipt` key.
 */
function buildFormData(
  name: string,
  type: string,
  content = "fake-file-content",
): FormData {
  const file = new File([content], name, { type });
  const formData = new FormData();
  formData.append("receipt", file);
  return formData;
}

/** URL pattern used to override the Gemini handler in specific tests. */
const GEMINI_URL = String.raw`https://generativelanguage.googleapis.com/v1beta/models/:modelId\:generateContent`;

describe("processReceipt", () => {
  it("extracts receipt data from a JPEG image", async () => {
    const formData = buildFormData("receipt.jpg", "image/jpeg");

    const result = await processReceipt(formData);

    expect(result).toEqual({ success: true, data: MOCK_RECEIPT });
  });

  it("extracts receipt data from a PDF", async () => {
    const formData = buildFormData("receipt.pdf", "application/pdf");

    const result = await processReceipt(formData);

    expect(result).toEqual({ success: true, data: MOCK_RECEIPT });
  });

  it("rejects an unsupported file type", async () => {
    const formData = buildFormData("notes.txt", "text/plain");

    const result = await processReceipt(formData);

    expect(result).toEqual({
      success: false,
      error: expect.stringContaining("Unsupported file type"),
    });
  });

  it("returns an error when no file is provided", async () => {
    const formData = new FormData();

    const result = await processReceipt(formData);

    expect(result).toEqual({
      success: false,
      error: "No receipt file provided.",
    });
  });

  it("returns an error when the AI API fails", async () => {
    server.use(
      http.post(GEMINI_URL, () => {
        return HttpResponse.json(
          { error: { message: "Forbidden", status: "PERMISSION_DENIED" } },
          { status: 403 },
        );
      }),
    );

    const formData = buildFormData("receipt.jpg", "image/jpeg");
    const result = await processReceipt(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it("returns an error when the AI returns malformed data", async () => {
    server.use(
      http.post(GEMINI_URL, () => {
        return HttpResponse.json(
          geminiResponse({ invalid: "not a receipt" }),
        );
      }),
    );

    const formData = buildFormData("receipt.png", "image/png");
    const result = await processReceipt(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });
});
