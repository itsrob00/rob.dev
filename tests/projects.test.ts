import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { getProject, getProjects } from "../lib/projects";

// Each fixture is a miniature repo root holding content/projects/*.mdx, so the tests call the
// same functions the pages do, pointed at the fixture through process.cwd().
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
    expect(getProjects().map((project) => project.slug)).toEqual([
      "newest",
      "middle",
      "older",
    ]);
  });
});

describe("getProject", () => {
  test("finds a Project by its slug, with fields from its frontmatter", () => {
    useFixture("valid");
    expect(getProject("middle")).toEqual({
      slug: "middle",
      href: "/projects/middle",
      kicker: "Open source · 2025",
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

  test("returns undefined for a slug no Project has", () => {
    useFixture("valid");
    expect(getProject("missing")).toBeUndefined();
  });
});

describe("invalid Projects fail the build", () => {
  test("rejects a Project with a missing field, naming the file and the field", () => {
    useFixture("missing-field");
    expect(() => getProjects()).toThrow(/no-title\.mdx.*title/);
  });

  test("rejects a Project with neither a repo nor a live link", () => {
    useFixture("no-link");
    expect(() => getProjects()).toThrow(
      /no-link\.mdx: links: add a repo or a live link/,
    );
  });

  test("rejects two Projects with the same slug, naming both files", () => {
    useFixture("duplicate-slug");
    expect(() => getProjects()).toThrow(/slug "same".*first\.mdx.*second\.mdx/);
  });

  test("reports every problem in the folder in one error", () => {
    useFixture("malformed");
    const error = (() => {
      try {
        getProjects();
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

// Fails `npm test` (and CI, before the build) when a real Project file is invalid.
test("accepts every Project in the site's content/projects", () => {
  expect(getProjects().length).toBeGreaterThan(0);
});
