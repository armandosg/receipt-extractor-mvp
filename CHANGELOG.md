# Changelog

## [0.2.0] - 2026-04-26

### Added
- Extract masked account number (`accountNumber`) from receipts (e.g. `xxxx0354`).
- New field in Zod schema, AI extraction prompt, TSV output, and UI display.
- Falls back to `"Unknown"` when no account number is visible on the receipt.

## [0.1.0] - 2026-04-25

### Added
- Scaffold Next.js project with App Router, TypeScript, and Tailwind CSS.
- Install production and dev/testing dependencies.
- Configure Vitest with jsdom, React plugin, and tsconfig paths.
- Configure MSW for test request interception.
- Configure ESLint with JSDoc enforcement rules.
- Add environment variable template.
- Add environment-aware application logger.
- Add Zod receipt schema and `Receipt` type.
- Add TSV formatter for receipt data.
- Add `processReceipt` server action for AI receipt extraction.
- Extract receipt prompt into dedicated module.
- Add MSW handler for Gemini `generateContent` endpoint.
- Add `ReceiptUploader` component with drag-and-drop and image compression.
- Add `ReceiptResult` component for extracted data display.
- Add `CopyButton` component for clipboard TSV export.
- Add `ErrorMessage` component for error display.
- Compose main page with receipt extraction flow.

### Changed
- Remove dark mode overrides from `globals.css`.

### Tests
- Add unit tests for receipt schema.
- Add unit tests for TSV formatter.
- Add unit tests for `CopyButton`, `ReceiptResult`, and `ErrorMessage`.
- Add integration test for full receipt extraction flow.

### CI
- Add GitHub Actions workflow for CI pipeline.
