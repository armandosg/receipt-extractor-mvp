## Plan: Add Account Number Field to Receipt Extraction

Add a new `accountNumber` string field to the receipt extraction pipeline — schema, prompt, formatter, UI, mocks, and all tests. The AI returns `"Unknown"` when the value isn't visible on the receipt, matching the existing `paymentMethod` pattern.

**Steps**

### Phase 1: Data Model & Prompt *(blocking — all later phases depend on this)* ✅

1. **Schema** — In `src/lib/schemas/receipt.ts`, add `accountNumber: z.string().describe("Masked account number (e.g. xxxx0354)")` to `receiptSchema`.
2. **Prompt** — In `src/lib/prompts/receiptExtraction.ts`, add a bullet: *"For `accountNumber`: extract the masked account number from payment info (e.g. 'xxxx0354'). Return 'Unknown' if not visible."*

### Phase 2: Output Formatting & UI *(parallel with each other, depends on Phase 1)* ✅

3. **TSV formatter** — In `src/lib/utils/formatTsv.ts`, append `sanitize(receipt.accountNumber)` after `paymentMethod`.
4. **UI component** — In `src/components/ReceiptResult.tsx`, add `{ label: "Account Number", value: data.accountNumber }` to the `fields` array.

### Phase 3: Test Fixtures & Assertions *(depends on Phases 1 & 2)* ✅

5. **Mock handler** — Add `accountNumber: "xxxx0354"` to `MOCK_RECEIPT` in `src/mocks/handlers.ts`.
6. **Schema tests** — Update `validReceipt` and add validation case in `src/lib/schemas/__tests__/receipt.test.ts`.
7. **TSV formatter tests** — Update fixture and expected TSV strings in `src/lib/utils/__tests__/formatTsv.test.ts`.
8. **ReceiptResult tests** — Update `mockReceipt` and assert label/value in `src/components/__tests__/ReceiptResult.test.tsx`.
9. **CopyButton tests** — Update fixture and expected TSV in `src/components/__tests__/CopyButton.test.tsx`.
10. **Integration tests** — Update `mockReceiptData`, assert rendering and TSV in `src/__tests__/integration/receiptFlow.test.tsx`.
11. **ReceiptUploader tests** — Update inline fixture in `src/components/__tests__/ReceiptUploader.test.tsx`.

*Note: `src/actions/processReceipt.ts` needs no code changes — the schema flows through the Vercel AI SDK automatically.*

**Verification**
1. `npx vitest` — all tests pass
2. `npx tsc --noEmit` — no type errors
3. Manual: upload receipt with visible card info → `accountNumber` appears in UI and TSV
4. Manual: upload receipt with no card info → shows `"Unknown"`

**Decisions**
- **Required field** (not optional) — consistent with all existing fields; AI returns `"Unknown"` as fallback
- **No regex validation** — masked formats vary too much (`xxxx0354`, `****0354`, etc.)
- **TSV column position** — appended as last column after Payment Method

**Unresolved Questions**

None — the pattern is well-established by the existing `paymentMethod` field.
