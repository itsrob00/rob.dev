import { expect, test } from "@playwright/test";

test("home loads with no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  // Only Vercel serves the Analytics and Speed Insights scripts; the local static server 404s them.
  await page.route("**/_vercel/**/script.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: "" }),
  );

  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Rob", exact: true }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");

  expect(errors).toEqual([]);
});
