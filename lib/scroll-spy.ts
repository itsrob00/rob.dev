/** A nav section, measured in the browser. `offset` is how far its top sits below the line a nav
 *  click scrolls it to (its `scroll-margin-top`): 0 or less once it has reached that line. */
export type MeasuredSection<Id extends string> = { id: Id; offset: number };

export type ScrollMetrics = {
  scrollY: number;
  viewportHeight: number;
  documentHeight: number;
};

// Smooth scrolling and browser zoom can stop a section a pixel or two short of the line.
const TOLERANCE_PX = 2;

/**
 * The section the reader is in, given sections in page order:
 * - scrolled to the bottom: the last one, since a short last section never reaches the line;
 * - otherwise the last one whose top has reached the line, so a nav click marks what it scrolled to;
 * - otherwise the first one.
 * Undefined only for an empty list.
 */
export function pickActiveSection<Id extends string>(
  sections: readonly MeasuredSection<Id>[],
  metrics: ScrollMetrics,
): Id | undefined {
  const { scrollY, viewportHeight, documentHeight } = metrics;
  const atBottom =
    scrollY > 0 && scrollY + viewportHeight >= documentHeight - TOLERANCE_PX;
  if (atBottom) return sections.at(-1)?.id;

  let active = sections[0]?.id;
  for (const section of sections) {
    if (section.offset <= TOLERANCE_PX) active = section.id;
  }
  return active;
}
