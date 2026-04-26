import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

// Mock processReceipt at the module level — ReceiptUploader imports it directly
const processReceiptMock = vi.fn();
vi.mock("@/actions/processReceipt", () => ({
  processReceipt: (...args: unknown[]) => processReceiptMock(...args),
}));

vi.mock("browser-image-compression", () => ({
  default: vi.fn((file: File) => Promise.resolve(file)),
}));

vi.mock("@/lib/logger", () => ({
  default: { debug: vi.fn(), warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

// jsdom stubs
globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-preview-url");
globalThis.URL.revokeObjectURL = vi.fn();

const mockReceiptData = {
  date: "23/04/2026",
  merchant: "Oxxo",
  totalAmount: 152.5,
  currency: "MXN",
  expenseType: "Daily Expense",
  paymentMethod: "Cash",
  accountNumber: "xxxx0354",
};

function createMockFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("Receipt extraction full flow", () => {
  const writeTextMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });
  });

  it("uploads a file, processes it, shows results, and copies TSV", async () => {
    // Make processReceipt resolve after a tick so we can observe the spinner
    let resolveProcessReceipt!: (value: unknown) => void;
    processReceiptMock.mockReturnValue(
      new Promise((resolve) => {
        resolveProcessReceipt = resolve;
      }),
    );

    const user = userEvent.setup();
    render(<Home />);

    // 1. Page renders with title
    expect(screen.getByText("Receipt Extractor")).toBeInTheDocument();

    // 2. Select a file
    const input = screen.getByTestId("file-input");
    const file = createMockFile("receipt.jpg", 200_000, "image/jpeg");
    await user.upload(input, file);

    // File name appears in preview
    await waitFor(() => {
      expect(screen.getByText("receipt.jpg")).toBeInTheDocument();
    });

    // 3. Click "Process Receipt"
    const submitBtn = screen.getByRole("button", { name: /process receipt/i });
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    // 4. Loading spinner appears
    await waitFor(() => {
      expect(screen.getByText("Processing receipt…")).toBeInTheDocument();
    });

    // 5. Resolve the server action with mock data
    resolveProcessReceipt({ success: true, data: mockReceiptData });

    // 6. Result card renders with extracted data
    await waitFor(() => {
      expect(screen.getByText("Extracted Receipt Data")).toBeInTheDocument();
    });
    expect(screen.getByText("Oxxo")).toBeInTheDocument();
    expect(screen.getByText("23/04/2026")).toBeInTheDocument();
    expect(screen.getByText("152.5")).toBeInTheDocument();
    expect(screen.getByText("MXN")).toBeInTheDocument();
    expect(screen.getByText("Daily Expense")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("xxxx0354")).toBeInTheDocument();

    // 7. Copy button is visible — re-mock clipboard (userEvent.setup replaces it)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    fireEvent.click(screen.getByRole("button", { name: /copy as tsv/i }));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        "23/04/2026\tOxxo\t152.5\tMXN\tDaily Expense\tCash\txxxx0354",
      );
    });

    // 8. Checkmark feedback
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });

  it("shows error message when server action fails", async () => {
    processReceiptMock.mockResolvedValue({
      success: false,
      error: "Failed to extract receipt data.",
    });

    const user = userEvent.setup();
    render(<Home />);

    const input = screen.getByTestId("file-input");
    const file = createMockFile("receipt.png", 100_000, "image/png");
    await user.upload(input, file);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /process receipt/i }),
      ).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: /process receipt/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Failed to extract receipt data.",
      );
    });
  });
});
