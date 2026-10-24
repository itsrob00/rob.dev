import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  getProject,
  getProjects,
  isOpenable,
  projectKicker,
} from "../lib/projects";

// Each fixture is a miniature repo root holding content/projects/<language>/*.mdx, so the tests call
// the same functions the pages do, pointed at the fixture through process.cwd().
function useFixture(name: string) {
  vi.spyOn(process, "cwd").mockReturnValue(
    path.join(import.meta.dirname, "fixtures", "projects", name),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getProjects", () => {
  test("lists Projects newest first by start", () => {
    useFixture("valid");
    expect(getProjects("en").map((project) => project.slug)).toEqual([
      "newest",
      "middle",
      "older",
    ]);
  });

  test("reads the folder for the Language version asked for", () => {
    useFixture("valid");
    expect(getProjects("it").map((project) => project.title)).toEqual([
      "Il più recente",
      "Nel mezzo",
      "Il più vecchio",
    ]);
  });

  test("lists the Projects a visitor can open before newer ones that aren't public yet", () => {
    useFixture("openable-first");
    expect(getProjects("en").map((project) => project.slug)).toEqual([
      "public-older",
      "not-public-newer",
    ]);
  });
});

describe("isOpenable", () => {
  test("a Project with a repo or live link can be opened; one without links can't", () => {
    useFixture("openable-first");
    const [publicOlder, notPublic] = getProjects("en");
    expect(isOpenable(publicOlder)).toBe(true);
    expect(isOpenable(notPublic)).toBe(false);
    expect(notPublic.links).toEqual({});
  });
});

describe("projectKicker", () => {
  test("labels a Project with its kind and start year, in the Language version asked for", () => {
    expect(projectKicker({ kind: "Open source", start: "2025-06" }, "en")).toBe(
      "Open source · 2025",
    );
    expect(projectKicker({ kind: "Concept", start: "2026-10" }, "en")).toBe(
      "Concept · 2026",
    );
  });
});

describe("getProject", () => {
  test("finds a Project by its slug, with fields from its frontmatter", () => {
    useFixture("valid");
    expect(getProject("middle", "en")).toEqual({
      slug: "middle",
      href: "/projects/middle",
      kind: "Concept",
      title: "Middle",
      summary: "Started in between.",
      role: "Maintainer",
      start: "2025-06",
      stack: ["Node.js"],
      links: {
        repo: "https://github.com/example/middle",
        live: "https://middle.example.com",
      },
    });
  });

  test("finds the same slug in another Language version, with that file's copy", () => {
    useFixture("valid");
    expect(getProject("middle", "it")).toMatchObject({
      slug: "middle",
      href: "/projects/middle",
      title: "Nel mezzo",
      summary: "Iniziato nel mezzo.",
    });
  });

  test("returns undefined for a slug no Project has", () => {
    useFixture("valid");
    expect(getProject("missing", "en")).toBeUndefined();
  });
});

describe("invalid Projects fail the build", () => {
  test("rejects a Project with a missing field, naming the file and the field", () => {
    useFixture("missing-field");
    expect(() => getProjects("en")).toThrow(/no-title\.mdx.*title/);
  });

  test("rejects an empty links block, which is a typo for either a link or no links", () => {
    useFixture("no-link");
    expect(() => getProjects("en")).toThrow(
      /no-link\.mdx: links: add a repo or a live link, or leave links out/,
    );
  });

  test("rejects two Projects with the same slug, naming both files", () => {
    useFixture("duplicate-slug");
    expect(() => getProjects("en")).toThrow(
      /slug "same".*first\.mdx.*second\.mdx/,
    );
  });

  test("rejects a Project missing in a Language version, in every Language version", () => {
    useFixture("missing-language");
    expect(() => getProjects("en")).toThrow(
      /it: no file for Project "english-only"/,
    );
    expect(() => getProjects("it")).toThrow(
      /it: no file for Project "english-only"/,
    );
  });

  test("reports every problem in the folder in one error", () => {
    useFixture("malformed");
    const error = (() => {
      try {
        getProjects("en");
      } catch (thrown) {
        return String(thrown);
      }
    })();
    expect(error).toMatch(/malformed\.mdx: slug:/);
    expect(error).toMatch(/malformed\.mdx: end: end is before start/);
    expect(error).toMatch(/malformed\.mdx: links\.repo:/);
    expect(error).toMatch(/malformed\.mdx: Unrecognized key: "order"/);
    expect(error).toMatch(/notes\.txt: only \.mdx files/);
  });
});

// Fails `npm test` (and CI, before the build) when a real Project file is invalid or missing a
// Language version.
test("accepts every Project in the site's content/projects", () => {
  expect(getProjects("en").length).toBeGreaterThan(0);
});
