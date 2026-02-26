# AI-Assisted PTO Reconciliation

## Description

When the legacy Excel importer encounters PTO discrepancies it cannot resolve through computational heuristics alone (Phases 10–11 of `legacy-data-import.md`), send the ambiguous month's data to an AI API for interpretation. The AI receives the calendar entries, declared PTO total, and free-text employee comments (rows 55–70 of the spreadsheet), then returns a structured JSON response with its best guesses for missing values and reasoning. The server logs a warning, stores the AI's rationale in the `notes` field, and applies the recommended values to the database.

## Priority

🟢 Low Priority

## Checklist

- [ ] **Phase 1: Extract Comments Section from Spreadsheet**
  - [ ] Add `parseCommentsSection(ws: ExcelJS.Worksheet): string` function to `server/reportGenerators/excelImport.ts` that reads rows 55–70 from the worksheet and returns all non-empty text content concatenated with newlines
  - [ ] The function should read columns B through X (2–24) for each row, concatenating cell `.text` values (to handle rich text) and skipping empty cells
  - [ ] Include field labels (e.g., "COMMENTS:") when found so the AI has full context
  - [ ] Export the function for testing
  - [ ] Add unit test in `tests/excelImport.test.ts` verifying extraction from a mock worksheet with sample comment data
  - [ ] Run `pnpm test` — all tests must pass before proceeding
  - [ ] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

- [ ] **Phase 2: Define AI Reconciliation Request/Response Types**
  - [ ] Create `shared/aiReconciliationTypes.ts` with the following TypeScript interfaces:

    ```typescript
    /** Data sent to the AI for a single ambiguous month */
    export interface AIReconciliationRequest {
      employeeName: string;
      month: string; // e.g. "2018-07"
      year: number;
      /** Calendar-detected PTO entries for the month */
      calendarEntries: AICalendarEntry[];
      /** Declared total PTO hours from PTO Calc column S */
      declaredTotalHours: number;
      /** Current computed total from calendar entries */
      computedTotalHours: number;
      /** Free-text comments from rows 55-70 of the spreadsheet */
      employeeComments: string;
      /** Weekend "worked" cells detected for this month */
      workedCells: { date: string; note: string }[];
      /** Unmatched noted cells (have notes but no legend color) */
      unmatchedNotedCells: { date: string; note: string }[];
    }

    export interface AICalendarEntry {
      date: string; // YYYY-MM-DD
      type: string; // PTO type (e.g. "PTO", "Sick")
      hours: number; // Currently assigned hours
      isPartialPtoColor?: boolean;
      notes?: string; // Existing note text
    }

    /** AI's recommendation for a single entry adjustment */
    export interface AIEntryAdjustment {
      date: string; // YYYY-MM-DD — which entry to adjust
      recommendedHours: number;
      reasoning: string; // Short explanation for this adjustment
    }

    /** AI's recommendation for a worked-day entry */
    export interface AIWorkedDayAdjustment {
      date: string; // YYYY-MM-DD
      creditHours: number; // Positive number; will be stored as negative PTO
      reasoning: string;
    }

    /** Complete AI response for one month's reconciliation */
    export interface AIReconciliationResponse {
      adjustments: AIEntryAdjustment[];
      workedDayAdjustments: AIWorkedDayAdjustment[];
      overallReasoning: string;
      confidence: "high" | "medium" | "low";
      reconciledTotal: number; // Expected total after applying adjustments
    }
    ```

  - [ ] Ensure the types are importable from both server and shared code
  - [ ] Run `pnpm run build` — must compile without errors

