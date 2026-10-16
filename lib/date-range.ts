const MONTHS = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "May",
  "06": "Jun",
  "07": "Jul",
  "08": "Aug",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Dec",
} as const;

type Month = keyof typeof MONTHS;

/** "2026-01". Sorts correctly as a string. */
export type YearMonth = `${number}-${Month}`;

/** Narrows a string from outside the type checker (frontmatter) to a real YearMonth. */
export function isYearMonth(value: string): value is YearMonth {
  const [year, month] = value.split("-");
  return value.length === 7 && /^\d{4}$/.test(year) && month in MONTHS;
}

/** A span of months, both ends included. A missing `end` means ongoing. */
export type DateRange = { start: YearMonth; end?: YearMonth };

const DASH = " – ";

function parts(date: YearMonth) {
  const [year, month] = date.split("-") as [string, Month];
  return { year, month: MONTHS[month] };
}

/**
 * Formats a range for display, with a fixed month table and no Date or Intl, so the build
 * output never depends on the machine's locale or time zone.
 *
 * year:  "2026 – now" | "2025" | "2023 – 2024"
 * month: "Jan 2026 – now" | "Jan – Dec 2025" | "Mar 2025" | "Jan 2023 – Dec 2024"
 */
export function formatDateRange(
  range: DateRange,
  precision: "year" | "month",
): string {
  if (range.end && range.end < range.start) {
    throw new RangeError(
      `Range ends before it starts: ${range.start} to ${range.end}`,
    );
  }

  const start = parts(range.start);
  const startLabel =
    precision === "year" ? start.year : `${start.month} ${start.year}`;
  if (!range.end) return `${startLabel}${DASH}now`;

  const end = parts(range.end);
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

/** Whole years, both ends included, for records that only know years (Education). */
export type YearSpan = { start: number; end: number };

/** "2014 – 2019" | "2019". Same dash as formatDateRange. */
export function formatYearSpan(span: YearSpan): string {
  if (span.end < span.start) {
    throw new RangeError(
      `Span ends before it starts: ${span.start} to ${span.end}`,
    );
  }
  return span.start === span.end
    ? `${span.start}`
    : `${span.start}${DASH}${span.end}`;
}
