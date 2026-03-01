import { querySingle } from "../test-utils.js";
import { MonthSummary } from "./index.js";

export function playground(): void {
  const component = querySingle<MonthSummary>("month-summary");
  const testOutput = querySingle("#test-output");

  // Set initial values
  component.ptoHours = 16;
  component.sickHours = 8;
  component.bereavementHours = 0;
  component.juryDutyHours = 0;

  testOutput.textContent = "Loaded month-summary with PTO=16, Sick=8";

  // Add delta toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "Toggle Deltas";
  toggleBtn.style.margin = "8px";
  let showDeltas = false;
  toggleBtn.addEventListener("click", () => {
    showDeltas = !showDeltas;
    if (showDeltas) {
      component.deltas = { PTO: 8, Sick: -4, Bereavement: 4, "Jury Duty": 0 };
      testOutput.textContent =
        "Deltas applied: PTO +8, Sick -4, Bereavement +4";
    } else {
      component.deltas = {};
      testOutput.textContent = "Deltas cleared";
    }
  });
  document.body.insertBefore(toggleBtn, component);

  // Add balance display toggle button
  const balanceBtn = document.createElement("button");
  balanceBtn.textContent = "Toggle Balances";
  balanceBtn.style.margin = "8px";
  let showBalances = false;
  balanceBtn.addEventListener("click", () => {
    showBalances = !showBalances;
    if (showBalances) {
      component.balances = {
        PTO: 64,
        Sick: 24,
        Bereavement: 40,
        "Jury Duty": 40,
      };
      testOutput.textContent =
        "Balances applied: PTO 64, Sick 24, Bereavement 40, Jury Duty 40 (shows available-scheduled)";
    } else {
      component.balances = {};
      testOutput.textContent = "Balances cleared";
    }
  });
  document.body.insertBefore(balanceBtn, component);

  // Add zero values button
  const zeroBtn = document.createElement("button");
  zeroBtn.textContent = "Set All Zero";
  zeroBtn.style.margin = "8px";
  zeroBtn.addEventListener("click", () => {
    component.ptoHours = 0;
    component.sickHours = 0;
    component.bereavementHours = 0;
    component.juryDutyHours = 0;
    component.deltas = {};
    testOutput.textContent = "All values set to 0";
  });
  document.body.insertBefore(zeroBtn, component);

  // Add interactive mode toggle button
  const interactiveBtn = document.createElement("button");
  interactiveBtn.textContent = "Toggle Interactive";
  interactiveBtn.style.margin = "8px";
  interactiveBtn.addEventListener("click", () => {
    component.interactive = !component.interactive;
    if (component.interactive && !component.activeType) {
      component.activeType = "PTO";
    }
    testOutput.textContent = `Interactive: ${component.interactive}, Active type: ${component.activeType}`;
  });
  document.body.insertBefore(interactiveBtn, component);

  // Listen for pto-type-changed events
  component.addEventListener("pto-type-changed", ((e: CustomEvent) => {
    testOutput.textContent = `PTO type changed to: ${e.detail.type}`;
  }) as EventListener);

  console.log("Month Summary playground initialized");
}
