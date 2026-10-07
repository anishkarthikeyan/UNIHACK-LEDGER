// Shared RFC 4180 CSV tokenizer for the database/ import scripts (quoted fields, embedded commas,
// embedded newlines, "" escapes, CRLF). Moved out of import-competitions.ts unchanged so the
// student roster importer parses exactly the same way.
//
// Splitting the file into lines BEFORE parsing quotes corrupts any row whose quoted field
// contains a real line break (the competitions sheet has two such rows), so the whole file is
// tokenized in one pass and a newline only ends a row when it is NOT inside an open quote.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  const endField = () => { row.push(cur); cur = ''; };
  const endRow = () => { endField(); rows.push(row); row = []; };
  while (i < n) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      cur += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ',') { endField(); i++; continue; }
    if (ch === '\r') { i++; continue; } // normalize CRLF — the \n right after ends the row
    if (ch === '\n') { endRow(); i++; continue; }
    cur += ch; i++;
  }
  // Final row, if the file doesn't end with a trailing newline.
  if (cur !== '' || row.length > 0) endRow();
  return rows.map((r) => r.map((f) => f.trim()));
}
