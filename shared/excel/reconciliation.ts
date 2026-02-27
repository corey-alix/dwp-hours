/**
 * Excel Parsing — Reconciliation Phases
 *
 * All reconciliation and reclassification functions that adjust PTO entries
 * based on column S declarations, cell notes, color matching, sick allowance
 * limits, weekend work, and other business rules.
 */

import type {
  ImportedPtoEntry,
  PtoCalcRow,
  UnmatchedColoredCell,
  UnmatchedNotedCell,
  WorkedCell,
} from "./types.js";
import {
  ANNUAL_SICK_ALLOWANCE,
  COLUMN_S_TRACKED_TYPES,
  OVERCOLOR_NOTE_KEYWORDS,
  pad2,
} from "./types.js";
import { parseHoursFromNote } from "./cellUtils.js";

// ── Partial-Day Adjustment ──

/**
 * Adjust partial PTO entry hours to reconcile against column S totals.
 */
export function adjustPartialDays(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  sheetName = "",
): { entries: ImportedPtoEntry[]; warnings: string[]; resolved: string[] } {
  const byMonth = new Map<number, ImportedPtoEntry[]>();
  for (const e of entries) {
    const month = parseInt(e.date.substring(5, 7), 10);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(e);
  }

  const result: ImportedPtoEntry[] = [];
  for (const e of entries) {
    result.push({ ...e });
  }
  const warnings: string[] = [];
  const resolved: string[] = [];

  for (const calc of ptoCalcRows) {
    const monthEntries = byMonth.get(calc.month);
    if (!monthEntries || monthEntries.length === 0) continue;

    const trackedEntries = monthEntries.filter((e) =>
      COLUMN_S_TRACKED_TYPES.has(e.type),
    );
    const calendarTotal = trackedEntries.reduce((sum, e) => sum + e.hours, 0);
    const declaredTotal = calc.usedHours;

    if (declaredTotal <= 0) continue;

    const monthStr = pad2(calc.month);
    const monthResultEntries = result.filter(
      (e) =>
        e.date.substring(5, 7) === monthStr &&
        COLUMN_S_TRACKED_TYPES.has(e.type),
    );
    if (monthResultEntries.length === 0) continue;

    if (calendarTotal === declaredTotal) continue;

    monthResultEntries.sort((a, b) => a.date.localeCompare(b.date));
    const partials = monthResultEntries.filter(
      (e) => e.isPartialPtoColor === true,
    );

    if (partials.length > 0) {
      const pinned = partials.filter((e) => e.isNoteDerived === true);
      const unpinned = partials.filter((e) => e.isNoteDerived !== true);

      const fullTotal = monthResultEntries
        .filter((e) => !e.isPartialPtoColor)
        .reduce((sum, e) => sum + e.hours, 0);
      const pinnedTotal = pinned.reduce((sum, e) => sum + e.hours, 0);

      if (unpinned.length > 0) {
        const remainingForUnpinned =
          Math.round((declaredTotal - fullTotal - pinnedTotal) * 100) / 100;
        const hoursEach =
          Math.round((remainingForUnpinned / unpinned.length) * 100) / 100;

        if (hoursEach > 0 && hoursEach <= 8) {
          for (const partial of unpinned) {
            if (partial.hours !== hoursEach) {
              const originalHours = partial.hours;
              partial.hours = hoursEach;
              const adjustNote =
                `Adjusted from ${originalHours}h to ${hoursEach}h ` +
                `based on PTO Calc (declared ${declaredTotal}h for month ${calc.month}).`;
              partial.notes = partial.notes
                ? `${partial.notes} ${adjustNote}`
                : adjustNote;
            }
          }
        } else {
          warnings.push(
            `"${sheetName}" month ${calc.month}: ` +
              `partial distribution produced ${hoursEach}h per entry (out of 0–8 range). ` +
              `Declared=${declaredTotal}h, fullTotal=${fullTotal}h, pinnedTotal=${pinnedTotal}h, ` +
              `${unpinned.length} unpinned partial entries. No adjustment applied.`,
          );
        }
      } else {
        const totalWithPinned =
          Math.round((fullTotal + pinnedTotal) * 100) / 100;
        if (Math.abs(totalWithPinned - declaredTotal) > 0.1) {
          warnings.push(
            `"${sheetName}" month ${calc.month}: ` +
              `all ${pinned.length} partial entries have note-derived hours (pinned). ` +
              `Declared=${declaredTotal}h, fullTotal=${fullTotal}h, pinnedTotal=${pinnedTotal}h, ` +
              `total=${totalWithPinned}h. Not overriding pinned values.`,
          );
        }
      }
    } else if (calendarTotal > declaredTotal) {
      const targetEntry = monthResultEntries[monthResultEntries.length - 1];
      const otherTotal = calendarTotal - targetEntry.hours;
      const partialHours = declaredTotal - otherTotal;

      if (partialHours > 0 && partialHours < targetEntry.hours) {
        const originalHours = targetEntry.hours;
        targetEntry.hours = Math.round(partialHours * 100) / 100;
        const adjustNote =
          `Adjusted from ${originalHours}h to ${targetEntry.hours}h ` +
          `based on PTO Calc (declared ${declaredTotal}h for month ${calc.month}).`;
        targetEntry.notes = targetEntry.notes
          ? `${targetEntry.notes} ${adjustNote}`
          : adjustNote;
      }
    } else {
      warnings.push(
        `"${sheetName}" month ${calc.month}: ` +
          `calendar total (${calendarTotal}h) < declared (${declaredTotal}h) ` +
          `but no Partial PTO entries found. Cannot back-calculate.`,
      );
    }
  }

  return { entries: result, warnings, resolved };
}

