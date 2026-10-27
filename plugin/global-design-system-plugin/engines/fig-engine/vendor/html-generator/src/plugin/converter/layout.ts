import { LayoutStyles, ConversionOptions } from '../types/ir';
import { formatUnit, getMainComponent, getNodeBoxDimensions, getChildrenMaxOutsideStroke, isRtlText } from './utils';
import { layoutBorderWeights } from './strokes';
import { isInLayoutFlow, readDividerGeometry } from './dividers';
import { TokenResolver, TokenRegistry } from '../../shared/token-resolver';
import { columnFloorPx, fluidFloor, fluidLength, fluidOrFixed } from '../../shared/fluid';
import { applyMainAxis, mainAxisBox } from '../../shared/sizing';
import { intrinsicReflowEnabled, responsiveEnabled } from '../../shared/responsive';
import {
  COUNTER_FILL_MIN_RATIO,
  COUNTER_FILL_SLACK_PX,
  DOMINANT_CHILD_MIN_RATIO,
  EDGE_ANCHOR_MIN_RATIO,
  EDGE_ANCHOR_TOLERANCE_PX,
  FLUID_GAP_MIN_PX,
  FLUID_MIN_RATIO,
  FLUID_PADDING_MIN_PX,
  FREEFORM_FLOW_ALIGN_TOLERANCE_PX,
  FREEFORM_FLOW_OVERLAP_TOLERANCE_PX,
  FREEFORM_SPAN_MIN_RATIO,
  HEADER_MAX_HEIGHT_PX,
  INTRINSIC_CONTROL_MAX_PX,
  MIN_COLUMN_WIDTH_PX,
  MULTI_COLUMN_MIN_CHILDREN_PX,
  MULTI_COLUMN_MIN_WIDTH_PX,
  PHONE_FIT_WIDTH_PX,
  QUADRANT_ANCHOR_MAX_PX,
  QUADRANT_ANCHOR_MAX_RATIO,
  REGION_WIDTH_RATIO_MAX,
  ROW_FILL_MIN_RATIO,
  ROW_FILL_SLACK_PX,
  SUBSTANTIAL_CHILD_MIN_PX,
  TOOLBAR_SLOT_MIN_PX,
  TOOLBAR_WIDE_CHILD_MIN_PX,
} from '../../shared/constants';

/**
 * Whether a node is a self-sized control that must keep its intrinsic size
 * rather than stretch or shrink with its siblings (icon, avatar, dot, chip,
 * small button). Detected from size plus name, so it works on unnamed layers.
 */
function isIntrinsicControl(node: SceneNode, width: number, height: number): boolean {
  if (width > 0 && height > 0 && width <= INTRINSIC_CONTROL_MAX_PX && height <= INTRINSIC_CONTROL_MAX_PX) {
    return true;
  }
  return /(^|[-_\s])(icon|ic|avatar|آواتار|logo|لوگو|dot|badge|chip|tag|pill|btn|button|دکمه|checkbox|radio|switch|toggle|arrow|chevron)([-_\s]|$)/i.test(
    (node.name || '').trim()
  );
}

/**
 * Whether a child of a row should be sized proportionally (as a flex item)
 * rather than pinned to its Figma width. Text is excluded: a text block's
 * width is a wrapping constraint, not a share of the row.
 */
function isProportionalRowChild(node: SceneNode, width: number, height: number): boolean {
  if (node.type === 'TEXT') return false;
  return !isIntrinsicControl(node, width, height);
}

/**
 * Intelligently detects whether a node in a freeform container is horizontally centered.
 * Strict: Only centers if the designer explicitly requested CENTER constraint/alignment,
 * or if it is mathematically centered (subpixel tolerance <= 1.5px).
 * Never overrides designer's explicit RIGHT or LEFT text alignment!
 */
export function isHorizontallyCenteredInParent(
  node: SceneNode,
  parent: SceneNode | null,
  relX: number,
  parentW: number
): boolean {
  if (!parent || parentW <= 0) return false;
  const nodeW = 'width' in node && typeof node.width === 'number' ? node.width : 0;
  if (nodeW <= 0) return false;

  // 1. Respect explicit text alignment and RTL:
  // Explicit RIGHT alignment (or RTL text that is not explicitly CENTER aligned) must NEVER be centered!
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    if (textNode.textAlignHorizontal === 'RIGHT') {
      return false;
    }
    const isRtl = isRtlText(textNode.characters);
    if (isRtl && textNode.textAlignHorizontal !== 'CENTER') {
      return false;
    }
  }

  // 2. Exact Mathematical Center Snapping:
  // An element is ONLY centered if its center mathematically aligns with the parent center (<= 1.5px).
  // In Figma, constraint 'CENTER' defines responsive resize behavior, NOT an automatic jump to 50%!
  // Off-center elements must NEVER be forced to center.
  const centerDiff = Math.abs(relX + nodeW / 2 - parentW / 2);
  if (centerDiff > 1.5) {
    return false;
  }

  // 4. Structural Sibling Analysis:
  // In a multi-column row (table, header menu, toolbar), an element near the center has horizontal
  // siblings flanking it in the same vertical row band. A standalone centered element does not.
  if ('children' in parent && Array.isArray(parent.children) && parent.children.length > 1) {
    const nodeY = typeof node.y === 'number' ? node.y : 0;
    const nodeH = typeof node.height === 'number' ? node.height : 0;

    const hasHorizontalNeighbors = parent.children.some((sibling) => {
      if (sibling === node || !sibling.visible) return false;
      const sibY = typeof sibling.y === 'number' ? sibling.y : 0;
      const sibH = typeof sibling.height === 'number' ? sibling.height : 0;
      // Overlaps vertically in the same row band
      const verticalOverlap = Math.max(0, Math.min(nodeY + nodeH, sibY + sibH) - Math.max(nodeY, sibY));
      if (verticalOverlap > Math.min(nodeH, sibH) * 0.4) {
        const sibX = typeof sibling.x === 'number' ? sibling.x : 0;
        const sibW = typeof sibling.width === 'number' ? sibling.width : 0;
        // Distinct horizontal sibling to left or right
        if (sibX + sibW <= relX + 2 || sibX >= relX + nodeW - 2) {
          return true;
        }
      }
      return false;
    });

    if (hasHorizontalNeighbors) {
      return false;
    }
  }

  // 5. Symmetric Margins Check:
  const leftMargin = relX;
  const rightMargin = parentW - (relX + nodeW);
  return Math.abs(leftMargin - rightMargin) <= 3;
}

/**
 * Intelligently detects whether a node in a freeform container is vertically centered.
 * Only centers if explicitly constrained or aligned to CENTER.
 */
export function isVerticallyCenteredInParent(
  node: SceneNode,
  parent: SceneNode | null,
  relY: number,
  parentH: number
): boolean {
  if (!parent || parentH <= 0) return false;
  const nodeH = 'height' in node && typeof node.height === 'number' ? node.height : 0;
  if (nodeH <= 0) return false;

  // 1. Exact Mathematical Center:
  // Must be strictly centered vertically within subpixel tolerance <= 1.5px
  const centerDiff = Math.abs(relY + nodeH / 2 - parentH / 2);
  if (centerDiff > 1.5) {
    return false;
  }

  // 2. Explicit Text Vertical Alignment:
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    return textNode.textAlignVertical === 'CENTER';
  }

  // 3. Standalone check: do not apply translateY(-50%) if there are other siblings
  if ('children' in parent && Array.isArray(parent.children) && parent.children.filter((c) => c.visible !== false).length > 1) {
    return false;
  }

  const topMargin = relY;
  const bottomMargin = parentH - (relY + nodeH);
  return Math.abs(topMargin - bottomMargin) <= 3;
}

/* ------------------------------------------------------------------ *
 * Absolute placement
 *
 * A layer that is out of flow is placed by hand, so its position has to be
 * re-read from the drawing rather than trusted to Figma's constraint flag —
 * which is usually left at its default. The anchor used is whichever one the
 * geometry actually supports; anything ambiguous keeps its offset from the
 * top-left corner, exactly as before.
 * ------------------------------------------------------------------ */

/** Where an absolutely-positioned layer is anchored along one axis. */
type AbsoluteAnchor = 'start' | 'end' | 'center' | 'stretch';

/**
 * How far from an edge a layer may sit and still count as anchored to it.
 * A page margin reads as an edge; a layer in the middle does not.
 */
function edgeAnchorTolerancePx(parentSize: number): number {
  return Math.max(EDGE_ANCHOR_TOLERANCE_PX, parentSize * EDGE_ANCHOR_MIN_RATIO);
}

/**
 * Whether a freeform child was drawn to span its parent on one axis: it covers
 * almost the whole axis and its margins on either side match, so it is a band
 * rather than a box. Such a child is pinned to both edges and is left with no
 * size of its own.
 */
function spansFreeformAxis(startGap: number, size: number, parentSize: number): boolean {
  if (parentSize <= 0 || size <= 0) return false;
  if (size < parentSize * FREEFORM_SPAN_MIN_RATIO) return false;
  return Math.abs(startGap - (parentSize - startGap - size)) <= 2;
}

/**
 * Whether a freeform child reads as centred on the vertical axis.
 *
 * The mirror of `isHorizontallyCenteredInParent`, and strict for the same
 * reason: the centre has to land on the parent's centre, the margins above and
 * below have to match, and no sibling may sit above or below it in the same
 * horizontal band. Without that last test the middle element of any symmetric
 * stack would read as "centred" and drift to the middle of the frame the moment
 * the frame grew.
 *
 * A band pinned to an edge is exempt from that test — a header, a divider, a
 * footer — because it says nothing about whether this node is centred, whereas
 * a card's title above its button very much does. The exemption is deliberately
 * narrow: the sibling has to span the frame *and* touch one of its edges. A
 * full-width card in the middle of a column does neither, so a three-card stack
 * still keeps its middle card where it was drawn instead of having it drift to
 * the middle of the frame.
 */
function isVerticallyCenteredFreeform(
  node: SceneNode,
  parent: SceneNode | null,
  relY: number,
  parentH: number
): boolean {
  if (!parent || parentH <= 0) return false;
  const nodeH = 'height' in node && typeof node.height === 'number' ? node.height : 0;
  if (nodeH <= 0) return false;
  if (Math.abs(relY + nodeH / 2 - parentH / 2) > 1.5) return false;

  const parentW = 'width' in parent && typeof parent.width === 'number' ? parent.width : 0;

  if ('children' in parent && Array.isArray(parent.children) && parent.children.length > 1) {
    const nodeX = typeof node.x === 'number' ? node.x : 0;
    const nodeW = 'width' in node && typeof node.width === 'number' ? node.width : 0;

    const inStack = parent.children.some((sibling) => {
      if (sibling === node || !sibling.visible) return false;
      const sibX = typeof sibling.x === 'number' ? sibling.x : 0;
      const sibW = 'width' in sibling && typeof sibling.width === 'number' ? sibling.width : 0;
      const sibY = typeof sibling.y === 'number' ? sibling.y : 0;
      const sibH = 'height' in sibling && typeof sibling.height === 'number' ? sibling.height : 0;

      // A band pinned to an edge of the frame is ignored: it is a header or a
      // footer, not a member of this node's stack.
      if (parentW > 0 && sibW >= parentW * FREEFORM_SPAN_MIN_RATIO) {
        const tolerance = edgeAnchorTolerancePx(parentH);
        if (sibY <= tolerance || Math.abs(parentH - (sibY + sibH)) <= tolerance) return false;
      }

      const horizontalOverlap = Math.max(0, Math.min(nodeX + nodeW, sibX + sibW) - Math.max(nodeX, sibX));
      if (horizontalOverlap <= Math.min(nodeW, sibW) * 0.4) return false;
      return sibY + sibH <= relY + 2 || sibY >= relY + nodeH - 2;
    });

    if (inStack) return false;
  }

  const topMargin = relY;
  const bottomMargin = parentH - (relY + nodeH);
  return Math.abs(topMargin - bottomMargin) <= 3;
}

/**
 * The anchor a layer should be pinned to, read from where it sits.
 *
 * An explicit constraint is the designer's own answer and always wins — except
 * `MIN`, which is Figma's default and therefore indistinguishable from "never
 * touched", so the geometry decides in that case. `SCALE` is left alone: it
 * already sizes the layer proportionally, and pinning it as well would fight
 * that.
 */
function absoluteAnchor(
  constraint: string | undefined,
  startGap: number,
  size: number,
  parentSize: number,
  centered: boolean
): AbsoluteAnchor {
  if (constraint === 'STRETCH') return 'stretch';
  if (constraint === 'MAX') return 'end';
  if (constraint === 'CENTER') return centered ? 'center' : 'start';
  if (constraint === 'SCALE') return 'start';
  if (parentSize <= 0 || size <= 0) return 'start';

  const endGap = parentSize - startGap - size;
  const tolerance = edgeAnchorTolerancePx(parentSize);
  if (Math.abs(startGap) <= tolerance && Math.abs(endGap) <= tolerance) return 'stretch';
  if (centered) return 'center';
  if (Math.abs(endGap) <= tolerance) return 'end';

  // Quadrant / near-edge anchor: a layer placed unambiguously near the trailing
  // edge (such as a close button at the top-right of a dialog or a floating
  // action button near the bottom-right of a screen) is anchored to that edge
  // rather than pinned to its desktop `left`/`top` offset, which would push it
  // outside the frame on a narrower viewport.
  const quadrantMax = Math.min(QUADRANT_ANCHOR_MAX_PX, parentSize * QUADRANT_ANCHOR_MAX_RATIO);
  if (endGap >= -tolerance && endGap <= quadrantMax && startGap > endGap * 2 && startGap + size / 2 > parentSize * 0.65) {
    return 'end';
  }
  return 'start';
}

/** Adds a centring translate to a transform without dropping what is there. */
function addTransform(existing: string | undefined, addition: 'translateX(-50%)' | 'translateY(-50%)'): string {
  if (!existing) return addition;
  if (existing.includes('translate(-50%') || existing.includes(addition)) return existing;
  const other = addition === 'translateX(-50%)' ? 'translateY(-50%)' : 'translateX(-50%)';
  if (existing === other) return 'translate(-50%, -50%)';
  return `${existing} ${addition}`;
}

/**
 * The inline cap an absolutely-positioned box needs so it cannot hang out of
 * its containing block, or `null` when its offsets already bound it.
 *
 * An out-of-flow box is sized by `width` and placed by `left`. `max-width:
 * 100%` — the cap everything else gets — is 100% of the *containing block*, so
 * `left: 300px; width: 600px` still reaches 900px inside a 400px parent: the
 * maximum is applied to the width, not to the space that is left. The cap has
 * to be the containing block minus the offsets, which is what this computes.
 *
 * A box pinned to both edges has no width of its own, so it needs no cap. A
 * centred box (a percentage or `calc()` offset) is already capped at the full
 * containing block, which is the most it can be given without moving its
 * centre.
 */
