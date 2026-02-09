---
description: Generate detailed regression reports with clarifying questions and additional context
name: issue
agent: agent
tools: [agent, edit, execute, read, search, todo, vscode, web]
---

# Regression Issue Reporter

Generate a comprehensive regression report by capturing the defect details and automatically expanding on it with additional context, potential root causes, and clarifying questions to help resolve the issue.

## Instructions

1. **Capture the Defect Report**: Start by documenting the reported regression issue, including:
   - What functionality was working before
   - What changed (code, environment, dependencies)
   - Current behavior vs. expected behavior
   - Steps to reproduce
   - Impact severity

2. **Expound with Additional Detail**:
   - Analyze related code changes using git history or recent commits
   - Identify potential root causes (breaking changes, dependency updates, etc.)
   - Suggest debugging approaches
   - Reference similar past issues if found

3. **Generate Clarifying Questions**:
   - Ask about environment details (OS, browser, versions)
   - Inquire about recent changes or deployments
   - Request specific error messages or logs
   - Ask about reproduction conditions

4. **Provide Investigation Checklist**:
   - Steps to verify the regression
   - Areas to check for related issues
   - Test cases to run
     Use the Staged Action Plan skill ([.github/skills/staged-action-plan/SKILL.md](../skills/staged-action-plan/SKILL.md)) to organize the investigation into testable phases.

5. **Create Task File**:
   - Generate a new file in the `TASKS/` folder named `issue-[brief-description].md`
   - Use the full regression report as the file content
   - Update the main `TASKS/README.md` to include the new issue in the task list

## Input Format

Provide the regression details in the following format:

```
Regression: [Brief description]
Previously Working: [What worked before]
Current Behavior: [What's happening now]
Expected Behavior: [What should happen]
Steps to Reproduce: [Step-by-step reproduction]
Impact: [Severity and affected users]
```

## Example Output

### Regression Report: Login Button Not Working

**Issue Summary:**
The login button on the main page is no longer responding to clicks, preventing user authentication.

**Previously Working:**

- Login button was clickable and initiated authentication flow
- Users could successfully log in using email/password

**Current Behavior:**

- Button appears visually normal but clicking has no effect
- No console errors or network requests triggered
- Form submission not working

**Expected Behavior:**

- Clicking login button should validate form and submit authentication request
- Successful login should redirect to dashboard

**Potential Root Causes:**

- Recent JavaScript changes in `client/app.ts` may have broken event listeners
- CSS changes could be overlaying the button, preventing clicks
- Authentication API endpoint changes might be causing silent failures

**Clarifying Questions:**

1. When did this regression first appear? After which deployment/commit?
2. Does this affect all browsers or specific ones (Chrome, Firefox, Safari)?
3. Are there any console errors when clicking the button?
4. Has the authentication API been tested independently?
5. Are there any recent changes to form validation or event handling?

**Investigation Checklist:**

- [ ] Check browser console for JavaScript errors
- [ ] Verify event listeners are attached to login button
- [ ] Test authentication API endpoint directly
- [ ] Review recent commits for changes to login functionality
- [ ] Check CSS for z-index or pointer-events issues
- [ ] Run existing E2E tests for login flow

**Suggested Debugging Steps:**

1. Add console.log to button click handler to verify execution
2. Check if form validation is preventing submission
3. Inspect element to verify button is not obscured
4. Test with different user accounts to rule out account-specific issues
