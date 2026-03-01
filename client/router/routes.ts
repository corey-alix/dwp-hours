import { APIClient } from "../APIClient.js";
import type { AppRoutes } from "./types.js";

const api = new APIClient();

export const appRoutes: AppRoutes = [
  {
    path: "/login",
    component: "login-page",
    name: "Login",
    meta: { title: "Login", requiresAuth: false },
  },
  {
    path: "/submit-time-off",
    component: "submit-time-off-page",
    name: "Submit Time Off",
    meta: { title: "Submit Time Off", requiresAuth: true },
    loader: async () => {
      const [status, entries] = await Promise.all([
        api.getPTOStatus(),
        api.getPTOEntries(),
      ]);
      return { status, entries };
    },
  },
  {
    path: "/current-year-summary",
    component: "current-year-summary-page",
    name: "Current Year Summary",
    meta: { title: "Current Year Summary", requiresAuth: true },
    loader: async () => {
      const [status, entries] = await Promise.all([
        api.getPTOStatus(),
        api.getPTOEntries(),
      ]);
      return { status, entries };
    },
  },
  {
    path: "/prior-year-summary",
    component: "prior-year-summary-page",
    name: "Prior Year Summary",
    meta: { title: "Prior Year Summary", requiresAuth: true },
    loader: async () => {
      const { getCurrentYear } = await import("../../shared/dateUtils.js");
      const priorYear = getCurrentYear() - 1;
      return api.getPTOYearReview(priorYear);
    },
  },
  {
    path: "/upload-timesheet",
    component: "upload-timesheet-page",
    name: "Upload Timesheet",
    meta: { title: "Upload Timesheet", requiresAuth: true },
  },
  // ── Admin routes ──────────────────────────────────────────────
  {
    path: "/admin/employees",
    component: "admin-employees-page",
    name: "Employee Management",
    meta: {
      title: "Employee Management",
      requiresAuth: true,
      roles: ["Admin"],
    },
    loader: async () => ({ employees: await api.getEmployees() }),
  },
  {
    path: "/admin/pto-requests",
    component: "admin-pto-requests-page",
    name: "PTO Requests",
    meta: { title: "PTO Request Queue", requiresAuth: true, roles: ["Admin"] },
    loader: async () => {
      const [employees, entries] = await Promise.all([
        api.getEmployees(),
        // Exclude entries in admin-acknowledged (locked) months so they
        // don't appear as dead-end pending cards in the queue.
        api.getAdminPTOEntries({ excludeLockedMonths: true }),
      ]);
      const pendingRequests = entries
        .filter((e) => e.approved_by === null || e.approved_by === undefined)
        .map((e) => {
          const employee = employees.find(
            (emp: { id: number }) => emp.id === e.employeeId,
          );
          return {
            id: e.id,
            employeeId: e.employeeId,
            employeeName: employee?.name ?? "Unknown",
            startDate: e.date,
            endDate: e.date,
            type: e.type,
            hours: e.hours,
            status: "pending" as const,
            createdAt: e.createdAt,
          };
        });
      return { requests: pendingRequests };
    },
  },
  {
    path: "/admin/monthly-review",
    component: "admin-monthly-review-page",
    name: "Monthly Review",
    meta: {
      title: "Monthly Employee Review",
      requiresAuth: true,
      roles: ["Admin"],
    },
  },
  {
    path: "/admin/settings",
    component: "admin-settings-page",
    name: "Settings",
    meta: { title: "System Settings", requiresAuth: true, roles: ["Admin"] },
  },
  // ── Catch-all ─────────────────────────────────────────────────
  {
    path: "*",
    component: "not-found-page",
    name: "Not Found",
    meta: { title: "404" },
  },
];
