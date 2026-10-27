import { ORTHOGONAL_ROTATION_EPSILON_DEGREES } from '../../shared/constants';

/**
 * Rotated 1-D dividers.
 *
 * Figma stores a LINE (and any 1-D shape used as a divider) along its own
 * local axis and rotates the node to place it on the other one. A vertical
 * rule in a 423px-tall panel is therefore a 423px-wide node rotated 90°.
 *
 * Figma's auto-layout uses the *visual* bounding box of a rotated layer, but a
 * CSS `transform: rotate()` does not change the element's layout box at all.
 * Emitting the unrotated 423px width made the divider claim 423px of a 900px
 * flex row, pushing the entire left column out of the frame.
 *
 * The fix is to read the divider in its visual orientation before any size is
 * decided: its width/height are swapped for a quarter turn, and its border
 * follows the axis it appears on. That only makes sense for nodes that take
 * part in layout; an absolutely positioned divider keeps its transform and its
 * unrotated box, because there is no flow to disturb there.
 */

export type DividerAxis = 'horizontal' | 'vertical';

export interface DividerGeometry {
  /** The axis the divider appears on after rotation. */
  axis: DividerAxis;
  /** 0, 1, 2 or 3 quarter turns; `null` when the rotation is diagonal. */
  quarterTurn: 0 | 1 | 2 | 3;
  /** Visual bounding-box size, i.e. the layout footprint in Figma. */
  width: number;
  height: number;
  /** Length along the divider, in the node's own (unrotated) pixels. */
  lengthPx: number;
  /** Thickness across the divider, in the node's own pixels. */
  thicknessPx: number;
}

const DIVIDER_NAME_PATTERN = /^(line|divider|separator|rule|border|stroke|خط|جداکننده)/i;

function rawSize(node: SceneNode): { width: number; height: number } {
  return {
    width: 'width' in node && typeof node.width === 'number' ? node.width : 0,
    height: 'height' in node && typeof node.height === 'number' ? node.height : 0,
  };
}

function rotationOf(node: SceneNode): number {
  return 'rotation' in node && typeof node.rotation === 'number' ? node.rotation : 0;
}

/**
 * The rotation expressed in quarter turns, or `null` when it is not a
 * multiple of 90° (a diagonal line has no horizontal or vertical form).
 */
export function orthogonalQuarterTurn(node: SceneNode): 0 | 1 | 2 | 3 | null {
  const normalized = ((rotationOf(node) % 360) + 360) % 360;
  const snapped = Math.round(normalized / 90) * 90;
  const delta = Math.abs(normalized - snapped);
  const distance = Math.min(delta, 360 - delta);
  if (distance > ORTHOGONAL_ROTATION_EPSILON_DEGREES) return null;
  return (((snapped / 90) % 4) as 0 | 1 | 2 | 3);
}

function localAxis(node: SceneNode, width: number, height: number): DividerAxis | null {
  if (node.type === 'LINE') {
    if (width > 0 && height <= 0) return 'horizontal';
    if (height > 0 && width <= 0) return 'vertical';
    return width >= height ? 'horizontal' : 'vertical';
  }

  const named = DIVIDER_NAME_PATTERN.test(node.name.trim());
  const horizontal =
    (height <= 1 && width >= 10) ||
    (named && height <= 2 && width >= height) ||
    (height === 0 && width > 0);
  const vertical =
    (width <= 1 && height >= 10) ||
    (named && width <= 2 && height >= width) ||
    (width === 0 && height > 0);

  if (horizontal && !vertical) return 'horizontal';
  if (vertical && !horizontal) return 'vertical';
  return null;
}

/**
 * Reads a node as a divider in its visual orientation.
 *
 * Returns `null` for nodes that are not 1-D shapes (a card, an icon), for
 * shapes whose proportions do not read as a divider, and for diagonal lines —
 * those are exported as vectors and keep their CSS rotation.
 */
export function readDividerGeometry(node: SceneNode): DividerGeometry | null {
  if (node.type !== 'LINE' && node.type !== 'VECTOR' && node.type !== 'RECTANGLE') return null;

  const quarterTurn = orthogonalQuarterTurn(node);
  if (quarterTurn === null) return null;

  const { width, height } = rawSize(node);
  const local = localAxis(node, width, height);
  if (!local) return null;

  const crossesAxes = quarterTurn % 2 === 1;
  const axis: DividerAxis = crossesAxes
    ? local === 'horizontal'
      ? 'vertical'
      : 'horizontal'
    : local;

  return {
    axis,
    quarterTurn,
    width: crossesAxes ? height : width,
    height: crossesAxes ? width : height,
    lengthPx: local === 'horizontal' ? width : height,
    thicknessPx: local === 'horizontal' ? height : width,
  };
}

/**
 * Whether the node takes part in its parent's layout flow.
 *
 * Only flow children are sized by their box. A divider that is absolutely
 * positioned is placed by coordinates, so its unrotated box plus its CSS
 * rotation reproduces the drawing exactly; swapping its axes there would move
 * it away from the spot Figma put it in.
 */
export function isInLayoutFlow(node: SceneNode, parent: BaseNode | null): boolean {
  if (!parent) return true;
  if (!('layoutMode' in parent) || parent.layoutMode === 'NONE') return false;
  if ('layoutPositioning' in node && node.layoutPositioning === 'ABSOLUTE') return false;
  return true;
}
