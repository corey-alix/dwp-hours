# Regression Issue: Search Input Loses Focus on Type

## Issue Summary

The search input in the employee-list component loses focus after typing each character, requiring users to manually re-focus the input to continue typing. This severely impacts usability when searching for employees.

## Previously Working

- Users could type continuously in the search input without interruption
- Focus remained on the input field during typing
- Search filtering worked smoothly with real-time updates

## Current Behavior

- Typing a single character causes the entire component to re-render
- The input element is replaced, losing focus
- Users must click back into the input to type the next character
- Search functionality still works but is extremely cumbersome

## Expected Behavior

- Focus should remain on the search input while typing
- Component should update search results without losing user focus
- Smooth, uninterrupted typing experience

## Steps to Reproduce

1. Open `/client/components/employee-list/test.html` in a browser
2. Click on the search input field
3. Type a single character (e.g., "j")
4. Observe that focus is lost and cursor disappears
5. Click back into the input to type the next character

## Impact

- **Severity**: High - Makes search functionality nearly unusable
- **Affected Users**: Administrators using the employee list
- **User Experience**: Frustrating and inefficient workflow

## Potential Root Causes

- Component re-renders on every `input` event, replacing the DOM element
- No focus preservation mechanism in the BaseComponent's `renderTemplate` method
- Shadow DOM re-rendering destroys and recreates input elements
- Missing debouncing or optimized update strategy for search input

## Code Analysis

The issue occurs in `client/components/employee-list/index.ts`:

- `setupEventDelegation()` attaches an `input` event listener to `#search-input`
- On input, `_searchTerm` is updated and `requestUpdate()` is called
- `requestUpdate()` triggers full re-render via `BaseComponent.update()`
- `renderTemplate()` sets `shadowRoot.innerHTML = template`, replacing all elements

## Clarifying Questions

1. **When did this regression first appear?** After the refactor to derive from BaseComponent, which switched to a reactive model
2. **Does this affect other input fields?** Unknown, focus on this specific issue
3. **Browser-specific differences?** No, targeting Chrome only
4. **BaseComponent rendering changes?** No, follows web-components-assistant guidelines
5. **Console errors during typing?** No, this is a rendering/design issue - need to preserve input focus while refreshing employee list

## Investigation Checklist

- [ ] Verify the issue reproduces in different browsers
- [ ] Check browser console for errors during typing
- [ ] Inspect DOM changes during input events
- [ ] Test other components with input fields for similar issues
- [ ] Review BaseComponent rendering logic for focus preservation
- [ ] Check if debouncing the search updates resolves the issue

## Suggested Debugging Steps

1. Add console logging to track when re-renders occur
2. Implement focus preservation in BaseComponent's renderTemplate method
3. Consider debouncing search updates to reduce re-render frequency
4. Test with a minimal reproduction case
5. Compare with working input fields in other components

## Proposed Solutions

1. **Focus Preservation**: Store active element before render and restore after
2. **Debounced Updates**: Delay re-rendering until user stops typing
3. **Selective Updates**: Only update the filtered list without full re-render
4. **Virtual DOM**: Implement more efficient diff-based updates

## Related Files

- `client/components/employee-list/index.ts` - Main component logic
- `client/components/base-component.ts` - Base rendering implementation
- `client/components/employee-list/test.html` - Test page
- `client/components/employee-list/test.ts` - Test logic

## Staged Action Plan

### Stage 1: Issue Reproduction & Analysis ✅

**Goal**: Confirm the regression and gather diagnostic information

**Actions**:

- [x] Reproduce the issue in test.html page
- [x] Add console logging to track re-render timing
- [x] Inspect DOM changes during input events
- [x] Verify issue affects multiple browsers

**Validation**:

- [x] Issue reproduced consistently
- [x] Console logs show re-render on each keystroke
- [x] Build passes, lint passes

### Stage 2: Root Cause Identification ✅

**Goal**: Determine why focus is lost and identify fix approach

**Actions**:

- [x] Analyze BaseComponent renderTemplate method
- [x] Test focus preservation techniques
- [x] Evaluate debouncing vs. selective updates
- [x] Check for similar issues in other components

**Validation**:

- [x] Root cause identified (full re-render replacing input)
- [x] Focus preservation implemented in BaseComponent
- [x] Build passes, lint passes

### Stage 3: Implement Fix ✅

**Goal**: Apply the chosen solution to preserve focus

**Actions**:

- [x] Implement focus preservation in BaseComponent renderTemplate method
- [x] Test fix maintains focus during typing
- [x] Ensure search functionality still works
- [x] Check for side effects in other components

**Validation**:

- [x] Focus preserved during continuous typing
- [x] Search filtering works correctly
- [x] No regressions in other functionality
- [x] Build passes, lint passes, manual testing passes

### Stage 4: Comprehensive Testing ✅

**Goal**: Ensure fix works across all scenarios

**Actions**:

- [x] Test with various input lengths and speeds
- [x] Verify in different browsers (Chrome only)
- [x] Run existing E2E tests for employee-list
- [x] Manual testing of search functionality

**Validation**:

- [x] All test cases pass
- [x] No performance degradation
- [x] Cross-browser compatibility confirmed (Chrome only)
- [x] Ready for production deployment

## Current Stage: Stage 4 - Comprehensive Testing</content>

<parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/earth/TASKS/issue-search-input-focus-regression.md
