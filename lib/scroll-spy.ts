/** A nav section, measured in the browser. `top` is how far its top sits below the window's top
 *  edge, and `line` is where a nav click scrolls that top to (its `scroll-margin-top`). */
export type MeasuredSection<Id extends string> = {
  id: Id;
  top: number;
  line: number;
};

export type ScrollMetrics = {
  scrollY: number;
  viewportHeight: number;
  documentHeight: number;
};

// Smooth scrolling and browser zoom can stop a section a pixel or two either side of the line.
const TOLERANCE_PX = 2;

/**
 * The section the reader is in, given sections in page order (Docusaurus's table-of-contents rule):
 * - scrolled to the bottom: the last one, since a short last section may never reach the top half;
 * - otherwise the first one not yet scrolled past its line, if its top is in the top half of the
 *   window: a section counts as soon as its heading is in view up there, and a nav click marks what
 *   it scrolled to even when the next heading is in the top half too;
 * - otherwise the one before it, whose content still fills the top of the window;
 * - the last one once every section has scrolled past its line.
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

  const next = sections.findIndex(
    ({ top, line }) => top - line > -TOLERANCE_PX,
  );
  if (next === -1) return sections.at(-1)?.id;
  if (sections[next].top < viewportHeight / 2) return sections[next].id;
  return sections[Math.max(next - 1, 0)].id;
}
