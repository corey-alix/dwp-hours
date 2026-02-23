/**
 * Handle returned by animation helpers, allowing the caller to await
 * completion or cancel the animation immediately.
 */
export interface AnimationHandle {
  /** Resolves when the animation completes or is cancelled. */
  promise: Promise<void>;
  /** Cancel the animation immediately, cleaning up all inline styles. */
  cancel: () => void;
}

/**
 * Handle returned by {@link setupSwipeNavigation}, allowing the caller
 * to cancel in-flight animations or tear down touch listeners.
 */
export interface SwipeNavigationHandle {
  /** Cancel any in-flight carousel animation. */
  cancel(): void;
  /** Remove touch listeners and release resources. */
  destroy(): void;
}
