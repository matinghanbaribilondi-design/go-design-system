/**
 * Figma masks.
 *
 * A mask is not a clip on the mask node — it is a clip on its *siblings*. In
 * Figma the layer marked "Use as mask" is not painted at all: its shape (and,
 * for ALPHA/LUMINANCE masks, its alpha) decides what the layers drawn after it
 * are allowed to show.
 *
 * The converter used to emit `clip-path: inset(0 round 0px)` on the mask node
 * itself, which is a no-op on a box that already ends at its own bounds, and
 * then left the mask node in the DOM. So a photo under a rounded-rect mask
 * arrived as a solid rounded rectangle painted on top of the photo, and
 * nothing in the output said the content had been masked.
 *
 * Two decisions keep the fix safe:
 *
 * 1. No DOM restructuring. A mask group is *not* wrapped in a new element:
 *    every masked sibling carries the mask shape as its own `clip-path`,
 *    expressed in its own box. Clipping each layer by the same region and
 *    clipping the group they form give the same picture, while the sibling
 *    keeps the position, flex/grid participation and paint order it already
 *    had. A wrapper would have had to re-derive every child's coordinates,
 *    and would have broken the sibling out of its parent's flow.
 *
 * 2. Only shapes that can be expressed exactly are expressed exactly. A
 *    rectangle keeps its corner radii and an ellipse keeps its radii and
 *    centre; anything else (a vector path, a text mask, an image mask) falls
 *    back to the mask's bounding box — still a clip where there was none.
 *
 * Known approximation: one element carries one `clip-path`, so when two masks
 * apply to the same sibling the nearest (upper) one wins instead of the two
 * being intersected. Nested masks in separate parents intersect naturally,
 * because each level clips its own children.
 */

/** A mask's effect on one sibling, expressed in that sibling's own box. */
export interface MaskClip {
  /** `clip-path` value, or absent when the mask already contains the sibling. */
  clipPath?: string;
  /** Opacity multiplier, 1 when the mask is fully opaque. */
  alpha: number;
}

/**
 * The slice of the Figma node shape this module reads. Structural on purpose:
 * the geometry can then be exercised without a document.
 */
interface MaskSource {
  id: string;
  type: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  isMask?: boolean;
  maskType?: string;
  opacity?: number;
  cornerRadius?: number | symbol;
  topLeftRadius?: number;
  topRightRadius?: number;
  bottomRightRadius?: number;
  bottomLeftRadius?: number;
  fills?: readonly Paint[] | symbol;
  absoluteTransform?: Transform;
  absoluteBoundingBox?: { x: number; y: number } | null;
}

/** True when the layer is used as a mask, i.e. defines a shape but is not painted. */
export function isMaskNode(node: SceneNode): boolean {
  return (node as unknown as MaskSource).isMask === true;
}

/**
 * The clip each masked sibling of one parent needs, keyed by node id.
 *
 * A mask applies to the siblings drawn after it, so the scan is ordered: the
 * active mask is whatever mask node was seen last, and it stops applying once
 * a new mask replaces it.
 */
export function maskClipsFor(
  siblings: readonly SceneNode[],
  format: (px: number) => string
): Map<string, MaskClip> {
  const clips = new Map<string, MaskClip>();
  let mask: MaskSource | null = null;

  for (const sibling of siblings) {
    const node = sibling as unknown as MaskSource;

    if (node.isMask === true) {
      // Not painted, and it defines the shape for everything above it.
      mask = node;
      continue;
    }

    if (!mask) continue;

    const clip = clipFor(mask, node, format);
    if (clip.clipPath !== undefined || clip.alpha < 1) {
      clips.set(node.id, clip);
    }
  }

  return clips;
}

function clipFor(
  mask: MaskSource,
  sibling: MaskSource,
  format: (px: number) => string
): MaskClip {
  const alpha = maskAlpha(mask);
  const maskW = num(mask.width);
  const maskH = num(mask.height);
  const boxW = num(sibling.width);
  const boxH = num(sibling.height);

  // A degenerate mask or sibling has no area to reason about.
  if (maskW <= 0 || maskH <= 0 || boxW <= 0 || boxH <= 0) return { alpha };

  const { dx, dy } = offsetBetween(mask, sibling);

  if (mask.type === 'ELLIPSE') {
    const rx = len(format, maskW / 2);
    const ry = len(format, maskH / 2);
    const cx = len(format, dx + maskW / 2);
    const cy = len(format, dy + maskH / 2);
    return { clipPath: `ellipse(${rx} ${ry} at ${cx} ${cy})`, alpha };
  }

  // How far the mask sits inside the sibling's box, per side. A negative value
  // means the mask reaches past that edge.
  const raw = {
    top: dy,
    right: boxW - (dx + maskW),
    bottom: boxH - (dy + maskH),
    left: dx,
  };

  // Floored at zero: a mask that reaches past the sibling cannot show more
  // than the sibling already paints inside its own box.
  const inset = {
    top: Math.max(0, raw.top),
    right: Math.max(0, raw.right),
    bottom: Math.max(0, raw.bottom),
    left: Math.max(0, raw.left),
  };

  // A corner radius describes the mask's own corner. Once that corner has been
  // pushed outside the sibling, the clip corner sitting on the box edge is no
  // longer the mask's corner, and keeping the radius there would invent a
  // rounded corner the design does not have.
  const radii = cornerRadii(mask, format, {
    top: raw.top < 0,
    right: raw.right < 0,
    bottom: raw.bottom < 0,
    left: raw.left < 0,
  });

  const containsSibling =
    inset.top === 0 && inset.right === 0 && inset.bottom === 0 && inset.left === 0;

  // An unrounded mask that already contains the sibling changes nothing, and
  // emitting `inset(0)` for it would only add noise (and a stacking context).
  if (containsSibling && !radii) return { alpha };

  const sides = [inset.top, inset.right, inset.bottom, inset.left]
    .map((value) => len(format, value))
    .join(' ');

  return { clipPath: `inset(${sides}${radii ? ` round ${radii}` : ''})`, alpha };
}

