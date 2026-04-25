import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReceiptUploader from "../ReceiptUploader";

vi.mock("@/actions/processReceipt", () => ({
  processReceipt: vi.fn(),
}));

vi.mock("browser-image-compression", () => ({
  default: vi.fn((file: File) => Promise.resolve(file)),
}));

vi.mock("@/lib/logger", () => ({
  default: { debug: vi.fn(), warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

// jsdom does not implement URL.createObjectURL / revokeObjectURL
globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-preview-url");
globalThis.URL.revokeObjectURL = vi.fn();

/**
 * Helper to create a mock File.
 * @param name - File name.
 * @param size - File size in bytes.
 * @param type - MIME type.
 * @returns A File instance with the given properties.
 */
function createMockFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("ReceiptUploader", () => {
  const onResult = vi.fn();
  const onProcessingChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Render helper with default props.
   * @returns The render result.
   */
  function renderUploader() {
    return render(
      <ReceiptUploader onResult={onResult} onProcessingChange={onProcessingChange} />,
    );
  }

  it("renders the drop zone with instructions", () => {
    renderUploader();
    expect(
      screen.getByText(/drag & drop your receipt here/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/jpeg, png, webp, or pdf/i),
    ).toBeInTheDocument();
  });

  it("renders a hidden file input with correct accept attribute", () => {
    renderUploader();
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    expect(input).toHaveAttribute(
      "accept",
      "image/jpeg,image/png,image/webp,application/pdf",
    );
    expect(input.className).toContain("hidden");
  });

  it("renders the Process Receipt button disabled when no file is selected", () => {
    renderUploader();
    const button = screen.getByRole("button", { name: /process receipt/i });
    expect(button).toBeDisabled();
  });

  it("shows a preview after selecting an image file", async () => {
    const user = userEvent.setup();
    renderUploader();

    const input = screen.getByTestId("file-input");
    const file = createMockFile("receipt.jpg", 500_000, "image/jpeg");
    await user.upload(input, file);

    expect(await screen.findByAltText("Receipt preview")).toBeInTheDocument();
    expect(screen.getByText("receipt.jpg")).toBeInTheDocument();
  });

  it("shows a PDF icon placeholder for PDF files", async () => {
    const user = userEvent.setup();
    renderUploader();

    const input = screen.getByTestId("file-input");
    const file = createMockFile("receipt.pdf", 500_000, "application/pdf");
    await user.upload(input, file);

    await screen.findByText("receipt.pdf");
    expect(screen.queryByAltText("Receipt preview")).not.toBeInTheDocument();
  });

  it("rejects files larger than 10 MB with an error message", async () => {
    const user = userEvent.setup();
    renderUploader();

    const input = screen.getByTestId("file-input") as HTMLInputElement;
    // Create a file just over the 10 MB limit using multiple 1 MB chunks
    const chunk = new Uint8Array(1024 * 1024); // 1 MB
    const blobs = Array.from({ length: 11 }, () => new Blob([chunk]));
    const bigFile = new File(blobs, "huge.jpg", { type: "image/jpeg" });

    await user.upload(input, bigFile);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/too large/i);
    expect(
      screen.getByRole("button", { name: /process receipt/i }),
    ).toBeDisabled();
  });

  it("rejects files with unsupported MIME types", async () => {
    renderUploader();

    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const txtFile = createMockFile("notes.txt", 1000, "text/plain");

    // userEvent.upload respects the accept attribute, so use fireEvent
    Object.defineProperty(input, "files", {
      value: [txtFile],
      configurable: true,
    });
    fireEvent.change(input);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/unsupported file type/i);
  });

  it("enables the submit button after a valid file is selected", async () => {
    const user = userEvent.setup();
    renderUploader();

    const input = screen.getByTestId("file-input");
    const file = createMockFile("receipt.png", 200_000, "image/png");
    await user.upload(input, file);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /process receipt/i }),
      ).toBeEnabled();
    });
  });

  it("calls processReceipt and callbacks when submit is clicked", async () => {
    const { processReceipt } = await import("@/actions/processReceipt");
    const mockResult = { success: true as const, data: {
      date: "01/01/2025",
      merchant: "Test Store",
      totalAmount: 99.99,
      currency: "MXN",
      expenseType: "Groceries",
      paymentMethod: "Cash",
    }};
    vi.mocked(processReceipt).mockResolvedValueOnce(mockResult);

    const user = userEvent.setup();
    renderUploader();

    const input = screen.getByTestId("file-input");
    const file = createMockFile("receipt.jpg", 200_000, "image/jpeg");
    await user.upload(input, file);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /process receipt/i }),
      ).toBeEnabled();
    });

    const submitBtn = screen.getByRole("button", { name: /process receipt/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(processReceipt).toHaveBeenCalledOnce();
      expect(onProcessingChange).toHaveBeenCalledWith(true);
      expect(onResult).toHaveBeenCalledWith(mockResult);
      expect(onProcessingChange).toHaveBeenCalledWith(false);
    });
  });

  it("clears the file when the remove button is clicked", async () => {
    const user = userEvent.setup();
    renderUploader();

    const input = screen.getByTestId("file-input");
    const file = createMockFile("receipt.jpg", 200_000, "image/jpeg");
    await user.upload(input, file);

    await screen.findByText("receipt.jpg");

    const removeBtn = screen.getByRole("button", { name: /remove file/i });
    await user.click(removeBtn);

    expect(screen.queryByText("receipt.jpg")).not.toBeInTheDocument();
    expect(
      screen.getByText(/drag & drop your receipt here/i),
    ).toBeInTheDocument();
  });
});
