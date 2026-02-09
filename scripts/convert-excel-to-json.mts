/**
 * Convert Excel to JSON Script
 * Converts an Excel file to a JSON file containing Excel data structure
 */

import { writeFileSync } from "fs";
import ExcelJS from "exceljs";
import { workbookToJson } from "../shared/conversionUtils.ts";

/**
 * Main conversion function
 */
async function convertExcelToJson(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  try {
    console.log(`Reading Excel file from ${inputPath}...`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(inputPath);

    console.log("Converting to JSON structure...");
    const data = workbookToJson(workbook);

    console.log(`Writing JSON file to ${outputPath}...`);
    const jsonContent = JSON.stringify(data, null, 2);
    writeFileSync(outputPath, jsonContent, "utf-8");

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
      "Usage: tsx scripts/convert-excel-to-json.mts <input.xlsx> <output.json>",
    );
    process.exit(1);
  }

  const [inputPath, outputPath] = args;

  try {
    await convertExcelToJson(inputPath, outputPath);
  } catch (error) {
    console.error("Conversion failed:", error);
    process.exit(1);
  }
}

// Run the script
main();
