# Confirmation Dialog Component

## Overview

The Confirmation Dialog component provides a modal dialog for user confirmations with customizable message, button text, and event handling. It features a backdrop overlay, keyboard accessibility, and full theme integration.

## Features

- **Modal Overlay**: Full-screen backdrop with semi-transparent overlay
- **Customizable Content**: Configurable message and button text via attributes
- **Event Handling**: Dispatches 'confirm' and 'cancel' custom events
- **Theme Integration**: Uses CSS custom properties for consistent theming
- **Accessibility**: Proper focus management and keyboard navigation
- **Responsive Design**: Centered dialog that adapts to screen size

## Usage

```html
<confirmation-dialog
  message="Are you sure you want to delete this item?"
  confirm-text="Delete"
  cancel-text="Cancel"
>
</confirmation-dialog>
```

```javascript
const dialog = document.querySelector("confirmation-dialog");
dialog.addEventListener("confirm", () => {
  // Handle confirmation
});
dialog.addEventListener("cancel", () => {
  // Handle cancellation
});
```

## Attributes

- `message`: The confirmation message to display
- `confirm-text`: Text for the confirm button (default: "Confirm")
- `cancel-text`: Text for the cancel button (default: "Cancel")

## Properties

- `message`: Get/set the confirmation message
- `confirmText`: Get/set the confirm button text
- `cancelText`: Get/set the cancel button text

## Events

- `confirm`: Fired when the confirm button is clicked
- `cancel`: Fired when the cancel button is clicked

## Theming Implementation

### CSS Custom Properties Used

The component uses the following semantic color variables for consistent theming:

- `--color-surface`: Dialog background
- `--color-text`: Message text color
- `--color-shadow`: Drop shadow for dialog
- `--color-border`: Dialog border color
- `--color-error`: Confirm button background (destructive action)
- `--color-red-700`: Confirm button hover state
- `--color-secondary`: Cancel button background
- `--color-secondary-hover`: Cancel button hover state
- `--color-primary`: Focus outline color

### Theme Integration

The dialog automatically adapts to light and dark themes through CSS custom properties. The confirm button uses error colors to indicate destructive actions, while the cancel button uses secondary colors for neutral actions.

## Accessibility

- **Focus Management**: Buttons receive proper focus outlines
- **Keyboard Navigation**: Tab navigation between buttons
- **Screen Readers**: Semantic button elements with descriptive text
- **Modal Behavior**: Prevents interaction with background content

## Implementation Details

- **Shadow DOM**: Encapsulated styling and markup
- **Event Delegation**: Efficient event handling within shadow root
- **Attribute Observation**: Reactive updates when attributes change
- **Memory Management**: Proper cleanup of event listeners</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/confirmation-dialog/README.md
