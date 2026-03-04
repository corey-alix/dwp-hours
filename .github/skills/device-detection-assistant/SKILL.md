---
name: device-detection-assistant
description: Specialized assistant for detecting device capabilities using browser feature detection APIs (matchMedia, navigator, etc.) instead of user-agent sniffing.
---

# Device Detection Assistant

## Description

A specialized skill for implementing reliable device capability detection in the DWP Hours Tracker. The project uses **native browser feature-detection APIs** (CSS media queries via `matchMedia`, navigator properties, element method probes) rather than user-agent string sniffing. All detection helpers live in `client/css-extensions/interactions/capabilities.ts` and are re-exported through the css-extensions facade.

## Centralized Module

All device-capability helpers are defined in a single module:

```
client/css-extensions/interactions/capabilities.ts
```

Exported through:

- `client/css-extensions/interactions/index.ts` (sub-module)
- `client/css-extensions/index.ts` (facade)

Import from either location:

```typescript
// Direct sub-module (tree-shakeable)
import {
  isCoarsePointer,
  hasHover,
} from "../../css-extensions/interactions/index.js";

// Facade (convenient)
import { isCoarsePointer, hasHover } from "../../css-extensions/index.js";
```

## Available Helpers

### Pointer / Input Detection

| Helper                  | API                                   | Purpose                                                   |
| ----------------------- | ------------------------------------- | --------------------------------------------------------- |
| `isCoarsePointer()`     | `matchMedia("(pointer: coarse)")`     | Primary pointer is a finger or stylus (touch device)      |
| `isFinePointer()`       | `matchMedia("(pointer: fine)")`       | Primary pointer is a mouse or trackpad                    |
| `hasHover()`            | `matchMedia("(hover: hover)")`        | Primary pointer supports hover (mouse)                    |
| `hasAnyCoarsePointer()` | `matchMedia("(any-pointer: coarse)")` | Any available pointer is coarse (laptop with touchscreen) |

### Display / Preferences

| Helper                   | API                                              | Purpose                                           |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------- |
| `prefersReducedMotion()` | `matchMedia("(prefers-reduced-motion: reduce)")` | User prefers reduced motion (suppress animations) |
| `prefersDarkScheme()`    | `matchMedia("(prefers-color-scheme: dark)")`     | User prefers dark color scheme                    |
| `isPrintMedia()`         | `matchMedia("print")`                            | Currently in print preview or CSS print emulation |

### Hardware / Sensors

| Helper                   | API                                    | Purpose                                |
| ------------------------ | -------------------------------------- | -------------------------------------- |
| `hasGeolocation()`       | `"geolocation" in navigator`           | Device has GPS / network location      |
| `hasMediaDevices()`      | `navigator.mediaDevices?.getUserMedia` | Device has camera/microphone (WebRTC)  |
| `hasMotionSensor()`      | `"DeviceMotionEvent" in window`        | Device has accelerometer               |
| `hasOrientationSensor()` | `"DeviceOrientationEvent" in window`   | Device has gyroscope                   |
| `hasBatteryAPI()`        | `"getBattery" in navigator`            | Device exposes battery status          |
| `hasVibration()`         | `"vibrate" in navigator`               | Device supports haptic feedback        |
| `hasNetworkInfo()`       | `"connection" in navigator`            | Device exposes network connection type |

### Media Playback

| Helper                   | API                   | Purpose                                             |
| ------------------------ | --------------------- | --------------------------------------------------- |
| `canPlayVideoType(mime)` | `video.canPlayType()` | Browser can play a specific video MIME type / codec |

## Design Principles

### 1. Feature Detection over User-Agent Sniffing

Never parse `navigator.userAgent`. Feature detection is:

- **More accurate**: Directly tests the capability you need
- **More maintainable**: No brittle string parsing that breaks with new browsers
- **Future-proof**: New devices with the same capabilities just work

### 2. Pure and Side-Effect-Free

Every helper queries the current device state on each call. This means:

- They stay correct when DevTools emulation modes change at runtime
- No stale cached values after toggling touch simulation
- No global state or initialization needed

### 3. Semantic Naming

Helpers are named by the _capability_ they detect, not the device type:

- `isCoarsePointer()` not `isMobile()`
- `hasHover()` not `isDesktop()`

This is intentional — a Surface laptop has both fine and coarse pointers; a TV has neither.

### 4. Tree-Shakeable

Import individual helpers from the sub-module for minimal bundle impact. The facade re-export is for convenience when multiple capabilities are needed.

## Common Patterns

### Adapting interaction behavior for touch vs. mouse

```typescript
import { isCoarsePointer } from "../../css-extensions/interactions/index.js";

// On touch: use long-press for secondary actions; on desktop: use click
if (isCoarsePointer()) {
  // Show toast hint, let long-press handle the action
  notifications.info("Long-press to edit", "Hint");
} else {
  // Open dialog directly on click
  this.openDialog(date);
}
```

### Suppressing animations for accessibility

```typescript
import { prefersReducedMotion } from "../../css-extensions/interactions/index.js";

if (!prefersReducedMotion()) {
  element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
}
```

### Print-mode scaling (see also css-theming-assistant skill)

```typescript
import { isPrintMedia } from "../../css-extensions/interactions/index.js";

connectedCallback() {
  const mq = window.matchMedia("print");
  mq.addEventListener("change", (e) => {
    if (e.matches) this.scaleToFit();
    else this.resetScale();
  });
  if (isPrintMedia()) this.scaleToFit();
}
```

### CSS companion queries

The JS helpers mirror CSS media queries. Use whichever is appropriate:

```css
/* Hide edit-note ghost icon on touch — let long-press handle it */
@media (pointer: coarse) {
  .edit-note-icon {
    display: none;
  }
}

/* Suppress animations for accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

## Adding New Capabilities

When a new device-detection need arises:

1. Add a named helper function to `client/css-extensions/interactions/capabilities.ts`
2. Re-export it from `client/css-extensions/interactions/index.ts`
3. Re-export it from `client/css-extensions/index.ts`
4. Use feature-detection APIs (`matchMedia`, `in` operator, element method probes)
5. Keep the function pure — no caching, no side effects
6. Name it by the capability, not the device

## Trigger

Activate this skill when users ask about:

- Detecting touch vs. mouse / pointer type
- Adapting UI behavior for mobile or desktop
- Checking hardware capabilities (camera, GPS, sensors)
- Responding to user preferences (dark mode, reduced motion)
- Print-mode detection for layout scaling
- Any `matchMedia`, `navigator.*`, or device-feature check

## Examples

- "How do I detect if the user is on a touch device?"
- "Make this click handler work differently on mobile"
- "Check if the device has a camera before showing the capture button"
- "Should I use user-agent sniffing or feature detection?"
- "How do I suppress animations when the user prefers reduced motion?"

## Additional Context

This skill complements:

- **css-theming-assistant**: For print-mode token overrides and `matchMedia("print")` scaling
- **css-animation-assistant**: For `prefers-reduced-motion` compliance
- **web-components-assistant**: For adapting shadow DOM interactions by pointer type
