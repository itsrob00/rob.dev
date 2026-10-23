import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  DEFAULT_LANGUAGE_VERSION,
  LANGUAGE_VERSIONS,
  publishedLanguageVersions,
} from "../lib/language-versions";

type Redirect = {
  source: string;
  destination: string;
  permanent: boolean;
  has?: { type: string; key?: string; value: string }[];
};

const { redirects } = JSON.parse(
  fs.readFileSync(path.join(import.meta.dirname, "../vercel.json"), "utf8"),
) as { redirects: Redirect[] };

const home = redirects.filter((redirect) => redirect.source === "/");

describe("the bare domain's redirect", () => {
  test("is temporary, so a visitor's language can send them elsewhere later", () => {
    expect(home.length).toBeGreaterThan(0);
    for (const redirect of home) expect(redirect.permanent).toBe(false);
  });

  test("ends with the default Language version, for every visitor no earlier rule matched", () => {
    expect(home.at(-1)).toEqual({
      source: "/",
      destination: `/${DEFAULT_LANGUAGE_VERSION.code}`,
      permanent: false,
    });
  });

  test("sends a browser asking for another published Language version to it", () => {
    const others = publishedLanguageVersions().filter(
      (version) => version !== DEFAULT_LANGUAGE_VERSION,
    );
    for (const { code } of others) {
      const rule = home.find((redirect) => redirect.destination === `/${code}`);
      expect(rule?.has, code).toEqual([
        expect.objectContaining({ type: "header", key: "accept-language" }),
      ]);
      expect(new RegExp(rule!.has![0].value).test(`${code},en;q=0.8`)).toBe(
        true,
      );
    }
    expect(home).toHaveLength(others.length + 1);
  });

  test("never sends anyone to an unpublished Language version", () => {
    const unpublished = LANGUAGE_VERSIONS.filter((v) => !v.published).map(
      (v) => `/${v.code}`,
    );
    for (const redirect of redirects) {
      expect(unpublished).not.toContain(
        redirect.destination.replace(/^(\/[^/]+).*$/, "$1"),
      );
    }
  });
});

describe("the old English URLs", () => {
  test("redirect the old Résumé PDF permanently to the English one", () => {
    expect(redirects).toContainEqual({
      source: "/Rob-Resume.pdf",
      destination: "/Roberto-Prats-EN.pdf",
      permanent: true,
    });
  });

  test.each([
    ["/resume", "/resume"],
    ["/opengraph-image", "/opengraph-image"],
    ["/projects/:slug", "/projects/:slug"],
    ["/projects/:slug/opengraph-image", "/projects/:slug/opengraph-image"],
  ])(
    "redirect %s permanently to the default Language version",
    (source, path) => {
      expect(redirects).toContainEqual({
        source,
        destination: `/${DEFAULT_LANGUAGE_VERSION.code}${path}`,
        permanent: true,
      });
    },
  );
});
