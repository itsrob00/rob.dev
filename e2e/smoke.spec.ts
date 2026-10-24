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

  await page.goto("/en");
  await expect(
    page.getByRole("heading", { level: 1, name: "Rob", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/^\d\d:\d\d CES?T in Gaeta$/)).toBeVisible();
  await page.waitForLoadState("networkidle");

  expect(errors).toEqual([]);
});

test("the Italian home loads in Italian with no console errors", async ({
  page,
}) => {
  const errors = trackErrors(page);

  await page.goto("/it");
  await expect(page.locator("html")).toHaveAttribute("lang", "it");
  await expect(page.getByText(/^\d\d:\d\d CES?T a Gaeta$/)).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("heading", { level: 2 }),
  ).toHaveText(["Chi sono", "Stack", "Lavori selezionati", "Esperienza"]);
  await expect(
    page.getByRole("button", { name: "Passa al tema chiaro" }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");

  expect(errors).toEqual([]);
});

test("theme starts dark, switches to light and stays light", async ({
  page,
}) => {
  const html = page.locator("html");
  const body = page.locator("body");

  await page.goto("/en");
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(body).toHaveCSS("background-color", "rgb(16, 15, 15)");

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect(body).toHaveCSS("background-color", "rgb(246, 244, 240)");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
  const toDark = page.getByRole("button", { name: "Switch to dark theme" });
  await expect(toDark).toBeVisible();
  expect(await animations(toDark)).toBe(0);
  expect(await visibleGlyphs(toDark)).toEqual([{ glyph: "☀", whole: true }]);

  // With React's code blocked, only the head script can apply the choice: proof it lands before paint.
  await page.route("**/_next/static/chunks/**/*.js", (route) => route.abort());
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
  expect(
    await visibleGlyphs(page.getByRole("button", { name: /^Switch to/ })),
  ).toEqual([{ glyph: "☀", whole: true }]);
});

function visibleGlyphs(button: Locator) {
  return button.evaluate((root) => {
    const shown: { glyph: string; whole: boolean }[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode;
      const glyph = text.textContent?.trim();
      if (!glyph) continue;
      const range = document.createRange();
      range.selectNodeContents(text);
      const own = range.getBoundingClientRect();
      if (own.width === 0 || own.height === 0) continue;
      let { top, bottom, left, right } = own;
      for (let node = text.parentElement; node; node = node.parentElement) {
        if (getComputedStyle(node).overflow !== "visible") {
          const clip = node.getBoundingClientRect();
          top = Math.max(top, clip.top);
          bottom = Math.min(bottom, clip.bottom);
          left = Math.max(left, clip.left);
          right = Math.min(right, clip.right);
        }
        if (node === root) break;
      }
      if (bottom - top > 0 && right - left > 0) {
        const whole =
          bottom - top >= own.height - 0.5 && right - left >= own.width - 0.5;
        shown.push({ glyph, whole });
      }
    }
    return shown;
  });
}

function animations(button: Locator) {
  return button.evaluate(
    (root) => root.getAnimations({ subtree: true }).length,
  );
}

function rollEnd(button: Locator) {
  return button.evaluate((root) =>
    Promise.all(
      root.getAnimations({ subtree: true }).map((roll) => roll.finished),
    ).then(() => undefined),
  );
}

test("the theme switch shows one glyph, and after the roll only the new one", async ({
  page,
}) => {
  await page.goto("/en");
  const toLight = page.getByRole("button", { name: "Switch to light theme" });
  await expect(toLight).toBeVisible();
  expect(await visibleGlyphs(toLight)).toEqual([{ glyph: "☾", whole: true }]);

  await toLight.click();
  const toDark = page.getByRole("button", { name: "Switch to dark theme" });
  expect(await animations(toDark)).toBeGreaterThan(0);
  await rollEnd(toDark);
  expect(await visibleGlyphs(toDark)).toEqual([{ glyph: "☀", whole: true }]);

  await toDark.click();
  await rollEnd(toLight);
  expect(await visibleGlyphs(toLight)).toEqual([{ glyph: "☾", whole: true }]);
});

test("the theme switch fits a 375px screen and is hidden in print", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/en");
  const toggle = page.getByRole("button", { name: "Switch to light theme" });
  await toggle.click();
  await rollEnd(page.getByRole("button", { name: "Switch to dark theme" }));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByRole("button", { name: "Switch to dark theme" }),
  ).toBeHidden();
});

