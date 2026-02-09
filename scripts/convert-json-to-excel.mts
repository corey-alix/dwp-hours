#!/usr/bin/env node

/**
 * Convert JSON to Excel Script
 * Converts a JSON file containing Excel data structure to an Excel file
 */

import { readFileSync, writeFileSync } from "fs";
import {
  jsonToWorkbook,
  validateExcelData,
  type ExcelData,
} from "../shared/conversionUtils.ts";

/**
 * Main conversion function
 */
async function convertJsonToExcel(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  try {
    console.log(`Reading JSON from ${inputPath}...`);
    const jsonContent = readFileSync(inputPath, "utf-8");
    const data: ExcelData = JSON.parse(jsonContent);

    console.log("Validating JSON structure...");
    if (!validateExcelData(data)) {
      throw new Error("Invalid JSON structure. Expected ExcelData format.");
    }

    console.log("Converting to Excel workbook...");
    const workbook = jsonToWorkbook(data);

    console.log(`Writing Excel file to ${outputPath}...`);
    await workbook.xlsx.writeFile(outputPath);

    console.log("Conversion completed successfully!");
  } catch (error) {
    console.error(`Error during conversion: ${error}`);
    throw error;
  }
}

/**
 * Main script execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      "Usage: node scripts/convert-json-to-excel.mts <input.json> <output.xlsx>",
    );
    process.exit(1);
  }

  const [inputPath, outputPath] = args;

  try {
    await convertJsonToExcel(inputPath, outputPath);
  } catch (error) {
    console.error("Conversion failed:", error);
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
