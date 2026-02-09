import { describe, it, expect } from "vitest";
import { computePixelDiff } from "../e2e/screenshot-utils";

describe("computePixelDiff", () => {
  it("returns 0 for identical buffers", () => {
    const data = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]); // 2 pixels: red, green
    expect(computePixelDiff(data, data)).toBe(0);
  });

  it("counts pixels with differences above threshold", () => {
    const data1 = new Uint8Array([255, 0, 0, 255]); // red pixel
    const data2 = new Uint8Array([230, 0, 0, 255]); // slightly different red (25 diff in R)
    expect(computePixelDiff(data1, data2, 20)).toBe(1); // above 20
    expect(computePixelDiff(data1, data2, 30)).toBe(0); // below 30
  });

  it("handles multiple channels", () => {
    const data1 = new Uint8Array([255, 255, 255, 255]); // white
    const data2 = new Uint8Array([255, 240, 255, 255]); // diff 15 in G
    expect(computePixelDiff(data1, data2, 10)).toBe(1);
  });

  it("throws on mismatched lengths", () => {
    const data1 = new Uint8Array([255, 0, 0, 255]);
    const data2 = new Uint8Array([255, 0, 0, 255, 0, 0, 0, 0]);
    expect(() => computePixelDiff(data1, data2)).toThrow(
      "Buffers must be same length",
    );
  });
});
