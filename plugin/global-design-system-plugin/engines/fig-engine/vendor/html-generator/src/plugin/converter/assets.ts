import { AssetData, ConversionOptions } from '../types/ir';
import { uint8ArrayToUtf8, uint8ArrayToBase64, getMainComponent } from './utils';
import { MAX_AUTO_SVG_SIZE } from '../../shared/constants';

/** Word-boundary patterns for asset-like layer names (avoids `art` matching `card`/`article`). */
const ASSET_NAME_PATTERN =
  /(^|[-_\s])(icon|ic|arrow|chevron|close|dismiss|cross|cancel|x|search|check|menu|settings|bell|heart|star|trash|edit|share|filter|back|illustration|graphic|image|logo|badge|qr|scan|barcode|تصویر|آیکون|لوگو|بارکد|کیو[-_\s]?آر)([-_\s]|$)/;

/**
 * Recursively checks if a node or any of its descendants has an active blur effect
 * (LAYER_BLUR or BACKGROUND_BLUR).
 * Nodes with blur effects must NEVER be collapsed into single SVG exports because
 * Figma rasterizes blurs into noisy, dithered 8-bit stippled bitmaps.
 */
export function hasBlurEffect(node: SceneNode): boolean {
  if ('effects' in node && Array.isArray(node.effects)) {
    if (
      node.effects.some(
        (e) =>
          e.visible !== false &&
          (e.type === 'LAYER_BLUR' ||
            e.type === 'BACKGROUND_BLUR' ||
            (e as any).type === 'TEXTURE' ||
            (e as any).type === 'NOISE')
      )
    ) {
      return true;
    }
  }
  const mainComp = getMainComponent(node);
  if (mainComp && 'effects' in mainComp && Array.isArray(mainComp.effects)) {
    if (
      mainComp.effects.some(
        (e) =>
          e.visible !== false &&
          (e.type === 'LAYER_BLUR' ||
            e.type === 'BACKGROUND_BLUR' ||
            (e as any).type === 'TEXTURE' ||
            (e as any).type === 'NOISE')
      )
    ) {
      return true;
    }
  }
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child.visible !== false && hasBlurEffect(child)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Recursively checks if a node or any of its descendants has an image fill
 */
export function hasImageDescendant(node: SceneNode): boolean {
  if (hasImageFill(node)) return true;
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      if (hasImageDescendant(child)) return true;
    }
  }
  return false;
}

/**
 * Recursively checks if a node or any of its descendants is a TextNode
 */
export function hasTextDescendant(node: SceneNode): boolean {
  if (node.type === 'TEXT') return true;
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      if (hasTextDescendant(child)) return true;
    }
  }
  return false;
}

/**
 * Checks if a node should be exported as a unified SVG asset
 */
