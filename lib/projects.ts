import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { MDXContent } from "mdx/types";
import { z } from "zod";
import { isYearMonth, type DateRange, type YearMonth } from "./date-range";
import { dictionary } from "./dictionaries";
import { LANGUAGE_VERSIONS, type LanguageCode } from "./language-versions";

// Projects: one MDX file each per Language version, in content/projects/<code>/ under a shared slug,
// and the only way to read them. Every call re-reads and re-validates the folder (no cache, so
// `next dev` is never stale and tests point process.cwd() at a fixture). gray-matter parses the
// frontmatter here; remark-frontmatter in next.config.ts only keeps the --- block out of the
// rendered body.

export type Project = DateRange & {
  /** Sets the URL. Unique across Projects. */
  slug: string;
  /** Derived from slug: the one place a Project URL is spelled. */
  href: `/projects/${string}`;
  title: string;
  /** One line: card text, page lead and meta description. */
  summary: string;
  role: string;
  stack: readonly string[];
  links: { repo?: string; live?: string };
  /** Project page only. A path under public/. */
  cover?: { src: string; alt: string };
};

/** Every Project in `lang`, newest first by start (ties by slug, so file names never decide the order). */
export function getProjects(lang: LanguageCode): Project[] {
  return readFolder(lang).map((entry) => entry.project);
}

/** The Project with this slug in `lang`, or undefined (the page turns that into a 404). */
export function getProject(
  slug: string,
  lang: LanguageCode,
): Project | undefined {
  return getProjects(lang).find((project) => project.slug === slug);
}

/** "Open source · 2026" (start year), the label on the card, the page header and the share image. */
export function projectKicker(
  project: Pick<Project, "start">,
  lang: LanguageCode,
): string {
  // Every Project is public work (GLOSSARY). Revisit for one with only a live link.
  return dictionary(lang).project.kicker(project.start.slice(0, 4));
}

// Relative to process.cwd(). loadProjectBody's import spells it again: a bundler import needs a literal.
const FOLDER = "content/projects";

type Entry = { name: string; project: Project };

const yearMonth = z.custom<YearMonth>(
  (value) => typeof value === "string" && isYearMonth(value),
  'use "YYYY-MM", e.g. "2026-10"',
);

const nonEmptyText = z.string().trim().min(1);
const httpsUrl = z.url({ protocol: /^https$/, error: "use an https:// URL" });

const dates = z.object({ start: yearMonth, end: yearMonth.optional() });

/** Strict: an unknown key (a typo, or a field the spec rules out like `order`) is an error. */
const frontmatterSchema = z
  .strictObject({
    slug: z
      .string()
      .regex(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        "use lowercase words joined by hyphens",
      ),
    title: nonEmptyText,
    summary: nonEmptyText.refine(
      (s) => !s.includes("\n"),
      "keep it to one line",
    ),
    role: nonEmptyText,
    ...dates.shape,
    stack: z.array(nonEmptyText).min(1),
    links: z
      .strictObject({ repo: httpsUrl.optional(), live: httpsUrl.optional() })
      .refine(
        (links) => links.repo !== undefined || links.live !== undefined,
        "add a repo or a live link",
      ),
    cover: z
      .strictObject({ src: z.string().startsWith("/"), alt: nonEmptyText })
      .optional(),
  })
  .refine((fm) => fm.end === undefined || fm.end >= fm.start, {
    path: ["end"],
    message: "end is before start",
    // Check the dates even while other fields fail, so one run reports everything.
    when: (payload) => dates.safeParse(payload.value).success,
  });

/**
 * Reads and validates every Language version's folder, then sorts the one for `lang`. Collects every
 * problem in every file, and every Project missing in a Language version, and throws them as one
 * Error, so a failed build lists everything to fix at once.
 */
function readFolder(lang: LanguageCode): Entry[] {
  const root = path.join(process.cwd(), FOLDER);
  const codes: readonly string[] = LANGUAGE_VERSIONS.map(({ code }) => code);
  const problems: string[] = [];

  for (const name of fs.readdirSync(root)) {
    if (!name.startsWith(".") && !codes.includes(name)) {
      problems.push(
        `${name}: only Language version folders (${codes.join(", ")}) belong here`,
      );
    }
  }

  const byLanguage = new Map(
    LANGUAGE_VERSIONS.map(({ code }) => [code, readLanguage(code, problems)]),
  );
  const slugs = new Set(
    [...byLanguage.values()].flat().map((entry) => entry.project.slug),
  );
  if (slugs.size === 0 && problems.length === 0) {
    throw new Error(`No Projects in ${FOLDER}`);
  }
  for (const [code, entries] of byLanguage) {
    for (const slug of slugs) {
      if (!entries.some((entry) => entry.project.slug === slug)) {
        problems.push(`${code}: no file for Project "${slug}"`);
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Invalid Projects in ${FOLDER}:\n${problems.map((p) => `  ${p}`).join("\n")}`,
    );
  }
  return byLanguage
    .get(lang)!
    .sort(
      (a, b) =>
        b.project.start.localeCompare(a.project.start) ||
        a.project.slug.localeCompare(b.project.slug),
    );
}

function readLanguage(code: LanguageCode, problems: string[]): Entry[] {
  const dir = path.join(process.cwd(), FOLDER, code);
  const entries: Entry[] = [];
  if (!fs.existsSync(dir)) return entries;

  const files = fs.readdirSync(dir).filter((file) => !file.startsWith("."));
  for (const file of files) {
    if (!file.endsWith(".mdx")) {
      problems.push(`${code}/${file}: only .mdx files belong here`);
      continue;
    }
    const { data } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
    const parsed = frontmatterSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".");
        problems.push(
          `${code}/${file}: ${field ? `${field}: ` : ""}${issue.message}`,
        );
      }
      continue;
    }
    const frontmatter = parsed.data;
    entries.push({
      name: path.basename(file, ".mdx"),
      project: {
        ...frontmatter,
        href: `/projects/${frontmatter.slug}`,
      },
    });
  }

  const filesBySlug = Map.groupBy(entries, (entry) => entry.project.slug);
  for (const [slug, shared] of filesBySlug) {
    if (shared.length > 1) {
      const files = shared.map((entry) => `${entry.name}.mdx`).join(", ");
      problems.push(`${code}: slug "${slug}" is used by ${files}`);
    }
  }
  return entries;
}

/** The compiled MDX body of a Project in `lang`. Takes a Project, so only validated files reach the import. */
export async function loadProjectBody(
  project: Project,
  lang: LanguageCode,
): Promise<MDXContent> {
  const entry = readFolder(lang).find((e) => e.project.slug === project.slug);
  if (!entry) throw new Error(`No Project file for slug "${project.slug}"`);
  const { default: Body } = (await import(
    `@/content/projects/${lang}/${entry.name}.mdx`
  )) as { default: MDXContent };
  return Body;
}
