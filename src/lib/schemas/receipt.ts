/**
 * @module receipt
 * @description Zod schema and TypeScript type for structured receipt data
 * extracted by the AI model. All fields are required and represent the
 * normalized output regardless of the original receipt language or format.
 */

import { z } from "zod";

/**
 * Zod schema for a receipt extracted by the AI model.
 *
 * Every field is a required string or number. The AI is responsible for
 * normalizing raw receipt text into the expected formats described below.
 */
export const receiptSchema = z.object({
  /** Date printed on the receipt, normalized to DD/MM/YYYY format. */
  date: z.string().describe("Date in DD/MM/YYYY format"),

  /** Store or vendor name as it appears on the receipt. */
  merchant: z.string().describe("Store or vendor name"),

  /** Final total amount as a number (no currency symbol). */
  totalAmount: z.number().describe("Final total as a number"),

  /** ISO 4217 or common currency abbreviation (e.g. MXN, USD). */
  currency: z.string().describe("Currency code (e.g. MXN, USD)"),

  /** AI-inferred expense category (e.g. "Daily Expense", "Groceries"). */
  expenseType: z.string().describe("AI-inferred expense category"),

  /** AI-inferred payment method (e.g. "Cash", "BBVA Debit", "Unknown"). */
  paymentMethod: z.string().describe("AI-inferred payment method"),
});

/** TypeScript type inferred from {@link receiptSchema}. */
export type Receipt = z.infer<typeof receiptSchema>;
