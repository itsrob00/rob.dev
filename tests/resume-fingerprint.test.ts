import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  checkResumePdf,
  fingerprintResume,
  saveResumePdf,
} from "../scripts/resume-fingerprint.mts";

// Each test writes a miniature repo to a temp folder rather than committing one under tests/fixtures:
// tsconfig and ESLint cover every **/*.tsx, and a fixture's @/ imports would resolve against this repo.
const FILES: Record<string, string | Buffer> = {
  "app/layout.tsx": `import { sans } from "./fonts";\nimport "./globals.css";\n`,
  "app/globals.css": "@page {\n  size: A4;\n}\n",
  "app/fonts/index.ts": `export const sans = localFont({ src: "./Sans.otf" });\n`,
  "app/fonts/Sans.otf": Buffer.from([
    0x4f, 0x54, 0x54, 0x4f, 0x00, 0x01, 0x0d, 0x0a,
  ]),
  "app/resume/page.tsx": `import { profile } from "@/content/profile";\nimport styles from "./page.module.css";\n`,
  "app/resume/page.module.css": ".resume {\n  color: black;\n}\n",
  "content/profile.ts": `export const profile = { name: "Rob" };\n`,
  "content/projects/one.mdx": "---\ntitle: One\n---\n\nThe body.\n",
  "lib/unused.ts": "export const unused = 1;\n",
};

const roots: string[] = [];

function miniRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "resume-fingerprint-"));
  roots.push(root);
  const write = (file: string, contents: string | Buffer) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), contents);
  };
  for (const [file, contents] of Object.entries(FILES)) write(file, contents);
  return {
    root,
    write,
    edit(file: string, change: (text: string) => string) {
      const full = path.join(root, file);
      fs.writeFileSync(full, change(fs.readFileSync(full, "utf8")));
    },
  };
}

afterEach(() => {
  for (const root of roots.splice(0))
    fs.rmSync(root, { recursive: true, force: true });
});

describe("fingerprintResume", () => {
  test("the same inputs give the same fingerprint, over the files the Résumé is built from", () => {
    const fingerprint = fingerprintResume(miniRepo().root);

    expect(fingerprintResume(miniRepo().root)).toEqual(fingerprint);
    expect([...fingerprint.keys()]).toEqual([
      "app/fonts/Sans.otf",
      "app/fonts/index.ts",
      "app/globals.css",
      "app/layout.tsx",
      "app/resume/page.module.css",
      "app/resume/page.tsx",
      "content/profile.ts",
      "content/projects/one.mdx",
      "recipe",
    ]);
  });

  test.each([
    [
      "a record",
      "content/profile.ts",
      `export const profile = { name: "Robert" };\n`,
    ],
    [
      "the page code",
      "app/resume/page.tsx",
      `import { profile } from "@/content/profile";\n`,
    ],
    [
      "a font",
      "app/fonts/Sans.otf",
      Buffer.from([0x4f, 0x54, 0x54, 0x4f, 0x00, 0x02]),
    ],
    [
      "a Project's frontmatter",
      "content/projects/one.mdx",
      "---\ntitle: Uno\n---\n\nThe body.\n",
    ],
  ])("changing %s changes it", (_, file, contents) => {
    const repo = miniRepo();
    const before = fingerprintResume(repo.root);

    repo.write(file, contents);

    expect(fingerprintResume(repo.root)).not.toEqual(before);
  });

  test("a module the page starts importing joins it", () => {
    const repo = miniRepo();
    repo.write(
      "content/certifications.ts",
      "export const certifications = [];\n",
    );
    repo.edit(
      "app/resume/page.tsx",
      (page) => `${page}import "@/content/certifications";\n`,
    );

    expect(fingerprintResume(repo.root).has("content/certifications.ts")).toBe(
      true,
    );
  });

  test.each([
    [
      "CRLF line endings",
      "app/resume/page.module.css",
      (css: string) => css.replace(/\n/g, "\r\n"),
    ],
    [
      "a Project body edit",
      "content/projects/one.mdx",
      (mdx: string) => `${mdx}\nMore body.\n`,
    ],
  ])("%s don't change it", (_, file, change) => {
    const repo = miniRepo();
    const before = fingerprintResume(repo.root);

    repo.edit(file, change);

    expect(fingerprintResume(repo.root)).toEqual(before);
  });
});

describe("checkResumePdf", () => {
  const PDF = Buffer.from("%PDF-1.7 one page");

  test("passes once the PDF is saved, and fails on a mismatch saying what changed and how to fix it", () => {
    const repo = miniRepo();
    expect(checkResumePdf(repo.root)).toMatchObject({ stale: true });

    saveResumePdf(repo.root, fingerprintResume(repo.root), PDF);
    expect(checkResumePdf(repo.root)).toEqual({ stale: false });

    repo.edit("content/profile.ts", (profile) =>
      profile.replace("Rob", "Robert"),
    );
    const check = checkResumePdf(repo.root);
    expect(check.stale).toBe(true);
    expect(check.stale && check.message).toMatch(
      /changed\s+content\/profile\.ts/,
    );
    expect(check.stale && check.message).toMatch(/npm run resume:pdf/);
  });

  test("fails when the PDF is replaced without re-rendering", () => {
    const repo = miniRepo();
    saveResumePdf(repo.root, fingerprintResume(repo.root), PDF);

    repo.write("public/Rob-Resume.pdf", Buffer.from("%PDF-1.7 edited by hand"));

    const check = checkResumePdf(repo.root);
    expect(check.stale && check.message).toMatch(
      /changed\s+public\/Rob-Resume\.pdf/,
    );
  });

  test("with staged files, checks only when one of them is a Résumé input", () => {
    const repo = miniRepo();
    saveResumePdf(repo.root, fingerprintResume(repo.root), PDF);
    repo.edit("content/profile.ts", (profile) =>
      profile.replace("Rob", "Robert"),
    );

    expect(
      checkResumePdf(repo.root, [path.join(repo.root, "lib/unused.ts")]),
    ).toEqual({
      stale: false,
    });
    expect(
      checkResumePdf(repo.root, [path.join(repo.root, "content/profile.ts")]),
    ).toMatchObject({
      stale: true,
    });
  });
});

// Against this repo, not a mini one: which of the site's own files can make the Résumé PDF stale.
describe("the Résumé's inputs in this repo", () => {
  const inputs = [
    ...fingerprintResume(path.join(import.meta.dirname, "..")).keys(),
  ];

  test("include the page metadata rules, which set the Résumé's title", () => {
    expect(inputs).toContain("lib/site-metadata.ts");
  });

  test("leave out the sharing images, icons, JSON-LD, sitemap, robots and Repo previews", () => {
    expect(inputs).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /opengraph-image|icon\.tsx|share-images|theme-tokens|person-json-ld|sitemap|robots|repo-preview/,
        ),
      ]),
    );
  });

  test("include the Résumé's own record but leave out home's Stack, its brand marks and the home components", () => {
    expect(inputs).toContain("content/resume.ts");
    expect(inputs).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /content\/stack|technology|home-sections|stack-tags|work-highlight/,
        ),
      ]),
    );
  });
});
