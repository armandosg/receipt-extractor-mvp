import { describe, expect, it } from "vitest";
import { formatReceiptToTsv } from "@/lib/utils/formatTsv";
import type { Receipt } from "@/lib/schemas/receipt";

const validReceipt: Receipt = {
  date: "23/04/2026",
  merchant: "Oxxo",
  totalAmount: 152.5,
  currency: "MXN",
  expenseType: "Daily Expense",
  paymentMethod: "Cash",
  accountNumber: "xxxx0354",
};

describe("formatReceiptToTsv", () => {
  it("returns correct tab-separated string for a valid Receipt", () => {
    const result = formatReceiptToTsv(validReceipt);
    expect(result).toBe("23/04/2026\tOxxo\t152.5\tMXN\tDaily Expense\tCash\txxxx0354");
  });

  it("column order is Date, Merchant, Total, Currency, ExpenseType, PaymentMethod", () => {
    const parts = formatReceiptToTsv(validReceipt).split("\t");
    expect(parts).toEqual([
      "23/04/2026",
      "Oxxo",
      "152.5",
      "MXN",
      "Daily Expense",
      "Cash",
      "xxxx0354",
    ]);
  });

  it("strips tab characters from field values", () => {
    const receipt: Receipt = {
      ...validReceipt,
      merchant: "Oxxo\tStore",
    };
    const parts = formatReceiptToTsv(receipt).split("\t");
    expect(parts[1]).toBe("Oxxo Store");
  });

  it("strips newline characters from field values", () => {
    const receipt: Receipt = {
      ...validReceipt,
      merchant: "Oxxo\nStore\r\nMain",
    };
    const parts = formatReceiptToTsv(receipt).split("\t");
    expect(parts[1]).toBe("Oxxo Store  Main");
  });
});
