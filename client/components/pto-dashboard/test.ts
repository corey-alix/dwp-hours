import { querySingle } from "../test-utils.js";
import {
  PtoAccrualCard,
  PtoBereavementCard,
  PtoEmployeeInfoCard,
  PtoJuryDutyCard,
  PtoPtoCard,
  PtoSickCard,
  PtoSummaryCard,
} from "./index.js";
import { today } from "../../../shared/dateUtils.js";
import { seedPTOEntries, seedEmployees } from "../../../shared/seedData.js";

// Get employee data
const employee = seedEmployees.find(
  (e) => e.identifier === "john.doe@gmail.com",
)!;

// Filter seed data for employee 1 and 2026 entries
const allPtoEntries = seedPTOEntries
  .filter((entry) => entry.employee_id === 1 && entry.date.startsWith("2026-"))
  .map((entry) => ({
    date: entry.date,
    type: entry.type,
    hours: entry.hours,
  }));

// Get approved entries for bucket usage
const approvedEntries = seedPTOEntries.filter(
  (entry) =>
    entry.employee_id === 1 &&
    entry.date.startsWith("2026-") &&
    entry.approved_by !== null,
);

// Compute used hours by type from approved entries
const ptoUsed = approvedEntries
  .filter((e) => e.type === "PTO")
  .reduce((sum, e) => sum + e.hours, 0);
const sickUsed = approvedEntries
  .filter((e) => e.type === "Sick")
  .reduce((sum, e) => sum + e.hours, 0);
const bereavementUsed = approvedEntries
  .filter((e) => e.type === "Bereavement")
  .reduce((sum, e) => sum + e.hours, 0);
const juryUsed = approvedEntries
  .filter((e) => e.type === "Jury Duty")
  .reduce((sum, e) => sum + e.hours, 0);

// Simple PTO status derived from seed data
const annualAllocation = 96; // Based on pto_rate * 135.6 hours/year
const carryover = employee.carryover_hours;
const availablePTO = annualAllocation + carryover - ptoUsed;

const ptoStatus = {
  employeeId: 1,
  hireDate: employee.hire_date,
  annualAllocation,
  availablePTO,
  usedPTO: ptoUsed,
  carryoverFromPreviousYear: carryover,
  monthlyAccruals: [
    { month: 1, hours: 8.1 },
    { month: 2, hours: 7.4 },
    { month: 3, hours: 8.1 },
    { month: 4, hours: 8.1 },
    { month: 5, hours: 7.7 },
    { month: 6, hours: 8.1 },
    { month: 7, hours: 8.5 },
    { month: 8, hours: 7.7 },
    { month: 9, hours: 8.1 },
    { month: 10, hours: 8.1 },
    { month: 11, hours: 7.7 },
    { month: 12, hours: 8.5 },
  ],
  nextRolloverDate: "2027-01-01",
  sickTime: {
    allowed: 24,
    used: sickUsed,
    remaining: 24 - sickUsed,
  },
  ptoTime: {
    allowed: annualAllocation + carryover,
    used: ptoUsed,
    remaining: availablePTO,
  },
  bereavementTime: {
    allowed: 40,
    used: bereavementUsed,
    remaining: 40 - bereavementUsed,
  },
  juryDutyTime: {
    allowed: 40,
    used: juryUsed,
    remaining: 40 - juryUsed,
  },
};

// Use all entries for the calendar display (including pending)
const ptoEntries = allPtoEntries;

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
const fullPtoEntries = ptoEntries.map((entry, index) => {
  // Find the corresponding entry in seed data to get approval status
  const seedEntry = seedPTOEntries.find(
    (se) =>
      se.date === entry.date && se.type === entry.type && se.employee_id === 1,
  );
  return {
    id: index + 1,
    employeeId: 1,
    date: entry.date,
    type: entry.type as "PTO" | "Sick" | "Bereavement" | "Jury Duty",
    hours: entry.hours,
    createdAt: today(),
    approved_by: seedEntry?.approved_by || null,
  };
});

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
  const pto = querySingle<PtoPtoCard>("pto-pto-card");
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

  // Set properties that were previously inline attributes
  accrual.setAttribute("request-mode", "true");
  accrual.setAttribute("annual-allocation", "96");

  pto.bucket = ptoStatus.ptoTime;
  pto.usageEntries = ptoEntries;
  pto.fullPtoEntries = fullPtoEntries.filter((e) => e.type === "PTO");

  sick.bucket = ptoStatus.sickTime;
  sick.usageEntries = sickEntries;
  sick.fullPtoEntries = fullPtoEntries.filter((e) => e.type === "Sick");

  bereavement.bucket = ptoStatus.bereavementTime;
  bereavement.usageEntries = bereavementEntries;
  bereavement.fullPtoEntries = fullPtoEntries.filter(
    (e) => e.type === "Bereavement",
  );

  jury.bucket = ptoStatus.juryDutyTime;
  jury.usageEntries = juryEntries;
  jury.fullPtoEntries = fullPtoEntries.filter((e) => e.type === "Jury Duty");

  info.info = {
    hireDate: formatDateForDisplay(ptoStatus.hireDate),
    nextRolloverDate: formatDateForDisplay(ptoStatus.nextRolloverDate),
  };

  // Set up PTO request submission event handling
  const handlePtoRequestSubmit = (event: CustomEvent) => {
    console.log("PTO Request Submit Event Received:", event);
    console.log("Event detail:", event.detail);
    const { requests } = event.detail;
    console.log("Requests:", requests);

    const timestamp = new Date().toLocaleString();
    const submissionText = `
[${timestamp}] PTO Request Submitted:
${requests.map((req: any) => `  - ${req.date}: ${req.hours} hours (${req.type})`).join("\n")}

Total Requests: ${requests.length}
`;

    console.log(submissionText);

    // Visual feedback - create a temporary log element if it doesn't exist
    let logElement = document.getElementById("submission-log");
    if (!logElement) {
      logElement = document.createElement("div");
      logElement.id = "submission-log";
      logElement.style.cssText = `
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        padding: 12px;
        margin: 16px 0;
        font-family: monospace;
        white-space: pre-wrap;
      `;
      logElement.innerHTML =
        "<strong>PTO Request Submissions:</strong>\n(No submissions yet)";
      document.body.appendChild(logElement);
    }

    logElement.textContent += submissionText;

    // Visual feedback
    logElement.style.background = "#d4edda";
    logElement.style.borderColor = "#c3e6cb";
    setTimeout(() => {
      logElement!.style.background = "#f8f9fa";
      logElement!.style.borderColor = "#dee2e6";
    }, 2000);
  };

  // Listen for PTO request submissions from the accrual card
  document.addEventListener(
    "pto-request-submit",
    handlePtoRequestSubmit as EventListener,
  );

  console.log("Event listener added for pto-request-submit");
  console.log("PTO dashboard playground test initialized with API data");
  console.log(
    "Instructions: Select a month, choose PTO type, paint cells, edit hours, submit",
  );
}
