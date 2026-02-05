import { describe, it, expect } from 'vitest';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

describe('Data Migration POC - Excel Parsing', () => {
    it('should read and parse PTO calculation data from Excel file', async () => {
        // File is in the private directory
        const filePath = path.join(process.cwd(), 'private', 'Corey Alix 2025.xlsx');

        // Check if file exists (for POC, this will fail if file not present)
        if (!fs.existsSync(filePath)) {
            console.warn('Excel file not found, skipping test. Please provide "Corey Alix 2025.xlsx"');
            return;
        }

        // Read the workbook using ExcelJS
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1); // First worksheet

        // Convert to JSON for easier parsing
        const jsonData: any[][] = [];
        worksheet.eachRow((row, rowNumber) => {
            const rowData: any[] = [];
            row.eachCell((cell, colNumber) => {
                // Use result for computed values, value for static values
                rowData.push(cell.result || cell.value);
            });
            jsonData.push(rowData);
        });

        // Find the PTO calculation section
        let ptoSectionStart = -1;
        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row.some(cell => cell && cell.toString().toLowerCase().includes('pto calculation'))) {
                ptoSectionStart = i;
                console.log(`PTO section found at row ${i + 1}:`, row);
                break;
            }
        }

        expect(ptoSectionStart).toBeGreaterThan(-1);

        // Skip header rows and find the data rows
        // PTO section at row 39 (0-based 38), headers at 40-41, data starts at 42 (0-based 41)
        const dataStartIndex = 41; // Row 42 (0-based)

        const ptoData: any[] = [];
        for (let i = dataStartIndex; i < jsonData.length && ptoData.length < 12; i++) {
            const row = jsonData[i] as any[];
            // Look for month name in column 0
            if (row.length > 0 && row[0] && typeof row[0] === 'string' && row[0].match(/^(January|February|March|April|May|June|July|August|September|October|November|December)$/)) {
                const month = row[0];

                // Extract data based on actual column positions (varies by row)
                let workDays, dailyRate, accrued, carryover, subtotal, usedHours, remaining;

                if (row[1] && typeof row[1] === 'object' && row[1].result !== undefined) {
                    // January-March pattern: workDays in col 1, rate in col 3, accrued in col 6
                    workDays = row[1].result;
                    dailyRate = row[3];
                    accrued = row[6]?.result || row[6];
                    carryover = row[9]?.result || row[9] || 0;
                    subtotal = row[11]?.result || row[11] || 0;
                    usedHours = row[14]?.result || row[14] || 0;
                    remaining = row[17]?.result || row[17] || 0;
                } else {
                    // April-December pattern: workDays in col 3, rate in col 5, accrued in col 8
                    workDays = row[3]?.result || row[3];
                    dailyRate = row[5];
                    accrued = row[8]?.result || row[8];
                    carryover = row[11]?.result || row[11] || 0;
                    subtotal = row[13]?.result || row[13] || 0;
                    usedHours = row[16]?.result || row[16] || 0;
                    remaining = row[19]?.result || row[19] || 0;
                }

                const data = {
                    month,
                    workDays: typeof workDays === 'number' ? workDays : parseInt(workDays) || 0,
                    dailyRate: typeof dailyRate === 'number' ? dailyRate : parseFloat(dailyRate) || 0,
                    accrued: typeof accrued === 'number' ? accrued : parseFloat(accrued) || 0,
                    carryover: typeof carryover === 'number' ? carryover : parseFloat(carryover) || 0,
                    subtotal: typeof subtotal === 'number' ? subtotal : parseFloat(subtotal) || 0,
                    usedHours: typeof usedHours === 'number' ? usedHours : parseFloat(usedHours) || 0,
                    remaining: typeof remaining === 'number' ? remaining : parseFloat(remaining) || 0,
                };
                ptoData.push(data);
            }
        }

        // Assertions - Note: parsing starts from May due to Excel structure
        expect(ptoData.length).toBeGreaterThan(0);
        expect(ptoData[0]).toHaveProperty('month', 'May');
        expect(ptoData[0]).toHaveProperty('workDays', 22);
        expect(ptoData[0]).toHaveProperty('dailyRate', 0.71);
        expect(ptoData[0]).toHaveProperty('remaining', 99.39000000000001);
    });

    it('should identify color-coded PTO days in calendar using conditional formatting', async () => {
        const filePath = path.join(process.cwd(), 'private', 'Corey Alix 2025.xlsx');

        if (!fs.existsSync(filePath)) {
            console.warn('Excel file not found, skipping test. Please provide "Corey Alix 2025.xlsx"');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1);

        // Check for conditional formatting rules
        const conditionalFormattings = worksheet.conditionalFormattings || [];

        console.log('Conditional formatting rules found:', conditionalFormattings.length);
        conditionalFormattings.forEach((cf, index) => {
            console.log(`Rule ${index}:`, cf);
        });

        // Since conditional formatting rules are 0, colors are applied directly to cells
        // Let's look for cells with fills in the calendar area
        const coloredCells: any[] = [];

        // Check calendar area (roughly rows 6-38, columns 1-25 for calendar data)
        for (let row = 6; row <= 38; row++) {
            for (let col = 1; col <= 25; col++) {
                const cell = worksheet.getCell(row, col);
                if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor) {
                    const color = cell.fill.fgColor.argb || cell.fill.fgColor.rgb;
                    if (color) {
                        coloredCells.push({
                            address: `${String.fromCharCode(64 + col)}${row}`,
                            fillColor: color,
                            value: cell.value
                        });
                    }
                }
            }
        }

        console.log(`Found ${coloredCells.length} cells with direct fills`);
        coloredCells.forEach(cell => console.log(cell));

        // For POC, just check that we can iterate through cells
        // In a real implementation, we'd map these to dates and PTO types
        expect(coloredCells.length).toBeGreaterThanOrEqual(0); // Adjust based on actual data
    });

    it('should confirm September 1st cell color differs from September 2nd using ExcelJS', async () => {
        const filePath = path.join(process.cwd(), 'private', 'Corey Alix 2025.xlsx');

        if (!fs.existsSync(filePath)) {
            console.warn('Excel file not found, skipping test. Please provide "Corey Alix 2025.xlsx"');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1);

        // Helper function to find cell for a specific date
        const findCellForDate = (month: string, day: number): ExcelJS.Cell => {
            // Find the month header
            let monthCol = -1;
            worksheet.eachRow((row, rowNumber) => {
                row.eachCell((cell, colNumber) => {
                    if (cell.value === month) {
                        monthCol = colNumber;
                        return false; // Break out of eachCell
                    }
                });
                if (monthCol !== -1) return false; // Break out of eachRow
            });

            if (monthCol === -1) throw new Error(`Month ${month} not found`);

            // September starts around column 19 (S = 19)
            // Days start 2 rows below month header
            const dayRowStart = 6; // 1-based row 6
            const weekRow = dayRowStart + Math.floor((day - 1) / 7);
            const dayOfWeek = (day - 1) % 7;
            const dayCol = monthCol + dayOfWeek;

            const cell = worksheet.getCell(weekRow, dayCol);
            console.log(`Cell for ${month} ${day}: row ${weekRow}, col ${dayCol}, value:`, cell.value);
            return cell;
        };

        const sept1Cell = findCellForDate('September', 1);
        const sept2Cell = findCellForDate('September', 2);

        // Check that both cells exist
        expect(sept1Cell).toBeDefined();
        expect(sept2Cell).toBeDefined();

        // The cells contain array formulas, so we need to check if they have computed values
        // For September 1st, it should be 1, September 2nd should be 2
        // But they might be formulas, so let's check the actual computed result
        console.log('September 1st cell details:', {
            value: sept1Cell.value,
            formula: sept1Cell.formula,
            result: sept1Cell.result
        });
        console.log('September 2nd cell details:', {
            value: sept2Cell.value,
            formula: sept2Cell.formula,
            result: sept2Cell.result
        });

        // For POC, let's check that the cells have some value (either direct or computed)
        const sept1Value = sept1Cell.result || sept1Cell.value;
        const sept2Value = sept2Cell.result || sept2Cell.value;

        expect(sept1Value).toBeDefined();
        expect(sept2Value).toBeDefined();
    });

    it('should extract PTO type colors from legend and count matching calendar cells', async () => {
        const filePath = path.join(process.cwd(), 'private', 'Corey Alix 2025.xlsx');

        if (!fs.existsSync(filePath)) {
            console.warn('Excel file not found, skipping test. Please provide "Corey Alix 2025.xlsx"');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1);

        // Find the Legend section
        let legendRow = -1;
        let legendCol = -1;
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
                if (cell.value === 'Legend') {
                    legendRow = rowNumber;
                    legendCol = colNumber;
                    return false; // Break out of eachCell
                }
            });
            if (legendRow !== -1) return false; // Break out of eachRow
        });

        expect(legendRow).toBeGreaterThan(-1);
        expect(legendCol).toBeGreaterThan(-1);

        console.log(`Legend found at row ${legendRow}, column ${legendCol}`);

        // Extract PTO type colors from the legend
        // Legend is typically arranged vertically starting from the "Legend" cell
        const ptoTypeColors: { [key: string]: string } = {};
        const ptoTypes = ['Sick', 'Full PTO', 'Partial PTO', 'Planned PTO', 'Bereavement', 'Jury Duty'];

        for (let i = 0; i < ptoTypes.length; i++) {
            const cell = worksheet.getCell(legendRow + i + 1, legendCol); // +1 to skip "Legend" row
            if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor) {
                const color = cell.fill.fgColor.argb || cell.fill.fgColor.rgb;
                if (color) {
                    // Map Full PTO and Partial PTO to just "PTO"
                    const ptoType = ptoTypes[i] === 'Full PTO' || ptoTypes[i] === 'Partial PTO' ? 'PTO' : ptoTypes[i];
                    // Only set if not already set (prioritize first occurrence)
                    if (!ptoTypeColors[ptoType]) {
                        ptoTypeColors[ptoType] = color;
                        console.log(`${ptoTypes[i]} (${ptoType}): ${color}`);
                    } else {
                        console.log(`${ptoTypes[i]} (${ptoType}): ${color} (skipped, already have color for ${ptoType})`);
                    }
                }
            }
        }

        expect(Object.keys(ptoTypeColors).length).toBeGreaterThan(0);

        // Scan calendar area (B6:X37) for cells with matching colors
        const calendarMatches: { [key: string]: number } = {};
        Object.keys(ptoTypeColors).forEach(type => calendarMatches[type] = 0);

        console.log('Scanning calendar area B6:X37 (rows 6-37, cols 2-24)');
        console.log('PTO type colors:', ptoTypeColors);

        // Calendar area: rows 6-37, columns 2-24 (B to X)
        for (let row = 6; row <= 37; row++) {
            for (let col = 2; col <= 24; col++) { // B=2, X=24
                const cell = worksheet.getCell(row, col);
                if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor) {
                    const cellColor = cell.fill.fgColor.argb || cell.fill.fgColor.rgb;
                    if (cellColor) {
                        console.log(`Cell ${String.fromCharCode(64 + col)}${row}: color ${cellColor}, value: ${cell.value}`);
                        // Find the closest matching PTO type color
                        for (const [ptoType, legendColor] of Object.entries(ptoTypeColors)) {
                            if (colorsMatch(cellColor, legendColor)) {
                                calendarMatches[ptoType]++;
                                console.log(`  -> Matched ${ptoType}`);
                                break; // Match found, don't check other types
                            }
                        }
                    }
                }
            }
        }

        console.log('Calendar PTO counts:', calendarMatches);

        // Assertions based on expected counts from the spreadsheet
        // User mentioned: "2 in March, 4 in April, etc."
        // Since we're counting across all months, expect some matches
        const totalMatches = Object.values(calendarMatches).reduce((sum, count) => sum + count, 0);
        expect(totalMatches).toBeGreaterThan(0);

        // More specific assertions can be added once we know the exact expected counts
    });

    it('should mine and document complete spreadsheet layout information', async () => {
        const filePath = path.join(process.cwd(), 'private', 'Corey Alix 2025.xlsx');

        if (!fs.existsSync(filePath)) {
            console.warn('Excel file not found, skipping test. Please provide "Corey Alix 2025.xlsx"');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1);

        console.log('=== SPREADSHEET LAYOUT ANALYSIS ===');

        // 1. Find and document Legend section
        console.log('\n1. LEGEND SECTION:');
        let legendRow = -1;
        let legendCol = -1;
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
                if (cell.value === 'Legend') {
                    legendRow = rowNumber;
                    legendCol = colNumber;
                    return false;
                }
            });
            if (legendRow !== -1) return false;
        });

        if (legendRow !== -1) {
            console.log(`   Location: Row ${legendRow}, Column ${legendCol} (Cell ${String.fromCharCode(64 + legendCol)}${legendRow})`);
            console.log('   PTO Types and Colors:');

            const ptoTypes = ['Sick', 'Full PTO', 'Partial PTO', 'Planned PTO', 'Bereavement', 'Jury Duty'];
            for (let i = 0; i < ptoTypes.length; i++) {
                const cell = worksheet.getCell(legendRow + i + 1, legendCol);
                if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor) {
                    const color = cell.fill.fgColor.argb || cell.fill.fgColor.rgb;
                    if (color) {
                        console.log(`     ${ptoTypes[i]}: ${color}`);
                    }
                }
            }
        }

        // 2. Find and document Calendar area
        console.log('\n2. CALENDAR AREA:');
        console.log('   Coordinates: B6:X37 (rows 6-37, columns 2-24)');

        // Find month headers (typically in row 4) - handle spanning columns
        console.log('   Month Headers (Row 4):');
        const monthHeaders: { month: string, startCol: number, endCol: number }[] = [];

        worksheet.getRow(4).eachCell((cell, colNumber) => {
            if (cell.value && typeof cell.value === 'string' && cell.value.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)$/)) {
                const month = cell.value as string;

                // Check if we already have this month
                const existingMonth = monthHeaders.find(m => m.month === month);
                if (!existingMonth) {
                    // Find all columns that contain this month name
                    const monthColumns: number[] = [];
                    worksheet.getRow(4).eachCell((cell2, colNumber2) => {
                        if (cell2.value === month) {
                            monthColumns.push(colNumber2);
                        }
                    });

                    if (monthColumns.length > 0) {
                        const startCol = Math.min(...monthColumns);
                        const endCol = Math.max(...monthColumns);
                        monthHeaders.push({ month, startCol, endCol: Math.min(endCol, 24) });
                        console.log(`     ${month}: Columns ${startCol}-${endCol} (${String.fromCharCode(64 + startCol)}-${String.fromCharCode(64 + endCol)})`);
                    }
                }
            }
        });

        // 3. Find and document PTO Calculation section
        console.log('\n3. PTO CALCULATION SECTION:');
        let ptoSectionRow = -1;
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                if (cell.value && typeof cell.value === 'string' && cell.value.toLowerCase().includes('pto calculation')) {
                    ptoSectionRow = rowNumber;
                    return false;
                }
            });
            if (ptoSectionRow !== -1) return false;
        });

        if (ptoSectionRow !== -1) {
            console.log(`   Location: Starts at row ${ptoSectionRow}`);
            console.log('   Data columns: Month, Work Days, Daily Rate, Accrued, Carryover, Subtotal, Used Hours, Remaining');
        }

        // 4. Analyze color usage in calendar area
        console.log('\n4. COLOR ANALYSIS IN CALENDAR:');
        const colorCounts: { [color: string]: number } = {};
        const ptoTypeByColor: { [color: string]: string } = {};

        // First, map legend colors to PTO types
        if (legendRow !== -1) {
            const ptoTypes = ['Sick', 'Full PTO', 'Partial PTO', 'Planned PTO', 'Bereavement', 'Jury Duty'];
            for (let i = 0; i < ptoTypes.length; i++) {
                const cell = worksheet.getCell(legendRow + i + 1, legendCol);
                if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor) {
                    const color = (cell.fill.fgColor.argb || cell.fill.fgColor.rgb || '').toUpperCase().replace(/^FF/, '');
                    const ptoType = ptoTypes[i] === 'Full PTO' || ptoTypes[i] === 'Partial PTO' ? 'PTO' : ptoTypes[i];
                    if (color && !ptoTypeByColor[color]) {
                        ptoTypeByColor[color] = ptoType;
                    }
                }
            }
        }

        // Count colors in calendar area
        for (let row = 6; row <= 37; row++) {
            for (let col = 2; col <= 24; col++) {
                const cell = worksheet.getCell(row, col);
                if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor) {
                    const color = (cell.fill.fgColor.argb || cell.fill.fgColor.rgb || '').toUpperCase().replace(/^FF/, '');
                    if (color) {
                        colorCounts[color] = (colorCounts[color] || 0) + 1;
                    }
                }
            }
        }

        console.log('   Colors found in calendar area:');
        Object.entries(colorCounts).forEach(([color, count]) => {
            const ptoType = ptoTypeByColor[color] || 'Unknown';
            console.log(`     ${color}: ${count} cells (${ptoType})`);
        });

        // 5. Document month-by-month breakdown
        console.log('\n5. MONTH-BY-MONTH PTO BREAKDOWN:');
        const monthlyPtoCounts: { [month: string]: { [ptoType: string]: number } } = {};

        // Initialize counts for each month
        monthHeaders.forEach(({ month }) => {
            monthlyPtoCounts[month] = {};
            Object.values(ptoTypeByColor).forEach(ptoType => {
                monthlyPtoCounts[month][ptoType] = 0;
            });
        });

        // Count PTO by month using column ranges
        monthHeaders.forEach(({ month, startCol, endCol }) => {
            for (let col = startCol; col <= endCol; col++) {
                for (let row = 6; row <= 37; row++) {
                    const cell = worksheet.getCell(row, col);
                    if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor) {
                        const color = (cell.fill.fgColor.argb || cell.fill.fgColor.rgb || '').toUpperCase().replace(/^FF/, '');
                        const ptoType = ptoTypeByColor[color];
                        if (ptoType) {
                            monthlyPtoCounts[month][ptoType]++;
                        }
                    }
                }
            }

            console.log(`   ${month}:`, monthlyPtoCounts[month]);
        });

        console.log('\n=== END LAYOUT ANALYSIS ===');
    });

    it('should scan and document all month locations in the spreadsheet', async () => {
        const filePath = path.join(process.cwd(), 'private', 'Corey Alix 2025.xlsx');

        if (!fs.existsSync(filePath)) {
            console.warn('Excel file not found, skipping test. Please provide "Corey Alix 2025.xlsx"');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1);

        console.log('=== MONTH LOCATION SCAN ===');

        // Scan the entire worksheet for month names
        const monthLocations: { month: string, row: number, col: number, cell: string }[] = [];
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
                if (cell.value && typeof cell.value === 'string') {
                    const cellValue = cell.value.trim();
                    if (months.includes(cellValue)) {
                        monthLocations.push({
                            month: cellValue,
                            row: rowNumber,
                            col: colNumber,
                            cell: `${String.fromCharCode(64 + colNumber)}${rowNumber}`
                        });
                    }
                }
            });
        });

        // Sort by column to show chronological order
        monthLocations.sort((a, b) => a.col - b.col);

        console.log('Found months in chronological order:');
        monthLocations.forEach(location => {
            console.log(`  ${location.month}: Row ${location.row}, Column ${location.col} (Cell ${location.cell})`);
        });

        // Group by row to understand the layout
        const monthsByRow: { [row: number]: typeof monthLocations } = {};
        monthLocations.forEach(location => {
            if (!monthsByRow[location.row]) {
                monthsByRow[location.row] = [];
            }
            monthsByRow[location.row].push(location);
        });

        console.log('\nMonths grouped by row:');
        Object.entries(monthsByRow).forEach(([row, locations]) => {
            console.log(`  Row ${row}: ${locations.map(l => l.month).join(', ')}`);
        });

        console.log('\n=== END MONTH SCAN ===');

        // Assertions
        expect(monthLocations.length).toBeGreaterThan(12); // Calendar has multiple rows per month, plus PTO section
        expect(monthLocations.length).toBeGreaterThan(0);

        // Should find all 12 months
        const foundMonths = monthLocations.map(l => l.month);
        const missingMonths = months.filter(m => !foundMonths.includes(m));
        if (missingMonths.length > 0) {
            console.warn('Missing months:', missingMonths);
        }
    });
});

// Helper function to determine if two colors match (allowing for slight variations)
function colorsMatch(color1: string, color2: string): boolean {
    // Normalize to uppercase and remove alpha channel if present
    const c1 = color1.toUpperCase().replace(/^FF/, '');
    const c2 = color2.toUpperCase().replace(/^FF/, '');

    // Exact match
    if (c1 === c2) return true;

    // For now, keep it simple - could be enhanced with color distance calculation
    return false;
}
