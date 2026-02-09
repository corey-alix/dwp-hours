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
