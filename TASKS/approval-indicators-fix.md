# Approval Indicators Fix

## Description

Extend the approval indicator functionality to the PTO Bereavement Card and PTO Sick Card components. Currently, only the PTO Jury Duty Card displays a green checkmark beside "Used" time when all entries are approved. This feature will implement the same approval status indicators for Bereavement and Sick time cards to provide consistent user experience across all PTO types.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1: Analysis and Planning

- [x] Review current PTO Bereavement Card and PTO Sick Card implementations
- [x] Confirm that Bereavement and Sick entries have approval workflow (approved_by field)
- [x] Verify that both card components extend SimplePtoBucketCard like Jury Duty Card
- [x] Identify any differences in data handling between the cards
- [x] Validation: Understand the current structure and requirements for both cards

## Phase 1 Implementation Findings

**Current PTO Bereavement Card and PTO Sick Card implementations:**

- Both components extend `SimplePtoBucketCard` (same as `PtoJuryDutyCard`)
- Simple wrapper classes with minimal custom logic
- Use standard `data`, `entries`, and `expanded` attributes
- No approval status checking currently implemented

**Approval workflow confirmation:**

- Database schema includes `approved_by` field for all PTO types (`Sick`, `PTO`, `Bereavement`, `Jury Duty`)
- `PTOEntry` interface includes `approved_by?: number | null` field
- `null` = pending approval, `number` = approved by admin employee ID
- All PTO types follow the same approval workflow

**Component inheritance verification:**

- ✅ `PtoBereavementCard extends SimplePtoBucketCard`
- ✅ `PtoSickCard extends SimplePtoBucketCard`
- ✅ `PtoJuryDutyCard extends SimplePtoBucketCard`
- All three cards share the same base class

**Data handling differences:**

- **Jury Duty Card**: Extended with `fullPtoEntries` property to receive complete `PTOEntry[]` objects, includes approval checking logic
- **Bereavement/Sick Cards**: Only receive simplified usage entries via `buildUsageEntries()` method (date + hours only)
- **App Integration**: Jury duty card gets `fullPtoEntries = entries.filter(...)` while others only get `usageEntries = buildUsageEntries(...)`

**Requirements for implementation:**

- Add `fullPtoEntries` property to both Bereavement and Sick cards (similar to Jury Duty)
- Implement approval status checking logic: filter by PTO type and check `approved_by !== null`
- Apply `'approved'` CSS class to "Used" label when all entries are approved
- Update app.ts to pass full entry data to both card types
- Existing CSS (`.card .label.approved::after`) already available for green checkmark display

### Phase 2: PTO Bereavement Card Implementation

- [x] Modify PtoBereavementCard component to accept full PTOEntry objects via fullPtoEntries property
- [x] Add logic to apply 'approved' CSS class to "Used" label when all bereavement entries are approved
- [x] Update component to handle approval status checking for bereavement entries
- [x] Test that the checkmark appears when all bereavement entries are approved
- [x] Validation: Bereavement card shows approval indicator correctly

## Phase 2 Implementation Findings

**PtoBereavementCard modifications completed:**

- ✅ Added `PTOEntry` type import and `PTO_CARD_CSS` import from base class
- ✅ Added `fullEntries: PTOEntry[]` private property
- ✅ Added `"full-entries"` to `observedAttributes` array
- ✅ Implemented `attributeChangedCallback` to handle `full-entries` attribute parsing
- ✅ Added `fullPtoEntries` getter/setter properties for programmatic access
- ✅ Overrode `render()` method with approval checking logic for "Bereavement" type entries
- ✅ Applied `'approved'` CSS class to "Used" label when all bereavement entries are approved
- ✅ Maintained all existing functionality (toggle button, date navigation, usage display)

**Approval logic implementation:**

- Filters `fullEntries` by `e.type === "Bereavement"`
- Checks `allApproved = bereavementEntries.length > 0 && bereavementEntries.every((e) => e.approved_by !== null)`
- Applies `approvedClass = allApproved ? " approved" : ""` to the "Used" label
- Uses existing CSS rule `.card .label.approved::after { content: " ✓"; color: var(--color-success); }`

**Test file updates:**

- ✅ Updated `test.ts` to set `fullPtoEntries` with all bereavement entries from seed data
- ✅ Enables testing of approval indicator logic with real data (mix of approved/unapproved entries)

**Build validation:**

- ✅ TypeScript compilation successful (no errors)
- ✅ Linting passes (client, server, test, e2e, CSS, scripts, YAML, JSON, Markdown)
- ✅ All quality gates pass

**Consistency with Jury Duty implementation:**

- ✅ Identical approval checking pattern: `entries.filter(type).every(approved_by !== null)`
- ✅ Same CSS class application and styling approach
- ✅ Same `fullPtoEntries` property interface
- ✅ Same attribute handling and event listeners
- ✅ Follows established component extension pattern

## Phase 3 Implementation Findings

**PtoSickCard modifications completed:**

