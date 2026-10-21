import { readFile } from "node:fs/promises";
import { expect, test, type Locator, type Page } from "@playwright/test";

// Next 16.4's static export writes segment prefetches as __next.<seg>/__PAGE__.txt but requests
// __next.<seg>.__PAGE__.txt. Navigation falls back to the full payload; ticket 11 checks production.
const KNOWN_PREFETCH_404 = /\/__next\.[^/]+\.__PAGE__\.txt/;

/** One page, sized by the stylesheet's @page: A4 is 595 × 842 points. */
function expectOneA4Page(pdf: Buffer) {
  const text = pdf.toString("latin1");
  expect(text.match(/\/Type\s*\/Page(?!s)/g) ?? []).toHaveLength(1);
  const [, width, height] =
    text.match(/\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/) ?? [];
  expect(Math.round(Number(width))).toBe(595);
  expect(Math.round(Number(height))).toBe(842);
}

/** Console errors and uncaught exceptions, minus the known prefetch 404s. */
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (KNOWN_PREFETCH_404.test(message.location().url)) return;
    errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

// The visitor's OS asks for light; the site must still open dark.
test.use({ colorScheme: "light" });

test.beforeEach(async ({ page }) => {
  // Only Vercel serves the Analytics and Speed Insights scripts; the local static server 404s them.
  await page.route("**/_vercel/**/script.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: "" }),
  );
});

test("home loads with no console errors", async ({ page }) => {
  const errors = trackErrors(page);

  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Rob", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/^\d\d:\d\d CES?T in Gaeta$/)).toBeVisible();
  await page.waitForLoadState("networkidle");

  expect(errors).toEqual([]);
});

test("theme starts dark, switches to light and stays light", async ({
  page,
}) => {
  const html = page.locator("html");
  const body = page.locator("body");

  await page.goto("/");
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(body).toHaveCSS("background-color", "rgb(16, 15, 15)");

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect(body).toHaveCSS("background-color", "rgb(246, 244, 240)");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect(
    page.getByRole("button", { name: "Switch to dark theme" }),
  ).toBeVisible();

  // With React's code blocked, only the head script can apply the choice: proof it lands before paint.
  await page.route("**/_next/static/chunks/**", (route) => route.abort());
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
});

test("section nav, contact links, the Résumé link and theme toggle are reachable by keyboard, with visible focus", async ({
  page,
}) => {
  await page.goto("/");

  const reached: string[] = [];
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).not.toHaveCSS("outline-style", "none");
    reached.push(
      (await focused.getAttribute("aria-label")) ?? (await focused.innerText()),
    );
  }

  expect(reached).toEqual([
    "ABOUT",
    "SELECTED WORK",
    "EXPERIENCE",
    "STACK",
    "Email",
    "LinkedIn",
    "GitHub",
    "Résumé",
    "Switch to light theme",
  ]);
});

test("section nav scrolls to a section and marks it as the current one", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Sections" });
  await expect(nav.getByRole("link", { name: "About" })).toHaveAttribute(
    "aria-current",
    "location",
  );

  await nav.getByRole("link", { name: "Experience" }).click();

  await expect(page).toHaveURL(/#experience$/);
  await expect(
    page.getByRole("heading", { level: 2, name: "Experience" }),
  ).toBeInViewport();
  await expect(nav.getByRole("link", { name: "Experience" })).toHaveAttribute(
    "aria-current",
    "location",
  );
  await expect(nav.locator("[aria-current]")).toHaveCount(1);
});

test("home sections show About, Experience and Stack from the records", async ({
  page,
}) => {
  await page.goto("/");
  const main = page.getByRole("main");

  await expect(
    main.getByText(
      /^I've built front ends in React and TypeScript since 2023\./,
    ),
  ).toBeVisible();
  await expect(
    main.getByRole("heading", { level: 3, name: /^Front-end Engineer/ }),
  ).toBeVisible();
  await expect(main.getByText("2026 – now")).toBeVisible();
  await expect(main.getByText("2023 – 2024")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Stack" }).getByRole("listitem"),
  ).toHaveText([
    "React",
    "TypeScript",
    "Redux Toolkit",
    "Tailwind CSS",
    "Vite",
    "Vitest",
    "Jest",
    "Claude Code",
  ]);
});

