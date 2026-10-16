import { expect, test } from "@playwright/test";

// The visitor's OS asks for light; the site must still open dark.
test.use({ colorScheme: "light" });

test.beforeEach(async ({ page }) => {
  // Only Vercel serves the Analytics and Speed Insights scripts; the local static server 404s them.
  await page.route("**/_vercel/**/script.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: "" }),
  );
});

test("home loads with no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

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

test("contact links and theme toggle are reachable by keyboard, with visible focus", async ({
  page,
}) => {
  await page.goto("/");

  const reached: string[] = [];
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).not.toHaveCSS("outline-style", "none");
    reached.push(
      (await focused.getAttribute("aria-label")) ?? (await focused.innerText()),
    );
  }

  expect(reached).toEqual([
    "Email",
    "LinkedIn",
    "GitHub",
    "Switch to light theme",
  ]);
});