export function absoluteInlineCap(layout: LayoutStyles): string | null {
  if (!layout.width) return null;

  /** An offset that is a plain length, or null when it is a percentage/calc. */
  const lengthOffset = (value?: string): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!/^-?\d+(?:\.\d+)?(?:px|rem)$/.test(trimmed)) return null;
    return trimmed;
  };

  const left = lengthOffset(layout.left);
  const right = lengthOffset(layout.right);

  if (!left && !right) {
    // Placed by a percentage/calc offset (or not at all): the containing block
    // itself is the only cap that is certainly inside the frame.
    return layout.left !== undefined || layout.right !== undefined ? '100%' : null;
  }

  if (left && right) return `calc(100% - ${left} - ${right})`;
  return `calc(100% - ${left ?? right})`;
}

/**
 * Rewrites one axis of an absolutely-positioned child's placement to match the
 * anchor that was read from the drawing. `start` is the default and leaves the
 * offset that was already emitted alone.
 */
function applyAbsoluteAnchor(
  layout: LayoutStyles,
  axis: 'horizontal' | 'vertical',
  anchor: AbsoluteAnchor,
  startGap: number,
  size: number,
  parentSize: number,
  options: ConversionOptions
): void {
  const unit = (v: number) => formatUnit(v, options.useRem, options.baseFontSize);
  const endGap = parentSize - startGap - size;

  if (axis === 'horizontal') {
    switch (anchor) {
      case 'stretch':
        layout.left = unit(startGap);
        layout.right = unit(endGap);
        delete layout.width;
        break;
      case 'center':
        layout.left = '50%';
        layout.transform = addTransform(layout.transform, 'translateX(-50%)');
        break;
      case 'end':
        layout.right = unit(endGap);
        delete layout.left;
        break;
      case 'start':
        layout.left = unit(startGap);
        break;
    }
    return;
  }

  switch (anchor) {
    case 'stretch':
      layout.top = unit(startGap);
      layout.bottom = unit(endGap);
      delete layout.height;
      break;
    case 'center':
      layout.top = '50%';
      layout.transform = addTransform(layout.transform, 'translateY(-50%)');
      break;
    case 'end':
      layout.bottom = unit(endGap);
      delete layout.top;
      break;
    case 'start':
      layout.top = unit(startGap);
      break;
  }
}

/**
 * Freeform flow promotion.
 *
 * Many Figma sections, cards, and rows are drawn with `layoutMode: NONE` even
 * though their children form a clean, non-overlapping row or column with
 * uniform gaps and aligned cross-axis starts. Emitting them as `position:
 * absolute` freezes every child at its desktop coordinates, so on a narrower
 * screen the children either collide or spill off the right edge.
 *
 * When the geometry proves that a freeform frame is an unlayered 1D flow —
 * children already in reading order, non-overlapping, sharing one cross-axis
 * start and one main-axis gap, and packing the frame — promoting the frame to
 * a flex container lets the children reflow, wrap, and compress naturally while
 * remaining pixel-identical at the design width.
 */
export interface InferredFreeformFlow {
  direction: 'HORIZONTAL' | 'VERTICAL';
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  itemSpacing: number;
  counterAxisAlignItems: 'MIN' | 'CENTER' | 'MAX';
}

const freeformFlowCache = new WeakMap<object, InferredFreeformFlow | null>();

export function inferFreeformFlow(
  node: SceneNode,
  options: ConversionOptions
): InferredFreeformFlow | null {
  if (!responsiveEnabled(options) || !intrinsicReflowEnabled(options)) return null;
  if (!node || typeof node !== 'object') return null;
  if ('layoutMode' in node && node.layoutMode && node.layoutMode !== 'NONE') return null;
  if (node.type !== 'FRAME' && node.type !== 'COMPONENT' && node.type !== 'INSTANCE' && node.type !== 'SECTION') {
    return null;
  }

  if (freeformFlowCache.has(node)) {
    return freeformFlowCache.get(node) ?? null;
  }

  const compute = (): InferredFreeformFlow | null => {
    if (!('children' in node) || !Array.isArray(node.children)) return null;
    const visible = node.children.filter((c) => c.visible !== false);
    if (visible.length < 2) return null;

    const frameW = nodeWidthOf(node);
    const frameH = 'height' in node && typeof node.height === 'number' ? node.height : 0;
    if (frameW <= 0 || frameH <= 0) return null;

    // Never promote a frame where any child has an explicit non-default constraint
    // (such as CENTER, MAX, STRETCH, SCALE) or rotation — those layers were
    // deliberately pinned out of flow.
    for (const child of visible) {
      if ('rotation' in child && typeof child.rotation === 'number' && Math.abs(child.rotation) > 0.1) {
        return null;
      }
      if ('constraints' in child && child.constraints) {
        const c = child.constraints as { horizontal?: string; vertical?: string };
        if (c.horizontal && c.horizontal !== 'MIN') return null;
        if (c.vertical && c.vertical !== 'MIN') return null;
      }
    }

    const boxes = visible.map((c) => {
      const x = 'x' in c && typeof c.x === 'number' ? c.x : 0;
      const y = 'y' in c && typeof c.y === 'number' ? c.y : 0;
      const w = nodeWidthOf(c);
      const h = 'height' in c && typeof c.height === 'number' ? c.height : 0;
      return { node: c, x, y, w, h };
    });

    if (boxes.some((b) => b.w <= 0 || b.h <= 0)) return null;
    // Children must sit inside the frame bounds.
    if (
      boxes.some(
        (b) =>
          b.x < -FREEFORM_FLOW_OVERLAP_TOLERANCE_PX ||
          b.y < -FREEFORM_FLOW_OVERLAP_TOLERANCE_PX ||
          b.x + b.w > frameW + FREEFORM_FLOW_OVERLAP_TOLERANCE_PX ||
          b.y + b.h > frameH + FREEFORM_FLOW_OVERLAP_TOLERANCE_PX
      )
    ) {
      return null;
    }

    // Reject if any two children overlap in 2D (e.g. background scrim + dialog).
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!;
        const b = boxes[j]!;
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (
          overlapX > FREEFORM_FLOW_OVERLAP_TOLERANCE_PX &&
          overlapY > FREEFORM_FLOW_OVERLAP_TOLERANCE_PX
        ) {
          return null;
        }
      }
    }

    // Test HORIZONTAL row: children in DOM order must be strictly left-to-right,
    // share the same top (or vertical center) within tolerance, have uniform
    // horizontal gaps, and form a multi-column row that wouldn't fit a phone.
    const isOrderedH = boxes.every(
      (b, i) => i === 0 || b.x >= boxes[i - 1]!.x + boxes[i - 1]!.w - FREEFORM_FLOW_OVERLAP_TOLERANCE_PX
    );
    if (isOrderedH && frameW >= MULTI_COLUMN_MIN_WIDTH_PX) {
      const first = boxes[0]!;
      const last = boxes[boxes.length - 1]!;
      const gapsH: number[] = [];
      for (let i = 1; i < boxes.length; i++) {
        gapsH.push(Math.max(0, boxes[i]!.x - (boxes[i - 1]!.x + boxes[i - 1]!.w)));
      }
      const minGap = Math.min(...gapsH);
      const maxGap = Math.max(...gapsH);
      const uniformGap = maxGap - minGap <= FREEFORM_FLOW_ALIGN_TOLERANCE_PX;

      const minY = Math.min(...boxes.map((b) => b.y));
      const maxY = Math.max(...boxes.map((b) => b.y));
      const minBottom = Math.min(...boxes.map((b) => frameH - (b.y + b.h)));
      const topAligned = maxY - minY <= FREEFORM_FLOW_ALIGN_TOLERANCE_PX;
      const centerAligned =
        Math.max(...boxes.map((b) => b.y + b.h / 2)) - Math.min(...boxes.map((b) => b.y + b.h / 2)) <=
        FREEFORM_FLOW_ALIGN_TOLERANCE_PX;

      const padLeft = Math.max(0, Math.round(first.x));
      const padRight = Math.max(0, Math.round(frameW - (last.x + last.w)));
      const symmetricSides = Math.abs(padLeft - padRight) <= Math.max(8, frameW * 0.02);
      const totalSpan = last.x + last.w - first.x;
      const packsFrame = totalSpan >= (frameW - padLeft - padRight) * ROW_FILL_MIN_RATIO - ROW_FILL_SLACK_PX;
      const substantialCount = boxes.filter((b) => b.w >= SUBSTANTIAL_CHILD_MIN_PX).length;

      if (
        uniformGap &&
        (topAligned || centerAligned) &&
        symmetricSides &&
        packsFrame &&
        substantialCount >= 2 &&
        totalSpan > PHONE_FIT_WIDTH_PX
      ) {
        const gap = Math.round(gapsH.reduce((s, g) => s + g, 0) / gapsH.length);
        return {
          direction: 'HORIZONTAL',
          paddingTop: Math.max(0, Math.round(minY)),
          paddingRight: padRight,
          paddingBottom: Math.max(0, Math.round(minBottom)),
          paddingLeft: padLeft,
          itemSpacing: gap,
          counterAxisAlignItems: topAligned ? 'MIN' : 'CENTER',
        };
      }
    }

    return null;
  };

  const result = compute();
  freeformFlowCache.set(node, result);
  return result;
}

/**
 * Wraps a freeform SceneNode in a virtual AutoLayout proxy when `inferFreeformFlow`
 * promotes it, so every downstream helper (`isMultiColumnRow`, `isRegionsRow`,
 * `isPackedRow`, `extractLayout`) treats it identically to a native AutoLayout
 * frame without mutating the caller's node.
 */
function withInferredAutoLayout(node: SceneNode, flow: InferredFreeformFlow): SceneNode {
  return new Proxy(node, {
    get(target, prop, receiver) {
      if (prop === 'layoutMode') return flow.direction;
      if (prop === 'paddingTop') return flow.paddingTop;
      if (prop === 'paddingRight') return flow.paddingRight;
      if (prop === 'paddingBottom') return flow.paddingBottom;
      if (prop === 'paddingLeft') return flow.paddingLeft;
      if (prop === 'itemSpacing') return flow.itemSpacing;
      if (prop === 'primaryAxisAlignItems') return 'MIN';
      if (prop === 'counterAxisAlignItems') return flow.counterAxisAlignItems;
      return Reflect.get(target, prop, receiver);
    },
    has(target, prop) {
      if (
        prop === 'layoutMode' ||
        prop === 'paddingTop' ||
        prop === 'paddingRight' ||
        prop === 'paddingBottom' ||
        prop === 'paddingLeft' ||
        prop === 'itemSpacing' ||
        prop === 'primaryAxisAlignItems' ||
        prop === 'counterAxisAlignItems'
      ) {
        return true;
      }
      return Reflect.has(target, prop);
    },
  });
}

/**
 * The children a flex container actually lays out: visible, in-flow children.
 * Absolutely-positioned children are taken out of flow by Figma too, so they
 * neither occupy a line nor contribute to when a row runs out of room.
 */
function flexChildren(node: SceneNode): SceneNode[] {
  if (!('children' in node) || !Array.isArray(node.children)) return [];
  return node.children.filter((child) => {
    if (child.visible === false) return false;
    if ('layoutPositioning' in child && (child as { layoutPositioning?: string }).layoutPositioning === 'ABSOLUTE') {
      return false;
    }
    const main = getMainComponent(child);
    return !(main && 'layoutPositioning' in main && (main as { layoutPositioning?: string }).layoutPositioning === 'ABSOLUTE');
  });
}

/**
 * The width a child contributes to its row, in px.
 *
 * A rotated divider is laid out by its visual box, not by the axis it was
 * drawn along: a 423px line rotated 90° claims its own thickness — nothing —
 * of width, not 423px. Every row decision below — region detection, wrap
 * thresholds, packed rows — has to see the same number the browser will lay
 * out.
 */
function nodeWidthOf(node: SceneNode): number {
  const divider = readDividerGeometry(node);
  if (divider) return divider.width;
  return 'width' in node && typeof node.width === 'number' ? node.width : 0;
}

/** The height a child contributes to its row, in px, with the same divider rule. */
function nodeHeightOf(node: SceneNode): number {
  const divider = readDividerGeometry(node);
  if (divider) return divider.height;
  return 'height' in node && typeof node.height === 'number' ? node.height : 0;
}

/**
 * Whether a child is large enough to read as a layout *region* rather than as
 * a detail hanging off one. A 40px icon in a row is not a region; a sidebar is.
 */
function isStackableRegion(child: SceneNode): boolean {
  return nodeWidthOf(child) >= SUBSTANTIAL_CHILD_MIN_PX;
}

/**
 * How much a column weighs in the browser's decision to wrap the row.
 *
 * Flexbox breaks lines using each item's *hypothetical main size* — its flex
 * base size clamped by its min/max — so this has to mirror what `extractLayout`
 * emits for that child:
 *
 * - a column that fills its row is emitted as `flex-basis: 0` with a
 *   `min-width` floor, so the floor is what counts, not its drawn width;
 * - everything else keeps its drawn width as the basis.
 *
 * Which of the two a column is has to come from `isFlexibleColumn` and nowhere
 * else: a second copy of that rule would drift, and the container query would
 * then fire at a width where the row does not actually wrap.
 */
function columnWrapSizePx(child: SceneNode, row: SceneNode, options: ConversionOptions): number {
  const width = nodeWidthOf(child);
  return isFlexibleColumn(child, row, options) ? columnFloorPx(width) : width;
}

/** Whether the child's own Figma sizing already says it fills its row. */
function declaresFill(child: SceneNode): boolean {
  return (
    ('layoutGrow' in child && (child as { layoutGrow?: number }).layoutGrow === 1) ||
    ('layoutSizingHorizontal' in child &&
      (child as { layoutSizingHorizontal?: string }).layoutSizingHorizontal === 'FILL')
  );
}

/**
 * Whether a child of a horizontal row is emitted as a *flexible* column — one
 * that takes a share of the row rather than holding the width it was drawn at.
 *
 * The single answer to that question, because the row's wrap point depends on
 * it: a flexible column is emitted as `flex-basis: 0` with a floor, so the
 * floor is what weighs on the browser's decision to wrap.
 */
function isFlexibleColumn(
  child: SceneNode,
  row: SceneNode,
  options: ConversionOptions
): boolean {
  if (declaresFill(child)) return true;
  const height = 'height' in child && typeof child.height === 'number' ? child.height : 0;
  return isImplicitFillInRow(child, nodeWidthOf(child), height, row, options);
}

/** Identity of two scene nodes, tolerating the copies a component instance makes. */
function sameNode(a: SceneNode, b: SceneNode): boolean {
  if (a === b) return true;
  return Boolean(a.id) && a.id === b.id;
}

/**
 * The one child of a regions row that holds its space: the widest of its
 * stackable regions.
 *
 * A regions row is *defined* by width disparity — a rail beside a body — so
 * the body is the widest region by construction. It is deliberately not
 * "whichever child holds half the row": a three-pane shell drawn 700/500/240
 * has no such child, and that is precisely what went wrong. With no child
 * allowed to flex, every pane kept the width it was drawn at, so the row's
 * columns added up to its own width, the wrap point came out as the design
 * width, and the container query matched at every size below it — the three
 * panes stacked as soon as the preview was a pixel narrower than the frame.
 */
function rowBodyOf(row: SceneNode): SceneNode | null {
  const regions = flexChildren(row).filter(isStackableRegion);
  const first = regions[0];
  if (regions.length < 2 || !first) return null;
  let widest: SceneNode = first;
  for (const region of regions) {
    if (nodeWidthOf(region) > nodeWidthOf(widest)) widest = region;
  }
  return widest;
}

