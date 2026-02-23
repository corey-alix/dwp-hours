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
