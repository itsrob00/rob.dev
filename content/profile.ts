export type Profile = {
  name: string;
  role: string;
  location: string;
  /** One line under the role. Doubles as the Résumé summary and the home meta description. */
  blurb: string;
  /** The About section: two paragraphs of plain text. */
  about: readonly [string, string];
  email: `${string}@${string}.${string}`;
  linkedin: `https://www.linkedin.com/in/${string}`;
  github: `https://github.com/${string}`;
};

export const profile = {
  name: "Rob",
  role: "Front-end Engineer & Tech Lead",
  location: "Gaeta, Italy",
  blurb:
    "I build front ends for large platforms in React and TypeScript, and make sure they're well tested.",
  about: [
    "I've built front ends in React and TypeScript since 2023. Today I lead the front end of PCO, a national public-sector platform we took over from IBM and now build with Sogei. I set the technical direction for a team of three front-end developers and own front-end quality: I introduced unit testing and grew the suite from zero to over 1,000 tests at 85%+ coverage.",
    "AI has been part of how I work for a while, and migrating Sisal's game shell from React 15 to 19 is where I sharpened it. devflow came out of that: my open-source Claude Code workflow, which I use and refine every day.",
  ],
  email: "roberto.prats00@gmail.com",
  linkedin: "https://www.linkedin.com/in/robertoprats",
  github: "https://github.com/itsrob00",
} satisfies Profile;
