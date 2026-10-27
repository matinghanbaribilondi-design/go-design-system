/**
 * Paragraphs inside one text layer.
 *
 * Figma's `paragraphSpacing` is the gap between paragraphs — the blank space a
 * designer sets on a body-copy layer, not the leading between lines. The
 * converter turned every newline into a `<br />`, which is a line break inside
 * one block: there is no paragraph boundary for a margin to attach to, so the
 * value did nothing outside lists.
 *
 * A margin needs a box, and the only box that can exist between two paragraphs
 * is a block per paragraph. That is what this module splits; the generators
 * decide how to write the blocks.
 *
 * The split is deliberately independent of styling: a paragraph can hold
 * several styled runs, and a run can straddle a paragraph break (a link that
 * covers the end of one paragraph and the start of the next), so runs are cut
 * at the break and regrouped rather than mapped one-to-one.
 */

/** A piece of text with the inline declarations that style it. */
export interface TextRun {
  text: string;
  /** Inline CSS for this run, without the `style=""` wrapper. */
  styleAttr?: string;
  /** Destination when this run is a hyperlink. */
  href?: string;
}

const PARAGRAPH_BREAK = /\r\n|\r|\n/;

/** True when the text has more than one paragraph. */
export function hasParagraphBreak(text: string): boolean {
  return PARAGRAPH_BREAK.test(text);
}

/** A plain string cut into paragraphs. Empty trailing lines are kept: they are blank lines the designer drew. */
export function paragraphsOf(text: string): string[] {
  return text.split(PARAGRAPH_BREAK);
}

/**
 * Styled runs regrouped into paragraphs.
 *
 * A run that spans a break becomes one run per paragraph, each keeping the
 * original style, so a link or a bold phrase that crosses the break stays
 * styled on both sides.
 */
export function paragraphsOfRuns(runs: readonly TextRun[]): TextRun[][] {
  const paragraphs: TextRun[][] = [[]];

  for (const run of runs) {
    const parts = run.text.split(PARAGRAPH_BREAK);
    parts.forEach((part, index) => {
      if (index > 0) paragraphs.push([]);
      if (part.length > 0) {
        paragraphs[paragraphs.length - 1]!.push({
          text: part,
          styleAttr: run.styleAttr,
          href: run.href,
        });
      }
    });
  }

  return paragraphs;
}