export function shouldExportAsSingleVector(node: SceneNode, isRoot: boolean = false): boolean {
  if (isRoot) return false; // Never export root selected frame as a single SVG
  if (hasImageDescendant(node)) return false; // Containers with photos/raster images must not be collapsed to SVG

  // Straight horizontal or vertical dividers (LINE or straight 1D VECTOR dividers)
  // should be rendered as semantic CSS borders/dividers, NOT exported as SVG
  // (which produces 0-height invisible graphics in Figma exports).
  const isLine = node.type === 'LINE';
  const isVector = node.type === 'VECTOR';
  if (isLine || isVector) {
    const rot = Math.abs(Math.round('rotation' in node && typeof node.rotation === 'number' ? node.rotation : 0));
    const isOrthogonal = rot % 90 === 0;
    const w = 'width' in node && typeof node.width === 'number' ? node.width : 0;
    const h = 'height' in node && typeof node.height === 'number' ? node.height : 0;

    if (isLine) {
      if (isOrthogonal) {
        return false; // Render via CSS!
      }
      return true; // Diagonal line -> SVG
    }

    // For VECTOR nodes: check if it represents a 1-dimensional divider (horizontal or vertical)
    if (isVector && isOrthogonal) {
      const isDividerNamed = /^(line|divider|separator|rule|border|stroke|خط|جداکننده)/i.test(node.name.trim());
      const isHorizontalDivider = (h <= 1 && w >= 10) || (isDividerNamed && h <= 2) || (h === 0 && w > 0);
      const isVerticalDivider = (w <= 1 && h >= 10) || (isDividerNamed && w <= 2) || (w === 0 && h > 0);
      if (isHorizontalDivider || isVerticalDivider || h === 0 || w === 0) {
        return false; // Render via CSS!
      }
    }
  }

  if (
    node.type === 'VECTOR' ||
    node.type === 'STAR' ||
    node.type === 'POLYGON' ||
    node.type === 'BOOLEAN_OPERATION'
  ) {
    return true;
  }

  // Partial arcs, donuts, and pie wedges on EllipseNode cannot be represented with standard CSS border-radius
  if (node.type === 'ELLIPSE') {
    const ellipse = node as EllipseNode;
    if ('arcData' in ellipse && ellipse.arcData) {
      const sweep = Math.abs(ellipse.arcData.endingAngle - ellipse.arcData.startingAngle);
      if (ellipse.arcData.innerRadius > 0 || (sweep > 0.001 && sweep < 2 * Math.PI - 0.01)) {
        return true;
      }
    }
  }

  const name = node.name.toLowerCase();

  // If node is a GROUP, FRAME, or INSTANCE:
  if (node.type === 'GROUP' || node.type === 'FRAME' || node.type === 'INSTANCE') {
    // Containers with blur effects must NEVER be collapsed into SVG
    // (Figma rasterizes blurs to noisy dithered bitmaps, whereas CSS filter: blur renders silky smooth Gaussian blurs)
    if (hasBlurEffect(node)) {
      return false;
    }

    // Containers with multiple children containing both background shape(s) and icon instance(s)
    // are composite layout wrappers (e.g. active indicator circle + icon), not atomic vectors.
    if ('children' in node && node.children.length > 1) {
      const hasShapeChild = node.children.some(
        (c) => c.visible !== false && (c.type === 'RECTANGLE' || c.type === 'ELLIPSE')
      );
      const hasIconChild = node.children.some(
        (c) => c.visible !== false && (c.type === 'INSTANCE' || c.type === 'GROUP' || c.type === 'VECTOR')
      );
      if (hasShapeChild && hasIconChild) {
        return false;
      }
    }

    // 1. Explicit icon, illustration, or graphic name (word-boundary match)
    if (ASSET_NAME_PATTERN.test(name)) {
      if (!hasTextDescendant(node)) {
        return true;
      }
    }

    // 2. Pure vector container without text:
    if ('children' in node && node.children.length > 0) {
      if (!hasTextDescendant(node)) {
        // Groups without text are almost always illustrations, icons, or complex drawings
        if (node.type === 'GROUP') {
          return true;
        }

        // Small container <= 48x48 without text that contains vector/shape elements (e.g. close X, icon wrappers)
        if (node.width <= 48 && node.height <= 48) {
          const hasVectorChild = node.children.some(
            (c) =>
              c.type === 'VECTOR' ||
              c.type === 'BOOLEAN_OPERATION' ||
              c.type === 'STAR' ||
              c.type === 'LINE' ||
              c.type === 'POLYGON' ||
              c.type === 'GROUP'
          );
          if (hasVectorChild) {
            return true;
          }
        }

        // Non-autolayout frames without text that contain only shape elements
        if ('layoutMode' in node && node.layoutMode === 'NONE') {
          const isContainerName = /(button|btn|card|modal|dialog|container|input|box|row|header|body|footer|panel|pill|tab|state-layer|core)/.test(name);
          if (!isContainerName) {
            const allChildrenAreShapes = node.children.every(
              (c) =>
                c.type === 'VECTOR' ||
                c.type === 'BOOLEAN_OPERATION' ||
                c.type === 'STAR' ||
                c.type === 'LINE' ||
                c.type === 'POLYGON' ||
                c.type === 'ELLIPSE' ||
                c.type === 'RECTANGLE' ||
                c.type === 'GROUP'
            );
            if (allChildrenAreShapes && node.width <= MAX_AUTO_SVG_SIZE && node.height <= MAX_AUTO_SVG_SIZE) {
              return true;
            }
          }
        }
      }
    }
  }

  return false;
}

/**
 * Checks if a node contains an image fill
 */
export function hasImageFill(node: SceneNode): boolean {
  if ('fills' in node && Array.isArray(node.fills)) {
    return node.fills.some((f) => f.visible !== false && f.type === 'IMAGE');
  }
  return false;
}

/**
 * Exports a vector node as an inline SVG string
 */
export async function exportVectorAsSvg(node: SceneNode): Promise<AssetData | null> {
  try {
    let bytes: Uint8Array;
    try {
      bytes = await node.exportAsync({
        format: 'SVG',
        svgIdAttribute: false,
        svgOutlineText: true,
        useAbsoluteBounds: true,
      });
    } catch {
      bytes = await node.exportAsync({
        format: 'SVG',
        svgIdAttribute: false,
        svgOutlineText: true,
      });
    }
    const svgString = uint8ArrayToUtf8(bytes);
    return {
      type: 'svg',
      content: svgString,
      filename: `${node.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'vector'}.svg`,
    };
  } catch (err) {
    console.warn(`Failed to export vector node ${node.name}:`, err);
    return null;
  }
}

/**
 * Calculates smart dynamic export scale based on image dimensions and device-pixel ratios.
 * - Small elements (<= 160px: avatars, badges, thumbnails): 3x for crisp Retina & Super Retina rendering.
 * - Medium elements (160px - 800px: cards, content images): 2x Retina sharpness.
 * - Large elements (> 800px: hero headers, full-width banners): 2x capped to prevent memory exhaustion (max ~2560-2880px).
 */
