/**
 * Inspect an Excel workbook and dump structural information for comparison
 * against the expected export format.
 *
 * Usage: npx tsx scripts/inspect-xlsx.mts <path-to-xlsx>
 */
import ExcelJS from "exceljs";

function colToLetter(col: number): string {
  let s = "";
  while (col > 0) {
    const mod = (col - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    col = Math.floor((col - 1) / 26);
  }
  return s;
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx tsx scripts/inspect-xlsx.mts <path-to-xlsx>");
  process.exit(1);
}

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(filePath);

console.log(`=== Workbook: ${filePath} ===`);
console.log(`Sheet count: ${wb.worksheets.length}`);
console.log(
  `Sheet names: ${wb.worksheets.map((ws) => `"${ws.name}"`).join(", ")}\n`,
);

for (const ws of wb.worksheets) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`SHEET: "${ws.name}"`);
  console.log(`Rows: ${ws.rowCount}, Columns: ${ws.columnCount}`);
  console.log(`${"=".repeat(60)}`);

  // Dump merged cells
  const merges = (ws as any)._merges || {};
  const mergeKeys = Object.keys(merges);
  if (mergeKeys.length > 0) {
    console.log(`\nMerged cells (${mergeKeys.length} merges):`);
    for (const m of mergeKeys.slice(0, 40)) {
      console.log(`  ${m}`);
    }
    if (mergeKeys.length > 40)
      console.log(`  ... and ${mergeKeys.length - 40} more`);
  }

  // Row 1–5: Header area
  console.log(`\n--- Header Area (rows 1-5) ---`);
  for (let r = 1; r <= Math.min(5, ws.rowCount); r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const colLetter = colToLetter(colNumber);
      const val = cell.value;
      const fill = cell.fill;
      let fillInfo = "";
      if (fill && fill.type === "pattern" && fill.fgColor) {
        fillInfo = ` [fill:${fill.fgColor.argb || fill.fgColor.theme}]`;
      }
      const font = cell.font;
      let fontInfo = "";
      if (font) {
        const parts: string[] = [];
        if (font.bold) parts.push("bold");
        if (font.size) parts.push(`${font.size}pt`);
        if (parts.length) fontInfo = ` {${parts.join(",")}}`;
      }
      cells.push(
        `${colLetter}${r}=${JSON.stringify(val)}${fillInfo}${fontInfo}`,
      );
    });
    if (cells.length) console.log(`  Row ${r}: ${cells.join(" | ")}`);
  }

  // Legend area: rows 8-14, cols Z-AB (26-28)
  console.log(`\n--- Legend Area (rows 8-14, cols Z-AB) ---`);
  for (let r = 8; r <= 14; r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = 25; c <= 28; c++) {
      const cell = row.getCell(c);
      if (cell.value !== null && cell.value !== undefined) {
        const colLetter = colToLetter(c);
        const fill = cell.fill;
        let fillInfo = "";
        if (fill && fill.type === "pattern" && fill.fgColor) {
          fillInfo = ` [fill:${fill.fgColor.argb || fill.fgColor.theme}]`;
        }
        cells.push(`${colLetter}${r}=${JSON.stringify(cell.value)}${fillInfo}`);
      }
    }
    if (cells.length) console.log(`  Row ${r}: ${cells.join(" | ")}`);
  }

  // Sick hours area: rows 32-34, cols Y-AB (25-28)
  console.log(`\n--- Sick Hours Area (rows 32-34, cols Y-AB) ---`);
  for (let r = 32; r <= 34; r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = 25; c <= 28; c++) {
      const cell = row.getCell(c);
      if (cell.value !== null && cell.value !== undefined) {
        const colLetter = colToLetter(c);
        cells.push(`${colLetter}${r}=${JSON.stringify(cell.value)}`);
      }
    }
    if (cells.length) console.log(`  Row ${r}: ${cells.join(" | ")}`);
  }

  // Calendar grid: sample first month block (rows 4-12, cols B-H)
  console.log(`\n--- Calendar Grid Sample: Month 1 (rows 3-12, cols B-H) ---`);
  for (let r = 3; r <= 12; r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = 2; c <= 8; c++) {
      const cell = row.getCell(c);
      const colLetter = colToLetter(c);
      const val = cell.value;
      const fill = cell.fill;
      let fillInfo = "";
      if (fill && fill.type === "pattern" && fill.fgColor) {
        fillInfo = ` [fill:${fill.fgColor.argb || fill.fgColor.theme}]`;
      }
      const note = cell.note;
      let noteInfo = "";
      if (note) {
        noteInfo = ` (note:${typeof note === "string" ? note : JSON.stringify(note).slice(0, 40)})`;
      }
      if (val !== null && val !== undefined) {
        cells.push(
          `${colLetter}${r}=${JSON.stringify(val)}${fillInfo}${noteInfo}`,
        );
      }
    }
    if (cells.length) console.log(`  Row ${r}: ${cells.join(" | ")}`);
  }

  // Calendar: month 2 block header (row 3 or 4, cols I-P)
  console.log(
    `\n--- Calendar Grid Sample: Month 2 header (rows 3-5, cols I-P) ---`,
  );
  for (let r = 3; r <= 5; r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = 9; c <= 16; c++) {
      const cell = row.getCell(c);
      const colLetter = colToLetter(c);
      const val = cell.value;
      if (val !== null && val !== undefined) {
        cells.push(`${colLetter}${r}=${JSON.stringify(val)}`);
      }
    }
    if (cells.length) console.log(`  Row ${r}: ${cells.join(" | ")}`);
  }

  // Calendar: month 3 block header (cols Q-X)
  console.log(
    `\n--- Calendar Grid Sample: Month 3 header (rows 3-5, cols Q-X) ---`,
  );
  for (let r = 3; r <= 5; r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = 17; c <= 24; c++) {
      const cell = row.getCell(c);
      const colLetter = colToLetter(c);
      const val = cell.value;
      if (val !== null && val !== undefined) {
        cells.push(`${colLetter}${r}=${JSON.stringify(val)}`);
      }
    }
    if (cells.length) console.log(`  Row ${r}: ${cells.join(" | ")}`);
  }

  // PTO Calc section: rows 39-55
  console.log(`\n--- PTO Calc Section (rows 39-56, cols A-Y) ---`);
  for (let r = 39; r <= Math.min(56, ws.rowCount); r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (colNumber > 28) return; // only care up to AB
      const colLetter = colToLetter(colNumber);
      const val = cell.value;
      // Truncate formula objects
      let display = "";
      if (typeof val === "object" && val !== null && "formula" in val) {
        display = `{formula}`;
      } else {
        display = JSON.stringify(val);
      }
      cells.push(`${colLetter}${r}=${display}`);
    });
    if (cells.length) console.log(`  Row ${r}: ${cells.join(" | ")}`);
  }

  // Look at ALL colored cells in the calendar area (rows 4-38, cols B-X)
  // to understand what colors are used
  console.log(
    `\n--- All distinct fill colors in calendar area (rows 4-38, cols B-X) ---`,
  );
  const colorMap = new Map<string, { count: number; examples: string[] }>();
  for (let r = 4; r <= 38; r++) {
    const row = ws.getRow(r);
    for (let c = 2; c <= 24; c++) {
      const cell = row.getCell(c);
      const fill = cell.fill;
      if (fill && fill.type === "pattern" && fill.fgColor) {
        const color = fill.fgColor.argb || `theme:${fill.fgColor.theme}`;
        if (!colorMap.has(color)) {
          colorMap.set(color, { count: 0, examples: [] });
        }
        const entry = colorMap.get(color)!;
        entry.count++;
        const colLetter = colToLetter(c);
        if (entry.examples.length < 3)
          entry.examples.push(`${colLetter}${r}=${JSON.stringify(cell.value)}`);
      }
    }
  }
  for (const [color, info] of colorMap) {
    console.log(
      `  Color ${color}: ${info.count} cells, e.g. ${info.examples.join(", ")}`,
    );
  }

  // Check if there's data beyond column X (col 24) — specifically cols Y-AB
  console.log(`\n--- Extended columns check (cols Y-AD, rows 1-5) ---`);
  for (let r = 1; r <= 5; r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = 25; c <= 30; c++) {
      const cell = row.getCell(c);
      if (cell.value !== null && cell.value !== undefined) {
        const colLetter = colToLetter(c);
        cells.push(`${colLetter}${r}=${JSON.stringify(cell.value)}`);
      }
    }
    if (cells.length) console.log(`  Row ${r}: ${cells.join(" | ")}`);
  }

  // Only do detailed inspection for first 2 employee tabs
  if (ws.name !== "Cover Sheet" && wb.worksheets.indexOf(ws) >= 3) {
    console.log("  (skipping detailed inspection for remaining sheets)");
    continue;
  }
}