function cornerRadii(
  mask: MaskSource,
  format: (px: number) => string,
  clipped: { top: boolean; right: boolean; bottom: boolean; left: boolean }
): string | null {
  // `cornerRadius` is `figma.mixed` when the corners differ, so it is only a
  // fallback for the corners the node does not list separately.
  const uniform = typeof mask.cornerRadius === 'number' ? mask.cornerRadius : 0;
  const corner = (value: number | undefined) => (typeof value === 'number' ? value : uniform);

  let tl = corner(mask.topLeftRadius);
  let tr = corner(mask.topRightRadius);
  let br = corner(mask.bottomRightRadius);
  let bl = corner(mask.bottomLeftRadius);

  if (clipped.top || clipped.left) tl = 0;
  if (clipped.top || clipped.right) tr = 0;
  if (clipped.bottom || clipped.right) br = 0;
  if (clipped.bottom || clipped.left) bl = 0;

  if (tl <= 0 && tr <= 0 && br <= 0 && bl <= 0) return null;
  if (tl === tr && tr === br && br === bl) return len(format, tl);
  return [tl, tr, br, bl].map((value) => len(format, value)).join(' ');
}

/**
 * How opaque the mask leaves the content it covers.
 *
 * A VECTOR mask uses only the path, so its paint is irrelevant. An ALPHA mask
 * reads the paint's alpha, and a LUMINANCE mask reads how bright it is — a
 * black shape hides what it covers, which is what Figma draws. Gradients and
 * image masks carry an alpha that varies across the shape, which a single
 * opacity cannot express; those keep the mask's own opacity and are documented
 * as an approximation.
 */
function maskAlpha(mask: MaskSource): number {
  const type = mask.maskType ?? 'ALPHA';
  if (type === 'VECTOR') return 1;

  const nodeOpacity = clamp01(typeof mask.opacity === 'number' ? mask.opacity : 1);
  const fills = Array.isArray(mask.fills) ? mask.fills : [];
  const fill = fills.find((paint) => paint && paint.visible !== false);
  if (!fill || fill.type !== 'SOLID') return nodeOpacity;

  const color = fill.color;
  const paintAlpha = clamp01((color.a ?? 1) * (typeof fill.opacity === 'number' ? fill.opacity : 1));
  const luminance =
    type === 'LUMINANCE' ? 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b : 1;

  return clamp01(paintAlpha * luminance * nodeOpacity);
}

/**
 * Offset of the mask's origin from the sibling's, in the sibling's box.
 *
 * Both origins have to be read in the same frame of reference, so absolute
 * coordinates are used only when both nodes expose them. They are preferred
 * because `x`/`y` are relative to the parent, and what "parent" means for a
 * child of a group is not the same as for a child of a frame.
 */
function offsetBetween(mask: MaskSource, sibling: MaskSource): { dx: number; dy: number } {
  const maskOrigin = absoluteOrigin(mask);
  const siblingOrigin = absoluteOrigin(sibling);
  if (maskOrigin && siblingOrigin) {
    return { dx: maskOrigin.x - siblingOrigin.x, dy: maskOrigin.y - siblingOrigin.y };
  }
  return { dx: num(mask.x) - num(sibling.x), dy: num(mask.y) - num(sibling.y) };
}

function absoluteOrigin(node: MaskSource): { x: number; y: number } | null {
  const transform = node.absoluteTransform;
  if (Array.isArray(transform) && Array.isArray(transform[0]) && Array.isArray(transform[1])) {
    const x = transform[0][2];
    const y = transform[1][2];
    if (typeof x === 'number' && typeof y === 'number') return { x, y };
  }
  const box = node.absoluteBoundingBox;
  if (box && typeof box.x === 'number' && typeof box.y === 'number') {
    return { x: box.x, y: box.y };
  }
  return null;
}

function len(format: (px: number) => string, px: number): string {
  const rounded = Math.round(px * 100) / 100;
  return rounded === 0 ? '0' : format(rounded);
}

function num(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}
