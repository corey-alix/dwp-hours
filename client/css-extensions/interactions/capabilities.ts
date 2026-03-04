/**
 * Device capability detection helpers — thin wrappers around browser APIs
 * for consistent, testable feature checks.
 *
 * **Preferred over user-agent sniffing** — these use native feature
 * detection (matchMedia, `in` operator, etc.) which is more accurate and
 * maintainable.
 *
 * These helpers are intentionally pure and side-effect-free: they query
 * the current device state on every call so they stay correct when
 * emulation modes change at runtime (e.g. DevTools toggling touch).
 */

// ── Pointer / Input ──

/** Primary pointer is coarse (finger / stylus — touch devices). */
export function isCoarsePointer(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

/** Primary pointer is fine (mouse / trackpad). */
export function isFinePointer(): boolean {
  return window.matchMedia("(pointer: fine)").matches;
}

/** Device supports hover on primary pointer (mouse). */
export function hasHover(): boolean {
  return window.matchMedia("(hover: hover)").matches;
}

/** Device has *any* coarse pointer available (even if primary is fine). */
export function hasAnyCoarsePointer(): boolean {
  return window.matchMedia("(any-pointer: coarse)").matches;
}

// ── Display ──

/** User prefers reduced motion (accessibility). */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** User prefers dark color scheme. */
export function prefersDarkScheme(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Display is in "print" media (print preview or emulation). */
export function isPrintMedia(): boolean {
  return window.matchMedia("print").matches;
}

// ── Hardware / Sensors ──

/** Device has geolocation (GPS / network location). */
export function hasGeolocation(): boolean {
  return "geolocation" in navigator;
}

/** Device has camera/microphone (WebRTC media capture). */
export function hasMediaDevices(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/** Device has motion sensors (accelerometer). */
export function hasMotionSensor(): boolean {
  return "DeviceMotionEvent" in window;
}

/** Device has orientation sensors (gyroscope). */
export function hasOrientationSensor(): boolean {
  return "DeviceOrientationEvent" in window;
}

/** Device exposes battery status. */
export function hasBatteryAPI(): boolean {
  return "getBattery" in navigator;
}

/** Device supports vibration (haptic feedback). */
export function hasVibration(): boolean {
  return "vibrate" in navigator;
}

/** Device exposes network connection info (NetInfo API). */
export function hasNetworkInfo(): boolean {
  return "connection" in navigator;
}

// ── Media Playback ──

/** Check if the browser can play a specific video MIME type + codec. */
export function canPlayVideoType(mimeType: string): boolean {
  const video = document.createElement("video");
  return video.canPlayType(mimeType) !== "";
}
