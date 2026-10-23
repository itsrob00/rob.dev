import { describe, expect, test } from "vitest";
import {
  DEFAULT_LANGUAGE_VERSION,
  alternatesFor,
  languageVersion,
  pathIn,
  publishedLanguageVersions,
} from "../lib/language-versions";

describe("the language list", () => {
  test("publishes English only, for now", () => {
    expect(publishedLanguageVersions().map((version) => version.code)).toEqual([
      "en",
    ]);
  });

  test("defaults to English", () => {
    expect(DEFAULT_LANGUAGE_VERSION).toMatchObject({
      code: "en",
      name: "English",
      ogLocale: "en_US",
      pdfSuffix: "EN",
      published: true,
    });
  });

  test("finds a published Language version by its code", () => {
    expect(languageVersion("en")).toBe(DEFAULT_LANGUAGE_VERSION);
  });

  test.each(["it", "fr", ""])(
    "has no published Language version %j",
    (code) => {
      expect(() => languageVersion(code)).toThrow(/Language version/);
    },
  );
});

describe("pathIn", () => {
  test.each([
    ["/", "/en"],
    ["/resume", "/en/resume"],
    ["/projects/devflow", "/en/projects/devflow"],
    ["/#privacy", "/en#privacy"],
    ["/projects/devflow#problem", "/en/projects/devflow#problem"],
  ] as const)("puts %s under the Language version: %s", (path, expected) => {
    expect(pathIn("en", path)).toBe(expected);
  });
});

describe("alternatesFor", () => {
  test("lists the page in every published Language version, with x-default at the bare domain", () => {
    expect(alternatesFor("/resume")).toEqual({
      en: "/en/resume",
      "x-default": "/",
    });
    expect(alternatesFor("/")).toEqual({ en: "/en", "x-default": "/" });
  });
});
