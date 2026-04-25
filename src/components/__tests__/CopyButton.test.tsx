import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CopyButton from "../CopyButton";
import type { Receipt } from "@/lib/schemas/receipt";

const mockReceipt: Receipt = {
  date: "23/04/2026",
  merchant: "Oxxo",
  totalAmount: 152.5,
  currency: "MXN",
  expenseType: "Daily Expense",
  paymentMethod: "Cash",
};

describe("CopyButton", () => {
  const writeTextMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });
  });

  it("calls navigator.clipboard.writeText with correct TSV string", async () => {
    render(<CopyButton data={mockReceipt} />);

    fireEvent.click(screen.getByRole("button", { name: /copy as tsv/i }));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        "23/04/2026\tOxxo\t152.5\tMXN\tDaily Expense\tCash",
      );
    });
  });

  it("shows checkmark feedback after click", async () => {
    render(<CopyButton data={mockReceipt} />);

    fireEvent.click(screen.getByRole("button", { name: /copy as tsv/i }));

    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });
  });

  it("reverts to Copy as TSV label after feedback", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(<CopyButton data={mockReceipt} />);

    fireEvent.click(screen.getByRole("button", { name: /copy as tsv/i }));

    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText("Copy as TSV")).toBeInTheDocument();
    });

    vi.useRealTimers();
  });
});
