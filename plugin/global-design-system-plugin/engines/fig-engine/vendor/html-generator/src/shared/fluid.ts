import type { ConversionOptions } from '../plugin/types/ir';
import { formatUnit } from '../plugin/converter/utils';
import { FLUID_MIN_RATIO, MIN_COLUMN_WIDTH_PX } from './constants';
import { responsiveEnabled } from './responsive';

/**
 * Fluid length helpers.
 *
 * The plugin emits flexbox, so most of the responsive behaviour comes from the
 * layout engine itself (proportional `flex` sizing, `min-width` floors,
 * `flex-wrap`). What the engine cannot do on its own is scale *values* — type,
 * padding, gaps — which is what these helpers are for.
 *
 * A fluid value is a single `clamp()` rule built from the design: it renders
 * exactly as designed at the width the design was drawn at, tracks that width
 * below it, and stops at a floor. One continuous rule therefore replaces a set
 * of per-breakpoint overrides, and nothing is tied to a specific viewport.
 *
 * ## The reference, not the viewport
 *
 * Every value here is expressed as a percentage of **the box that sizes the
 * element**, never of the viewport. That distinction is the whole point:
 *
 * - `vw` is the width of the *window*. The exported page is capped at the
 *   design width and can be embedded in anything — a preview pane, an iframe, a
 *   column beside a sidebar. In a 500px-wide preview inside a 1440px window,
 *   `4vw` is 58px, so a value designed for a 1200px page never shrinks at all
 *   and the page overflows the panel it was dropped into.
 * - `%` is the width of the containing block, which is exactly the box the
 *   element is laid out in. It is correct at any container width, with no
 *   knowledge of the window, and it needs no container query to resolve.
 *
 * The percentage is computed from the same width the value was measured
 * against, so at the design width the rule is pixel-identical to Figma by
 * construction — there is no "approximately the design" state.
 *
 * Type is the one exception: a percentage font size would be a fraction of the
 * *parent's font size*, which has nothing to do with layout. Type therefore
 * uses `cqi` — a percentage of the nearest query container's inline size — and
 * the caller passes the width of that container. See `fluidTypeSize`.
 */

/**
 * The floor a fluid value is allowed to shrink to — the same number
 * `fluidLength` puts in the `min()` of its `clamp()`.
 *
 * Exposed because the stacking threshold needs the gap *at its smallest*: the
 * gap is fluid, so right around the point where a row runs out of room the gap
 * is already at (or near) its floor, and the threshold has to use that value to
 * land on the browser's own wrap point.
 *
 * @param designPx - The value as measured in Figma, in px
 * @param minRatio - Fraction of `designPx` the value may shrink to
 */
export function fluidFloor(designPx: number, minRatio: number = FLUID_MIN_RATIO): number {
  return Math.round(designPx * minRatio);
}

/**
 * The percentage of `referencePx` that `designPx` represents, rounded to two
 * decimals.
 *
 * Two decimals is enough for the value to be indistinguishable from the design
 * at any realistic width (a 0.01% error on a 1200px box is 0.12px) while
 * keeping the generated CSS readable.
 */
export function fluidPercent(designPx: number, referencePx: number): number {
  if (!(designPx > 0) || !(referencePx > 0)) return 0;
  return Math.round((designPx / referencePx) * 10000) / 100;
}

/**
 * Whether a fluid rule is worth emitting for this value at all.
 *
 * A `clamp()` whose floor is within a couple of pixels of its ceiling is pure
 * noise: it cannot move far enough to matter, and it obscures the value.
 */
function isWorthFluid(designPx: number, floor: number): boolean {
  return designPx > 0 && designPx - floor >= 2;
}

function unitFor(options: ConversionOptions): (v: number) => string {
  return (v: number) => formatUnit(v, options.useRem, options.baseFontSize);
}

/**
 * Builds a fluid `clamp(min, preferred, max)` length from a design value.
 *
 * - `max` is the value as designed, so at the design width the output is
 *   pixel-identical to the Figma frame.
 * - `preferred` is the value as a percentage of `referencePx` — the containing
 *   block the value will be resolved against — so it tracks the box that
 *   actually sizes the element.
 * - `min` is the floor: a fixed fraction of the design value.
 *
 * Returns `null` when fluidising is not meaningful — responsiveness is switched
 * off, the reference width is unknown, the value is not a positive length, or
 * the floor is so close to the value that the range is not worth a `clamp()` —
 * so callers fall back to a fixed length instead of emitting a degenerate rule.
 *
 * The switch is checked *here*, not at the call sites. Every fluid length in
 * the output — padding, gaps — comes through this function, so a caller cannot
 * leak a `clamp()` into an export that asked for a fixed-size layout.
 *
 * @param designPx - The value as measured in Figma, in px
 * @param referencePx - Width of the containing block the value resolves against
 * @param options - Conversion options (rem/px formatting, responsive switch)
 * @param minRatio - Fraction of `designPx` the value may shrink to
 */
export function fluidLength(
  designPx: number,
  referencePx: number,
  options: ConversionOptions,
  minRatio: number = FLUID_MIN_RATIO
): string | null {
  if (!responsiveEnabled(options)) return null;
  if (!Number.isFinite(designPx) || !Number.isFinite(referencePx)) return null;
  if (designPx <= 0 || referencePx <= 0) return null;

  const floor = fluidFloor(designPx, minRatio);
  if (!isWorthFluid(designPx, floor)) return null;

  const percent = fluidPercent(designPx, referencePx);
  if (percent <= 0) return null;

  const unit = unitFor(options);
  return `clamp(${unit(floor)}, ${percent}%, ${unit(designPx)})`;
}

