import { describe, expect, test } from "vitest";
import { formatDateRange } from "../lib/date-range";

describe("formatDateRange in years", () => {
  test("shows an ongoing range as running to now", () => {
    expect(formatDateRange({ start: "2026-01" }, "year", "en")).toBe(
      "2026 – now",
    );
  });

  test("collapses a range inside one year to that year", () => {
    expect(
      formatDateRange({ start: "2025-01", end: "2025-12" }, "year", "en"),
    ).toBe("2025");
  });

  test("shows a range across years as first – last", () => {
    expect(
      formatDateRange({ start: "2023-01", end: "2024-12" }, "year", "en"),
    ).toBe("2023 – 2024");
  });
});

test("rejects a range that ends before it starts, failing the build", () => {
  expect(() =>
    formatDateRange({ start: "2025-06", end: "2025-01" }, "year", "en"),
  ).toThrow(RangeError);
});

describe("formatDateRange in months", () => {
  test("shows an ongoing range as running to now", () => {
    expect(formatDateRange({ start: "2026-01" }, "month", "en")).toBe(
      "Jan 2026 – now",
    );
  });

  test("names the year once for a range inside one year", () => {
    expect(
      formatDateRange({ start: "2025-01", end: "2025-12" }, "month", "en"),
    ).toBe("Jan – Dec 2025");
  });

  test("shows a single month on its own", () => {
    expect(
      formatDateRange({ start: "2025-03", end: "2025-03" }, "month", "en"),
    ).toBe("Mar 2025");
  });

  test("names both years for a range across years", () => {
    expect(
      formatDateRange({ start: "2023-01", end: "2024-12" }, "month", "en"),
    ).toBe("Jan 2023 – Dec 2024");
    expect(
      formatDateRange({ start: "2024-11", end: "2025-02" }, "month", "en"),
    ).toBe("Nov 2024 – Feb 2025");
  });

  test("uses fixed English abbreviations", () => {
    expect(
      formatDateRange({ start: "2024-09", end: "2024-09" }, "month", "en"),
    ).toBe("Sep 2024");
  });
});

describe("formatDateRange in Italian", () => {
  test("shows an ongoing range as running to oggi", () => {
    expect(formatDateRange({ start: "2026-01" }, "month", "it")).toBe(
      "gen 2026 – oggi",
    );
    expect(formatDateRange({ start: "2026-01" }, "year", "it")).toBe(
      "2026 – oggi",
    );
  });

  test("uses lowercase three-letter months", () => {
    expect(
      formatDateRange({ start: "2024-05", end: "2025-08" }, "month", "it"),
    ).toBe("mag 2024 – ago 2025");
    expect(
      formatDateRange({ start: "2025-06", end: "2025-12" }, "month", "it"),
    ).toBe("giu – dic 2025");
  });
});
