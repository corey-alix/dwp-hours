/**
 * Minimal Markdown-to-HTML converter.
 *
 * Zero third-party dependencies.  Supports the subset of Markdown used in
 * POLICY.md: headings, paragraphs, tables, bold/italic, inline code, unordered
 * lists, and horizontal rules.
 *
 * Usage:
 *   npx tsx scripts/md-to-html.mts <input.md> <output.html>
 */

import { readFileSync, writeFileSync } from "fs";

// ── Inline formatting ────────────────────────────────────────────

function inlineFormat(text: string): string {
  // Bold  **text** or __text__
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // Italic  *text* or _text_  (not inside **)
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  text = text.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");
  // Inline code
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  return text;
}

// ── Block parsing ────────────────────────────────────────────────

function convertMarkdown(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line — skip
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html.push(
        `<h${level}>${inlineFormat(headingMatch[2].trim())}</h${level}>`,
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      html.push("<hr>");
      i++;
      continue;
    }

    // Table (run of `|`-prefixed lines)
    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      html.push(parseTable(tableLines));
      continue;
    }

    // Unordered list (- item or * item)
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(inlineFormat(lines[i].replace(/^\s*[-*]\s+/, "")));
        i++;
      }
      html.push(
        "<ul>" + items.map((it) => `<li>${it}</li>`).join("") + "</ul>",
      );
      continue;
    }

    // Paragraph (collect contiguous non-blank, non-special lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !lines[i].trim().startsWith("|") &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      html.push(`<p>${inlineFormat(paraLines.join(" "))}</p>`);
    }
  }

  return html.join("\n");
}

// ── Table helper ─────────────────────────────────────────────────

function parseTable(lines: string[]): string {
  const parseRow = (row: string) =>
    row
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "");

  // Detect separator row (e.g. |---|---|)
  const isSeparator = (row: string) => /^\|?[\s\-:|]+\|?$/.test(row.trim());

  const rows: string[][] = [];
  let headerEnd = -1;

  for (let j = 0; j < lines.length; j++) {
    if (isSeparator(lines[j])) {
      headerEnd = j;
      continue;
    }
    rows.push(parseRow(lines[j]));
  }

  let out = "<table>";

  if (headerEnd > 0 && rows.length > 0) {
    // First row(s) before separator are header
    const headerRows = rows.splice(0, headerEnd);
    out += "<thead>";
    for (const hr of headerRows) {
      out +=
        "<tr>" +
        hr.map((c) => `<th>${inlineFormat(c)}</th>`).join("") +
        "</tr>";
    }
    out += "</thead>";
  }

  if (rows.length > 0) {
    out += "<tbody>";
    for (const row of rows) {
      out +=
        "<tr>" +
        row.map((c) => `<td>${inlineFormat(c)}</td>`).join("") +
        "</tr>";
    }
    out += "</tbody>";
  }

  out += "</table>";
  return out;
}

// ── HTML shell ───────────────────────────────────────────────────

function wrapHtml(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="stylesheet" href="/tokens.css" />
    <style>
      body {
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 24px 16px;
        color: var(--color-text, #333);
        background: var(--color-surface, #fff);
        line-height: 1.6;
      }

      h1, h2, h3 {
        color: var(--color-text, #222);
        margin-top: 1.5em;
        margin-bottom: 0.5em;
      }

      h1 { font-size: 1.8rem; border-bottom: 2px solid var(--color-primary, #007bff); padding-bottom: 0.3em; }
      h2 { font-size: 1.4rem; }

      p { margin: 0.8em 0; }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
      }

      th, td {
        border: 1px solid var(--color-border, #ccc);
        padding: 8px 12px;
        text-align: left;
      }

      th {
        background: var(--color-primary, #007bff);
        color: white;
        font-weight: 600;
      }

      tr:nth-child(even) td {
        background: rgb(0 0 0 / 3%);
      }

      code {
        background: rgb(0 0 0 / 6%);
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 0.9em;
      }

      ul { padding-left: 1.5em; }
      li { margin: 0.3em 0; }

      .back-link {
        display: inline-block;
        margin-bottom: 1em;
        color: var(--color-primary, #007bff);
        text-decoration: none;
      }
      .back-link:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <a href="/login" class="back-link">&larr; Back to Login</a>
${body}
  </body>
</html>`;
}

// ── Main ─────────────────────────────────────────────────────────

function main(): void {
  const [inputPath, outputPath] = process.argv.slice(2);

  if (!inputPath || !outputPath) {
    console.error(
      "Usage: npx tsx scripts/md-to-html.mts <input.md> <output.html>",
    );
    process.exit(1);
  }

  const md = readFileSync(inputPath, "utf-8");
  const body = convertMarkdown(md);

  // Derive title from first heading or filename
  const titleMatch = md.match(/^#\s+(.*)/m);
  const title = titleMatch ? titleMatch[1].trim() : "Document";

  const html = wrapHtml(title, body);
  writeFileSync(outputPath, html, "utf-8");
  console.log(`Converted ${inputPath} → ${outputPath}`);
}

main();
