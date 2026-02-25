/**
 * HTML Report Generator
 *
 * Generates a self-contained HTML document that mimics the legacy PTO
 * spreadsheet layout. All employee data is embedded as JSON so the
 * single-page report can switch employees via a dropdown with no
 * additional network requests.
 */

import type { ReportData } from "../reportService.js";
import {
  getDaysInMonth,
  getDayOfWeek,
  formatDate,
} from "../../shared/dateUtils.js";
import { MONTH_NAMES } from "../../shared/businessRules.js";

// ── Color mapping (legacy spreadsheet colors → CSS) ──

const PTO_TYPE_COLORS: Record<string, string> = {
  Sick: "#00B050", // green
  PTO: "#FFFF00", // yellow
  Bereavement: "#BFBFBF", // gray
  "Jury Duty": "#FF0000", // red
};

const PTO_TYPE_TEXT_COLORS: Record<string, string> = {
  Sick: "#fff",
  PTO: "#333",
  Bereavement: "#333",
  "Jury Duty": "#fff",
};

/**
 * Generate a fully self-contained HTML report string.
 */
export function generateHtmlReport(data: ReportData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PTO Report ${data.year}</title>
${generateStyles()}
</head>
<body>

<div class="report-header">
  <h1>PTO Report &mdash; ${data.year}</h1>
  <div class="controls">
    <label for="employee-select">Employee:</label>
    <select id="employee-select"></select>
    <button id="print-btn" onclick="window.print()">Print</button>
  </div>
  <p class="generated">Generated: ${new Date(data.generatedAt).toLocaleString()}</p>
</div>

<div id="report-content"></div>

<script>
${generateScript(data)}
</script>
</body>
</html>`;
}

// ── Styles ──

function generateStyles(): string {
  return `<style>
*,*::before,*::after{box-sizing:border-box}

body {
  font-family: Calibri, Arial, sans-serif;
  font-size: 11px;
  margin: 0;
  padding: 16px;
  background: #f5f5f5;
  color: #222;
}

.report-header {
  background: #fff;
  padding: 12px 20px;
  border-bottom: 2px solid #1a5276;
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.report-header h1 {
  margin: 0;
  font-size: 18px;
  color: #1a5276;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.controls select {
  padding: 4px 8px;
  font-size: 12px;
  min-width: 200px;
}

.controls button {
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  background: #1a5276;
  color: #fff;
  border: none;
  border-radius: 3px;
}

.controls button:hover { background: #1f618d; }

.generated {
  margin: 0;
  font-size: 10px;
  color: #888;
  margin-left: auto;
}

/* Employee sheet */

.sheet {
  background: #fff;
  padding: 20px;
  border: 1px solid #ccc;
}

.employee-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 2px solid #1a5276;
  padding-bottom: 6px;
  margin-bottom: 12px;
}

.employee-header h2 {
  margin: 0;
  font-size: 16px;
  color: #1a5276;
}

.employee-header .hire-date {
  font-size: 12px;
  color: #555;
}

/* Calendar layout: 3 column groups × 4 month rows */

.calendar-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px 24px;
  margin-bottom: 20px;
}

.month-block {
  border: 1px solid #ddd;
  border-radius: 3px;
  overflow: hidden;
}

.month-name {
  background: #1a5276;
  color: #fff;
  text-align: center;
  font-weight: bold;
  font-size: 11px;
  padding: 3px;
}

.month-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.month-table th {
  font-size: 9px;
  padding: 2px 1px;
  text-align: center;
  background: #eaf2f8;
  border-bottom: 1px solid #ddd;
  color: #555;
}

.month-table td {
  text-align: center;
  padding: 2px 1px;
  font-size: 10px;
  border: 1px solid #eee;
  height: 18px;
}

.month-table td.weekend {
  background: #f9f9f9;
  color: #aaa;
}

.month-table td.pto-day {
  font-weight: bold;
  border: 1px solid rgb(0 0 0 / 15%);
}

/* Legend */

.legend-section {
  margin-bottom: 20px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.legend-section h3 {
  margin: 0 8px 0 0;
  font-size: 12px;
  color: #1a5276;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
}

.legend-swatch {
  width: 14px;
  height: 14px;
  border: 1px solid rgb(0 0 0 / 20%);
  border-radius: 2px;
  display: inline-block;
}

/* PTO Calculation table */

.calc-section h3 {
  font-size: 13px;
  color: #1a5276;
  margin: 0 0 6px 0;
  border-bottom: 1px solid #ddd;
  padding-bottom: 4px;
}

.calc-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  font-size: 11px;
}

.calc-table th {
  background: #1a5276;
  color: #fff;
  padding: 4px 6px;
  text-align: right;
  font-weight: bold;
  font-size: 10px;
}

.calc-table th:first-child {
  text-align: left;
}

.calc-table td {
  padding: 3px 6px;
  border-bottom: 1px solid #eee;
  text-align: right;
}

.calc-table td:first-child {
  text-align: left;
  font-weight: bold;
}

.calc-table tr:nth-child(even) td {
  background: #fafafa;
}

.calc-table tfoot td {
  font-weight: bold;
  border-top: 2px solid #1a5276;
  background: #eaf2f8;
}

/* Acknowledgement table */

.ack-section h3 {
  font-size: 13px;
  color: #1a5276;
  margin: 16px 0 6px 0;
  border-bottom: 1px solid #ddd;
  padding-bottom: 4px;
}

.ack-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  margin-bottom: 16px;
}

