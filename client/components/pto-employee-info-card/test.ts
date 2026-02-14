import { querySingle } from "../test-utils.js";
import type { PtoEmployeeInfoCard } from "./index.js";
import { seedEmployees } from "../../../shared/seedData.js";

export function playground() {
  console.log("Starting PTO Employee Info Card test...");

  const card = querySingle<PtoEmployeeInfoCard>("pto-employee-info-card");

  // Info data from seedData
  const employee = seedEmployees.find(
    (e) => e.identifier === "john.doe@gmail.com",
  )!;
  card.info = {
    hireDate: employee.hire_date,
    nextRolloverDate: "2027-01-01", // Next year rollover
  };

  querySingle("#test-output").textContent = "Employee info data set.";
}
