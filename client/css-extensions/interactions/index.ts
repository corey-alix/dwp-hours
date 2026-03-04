/**
 * Interactions sub-module — shared gesture constants, device capability
 * helpers, and pointer-detection utilities.
 *
 * Re-exports timing constants used by components for long-press and
 * other pointer-based gestures, plus device-capability detection helpers.
 */
export { LONG_PRESS_MS, LONG_PRESS_MOVE_THRESHOLD } from "./constants.js";
export {
  isCoarsePointer,
  isFinePointer,
  hasHover,
  hasAnyCoarsePointer,
  prefersReducedMotion,
  prefersDarkScheme,
  isPrintMedia,
  hasGeolocation,
  hasMediaDevices,
  hasMotionSensor,
  hasOrientationSensor,
  hasBatteryAPI,
  hasVibration,
  hasNetworkInfo,
  canPlayVideoType,
} from "./capabilities.js";
