import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type APIRequestContext } from "@playwright/test";

// What search engines and link previews get, read from the static export. The pages under test come
// from the built sitemap, so a new Project is checked without editing this file.

const ORIGIN = "https://itsrob.dev";
const OUT = path.resolve("out");

/** The spec's strings, spelled out rather than imported, so a wrong record fails here. */
const EXPECTED: Record<string, { title: string; description: string }> = {
  [ORIGIN]: {
    title: "Rob | Front-end Engineer & Tech Lead",
    description:
      "I build front ends for large platforms in React and TypeScript, and make sure they're well tested.",
  },
  [`${ORIGIN}/resume`]: {
    title: "Résumé | Rob",
    description:
      "Résumé of Rob, Front-end Engineer & Tech Lead based in Gaeta, Italy.",
  },
};

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
});

test("every page has its own title, description, canonical and sharing tags", async ({
  page,
  request,
}) => {
  const titles = new Set<string>();

  for (const url of await sitemapUrls()) {
    await page.goto(new URL(url).pathname);
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
    titles.add(title);

    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
      "href",
      url,
    );
    expect(await meta("og:url"), url).toBe(url);
    expect(await meta("og:title"), url).toBe(title);
    expect(await meta("og:description"), url).toBe(description);
    expect(await meta("og:site_name"), url).toBe("Rob");
    expect(await meta("og:locale"), url).toBe("en_US");
    expect(await meta("og:type"), url).toBe("website");
    expect(await meta("twitter:card"), url).toBe("summary_large_image");
    await expect(page.locator('head meta[name="twitter:site"]')).toHaveCount(0);

    const image = await meta("og:image");
    expect(image, url).toMatch(new RegExp(`^${ORIGIN}/`));
    expect(await meta("og:image:alt"), url).toBeTruthy();
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
    if (url === ORIGIN) {
      expect(JSON.parse((await people.textContent())!)).toEqual({
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Rob",
        jobTitle: "Front-end Engineer & Tech Lead",
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

  expect(titles.size, "titles are unique").toBe((await sitemapUrls()).length);
});

test("the Résumé shares home's image", async ({ page }) => {
  const image = () =>
    page.locator('head meta[property="og:image"]').getAttribute("content");
  await page.goto("/");
  const home = await image();
  await page.goto("/resume");
  expect(await image()).toBe(home);
});

test("robots allow everything and point at the sitemap", async () => {
  expect(await readFile(path.join(OUT, "robots.txt"), "utf8")).toBe(
    `User-Agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`,
  );
});

test("the 404 page stays out of search and claims no URL", async () => {
  const html = await readFile(path.join(OUT, "404.html"), "utf8");
  expect(html).toContain('<meta name="robots" content="noindex"/>');
  expect(html).not.toContain('rel="canonical"');
  expect(html).not.toContain('name="description"');
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
