import { describe, it, expect, beforeEach } from "vitest";
import {
  ServiceContainer,
  getServices,
  setServices,
} from "../../client/services/service-container.js";

describe("ServiceContainer", () => {
  it("should expose all domain services", () => {
    const container = new ServiceContainer();
    expect(container.auth).toBeDefined();
    expect(container.pto).toBeDefined();
    expect(container.acknowledgements).toBeDefined();
    expect(container.hours).toBeDefined();
    expect(container.admin).toBeDefined();
    expect(container.employees).toBeDefined();
    expect(container.notifications).toBeDefined();
    expect(container.imports).toBeDefined();
    expect(container.health).toBeDefined();
  });

  it("should accept an optional APIClient via constructor", () => {
    // Construct with default — no error
    const c1 = new ServiceContainer();
    expect(c1.auth).toBeDefined();

    // Construct with explicit undefined — same as default
    const c2 = new ServiceContainer(undefined);
    expect(c2.auth).toBeDefined();
  });
});

describe("getServices / setServices singleton", () => {
  let original: ServiceContainer;

  beforeEach(() => {
    original = getServices();
  });

  it("should return the same instance on repeated calls", () => {
    expect(getServices()).toBe(getServices());
  });

  it("should allow replacing the singleton for testing", () => {
    const custom = new ServiceContainer();
    setServices(custom);
    expect(getServices()).toBe(custom);

    // Restore
    setServices(original);
    expect(getServices()).toBe(original);
  });
});