// ── Partial PTO Reconciliation ──

/**
 * Reconcile partial PTO entries that were missed by calendar color matching.
 */
export function reconcilePartialPto(
  entries: ImportedPtoEntry[],
  unmatchedNotedCells: UnmatchedNotedCell[],
  ptoCalcRows: PtoCalcRow[],
  sheetName: string,
): { entries: ImportedPtoEntry[]; warnings: string[]; resolved: string[] } {
  const result = [...entries];
  const warnings: string[] = [];
  const resolved: string[] = [];

  for (const calc of ptoCalcRows) {
    if (calc.usedHours <= 0) continue;

    const monthStr = pad2(calc.month);
    const detectedTotal = result
      .filter(
        (e) =>
          e.date.substring(5, 7) === monthStr &&
          COLUMN_S_TRACKED_TYPES.has(e.type),
      )
      .reduce((sum, e) => sum + e.hours, 0);

    const gap = Math.round((calc.usedHours - detectedTotal) * 100) / 100;
    if (gap <= 0) continue;

    const monthNoted = unmatchedNotedCells.filter(
      (c) => c.date.substring(5, 7) === monthStr,
    );

    if (monthNoted.length > 0) {
      let remaining = gap;
      for (const noted of monthNoted) {
        if (remaining <= 0) break;

        const noteHours = parseHoursFromNote(noted.note);
        const assignedHours =
          noteHours !== undefined ? Math.min(noteHours, remaining) : remaining;

        const noteExplanation =
          `Inferred partial PTO from cell note "${noted.note.replace(/\n/g, " ").trim()}". ` +
          `Calendar color not matched as Partial PTO. ` +
          `Reconciled against PTO Calc (declared=${calc.usedHours}h, ` +
          `detected=${detectedTotal}h, gap=${gap}h).`;

        result.push({
          date: noted.date,
          type: "PTO",
          hours: Math.round(assignedHours * 100) / 100,
          notes: noteExplanation,
        });

        remaining = Math.round((remaining - assignedHours) * 100) / 100;
      }

      if (remaining > 0) {
        resolved.push(
          `"${sheetName}" month ${calc.month}: partially reconciled. ` +
            `Declared=${calc.usedHours}h, detected=${detectedTotal}h, ` +
            `assigned ${gap - remaining}h from notes, ` +
            `${remaining}h still unaccounted for.`,
        );
      }
    } else {
      warnings.push(
        `"${sheetName}" month ${calc.month}: PTO hours mismatch. ` +
          `Declared=${calc.usedHours}h, detected=${detectedTotal}h, ` +
          `gap=${gap}h. No cell notes found for reconciliation.`,
      );
    }
  }

  return { entries: result, warnings, resolved };
}

// ── Weekend "Worked" Days ──

/**
 * Try to parse hours from a "worked" note.
 */
