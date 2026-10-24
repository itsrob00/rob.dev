import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type APIRequestContext } from "@playwright/test";

// What search engines and link previews get, read from the static export. The pages under test come
// from the built sitemap, so a new Project is checked without editing this file.

const ORIGIN = "https://itsrob.dev";
const OUT = path.resolve("out");

const LANGUAGES = ["en", "it"];

/** The spec's strings, spelled out rather than imported, so a wrong record fails here. */
const EXPECTED: Record<
  string,
  { title: string; description: string; imageAlt: string }
> = {
  [`${ORIGIN}/en`]: {
    title: "Rob | Front-end Engineer & Tech Lead",
    description:
      "I build front ends for large platforms in React and TypeScript, and make sure they're well tested.",
    imageAlt: "Rob: Front-end Engineer & Tech Lead",
  },
  [`${ORIGIN}/en/resume`]: {
    title: "Résumé | Rob",
    description:
      "Résumé of Rob, Front-end Engineer & Tech Lead based in Gaeta, Italy.",
    imageAlt: "Rob: Front-end Engineer & Tech Lead",
  },
  [`${ORIGIN}/en/projects/devflow`]: {
    title: "devflow | Rob",
    description:
      "A Claude Code plugin that plans, builds, checks and proves each task, step by step.",
    imageAlt:
      "devflow: A Claude Code plugin that plans, builds, checks and proves each task, step by step.",
  },
  [`${ORIGIN}/it`]: {
    title: "Rob | Front-end Engineer & Tech Lead",
    description:
      "Sviluppo front-end per grandi piattaforme in React e TypeScript, e mi assicuro che siano ben testati.",
    imageAlt: "Rob: Front-end Engineer & Tech Lead",
  },
  [`${ORIGIN}/it/resume`]: {
    title: "Curriculum | Rob",
    description:
      "Curriculum di Rob, Front-end Engineer & Tech Lead con base a Gaeta, Italia.",
    imageAlt: "Rob: Front-end Engineer & Tech Lead",
  },
  [`${ORIGIN}/it/projects/devflow`]: {
    title: "devflow | Rob",
    description:
      "Un plugin per Claude Code che pianifica, sviluppa, verifica e dimostra ogni task, un passo alla volta.",
    imageAlt:
      "devflow: Un plugin per Claude Code che pianifica, sviluppa, verifica e dimostra ogni task, un passo alla volta.",
  },
};

const OG_LOCALES: Record<string, string> = { en: "en_US", it: "it_IT" };

const JOB_TITLES: Record<string, string> = {
  en: "Front-end Engineer & Tech Lead",
  it: "Front-end Engineer & Tech Lead",
};

/** The same page in every Language version, then x-default at the bare domain. */
function alternatesOf(url: string): string[][] {
  const rest = new URL(url).pathname.replace(/^\/[^/]+/, "");
  return [
    ...LANGUAGES.map((code) => [code, `${ORIGIN}/${code}${rest}`]),
    ["x-default", ORIGIN],
  ];
}

async function sitemapUrls(): Promise<string[]> {
  const xml = await readFile(path.join(OUT, "sitemap.xml"), "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);
}

/** Fetches a PNG from the local export and returns its pixel size. */
async function pngSize(request: APIRequestContext, url: string) {
  const response = await request.get(new URL(url, ORIGIN).pathname);
  expect(response.ok(), url).toBe(true);
  const bytes = await response.body();
  expect(bytes.subarray(1, 4).toString("latin1"), `${url} is a PNG`).toBe(
    "PNG",
  );
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("the sitemap lists exactly the built pages", async () => {
  const pages = (await readdir(OUT, { recursive: true }))
    .map((file) => file.split(path.sep).join("/"))
    .filter((file) => file.endsWith(".html"))
    .filter((file) => !/(^|\/)(404|_not-found)\.html$/.test(file))
    .map((file) =>
      file.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, ""),
    )
    .map((route) => (route === "" ? ORIGIN : `${ORIGIN}/${route}`));

  expect((await sitemapUrls()).toSorted()).toEqual(pages.toSorted());
  for (const url of Object.keys(EXPECTED)) {
    expect(pages, url).toContain(url);
  }
});

test("the sitemap lists every page's alternates, with x-default at the bare domain", async () => {
  const xml = await readFile(path.join(OUT, "sitemap.xml"), "utf8");
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
    ([, entry]) => ({
      url: entry.match(/<loc>([^<]+)<\/loc>/)![1],
      alternates: [
        ...entry.matchAll(
          /<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)" \/>/g,
        ),
      ].map(([, hreflang, href]) => [hreflang, href]),
    }),
  );

  expect(entries).toHaveLength((await sitemapUrls()).length);
  for (const { url, alternates } of entries) {
    expect(alternates, url).toEqual(alternatesOf(url));
  }
});