export function getSmartImageExportScale(node: SceneNode, options?: ConversionOptions): number {
  if (options && typeof options.imageScale === 'number' && options.imageScale > 0) {
    return options.imageScale;
  }

  const w = 'width' in node && typeof node.width === 'number' ? node.width : 0;
  const h = 'height' in node && typeof node.height === 'number' ? node.height : 0;
  const maxDim = Math.max(w, h);

  if (maxDim <= 0) {
    return 2;
  }

  // Small images (avatars, icons, badges) -> 3x for maximum crispness without blurry pixels
  if (maxDim <= 160) {
    return 3;
  }

  // Medium images (cards, thumbnails) -> 2x standard retina
  if (maxDim <= 800) {
    return 2;
  }

  // Large images (> 800px: hero banners, backgrounds)
  if (maxDim * 2 <= 2560) {
    return 2;
  }

  // Very large elements (> 1280px) -> balance retina quality with base64 payload size (max ~2560px)
  const calculated = Math.round((2560 / maxDim) * 10) / 10;
  return Math.max(1.5, Math.min(2, calculated));
}

/**
 * Image exports already paid for, by node id.
 *
 * The same node can be reached twice in one conversion: a frame that is
 * promoted into its parent's `background` is exported for that, and a node
 * with an image fill of its own is exported again for its `<img>`/`src`. Each
 * export is a full rasterisation of the layer, so without this the work — and
 * the bytes — are done twice for one picture.
 *
 * Keyed by node id rather than by image hash on purpose: `exportAsync` renders
 * the *node*, so two layers that share an image hash but crop it differently
 * are two different pictures. Identical bytes are collapsed later, when the
 * assets are written, by content.
 */
const imageExports = new Map<string, Promise<AssetData | null>>();

/** Drops the cache; called when a conversion starts so one document cannot leak into the next. */
export function resetImageExportCache(): void {
  imageExports.clear();
}

/**
 * Exports an image node as a PNG data URL (Base64) using smart dynamic scaling.
 */
export async function exportNodeAsImage(node: SceneNode, options?: ConversionOptions): Promise<AssetData | null> {
  const key = exportKey(node, options);
  if (key === null) return exportImageOnce(node, options);

  const cached = imageExports.get(key);
  if (cached) return cached;

  const pending = exportImageOnce(node, options);
  imageExports.set(key, pending);
  return pending;
}

/**
 * The cache key for one export, or `null` when it cannot be cached.
 *
 * The scale is part of the key: the same layer exported at 1x and at 3x is two
 * different pictures, and a caller that asks for the other scale must not be
 * handed the first one. A node with no id has no stable identity to key on, so
 * it is simply exported every time it is asked for.
 */
function exportKey(node: SceneNode, options?: ConversionOptions): string | null {
  const id = (node as { id?: unknown }).id;
  if (typeof id !== 'string' || id.length === 0) return null;
  const scale = typeof options?.imageScale === 'number' ? options.imageScale : 'auto';
  return `${id}\u0000${scale}`;
}

async function exportImageOnce(node: SceneNode, options?: ConversionOptions): Promise<AssetData | null> {
  try {
    const scale = getSmartImageExportScale(node, options);

    let bytes: Uint8Array | null = null;
    try {
      bytes = await node.exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: scale },
      });
    } catch {
      // Graceful fallback to 2x or 1x if memory buffer limit is hit on high scale
      if (scale > 2) {
        try {
          bytes = await node.exportAsync({
            format: 'PNG',
            constraint: { type: 'SCALE', value: 2 },
          });
        } catch {
          try {
            bytes = await node.exportAsync({
              format: 'PNG',
              constraint: { type: 'SCALE', value: 1 },
            });
          } catch {}
        }
      } else {
        try {
          bytes = await node.exportAsync({
            format: 'PNG',
            constraint: { type: 'SCALE', value: 1 },
          });
        } catch {}
      }
    }

    // Direct image hash fallback from Figma image cache if exportAsync fails
    if ((!bytes || bytes.length === 0) && 'fills' in node && Array.isArray(node.fills)) {
      try {
        const imageFill = node.fills.find(
          (f: any) => f && f.visible !== false && f.type === 'IMAGE' && f.imageHash
        );
        if (imageFill && typeof figma !== 'undefined' && typeof (figma as any).getImageByHash === 'function') {
          const img = (figma as any).getImageByHash(imageFill.imageHash);
          if (img && typeof img.getBytesAsync === 'function') {
            bytes = await img.getBytesAsync();
          }
        }
      } catch (hashErr) {
        console.warn(`[assets] getImageByHash fallback failed for ${node.name}:`, hashErr);
      }
    }

    if (!bytes || bytes.length === 0) {
      return null;
    }

    const base64 = uint8ArrayToBase64(bytes);
    const dataUrl = `data:image/png;base64,${base64}`;
    return {
      type: 'image',
      mimeType: 'image/png',
      content: dataUrl,
      filename: `${node.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'image'}.png`,
    };
  } catch (err) {
    console.warn(`Failed to export image node ${node.name}:`, err);
    return null;
  }
}
