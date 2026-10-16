import { describe, expect, test } from "vitest";
import { formatGaetaTime } from "../lib/clock";

describe("formatGaetaTime", () => {
  test("shows winter time as CET, one hour ahead of UTC", () => {
    expect(formatGaetaTime(new Date("2026-01-15T09:05:00Z"))).toBe("10:05 CET");
  });

  test("rolls over midnight into the next day", () => {
    expect(formatGaetaTime(new Date("2026-01-01T23:30:00Z"))).toBe("00:30 CET");
  });

  test("jumps from 01:59 CET to 03:00 CEST when DST starts", () => {
    expect(formatGaetaTime(new Date("2026-03-29T00:59:00Z"))).toBe("01:59 CET");
    expect(formatGaetaTime(new Date("2026-03-29T01:00:00Z"))).toBe(
      "03:00 CEST",
    );
  });

  test("falls back from 02:59 CEST to 02:00 CET when DST ends", () => {
    expect(formatGaetaTime(new Date("2026-10-25T00:59:00Z"))).toBe(
      "02:59 CEST",
    );
    expect(formatGaetaTime(new Date("2026-10-25T01:00:00Z"))).toBe("02:00 CET");
  });
});
