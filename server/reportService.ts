/**
 * Report Data Aggregation Service
 *
 * Assembles per-employee report data for PTO report generation.
 * Queries employees, PTO entries, monthly hours, acknowledgements,
 * and computes PTO calculation rows using existing business logic.
 */

import { DataSource, Not } from "typeorm";
import { Employee } from "./entities/Employee.js";
import { PtoEntry } from "./entities/PtoEntry.js";
import { MonthlyHours } from "./entities/MonthlyHours.js";
import { Acknowledgement } from "./entities/Acknowledgement.js";
import { AdminAcknowledgement } from "./entities/AdminAcknowledgement.js";
import { getWorkDays } from "./workDays.js";
import { formatDate } from "../shared/dateUtils.js";
import {
  getEffectivePtoRate,
  computeAnnualAllocation,
  MONTH_NAMES,
  BUSINESS_RULES_CONSTANTS,
  SYS_ADMIN_EMPLOYEE_ID,
} from "../shared/businessRules.js";
import { calculateUsedPTO } from "./ptoCalculations.js";

// ── Report Data Interfaces ──

export interface ReportPtoEntry {
  date: string;
  hours: number;
  type: string;
  approvedBy: string | null;
}

export interface ReportMonthlyHours {
  month: string;
  hoursWorked: number;
}

export interface ReportAcknowledgement {
  month: string;
  acknowledgedAt: string;
}

export interface ReportAdminAcknowledgement {
  month: string;
  adminName: string;
  acknowledgedAt: string;
}

export interface ReportPtoCalculationRow {
  month: number;
  monthName: string;
  workDays: number;
  dailyRate: number;
  accruedHours: number;
  carryover: number;
  subtotal: number;
  usedHours: number;
  remainingBalance: number;
}

export interface EmployeeReportData {
  id: number;
  name: string;
  identifier: string;
  hireDate: string;
  ptoRate: number;
  carryoverHours: number;
  ptoEntries: ReportPtoEntry[];
  monthlyHours: ReportMonthlyHours[];
  acknowledgements: ReportAcknowledgement[];
  adminAcknowledgements: ReportAdminAcknowledgement[];
  ptoCalculation: ReportPtoCalculationRow[];
}

export interface ReportData {
  year: number;
  generatedAt: string;
  employees: EmployeeReportData[];
}

// ── PTO Calculation Logic ──

/**
 * Build the 12-row PTO calculation table for an employee in a given year.
 * Each row shows: work days, daily rate, accrued, carryover, subtotal, used, remaining.
 */
