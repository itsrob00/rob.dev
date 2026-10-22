import { expect, test } from "vitest";
import { pickActiveSection } from "../lib/scroll-spy";

const ids = ["about", "work", "experience", "stack"] as const;

// tops: each section's distance below the window's top edge. A nav click scrolls it to 72px.
const at = (tops: number[]) =>
  ids.map((id, i) => ({ id, top: tops[i], line: 72 }));

const midPage = { scrollY: 600, viewportHeight: 800, documentHeight: 3000 };

test("marks the first section at the top of the page", () => {
  expect(
    pickActiveSection(at([72, 472, 972, 1472]), {
      scrollY: 0,
      viewportHeight: 800,
      documentHeight: 3000,
    }),
  ).toBe("about");
});

test("marks a section as soon as its heading is in the top half, before it reaches the line", () => {
  expect(pickActiveSection(at([-528, 165, 534, 900]), midPage)).toBe("work");
});

test("keeps the previous section while the next heading is in the bottom half", () => {
  expect(pickActiveSection(at([-528, -163, 401, 770]), midPage)).toBe("work");
});

test("marks the clicked section once a nav click lands it on the line", () => {
  expect(pickActiveSection(at([-1128, -428, 72, 672]), midPage)).toBe(
    "experience",
  );
  // Smooth scrolling and zoom can stop a pixel or two either side.
  expect(pickActiveSection(at([-828, -228, 73.5, 572]), midPage)).toBe(
    "experience",
  );
  expect(pickActiveSection(at([-828, -228, 70.5, 572]), midPage)).toBe(
    "experience",
  );
});

test("marks a clicked section shorter than half the window, though the next heading is in the top half too", () => {
  expect(pickActiveSection(at([-600, 72, 300, 900]), midPage)).toBe("work");
});

test("marks the last section once every heading has scrolled past the line", () => {
  expect(pickActiveSection(at([-2000, -1500, -1000, -10]), midPage)).toBe(
    "stack",
  );
});

test("marks the last section at the bottom of the page, even in the bottom half", () => {
  expect(
    pickActiveSection(at([-1728, -1128, -528, 572]), {
      scrollY: 1100,
      viewportHeight: 800,
      documentHeight: 1900,
    }),
  ).toBe("stack");
});

test("keeps the first section when the whole page fits on screen", () => {
  expect(
    pickActiveSection(at([72, 172, 272, 372]), {
      scrollY: 0,
      viewportHeight: 800,
      documentHeight: 800,
    }),
  ).toBe("about");
});
