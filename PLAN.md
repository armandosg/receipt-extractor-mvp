# Implementation Plan: AI-Powered Receipt Data Extractor MVP

> **Purpose:** Step-by-step implementation guide for an agent to build the MVP from scratch.
> Each phase must be completed and verified before moving to the next.

A Next.js App Router application that uses Google Gemini 2.5 Flash to extract structured data from receipt photos/PDFs and copies it as TSV for spreadsheet pasting.

**Stack:** TypeScript, Tailwind CSS, Vercel AI SDK (`ai` + `@ai-sdk/google`), Zod, loglevel, browser-image-compression, Vitest, React Testing Library, MSW.

---

## Phase 1: Project Initialization & Tooling Setup

**Goal:** Establish a robust Next.js environment with enforced typing, testing frameworks, logging, and documentation standards.

### 1.1 Scaffold the Next.js project
- Run `npx create-next-app@latest . --yes` inside the existing repo directory (`.` to use current folder). This scaffolds App Router + TypeScript + Tailwind CSS + ESLint + Turbopack with `@/*` import alias.
- Confirm Node.js >= 20.9 is available.
- Preserve the existing `README.md` — if `create-next-app` overwrites it, restore it from git.

### 1.2 Install production dependencies
```bash
npm install @ai-sdk/google ai zod lucide-react browser-image-compression loglevel
```

