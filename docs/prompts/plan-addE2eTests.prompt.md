# Plan: Add E2E Tests with Playwright

Add Playwright E2E tests to validate real-browser behavior for all existing features. Playwright is recommended for its first-class Next.js support, built-in file upload/clipboard/drag-and-drop APIs, and multi-browser coverage. The Gemini API will be mocked via Playwright's route interception to keep tests fast, free, and deterministic.

**Why Playwright over alternatives:**
- Official Next.js recommendation for E2E testing
- Built-in `webServer` config auto-starts Next.js before tests
- Native APIs for file chooser, clipboard, drag-and-drop — all critical for this app
- Route interception for API mocking (same concept as MSW but in a real browser)
- TypeScript-native, multi-browser (Chromium/Firefox/WebKit)
- Cypress is heavier, lacks WebKit, and has weaker clipboard/multi-tab support

---

**Steps**

### Phase 1: Setup
1. Install `@playwright/test` and Chromium browser only (keep it lean)
2. Create `playwright.config.ts` — `testDir: './e2e'`, `webServer` starts Next.js, Chromium-only project, `baseURL: http://localhost:3000`
3. Create `e2e/` directory
4. Add `"test:e2e"` and `"test:e2e:ui"` scripts to `package.json`
5. Add `test-results/`, `playwright-report/` to `.gitignore`

### Phase 2: Mock Infrastructure
6. Create `e2e/fixtures.ts` — custom Playwright fixture with a `mockGeminiAPI` helper using `page.route()` to intercept `generativelanguage.googleapis.com` requests, returning the same mock receipt shape used in `src/mocks/handlers.ts`
7. Create `e2e/test-assets/` with a sample JPEG, sample PDF, and an `invalid.txt` for rejection testing

### Phase 3: E2E Test Scenarios (all in `e2e/receipt-upload.spec.ts`)
8. **Happy path — image upload**: Navigate to `/`, upload JPEG via `setInputFiles()`, assert preview appears, click "Process Receipt", assert spinner then results card with all 7 fields, assert "Copy as TSV" button visible
9. **Happy path — PDF upload**: Same flow with PDF, assert PDF placeholder icon instead of image preview
10. **Copy to clipboard**: After success, click "Copy as TSV", assert button text changes to "Copied!", verify clipboard contents match expected TSV, assert button reverts after ~2s
11. **File validation**: Upload `invalid.txt` → assert unsupported type error; simulate oversized file → assert size error
12. **API error handling**: Use error mock variant, upload valid file, submit → assert error banner with `role="alert"`
13. **Remove and re-upload**: Upload file → assert preview → click remove → assert preview gone and button disabled → upload new file → assert new preview

### Phase 4: CI Integration
14. Update `.github/workflows/ci.yml` — add E2E job: install Playwright Chromium, run `npm run test:e2e`, upload `playwright-report/` artifact on failure

### Phase 5: Verification
15. `npx playwright test` — all scenarios pass locally
16. `npm test -- --run` — existing unit/integration tests unaffected
17. `npm run build` — production build succeeds
18. CI runs green with both unit and E2E jobs

---

**Relevant files**
- `playwright.config.ts` (new) — Playwright config with `webServer` for Next.js
- `e2e/fixtures.ts` (new) — Custom test fixture with Gemini API route mock via `page.route()`
- `e2e/test-assets/` (new) — Sample JPEG, PDF, and invalid text file
- `e2e/receipt-upload.spec.ts` (new) — All E2E scenarios in a single spec
- `package.json` — Add `test:e2e` / `test:e2e:ui` scripts
- `.gitignore` — Add Playwright output dirs
- `.github/workflows/ci.yml` — Add E2E test job
- `src/mocks/handlers.ts` — Reference for mock receipt data shape (`MOCK_RECEIPT`)

**Verification**
1. `npx playwright test` — all 6 scenarios pass in Chromium
2. `npx playwright test --reporter=html` — inspect HTML report with traces
3. `npm test -- --run` — Vitest suite unaffected
4. `npm run build` — build succeeds
5. CI workflow runs both unit and E2E tests successfully

**Decisions**
- **Library**: Playwright over Cypress — better Next.js integration, lighter, native file/clipboard APIs
- **Browser scope**: Chromium only for now — keeps CI fast; add Firefox/WebKit later
- **API mocking**: `page.route()` intercepts Gemini calls at network level — deterministic, no API key needed, zero cost
- **Test structure**: Single spec file — the app has one page with one flow; splitting would be premature
- **Server mode**: `next dev` locally for speed; production build (`next build && next start`) in CI for realism — just a config toggle
- **Excluded**: Visual regression, a11y audits, mobile viewport testing, performance — good future additions

**Unresolved Questions**

None. The scope is well-defined and all technical decisions are straightforward.
