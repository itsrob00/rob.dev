import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { MDXContent } from "mdx/types";
import { z } from "zod";
import { isYearMonth, type DateRange, type YearMonth } from "./date-range";

/**
 * Projects: Rob's public work, one MDX file each in content/projects/.
 *
 * The only way to read Projects. Pages, and later the Résumé, sitemap and OG images, call
 * getProjects() / getProject(). Only the Project page calls loadProjectBody().
 *
 * - The folder is the only list of Projects: drop in a file and it's published.
 * - A Project is plain data (no functions), so it can cross into a Client Component.
 * - Every call re-reads and re-validates the folder. There's no cache, so `next dev` never
 *   shows stale frontmatter, and tests point process.cwd() at a fixture folder.
 *
 * Frontmatter is parsed here with gray-matter, never by the MDX compiler: remark-frontmatter
 * (next.config.ts) only keeps the --- block out of the rendered body.
 */

export type Project = DateRange & {
  /** Sets the URL. Unique across Projects. */
  slug: string;
  /** Derived from slug: the one place a Project URL is spelled. */
  href: `/projects/${string}`;
  /** Derived: "Open source · 2026" (start year), the label on the card and the page header. */
  kicker: string;
  title: string;
  /** One line: card text, page lead and meta description. */
  summary: string;
  role: string;
  stack: readonly string[];
  links: { repo?: string; live?: string };
  /** Project page only. A path under public/. */
  cover?: { src: string; alt: string };
};

/** Every Project, newest first by start (ties by slug, so file names never decide the order). */
export function getProjects(): Project[] {
  return readFolder().map((entry) => entry.project);
}

/** The Project with this slug, or undefined (the page turns that into a 404). */
export function getProject(slug: string): Project | undefined {
  return getProjects().find((project) => project.slug === slug);
}

// Relative to process.cwd(). loadProjectBody's import spells it again: a bundler import needs a literal.
const FOLDER = "content/projects";

type Entry = { name: string; project: Project };

const yearMonth = z.custom<YearMonth>(
  (value) => typeof value === "string" && isYearMonth(value),
  'use "YYYY-MM", e.g. "2026-10"',
);

const text = z.string().trim().min(1);
const https = z.url({ protocol: /^https$/, error: "use an https:// URL" });

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
    title: text,
    summary: text.refine((s) => !s.includes("\n"), "keep it to one line"),
    role: text,
    ...dates.shape,
    stack: z.array(text).min(1),
    links: z
      .strictObject({ repo: https.optional(), live: https.optional() })
      .refine(
        (links) => links.repo !== undefined || links.live !== undefined,
        "add a repo or a live link",
      ),
    cover: z
      .strictObject({ src: z.string().startsWith("/"), alt: text })
      .optional(),
  })
  .refine((fm) => fm.end === undefined || fm.end >= fm.start, {
    path: ["end"],
    message: "end is before start",
    // Check the dates even while other fields fail, so one run reports everything.
    when: (payload) => dates.safeParse(payload.value).success,
  });

/**
 * Reads, validates and sorts the folder. Collects every problem in every file and throws them
 * as one Error, so a failed build lists everything to fix at once.
 */
function readFolder(): Entry[] {
  const dir = path.join(process.cwd(), FOLDER);
  const entries: Entry[] = [];
  const problems: string[] = [];

  const files = fs.readdirSync(dir).filter((file) => !file.startsWith("."));
  if (files.length === 0) throw new Error(`No Projects in ${FOLDER}`);

  for (const file of files) {
    if (!file.endsWith(".mdx")) {
      problems.push(`${file}: only .mdx files belong here`);
      continue;
    }
    const { data } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
    const parsed = frontmatterSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".");
        problems.push(`${file}: ${field ? `${field}: ` : ""}${issue.message}`);
      }
      continue;
    }
    const frontmatter = parsed.data;
    entries.push({
      name: path.basename(file, ".mdx"),
      project: {
        ...frontmatter,
        href: `/projects/${frontmatter.slug}`,
        // Every Project is public work (GLOSSARY). Revisit for one with only a live link.
        kicker: `Open source · ${frontmatter.start.slice(0, 4)}`,
      },
    });
  }

  const filesBySlug = Map.groupBy(entries, (entry) => entry.project.slug);
  for (const [slug, shared] of filesBySlug) {
    if (shared.length > 1) {
      const files = shared.map((entry) => `${entry.name}.mdx`).join(", ");
      problems.push(`slug "${slug}" is used by ${files}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Invalid Projects in ${FOLDER}:\n${problems.map((p) => `  ${p}`).join("\n")}`,
    );
  }
  return entries.sort(
    (a, b) =>
      b.project.start.localeCompare(a.project.start) ||
      a.project.slug.localeCompare(b.project.slug),
  );
}

/** The compiled MDX body of a Project. Takes a Project, so only validated files reach the import. */
export async function loadProjectBody(project: Project): Promise<MDXContent> {
  const entry = readFolder().find((e) => e.project.slug === project.slug);
  if (!entry) throw new Error(`No Project file for slug "${project.slug}"`);
  const { default: Body } = (await import(
    `@/content/projects/${entry.name}.mdx`
  )) as { default: MDXContent };
  return Body;
}