export function parseWorkedHoursFromNote(note: string): number | undefined {
  let match = note.match(/\(\+?\s*(\d+(?:\.\d+)?)\s*hours?\s*(?:PTO)?\s*\)/i);
  if (match) return parseFloat(match[1]);

  match = note.match(/make\s*up\s+(\d+(?:\.\d+)?)/i);
  if (match) return parseFloat(match[1]);

  match = note.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i);
  if (match) {
    const val = parseFloat(match[1]);
    if (val > 0 && val <= 12) return val;
  }

  const rangeMatch = note.match(
    /worked\s+(?:from\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)?\s*[-–]+\s*(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)?/i,
  );
  if (rangeMatch) {
    const startH = parseInt(rangeMatch[1], 10);
    const startM = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0;
    const endH = parseInt(rangeMatch[3], 10);
    const endM = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 0;
    const diff =
      Math.round((endH + endM / 60 - (startH + startM / 60)) * 100) / 100;
    if (diff > 0 && diff <= 12) return diff;
  }

  return undefined;
}

/**
 * Process "worked" weekend/off-day cells to create negative PTO credit entries.
 */
export function processWorkedCells(
  workedCells: WorkedCell[],
  existingEntries: ImportedPtoEntry[],
  ptoCalcRows: { month: number; usedHours: number }[],
  sheetName: string,
): { entries: ImportedPtoEntry[]; warnings: string[]; resolved: string[] } {
  const entries: ImportedPtoEntry[] = [];
  const warnings: string[] = [];
  const resolved: string[] = [];

  if (workedCells.length === 0) return { entries, warnings, resolved };

  const byMonth = new Map<number, WorkedCell[]>();
  for (const wc of workedCells) {
    const month = parseInt(wc.date.substring(5, 7), 10);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(wc);
  }

  for (const [month, cells] of byMonth) {
    const monthStr = pad2(month);
    const ptoCalc = ptoCalcRows.find((r) => r.month === month);
    const declaredTotal = ptoCalc?.usedHours ?? 0;

    const existingTotal = existingEntries
      .filter(
        (e) =>
          e.date.substring(5, 7) === monthStr &&
          COLUMN_S_TRACKED_TYPES.has(e.type),
      )
      .reduce((sum, e) => sum + e.hours, 0);

    const parsed: { cell: WorkedCell; hours: number }[] = [];
    const unparsed: WorkedCell[] = [];

    for (const wc of cells) {
      const hours = parseWorkedHoursFromNote(wc.note);
      if (hours !== undefined) {
        parsed.push({ cell: wc, hours });
      } else {
        unparsed.push(wc);
      }
    }

    for (const { cell, hours } of parsed) {
      entries.push({
        date: cell.date,
        type: "PTO",
        hours: -hours,
        notes:
          `Weekend/off-day work credit (${hours}h). ` +
          `Cell note: "${cell.note.replace(/\n/g, " ").trim()}"`,
      });
      resolved.push(
        `"${sheetName}": detected worked day on ${cell.date}. ` +
          `Note: "${cell.note.replace(/\n/g, " ").trim()}". ` +
          `Assigned -${hours}h PTO credit from note.`,
      );
    }

    if (unparsed.length > 0) {
      const parsedCredit = parsed.reduce((sum, p) => sum + p.hours, 0);
      const unparsedCredit =
        Math.round((existingTotal - parsedCredit - declaredTotal) * 100) / 100;

      if (unparsedCredit > 0 && unparsed.length === 1) {
        const cell = unparsed[0];
        entries.push({
          date: cell.date,
          type: "PTO",
          hours: -unparsedCredit,
          notes:
            `Weekend/off-day work credit inferred from PTO Calc. ` +
            `Declared=${declaredTotal}h, detected=${existingTotal}h, ` +
            `other credits=${parsedCredit}h, inferred=${unparsedCredit}h. ` +
            `Cell note: "${cell.note.replace(/\n/g, " ").trim()}"`,
        });
        resolved.push(
          `"${sheetName}": detected worked day on ${cell.date}. ` +
            `Note: "${cell.note.replace(/\n/g, " ").trim()}". ` +
            `Inferred -${unparsedCredit}h PTO credit from PTO Calc deficit.`,
        );
      } else if (unparsedCredit > 0 && unparsed.length > 1) {
        for (const cell of unparsed) {
          warnings.push(
            `"${sheetName}": detected worked day on ${cell.date}. ` +
              `Note: "${cell.note.replace(/\n/g, " ").trim()}". ` +
              `Could not determine hours — ${unparsed.length} worked cells ` +
              `in month ${month} with ${unparsedCredit}h total deficit. Skipping.`,
          );
        }
      } else {
        for (const cell of unparsed) {
          warnings.push(
            `"${sheetName}": detected worked day on ${cell.date}. ` +
              `Note: "${cell.note.replace(/\n/g, " ").trim()}". ` +
              `Could not determine hours (no PTO Calc deficit). Skipping.`,
          );
        }
      }
    }
  }

  return { entries, warnings, resolved };
}