.ack-table th {
  background: #1a5276;
  color: #fff;
  padding: 4px 6px;
  text-align: left;
  font-size: 10px;
}

.ack-table td {
  padding: 3px 6px;
  border-bottom: 1px solid #eee;
}

.ack-table tr:nth-child(even) td {
  background: #fafafa;
}

.ack-status {
  font-weight: bold;
}

.ack-yes { color: #27ae60; }
.ack-no  { color: #c0392b; }

/* Print styles */

@media print {
  body { background: #fff; padding: 0; font-size: 10px; }
  .report-header { border-bottom: 1px solid #000; }
  .controls button { display: none; }
  .sheet { border: none; padding: 0; }
  .month-block { break-inside: avoid; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
</style>`;
}

// ── Client-side JavaScript ──

function generateScript(data: ReportData): string {
  // Serialize data as JSON for embedding
  const json = JSON.stringify(data);

  return `
"use strict";
var REPORT_DATA = ${json};

var DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
var MONTH_NAMES = ${JSON.stringify([...MONTH_NAMES])};

var PTO_COLORS = ${JSON.stringify(PTO_TYPE_COLORS)};
var PTO_TEXT_COLORS = ${JSON.stringify(PTO_TYPE_TEXT_COLORS)};

// ── Helpers ──

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function dayOfWeek(year, month, day) {
  return new Date(year, month - 1, day).getDay();
}

function pad2(n) { return n < 10 ? "0" + n : "" + n; }

// ── Build PTO lookup: "YYYY-MM-DD" → {type, hours} ──

function buildPtoMap(entries) {
  var map = {};
  entries.forEach(function(e) { map[e.date] = e; });
  return map;
}

// ── Render a single month calendar ──

function renderMonth(year, month, ptoMap) {
  var days = daysInMonth(year, month);
  var firstDow = dayOfWeek(year, month, 1);

  var html = '<div class="month-block">';
  html += '<div class="month-name">' + MONTH_NAMES[month - 1] + '</div>';
  html += '<table class="month-table"><thead><tr>';
  DAY_NAMES.forEach(function(d) { html += '<th>' + d + '</th>'; });
  html += '</tr></thead><tbody>';

  var cell = 0;
  html += '<tr>';
  // Leading blanks
  for (var b = 0; b < firstDow; b++) {
    html += '<td></td>';
    cell++;
  }

  for (var d = 1; d <= days; d++) {
    if (cell > 0 && cell % 7 === 0) {
      html += '</tr><tr>';
    }
    var dow = (firstDow + d - 1) % 7;
    var dateStr = year + "-" + pad2(month) + "-" + pad2(d);
    var pto = ptoMap[dateStr];
    var cls = "";
    var style = "";

    if (pto) {
      var bg = PTO_COLORS[pto.type] || "#FFFF00";
      var fg = PTO_TEXT_COLORS[pto.type] || "#333";
      cls = "pto-day";
      style = 'style="background:' + bg + ';color:' + fg + '" title="' + pto.type + ': ' + pto.hours + 'h"';
    } else if (dow === 0 || dow === 6) {
      cls = "weekend";
    }

    html += '<td class="' + cls + '" ' + style + '>' + d + '</td>';
    cell++;
  }

  // Trailing blanks
  while (cell % 7 !== 0) {
    html += '<td></td>';
    cell++;
  }
  html += '</tr></tbody></table></div>';
  return html;
}

// ── Render legend ──

function renderLegend() {
  var html = '<div class="legend-section"><h3>Legend</h3>';
  var types = ["Sick", "PTO", "Bereavement", "Jury Duty"];
  types.forEach(function(t) {
    var bg = PTO_COLORS[t] || "#ccc";
    html += '<div class="legend-item">';
    html += '<span class="legend-swatch" style="background:' + bg + '"></span>';
    html += '<span>' + t + '</span></div>';
  });
  html += '</div>';
  return html;
}

// ── Render PTO calculation table ──

function renderCalcTable(rows) {
  var html = '<div class="calc-section"><h3>PTO Calculation Section</h3>';
  html += '<table class="calc-table"><thead><tr>';
  html += '<th>Month</th><th>Work Days</th><th>Daily Rate</th>';
  html += '<th>Accrued</th><th>Carryover</th><th>Subtotal</th>';
  html += '<th>Used</th><th>Remaining</th>';
  html += '</tr></thead><tbody>';

  var totalAccrued = 0, totalUsed = 0;
  rows.forEach(function(r) {
    totalAccrued += r.accruedHours;
    totalUsed += r.usedHours;
    html += '<tr>';
    html += '<td>' + r.monthName + '</td>';
    html += '<td>' + r.workDays + '</td>';
    html += '<td>' + r.dailyRate.toFixed(2) + '</td>';
    html += '<td>' + r.accruedHours.toFixed(2) + '</td>';
    html += '<td>' + r.carryover.toFixed(2) + '</td>';
    html += '<td>' + r.subtotal.toFixed(2) + '</td>';
    html += '<td>' + r.usedHours.toFixed(1) + '</td>';
    html += '<td>' + r.remainingBalance.toFixed(2) + '</td>';
    html += '</tr>';
  });

  html += '</tbody><tfoot><tr>';
  html += '<td>Total</td><td></td><td></td>';
  html += '<td>' + totalAccrued.toFixed(2) + '</td>';
  html += '<td></td><td></td>';
  html += '<td>' + totalUsed.toFixed(1) + '</td>';
  var last = rows.length ? rows[rows.length - 1].remainingBalance : 0;
  html += '<td>' + last.toFixed(2) + '</td>';
  html += '</tr></tfoot></table></div>';
  return html;
}

// ── Render acknowledgements ──

function renderAcknowledgements(emp) {
  var html = '<div class="ack-section"><h3>Acknowledgements</h3>';
  html += '<table class="ack-table"><thead><tr>';
  html += '<th>Month</th><th>Employee Ack</th><th>Admin Ack</th>';
  html += '</tr></thead><tbody>';

  for (var m = 1; m <= 12; m++) {
    var monthStr = REPORT_DATA.year + "-" + pad2(m);
    var empAck = emp.acknowledgements.find(function(a) { return a.month === monthStr; });
    var admAck = emp.adminAcknowledgements.find(function(a) { return a.month === monthStr; });

    html += '<tr>';
    html += '<td>' + MONTH_NAMES[m - 1] + '</td>';
    if (empAck) {
      html += '<td class="ack-status ack-yes">\\u2713</td>';
    } else {
      html += '<td class="ack-status ack-no">&mdash;</td>';
    }
    if (admAck) {
      html += '<td class="ack-status ack-yes">' + admAck.adminName + '</td>';
    } else {
      html += '<td class="ack-status ack-no">&mdash;</td>';
    }
    html += '</tr>';
  }

  html += '</tbody></table></div>';
  return html;
}

// ── Render full employee sheet ──

function renderEmployee(emp) {
  var year = REPORT_DATA.year;
  var ptoMap = buildPtoMap(emp.ptoEntries);

  var html = '<div class="sheet">';

  // Header
  html += '<div class="employee-header">';
  html += '<h2>' + emp.name + '</h2>';
  html += '<span class="hire-date">Hire Date: ' + emp.hireDate + '</span>';
  html += '</div>';

  // Legend
  html += renderLegend();

  // Calendar: 3 columns × 4 rows (Jan-Apr / May-Aug / Sep-Dec)
  // Column 1: Jan,Feb,Mar,Apr | Column 2: May,Jun,Jul,Aug | Column 3: Sep,Oct,Nov,Dec
  html += '<div class="calendar-grid">';
  var monthOrder = [
    [1, 5, 9],
    [2, 6, 10],
    [3, 7, 11],
    [4, 8, 12]
  ];
  monthOrder.forEach(function(row) {
    row.forEach(function(m) {
      html += renderMonth(year, m, ptoMap);
    });
  });
  html += '</div>';

  // PTO Calculation
  html += renderCalcTable(emp.ptoCalculation);

  // Acknowledgements
  html += renderAcknowledgements(emp);

  html += '</div>';
  return html;
}

// ── Boot ──

(function() {
  var select = document.getElementById("employee-select");
  var content = document.getElementById("report-content");

  // Populate dropdown
  REPORT_DATA.employees.forEach(function(emp, i) {
    var opt = document.createElement("option");
    opt.value = i;
    opt.textContent = emp.name;
    select.appendChild(opt);
  });

  function show(index) {
    content.innerHTML = renderEmployee(REPORT_DATA.employees[index]);
  }

  select.addEventListener("change", function() {
    show(parseInt(this.value, 10));
  });

  if (REPORT_DATA.employees.length > 0) {
    show(0);
  } else {
    content.innerHTML = '<p style="padding:20px;color:#888;">No employee data found for ' + REPORT_DATA.year + '.</p>';
  }
})();
`;
}
