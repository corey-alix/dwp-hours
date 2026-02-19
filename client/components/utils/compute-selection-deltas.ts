/**
 * Compute per-PTO-type hour deltas between selected calendar requests
 * and the existing PTO entries for the same dates.
 *
 * Used by both `CurrentYearPtoScheduler` (month-level delta display)
 * and the PTO entry form (remaining-balance delta display).
 *
 * @param selectedRequests  Requests currently selected on the calendar
 * @param existingEntries   Existing PTO entries to compare against
 * @returns Record keyed by PTO type (e.g. "PTO", "Sick") with net hour deltas
 */
export function computeSelectionDeltas(
  selectedRequests: ReadonlyArray<{
    date: string;
    type: string;
    hours: number;
  }>,
  existingEntries: ReadonlyArray<{
    date: string;
    type: string;
    hours: number;
  }>,
): Record<string, number> {
  const deltas: Record<string, number> = {};

  for (const request of selectedRequests) {
    const existingEntry = existingEntries.find(
      (entry) => entry.date === request.date,
    );
    const existingHours = existingEntry ? existingEntry.hours : 0;
    const delta = request.hours - existingHours;
    if (delta !== 0) {
      deltas[request.type] = (deltas[request.type] || 0) + delta;
    }
  }

  return deltas;
}