test("section nav, contact links, the Résumé link and theme toggle are reachable by keyboard, with visible focus", async ({
  page,
}) => {
  await page.goto("/en");

  const reached: string[] = [];
  for (let i = 0; i < 10; i++) {
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
    "Language: EN",
  ]);
});

function languageMenu(page: Page, lang: "en" | "it" = "en") {
  const label = lang === "en" ? "Language" : "Lingua";
  const nav = page.getByRole("navigation", { name: label });
  return {
    nav,
    pill: nav.getByRole("button", {
      name: `${label}: ${lang.toUpperCase()}`,
      exact: true,
    }),
    entries: nav.getByRole("link"),
  };
}

for (const [lang, name] of [
  ["en", "Language: EN"],
  ["it", "Lingua: IT"],
] as const) {
  test(`the language menu's pill is named as the language choice, with its visible code in the name, on /${lang}`, async ({
    page,
  }) => {
    await page.goto(`/${lang}`);
    const pill = page.getByRole("button", { expanded: false }).filter({
      hasText: lang.toUpperCase(),
    });
    await expect(pill).toHaveAccessibleName(name);
    await expect(pill).toHaveText(new RegExp(`^${lang.toUpperCase()}\\W*$`));
    await expect(pill).not.toHaveAttribute("aria-haspopup", /.*/);
  });
}

test("the language menu opens upward from its pill after the clock and the theme switch, listing each Language version in its own language", async ({
  page,
}) => {
  await page.goto("/en");
  const { pill, entries } = languageMenu(page);
  await expect(pill).toHaveAttribute("aria-expanded", "false");
  await expect(entries).toHaveCount(0);

  await pill.click();
  await expect(pill).toHaveAttribute("aria-expanded", "true");
  await expect(entries).toHaveText([/^English\s*EN$/, /^Italiano\s*IT$/]);
  const [english, italian] = [entries.first(), entries.last()];
  await expect(english).toHaveAttribute("href", "/en");
  await expect(english).toHaveAttribute("hreflang", "en");
  await expect(english).toHaveAttribute("lang", "en");
  await expect(english).toHaveAttribute("aria-current", "page");
  await expect(english).not.toHaveAttribute("target", /.*/);
  await expect(italian).toHaveAttribute("href", "/it");
  await expect(italian).toHaveAttribute("hreflang", "it");
  await expect(italian).toHaveAttribute("lang", "it");
  await expect(italian).not.toHaveAttribute("aria-current", /.*/);

  const pillBox = (await pill.boundingBox())!;
  const listBox = (await english.boundingBox())!;
  expect(listBox.y + listBox.height).toBeLessThan(pillBox.y);

  const theme = page.getByRole("button", { name: "Switch to light theme" });
  const clock = page.getByText(/^\d\d:\d\d CES?T in Gaeta$/);
  const row = await Promise.all(
    [clock, theme, pill].map(async (item) => (await item.boundingBox())!),
  );
  expect(row[0].x).toBeLessThan(row[1].x);
  expect(row[1].x).toBeLessThan(row[2].x);
  expect(Math.abs(row[1].y - row[2].y)).toBeLessThan(2);
});

