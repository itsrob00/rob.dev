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
    published: true,
  },
] as const;

export type LanguageCode = (typeof LIST)[number]["code"];

type RegionOf<Locale> = Locale extends `${string}_${infer Region}`
  ? Region
  : never;

export type FlagRegion = RegionOf<(typeof LIST)[number]["ogLocale"]>;

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

export function languageParams(): { lang: LanguageCode }[] {
  return publishedLanguageVersions().map(({ code }) => ({ lang: code }));
}

export function languageVersion(code: string): LanguageVersion {
  const version = publishedLanguageVersions().find((v) => v.code === code);
  if (!version) throw new Error(`No published Language version "${code}"`);
  return version;
}

export function pathIn(code: LanguageCode, path: SitePath): SitePath {
  return `/${code}${path.replace(/^\/(?=#|$)/, "")}`;
}

export type LanguageMenuEntry = {
  code: LanguageCode;
  name: string;
  region: FlagRegion;
  href: string;
  current: boolean;
};

export function languageMenu(
  pathname: string,
  hash: string,
): LanguageMenuEntry[] {
  const [, current, ...rest] = pathname.split("/");
  const path: SitePath = `/${rest.join("/")}${hash}`;
  return publishedLanguageVersions().map(({ code, name, ogLocale }) => ({
    code,
    name,
    region: ogLocale.slice(ogLocale.indexOf("_") + 1) as FlagRegion,
    href: pathIn(code, path),
    current: code === current,
  }));
}

export function alternatesFor(path: SitePath): Record<string, SitePath> {
  return {
    ...Object.fromEntries(
      publishedLanguageVersions().map(({ code }) => [code, pathIn(code, path)]),
    ),
    "x-default": "/",
  };
}
