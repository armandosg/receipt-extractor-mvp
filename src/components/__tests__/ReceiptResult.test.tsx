import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReceiptResult from "../ReceiptResult";
import type { Receipt } from "@/lib/schemas/receipt";

const mockReceipt: Receipt = {
  date: "23/04/2026",
  merchant: "Oxxo",
  totalAmount: 152.5,
  currency: "MXN",
  expenseType: "Daily Expense",
  paymentMethod: "Cash",
  accountNumber: "xxxx0354",
};

describe("ReceiptResult", () => {
  it("renders all Receipt fields correctly", () => {
    render(<ReceiptResult data={mockReceipt} />);

    expect(screen.getByText("Extracted Receipt Data")).toBeInTheDocument();
    expect(screen.getByText("23/04/2026")).toBeInTheDocument();
    expect(screen.getByText("Oxxo")).toBeInTheDocument();
    expect(screen.getByText("152.5")).toBeInTheDocument();
    expect(screen.getByText("MXN")).toBeInTheDocument();
    expect(screen.getByText("Daily Expense")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("xxxx0354")).toBeInTheDocument();
  });

  it("renders labels for each field", () => {
    render(<ReceiptResult data={mockReceipt} />);

    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Merchant")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Currency")).toBeInTheDocument();
    expect(screen.getByText("Expense Type")).toBeInTheDocument();
    expect(screen.getByText("Payment Method")).toBeInTheDocument();
    expect(screen.getByText("Account Number")).toBeInTheDocument();
  });
});
