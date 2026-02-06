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
    validateAnnualLimits
} from "../../shared/businessRules.js";

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
    async validatePtoEntryData(data: CreatePtoEntryData, excludeId?: number): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];

        // Validate employee exists
        const employee = await this.employeeRepo.findOne({ where: { id: data.employeeId } });
        if (!employee) {
            errors.push({ field: 'employeeId', messageKey: 'employee.not_found' });
            return errors; // Can't continue without employee
        }

        // Validate date string
        const dateError = validateDateString(data.date);
        if (dateError) {
            errors.push(dateError);
            return errors; // Can't continue with invalid date
        }

        const [year, month, day] = data.date.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        // Validate weekday
        const weekdayError = validateWeekday(date);
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

        // Check for duplicate
        if (!weekdayError && !typeError) { // Only check if date and type are valid
            const query = this.ptoEntryRepo.createQueryBuilder('pto')
                .where('pto.employee_id = :employeeId', { employeeId: data.employeeId })
                .andWhere('pto.date = :dateStr', { dateStr: data.date })
                .andWhere('pto.type = :type', { type: normalizedType });
            if (excludeId) {
                query.andWhere('pto.id != :excludeId', { excludeId });
            }
            const existing = await query.getOne();
            if (existing) {
                errors.push({ field: 'entry', messageKey: 'pto.duplicate' });
            }
        }

        // Note: Annual limits validation would require calculating total hours for the year
        // This is complex and might be better handled at a higher level or with additional context

        return errors;
    }

    /**
     * Creates a new PTO entry with validation
     */
    async createPtoEntry(data: CreatePtoEntryData): Promise<{ success: true; ptoEntry: PtoEntry } | { success: false; errors: ValidationError[] }> {
        const errors = await this.validatePtoEntryData(data);
        if (errors.length > 0) {
            return { success: false, errors };
        }

        const normalizedType = normalizePTOType(data.type);
        const [year, month, day] = data.date.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        const ptoEntry = this.ptoEntryRepo.create({
            employee_id: data.employeeId,
            date: date,
            type: normalizedType,
            hours: data.hours
        });

        const savedEntry = await this.ptoEntryRepo.save(ptoEntry);
        return { success: true, ptoEntry: savedEntry };
    }

    /**
     * Updates an existing PTO entry with validation
     */
    async updatePtoEntry(id: number, data: UpdatePtoEntryData): Promise<{ success: true; ptoEntry: PtoEntry } | { success: false; errors: ValidationError[] }> {
        const existingEntry = await this.ptoEntryRepo.findOne({ where: { id } });
        if (!existingEntry) {
            return { success: false, errors: [{ field: 'id', messageKey: 'entry.not_found' }] };
        }

        // Build updated data
        const updatedData: CreatePtoEntryData = {
            employeeId: existingEntry.employee_id,
            date: data.date || (typeof existingEntry.date === 'string' ? existingEntry.date : existingEntry.date.toISOString().split('T')[0]),
            hours: data.hours !== undefined ? data.hours : existingEntry.hours,
            type: data.type || existingEntry.type
        };

        // Validate the updated data
        const errors = await this.validatePtoEntryData(updatedData, id);
        if (errors.length > 0) {
            return { success: false, errors };
        }

        // Apply updates
        if (data.date) {
            existingEntry.date = new Date(data.date);
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
        return result.affected !== null && result.affected !== undefined && result.affected > 0;
    }

    /**
     * Gets PTO entries for an employee in a date range
     */
    async getPtoEntries(employeeId: number, startDate?: Date, endDate?: Date): Promise<PtoEntry[]> {
        const query = this.ptoEntryRepo.createQueryBuilder('pto')
            .where('pto.employee_id = :employeeId', { employeeId });

        if (startDate) {
            query.andWhere('pto.date >= :startDate', { startDate });
        }
        if (endDate) {
            query.andWhere('pto.date <= :endDate', { endDate });
        }

        return query.orderBy('pto.date', 'ASC').getMany();
    }
}