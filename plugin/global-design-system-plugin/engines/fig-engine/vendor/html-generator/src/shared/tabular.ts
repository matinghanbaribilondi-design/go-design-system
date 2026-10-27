/**
 * Tabular figures.
 *
 * Figma has no table node, so a table is drawn as a frame of row frames of cell
 * frames — and the numbers in it are set in whatever proportional font the
 * design uses. In a proportional font a `1` is narrower than a `4`, so the
 * digits of a column do not line up: every row starts a little to the left or
 * right of the one above it, and the column stops reading as a column.
 *
 * CSS fixes this with `font-variant-numeric: tabular-nums`, which gives every
 * digit the same advance width. It is not a global improvement: tabular figures
 * are wider than proportional ones, so body copy set in them looks loose and
 * gaps open around the digits in running text. The declaration is therefore
 * inherited from a *container* that is recognisably a table, and nothing else.
 *
 * Recognising one is the whole job of this module. The shape has to be read
 * from the IR, which carries no pixel boxes — only the CSS each layer was given
 * — so the test is structural: rows stacked in one direction, the same number
 * of cells in every row, cells in a column sharing an exact width, and a
 * majority of the cells holding numbers. A grid of cards fails the last test; a
 * list of paragraphs fails the first.
 */

import type { IRNode } from '../plugin/types/ir';
import {
  TABULAR_MIN_COLUMNS,
  TABULAR_MIN_NUMERIC_SHARE,
  TABULAR_MIN_ROWS,
} from './constants';

/** Everything a numeric cell may contain besides its digits. */
const NUMERIC_NOISE = /[\s.,%$€£¥+−\-–—/():;'"]/g;

/** Decimal digits in Latin, Arabic-Indic and Persian-Indic. */
const DIGITS = /[0-9\u0660-\u0669\u06F0-\u06F9]/;

/**
 * True when the text is a number rather than prose.
 *
 * The test is subtractive: strip the punctuation numbers are written with,
 * strip spaces, and what is left must be digits and nothing else. So `1,240`
 * and `٪12.5` are numbers, `2 items` is not — one letter is enough to make it
 * prose, which is what keeps a table of labels from qualifying.
 */
export function isNumericText(text: string | undefined): boolean {
  if (!text) return false;
  const stripped = text.replace(NUMERIC_NOISE, '');
  if (stripped.length === 0) return false;
  return DIGITS.test(stripped) && !/[^\d\u0660-\u0669\u06F0-\u06F9]/.test(stripped);
}

/** The text a layer paints, whether it is one string or several styled runs. */
export function textOf(node: IRNode): string {
  if (node.text) return node.text;
  const segments = node.typography?.segments;
  if (!segments || segments.length === 0) return '';
  return segments.map((segment) => segment.text).join('');
}

/** The width a layer was given, as the CSS string it will be written with. */
function widthOf(node: IRNode): string | null {
  const width = node.layout.width ?? node.layout.minWidth;
  return typeof width === 'string' && width.length > 0 ? width : null;
}

/** Every text a layer holds, so a cell frame and a bare text layer read the same. */
function textsUnder(node: IRNode, out: string[] = []): string[] {
  const own = textOf(node);
  if (own) out.push(own);
  for (const child of node.children) textsUnder(child, out);
  return out;
}

/**
 * True when a layer is a table and its figures should be tabular.
 *
 * The container itself has to be a stack — a column of rows or a grid — because
 * a horizontal strip of equal boxes is a toolbar, not a table.
 */
export function looksTabular(node: IRNode): boolean {
  const rows = node.children;
  if (rows.length < TABULAR_MIN_ROWS) return false;

  const stacked =
    node.layout.display === 'grid' ||
    (node.layout.display === 'flex' && node.layout.flexDirection !== 'row');
  if (!stacked) return false;

  const columns = rows[0]!.children.length;
  if (columns < TABULAR_MIN_COLUMNS) return false;

  // Rows of a table share their width; that is what makes the columns align.
  const rowWidth = widthOf(rows[0]!);
  if (!rowWidth) return false;

  for (const row of rows) {
    if (row.children.length !== columns) return false;
    if (widthOf(row) !== rowWidth) return false;
  }

  // Cells in one column share their width. A grid of equal cards would pass
  // this too, which is why the numeric share below carries the decision.
  for (let column = 0; column < columns; column += 1) {
    const cellWidth = widthOf(rows[0]!.children[column]!);
    if (!cellWidth) return false;
    for (const row of rows) {
      if (widthOf(row.children[column]!) !== cellWidth) return false;
    }
  }

  const texts = rows.flatMap((row) => textsUnder(row)).filter((text) => text.trim().length > 0);
  if (texts.length === 0) return false;
  const numeric = texts.filter(isNumericText).length;
  return numeric / texts.length >= TABULAR_MIN_NUMERIC_SHARE;
}
