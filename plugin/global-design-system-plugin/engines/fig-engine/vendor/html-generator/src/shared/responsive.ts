import type { ConversionOptions } from '../plugin/types/ir';

/**
 * The responsive switch.
 *
 * Everything adaptive in the output — fluid `clamp()` values, intrinsic reflow,
 * smart stacking — hangs off one option. These two helpers are the only places
 * that read it, so "turn responsiveness off" means exactly one thing and cannot
 * mean different things in different files.
 *
 * The rule is deliberately strict (`=== true`): an option object that predates
 * the flag, or arrives from the sandbox without it, is a *fixed-size* export
 * rather than a silently adaptive one. Being wrong in that direction is
 * visible immediately; being wrong the other way is not.
 */

/** Whether any responsive behaviour may be emitted at all. */
export function responsiveEnabled(options: ConversionOptions): boolean {
  return options.responsive === true;
}

/**
 * Whether rows may reflow intrinsically — `flex-wrap` plus `min-width` floors.
 *
 * Subordinate to the master switch: with responsiveness off, a row holds the
 * width it was drawn at whatever this option says.
 */
export function intrinsicReflowEnabled(options: ConversionOptions): boolean {
  return responsiveEnabled(options) && options.intrinsicReflow !== false;
}