### 1.3 Install dev/testing dependencies
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event vite-tsconfig-paths msw eslint-plugin-jsdoc
```

### 1.4 Configure Vitest
- Create `vitest.config.mts` at root:
  - Plugins: `tsconfigPaths()`, `react()`
  - `test.environment`: `'jsdom'`
  - `test.setupFiles`: `['./vitest.setup.ts']`
- Add `"test": "vitest"` and `"test:ci": "vitest run"` to `package.json` scripts.

### 1.5 Configure MSW
- Create `src/mocks/handlers.ts` — export an empty `handlers` array (populated in Phase 3).
- Create `src/mocks/server.ts` — call `setupServer(...handlers)` from `msw/node`.
- Create `vitest.setup.ts` at root:
  - `beforeAll(() => server.listen())`
  - `afterEach(() => server.resetHandlers())`
  - `afterAll(() => server.close())`

### 1.6 Configure ESLint with JSDoc enforcement
- Extend `eslint.config.mjs` (flat config, already created by Next.js):
  - Import `eslint-plugin-jsdoc` and spread `jsdoc.configs['flat/recommended']`.
  - Add rule overrides:
    - `jsdoc/require-jsdoc`: error — require on `FunctionDeclaration`, `MethodDefinition`, `ClassDeclaration`, `ArrowFunctionExpression` (only exported).
    - `jsdoc/require-description`: warn.
    - `jsdoc/require-param-description`: error.
    - `jsdoc/require-returns-description`: error.
  - Scope to `**/*.{ts,tsx}` files only (exclude config files).
- Add `"lint": "eslint . --ext .ts,.tsx"` script if not already present.

### 1.7 Create environment variable template
- Create `.env.local.example` with:
  ```
  GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
  LOG_LEVEL=debug
  NEXT_PUBLIC_LOG_LEVEL=debug
  ```
- Add `.env.local` to `.gitignore` (should already be there from Next.js scaffold).

### 1.8 Configure the application logger
- Create `src/lib/logger.ts`.
- Import `loglevel` and configure environment-aware defaults:
  - Server-side (`typeof window === 'undefined'`): level from `process.env.LOG_LEVEL` or fallback to `'debug'` in development / `'info'` in production.
  - Client-side: level from `process.env.NEXT_PUBLIC_LOG_LEVEL` or same fallback logic.
- Export the configured logger as the default export.
- Add JSDoc documenting the module, the log levels, and the environment behavior.

### 1.9 Verify setup
- Run `npm run build` — must pass with zero errors.
- Run `npm test -- --run` — must exit cleanly (no tests yet, but setup shouldn't crash).
- Run `npm run lint` — check ESLint runs without config errors.

---

## Phase 2: Schema Definition & Data Structure

**Goal:** Define the data extraction targets, build the TSV formatter, and unit test the validation logic.

### 2.1 Create the Zod receipt schema
- Create `src/lib/schemas/receipt.ts`.
- Define and export `receiptSchema` using Zod:
  ```
  date: z.string()          — date in DD/MM/YYYY format (AI normalizes to this)
  merchant: z.string()      — store/vendor name
  totalAmount: z.number()   — final total (number, not string)
  currency: z.string()      — ISO 4217 or common abbreviation (MXN, USD, etc.)
  expenseType: z.string()   — AI-inferred category (e.g. "Daily Expense", "Service", "Installment", "Groceries")
  paymentMethod: z.string() — AI-inferred method (e.g. "Cash", "BBVA Debit", "Mercado Pago")
  ```
- Export the inferred TypeScript type: `export type Receipt = z.infer<typeof receiptSchema>`.
- Add JSDoc to the schema file, each field, and the exported type.

### 2.2 Create the TSV formatter utility
- Create `src/lib/utils/formatTsv.ts`.
- Export `formatReceiptToTsv(receipt: Receipt): string` that builds a tab-separated string in the column order: **Date → Merchant → Total → Currency → Expense Type → Payment Method**.
- Strip/escape any tab or newline characters from field values.
- Add JSDoc.

### 2.3 Write unit tests for the schema
- Create `src/lib/schemas/__tests__/receipt.test.ts`.
- Tests:
  - Accepts a fully valid receipt object — `receiptSchema.parse(validData)` returns the object.
  - Rejects when `date` is missing — throws ZodError.
  - Rejects when `totalAmount` is a string — throws ZodError.
  - Rejects when `merchant` is missing — throws ZodError.
  - Rejects an empty object — throws ZodError with multiple issues.
  - Validates date format matches DD/MM/YYYY pattern.

### 2.4 Write unit tests for the TSV formatter
- Create `src/lib/utils/__tests__/formatTsv.test.ts`.
- Tests:
  - Returns correct tab-separated string for a valid Receipt.
  - Column order is `Date\tMerchant\tTotal\tCurrency\tExpenseType\tPaymentMethod`.
  - Handles special characters in merchant name (e.g. tabs, newlines are stripped/escaped).

### 2.5 Verify
- Run `npm test -- --run` — all schema and formatter tests pass.

---

## Phase 3: Backend AI Integration (Server Action)

**Goal:** Securely connect to Gemini 2.5 Flash with fully documented, logged, and tested server-side logic.

### 3.1 Create the server action
- Create `src/actions/processReceipt.ts` with `"use server"` directive.
- Export `processReceipt(formData: FormData): Promise<ProcessReceiptResult>`.
- Define the return type:
  ```typescript
  type ProcessReceiptResult =
    | { success: true; data: Receipt }
    | { success: false; error: string }
  ```
- Implementation steps inside the function:
  1. Extract the file from `formData.get('receipt')` — validate it's a `File` instance.
  2. Validate MIME type: allow `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. Return error for anything else.
  3. Read the file into a `Buffer` via `await file.arrayBuffer()`.
  4. Log the incoming request at **debug** level: file name, MIME type, size.
  5. Call `generateObject` (from `ai`) with:
     - `model: google('gemini-2.5-flash')`
     - `schema: receiptSchema`
     - `messages`: a user message containing:
       - A `file` part with `data: Buffer.from(arrayBuffer)` and the appropriate `mediaType`.
       - A `text` part with the extraction prompt (see 3.2).
  6. Return `{ success: true, data: result.object }`. Log at **info** level: successful extraction for merchant name.
  7. Wrap the entire call in try/catch — on error, log at **error** level with the exception, then return `{ success: false, error: <message> }`.
- Add JSDoc documenting the function, its input format, return type, and internal logic.

### 3.2 Craft the extraction prompt
- Store the prompt as a constant in `src/lib/prompts/receiptExtraction.ts`.
- Prompt should instruct the AI to:
  - Extract data from the attached receipt image or PDF.
  - Auto-detect the language (Spanish or English).
  - For `date`: extract and **normalize to DD/MM/YYYY** format regardless of the original format on the receipt.
  - For `totalAmount`: extract the final total as a number (no currency symbol).
  - For `currency`: infer the currency from context (default MXN if ambiguous).
  - For `expenseType`: infer a category from the items on the receipt.
  - For `paymentMethod`: infer from any payment info printed on the receipt, or `"Unknown"` if not visible.
- Add JSDoc to the prompt constant.

### 3.3 Define mock handlers for testing
- Update `src/mocks/handlers.ts`:
  - Add a handler for `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` (the endpoint the AI SDK calls under the hood).
  - Default handler returns a successful structured JSON response matching `receiptSchema`.
- **Important:** The exact endpoint URL may need adjustment based on the AI SDK internals. Alternatively, mock at the AI SDK level by creating a mock provider — evaluate which is cleaner. If MSW interception is too brittle, use Vitest's `vi.mock('ai')` to mock `generateObject` directly as a fallback strategy.

### 3.4 Write unit tests for the server action
- Create `src/actions/__tests__/processReceipt.test.ts`.
- Tests:
  - **Happy path (image):** Create a mock `FormData` with a JPEG `File`, invoke `processReceipt`, assert `{ success: true, data: <valid Receipt> }`.
  - **Happy path (PDF):** Same with `application/pdf` MIME type.
  - **Invalid file type:** Pass a `.txt` file, assert `{ success: false, error: <message about unsupported type> }`.
  - **Missing file:** Pass empty `FormData`, assert `{ success: false, error: <message> }`.
  - **AI failure:** Use `server.use()` to override the handler with a 500 response, assert `{ success: false, error: <message> }`.
  - **Malformed AI response:** Mock a response that doesn't match the schema, assert error handling.

### 3.5 Verify
- Run `npm test -- --run` — all server action tests pass.

---

## Phase 4: Frontend Development & UX

**Goal:** Build the user interface with documented components, logging, and verify the end-to-end user flow.

### 4.1 Create the file upload component
- Create `src/components/ReceiptUploader.tsx`.
- Features:
  - Drag-and-drop zone using native HTML drag events (`onDragOver`, `onDrop`).
  - Hidden `<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf">` triggered by clicking the zone.
  - On file selection:
    1. Validate file size — reject files larger than **10MB** with a user-facing error message.
    2. If image: compress using `browser-image-compression` with `maxSizeMB: 1` and `maxWidthOrHeight: 1920`.
    3. Show a thumbnail preview for images (via `URL.createObjectURL`), or a PDF icon placeholder for PDFs.
    4. Store the file in component state, ready for submission.
  - A "Process Receipt" button to trigger the server action.
  - Use `lucide-react` icons: `Upload`, `FileText`, `Loader2`.
  - **Logging:** Use the logger at **debug** level for file selection events (name, size, type), compression start/end, and at **warn** level for rejected files (size/type).
- Add JSDoc for the component and all handler functions.

### 4.2 Create the results display component
- Create `src/components/ReceiptResult.tsx`.
- Props: `data: Receipt`.
- Renders a clean card/table showing each field with its label and value.
- Add JSDoc.

### 4.3 Create the copy-to-clipboard button component
- Create `src/components/CopyButton.tsx`.
- Props: `data: Receipt`.
- On click:
  1. Call `formatReceiptToTsv(data)`.
  2. Write to clipboard via `navigator.clipboard.writeText()`.
  3. Show brief visual feedback (icon swap to checkmark for ~2 seconds using `lucide-react` `Check` icon).
- Add JSDoc.

### 4.4 Create the error display component
- Create `src/components/ErrorMessage.tsx`.
- Props: `message: string`.
- Renders a styled error banner.
- Add JSDoc.

### 4.5 Compose the main page
- Edit `src/app/page.tsx`.
- State management (using `useState` + `useActionState` or manual state):
  - `result: ProcessReceiptResult | null`
  - `isProcessing: boolean`
- Layout:
  1. Header: App title and one-line description.
  2. `ReceiptUploader` — on submit, call `processReceipt` server action, manage loading state.
  3. Conditionally render `ReceiptResult` + `CopyButton` on success, or `ErrorMessage` on failure.
  4. Show `Loader2` spinner during processing.
- Add JSDoc.

### 4.6 Styling
- Use Tailwind CSS utility classes throughout.
- Mobile-first responsive design — single-column layout, centered, max-width container.
- Light, clean aesthetic. No dark mode needed for MVP.

### 4.7 Write component unit tests
- Create `src/components/__tests__/ReceiptUploader.test.tsx`:
  - Renders the drop zone and file input.
  - File input accepts correct MIME types (`accept` attribute).
  - Simulating file selection updates preview state.
  - Rejects files larger than 10MB with an error message.
- Create `src/components/__tests__/CopyButton.test.tsx`:
  - Clicking calls `navigator.clipboard.writeText` with correct TSV string.
  - Shows checkmark feedback after click.
- Create `src/components/__tests__/ReceiptResult.test.tsx`:
  - Renders all Receipt fields correctly.
- Create `src/components/__tests__/ErrorMessage.test.tsx`:
  - Renders the error message text.

### 4.8 Write integration test for the full flow
- Create `src/__tests__/integration/receiptFlow.test.tsx`:
  - Mock the `processReceipt` server action (use `vi.mock`).
  - Render the main `Page` component.
  - Simulate dropping/selecting a file.
  - Click "Process Receipt".
  - Assert loading spinner appears.
  - Assert result card renders with mocked data after resolution.
  - Click "Copy" button, assert clipboard was called with TSV.

### 4.9 Verify
- Run `npm test -- --run` — all component and integration tests pass.
- Run `npm run build` — production build succeeds.
- Run `npm run dev` — manually verify the UI renders and the flow works end-to-end with a real API key.

---

## Phase 5: CI/CD Pipeline & Deployment

**Goal:** Automate the quality checks to ensure the codebase remains pristine before going live.

### 5.1 Create GitHub Actions workflow
- Create `.github/workflows/ci.yml`.
- Trigger: `push` to `main` and all `pull_request` events.
- Job steps:
  1. Checkout code.
  2. Setup Node.js 20 with npm cache.
  3. `npm ci`
  4. `npm run lint` — ESLint with JSDoc rules.
  5. `npx tsc --noEmit` — TypeScript type checking.
  6. `npm run test:ci` — Vitest in non-watch mode.
  7. `npm run build` — Verify production build.

### 5.2 Configure Vercel deployment
- Connect the GitHub repository to Vercel.
- Set environment variable `GOOGLE_GENERATIVE_AI_API_KEY` in Vercel project settings.
- Vercel auto-deploys on push to `main` after CI passes.
- Preview deployments enabled for PRs.

### 5.3 Verify
- Push a commit, confirm GitHub Actions workflow runs green.
- Confirm Vercel deploys successfully and the app is functional at the deployed URL.

---

## File Manifest

| File | Purpose |
|------|---------|
| `src/lib/schemas/receipt.ts` | Zod schema + `Receipt` type |
| `src/lib/utils/formatTsv.ts` | TSV formatter function |
| `src/lib/logger.ts` | Configured `loglevel` instance (environment-aware log levels) |
| `src/lib/prompts/receiptExtraction.ts` | AI prompt constant |
| `src/actions/processReceipt.ts` | Server action (AI call + validation) |
| `src/components/ReceiptUploader.tsx` | File upload + drag-and-drop + compression |
| `src/components/ReceiptResult.tsx` | Data display card |
| `src/components/CopyButton.tsx` | Copy TSV to clipboard |
| `src/components/ErrorMessage.tsx` | Error banner |
| `src/app/page.tsx` | Main page composing all components |
| `src/mocks/handlers.ts` | MSW request handlers |
| `src/mocks/server.ts` | MSW server setup |
| `vitest.config.mts` | Vitest configuration |
| `vitest.setup.ts` | Test setup (MSW lifecycle) |
| `eslint.config.mjs` | ESLint + JSDoc plugin config |
| `.env.local.example` | Environment variable template |
| `.github/workflows/ci.yml` | CI pipeline |

---

## Decisions

| Decision | Detail |
|----------|--------|
| Package manager | `npm` |
| AI model | `gemini-2.5-flash` (upgraded from 1.5 Flash — newer, faster, cheaper) |
| Logging | `loglevel` (~1.4 KB). Debug in dev, info in prod. Overridable via `LOG_LEVEL` (server) / `NEXT_PUBLIC_LOG_LEVEL` (client) env vars |
| Image compression | `browser-image-compression` (maxSizeMB: 1, maxWidthOrHeight: 1920) |
| Expense type / Payment method | AI infers freely (strings, not enums) |
| Currency | Added `currency: z.string()` field to schema |
| Date format | AI normalizes to `DD/MM/YYYY` regardless of original receipt format |
| File size limit | 10MB client-side validation before upload |
| TSV column order | Date → Merchant → Total → Currency → Expense Type → Payment Method |
| Receipt language | Auto-detect (both Spanish and English supported via prompt) |
| MSW mocking strategy | Try network-level interception first; fall back to `vi.mock('ai')` if the Gemini SDK endpoint is hard to intercept reliably |
| Dark mode | Not included in MVP |
| Directory structure | Use `src/` directory (Next.js default with `@/*` alias) |

---

## Future Iterations (out of MVP scope)

1. **Line items extraction** — Extend the schema to capture individual line items (product name + unit price + quantity) in addition to the receipt-level summary.
2. **Dark mode** — Add a theme toggle with dark mode support.
3. **Batch processing** — Support uploading and processing multiple receipts at once.
4. **History / persistence** — Store previously processed receipts in a database for review.
5. **Export formats** — Add CSV download and direct Google Sheets integration beyond clipboard TSV.