/**
 * Whether this child should absorb its packed row's space even though Figma
 * left it on `Fixed`.
 *
 * A grid of equal peers is excluded: making one card of three flex would let
 * it swallow the row and squeeze its siblings, which is not what the drawing
 * says. A *regions* row is the opposite case — "rail beside body" is itself a
 * statement that one of them is the body, and a body that holds the width it
 * was drawn at is exactly what stops the row from ever adapting.
 *
 * The half-the-row test below describes a *toolbar* — one input among icons,
 * where the input is obviously the thing that should stretch. It does not
 * describe a rail beside a body, so a regions row asks a different question:
 * are you the row's widest region? Exactly one child can answer yes, which is
 * what keeps the row's slack from being split between two bodies.
 */
function isImplicitFillInRow(
  child: SceneNode,
  width: number,
  height: number,
  row: SceneNode,
  options: ConversionOptions
): boolean {
  if (!responsiveEnabled(options)) return false;
  if (isMultiColumnRow(row)) {
    // Only a regions row has a body to give the space to.
    if (!isRegionsRow(row)) return false;
    if (!intrinsicReflowEnabled(options)) return false;
    if (!isPackedRow(row)) return false;
    const body = rowBodyOf(row);
    if (!body || !sameNode(body, child)) return false;
    return isProportionalRowChild(child, width, height);
  }
  if (!isPackedRow(row)) return false;
  return isImplicitFillChild(child, width, height, row);
}

/**
 * The spacing a reflowing row puts between its columns.
 *
 * Only ever called for rows the converter reflows, and such a row always emits
 * its spacing as a real `gap` (a wrapping row cannot express `space-between`),
 * so the designed `itemSpacing` is the value to work from.
 */
function designGapPx(node: SceneNode): number {
  const spacing = 'itemSpacing' in node && typeof node.itemSpacing === 'number' ? node.itemSpacing : 0;
  return Math.max(0, spacing);
}

/**
 * Whether `size` spans `container` closely enough to read as filling it.
 *
 * The tolerance is the looser of a few pixels and a small fraction of the
 * container, because the two ways a designer gets this "wrong" are different:
 * a layer can be snapped a pixel or two short of its parent's inner edge, or it
 * can be dragged to 96–98% of the width and left on `Fixed`. Both mean the same
 * thing — this element is meant to span its container — and neither survives a
 * resize if the drawn width is emitted as a fixed length.
 *
 * @param size - The child's drawn size along the axis, in px
 * @param container - The parent's inner size along the same axis, in px
 */
export function spansContainer(size: number, container: number): boolean {
  if (!(size > 0) || !(container > 0)) return false;
  const slack = Math.max(COUNTER_FILL_SLACK_PX, container * (1 - COUNTER_FILL_MIN_RATIO));
  return container - size <= slack;
}

/** The inner main-axis size of a horizontal AutoLayout row, in px. */
function rowInnerMainPx(row: SceneNode): number {
  return innerWidthPx(row);
}

/**
 * The content-box width of a node, in px.
 *
 * This is the width a percentage length inside the node resolves against, so
 * every fluid value the node emits has to be derived from it — not from the
 * page width, and not from the node's own border box.
 */
function innerWidthPx(node: SceneNode): number {
  const width = nodeWidthOf(node);
  const left = 'paddingLeft' in node && typeof node.paddingLeft === 'number' ? node.paddingLeft : 0;
  const right = 'paddingRight' in node && typeof node.paddingRight === 'number' ? node.paddingRight : 0;
  return Math.max(0, width - left - right);
}

/**
 * Whether a row was drawn *packed*: its in-flow children and the gaps between
 * them account for essentially all of its inner width.
 *
 * This is the test that separates "these cards were drawn to fill the row" from
 * "these cards sit in the row at their own size, with space around them". Only
 * the former is allowed to let its children grow — growing the latter would
 * silently resize a design that was deliberate.
 *
 * Two shapes are packed without the arithmetic:
 *
 * - `SPACE_BETWEEN` — the designer's own instruction to spread the children
 *   across the row. The leftover space is the layout, not a gap around it, so
 *   the children were drawn to fill the row by definition. Without this, a
 *   header's search field could never be told it is the thing that should
 *   absorb the row, because the row it sits in has slack by construction.
 * - a single in-flow child that spans the row — there is nothing else to
 *   distribute, so "the child fills its parent" is the only reading that
 *   survives a resize.
 */
export function isPackedRow(row: SceneNode): boolean {
  const inner = rowInnerMainPx(row);
  if (inner <= 0) return false;
  const children = flexChildren(row);
  if (children.length === 0) return false;

  if ((row as FrameNode).primaryAxisAlignItems === 'SPACE_BETWEEN' && children.length > 1) return true;

  const drawn = children.reduce((sum, child) => sum + nodeWidthOf(child), 0);
  if (children.length === 1) return spansContainer(drawn, inner);

  const gaps = designGapPx(row) * (children.length - 1);
  const slack = Math.max(ROW_FILL_SLACK_PX, inner * (1 - ROW_FILL_MIN_RATIO));
  return inner - (drawn + gaps) <= slack;
}

/**
 * Whether this child is the one element of a packed row that should absorb the
 * row's space — an input filling a toolbar, a banner's body beside its action.
 *
 * It has to be the row's main content rather than one of its details, so it
 * must hold at least `DOMINANT_CHILD_MIN_RATIO` of the row, and it has to be
 * something the row can actually stretch: an icon keeps its intrinsic size, and
 * a text run that hugs its content is not a box to be filled.
 */
function isImplicitFillChild(node: SceneNode, width: number, height: number, row: SceneNode): boolean {
  const inner = rowInnerMainPx(row);
  if (inner <= 0) return false;
  if (width < inner * DOMINANT_CHILD_MIN_RATIO) return false;
  if (isIntrinsicControl(node, width, height)) return false;
  if (node.type === 'TEXT') {
    // A hugging text run is sized by its own content; only a text box that was
    // already given a width is something the row can fill with.
    return (node as TextNode).textAutoResize !== 'WIDTH_AND_HEIGHT';
  }
  return isProportionalRowChild(node, width, height);
}

/** Whether a row's gap is emitted as a fluid `clamp()` rather than a fixed value. */
function isFluidGap(designGap: number, referencePx: number, options: ConversionOptions): boolean {
  return (
    responsiveEnabled(options) &&
    designGap >= FLUID_GAP_MIN_PX &&
    fluidLength(designGap, referencePx, options, FLUID_MIN_RATIO) !== null
  );
}

/**
 * The inline size (px) at or below which a reflowing row can no longer hold its
 * columns side by side — measured on the row's own border box, which is the
 * width a container query reports.
 *
 * The row stops fitting at the width `W` where
 * `columns + gaps × gap(W) = W - padding` — the same sum the browser performs
 * when it breaks the line, against the row's *inner* width, because padding is
 * not available to the columns. Since the gap is itself fluid, `gap(W)` shrinks
 * as the row narrows, so the equation is solved in three ranges of the clamp
 * rather than approximated: above the drawn width the gap is pinned at its
 * maximum, below the clamp's floor it is pinned at its minimum, and in between
 * it tracks the width linearly.
 *
 * The result is a property of the design — it changes when the design changes,
 * and it is never tied to a particular viewport.
 */
function rowWrapThresholdPx(node: SceneNode, options: ConversionOptions): number {
  const children = flexChildren(node);
  if (children.length === 0) return 0;

  const columns = children.reduce((sum, child) => sum + columnWrapSizePx(child, node, options), 0);
  const gaps = children.length - 1;
  const designGap = designGapPx(node);

  // The gap's percentage resolves against the row's content box, and the
  // browser compares the columns against that same inner width. Both the
  // reference and the result therefore live in inner-width terms; the padding
  // is added back once, at the end, because a container query measures the
  // border box.
  const inner = rowInnerMainPx(node);
  const padding = Math.max(0, nodeWidthOf(node) - inner);

  if (gaps === 0 || designGap <= 0) return Math.round(columns + padding);

  const widestFit = columns + gaps * designGap;
  if (!isFluidGap(designGap, inner, options) || inner <= 0) {
    return Math.round(widestFit + padding);
  }

  // Above the drawn width the gap sits at its maximum, so the row fits from
  // `widestFit` upwards.
  if (widestFit >= inner) return Math.round(widestFit + padding);

  // Inside the clamp's linear range the gap scales with the row width, so the
  // equation has the closed form `columns / (1 - slope)`.
  const slope = (gaps * designGap) / inner;
  const linear = columns / (1 - slope);
  const floorWidth = (fluidFloor(designGap, FLUID_MIN_RATIO) * inner) / designGap;
  if (linear >= floorWidth && linear <= inner) return Math.round(linear + padding);

  // Otherwise the gap is already at its floor and the row fits from there down.
  return Math.round(columns + gaps * fluidFloor(designGap, FLUID_MIN_RATIO) + padding);
}

/**
 * Whether a row's children read as layout *regions* — a narrow rail beside a
 * wide body — rather than as a grid of repeated items.
 *
 * The test is width disparity: siblings that are all about the same size are
 * interchangeable items of a grid, while siblings whose widths differ a lot are
 * doing different jobs. The distinction matters because the two want opposite
 * things once they wrap: a grid should keep reflowing two-up, one-up, keeping
 * each item at its designed size, whereas a rail and a body should each take
 * the whole line so the stack reads as one column.
 */
export function isRegionsRow(node: SceneNode): boolean {
  const regions = flexChildren(node).filter(isStackableRegion);
  if (regions.length < 2) return false;
  const widths = regions.map(nodeWidthOf);
  const widest = Math.max(...widths);
  const narrowest = Math.min(...widths);
  if (widest <= 0) return false;
  return narrowest / widest < REGION_WIDTH_RATIO_MAX;
}

/**
 * Whether a horizontal row is one the converter itself reflows *and* whose
 * children are regions. Only such a row becomes a query container: it is the
 * case where wrapping alone would leave a designed-width rail stranded on a
 * line of its own.
 *
 * A row that hugs its content is excluded — `container-type: inline-size` makes
 * an element's inline size independent of its contents, which would undo the
 * hug.
 */
export function isStackingRegionRow(node: SceneNode, options: ConversionOptions): boolean {
  if (!intrinsicReflowEnabled(options)) return false;
  if (!('layoutMode' in node) || node.layoutMode !== 'HORIZONTAL') return false;
  if ('layoutWrap' in node && node.layoutWrap === 'WRAP') return false;
  if (!isMultiColumnRow(node) || !isRegionsRow(node)) return false;
  return !isHorizontallyHugging(node);
}

/** Whether a node takes its width from its contents rather than its parent. */
function isHorizontallyHugging(node: SceneNode): boolean {
  if ('layoutSizingHorizontal' in node && (node as { layoutSizingHorizontal?: string }).layoutSizingHorizontal === 'HUG') {
    return true;
  }
  if (!('layoutMode' in node)) return false;
  if (node.layoutMode === 'HORIZONTAL') {
    return 'primaryAxisSizingMode' in node && (node as { primaryAxisSizingMode?: string }).primaryAxisSizingMode === 'AUTO';
  }
  if (node.layoutMode === 'VERTICAL') {
    return 'counterAxisSizingMode' in node && (node as { counterAxisSizingMode?: string }).counterAxisSizingMode === 'AUTO';
  }
  return false;
}

/**
 * Whether a row's in-flow children are all intrinsic controls — a cluster of
 * icons, an avatar with a status dot, a pair of chips.
 *
 * Such a row has a hard floor of its own: squeezing it below the sum of its
 * controls does not shrink them, it makes them overlap (they are all
 * `flex-shrink: 0`). The cluster is therefore floored at its own `min-content`
 * width, which is the browser's own measurement of that sum.
 */
function isControlCluster(node: SceneNode): boolean {
  if (!('layoutMode' in node) || node.layoutMode !== 'HORIZONTAL') return false;
  const children = flexChildren(node);
  if (children.length === 0) return false;
  return children.every((child) => {
    const h = 'height' in child && typeof child.height === 'number' ? child.height : 0;
    return isIntrinsicControl(child, nodeWidthOf(child), h);
  });
}

/**
 * Whether a horizontal row is a *bar* — a header, a toolbar, a status line —
 * rather than a set of columns.
 *
 * A bar holds things that are not interchangeable: a logo, a search field, a
 * pair of icon buttons. Stacking it turns a 72px header into three full-width
 * rows, which is not what any of those parts are for; treating it as a grid
 * gives it column floors it does not need. What a bar does instead is keep one
 * line and compress the one slot that can be compressed.
 *
 * The detection is deliberately shape-based rather than name-based: height, the
 * presence of a control, and the presence of a wide slot. A name test alone
 * misses every unnamed header — which is most of them — and fires on a card
 * whose layer happens to be called "Header".
 */
export function isToolbarRow(node: SceneNode): boolean {
  if (!('layoutMode' in node) || node.layoutMode !== 'HORIZONTAL') return false;
  if ('layoutWrap' in node && node.layoutWrap === 'WRAP') return false;

  const height = 'height' in node && typeof node.height === 'number' ? node.height : 0;
  if (height <= 0 || height > HEADER_MAX_HEIGHT_PX) return false;

  const children = flexChildren(node);
  if (children.length < 2 || children.length > 6) return false;

  const hasControl = children.some((child) => {
    const h = 'height' in child && typeof child.height === 'number' ? child.height : 0;
    return isIntrinsicControl(child, nodeWidthOf(child), h);
  });
  const hasWideChild = children.some((child) => nodeWidthOf(child) >= TOOLBAR_WIDE_CHILD_MIN_PX);

  return hasControl && hasWideChild;
}

/**
 * Detects whether a horizontal AutoLayout container is a multi-column row
 * (e.g. 2+ substantial cards, columns, sidebar + content) that should stack into a column on mobile.
 * Uses mathematical geometry, AutoLayout sizing constraints, and structural semantics.
 */