test("a missing page shows a 404 in the site's look, with a way home", async ({
  page,
}) => {
  const response = await page.goto("/no-such-page");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Page not found | Rob");
  await expect(
    page.getByRole("heading", { level: 1, name: "Page not found" }),
  ).toBeVisible();
  // Dark by default even though the visitor's OS asks for light (test.use above).
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(16, 15, 15)",
  );
  await expect(page.getByRole("link", { name: "home page" })).toHaveAttribute(
    "href",
    "/",
  );

  await page.getByRole("link", { name: "← Rob" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Rob", exact: true }),
  ).toBeVisible();
});

test("section nav is hidden on narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Sections" })).toBeHidden();
});

// Fade-ups hide content until it rises, so these check it can't stay hidden. Not motion tests:
// none depends on timing, only on where the content ends up.

/** Opacity as painted: the element's own times every ancestor's. */
function paintedOpacity(locator: Locator) {
  return locator.evaluate((element) => {
    let opacity = 1;
    for (let node: Element | null = element; node; node = node.parentElement)
      opacity *= Number(getComputedStyle(node).opacity);
    return opacity;
  });
}

/** Content from the Identity column and each home section, top to bottom. */
function homeContent(page: Page) {
  return [
    page.getByRole("heading", { level: 1, name: "Rob", exact: true }),
    page.getByRole("heading", { level: 2, name: "About" }),
    page.getByRole("heading", { level: 3, name: "devflow" }),
    page.getByRole("heading", { level: 2, name: "Experience" }),
    page.getByRole("heading", { level: 2, name: "Stack" }),
  ];
}

test("every home section is visible once scrolled into view", async ({
  page,
}) => {
  await page.goto("/");
  for (const content of homeContent(page)) {
    await content.scrollIntoViewIfNeeded();
    await expect.poll(() => paintedOpacity(content)).toBe(1);
  }
});

test.describe("under reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("home content is visible at first paint, before any script runs", async ({
    page,
  }) => {
    // Scripts only: the stylesheet that would hide the content is a chunk too, and has to load.
    await page.route("**/*.js", (route) => route.abort());
    await page.goto("/");
    for (const content of homeContent(page)) {
      expect(await paintedOpacity(content)).toBe(1);
    }
  });
});

test.describe("with JavaScript off", () => {
  test.use({ javaScriptEnabled: false });

  test("home content is visible", async ({ page }) => {
    await page.goto("/");
    for (const content of homeContent(page)) {
      expect(await paintedOpacity(content)).toBe(1);
    }
  });
});

