/**
 * Shared animation library for web components.
 *
 * Provides a constructable stylesheet singleton for CSS keyframes/utility
 * classes, plus JavaScript helpers for complex multi-phase animations that
 * cannot be expressed in pure CSS.
 *
 * All durations, easings, and distances are read from tokens.css custom
 * properties at animation time — no hardcoded values.
 */

import { animationCSS } from "./animations.js";
import type { AnimationHandle, SwipeNavigationHandle } from "./types.js";

export type { AnimationHandle, SwipeNavigationHandle } from "./types.js";

// ── Constructable stylesheet singleton ──

let _sharedSheet: CSSStyleSheet | null = null;

/**
 * Return the shared CSSStyleSheet containing all animation keyframes and
 * utility classes. The sheet is created lazily on first call.
 */
export function getAnimationSheet(): CSSStyleSheet {
  if (!_sharedSheet) {
    _sharedSheet = new CSSStyleSheet();
    _sharedSheet.replaceSync(animationCSS);
  }
  return _sharedSheet;
}

/**
 * Adopt the shared animation stylesheet into a shadow root (or document).
 * Safe to call multiple times — the sheet is added only once.
 */
export function adoptAnimations(root: ShadowRoot | Document): void {
  const sheet = getAnimationSheet();
  root.adoptedStyleSheets = [
    ...root.adoptedStyleSheets.filter((s) => s !== sheet),
    sheet,
  ];
}

// ── Token reader ──

/** Read a CSS custom property value, checking the element first then :root. */
function getToken(name: string, fallback: string, el?: Element): string {
  if (el) {
    const val = getComputedStyle(el).getPropertyValue(name).trim();
    if (val) return val;
  }
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

/** Check reduced motion preference. */
function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Remove all inline animation styles from an element. */
function cleanupStyles(el: HTMLElement): void {
  el.style.willChange = "";
  el.style.transition = "";
  el.style.transform = "";
  el.style.opacity = "";
}

// ── animateSlide — vertical slide show/hide ──

/**
 * Animate an element sliding in (show) or out (hide) along the Y axis.
 *
 * - **show = true**: Element slides down from `--slide-offset` above, fading
 *   in with `--easing-decelerate`.
 * - **show = false**: Element slides up by `--slide-offset`, fading out with
 *   `--easing-accelerate`.
 *
 * The caller is responsible for DOM visibility (e.g. toggling a `closed`
 * class) — this helper only drives the visual transition.
 *
 * @returns An {@link AnimationHandle} with a `promise` and a `cancel` method.
 */
export function animateSlide(
  element: HTMLElement,
  show: boolean,
): AnimationHandle {
  // Reduced motion: resolve immediately
  if (prefersReducedMotion()) {
    return { promise: Promise.resolve(), cancel: () => {} };
  }

  let cancelled = false;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  let resolvePromise: () => void;

  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });

  const duration = getToken("--duration-normal", "250ms", element);
  const durationMs = parseFloat(duration);
  const easing = show
    ? getToken("--easing-decelerate", "cubic-bezier(0, 0, 0.2, 1)", element)
    : getToken("--easing-accelerate", "cubic-bezier(0.4, 0, 1, 1)", element);
  const offset = getToken("--slide-offset", "8px", element);
  const transitionValue = `transform ${duration} ${easing}, opacity ${duration} ${easing}`;

  function onComplete() {
    if (cancelled) return;
    cancelled = true;
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    element.removeEventListener("transitionend", onEnd);
    cleanupStyles(element);
    resolvePromise();
  }

  function onEnd(e: TransitionEvent) {
    if (e.propertyName !== "transform") return;
    onComplete();
  }

  if (show) {
    // Start from hidden position
    element.style.willChange = "transform, opacity";
    element.style.transform = `translateY(-${offset})`;
    element.style.opacity = "0";
    // Force synchronous reflow to commit position
    void element.offsetHeight;
    // Animate to visible
    element.style.transition = transitionValue;
    element.style.transform = "translateY(0)";
    element.style.opacity = "1";
  } else {
    // Animate to hidden position
    element.style.willChange = "transform, opacity";
    element.style.transition = transitionValue;
    element.style.transform = `translateY(-${offset})`;
    element.style.opacity = "0";
  }

  element.addEventListener("transitionend", onEnd);
  fallbackTimer = setTimeout(onComplete, durationMs + 50);

  return {
    promise,
    cancel: onComplete,
  };
}

// ── animateCarousel — horizontal carousel slide ──

/**
 * Carousel-style animation for swapping content horizontally.
 *
 * 1. **Phase 1**: Current content slides out in the swipe direction, fading
 *    to transparent.
 * 2. **onUpdate()**: Caller swaps content while the container is off-screen.
 * 3. **Phase 2**: Container instantly jumps to the opposite side.
 * 4. **Phase 3**: New content slides in from the opposite side to center.
 *
 * Uses `--duration-normal` and `--easing-standard` from tokens.css.
 *
 * @param container  The element whose transform/opacity are animated.
 * @param direction  Positive = next (exits left, enters from right).
 *                   Negative = prev (exits right, enters from left).
 * @param onUpdate   Callback invoked while the container is off-screen,
 *                   typically to swap month/page content.
 * @returns An {@link AnimationHandle} with a `promise` and a `cancel` method.
 */
