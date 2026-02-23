/**
 * CSS Extensions facade — single entry point for all shared CSS extension
 * libraries (animations, toolbar, etc.).
 *
 * Each extension provides a constructable stylesheet singleton and an
 * `adopt*()` helper that safely adds it to a shadow root's
 * `adoptedStyleSheets`. Import from this facade for convenience, or from
 * the individual sub-module for tree-shaking.
 *
 * @example
 * ```ts
 * import { adoptAnimations, adoptToolbar } from "../../css-extensions/index.js";
 *
 * connectedCallback() {
 *   super.connectedCallback();
 *   adoptAnimations(this.shadowRoot);
 *   adoptToolbar(this.shadowRoot);
 * }
 * ```
 */

// ── Animations ──
export {
  getAnimationSheet,
  adoptAnimations,
  animateSlide,
  animateCarousel,
  setupSwipeNavigation,
} from "./animations/index.js";
export type {
  AnimationHandle,
  SwipeNavigationHandle,
  ListenerHost,
} from "./animations/index.js";

// ── Toolbar ──
export { getToolbarSheet, adoptToolbar } from "./toolbar/index.js";

// ── Navigation ──
export {
  getNavigationSheet,
  adoptNavigation,
  NAV_SYMBOLS,
} from "./navigation/index.js";
