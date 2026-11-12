import { describe, expect, test } from "vitest";
import { isLanguageSwitch, languageSwitchScript } from "../lib/language-switch";

const CODES = ["en", "it"];

type Reveal = { viewTransition: { skipTransition: () => void } | null };

function arrive({
  referrer,
  url,
  type = "navigate",
}: {
  referrer: string;
  url: string;
  type?: string;
}) {
  const root = { dataset: {} as Record<string, string> };
  const location = new URL(url);
  const listeners: ((event: Reveal) => void)[] = [];
  new Function(
    "document",
    "location",
    "performance",
    "addEventListener",
    languageSwitchScript,
  )(
    { documentElement: root, referrer },
    location,
    { getEntriesByType: () => [{ type }] },
    (name: string, listener: (event: Reveal) => void) => {
      if (name === "pagereveal") listeners.push(listener);
    },
  );
  const reveal = () => {
    let skipped = false;
    const event = {
      viewTransition: {
        skipTransition: () => {
          skipped = true;
        },
      },
    };
    listeners.forEach((listener) => listener(event));
    return skipped ? "skipped" : "ran";
  };
  return { arrival: root.dataset.arrival, reveal };
}

describe("the head script on the arriving page", () => {
  test("marks a language switch and keeps its crossfade", () => {
    const page = arrive({
      referrer: "https://itsrob.dev/en/resume",
      url: "https://itsrob.dev/it/resume",
    });
    expect(page.arrival).toBe("language-switch");
    expect(page.reveal()).toBe("ran");
  });

  test.each([
    ["a reload", { type: "reload" }],
    ["back or forward", { type: "back_forward" }],
    ["a typed URL", { referrer: "" }],
    ["another site", { referrer: "https://example.com/en/resume" }],
    ["a link within one language", { referrer: "https://itsrob.dev/it" }],
  ])("leaves %s unmarked and skips its transition", (_, overrides) => {
    const page = arrive({
      referrer: "https://itsrob.dev/en/resume",
      url: "https://itsrob.dev/it/resume",
      ...overrides,
    });
    expect(page.arrival).toBeUndefined();
    expect(page.reveal()).toBe("skipped");
  });

  test("skips the transition when the page comes back from the back-forward cache", () => {
    const page = arrive({
      referrer: "https://itsrob.dev/en",
      url: "https://itsrob.dev/it",
    });
    expect(page.reveal()).toBe("ran");
    expect(page.reveal()).toBe("skipped");
  });
});

describe("isLanguageSwitch", () => {
  test.each([
    ["/en", "/it"],
    ["/it/resume", "/en/resume"],
    ["/en/projects/devflow", "/it/projects/devflow"],
    ["/en/resume/", "/it/resume"],
  ])("%s → %s is the same page in another Language version", (from, to) => {
    expect(isLanguageSwitch(from, to, CODES)).toBe(true);
  });

  test.each([
    ["/en", "/en/resume"],
    ["/en/resume", "/en/resume"],
    ["/en", "/it/resume"],
    ["/fr", "/en"],
    ["/", "/en"],
  ])("%s → %s is not", (from, to) => {
    expect(isLanguageSwitch(from, to, CODES)).toBe(false);
  });
});
