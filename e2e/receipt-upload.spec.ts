import path from "node:path";
import { test, MOCK_RECEIPT, setMockError } from "./fixtures";
import { expect } from "@playwright/test";

const ASSETS_DIR = path.join(__dirname, "test-assets");

test.describe("Receipt Upload Flow", () => {
  test.describe.configure({ mode: "serial" });
  test("happy path — upload image, process, and see results", async ({ page }) => {
    await page.goto("/");

    // Page loads with title and disabled submit button
    await expect(page.getByRole("heading", { name: "Receipt Extractor" })).toBeVisible();
    const submitBtn = page.getByRole("button", { name: "Process Receipt" });
    await expect(submitBtn).toBeDisabled();

    // Upload a JPEG image
    const fileInput = page.getByTestId("file-input");
    await fileInput.setInputFiles(path.join(ASSETS_DIR, "sample-receipt.jpg"));

    // Preview image and submit button become available
    await expect(page.getByAltText("Receipt preview")).toBeVisible();
    await expect(submitBtn).toBeEnabled();

    // Click Process Receipt
    await submitBtn.click();

    // Loading spinner appears then results render
    await expect(page.getByText("Processing receipt…")).toBeVisible();
    await expect(page.getByText("Extracted Receipt Data")).toBeVisible({ timeout: 15_000 });

    // All 7 fields are displayed
    await expect(page.getByText(MOCK_RECEIPT.date)).toBeVisible();
    await expect(page.getByText(MOCK_RECEIPT.merchant)).toBeVisible();
    await expect(page.getByText(String(MOCK_RECEIPT.totalAmount))).toBeVisible();
    await expect(page.getByText(MOCK_RECEIPT.currency)).toBeVisible();
    await expect(page.getByText(MOCK_RECEIPT.expenseType)).toBeVisible();
    await expect(page.getByText(MOCK_RECEIPT.paymentMethod)).toBeVisible();
    await expect(page.getByText(MOCK_RECEIPT.accountNumber)).toBeVisible();

    // Copy button is visible
    await expect(page.getByRole("button", { name: "Copy as TSV" })).toBeVisible();
  });

  test("happy path — upload PDF, process, and see results", async ({ page }) => {
    await page.goto("/");

    const fileInput = page.getByTestId("file-input");
    await fileInput.setInputFiles(path.join(ASSETS_DIR, "sample-receipt.pdf"));

    // PDF shows no image preview — file name is shown instead
    await expect(page.getByAltText("Receipt preview")).not.toBeVisible();
    await expect(page.getByText("sample-receipt.pdf")).toBeVisible();

    const submitBtn = page.getByRole("button", { name: "Process Receipt" });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(page.getByText("Extracted Receipt Data")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(MOCK_RECEIPT.merchant)).toBeVisible();
  });

  test("copy to clipboard shows feedback", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/");

    // Upload and process
    const fileInput = page.getByTestId("file-input");
    await fileInput.setInputFiles(path.join(ASSETS_DIR, "sample-receipt.jpg"));
    await page.getByRole("button", { name: "Process Receipt" }).click();
    await expect(page.getByText("Extracted Receipt Data")).toBeVisible({ timeout: 15_000 });

    // Click copy
    const copyBtn = page.getByRole("button", { name: "Copy as TSV" });
    await copyBtn.click();

    // Feedback shows "Copied!"
    await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();

    // Verify clipboard contents contain the expected TSV fields
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain(MOCK_RECEIPT.date);
    expect(clipboardText).toContain(MOCK_RECEIPT.merchant);
    expect(clipboardText).toContain(String(MOCK_RECEIPT.totalAmount));
    expect(clipboardText).toContain("\t");

    // Reverts back to "Copy as TSV" after ~2 seconds
    await expect(page.getByRole("button", { name: "Copy as TSV" })).toBeVisible({ timeout: 3_000 });
  });

  test("rejects unsupported file type with error", async ({ page }) => {
    await page.goto("/");

    const fileInput = page.getByTestId("file-input");
    await fileInput.setInputFiles({
      name: "invalid.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("This is not a receipt"),
    });

    await expect(page.getByText("Unsupported file type")).toBeVisible();

    // Submit button remains disabled
    await expect(page.getByRole("button", { name: "Process Receipt" })).toBeDisabled();
  });

  test("shows error banner on API failure", async ({ page, request }) => {
    // Switch the mock server to error mode
    await setMockError(request);

    await page.goto("/");

    const fileInput = page.getByTestId("file-input");
    await fileInput.setInputFiles(path.join(ASSETS_DIR, "sample-receipt.jpg"));

    const submitBtn = page.getByRole("button", { name: "Process Receipt" });
    await submitBtn.click();

    // Error banner appears
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });

    // Results should NOT be displayed
    await expect(page.getByText("Extracted Receipt Data")).not.toBeVisible();
  });

  test("remove file and re-upload", async ({ page }) => {
    await page.goto("/");

    const fileInput = page.getByTestId("file-input");

    // Upload first file
    await fileInput.setInputFiles(path.join(ASSETS_DIR, "sample-receipt.jpg"));
    await expect(page.getByAltText("Receipt preview")).toBeVisible();
    await expect(page.getByRole("button", { name: "Process Receipt" })).toBeEnabled();

    // Remove the file
    await page.getByRole("button", { name: "Remove file", exact: true }).click();

    // Preview gone, submit disabled
    await expect(page.getByAltText("Receipt preview")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Process Receipt" })).toBeDisabled();

    // Upload a different file
    await fileInput.setInputFiles(path.join(ASSETS_DIR, "sample-receipt.pdf"));
    await expect(page.getByText("sample-receipt.pdf")).toBeVisible();
    await expect(page.getByRole("button", { name: "Process Receipt" })).toBeEnabled();
  });
});
