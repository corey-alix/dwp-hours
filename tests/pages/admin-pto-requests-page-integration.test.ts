// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AdminPtoRequestsPage } from "../../client/pages/admin-pto-requests-page/index.js";

/**
 * Integration tests for AdminPtoRequestsPage event reactions.
 * Verifies that request-approve, request-reject, and calendar-data-request
 * events from <pto-request-queue> trigger the correct API calls.
 */
describe("AdminPtoRequestsPage — Event Integration", () => {
  let page: AdminPtoRequestsPage;
  let container: HTMLElement;
  let mockApi: Record<string, ReturnType<typeof vi.fn>>;
  let mockAuthService: { getUser: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    page = new AdminPtoRequestsPage();
    container.appendChild(page);

    // Inject mock auth service
    mockAuthService = {
      getUser: vi.fn().mockReturnValue({ id: 100, name: "Admin" }),
    };
    page.authService = mockAuthService as any;

    // Mock API
    mockApi = {
      approvePTOEntry: vi.fn().mockResolvedValue({ message: "Approved" }),
      rejectPTOEntry: vi.fn().mockResolvedValue({ message: "Rejected" }),
      getAdminPTOEntries: vi.fn().mockResolvedValue([]),
      getAdminAcknowledgements: vi
        .fn()
        .mockResolvedValue({ acknowledgements: [] }),
      getEmployees: vi.fn().mockResolvedValue([]),
    };
    (page as any).api = mockApi;
  });

  afterEach(() => {
    container.remove();
  });

  describe("request-approve event", () => {
    it("should call api.approvePTOEntry for each request ID", async () => {
      (page as any).requestUpdate();

      const queue = page.shadowRoot?.querySelector(
        "pto-request-queue",
      ) as HTMLElement;
      expect(queue).toBeTruthy();

      // Stub dismissCard to resolve immediately (avoids animation)
      (queue as any).dismissCard = vi.fn().mockResolvedValue(undefined);

      queue.dispatchEvent(
        new CustomEvent("request-approve", {
          detail: { requestIds: [10, 11, 12] },
          bubbles: true,
          composed: true,
        }),
      );

      await vi.waitFor(() => {
        expect(mockApi.approvePTOEntry).toHaveBeenCalledTimes(3);
        expect(mockApi.approvePTOEntry).toHaveBeenCalledWith(10, 100);
        expect(mockApi.approvePTOEntry).toHaveBeenCalledWith(11, 100);
        expect(mockApi.approvePTOEntry).toHaveBeenCalledWith(12, 100);
      });
    });

    it("should refresh queue after approval", async () => {
      (page as any).requestUpdate();

      const queue = page.shadowRoot?.querySelector(
        "pto-request-queue",
      ) as HTMLElement;
      (queue as any).dismissCard = vi.fn().mockResolvedValue(undefined);

      queue.dispatchEvent(
        new CustomEvent("request-approve", {
          detail: { requestIds: [10] },
          bubbles: true,
          composed: true,
        }),
      );

      await vi.waitFor(() => {
        // refreshQueue calls getEmployees + getAdminPTOEntries
        expect(mockApi.getEmployees).toHaveBeenCalled();
      });
    });
  });

  describe("request-reject event", () => {
    it("should call api.rejectPTOEntry for each request ID", async () => {
      (page as any).requestUpdate();

      const queue = page.shadowRoot?.querySelector(
        "pto-request-queue",
      ) as HTMLElement;
      (queue as any).dismissCard = vi.fn().mockResolvedValue(undefined);

      queue.dispatchEvent(
        new CustomEvent("request-reject", {
          detail: { requestIds: [20, 21] },
          bubbles: true,
          composed: true,
        }),
      );

      await vi.waitFor(() => {
        expect(mockApi.rejectPTOEntry).toHaveBeenCalledTimes(2);
        expect(mockApi.rejectPTOEntry).toHaveBeenCalledWith(20);
        expect(mockApi.rejectPTOEntry).toHaveBeenCalledWith(21);
      });
    });
  });

  describe("calendar-data-request event", () => {
    it("should fetch PTO entries and acknowledgements for the requested month", async () => {
      (page as any).requestUpdate();

      const queue = page.shadowRoot?.querySelector(
        "pto-request-queue",
      ) as HTMLElement;

      queue.dispatchEvent(
        new CustomEvent("calendar-data-request", {
          detail: { employeeId: 5, month: "2026-03" },
          bubbles: true,
          composed: true,
        }),
      );

      await vi.waitFor(() => {
        expect(mockApi.getAdminPTOEntries).toHaveBeenCalledWith(
          expect.objectContaining({
            employeeId: 5,
            startDate: "2026-03-01",
            endDate: "2026-03-31",
          }),
        );
        expect(mockApi.getAdminAcknowledgements).toHaveBeenCalledWith(5);
      });
    });
  });
});
