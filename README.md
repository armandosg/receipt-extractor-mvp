# MVP Specification: AI-Powered Receipt Data Extractor

### **The Problem**
Manual data entry of physical receipts and digital invoices into a spreadsheet is a tedious, time-consuming, and error-prone process. 

### **The Solution**
A streamlined, frictionless web application designed to automate expense tracking. The user simply uploads a photo or a PDF of a receipt. The application leverages multimodal AI to instantly extract key financial data (such as merchant, date, total amount, and category) and formats the output. With a single "Copy to Clipboard" action, the user can paste the perfectly formatted data directly into their spreadsheet, eliminating manual typing entirely.

### **Technical Architecture & Decisions**
* **Core Framework:** Next.js (App Router) for a unified, highly performant full-stack architecture.
* **Language:** TypeScript for strict end-to-end type safety and predictable behavior.
* **AI Engine:** Google Gemini 1.5 Flash. Selected for its fast processing speed, highly cost-effective API, and native multimodal support for both image files and PDF buffers.
* **Data Validation:** Zod schema validation to force the AI into returning a deterministic, rigidly structured JSON output, ensuring compatibility with the spreadsheet.
* **Quality Assurance:** A strict Test-Driven Development (TDD) methodology. The project uses Vitest and React Testing Library for unit and integration testing, and MSW (Mock Service Worker) to isolate and test AI interactions without incurring API costs.
* **Documentation:** Enforced JSDoc standards across all files, functions, and variables to guarantee long-term maintainability and clean code architecture.

---

## Phased Implementation Plan

### Phase 1: Project Initialization & Tooling Setup
**Goal:** Establish a robust Next.js environment with enforced typing, testing frameworks, and documentation standards.

* Initialize the Next.js project with the App Router and TypeScript.
* Install core dependencies: `@ai-sdk/google`, `ai`, `zod`, and `lucide-react`.
* **Testing Setup:** Install `vitest` (highly recommended for TypeScript/Next.js for its speed), `@testing-library/react`, and `msw` (Mock Service Worker) to intercept and mock AI API requests.
* **Documentation Setup:** Configure ESLint with `eslint-plugin-jsdoc` to enforce that every file, function, and critical variable includes JSDoc blocks.

### Phase 2: Schema Definition & Proposed Data Structure
**Goal:** Define the data extraction targets and unit test the validation logic.

* Propose a baseline `ReceiptSchema` using Zod. Recommended fields: `Date`, `Merchant`, `Total Amount`, `Expense Type` (e.g., Daily Expense, Service, Installment), and `Payment Method` (e.g., Cash, BBVA, Mercado Pago).
* **JSDoc:** Add descriptive JSDoc blocks to the schema definition, explaining the purpose of each field and its expected format.
* **Unit Testing:** Write tests for the Zod schema to verify it correctly accepts valid data objects and throws expected errors for missing or malformed data.

### Phase 3: Backend AI Integration (Server Actions)
**Goal:** Securely connect to Gemini 1.5 Flash with fully documented and tested server-side logic.

* Develop the Server Action (`actions/processReceipt.ts`) to handle both Base64 images and PDF buffers.
* **JSDoc:** Document the Server Action, detailing the expected input types, return signatures (success vs. failure objects), and explicit descriptions of internal variables.
* **Unit Testing:** Use `msw` to mock the Gemini API endpoint. Write unit tests to verify:
    * The function correctly parses a successful JSON response from the mocked AI.
    * The function gracefully catches and returns formatted errors when the AI API fails or times out.
    * The function correctly rejects unsupported file types.

### Phase 4: Frontend Development & UX
**Goal:** Build the user interface with documented components and verify the end-to-end user flow.

* Build the file upload component, client-side image compression logic, and the "Copy to Clipboard" utility (formatting the JSON into Tab-Separated Values so it pastes cleanly into a spreadsheet).
* **JSDoc:** Write JSDoc blocks for every React component detailing its `Props`, state variables, and event handler functions.
* **Unit Testing:** Use React Testing Library to test individual components in isolation (e.g., verifying the file input accepts the correct MIME types, and the "Copy" button correctly formats the output string).
* **Integration Testing:** Write tests that simulate the entire frontend flow. Render the uploader, simulate a file drop, trigger the mocked Server Action, and assert that the UI correctly displays the loading state and subsequently renders the extracted data.

### Phase 5: CI/CD Pipeline & Deployment
**Goal:** Automate the quality checks to ensure the codebase remains pristine before going live.

* Set up a GitHub Actions workflow (or Vercel deployment checks) to run automatically on every push.
* Configure the pipeline to run the ESLint JSDoc checks, the TypeScript compiler (`tsc --noEmit`), and the full Vitest suite.
* Deploy the application to Vercel, ensuring environment variables are securely mapped, only after all tests and quality gates pass.
