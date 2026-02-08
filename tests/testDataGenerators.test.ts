import { describe, it, expect } from 'vitest';
import { generateImportTestData, extractMonthlyPTOHours, extractMonthlyWorkDays, extractMonthCellRange, extractHireDate, extractYear, extractEmployeeName, extractSickHoursStatus, extractLegend } from '../shared/testDataGenerators';
import fs from 'fs';
import path from 'path';

describe('testDataGenerators', () => {
  const testData = generateImportTestData();
  const sheetData = testData.sheets['Corey Alix'];

  it('should generate the same JSON as import-tests.json', () => {
    const expected = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'import-tests.json'), 'utf-8')
    );
    const actual = generateImportTestData();
    expect(actual).toEqual(expected);
  });

  it('should extract monthly PTO hours from S42-S53', () => {
    const ptoHours = extractMonthlyPTOHours(sheetData);
    expect(ptoHours).toHaveLength(12); // January to December
    expect(ptoHours).toEqual([0, 0, 16, 32, 8, 0, 56, 0, 56, 0, 8, 16]); // Based on the data
  });

  it('should extract monthly work days from D42-D53', () => {
    const workDays = extractMonthlyWorkDays(sheetData);
    expect(workDays).toHaveLength(12); // January to December
    // Work days should be numbers representing business days in each month
    expect(workDays.every(day => typeof day === 'number')).toBe(true);

    /* 23	20	21	22	22	21	23	21	22	23	20	23	    */
    expect(workDays.every(day => day >= 0)).toBe(true);

  });

  it('should extract the cell range for February', () => {
    const range = extractMonthCellRange(sheetData, 'February');
    expect(range).toBe('B15:H19');
  });

  it('should extract the cell range for January', () => {
    const range = extractMonthCellRange(sheetData, 'January');
    expect(range).toBe('B6:H10');
  });

  it('should extract the cell range for March', () => {
    const range = extractMonthCellRange(sheetData, 'March');
    expect(range).toBe('B24:H29');
  });

  it('should extract the cell range for April', () => {
    const range = extractMonthCellRange(sheetData, 'April');
    expect(range).toBe('B33:H37');
  });

  it('should extract the cell range for May', () => {
    const range = extractMonthCellRange(sheetData, 'May');
    expect(range).toBe('J6:P10');
  });

  it('should extract the cell range for June', () => {
    const range = extractMonthCellRange(sheetData, 'June');
    expect(range).toBe('J15:P19');
  });

  it('should extract the cell range for July', () => {
    const range = extractMonthCellRange(sheetData, 'July');
    expect(range).toBe('J24:P28');
  });

  it('should extract the cell range for August', () => {
    const range = extractMonthCellRange(sheetData, 'August');
    expect(range).toBe('J33:P38');
  });

  it('should extract the cell range for September', () => {
    const range = extractMonthCellRange(sheetData, 'September');
    expect(range).toBe('R6:X10');
  });

  it('should extract the cell range for October', () => {
    const range = extractMonthCellRange(sheetData, 'October');
    expect(range).toBe('R15:X19');
  });

  it('should extract the cell range for November', () => {
    const range = extractMonthCellRange(sheetData, 'November');
    expect(range).toBe('R24:X29');
  });

  it('should extract the cell range for December', () => {
    const range = extractMonthCellRange(sheetData, 'December');
    expect(range).toBe('R33:X37');
  });

  it('should extract hire date from R2', () => {
    const hireDate = extractHireDate(sheetData);
    expect(hireDate).toBe('2023-02-13');
  });

  it('should extract year from B2', () => {
    const year = extractYear(sheetData);
    expect(year).toBe(2025);
  });

  it('should extract employee name from J2', () => {
    const employeeName = extractEmployeeName(sheetData);
    expect(employeeName).toBe('Corey Alix');
  });

  it('should extract sick hours status from AB32, AB33, AB34', () => {
    const sickHoursStatus = extractSickHoursStatus(sheetData);
    expect(sickHoursStatus).not.toBeNull();
    expect(sickHoursStatus).toEqual({
      allowed: 24,
      used: 0,
      remaining: 24
    });
  });

  it('should extract legend entries from Z9 to Z14', () => {
    const legend = extractLegend(sheetData);
    expect(legend).toHaveLength(6);
    expect(legend).toEqual([
      { name: 'Sick', color: 'FF00B050' },
      { name: 'Full PTO', color: 'FFFFFF00' },
      { name: 'Partial PTO', color: 'FFFFC000' },
      { name: 'Planned PTO', color: 'FF00B0F0' },
      { name: 'Bereavement', color: 'FFBFBFBF' },
      { name: 'Jury Duty', color: 'FFFF0000' }
    ]);
  });
});