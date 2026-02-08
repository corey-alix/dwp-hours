import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { jsonToWorkbook, workbookToJson, validateExcelData, type ExcelData } from '../shared/conversionUtils.ts';

describe('Conversion Utilities', () => {
    describe('validateExcelData', () => {
        it('should validate correct ExcelData structure', () => {
            const validData: ExcelData = {
                sheets: {
                    Sheet1: {
                        cells: {
                            A1: { value: 'Hello' },
                            B1: { value: 123 }
                        }
                    }
                }
            };

            expect(validateExcelData(validData)).toBe(true);
        });

        it('should reject invalid data structures', () => {
            expect(validateExcelData(null)).toBe(false);
            expect(validateExcelData({})).toBe(false);
            expect(validateExcelData({ sheets: null })).toBe(false);
            expect(validateExcelData({ sheets: { Sheet1: {} } })).toBe(false);
        });

        it('should validate merged ranges', () => {
            const dataWithMerges: ExcelData = {
                sheets: {
                    Sheet1: {
                        cells: { A1: { value: 'Merged' } },
                        mergedRanges: ['A1:B1']
                    }
                }
            };

            expect(validateExcelData(dataWithMerges)).toBe(true);
        });
    });

    describe('jsonToWorkbook', () => {
        it('should convert simple JSON data to Excel workbook', () => {
            const data: ExcelData = {
                sheets: {
                    Sheet1: {
                        cells: {
                            A1: { value: 'Hello' },
                            B1: { value: 123 },
                            C1: { value: true }
                        }
                    }
                }
            };

            const workbook = jsonToWorkbook(data);

            expect(workbook).toBeInstanceOf(ExcelJS.Workbook);
            expect(workbook.getWorksheet('Sheet1')).toBeDefined();

            const worksheet = workbook.getWorksheet('Sheet1')!;
            expect(worksheet.getCell('A1').value).toBe('Hello');
            expect(worksheet.getCell('B1').value).toBe(123);
            expect(worksheet.getCell('C1').value).toBe(true);
        });

        it('should handle formulas', () => {
            const data: ExcelData = {
                sheets: {
                    Sheet1: {
                        cells: {
                            A1: { value: 10 },
                            B1: { value: 20 },
                            C1: { formula: 'A1+B1' }
                        }
                    }
                }
            };

            const workbook = jsonToWorkbook(data);
            const worksheet = workbook.getWorksheet('Sheet1')!;

            const cellC1 = worksheet.getCell('C1');
            expect(cellC1.value).toEqual({ formula: 'A1+B1' });
        });

        it('should handle cell colors', () => {
            const data: ExcelData = {
                sheets: {
                    Sheet1: {
                        cells: {
                            A1: { value: 'Red', color: 'FFFF0000' }
                        }
                    }
                }
            };

            const workbook = jsonToWorkbook(data);
            const worksheet = workbook.getWorksheet('Sheet1')!;
            const cell = worksheet.getCell('A1');

            expect(cell.fill).toEqual({
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' }
            });
        });

        it('should handle merged ranges', () => {
            const data: ExcelData = {
                sheets: {
                    Sheet1: {
                        cells: {
                            A1: { value: 'Merged' }
                        },
                        mergedRanges: ['A1:B1']
                    }
                }
            };

            const workbook = jsonToWorkbook(data);
            const worksheet = workbook.getWorksheet('Sheet1')!;

            expect(worksheet.model.merges).toContain('A1:B1');
        });
    });

    describe('workbookToJson', () => {
        it('should convert Excel workbook to JSON data', async () => {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sheet1');

            worksheet.getCell('A1').value = 'Hello';
            worksheet.getCell('B1').value = 123;
            worksheet.getCell('C1').value = true;

            const data = workbookToJson(workbook);

            expect(data).toEqual({
                sheets: {
                    Sheet1: {
                        cells: {
                            A1: { value: 'Hello' },
                            B1: { value: 123 },
                            C1: { value: true }
                        }
                    }
                }
            });
        });

        it('should handle formulas', async () => {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sheet1');

            worksheet.getCell('A1').value = 10;
            worksheet.getCell('B1').value = 20;
            worksheet.getCell('C1').value = { formula: 'A1+B1' };

            const data = workbookToJson(workbook);

            expect(data.sheets.Sheet1.cells.C1).toEqual({
                formula: 'A1+B1'
            });
        });

        it('should handle cell colors', async () => {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sheet1');

            const cell = worksheet.getCell('A1');
            cell.value = 'Red';
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' }
            };

            const data = workbookToJson(workbook);

            expect(data.sheets.Sheet1.cells.A1).toEqual({
                value: 'Red',
                color: 'FFFF0000'
            });
        });

        it('should handle merged ranges', async () => {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sheet1');

            worksheet.getCell('A1').value = 'Merged';
            worksheet.mergeCells('A1:B1');

            const data = workbookToJson(workbook);

            expect(data.sheets.Sheet1.mergedRanges).toContain('A1:B1');
        });
    });

    describe('Round-trip conversion', () => {
        it('should maintain data integrity through JSON → Excel → JSON conversion', () => {
            const originalData: ExcelData = {
                sheets: {
                    Sheet1: {
                        cells: {
                            A1: { value: 'Hello' },
                            B1: { value: 123 },
                            C1: { formula: 'A1&B1' },
                            D1: { value: 'Red', color: 'FFFF0000' }
                        },
                        mergedRanges: ['A1:B1']
                    }
                }
            };

            // Convert to workbook and back
            const workbook = jsonToWorkbook(originalData);
            const convertedData = workbookToJson(workbook);

            // Validate the conversion
            expect(convertedData.sheets.Sheet1.cells.A1.value).toBe('Hello');
            expect(convertedData.sheets.Sheet1.cells.B1.value).toBe('Hello'); // Merged cell
            expect(convertedData.sheets.Sheet1.cells.C1.formula).toBe('A1&B1');
            expect(convertedData.sheets.Sheet1.cells.D1.value).toBe('Red');
            expect(convertedData.sheets.Sheet1.cells.D1.color).toBe('FFFF0000');
            expect(convertedData.sheets.Sheet1.mergedRanges).toContain('A1:B1');
        });
    });
});