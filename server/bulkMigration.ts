import { DataSource } from "typeorm";
import { Employee, MonthlyHours } from "../server/entities/index.js";
import { PtoEntryDAL } from "../server/dal/PtoEntryDAL.js";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { dateToString, isValidDateString } from "../shared/dateUtils.js";
import {
  VALIDATION_MESSAGES,
  PTOType,
  validateDateString,
  validatePTOType,
  validateHours,
} from "../shared/businessRules.js";

export interface BulkMigrationData {
  employeeEmail: string;
  monthlyHours?: Array<{
    month: string;
    hours: number;
  }>;
  ptoEntries?: Array<{
    date: string;
    hours: number;
    type: string;
  }>;
}

export interface FileMigrationData {
  employeeEmail: string;
  filePath: string;
}

export interface BulkMigrationResult {
  message: string;
  employeeId: number;
  summary: {
    monthlyHoursInserted: number;
    monthlyHoursSkipped: number;
    ptoEntriesInserted: number;
    ptoEntriesSkipped: number;
  };
  warnings: string[];
}

// Color to PTO type mapping based on the legend
const PTO_COLOR_MAP: Record<string, PTOType> = {
  FF00B050: "Sick", // green
  FFFFFF00: "PTO", // yellow
  FFFFC000: "PTO", // orange-yellow (partial PTO)
  FF00B0F0: "PTO", // blue (planned PTO)
  FBFBFBFB: "Bereavement", // gray
  FFFF0000: "Jury Duty", // red
};

