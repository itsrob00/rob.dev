import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { publishedLanguageVersions } from "../lib/language-versions";
import {
  checkResumePdf,
  checkResumePdfs,
  fingerprintResume,
  resumePdfEntries,
  saveResumePdf,
  type ResumePdfEntry,
} from "../scripts/resume-fingerprint.mts";

// Each test writes a miniature repo to a temp folder rather than committing one under tests/fixtures:
// tsconfig and ESLint cover every **/*.tsx, and a fixture's @/ imports would resolve against this repo.
const FILES: Record<string, string | Buffer> = {
  "lib/language-versions.ts": languageList({ en: true, it: true }),
  "app/[lang]/layout.tsx": `import { sans } from "../fonts";\nimport "../globals.css";\nimport "@/lib/language-versions";\n`,
  "app/globals.css": "@page {\n  size: A4;\n}\n",
  "app/fonts/index.ts": `export const sans = localFont({ src: "./Sans.otf" });\n`,
  "app/fonts/Sans.otf": Buffer.from([
    0x4f, 0x54, 0x54, 0x4f, 0x00, 0x01, 0x0d, 0x0a,
  ]),
  "app/[lang]/resume/page.tsx": `import { profile } from "@/content/profile";\nimport { copy } from "@/content/copy";\nimport styles from "./page.module.css";\n`,
  "app/[lang]/resume/page.module.css": ".resume {\n  color: black;\n}\n",
  "content/profile.ts": `export const profile = { name: "Rob" };\n`,
  "content/copy/index.ts": `import { en } from "./en";\nimport { it } from "./it";\n\nexport const copy = { en, it };\n`,
  "content/copy/en.ts": `export const en = { skills: "Skills" };\n`,
  "content/copy/it.ts": `export const it = { skills: "Competenze" };\n`,
  "content/projects/one.mdx": "---\ntitle: One\n---\n\nThe body.\n",
  "lib/unused.ts": "export const unused = 1;\n",
};

function languageList(published: { en: boolean; it: boolean }): string {
  return `const LIST = [
  {
    code: "en",
    name: "English",
    pdfSuffix: "EN",
    published: ${published.en},
  },
  {
    code: "it",
    name: "Italiano",
    pdfSuffix: "IT",
    published: ${published.it},
  },
] as const satisfies readonly {
  code: string;
  name: string;
  pdfSuffix: string;
  published: boolean;
}[];
`;
}

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
    entry(language: string): ResumePdfEntry {
      return resumePdfEntries(root).find(
        (entry) => entry.language === language,
      )!;
    },
  };
}

afterEach(() => {
  for (const root of roots.splice(0))
    fs.rmSync(root, { recursive: true, force: true });
});

describe("resumePdfEntries", () => {
  test("one per published Language version, each with its route, PDF and lock", () => {
    expect(resumePdfEntries(miniRepo().root)).toEqual([
      {
        language: "en",
        route: "app/[lang]/resume",
        path: "/en/resume",
        pdf: "public/Roberto-Prats-EN.pdf",
        lock: "app/[lang]/resume/resume-pdf.en.lock",
      },
      {
        language: "it",
        route: "app/[lang]/resume",
        path: "/it/resume",
        pdf: "public/Roberto-Prats-IT.pdf",
        lock: "app/[lang]/resume/resume-pdf.it.lock",
      },
    ]);
  });

  test("none for an unpublished Language version", () => {
    const repo = miniRepo();
    repo.write(
      "lib/language-versions.ts",
      languageList({ en: true, it: false }),
    );

    expect(resumePdfEntries(repo.root).map((entry) => entry.language)).toEqual([
      "en",
    ]);
  });
});