- ✅ Added `PTOEntry` type import and `PTO_CARD_CSS` import from base class
- ✅ Added `fullEntries: PTOEntry[]` private property
- ✅ Added `"full-entries"` to `observedAttributes` array
- ✅ Implemented `attributeChangedCallback` to handle `full-entries` attribute parsing
- ✅ Added `fullPtoEntries` getter/setter properties for programmatic access
- ✅ Overrode `render()` method with approval checking logic for "Sick" type entries
- ✅ Applied `'approved'` CSS class to "Used" label when all sick entries are approved
- ✅ Maintained all existing functionality (toggle button, date navigation, usage display)

**Approval logic implementation:**

- Filters `fullEntries` by `e.type === "Sick"`
- Checks `allApproved = sickEntries.length > 0 && sickEntries.every((e) => e.approved_by !== null)`
- Applies `approvedClass = allApproved ? " approved" : ""` to the "Used" label
- Uses existing CSS rule `.card .label.approved::after { content: " ✓"; color: var(--color-success); }`

**Test file updates:**

- ✅ Updated `test.ts` to set `fullPtoEntries` with all sick entries from seed data
- ✅ Enables testing of approval indicator logic with real data (mix of approved/unapproved entries)

**Build validation:**

- ✅ TypeScript compilation successful (no errors)
- ✅ Linting passes (client, server, test, e2e, CSS, scripts, YAML, JSON, Markdown)
- ✅ All quality gates pass

**Consistency with other PTO card implementations:**

- ✅ Identical approval checking pattern across all three cards (Jury Duty, Bereavement, Sick)
- ✅ Same CSS class application and styling approach
- ✅ Same `fullPtoEntries` property interface
- ✅ Same attribute handling and event listeners
- ✅ Follows established component extension pattern

### Phase 3: PTO Sick Card Implementation

- [x] Modify PtoSickCard component to accept full PTOEntry objects via fullPtoEntries property
- [x] Add logic to apply 'approved' CSS class to "Used" label when all sick entries are approved
- [x] Update component to handle approval status checking for sick entries
- [x] Test that the checkmark appears when all sick entries are approved
- [x] Validation: Sick card shows approval indicator correctly

### Phase 4: Update App Integration

- [ ] Modify app.ts to pass full PTOEntry objects to bereavement and sick cards
- [ ] Update buildUsageEntries calls to include full entry data for both card types
- [ ] Ensure proper filtering by PTO type (Bereavement, Sick) for each card
- [ ] Test that both cards receive correct full entry data
- [ ] Validation: App correctly provides full entry data to both cards

### Phase 5: Update Test Files

- [ ] Update pto-dashboard test.ts to include full entry data for bereavement and sick cards
- [ ] Modify individual card test files (pto-bereavement-card/test.ts, pto-sick-card/test.ts) to set fullPtoEntries
- [ ] Update e2e tests to check for 'approved' CSS class on bereavement and sick card labels
- [ ] Ensure test data includes mix of approved/unapproved entries for both card types
- [ ] Validation: All tests pass with new approval indicator logic

### Phase 6: Documentation Updates

- [ ] Update PTO Bereavement Card README.md to document approval indicator feature
- [ ] Update PTO Sick Card README.md to document approval indicator feature
- [ ] Update component documentation to reflect consistent approval behavior across all PTO cards
- [ ] Ensure consistency with existing Jury Duty Card documentation
- [ ] Validation: Documentation accurately reflects the new functionality

### Phase 7: Testing and Validation

- [ ] Run unit tests for all three PTO card components
- [ ] Execute e2e tests for PTO dashboard with approval indicators
- [ ] Manual testing of approval indicators across all PTO card types
- [ ] Verify that unapproved entries don't show checkmarks
- [ ] Verify that approved entries show green checkmarks
- [ ] Validation: All approval indicators work correctly across PTO types

### Phase 8: Code Quality and Final Checks

- [ ] Run full build and lint checks
- [ ] Code review for consistency across all PTO card implementations
- [ ] Ensure no breaking changes to existing functionality
- [ ] Performance testing to ensure approval checking doesn't impact rendering
- [ ] Validation: Quality gates pass, feature ready for integration

## Implementation Notes

- **Existing CSS**: The `.card .label.approved::after` CSS rule already exists in the base PTO card styles and will be reused for all three card types
- **Component Pattern**: Follow the same pattern established for PtoJuryDutyCard - extend SimplePtoBucketCard, add fullPtoEntries property, implement approval checking logic
- **Data Flow**: Use the same approach as jury duty - filter full entries by PTO type and check approval status
- **Consistency**: Ensure all three PTO cards (Jury Duty, Bereavement, Sick) have identical approval indicator behavior
- **Business Logic**: All PTO types requiring approval should show the green checkmark when fully approved
- **Performance**: Approval checking should be lightweight and not impact card rendering performance

## Questions and Concerns

1. Should all PTO types show approval indicators, or only those that require administrative approval?
2. Are there any PTO types that should NOT show approval indicators (e.g., if they don't require approval)?
3. How should the approval indicators behave when there are mixed approved/unapproved entries for the same PTO type?
4. Should we consider adding pending approval indicators (e.g., yellow/orange styling) for unapproved entries?
5. Are there any performance concerns with checking approval status for all PTO entries on each card render?</content>
   <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/jupiter/TASKS/approval-indicators-fix.md