async function parseExcelFile(
  filePath: string,
): Promise<{ data: BulkMigrationData; warnings: string[] }> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found at ${filePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  // Extract employee email from filename (assuming format "Name Year.xlsx")
  const fileName = path.basename(filePath, ".xlsx");
  const namePart = fileName.replace(" 2025", "").replace(" ", "").toLowerCase();
  const employeeEmail = `${namePart}@gmail.com`; // Default assumption

  const monthlyHours: Array<{ month: string; hours: number }> = [];
  const ptoEntries: Array<{ date: string; hours: number; type: string }> = [];
  const warnings: string[] = [];

  // Parse monthly hours from PTO calculation section (D42-W53)
  // Months are in column B (2), work days in D (4), used hours in S (19)
  for (let row = 42; row <= 53; row++) {
    const monthCell = worksheet.getCell(row, 2); // Column B
    const workDaysCell = worksheet.getCell(row, 4); // Column D

    const month = monthCell.value?.toString() || "";
    const workDaysValue = workDaysCell.value;
    let workDays = 0;
    if (typeof workDaysValue === "number") {
      workDays = workDaysValue;
    } else if (
      typeof workDaysValue === "object" &&
      workDaysValue &&
      "result" in workDaysValue
    ) {
      workDays = parseFloat(workDaysValue.result?.toString() || "0") || 0;
    } else {
      workDays = parseFloat(workDaysValue?.toString() || "0") || 0;
    }

    if (month && workDays > 0) {
      // Validate work days
      if (workDays < 0 || workDays > 31) {
        warnings.push(`Invalid work days for ${month}: ${workDays}`);
        continue;
      }

      // Calculate monthly hours worked (assuming 8 hours per day)
      const hoursWorked = workDays * 8;
      const monthIndex = row - 42; // 0-based
      const monthStr = `${new Date().getFullYear()}-${String(monthIndex + 1).padStart(2, "0")}`;

      monthlyHours.push({
        month: monthStr,
        hours: hoursWorked,
      });
    }
  }

  // Parse calendar for PTO entries
  // Calendar is in B6:X37
  // Month headers in row 4, spanning 3 columns each
  const monthPositions = [
    { name: "January", startCol: 4, row: 4 },
    { name: "February", startCol: 4, row: 13 },
    { name: "March", startCol: 4, row: 22 },
    { name: "April", startCol: 4, row: 31 },
    { name: "May", startCol: 12, row: 4 },
    { name: "June", startCol: 12, row: 13 },
    { name: "July", startCol: 12, row: 22 },
    { name: "August", startCol: 12, row: 31 },
    { name: "September", startCol: 20, row: 4 },
    { name: "October", startCol: 20, row: 13 },
    { name: "November", startCol: 20, row: 22 },
    { name: "December", startCol: 20, row: 31 },
  ];

  const currentYear = 2025; // From filename

  for (const monthInfo of monthPositions) {
    const monthIndex = new Date(
      `${monthInfo.name} 1, ${currentYear}`,
    ).getMonth();
    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      // Calculate which cell this day is in
      const weekOfMonth = Math.floor((day - 1) / 7);
      const dayOfWeek = new Date(currentYear, monthIndex, day).getDay();

      // Adjust for the layout - each month spans 3 columns, 7 rows per week
      const colOffset = dayOfWeek;
      const rowOffset = weekOfMonth * 7 + 6; // Start at row 6

      const cellRow = monthInfo.row + rowOffset;
      const cellCol = monthInfo.startCol + colOffset;

      if (cellRow > 37 || cellCol > 24) continue; // Out of calendar bounds

      const cell = worksheet.getCell(cellRow, cellCol);
      if (cell.value == day) {
        // Only check cells with the correct day number
        // Check for PTO color
        const fill = cell.fill as any; // Cast to any to access fgColor
        if (fill && fill.fgColor) {
          const color = fill.fgColor.argb || fill.fgColor.rgb;
          if (color) {
            const normalizedColor = color.replace(/^FF/, ""); // Remove alpha
            const ptoType = PTO_COLOR_MAP[color.toUpperCase()];
            if (ptoType) {
              const dateStr = dateToString(
                new Date(currentYear, monthIndex, day),
              );

              // Validate date
              const dateError = validateDateString(dateStr);
              if (dateError) {
                warnings.push(
                  `Invalid date ${dateStr}: ${VALIDATION_MESSAGES[dateError.messageKey as keyof typeof VALIDATION_MESSAGES]}`,
                );
                continue;
              }

              // Validate PTO type
              const typeError = validatePTOType(ptoType);
              if (typeError) {
                warnings.push(
                  `Invalid PTO type ${ptoType} for ${dateStr}: ${VALIDATION_MESSAGES[typeError.messageKey as keyof typeof VALIDATION_MESSAGES]}`,
                );
                continue;
              }

              // Validate hours (assume 8 hours)
              const hoursError = validateHours(8);
              if (hoursError) {
                warnings.push(
                  `Invalid hours for ${dateStr}: ${VALIDATION_MESSAGES[hoursError.messageKey as keyof typeof VALIDATION_MESSAGES]}`,
                );
                continue;
              }

              ptoEntries.push({
                date: dateStr,
                hours: 8, // Assume full day
                type: ptoType,
              });
            }
          }
        }
      }
    }
  }

  return {
    data: {
      employeeEmail,
      monthlyHours,
      ptoEntries,
    },
    warnings,
  };
}

