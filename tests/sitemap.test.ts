import { describe, expect, test } from "vitest";
import { absoluteUrl, sitemapUrls } from "../lib/sitemap";

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

describe("sitemapUrls", () => {
  test("lists home, the Résumé, then every Project, as absolute URLs", () => {
    const projects = [
      { href: "/projects/newest" as const },
      { href: "/projects/older" as const },
    ];
    expect(sitemapUrls(projects)).toEqual([
      "https://itsrob.dev",
      "https://itsrob.dev/resume",
      "https://itsrob.dev/projects/newest",
      "https://itsrob.dev/projects/older",
    ]);
  });
});
