# Changelog

## [0.2.0] - 2026-04-26

### Added
- Extract masked account number (`accountNumber`) from receipts (e.g. `xxxx0354`).
- New field in Zod schema, AI extraction prompt, TSV output, and UI display.
- Falls back to `"Unknown"` when no account number is visible on the receipt.