export async function performBulkMigration(
  dataSource: DataSource,
  ptoEntryDAL: PtoEntryDAL,
  log: (message: string) => void,
  today: () => string,
  isValidDateString: (date: string) => boolean,
  data: BulkMigrationData,
): Promise<BulkMigrationResult> {
  const { employeeEmail, monthlyHours, ptoEntries } = data;

  // Validation
  if (
    !employeeEmail ||
    typeof employeeEmail !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeEmail)
  ) {
    throw new Error("Valid employee email is required");
  }

  const employeeRepo = dataSource.getRepository(Employee);
  const monthlyHoursRepo = dataSource.getRepository(MonthlyHours);

  // Find or create employee
  let employee = await employeeRepo.findOne({
    where: { identifier: employeeEmail },
  });
  if (!employee) {
    // Create new employee
    employee = new Employee();
    employee.name = employeeEmail.split("@")[0]; // Use email prefix as name
    employee.identifier = employeeEmail;
    employee.pto_rate = 0.71;
    employee.carryover_hours = 0;
    employee.hire_date = new Date(today());
    employee.role = "Employee";
    await employeeRepo.save(employee);
    log(
      `Created new employee for migration: ${employeeEmail} (ID: ${employee.id})`,
    );
  }

  const warnings: string[] = [];
  let monthlyHoursInserted = 0;
  let monthlyHoursSkipped = 0;
  let ptoEntriesInserted = 0;
  let ptoEntriesSkipped = 0;

  // Process monthly hours
  if (monthlyHours && Array.isArray(monthlyHours)) {
    for (const hourEntry of monthlyHours) {
      try {
        const { month, hours } = hourEntry;
        if (!month || typeof hours !== "number") {
          warnings.push(
            `Skipping invalid monthly hours entry: ${JSON.stringify(hourEntry)}`,
          );
          continue;
        }

        // Parse month (expected format: YYYY-MM)
        const monthStart = month + "-01";
        if (!isValidDateString(monthStart)) {
          warnings.push(`Skipping invalid month date: ${month}`);
          continue;
        }

        // Check if already exists
        const existing = await monthlyHoursRepo.findOne({
          where: { employee_id: employee.id, month: month },
        });

        if (existing) {
          warnings.push(`Monthly hours already exist for ${month}, skipping`);
          monthlyHoursSkipped++;
        } else {
          const newHours = monthlyHoursRepo.create({
            employee_id: employee.id,
            month: month,
            hours_worked: hours,
            submitted_at: new Date(today()),
          });
          await monthlyHoursRepo.save(newHours);
          monthlyHoursInserted++;
        }
      } catch (error) {
        warnings.push(`Error processing monthly hours entry: ${error}`);
      }
    }
  }

  // Process PTO entries
  if (ptoEntries && Array.isArray(ptoEntries)) {
    for (const ptoEntry of ptoEntries) {
      try {
        const { date, hours, type } = ptoEntry;
        if (!date || typeof hours !== "number" || !type) {
          warnings.push(
            `Skipping invalid PTO entry: ${JSON.stringify(ptoEntry)}`,
          );
          continue;
        }

        const result = await ptoEntryDAL.createPtoEntry({
          employeeId: employee.id,
          date,
          hours,
          type,
        });

        if (result.success) {
          ptoEntriesInserted++;
        } else {
          // Check if it's a duplicate error
          const isDuplicate = result.errors.some(
            (err) => err.messageKey === "pto.duplicate",
          );
          if (isDuplicate) {
            warnings.push(
              `PTO entry already exists for ${date} (${type}), skipping`,
            );
            ptoEntriesSkipped++;
          } else {
            warnings.push(
              `Validation failed for PTO entry ${date} (${type}): ${result.errors.map((e) => e.messageKey).join(", ")}`,
            );
          }
        }
      } catch (error) {
        warnings.push(`Error processing PTO entry: ${error}`);
      }
    }
  }

  const summary = {
    monthlyHoursInserted,
    monthlyHoursSkipped,
    ptoEntriesInserted,
    ptoEntriesSkipped,
  };

  log(
    `Bulk migration completed for ${employeeEmail}: ${JSON.stringify(summary)}`,
  );
  if (warnings.length > 0) {
    log(`Warnings: ${warnings.join("; ")}`);
  }

  return {
    message: "Bulk migration completed",
    employeeId: employee.id,
    summary,
    warnings,
  };
}

export async function performFileMigration(
  dataSource: DataSource,
  ptoEntryDAL: PtoEntryDAL,
  log: (message: string) => void,
  today: () => string,
  isValidDateString: (date: string) => boolean,
  data: FileMigrationData,
): Promise<BulkMigrationResult> {
  const { data: parsedData, warnings: parseWarnings } = await parseExcelFile(
    data.filePath,
  );
  // Override employee email if provided
  if (data.employeeEmail) {
    parsedData.employeeEmail = data.employeeEmail;
  }
  const result = await performBulkMigration(
    dataSource,
    ptoEntryDAL,
    log,
    today,
    isValidDateString,
    parsedData,
  );
  // Combine parsing warnings with migration warnings
  result.warnings.unshift(...parseWarnings);
  return result;
}
