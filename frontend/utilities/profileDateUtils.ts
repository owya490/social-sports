/** Canonical stored DOB format: DD/MM/YYYY */
const STORED_DATE_PATTERN = /^(\d{1,2})([/-])(\d{1,2})\2(\d{4})$/;
/** HTML date input format: YYYY-MM-DD */
const INPUT_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/**
 * Converts a stored DOB (DD/MM/YYYY or legacy DD-MM-YYYY with consistent
 * delimiters) into an HTML date input value (YYYY-MM-DD).
 * Returns "" for empty, malformed, mixed-delimiter, or impossible dates.
 */
export function convertDateToInput(dateStr: string): string {
  if (!dateStr) {
    return "";
  }

  const match = dateStr.match(STORED_DATE_PATTERN);
  if (!match) {
    return "";
  }

  const day = Number(match[1]);
  const month = Number(match[3]);
  const year = Number(match[4]);

  if (!isValidCalendarDate(year, month, day)) {
    return "";
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Converts an HTML date input value (YYYY-MM-DD) into the canonical stored
 * DOB format (DD/MM/YYYY). Returns "" for empty, malformed, or impossible dates.
 */
export function convertInputToDate(dateStr: string): string {
  if (!dateStr) {
    return "";
  }

  const match = dateStr.match(INPUT_DATE_PATTERN);
  if (!match) {
    return "";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!isValidCalendarDate(year, month, day)) {
    return "";
  }

  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${String(year).padStart(4, "0")}`;
}
