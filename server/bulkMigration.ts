import { DataSource } from 'typeorm';
import { Employee, MonthlyHours } from '../server/entities/index.js';
import { PtoEntryDAL } from '../server/dal/PtoEntryDAL.js';

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

export async function performBulkMigration(
    dataSource: DataSource,
    ptoEntryDAL: PtoEntryDAL,
    log: (message: string) => void,
    today: () => string,
    isValidDateString: (date: string) => boolean,
    data: BulkMigrationData
): Promise<BulkMigrationResult> {
    const { employeeEmail, monthlyHours, ptoEntries } = data;

    // Validation
    if (!employeeEmail || typeof employeeEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeEmail)) {
        throw new Error('Valid employee email is required');
    }

    const employeeRepo = dataSource.getRepository(Employee);
    const monthlyHoursRepo = dataSource.getRepository(MonthlyHours);

    // Find or create employee
    let employee = await employeeRepo.findOne({ where: { identifier: employeeEmail } });
    if (!employee) {
        // Create new employee
        employee = new Employee();
        employee.name = employeeEmail.split('@')[0]; // Use email prefix as name
        employee.identifier = employeeEmail;
        employee.pto_rate = 0.71;
        employee.carryover_hours = 0;
        employee.hire_date = new Date(today());
        employee.role = 'Employee';
        await employeeRepo.save(employee);
        log(`Created new employee for migration: ${employeeEmail} (ID: ${employee.id})`);
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
                if (!month || typeof hours !== 'number') {
                    warnings.push(`Skipping invalid monthly hours entry: ${JSON.stringify(hourEntry)}`);
                    continue;
                }

                // Parse month (expected format: YYYY-MM)
                const monthStart = month + '-01';
                if (!isValidDateString(monthStart)) {
                    warnings.push(`Skipping invalid month date: ${month}`);
                    continue;
                }

                // Check if already exists
                const existing = await monthlyHoursRepo.findOne({
                    where: { employee_id: employee.id, month: month }
                });

                if (existing) {
                    warnings.push(`Monthly hours already exist for ${month}, skipping`);
                    monthlyHoursSkipped++;
                } else {
                    const newHours = monthlyHoursRepo.create({
                        employee_id: employee.id,
                        month: month,
                        hours_worked: hours,
                        submitted_at: new Date(today())
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
                if (!date || typeof hours !== 'number' || !type) {
                    warnings.push(`Skipping invalid PTO entry: ${JSON.stringify(ptoEntry)}`);
                    continue;
                }

                const result = await ptoEntryDAL.createPtoEntry({
                    employeeId: employee.id,
                    date,
                    hours,
                    type
                });

                if (result.success) {
                    ptoEntriesInserted++;
                } else {
                    // Check if it's a duplicate error
                    const isDuplicate = result.errors.some(err => err.messageKey === 'pto.duplicate');
                    if (isDuplicate) {
                        warnings.push(`PTO entry already exists for ${date} (${type}), skipping`);
                        ptoEntriesSkipped++;
                    } else {
                        warnings.push(`Validation failed for PTO entry ${date} (${type}): ${result.errors.map(e => e.messageKey).join(', ')}`);
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
        ptoEntriesSkipped
    };

    log(`Bulk migration completed for ${employeeEmail}: ${JSON.stringify(summary)}`);
    if (warnings.length > 0) {
        log(`Warnings: ${warnings.join('; ')}`);
    }

    return {
        message: 'Bulk migration completed',
        employeeId: employee.id,
        summary,
        warnings
    };
}