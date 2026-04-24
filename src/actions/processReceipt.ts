"use server";

/**
 * Server action for processing receipt images/PDFs via Google Gemini.
 * @module processReceipt
 * @description Accepts a FormData object containing a receipt file (image or PDF),
 * sends it to the Gemini 2.5 Flash model for structured data extraction, and
 * returns a validated {@link Receipt} object or an error message.
 */

import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { type Receipt, receiptSchema } from "@/lib/schemas/receipt";
import log from "@/lib/logger";

/** MIME types accepted for receipt processing. */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/**
 * Discriminated union returned by {@link processReceipt}.
 * success - `true` when extraction succeeded, `false` otherwise.
 * data - The extracted {@link Receipt} (only when `success` is `true`).
 * error - A human-readable error message (only when `success` is `false`).
 */
export type ProcessReceiptResult =
  | { success: true; data: Receipt }
  | { success: false; error: string };

/**
 * Extract structured receipt data from an uploaded file.
 * @param formData - A `FormData` instance with a `receipt` field containing a
 *   `File` (JPEG, PNG, WebP, or PDF). Files with unsupported MIME types are
 *   rejected before any AI call is made.
 * @returns A {@link ProcessReceiptResult} — either the parsed receipt data or
 *   an error message describing what went wrong.
 * Internally the function:
 * 1. Validates the uploaded file's presence and MIME type.
 * 2. Reads the file into a `Buffer`.
 * 3. Sends the buffer to Gemini 2.5 Flash via the Vercel AI SDK's
 *    `generateText` helper with structured output, together with an extraction prompt.
 * 4. Returns the schema-validated result or catches and logs any error.
 */
export async function processReceipt(
  formData: FormData,
): Promise<ProcessReceiptResult> {
  try {
    // 1. Extract and validate file
    const file = formData.get("receipt");

    if (!(file instanceof File)) {
      return { success: false, error: "No receipt file provided." };
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      log.warn(
        `Rejected file with unsupported MIME type: ${file.type} (${file.name})`,
      );
      return {
        success: false,
        error: `Unsupported file type "${file.type}". Please upload a JPEG, PNG, WebP image, or a PDF.`,
      };
    }

    // 3. Read file into Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    log.debug(
      `Processing receipt — file: ${file.name}, type: ${file.type}, size: ${buffer.byteLength} bytes`,
    );

    // 4. Call Gemini via AI SDK
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      output: Output.object({ schema: receiptSchema }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              data: buffer,
              mediaType: file.type,
            },
            {
              type: "text",
              text: [
                "Extract structured data from the attached receipt image or PDF.",
                "",
                "Instructions:",
                "- Auto-detect the language (Spanish or English).",
                "- For `date`: extract and normalize to DD/MM/YYYY format regardless of the original format on the receipt.",
                "- For `merchant`: extract the store or vendor name.",
                "- For `totalAmount`: extract the final total as a number without currency symbols.",
                "- For `currency`: infer the currency from context (default to MXN if ambiguous).",
                "- For `expenseType`: infer a category from the items (e.g. 'Daily Expense', 'Groceries', 'Service', 'Installment').",
                "- For `paymentMethod`: infer from any payment information on the receipt, or 'Unknown' if not visible.",
              ].join("\n"),
            },
          ],
        },
      ],
    });

    if (!result.output) {
      return { success: false, error: "The AI model did not return structured data." };
    }

    log.info(
      `Receipt extracted successfully — merchant: ${result.output.merchant}`,
    );

    return { success: true, data: result.output };
  } catch (error) {
    log.error("Failed to process receipt:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    return { success: false, error: message };
  }
}
