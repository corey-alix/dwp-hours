// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConfirmationController } from "../../client/shared/confirmation-mixin.js";

describe("ConfirmationController", () => {
  let controller: ConfirmationController;
  let btn: HTMLButtonElement;

  beforeEach(() => {
    vi.useFakeTimers();
    controller = new ConfirmationController();
    btn = document.createElement("button");
    btn.textContent = "Delete";
  });

  afterEach(() => {
    controller.clearAll();
    vi.useRealTimers();
  });

  // ── handleClick ──

  it("first click enters confirming state", () => {
    const onConfirm = vi.fn();
    controller.handleClick(btn, onConfirm);

    expect(btn.classList.contains("confirming")).toBe(true);
    expect(btn.textContent).toBe("Confirm Delete?");
    expect(onConfirm).not.toHaveBeenCalled();
    expect(controller.pendingCount).toBe(1);
  });

  it("second click executes onConfirm and clears state", () => {
    const onConfirm = vi.fn();
    controller.handleClick(btn, onConfirm);
    controller.handleClick(btn, onConfirm);

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(btn.classList.contains("confirming")).toBe(false);
    expect(controller.pendingCount).toBe(0);
  });

  it("auto-reverts after 3 seconds", () => {
    const onConfirm = vi.fn();
    controller.handleClick(btn, onConfirm);

    expect(btn.textContent).toBe("Confirm Delete?");

    vi.advanceTimersByTime(3000);

    expect(btn.classList.contains("confirming")).toBe(false);
    expect(btn.textContent).toBe("Delete");
    expect(onConfirm).not.toHaveBeenCalled();
    expect(controller.pendingCount).toBe(0);
  });

  it("supports custom confirm label", () => {
    controller.handleClick(btn, vi.fn(), {
      confirmLabel: "Really delete this?",
    });
    expect(btn.textContent).toBe("Really delete this?");
  });

  it("supports custom timeout", () => {
    const fast = new ConfirmationController(1000);
    fast.handleClick(btn, vi.fn());

    vi.advanceTimersByTime(999);
    expect(btn.classList.contains("confirming")).toBe(true);

    vi.advanceTimersByTime(1);
    expect(btn.classList.contains("confirming")).toBe(false);
    fast.clearAll();
  });

  // ── handleConditionalClick ──

  it("fires immediately when condition is false", () => {
    const onConfirm = vi.fn();
    controller.handleConditionalClick(btn, false, onConfirm);

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(btn.classList.contains("confirming")).toBe(false);
  });

  it("requires two clicks when condition is true", () => {
    const onConfirm = vi.fn();
    controller.handleConditionalClick(btn, true, onConfirm);
    expect(onConfirm).not.toHaveBeenCalled();

    controller.handleConditionalClick(btn, true, onConfirm);
    // Second call goes through handleClick which sees "confirming" class
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  // ── isConfirming ──

  it("reports confirming state", () => {
    expect(controller.isConfirming(btn)).toBe(false);
    controller.handleClick(btn, vi.fn());
    expect(controller.isConfirming(btn)).toBe(true);
  });

  // ── clear / clearAll ──

  it("clear() resets a single button", () => {
    controller.handleClick(btn, vi.fn());
    controller.clear(btn);

    expect(btn.classList.contains("confirming")).toBe(false);
    expect(controller.pendingCount).toBe(0);
  });

  it("clearAll() resets all pending buttons", () => {
    const btn2 = document.createElement("button");
    btn2.textContent = "Remove";

    controller.handleClick(btn, vi.fn());
    controller.handleClick(btn2, vi.fn());
    expect(controller.pendingCount).toBe(2);

    controller.clearAll();
    expect(controller.pendingCount).toBe(0);
    expect(btn.classList.contains("confirming")).toBe(false);
    expect(btn2.classList.contains("confirming")).toBe(false);
  });

  // ── multiple buttons ──

  it("tracks multiple buttons independently", () => {
    const btn2 = document.createElement("button");
    btn2.textContent = "Archive";

    const onDelete = vi.fn();
    const onArchive = vi.fn();

    controller.handleClick(btn, onDelete);
    controller.handleClick(btn2, onArchive);

    // Confirm only the first
    controller.handleClick(btn, onDelete);
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onArchive).not.toHaveBeenCalled();
    expect(controller.pendingCount).toBe(1);

    // Second auto-reverts
    vi.advanceTimersByTime(3000);
    expect(controller.pendingCount).toBe(0);
  });
});
