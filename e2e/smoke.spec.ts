import { readFile } from "node:fs/promises";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { applyPrivateDetails } from "../scripts/resume-private.mts";

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
    "STACK",
    "SELECTED WORK",
    "EXPERIENCE",
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

test("section nav marks a section once wheel scrolling brings its heading into the top half of the window", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Sections" });
  const { width, height } = page.viewportSize()!;

  // A third of the way down: in the top half, but short of the line a nav click scrolls it to.
  const distance = await page
    .locator("#work")
    .evaluate(
      (section, target) => section.getBoundingClientRect().top - target,
      height / 3,
    );
  await page.mouse.move(width * 0.75, height / 2);
  await page.mouse.wheel(0, distance);

  await expect(
    nav.getByRole("link", { name: "Selected Work" }),
  ).toHaveAttribute("aria-current", "location");
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
  const experience = page.getByRole("region", { name: "Experience" });
  await expect(experience.getByRole("heading", { level: 3 })).toHaveText([
    "Exolab S.r.l., Rome · Front-end Software Engineer",
  ]);
  await expect(experience.getByRole("heading", { level: 4 })).toHaveText([
    "PCO · Front-end Tech Lead",
    "VLT Admin Console Component Library · Front-end Consultant",
    "Athena · Front-end Consultant",
    "GestCert and EMCS · Front-end Developer",
  ]);
  await expect(experience.getByText("2023 – now")).toBeVisible();
  await expect(experience.getByText("2026 – now")).toBeVisible();
  await expect(experience.getByText("2023 – 2024")).toBeVisible();
  await expect(experience.getByText("Sogei, for ADM")).toBeVisible();
  // Compact: the tech lists and bullets are the Résumé's.
  await expect(experience.getByText(/Redux Toolkit|Sole owner/)).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Stack" }).getByRole("listitem"),
  ).toHaveText([
    "React",
    "TypeScript",
    "Redux Toolkit",
    "Tailwind CSS",
    "Vite",
    "Vitest",
    "Playwright",
    "Claude Code",
  ]);
});

test("Stack tiles and Project pills show brand marks before their names, hidden from assistive tech", async ({
  page,
}) => {
  await page.goto("/");
  const stack = page.getByRole("region", { name: "Stack" });
  await expect(stack.getByRole("list")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  const marks = stack.getByRole("listitem").locator("svg");
  await expect(marks).toHaveCount(8);
  for (const mark of await marks.all()) {
    await expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(await mark.boundingBox()).toMatchObject({ width: 28, height: 28 });
  }
  await expect(
    stack.getByRole("listitem").filter({ hasText: "React" }).locator("path"),
  ).toHaveCSS("fill", "rgb(97, 218, 251)");

  const cardPills = page
    .getByRole("region", { name: "Selected Work" })
    .getByRole("list", { name: "Stack" })
    .getByRole("listitem");
  await expect(cardPills).toHaveText(["Claude Code", "Node.js", "JavaScript"]);
  for (const mark of await cardPills.locator("svg").all()) {
    expect(await mark.boundingBox()).toMatchObject({ width: 13, height: 13 });
  }

  await page.goto("/projects/devflow");
  await expect(
    page
      .getByRole("list", { name: "Stack" })
      .getByRole("listitem")
      .locator("svg"),
  ).toHaveCount(3);
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

test("the Privacy notice is a note at the foot of the home page, outside the section nav", async ({
  page,
}) => {
  await page.goto("/");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 2 })).toHaveText([
    "About",
    "Stack",
    "Selected Work",
    "Experience",
  ]);
  const notice = page.locator("#privacy");
  await expect(notice).toHaveAccessibleName("Privacy");
  await expect(notice.getByText(/No cookies/)).toBeVisible();
  await expect(
    notice.getByRole("link", { name: "roberto.prats00@gmail.com" }),
  ).toHaveAttribute("href", "mailto:roberto.prats00@gmail.com");
  await expect(
    page
      .getByRole("navigation", { name: "Sections" })
      .getByRole("link", { name: "Privacy" }),
  ).toHaveCount(0);
});

