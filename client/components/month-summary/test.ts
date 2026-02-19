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

  console.log("Month Summary playground initialized");
}