// ── Weekend-Work + Partial-PTO Joint Inference ──

/**
 * Joint inference for months with both Partial PTO and unprocessed weekend work.
 */
export function inferWeekendPartialHours(
  entries: ImportedPtoEntry[],
  workedCells: WorkedCell[],
  ptoCalcRows: PtoCalcRow[],
  sheetName: string,
): {
  entries: ImportedPtoEntry[];
  newWorkedEntries: ImportedPtoEntry[];
  handledWorkedDates: Set<string>;
  warnings: string[];
  resolved: string[];
} {
  const result = entries.map((e) => ({ ...e }));
  const newWorkedEntries: ImportedPtoEntry[] = [];
  const handledWorkedDates = new Set<string>();
  const warnings: string[] = [];
  const resolved: string[] = [];

  const negativeEntryDates = new Set(
    entries.filter((e) => e.hours < 0).map((e) => e.date),
  );
  const unprocessedWorked = workedCells.filter(
    (wc) => !negativeEntryDates.has(wc.date),
  );

  const workedByMonth = new Map<number, WorkedCell[]>();
  for (const wc of unprocessedWorked) {
    const month = parseInt(wc.date.substring(5, 7), 10);
    if (!workedByMonth.has(month)) workedByMonth.set(month, []);
    workedByMonth.get(month)!.push(wc);
  }

  for (const calc of ptoCalcRows) {
    const monthStr = pad2(calc.month);
    const declaredTotal = calc.usedHours;

    const monthResultEntries = result.filter(
      (e) =>
        e.date.substring(5, 7) === monthStr &&
        COLUMN_S_TRACKED_TYPES.has(e.type),
    );
    const currentTotal = monthResultEntries.reduce(
      (sum, e) => sum + e.hours,
      0,
    );

    if (Math.abs(currentTotal - declaredTotal) < 0.01) continue;

    const partials = monthResultEntries.filter(
      (e) => e.isPartialPtoColor === true,
    );
    const worked = workedByMonth.get(calc.month) || [];

    if (partials.length === 0 || worked.length === 0) continue;

    const unpinnedPartials = partials.filter((e) => e.isNoteDerived !== true);
    if (unpinnedPartials.length === 0) continue;

    const pinnedTotal = partials
      .filter((e) => e.isNoteDerived === true)
      .reduce((sum, e) => sum + e.hours, 0);
    const unpinnedCount = unpinnedPartials.length;
    const workedCount = worked.length;

    const fullTotal = monthResultEntries
      .filter((e) => !e.isPartialPtoColor && e.hours > 0)
      .reduce((sum, e) => sum + e.hours, 0);
    const existingCredits = monthResultEntries
      .filter((e) => e.hours < 0)
      .reduce((sum, e) => sum + e.hours, 0);

    const target = declaredTotal - fullTotal - pinnedTotal - existingCredits;

    let p: number | undefined;
    let w: number | undefined;
    let method = "";

    const p1 =
      Math.round(((target + workedCount * 8) / unpinnedCount) * 100) / 100;
    if (p1 > 0 && p1 <= 8) {
      p = p1;
      w = 8;
      method = "w assumed 8h";
    }

    if (p === undefined) {
      const w2 =
        Math.round(((unpinnedCount * 4 - target) / workedCount) * 100) / 100;
      if (w2 > 0 && w2 <= 8) {
        p = 4;
        w = w2;
        method = "p assumed 4h";
      }
    }

    if (p === undefined) {
      const midW = (unpinnedCount * 4 - target) / workedCount;
      const clampedW = Math.round(Math.min(8, Math.max(0.5, midW)) * 100) / 100;
      const derivedP =
        Math.round(((target + workedCount * clampedW) / unpinnedCount) * 100) /
        100;
      if (derivedP > 0 && derivedP <= 8) {
        p = derivedP;
        w = clampedW;
        method = "constrained solve";
      }
    }

    if (p !== undefined && w !== undefined) {
      for (const partial of unpinnedPartials) {
        partial.hours = p;
        const note =
          `Inferred p=${p}h (${method}). ` +
          `Equation: declared(${declaredTotal}) = full(${fullTotal}) + pinned(${pinnedTotal}) + ` +
          `${unpinnedCount}×p − ${workedCount}×${w}`;
        partial.notes = partial.notes ? `${partial.notes} ${note}` : note;
      }

      for (const wc of worked) {
        newWorkedEntries.push({
          date: wc.date,
          type: "PTO",
          hours: -w,
          notes:
            `Inferred w=${w}h (${method}). ` +
            `Equation: declared(${declaredTotal}) = full(${fullTotal}) + pinned(${pinnedTotal}) + ` +
            `${unpinnedCount}×${p} − ${workedCount}×w. ` +
            `Cell note: "${wc.note.replace(/\n/g, " ").trim()}"`,
        });
        handledWorkedDates.add(wc.date);
      }

      const newTotal =
        fullTotal +
        pinnedTotal +
        existingCredits +
        unpinnedCount * p -
        workedCount * w;
      resolved.push(
        `"${sheetName}" month ${calc.month}: Phase 11 inference applied. ` +
          `p=${p}h, w=${w}h (${method}). ` +
          `Declared=${declaredTotal}h, computed=${Math.round(newTotal * 100) / 100}h.`,
      );
    } else {
      warnings.push(
        `"${sheetName}" month ${calc.month}: Phase 11 inference failed. ` +
          `Could not find valid p and w values. ` +
          `Declared=${declaredTotal}h, fullTotal=${fullTotal}h, ` +
          `${unpinnedCount} unpinned partial(s), ${workedCount} worked cell(s). ` +
          `No adjustment applied.`,
      );
    }
  }

  return {
    entries: result,
    newWorkedEntries,
    handledWorkedDates,
    warnings,
    resolved,
  };
}