- [ ] **Phase 3: AI Prompt Builder**
  - [ ] Create `server/utils/aiReconciliation.ts` with a `buildReconciliationPrompt(request: AIReconciliationRequest): string` function
  - [ ] The prompt should instruct the AI to:
    - Analyze the discrepancy between declared and computed PTO hours
    - Consider the employee's free-text comments as context for how they managed their time
    - Consider weekend "worked" entries and unmatched noted cells
    - Return a strict JSON response matching `AIReconciliationResponse`
    - Provide reasoning for each adjustment
    - Assign a confidence level
  - [ ] The prompt must specify that the AI should respond ONLY with valid JSON (no markdown, no prose outside the JSON)
  - [ ] Include the full `AIReconciliationResponse` schema in the prompt so the AI knows the exact output format
  - [ ] Add unit test verifying prompt construction includes all required data fields
  - [ ] Run `pnpm test` — all tests must pass before proceeding
  - [ ] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

- [ ] **Phase 4: AI API Client**
  - [ ] Add `AI_API_KEY` and `AI_API_URL` (with a sensible default like `https://api.openai.com/v1/chat/completions`) to `.env` and `dotenv` config
  - [ ] Create `server/utils/aiClient.ts` with:
    ```typescript
    export async function queryAI(prompt: string): Promise<string>;
    ```
  - [ ] The function should POST to the configured AI endpoint with the prompt as a user message
  - [ ] Parse the AI response text, extract JSON, and validate it against `AIReconciliationResponse` using a runtime type guard `isAIReconciliationResponse()`
  - [ ] Implement retry logic (up to 2 retries) for transient failures (network errors, 429/5xx responses)
  - [ ] Implement a timeout (30 seconds) to prevent blocking the import pipeline
  - [ ] If `AI_API_KEY` is not set, the function should log a warning and return `null` (graceful degradation — the import continues without AI assistance)
  - [ ] Add unit test with a mocked HTTP response verifying JSON parsing and type validation
  - [ ] Run `pnpm test` — all tests must pass before proceeding
  - [ ] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

- [ ] **Phase 5: Integrate AI Reconciliation into Import Pipeline**
  - [ ] In `parseEmployeeSheet()` in `server/reportGenerators/excelImport.ts`, after the existing Phase 11 (`inferWeekendPartialHours`) and `processWorkedCells` steps, add a new reconciliation pass:
    1. For each month, compare the final computed PTO total against the declared total from column S
    2. If there is still a discrepancy (|computed - declared| > 0.1h), build an `AIReconciliationRequest` containing:
       - The calendar entries for that month
       - The declared total
       - The computed total
       - The employee comments from `parseCommentsSection()`
       - The worked cells and unmatched noted cells for that month
    3. Call `queryAI()` with the built prompt
    4. If the AI returns a valid response, apply the adjustments:
       - Update entry hours per `AIEntryAdjustment` recommendations
       - Create new worked-day entries per `AIWorkedDayAdjustment` recommendations
       - Annotate each adjusted entry's `notes` with the AI's reasoning prefixed by `"[AI reconciliation] "`
       - Log a warning with the employee name, month, confidence level, and overall reasoning
    5. If the AI fails or returns an invalid response, log a warning and continue (no data changes)
  - [ ] Add `parseCommentsSection()` call in `parseEmployeeSheet()` and pass comments data through
  - [ ] Ensure the AI reconciliation step is skippable via an `enableAIReconciliation?: boolean` option (defaults to `false` unless `AI_API_KEY` is set)
  - [ ] Run `pnpm test` — all tests must pass before proceeding
  - [ ] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

- [ ] **Phase 6: Server API Endpoint for Manual AI Reconciliation**
  - [ ] Add `POST /api/admin/reconcile-pto` endpoint in `server/server.mts` (admin-only via `authenticateAdmin`)
  - [ ] The endpoint accepts `{ employeeId: number, month: string }` and:
    1. Loads the employee's PTO entries for that month from the database
    2. Loads the declared total from the stored import metadata (or allows the admin to provide it in the request body)
    3. Builds an `AIReconciliationRequest` and calls the AI
    4. Returns the `AIReconciliationResponse` to the admin WITHOUT auto-applying (preview mode)
  - [ ] Add `POST /api/admin/reconcile-pto/apply` endpoint that takes the AI response and applies it to the database after admin review
  - [ ] Both endpoints must validate inputs and return appropriate error codes (400 for bad input, 503 if AI unavailable)
  - [ ] Add unit tests for endpoint input validation
  - [ ] Run `pnpm test` — all tests must pass before proceeding
  - [ ] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