export function animateCarousel(
  container: HTMLElement,
  direction: number,
  onUpdate: () => void,
): AnimationHandle {
  // Reduced motion: update content immediately
  if (prefersReducedMotion()) {
    onUpdate();
    return { promise: Promise.resolve(), cancel: () => {} };
  }

  let cancelled = false;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  let resolvePromise: () => void;

  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });

  const duration = getToken("--duration-normal", "250ms");
  const durationMs = parseFloat(duration);
  const easing = getToken("--easing-standard", "cubic-bezier(0.4, 0, 0.2, 1)");

  // direction > 0 = next: exit left (-100%), enter from right (+100%)
  // direction < 0 = prev: exit right (+100%), enter from left (-100%)
  const exitX = direction > 0 ? "-100%" : "100%";
  const enterX = direction > 0 ? "100%" : "-100%";
  const transitionValue = `transform ${duration} ${easing}, opacity ${duration} ${easing}`;

  function cleanup() {
    if (cancelled) return;
    cancelled = true;
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    cleanupStyles(container);
    resolvePromise();
  }

  // Phase 1: Slide current content out
  container.style.willChange = "transform, opacity";
  container.style.transition = transitionValue;
  container.style.transform = `translateX(${exitX})`;
  container.style.opacity = "0";

  const onSlideOut = (e: TransitionEvent) => {
    if (e.propertyName !== "transform" || cancelled) return;
    container.removeEventListener("transitionend", onSlideOut);
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }

    // Content swap while off-screen
    onUpdate();

    // Phase 2: Instantly jump to opposite side (no transition)
    container.style.transition = "none";
    container.style.transform = `translateX(${enterX})`;
    // Force synchronous reflow
    void container.offsetHeight;

    // Phase 3: Slide new content in to center
    container.style.transition = transitionValue;
    container.style.transform = "translateX(0)";
    container.style.opacity = "1";

    fallbackTimer = setTimeout(cleanup, durationMs + 50);

    const onSlideIn = (e: TransitionEvent) => {
      if (e.propertyName !== "transform" || cancelled) return;
      container.removeEventListener("transitionend", onSlideIn);
      cleanup();
    };
    container.addEventListener("transitionend", onSlideIn);
  };

  container.addEventListener("transitionend", onSlideOut);
  // Fallback for phase 1 in case transitionend never fires
  fallbackTimer = setTimeout(() => {
    container.removeEventListener("transitionend", onSlideOut);
    if (!cancelled) {
      onUpdate();
      cleanup();
    }
  }, durationMs + 50);

  return {
    promise,
    cancel: () => {
      if (!cancelled) {
        container.removeEventListener("transitionend", onSlideOut);
        onUpdate();
        cleanup();
      }
    },
  };
}

// ── setupSwipeNavigation — reusable swipe-to-navigate helper ──

/** Minimum horizontal distance (px) to recognise a swipe. */
const SWIPE_THRESHOLD = 50;

/**
 * Narrow interface for the listener-tracking capability needed by
 * `setupSwipeNavigation`. Matches {@link BaseComponent.addListener}.
 */
export interface ListenerHost {
  addListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
  ): void;
}

/**
 * Attach swipe gesture detection and animated carousel navigation to a
 * container element.
 *
 * Touch listeners are registered via the host's `addListener()` for
 * memory-safe automatic cleanup. Animation state (guard flag and
 * current handle) is encapsulated in the returned closure — callers
 * do **not** need their own `isAnimating` / `currentAnimation` fields.
 *
 * @param host       Object with an `addListener` method (typically a
 *                   `BaseComponent` instance) used to register touch
 *                   handlers for automatic lifecycle cleanup.
 * @param container  The DOM element to listen for touch events on and
 *                   to animate with `animateCarousel()`.
 * @param onNavigate Callback invoked with `-1` (prev) or `1` (next)
 *                   while the container is off-screen during the
 *                   carousel animation — swap content here.
 * @returns A {@link SwipeNavigationHandle} with `cancel()` and
 *          `destroy()` methods.
 */
export function setupSwipeNavigation(
  host: ListenerHost,
  container: HTMLElement,
  onNavigate: (direction: -1 | 1) => void,
): SwipeNavigationHandle {
  let swipeStartX: number | null = null;
  let swipeStartY: number | null = null;
  let isAnimating = false;
  let currentAnimation: AnimationHandle | null = null;
  let destroyed = false;

  const onTouchStart = ((e: TouchEvent) => {
    if (destroyed) return;
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
  }) as EventListener;

  const onTouchEnd = ((e: TouchEvent) => {
    if (destroyed) return;
    if (swipeStartX === null || swipeStartY === null) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const deltaX = endX - swipeStartX;
    const deltaY = endY - swipeStartY;

    // Reset touch coordinates
    swipeStartX = null;
    swipeStartY = null;

    // Ensure horizontal swipe is dominant over vertical scrolling
    if (
      Math.abs(deltaX) <= Math.abs(deltaY) ||
      Math.abs(deltaX) < SWIPE_THRESHOLD
    ) {
      return;
    }

    // Direction: swipe right (deltaX > 0) = previous, swipe left = next
    const direction: -1 | 1 = deltaX > 0 ? -1 : 1;
    navigateWithAnimation(direction);
  }) as EventListener;

  function navigateWithAnimation(direction: -1 | 1): void {
    if (isAnimating || destroyed) return;
    isAnimating = true;

    currentAnimation = animateCarousel(container, direction, () => {
      onNavigate(direction);
    });
    currentAnimation.promise.then(() => {
      currentAnimation = null;
      isAnimating = false;
    });
  }

  // Register listeners via host for automatic lifecycle cleanup
  host.addListener(container, "touchstart", onTouchStart);
  host.addListener(container, "touchend", onTouchEnd);

  return {
    cancel() {
      if (currentAnimation) {
        currentAnimation.cancel();
        currentAnimation = null;
        isAnimating = false;
      }
    },
    destroy() {
      destroyed = true;
      this.cancel();
      // Listeners are removed by host's cleanup (disconnectedCallback)
      // but mark state so callbacks become no-ops immediately.
      swipeStartX = null;
      swipeStartY = null;
    },
  };
}
