import { describe, expect, test } from "vitest";
import { contactItems, formatEducationDates } from "../lib/resume";

const profile = {
  location: "Gaeta, Italy",
  email: "someone@example.com",
  site: "https://example.dev",
  linkedin: "https://www.linkedin.com/in/someone",
  github: "https://github.com/someone",
} as const;

describe("contactItems", () => {
  const items = contactItems(profile, "Remote (CET)");
  const label = (medium: "screen" | "print") =>
    items.flatMap((item) => {
      if (item.kind === "text") return [item.text];
      if (medium === "print") return [item.print];
      return item.kind === "link" ? [item.screen] : [];
    });

  test("shows short labels on screen, without the site the reader is already on", () => {
    expect(label("screen")).toEqual([
      "Gaeta, Italy",
      "Remote (CET)",
      "Email",
      "LinkedIn",
      "GitHub",
    ]);
  });

  test("prints every address in full, the site included", () => {
    expect(label("print")).toEqual([
      "Gaeta, Italy",
      "Remote (CET)",
      "someone@example.com",
      "example.dev",
      "linkedin.com/in/someone",
      "github.com/someone",
    ]);
  });

  test("links only to absolute addresses, and marks the profiles as Rob's", () => {
    const links = items.filter((item) => item.kind !== "text");
    expect(links.map((link) => [link.href, link.rel])).toEqual([
      ["mailto:someone@example.com", undefined],
      ["https://example.dev", undefined],
      ["https://www.linkedin.com/in/someone", "me"],
      ["https://github.com/someone", "me"],
    ]);
  });
});

describe("formatEducationDates", () => {
  test("shows a course still under way as in progress", () => {
    expect(formatEducationDates({ kind: "in-progress" })).toBe("In progress");
  });

  test("shows a month range with the site's month precision", () => {
    expect(
      formatEducationDates({
        kind: "months",
        start: "2022-09",
        end: "2023-04",
      }),
    ).toBe("Sep 2022 – Apr 2023");
  });

  test("shows a completed qualification as its year", () => {
    expect(formatEducationDates({ kind: "completed", year: 2019 })).toBe(
      "2019",
    );
  });

  test("refuses a month range that ends before it starts", () => {
    expect(() =>
      formatEducationDates({
        kind: "months",
        start: "2023-04",
        end: "2022-09",
      }),
    ).toThrow(RangeError);
  });
});
