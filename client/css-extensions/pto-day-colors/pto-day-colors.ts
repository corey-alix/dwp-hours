/**
 * PTO day-cell color CSS source — single source of truth for calendar day
 * background colors by PTO type. Used by `prior-year-review` and any future
 * calendar component that colour-codes days.
 *
 * Class naming follows the pattern `.type-{TypeName}` where spaces are
 * replaced with hyphens (e.g., "Jury Duty" → `.type-Jury-Duty`).
 */
export const ptoDayColorsCSS = `
  /* ── PTO type background colors ── */

  .type-PTO { background: var(--color-pto-vacation); }

  .type-Sick { background: var(--color-pto-sick); }

  .type-Bereavement { background: var(--color-pto-bereavement); }

  .type-Jury-Duty { background: var(--color-pto-jury-duty); }

  /* ── Inverse text on coloured backgrounds for contrast ── */

  .type-PTO .date,
  .type-PTO .hours,
  .type-Sick .date,
  .type-Sick .hours,
  .type-Bereavement .date,
  .type-Bereavement .hours,
  .type-Jury-Duty .date,
  .type-Jury-Duty .hours {
    color: var(--color-text-inverse, #fff);
  }
`;
