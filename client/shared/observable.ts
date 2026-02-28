/**
 * Generic Observable<T> — a domain-agnostic reactive value container.
 *
 * Follows the BehaviorSubject pattern: `subscribe()` delivers the current
 * value immediately, then fires on every subsequent `set()` that produces
 * a different value (per the `equals` function).
 *
 * Designed for use by plain TypeScript model classes (not web components).
 */

/** Callback signature for observable subscribers. */
export type Subscriber<T> = (value: T) => void;

/** Function returned by `subscribe()` — call it to unsubscribe. */
export type Unsubscribe = () => void;

/** Minimal read-only observable interface for consumers. */
export interface ObservableLike<T> {
  get(): T;
  subscribe(observer: Subscriber<T>): Unsubscribe;
}

/**
 * Abstract base class for observable values.
 *
 * @param initialValue - The starting value.
 * @param equals - Optional equality check (default `Object.is`).
 *   Supply a structural comparator for reference types like `Set`, `Map`,
 *   or arrays to avoid spurious notifications.
 */
export abstract class Observable<T> implements ObservableLike<T> {
  private _value: T;
  private readonly _equals: (a: T, b: T) => boolean;
  private _subscribers = new Set<Subscriber<T>>();
  private _disposed = false;

  /** When > 0, notifications are suppressed (inside a `batch()` call). */
  private _batchDepth = 0;
  /** Tracks whether a `set()` changed the value during a batch. */
  private _batchDirty = false;
  /** Snapshot of value before the outermost batch began. */
  private _batchStartValue: T | undefined;

  constructor(initialValue: T, equals?: (a: T, b: T) => boolean) {
    this._value = initialValue;
    this._equals = equals ?? Object.is;
  }

  /** Return the current value. */
  get(): T {
    return this._value;
  }

  /**
   * Update the value. If the new value is equal to the current value
   * (per the `equals` function), subscribers are not notified.
   */
  set(newValue: T): void {
    if (this._equals(this._value, newValue)) return;

    this._value = newValue;

    if (this._batchDepth > 0) {
      this._batchDirty = true;
      return;
    }

    this.notify();
  }

  /**
   * Subscribe to value changes. The observer is called immediately with
   * the current value (BehaviorSubject pattern), then on every subsequent
   * change.
   *
   * @returns An unsubscribe function.
   * @throws If the observable has been disposed.
   */
  subscribe(observer: Subscriber<T>): Unsubscribe {
    if (this._disposed) {
      throw new Error("Cannot subscribe to a disposed Observable");
    }

    this._subscribers.add(observer);

    // Eager push — deliver current value immediately
    observer(this._value);

    return () => {
      this._subscribers.delete(observer);
    };
  }

  /**
   * Subscribe for a single delivery only. The observer is called once
   * (immediately with the current value) and then auto-unsubscribed.
   */
  subscribeOnce(observer: Subscriber<T>): Unsubscribe {
    let unsub: Unsubscribe | undefined;
    unsub = this.subscribe((value) => {
      if (unsub) unsub();
      observer(value);
    });
    // The eager push already fired inside subscribe(), so unsubscribe now
    // in case the callback didn't have access to `unsub` yet.
    unsub();
    return unsub;
  }

  /**
   * Execute `fn` while suppressing notifications. After `fn` completes,
   * if the value changed during the batch, a single notification is sent.
   *
   * Batches may be nested; only the outermost batch triggers the notify.
   */
  batch(fn: () => void): void {
    if (this._batchDepth === 0) {
      this._batchStartValue = this._value;
      this._batchDirty = false;
    }

    this._batchDepth++;
    try {
      fn();
    } finally {
      this._batchDepth--;

      if (this._batchDepth === 0 && this._batchDirty) {
        this._batchDirty = false;
        this._batchStartValue = undefined;
        this.notify();
      } else if (this._batchDepth === 0) {
        this._batchStartValue = undefined;
      }
    }
  }

  /**
   * Clear all subscribers and mark as disposed. Subsequent `subscribe()`
   * calls will throw. Prevents memory leaks in long-lived SPA sessions.
   */
  dispose(): void {
    this._subscribers.clear();
    this._disposed = true;
  }

  /** Whether this observable has been disposed. */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /** Number of active subscribers. Useful for leak-detection tests. */
  get subscriberCount(): number {
    return this._subscribers.size;
  }

  /**
   * Notify all subscribers with the current value.
   * Snapshots the subscriber set before iteration so that unsubscribing
   * during notification does not break the iteration.
   */
  protected notify(): void {
    const snapshot = [...this._subscribers];
    for (const subscriber of snapshot) {
      subscriber(this._value);
    }
  }
}
