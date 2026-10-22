import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  filesContaining,
  pdfTitle,
  PRIVATE_ENV,
  readPrivateDetails,
} from "../scripts/resume-private.mts";

const details = { fullName: "Ada Example", phone: "+00 111 222 3333" };

describe("readPrivateDetails", () => {
  test("reads both values, trimmed", () => {
    expect(
      readPrivateDetails({
        RESUME_FULL_NAME: " Ada Example ",
        RESUME_PHONE: "+00 111 222 3333\n",
      }),
    ).toEqual(details);
  });

  test("refuses when a value is missing or blank, naming every missing variable", () => {
    expect(() => readPrivateDetails({ RESUME_FULL_NAME: "  " })).toThrow(
      /RESUME_FULL_NAME, RESUME_PHONE.*\.env\.local/,
    );
  });

  test("never repeats a value that was set", () => {
    expect(() =>
      readPrivateDetails({ RESUME_FULL_NAME: "Ada Example" }),
    ).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining("Ada Example"),
      }),
    );
  });
});

describe("pdfTitle", () => {
  test("swaps the site name in the page title for the full name", () => {
    expect(pdfTitle("Résumé | Rob", "Ada Example")).toBe(
      "Résumé | Ada Example",
    );
  });

  test("gives the same title when applied twice", () => {
    expect(
      pdfTitle(pdfTitle("Résumé | Rob", "Ada Example"), "Ada Example"),
    ).toBe("Résumé | Ada Example");
  });

  test("refuses a title with no site name to swap", () => {
    expect(() => pdfTitle("Résumé", "Ada Example")).toThrow();
  });
});

describe("filesContaining", () => {
  test("names the files that carry either value, and only those", () => {
    expect(
      filesContaining(
        [
          ["out/resume.html", "<h1>Rob</h1>"],
          ["out/leak.html", "<li>+00 111 222 3333</li>"],
          ["content/profile.ts", 'name: "Ada Example"'],
        ],
        details,
      ),
    ).toEqual(["out/leak.html", "content/profile.ts"]);
  });

  test("catches the phone number written without spaces", () => {
    expect(
      filesContaining([["out/a.txt", "tel:+001112223333"]], details),
    ).toEqual(["out/a.txt"]);
  });
});

test(".env.example lists exactly the private variables, with no values", () => {
  const example = readFileSync(".env.example", "utf8").trim().split(/\r?\n/);
  expect(example).toEqual(Object.values(PRIVATE_ENV).map((name) => `${name}=`));
});
