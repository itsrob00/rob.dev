import { describe, expect, test } from "vitest";
import { formatDateRange, formatYearSpan } from "../lib/date-range";

describe("formatDateRange in years", () => {
  test("shows an ongoing range as running to now", () => {
    expect(formatDateRange({ start: "2026-01" }, "year")).toBe("2026 – now");
  });

  test("collapses a range inside one year to that year", () => {
    expect(formatDateRange({ start: "2025-01", end: "2025-12" }, "year")).toBe(
      "2025",
    );
  });

  test("shows a range across years as first – last", () => {
    expect(formatDateRange({ start: "2023-01", end: "2024-12" }, "year")).toBe(
      "2023 – 2024",
    );
  });
});

test("rejects a range that ends before it starts, failing the build", () => {
  expect(() =>
    formatDateRange({ start: "2025-06", end: "2025-01" }, "year"),
  ).toThrow(RangeError);
});

describe("formatDateRange in months", () => {
  test("shows an ongoing range as running to now", () => {
    expect(formatDateRange({ start: "2026-01" }, "month")).toBe(
      "Jan 2026 – now",
    );
  });

  test("names the year once for a range inside one year", () => {
    expect(formatDateRange({ start: "2025-01", end: "2025-12" }, "month")).toBe(
      "Jan – Dec 2025",
    );
  });

  test("shows a single month on its own", () => {
    expect(formatDateRange({ start: "2025-03", end: "2025-03" }, "month")).toBe(
      "Mar 2025",
    );
  });

  test("names both years for a range across years", () => {
    expect(formatDateRange({ start: "2023-01", end: "2024-12" }, "month")).toBe(
      "Jan 2023 – Dec 2024",
    );
    expect(formatDateRange({ start: "2024-11", end: "2025-02" }, "month")).toBe(
      "Nov 2024 – Feb 2025",
    );
  });

  test("uses fixed English abbreviations", () => {
    expect(formatDateRange({ start: "2024-09", end: "2024-09" }, "month")).toBe(
      "Sep 2024",
    );
  });
});

describe("formatYearSpan", () => {
  test("shows a span across years as first – last", () => {
    expect(formatYearSpan({ start: 2014, end: 2019 })).toBe("2014 – 2019");
  });

  test("shows a span inside one year as that year", () => {
    expect(formatYearSpan({ start: 2019, end: 2019 })).toBe("2019");
  });

  test("rejects a span that ends before it starts, failing the build", () => {
    expect(() => formatYearSpan({ start: 2019, end: 2014 })).toThrow(
      RangeError,
    );
  });
});
