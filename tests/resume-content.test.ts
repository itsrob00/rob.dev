import { describe, expect, test } from "vitest";
import { experience, type Experience } from "../content/experience";
import { resume } from "../content/resume";
import { formatEducationDates } from "../lib/resume";

const NOW = "9999-12";
const entries: readonly Experience[] = experience;

describe("Experience records", () => {
  for (const entry of entries) {
    test(`${entry.employer}: Engagements run newest first, inside the Experience`, () => {
      const starts = entry.engagements.map((engagement) => engagement.start);
      expect(starts).toEqual(starts.toSorted().reverse());
      for (const engagement of entry.engagements) {
        expect(engagement.start >= entry.start).toBe(true);
        expect((engagement.end ?? NOW) <= (entry.end ?? NOW)).toBe(true);
      }
    });
  }

  test("Engagement names are unique: they are headings and keys", () => {
    const names = entries.flatMap((entry) =>
      entry.engagements.map((engagement) => engagement.name),
    );
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("Résumé record", () => {
  test("Education dates all format", () => {
    for (const entry of resume.education) {
      expect(() => formatEducationDates(entry.dates)).not.toThrow();
    }
  });

  test("skill groups and education titles are unique", () => {
    const labels = resume.skills.map((group) => group.label);
    const titles = resume.education.map((entry) => entry.title);
    expect(new Set(labels).size).toBe(labels.length);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
