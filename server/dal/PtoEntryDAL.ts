import { DataSource, Repository } from "typeorm";
import { PtoEntry, Employee } from "../entities/index.js";
import {
  PTOType,
  ValidationError,
  validateHours,
  validatePTOType,
  normalizePTOType,
  validateDateString,
  validateAnnualLimits,
  validatePTOBalance,
  BEREAVEMENT_CONSECUTIVE_DAYS_BEFORE_PTO,
  VALIDATION_MESSAGES,
} from "../../shared/businessRules.js";
import { calculatePTOStatus } from "../ptoCalculations.js";
import {
  dateToString,
  parseDate,
  formatDate,
  addDays,
  getDayOfWeek,
} from "../../shared/dateUtils.js";

export interface CreatePtoEntryData {
  employeeId: number;
  date: string;
  hours: number;
  type: string;
}

export interface UpdatePtoEntryData {
  date?: string;
  hours?: number;
  type?: string;
  approved_by?: number | null;
}

export class PtoEntryDAL {
  private ptoEntryRepo: Repository<PtoEntry>;
  private employeeRepo: Repository<Employee>;

  constructor(private dataSource: DataSource) {
    this.ptoEntryRepo = dataSource.getRepository(PtoEntry);
    this.employeeRepo = dataSource.getRepository(Employee);
  }

  /**
   * Validates PTO entry data according to business rules
   */
  async validatePtoEntryData(
    data: CreatePtoEntryData,
    excludeId?: number,
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Validate employee exists
    const employee = await this.employeeRepo.findOne({
      where: { id: data.employeeId },
    });
    if (!employee) {
      errors.push({ field: "employeeId", messageKey: "employee.not_found" });
      return errors; // Can't continue without employee
    }

    // Validate date string
    const dateError = validateDateString(data.date);
    if (dateError) {
      errors.push(dateError);
      return errors; // Can't continue with invalid date
    }

    // Validate hours
    const hoursError = validateHours(data.hours);
    if (hoursError) {
      errors.push(hoursError);
    }

    // Validate type
    const normalizedType = normalizePTOType(data.type);
    const typeError = validatePTOType(normalizedType);
    if (typeError) {
      errors.push(typeError);
    }

    // For PTO type, validate against available balance (skip for updates)
    if (normalizedType === "PTO" && !typeError && !hoursError && !excludeId) {
      try {
        // Get all existing PTO entries for the employee
        const existingPtoEntries = await this.ptoEntryRepo.find({
          where: { employee_id: data.employeeId },
        });

        // Convert employee and PTO entries to calculation format
        const employeeData = {
          id: employee.id,
          name: employee.name,
          identifier: employee.identifier,
          pto_rate: employee.pto_rate,
          carryover_hours: employee.carryover_hours,
          hire_date:
            employee.hire_date instanceof Date
              ? dateToString(employee.hire_date)
              : employee.hire_date,
          role: employee.role,
        };

        const ptoEntriesData = existingPtoEntries
          .filter((entry) => entry.id !== excludeId) // Exclude current entry if updating
          .map((entry) => ({
            id: entry.id,
            employee_id: entry.employee_id,
            date: entry.date,
            type: entry.type as PTOType,
            hours: entry.hours,
            created_at:
              entry.created_at instanceof Date
                ? dateToString(entry.created_at)
                : entry.created_at,
          }));

        // Calculate current PTO status for the year of the request
        const requestYear = parseDate(data.date).year;
        const ptoStatus = calculatePTOStatus(
          employeeData,
          ptoEntriesData,
          formatDate(requestYear, 12, 31),
        );
        const availableBalance = ptoStatus.availablePTO;

        // Validate PTO balance
        const balanceError = validatePTOBalance(data.hours, availableBalance);
        if (balanceError) {
          errors.push(balanceError);
        }
      } catch (error) {
        // Log error but don't fail validation - allow graceful degradation
        console.error("Error calculating PTO balance for validation:", error);
        // Continue with other validations
      }
    }

    // Check for duplicate
    if (!typeError) {
      // Only check if date and type are valid
      const existingEntries = await this.ptoEntryRepo
        .createQueryBuilder("entry")
        .where("entry.employee_id = :employeeId", {
          employeeId: data.employeeId,
        })
        .andWhere("entry.date = :date", { date: data.date })
        .andWhere("entry.type = :type", { type: normalizedType })
        .getMany();
      const hasDuplicate = existingEntries.some(
        (entry) => entry.id !== excludeId,
      );
      if (hasDuplicate) {
        errors.push({ field: "entry", messageKey: "pto.duplicate" });
      }
    }

    // Note: Annual limits validation would require calculating total hours for the year
    // This is complex and might be better handled at a higher level or with additional context

    // Bereavement consecutive-day warning
    if (normalizedType === "Bereavement" && !typeError) {
      const consecutiveDays = await this.countConsecutiveBereavementDays(
        data.employeeId,
        data.date,
        excludeId,
      );
      if (consecutiveDays > BEREAVEMENT_CONSECUTIVE_DAYS_BEFORE_PTO) {
        errors.push({
          field: "type",
          messageKey: "bereavement.pto_required_after_threshold",
        });
      }
    }

    return errors;
  }

