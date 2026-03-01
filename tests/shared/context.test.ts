// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  ContextProvider,
  consumeContext,
  createContextProvider,
} from "../../client/shared/context.js";

describe("Context Protocol", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe("ContextProvider", () => {
    it("delivers initial value to a consumer synchronously", () => {
      const provider = createContextProvider("test-key", 42);
      container.appendChild(provider);

      const child = document.createElement("div");
      provider.appendChild(child);

      const cb = vi.fn();
      consumeContext<number>(child, "test-key", cb);

      expect(cb).toHaveBeenCalledOnce();
      expect(cb).toHaveBeenCalledWith(42);
    });

    it("ignores context requests with a different key", () => {
      const provider = createContextProvider("key-a", "hello");
      container.appendChild(provider);

      const child = document.createElement("div");
      provider.appendChild(child);

      const cb = vi.fn();
      consumeContext<string>(child, "key-b", cb);

      expect(cb).not.toHaveBeenCalled();
    });

    it("notifies registered consumers when value changes", () => {
      const provider = createContextProvider("svc", "initial");
      container.appendChild(provider);

      const child = document.createElement("div");
      provider.appendChild(child);

      const cb = vi.fn();
      consumeContext<string>(child, "svc", cb);

      // Initial delivery
      expect(cb).toHaveBeenCalledWith("initial");

      // Update
      provider.value = "updated";
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenLastCalledWith("updated");
    });

    it("supports multiple consumers", () => {
      const provider = createContextProvider("multi", 1);
      container.appendChild(provider);

      const child1 = document.createElement("div");
      const child2 = document.createElement("div");
      provider.appendChild(child1);
      provider.appendChild(child2);

      const cb1 = vi.fn();
      const cb2 = vi.fn();
      consumeContext<number>(child1, "multi", cb1);
      consumeContext<number>(child2, "multi", cb2);

      expect(cb1).toHaveBeenCalledWith(1);
      expect(cb2).toHaveBeenCalledWith(1);

      provider.value = 99;
      expect(cb1).toHaveBeenLastCalledWith(99);
      expect(cb2).toHaveBeenLastCalledWith(99);
    });

    it("stops propagation so outer providers don't also respond", () => {
      const outer = createContextProvider("layer", "outer");
      const inner = createContextProvider("layer", "inner");
      container.appendChild(outer);
      outer.appendChild(inner);

      const child = document.createElement("div");
      inner.appendChild(child);

      const cb = vi.fn();
      consumeContext<string>(child, "layer", cb);

      // Should get inner, not outer
      expect(cb).toHaveBeenCalledOnce();
      expect(cb).toHaveBeenCalledWith("inner");
    });

    it("exposes value via getter", () => {
      const provider = createContextProvider("val", "hello");
      expect(provider.value).toBe("hello");

      provider.value = "world";
      expect(provider.value).toBe("world");
    });

    it("removeConsumer prevents further notifications", () => {
      const provider = createContextProvider("rm", 0);
      container.appendChild(provider);

      const child = document.createElement("div");
      provider.appendChild(child);

      const cb = vi.fn();
      consumeContext<number>(child, "rm", cb);
      expect(cb).toHaveBeenCalledOnce();

      provider.removeConsumer(cb);
      provider.value = 5;

      // Should NOT have been called again after removal
      expect(cb).toHaveBeenCalledOnce();
    });
  });

  describe("consumeContext", () => {
    it("does not call callback when no provider exists", () => {
      const orphan = document.createElement("div");
      container.appendChild(orphan);

      const cb = vi.fn();
      consumeContext<string>(orphan, "missing", cb);

      expect(cb).not.toHaveBeenCalled();
    });

    it("works through shadow DOM boundaries (composed: true)", () => {
      const provider = createContextProvider("shadow", "found");
      container.appendChild(provider);

      // Create a host with shadow DOM
      const host = document.createElement("div");
      provider.appendChild(host);
      const shadow = host.attachShadow({ mode: "open" });
      const innerChild = document.createElement("span");
      shadow.appendChild(innerChild);

      const cb = vi.fn();
      consumeContext<string>(innerChild, "shadow", cb);

      expect(cb).toHaveBeenCalledWith("found");
    });
  });

  describe("createContextProvider", () => {
    it("returns a ContextProvider instance", () => {
      const provider = createContextProvider("factory", "test");
      expect(provider).toBeInstanceOf(ContextProvider);
      expect(provider.value).toBe("test");
    });
  });
});
