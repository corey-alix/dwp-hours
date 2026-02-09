import { querySingle } from "../test-utils.js";
import {
  PtoAccrualCard,
  PtoBereavementCard,
  PtoEmployeeInfoCard,
  PtoJuryDutyCard,
  PtoSickCard,
  PtoSummaryCard,
} from "./index.js";
import { today } from "../../../shared/dateUtils.js";

// API response data
const ptoStatus = {
  employeeId: 1,
  hireDate: "2020-01-14",
  annualAllocation: 96,
  availablePTO: 96,
  usedPTO: 40,
  carryoverFromPreviousYear: 40,
  monthlyAccruals: [
    {
      month: 1,
      hours: 8.091954022988507,
    },
    {
      month: 2,
      hours: 7.35632183908046,
    },
    {
      month: 3,
      hours: 8.091954022988507,
    },
    {
      month: 4,
      hours: 8.091954022988507,
    },
    {
      month: 5,
      hours: 7.724137931034482,
    },
    {
      month: 6,
      hours: 8.091954022988507,
    },
    {
      month: 7,
      hours: 8.459770114942529,
    },
    {
      month: 8,
      hours: 7.724137931034482,
    },
    {
      month: 9,
      hours: 8.091954022988507,
    },
    {
      month: 10,
      hours: 8.091954022988507,
    },
    {
      month: 11,
      hours: 7.724137931034482,
    },
    {
      month: 12,
      hours: 8.459770114942529,
    },
  ],
  nextRolloverDate: "2027-01-01",
  sickTime: {
    allowed: 24,
    used: 24,
    remaining: 0,
  },
  ptoTime: {
    allowed: 136,
    used: 40,
    remaining: 96,
  },
  bereavementTime: {
    allowed: 40,
    used: 24,
    remaining: 16,
  },
  juryDutyTime: {
    allowed: 40,
    used: 80,
    remaining: -40,
  },
};

const ptoEntries = [
  {
    date: "2026-03-02",
    type: "PTO",
    hours: 4,
  },
  {
    date: "2026-03-03",
    type: "PTO",
    hours: 4,
  },
  {
    date: "2026-03-04",
    type: "PTO",
    hours: 4,
  },
  {
    date: "2026-03-05",
    type: "PTO",
    hours: 4,
  },
  {
    date: "2026-02-24",
    type: "PTO",
    hours: 8,
  },
  {
    date: "2026-02-22",
    type: "PTO",
    hours: 8,
  },
  {
    date: "2026-02-20",
    type: "PTO",
    hours: 8,
  },
  {
    date: "2026-02-16",
    type: "Sick",
    hours: 8,
  },
  {
    date: "2026-02-14",
    type: "Sick",
    hours: 8,
  },
  {
    date: "2026-02-12",
    type: "Sick",
    hours: 8,
  },
  // Bereavement time: January 21-23
  {
    date: "2026-01-21",
    type: "Bereavement",
    hours: 8,
  },
  {
    date: "2026-01-22",
    type: "Bereavement",
    hours: 8,
  },
  {
    date: "2026-01-23",
    type: "Bereavement",
    hours: 8,
  },
  // Jury duty: July 20-31
  {
    date: "2026-07-20",
    type: "Jury Duty",
    hours: 8,
  },
  {
    date: "2026-07-21",
    type: "Jury Duty",
    hours: 8,
  },
  {
    date: "2026-07-22",
    type: "Jury Duty",
    hours: 8,
  },
  {
    date: "2026-07-23",
    type: "Jury Duty",
    hours: 8,
  },
  {
    date: "2026-07-24",
    type: "Jury Duty",
    hours: 8,
  },
  {
    date: "2026-07-27",
    type: "Jury Duty",
    hours: 8,
  },
  {
    date: "2026-07-28",
    type: "Jury Duty",
    hours: 8,
  },
  {
    date: "2026-07-29",
    type: "Jury Duty",
    hours: 8,
  },
  {
    date: "2026-07-30",
    type: "Jury Duty",
    hours: 8,
  },
  {
    date: "2026-07-31",
    type: "Jury Duty",
    hours: 8,
  },
];

// Computed values
const currentYear = 2026;

// Calculate monthly usage from PTO entries
const monthlyUsage: { month: number; hours: number }[] = [];
for (let month = 1; month <= 12; month++) {
  const monthEntries = ptoEntries.filter((entry) => {
    const entryMonth = parseInt(entry.date.substring(5, 7));
    return entryMonth === month;
  });
  const hours = monthEntries.reduce((sum, entry) => sum + entry.hours, 0);
  monthlyUsage.push({ month, hours });
}

// Convert simplified PTO entries to full PTOEntry format for the component
const fullPtoEntries = ptoEntries.map((entry, index) => ({
  id: index + 1,
  employeeId: 1,
  date: entry.date,
  type: entry.type as "PTO" | "Sick" | "Bereavement" | "Jury Duty",
  hours: entry.hours,
  createdAt: today(),
}));

// Filter entries by type
const sickEntries = ptoEntries
  .filter((e) => e.type === "Sick")
  .map((e) => ({
    date: e.date,
    hours: e.hours,
  }));

const bereavementEntries = ptoEntries
  .filter((e) => e.type === "Bereavement")
  .map((e) => ({
    date: e.date,
    hours: e.hours,
  }));

const juryEntries = ptoEntries
  .filter((e) => e.type === "Jury Duty")
  .map((e) => ({
    date: e.date,
    hours: e.hours,
  }));

// Helper function to format YYYY-MM-DD to MM/DD/YYYY
function formatDateForDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${parseInt(month)}/${parseInt(day)}/${year}`;
}

export function playground(): void {
  console.log("Starting PTO dashboard playground test with API data...");

  const summary = querySingle<PtoSummaryCard>("pto-summary-card");
  const accrual = querySingle<PtoAccrualCard>("pto-accrual-card");
  const sick = querySingle<PtoSickCard>("pto-sick-card");
  const bereavement = querySingle<PtoBereavementCard>("pto-bereavement-card");
  const jury = querySingle<PtoJuryDutyCard>("pto-jury-duty-card");
  const info = querySingle<PtoEmployeeInfoCard>("pto-employee-info-card");

  summary.summary = {
    annualAllocation: ptoStatus.annualAllocation,
    availablePTO: ptoStatus.availablePTO,
    usedPTO: ptoStatus.usedPTO,
    carryoverFromPreviousYear: ptoStatus.carryoverFromPreviousYear,
  };

  accrual.monthlyAccruals = ptoStatus.monthlyAccruals;
  accrual.monthlyUsage = monthlyUsage;
  console.log("Setting ptoEntries on accrual");
  accrual.ptoEntries = fullPtoEntries;
  console.log("Set ptoEntries");
  accrual.calendarYear = currentYear;

  sick.bucket = ptoStatus.sickTime;
  sick.usageEntries = sickEntries;

  bereavement.bucket = ptoStatus.bereavementTime;
  bereavement.usageEntries = bereavementEntries;

  jury.bucket = ptoStatus.juryDutyTime;
  jury.usageEntries = juryEntries;

  info.info = {
    hireDate: formatDateForDisplay(ptoStatus.hireDate),
    nextRolloverDate: formatDateForDisplay(ptoStatus.nextRolloverDate),
  };

  console.log("PTO dashboard playground test initialized with API data");
}
