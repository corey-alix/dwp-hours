// @vitest-environment happy-dom

import { describe, it, expect } from "vitest";
import {
  aggregatePTORequests,
  type PTORequest,
} from "../client/shared/aggregate-pto-requests.js";

function makeRequest(overrides: Partial<PTORequest> = {}): PTORequest {
  return {
    id: 1,
    employeeId: 10,
    employeeName: "Jane Doe",
    startDate: "2026-02-23",
    endDate: "2026-02-23",
    type: "PTO",
    hours: 8,
    status: "pending",
    createdAt: "2026-02-20T10:00:00Z",
    ...overrides,
  };
}

describe("aggregatePTORequests", () => {
  it("should return empty array for empty input", () => {
    expect(aggregatePTORequests([])).toEqual([]);
  });

  it("should return a single entry for a single request", () => {
    const result = aggregatePTORequests([makeRequest({ id: 1 })]);
    expect(result).toHaveLength(1);
    expect(result[0].requestIds).toEqual([1]);
    expect(result[0].hours).toBe(8);
    expect(result[0].startDate).toBe("2026-02-23");
    expect(result[0].endDate).toBe("2026-02-23");
  });

  it("should aggregate consecutive work days (Mon–Fri)", () => {
    // 2026-02-23 = Monday, 2026-02-27 = Friday
    const requests = [
      makeRequest({ id: 1, startDate: "2026-02-23", endDate: "2026-02-23" }),
      makeRequest({ id: 2, startDate: "2026-02-24", endDate: "2026-02-24" }),
      makeRequest({ id: 3, startDate: "2026-02-25", endDate: "2026-02-25" }),
      makeRequest({ id: 4, startDate: "2026-02-26", endDate: "2026-02-26" }),
      makeRequest({ id: 5, startDate: "2026-02-27", endDate: "2026-02-27" }),
    ];

    const result = aggregatePTORequests(requests);
    expect(result).toHaveLength(1);
    expect(result[0].requestIds).toEqual([1, 2, 3, 4, 5]);
    expect(result[0].startDate).toBe("2026-02-23");
    expect(result[0].endDate).toBe("2026-02-27");
    expect(result[0].hours).toBe(40);
  });

  it("should aggregate across a weekend (Fri → Mon)", () => {
    // 2026-02-27 = Friday, 2026-03-02 = Monday
    const requests = [
      makeRequest({ id: 1, startDate: "2026-02-27", endDate: "2026-02-27" }),
      makeRequest({ id: 2, startDate: "2026-03-02", endDate: "2026-03-02" }),
    ];

    const result = aggregatePTORequests(requests);
    expect(result).toHaveLength(1);
    expect(result[0].requestIds).toEqual([1, 2]);
    expect(result[0].startDate).toBe("2026-02-27");
    expect(result[0].endDate).toBe("2026-03-02");
    expect(result[0].hours).toBe(16);
  });

  it("should NOT aggregate non-consecutive work days", () => {
    // 2026-02-23 = Monday, 2026-02-25 = Wednesday (gap on Tuesday)
    const requests = [
      makeRequest({ id: 1, startDate: "2026-02-23", endDate: "2026-02-23" }),
      makeRequest({ id: 2, startDate: "2026-02-25", endDate: "2026-02-25" }),
    ];

    const result = aggregatePTORequests(requests);
    expect(result).toHaveLength(2);
    expect(result[0].requestIds).toEqual([1]);
    expect(result[1].requestIds).toEqual([2]);
  });

  it("should NOT aggregate different PTO types for the same employee", () => {
    const requests = [
      makeRequest({
        id: 1,
        startDate: "2026-02-23",
        endDate: "2026-02-23",
        type: "PTO",
      }),
      makeRequest({
        id: 2,
        startDate: "2026-02-24",
        endDate: "2026-02-24",
        type: "Sick",
      }),
    ];

    const result = aggregatePTORequests(requests);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("PTO");
    expect(result[1].type).toBe("Sick");
  });

  it("should NOT aggregate requests from different employees", () => {
    const requests = [
      makeRequest({
        id: 1,
        employeeId: 10,
        startDate: "2026-02-23",
        endDate: "2026-02-23",
      }),
      makeRequest({
        id: 2,
        employeeId: 20,
        startDate: "2026-02-24",
        endDate: "2026-02-24",
      }),
    ];

    const result = aggregatePTORequests(requests);
    expect(result).toHaveLength(2);
    expect(result[0].employeeId).toBe(10);
    expect(result[1].employeeId).toBe(20);
  });

  it("should handle a full week spanning a weekend (Mon-Fri + Mon)", () => {
    // 2026-02-23 Mon through 2026-02-27 Fri, then 2026-03-02 Mon
    const requests = [
      makeRequest({ id: 1, startDate: "2026-02-23", endDate: "2026-02-23" }),
      makeRequest({ id: 2, startDate: "2026-02-24", endDate: "2026-02-24" }),
      makeRequest({ id: 3, startDate: "2026-02-25", endDate: "2026-02-25" }),
      makeRequest({ id: 4, startDate: "2026-02-26", endDate: "2026-02-26" }),
      makeRequest({ id: 5, startDate: "2026-02-27", endDate: "2026-02-27" }),
      makeRequest({ id: 6, startDate: "2026-03-02", endDate: "2026-03-02" }),
    ];

    const result = aggregatePTORequests(requests);
    expect(result).toHaveLength(1);
    expect(result[0].requestIds).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result[0].startDate).toBe("2026-02-23");
    expect(result[0].endDate).toBe("2026-03-02");
    expect(result[0].hours).toBe(48);
  });

  it("should preserve the earliest createdAt in a group", () => {
    const requests = [
      makeRequest({
        id: 1,
        startDate: "2026-02-23",
        endDate: "2026-02-23",
        createdAt: "2026-02-20T14:00:00Z",
      }),
      makeRequest({
        id: 2,
        startDate: "2026-02-24",
        endDate: "2026-02-24",
        createdAt: "2026-02-20T10:00:00Z",
      }),
    ];

    const result = aggregatePTORequests(requests);
    expect(result).toHaveLength(1);
    expect(result[0].createdAt).toBe("2026-02-20T10:00:00Z");
  });

  it("should handle interleaved requests from multiple employees correctly", () => {
    const requests = [
      makeRequest({
        id: 1,
        employeeId: 10,
        employeeName: "Alice",
        startDate: "2026-02-23",
        endDate: "2026-02-23",
      }),
      makeRequest({
        id: 2,
        employeeId: 20,
        employeeName: "Bob",
        startDate: "2026-02-23",
        endDate: "2026-02-23",
      }),
      makeRequest({
        id: 3,
        employeeId: 10,
        employeeName: "Alice",
        startDate: "2026-02-24",
        endDate: "2026-02-24",
      }),
      makeRequest({
        id: 4,
        employeeId: 20,
        employeeName: "Bob",
        startDate: "2026-02-24",
        endDate: "2026-02-24",
      }),
    ];

    const result = aggregatePTORequests(requests);
    // Should aggregate per employee: Alice (1,3) and Bob (2,4)
    expect(result).toHaveLength(2);

    const alice = result.find((r) => r.employeeId === 10);
    const bob = result.find((r) => r.employeeId === 20);

    expect(alice?.requestIds).toEqual([1, 3]);
    expect(alice?.hours).toBe(16);

    expect(bob?.requestIds).toEqual([2, 4]);
    expect(bob?.hours).toBe(16);
  });

  it("should handle same employee with different types on consecutive days", () => {
    // Mon=PTO, Tue=Sick, Wed=PTO — should NOT merge across the Sick gap
    const requests = [
      makeRequest({
        id: 1,
        startDate: "2026-02-23",
        endDate: "2026-02-23",
        type: "PTO",
      }),
      makeRequest({
        id: 2,
        startDate: "2026-02-24",
        endDate: "2026-02-24",
        type: "Sick",
      }),
      makeRequest({
        id: 3,
        startDate: "2026-02-25",
        endDate: "2026-02-25",
        type: "PTO",
      }),
    ];

    const result = aggregatePTORequests(requests);
    expect(result).toHaveLength(3);
  });

  it("should sum hours correctly for requests with different daily hours", () => {
    const requests = [
      makeRequest({
        id: 1,
        startDate: "2026-02-23",
        endDate: "2026-02-23",
        hours: 4,
      }),
      makeRequest({
        id: 2,
        startDate: "2026-02-24",
        endDate: "2026-02-24",
        hours: 8,
      }),
      makeRequest({
        id: 3,
        startDate: "2026-02-25",
        endDate: "2026-02-25",
        hours: 6,
      }),
    ];

    const result = aggregatePTORequests(requests);
    expect(result).toHaveLength(1);
    expect(result[0].hours).toBe(18);
  });

  it("should handle unsorted input correctly", () => {
    // Provide requests out of date order
    const requests = [
      makeRequest({ id: 3, startDate: "2026-02-25", endDate: "2026-02-25" }),
      makeRequest({ id: 1, startDate: "2026-02-23", endDate: "2026-02-23" }),
      makeRequest({ id: 2, startDate: "2026-02-24", endDate: "2026-02-24" }),
    ];

    const result = aggregatePTORequests(requests);
    expect(result).toHaveLength(1);
    expect(result[0].requestIds).toEqual([1, 2, 3]);
    expect(result[0].startDate).toBe("2026-02-23");
    expect(result[0].endDate).toBe("2026-02-25");
  });
});
