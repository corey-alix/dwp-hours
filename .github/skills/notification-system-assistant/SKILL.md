# Notification System Assistant

## Description

Specialized assistant for implementing the bespoke notification/toaster system in the DWP Hours Tracker. Provides guidance on using non-blocking toast notifications for user feedback that work seamlessly with automated testing frameworks.

## Notification System

The DWP Hours Tracker uses a lightweight bespoke notification/toaster system to provide user feedback without blocking the UI or interfering with automated testing. All `alert()` calls have been replaced with toast notifications.

### Core Features
- **Non-blocking**: Don't interrupt user workflow or testing execution
- **Auto-dismiss**: Automatically disappear after 5 seconds (configurable)
- **Type-safe**: Support success, error, info, and warning types
- **Accessible**: Include close buttons and proper ARIA attributes
- **Test-friendly**: Compatible with Playwright and other testing frameworks

### Toast Types
- **`success`**: Green styling for positive confirmations
- **`error`**: Red styling for error messages
- **`info`**: Blue styling for informational messages
- **`warning`**: Yellow/Orange styling for warnings

### Key Features
- **Auto-dismiss**: Configurable duration (default 5 seconds)
- **Manual close**: Click the × button to dismiss immediately
- **Smooth animations**: Slide-in and fade-out effects
- **Stacking**: Multiple notifications stack vertically in top-right corner
- **Positioning**: Fixed position with z-index 1000

## Usage Examples

```typescript
// Success notification
notifications.success("PTO submitted successfully!");

// Error notification with title
notifications.error(
  "Failed to submit PTO. Please try again.",
  "Submission Error",
);

// Info notification with custom duration
notifications.info("Feature coming soon!", undefined, 3000);

// Warning notification
notifications.warning("Session will expire in 5 minutes.");
```

## Implementation Details

### CSS Classes
- `.notification-toast` - Base notification styling
- `.notification-success` - Success variant
- `.notification-error` - Error variant
- `.notification-info` - Info variant
- `.notification-warning` - Warning variant

### Animation
- CSS transitions with `slideIn` keyframe for smooth appearance
- Fade-out effects for dismissal

### Positioning
- Fixed position in top-right corner
- High z-index (1000) to appear above other content

### Accessibility
- Proper contrast ratios for all variants
- Keyboard navigation support
- ARIA attributes for screen readers

## Trigger

Activate this skill when users ask about:

- User feedback and notification systems
- Toast notification implementation
- Replacing alert() calls
- Test-friendly notification approaches
- Notification styling and positioning
- Accessibility for notifications

## Response Pattern

When activated, follow this structured approach:

1. **Identify Notification Need**: Determine the type of feedback required (success, error, info, warning)
2. **Reference Toast API**: Show appropriate notification method from the notifications module
3. **Provide Configuration Options**: Explain duration, titles, and custom messages
4. **Address Testing Concerns**: Ensure compatibility with automated testing
5. **Verify Accessibility**: Confirm ARIA attributes and keyboard support

## Examples

- "How do I show success messages to users?"
- "What's the best way to display error notifications?"
- "How do I replace alert() calls?"
- "How do notifications work with automated testing?"
- "How do I customize notification duration?"

## Additional Context

This skill integrates with the project's testing strategy and ensures all user feedback follows consistent patterns. The notification system is implemented to avoid blocking UI interactions and maintain compatibility with Playwright E2E tests.