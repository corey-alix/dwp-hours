// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { animationCSS } from "../client/css-extensions/animations/animations.js";
import {
  getAnimationSheet,
  adoptAnimations,
  animateSlide,
  animateCarousel,
  setupSwipeNavigation,
} from "../client/css-extensions/index.js";
import type { ListenerHost } from "../client/css-extensions/index.js";

// ── animationCSS snapshot ──

describe("animationCSS", () => {
  it("contains all expected keyframe names", () => {
    expect(animationCSS).toContain("@keyframes fade-in");
    expect(animationCSS).toContain("@keyframes fade-out");
    expect(animationCSS).toContain("@keyframes slide-in-right");
    expect(animationCSS).toContain("@keyframes slide-in-left");
    expect(animationCSS).toContain("@keyframes slide-out-left");
    expect(animationCSS).toContain("@keyframes slide-out-right");
    expect(animationCSS).toContain("@keyframes slide-down-in");
    expect(animationCSS).toContain("@keyframes slide-up-out");
    expect(animationCSS).toContain("@keyframes pop");
  });

  it("contains all expected utility classes", () => {
    expect(animationCSS).toContain(".anim-fade-in");
    expect(animationCSS).toContain(".anim-slide-in-right");
    expect(animationCSS).toContain(".anim-slide-in-left");
    expect(animationCSS).toContain(".anim-slide-out-left");
    expect(animationCSS).toContain(".anim-slide-out-right");
    expect(animationCSS).toContain(".anim-slide-down-in");
    expect(animationCSS).toContain(".anim-slide-up-out");
    expect(animationCSS).toContain(".anim-pop");
  });

  it("references token vars — no hardcoded durations or easings", () => {
    expect(animationCSS).toContain("var(--duration-normal)");
    expect(animationCSS).toContain("var(--easing-decelerate)");
    expect(animationCSS).toContain("var(--easing-accelerate)");
    expect(animationCSS).toContain("var(--easing-standard)");
    expect(animationCSS).toContain("var(--slide-distance)");
    expect(animationCSS).toContain("var(--slide-offset)");
  });

  it("includes prefers-reduced-motion media query", () => {
    expect(animationCSS).toContain("prefers-reduced-motion: reduce");
    expect(animationCSS).toContain("animation: none");
  });

  it("is under 3 KB", () => {
    expect(new TextEncoder().encode(animationCSS).length).toBeLessThan(3072);
  });
});

// ── Constructable stylesheet singleton ──

describe("getAnimationSheet", () => {
  it("returns a CSSStyleSheet instance", () => {
    const sheet = getAnimationSheet();
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
  });

  it("returns the same singleton on repeated calls", () => {
    const a = getAnimationSheet();
    const b = getAnimationSheet();
    expect(a).toBe(b);
  });
});

// ── adoptAnimations ──

describe("adoptAnimations", () => {
  it("adds the shared sheet to a shadow root's adoptedStyleSheets", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });

    adoptAnimations(shadow);

    const sheet = getAnimationSheet();
    expect(shadow.adoptedStyleSheets).toContain(sheet);
  });

  it("does not duplicate the sheet when called twice", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });

    adoptAnimations(shadow);
    adoptAnimations(shadow);

    const sheet = getAnimationSheet();
    const count = shadow.adoptedStyleSheets.filter((s) => s === sheet).length;
    expect(count).toBe(1);
  });
});

// ── animateSlide ──

describe("animateSlide", () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement("div");
    document.body.appendChild(el);
  });

  it("returns an AnimationHandle with promise and cancel", () => {
    const handle = animateSlide(el, true);
    expect(handle).toHaveProperty("promise");
    expect(handle).toHaveProperty("cancel");
    expect(handle.promise).toBeInstanceOf(Promise);
    expect(typeof handle.cancel).toBe("function");
    handle.cancel();
  });

  it("resolves when cancelled", async () => {
    const handle = animateSlide(el, true);
    handle.cancel();
    await expect(handle.promise).resolves.toBeUndefined();
  });

  it("resolves on show=false when cancelled", async () => {
    const handle = animateSlide(el, false);
    handle.cancel();
    await expect(handle.promise).resolves.toBeUndefined();
  });

  it("cleans up inline styles after cancel", async () => {
    const handle = animateSlide(el, true);
    handle.cancel();
    await handle.promise;
    expect(el.style.willChange).toBe("");
    expect(el.style.transition).toBe("");
    expect(el.style.transform).toBe("");
    expect(el.style.opacity).toBe("");
  });
});

// ── animateCarousel ──

