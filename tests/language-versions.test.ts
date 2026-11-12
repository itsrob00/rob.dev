import { describe, expect, test } from "vitest";
import {
  DEFAULT_LANGUAGE_VERSION,
  alternatesFor,
  languageMenu,
  languageVersion,
  pathIn,
  publishedLanguageVersions,
} from "../lib/language-versions";

describe("the language list", () => {
  test("publishes English, then Italian", () => {
    expect(publishedLanguageVersions().map((version) => version.code)).toEqual([
      "en",
      "it",
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
    expect(languageVersion("it")).toMatchObject({
      code: "it",
      name: "Italiano",
      ogLocale: "it_IT",
      pdfSuffix: "IT",
    });
  });

  test.each(["fr", "IT", ""])(
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
  test("lists each published Language version by native name and flag, linking to the same page, with the current one marked", () => {
    expect(languageMenu("/en/resume", "")).toEqual([
      {
        code: "en",
        name: "English",
        region: "US",
        href: "/en/resume",
        current: true,
      },
      {
        code: "it",
        name: "Italiano",
        region: "IT",
        href: "/it/resume",
        current: false,
      },
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
    expect(languageMenu(pathname, hash).map((entry) => entry.href)).toEqual(
      hrefs,
    );
  });

  test("marks the Language version the page is in", () => {
    expect(
      languageMenu("/it/projects/devflow", "").map((entry) => entry.current),
    ).toEqual([false, true]);
  });
});

describe("alternatesFor", () => {
  test("lists the page in every published Language version, with x-default at the bare domain", () => {
    expect(alternatesFor("/resume")).toEqual({
      en: "/en/resume",
      it: "/it/resume",
      "x-default": "/",
    });
    expect(alternatesFor("/")).toEqual({
      en: "/en",
      it: "/it",
      "x-default": "/",
    });
  });
});
