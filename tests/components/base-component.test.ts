// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BaseComponent } from "../../client/components/base-component.js";

/** Minimal concrete subclass for testing BaseComponent lifecycle. */
class TestComponent extends BaseComponent {
  renderCount = 0;

  protected render(): string | undefined {
    this.renderCount++;
    return `<div id="content">rendered</div>`;
  }
}

// Register the custom element once
if (!customElements.get("test-base-component")) {
  customElements.define("test-base-component", TestComponent);
}

describe("BaseComponent addCleanup()", () => {
  let element: TestComponent;

  beforeEach(() => {
    element = new TestComponent();
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it("runs cleanup functions on disconnectedCallback", () => {
    const spy = vi.fn();
    // Access protected method via bracket notation
    (element as unknown as { addCleanup: (fn: () => void) => void }).addCleanup(
      spy,
    );

    expect(spy).not.toHaveBeenCalled();

    element.remove(); // triggers disconnectedCallback
    expect(spy).toHaveBeenCalledOnce();
  });

  it("runs multiple cleanup functions in order", () => {
    const order: number[] = [];
    const access = element as unknown as {
      addCleanup: (fn: () => void) => void;
    };
    access.addCleanup(() => order.push(1));
    access.addCleanup(() => order.push(2));
    access.addCleanup(() => order.push(3));

    element.remove();
    expect(order).toEqual([1, 2, 3]);
  });

  it("clears cleanup array after running (no double-run)", () => {
    const spy = vi.fn();
    (element as unknown as { addCleanup: (fn: () => void) => void }).addCleanup(
      spy,
    );

    element.remove();
    expect(spy).toHaveBeenCalledOnce();

    // Re-attach and remove again — spy should NOT be called again
    document.body.appendChild(element);
    element.remove();
    expect(spy).toHaveBeenCalledOnce();
  });

  it("addListener registers a listener and cleans it up on disconnect", () => {
    const handler = vi.fn();
    const target = new EventTarget();

    (
      element as unknown as {
        addListener: (el: EventTarget, ev: string, h: EventListener) => void;
      }
    ).addListener(target, "test-event", handler as EventListener);

    // Listener should work
    target.dispatchEvent(new Event("test-event"));
    expect(handler).toHaveBeenCalledOnce();

    // After disconnect, listener should be removed
    element.remove();
    handler.mockClear();
    target.dispatchEvent(new Event("test-event"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("cleanupEventListeners runs all cleanups (used by renderTemplate)", () => {
    const spy = vi.fn();
    (element as unknown as { addCleanup: (fn: () => void) => void }).addCleanup(
      spy,
    );

    // Trigger a re-render which calls cleanupEventListeners internally
    (element as unknown as { requestUpdate: () => void }).requestUpdate();

    expect(spy).toHaveBeenCalledOnce();
  });
});

describe("BaseComponent resolveAction()", () => {
  /** Subclass that exposes resolveAction and records clicks. */
  class ActionTestComponent extends BaseComponent {
    lastAction: { action: string; target: HTMLElement } | null = null;

    protected render(): string | undefined {
      return `
        <div>
          <button data-action="approve" data-id="42">Approve</button>
          <span class="icon" data-action="delete">X</span>
          <button>No Action</button>
          <div data-action="parent"><span class="child">Nested</span></div>
        </div>
      `;
    }

    protected handleDelegatedClick(e: Event): void {
      this.lastAction = this.resolveAction(e);
    }
  }

  if (!customElements.get("action-test-component")) {
    customElements.define("action-test-component", ActionTestComponent);
  }

  let el: ActionTestComponent;

  beforeEach(() => {
    el = new ActionTestComponent();
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it("returns action and target for a data-action element", () => {
    const btn = el.shadowRoot.querySelector<HTMLElement>(
      "[data-action='approve']",
    )!;
    btn.click();
    expect(el.lastAction).toEqual({ action: "approve", target: btn });
  });

  it("returns null for elements without data-action", () => {
    const btn = el.shadowRoot.querySelector<HTMLElement>(
      "button:not([data-action])",
    )!;
    btn.click();
    expect(el.lastAction).toBeNull();
  });

  it("resolves data-action from ancestor (closest)", () => {
    const nested = el.shadowRoot.querySelector<HTMLElement>(".child")!;
    nested.click();
    const parent = el.shadowRoot.querySelector<HTMLElement>(
      "[data-action='parent']",
    )!;
    expect(el.lastAction).toEqual({ action: "parent", target: parent });
  });
});
