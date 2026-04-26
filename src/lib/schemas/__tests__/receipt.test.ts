import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { receiptSchema } from "@/lib/schemas/receipt";

const validReceipt = {
  date: "23/04/2026",
  merchant: "Oxxo",
  totalAmount: 152.5,
  currency: "MXN",
  expenseType: "Daily Expense",
  paymentMethod: "Cash",
  accountNumber: "xxxx0354",
};

describe("receiptSchema", () => {
  it("accepts a fully valid receipt object", () => {
    const result = receiptSchema.parse(validReceipt);
    expect(result).toEqual(validReceipt);
  });

  it("rejects when date is missing", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { date: _, ...noDate } = validReceipt;
    expect(() => receiptSchema.parse(noDate)).toThrow(ZodError);
  });

  it("rejects when totalAmount is a string", () => {
    expect(() =>
      receiptSchema.parse({ ...validReceipt, totalAmount: "152.50" }),
    ).toThrow(ZodError);
  });

  it("rejects when merchant is missing", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { merchant: _, ...noMerchant } = validReceipt;
    expect(() => receiptSchema.parse(noMerchant)).toThrow(ZodError);
  });

  it("rejects an empty object with multiple issues", () => {
    try {
      receiptSchema.parse({});
      expect.fail("Expected ZodError");
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
      expect((error as ZodError).issues.length).toBeGreaterThan(1);
    }
  });

  it("validates date format matches DD/MM/YYYY pattern", () => {
    expect(() =>
      receiptSchema.parse({ ...validReceipt, date: "2026-04-23" }),
    ).toThrow(ZodError);

    expect(() =>
      receiptSchema.parse({ ...validReceipt, date: "4/23/2026" }),
    ).toThrow(ZodError);

    expect(() =>
      receiptSchema.parse({ ...validReceipt, date: "23/04/2026" }),
    ).not.toThrow();
  });
});