test("the language menu closes on Escape, returning focus to its pill, and on a click outside it", async ({
  page,
}) => {
  await page.goto("/en");
  const { pill, entries } = languageMenu(page);

  await pill.focus();
  await page.keyboard.press("Enter");
  await expect(pill).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(entries.first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(pill).toHaveAttribute("aria-expanded", "false");
  await expect(entries).toHaveCount(0);
  await expect(pill).toBeFocused();

  await pill.click();
  await expect(entries).toHaveCount(2);
  await page.getByRole("heading", { level: 1 }).click();
  await expect(pill).toHaveAttribute("aria-expanded", "false");
  await expect(entries).toHaveCount(0);
});

test("the language menu links to the section the visitor was reading", async ({
  page,
}) => {
  await page.goto("/en");
  await page
    .getByRole("navigation", { name: "Sections" })
    .getByRole("link", { name: "Stack" })
    .click();
  await expect(page).toHaveURL(/\/en#stack$/);

  const { pill, entries } = languageMenu(page);
  await pill.click();
  await expect(entries.first()).toHaveAttribute("href", "/en#stack");
  await expect(entries.last()).toHaveAttribute("href", "/it#stack");
});

test("switching language after scrolling to a section, without the section nav, keeps that section", async ({
  page,
}) => {
  await page.goto("/en");
  await page.locator("#experience").evaluate((section) => {
    section.scrollIntoView({ behavior: "instant" });
  });
  await expect(
    page
      .getByRole("navigation", { name: "Sections" })
      .getByRole("link", { name: "Experience" }),
  ).toHaveAttribute("aria-current", "location");
  expect(new URL(page.url()).hash).toBe("");

  const { pill, entries } = languageMenu(page);
  await pill.click();
  await entries.and(page.locator('[lang="it"]')).click();

  await expect(page).toHaveURL(/\/it#experience$/);
  await expect(page.locator("#experience-title")).toBeInViewport();
});

for (const [from, to, route] of [
  ["en", "it", "#work"],
  ["it", "en", "#experience"],
  ["en", "it", "/projects/devflow"],
  ["it", "en", "/resume"],
] as const) {
  test(`picking ${to} on /${from}${route} opens the same page and place in that Language version`, async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto(`/${from}${route}`);
    const { pill, entries } = languageMenu(page, from);
    await pill.click();
    await entries.and(page.locator(`[lang="${to}"]`)).click();

    await expect(page).toHaveURL(new RegExp(`/${to}${route}$`));
    await expect(page.locator("html")).toHaveAttribute("lang", to);
    await expect(languageMenu(page, to).pill).toBeVisible();
    if (route.startsWith("#")) {
      await expect(page.locator(`${route}-title`)).toBeInViewport();
    }
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
}

function dotCentre(nav: Locator) {
  return nav.evaluate((root) => {
    const id = root.querySelector("button")!.getAttribute("aria-controls")!;
    const { top, height } = document
      .getElementById(id)!
      .querySelector(":scope > [aria-hidden]")!
      .getBoundingClientRect();
    return top + height / 2;
  });
}

test("the language menu's dot glides to the picked language before the page changes", async ({
  page,
}) => {
  await page.goto("/en/resume");
  const { nav, pill, entries } = languageMenu(page);
  await pill.click();
  const italian = (await entries.last().boundingBox())!;
  expect(await dotCentre(nav)).toBeLessThan(italian.y);

  let release = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/it/resume", async (route) => {
    await held;
    await route.continue();
  });
  await entries.last().click();
  await expect.poll(() => dotCentre(nav)).toBeGreaterThan(italian.y);
  expect(await dotCentre(nav)).toBeLessThan(italian.y + italian.height);
  release();
  await expect(page).toHaveURL(/\/it\/resume$/);
});

test("picking a language keeps the theme, with no flash", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.goto("/en/resume");

  const { pill, entries } = languageMenu(page);
  await pill.click();
  await page.route("**/_next/static/chunks/**/*.js", (route) => route.abort());
  const loaded = page.waitForEvent("load");
  await entries.last().click();
  await loaded;
  await expect(page).toHaveURL(/\/it\/resume$/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(246, 244, 240)",
  );
});

test("the language menu fits a 375px screen when open, and is hidden in print", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/en");
  const { pill, entries } = languageMenu(page);
  await pill.click();
  await expect(entries.first()).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.emulateMedia({ media: "print" });
  await expect(pill).toBeHidden();
  await expect(entries.first()).toBeHidden();
});

test("the language menu rises as it opens, and its dot is set to glide", async ({
  page,
}) => {
  await page.goto("/en");
  const { nav, pill } = languageMenu(page);
  await pill.click();
  expect(await animations(nav)).toBeGreaterThan(0);
  expect(await glideDuration(nav)).not.toBe("0s");
});

function glideDuration(nav: Locator) {
  return nav.evaluate((root) => {
    const id = root.querySelector("button")!.getAttribute("aria-controls")!;
    const dot = document
      .getElementById(id)!
      .querySelector(":scope > [aria-hidden]")!;
    return getComputedStyle(dot).transitionDuration;
  });
}

