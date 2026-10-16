const gaetaTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Rome",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZoneName: "short",
});

/** Local time in Gaeta, e.g. "14:05 CEST". Europe/Rome handles the DST switch. */
export function formatGaetaTime(date: Date): string {
  return gaetaTime.format(date);
}