function buildPtoCalculationRows(
  employee: {
    hire_date: string;
    carryover_hours: number;
  },
  ptoEntries: { date: string; hours: number; type: string }[],
  year: number,
): ReportPtoCalculationRow[] {
  const rows: ReportPtoCalculationRow[] = [];
  let runningBalance = employee.carryover_hours;

  for (let month = 1; month <= 12; month++) {
    const workDays = getWorkDays(year, month);

    // Effective rate at end of this month
    const lastDay = month === 2 ? 28 : [4, 6, 9, 11].includes(month) ? 30 : 31;
    const monthEnd = formatDate(year, month, lastDay);
    const tier = getEffectivePtoRate(employee.hire_date, monthEnd);
    const dailyRate = tier.dailyRate;

    const accruedHours = dailyRate * workDays;
    const carryover = runningBalance;
    const subtotal = accruedHours + carryover;

    // PTO hours used this month (type "PTO" only — sick/bereavement/jury are separate)
    const monthStr = formatDate(year, month, 1).slice(0, 7); // "YYYY-MM"
    const usedHours = ptoEntries
      .filter((e) => e.type === "PTO" && e.date.startsWith(monthStr))
      .reduce((sum, e) => sum + e.hours, 0);

    const remainingBalance = subtotal - usedHours;

    rows.push({
      month,
      monthName: MONTH_NAMES[month - 1],
      workDays,
      dailyRate,
      accruedHours: Math.round(accruedHours * 100) / 100,
      carryover: Math.round(carryover * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      usedHours,
      remainingBalance: Math.round(remainingBalance * 100) / 100,
    });

    runningBalance = remainingBalance;
  }

  return rows;
}

// ── Data Aggregation ──

/**
 * Assemble the full report dataset for all employees in a given year.
 */
export async function assembleReportData(
  dataSource: DataSource,
  year: number,
): Promise<ReportData> {
  const employeeRepo = dataSource.getRepository(Employee);
  const ptoEntryRepo = dataSource.getRepository(PtoEntry);
  const monthlyHoursRepo = dataSource.getRepository(MonthlyHours);
  const ackRepo = dataSource.getRepository(Acknowledgement);
  const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);

  // Fetch all employees sorted by name (exclude sys-admin)
  const employees = await employeeRepo.find({
    where: { id: Not(SYS_ADMIN_EMPLOYEE_ID) },
    order: { name: "ASC" },
  });

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const employeeReports: EmployeeReportData[] = [];

  for (const emp of employees) {
    // PTO entries for this employee in the target year
    const ptoEntries = await ptoEntryRepo
      .createQueryBuilder("pto")
      .leftJoinAndSelect("pto.approvedBy", "approver")
      .where("pto.employee_id = :empId", { empId: emp.id })
      .andWhere("pto.date >= :start AND pto.date <= :end", {
        start: yearStart,
        end: yearEnd,
      })
      .orderBy("pto.date", "ASC")
      .getMany();

    // Monthly hours
    const monthlyHours = await monthlyHoursRepo.find({
      where: { employee_id: emp.id },
      order: { month: "ASC" },
    });

    // Filter monthly hours to target year
    const yearMonthlyHours = monthlyHours.filter((mh) =>
      mh.month.startsWith(`${year}-`),
    );

    // Employee acknowledgements for target year
    const acks = await ackRepo.find({
      where: { employee_id: emp.id },
      order: { month: "ASC" },
    });
    const yearAcks = acks.filter((a) => a.month.startsWith(`${year}-`));

    // Admin acknowledgements for target year
    const adminAcks = await adminAckRepo.find({
      where: { employee_id: emp.id },
      relations: ["admin"],
      order: { month: "ASC" },
    });
    const yearAdminAcks = adminAcks.filter((a) =>
      a.month.startsWith(`${year}-`),
    );

    // Normalize hire_date (entity stores it as Date object)
    const hireDate =
      emp.hire_date instanceof Date
        ? emp.hire_date.toISOString().split("T")[0]
        : String(emp.hire_date);

    // Build PTO calculation rows
    const ptoCalcEntries = ptoEntries.map((e) => ({
      date: e.date,
      hours: e.hours,
      type: e.type,
    }));
    const ptoCalculation = buildPtoCalculationRows(
      { hire_date: hireDate, carryover_hours: emp.carryover_hours },
      ptoCalcEntries,
      year,
    );

    employeeReports.push({
      id: emp.id,
      name: emp.name,
      identifier: emp.identifier,
      hireDate,
      ptoRate: emp.pto_rate,
      carryoverHours: emp.carryover_hours,
      ptoEntries: ptoEntries.map((e) => ({
        date: e.date,
        hours: e.hours,
        type: e.type,
        approvedBy: e.approvedBy?.name ?? null,
      })),
      monthlyHours: yearMonthlyHours.map((mh) => ({
        month: mh.month,
        hoursWorked: mh.hours_worked,
      })),
      acknowledgements: yearAcks.map((a) => ({
        month: a.month,
        acknowledgedAt:
          a.acknowledged_at instanceof Date
            ? a.acknowledged_at.toISOString()
            : String(a.acknowledged_at),
      })),
      adminAcknowledgements: yearAdminAcks.map((a) => ({
        month: a.month,
        adminName: a.admin?.name ?? `Admin #${a.admin_id}`,
        acknowledgedAt:
          a.acknowledged_at instanceof Date
            ? a.acknowledged_at.toISOString()
            : String(a.acknowledged_at),
      })),
      ptoCalculation,
    });
  }

  return {
    year,
    generatedAt: new Date().toISOString(),
    employees: employeeReports,
  };
}
