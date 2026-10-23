const LIST = [
  {
    code: "en",
    name: "English",
    ogLocale: "en_US",
    pdfSuffix: "EN",
    published: true,
  },
  {
    code: "it",
    name: "Italiano",
    ogLocale: "it_IT",
    pdfSuffix: "IT",
    published: false,
  },
] as const satisfies readonly {
  code: string;
  name: string;
  ogLocale: string;
  pdfSuffix: string;
  published: boolean;
}[];

export type LanguageCode = (typeof LIST)[number]["code"];

export type LanguageVersion = {
  code: LanguageCode;
  name: string;
  ogLocale: string;
  pdfSuffix: string;
  published: boolean;
};

export const LANGUAGE_VERSIONS: readonly LanguageVersion[] = LIST;

export const DEFAULT_LANGUAGE_VERSION = LANGUAGE_VERSIONS[0];

export type SitePath = "/" | `/${string}`;

export function publishedLanguageVersions(): LanguageVersion[] {
  return LANGUAGE_VERSIONS.filter((version) => version.published);
}

export function languageVersion(code: string): LanguageVersion {
  const version = publishedLanguageVersions().find((v) => v.code === code);
  if (!version) throw new Error(`No published Language version "${code}"`);
  return version;
}

export function pathIn(code: LanguageCode, path: SitePath): SitePath {
  return `/${code}${path.replace(/^\/(?=#|$)/, "")}`;
}

export function alternatesFor(path: SitePath): Record<string, SitePath> {
  return {
    ...Object.fromEntries(
      publishedLanguageVersions().map(({ code }) => [code, pathIn(code, path)]),
    ),
    "x-default": "/",
  };
}
