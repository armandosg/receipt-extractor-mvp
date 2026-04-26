/**
 * @module formatTsv
 * @description Converts a {@link Receipt} object into a tab-separated string
 * suitable for pasting into a spreadsheet.
 */

import type { Receipt } from "@/lib/schemas/receipt";

/**
 * Strips tab and newline characters from a string value.
 * @param value - The raw field value.
 * @returns The sanitized string with tabs and newlines removed.
 */
function sanitize(value: string): string {
  return value.replaceAll(/[\t\r\n]/g, " ");
}

/**
 * Formats a {@link Receipt} as a tab-separated string.
 *
 * Column order: Date → Merchant → Total → Currency → Expense Type → Payment Method → Account Number.
 * @param receipt - The validated receipt data.
 * @returns A single-line TSV string (no trailing newline).
 */
export function formatReceiptToTsv(receipt: Receipt): string {
  return [
    sanitize(receipt.date),
    sanitize(receipt.merchant),
    String(receipt.totalAmount),
    sanitize(receipt.currency),
    sanitize(receipt.expenseType),
    sanitize(receipt.paymentMethod),
    sanitize(receipt.accountNumber),
  ].join("\t");
}