/**
 * A fluid length that scales once it is large enough to matter, and stays a
 * plain px/rem value otherwise.
 *
 * Large page-level paddings, section gaps and headings are the values that
 * genuinely need to breathe on a phone; a card's 12px padding does not. The
 * threshold expresses that split explicitly instead of hard-coding a smaller
 * mobile value for every property.
 *
 * @param designPx - The value as measured in Figma, in px
 * @param referencePx - Width of the containing block the value resolves against
 * @param options - Conversion options
 * @param thresholdPx - Design values below this stay fixed
 * @param minRatio - Fraction of `designPx` a fluid value may shrink to
 */
export function fluidOrFixed(
  designPx: number,
  referencePx: number,
  options: ConversionOptions,
  thresholdPx: number,
  minRatio: number = FLUID_MIN_RATIO
): string {
  if (designPx >= thresholdPx) {
    const fluid = fluidLength(designPx, referencePx, options, minRatio);
    if (fluid) return fluid;
  }
  return formatUnit(designPx, options.useRem, options.baseFontSize);
}

/**
 * A fluid font size: `clamp(min, Xcqi, max)`.
 *
 * `cqi` is one percent of the nearest *query container's* inline size, which is
 * the only CSS length that can express "this type scales with the box it sits
 * in" — a percentage would resolve against the parent's font size, and `vw`
 * against the window.
 *
 * The container is the page root (emitted as `container-type: inline-size` in
 * responsive mode) or, inside a stacked regions row, that row. The caller is
 * responsible for passing the width of the container that will actually resolve
 * the unit — see `extractLayout`'s `containerWidthPx`. Passing the wrong width
 * would scale the type by the ratio of two different boxes, which is exactly
 * the bug this function exists to avoid.
 *
 * @param designPx - The font size as measured in Figma, in px
 * @param containerPx - Width of the query container that will resolve `cqi`
 * @param options - Conversion options
 * @param minRatio - Fraction of `designPx` the type may shrink to
 */
export function fluidTypeSize(
  designPx: number,
  containerPx: number,
  options: ConversionOptions,
  minRatio: number = FLUID_MIN_RATIO
): string | null {
  if (!responsiveEnabled(options)) return null;
  if (!Number.isFinite(designPx) || !Number.isFinite(containerPx)) return null;
  if (designPx <= 0 || containerPx <= 0) return null;

  const floor = fluidFloor(designPx, minRatio);
  if (!isWorthFluid(designPx, floor)) return null;

  const percent = fluidPercent(designPx, containerPx);
  if (percent <= 0) return null;

  const unit = unitFor(options);
  return `clamp(${unit(floor)}, ${percent}cqi, ${unit(designPx)})`;
}

/**
 * A font size that scales once it is large enough to matter, and stays a plain
 * px/rem value otherwise.
 *
 * Body copy keeps its designed size: it is already readable on a phone and
 * shrinking it would only hurt legibility. Display type is the case that needs
 * to breathe, and the threshold expresses that split explicitly.
 */
export function fluidTypeOrFixed(
  designPx: number,
  containerPx: number,
  options: ConversionOptions,
  thresholdPx: number,
  minRatio: number = FLUID_MIN_RATIO
): string {
  if (designPx >= thresholdPx) {
    const fluid = fluidTypeSize(designPx, containerPx, options, minRatio);
    if (fluid) return fluid;
  }
  return formatUnit(designPx, options.useRem, options.baseFontSize);
}

/**
 * The smallest inline size a column of `widthPx` may be squeezed to before its
 * row is allowed to break.
 *
 * This is the number that decides *when* a wrapping row wraps, so it is derived
 * once, here, and used both for the emitted `min-width` and for the wrap
 * threshold the container query is built from. Two copies of this rule would
 * drift, and the query would then fire at a width where the row does not
 * actually break.
 *
 * The floor is a fraction of the drawn width, capped at the absolute minimum
 * comfortable column. Using the drawn width itself as the floor — which is what
 * `Math.min(width, MIN_COLUMN_WIDTH_PX)` amounts to for any column narrower
 * than the cap — makes the column *rigid*: `flex-basis: 0%` with a floor equal
 * to the drawn width cannot compress, so a row of four 261px columns breaks the
 * instant the container is a pixel narrower than the row, leaving three
 * stretched columns and one orphan on its own line.
 *
 * @param widthPx - The column's width as drawn in Figma
 * @param minRatio - Fraction of `widthPx` the column may shrink to
 */
export function columnFloorPx(widthPx: number, minRatio: number = FLUID_MIN_RATIO): number {
  if (!Number.isFinite(widthPx) || widthPx <= 0) return 0;
  return Math.round(Math.min(widthPx * minRatio, MIN_COLUMN_WIDTH_PX));
}

/**
 * The `min-width` floor that lets a wrapping row reflow intrinsically.
 *
 * `min()` keeps the floor from ever exceeding the container, so a row can
 * always collapse to a single column on the narrowest screen instead of
 * overflowing. With responsiveness switched off there is no wrapping to allow,
 * so the plain length is returned — a stray call cannot smuggle a `min()` into
 * a fixed-size export.
 *
 * @param floorPx - The smallest comfortable inline size for this column
 */
export function wrapFloor(floorPx: number, options: ConversionOptions): string {
  const value = formatUnit(floorPx, options.useRem, options.baseFontSize);
  return responsiveEnabled(options) ? `min(${value}, 100%)` : value;
}
