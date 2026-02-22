/**
 * PTO type configuration constants used across components and tests.
 */
export const PTO_TYPES = [
  {
    label: "PTO",
    attr: "pto-hours",
    cssClass: "summary-pto",
    deltaKey: "PTO",
  },
  {
    label: "Sick",
    attr: "sick-hours",
    cssClass: "summary-sick",
    deltaKey: "Sick",
  },
  {
    label: "Bereavement",
    attr: "bereavement-hours",
    cssClass: "summary-bereavement",
    deltaKey: "Bereavement",
  },
  {
    label: "Jury Duty",
    attr: "jury-duty-hours",
    cssClass: "summary-jury-duty",
    deltaKey: "Jury Duty",
  },
] as const;
