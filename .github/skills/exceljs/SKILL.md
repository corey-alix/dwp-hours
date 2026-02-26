---
name: exceljs
description: Specialized assistant for using ExcelJS to read, manipulate, and write spreadsheet data and styles to XLSX and JSON formats.
---

# exceljs.skill.md

## Introduction

ExcelJS is a JavaScript library for reading, manipulating, and writing spreadsheet data and styles to XLSX and JSON formats. It is reverse-engineered from Excel spreadsheet files.

## Installation

```bash
npm install exceljs
```

## Key Features

- Read/write XLSX and JSON
- Support for formulas, styles, images, merges
- Conditional formatting, data validation
- Tables, pivot tables (limited), cell comments
- Streaming I/O for large files
- Browser compatibility (document-based only)

## Basic Usage

### Creating Workbook

```javascript
const workbook = new ExcelJS.Workbook();
```

### Adding Worksheets

```javascript
const sheet = workbook.addWorksheet("My Sheet", {
  properties: { tabColor: { argb: "FFC0000" } },
  views: [{ showGridLines: false }],
});
```

### Writing Data

```javascript
// Add row by object
worksheet.addRow({ id: 1, name: "John" });

// Add row by array
worksheet.addRow([2, "Jane", new Date()]);

// Set cell value
worksheet.getCell("A1").value = "Hello";
```

### Styling

```javascript
// Cell styling
worksheet.getCell("A1").numFmt = "0.00";
worksheet.getCell("A1").font = { name: "Arial", size: 12 };

// Column styling
worksheet.columns = [
  { header: "ID", key: "id", width: 10, style: { font: { bold: true } } },
];
```

### Reading Files

```javascript
// Read XLSX
await workbook.xlsx.readFile("file.xlsx");

// Read CSV
const worksheet = await workbook.csv.readFile("data.csv");
```

## Advanced Usage

### Formulas

```javascript
// Simple formula
worksheet.getCell("A3").value = { formula: "A1+A2", result: 10 };

// Shared formula
worksheet.getCell("A2").value = {
  formula: "A1",
  result: 5,
  shareType: "shared",
  ref: "A2:B3",
};

// Array formula
worksheet.fillFormula("A2:B3", "A1", [1, 1, 1, 1], "array");
```

### Images

```javascript
// Add image to workbook
const imageId = workbook.addImage({ filename: "image.jpg", extension: "jpeg" });

// Add to worksheet
worksheet.addImage(imageId, "B2:D6");
```

### Merges

```javascript
worksheet.mergeCells("A1:B2");
worksheet.getCell("A1").value = "Merged";
```

### Tables

```javascript
ws.addTable({
  name: "Sales",
  ref: "A1",
  headerRow: true,
  totalsRow: true,
  columns: [{ name: "Date" }, { name: "Amount", totalsRowFunction: "sum" }],
  rows: [[new Date(), 100]],
});
```

### Conditional Formatting

```javascript
worksheet.addConditionalFormatting({
  ref: "A1:E7",
  rules: [
    {
      type: "expression",
      formulae: ["MOD(ROW()+COLUMN(),2)=0"],
      style: {
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF00" },
        },
      },
    },
  ],
});
```

## API Overview

### Main Classes

- `Workbook`: Root object containing worksheets
- `Worksheet`: Represents a worksheet with rows, columns
- `Row`: Represents a row with cells
- `Cell`: Represents a cell with value and style

### Key Methods

- `workbook.addWorksheet(name, options)`
- `worksheet.addRow(values, style)`
- `worksheet.mergeCells(range)`
- `workbook.xlsx.writeFile(filename)`
- `workbook.xlsx.readFile(filename)`
- `worksheet.getCell(address)`
- `worksheet.addImage(imageId, location)`

## Examples

### Create and Write Workbook

```javascript
const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet("Data");

sheet.columns = [
  { header: "Name", key: "name", width: 32 },
  { header: "DOB", key: "dob", width: 10 },
];

sheet.addRow({ name: "John", dob: new Date(1990, 0, 1) });
sheet.addRow({ name: "Jane", dob: new Date(1985, 5, 15) });

await workbook.xlsx.writeFile("output.xlsx");
```

### Read and Process File

