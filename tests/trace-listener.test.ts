// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TraceListener,
  type TraceMessage,
  type TraceListenerHandler,
  type TraceOptions,
} from "../client/controller/TraceListener.js";

describe("TraceListener", () => {
  let traceListener: TraceListener;
  let captured: TraceMessage[];
  let handler: TraceListenerHandler;

  beforeEach(() => {
    traceListener = new TraceListener();
    captured = [];
    handler = {
      onTrace: (msg: TraceMessage) => {
        captured.push(msg);
      },
    };
    traceListener.addListener(handler);
  });

  describe("convenience methods", () => {
    it("should emit info messages", () => {
      traceListener.info("hello");
      expect(captured.length).toBe(1);
      expect(captured[0].level).toBe("info");
      expect(captured[0].message).toBe("hello");
    });

    it("should emit success messages with title", () => {
      traceListener.success("done", "Great");
      expect(captured[0].level).toBe("success");
      expect(captured[0].title).toBe("Great");
    });

    it("should emit error messages with duration", () => {
      traceListener.error("fail", "Error", 3000);
      expect(captured[0].level).toBe("error");
      expect(captured[0].duration).toBe(3000);
    });

    it("should emit warning messages", () => {
      traceListener.warning("caution");
      expect(captured[0].level).toBe("warning");
    });
  });

  describe("TraceOptions overload", () => {
    it("should accept TraceOptions with autoDismissMs", () => {
      traceListener.info("test", { autoDismissMs: 5000 });
      expect(captured[0].duration).toBe(5000);
    });

    it("should accept TraceOptions with title", () => {
      traceListener.success("done", { title: "Hooray" });
      expect(captured[0].title).toBe("Hooray");
    });

    it("should accept TraceOptions with onDismiss callback", () => {
      const onDismiss = vi.fn();
      traceListener.info("msg", { onDismiss });
      expect(captured[0].onDismiss).toBe(onDismiss);
    });

    it("should pass all TraceOptions fields through", () => {
      const onDismiss = vi.fn();
      traceListener.warning("msg", {
        title: "Warn",
        autoDismissMs: 8000,
        onDismiss,
      });
      expect(captured[0].title).toBe("Warn");
      expect(captured[0].duration).toBe(8000);
      expect(captured[0].onDismiss).toBe(onDismiss);
    });
  });

  describe("listener management", () => {
    it("should broadcast to multiple listeners", () => {
      const second: TraceMessage[] = [];
      traceListener.addListener({
        onTrace: (msg) => second.push(msg),
      });

      traceListener.info("broadcast");
      expect(captured.length).toBe(1);
      expect(second.length).toBe(1);
    });

    it("should stop receiving after removeListener", () => {
      traceListener.removeListener(handler);
      traceListener.info("missed");
      expect(captured.length).toBe(0);
    });

    it("should not break when a listener throws", () => {
      traceListener.addListener({
        onTrace: () => {
          throw new Error("broken");
        },
      });
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Should not throw
      traceListener.info("safe");

      // The working handler still received the message
      expect(captured.length).toBe(1);
      consoleError.mockRestore();
    });
  });
});
