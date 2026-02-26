/**
 * Query a specific cell in an Excel workbook and dump its properties.
 *
 * Usage:
 *   npx tsx scripts/query-xlsx.mts --file <path> --sheet <name> --cell <ref>
 *
 * Example:
 *   npx tsx scripts/query-xlsx.mts --file reports/2018.xlsx --sheet "A Bylenga" --cell E8
 *
 * Output includes: value, text, formula, fill colors, note/comment, font,
 * number format, alignment, and borders.
 */
import ExcelJS from "exceljs";

// ── Argument parsing ──

interface Args {
  file: string;
  sheet: string;
  cell: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const map = new Map<string, string>();

  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--") && i + 1 < argv.length) {
      map.set(argv[i].slice(2), argv[i + 1]);
      i++;
    }
  }

  const file = map.get("file");
  const sheet = map.get("sheet");
  const cell = map.get("cell");

  if (!file || !sheet || !cell) {
    console.error(
      "Usage: npx tsx scripts/query-xlsx.mts --file <path> --sheet <name> --cell <ref>",
    );
    console.error("");
    console.error("Required arguments:");
    console.error("  --file   Path to the .xlsx file");
    console.error('  --sheet  Worksheet name (e.g., "A Bylenga")');
    console.error("  --cell   Cell reference (e.g., E8, S42)");
    process.exit(1);
  }

  return { file, sheet, cell };
}

// ── Helpers ──

function formatFill(fill: ExcelJS.Fill | undefined): string {
  if (!fill) return "(none)";
  if (fill.type === "pattern") {
    const pf = fill as ExcelJS.FillPattern;
    const parts: string[] = [`pattern=${pf.pattern}`];
    if (pf.fgColor) parts.push(`fgColor=${JSON.stringify(pf.fgColor)}`);
    if (pf.bgColor) parts.push(`bgColor=${JSON.stringify(pf.bgColor)}`);
    return parts.join(", ");
  }
  if (fill.type === "gradient") {
    return `gradient (${JSON.stringify(fill)})`;
  }
  return JSON.stringify(fill);
}

function formatNote(
  note: ExcelJS.Comment | string | undefined,
): string {
  if (!note) return "(none)";
  if (typeof note === "string") return note;
  if (note.texts) {
    return note.texts.map((t) => t.text).join("");
  }
  return JSON.stringify(note);
}

function formatFont(font: Partial<ExcelJS.Font> | undefined): string {
  if (!font) return "(none)";
  const parts: string[] = [];
  if (font.name) parts.push(`name=${font.name}`);
  if (font.size) parts.push(`size=${font.size}`);
  if (font.bold) parts.push("bold");
  if (font.italic) parts.push("italic");
  if (font.underline) parts.push(`underline=${font.underline}`);
  if (font.color) parts.push(`color=${JSON.stringify(font.color)}`);
  return parts.length > 0 ? parts.join(", ") : "(default)";
}

// ── Main ──

const args = parseArgs();

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(args.file);

const ws = wb.getWorksheet(args.sheet);
if (!ws) {
  const names = wb.worksheets.map((w) => `"${w.name}"`).join(", ");
  console.error(`Sheet "${args.sheet}" not found. Available: ${names}`);
  process.exit(1);
}

const cell = ws.getCell(args.cell);

console.log(`=== ${args.file} / "${args.sheet}" / ${args.cell} ===`);
console.log("");
console.log(`Value (raw) : ${JSON.stringify(cell.value)}`);
console.log(`Text         : ${JSON.stringify(cell.text)}`);
console.log(`Type         : ${cell.type}`);
if (cell.formula) {
  console.log(`Formula      : =${cell.formula}`);
}
console.log(`Fill         : ${formatFill(cell.fill)}`);
console.log(`Note/Comment : ${formatNote(cell.note)}`);
console.log(`Font         : ${formatFont(cell.font)}`);
if (cell.numFmt) {
  console.log(`Number Format: ${cell.numFmt}`);
}
if (cell.alignment) {
  console.log(`Alignment    : ${JSON.stringify(cell.alignment)}`);
}

// Show neighboring context if helpful
console.log("");
console.log("--- Raw cell.fill object ---");
console.log(JSON.stringify(cell.fill, null, 2));
console.log("");
console.log("--- Raw cell.note object ---");
console.log(JSON.stringify(cell.note, null, 2));