// ── Note-Based Type Override ──

/**
 * Override the PTO type for approximate-color-matched entries when the cell
 * note contains an explicit type keyword.
 */
export function overrideTypeFromNote(
  entries: ImportedPtoEntry[],
  sheetName = "",
): {
  entries: ImportedPtoEntry[];
  workedCells: WorkedCell[];
  warnings: string[];
  resolved: string[];
} {
  const result: ImportedPtoEntry[] = [];
  const workedCells: WorkedCell[] = [];
  const warnings: string[] = [];
  const resolved: string[] = [];

  for (const entry of entries) {
    const isApprox = entry.notes?.includes("Color matched via approximate");
    if (!isApprox) {
      result.push({ ...entry });
      continue;
    }

    const noteMatch = entry.notes?.match(/Cell note: "(.+?)"/);
    const rawNote = noteMatch?.[1] || "";
    if (!rawNote) {
      result.push({ ...entry });
      continue;
    }

    if (/\bworked\b/i.test(rawNote)) {
      workedCells.push({ date: entry.date, note: rawNote });
      warnings.push(
        `"${sheetName}" ${entry.date}: approximate-matched ${entry.type} ` +
          `overridden → Worked cell (note: "${rawNote.substring(0, 60)}").`,
      );
      continue;
    }

    if (/\bPTO\b/i.test(rawNote) && entry.type !== "PTO") {
      const copy = { ...entry };
      const oldType = copy.type;
      copy.type = "PTO";
      copy.notes =
        (copy.notes || "") +
        ` Type overridden from ${oldType} to PTO based on note keyword.`;
      result.push(copy);
      warnings.push(
        `"${sheetName}" ${entry.date}: approximate-matched ${oldType} ` +
          `overridden → PTO (note: "${rawNote.substring(0, 60)}").`,
      );
      continue;
    }

    if (/\bsick\b/i.test(rawNote) && entry.type !== "Sick") {
      const copy = { ...entry };
      const oldType = copy.type;
      copy.type = "Sick";
      copy.notes =
        (copy.notes || "") +
        ` Type overridden from ${oldType} to Sick based on note keyword.`;
      result.push(copy);
      warnings.push(
        `"${sheetName}" ${entry.date}: approximate-matched ${oldType} ` +
          `overridden → Sick (note: "${rawNote.substring(0, 60)}").`,
      );
      continue;
    }

    result.push({ ...entry });
  }

  return { entries: result, workedCells, warnings, resolved };
}

