// @vitest-environment happy-dom

import { describe, it, expect, beforeEach } from "vitest";
import { animationCSS } from "../client/animations/animations.js";
import {
  getAnimationSheet,
  adoptAnimations,
  animateSlide,
  animateCarousel,
} from "../client/animations/index.js";

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