describe("fingerprintResume", () => {
  test("the same inputs give the same fingerprint, over the files the Résumé is built from", () => {
    const repo = miniRepo();
    const fingerprint = fingerprintResume(repo.root, repo.entry("en"));

    expect(fingerprintResume(repo.root, repo.entry("en"))).toEqual(fingerprint);
    expect([...fingerprint.keys()]).toEqual([
      "app/[lang]/layout.tsx",
      "app/[lang]/resume/page.module.css",
      "app/[lang]/resume/page.tsx",
      "app/fonts/Sans.otf",
      "app/fonts/index.ts",
      "app/globals.css",
      "content/copy/en.ts",
      "content/copy/index.ts",
      "content/profile.ts",
      "content/projects/one.mdx",
      "lib/language-versions.ts",
      "recipe",
    ]);
  });

  test("leave out another Language version's files, by file name or by folder", () => {
    const repo = miniRepo();
    repo.write("content/projects/en/two.mdx", "---\ntitle: Two\n---\n");
    repo.write("content/projects/it/two.mdx", "---\ntitle: Due\n---\n");

    const english = [...fingerprintResume(repo.root, repo.entry("en")).keys()];
    const italian = [...fingerprintResume(repo.root, repo.entry("it")).keys()];

    expect(english).toEqual(
      expect.arrayContaining([
        "content/copy/en.ts",
        "content/projects/en/two.mdx",
      ]),
    );
    expect(english).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/\bit\b/)]),
    );
    expect(italian).toEqual(
      expect.arrayContaining([
        "content/copy/it.ts",
        "content/projects/it/two.mdx",
      ]),
    );
    expect(italian).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/\ben\b/)]),
    );
  });

  test.each([
    [
      "a record",
      "content/profile.ts",
      `export const profile = { name: "Robert" };\n`,
    ],
    [
      "the page code",
      "app/[lang]/resume/page.tsx",
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
    const before = fingerprintResume(repo.root, repo.entry("en"));

    repo.write(file, contents);

    expect(fingerprintResume(repo.root, repo.entry("en"))).not.toEqual(before);
  });

  test("a module the page starts importing joins it", () => {
    const repo = miniRepo();
    repo.write(
      "content/certifications.ts",
      "export const certifications = [];\n",
    );
    repo.edit(
      "app/[lang]/resume/page.tsx",
      (page) => `${page}import "@/content/certifications";\n`,
    );

    expect(
      fingerprintResume(repo.root, repo.entry("en")).has(
        "content/certifications.ts",
      ),
    ).toBe(true);
  });

  test.each([
    [
      "CRLF line endings",
      "app/[lang]/resume/page.module.css",
      (css: string) => css.replace(/\n/g, "\r\n"),
    ],
    [
      "a Project body edit",
      "content/projects/one.mdx",
      (mdx: string) => `${mdx}\nMore body.\n`,
    ],
  ])("%s don't change it", (_, file, change) => {
    const repo = miniRepo();
    const before = fingerprintResume(repo.root, repo.entry("en"));

    repo.edit(file, change);

    expect(fingerprintResume(repo.root, repo.entry("en"))).toEqual(before);
  });
});

