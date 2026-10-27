import { VisualStyles, ConversionOptions } from '../types/ir';
import { gradientTransformToAngle, formatUnit } from './utils';
import { TokenResolver, TokenRegistry } from '../../shared/token-resolver';

/**
 * Retrieves the mainComponent of an INSTANCE node, supporting both synchronous
 * and pre-resolved asynchronous component references.
 */
function getMainComponent(node: SceneNode): ComponentNode | null {
  if (node.type === 'INSTANCE') {
    const inst = node as InstanceNode;
    const resolved = (inst as unknown as Record<string, unknown>)._resolvedMainComponent as ComponentNode | null;
    if (resolved) return resolved;

    try {
      return inst.mainComponent || null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Extracts fills as CSS background layers.
 * Covers SOLID, LINEAR/ RADIAL/DIAMOND gradients, and IMAGE fills (as background-image).
 */
function extractFills(node: SceneNode, resolver: TokenResolver, bgLayers: string[]): void {
  let fillsList: readonly Paint[] = [];
  const mainComp = getMainComponent(node);

  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    fillsList = node.fills;
  } else if (mainComp && Array.isArray(mainComp.fills) && mainComp.fills.length > 0) {
    fillsList = mainComp.fills;
  }

  if (fillsList.length === 0) return;
  const activeFills = fillsList.filter((f) => f.visible !== false);
  const boundFillId = TokenResolver.boundId(node, 'fills0');
  let fillStyleId = TokenResolver.styleId(node, 'fillStyleId');
  if (!fillStyleId && mainComp?.fillStyleId && typeof mainComp.fillStyleId === 'string') {
    fillStyleId = mainComp.fillStyleId;
  }

  // Reverse so top fill in Figma is first in CSS background
  const layers = activeFills.length > 1 ? [...activeFills].reverse() : activeFills;

  const width = 'width' in node && typeof node.width === 'number' ? node.width : 100;
  const height = 'height' in node && typeof node.height === 'number' ? node.height : 100;

  for (let idx = 0; idx < layers.length; idx++) {
    const fill = layers[idx]!;
    const isLastLayer = idx === layers.length - 1;
    const fillOpacity = typeof fill.opacity === 'number' ? fill.opacity : 1;

    if (fill.type === 'SOLID') {
      const colorVal = resolver.resolveColor(fill.color, fillOpacity, boundFillId, fillStyleId);
      if (!isLastLayer) {
        // Non-final layers in CSS `background` MUST be <bg-image> (gradients or url), not bare <color>
        bgLayers.push(`linear-gradient(0deg, ${colorVal}, ${colorVal})`);
      } else {
        bgLayers.push(colorVal);
      }
    } else if (fill.type === 'IMAGE') {
      // Image fills become background-image layers. The raw bytes are resolved
      // later in convertNodeToIR (async export); here we emit a placeholder
      // token that gets replaced with the data URL, sized per scaleMode.
      const mode =
        'scaleMode' in fill && typeof fill.scaleMode === 'string'
          ? (fill.scaleMode as string)
          : 'FILL';
      const size = mode === 'FIT' ? 'contain' : mode === 'TILE' ? 'auto' : 'cover';
      bgLayers.push(`__FIGMA_IMAGE_FILL__:${size}`);
    } else if (fill.type === 'GRADIENT_LINEAR') {
      const angle = gradientTransformToAngle(fill.gradientTransform, width, height);
      const stops = fill.gradientStops
        .map((stop: ColorStop) => {
          const stopAlpha = typeof stop.color.a === 'number' ? stop.color.a : 1;
          const effectiveAlpha = Math.round(stopAlpha * fillOpacity * 1000) / 1000;
          const c = resolver.resolveColor(stop.color, effectiveAlpha);
          return `${c} ${Math.round(stop.position * 100)}%`;
        })
        .join(', ');
      bgLayers.push(`linear-gradient(${angle}deg, ${stops})`);
    } else if (fill.type === 'GRADIENT_RADIAL') {
      const stops = fill.gradientStops
        .map((stop: ColorStop) => {
          const stopAlpha = typeof stop.color.a === 'number' ? stop.color.a : 1;
          const effectiveAlpha = Math.round(stopAlpha * fillOpacity * 1000) / 1000;
          const c = resolver.resolveColor(stop.color, effectiveAlpha);
          return `${c} ${Math.round(stop.position * 100)}%`;
        })
        .join(', ');
      bgLayers.push(`radial-gradient(circle, ${stops})`);
    } else if (fill.type === 'GRADIENT_DIAMOND') {
      // Figma diamond ≈ CSS conic-ish; closest faithful fallback is a rotated conic gradient
      const stops = fill.gradientStops
        .map((stop: ColorStop) => {
          const stopAlpha = typeof stop.color.a === 'number' ? stop.color.a : 1;
          const effectiveAlpha = Math.round(stopAlpha * fillOpacity * 1000) / 1000;
          const c = resolver.resolveColor(stop.color, effectiveAlpha);
          return `${c} ${Math.round(stop.position * 100)}%`;
        })
        .join(', ');
      bgLayers.push(`conic-gradient(from 45deg at 50% 50%, ${stops})`);
    }
  }
}

/**
 * Extracts comprehensive visual styles (fills, borders, shadows, blurs, radii).
 * Automatically binds Figma Variables and Styles if tokenRegistry is provided.
 */
export function extractVisualStyles(
  node: SceneNode,
  options: ConversionOptions,
  tokenRegistry?: TokenRegistry,
  parent?: BaseNode | null
): VisualStyles {
  const styles: VisualStyles = {};
  const resolver = new TokenResolver(tokenRegistry);
  const mainComp = getMainComponent(node);

  // 1. Fills / Background
  const bgLayers: string[] = [];
  extractFills(node, resolver, bgLayers);
  if (bgLayers.length > 0) {
    styles.background = bgLayers.join(', ');
  }

  // 2. Corner Radius (Border Radius)
  const boundRadiusVar = resolver.varFor(TokenResolver.boundId(node, 'cornerRadius'));

  if (node.type === 'ELLIPSE') {
    styles.borderRadius = '50%';
  } else if (boundRadiusVar) {
    styles.borderRadius = boundRadiusVar;
  } else {
    let cr: number | typeof figma.mixed | undefined =
      'cornerRadius' in node ? (node.cornerRadius as number | typeof figma.mixed) : undefined;
    let targetNode: Record<string, unknown> = node as unknown as Record<string, unknown>;

    if ((cr === undefined || cr === 0) && mainComp && 'cornerRadius' in mainComp) {
      cr = mainComp.cornerRadius;
      targetNode = mainComp as unknown as Record<string, unknown>;
    }

    if (typeof cr === 'number' && cr > 0) {
      styles.borderRadius = formatUnit(cr, options.useRem, options.baseFontSize);
    } else if (
      (typeof figma !== 'undefined' && cr === figma.mixed) ||
      (typeof cr !== 'number' && cr !== undefined) ||
      ('topLeftRadius' in targetNode)
    ) {
      const corners = ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius'] as const;
      const vals = corners.map((k) => {
        let val = typeof targetNode[k] === 'number' ? (targetNode[k] as number) : 0;
        if (val === 0 && mainComp && typeof (mainComp as unknown as Record<string, unknown>)[k] === 'number') {
          val = (mainComp as unknown as Record<string, unknown>)[k] as number;
        }
        return formatUnit(val, options.useRem, options.baseFontSize);
      });
      if (vals.some((v) => v !== '0px')) {
        styles.borderRadius = vals.join(' ');
      }
    }
  }

  // 3. Borders & Strokes
  let strokeList: readonly Paint[] = [];
  let strokeSource: SceneNode = node;

  if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
    strokeList = node.strokes;
  } else if (mainComp && Array.isArray(mainComp.strokes) && mainComp.strokes.length > 0) {
    strokeList = mainComp.strokes;
    strokeSource = mainComp;
  }

  if (strokeList.length > 0) {
    const activeStroke = strokeList.find((s) => s.visible !== false && s.type === 'SOLID');
    if (activeStroke && activeStroke.type === 'SOLID') {
      const boundStrokeId =
        'boundVariables' in node
          ? ((node.boundVariables as Record<string, unknown> | undefined)?.['strokes'] as Array<{ id?: string }> | undefined)?.[0]?.id ?? null
          : null;
      let strokeStyleId = TokenResolver.styleId(node, 'strokeStyleId');
      if (!strokeStyleId && mainComp?.strokeStyleId) {
        strokeStyleId = mainComp.strokeStyleId;
      }

      const strokeColor = resolver.resolveColor(
        activeStroke.color,
        activeStroke.opacity ?? 1,
        boundStrokeId,
        strokeStyleId
      );

      const src = strokeSource as FrameNode;
      const isDashed = 'dashPattern' in src && Array.isArray(src.dashPattern) && src.dashPattern.length > 0;
      const borderStyle = isDashed ? 'dashed' : 'solid';

      const topW = 'strokeTopWeight' in src && typeof src.strokeTopWeight === 'number' ? src.strokeTopWeight : 0;
      const rightW = 'strokeRightWeight' in src && typeof src.strokeRightWeight === 'number' ? src.strokeRightWeight : 0;
      const bottomW = 'strokeBottomWeight' in src && typeof src.strokeBottomWeight === 'number' ? src.strokeBottomWeight : 0;
      const leftW = 'strokeLeftWeight' in src && typeof src.strokeLeftWeight === 'number' ? src.strokeLeftWeight : 0;
      const hasIndividualStrokes = topW > 0 || rightW > 0 || bottomW > 0 || leftW > 0;

      let sw = 1;
      if ('strokeWeight' in node && typeof (node as any).strokeWeight === 'number') {
        sw = (node as any).strokeWeight;
      } else if (mainComp && 'strokeWeight' in mainComp && typeof (mainComp as any).strokeWeight === 'number') {
        sw = (mainComp as any).strokeWeight;
      } else if ('strokeWeight' in src && typeof src.strokeWeight === 'number') {
        sw = src.strokeWeight;
      }

      // strokeAlign: In Figma, strokeAlign can be INSIDE, CENTER, or OUTSIDE.
      let strokeAlign = 'INSIDE';
      if ('strokeAlign' in node && typeof (node as any).strokeAlign === 'string') {
        strokeAlign = (node as any).strokeAlign;
      } else if (mainComp && 'strokeAlign' in mainComp && typeof (mainComp as any).strokeAlign === 'string') {
        strokeAlign = (mainComp as any).strokeAlign;
      } else if ('strokeAlign' in src && typeof src.strokeAlign === 'string') {
        strokeAlign = src.strokeAlign;
      }

      // Figma AutoLayout property: strokesIncludedInLayout (true = Included in layout, false = Excluded from layout)
      let strokesIncluded: boolean | undefined = undefined;
      if ('strokesIncludedInLayout' in node && typeof (node as any).strokesIncludedInLayout === 'boolean') {
        strokesIncluded = (node as any).strokesIncludedInLayout;
      } else if (mainComp && 'strokesIncludedInLayout' in mainComp && typeof (mainComp as any).strokesIncludedInLayout === 'boolean') {
        strokesIncluded = (mainComp as any).strokesIncludedInLayout;
      } else if (parent && 'strokesIncludedInLayout' in parent && typeof (parent as any).strokesIncludedInLayout === 'boolean') {
        strokesIncluded = (parent as any).strokesIncludedInLayout;
      } else if (parent) {
        const parentMainComp = getMainComponent(parent as SceneNode);
        if (parentMainComp && 'strokesIncludedInLayout' in parentMainComp && typeof (parentMainComp as any).strokesIncludedInLayout === 'boolean') {
          strokesIncluded = (parentMainComp as any).strokesIncludedInLayout;
        }
      }

      if (hasIndividualStrokes) {
        if (topW > 0) styles.borderTop = `${formatUnit(topW, options.useRem, options.baseFontSize)} ${borderStyle} ${strokeColor}`;
        if (rightW > 0) styles.borderRight = `${formatUnit(rightW, options.useRem, options.baseFontSize)} ${borderStyle} ${strokeColor}`;
        if (bottomW > 0) styles.borderBottom = `${formatUnit(bottomW, options.useRem, options.baseFontSize)} ${borderStyle} ${strokeColor}`;
        if (leftW > 0) styles.borderLeft = `${formatUnit(leftW, options.useRem, options.baseFontSize)} ${borderStyle} ${strokeColor}`;
        styles.boxSizing = 'border-box';
      } else if (sw > 0) {
        const strokeVal = `${formatUnit(sw, options.useRem, options.baseFontSize)} ${borderStyle} ${strokeColor}`;
        styles.border = strokeVal;
        styles.boxSizing = 'border-box';
      }
    }
  }

  // 4. Effects (Drop Shadow, Inner Shadow, Layer Blur, Background Blur)
  let effectStyleId = TokenResolver.styleId(node, 'effectStyleId');
  if (!effectStyleId && mainComp?.effectStyleId) {
    effectStyleId = mainComp.effectStyleId;
  }

  const effectVar = resolver.varFor(effectStyleId);
  if (effectVar) {
    styles.boxShadow = effectVar;
  } else {
    let rawEffects: readonly Effect[] = [];
    if ('effects' in node && Array.isArray(node.effects) && node.effects.length > 0) {
      rawEffects = node.effects;
    } else if (mainComp && Array.isArray(mainComp.effects) && mainComp.effects.length > 0) {
      rawEffects = mainComp.effects;
    }

    if (rawEffects.length > 0) {
      // In Figma effects list and CSS box-shadow, the first listed shadow is rendered on top.
      const activeEffects = rawEffects.filter((e) => e.visible !== false);
      const shadows: string[] = [];

      for (const effect of activeEffects) {
        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
          const isInset = effect.type === 'INNER_SHADOW' ? 'inset ' : '';
          const x = formatUnit(effect.offset.x, options.useRem, options.baseFontSize);
          const y = formatUnit(effect.offset.y, options.useRem, options.baseFontSize);
          const radius = formatUnit(effect.radius, options.useRem, options.baseFontSize);
          const spread = formatUnit(effect.spread || 0, options.useRem, options.baseFontSize);

          const boundColorId =
            'boundVariables' in effect && effect.boundVariables && typeof effect.boundVariables === 'object'
              ? (effect.boundVariables as Record<string, { id?: string }>)?.['color']?.id
              : undefined;

          const color = resolver.resolveColor(effect.color, effect.color.a, boundColorId);
          shadows.push(`${isInset}${x} ${y} ${radius} ${spread} ${color}`);
        } else if (effect.type === 'LAYER_BLUR') {
          styles.filter = `blur(${formatUnit(effect.radius, options.useRem, options.baseFontSize)})`;
        } else if (effect.type === 'BACKGROUND_BLUR') {
          styles.backdropFilter = `blur(${formatUnit(effect.radius, options.useRem, options.baseFontSize)})`;
        }
      }

      if (shadows.length > 0) {
        styles.boxShadow = shadows.join(', ');
      }
    }
  }



  // 5. Opacity
  if ('opacity' in node && typeof node.opacity === 'number' && node.opacity < 1) {
    styles.opacity = Math.round(node.opacity * 100) / 100;
  }

  // 5b. Blend mode — Figma MULTIPLY/SCREEN/etc map 1:1 to CSS
  if ('blendMode' in node && typeof node.blendMode === 'string' && node.blendMode !== 'NORMAL' && node.blendMode !== 'PASS_THROUGH') {
    const blendMap: Record<string, string> = {
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
    const cssBlend = blendMap[node.blendMode];
    if (cssBlend) styles.mixBlendMode = cssBlend;
  }

  // 5c. Mask nodes — Figma masks clip siblings; closest CSS is clip-path via bounds
  if ('isMask' in node && node.isMask === true) {
    styles.clipPath = 'inset(0 round 0px)';
  }

  // 6. Rotation / Transform
  if ('rotation' in node && typeof node.rotation === 'number' && Math.round(node.rotation) !== 0) {
    const angle = Math.round(-node.rotation * 10) / 10;
    styles.transform = `rotate(${angle}deg)`;
  }

  return styles;
}
