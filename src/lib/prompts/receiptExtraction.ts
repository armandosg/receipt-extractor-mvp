/**
 * Extraction prompt sent to the AI model alongside a receipt image or PDF.
 * @module receiptExtraction
 * @description Instructs Google Gemini to extract structured fields from a
 * receipt, handling both Spanish and English text, and normalizing values
 * (e.g. dates to DD/MM/YYYY, totals as plain numbers).
 */

/**
 * System-level prompt for receipt data extraction.
 *
 * Tells the AI to:
 * - Auto-detect the receipt language (Spanish or English).
 * - Normalize the date to DD/MM/YYYY.
 * - Return the total as a number without currency symbols.
 * - Infer the currency, expense category, and payment method.
 */
export const RECEIPT_EXTRACTION_PROMPT = [
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
].join("\n");
