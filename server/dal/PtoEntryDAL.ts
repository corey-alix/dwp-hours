import { DataSource, Repository } from "typeorm";
import { PtoEntry, Employee } from "../entities/index.js";
import {
  PTOType,
  ValidationError,
  validateHours,
  validateWeekday,
  validatePTOType,
  normalizePTOType,
  validateDateString,
  validateAnnualLimits,
  validatePTOBalance,
} from "../../shared/businessRules.js";
import { calculatePTOStatus } from "../ptoCalculations.js";
import { dateToString } from "../../shared/dateUtils.js";

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

    // Validate weekday
    const weekdayError = validateWeekday(data.date);
    if (weekdayError) {
      errors.push(weekdayError);
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

    // For PTO type, validate against available balance
    if (normalizedType === "PTO" && !typeError && !hoursError) {
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

        // Calculate current PTO status
        const ptoStatus = calculatePTOStatus(employeeData, ptoEntriesData);
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
    if (!weekdayError && !typeError) {
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
    if (errors.length > 0) {
      return { success: false, errors };
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
}