// ── Sick → PTO Reclassification ──

/**
 * Reclassify Sick-colored entries as PTO when the employee has exhausted
 * their annual sick-time allowance (24h).
 */
export function reclassifySickAsPto(
  entries: ImportedPtoEntry[],
  sheetName = "",
): { entries: ImportedPtoEntry[]; warnings: string[]; resolved: string[] } {
  const result = entries.map((e) => ({ ...e }));
  const warnings: string[] = [];
  const resolved: string[] = [];

  const sorted = result.slice().sort((a, b) => a.date.localeCompare(b.date));
  const dateToIndices = new Map<string, number[]>();
  for (let i = 0; i < result.length; i++) {
    const key = `${result[i].date}|${result[i].type}|${result[i].hours}`;
    if (!dateToIndices.has(key)) dateToIndices.set(key, []);
    dateToIndices.get(key)!.push(i);
  }

  let cumulativeSickHours = 0;

  for (const entry of sorted) {
    if (entry.type !== "Sick") continue;

    const entryHours = Math.abs(entry.hours);

    if (cumulativeSickHours >= ANNUAL_SICK_ALLOWANCE) {
      const key = `${entry.date}|Sick|${entry.hours}`;
      const indices = dateToIndices.get(key);
      if (indices && indices.length > 0) {
        const idx = indices.shift()!;
        result[idx].type = "PTO";
        const note =
          `Cell colored as Sick but reclassified as PTO — employee had exhausted ` +
          `${ANNUAL_SICK_ALLOWANCE}h sick allowance (used ${cumulativeSickHours}h prior to this date).`;
        result[idx].notes = result[idx].notes
          ? `${result[idx].notes} ${note}`
          : note;
        resolved.push(
          `"${sheetName}" ${entry.date}: Sick entry reclassified as PTO ` +
            `(${entryHours}h). Employee had used ${cumulativeSickHours}h of ` +
            `${ANNUAL_SICK_ALLOWANCE}h sick allowance.`,
        );
      }
      cumulativeSickHours += entryHours;
    } else {
      cumulativeSickHours += entryHours;
    }
  }

  return { entries: result, warnings, resolved };
}

// ── Column-S-Guided Sick → PTO Reclassification ──

/**
 * After all reconciliation phases, reclassify Sick entries as PTO based
 * on column S gap.
 */
export function reclassifySickByColumnS(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  sheetName = "",
): { entries: ImportedPtoEntry[]; warnings: string[]; resolved: string[] } {
  const phase12Occurred = entries.some(
    (e) =>
      e.notes?.includes("reclassified as PTO") &&
      e.notes?.includes("sick allowance"),
  );
  if (!phase12Occurred) {
    return { entries, warnings: [], resolved: [] };
  }

  const result = entries.map((e) => ({ ...e }));
  const warnings: string[] = [];
  const resolved: string[] = [];

  for (const { month, usedHours: declared } of ptoCalcRows) {
    let ptoTotal = 0;
    const sickIndices: number[] = [];

    for (let i = 0; i < result.length; i++) {
      const m = parseInt(result[i].date.substring(5, 7));
      if (m !== month) continue;
      if (result[i].type === "PTO") {
        ptoTotal += result[i].hours;
      } else if (result[i].type === "Sick") {
        sickIndices.push(i);
      }
    }

    let gap = declared - ptoTotal;
    if (gap < 0.1 || sickIndices.length === 0) continue;

    sickIndices.sort((a, b) => result[a].date.localeCompare(result[b].date));

    for (const idx of sickIndices) {
      const entryHours = Math.abs(result[idx].hours);
      if (entryHours > gap + 0.1) continue;

      result[idx].type = "PTO";
      const note =
        `Sick entry reclassified as PTO based on column S gap ` +
        `(sick allowance appears exhausted). ` +
        `Declared=${declared}h, PTO before reclassification=${ptoTotal.toFixed(1)}h, ` +
        `gap=${gap.toFixed(1)}h.`;
      result[idx].notes = result[idx].notes
        ? `${result[idx].notes} ${note}`
        : note;

      resolved.push(
        `"${sheetName}" ${result[idx].date}: Sick reclassified as PTO ` +
          `(${entryHours}h) based on column S gap. ` +
          `Declared=${declared}h, prior PTO=${ptoTotal.toFixed(1)}h.`,
      );

      ptoTotal += entryHours;
      gap -= entryHours;
      if (gap < 0.1) break;
    }
  }

  return { entries: result, warnings, resolved };
}

