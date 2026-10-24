import type { Metadata } from "next";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import Home from "../app/[lang]/page";
import ProjectPage from "../app/[lang]/projects/[slug]/page";
import ResumePage, {
  generateMetadata as resumeMetadata,
} from "../app/[lang]/resume/page";
import { getProjects } from "../lib/projects";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/it",
}));

vi.mock("@/lib/projects", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/projects")>()),
  loadProjectBody: async () => () => null,
}));

const ENGLISH: readonly (string | RegExp)[] = [
  "About",
  "Work",
  "Built with",
  "Experience",
  "Sections",
  "Language",
  "Résumé",
  "Role",
  "When",
  "Live site ↗",
  "Download PDF",
  "Contact",
  "Profile",
  "Projects",
  "Skills",
  "Languages",
  "Education",
  "In progress",
  /in Gaeta$/,
  /^Switch to/,
  / – now$/,
  /^\S+ on GitHub$/,
  /No cookies/,
  /GDPR requests/,
  /^Résumé of/,
];

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#x27;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

function strings(html: string): string[] {
  const decode = (text: string) =>
    text.replace(/&(amp|quot|#x27|lt|gt);/g, (entity) => ENTITIES[entity]);
  const labels = [...html.matchAll(/aria-label="([^"]*)"/g)].map(([, v]) =>
    decode(v),
  );
  const texts = html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .split(/<[^>]+>/)
    .map((text) => decode(text).trim())
    .filter(Boolean);
  return [...labels, ...texts];
}

function englishIn(found: string[]): (string | RegExp)[] {
  return ENGLISH.filter((english) =>
    found.some((text) =>
      typeof english === "string" ? text === english : english.test(text),
    ),
  );
}

const params = <T extends object>(values: T) => ({
  params: Promise.resolve({ lang: "it", ...values }),
  searchParams: Promise.resolve({}),
});

describe("pages rendered with the Italian dictionary show no English interface string", () => {
  test("home", async () => {
    const html = renderToStaticMarkup(await Home(params({})));
    expect(englishIn(strings(html))).toEqual([]);
  });

  test("Résumé", async () => {
    const html = renderToStaticMarkup(await ResumePage(params({})));
    expect(englishIn(strings(html))).toEqual([]);
  });

  test("Résumé: its contact list is still marked for the PDF's phone number", async () => {
    const html = renderToStaticMarkup(await ResumePage(params({})));
    expect(html.match(/<ul [^>]*data-contact=""/g)).toHaveLength(1);
  });

  test("Résumé metadata", async () => {
    const { title, description }: Metadata = await resumeMetadata(params({}));
    expect(englishIn([String(title), String(description)])).toEqual([]);
  });

  test.each(getProjects("it").map(({ slug }) => slug))(
    "Project page %s",
    async (slug) => {
      const html = renderToStaticMarkup(await ProjectPage(params({ slug })));
      expect(englishIn(strings(html))).toEqual([]);
    },
  );
});
