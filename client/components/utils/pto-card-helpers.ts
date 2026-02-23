/**
 * Shared template helper functions for PTO card components.
 * Replaces the inheritance-based rendering from PtoSectionCard / SimplePtoBucketCard.
 */
import {
  isValidDateString,
  formatDateForDisplay,
} from "../../../shared/dateUtils.js";
import type { PTOEntry } from "../../../shared/api-models.js";
import { MONTH_NAMES } from "../../../shared/businessRules.js";

/** @deprecated Use `MONTH_NAMES` from `shared/businessRules.js` instead. */
export const monthNames = MONTH_NAMES;

/** Wraps body content in the standard card shell markup. */
export function renderCardShell(title: string, body: string): string {
  return `<div class="card"><h4>${title}</h4>${body}</div>`;
}

/** Renders a single label/value data row. */
export function renderRow(
  label: string,
  value: string,
  cssClass?: string,
): string {
  const cls = cssClass ? ` class="${cssClass}"` : "";
  return `<div class="row"><span class="label">${label}</span><span${cls}>${value}</span></div>`;
}

/** Renders the expand/collapse toggle button. */
export function renderToggleButton(
  expanded: boolean,
  hasEntries: boolean,
): string {
  if (!hasEntries) return "";
  return `
    <button class="toggle-button" aria-expanded="${expanded}" aria-label="${expanded ? "Hide" : "Show"} detailed usage">
      ${expanded ? "Hide Details" : "Show Details"}
      <span class="chevron ${expanded ? "expanded" : ""}">▼</span>
    </button>
  `;
}

export type UsageEntry = { date: string; hours: number };

/**
 * Renders the usage-list section with clickable dates.
 * @param entries    - Usage entries to display (date + hours)
 * @param expanded   - Whether the section is visible
 * @param entryType  - PTO entry type string used for approval matching (e.g. "PTO", "Sick")
 * @param fullEntries - Full PTOEntry[] for per-entry approval checks
 */
export function renderUsageList(
  entries: UsageEntry[],
  expanded: boolean,
  entryType: string,
  fullEntries: PTOEntry[] = [],
): string {
  if (!expanded || !entries || entries.length === 0) return "";

  const rows = entries
    .map((entry) => {
      const label = isValidDateString(entry.date)
        ? formatDateForDisplay(entry.date)
        : entry.date;
      const dateAttr = isValidDateString(entry.date)
        ? `data-date="${entry.date}"`
        : "";
      const clickableClass = isValidDateString(entry.date) ? "usage-date" : "";
      const tabIndex = isValidDateString(entry.date) ? 'tabindex="0"' : "";
      const ariaLabel = isValidDateString(entry.date)
        ? `aria-label="Navigate to ${label} in calendar"`
        : "";
      // Check if this specific entry is approved
      const correspondingFullEntry = fullEntries.find(
        (e) => e.date === entry.date && e.type === entryType,
      );
      const isApproved =
        correspondingFullEntry && correspondingFullEntry.approved_by !== null;
      const approvedClass = isApproved ? " approved" : "";
      return `<li><span class="${clickableClass}${approvedClass}" ${dateAttr} ${tabIndex} ${ariaLabel}>${label}</span> <span>${entry.hours.toFixed(1)} hours</span></li>`;
    })
    .join("");

  const list = rows
    ? `<ul class="usage-list">${rows}</ul>`
    : `<div class="empty">No entries recorded.</div>`;

  return `
    <div class="usage-section">
      <div class="usage-title">Dates Used <span class="usage-help">(click dates to view in calendar)</span></div>
      ${list}
    </div>
  `;
}

/**
 * Renders the standard bucket card body (Allowed / Used / Remaining + toggle + usage).
 * @param options.showNegativeFormatting - If false, remaining never gets negative-balance class (Jury Duty card)
 */
export function renderBucketBody(options: {
  data: { allowed: number; used: number; remaining: number };
  entries: UsageEntry[];
  expanded: boolean;
  entryType: string;
  fullEntries: PTOEntry[];
  showNegativeFormatting?: boolean;
}): string {
  const {
    data,
    entries,
    expanded,
    entryType,
    fullEntries,
    showNegativeFormatting = true,
  } = options;

  const hasEntries = entries && entries.length > 0;

  // Check if all entries of this type are approved
  const typeEntries = fullEntries.filter((e) => e.type === entryType);
  const allApproved =
    typeEntries.length > 0 && typeEntries.every((e) => e.approved_by !== null);
  const approvedClass = allApproved ? " approved" : "";

  let remainingDisplay: string;
  let remainingClass = "";
  if (showNegativeFormatting && data.remaining < 0) {
    remainingClass = "negative-balance";
    remainingDisplay = `-${Math.abs(data.remaining).toFixed(2)}`;
  } else {
    remainingDisplay = data.remaining.toFixed(2);
  }

  return `
    <div class="row"><span class="label">Allowed</span><span>${data.allowed} hours</span></div>
    <div class="row"><span class="label${approvedClass}">Used</span><span>${data.used.toFixed(2)} hours</span></div>
    <div class="row"><span class="label">Remaining</span><span class="${remainingClass}">${remainingDisplay} hours</span></div>
    ${renderToggleButton(expanded, hasEntries)}
    ${renderUsageList(entries, expanded, entryType, fullEntries)}
  `;
}
