import { publishedLanguageVersions } from "./language-versions";

export function isLanguageSwitch(
  from: string,
  to: string,
  codes: readonly string[],
): boolean {
  const split = (path: string) => {
    const [, lang = "", ...rest] = path.replace(/\/+$/, "").split("/");
    return { lang, rest: rest.join("/") };
  };
  const left = split(from);
  const entered = split(to);
  return (
    codes.includes(left.lang) &&
    codes.includes(entered.lang) &&
    left.lang !== entered.lang &&
    left.rest === entered.rest
  );
}

function markArrivalAndVetoTransitions(
  isSwitch: typeof isLanguageSwitch,
  codes: readonly string[],
) {
  let arrived = false;
  try {
    const [entry] = performance.getEntriesByType(
      "navigation",
    ) as PerformanceNavigationTiming[];
    const from = document.referrer ? new URL(document.referrer) : null;
    arrived =
      !!from &&
      from.origin === location.origin &&
      (!entry || entry.type === "navigate") &&
      isSwitch(from.pathname, location.pathname, codes);
  } catch {}
  if (arrived) document.documentElement.dataset.arrival = "language-switch";
  let firstReveal = true;
  addEventListener("pagereveal", (event) => {
    if (event.viewTransition && !(firstReveal && arrived))
      event.viewTransition.skipTransition();
    firstReveal = false;
  });
}

export const languageSwitchScript = `(${markArrivalAndVetoTransitions})(${isLanguageSwitch},${JSON.stringify(
  publishedLanguageVersions().map(({ code }) => code),
)})`;
