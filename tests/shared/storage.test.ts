import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryStorage,
  type StorageService,
} from "../../client/shared/storage.js";

describe("InMemoryStorage", () => {
  let storage: StorageService;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  it("returns null for missing keys", () => {
    expect(storage.getItem("nope")).toBeNull();
  });

  it("stores and retrieves a value", () => {
    storage.setItem("key", "value");
    expect(storage.getItem("key")).toBe("value");
  });

  it("overwrites existing values", () => {
    storage.setItem("key", "first");
    storage.setItem("key", "second");
    expect(storage.getItem("key")).toBe("second");
  });

  it("removes a key", () => {
    storage.setItem("key", "value");
    storage.removeItem("key");
    expect(storage.getItem("key")).toBeNull();
  });

  it("removeItem on missing key is a no-op", () => {
    expect(() => storage.removeItem("missing")).not.toThrow();
  });

  it("isolates instances from each other", () => {
    const other = new InMemoryStorage();
    storage.setItem("key", "a");
    other.setItem("key", "b");
    expect(storage.getItem("key")).toBe("a");
    expect(other.getItem("key")).toBe("b");
  });
});