  /**
   * Creates a new PTO entry with validation
   */
  async createPtoEntry(
    data: CreatePtoEntryData,
  ): Promise<
    | { success: true; ptoEntry: PtoEntry }
    | { success: false; errors: ValidationError[] }
  > {
    const errors = await this.validatePtoEntryData(data);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    const normalizedType = normalizePTOType(data.type);

    const ptoEntry = this.ptoEntryRepo.create({
      employee_id: data.employeeId,
      date: data.date, // Store as string
      type: normalizedType,
      hours: data.hours,
    });

    const savedEntry = await this.ptoEntryRepo.save(ptoEntry);
    return { success: true, ptoEntry: savedEntry };
  }

  /**
   * Updates an existing PTO entry with validation
   */
  async updatePtoEntry(
    id: number,
    data: UpdatePtoEntryData,
  ): Promise<
    | { success: true; ptoEntry: PtoEntry }
    | { success: false; errors: ValidationError[] }
  > {
    const existingEntry = await this.ptoEntryRepo.findOne({ where: { id } });
    if (!existingEntry) {
      return {
        success: false,
        errors: [{ field: "id", messageKey: "entry.not_found" }],
      };
    }

    // Build updated data
    const updatedData: CreatePtoEntryData = {
      employeeId: existingEntry.employee_id,
      date: data.date || existingEntry.date,
      hours: data.hours !== undefined ? data.hours : existingEntry.hours,
      type: data.type || existingEntry.type,
    };

    // Validate the updated data
    const errors = await this.validatePtoEntryData(updatedData, id);

    // Filter out balance errors when reducing hours
    const filteredErrors = errors.filter((err) => {
      if (
        err.messageKey === "hours.exceed_pto_balance" &&
        data.hours !== undefined &&
        data.hours < existingEntry.hours
      ) {
        return false; // Skip balance check when reducing hours
      }
      return true;
    });

    if (filteredErrors.length > 0) {
      return { success: false, errors: filteredErrors };
    }

    // Apply updates
    if (data.date) {
      existingEntry.date = data.date;
    }
    if (data.hours !== undefined) {
      existingEntry.hours = data.hours;
    }
    if (data.type) {
      existingEntry.type = normalizePTOType(data.type) as PTOType;
    }
    if (data.approved_by !== undefined) {
      existingEntry.approved_by = data.approved_by;
    }

    const savedEntry = await this.ptoEntryRepo.save(existingEntry);
    return { success: true, ptoEntry: savedEntry };
  }

  /**
   * Deletes a PTO entry
   */
  async deletePtoEntry(id: number): Promise<boolean> {
    const result = await this.ptoEntryRepo.delete(id);
    return (
      result.affected !== null &&
      result.affected !== undefined &&
      result.affected > 0
    );
  }

  /**
   * Gets PTO entries for an employee in a date range
   */
  async getPtoEntries(
    employeeId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<PtoEntry[]> {
    const query = this.ptoEntryRepo
      .createQueryBuilder("pto")
      .where("pto.employee_id = :employeeId", { employeeId });

    if (startDate) {
      query.andWhere("pto.date >= :startDate", { startDate });
    }
    if (endDate) {
      query.andWhere("pto.date <= :endDate", { endDate });
    }

    return query.orderBy("pto.date", "ASC").getMany();
  }

  /**
   * Counts how many consecutive workdays of Bereavement surround a given date.
   * Returns the total streak length (including the new date being added).
   */
  private async countConsecutiveBereavementDays(
    employeeId: number,
    date: string,
    excludeId?: number,
  ): Promise<number> {
    // Fetch all bereavement entries for this employee within ±14 calendar days
    const windowStart = addDays(date, -14);
    const windowEnd = addDays(date, 14);

    const entries = await this.ptoEntryRepo
      .createQueryBuilder("entry")
      .where("entry.employee_id = :employeeId", { employeeId })
      .andWhere("entry.type = :type", { type: "Bereavement" })
      .andWhere("entry.date >= :start", { start: windowStart })
      .andWhere("entry.date <= :end", { end: windowEnd })
      .getMany();

    const dateSet = new Set(
      entries.filter((e) => e.id !== excludeId).map((e) => e.date),
    );
    // Include the proposed date
    dateSet.add(date);

    // Walk backward from date to find earliest consecutive workday
    let streak = 1;
    let cursor = date;
    while (true) {
      cursor = this.previousWorkday(cursor);
      if (dateSet.has(cursor)) {
        streak++;
      } else {
        break;
      }
    }

    // Walk forward from date
    cursor = date;
    while (true) {
      cursor = this.nextWorkday(cursor);
      if (dateSet.has(cursor)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /** Returns the next workday (skipping weekends). */
  private nextWorkday(dateStr: string): string {
    let cursor = addDays(dateStr, 1);
    while (this.isWeekend(cursor)) {
      cursor = addDays(cursor, 1);
    }
    return cursor;
  }

  /** Returns the previous workday (skipping weekends). */
  private previousWorkday(dateStr: string): string {
    let cursor = addDays(dateStr, -1);
    while (this.isWeekend(cursor)) {
      cursor = addDays(cursor, -1);
    }
    return cursor;
  }

  /** Returns true if the date falls on Saturday or Sunday. */
  private isWeekend(dateStr: string): boolean {
    const dow = getDayOfWeek(dateStr);
    return dow === 0 || dow === 6;
  }
}
