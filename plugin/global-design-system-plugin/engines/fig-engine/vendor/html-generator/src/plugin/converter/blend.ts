/**
 * Blend modes, and the group they blend inside.
 *
 * Figma and CSS agree on the *modes* — `MULTIPLY` is `multiply`, all fourteen
 * of them — and disagree on the *backdrop*. In Figma a blend mode is relative
 * to the group the layer sits in: a `multiply` layer inside a group multiplies
 * with what that group contains, and nothing else. In CSS `mix-blend-mode`
 * reaches whatever has been painted below it in the nearest stacking context,
 * which is usually the page.
 *
 * The gap is one property. `isolation: isolate` on the group makes it a
 * backdrop of its own, so the layer blends with the group and stops there.
 * Without it a card's overlay multiplies the page behind the card too, and the
 * picture is darker than the design at every point where the two differ.
 */
import type { IRNode } from '../types/ir';

/** Figma's blend modes as CSS keywords. `NORMAL` and `PASS_THROUGH` are the default. */
const CSS_BLEND_MODES: Record<string, string> = {
  MULTIPLY: 'multiply',
  SCREEN: 'screen',
  OVERLAY: 'overlay',
  DARKEN: 'darken',
  LIGHTEN: 'lighten',
  COLOR_DODGE: 'color-dodge',
  COLOR_BURN: 'color-burn',
  HARD_LIGHT: 'hard-light',
  SOFT_LIGHT: 'soft-light',
  DIFFERENCE: 'difference',
  EXCLUSION: 'exclusion',
  HUE: 'hue',
  SATURATION: 'saturation',
  COLOR: 'color',
  LUMINOSITY: 'luminosity',
};

/**
 * The CSS keyword for a Figma blend mode, or `null` for the two that mean
 * "no blending".
 *
 * `PASS_THROUGH` is not a blend mode in CSS at all: it says the layer is
 * transparent to the group's compositing, which is what an element without
 * `mix-blend-mode` already does.
 */
export function cssBlendMode(figmaBlend: string | undefined | null): string | null {
  if (!figmaBlend || figmaBlend === 'NORMAL' || figmaBlend === 'PASS_THROUGH') return null;
  return CSS_BLEND_MODES[figmaBlend] ?? null;
}

/**
 * Whether a group has to become its own blending context.
 *
 * Only a *direct* child matters. A deeper descendant is isolated by the group
 * that actually contains it, and that group decides for itself when it is
 * converted — so the rule stays local and every level of nesting gets the
 * backdrop Figma gave it.
 */
export function needsIsolation(children: readonly IRNode[]): boolean {
  return children.some((child) => child.visual.mixBlendMode !== undefined);
}