export function isMultiColumnRow(node: SceneNode): boolean {
  if (!('layoutMode' in node) || node.layoutMode !== 'HORIZONTAL') return false;
  if ('layoutWrap' in node && node.layoutWrap === 'WRAP') return false; // Already wraps natively!
  if (!('children' in node) || !Array.isArray(node.children)) return false;

  const visibleChildren = flexChildren(node);
  if (visibleChildren.length < 2) return false;

  const nodeW = 'width' in node && typeof node.width === 'number' ? node.width : 0;

  // 1. Inline control safeguard (buttons, chips, badges, tags)
  const isButtonOrTag = /(button|btn|tag|badge|chip|pill|دکمه|تگ|بج)/i.test((node.name || '').trim());
  if (isButtonOrTag) return false;

  // 2. A bar is never a set of columns. This is what keeps a header horizontal
  // with `space-between` on a phone instead of stacking its logo, its search
  // field and its actions into three rows — the previous guard only recognised
  // a header whose every child happened to be narrower than a column, so any
  // header with a real search field fell through and was stacked.
  if (isToolbarRow(node)) return false;

  // 3. Small controls safeguard (a row of icons, dots, pagination buttons)
  const isAllSmallControls = visibleChildren.every((c) => {
    return nodeWidthOf(c) <= INTRINSIC_CONTROL_MAX_PX;
  });
  if (isAllSmallControls) return false;

  // 4. Icon/Avatar next to label/text row (e.g. avatar + user info)
  if (visibleChildren.length === 2) {
    const first = visibleChildren[0];
    const second = visibleChildren[1];
    if (first && second) {
      const w1 = nodeWidthOf(first);
      const w2 = nodeWidthOf(second);
      if (
        (w1 <= INTRINSIC_CONTROL_MAX_PX && w2 < MIN_COLUMN_WIDTH_PX) ||
        (w2 <= INTRINSIC_CONTROL_MAX_PX && w1 < MIN_COLUMN_WIDTH_PX)
      ) {
        return false; // Icon + text label or avatar + name: should NOT reflow!
      }
    }
  }

  // 5. Total natural width check:
  // If the total width of all children + gaps already fits a phone viewport,
  // the row never needs to reflow.
  const rawGap = typeof (node as any).itemSpacing === 'number' ? Math.max(0, (node as any).itemSpacing) : 0;
  const totalGap = rawGap * (visibleChildren.length - 1);
  const totalChildrenWidth = visibleChildren.reduce((sum, c) => sum + nodeWidthOf(c), 0);

  if (totalChildrenWidth + totalGap <= PHONE_FIT_WIDTH_PX) {
    return false;
  }

  // 6. Substantial children check:
  // Children that are substantial content blocks (cards, columns, sidebars)
  // or use FILL / layoutGrow to expand.
  const substantialChildren = visibleChildren.filter((c) => {
    const w = nodeWidthOf(c);
    const isFill =
      ('layoutGrow' in c && (c as any).layoutGrow === 1) ||
      ('layoutSizingHorizontal' in c && (c as any).layoutSizingHorizontal === 'FILL');
    return w >= SUBSTANTIAL_CHILD_MIN_PX || isFill;
  });

  // A wide container (or a wide row of children) holding two or more content
  // blocks is a multi-column row.
  return (nodeW >= MULTI_COLUMN_MIN_WIDTH_PX || totalChildrenWidth >= MULTI_COLUMN_MIN_CHILDREN_PX) && substantialChildren.length >= 2;
}

/* ------------------------------------------------------------------ *
 * Grid auto-layout
 *
 * Figma's grid is a track model: columns and rows are declared separately, a
 * child occupies a cell (or a span of them), and each axis has its own gap.
 * None of that survives being flattened into a flex row, which is why a grid
 * frame used to arrive as a single vertical stack.
 * ------------------------------------------------------------------ */

/** One track of a Figma grid: `FLEX` shares the leftover space, `FIXED` is px. */
interface FigmaGridTrack {
  type?: string;
  value?: number;
}

function gridTrackSizes(node: SceneNode, axis: 'column' | 'row'): FigmaGridTrack[] | null {
  const key = axis === 'column' ? 'gridColumnSizes' : 'gridRowSizes';
  const value = (node as unknown as Record<string, unknown>)[key];
  return Array.isArray(value) ? (value as FigmaGridTrack[]) : null;
}

function gridTrackCount(node: SceneNode, axis: 'column' | 'row'): number {
  const key = axis === 'column' ? 'gridColumnCount' : 'gridRowCount';
  const value = (node as unknown as Record<string, unknown>)[key];
  return typeof value === 'number' && value > 0 ? Math.round(value) : 0;
}

/** Gap between tracks on one axis, in px. The column gap is the horizontal one. */
function gridGapPx(node: SceneNode, axis: 'column' | 'row'): number {
  const key = axis === 'column' ? 'gridColumnGap' : 'gridRowGap';
  const value = (node as unknown as Record<string, unknown>)[key];
  return typeof value === 'number' && value > 0 ? value : 0;
}

/**
 * Whether a grid is a plain grid of peers — auto-flowed, every child in one
 * cell.
 *
 * Only such a grid may reflow. A grid with manual placement or spans depends on
 * its column count: `grid-column: 3 / span 2` in a one-column track list
 * invents two phantom columns, and the layout tears itself apart exactly when
 * it is supposed to be adapting. Those grids keep their explicit tracks, so
 * they stay pixel-accurate and simply scale down instead of reflowing.
 */
function gridIsUniform(node: SceneNode): boolean {
  const positioning = (node as unknown as Record<string, unknown>).gridItemsPositioning;
  if (typeof positioning === 'string' && positioning !== 'ROW_AUTO_FLOW') return false;
  return flexChildren(node).every((child) => {
    const cell = child as unknown as { gridColumnSpan?: number; gridRowSpan?: number };
    return (cell.gridColumnSpan ?? 1) <= 1 && (cell.gridRowSpan ?? 1) <= 1;
  });
}

/**
 * Whether the column template reflows — i.e. it was emitted as `auto-fit`.
 *
 * The answer is read back from the template rather than decided twice: the
 * container, the row list and the children's placement all have to agree about
 * whether this grid has a fixed column count, and a second copy of the rule is
 * how they would stop agreeing.
 */
function gridReflows(node: SceneNode, options: ConversionOptions): boolean {
  return (gridTemplate(node, 'column', options) ?? '').includes('auto-fit');
}

/** The gap as a CSS length, fluid when the export is responsive. */
function gridGap(node: SceneNode, axis: 'column' | 'row', options: ConversionOptions): string | null {
  const gap = gridGapPx(node, axis);
  if (gap <= 0) return null;
  // Only the inline gap can be fluid. A percentage `row-gap` resolves against
  // the container's block size, which a grid with auto rows does not have — the
  // browser then resolves it to zero, so the rows would silently collapse onto
  // each other. The column gap resolves against the inline size, which is known.
  if (axis === 'column' && options.responsive) {
    return fluidOrFixed(gap, innerWidthPx(node), options, FLUID_GAP_MIN_PX);
  }
  return formatUnit(gap, options.useRem, options.baseFontSize);
}

/**
 * The `grid-template-*` track list for one axis.
 *
 * Equal flexible columns are the one case that can also reflow without a
 * breakpoint: `auto-fit` with a floor equal to the *drawn* column width fits
 * exactly as many columns as the design has at the design width — so the output
 * is still pixel-identical there — and fewer as the container narrows, instead
 * of squeezing three cards into a phone. The floor comes from the design's own
 * geometry, not from a viewport size.
 *
 * A heterogeneous track list (a rail beside a body) keeps its explicit tracks:
 * there is no single floor that would reproduce it.
 */
function gridTemplate(node: SceneNode, axis: 'column' | 'row', options: ConversionOptions): string | null {
  const count = gridTrackCount(node, axis);
  const sizes = gridTrackSizes(node, axis);

  if (!sizes || sizes.length === 0) {
    return count > 0 ? `repeat(${count}, minmax(0, 1fr))` : null;
  }

  const allFlexible = sizes.every((track) => track.type !== 'FIXED');
  if (
    axis === 'column' &&
    allFlexible &&
    count >= 2 &&
    gridIsUniform(node) &&
    responsiveEnabled(options) &&
    intrinsicReflowEnabled(options)
  ) {
    const inner = rowInnerMainPx(node);
    const gap = gridGapPx(node, 'column');
    const designed = (inner - gap * (count - 1)) / count;
    if (inner > 0 && designed >= 1) {
      const floor = formatUnit(Math.round(designed * 100) / 100, options.useRem, options.baseFontSize);
      return `repeat(auto-fit, minmax(min(${floor}, 100%), 1fr))`;
    }
  }

  return sizes
    .map((track) =>
      track.type === 'FIXED'
        ? formatUnit(track.value ?? 0, options.useRem, options.baseFontSize)
        : 'minmax(0, 1fr)'
    )
    .join(' ');
}

/**
 * Extracts comprehensive CSS layout properties from a Figma scene node
 */
