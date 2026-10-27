import type { ConversionOptions, LayoutStyles } from '../plugin/types/ir';
import { formatUnit } from '../plugin/converter/utils';
import { wrapFloor } from './fluid';
import { responsiveEnabled } from './responsive';

/**
 * Main-axis sizing for a child of a flex row, decided in one place.
 *
 * ## Why this is a module and not three branches
 *
 * A flex item's width is the product of five declarations that only mean
 * anything together: `flex-grow`, `flex-shrink`, `flex-basis`, `min-width` and
 * `max-width`. They were previously written by three separate branches plus a
 * later "safeguard" pass, and the passes disagreed — the safeguard re-imposed
 * the drawn width as a floor on top of a basis the sizing branch had just
 * lowered:
 *
 *     .search-input { flex-basis: 640px; min-width: 640px; }
 *
 * `min-width` is a hard floor in flexbox: a row of items that each carry their
 * drawn width as a floor cannot compress by a single pixel, so instead of
 * reflowing the row simply overflows its container. That is the bug this module
 * exists to make impossible — there is one function that emits the whole box,
 * and it guarantees that a floor is never larger than the role allows.
 *
 * ## The three roles
 *
 * - **fixed** — a control (icon, avatar, chip, small button). It keeps the size
 *   it was drawn at and is excluded from the shrink pass; squeezing an icon
 *   distorts it rather than adapting anything.
 * - **fill** — the one element of a row that is meant to absorb its space (a
 *   search field in a toolbar, the body of a rail-and-body shell). `flex-basis:
 *   0` means it is sized by what is left over, not by what it was drawn at.
 *   Capped at its drawn width it becomes a *flexible slot*: it takes the row's
 *   slack but never grows past the design, and it compresses rather than
 *   breaking the line.
 * - **share** — everything else: a column of a grid, a card, a text block. It
 *   starts at its drawn width, shrinks with its siblings, and is capped so it
 *   never grows past the design.
 *
 * `grow` and `floorPx` are orthogonal to the role, because they answer different
 * questions: *may this item take free space?* and *how small may it get before
 * its row is allowed to break?*
 */
export type MainAxisRole = 'fixed' | 'fill' | 'share';

export interface MainAxisSizing {
  role: MainAxisRole;
  /** The width as drawn in Figma, in px. */
  drawnPx: number;
  /** Whether the item may absorb the row's free space. */
  grow: boolean;
  /**
   * Smallest inline size the item may be squeezed to before its row breaks.
   * `0` means it may collapse to nothing. A floor larger than the drawn width
   * is clamped to it: a floor above the design would make the item wider than
   * the designer drew it, which is never what "this may not shrink below X"
   * means.
   */
  floorPx?: number;
  /**
   * Use the item's own min-content width as its floor.
   *
   * A cluster of fixed controls has a hard floor that no ratio can express:
   * squeezing two 32px icons into 34px does not make them smaller, it makes
   * them overlap. `min-content` is the browser's own answer to "how small can
   * this be before it breaks", so it is the honest floor for such a cluster.
   */
  floorToContent?: boolean;
  /**
   * `drawn` keeps the designed width as a ceiling, `full` drops it so an item
   * that wrapped onto a line of its own fills that line. A packed grid wants
   * `full`; a deliberately small card wants `drawn`.
   *
   * A `fill` item defaults to `full` (its whole job is to absorb the row) and a
   * `share` item to `drawn` (its whole job is to reproduce the drawing), so the
   * default belongs to the role, not to this field.
   */
  cap?: 'drawn' | 'full';
}

/**
 * The declarations for one flex item on the main axis.
 *
 * The returned object is complete: it states every sizing declaration the item
 * needs and nothing that contradicts them. Callers must not add a `min-width`
 * afterwards — that is what broke before.
 */
export function mainAxisBox(
  sizing: MainAxisSizing,
  options: ConversionOptions
): Partial<LayoutStyles> {
  const { role, drawnPx, grow } = sizing;
  const drawn = formatUnit(drawnPx, options.useRem, options.baseFontSize);

  if (role === 'fixed') {
    const rigid: Partial<LayoutStyles> = {
      width: drawn,
      flexGrow: 0,
      flexShrink: 0,
    };
    // `max-width: 100%` is a parent-relative safety net, and with responsiveness
    // off the export has to reproduce the drawing exactly — the one such net on
    // the page belongs to the document, not to every rigid box in it.
    if (responsiveEnabled(options)) rigid.maxWidth = '100%';
    return rigid;
  }

  const floorPx = Math.min(sizing.floorPx ?? 0, drawnPx > 0 ? drawnPx : 0);
  // `min()` keeps the floor from ever exceeding the container, so the item can
  // always collapse to a single column on the narrowest screen.
  const minWidth = sizing.floorToContent
    ? 'min-content'
    : floorPx > 0
      ? wrapFloor(floorPx, options)
      : '0';

  if (role === 'fill') {
    return {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: '0%',
      minWidth,
      // A `fill` fills by default. Asking for `cap: 'drawn'` turns it into a
      // *flexible slot*: it starts at nothing, grows into whatever the row has
      // spare, and stops at the width it was drawn at.
      //
      // That cap is what makes a slot compress instead of breaking its row. A
      // flex line breaks on each item's *hypothetical* size — its basis clamped
      // by min/max — and it does so before any shrinking is considered. A 700px
      // basis in a 768px bar therefore breaks the line even though the slot
      // would have been perfectly happy at 416px. With a zero basis the
      // hypothetical size is the slot's floor, so the line only breaks when the
      // slot can no longer be used.
      //
      // Free space also lands in the right place: when a bar has two slots the
      // smaller one hits its cap first and the rest goes to the larger, which
      // is the drawn proportion without needing to state it.
      maxWidth: sizing.cap === 'drawn' ? drawn : '100%',
    };
  }

  return {
    flexGrow: grow ? 1 : 0,
    flexShrink: 1,
    flexBasis: drawn,
    minWidth,
    maxWidth: sizing.cap === 'full' ? '100%' : drawn,
  };
}

/**
 * Writes a main-axis box onto a layout, removing the declarations it replaces.
 *
 * `width` and `flex-basis` both set a flex item's base size, and when both are
 * present the basis wins — but the leftover `width` still leaks into other
 * consumers (the Tailwind emitter reads it, and `max-width: 100%` is applied
 * relative to it). A box that is sized by its basis therefore states no width.
 */
export function applyMainAxis(layout: LayoutStyles, box: Partial<LayoutStyles>): LayoutStyles {
  delete layout.width;
  delete layout.minWidth;
  delete layout.maxWidth;
  delete layout.flexGrow;
  delete layout.flexShrink;
  delete layout.flexBasis;

  return Object.assign(layout, box);
}