// ── Column-S-Guided Bereavement → PTO Reclassification ──

/**
 * Reclassify approximate-matched Bereavement entries as PTO when column S
 * declares more PTO than detected.
 */
export function reclassifyBereavementByColumnS(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  sheetName = "",
): { entries: ImportedPtoEntry[]; warnings: string[]; resolved: string[] } {
  const result = entries.map((e) => ({ ...e }));
  const warnings: string[] = [];
  const resolved: string[] = [];

  for (const { month, usedHours: declared } of ptoCalcRows) {
    const monthStr = pad2(month);
    let ptoTotal = 0;
    const bereavIndices: number[] = [];

    for (let i = 0; i < result.length; i++) {
      if (result[i].date.substring(5, 7) !== monthStr) continue;
      if (result[i].type === "PTO") {
        ptoTotal += result[i].hours;
      } else if (
        result[i].type === "Bereavement" &&
        result[i].notes?.includes("Color matched via approximate")
      ) {
        bereavIndices.push(i);
      }
    }

    let gap = declared - ptoTotal;
    if (gap < 0.5 || bereavIndices.length === 0) continue;

    bereavIndices.sort((a, b) => result[a].hours - result[b].hours);

    for (const idx of bereavIndices) {
      const entryHours = Math.abs(result[idx].hours);
      if (entryHours > gap + 0.1) continue;

      result[idx].type = "PTO";
      const note =
        `Bereavement reclassified as PTO based on column S gap. ` +
        `Declared=${declared}h, PTO before=${ptoTotal.toFixed(1)}h, ` +
        `gap=${gap.toFixed(1)}h.`;
      result[idx].notes = result[idx].notes
        ? `${result[idx].notes} ${note}`
        : note;

      resolved.push(
        `"${sheetName}" ${result[idx].date}: Bereavement reclassified as PTO ` +
          `(${entryHours}h) based on column S gap. ` +
          `Declared=${declared}h, prior PTO=${ptoTotal.toFixed(1)}h.`,
      );

      ptoTotal += entryHours;
      gap -= entryHours;
      if (gap < 0.5) break;
    }
  }

  return { entries: result, warnings, resolved };
}

// ── Non-Standard Color PTO Recognition ──

/**
 * Reconcile unmatched colored cells as PTO when column S declares more.
 */
