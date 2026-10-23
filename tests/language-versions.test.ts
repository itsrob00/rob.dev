import { describe, expect, test } from "vitest";
import {
  DEFAULT_LANGUAGE_VERSION,
  LANGUAGE_VERSIONS,
  alternatesFor,
  languageMenu,
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

describe("languageMenu", () => {
  const bothPublished = LANGUAGE_VERSIONS.map((version) => ({
    ...version,
    published: true,
  }));

  test("lists each published Language version by native name, linking to the same page, with the current one marked", () => {
    expect(languageMenu("/en/resume", "", bothPublished)).toEqual([
      { code: "en", name: "English", href: "/en/resume", current: true },
      { code: "it", name: "Italiano", href: "/it/resume", current: false },
    ]);
  });

  test.each([
    ["/en", "#work", ["/en#work", "/it#work"]],
    ["/it", "", ["/en", "/it"]],
    [
      "/it/projects/devflow",
      "#problem",
      ["/en/projects/devflow#problem", "/it/projects/devflow#problem"],
    ],
  ])("keeps the path and hash of %s%s", (pathname, hash, hrefs) => {
    expect(
      languageMenu(pathname, hash, bothPublished).map((entry) => entry.href),
    ).toEqual(hrefs);
  });

  test("marks the Language version the page is in", () => {
    expect(
      languageMenu("/it/projects/devflow", "", bothPublished).map(
        (entry) => entry.current,
      ),
    ).toEqual([false, true]);
  });

  test("leaves out unpublished Language versions", () => {
    expect(languageMenu("/en", "#about")).toEqual([
      { code: "en", name: "English", href: "/en#about", current: true },
    ]);
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
