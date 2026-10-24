import { describe, expect, test } from "vitest";
import { absoluteUrl, sitemapEntries } from "../lib/sitemap";

describe("absoluteUrl", () => {
  test("is the bare origin for the home page, with no trailing slash", () => {
    expect(absoluteUrl("/")).toBe("https://itsrob.dev");
  });

  test("appends any other path to the origin", () => {
    expect(absoluteUrl("/projects/devflow")).toBe(
      "https://itsrob.dev/projects/devflow",
    );
  });
});

describe("sitemapEntries", () => {
  test("lists home, the Résumé, then every Project in each published Language version, as absolute URLs", () => {
    const projects = [
      { href: "/projects/newest" as const },
      { href: "/projects/older" as const },
    ];
    expect(sitemapEntries(projects).map((entry) => entry.url)).toEqual([
      "https://itsrob.dev/en",
      "https://itsrob.dev/en/resume",
      "https://itsrob.dev/en/projects/newest",
      "https://itsrob.dev/en/projects/older",
      "https://itsrob.dev/it",
      "https://itsrob.dev/it/resume",
      "https://itsrob.dev/it/projects/newest",
      "https://itsrob.dev/it/projects/older",
    ]);
  });

  test("gives each page its alternates, with x-default at the bare domain", () => {
    const [, englishResume, , italianResume] = sitemapEntries([]);
    for (const resume of [englishResume, italianResume]) {
      expect(resume.alternates).toEqual({
        languages: {
          en: "https://itsrob.dev/en/resume",
          it: "https://itsrob.dev/it/resume",
          "x-default": "https://itsrob.dev",
        },
      });
    }
  });
});