export function reconcileUnmatchedColoredCells(
  existingEntries: ImportedPtoEntry[],
  unmatchedColoredCells: UnmatchedColoredCell[],
  ptoCalcRows: PtoCalcRow[],
  sheetName: string,
): { entries: ImportedPtoEntry[]; warnings: string[]; resolved: string[] } {
  const newEntries: ImportedPtoEntry[] = [];
  const warnings: string[] = [];
  const resolved: string[] = [];

  if (unmatchedColoredCells.length === 0) {
    return { entries: newEntries, warnings, resolved };
  }

  for (const calc of ptoCalcRows) {
    if (calc.usedHours <= 0) continue;

    const monthStr = pad2(calc.month);
    const declaredTotal = calc.usedHours;

    const calendarTotal = existingEntries
      .filter(
        (e) =>
          e.date.substring(5, 7) === monthStr &&
          COLUMN_S_TRACKED_TYPES.has(e.type),
      )
      .reduce((sum, e) => sum + e.hours, 0);

    let gap = Math.round((declaredTotal - calendarTotal) * 100) / 100;

    if (gap < 7.9) continue;

    const monthCells = unmatchedColoredCells.filter(
      (c) => c.date.substring(5, 7) === monthStr,
    );
    if (monthCells.length === 0) continue;

    const existingDates = new Set(existingEntries.map((e) => e.date));
    const availableCells = monthCells.filter((c) => !existingDates.has(c.date));
    if (availableCells.length === 0) continue;

    const withNotes: UnmatchedColoredCell[] = [];
    const withoutNotes: UnmatchedColoredCell[] = [];
    for (const cell of availableCells) {
      if (cell.note) {
        withNotes.push(cell);
      } else {
        withoutNotes.push(cell);
      }
    }

    for (const cell of withNotes) {
      if (gap <= 0.1) break;
      const noteHours = parseHoursFromNote(cell.note);
      const assignedHours =
        noteHours !== undefined ? Math.min(noteHours, gap) : Math.min(8, gap);
      newEntries.push({
        date: cell.date,
        type: "PTO",
        hours: Math.round(assignedHours * 100) / 100,
        notes:
          `Non-standard color (${cell.color}) treated as PTO — cell color not in legend ` +
          `but PTO Calc discrepancy suggests PTO. Cell note: "${cell.note.replace(/\n/g, " ")}"`,
      });
      gap = Math.round((gap - assignedHours) * 100) / 100;
    }

    if (gap > 0.1 && withoutNotes.length > 0) {
      const hoursEach = Math.round((gap / withoutNotes.length) * 100) / 100;

      if (hoursEach > 0 && hoursEach <= 8) {
        for (const cell of withoutNotes) {
          if (gap <= 0.1) break;
          const assignedHours = Math.min(hoursEach, gap);
          newEntries.push({
            date: cell.date,
            type: "PTO",
            hours: Math.round(assignedHours * 100) / 100,
            notes:
              `Non-standard color (${cell.color}) treated as PTO — cell color not in legend ` +
              `but PTO Calc discrepancy suggests PTO.`,
          });
          gap = Math.round((gap - assignedHours) * 100) / 100;
        }
      } else {
        warnings.push(
          `"${sheetName}" month ${calc.month}: ${withoutNotes.length} unmatched colored cells ` +
            `but distributing ${gap}h yields ${hoursEach}h each (out of 0–8 range). ` +
            `No PTO entries created from unmatched cells.`,
        );
      }
    }

    if (gap > 0.1) {
      resolved.push(
        `"${sheetName}" month ${calc.month}: partially reconciled via unmatched colored cells. ` +
          `Declared=${declaredTotal}h, calendar=${calendarTotal}h, ` +
          `assigned ${Math.round((declaredTotal - calendarTotal - gap) * 100) / 100}h from unmatched cells, ` +
          `${gap}h still unaccounted for.`,
      );
    } else if (newEntries.some((e) => e.date.substring(5, 7) === monthStr)) {
      resolved.push(
        `"${sheetName}" month ${calc.month}: Phase 13 reconciled ` +
          `${availableCells.length} unmatched colored cell(s) as PTO. ` +
          `Declared=${declaredTotal}h, original calendar=${calendarTotal}h.`,
      );
    }
  }

  return { entries: newEntries, warnings, resolved };
}

// ── Over-Coloring Detection ──

/**
 * Detect months where calendar-detected PTO exceeds the declared column S total.
 */
export function detectOverColoring(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  sheetName: string,
): { warnings: string[] } {
  const warnings: string[] = [];

  for (const calc of ptoCalcRows) {
    const monthStr = pad2(calc.month);
    const declaredTotal = calc.usedHours;

    const monthEntries = entries.filter(
      (e) =>
        e.date.substring(5, 7) === monthStr &&
        COLUMN_S_TRACKED_TYPES.has(e.type),
    );
    const calendarTotal = monthEntries.reduce((sum, e) => sum + e.hours, 0);

    const delta = Math.round((calendarTotal - declaredTotal) * 100) / 100;
    if (delta <= 0.1) continue;

    const noteMatches: string[] = [];
    for (const entry of monthEntries) {
      if (entry.notes && OVERCOLOR_NOTE_KEYWORDS.test(entry.notes)) {
        noteMatches.push(
          `${entry.date} note: '${entry.notes.replace(/\n/g, " ").substring(0, 120)}'`,
        );
      }
    }

    let warning =
      `Over-coloring detected for ${sheetName} month ${calc.month}: ` +
      `calendar=${calendarTotal}h, declared=${declaredTotal}h (Δ=+${delta}h).`;

    if (noteMatches.length > 0) {
      warning += ` Relevant notes: ${noteMatches.join("; ")}.`;
    }

    warning += ` Column S is authoritative; calendar over-reports by ${delta}h.`;

    warnings.push(warning);
  }

  return { warnings };
}
