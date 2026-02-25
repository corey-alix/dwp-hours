/**
 * Aggregates PTO requests with the same employee, same PTO type, and
 * consecutive work days into single grouped entries.
 *
 * Consecutive work days = Monday–Friday with no calendar gaps (weekends
 * are skipped but considered consecutive; holidays are NOT considered).
 */

import { addDays, compareDates, isWeekend } from "../../shared/dateUtils.js";

export interface PTORequest {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: "Sick" | "PTO" | "Bereavement" | "Jury Duty";
  hours: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

/** A group of consecutive-workday requests collapsed into one card. */
export interface AggregatedPTORequest {
  /** All original request IDs in this group. */
  requestIds: number[];
  employeeId: number;
  employeeName: string;
  /** Earliest date among grouped requests. */
  startDate: string;
  /** Latest date among grouped requests. */
  endDate: string;
  type: PTORequest["type"];
  /** Sum of hours across all grouped requests. */
  hours: number;
  status: PTORequest["status"];
  /** Earliest createdAt from grouped requests. */
  createdAt: string;
}

/**
 * Returns the next work day (Monday–Friday) after the given date.
 * Skips weekends only — holidays are not considered.
 */
function nextWorkDay(dateStr: string): string {
  let next = addDays(dateStr, 1);
  while (isWeekend(next)) {
    next = addDays(next, 1);
  }
  return next;
}

/**
 * Aggregate an array of PTO requests.
 *
 * Requests with the same `employeeId` + `type` + consecutive work days
 * are merged into a single `AggregatedPTORequest`. Non-consecutive or
 * different-type requests remain as separate entries.
 *
 * Input order is preserved per employee — groups appear in the order of
 * the earliest request date within each group.
 */
export function aggregatePTORequests(
  requests: PTORequest[],
): AggregatedPTORequest[] {
  if (requests.length === 0) return [];

  // Sort by employee, type, then date for grouping
  const sorted = [...requests].sort((a, b) => {
    if (a.employeeId !== b.employeeId) return a.employeeId - b.employeeId;
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return compareDates(a.startDate, b.startDate);
  });

  const result: AggregatedPTORequest[] = [];
  let current: AggregatedPTORequest | null = null;

  for (const req of sorted) {
    const reqStartDate = req.startDate;
    const reqEndDate = req.endDate || req.startDate;

    if (
      current &&
      current.employeeId === req.employeeId &&
      current.type === req.type &&
      nextWorkDay(current.endDate) === reqStartDate
    ) {
      // Extend the current group
      current.requestIds.push(req.id);
      current.endDate = reqEndDate;
      current.hours += req.hours;
      // Keep earliest createdAt
      if (req.createdAt < current.createdAt) {
        current.createdAt = req.createdAt;
      }
    } else {
      // Start a new group
      current = {
        requestIds: [req.id],
        employeeId: req.employeeId,
        employeeName: req.employeeName,
        startDate: reqStartDate,
        endDate: reqEndDate,
        type: req.type,
        hours: req.hours,
        status: req.status,
        createdAt: req.createdAt,
      };
      result.push(current);
    }
  }

  return result;
}
