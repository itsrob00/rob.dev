import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { Anchor } from "../components/anchor";

function render(href: string, rel?: string) {
  return renderToStaticMarkup(
    <Anchor href={href} rel={rel}>
      x
    </Anchor>,
  );
}

describe("Anchor", () => {
  test.each([
    "https://github.com/itsrob00/devflow",
    "http://example.com/",
    "//example.com/x",
    "HTTPS://Example.com/",
    "https://itsrob.dev.example.com/",
  ])("%s leaves the site, so it opens in a new tab", (href) => {
    expect(render(href)).toBe(
      `<a href="${href}" target="_blank" rel="noopener">x</a>`,
    );
  });

  test.each([
    "#about",
    "/resume",
    "/Rob-Resume.pdf",
    "mailto:roberto.prats00@gmail.com",
    "",
    "https://itsrob.dev",
    "https://ITSROB.dev/projects/devflow",
  ])("%s stays on the site, so it renders as a plain link", (href) => {
    expect(render(href)).toBe(`<a href="${href}">x</a>`);
  });

  test("keeps rel=me beside noopener on another site", () => {
    expect(render("https://github.com/itsrob00", "me")).toBe(
      '<a href="https://github.com/itsrob00" target="_blank" rel="me noopener">x</a>',
    );
  });

  test("keeps rel=me alone on this site", () => {
    expect(render("https://itsrob.dev", "me")).toBe(
      '<a href="https://itsrob.dev" rel="me">x</a>',
    );
  });

  test("never repeats noopener", () => {
    expect(render("https://example.com/", "noopener")).toBe(
      '<a href="https://example.com/" target="_blank" rel="noopener">x</a>',
    );
  });

  test("passes other attributes through", () => {
    expect(
      renderToStaticMarkup(
        <Anchor href="/Rob-Resume.pdf" download="Rob-Resume.pdf" className="d">
          Download PDF
        </Anchor>,
      ),
    ).toBe(
      '<a download="Rob-Resume.pdf" class="d" href="/Rob-Resume.pdf">Download PDF</a>',
    );
  });
});