describe("checkResumePdf", () => {
  const PDF = Buffer.from("%PDF-1.7 one page");

  function saveAll(root: string) {
    for (const entry of resumePdfEntries(root))
      saveResumePdf(root, entry, fingerprintResume(root, entry), PDF);
  }

  test("passes once the PDF is saved, and fails on a mismatch saying what changed and how to fix it", () => {
    const repo = miniRepo();
    expect(checkResumePdf(repo.root, repo.entry("en"))).toMatchObject({
      stale: true,
    });

    saveAll(repo.root);
    expect(checkResumePdf(repo.root, repo.entry("en"))).toEqual({
      stale: false,
    });

    repo.edit("content/profile.ts", (profile) =>
      profile.replace("Rob", "Robert"),
    );
    const check = checkResumePdf(repo.root, repo.entry("en"));
    expect(check.stale).toBe(true);
    expect(check.stale && check.message).toMatch(
      /changed\s+content\/profile\.ts/,
    );
    expect(check.stale && check.message).toMatch(
      /npm run resume:pdf.*public\/Roberto-Prats-EN\.pdf and app\/\[lang\]\/resume\/resume-pdf\.en\.lock/,
    );
  });

  test("fails when the PDF is replaced without re-rendering", () => {
    const repo = miniRepo();
    saveAll(repo.root);

    repo.write(
      "public/Roberto-Prats-EN.pdf",
      Buffer.from("%PDF-1.7 edited by hand"),
    );

    const check = checkResumePdf(repo.root, repo.entry("en"));
    expect(check.stale && check.message).toMatch(
      /changed\s+public\/Roberto-Prats-EN\.pdf/,
    );
  });

  test("with staged files, checks only when one of them is a Résumé input", () => {
    const repo = miniRepo();
    saveAll(repo.root);
    repo.edit("content/profile.ts", (profile) =>
      profile.replace("Rob", "Robert"),
    );

    expect(
      checkResumePdf(repo.root, repo.entry("en"), [
        path.join(repo.root, "lib/unused.ts"),
      ]),
    ).toEqual({ stale: false });
    expect(
      checkResumePdf(repo.root, repo.entry("en"), [
        path.join(repo.root, "content/profile.ts"),
      ]),
    ).toMatchObject({ stale: true });
  });

  test("with two published Language versions, changing only one's copy stales only its PDF", () => {
    const repo = miniRepo();
    saveAll(repo.root);

    repo.edit("content/copy/it.ts", (it) =>
      it.replace("Competenze", "Abilità"),
    );

    expect(checkResumePdf(repo.root, repo.entry("it"))).toMatchObject({
      stale: true,
    });
    expect(checkResumePdf(repo.root, repo.entry("en"))).toEqual({
      stale: false,
    });
  });

  test("changing shared code stales every Language version's PDF", () => {
    const repo = miniRepo();
    saveAll(repo.root);

    repo.edit("content/copy/index.ts", (index) => `${index}\n// shared\n`);

    for (const language of ["en", "it"]) {
      expect(
        checkResumePdf(repo.root, repo.entry(language)),
        language,
      ).toMatchObject({ stale: true });
    }
  });
});

describe("checkResumePdfs", () => {
  test("passes when every PDF is current, and otherwise names only the stale ones", () => {
    const repo = miniRepo();
    for (const entry of resumePdfEntries(repo.root)) {
      saveResumePdf(
        repo.root,
        entry,
        fingerprintResume(repo.root, entry),
        Buffer.from("%PDF-1.7"),
      );
    }
    expect(checkResumePdfs(repo.root)).toEqual({ stale: false });

    repo.edit("content/copy/it.ts", (it) =>
      it.replace("Competenze", "Abilità"),
    );

    const check = checkResumePdfs(repo.root);
    expect(check.stale && check.message).toMatch(/Roberto-Prats-IT\.pdf/);
    expect(check.stale && check.message).not.toMatch(/Roberto-Prats-EN\.pdf/);
  });
});

// Against this repo, not a mini one: which of the site's own files can make the Résumé PDF stale.
describe("the Résumé's inputs in this repo", () => {
  const root = path.join(import.meta.dirname, "..");
  const entries = resumePdfEntries(root);
  const inputs = [...fingerprintResume(root, entries[0]).keys()];

  test("give one PDF per published Language version, named by its suffix", () => {
    expect(entries.map(({ language, pdf }) => [language, pdf])).toEqual(
      publishedLanguageVersions().map(({ code, pdfSuffix }) => [
        code,
        `public/Roberto-Prats-${pdfSuffix}.pdf`,
      ]),
    );
    expect(entries[0]).toMatchObject({
      language: "en",
      path: "/en/resume",
      pdf: "public/Roberto-Prats-EN.pdf",
    });
  });

  test("follow the Résumé route under its Language version, with the language list", () => {
    expect(inputs).toEqual(
      expect.arrayContaining([
        "app/[lang]/layout.tsx",
        "app/[lang]/resume/page.tsx",
        "lib/language-versions.ts",
      ]),
    );
  });

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
    expect(inputs).toContain("content/resume/en.ts");
    expect(inputs).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /content\/stack|technology|home-sections|stack-tags|work-highlight/,
        ),
      ]),
    );
  });
});
