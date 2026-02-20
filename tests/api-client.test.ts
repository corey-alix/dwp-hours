import { describe, it, expect, beforeEach, vi } from "vitest";
import { APIClient } from "../client/APIClient.js";
import {
  VALIDATION_MESSAGES,
  SUCCESS_MESSAGES,
} from "../shared/businessRules.js";

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("APIClient", () => {
  let apiClient: APIClient;

  beforeEach(() => {
    apiClient = new APIClient();
    vi.clearAllMocks();
  });

  describe("get", () => {
    it("should make a GET request to the correct endpoint", async () => {
      const mockResponse = { data: "test" };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.get("/test-endpoint");

      expect(fetchMock).toHaveBeenCalledWith("/api/test-endpoint", {
        credentials: "include",
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("post", () => {
    it("should make a POST request with correct headers and body", async () => {
      const mockResponse = { success: true };
      const requestData = { key: "value" };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.post("/test-endpoint", requestData);

      expect(fetchMock).toHaveBeenCalledWith("/api/test-endpoint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        credentials: "include",
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("createPTOEntry", () => {
    it("should create a single PTO entry", async () => {
      const mockResponse = {
        message: SUCCESS_MESSAGES["pto.created"],
        ptoEntry: {
          id: 1,
          employeeId: 1,
          date: "2026-03-06",
          type: "PTO",
          hours: 4,
        },
        ptoEntries: [
          { id: 1, employeeId: 1, date: "2026-03-06", type: "PTO", hours: 4 },
        ],
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const request = {
        employeeId: 1,
        date: "2026-03-06",
        hours: 4,
        type: "PTO",
      };
      const result = await apiClient.createPTOEntry(request);

      expect(fetchMock).toHaveBeenCalledWith("/api/pto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        credentials: "include",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should create multiple PTO entries", async () => {
      const mockResponse = {
        message: SUCCESS_MESSAGES["pto.created"],
        ptoEntry: {
          id: 2,
          employeeId: 1,
          date: "2026-03-07",
          type: "PTO",
          hours: 8,
        },
        ptoEntries: [
          { id: 1, employeeId: 1, date: "2026-03-06", type: "PTO", hours: 4 },
          { id: 2, employeeId: 1, date: "2026-03-07", type: "PTO", hours: 8 },
        ],
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const requests = [
        { employeeId: 1, date: "2026-03-06", hours: 4, type: "PTO" },
        { employeeId: 1, date: "2026-03-07", hours: 8, type: "PTO" },
      ];
      const result = await apiClient.createPTOEntry({ requests });

      expect(fetchMock).toHaveBeenCalledWith("/api/pto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
        credentials: "include",
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getPTOStatus", () => {
    it("should get PTO status for an employee", async () => {
      const mockResponse = {
        availablePTO: 108,
        usedPTO: 28,
        monthlyBreakdown: [],
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.getPTOStatus();

      expect(fetchMock).toHaveBeenCalledWith("/api/pto/status", {
        credentials: "include",
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getPTOEntries", () => {
    it("should get PTO entries for the authenticated user", async () => {
      const mockResponse = [
        { date: "2026-03-06", type: "PTO", hours: 4 },
        { date: "2026-03-07", type: "PTO", hours: 8 },
      ];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.getPTOEntries();

      expect(fetchMock).toHaveBeenCalledWith("/api/pto", {
        credentials: "include",
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("requestAuthLink", () => {
    it("should request authentication link", async () => {
      const mockResponse = {
        message: SUCCESS_MESSAGES["auth.link_sent"],
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.requestAuthLink("test@example.com");

      expect(fetchMock).toHaveBeenCalledWith("/api/auth/request-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: "test@example.com" }),
        credentials: "include",
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("validateAuth", () => {
    it("should validate authentication token", async () => {
      const mockResponse = {
        publicHash: "hash123",
        employee: { id: 1, name: "John Doe", role: "Employee" },
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.validateAuth("token123");

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/validate?token=token123",
        {
          credentials: "include",
        },
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("health", () => {
    it("should check API health", async () => {
      const mockResponse = {
        status: "healthy",
        timestamp: "2026-02-06T12:00:00.000Z",
        uptime: 3600,
        version: "1.0.0",
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.health();

      expect(fetchMock).toHaveBeenCalledWith("/api/health", {
        credentials: "include",
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
