/**
 * Lightweight Context Protocol for vanilla web components.
 *
 * Follows the community-standard pattern (adopted by Lit, wc-context, etc.)
 * where consumers dispatch a bubbling event that providers intercept.
 *
 * Usage:
 *   // Provider — wrap an app subtree
 *   const provider = createContextProvider("my-ctx", myService);
 *   parentElement.insertBefore(provider, childTree);
 *   provider.appendChild(childTree);
 *
 *   // Consumer — call in connectedCallback
 *   consumeContext<MyService>(this, "my-ctx", (svc) => {
 *     this.myService = svc;
 *   });
 */

const CONTEXT_REQUEST = "context-request";

/** Callback invoked when a context value is provided. */
export type ContextCallback<T> = (value: T) => void;

/** Detail payload for the context-request custom event. */
interface ContextRequestDetail<T> {
  key: string;
  callback: ContextCallback<T>;
}

/**
 * Context provider — an HTMLElement that intercepts `context-request`
 * events from descendants and delivers the held value.
 *
 * Must live in the DOM tree so that `bubbles: true, composed: true`
 * events dispatched by consumers reach it.
 */
export class ContextProvider<T> extends HTMLElement {
  #value: T;
  #key: string;
  #consumers = new Set<ContextCallback<T>>();

  constructor(key: string, initial: T) {
    super();
    this.#key = key;
    this.#value = initial;

    this.addEventListener(CONTEXT_REQUEST, ((e: Event) => {
      const detail = (e as CustomEvent<ContextRequestDetail<T>>).detail;
      if (!detail || detail.key !== this.#key) return;

      e.stopPropagation();
      this.#consumers.add(detail.callback);
      detail.callback(this.#value);
    }) as EventListener);
  }

  /** Update the held value and notify all registered consumers. */
  set value(v: T) {
    this.#value = v;
    this.#consumers.forEach((cb) => cb(v));
  }

  get value(): T {
    return this.#value;
  }

  /** Unregister a consumer (e.g. when the consumer disconnects). */
  removeConsumer(cb: ContextCallback<T>): void {
    this.#consumers.delete(cb);
  }
}

// Register as a valid custom element (no-op if already defined)
if (!customElements.get("context-provider")) {
  customElements.define("context-provider", ContextProvider);
}

/**
 * Request a context value from the nearest ancestor provider.
 *
 * Call from `connectedCallback()`. The callback fires synchronously
 * if a provider is already in the DOM above this element.
 *
 * @param element  The consuming element (must be connected to the DOM).
 * @param key      Context key — must match the provider's key.
 * @param callback Receives the context value.
 */
export function consumeContext<T>(
  element: Element,
  key: string,
  callback: ContextCallback<T>,
): void {
  element.dispatchEvent(
    new CustomEvent<ContextRequestDetail<T>>(CONTEXT_REQUEST, {
      bubbles: true,
      composed: true,
      detail: { key, callback },
    }),
  );
}

/**
 * Convenience factory — creates a typed ContextProvider element.
 *
 * @param key     Context key string.
 * @param value   The initial value to provide.
 * @returns       A ContextProvider element ready to insert into the DOM.
 */
export function createContextProvider<T>(
  key: string,
  value: T,
): ContextProvider<T> {
  return new ContextProvider<T>(key, value);
}

/** Well-known context keys used in this application. */
export const CONTEXT_KEYS = {
  NOTIFICATIONS: "notifications",
  DEBUG: "debug",
} as const;
