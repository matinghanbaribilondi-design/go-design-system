import { IRNode, ConversionOptions, VisualStyles } from '../types/ir';
import { sanitizeClassName, detectSemanticTag } from './utils';
import { extractLayout } from './layout';
import { extractVisualStyles } from './styles';
import { extractTypography } from './typography';
import { shouldExportAsSingleVector, hasImageFill, exportVectorAsSvg, exportNodeAsImage } from './assets';
import { TokenRegistry } from '../../shared/token-resolver';

/**
 * Recursively converts a Figma SceneNode into an Intermediate Representation (IRNode) tree
 */
export async function convertNodeToIR(
  node: SceneNode,
  parent: SceneNode | null,
  options: ConversionOptions,
  tokenRegistry?: TokenRegistry,
  parentClassName?: string,
  existingNamesSet: Set<string> = new Set<string>()
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
  const tag = detectSemanticTag(node);
  const isRoot = parent === null;

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
    const asset = await exportNodeAsImage(node, options);

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
    const typography = extractTypography(textNode, options, tokenRegistry);

    const finalTag = typography.isList ? (typography.listType === 'ordered' ? 'ol' : 'ul') : tag;

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
      children: [],
    };
  }

  // 4. Handle Container nodes (FRAME, COMPONENT, INSTANCE, GROUP, SECTION, RECTANGLE, ELLIPSE)
  const layout = extractLayout(node, parent, options, tokenRegistry);
  const visual = extractVisualStyles(node, options, tokenRegistry, parent);

  // Resolve IMAGE-fill placeholders: export the node once, use bytes as background-image
  if (visual.background && visual.background.includes('__FIGMA_IMAGE_FILL__')) {
    const asset = await exportNodeAsImage(node, options);
    if (asset) {
      const size = visual.background.includes('contain')
        ? 'contain'
        : visual.background.includes(':auto')
          ? 'auto'
          : 'cover';
      const repeat = size === 'auto' ? 'repeat' : 'no-repeat';
      // Keep other layers (solid/gradient under the image)
      const other = visual.background
        .split(', ')
        .filter((l) => !l.startsWith('__FIGMA_IMAGE_FILL__'))
        .join(', ');
      const imgLayer = `url("${asset.content}") center / ${size} ${repeat}`;
      visual.background = other ? `${imgLayer}, ${other}` : imgLayer;
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
    children: [],
  };

  // Convert children recursively
  if ('children' in node && Array.isArray(node.children)) {
    const childPromises = node.children.map((child) =>
      convertNodeToIR(child, node, options, tokenRegistry, className, existingNamesSet)
    );
    const childResults = await Promise.all(childPromises);
    irNode.children = childResults.filter((child): child is IRNode => child !== null);
  }

  return irNode;
}