export function extractLayout(
  rawNode: SceneNode,
  rawParent: SceneNode | null,
  options: ConversionOptions,
  tokenRegistry?: TokenRegistry
): LayoutStyles {
  const inferredNodeFlow = inferFreeformFlow(rawNode, options);
  const node = inferredNodeFlow ? withInferredAutoLayout(rawNode, inferredNodeFlow) : rawNode;
  const inferredParentFlow = rawParent ? inferFreeformFlow(rawParent, options) : null;
  const parent = rawParent && inferredParentFlow ? withInferredAutoLayout(rawParent, inferredParentFlow) : rawParent;

  const layout: LayoutStyles = {};
  const resolver = new TokenResolver(tokenRegistry, {
    baseFontSize: options.baseFontSize,
    node,
  });

  /**
   * Keeps a gap's variable name when the emitted value is still the design
   * value. A fluid clamp or a normalized spacing is a different number, and a
   * token there would silently restore the designed one.
   */
  const gapWithToken = (
    value: string | null,
    field: 'itemSpacing' | 'counterAxisSpacing' | 'gridColumnGap' | 'gridRowGap',
    px: number
  ): string | null => {
    if (!value) return null;
    if (value !== formatUnit(px, options.useRem, options.baseFontSize)) return value;
    return resolver.lengthFor(TokenResolver.boundId(node, field), px) ?? value;
  };
  const isAutoLayoutParent = parent && 'layoutMode' in parent && parent.layoutMode !== 'NONE';
  const hasChildren = 'children' in node && node.children.length > 0;

  const boxDims = getNodeBoxDimensions(node);
  // A divider that takes part in layout is sized by the box Figma actually
  // lays out: the one after its rotation. The unrotated width/height stay the
  // source of truth only for absolutely positioned dividers, where the flow
  // has no say and `transform: rotate()` still reproduces the drawing.
  const dividerGeometry = readDividerGeometry(node);
  const inFlowDivider = dividerGeometry && isInLayoutFlow(node, parent) ? dividerGeometry : null;
  const boxWidth = inFlowDivider ? inFlowDivider.width : boxDims.width;
  const boxHeight = inFlowDivider ? inFlowDivider.height : boxDims.height;
  const childOutsideSw = getChildrenMaxOutsideStroke(node);
  const isAutoLayout = 'layoutMode' in node && node.layoutMode !== 'NONE';
  const parentStrokesIncluded = Boolean(
    'strokesIncludedInLayout' in node && (node as any).strokesIncludedInLayout
  );
  // Extra size needed on parent container if children have outside strokes not included in layout:
  const extraChildSw = isAutoLayout && !parentStrokesIncluded ? childOutsideSw : 0;

  const nodeWidth = boxWidth + (boxDims.outsideStrokeWeight === 0 ? extraChildSw * 2 : 0);
  const nodeHeight = boxHeight + (boxDims.outsideStrokeWeight === 0 ? extraChildSw * 2 : 0);

  // The width this node's own fluid lengths will be resolved against.
  //
  // A percentage padding resolves against the *containing block* — the parent's
  // content box, or the page width for the root — while a percentage gap
  // resolves against the node's own content box. Both are derived from the
  // drawing, so each fluid value is expressed as the exact fraction of the box
  // that will size it, and the output is pixel-identical at the design width.
  const containingWidthPx = parent
    ? isAutoLayoutParent
      ? innerWidthPx(parent)
      : nodeWidthOf(parent)
    : nodeWidth;

  // 1. Check if current node is an AutoLayout container
  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    const isGridFrame = node.layoutMode === 'GRID';

    // AutoLayout container establishes positioning context for absolute children
    layout.position = 'relative';

    if (isGridFrame) {
      // A grid is a track model, not a row. Figma gives the track list
      // explicitly, so it is carried across verbatim instead of being
      // re-derived from where the children happen to sit — that derivation is
      // exactly what a flex row cannot express, and what used to turn a card
      // grid into a single column.
      layout.display = 'grid';
      // Grid columns follow writing direction just as flex items do, so the
      // same reasoning as the horizontal branch applies: Figma's coordinates
      // are always left-to-right.
      layout.direction = 'ltr';

      const columns = gridTemplate(node, 'column', options);
      if (columns) layout.gridTemplateColumns = columns;

      // A reflowing grid does not have the design's row count: at a narrower
      // width the same cards occupy more rows. Declaring the drawn rows would
      // leave the extra ones implicit and uneven, so the row list is left out
      // and every row is sized by its content. A grid that keeps its columns
      // keeps its rows too — there the two were drawn together.
      if (!columns || !columns.includes('auto-fit')) {
        const rows = gridTemplate(node, 'row', options);
        if (rows) layout.gridTemplateRows = rows;
      }

      const columnGap = gapWithToken(
        gridGap(node, 'column', options),
        'gridColumnGap',
        gridGapPx(node, 'column')
      );
      const rowGap = gapWithToken(
        gridGap(node, 'row', options),
        'gridRowGap',
        gridGapPx(node, 'row')
      );
      if (columnGap) layout.columnGap = columnGap;
      if (rowGap) layout.rowGap = rowGap;
    } else {
      layout.display = 'flex';
      layout.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';

      // Figma's auto-layout coordinates are left-to-right on both axes: in a
      // row the primary MIN/MAX means physically left/right, and in a column
      // the counter MIN/MAX does. CSS `flex-start` / `flex-end` follow the
      // container's writing direction instead, so an RTL page would mirror
      // every column's alignment — a right-aligned hint under an input lands
      // on the left. The container therefore always resolves its own axes LTR;
      // a text layer keeps the `direction` its typography carries, so RTL copy
      // still reads right-to-left inside it.
      layout.direction = 'ltr';

      // A multi-column row is allowed to reflow intrinsically: `flex-wrap` plus a
      // `min-width` floor on each column lets the browser wrap them once the
      // available space runs out. No breakpoint is involved, so the row reflows
      // correctly at any width instead of snapping at a hard-coded viewport.
      const shouldReflow = intrinsicReflowEnabled(options) && isMultiColumnRow(node);

      // Flex Wrap
      if (('layoutWrap' in node && node.layoutWrap === 'WRAP') || shouldReflow || (intrinsicReflowEnabled(options) && isToolbarRow(node))) {
        layout.flexWrap = 'wrap';
        if ('counterAxisSpacing' in node && typeof node.counterAxisSpacing === 'number' && node.counterAxisSpacing > 0) {
          // A wrapped row's cross gap is a fixed gutter, deliberately: a
          // percentage `row-gap` resolves against the container's block size,
          // which is indefinite on an auto-height row, so it would collapse to
          // zero exactly when the row starts wrapping.
          const crossGap =
            resolver.lengthFor(
              TokenResolver.boundId(node, 'counterAxisSpacing'),
              node.counterAxisSpacing
            ) ?? formatUnit(node.counterAxisSpacing, options.useRem, options.baseFontSize);
          if (node.layoutMode === 'HORIZONTAL') {
            layout.rowGap = crossGap;
          } else {
            layout.columnGap = crossGap;
          }
        }
      }

    // Gap (item spacing)
    const rawItemSpacing = typeof node.itemSpacing === 'number' ? node.itemSpacing : 0;
    // A negative gap is invalid CSS and is handled by the margin overlap path
    // below; a compensated gap is no longer the designed number, so neither
    // can wear the variable's name.
    const boundGap =
      rawItemSpacing > 0 && extraChildSw === 0
        ? resolver.lengthFor(TokenResolver.boundId(node, 'itemSpacing'), rawItemSpacing)
        : null;

    const isSpaceBetween = node.primaryAxisAlignItems === 'SPACE_BETWEEN' && layout.flexWrap !== 'wrap';

    if (!isSpaceBetween) {
      if (boundGap) {
        layout.gap = boundGap;
      } else if (typeof node.itemSpacing === 'number' || extraChildSw > 0) {
        const effectiveItemSpacing = rawItemSpacing - 2 * extraChildSw;

        if (effectiveItemSpacing > 0) {
          // Large gaps track the row they sit in instead of dropping to a
          // hard-coded mobile value; small gaps stay exactly as designed.
          const gapVal = responsiveEnabled(options)
            ? fluidOrFixed(effectiveItemSpacing, innerWidthPx(node), options, FLUID_GAP_MIN_PX)
            : formatUnit(effectiveItemSpacing, options.useRem, options.baseFontSize);
          if (layout.flexWrap === 'wrap' && layout.rowGap) {
            layout.columnGap = gapVal;
          } else {
            layout.gap = gapVal;
          }
        } else if (effectiveItemSpacing < 0) {
          // Negative itemSpacing cannot be expressed via CSS gap. Saved for margin-based sibling overlap.
          layout.itemSpacing = effectiveItemSpacing;
        }
      }
    }

    if ('itemReverseZIndex' in node && Boolean(node.itemReverseZIndex)) {
      layout.itemReverseZIndex = true;
    }

    // Justify Content (primary axis alignment)
    switch (node.primaryAxisAlignItems) {
      case 'MIN':
        layout.justifyContent = 'flex-start';
        break;
      case 'CENTER':
        layout.justifyContent = 'center';
        break;
      case 'MAX':
        layout.justifyContent = 'flex-end';
        break;
      case 'SPACE_BETWEEN':
        layout.justifyContent = 'space-between';
        break;
    }

    // Align Items (counter axis alignment)
    switch (node.counterAxisAlignItems) {
      case 'MIN':
        layout.alignItems = 'flex-start';
        break;
      case 'CENTER':
        layout.alignItems = 'center';
        break;
      case 'MAX':
        layout.alignItems = 'flex-end';
        break;
      case 'BASELINE':
        layout.alignItems = 'baseline';
        break;
    }
    }

    // Padding
    let pt = node.paddingTop || 0;
    let pr = node.paddingRight || 0;
    let pb = node.paddingBottom || 0;
    let pl = node.paddingLeft || 0;

    // Figma lays children out from the frame's edge and lets the stroke paint
    // over that space; CSS `border-box` reserves it for the border instead.
    // Dropping the painted weight off each side leaves the content area the
    // design measured, so an inner edge does not creep out by a pixel.
    const layoutBorder = layoutBorderWeights(node);
    if (layoutBorder) {
      pt = Math.max(0, pt - layoutBorder.top);
      pr = Math.max(0, pr - layoutBorder.right);
      pb = Math.max(0, pb - layoutBorder.bottom);
      pl = Math.max(0, pl - layoutBorder.left);
    }

    // Check for impossible padding in fixed-size AutoLayout frames:
    // In Figma, when a frame has a fixed width/height and padding exceeds the container bounds
    // (or exceeds available space around children), Figma suppresses/clamps the padding, keeping the
    // frame strictly at nodeWidth x nodeHeight (and centering the children if aligned center).
    // In CSS, box-sizing: border-box cannot shrink below padding + content-size, which causes
    // the container to blow out into bloated rectangles (e.g. 20x20 icon buttons inflating to 40x36).
    const isHoriz = node.layoutMode === 'HORIZONTAL';
    const isHugH =
      ('layoutSizingHorizontal' in node && node.layoutSizingHorizontal === 'HUG') ||
      ('layoutMode' in node && node.layoutMode === 'HORIZONTAL' && (node as any).primaryAxisSizingMode === 'AUTO') ||
      ('layoutMode' in node && node.layoutMode === 'VERTICAL' && (node as any).counterAxisSizingMode === 'AUTO');
    const isHugV =
      ('layoutSizingVertical' in node && node.layoutSizingVertical === 'HUG') ||
      ('layoutMode' in node && node.layoutMode === 'VERTICAL' && (node as any).primaryAxisSizingMode === 'AUTO') ||
      ('layoutMode' in node && node.layoutMode === 'HORIZONTAL' && (node as any).counterAxisSizingMode === 'AUTO');
    const isFillH = 'layoutSizingHorizontal' in node && node.layoutSizingHorizontal === 'FILL';
    const isFillV = 'layoutSizingVertical' in node && node.layoutSizingVertical === 'FILL';

    const isFixedH = !isHugH && !isFillH;
    const isFixedV = !isHugV && !isFillV;

    const isCenteredH = isHoriz
      ? node.primaryAxisAlignItems === 'CENTER'
      : node.counterAxisAlignItems === 'CENTER';
    const isCenteredV = isHoriz
      ? node.counterAxisAlignItems === 'CENTER'
      : node.primaryAxisAlignItems === 'CENTER';

    let minChildW = 0;
    let minChildH = 0;
    if (hasChildren && 'children' in node && Array.isArray(node.children)) {
      let totalW = 0;
      let maxW = 0;
      let totalH = 0;
      let maxH = 0;
      const nonAbsoluteChildren = node.children.filter(
        (c: SceneNode) => c.visible !== false && !('layoutPositioning' in c && (c as any).layoutPositioning === 'ABSOLUTE')
      );
      const rawGap =
        typeof node.itemSpacing === 'number' && node.itemSpacing > 0 && node.primaryAxisAlignItems !== 'SPACE_BETWEEN'
          ? node.itemSpacing
          : 0;
      const totalGap = nonAbsoluteChildren.length > 1 ? rawGap * (nonAbsoluteChildren.length - 1) : 0;

      for (const child of nonAbsoluteChildren) {
        const cw = nodeWidthOf(child);
        const ch = nodeHeightOf(child);
        totalW += cw;
        maxW = Math.max(maxW, cw);
        totalH += ch;
        maxH = Math.max(maxH, ch);
      }

      minChildW = isHoriz ? totalW + totalGap : maxW;
      minChildH = isHoriz ? maxH : totalH + totalGap;
    }

    // Fake alignment detection:
    // If a container has fixed width/height, and one-sided padding closely matches the remaining space
    // (e.g. 100px padding-left on a 144px box containing a 44px text child, or 655px on 1080px hero),
    // this was artificial padding injected by design tools or AI importers to push content to the opposite edge.
    // In CSS, keeping this fake padding inflates and breaks flex layouts. Normalize to genuine flex alignment.
    if (isFixedH && nodeWidth > 0 && minChildW > 0) {
      const isFakePl = pl > 0 && pr === 0 && Math.abs(pl - (nodeWidth - minChildW)) <= 4;
      if (isFakePl) {
        if (isHoriz) {
          layout.justifyContent = 'flex-end';
        } else {
          layout.alignItems = 'flex-end';
        }
        pl = 0;
      }
      const isFakePr = pr > 0 && pl === 0 && Math.abs(pr - (nodeWidth - minChildW)) <= 4;
      if (isFakePr) {
        if (isHoriz) {
          layout.justifyContent = 'flex-start';
        } else {
          layout.alignItems = 'flex-start';
        }
        pr = 0;
      }
    }

    if (isFixedV && nodeHeight > 0 && minChildH > 0) {
      const isFakePt = pt > 0 && pb === 0 && Math.abs(pt - (nodeHeight - minChildH)) <= 4;
      if (isFakePt) {
        if (isHoriz) {
          layout.alignItems = 'flex-end';
        } else {
          layout.justifyContent = 'flex-end';
        }
        pt = 0;
      }
    }

    if (isFixedH && nodeWidth > 0) {
      if (pl + pr >= nodeWidth || (minChildW > 0 && pl + pr + minChildW > nodeWidth)) {
        if (isCenteredH) {
          pl = 0;
          pr = 0;
        } else {
          const maxAvailW = Math.max(0, nodeWidth - minChildW);
          pl = Math.min(pl, maxAvailW);
          pr = Math.max(0, maxAvailW - pl);
        }
      }
    }

    if (isFixedV && nodeHeight > 0) {
      if (pt + pb >= nodeHeight || (minChildH > 0 && pt + pb + minChildH > nodeHeight)) {
        if (isCenteredV) {
          pt = 0;
          pb = 0;
        } else {
          const maxAvailH = Math.max(0, nodeHeight - minChildH);
          pt = Math.min(pt, maxAvailH);
          pb = Math.max(0, maxAvailH - pt);
        }
      }
    }

    if (pt > 0 || pr > 0 || pb > 0 || pl > 0) {
      // Large paddings become fluid clamps: they render exactly as designed at
      // the design width and scale down with the box that sizes them, so a
      // section keeps breathing on a phone without a per-breakpoint override.
      // Small paddings stay as designed.
      const padValue = (
        side: 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft',
        px: number
      ): number | string => {
        const binding = TokenResolver.boundId(node, side);
        if (!responsiveEnabled(options)) {
          return resolver.lengthFor(binding, px) ?? px;
        }
        const fluid = fluidOrFixed(px, containingWidthPx, options, FLUID_PADDING_MIN_PX);
        // A clamp is no longer this side's design value, so the variable's
        // name would misstate it.
        if (fluid !== formatUnit(px, options.useRem, options.baseFontSize)) return fluid;
        return resolver.lengthFor(binding, px) ?? fluid;
      };

      layout.padding = {
        top: padValue('paddingTop', pt),
        right: padValue('paddingRight', pr),
        bottom: padValue('paddingBottom', pb),
        left: padValue('paddingLeft', pl),
      };
    }

    // A row whose children are layout *regions* — a rail beside a body rather
    // than a grid of interchangeable items — becomes an inline-size query
    // container. Wrapping on its own would drop the rail onto a line of its own
    // at its designed width, which reads as a broken column; the container lets
    // each region fill its line once the row is too narrow to hold them side by
    // side. The query is resolved by the browser against the row's own width,
    // so no viewport breakpoint is involved.
    if (isStackingRegionRow(node, options)) {
      layout.containerType = 'inline-size';
    }
  }

  const mainComp = getMainComponent(node);
  const isClipping =
    'clipsContent' in node && typeof (node as any).clipsContent === 'boolean'
      ? Boolean((node as any).clipsContent)
      : (mainComp && 'clipsContent' in mainComp && typeof mainComp.clipsContent === 'boolean' ? Boolean(mainComp.clipsContent) : false);

  if (!parent) {
    // Root selected node: establish relative container with width & height
    layout.position = 'relative';
    layout.boxSizing = 'border-box';
    if (responsiveEnabled(options)) {
      layout.width = '100%';
      layout.maxWidth = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
      layout.marginInline = 'auto';
      layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
      // The page is its own query container, so fluid type (`cqi`) resolves
      // against the width the page is actually rendered at — not the window.
      // Without it, type inside an embedded preview would scale against the
      // browser width while the page itself is capped at the design width.
      layout.containerType = 'inline-size';
    } else {
      layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
      layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
    }
    if (isClipping) {
      layout.overflow = 'hidden';
    }
  } else if (isAutoLayoutParent) {
    // Child inside AutoLayout parent
    const mainComp = getMainComponent(node);
    const isExplicitAbsolute =
      ('layoutPositioning' in node && node.layoutPositioning === 'ABSOLUTE') ||
      (mainComp && 'layoutPositioning' in mainComp && (mainComp as any).layoutPositioning === 'ABSOLUTE');

    if (isExplicitAbsolute) {
      // Explicit absolute child inside AutoLayout frame
      layout.position = 'absolute';
      const rawX = typeof node.x === 'number' ? node.x : 0;
      const rawY = typeof node.y === 'number' ? node.y : 0;
      const parentW = parent && 'width' in parent && typeof parent.width === 'number' ? parent.width : 0;
      const parentH = parent && 'height' in parent && typeof parent.height === 'number' ? parent.height : 0;

      const coversParent =
        parentW > 0 &&
        parentH > 0 &&
        Math.abs(rawX) <= 2 &&
        Math.abs(rawY) <= 2 &&
        Math.abs(nodeWidth - parentW) <= 4 &&
        Math.abs(nodeHeight - parentH) <= 4;

      if (coversParent) {
        layout.left = '0px';
        layout.top = '0px';
        layout.width = '100%';
        layout.height = '100%';
        layout.objectFit = 'cover';
      } else {
        layout.left = formatUnit(rawX, options.useRem, options.baseFontSize);
        layout.top = formatUnit(rawY, options.useRem, options.baseFontSize);
        layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
        layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);

        if (responsiveEnabled(options) && node.type !== 'TEXT') {
          const constraints: { horizontal?: string; vertical?: string } =
            'constraints' in node && node.constraints
              ? (node.constraints as { horizontal?: string; vertical?: string })
              : {};

          const spansH = !isHorizontallyHugging(node) && spansFreeformAxis(rawX, nodeWidth, parentW);
          const spansV = spansFreeformAxis(rawY, nodeHeight, parentH);

          if (spansH) {
            layout.left = formatUnit(rawX, options.useRem, options.baseFontSize);
            layout.right = formatUnit(parentW - rawX - nodeWidth, options.useRem, options.baseFontSize);
            delete layout.width;
          } else {
            const anchorH = absoluteAnchor(
              constraints.horizontal,
              rawX,
              nodeWidth,
              parentW,
              isHorizontallyCenteredInParent(node, parent, rawX, parentW)
            );
            applyAbsoluteAnchor(layout, 'horizontal', anchorH, rawX, nodeWidth, parentW, options);
          }

          if (spansV) {
            layout.top = formatUnit(rawY, options.useRem, options.baseFontSize);
            layout.bottom = formatUnit(parentH - rawY - nodeHeight, options.useRem, options.baseFontSize);
            delete layout.height;
          } else {
            const anchorV = absoluteAnchor(
              constraints.vertical,
              rawY,
              nodeHeight,
              parentH,
              isVerticallyCenteredFreeform(node, parent, rawY, parentH)
            );
            applyAbsoluteAnchor(layout, 'vertical', anchorV, rawY, nodeHeight, parentH, options);
          }
        }
      }

      const parentChildren = parent && 'children' in parent && Array.isArray(parent.children) ? parent.children : [];
      const childIdx = parentChildren.findIndex((c: any) => c === node || (c.id && c.id === node.id));
      const isChildAbsolute = (c: any) =>
        c === node || (c.id && c.id === node.id)
          ? true
          : c.layoutPositioning === 'ABSOLUTE';
      const firstFlexIdx = parentChildren.findIndex((c: any) => c.visible !== false && !isChildAbsolute(c));
      const isBackgroundLayer = childIdx !== -1 && firstFlexIdx !== -1 && childIdx < firstFlexIdx;

      if (!layout.zIndex) {
        layout.zIndex = isBackgroundLayer ? 0 : 1;
      }
    } else if (parent && 'layoutMode' in parent && (parent as FrameNode).layoutMode === 'GRID') {
      // A grid child is placed in a cell, not in a flow. Its drawn box is a
      // floor, never a rule: a `FILL` child has to be allowed to take the cell
      // it was given, or the grid resolves to the size the frame happened to be
      // drawn at and stops being a grid the moment anything resizes.
      const gridChild = node as SceneNode & {
        gridColumnAnchorIndex?: number;
        gridRowAnchorIndex?: number;
        gridColumnSpan?: number;
        gridRowSpan?: number;
      };

      const placement = (anchor: number | undefined, span: number | undefined): string | undefined => {
        if (typeof anchor !== 'number') return undefined;
        const cells = Math.max(1, span ?? 1);
        return cells > 1 ? `${anchor + 1} / span ${cells}` : `${anchor + 1}`;
      };

      // A reflowing grid places its own cells: at a narrower width the same
      // children occupy different cells, so a pinned `grid-column: 3` would
      // point past the last column and invent one. Auto-flow keeps the reading
      // order, which is the order the design has.
      if (!gridReflows(parent, options)) {
        const column = placement(gridChild.gridColumnAnchorIndex, gridChild.gridColumnSpan);
        const row = placement(gridChild.gridRowAnchorIndex, gridChild.gridRowSpan);
        if (column) layout.gridColumn = column;
        if (row) layout.gridRow = row;
      }

      const fillsH =
        ('layoutSizingHorizontal' in node && node.layoutSizingHorizontal === 'FILL') ||
        ('layoutGrow' in node && (node as { layoutGrow?: number }).layoutGrow === 1);
      const fillsV = 'layoutSizingVertical' in node && node.layoutSizingVertical === 'FILL';

      if (node.type === 'TEXT') {
        const textNode = node as TextNode;
        if (fillsH || textNode.textAutoResize !== 'WIDTH_AND_HEIGHT') {
          layout.width = '100%';
        } else {
          layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          layout.maxWidth = '100%';
        }
      } else {
        // `min-width: 0` lets a track shrink below its content instead of
        // forcing the whole grid wider than the frame it sits in.
        layout.width = fillsH ? '100%' : formatUnit(nodeWidth, options.useRem, options.baseFontSize);
        layout.minWidth = '0';

        if (fillsV) {
          layout.height = '100%';
        } else if (options.responsive && hasChildren && nodeHeight > HEADER_MAX_HEIGHT_PX) {
          // Same rule as the flex path: a tall container keeps its drawn height
          // as a floor so its content can grow it instead of being clipped.
          layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
        } else {
          layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
        }
      }
    } else {
      // Normal flex child — unified primary/counter axis handling.
      // Primary axis: grow/fill -> flex:1; HUG -> fit-content; FIXED -> px.
      const parentMode = (parent as FrameNode).layoutMode;
      const isVerticalParent = parentMode === 'VERTICAL';
      layout.flexShrink = options.responsive ? 1 : 0; // In responsive mode, allow elements to shrink naturally to fit viewports

      // Whether this child sits in a row that is allowed to reflow. Such a row
      // gives every column a `min-width` floor instead of `0`, so the browser
      // wraps columns onto their own line once they would get too narrow to
      // read — no breakpoint involved.
      const parentIsColumnRow = !isVerticalParent && parent !== null && isMultiColumnRow(parent);
      const parentReflows = intrinsicReflowEnabled(options) && parentIsColumnRow;

      // A regions row (rail + body) additionally asks its substantial children
      // to fill the line once the row has stacked. Asked of the row itself so
      // the parent's decision and the child's can never disagree.
      const parentStacksRegions =
        !isVerticalParent && parent !== null && isStackingRegionRow(parent, options);

      // A row whose children were drawn to fill it may let those children grow.
      // A *grid* of such children — cards, not a rail and a body — is the case
      // that needs it: with a designed `max-width` each card stays narrow when
      // it lands on a line of its own, leaving dead space beside it on a phone.
      // A regions row keeps its caps, because a rail is a rail, and fills its
      // line through the container query instead.
      const parentIsPackedGrid =
        parentReflows && parent !== null && !isRegionsRow(parent) && isPackedRow(parent);

      // The row's one filling element. An input dragged to the end of its
      // toolbar and left on `Fixed` still has to absorb the row, or the toolbar
      // breaks the moment the frame is resized. A regions row's body is the same
      // story — see `isImplicitFillInRow`.
      const isImplicitFill =
        !isVerticalParent && parent !== null && isImplicitFillInRow(node, nodeWidth, nodeHeight, parent, options);

      const isAutoH =
        ('layoutSizingHorizontal' in node && node.layoutSizingHorizontal === 'HUG') ||
        ('layoutMode' in node && node.layoutMode === 'HORIZONTAL' && (node as any).primaryAxisSizingMode === 'AUTO') ||
        ('layoutMode' in node && node.layoutMode === 'VERTICAL' && (node as any).counterAxisSizingMode === 'AUTO');
      const isAutoV =
        ('layoutSizingVertical' in node && node.layoutSizingVertical === 'HUG') ||
        ('layoutMode' in node && node.layoutMode === 'VERTICAL' && (node as any).primaryAxisSizingMode === 'AUTO') ||
        ('layoutMode' in node && node.layoutMode === 'HORIZONTAL' && (node as any).counterAxisSizingMode === 'AUTO');

      const sizingH = isAutoH ? 'HUG' : ('layoutSizingHorizontal' in node ? node.layoutSizingHorizontal : undefined);
      const sizingV = isAutoV ? 'HUG' : ('layoutSizingVertical' in node ? node.layoutSizingVertical : undefined);
      const align = 'layoutAlign' in node ? node.layoutAlign : undefined;
      const grow = 'layoutGrow' in node ? node.layoutGrow === 1 : false;
      const autoW = node.type === 'TEXT' && (node as TextNode).textAutoResize === 'WIDTH_AND_HEIGHT';
      const autoH = node.type === 'TEXT' && (node as TextNode).textAutoResize !== 'NONE';

      const primarySizing = isVerticalParent ? sizingV : sizingH;
      const counterSizing = isVerticalParent ? sizingH : sizingV;

      // Whether this child sits in a *bar* (header, toolbar, status line). A bar
      // keeps one line and compresses its flexible slot; its children are not
      // columns, so they get no reflow floors and no stacking.
      const parentIsToolbar = !isVerticalParent && parent !== null && isToolbarRow(parent);

      // A bar that spreads its children with `space-between` has already spent
      // its slack on the alignment, so its slot must not also grow: doing both
      // would push the trailing actions off the edge they were drawn on. A bar
      // whose children were drawn packed (a search field filling its box) is
      // the opposite case — the leftover space belongs to the slot.
      const parentSpreads =
        parent !== null &&
        'primaryAxisAlignItems' in parent &&
        (parent as FrameNode).primaryAxisAlignItems === 'SPACE_BETWEEN';

      // Primary axis. A horizontal parent sizes its children through
      // `mainAxisBox`, which is the only place a flex item's width is decided:
      // one object, one complete set of declarations, and no later pass that
      // can contradict it. A vertical parent's main axis is the block axis, so
      // its children are sized there and their width is decided by the counter
      // axis below.
      if (isVerticalParent) {
        if (grow || primarySizing === 'FILL') {
          layout.flexGrow = 1;
          layout.flexShrink = 1;
          layout.flexBasis = '0%';
          layout.minHeight = '0';
        } else if (primarySizing === 'HUG' || autoH) {
          // Hug sizing: safeguard dimensions so containers never collapse and
          // cannot be inflated by high-res image children.
          if (node.type !== 'TEXT') {
            layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
            layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          }
        } else {
          const isContainer = 'layoutMode' in node && node.layoutMode !== 'NONE' && hasChildren;
          // A tall vertical container keeps its designed height as a `min-height`
          // floor so its content can grow it, instead of being locked to a box
          // that clips. Small controls (<= header height) stay exactly sized.
          if (responsiveEnabled(options) && isContainer && nodeHeight > HEADER_MAX_HEIGHT_PX) {
            layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          } else {
            layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          }
        }
      } else if (grow || primarySizing === 'FILL') {
        // A filling column must not be squeezed out of existence: in a
        // reflowing row the floor is what lets the browser wrap it onto its own
        // line instead of collapsing it to nothing on a narrow screen.
        applyMainAxis(
          layout,
          mainAxisBox(
            {
              role: 'fill',
              drawnPx: nodeWidth,
              grow: true,
              floorPx: parentReflows ? columnFloorPx(nodeWidth) : 0,
            },
            options
          )
        );
      } else if (primarySizing === 'HUG' || autoW) {
        // Hug sizing: safeguard dimensions so containers never collapse and
        // cannot be inflated by high-res image children.
        if (node.type !== 'TEXT') {
          const hugW = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          layout.width = hugW;
          if (responsiveEnabled(options)) {
            // A hug element keeps its content width as the ceiling and may
            // shrink, but never grows past it or overflows its row.
            layout.maxWidth = hugW;
            layout.minWidth = '0';
          } else {
            layout.minWidth = hugW;
          }
        } else {
          // Auto-width type hugs its content too. Its drawn width is the
          // wrapping constraint and the ceiling, not a rigid box: a short
          // label in a narrow row has to be allowed to shrink.
          const textW = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          layout.width = textW;
          if (responsiveEnabled(options)) {
            layout.maxWidth = '100%';
            layout.minWidth = '0';
          } else {
            layout.minWidth = textW;
          }
        }
      } else if (isImplicitFill) {
        // Implicit fill. The row's children were drawn to fill it and this is
        // the one substantial element among them, so it takes the row's space
        // instead of holding the width it happened to be drawn at. Because the
        // row is packed, the result at the design width is the same width —
        // only the behaviour away from it changes: the element now grows and
        // shrinks with the row rather than pinning a length the rest of the
        // layout has to work around.
        //
        // In a bar the slot is a *flexible* one: it starts at nothing, grows
        // into the slack, and stops at the width it was drawn at. That cap is
        // what keeps a bar on one line. A flex line breaks on each item's
        // hypothetical size — its basis clamped by min/max — before any
        // shrinking is considered, so a slot carrying its drawn width as a
        // basis (700px in a 768px header) breaks the line even though it would
        // have been happy at 416px. Starting from zero makes the slot's floor
        // the thing the line is measured against, so the bar only breaks when
        // the slot can no longer be used.
        //
        // The cap also puts the slack back where the drawing had it: with
        // `space-between`, the slot stops at its drawn width and the alignment
        // distributes the remainder, so the trailing actions stay on the edge
        // they were drawn on. A bar whose children were drawn packed is the
        // opposite case — the leftover space belongs to the slot, so it drops
        // the cap and fills the line.
        const toolbarSlot = parentIsToolbar && parentSpreads;
        applyMainAxis(
          layout,
          mainAxisBox(
            {
              role: 'fill',
              drawnPx: nodeWidth,
              grow: true,
              floorPx: parentIsToolbar
                ? TOOLBAR_SLOT_MIN_PX
                : parentReflows
                  ? columnFloorPx(nodeWidth)
                  : 0,
              cap: toolbarSlot ? 'drawn' : 'full',
            },
            options
          )
        );
      } else if (node.type === 'TEXT') {
        const textNode = node as TextNode;
        const textChars = textNode.characters || '';
        const isAutoWidth = textNode.textAutoResize === 'WIDTH_AND_HEIGHT';
        const isExplicitWrap = textNode.textAutoResize === 'HEIGHT' || textNode.textAutoResize === 'NONE';

        let effectiveLineHeight = 0;
        const fs = typeof textNode.fontSize === 'number' ? textNode.fontSize : 16;
        if (textNode.lineHeight && typeof textNode.lineHeight === 'object') {
          if (textNode.lineHeight.unit === 'PIXELS') {
            effectiveLineHeight = textNode.lineHeight.value;
          } else if (textNode.lineHeight.unit === 'PERCENT') {
            effectiveLineHeight = fs * (textNode.lineHeight.value / 100);
          }
        }
        if (effectiveLineHeight <= 0) {
          effectiveLineHeight = fs * 1.25;
        }
        const isMultiLine = typeof textNode.height === 'number' && textNode.height > effectiveLineHeight * 1.35;

        if (isExplicitWrap || isMultiLine || textChars.includes('\n')) {
          layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          layout.maxWidth = '100%';
        } else if (isAutoWidth || (textChars.length <= 40 && nodeWidth <= 240)) {
          const textW = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          if (responsiveEnabled(options)) {
            layout.width = textW;
            layout.maxWidth = '100%';
            layout.minWidth = '0';
          } else {
            layout.minWidth = textW;
          }
        } else {
          layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          // A text block never overflows its container: the width above is the
          // wrapping constraint, not a fixed box.
          if (responsiveEnabled(options) && !layout.maxWidth) {
            layout.maxWidth = '100%';
          }
        }
      } else if (responsiveEnabled(options) && isProportionalRowChild(node, nodeWidth, nodeHeight)) {
        // Proportional flex: the element starts at its designed width, shrinks
        // alongside its siblings, and is capped at the design width so it never
        // grows past it. The row therefore scales smoothly instead of
        // overflowing. In a reflowing row the `min-width` floor lets the
        // browser wrap the column onto its own line; a packed grid drops the
        // cap so a card that wrapped fills the line it landed on.
        applyMainAxis(
          layout,
          mainAxisBox(
            {
              role: 'share',
              drawnPx: nodeWidth,
              grow: parentReflows,
              floorPx: parentReflows ? columnFloorPx(nodeWidth) : 0,
              floorToContent: isControlCluster(node),
              cap: parentIsPackedGrid ? 'full' : 'drawn',
            },
            options
          )
        );
      } else {
        // A control (icon, avatar, dot, chip, small button) keeps its intrinsic
        // size: squeezing an icon distorts it rather than adapting anything.
        applyMainAxis(
          layout,
          mainAxisBox({ role: 'fixed', drawnPx: nodeWidth, grow: false }, options)
        );
      }

      // Counter axis
      const padCounterStart = isVerticalParent
        ? ((parent as FrameNode).paddingLeft || 0)
        : ((parent as FrameNode).paddingTop || 0);
      const padCounterEnd = isVerticalParent
        ? ((parent as FrameNode).paddingRight || 0)
        : ((parent as FrameNode).paddingBottom || 0);
      const parentCounterDim = isVerticalParent ? (parent as FrameNode).width : (parent as FrameNode).height;
      const parentInnerCounter = parentCounterDim - padCounterStart - padCounterEnd;
      const childCounterDim = isVerticalParent ? nodeWidth : nodeHeight;

      const isCircleOrSquare =
        node.type === 'ELLIPSE' ||
        (Math.abs(nodeWidth - nodeHeight) <= 1 && (
          /(avatar|آواتار|circle|دایره|badge|icon|ic[-_]|point|dot)/i.test((node.name || '').trim()) ||
          ('cornerRadius' in node && typeof (node as any).cornerRadius === 'number' && (node as any).cornerRadius >= nodeWidth / 2 - 2) ||
          Boolean(parent && /(avatar|آواتار)/i.test((parent.name || '').trim()))
        ));

      // Whether this child spans its parent's counter axis. The test is a
      // property of the drawing rather than of Figma's sizing flag: a layer
      // dragged to its parent's inner edge — or to within a couple of pixels of
      // it — is filling that axis whatever the flag says. Text is included: a
      // text box drawn to the width of its card has to keep that relationship
      // when the card is resized, or the copy stops at a stale pixel width while
      // the card grows past it.
      const spansParentCounter =
        !isCircleOrSquare && isVerticalParent && spansContainer(childCounterDim, parentInnerCounter);

      if (isCircleOrSquare) {
        // Circles, avatars, and square icons must NEVER stretch along one axis (which creates ovals/ellipses)
        const dim = Math.min(nodeWidth, nodeHeight) || nodeWidth;
        const dimStr = formatUnit(dim, options.useRem, options.baseFontSize);
        layout.width = dimStr;
        layout.height = dimStr;
        layout.minWidth = dimStr;
        layout.minHeight = dimStr;
        layout.aspectRatio = '1 / 1';
        layout.flexShrink = 0;
        delete layout.alignSelf;
      } else if (align === 'STRETCH' || counterSizing === 'FILL' || spansParentCounter) {
        layout.alignSelf = 'stretch';
        if (isVerticalParent) layout.width = '100%';
        else layout.height = '100%';
      } else if (counterSizing === 'HUG' || (isVerticalParent ? autoW : autoH)) {
        if (node.type !== 'TEXT') {
          if (isVerticalParent) {
            const hugW = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
            layout.width = hugW;
            if (responsiveEnabled(options)) {
              layout.maxWidth = '100%';
              layout.minWidth = '0';
            } else {
              layout.minWidth = hugW;
            }
          } else {
            layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
            layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          }
        }
      } else {
        const fixedCounter = isVerticalParent ? nodeWidth : nodeHeight;
        if (isVerticalParent) {
          layout.width = formatUnit(fixedCounter, options.useRem, options.baseFontSize);
          // The designed width is a wrapping constraint, never a rigid box: the
          // element may shrink below it but can never overflow its parent.
          if (options.responsive && !layout.maxWidth) {
            layout.maxWidth = '100%';
          }
          if (node.type === 'TEXT') {
            layout.maxWidth = '100%';
          }
        } else {
          const isContainer = 'layoutMode' in node && node.layoutMode !== 'NONE' && hasChildren;
          if (options.responsive && isContainer && nodeHeight > HEADER_MAX_HEIGHT_PX) {
            layout.minHeight = formatUnit(fixedCounter, options.useRem, options.baseFontSize);
          } else {
            layout.height = formatUnit(fixedCounter, options.useRem, options.baseFontSize);
          }
        }
      }

      // Block-axis safeguard: a container or shape must never collapse below
      // the height it was drawn at, but it may grow when its content needs more
      // room — which is exactly what a wrapped column does on a phone.
      //
      // The inline axis is deliberately not touched here. It was decided once by
      // `mainAxisBox`, and re-imposing the drawn width as a `min-width` — which
      // is what this block used to do for anything without a literal `width` —
      // made every proportional item rigid: a flex item's `min-width` is a hard
      // floor, so a row whose items all carry their drawn width cannot compress
      // by a single pixel and overflows instead of reflowing.
      if (node.type !== 'TEXT' && !layout.height && layout.alignSelf !== 'stretch') {
        layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
      }

      // Once the parent regions row is too narrow to hold its regions side by
      // side, this region fills the line it lands on. The threshold is the row's
      // own wrap point, accumulated from the regions' sizes and the gaps between
      // them, so the stack takes over exactly where the layout stops fitting.
      if (parentStacksRegions && parent !== null && isStackableRegion(node)) {
        layout.stackFill = {
          maxInlineSize: formatUnit(rowWrapThresholdPx(parent, options), options.useRem, options.baseFontSize),
        };
      }

      // If parent contains preceding background absolute children, ensure this flex child has position: relative
      // and z-index: 1 so it paints cleanly on top of the background layer.
      const parentChildren = parent && 'children' in parent && Array.isArray(parent.children) ? parent.children : [];
      const myIdx = parentChildren.findIndex((c: any) => c === node || (c.id && c.id === node.id));
      const hasPrecedingAbsoluteChild =
        myIdx !== -1 &&
        parentChildren.some(
          (c: any, idx: number) =>
            idx < myIdx &&
            c.visible !== false &&
            c.layoutPositioning === 'ABSOLUTE'
        );

      if (hasPrecedingAbsoluteChild) {
        layout.position = 'relative';
        if (!layout.zIndex) {
          layout.zIndex = 1;
        }
      } else if (hasChildren && !layout.position) {
        layout.position = 'relative';
      }
    }
  } else {
    // Child inside non-AutoLayout container (Freeform Frame or Group)
    layout.position = 'absolute';

    // In Figma, GroupNode children coordinates are relative to Group's parent!
    const rawX = typeof node.x === 'number' ? node.x : 0;
    const rawY = typeof node.y === 'number' ? node.y : 0;
    const parentX = (parent && typeof (parent as any).x === 'number') ? (parent as any).x : 0;
    const parentY = (parent && typeof (parent as any).y === 'number') ? (parent as any).y : 0;
    let relX = parent.type === 'GROUP' ? rawX - parentX : rawX;
    let relY = parent.type === 'GROUP' ? rawY - parentY : rawY;

    // Use absoluteBoundingBox when available on unrotated elements.
    // In Figma, instance overrides (such as text changes in RTL) update the visual absoluteBoundingBox
    // on the canvas while node.x may remain stale at master component default.
    const isUnrotated =
      (!('rotation' in node) || (node as any).rotation === 0 || !(node as any).rotation) &&
      (!parent || !('rotation' in parent) || (parent as any).rotation === 0 || !(parent as any).rotation);

    if (
      isUnrotated &&
      'absoluteBoundingBox' in node &&
      node.absoluteBoundingBox &&
      parent &&
      'absoluteBoundingBox' in parent &&
      (parent as any).absoluteBoundingBox
    ) {
      const nodeBbox = node.absoluteBoundingBox;
      const parentBbox = (parent as any).absoluteBoundingBox;
      if (typeof nodeBbox.x === 'number' && typeof parentBbox.x === 'number') {
        relX = nodeBbox.x - parentBbox.x;
      }
      if (typeof nodeBbox.y === 'number' && typeof parentBbox.y === 'number') {
        relY = nodeBbox.y - parentBbox.y;
      }
    }

    const parentW = 'width' in parent && typeof parent.width === 'number' ? parent.width : 0;
    const parentH = 'height' in parent && typeof parent.height === 'number' ? parent.height : 0;
    const rawNodeW = 'width' in node && typeof node.width === 'number' ? node.width : 0;
    const rawNodeH = 'height' in node && typeof node.height === 'number' ? node.height : 0;

    // Check if node acts as full-bleed or covering background of parent frame
    const coversParent =
      parentW > 0 &&
      parentH > 0 &&
      relX <= 2 &&
      relY <= 2 &&
      rawNodeW >= parentW - 4 &&
      rawNodeH >= parentH - 4;

    const isFullBleed =
      coversParent ||
      (Math.abs(relX) <= 2 &&
        Math.abs(relY) <= 2 &&
        parentW > 0 &&
        parentH > 0 &&
        Math.abs(rawNodeW - parentW) <= 4 &&
        Math.abs(rawNodeH - parentH) <= 4);

    let adjustedX = relX;
    let adjustedY = relY;

    if (isFullBleed) {
      layout.left = '0px';
      layout.top = '0px';
      layout.width = '100%';
      layout.height = '100%';
      layout.objectFit = 'cover';
    } else {
      // In CSS box-sizing: border-box, absolute children align to parent padding-box (inside border).
      // Adjust offset so Figma's outer-frame coordinates remain aligned.
      let borderTop = 0;
      let borderLeft = 0;
      let parentStrokeAlign = 'INSIDE';
      const parentMainComp = getMainComponent(parent);
      if ('strokeAlign' in parent && typeof (parent as any).strokeAlign === 'string') {
        parentStrokeAlign = (parent as any).strokeAlign;
      } else if (parentMainComp && 'strokeAlign' in parentMainComp && typeof (parentMainComp as any).strokeAlign === 'string') {
        parentStrokeAlign = (parentMainComp as any).strokeAlign;
      }

      let parentStrokesIncluded = false;
      if ('strokesIncludedInLayout' in parent && typeof (parent as any).strokesIncludedInLayout === 'boolean') {
        parentStrokesIncluded = (parent as any).strokesIncludedInLayout;
      } else if (parentMainComp && 'strokesIncludedInLayout' in parentMainComp && typeof (parentMainComp as any).strokesIncludedInLayout === 'boolean') {
        parentStrokesIncluded = (parentMainComp as any).strokesIncludedInLayout;
      }

      // If parent stroke is OUTSIDE, or if AutoLayout explicitly EXCLUDES strokes from layout, do not offset children
      const isAutoLayoutParent = 'layoutMode' in parent && (parent as any).layoutMode !== 'NONE';
      const shouldOffsetBorder = parentStrokeAlign !== 'OUTSIDE' && (!isAutoLayoutParent || parentStrokesIncluded);

      if (shouldOffsetBorder && 'strokes' in parent && Array.isArray(parent.strokes) && parent.strokes.some((s) => s.visible !== false)) {
        if ('strokeTopWeight' in parent && typeof parent.strokeTopWeight === 'number') {
          borderTop = parent.strokeTopWeight || 0;
          borderLeft = parent.strokeLeftWeight || 0;
        } else if ('strokeWeight' in parent && typeof parent.strokeWeight === 'number') {
          borderTop = parent.strokeWeight || 0;
          borderLeft = parent.strokeWeight || 0;
        }
      }
      adjustedX = borderLeft > 0 ? relX - borderLeft : relX;
      adjustedY = borderTop > 0 ? relY - borderTop : relY;

      // In RTL contexts or when an element sits in the right half of an RTL container,
      // anchor it to the right so its distance from the right edge is preserved pixel-perfectly.
      const constraints: { horizontal?: string; vertical?: string } =
        'constraints' in node && node.constraints
          ? (node.constraints as { horizontal?: string; vertical?: string })
          : {};

      const isRtlParent = Boolean(
        parent &&
        'children' in parent &&
        Array.isArray(parent.children) &&
        parent.children.some(
          (c: any) => c.type === 'TEXT' && typeof c.characters === 'string' && isRtlText(c.characters)
        )
      );

      const isAnchoredRight =
        constraints.horizontal === 'MAX' ||
        (isRtlParent && parentW > 0 && adjustedX + rawNodeW / 2 > parentW / 2);

      if (isAnchoredRight) {
        const rightPx = parentW - adjustedX - rawNodeW;
        layout.right = formatUnit(rightPx, options.useRem, options.baseFontSize);
        delete layout.left;
      } else {
        layout.left = formatUnit(adjustedX, options.useRem, options.baseFontSize);
      }
      layout.top = formatUnit(adjustedY, options.useRem, options.baseFontSize);
    }

    // A freeform child that was drawn to span its parent — margins on either
    // side matching, covering almost the whole axis — is pinned to both edges
    // instead of being locked to the size it was drawn at, so the margin
    // around it stays fluid when the frame is resized. Anything smaller keeps
    // its drawn box: it is a card, not a band.
    const canInferAnchor =
      options.responsive === true && node.type !== 'TEXT' && !isFullBleed && parent.type !== 'GROUP';

    let spansH = canInferAnchor && !isHorizontallyHugging(node) && spansFreeformAxis(adjustedX, rawNodeW, parentW);
    let spansV = canInferAnchor && spansFreeformAxis(adjustedY, rawNodeH, parentH);

    if (spansH) {
      layout.left = formatUnit(adjustedX, options.useRem, options.baseFontSize);
      layout.right = formatUnit(parentW - adjustedX - rawNodeW, options.useRem, options.baseFontSize);
    }
    if (spansV) {
      layout.top = formatUnit(adjustedY, options.useRem, options.baseFontSize);
      layout.bottom = formatUnit(parentH - adjustedY - rawNodeH, options.useRem, options.baseFontSize);
    }

    // Anchor inference. A layer that is out of flow was placed by hand, and
    // Figma's constraint for it is very often left at the default — pin to the
    // top-left — even when the drawing plainly says otherwise: a dialog in the
    // middle of the page, a badge hugging the right edge, a band flush with the
    // bottom. Emitting `left` and `top` for all of them freezes the placement
    // at the size the frame happened to be drawn at, which is the one thing a
    // resize must not do. So the anchor is read back from where the layer sits
    // — a flush edge, or a centre that lands on the parent's centre — and an
    // explicit constraint always wins over that reading.
    if (canInferAnchor) {
      const constraints: { horizontal?: string; vertical?: string } =
        'constraints' in node && node.constraints
          ? (node.constraints as { horizontal?: string; vertical?: string })
          : {};

      if (!spansH) {
        const anchor = absoluteAnchor(
          constraints.horizontal,
          adjustedX,
          rawNodeW,
          parentW,
          isHorizontallyCenteredInParent(node, parent, relX, parentW)
        );
        applyAbsoluteAnchor(layout, 'horizontal', anchor, adjustedX, rawNodeW, parentW, options);
        if (anchor === 'stretch') spansH = true;
      }

      if (!spansV) {
        const anchor = absoluteAnchor(
          constraints.vertical,
          adjustedY,
          rawNodeH,
          parentH,
          isVerticallyCenteredFreeform(node, parent, relY, parentH)
        );
        applyAbsoluteAnchor(layout, 'vertical', anchor, adjustedY, rawNodeH, parentH, options);
        if (anchor === 'stretch') spansV = true;
      }
    }

    // Sizing & Alignment
    if (node.type === 'TEXT') {
      const textNode = node as TextNode;

      // Handle vertical alignment if defined on Figma TextNode
      if (textNode.textAlignVertical === 'CENTER') {
        layout.display = 'flex';
        layout.alignItems = 'center';
        if (textNode.textAlignHorizontal === 'CENTER') {
          layout.justifyContent = 'center';
        } else if (textNode.textAlignHorizontal === 'RIGHT') {
          layout.justifyContent = 'flex-end';
        } else {
          layout.justifyContent = 'flex-start';
        }
      }

      // Intelligently detect horizontal and vertical centering without hardcoded container size thresholds
      const isHorizontallyCentered = isHorizontallyCenteredInParent(node, parent, relX, parentW);
      const isVerticallyCentered = isVerticallyCenteredInParent(node, parent, relY, parentH);

      if (isHorizontallyCentered && isVerticallyCentered) {
        layout.left = '50%';
        layout.top = '50%';
        layout.transform = 'translate(-50%, -50%)';
      } else if (isHorizontallyCentered) {
        layout.left = '50%';
        layout.top = formatUnit(adjustedY, options.useRem, options.baseFontSize);
        layout.transform = 'translateX(-50%)';
      } else if (isVerticallyCentered) {
        layout.left = formatUnit(adjustedX, options.useRem, options.baseFontSize);
        layout.top = '50%';
        layout.transform = 'translateY(-50%)';
      } else {
        // Not centered. Check if RTL / right-aligned text is placed on the right side of parent
        const isRtl = isRtlText(textNode.characters);
        const isRightAligned = textNode.textAlignHorizontal === 'RIGHT' || isRtl;
        const isAnchoredRight = parentW > 0 && (adjustedX + node.width / 2 > parentW / 2);

        if (isRightAligned && isAnchoredRight) {
          const rightPx = parentW - adjustedX - node.width;
          layout.right = formatUnit(rightPx, options.useRem, options.baseFontSize);
          delete layout.left;
        } else {
          layout.left = formatUnit(adjustedX, options.useRem, options.baseFontSize);
        }
        layout.top = formatUnit(adjustedY, options.useRem, options.baseFontSize);
      }

      if (textNode.textAutoResize === 'WIDTH_AND_HEIGHT') {
        layout.width = 'fit-content';
        if (responsiveEnabled(options) || (textNode.characters && textNode.characters.includes('\n'))) {
          layout.maxWidth = '100%';
        }
      } else {
        layout.width = formatUnit(node.width, options.useRem, options.baseFontSize);
        layout.maxWidth = '100%';
      }

      if (textNode.textAutoResize !== 'NONE') {
        // Auto height
      } else {
        layout.height = formatUnit(node.height, options.useRem, options.baseFontSize);
      }
    } else {
      if ('layoutMode' in node && node.layoutMode !== 'NONE') {
        const isHugH =
          ('layoutSizingHorizontal' in node && node.layoutSizingHorizontal === 'HUG') ||
          (node.layoutMode === 'HORIZONTAL' && 'primaryAxisSizingMode' in node && (node as any).primaryAxisSizingMode === 'AUTO') ||
          (node.layoutMode === 'VERTICAL' && 'counterAxisSizingMode' in node && (node as any).counterAxisSizingMode === 'AUTO');

        const isHugV =
          ('layoutSizingVertical' in node && node.layoutSizingVertical === 'HUG') ||
          (node.layoutMode === 'VERTICAL' && 'primaryAxisSizingMode' in node && (node as any).primaryAxisSizingMode === 'AUTO') ||
          (node.layoutMode === 'HORIZONTAL' && 'counterAxisSizingMode' in node && (node as any).counterAxisSizingMode === 'AUTO');

        if (isHugH) {
          layout.width = 'fit-content';
          if (responsiveEnabled(options)) {
            layout.maxWidth = '100%';
          } else {
            layout.minWidth = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          }
        } else if (!spansH) {
          // A band pinned to both edges has no width of its own: emitting the
          // drawn length as well would contradict `left` + `right`.
          layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          if (options.responsive && !layout.maxWidth) {
            layout.maxWidth = '100%';
          }
        }

        if (isHugV) {
          layout.height = 'fit-content';
          layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
        } else if (!spansV) {
          layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
        }
      } else {
        if (!layout.width && !spansH) {
          layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          if (options.responsive && !layout.maxWidth) {
            layout.maxWidth = '100%';
          }
        }
        if (!layout.height && !spansV) {
          layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
        }
      }
    }
  }

  // Ensure container acts as a positioning context for absolute children:
  // 1. Non-autolayout containers with children (all children are positioned absolutely by default)
  // 2. AutoLayout frames that contain any visible absolute children (c.layoutPositioning === 'ABSOLUTE')
  const hasAbsoluteChild =
    hasChildren &&
    'children' in node &&
    Array.isArray(node.children) &&
    node.children.some((c: any) => {
      if (c.visible === false) return false;
      if (c.layoutPositioning === 'ABSOLUTE') return true;
      const cMain = getMainComponent(c);
      return cMain && (cMain as any).layoutPositioning === 'ABSOLUTE';
    });

  if (hasChildren && !layout.position && ((!('layoutMode' in node) || node.layoutMode === 'NONE') || hasAbsoluteChild)) {
    layout.position = 'relative';
  }

  // Min / Max constraints
  if ('minWidth' in node && typeof node.minWidth === 'number' && node.minWidth > 0) {
    layout.minWidth = formatUnit(node.minWidth, options.useRem, options.baseFontSize);
  }
  if ('maxWidth' in node && typeof node.maxWidth === 'number' && node.maxWidth > 0) {
    layout.maxWidth = formatUnit(node.maxWidth, options.useRem, options.baseFontSize);
  }
  if ('minHeight' in node && typeof node.minHeight === 'number' && node.minHeight > 0) {
    layout.minHeight = formatUnit(node.minHeight, options.useRem, options.baseFontSize);
  }
  if ('maxHeight' in node && typeof node.maxHeight === 'number' && node.maxHeight > 0) {
    layout.maxHeight = formatUnit(node.maxHeight, options.useRem, options.baseFontSize);
  }

  // Clips content
  if (isClipping) {
    const isHugFrame =
      parent !== null &&
      'layoutMode' in node &&
      node.layoutMode !== 'NONE' &&
      !('cornerRadius' in node && typeof node.cornerRadius === 'number' && node.cornerRadius > 0) &&
      !hasAbsoluteChild &&
      (('layoutSizingHorizontal' in node && node.layoutSizingHorizontal === 'HUG') ||
        (node.layoutMode === 'HORIZONTAL' && (node as any).primaryAxisSizingMode === 'AUTO') ||
        (node.layoutMode === 'VERTICAL' && (node as any).counterAxisSizingMode === 'AUTO'));

    // A blurred child is clipped by Figma exactly like a sharp one — the clip
    // belongs to the frame, not to the effect — so `clipsContent` alone decides
    // here. Exempting blur containers let every soft-edged decoration of a
    // component (a glass logo's gradient wash, its grain) spill across the page.
    if (!isHugFrame) {
      layout.overflow = 'hidden';
    }
  } else if ('children' in node && Array.isArray(node.children) && node.children.length > 0) {
    // If container has rounded corners (e.g. circle avatar) and contains image/ellipse children, clip them
    const hasRoundedShape =
      ('cornerRadius' in node && typeof node.cornerRadius === 'number' && node.cornerRadius > 0) ||
      (node as any).type === 'ELLIPSE' ||
      (mainComp && 'cornerRadius' in mainComp && typeof mainComp.cornerRadius === 'number' && mainComp.cornerRadius > 0);
    const hasImageChild = node.children.some(
      (c) =>
        (c as any).type === 'ELLIPSE' ||
        ('fills' in c && Array.isArray(c.fills) && (c.fills as any[]).some((f: any) => f.type === 'IMAGE'))
    );
    if (hasRoundedShape && hasImageChild) {
      layout.overflow = 'hidden';
    }
  }

  // Fidelity: individual stroke weights inflate Figma bounds — mirror via outline
  // so absolutely-positioned siblings don't shift (CSS borders affect layout).
  if (
    'strokeTopWeight' in node &&
    'strokeRightWeight' in node &&
    'strokeBottomWeight' in node &&
    'strokeLeftWeight' in node
  ) {
    const st = node.strokeTopWeight || 0;
    const sr = node.strokeRightWeight || 0;
    const sb = node.strokeBottomWeight || 0;
    const sl = node.strokeLeftWeight || 0;
    if (st !== sr || st !== sb || st !== sl) {
      // Uneven strokes already emitted per-side; ensure border-box accounting
      layout.boxSizing = 'border-box';
    }
  }

  // Constraints API — Figma resize behaviour for absolute children.
  // Previously dropped entirely, causing scale/center layouts to break.
  if ('constraints' in node && node.constraints && typeof node.constraints === 'object') {
    const h = (node.constraints as { horizontal?: string }).horizontal;
    const v = (node.constraints as { vertical?: string }).vertical;
    if (h && h !== 'MIN' && v && v !== 'MIN') {
      layout.constraints = { horizontal: h, vertical: v };
    }

    // RIGHT constraint
    if (h === 'MAX' && layout.position === 'absolute' && parent && 'width' in parent && layout.right === undefined) {
      const parentW = parent.width;
      const leftPx = typeof layout.left === 'string' && !layout.left.endsWith('%') ? parseFloat(layout.left) : (typeof node.x === 'number' ? node.x : 0);
      const rightPx = parentW - leftPx - node.width;
      layout.right = formatUnit(rightPx, options.useRem, options.baseFontSize);
      delete layout.left;
    }

    // BOTTOM constraint
    if (v === 'MAX' && layout.position === 'absolute' && parent && 'height' in parent) {
      const parentH = parent.height;
      const topPx = typeof layout.top === 'string' && !layout.top.endsWith('%') ? parseFloat(layout.top) : (typeof node.y === 'number' ? node.y : 0);
      const bottomPx = parentH - topPx - node.height;
      layout.bottom = formatUnit(bottomPx, options.useRem, options.baseFontSize);
      delete layout.top;
    }

    // STRETCH horizontal: pin both sides instead of fixed width
    if (h === 'STRETCH' && layout.position === 'absolute' && parent && 'width' in parent) {
      const parentW = parent.width;
      const leftPx = typeof layout.left === 'string' && !layout.left.endsWith('%') ? parseFloat(layout.left) : (typeof node.x === 'number' ? node.x : 0);
      const rightPx = parentW - leftPx - node.width;
      layout.left = formatUnit(leftPx, options.useRem, options.baseFontSize);
      layout.right = formatUnit(rightPx, options.useRem, options.baseFontSize);
      delete layout.width;
      if (layout.transform) {
        layout.transform = layout.transform.replace('translateX(-50%)', '').trim();
        if (!layout.transform) delete layout.transform;
      }
    }
    // STRETCH vertical: pin both sides instead of fixed height
    if (v === 'STRETCH' && layout.position === 'absolute' && parent && 'height' in parent) {
      const parentH = parent.height;
      const topPx = typeof layout.top === 'string' && !layout.top.endsWith('%') ? parseFloat(layout.top) : (typeof node.y === 'number' ? node.y : 0);
      const bottomPx = parentH - topPx - node.height;
      layout.top = formatUnit(topPx, options.useRem, options.baseFontSize);
      layout.bottom = formatUnit(bottomPx, options.useRem, options.baseFontSize);
      delete layout.height;
      if (layout.transform) {
        layout.transform = layout.transform.replace('translateY(-50%)', '').trim();
        if (!layout.transform) delete layout.transform;
      }
    }
    // CENTER constraints: Figma's `CENTER` pins the layer *relative to the
    // centre axis* — the distance between the layer's centre and the frame's
    // centre is what has to survive a resize, not the layer's offset from the
    // left edge. Emitting `left: Npx` therefore broke the very relationship the
    // constraint describes. It is expressed as `calc(50% ± offset)` with the
    // layer's own centre pulled back by half its width, which renders pixel
    // identical at the drawn size and keeps the offset from the centre at every
    // other size. A layer already sitting on the centre line collapses to plain
    // `50%`.
    if (layout.position === 'absolute' && parent && 'width' in parent) {
      const parentW = typeof parent.width === 'number' ? parent.width : 0;
      const parentH = ('height' in parent && typeof parent.height === 'number') ? parent.height : 0;
      const rawNodeW = typeof node.width === 'number' ? node.width : 0;
      const rawNodeH = typeof node.height === 'number' ? node.height : 0;
      let curRelX = typeof node.x === 'number' ? node.x : 0;
      let curRelY = typeof node.y === 'number' ? node.y : 0;
      if (
        'absoluteBoundingBox' in node &&
        node.absoluteBoundingBox &&
        'absoluteBoundingBox' in parent &&
        (parent as any).absoluteBoundingBox
      ) {
        const nb = node.absoluteBoundingBox;
        const pb = (parent as any).absoluteBoundingBox;
        if (typeof nb.x === 'number' && typeof pb.x === 'number') curRelX = nb.x - pb.x;
        if (typeof nb.y === 'number' && typeof pb.y === 'number') curRelY = nb.y - pb.y;
      }

      const isAutoWidthText = node.type === 'TEXT' && (node as TextNode).textAutoResize === 'WIDTH_AND_HEIGHT';
      const isRightOrRtlNotCenter = node.type === 'TEXT' && (
        (node as TextNode).textAlignHorizontal === 'RIGHT' ||
        (isRtlText((node as TextNode).characters) && (node as TextNode).textAlignHorizontal !== 'CENTER')
      );

      // A layer that hangs outside its parent was deliberately placed over the
      // edge, so it is not centred whatever the constraint says.
      const isOverhangingX = curRelX < -0.5 || (parentW > 0 && curRelX + rawNodeW > parentW + 0.5);
      const isOverhangingY = curRelY < -0.5 || (parentH > 0 && curRelY + rawNodeH > parentH + 0.5);

      const isCenterH =
        h === 'CENTER' && !isOverhangingX && parentW > 0 && !isRightOrRtlNotCenter && layout.right === undefined;
      const isCenterV = v === 'CENTER' && !isOverhangingY && parentH > 0 && layout.bottom === undefined;

      const unit = (value: number) => formatUnit(value, options.useRem, options.baseFontSize);
      const centeredOffset = (offsetPx: number): string => {
        const rounded = Math.round(offsetPx);
        if (rounded === 0) return '50%';
        return rounded > 0 ? `calc(50% + ${unit(rounded)})` : `calc(50% - ${unit(-rounded)})`;
      };

      const centerOffsetH = parentW > 0 ? curRelX + rawNodeW / 2 - parentW / 2 : 0;
      const centerOffsetV = parentH > 0 ? curRelY + rawNodeH / 2 - parentH / 2 : 0;

      if (isCenterH && isCenterV) {
        layout.left = centeredOffset(centerOffsetH);
        layout.top = centeredOffset(centerOffsetV);
        layout.transform = 'translate(-50%, -50%)';
        if (!isAutoWidthText) {
          layout.width = formatUnit(node.width, options.useRem, options.baseFontSize);
        }
      } else if (isCenterH) {
        layout.left = centeredOffset(centerOffsetH);
        layout.transform = addTransform(layout.transform, 'translateX(-50%)');
        if (!isAutoWidthText) {
          layout.width = formatUnit(node.width, options.useRem, options.baseFontSize);
        }
      } else if (isCenterV) {
        layout.top = centeredOffset(centerOffsetV);
        layout.transform = addTransform(layout.transform, 'translateY(-50%)');
      }
    }
    // SCALE: fluid percentage sizing so resize matches Figma proportionally
    if ((h === 'SCALE' || v === 'SCALE') && parent && 'width' in parent && 'height' in parent) {
      if (h === 'SCALE' && parent.width > 0) {
        const pct = Math.round((node.width / parent.width) * 10000) / 100;
        layout.width = `${pct}%`;
      }
      if (v === 'SCALE' && parent.height > 0) {
        const pct = Math.round((node.height / parent.height) * 10000) / 100;
        layout.height = `${pct}%`;
      }
    }
  }

  // An out-of-flow box is capped by the space its offsets leave, not by the
  // containing block. Applied last, because it depends on the anchor and the
  // width that the branches above finally settled on.
  if (responsiveEnabled(options) && layout.position === 'absolute') {
    const cap = absoluteInlineCap(layout);
    if (cap) layout.maxWidth = cap;
  }

  // Which branch set a dimension is irrelevant here: only after all of them
  // have run is the value known. A dimension that still equals the design
  // value can keep its variable name; a percentage, `100%` or a fluid cap is
  // a different number and stays literal.
  const dimensionWithToken = (
    value: string | undefined,
    field: 'width' | 'height' | 'minWidth' | 'maxWidth' | 'minHeight' | 'maxHeight',
    px: number
  ): string | undefined => {
    if (value === undefined || !(px > 0)) return value;
    if (value !== formatUnit(px, options.useRem, options.baseFontSize)) return value;
    return resolver.lengthFor(TokenResolver.boundId(node, field), px) ?? value;
  };
  layout.width = dimensionWithToken(layout.width, 'width', nodeWidth);
  layout.height = dimensionWithToken(layout.height, 'height', nodeHeight);
  layout.minWidth = dimensionWithToken(layout.minWidth, 'minWidth', nodeWidth);
  layout.minHeight = dimensionWithToken(layout.minHeight, 'minHeight', nodeHeight);
  layout.maxWidth = dimensionWithToken(layout.maxWidth, 'maxWidth', nodeWidth);
  layout.maxHeight = dimensionWithToken(layout.maxHeight, 'maxHeight', nodeHeight);

  return layout;
}