test("a Selected Work card opens its Project page, which links back home", async ({
  page,
}) => {
  const errors = trackErrors(page);

  await page.goto("/");
  const work = page.getByRole("region", { name: "Selected Work" });
  await expect(work.getByText("Open source · 2026")).toBeVisible();
  // The whole card is the link: a real click on the summary text lands on the link's overlay.
  const summary = await work
    .getByText(/^A Claude Code plugin that plans, builds, checks and proves/)
    .boundingBox();
  if (!summary) throw new Error("summary not rendered");
  await page.mouse.click(
    summary.x + summary.width / 2,
    summary.y + summary.height / 2,
  );

  await expect(page).toHaveURL(/\/projects\/devflow$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "devflow" }),
  ).toBeVisible();
  await expect(page.getByText("Creator & maintainer")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Repository ↗" }),
  ).toHaveAttribute("href", "https://github.com/itsrob00/devflow");
  await expect(
    page.getByRole("heading", { level: 2, name: "Problem" }),
  ).toBeVisible();
  // remark-frontmatter keeps the YAML block out of the body.
  await expect(page.getByText(/^slug: devflow/)).toHaveCount(0);
  await expect(page.locator("article hr")).toHaveCount(0);

  await page.getByRole("link", { name: "← Rob" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("the Résumé link opens the Résumé, built from the records, which links back home", async ({
  page,
}) => {
  const errors = trackErrors(page);

  await page.goto("/");
  await page.getByRole("link", { name: "Résumé", exact: true }).click();

  await expect(page).toHaveURL(/\/resume$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Rob", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    "Summary",
    "Experience",
    "Projects",
    "Stack",
    "Languages",
    "Education",
  ]);

  const contact = page.getByRole("list", { name: "Contact" });
  await expect(contact.getByText("Gaeta, Italy")).toBeVisible();
  await expect(
    contact.getByRole("link", { name: "roberto.prats00@gmail.com" }),
  ).toHaveAttribute("href", "mailto:roberto.prats00@gmail.com");
  await expect(
    contact.getByRole("link", { name: "itsrob.dev" }),
  ).toHaveAttribute("href", "https://itsrob.dev");
  await expect(
    contact.getByRole("link", { name: "linkedin.com/in/robertoprats" }),
  ).toHaveAttribute("href", "https://www.linkedin.com/in/robertoprats");
  await expect(
    contact.getByRole("link", { name: "github.com/itsrob00" }),
  ).toHaveAttribute("href", "https://github.com/itsrob00");
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);

  const main = page.getByRole("main");
  await expect(
    main.getByText(/^I build front ends for large platforms/),
  ).toBeVisible();
  await expect(
    main.getByText("Exolab Srl, client Sisal via Reply", { exact: false }),
  ).toBeVisible();
  await expect(main.getByText("Jan – Dec 2025")).toBeVisible();
  await expect(
    main.getByRole("heading", { level: 3, name: /^devflow/ }),
  ).toBeVisible();
  await expect(main.getByText(/Claude Code/).first()).toBeVisible();
  await expect(main.getByText(/English/)).toBeVisible();
  await expect(main.getByText(/2014 – 2019/)).toBeVisible();

  await page.getByRole("link", { name: "← Rob" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

for (const theme of ["dark", "light"] as const) {
  test(`the Résumé prints black on white on one A4 page from the ${theme} theme`, async ({
    page,
  }) => {
    await page.goto("/");
    if (theme === "light") {
      await page.getByRole("button", { name: "Switch to light theme" }).click();
    }
    await page.goto("/resume");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

    await page.emulateMedia({ media: "print" });
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );
    await expect(page.getByRole("link", { name: "← Rob" })).toBeHidden();
    await expect(page.getByRole("link", { name: "Download PDF" })).toBeHidden();

    // Accent only on links: every other piece of text is a shade of grey.
    const colours = await page.locator("article").evaluate((article) => {
      const grey = (colour: string) => {
        const [r, g, b] = colour.match(/\d+/g)!.map(Number);
        return r === g && g === b;
      };
      const offenders: string[] = [];
      let colouredLinks = 0;
      for (const element of article.querySelectorAll("*")) {
        const ownText = [...element.childNodes].some(
          (node) =>
            node.nodeType === Node.TEXT_NODE && node.textContent!.trim(),
        );
        if (!ownText) continue;
        const { color } = getComputedStyle(element);
        if (element.closest("a")) {
          if (!grey(color)) colouredLinks++;
        } else if (!grey(color)) {
          offenders.push(`${element.textContent!.slice(0, 30)}: ${color}`);
        }
      }
      return { offenders, colouredLinks };
    });
    expect(colours.offenders).toEqual([]);
    expect(colours.colouredLinks).toBeGreaterThan(0);

    // The PDF is read away from this site, so no link may be relative.
    for (const href of await page
      .locator("article a")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
      expect(href).toMatch(/^(https:\/\/|mailto:)/);
    }

    expectOneA4Page(await page.pdf({ preferCSSPageSize: true }));
  });
}

test("the Résumé PDF downloads as Rob-Resume.pdf, and nothing else links to it", async ({
  page,
}) => {
  const errors = trackErrors(page);

  for (const route of ["/", "/projects/devflow"]) {
    await page.goto(route);
    await expect(page.locator('a[href$=".pdf"]')).toHaveCount(0);
  }

  await page.goto("/resume");
  await expect(page.locator('a[href$=".pdf"]')).toHaveCount(1);
  const downloading = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download PDF" }).click();
  const download = await downloading;

  expect(download.suggestedFilename()).toBe("Rob-Resume.pdf");
  // The committed file, not a fresh print.
  expectOneA4Page(await readFile(await download.path()));
  expect(errors).toEqual([]);
});