test("section nav scrolls to a section and marks it as the current one", async ({
  page,
}) => {
  await page.goto("/en");
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
  await page.goto("/en");
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
  await page.goto("/en");
  const main = page.getByRole("main");

  await expect(
    main.getByText(
      /^I've built front ends in React and TypeScript since 2023\./,
    ),
  ).toBeVisible();
  const experience = page.getByRole("region", { name: "Experience" });
  await expect(experience.getByRole("heading", { level: 3 })).toHaveText([
    "Exolab S.r.l., Rome",
  ]);
  await expect(
    experience.getByText("Front-end Software Engineer · 2023 – now"),
  ).toBeVisible();
  await expect(experience.getByRole("heading", { level: 4 })).toHaveText([
    "PCO · Front-end Tech Lead",
    "VLT Admin Console Component Library · Front-end Consultant",
    "Athena · Front-end Consultant",
    "GestCert and EMCS · Front-end Developer",
  ]);
  await expect(experience.getByText("2026 – now · Sogei")).toBeVisible();
  await expect(experience.getByText("2025 · Sisal, via Reply")).toHaveCount(2);
  await expect(
    experience.getByText("2023 – 2024 · Sogei, for ADM"),
  ).toBeVisible();
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
  await page.goto("/en");
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

  await page.goto("/en/projects/devflow");
  await expect(
    page
      .getByRole("list", { name: "Stack" })
      .getByRole("listitem")
      .locator("svg"),
  ).toHaveCount(3);
});

test("a missing page shows a 404 in the site's look, in English and Italian, with a way home", async ({
  page,
}) => {
  const response = await page.goto("/no-such-page");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Page not found | Rob");
  const english = page.locator('section[lang="en"]');
  const italian = page.locator('section[lang="it"]');
  await expect(
    english.getByRole("heading", { level: 1, name: "Page not found" }),
  ).toBeVisible();
  await expect(
    italian.getByRole("heading", { name: "Pagina non trovata" }),
  ).toBeVisible();
  // Dark by default even though the visitor's OS asks for light (test.use above).
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(16, 15, 15)",
  );
  await expect(
    english.getByRole("link", { name: "home page" }),
  ).toHaveAttribute("href", "/en");
  await expect(
    italian.getByRole("link", { name: "home page" }),
  ).toHaveAttribute("href", "/it");

  await english.getByRole("link", { name: "home page" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Rob", exact: true }),
  ).toBeVisible();
});

test("the 404 keeps the visitor's stored theme, in every Language version and under an unknown one", async ({
  page,
}) => {
  await page.goto("/en");
  await page.getByRole("button", { name: "Switch to light theme" }).click();

  for (const route of ["/en/no-such-page", "/it/no-such-page", "/fr"]) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(246, 244, 240)",
    );
  }
});

test("the Privacy notice is a note at the foot of the home page, outside the section nav", async ({
  page,
}) => {
  await page.goto("/en");
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
  test(`${route} has the language menu at its foot, where the Privacy link was`, async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto(`/en${route}`);
    await expect(
      page.getByRole("link", { name: "Privacy", exact: true }),
    ).toHaveCount(0);

    const { pill, entries } = languageMenu(page);
    await expect(page.locator("footer").locator(pill)).toBeVisible();
    await pill.click();
    await expect(entries.first()).toHaveAttribute("href", `/en${route}`);
    await expect(entries.last()).toHaveAttribute("href", `/it${route}`);
    await expect(entries.first()).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
}

test("section nav is hidden on narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto("/en");
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
  await page.goto("/en");
  for (const content of homeContent(page)) {
    await content.scrollIntoViewIfNeeded();
    await expect.poll(() => paintedOpacity(content)).toBe(1);
  }
});

test.describe("under reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the theme switch swaps its glyph without a roll", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    const toDark = page.getByRole("button", { name: "Switch to dark theme" });
    expect(await animations(toDark)).toBe(0);
    expect(await visibleGlyphs(toDark)).toEqual([{ glyph: "☀", whole: true }]);
  });

  test("the language menu opens without rising, and its dot won't glide", async ({
    page,
  }) => {
    await page.goto("/en");
    const { nav, pill, entries } = languageMenu(page);
    await pill.click();
    await expect(entries.first()).toBeVisible();
    expect(await animations(nav)).toBe(0);
    expect(await glideDuration(nav)).toBe("0s");
  });

  test("picking a language switches the page without waiting for a glide", async ({
    page,
  }) => {
    await page.goto("/en#stack");
    const { pill, entries } = languageMenu(page);
    await pill.click();
    const requested = page.waitForRequest(/\/it$/);
    const clicked = Date.now();
    await entries.last().click();
    await requested;
    expect(Date.now() - clicked).toBeLessThan(200);
    await expect(page).toHaveURL(/\/it#stack$/);
  });

  test("home content is visible at first paint, before any script runs", async ({
    page,
  }) => {
    // Scripts only: the stylesheet that would hide the content is a chunk too, and has to load.
    await page.route("**/*.js", (route) => route.abort());
    await page.goto("/en");
    for (const content of homeContent(page)) {
      expect(await paintedOpacity(content)).toBe(1);
    }
  });
});

