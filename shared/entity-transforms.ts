// Entity transformation utilities
// Convert between database entities (TypeORM) and API models (shared/api-models)

import { Employee as EntityEmployee } from "../server/entities/Employee.js";
import { PtoEntry as EntityPtoEntry } from "../server/entities/PtoEntry.js";
import { MonthlyHours as EntityMonthlyHours } from "../server/entities/MonthlyHours.js";
import { Acknowledgement as EntityAcknowledgement } from "../server/entities/Acknowledgement.js";
import { AdminAcknowledgement as EntityAdminAcknowledgement } from "../server/entities/AdminAcknowledgement.js";

import {
  Employee,
  PTOEntry,
  MonthlyHours,
  Acknowledgement,
  AdminAcknowledgement,
} from "./api-models.js";
import { dateToString, dateTimeToISOString } from "./dateUtils.js";

export function serializeEmployee(entity: EntityEmployee): Employee {
  return {
    id: entity.id,
    name: entity.name,
    identifier: entity.identifier,
    ptoRate: entity.pto_rate,
    carryoverHours: entity.carryover_hours,
    hireDate:
      entity.hire_date instanceof Date
        ? dateToString(entity.hire_date)
        : entity.hire_date,
    role: entity.role,
    hash: entity.hash || undefined,
  };
}

export function serializePTOEntry(entity: EntityPtoEntry): PTOEntry {
  return {
    id: entity.id,
    employeeId: entity.employee_id,
    date: entity.date,
    type: entity.type,
    hours: entity.hours,
    createdAt:
      entity.created_at instanceof Date
        ? dateTimeToISOString(entity.created_at)
        : new Date(entity.created_at).toISOString(),
    approved_by: entity.approved_by,
    employee: entity.employee ? serializeEmployee(entity.employee) : undefined,
  };
}

export function serializeMonthlyHours(
  entity: EntityMonthlyHours,
): MonthlyHours {
  return {
    id: entity.id,
    employeeId: entity.employee_id,
    month: entity.month,
    hoursWorked: entity.hours_worked,
    submittedAt: dateTimeToISOString(entity.submitted_at),
    employee: entity.employee ? serializeEmployee(entity.employee) : undefined,
  };
}

export function serializeAcknowledgement(
  entity: EntityAcknowledgement,
): Acknowledgement {
  return {
    id: entity.id,
    employeeId: entity.employee_id,
    month: entity.month,
    acknowledgedAt: dateTimeToISOString(entity.acknowledged_at),
    employee: entity.employee ? serializeEmployee(entity.employee) : undefined,
  };
}

export function serializeAdminAcknowledgement(
  entity: EntityAdminAcknowledgement,
): AdminAcknowledgement {
  return {
    id: entity.id,
    employeeId: entity.employee_id,
    month: entity.month,
    adminId: entity.admin_id,
    acknowledgedAt: dateTimeToISOString(entity.acknowledged_at),
    employee: entity.employee ? serializeEmployee(entity.employee) : undefined,
    admin: entity.admin ? serializeEmployee(entity.admin) : undefined,
  };
}
