import { IRNode, ConversionOptions, VisualStyles, AssetData } from '../types/ir';
import { detectCheckableKind, sanitizeClassName, detectSemanticTag, formatUnit } from './utils';
import { extractLayout, isStackingRegionRow, spansContainer } from './layout';
import { extractVisualStyles } from './styles';
import { extractTypography } from './typography';
import { applyCheckableSemantics, applyFormControlSemantics } from './form-controls';
import { isMaskNode, maskClipsFor, type MaskClip } from './masks';
import { needsIsolation } from './blend';
import { hyperlinkUrl } from './links';
import { looksTabular } from '../../shared/tabular';
import { shouldExportAsSingleVector, hasImageFill, exportVectorAsSvg, exportNodeAsImage } from './assets';
import { TokenRegistry, TokenResolver } from '../../shared/token-resolver';

/**
 * Recursively converts a Figma SceneNode into an Intermediate Representation (IRNode) tree
 *
 * @param containerWidthPx - Design width of the nearest element that will be a
 *   CSS query container at runtime (the page root, or a stacked regions row).
 *   Fluid type is expressed in container units, so the converter has to know
 *   which box will resolve them: using the page width for text inside a 296px
 *   rail would scale the type by the ratio of two unrelated boxes.
 */
export async function convertNodeToIR(
  node: SceneNode,
  parent: SceneNode | null,
  options: ConversionOptions,
  tokenRegistry?: TokenRegistry,
  parentClassName?: string,
  existingNamesSet: Set<string> = new Set<string>(),
  containerWidthPx?: number
): Promise<IRNode | null> {
  const ir = await convertNodeBody(
    node,
    parent,
    options,
    tokenRegistry,
    parentClassName,
    existingNamesSet,
    containerWidthPx
  );
  if (!ir) return null;

  // Variable modes are part of the picture, not just the token definitions: a
  // node resolved in a non-default mode must carry that mode's class so the
  // custom properties it uses hold the mode's values. Kept at the node where
  // the mode changes — descendants inherit through the cascade.
  if (tokenRegistry) {
    const themeResolver = new TokenResolver(tokenRegistry, { node, parent });
    const themeClasses = themeResolver.themeClassesFor(node);
    if (themeClasses.length > 0) ir.themeClasses = themeClasses;
  }

  // A component instance records the master it came from and nothing else: the
  // node is still converted from its own properties, which is what carries the
  // overrides. Deciding what to do with the link is the registry's job, so an
  // export that never runs the registry behaves exactly as before.
  if (node.type === 'INSTANCE') {
    const master = (node as unknown as { _resolvedMainComponent?: ComponentNode })._resolvedMainComponent;
    if (master && master.id) {
      ir.componentRef = { id: master.id, name: master.name };
    }
  }

  return ir;
}

