/**
 * @deprecated This file is retained for reference only.
 * All PTO card components have been migrated to BaseComponent.
 *
 * Shared CSS → utils/pto-card-css.ts (CARD_CSS)
 * Shared helpers → utils/pto-card-helpers.ts (monthNames, renderCardShell, etc.)
 * Base class → base-component.ts (BaseComponent)
 */

// Re-export monthNames for any remaining consumers
/** @deprecated Use `MONTH_NAMES` from `shared/businessRules.js` instead. */
export { monthNames } from "./pto-card-helpers.js";
