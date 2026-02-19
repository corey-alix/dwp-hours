# Zero-Hour PTO Unschedule API

## Description

Enable the `POST /api/pto` endpoint to accept 0-hour PTO requests, which indicate the user wants to unschedule (delete) an existing PTO entry of the given type on the given date. If no existing entry of that type exists for that date, return a validation error. This supports the calendar UI's "clear day" interaction where cycling through hours reaches 0.

## Priority

🟡 Medium Priority (API Core Feature)

## Staged Action Plan

### Stage 1: API Handler (Complete)

- [x] In `POST /api/pto`, detect `hours === 0` before calling `createPtoEntry`
- [x] Look up existing entry by `employee_id`, `date`, and `type`
- [x] If found, delete it via `ptoEntryRepo.remove()` and log the unschedule
- [x] If not found, return 400 with descriptive validation error
- [x] Handle empty `results` array when all requests were unschedules

### Stage 2: Business Rules (No Changes Needed)

- [x] `validateHours` in `businessRules.ts` correctly rejects `hours <= 0` — this is desired behavior for the DAL layer
- [x] The 0-hour case is handled at the API layer before DAL validation runs

### Stage 3: Validation

- [ ] `pnpm run build` passes (no TypeScript errors confirmed via IDE)
- [ ] `pnpm run lint` passes
- [ ] Manual testing: submit 0-hour PTO request for existing entry → entry deleted
- [ ] Manual testing: submit 0-hour PTO request with no existing entry → error returned
- [ ] Manual testing: mixed batch (some 0-hour, some positive-hour) → correct behavior
- [ ] Run E2E tests for PTO entry flow

### Stage 4: Future Enhancements

- [ ] Consider returning the deleted entry details in the response
- [ ] Consider adding a dedicated `DELETE /api/pto/by-date` endpoint as an alternative

## Implementation Notes

- The 0-hour check runs before `createPtoEntry` DAL call, bypassing business rule validation entirely
- The existing duplicate-handling upsert logic is not affected — it only runs for positive-hour requests
- When all requests in a batch are 0-hour unschedules, the response returns `{ message: "PTO entries unscheduled successfully" }` instead of the standard `PTOCreateResponse`
- The `type` field must match exactly — unscheduling "PTO" won't affect a "Sick" entry on the same date

## Questions and Concerns

1.
2.
3.
