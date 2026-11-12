import { dictionary } from "./dictionaries";
import type { LanguageCode } from "./language-versions";

const MONTHS = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
] as const;

type Month = (typeof MONTHS)[number];

/** "2026-01". Sorts correctly as a string. */
export type YearMonth = `${number}-${Month}`;

/** Narrows a string from outside the type checker (frontmatter) to a real YearMonth. */
export function isYearMonth(value: string): value is YearMonth {
  const [year, month] = value.split("-");
  return (
    value.length === 7 &&
    /^\d{4}$/.test(year) &&
    MONTHS.includes(month as Month)
  );
}

/** A span of months, both ends included. A missing `end` means ongoing. */
export type DateRange = { start: YearMonth; end?: YearMonth };

const DASH = " – ";

function parts(date: YearMonth, lang: LanguageCode) {
  const [year, month] = date.split("-") as [string, Month];
  return { year, month: dictionary[lang].dates.months[MONTHS.indexOf(month)] };
}

/**
 * Formats a range for display, with each Language version's own month table and no Date or Intl,
 * so the build output never depends on the machine's locale or time zone.
 *
 * year:  "2026 – now" | "2025" | "2023 – 2024"
 * month: "Jan 2026 – now" | "Jan – Dec 2025" | "Mar 2025" | "Jan 2023 – Dec 2024"
 */
export function formatDateRange(
  range: DateRange,
  precision: "year" | "month",
  lang: LanguageCode,
): string {
  if (range.end && range.end < range.start) {
    throw new RangeError(
      `Range ends before it starts: ${range.start} to ${range.end}`,
    );
  }

  const start = parts(range.start, lang);
  const startLabel =
    precision === "year" ? start.year : `${start.month} ${start.year}`;
  if (!range.end) {
    return `${startLabel}${DASH}${dictionary[lang].dates.ongoing}`;
  }

  const end = parts(range.end, lang);
  if (precision === "year") {
    return start.year === end.year
      ? start.year
      : `${start.year}${DASH}${end.year}`;
  }
  if (range.start === range.end) return startLabel;
  if (start.year === end.year) {
    return `${start.month}${DASH}${end.month} ${end.year}`;
  }
  return `${startLabel}${DASH}${end.month} ${end.year}`;
}