test.describe("with JavaScript off", () => {
  test.use({ javaScriptEnabled: false });

  test("home content is visible", async ({ page }) => {
    await page.goto("/en");
    for (const content of homeContent(page)) {
      expect(await paintedOpacity(content)).toBe(1);
    }
  });
});

test("a Selected Work card opens its Project page, which links back home", async ({
  page,
}) => {
  const errors = trackErrors(page);

  await page.goto("/en");
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

  await expect(page).toHaveURL(/\/en\/projects\/devflow$/);
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
  await expect(page).toHaveURL(/\/en$/);
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("a Project page ends with its Repo preview: a new-tab link to the repo, with GitHub's image served by this site", async ({
  page,
}) => {
  const errors = trackErrors(page);

  await page.goto("/en/projects/devflow");
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

for (const route of [
  "/en",
  "/en/resume",
  "/en/projects/devflow",
  "/it",
  "/it/resume",
  "/it/projects/devflow",
]) {
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

  await page.goto("/en");
  await page.getByRole("link", { name: "Résumé", exact: true }).click();

  await expect(page).toHaveURL(/\/en\/resume$/);
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
  await expect(page).toHaveURL(/\/en$/);
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

/** As long as the real values, so the print test fills the header the PDF has. */
const STAND_IN = { fullName: "Firstname Lastname", phone: "+00 000 000 0000" };

for (const theme of ["dark", "light"] as const) {
  test(`the Résumé prints black on white on one A4 page from the ${theme} theme`, async ({
    page,
  }) => {
    await page.goto("/en");
    if (theme === "light") {
      await page.getByRole("button", { name: "Switch to light theme" }).click();
    }
    await page.goto("/en/resume");
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
    await expect(languageMenu(page).pill).toBeHidden();
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

test("the PDF's phone number finds the contact list in any Language version", async ({
  page,
}) => {
  await page.goto("/en/resume");
  const contact = page.getByRole("list", { name: "Contact" });
  await contact.evaluate((list) => list.setAttribute("aria-label", "Contatti"));

  await applyPrivateDetails(page, STAND_IN);

  await expect(
    page.getByRole("list", { name: "Contatti" }).getByRole("listitem"),
  ).toContainText([STAND_IN.phone]);
});

for (const [lang, label, file] of [
  ["en", "Download PDF", "Roberto-Prats-EN.pdf"],
  ["it", "Scarica PDF", "Roberto-Prats-IT.pdf"],
] as const) {
  test(`the ${lang} Résumé PDF downloads as ${file}, and nothing else links to it`, async ({
    page,
  }) => {
    const errors = trackErrors(page);

    for (const route of [`/${lang}`, `/${lang}/projects/devflow`]) {
      await page.goto(route);
      await expect(page.locator('a[href$=".pdf"]')).toHaveCount(0);
    }

    await page.goto(`/${lang}/resume`);
    await expect(page.locator('a[href$=".pdf"]')).toHaveCount(1);
    const downloading = page.waitForEvent("download");
    await page.getByRole("link", { name: label }).click();
    const download = await downloading;

    expect(download.suggestedFilename()).toBe(file);
    // The committed file, not a fresh print.
    expectOneA4Page(await readFile(await download.path()));
    expect(errors).toEqual([]);
  });
}

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
  for (const route of ["/en", "/en/resume"]) {
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

  await page.goto("/en/projects/devflow");
  await expect(
    page.getByRole("link", { name: "Matt Pocock's skills" }),
  ).toHaveAttribute("target", "_blank");
});