```javascript
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile("input.xlsx");

workbook.eachSheet((worksheet) => {
  worksheet.eachRow((row, rowNumber) => {
    console.log(`Row ${rowNumber}:`, row.values);
  });
});
```

## Important Notes

- Styles are shared by reference; modify with caution
- Streaming I/O requires explicit commit() on rows
- Browser support limited to document-based operations
- Worksheet IDs may not be sequential after deletions
- Use `workbook.eachSheet()` instead of `forEach` for iteration
- Polyfills required for ES5 or older Node.js versions

## Streaming Reader (Memory-Constrained Environments)

**CRITICAL**: `workbook.xlsx.readFile()` and `workbook.xlsx.load(buffer)` load the **entire workbook** into memory at once. For workbooks with many sheets (e.g., 68 employee tabs), this can easily exceed 200MB and cause OOM kills on memory-constrained servers (512MB).

### Use `WorkbookReader` for Large Files

```typescript
const reader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
  worksheets: "emit", // stream worksheets one at a time
  sharedStrings: "cache", // cache shared strings for cell values
  styles: "cache", // cache styles so cell.style works
  hyperlinks: "cache", // cache hyperlinks
});

for await (const wsReader of reader) {
  const sheetName = (wsReader as any).name; // name not in type defs but exists at runtime

  for await (const row of wsReader) {
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      // Process cell...
    });
  }
}
```

### Materialising Individual Sheets

If existing parse helpers require random cell access (`ws.getCell(row, col)`), materialise **one sheet at a time** into a temporary Worksheet, process it, then let it be garbage collected:

```typescript
async function materialiseWorksheet(
  wsReader: ExcelJS.stream.xlsx.WorksheetReader,
): Promise<ExcelJS.Worksheet> {
  const tempWB = new ExcelJS.Workbook();
  const ws = tempWB.addWorksheet((wsReader as any).name || "Sheet");

  for await (const row of wsReader) {
    const newRow = ws.getRow(row.number);
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const newCell = newRow.getCell(colNumber);
      newCell.value = cell.value;
      newCell.style = cell.style;
      if (cell.note) newCell.note = cell.note;
    });
    newRow.commit();
  }

  return ws;
}
```

### Type Definition Gaps

- `WorksheetReader.name` exists at runtime but is **not in the type definitions** — use `(wsReader as any).name`
- `WorkbookReader` constructor options are typed as `Partial<WorkbookStreamReaderOptions>`

### Key Differences from Standard Reader

| Feature      | `readFile()` / `load()` | `WorkbookReader`           |
| ------------ | ----------------------- | -------------------------- |
| Memory       | All sheets at once      | One sheet at a time        |
| Cell access  | Random (`getCell`)      | Sequential (row iteration) |
| Styles/fills | Always available        | Requires `styles: "cache"` |
| Sheet names  | `worksheet.name`        | `(wsReader as any).name`   |
| Merged cells | Tracked automatically   | May need manual handling   |

## Cell Inspection Tooling

The project includes `scripts/query-xlsx.mts` for ad-hoc cell inspection during development and debugging. Run it via:

```bash
pnpm query:xlsx --file <path> --sheet <name> --cell <ref>
```

### What It Reports

- **Value (raw)**: The underlying `cell.value` (number, string, rich text object, formula result)
- **Text**: The display string via `cell.text` (always a plain string)
- **Type**: ExcelJS cell type enum value
- **Formula**: If present, the formula string
- **Fill**: Pattern type, `fgColor` and `bgColor` — including `theme` index and `tint` when the color is theme-based rather than ARGB
- **Note/Comment**: Rich text comment structure with author and text segments
- **Font**: Name, size, bold, italic, color
- **Number Format / Alignment**: If set on the cell

### Theme Colors vs ARGB

Excel files frequently use **theme-indexed colors** instead of literal ARGB values. When inspecting a cell, you may see:

```json
{ "fgColor": { "theme": 9 } }
```

instead of:

```json
{ "fgColor": { "argb": "FFFFC000" } }
```

This means the color is resolved at render time from the workbook's theme palette. Code that matches colors by `fgColor.argb` alone will miss these cells. Use the query tool to diagnose such mismatches during import development.
