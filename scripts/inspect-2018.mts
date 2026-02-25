import ExcelJS from "exceljs";

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile("reports/2018 PTO Forms.xlsx");
  const ws = wb.getWorksheet("A Weiner")!;

  // Full legend area scan: rows 8-20, cols Y-AB
  console.log("=== LEGEND AREA (rows 8-20, cols Y-AB) ===");
  for (let r = 8; r <= 20; r++) {
    const cells: string[] = [];
    for (let c = 25; c <= 28; c++) {
      const cell = ws.getRow(r).getCell(c);
      const val = cell.value;
      const fill = cell.fill;
      let fi = "";
      if (fill && fill.type === "pattern" && fill.fgColor) {
        fi = ` [fill:${fill.fgColor.argb || "theme:" + fill.fgColor.theme}]`;
      }
      const L = String.fromCharCode(64 + c);
      cells.push(`${L}${r}=${JSON.stringify(val)}${fi}`);
    }
    console.log(`  Row ${r}: ${cells.join(" | ")}`);
  }

  // Also check cols Z-AB wider range for legend (rows 13-19)
  console.log("\n=== LEGEND AREA WIDER (rows 13-19, cols Z-AB) Z=26 ===");
  for (let r = 13; r <= 19; r++) {
    const cells: string[] = [];
    for (let c = 26; c <= 28; c++) {
      const cell = ws.getRow(r).getCell(c);
      const val = cell.value;
      const fill = cell.fill;
      let fi = "";
      if (fill && fill.type === "pattern" && fill.fgColor) {
        fi = ` [fill:${fill.fgColor.argb || "theme:" + fill.fgColor.theme}]`;
      }
      const L = c <= 26 ? "Z" : c === 27 ? "AA" : "AB";
      cells.push(`${L}${r}=${JSON.stringify(val)}${fi}`);
    }
    console.log(`  Row ${r}: ${cells.join(" | ")}`);
  }

  // Month headers row 4 (months 1,5,9)
  console.log("\n=== MONTH HEADERS ROW 4 ===");
  for (let c = 2; c <= 24; c++) {
    const cell = ws.getRow(4).getCell(c);
    if (cell.value) console.log(`  col ${c} = ${JSON.stringify(cell.value)}`);
  }

  // Month headers row 13 (months 2,6,10)
  console.log("\n=== MONTH HEADERS ROW 13 ===");
  for (let c = 2; c <= 24; c++) {
    const cell = ws.getRow(13).getCell(c);
    if (cell.value) console.log(`  col ${c} = ${JSON.stringify(cell.value)}`);
  }

  // Month headers row 22 (months 3,7,11)
  console.log("\n=== MONTH HEADERS ROW 22 ===");
  for (let c = 2; c <= 24; c++) {
    const cell = ws.getRow(22).getCell(c);
    if (cell.value) console.log(`  col ${c} = ${JSON.stringify(cell.value)}`);
  }

  // Month headers row 31 (months 4,8,12)
  console.log("\n=== MONTH HEADERS ROW 31 ===");
  for (let c = 2; c <= 24; c++) {
    const cell = ws.getRow(31).getCell(c);
    if (cell.value) console.log(`  col ${c} = ${JSON.stringify(cell.value)}`);
  }

  // Day-of-week header rows
  console.log("\n=== DAY-OF-WEEK HEADER ROWS ===");
  for (const r of [5, 14, 23, 32]) {
    const vals: string[] = [];
    for (let c = 2; c <= 24; c++) {
      const cell = ws.getRow(r).getCell(c);
      if (cell.value) vals.push(`c${c}=${JSON.stringify(cell.value)}`);
    }
    if (vals.length) console.log(`  Row ${r}: ${vals.join(" | ")}`);
  }

  // Row 3 content — mystery year row?
  console.log("\n=== ROW 3 CONTENT ===");
  for (let c = 1; c <= 28; c++) {
    const cell = ws.getRow(3).getCell(c);
    if (cell.value !== null && cell.value !== undefined) {
      console.log(`  col ${c} = ${JSON.stringify(cell.value)}`);
    }
  }

  // PTO Calc section header row
  console.log("\n=== PTO CALC HEADER ROW (row 39 vs 40) ===");
  console.log(`  B39 = ${JSON.stringify(ws.getRow(39).getCell(2).value)}`);
  console.log(`  B40 = ${JSON.stringify(ws.getRow(40).getCell(2).value)}`);

  // Carryover in L42 (January) vs L43 (our expected location)
  console.log("\n=== CARRYOVER CELLS ===");
  console.log(`  L42 = ${JSON.stringify(ws.getRow(42).getCell(12).value)}`);
  console.log(`  L43 = ${JSON.stringify(ws.getRow(43).getCell(12).value)}`);

  // Ack columns — X, Y rows 42-53
  console.log("\n=== ACK COLUMNS (X, Y, rows 42-53) ===");
  for (let r = 42; r <= 53; r++) {
    const x = ws.getRow(r).getCell(24).value;
    const y = ws.getRow(r).getCell(25).value;
    if (x || y)
      console.log(
        `  Row ${r}: X=${JSON.stringify(x)} | Y=${JSON.stringify(y)}`,
      );
  }

  // Summary sheet inspection
  const summary = wb.getWorksheet("Summary of Hours")!;
  console.log("\n=== SUMMARY SHEET (rows 1-6) ===");
  for (let r = 1; r <= 6; r++) {
    const cells: string[] = [];
    summary.getRow(r).eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (colNumber > 20) return;
      cells.push(`c${colNumber}=${JSON.stringify(cell.value)}`);
    });
    if (cells.length) console.log(`  Row ${r}: ${cells.join(" | ")}`);
  }

  // Additional colors found
  console.log("\n=== ALL COLORS ACROSS FIRST 5 EMPLOYEE SHEETS ===");
  const colorMap = new Map<
    string,
    { count: number; legend: string; examples: string[] }
  >();
  const employeeSheets = wb.worksheets.filter(
    (s) => s.name !== "Summary of Hours" && s.name !== "2017 PTO Policy",
  );
  for (const s of employeeSheets.slice(0, 5)) {
    // Legend
    for (let r = 13; r <= 19; r++) {
      const cell = s.getRow(r).getCell(26); // Z
      const fill = cell.fill;
      if (fill && fill.type === "pattern" && fill.fgColor) {
        const color = fill.fgColor.argb || `theme:${fill.fgColor.theme}`;
        if (!colorMap.has(color)) {
          colorMap.set(color, {
            count: 0,
            legend: String(cell.value || ""),
            examples: [],
          });
        }
        const e = colorMap.get(color)!;
        e.legend = String(cell.value || e.legend);
      }
    }
    // Calendar
    for (let r = 4; r <= 38; r++) {
      for (let c = 2; c <= 24; c++) {
        const cell = s.getRow(r).getCell(c);
        const fill = cell.fill;
        if (fill && fill.type === "pattern" && fill.fgColor) {
          const color = fill.fgColor.argb || `theme:${fill.fgColor.theme}`;
          if (!colorMap.has(color)) {
            colorMap.set(color, { count: 0, legend: "", examples: [] });
          }
          const e = colorMap.get(color)!;
          e.count++;
          if (e.examples.length < 2) e.examples.push(`${s.name}:c${c}r${r}`);
        }
      }
    }
  }
  for (const [color, info] of colorMap) {
    console.log(
      `  ${color}: "${info.legend}" ${info.count} cells, e.g. ${info.examples.join(", ")}`,
    );
  }

  // Check the PTO Calc rows for "S" column location
  console.log("\n=== PTO HOURS PER MONTH COLUMN (rows 42-53) ===");
  for (let r = 42; r <= 53; r++) {
    const s19 = ws.getRow(r).getCell(19).value; // S
    const t20 = ws.getRow(r).getCell(20).value; // T
    console.log(
      `  Row ${r}: S=${JSON.stringify(s19)} T=${JSON.stringify(t20)}`,
    );
  }

  // Count sheets
  console.log(`\n=== SHEET SUMMARY ===`);
  console.log(`Total sheets: ${wb.worksheets.length}`);
  console.log(
    `Employee sheets: ${wb.worksheets.filter((s) => s.name !== "Summary of Hours" && s.name !== "2017 PTO Policy").length}`,
  );

  // Check note format on a colored cell
  console.log("\n=== SAMPLE NOTES ON COLORED CELLS (A Weiner) ===");
  for (let r = 4; r <= 38; r++) {
    for (let c = 2; c <= 24; c++) {
      const cell = ws.getRow(r).getCell(c);
      if (cell.note) {
        console.log(
          `  c${c}r${r} val=${JSON.stringify(cell.value)} note=${JSON.stringify(cell.note).slice(0, 200)}`,
        );
      }
    }
  }
}

main().catch(console.error);
