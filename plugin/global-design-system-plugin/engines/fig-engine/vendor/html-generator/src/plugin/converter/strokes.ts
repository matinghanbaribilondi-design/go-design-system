/**
 * Figma strokes.
 *
 * A stroke list is a *stack*, exactly like a fill list: the first entry is the
 * bottom-most, the last is what the designer sees. The converter used to read
 * it with `find((s) => s.visible && s.type === 'SOLID')`, which takes the first
 * solid from the bottom and therefore:
 *
 *   1. skips a gradient stroke completely — a button with a gradient border
 *      arrived with no border at all, and nothing in the output said so;
 *   2. ignores a solid that sits *above* another solid, so the visible colour
 *      was whatever was painted underneath.
 *
 * This module decides *which* stroke paints and *what shape* the border has.
 * Turning that into declarations is `styles.ts`' job, because the colours have
 * to go through the token resolver.
 */

/** Per-side stroke weights, in px. Figma keeps these in sync with `strokeWeight`. */
export interface StrokeWeights {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * What a stroke list means for CSS.
 *
 * `ring` is not a border. A gradient cannot be a `border-color`, and
 * `border-image` — the obvious alternative — ignores `border-radius`, which
 * squares off every rounded card it is put on. So a gradient stroke is drawn as
 * a masked ring on a pseudo-element instead: same thickness, same radius, and
 * the gradient keeps the box it was drawn in.
 */
export type StrokePlan =
  | { kind: 'none' }
  | { kind: 'solid'; paint: SolidPaint; weights: StrokeWeights; perSide: boolean }
  | { kind: 'gradient'; paint: GradientPaint; weights: StrokeWeights; ring: boolean };

const GRADIENT_TYPES = new Set([
  'GRADIENT_LINEAR',
  'GRADIENT_RADIAL',
  'GRADIENT_ANGULAR',
  'GRADIENT_DIAMOND',
]);

/**
 * The stroke that actually paints: the top-most visible one.
 *
 * Walking from the end matters. Figma stacks strokes in array order, so the
 * last visible entry is the one on top, and it is the only one a single CSS
 * border can honestly represent.
 */
export function activeStroke(strokes: readonly Paint[] | undefined): Paint | null {
  if (!strokes || strokes.length === 0) return null;
  for (let i = strokes.length - 1; i >= 0; i -= 1) {
    const paint = strokes[i];
    if (paint && paint.visible !== false) return paint;
  }
  return null;
}

/** True when the paint is a gradient — the four `GRADIENT_*` types. */
export function isGradientPaint(paint: Paint | null): paint is GradientPaint {
  return paint !== null && GRADIENT_TYPES.has(paint.type);
}

/**
 * The main component a node inherits stroke geometry from.
 *
 * On a `documentAccess: dynamic-page` document, reading `mainComponent`
 * synchronously throws — it only exists as `getMainComponentAsync()`. The
 * converter resolves it up front and caches it on the node, so the cached
 * reference is read first and the synchronous property is only ever touched
 * inside a try/catch.
 */
function readMain(src: Record<string, unknown>): Record<string, unknown> {
  const resolved = (src as { _resolvedMainComponent?: unknown })._resolvedMainComponent;
  if (resolved) return resolved as Record<string, unknown>;
  try {
    return ((src as { mainComponent?: unknown }).mainComponent ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Per-side weights, falling back to the uniform `strokeWeight`.
 *
 * `perSide` says which of the two readings is in play. It matters because the
 * two produce different CSS: four explicit `border-*-width` declarations when
 * the designer set the sides individually, and one `border` shorthand when the
 * stroke is uniform. A node with no weight property at all is not stroked, so
 * the fallback is zero rather than one — inventing a 1px border for a layer
 * that has none is exactly the kind of silent addition this pass removes.
 */
export function readStrokeShape(src: Record<string, unknown>): {
  weights: StrokeWeights;
  perSide: boolean;
} {
  // An instance inherits its stroke geometry from the component it was made
  // from: the property is simply absent on the instance node. Reading only the
  // instance would give every instance of a stroked component a 1px hairline.
  const main = readMain(src);
  const inherited = (key: string): unknown => src[key] ?? main[key];

  const num = (value: unknown): number => (typeof value === 'number' && value > 0 ? value : 0);
  // Figma's own default stroke weight is 1, so a node that carries a stroke but
  // does not expose a weight is stroked at 1px. An explicit 0 is honoured as
  // "no stroke" instead of being overwritten with a border nobody drew.
  const rawWeight = inherited('strokeWeight');
  const uniform = typeof rawWeight === 'number' ? num(rawWeight) : 1;
  const sides: StrokeWeights = {
    top: num(inherited('strokeTopWeight')),
    right: num(inherited('strokeRightWeight')),
    bottom: num(inherited('strokeBottomWeight')),
    left: num(inherited('strokeLeftWeight')),
  };
  const anySide = sides.top > 0 || sides.right > 0 || sides.bottom > 0 || sides.left > 0;

  if (anySide) return { weights: sides, perSide: true };
  return { weights: { top: uniform, right: uniform, bottom: uniform, left: uniform }, perSide: false };
}

/** Every side the same thickness — the only case a ring can represent. */
export function isUniform(weights: StrokeWeights): boolean {
  return (
    weights.top > 0 &&
    weights.top === weights.right &&
    weights.top === weights.bottom &&
    weights.top === weights.left
  );
}

/** Where the stroke sits against the shape's edge, inherited from the master. */
function strokeAlignOf(src: Record<string, unknown>): string {
  const value = src['strokeAlign'] ?? readMain(src)['strokeAlign'];
  return typeof value === 'string' ? value : 'INSIDE';
}

/** Whether the frame's own auto-layout measures its children inside the stroke. */
function strokesIncludedInLayout(src: Record<string, unknown>): boolean {
  const value = src['strokesIncludedInLayout'] ?? readMain(src)['strokesIncludedInLayout'];
  return value === true;
}

/**
 * The border this node will actually paint, per side in px, or null when it
 * paints none.
 *
 * Figma measures auto-layout padding from the frame's own edge and strokes take
 * no part in that arithmetic. CSS `box-sizing: border-box` carves the border out
 * of that same box, so a bordered frame hands its children a content area
 * `2 × border` narrower than the design's and every inner edge lands a pixel off
 * — enough to push a field's value past the padding it was laid out inside. The
 * padding pass subtracts these weights to give the space back.
 *
 * Only what CSS paints as a `border` may be subtracted. Two cases do not:
 * an outside stroke, which `getNodeBoxDimensions` already compensates by growing
 * the emitted box, and a uniform gradient stroke, which becomes a masked ring on
 * a pseudo-element and therefore consumes no layout. A gradient the ring cannot
 * express falls back to per-side borders, so those sides do consume it.
 *
 * A frame that declares `strokesIncludedInLayout` is already measuring its
 * children inside its own stroke, which is what the CSS border box does — so it
 * needs no correction. This mirrors the same flag's use for absolute children.
 */
export function layoutBorderWeights(node: SceneNode): StrokeWeights | null {
  const src = node as unknown as Record<string, unknown>;
  if (strokesIncludedInLayout(src)) return null;

  const own = 'strokes' in node ? (node as { strokes?: unknown }).strokes : undefined;
  const strokes = Array.isArray(own) && own.length > 0 ? own : (readMain(src)['strokes'] as never);
  const paint = activeStroke(strokes);
  if (!paint) return null;

  const weights = readStrokeShape(src).weights;
  if (!weights.top && !weights.right && !weights.bottom && !weights.left) return null;

  if (isGradientPaint(paint)) {
    // Uniform → ring on a pseudo-element, no layout cost. Anything else is
    // emitted as real borders on the weighted sides.
    return isUniform(weights) ? null : weights;
  }
  if (strokeAlignOf(src) === 'OUTSIDE') return null;
  return weights;
}

/**
 * The plan for one node's stroke list.
 *
 * `isLine` exists because a divider is a 1px-tall box: a ring around it would
 * be invisible, while a `border-top` on it is exactly what the design shows.
 * Lines therefore keep the per-side path even when their stroke is a gradient.
 */
export function planStroke(
  strokes: readonly Paint[] | undefined,
  src: Record<string, unknown>,
  isLine: boolean = false
): StrokePlan {
  const paint = activeStroke(strokes);
  if (!paint) return { kind: 'none' };

  const { weights, perSide } = readStrokeShape(src);
  const anySide = weights.top > 0 || weights.right > 0 || weights.bottom > 0 || weights.left > 0;
  if (!anySide) return { kind: 'none' };

  if (isGradientPaint(paint)) {
    // A ring is only honest when the stroke is the same on all four sides: it
    // paints the whole perimeter, so a top-only stroke would gain three sides
    // the design does not have.
    const ring = !isLine && isUniform(weights);
    return { kind: 'gradient', paint, weights, ring };
  }

  if (paint.type === 'SOLID') {
    return { kind: 'solid', paint, weights, perSide };
  }

  // IMAGE and VIDEO strokes have no border equivalent at all. Saying so beats
  // painting a solid border in a colour nobody chose.
  return { kind: 'none' };
}