test("every page has its own language, title, description, canonical, alternates and sharing tags", async ({
  page,
  request,
}) => {
  const titles = new Set<string>();
  const urls = await sitemapUrls();

  for (const url of urls) {
    const { pathname } = new URL(url);
    const lang = pathname.split("/")[1];
    await page.goto(pathname);
    await expect(page.locator("html"), url).toHaveAttribute("lang", lang);
    const meta = (key: string) =>
      page
        .locator(`head meta[property="${key}"], head meta[name="${key}"]`)
        .getAttribute("content");

    const title = await page.title();
    const description = await meta("description");
    const expected = EXPECTED[url];
    if (expected) {
      expect(title, url).toBe(expected.title);
      expect(description, url).toBe(expected.description);
    } else {
      expect(title, url).toMatch(/^.+ \| Rob$/);
      expect(description, url).toBeTruthy();
    }
    titles.add(`${lang} ${title}`);

    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
      "href",
      url,
    );
    const alternates = await page
      .locator('head link[rel="alternate"][hreflang]')
      .evaluateAll((links) =>
        links.map((link) => [
          link.getAttribute("hreflang"),
          link.getAttribute("href"),
        ]),
      );
    expect(alternates, url).toEqual(alternatesOf(url));
    expect(await meta("og:url"), url).toBe(url);
    expect(await meta("og:title"), url).toBe(title);
    expect(await meta("og:description"), url).toBe(description);
    expect(await meta("og:site_name"), url).toBe("Rob");
    expect(await meta("og:locale"), url).toBe(OG_LOCALES[lang]);
    expect(await meta("og:type"), url).toBe("website");
    expect(await meta("twitter:card"), url).toBe("summary_large_image");
    await expect(page.locator('head meta[name="twitter:site"]')).toHaveCount(0);

    const image = await meta("og:image");
    expect(image, url).toMatch(new RegExp(`^${ORIGIN}/${lang}[/]`));
    const imageAlt = await meta("og:image:alt");
    if (expected) expect(imageAlt, url).toBe(expected.imageAlt);
    else expect(imageAlt, url).toBeTruthy();
    expect(await meta("twitter:image"), url).toBe(image);
    expect(await pngSize(request, image!)).toEqual({
      width: 1200,
      height: 630,
    });

    for (const [rel, side] of [
      ["icon", 32],
      ["apple-touch-icon", 180],
    ] as const) {
      const href = await page
        .locator(`head link[rel="${rel}"]`)
        .getAttribute("href");
      expect(await pngSize(request, href!), rel).toEqual({
        width: side,
        height: side,
      });
    }

    const people = page.locator('script[type="application/ld+json"]');
    if (pathname === `/${lang}`) {
      expect(JSON.parse((await people.textContent())!)).toEqual({
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Rob",
        jobTitle: JOB_TITLES[lang],
        url: ORIGIN,
        sameAs: [
          "https://www.linkedin.com/in/robertoprats",
          "https://github.com/itsrob00",
        ],
      });
    } else {
      await expect(people, url).toHaveCount(0);
    }
  }

  expect(titles.size, "titles are unique in each Language version").toBe(
    urls.length,
  );
});

test("each Résumé shares its own home's image", async ({ page }) => {
  const image = () =>
    page.locator('head meta[property="og:image"]').getAttribute("content");
  for (const lang of LANGUAGES) {
    await page.goto(`/${lang}`);
    const home = await image();
    expect(home).toBe(`${ORIGIN}/${lang}/opengraph-image`);
    await page.goto(`/${lang}/resume`);
    expect(await image()).toBe(home);
  }
});

test("robots allow everything and point at the sitemap", async () => {
  expect(await readFile(path.join(OUT, "robots.txt"), "utf8")).toBe(
    `User-Agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`,
  );
});

test("the 404 page stays out of search, claims no URL and speaks English and Italian", async () => {
  const html = await readFile(path.join(OUT, "404.html"), "utf8");
  expect(html).toContain('<meta name="robots" content="noindex"/>');
  expect(html).not.toContain('rel="canonical"');
  expect(html).not.toContain('rel="alternate"');
  expect(html).not.toContain('name="description"');
  expect(html).toContain('<html lang="en"');
  expect(html).toContain('<section lang="en"');
  expect(html).toContain('<section lang="it"');
});

test("vercel.json serves every extensionless image as a PNG, and sends www to the apex", async () => {
  const config = JSON.parse(await readFile("vercel.json", "utf8")) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
    redirects: {
      has?: { value: string }[];
      destination: string;
      permanent: boolean;
    }[];
  };
  const pngRules = config.headers
    .filter(({ headers }) =>
      headers.some(
        ({ key, value }) => key === "Content-Type" && value === "image/png",
      ),
    )
    .map(({ source }) => new RegExp(`^${source.replace(/:\w+/g, "[^/]+")}$`));

  // Vercel picks a Content-Type from the extension, so these would go out untyped.
  const files = (await readdir(OUT, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile() && !entry.name.includes("."))
    .map((entry) => path.relative(OUT, path.join(entry.parentPath, entry.name)))
    .map((file) => `/${file.split(path.sep).join("/")}`)
    .filter((file) => !file.startsWith("/_next/"));

  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    expect(
      pngRules.some((rule) => rule.test(file)),
      file,
    ).toBe(true);
  }
  for (const rule of pngRules) {
    expect(
      files.some((file) => rule.test(file)),
      `${rule} matches a built file`,
    ).toBe(true);
  }

  expect(config.redirects).toContainEqual(
    expect.objectContaining({
      has: [expect.objectContaining({ value: "www.itsrob.dev" })],
      destination: `${ORIGIN}/:path*`,
      permanent: true,
    }),
  );
});
