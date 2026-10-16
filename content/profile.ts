export type Profile = {
  name: string;
  role: string;
  location: string;
  /** One line under the role. Doubles as the Résumé summary and the home meta description. */
  blurb: string;
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
  email: "roberto.prats00@gmail.com",
  linkedin: "https://www.linkedin.com/in/robertoprats",
  github: "https://github.com/itsrob00",
} satisfies Profile;
