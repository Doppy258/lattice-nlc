/**
 * Lightweight, dependency-free report export helpers. Reports can be exported as
 * a CSV (to analyze in a spreadsheet) or sent to the browser print dialog for a
 * clean PDF — satisfying "output reports allow the user to customize and analyze
 * information." Everything here uses plain browser APIs, so it works offline.
 */

/** A titled block of rows within a CSV file (e.g. "Summary", "Claims by category"). */
export type CsvSection = {
  title: string;
  /** Optional header row (e.g. ["Metric", "Value"]). */
  headers?: string[];
  rows: (string | number)[][];
};

/** Escapes a single CSV cell per RFC 4180 (wrap in quotes if it has , " or newline). */
function escapeCell(value: string | number): string {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(row: (string | number)[]): string {
  return row.map(escapeCell).join(",");
}

/** Builds one CSV document from titled sections, separated by blank lines. */
export function sectionsToCsv(sections: CsvSection[]): string {
  const lines: string[] = [];
  sections.forEach((section, i) => {
    if (i > 0) lines.push(""); // blank line between sections
    lines.push(escapeCell(section.title));
    if (section.headers) lines.push(rowToCsv(section.headers));
    for (const row of section.rows) lines.push(rowToCsv(row));
  });
  return lines.join("\r\n");
}

/** Builds a CSV from sections and triggers a download in the browser. */
export function downloadCsv(filename: string, sections: CsvSection[]): void {
  if (typeof window === "undefined") return;
  const csv = sectionsToCsv(sections);
  // Prepend a BOM so Excel reads UTF-8 (e.g. the ★ and £/$ characters) correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** A filesystem-safe yyyy-mm-dd stamp for export filenames. */
export function dateStamp(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Slugifies a label for use in a filename (e.g. a business name). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "report";
}

/** Opens the browser print dialog (the @media print stylesheet handles layout). */
export function printReport(): void {
  if (typeof window !== "undefined") window.print();
}
