import { LayoutStyles, ConversionOptions } from '../types/ir';
import { formatUnit, getMainComponent, getNodeBoxDimensions, getChildrenMaxOutsideStroke } from './utils';
import { TokenResolver, TokenRegistry } from '../../shared/token-resolver';
import {
  CENTER_TOLERANCE_PX,
  SMALL_CONTAINER_MAX_WIDTH,
  SMALL_CONTAINER_MAX_HEIGHT,
} from '../../shared/constants';

/**
 * Extracts comprehensive CSS layout properties from a Figma scene node
 */
export function extractLayout(
  node: SceneNode,
  parent: SceneNode | null,
  options: ConversionOptions,
  tokenRegistry?: TokenRegistry
): LayoutStyles {
  const layout: LayoutStyles = {};
  const resolver = new TokenResolver(tokenRegistry);
  const isAutoLayoutParent = parent && 'layoutMode' in parent && parent.layoutMode !== 'NONE';
  const hasChildren = 'children' in node && node.children.length > 0;

  const boxDims = getNodeBoxDimensions(node);
  const childOutsideSw = getChildrenMaxOutsideStroke(node);
  const isAutoLayout = 'layoutMode' in node && node.layoutMode !== 'NONE';
  const parentStrokesIncluded = Boolean(
    'strokesIncludedInLayout' in node && (node as any).strokesIncludedInLayout
  );
  // Extra size needed on parent container if children have outside strokes not included in layout:
  const extraChildSw = isAutoLayout && !parentStrokesIncluded ? childOutsideSw : 0;

  const nodeWidth = boxDims.width + (boxDims.outsideStrokeWeight === 0 ? extraChildSw * 2 : 0);
  const nodeHeight = boxDims.height + (boxDims.outsideStrokeWeight === 0 ? extraChildSw * 2 : 0);

  // 1. Check if current node is an AutoLayout container
  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    layout.display = 'flex';
    layout.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';

    // In Figma, AutoLayout frames follow Figma coordinate orientation:
    // Left-to-right (horizontal) or top-to-bottom (vertical with counter-axis left=min, right=max).
    // Setting direction: ltr on all AutoLayout frames ensures that flex-start = Top/Left and flex-end = Bottom/Right,
    // avoiding RTL inversions in flexbox containers.
    layout.direction = 'ltr';
    // AutoLayout container establishes positioning context for absolute children
    layout.position = 'relative';

    // Flex Wrap
    if ('layoutWrap' in node && node.layoutWrap === 'WRAP') {
      layout.flexWrap = 'wrap';
      if ('counterAxisSpacing' in node && typeof node.counterAxisSpacing === 'number' && node.counterAxisSpacing > 0) {
        if (node.layoutMode === 'HORIZONTAL') {
          layout.rowGap = formatUnit(node.counterAxisSpacing, options.useRem, options.baseFontSize);
        } else {
          layout.columnGap = formatUnit(node.counterAxisSpacing, options.useRem, options.baseFontSize);
        }
      }
    }

    // Gap (item spacing)
    let boundGap: string | null = null;
    const boundGapId = TokenResolver.boundId(node, 'itemSpacing');
    if (boundGapId) {
      boundGap = resolver.varFor(boundGapId);
    }

    if (boundGap) {
      layout.gap = boundGap;
    } else if (typeof node.itemSpacing === 'number' || extraChildSw > 0) {
      const rawItemSpacing = typeof node.itemSpacing === 'number' ? node.itemSpacing : 0;
      const effectiveItemSpacing = rawItemSpacing - 2 * extraChildSw;

      if (effectiveItemSpacing > 0) {
        const gapVal = formatUnit(effectiveItemSpacing, options.useRem, options.baseFontSize);
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

    // Padding
    const pt = node.paddingTop || 0;
    const pr = node.paddingRight || 0;
    const pb = node.paddingBottom || 0;
    const pl = node.paddingLeft || 0;
    if (pt > 0 || pr > 0 || pb > 0 || pl > 0) {
      layout.padding = { top: pt, right: pr, bottom: pb, left: pl };
    }
  }

  // 2. Positioning & Sizing logic
  if (!parent) {
    // Root selected node: establish relative container with width & height
    layout.position = 'relative';
    layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
    layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
    layout.boxSizing = 'border-box';
    if ('clipsContent' in node && node.clipsContent) {
      layout.overflow = 'hidden';
    }
  } else if (isAutoLayoutParent) {
    // Child inside AutoLayout parent
    if ('layoutPositioning' in node && node.layoutPositioning === 'ABSOLUTE') {
      // Explicit absolute child inside AutoLayout frame
      layout.position = 'absolute';
      layout.left = formatUnit(node.x, options.useRem, options.baseFontSize);
      layout.top = formatUnit(node.y, options.useRem, options.baseFontSize);
      layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
      layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
    } else {
      // Normal flex child — unified primary/counter axis handling.
      // Primary axis: grow/fill -> flex:1; HUG -> fit-content; FIXED -> px.
      const parentMode = (parent as FrameNode).layoutMode;
      const isVerticalParent = parentMode === 'VERTICAL';
      layout.flexShrink = 0; // Prevent flex elements from shrinking unexpectedly

      const sizingH = 'layoutSizingHorizontal' in node ? node.layoutSizingHorizontal : undefined;
      const sizingV = 'layoutSizingVertical' in node ? node.layoutSizingVertical : undefined;
      const align = 'layoutAlign' in node ? node.layoutAlign : undefined;
      const grow = 'layoutGrow' in node ? node.layoutGrow === 1 : false;
      const autoW = node.type === 'TEXT' && (node as TextNode).textAutoResize === 'WIDTH_AND_HEIGHT';
      const autoH = node.type === 'TEXT' && (node as TextNode).textAutoResize !== 'NONE';

      const primarySizing = isVerticalParent ? sizingV : sizingH;
      const counterSizing = isVerticalParent ? sizingH : sizingV;

      // Primary axis
      if (grow || primarySizing === 'FILL') {
        layout.flexGrow = 1;
        layout.flexBasis = '0%';
        if (node.type !== 'TEXT') {
          const size = isVerticalParent ? nodeHeight : nodeWidth;
          if (isVerticalParent) layout.minHeight = formatUnit(size, options.useRem, options.baseFontSize);
          else layout.minWidth = formatUnit(size, options.useRem, options.baseFontSize);
        }
      } else if (primarySizing === 'HUG' || (isVerticalParent ? autoH : autoW)) {
        // Hug sizing: safeguard min dimension so containers (like OTP boxes) never collapse
        if (node.type !== 'TEXT') {
          const fixedPrimary = isVerticalParent ? nodeHeight : nodeWidth;
          if (isVerticalParent) {
            layout.minHeight = formatUnit(fixedPrimary, options.useRem, options.baseFontSize);
          } else {
            layout.minWidth = formatUnit(fixedPrimary, options.useRem, options.baseFontSize);
          }
        }
      } else {
        const fixedPrimary = isVerticalParent ? nodeHeight : nodeWidth;
        if (isVerticalParent) layout.height = formatUnit(fixedPrimary, options.useRem, options.baseFontSize);
        else layout.width = formatUnit(fixedPrimary, options.useRem, options.baseFontSize);
      }

      // Counter axis
      if (align === 'STRETCH' || counterSizing === 'FILL') {
        layout.alignSelf = 'stretch';
        if (isVerticalParent) layout.width = '100%';
        else layout.height = '100%';
      } else if (counterSizing === 'HUG' || (isVerticalParent ? autoW : autoH)) {
        if (node.type !== 'TEXT') {
          if (isVerticalParent) {
            layout.minWidth = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          } else {
            layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          }
        }
      } else {
        const fixedCounter = isVerticalParent ? nodeWidth : nodeHeight;
        if (isVerticalParent) layout.width = formatUnit(fixedCounter, options.useRem, options.baseFontSize);
        else layout.height = formatUnit(fixedCounter, options.useRem, options.baseFontSize);
      }

      // For any container or shape (e.g. OTP boxes, slots, icons, dividers),
      // ensure both dimensions are safeguarded from Figma bounds so they never collapse:
      if (node.type !== 'TEXT') {
        if (!layout.height && layout.alignSelf !== 'stretch') {
          layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
        }
        if (!layout.width && layout.flexGrow !== 1) {
          layout.minWidth = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
        }
      }

      // If child has children, ensure it acts as a positioning context for nested elements
      if (hasChildren && !layout.position) {
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
    const relX = parent.type === 'GROUP' ? rawX - parentX : rawX;
    const relY = parent.type === 'GROUP' ? rawY - parentY : rawY;

    const parentW = 'width' in parent && typeof parent.width === 'number' ? parent.width : 0;
    const parentH = 'height' in parent && typeof parent.height === 'number' ? parent.height : 0;
    const rawNodeW = 'width' in node && typeof node.width === 'number' ? node.width : 0;
    const rawNodeH = 'height' in node && typeof node.height === 'number' ? node.height : 0;

    const isFullBleed =
      Math.abs(relX) < 1 &&
      Math.abs(relY) < 1 &&
      parentW > 0 &&
      parentH > 0 &&
      Math.abs(rawNodeW - parentW) < 1 &&
      Math.abs(rawNodeH - parentH) < 1;

    if (isFullBleed) {
      layout.left = '0px';
      layout.top = '0px';
      layout.width = '100%';
      layout.height = '100%';
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
      const adjustedX = borderLeft > 0 ? relX - borderLeft : relX;
      const adjustedY = borderTop > 0 ? relY - borderTop : relY;
      layout.left = formatUnit(adjustedX, options.useRem, options.baseFontSize);
      layout.top = formatUnit(adjustedY, options.useRem, options.baseFontSize);
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

      // Check if text is centered inside a button, badge, circular gauge, or pill frame
      const isParentSmallContainer =
        'width' in parent && 'height' in parent &&
        parent.width <= SMALL_CONTAINER_MAX_WIDTH && parent.height <= SMALL_CONTAINER_MAX_HEIGHT;
      const isHorizontallyCentered =
        isParentSmallContainer &&
        'width' in parent &&
        Math.abs(relX + node.width / 2 - parent.width / 2) < CENTER_TOLERANCE_PX;
      const isVerticallyCentered =
        isParentSmallContainer &&
        'height' in parent &&
        Math.abs(relY + node.height / 2 - parent.height / 2) < CENTER_TOLERANCE_PX;

      if (isHorizontallyCentered && isVerticallyCentered) {
        layout.left = '50%';
        layout.top = '50%';
        layout.transform = 'translate(-50%, -50%)';
      } else if (isHorizontallyCentered) {
        layout.left = '50%';
        layout.top = formatUnit(relY, options.useRem, options.baseFontSize);
        layout.transform = 'translateX(-50%)';
      } else if (isVerticallyCentered) {
        layout.left = formatUnit(relX, options.useRem, options.baseFontSize);
        layout.top = '50%';
        layout.transform = 'translateY(-50%)';
      } else {
        layout.left = formatUnit(relX, options.useRem, options.baseFontSize);
        layout.top = formatUnit(relY, options.useRem, options.baseFontSize);
      }

      if (textNode.textAutoResize === 'WIDTH_AND_HEIGHT') {
        layout.width = 'fit-content';
      } else {
        layout.width = formatUnit(node.width, options.useRem, options.baseFontSize);
      }

      if (textNode.textAutoResize !== 'NONE') {
        // Auto height
      } else {
        layout.height = formatUnit(node.height, options.useRem, options.baseFontSize);
      }
    } else {
      if ('layoutMode' in node && node.layoutMode !== 'NONE') {
        if ('layoutSizingHorizontal' in node && node.layoutSizingHorizontal === 'HUG') {
          layout.width = 'fit-content';
          layout.minWidth = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
        } else {
          layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
        }

        if ('layoutSizingVertical' in node && node.layoutSizingVertical === 'HUG') {
          layout.height = 'fit-content';
          layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
        } else {
          layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
        }
      } else {
        if (!layout.width) {
          layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
        }
        if (!layout.height) {
          layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
        }
      }
    }
  }

  // Ensure non-autolayout container with children acts as a positioning context
  if (hasChildren && (!('layoutMode' in node) || node.layoutMode === 'NONE') && !layout.position) {
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
  const mainComp = getMainComponent(node);
  const isClipping =
    ('clipsContent' in node && Boolean(node.clipsContent)) ||
    (mainComp && 'clipsContent' in mainComp && Boolean(mainComp.clipsContent));

  if (isClipping) {
    layout.overflow = 'hidden';
  } else if ('children' in node && Array.isArray(node.children) && node.children.length > 0) {
    // If container has rounded corners (e.g. circle avatar) and contains image/ellipse children, clip them
    const hasRoundedShape =
      ('cornerRadius' in node && typeof node.cornerRadius === 'number' && node.cornerRadius > 0) ||
      node.type === 'ELLIPSE' ||
      (mainComp && 'cornerRadius' in mainComp && typeof mainComp.cornerRadius === 'number' && mainComp.cornerRadius > 0);
    const hasImageChild = node.children.some(
      (c) =>
        c.type === 'ELLIPSE' ||
        ('fills' in c && Array.isArray(c.fills) && c.fills.some((f) => f.type === 'IMAGE'))
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
    // STRETCH horizontal: pin both sides instead of fixed width
    if (h === 'STRETCH' && layout.position === 'absolute' && parent && 'width' in parent) {
      const parentW = parent.width;
      const leftPx = typeof layout.left === 'string' ? parseFloat(layout.left) || node.x : node.x;
      const rightPx = Math.max(0, parentW - leftPx - node.width);
      layout.left = formatUnit(leftPx, options.useRem, options.baseFontSize);
      layout.right = formatUnit(rightPx, options.useRem, options.baseFontSize);
      delete layout.width;
    }
    // CENTER horizontal: optical centering via 50% + translate
    if (h === 'CENTER' && layout.position === 'absolute' && parent && 'width' in parent) {
      layout.left = '50%';
      layout.transform = layout.transform
        ? `${layout.transform} translateX(-50%)`
        : 'translateX(-50%)';
      layout.width = formatUnit(node.width, options.useRem, options.baseFontSize);
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

  return layout;
}
