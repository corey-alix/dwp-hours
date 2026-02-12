# Jury Duty Approval Indicators Fix

## Description

Fix the PTO calendar approval indicators to ensure that jury duty entries only display the green checkmark when they have been approved by an administrator. Currently, newly scheduled jury duty entries appear with the approval checkmark even though they are unapproved, which misleads users about their approval status.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1: Analysis and Investigation

- [x] Review current jury duty entry creation and approval workflow
- [x] Examine how jury duty entries are stored in the database (approved_by field)
- [x] Confirm the data flow from scheduling to approval in the PTO calendar component
- [x] Identify why unapproved jury duty entries are showing approval indicators
- [x] Validation: Understand the root cause of the premature approval display

### Phase 2: Backend Validation

- [x] Add `approved_by?: number | null` to the `PTOEntry` interface in `shared/api-models.d.ts`
- [x] Update `serializePTOEntry` function in `shared/entity-transforms.ts` to include `approved_by: entity.approved_by`
- [x] Verify that the API correctly returns approval status for all PTO entries
- [x] Confirm database constraints prevent automatic approval of jury duty entries
- [x] Validation: API responses now include `approved_by` field, defaulting to `null` for new entries

### Phase 3: Frontend Logic Update

- [ ] Verify that the PTO calendar component correctly handles `approved_by` field from API
- [ ] Ensure the checkmark logic works correctly with `null` values (no changes needed if API fix is correct)
- [ ] Test the updated logic with mock data (approved and unapproved jury duty entries)
- [ ] Validation: Component renders checkmarks correctly based on approval status

### Phase 4: Testing and Validation

- [ ] Update unit tests for PTO calendar to include jury duty approval scenarios
- [ ] Add test cases for unapproved jury duty entries not showing checkmarks
- [ ] Add test cases for approved jury duty entries showing checkmarks
- [ ] Manual testing: Schedule jury duty and verify no checkmark appears until approved
- [ ] Integration testing: Test with real data flow from scheduling to approval
- [ ] Validation: All tests pass, manual verification complete

### Phase 5: Documentation and Final Checks

- [ ] Update component documentation to clarify jury duty approval behavior
- [ ] Ensure consistency with existing approval indicator documentation
- [ ] Code review: Verify implementation follows project patterns
- [ ] Final build and lint check
- [ ] Validation: Quality gates pass, feature ready for integration

## Implementation Notes

- **Root Cause Identified**: The `approved_by` field is not included in the API response for PTO entries. The `serializePTOEntry` function in `shared/entity-transforms.ts` omits the `approved_by` field, causing it to be `undefined` in the client. Since `undefined !== null` evaluates to `true`, the calendar component incorrectly shows approval checkmarks for all PTO entries, including unapproved jury duty entries.
- **Database Schema**: Jury duty entries are correctly created with `approved_by = null` in the database.
- **API Response Issue**: The `PTOEntry` interface in `shared/api-models.d.ts` and the `serializePTOEntry` function do not include the `approved_by` field.
- **Component Logic**: The `PtoCalendar` component correctly checks `e.approved_by !== null` but receives `undefined` instead of `null`, causing false positives.
- **Approval Mechanism**: No approval endpoint exists in the current implementation. PTO entries are created without admin approval workflow.
- **Phase 2 Implementation**: Successfully added `approved_by?: number | null` to the `PTOEntry` interface and updated `serializePTOEntry` to include the field. The database schema correctly allows `approved_by` to be NULL for pending approval. No TypeScript compilation errors occurred.
- **Database Constraints**: The schema correctly defines `approved_by` as nullable INTEGER with foreign key to employees(id), preventing automatic approval.
- Jury duty entries should follow the same approval workflow as other PTO types requiring admin approval
- The checkmark should only appear after explicit admin approval, not upon scheduling
- Ensure the fix doesn't affect other PTO types that may have different approval rules
- Consider adding a visual distinction for pending approval if needed (but not required for this fix)
- Follow existing patterns for approval status checking in the calendar component

## Questions and Concerns

1. Should jury duty entries have a different visual indicator for pending approval (e.g., yellow or gray) before admin approval?
2. Are there other PTO types that might have similar issues with premature approval display?
3. How should the approval process be communicated to users scheduling jury duty?
4. **New**: Since no approval mechanism currently exists, should this task also implement basic PTO approval functionality, or just fix the display issue?