async function convertNodeBody(
  node: SceneNode,
  parent: SceneNode | null,
  options: ConversionOptions,
  tokenRegistry?: TokenRegistry,
  parentClassName?: string,
  existingNamesSet: Set<string> = new Set<string>(),
  containerWidthPx?: number
): Promise<IRNode | null> {
  // Skip hidden nodes
  if (!node.visible) {
    return null;
  }

  // If node is an INSTANCE, resolve mainComponent asynchronously (required for documentAccess: dynamic-page)
  if (node.type === 'INSTANCE') {
    const inst = node as InstanceNode;
    if (typeof inst.getMainComponentAsync === 'function') {
      try {
        const resolved = await inst.getMainComponentAsync();
        if (resolved) {
          (inst as unknown as Record<string, unknown>)._resolvedMainComponent = resolved;
        }
      } catch {}
    } else {
      try {
        if ('mainComponent' in inst && inst.mainComponent) {
          (inst as unknown as Record<string, unknown>)._resolvedMainComponent = inst.mainComponent;
        }
      } catch {}
    }
  }

  const className = sanitizeClassName(node.name, node.id, parentClassName, existingNamesSet);
  const tag = detectSemanticTag(node, options.semanticTags);
  const isRoot = parent === null;

  // Which box will resolve this subtree's fluid type. The page root is its own
  // query container; a stacked regions row becomes one too, and then it — not
  // the page — is the width its descendants are measured against.
  const nodeWidthPx = 'width' in node && typeof node.width === 'number' ? node.width : 0;
  const typeContainerWidth =
    isRoot || isStackingRegionRow(node, options) ? nodeWidthPx : containerWidthPx ?? nodeWidthPx;

  // 1. Handle Vector / Illustration / Icon nodes (unified SVG export)
  if (shouldExportAsSingleVector(node, isRoot)) {
    const layout = extractLayout(node, parent, options, tokenRegistry);
    // For vector assets, all visual properties (fills, strokes/borders, border-radius, shadows)
    // are self-contained within the exported SVG.
    // CSS borders, backgrounds, or radii on the wrapper div duplicate graphics and distort the SVG.
    const rawVisual = extractVisualStyles(node, options, tokenRegistry, parent);
    const visual: VisualStyles = {};
    if (rawVisual.opacity !== undefined) visual.opacity = rawVisual.opacity;
    if (rawVisual.transform) visual.transform = rawVisual.transform;
    if (rawVisual.mixBlendMode) visual.mixBlendMode = rawVisual.mixBlendMode;

    const asset = await exportVectorAsSvg(node);

    return {
      id: node.id,
      name: node.name,
      className,
      tag: 'div',
      type: node.type,
      layout,
      visual,
      asset: asset || undefined,
      children: [],
    };
  }

  // 2. Handle Image fill nodes (frames / rectangles filled with images without text children)
  if (hasImageFill(node) && (!('children' in node) || node.children.length === 0)) {
    const layout = extractLayout(node, parent, options, tokenRegistry);
    const visual = extractVisualStyles(node, options, tokenRegistry, parent);
    // A replaced element has no pseudo-elements, so a gradient ring cannot be
    // drawn on an `<img>` — and it does not need to be: the exported bitmap is
    // the node as Figma renders it, strokes included.
    delete visual.gradientBorder;
    const asset = await exportNodeAsImage(node, options);

    if (!asset) {
      // If asset export failed, preserve container structure and background styles
      return {
        id: node.id,
        name: node.name,
        className,
        tag: 'div',
        type: node.type,
        layout,
        visual,
        children: [],
      };
    }

    // Image tags render pixel content via src; strip placeholder background layers
    delete visual.background;
    delete visual.backgroundSize;
    delete visual.backgroundRepeat;
    delete visual.backgroundPosition;

    // Prevent duplicate concentric borders when parent container already defines border/stroke
    // AND this image child is a full-bleed layer matching the parent container bounds.
    const isFullBleedOfParent = Boolean(
      parent &&
      'width' in parent &&
      'height' in parent &&
      Math.abs(node.width - parent.width) < 1 &&
      Math.abs(node.height - parent.height) < 1
    );

    const parentHasVisibleStroke = Boolean(
      parent &&
      'strokes' in parent &&
      Array.isArray(parent.strokes) &&
      parent.strokes.some((s) => s.visible !== false)
    );

    if (isFullBleedOfParent && parentHasVisibleStroke) {
      delete visual.border;
      delete visual.borderTop;
      delete visual.borderRight;
      delete visual.borderBottom;
      delete visual.borderLeft;
      delete visual.outline;
      if (visual.boxShadow && visual.boxShadow.startsWith('0 0 0 ')) {
        delete visual.boxShadow;
      }
    }

    // Smart detection for QR codes, barcodes, and scan images
    const isQrOrBarcode =
      /(qr|scan|barcode|بارکد|کیو[-_\s]?آر)/i.test(node.name) ||
      Boolean(parent && /(qr|scan|barcode|بارکد|کیو[-_\s]?آر)/i.test(parent.name));

    if (isQrOrBarcode) {
      layout.objectFit = 'contain';
      // QR codes are inherently square (1:1 aspect ratio)
      const ratio = node.width > 0 && node.height > 0 ? node.width / node.height : 1;
      if (ratio >= 0.75 && ratio <= 1.33) {
        layout.aspectRatio = '1 / 1';
      }
    }

    // Check parent bounds to prevent 3x/2x Retina image exports from blowing out container bounds
    let parentInnerW = 0;
    if (parent && 'width' in parent && typeof parent.width === 'number') {
      const pl = ('paddingLeft' in parent && typeof (parent as any).paddingLeft === 'number') ? (parent as any).paddingLeft : 0;
      const pr = ('paddingRight' in parent && typeof (parent as any).paddingRight === 'number') ? (parent as any).paddingRight : 0;
      parentInnerW = parent.width - pl - pr;
    }

    const matchesParentWidth = parentInnerW > 0 && spansContainer(node.width, parentInnerW);
    const isQrInContainer = isQrOrBarcode && parentInnerW > 0 && spansContainer(node.width, parentInnerW);

    const figmaW = formatUnit(node.width, options.useRem, options.baseFontSize);
    const figmaH = formatUnit(node.height, options.useRem, options.baseFontSize);

    const isCoveringBackground =
      layout.position === 'absolute' &&
      layout.width === '100%' &&
      layout.height === '100%';

    const isCircleImage =
      node.type === 'ELLIPSE' ||
      (Math.abs(node.width - node.height) <= 1 && (
        /(avatar|آواتار|circle|دایره|badge|icon|ic[-_]|point|dot)/i.test((node.name || '').trim()) ||
        Boolean(parent && /(avatar|آواتار)/i.test((parent.name || '').trim())) ||
        ('cornerRadius' in node && typeof (node as any).cornerRadius === 'number' && (node as any).cornerRadius >= node.width / 2 - 2)
      ));

    if (isCircleImage) {
      layout.width = figmaW;
      layout.height = figmaH;
      layout.minWidth = figmaW;
      layout.minHeight = figmaH;
      layout.maxWidth = figmaW;
      layout.aspectRatio = '1 / 1';
      layout.objectFit = 'cover';
      layout.flexShrink = 0;
      delete layout.alignSelf;
      visual.borderRadius = '50%';
    } else if (isCoveringBackground) {
      layout.width = '100%';
      layout.height = '100%';
      layout.maxWidth = '100%';
      layout.objectFit = 'cover';
      if (parent && ('cornerRadius' in parent || 'borderRadius' in (parent as any))) {
        visual.borderRadius = 'inherit';
      }
    } else if (matchesParentWidth || isQrInContainer) {
      layout.width = '100%';
      // A banner or card image was drawn to the parent's inner edge, so it has
      // to keep reaching that edge as the parent grows: capping it at the drawn
      // width would leave a stripe of the parent's background down one side of
      // a widened card. A QR code is the exception — it is a fixed symbol, and
      // `object-fit: contain` keeps it square at any width anyway.
      layout.maxWidth = options.responsive && matchesParentWidth ? '100%' : figmaW;
      layout.alignSelf = 'stretch';
      if (layout.aspectRatio) {
        layout.height = 'auto';
      }
    } else {
      // Ensure explicit width & height are set on img tag so high-res (2x/3x) assets don't expand intrinsically
      layout.width = figmaW;
      layout.maxWidth = figmaW;
      if (!layout.aspectRatio) {
        layout.height = figmaH;
      }
    }

    // An image's shape is part of the design. When the box narrows — a stacked
    // card, a phone, a resized panel — a fixed height would squash the picture,
    // because `object-fit` fits the *content* into the box, not the box to the
    // content. Stating the drawn ratio lets the height follow the width, so the
    // image scales instead of distorting. The ratio is the drawn one, so at the
    // design width the result is identical.
    if (!layout.aspectRatio && node.width > 0 && node.height > 0) {
      const w = Math.round((node.width / node.height) * 10000) / 100;
      layout.aspectRatio = `${w} / 1`;
    }
    if (layout.aspectRatio && options.responsive && !isCoveringBackground) {
      layout.height = 'auto';
    }

    // Always safeguard images with maxWidth so they never blow out parent containers
    if (!layout.maxWidth) {
      layout.maxWidth = figmaW;
    }

    return {
      id: node.id,
      name: node.name,
      className,
      tag: 'img',
      type: node.type,
      layout,
      visual,
      asset: asset || undefined,
      children: [],
    };
  }

  // 3. Handle Text nodes
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;
    const layout = extractLayout(node, parent, options, tokenRegistry);
    const visual = extractVisualStyles(node, options, tokenRegistry, parent);
    // Text nodes have text color, not container background
    delete visual.background;
    const typography = extractTypography(textNode, options, tokenRegistry, typeContainerWidth);

    const finalTag = typography.isList ? (typography.listType === 'ordered' ? 'ol' : 'ul') : tag;
    // A link on the whole layer. The element keeps its semantic tag and the
    // text is wrapped in `<a>`, so a linked heading is still a heading.
    const href = hyperlinkUrl(
      (textNode as TextNode & { hyperlink?: { type?: string; value?: string } | null }).hyperlink
    );

    return {
      id: node.id,
      name: node.name,
      className,
      tag: finalTag,
      type: node.type,
      layout,
      visual,
      typography,
      text: textNode.characters,
      href: href ?? undefined,
      children: [],
    };
  }

  // 4. Handle Container nodes (FRAME, COMPONENT, INSTANCE, GROUP, SECTION, RECTANGLE, ELLIPSE)
  const layout = extractLayout(node, parent, options, tokenRegistry);
  const visual = extractVisualStyles(node, options, tokenRegistry, parent);
  let containerAsset: AssetData | undefined;

  let childrenToConvert: SceneNode[] =
    'children' in node && Array.isArray(node.children) ? [...node.children] : [];

  // 4a. Mask groups.
  // A mask is not a clip on the mask node: it shapes the siblings drawn after
  // it, and it is never painted itself. Both facts are decided here, before
  // anything looks at the child list, because a mask rectangle covering the
  // parent would otherwise be mistaken for the card's backdrop and promoted
  // into the container's background.
  const maskClips = childrenToConvert.some(isMaskNode)
    ? maskClipsFor(childrenToConvert, (px) => formatUnit(px, options.useRem, options.baseFontSize))
    : null;

  if (maskClips) {
    childrenToConvert = childrenToConvert.filter((child) => !isMaskNode(child));
  }

  // 4a. Backdrop Promotion:
  // If container has no background of its own, check if the bottom-most child (or children)
  // was drawn to serve as the card's backdrop (covers parent bounds, leaf shape, has fills, no stroke).
  // Promoting it to the container's CSS `background` eliminates redundant DOM elements,
  // prevents z-index clashing with text children, and faithfully preserves multi-fill gradient overlays.
  if (!visual.background && childrenToConvert.length > 0) {
    const parentW = 'width' in node && typeof node.width === 'number' ? node.width : 0;
    const parentH = 'height' in node && typeof node.height === 'number' ? node.height : 0;

    const isContainerFreeform = !('layoutMode' in node) || node.layoutMode === 'NONE';

    while (childrenToConvert.length > 0 && parentW > 0 && parentH > 0) {
      const bgChild = childrenToConvert[0];
      if (!bgChild) break;
      const isChildAbsolute = (bgChild as any).layoutPositioning === 'ABSOLUTE';
      if (!isContainerFreeform && !isChildAbsolute) break;

      const childW = 'width' in bgChild && typeof bgChild.width === 'number' ? bgChild.width : 0;
      const childH = 'height' in bgChild && typeof bgChild.height === 'number' ? bgChild.height : 0;
      const childX = typeof bgChild.x === 'number' ? bgChild.x : 0;
      const childY = typeof bgChild.y === 'number' ? bgChild.y : 0;

      const coversParent =
        childW > 0 &&
        childH > 0 &&
        childX <= 4 &&
        childY <= 4 &&
        childX + childW >= parentW - 4 &&
        childY + childH >= parentH - 4;

      const isLeafShape =
        bgChild.visible !== false &&
        bgChild.type !== 'TEXT' &&
        (!('children' in bgChild) || !Array.isArray(bgChild.children) || bgChild.children.length === 0);

      const childFills: readonly Paint[] =
        'fills' in bgChild && Array.isArray(bgChild.fills) ? bgChild.fills : [];
      const hasFills = childFills.some((f) => f && f.visible !== false);

      const hasNoStrokes =
        !('strokes' in bgChild &&
          Array.isArray(bgChild.strokes) &&
          bgChild.strokes.some((s) => s && s.visible !== false));

      // A masked layer cannot become the container's own background: it would
      // lose the clip that is the whole point of the mask.
      const isMasked = maskClips?.has(bgChild.id) === true;

      const isCoveringBackdrop =
        coversParent &&
        isLeafShape &&
        hasFills &&
        hasNoStrokes &&
        !isMasked &&
        (childrenToConvert.length > 1 ||
          (hasImageFill(bgChild) && childFills.filter((f) => f.visible !== false).length > 1));

      if (!isCoveringBackdrop) break;

      const bgVisual = extractVisualStyles(bgChild, options, tokenRegistry, node);
      let childBg = bgVisual.background;

      if (childBg && childBg.includes('__FIGMA_IMAGE_FILL__')) {
        const asset = await exportNodeAsImage(bgChild, options);
        if (asset) {
          containerAsset = asset;
          const size = childBg.includes('contain')
            ? 'contain'
            : childBg.includes(':auto')
              ? 'auto'
              : 'cover';
          const repeat = size === 'auto' ? 'repeat' : 'no-repeat';
          const imgLayer = `url("${asset.content}") center / ${size} ${repeat}`;
          childBg = childBg.replace(/__FIGMA_IMAGE_FILL__:[a-z]+/, imgLayer);
          visual.backgroundSize = size;
          visual.backgroundRepeat = repeat;
          visual.backgroundPosition = 'center';
        } else {
          childBg = childBg
            .split(', ')
            .filter((l) => !l.startsWith('__FIGMA_IMAGE_FILL__'))
            .join(', ');
        }
      }

      if (childBg) {
        // Child layers higher in the stack render in front of lower layers in CSS
        visual.background = visual.background ? `${childBg}, ${visual.background}` : childBg;
        if (bgVisual.opacity !== undefined && visual.opacity === undefined) {
          visual.opacity = bgVisual.opacity;
        }
      }

      // Backdrop promoted: remove from DOM children
      childrenToConvert.shift();
    }
  }

  // 4b. Resolve container's own IMAGE-fill placeholders if present
  if (visual.background && visual.background.includes('__FIGMA_IMAGE_FILL__')) {
    const asset = await exportNodeAsImage(node, options);
    if (asset) {
      containerAsset = asset;
      const size = visual.background.includes('contain')
        ? 'contain'
        : visual.background.includes(':auto')
          ? 'auto'
          : 'cover';
      const repeat = size === 'auto' ? 'repeat' : 'no-repeat';
      const imgLayer = `url("${asset.content}") center / ${size} ${repeat}`;
      visual.background = visual.background.replace(/__FIGMA_IMAGE_FILL__:[a-z]+/, imgLayer);
      visual.backgroundSize = size;
      visual.backgroundRepeat = repeat;
      visual.backgroundPosition = 'center';
    } else {
      // Export failed: drop placeholder so CSS stays valid
      visual.background = visual.background
        .split(', ')
        .filter((l) => !l.startsWith('__FIGMA_IMAGE_FILL__'))
        .join(', ');
      if (!visual.background) delete visual.background;
    }
  }

  const irNode: IRNode = {
    id: node.id,
    name: node.name,
    className,
    tag,
    type: node.type,
    layout,
    visual,
    asset: containerAsset,
    children: [],
  };

  if (tag === 'button') {
    // Explicit `type="button"` keeps a button inside a form from submitting it
    // unless the designer chose that. A static export cannot know the intent,
    // and submitting on every click is the surprising default.
    irNode.attrs = { type: 'button' };
  }

  // Convert children recursively in manageable batches to prevent event-loop starvation
  // and memory buffer spikes when converting frames with hundreds/thousands of children
  if (childrenToConvert.length > 0) {
    const children = childrenToConvert;
    if (children.length <= 25) {
      const childPromises = children.map((child) =>
        convertNodeToIR(child, node, options, tokenRegistry, className, existingNamesSet, typeContainerWidth)
      );
      const childResults = await Promise.all(childPromises);
      irNode.children = childResults.filter((child): child is IRNode => child !== null);
    } else {
      const childResults: (IRNode | null)[] = [];
      const BATCH_SIZE = 25;
      for (let i = 0; i < children.length; i += BATCH_SIZE) {
        const batch = children.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map((child) =>
            convertNodeToIR(child, node, options, tokenRegistry, className, existingNamesSet, typeContainerWidth)
          )
        );
        for (const res of batchResults) {
          childResults.push(res);
        }
        if (i + BATCH_SIZE < children.length) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
      irNode.children = childResults.filter((child): child is IRNode => child !== null);
    }
  }

  // 4c. Apply the mask shapes. Done on the finished children so the clip lands
  // on whatever the child actually became — an `img`, an SVG wrapper, a plain
  // frame — without any of those branches having to know about masks.
  if (maskClips) {
    applyMaskClips(irNode.children, maskClips);
  }

  // 4d. A child that blends needs a backdrop of its own, and the backdrop Figma
  // gave it is this group. Decided on the finished children because the blend
  // mode is a property of what each child turned into, not of the scene node.
  if (needsIsolation(irNode.children)) {
    irNode.visual.isolation = 'isolate';
  }

  // 4e. A table's digits are pinned to a grid. `font-variant-numeric` inherits,
  // so the declaration goes on the container and reaches every cell: a column
  // of numbers lines up instead of wandering with the width of each glyph.
  if (looksTabular(irNode)) {
    irNode.typography = { ...(irNode.typography ?? {}), fontVariantNumeric: 'tabular-nums' };
  }

  // 4f. A field is not a box that looks like one. The component name says
  // "Input", so the placeholder becomes a real control: a native element with
  // a type, a name and the placeholder as an attribute, inside the frame when
  // the frame carries icons the control cannot hold. A checkbox, radio or
  // switch is an input too, but one whose whole component is the label.
  if (tag === 'input') {
    const checkable = detectCheckableKind(node);
    if (checkable) {
      applyCheckableSemantics(irNode, checkable, node, existingNamesSet);
    } else {
      applyFormControlSemantics(irNode, tag, node, existingNamesSet);
    }
  } else if (tag === 'textarea' || tag === 'select') {
    applyFormControlSemantics(irNode, tag, node, existingNamesSet);
  }

  return irNode;
}

function applyMaskClips(children: IRNode[], clips: Map<string, MaskClip>): void {
  for (const child of children) {
    const clip = clips.get(child.id);
    if (!clip) continue;

    if (clip.clipPath && !child.visual.clipPath) {
      child.visual.clipPath = clip.clipPath;
    }

    if (clip.alpha < 1) {
      const alpha = Math.round(clip.alpha * 1000) / 1000;
      const own = child.visual.opacity;
      if (typeof own === 'number') {
        child.visual.opacity = Math.round(own * clip.alpha * 100) / 100;
      } else if (typeof own === 'string') {
        // A tokenised opacity stays a token; the mask scales it.
        child.visual.opacity = `calc(${own} * ${alpha})`;
      } else {
        child.visual.opacity = Math.round(clip.alpha * 100) / 100;
      }
    }
  }
}
