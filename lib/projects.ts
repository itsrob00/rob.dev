import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { MDXContent } from "mdx/types";
import { z } from "zod";
import { isYearMonth, type DateRange, type YearMonth } from "./date-range";

// Projects: one MDX file each in content/projects/, and the only way to read them. Every call
// re-reads and re-validates the folder (no cache, so `next dev` is never stale and tests point
// process.cwd() at a fixture). gray-matter parses the frontmatter here; remark-frontmatter in
// next.config.ts only keeps the --- block out of the rendered body.

export type Project = DateRange & {
  /** Sets the URL. Unique across Projects. */
  slug: string;
  /** Derived from slug: the one place a Project URL is spelled. */
  href: `/projects/${string}`;
  /** Derived from kind and start year: "Concept · 2026", the label on the card and the page header. */
  kicker: string;
  title: string;
  /** One line: card text, page lead and meta description. */
  summary: string;
  role: string;
  stack: readonly string[];
  /** None until the Project is public (GLOSSARY): isOpenable tells the two apart. */
  links: OpenLinks | NoLinks;
  /** Project page only. A path under public/. */
  cover?: { src: string; alt: string };
};

type OpenLinks =
  { repo: string; live?: string } | { repo?: string; live: string };

type NoLinks = { repo?: undefined; live?: undefined };

export type OpenableProject = Project & { links: OpenLinks };

/** Whether a visitor can open the Project: it has a repo or a live link. */
export function isOpenable(project: Project): project is OpenableProject {
  return project.links.repo !== undefined || project.links.live !== undefined;
}

/**
 * Every Project: the ones a visitor can open first, then newest first by start within each group
 * (ties by slug, so file names never decide the order).
 */
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
    kind: z.enum(["Open source", "Concept"]),
    ...dates.shape,
    stack: z.array(nonEmptyText).min(1),
    links: z
      .strictObject({ repo: httpsUrl.optional(), live: httpsUrl.optional() })
      .refine(
        (links) => links.repo !== undefined || links.live !== undefined,
        "add a repo or a live link, or leave links out",
      )
      .optional(),
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
    const { kind, links, ...frontmatter } = parsed.data;
    entries.push({
      name: path.basename(file, ".mdx"),
      project: {
        ...frontmatter,
        links: toLinks(links),
        href: `/projects/${frontmatter.slug}`,
        kicker: `${kind} · ${frontmatter.start.slice(0, 4)}`,
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
      Number(isOpenable(b.project)) - Number(isOpenable(a.project)) ||
      b.project.start.localeCompare(a.project.start) ||
      a.project.slug.localeCompare(b.project.slug),
  );
}

function toLinks(links?: { repo?: string; live?: string }): Project["links"] {
  if (links?.repo !== undefined) return { ...links, repo: links.repo };
  if (links?.live !== undefined) return { ...links, live: links.live };
  return {};
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