describe("animateCarousel", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("returns an AnimationHandle with promise and cancel", () => {
    const handle = animateCarousel(container, 1, () => {});
    expect(handle).toHaveProperty("promise");
    expect(handle).toHaveProperty("cancel");
    handle.cancel();
  });

  it("calls onUpdate when cancelled", async () => {
    let called = false;
    const handle = animateCarousel(container, 1, () => {
      called = true;
    });
    handle.cancel();
    await handle.promise;
    expect(called).toBe(true);
  });

  it("resolves when cancelled (next direction)", async () => {
    const handle = animateCarousel(container, 1, () => {});
    handle.cancel();
    await expect(handle.promise).resolves.toBeUndefined();
  });

  it("resolves when cancelled (prev direction)", async () => {
    const handle = animateCarousel(container, -1, () => {});
    handle.cancel();
    await expect(handle.promise).resolves.toBeUndefined();
  });

  it("cleans up inline styles after cancel", async () => {
    const handle = animateCarousel(container, 1, () => {});
    handle.cancel();
    await handle.promise;
    expect(container.style.willChange).toBe("");
    expect(container.style.transition).toBe("");
    expect(container.style.transform).toBe("");
    expect(container.style.opacity).toBe("");
  });

  it("calls onUpdate only once even if cancel called twice", async () => {
    let callCount = 0;
    const handle = animateCarousel(container, 1, () => {
      callCount++;
    });
    handle.cancel();
    handle.cancel();
    await handle.promise;
    expect(callCount).toBe(1);
  });
});

// ── setupSwipeNavigation ──

describe("setupSwipeNavigation", () => {
  let container: HTMLElement;
  let host: ListenerHost & {
    _listeners: Array<{ el: EventTarget; ev: string; fn: EventListener }>;
  };
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);

    // Minimal ListenerHost implementation that tracks registered listeners
    const listeners: Array<{ el: EventTarget; ev: string; fn: EventListener }> =
      [];
    host = {
      _listeners: listeners,
      addListener(element: EventTarget, event: string, handler: EventListener) {
        element.addEventListener(event, handler);
        listeners.push({ el: element, ev: event, fn: handler });
      },
    };

    // Mock reduced-motion so animateCarousel calls onUpdate synchronously
    // (happy-dom does not fire transitionend events)
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    })) as typeof window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  /** Helper: dispatch touchstart + touchend on the container via raw events */
  function simulateSwipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ) {
    // Use basic Event + monkey-patched touch arrays for happy-dom compatibility
    const startEvt = new Event("touchstart", { bubbles: true }) as any;
    startEvt.touches = [{ clientX: startX, clientY: startY }];
    container.dispatchEvent(startEvt);

    const endEvt = new Event("touchend", { bubbles: true }) as any;
    endEvt.changedTouches = [{ clientX: endX, clientY: endY }];
    container.dispatchEvent(endEvt);
  }

  it("returns a handle with cancel and destroy methods", () => {
    const handle = setupSwipeNavigation(host, container, () => {});
    expect(typeof handle.cancel).toBe("function");
    expect(typeof handle.destroy).toBe("function");
    handle.destroy();
  });

  it("registers touchstart and touchend listeners via host.addListener", () => {
    setupSwipeNavigation(host, container, () => {});
    const events = host._listeners.map((l) => l.ev);
    expect(events).toContain("touchstart");
    expect(events).toContain("touchend");
  });

  it("calls onNavigate(1) for a leftward swipe (next)", () => {
    let navigatedDirection: number | null = null;
    setupSwipeNavigation(host, container, (dir) => {
      navigatedDirection = dir;
    });

    // Swipe left: start at 200, end at 100 (deltaX = -100, next)
    simulateSwipe(200, 100, 100, 100);
    expect(navigatedDirection).toBe(1);
  });

  it("calls onNavigate(-1) for a rightward swipe (prev)", () => {
    let navigatedDirection: number | null = null;
    setupSwipeNavigation(host, container, (dir) => {
      navigatedDirection = dir;
    });

    // Swipe right: start at 100, end at 200 (deltaX = +100, prev)
    simulateSwipe(100, 100, 200, 100);
    expect(navigatedDirection).toBe(-1);
  });

  it("does NOT navigate when swipe distance is below threshold (50px)", () => {
    let called = false;
    setupSwipeNavigation(host, container, () => {
      called = true;
    });

    // Swipe only 30px — below 50px threshold
    simulateSwipe(100, 100, 130, 100);
    expect(called).toBe(false);
  });

  it("does NOT navigate when vertical swipe dominates", () => {
    let called = false;
    setupSwipeNavigation(host, container, () => {
      called = true;
    });

    // Vertical-dominant swipe: 20px horizontal, 100px vertical
    simulateSwipe(100, 100, 120, 200);
    expect(called).toBe(false);
  });

  it("does NOT navigate after destroy() is called", () => {
    let called = false;
    const handle = setupSwipeNavigation(host, container, () => {
      called = true;
    });

    handle.destroy();

    // Valid swipe that would normally trigger navigation
    simulateSwipe(200, 100, 100, 100);
    expect(called).toBe(false);
  });

  it("cancel() is safe to call when no animation is in-flight", () => {
    const handle = setupSwipeNavigation(host, container, () => {});
    // Should not throw
    expect(() => handle.cancel()).not.toThrow();
    handle.destroy();
  });
});
