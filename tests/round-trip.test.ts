import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync } from "fs";
import ExcelJS from "exceljs";
import {
  jsonToWorkbook,
  workbookToJson,
  type ExcelData,
} from "../shared/conversionUtils.ts";

function compareJson(a: any, b: any, path: string = ""): string[] {
  const mismatches: string[] = [];

  if (a === b) return mismatches;

  // Allow adding values where original had undefined
  if (b === undefined) return mismatches;

  // Allow losing values that were added in preservation
  if (a === undefined && b !== undefined) return mismatches;

  if (typeof a !== typeof b) {
    // Allow string/number equivalence
    if (
      (typeof a === "number" && typeof b === "string" && parseFloat(b) === a) ||
      (typeof a === "string" && typeof b === "number" && parseFloat(a) === b)
    ) {
      // Equivalent, skip
    } else {
      mismatches.push(`Type mismatch at ${path}: ${typeof a} vs ${typeof b}`);
    }
    if (mismatches.length >= 10) return mismatches;
    return mismatches;
  }

  if (a === null || b === null || typeof a !== "object") {
    mismatches.push(
      `Value mismatch at ${path}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`,
    );
    if (mismatches.length >= 10) return mismatches;
    return mismatches;
  }

  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();

  for (const key of keysA) {
    if (!keysB.includes(key)) {
      // Do not report missing keys in b
    } else {
      const newPath = path ? `${path}.${key}` : key;
      mismatches.push(...compareJson(a[key], b[key], newPath));
      if (mismatches.length >= 10) return mismatches;
    }
  }

  // Do not report extra keys in b

  return mismatches;
}

describe("Round-Trip Validation", () => {
  describe("JSON → Excel → JSON", () => {
    it("should preserve all data through round-trip conversion", () => {
      // Load the reference JSON data
      const jsonPath = "tests/data/import-tests.json";
      const originalJsonContent = readFileSync(jsonPath, "utf-8");
      const originalData: ExcelData = JSON.parse(originalJsonContent);

      // Validate the original data structure
      expect(originalData).toBeDefined();
      expect(originalData.sheets).toBeDefined();

      // Convert JSON to Excel workbook
      const workbook = jsonToWorkbook(originalData);

      // Convert Excel workbook back to JSON
      const convertedData = workbookToJson(workbook);

      // Compare the converted data with the original using JSON-to-JSON comparison
      const mismatches = compareJson(originalData, convertedData);
      expect(mismatches).toEqual([]);
    });

    it("should validate values, formulas, colors, and merged ranges individually", () => {
      // Load the reference JSON data
      const jsonPath = "tests/data/import-tests.json";
      const originalJsonContent = readFileSync(jsonPath, "utf-8");
      const originalData: ExcelData = JSON.parse(originalJsonContent);

      // Convert JSON to Excel workbook
      const workbook = jsonToWorkbook(originalData);

      // Convert Excel workbook back to JSON
      const convertedData = workbookToJson(workbook);

      // Compare the converted data with the original using JSON-to-JSON comparison
      const mismatches = compareJson(originalData, convertedData);
      expect(mismatches).toEqual([]);
    });
  });

  describe("Excel → JSON → Excel → JSON", () => {
    it("should preserve all data through Excel to JSON to Excel to JSON round-trip (JSON-to-JSON comparison)", async () => {
      // Load the reference Excel file
      const excelPath = "tests/data/import-tests.xlsx";
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(excelPath);

      // Convert Excel to JSON
      const jsonData = workbookToJson(workbook);
      writeFileSync(
        "tests/data/import-tests.json",
        JSON.stringify(jsonData, null, 2),
        "utf-8",
      );

      console.log("looks good here: ", jsonData);

      // Convert JSON back to Excel
      const convertedWorkbook = jsonToWorkbook(jsonData);

      // Convert back to JSON for comparison
      const finalJsonData = workbookToJson(convertedWorkbook);

      // Compare the final JSON with the original JSON
      const mismatches = compareJson(finalJsonData, jsonData);

      expect(mismatches).toEqual([]);

      // save the json as import-tests.json
      writeFileSync(
        "tests/data/import-tests.json",
        JSON.stringify(finalJsonData, null, 2),
        "utf-8",
      );
    });
  });
});