- [ ] **Phase 7: Testing and Validation**
  - [ ] Add integration test that mocks the AI API and verifies end-to-end flow: spreadsheet parse → AI call → adjustments applied → final totals match declared
  - [ ] Test case: A Campbell December 2018 — mock AI returns 4.5h for Dec 19 partial day. Verify total = 44.5h after adjustment
  - [ ] Test case: L Cole months with theme-based colors — verify AI receives unmatched noted cells and can recommend PTO entries from note text
  - [ ] Test case: AI API unavailable — verify graceful degradation (import completes, warning logged, no data changes)
  - [ ] Test case: AI returns invalid JSON — verify error handling and fallback
  - [ ] Test case: `AI_API_KEY` not set — verify no API call is made, import proceeds normally
  - [ ] Run `pnpm test` — all tests must pass before proceeding
  - [ ] Run `pnpm run build` — must compile without errors
  - [ ] Run `pnpm run lint` — must pass
  - [ ] Never proceed to the next phase if any tests are failing; fix all test failures before advancing

## Implementation Notes

- The AI reconciliation is a **last-resort** step, applied only after all deterministic reconciliation (Phases 8–11 of `legacy-data-import.md`) has been exhausted
- The AI API call is **optional** — without `AI_API_KEY`, the import works exactly as before with warnings for unresolved discrepancies
- All AI-derived adjustments MUST be annotated in the `notes` field with `[AI reconciliation]` prefix for audit traceability
- The AI prompt should emphasize that column S (PTO Calc declared total) is the authoritative source of truth
- The response schema is strict TypeScript — the AI must return JSON matching `AIReconciliationResponse` exactly, or the response is discarded
- Follow the project's low-memory deployment guidelines: the AI call is async and non-blocking; no large data structures are retained
- Never use `new Date()` — all date handling through `shared/dateUtils.ts`
- Comments section (rows 55–70) may contain rich text; always use `cell.text` not `cell.value.toString()`

### Spreadsheet Comments Section Layout

The comments section occupies rows 55–70 of each employee worksheet:

- **Row 55**: Contains `"COMMENTS:"` label in cell B55
- **Rows 55–70**: Free-text notes in columns E+ (e.g., `"April 5 = 4 hours"`, sick time explanations, schedule adjustments)
- Content may be plain text or ExcelJS rich text objects — always read via `cell.text`
- Not all rows will have content; many may be empty
- This section provides crucial context that the deterministic parser cannot use but an AI can interpret

### AI Prompt Strategy

The prompt sent to the AI should include:

1. **Context**: "You are analyzing PTO (Paid Time Off) data from a legacy Excel spreadsheet for an employee. The declared monthly PTO total from the spreadsheet's calculation section is the authoritative value."
2. **Calendar data**: All detected PTO entries for the month (date, type, hours, notes)
3. **Declared vs computed**: The gap between declared total and computed total
4. **Employee comments**: Verbatim text from rows 55–70 — the employee's own notes about their schedule
5. **Weekend work**: Any detected "worked" cells that create negative PTO credits
6. **Instruction**: "Respond ONLY with a JSON object matching the AIReconciliationResponse schema. Do not include markdown formatting or prose outside the JSON."

## Questions and Concerns

1. Which AI provider should be the default? OpenAI GPT-4o is assumed, but the implementation should be provider-agnostic (configurable URL + API key).
2. Should the AI reconciliation run automatically during bulk import, or only via the manual admin endpoint? Current spec does both, with auto-reconciliation gated behind `AI_API_KEY` being set.
3. Rate limiting: if importing 68 employee sheets with multiple months each, the AI may be called dozens of times. Should there be a concurrency limit or batch delay?
4. Cost tracking: should we log the number of AI API calls and estimated token usage for billing awareness?