for (const route of ["/projects/devflow", "/resume"]) {
  test(`${route} links to the Privacy notice at its foot`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(route);

    await page.getByRole("link", { name: "Privacy", exact: true }).click();

    await expect(page).toHaveURL(/\/#privacy$/);
    await expect(page.locator("#privacy")).toBeInViewport();
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
}

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
    page.getByRole("heading", { level: 2, name: "Stack" }),
    page.getByRole("region", { name: "Stack" }).getByRole("listitem").last(),
    page.getByRole("heading", { level: 3, name: "devflow" }),
    page.getByRole("heading", { level: 2, name: "Experience" }),
    page.locator("#privacy"),
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
  const summaryText = work.getByText(
    /^A Claude Code plugin that plans, builds, checks and proves/,
  );
  await summaryText.scrollIntoViewIfNeeded();
  await expect.poll(() => paintedOpacity(summaryText)).toBe(1);
  const summary = await summaryText.boundingBox();
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

test("a Project page ends with its Repo preview: a new-tab link to the repo, with GitHub's image served by this site", async ({
  page,
}) => {
  const errors = trackErrors(page);

  await page.goto("/projects/devflow");
  const card = page.getByRole("link", {
    name: "itsrob00/devflow on GitHub",
    exact: true,
  });
  await expect(card).toHaveAttribute(
    "href",
    "https://github.com/itsrob00/devflow",
  );
  await expect(card).toHaveAttribute("target", "_blank");
  await expect(card).toHaveAttribute("rel", "noopener");
  await expect(page.locator("article > *").last()).toHaveAttribute(
    "aria-label",
    "itsrob00/devflow on GitHub",
  );
  await expect(page.getByRole("link", { name: "Repository ↗" })).toHaveCount(1);
  await expect(card.getByText("github.com", { exact: true })).toBeVisible();

  const image = card.locator("img");
  await expect(image).toHaveAttribute("alt", "");
  await expect(image).toHaveAttribute("src", /^\/repo-previews\//);
  await card.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      image.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);

  await page.emulateMedia({ media: "print" });
  await expect(card).toBeHidden();

  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

for (const route of ["/", "/resume", "/projects/devflow"]) {
  test(`${route} asks no other origin for anything`, async ({
    page,
    baseURL,
  }) => {
    const elsewhere: string[] = [];
    page.on("request", (request) => {
      const { origin, protocol } = new URL(request.url());
      if (protocol.startsWith("http") && origin !== baseURL) {
        elsewhere.push(request.url());
      }
    });

    await page.goto(route);
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await page.waitForLoadState("networkidle");
    expect(elsewhere).toEqual([]);
  });
}

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
    "Profile",
    "Experience",
    "Projects",
    "Skills",
    "Languages",
    "Education",
  ]);

  // Short labels on screen; the PDF prints the full addresses, the site and the phone number.
  const contact = page.getByRole("list", { name: "Contact" });
  await expect(
    contact.getByRole("listitem").filter({ visible: true }),
  ).toHaveText(
    ["Gaeta, Italy", "Remote (CET)", "Email", "LinkedIn", "GitHub"],
    {
      useInnerText: true,
    },
  );
  await expect(contact.getByRole("link", { name: "Email" })).toHaveAttribute(
    "href",
    "mailto:roberto.prats00@gmail.com",
  );
  await expect(contact.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/robertoprats",
  );
  await expect(contact.getByRole("link", { name: "GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/itsrob00",
  );
  await expect(contact.locator('a[href="https://itsrob.dev"]')).toBeHidden();
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);

  const main = page.getByRole("main");
  await expect(
    main.getByText(
      /^Front-end developer working in React and TypeScript since 2023/,
    ),
  ).toBeVisible();
  const experience = page.getByRole("region", { name: "Experience" });
  await expect(experience.getByRole("heading", { level: 3 })).toHaveText([
    "Exolab S.r.l., Rome · Front-end Software Engineer",
  ]);
  await expect(experience.getByText("Jan 2023 – now")).toBeVisible();
  await expect(experience.getByRole("heading", { level: 4 })).toHaveText([
    "PCO · Front-end Tech Lead",
    "VLT Admin Console Component Library · Front-end Consultant",
    "Athena · Front-end Consultant",
    "GestCert and EMCS · Front-end Developer",
  ]);
  await expect(experience.getByText("Oct – Dec 2025")).toBeVisible();
  await expect(experience.getByText("Apr 2023 – Dec 2024")).toBeVisible();
  await expect(experience.getByText("Sogei, for ADM")).toBeVisible();
  await expect(
    experience.getByText(/^Sole owner of front-end QA/),
  ).toBeVisible();
  await expect(
    main.getByRole("heading", { level: 3, name: /^devflow/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Skills" }).getByRole("listitem"),
  ).toHaveText([
    /^Front-end: React, TypeScript/,
    /^Leadership: /,
    /^Quality: .*Jest/,
    /^AI-assisted development: /,
    /^Also used: /,
  ]);
  await expect(
    main.getByText("Italian (Native) · English (Native)", { exact: true }),
  ).toBeVisible();
  const education = page.getByRole("region", { name: "Education" });
  await expect(
    education.getByText("In progress", { exact: true }),
  ).toBeVisible();
  await expect(education.getByText("Sep 2022 – Apr 2023")).toBeVisible();
  await expect(education.getByText("2019", { exact: true })).toBeVisible();
  await expect(
    main.getByText(/^I authorise the processing of my personal data/),
  ).toBeVisible();
  await expect(page.locator("article svg")).toHaveCount(0);

  await page.getByRole("link", { name: "← Rob" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

/** As long as the real values, so the print test fills the header the PDF has. */
const STAND_IN = { fullName: "Firstname Lastname", phone: "+00 000 000 0000" };

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
    // The PDF's own header: the full name, the phone and every address in full. Twice, as it must be safe to.
    for (let run = 0; run < 2; run++) {
      await applyPrivateDetails(page, STAND_IN);
    }
    await expect(page).toHaveTitle(`Résumé | ${STAND_IN.fullName}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      STAND_IN.fullName,
    );
    await expect(
      page
        .getByRole("list", { name: "Contact" })
        .getByRole("listitem")
        .filter({ visible: true }),
    ).toHaveText(
      [
        "Gaeta, Italy",
        "Remote (CET)",
        STAND_IN.phone,
        "roberto.prats00@gmail.com",
        "itsrob.dev",
        "linkedin.com/in/robertoprats",
        "github.com/itsrob00",
      ],
      { useInnerText: true },
    );

    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );
    await expect(page.getByRole("link", { name: "← Rob" })).toBeHidden();
    await expect(
      page.getByRole("link", { name: "Privacy", exact: true }),
    ).toBeHidden();
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

test("links to other sites open in a new tab and keep the referrer; every other link stays in the tab", async ({
  page,
  request,
}) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, loc]) => new URL(loc).pathname,
  );
  let leaving = 0;

  for (const route of [...routes, "/no-such-page"]) {
    await page.goto(route);
    const links = await page.locator("a").evaluateAll((anchors) =>
      anchors.map((a) => ({
        href: a.getAttribute("href") ?? "",
        target: a.getAttribute("target"),
        rel: (a.getAttribute("rel") ?? "").split(/\s+/),
      })),
    );

    for (const { href, target, rel } of links) {
      const url = new URL(href, "https://itsrob.dev");
      const where = `${route}: ${href}`;
      if (/^https?:$/.test(url.protocol) && url.hostname !== "itsrob.dev") {
        leaving++;
        expect(target, where).toBe("_blank");
        expect(rel, where).toContain("noopener");
        expect(rel, where).not.toContain("noreferrer");
      } else {
        expect(target, where).toBeNull();
      }
    }
  }

  expect(leaving).toBeGreaterThan(0);
});

test("LinkedIn and GitHub keep rel=me, Project write-up links open in a new tab, and the Résumé's own-site link doesn't", async ({
  page,
}) => {
  for (const route of ["/", "/resume"]) {
    await page.goto(route);
    for (const href of [
      "https://www.linkedin.com/in/robertoprats",
      "https://github.com/itsrob00",
    ]) {
      await expect(page.locator(`a[href="${href}"]`), route).toHaveAttribute(
        "rel",
        "me noopener",
      );
    }
  }

  await expect(
    page.locator('article a[href="https://itsrob.dev"]'),
  ).not.toHaveAttribute("target");

  await page.goto("/projects/devflow");
  await expect(
    page.getByRole("link", { name: "Matt Pocock's skills" }),
  ).toHaveAttribute("target", "_blank");
});
