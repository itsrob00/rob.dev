import { describe, expect, test } from "vitest";
import { dictionary } from "../lib/dictionaries";
import {
  DEFAULT_LANGUAGE_VERSION,
  LANGUAGE_VERSIONS,
} from "../lib/language-versions";

function leaves(value: unknown, at = ""): [string, unknown][] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [[at, value]];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, at ? `${at}.${key}` : key),
  );
}

const keys = (value: unknown) => leaves(value).map(([key]) => key);

describe.each(LANGUAGE_VERSIONS)("the $name dictionary", ({ code }) => {
  test("has every key the default has, and no other", () => {
    expect(keys(dictionary[code])).toEqual(
      keys(dictionary[DEFAULT_LANGUAGE_VERSION.code]),
    );
  });

  test("leaves no string empty", () => {
    for (const [key, value] of leaves(dictionary[code])) {
      if (typeof value === "string") expect(value.trim(), key).not.toBe("");
    }
  });

  test("names all twelve months, each once", () => {
    const { months } = dictionary[code].dates;
    expect(months).toHaveLength(12);
    expect(new Set(months).size).toBe(12);
  });
});
