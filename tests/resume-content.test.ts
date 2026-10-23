import { describe, expect, test } from "vitest";
import { experience } from "../content/experience";
import { profileCopy } from "../content/profile";
import { resume } from "../content/resume";
import { LANGUAGE_VERSIONS } from "../lib/language-versions";
import { formatEducationDates } from "../lib/resume";

const NOW = "9999-12";
const CODES = LANGUAGE_VERSIONS.map(({ code }) => code);

describe("content in every Language version", () => {
  test("the profile, Experience and Résumé records have an entry for each one", () => {
    for (const record of [profileCopy, experience, resume]) {
      expect(Object.keys(record).toSorted()).toEqual(CODES.toSorted());
    }
  });

  for (const code of CODES) {
    test(`${code}: Experience has English's dates and tech, so only the words differ`, () => {
      const facts = (code: (typeof CODES)[number]) =>
        experience[code].map(({ start, end, engagements }) => ({
          start,
          end,
          engagements: engagements.map(({ start, end, tech }) => ({
            start,
            end,
            tech,
          })),
        }));
      expect(facts(code)).toEqual(facts("en"));
    });

    test(`${code}: the Résumé record has English's skill groups, languages and Education dates`, () => {
      const facts = (code: (typeof CODES)[number]) => ({
        skillGroups: resume[code].skills.length,
        languages: resume[code].languages.length,
        education: resume[code].education.map(({ dates }) => dates),
      });
      expect(facts(code)).toEqual(facts("en"));
    });
  }
});

describe("Experience records", () => {
  for (const code of CODES) {
    for (const entry of experience[code]) {
      test(`${code}, ${entry.employer}: Engagements run newest first, inside the Experience`, () => {
        const starts = entry.engagements.map((engagement) => engagement.start);
        expect(starts).toEqual(starts.toSorted().reverse());
        for (const engagement of entry.engagements) {
          expect(engagement.start >= entry.start).toBe(true);
          expect((engagement.end ?? NOW) <= (entry.end ?? NOW)).toBe(true);
        }
      });
    }

    test(`${code}: Engagement names are unique: they are headings and keys`, () => {
      const names = experience[code].flatMap((entry) =>
        entry.engagements.map((engagement) => engagement.name),
      );
      expect(new Set(names).size).toBe(names.length);
    });
  }
});

describe("Résumé record", () => {
  for (const code of CODES) {
    test(`${code}: Education dates all format`, () => {
      for (const entry of resume[code].education) {
        expect(() => formatEducationDates(entry.dates)).not.toThrow();
      }
    });

    test(`${code}: skill groups and education titles are unique`, () => {
      const labels = resume[code].skills.map((group) => group.label);
      const titles = resume[code].education.map((entry) => entry.title);
      expect(new Set(labels).size).toBe(labels.length);
      expect(new Set(titles).size).toBe(titles.length);
    });
  }
});
