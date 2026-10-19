import { describe, expect, test } from "vitest";
import { personJsonLd } from "../lib/person-json-ld";

const rob = {
  name: "Rob",
  role: "Front-end Engineer & Tech Lead",
  site: "https://itsrob.dev",
  linkedin: "https://www.linkedin.com/in/someone",
  github: "https://github.com/someone",
} as const;

describe("personJsonLd", () => {
  test("describes the person with their name, job title, site and profiles", () => {
    expect(JSON.parse(personJsonLd(rob))).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Rob",
      jobTitle: "Front-end Engineer & Tech Lead",
      url: "https://itsrob.dev",
      sameAs: [
        "https://www.linkedin.com/in/someone",
        "https://github.com/someone",
      ],
    });
  });

  test("can't close the script tag it's written into", () => {
    const json = personJsonLd({ ...rob, name: "</script><script>alert(1)" });
    expect(json).not.toContain("<");
    expect(JSON.parse(json).name).toBe("</script><script>alert(1)");
  });
});
