import { VisualStyles, ConversionOptions } from '../types/ir';
import { gradientToCss, formatUnit } from './utils';
import { planStroke } from './strokes';
import { cssBlendMode } from './blend';
import { isInLayoutFlow, readDividerGeometry } from './dividers';
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
  let fillSource: SceneNode = node;
  const mainComp = getMainComponent(node);

  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    fillsList = node.fills;
  } else if (mainComp && Array.isArray(mainComp.fills) && mainComp.fills.length > 0) {
    fillsList = mainComp.fills;
    fillSource = mainComp;
  }

  if (fillsList.length === 0) return;
  // Keep the original index: `boundVariables.fills` is positional, and the
  // paint that is visible is not necessarily the first one.
  const activeFills = fillsList
    .map((fill, index) => ({ fill, index }))
    .filter(({ fill }) => fill.visible !== false);
  let fillStyleId = TokenResolver.styleId(node, 'fillStyleId');
  if (!fillStyleId && mainComp?.fillStyleId && typeof mainComp.fillStyleId === 'string') {
    fillStyleId = mainComp.fillStyleId;
  }

  const bindingFor = (fill: Paint, index: number): string | null =>
    TokenResolver.paintBoundId(fill) ??
    TokenResolver.boundArrayId(fillSource, 'fills', index) ??
    (fillSource !== node ? TokenResolver.boundArrayId(node, 'fills', index) : null);

  // Reverse so top fill in Figma is first in CSS background
  const layers = activeFills.length > 1 ? [...activeFills].reverse() : activeFills;

  const width = 'width' in node && typeof node.width === 'number' ? node.width : 100;
  const height = 'height' in node && typeof node.height === 'number' ? node.height : 100;

  for (let idx = 0; idx < layers.length; idx++) {
    const { fill, index } = layers[idx]!;
    const isLastLayer = idx === layers.length - 1;
    const fillOpacity = typeof fill.opacity === 'number' ? fill.opacity : 1;

    if (fill.type === 'SOLID') {
      const colorVal = resolver.resolveColor(
        fill.color,
        fillOpacity,
        bindingFor(fill, index),
        fillStyleId
      );
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
    } else if (
      fill.type === 'GRADIENT_LINEAR' ||
      fill.type === 'GRADIENT_RADIAL' ||
      fill.type === 'GRADIENT_ANGULAR' ||
      fill.type === 'GRADIENT_DIAMOND'
    ) {
      // The gradient's own transform carries where it starts and how big it is.
      // Reading only the stop colours — which is what a bare `circle` did —
      // turns a corner glow into a full-bleed disc and puts an angular gradient
      // nowhere near the angle it was drawn at. Each stop also carries its own
      // binding: one stop can be a token while its neighbour is literal.
      bgLayers.push(
        gradientToCss(
          fill,
          width,
          height,
          (color, alpha, stop) =>
            resolver.resolveColor(color, alpha, TokenResolver.paintBoundId(stop)),
          fillOpacity
        )
      );
    }
  }
}

/**
 * The `x/y/width/height` of an SVG filter region that keeps `padXPx` of paint
 * on the left and right and `padYPx` on the top and bottom of the element.
 *
 * The pads are measured in design px but written as percentages of the element,
 * so the region stays wide enough however the layer is later scaled.
 */
function textureFilterRegion(padXPx: number, padYPx: number, width: number, height: number): string {
  if (width <= 0 || height <= 0) return '';
  const one = (v: number) => Math.round(v * 10) / 10;
  const px = one((Math.max(0, padXPx) / width) * 100);
  const py = one((Math.max(0, padYPx) / height) * 100);
  return ` x='-${px}%' y='-${py}%' width='${one(100 + px * 2)}%' height='${one(100 + py * 2)}%'`;
}

/**
 * How far one effect paints beyond the layer's own box, per axis.
 *
 * A Gaussian filter carries roughly three standard deviations of visible
 * result, which is what `blur(radius)` and a Figma blur radius both mean; a
 * drop shadow starts from that and is pushed further by its offset and spread.
 * Inner shadows and background blurs never leave the box.
 */
function effectOuterReach(effect: Effect): { x: number; y: number } {
  if (effect.type === 'LAYER_BLUR') {
    const reach = effect.radius * 3;
    return { x: reach, y: reach };
  }
  if (effect.type === 'DROP_SHADOW') {
    const blurred = effect.radius * 3 + (effect.spread || 0);
    return {
      x: Math.abs(effect.offset.x) + blurred,
      y: Math.abs(effect.offset.y) + blurred,
    };
  }
  return { x: 0, y: 0 };
}

/** Channel-for-channel colour equality, used to tell a style from its node. */
function effectColorEqual(a: RGBA, b: RGBA): boolean {
  return (
    Math.abs(a.r - b.r) < 0.0001 &&
    Math.abs(a.g - b.g) < 0.0001 &&
    Math.abs(a.b - b.b) < 0.0001 &&
    Math.abs(a.a - b.a) < 0.0001
  );
}

/**
 * Whether a layer's effects still render what its effect style says.
 *
 * The style id survives local edits. Referencing the style's token then paints
 * the stored shadow, not the one on the canvas; the raw effects are the truth
 * and the token is only a name for them while the two agree.
 */
function effectsMatch(a: readonly Effect[], b: readonly Effect[]): boolean {
  const active = (list: readonly Effect[]) => list.filter((e) => e.visible !== false);
  const left = active(a);
  const right = active(b);
  if (left.length !== right.length) return false;

  return left.every((effect, i) => {
    const other = right[i];
    if (!other || effect.type !== other.type) return false;
    const radiusA = 'radius' in effect ? effect.radius : 0;
    const radiusB = 'radius' in other ? other.radius : 0;
    if (Math.abs(radiusA - radiusB) > 0.001) return false;

    if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
      const o = other as typeof effect;
      if (Math.abs(effect.offset.x - o.offset.x) > 0.001) return false;
      if (Math.abs(effect.offset.y - o.offset.y) > 0.001) return false;
      if (Math.abs((effect.spread || 0) - (o.spread || 0)) > 0.001) return false;
      if (!effectColorEqual(effect.color, o.color)) return false;
    }
    return true;
  });
}

/**
 * True when any value inside an effect is bound to a variable. Such an effect
 * changes with the node's mode, so a flat style token (which carries one
 * resolved value) would freeze it out of the mode.
 */
function effectHasBoundFields(effect: Effect): boolean {
  return (
    TokenResolver.effectBoundId(effect, 'color') !== null ||
    TokenResolver.effectBoundId(effect, 'radius') !== null ||
    TokenResolver.effectBoundId(effect, 'spread') !== null ||
    TokenResolver.effectBoundId(effect, 'offsetX') !== null ||
    TokenResolver.effectBoundId(effect, 'offsetY') !== null
  );
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
  const resolver = new TokenResolver(tokenRegistry, {
    baseFontSize: options.baseFontSize,
    node,
  });
  const mainComp = getMainComponent(node);

  // A divider that sits in a layout flow is sized in its visual orientation
  // (see `dividers.ts`). Its border has to follow that same axis, and its
  // rotation is already expressed by the swapped box — emitting the CSS
  // rotation as well would turn the line back the other way.
  const divider = readDividerGeometry(node);
  const normalizedDivider = divider && isInLayoutFlow(node, parent ?? null) ? divider : null;

  // 1. Fills / Background
  const bgLayers: string[] = [];
  extractFills(node, resolver, bgLayers);
  if (bgLayers.length > 0) {
    styles.background = bgLayers.join(', ');
  }

  // 2. Corner Radius (Border Radius)
  if (node.type === 'ELLIPSE') {
    styles.borderRadius = '50%';
  } else {
    let cr: number | typeof figma.mixed | undefined =
      'cornerRadius' in node ? (node.cornerRadius as number | typeof figma.mixed) : undefined;
    let targetNode: Record<string, unknown> = node as unknown as Record<string, unknown>;

    if ((cr === undefined || cr === 0) && mainComp && 'cornerRadius' in mainComp) {
      cr = mainComp.cornerRadius;
      targetNode = mainComp as unknown as Record<string, unknown>;
    }

    const radiusBinding = (field: 'cornerRadius' | 'topLeftRadius' | 'topRightRadius' | 'bottomRightRadius' | 'bottomLeftRadius'): string | null =>
      TokenResolver.boundId(node, field) ??
      (mainComp ? TokenResolver.boundId(mainComp, field) : null);

    if (typeof cr === 'number' && cr > 0) {
      const nodeW = 'width' in node && typeof (node as any).width === 'number' ? (node as any).width : 0;
      const nodeH = 'height' in node && typeof (node as any).height === 'number' ? (node as any).height : 0;
      if (nodeW > 0 && nodeH > 0 && Math.abs(nodeW - nodeH) <= 1 && cr >= nodeW / 2 - 2) {
        styles.borderRadius = '50%';
      } else {
        styles.borderRadius =
          resolver.lengthFor(radiusBinding('cornerRadius'), cr) ??
          formatUnit(cr, options.useRem, options.baseFontSize);
      }
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
        return (
          resolver.lengthFor(radiusBinding(k), val) ??
          formatUnit(val, options.useRem, options.baseFontSize)
        );
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

  const plan = planStroke(
    strokeList,
    strokeSource as unknown as Record<string, unknown>,
    node.type === 'LINE' || normalizedDivider !== null
  );

  if (plan.kind !== 'none') {
    const src = strokeSource as FrameNode;
    const isDashed = 'dashPattern' in src && Array.isArray(src.dashPattern) && src.dashPattern.length > 0;
    const borderStyle = isDashed ? 'dashed' : 'solid';
    const u = (px: number) => formatUnit(px, options.useRem, options.baseFontSize);

    // The paint can carry a binding of its own; `strokes[0]` is only the
    // fallback for older API payloads that bind the array entry instead.
    const boundStrokeId =
      TokenResolver.paintBoundId(plan.paint) ??
      TokenResolver.boundArrayId(strokeSource, 'strokes', 0) ??
      (strokeSource !== node ? TokenResolver.boundArrayId(node, 'strokes', 0) : null);
    const strokeWeightId =
      TokenResolver.boundId(strokeSource, 'strokeWeight') ??
      (strokeSource !== node ? TokenResolver.boundId(node, 'strokeWeight') : null);
    // A token only stands in for the weight it actually holds; per-side
    // weights that differ from it keep their raw value.
    const w = (px: number) => resolver.lengthFor(strokeWeightId, px) ?? u(px);
    let strokeStyleId = TokenResolver.styleId(node, 'strokeStyleId');
    if (!strokeStyleId && mainComp?.strokeStyleId) {
      strokeStyleId = mainComp.strokeStyleId;
    }

    // A solid stroke has one colour, so the per-side path and the shorthand
    // path share it. A gradient has no single colour — see below.
    if (plan.kind === 'solid') {
      const strokeColor = resolver.resolveColor(
        plan.paint.color,
        plan.paint.opacity ?? 1,
        boundStrokeId,
        strokeStyleId
      );
      const { weights, perSide } = plan;
      if (normalizedDivider) {
        // One line, one side. The divider's box was already turned to its
        // visual axis, so the stroke is the only thing left to orient.
        const weight = Math.max(weights.top, weights.right, weights.bottom, weights.left);
        if (weight > 0) {
          const strokeVal = `${w(weight)} ${borderStyle} ${strokeColor}`;
          if (normalizedDivider.axis === 'vertical') {
            styles.borderRight = strokeVal;
          } else {
            styles.borderTop = strokeVal;
          }
        }
        styles.boxSizing = 'border-box';
      } else if (perSide) {
        if (weights.top > 0) styles.borderTop = `${w(weights.top)} ${borderStyle} ${strokeColor}`;
        if (weights.right > 0) styles.borderRight = `${w(weights.right)} ${borderStyle} ${strokeColor}`;
        if (weights.bottom > 0) styles.borderBottom = `${w(weights.bottom)} ${borderStyle} ${strokeColor}`;
        if (weights.left > 0) styles.borderLeft = `${w(weights.left)} ${borderStyle} ${strokeColor}`;
        styles.boxSizing = 'border-box';
      } else {
        const sw = weights.top;
        if (sw > 0) {
          const strokeVal = `${w(sw)} ${borderStyle} ${strokeColor}`;
          const hasW = 'width' in node && typeof (node as any).width === 'number';
          const hasH = 'height' in node && typeof (node as any).height === 'number';
          const nodeW = hasW ? (node as any).width as number : undefined;
          const nodeH = hasH ? (node as any).height as number : undefined;
          const isDividerNamed = /^(line|divider|separator|rule|border|stroke|خط|جداکننده)/i.test((node.name || '').trim());
          const isVectorOrShape = node.type === 'VECTOR' || node.type === 'RECTANGLE';

          let is1DLine = node.type === 'LINE';
          let isVertical = false;

          if (node.type === 'LINE') {
            isVertical = (hasW && nodeW! < 1 && hasH && nodeH! >= 1) ||
                         (hasH && nodeH! > 1 && (!hasW || nodeW! <= 1));
          } else if (isVectorOrShape && hasW && hasH) {
            const isHoriz = (nodeH! <= 1 && nodeW! >= 10) || (isDividerNamed && nodeH! <= 2 && nodeW! >= nodeH!) || (nodeH === 0 && nodeW! > 0);
            const isVert = (nodeW! <= 1 && nodeH! >= 10) || (isDividerNamed && nodeW! <= 2 && nodeH! >= nodeW!) || (nodeW === 0 && nodeH! > 0);
            if (isHoriz) {
              is1DLine = true;
              isVertical = false;
            } else if (isVert) {
              is1DLine = true;
              isVertical = true;
            }
          }

          if (is1DLine) {
            if (isVertical) {
              styles.borderRight = strokeVal;
            } else {
              styles.borderTop = strokeVal;
            }
          } else {
            styles.border = strokeVal;
          }
          styles.boxSizing = 'border-box';
        }
      }
    } else if (plan.kind === 'gradient') {
      const width = 'width' in node && typeof node.width === 'number' ? node.width : 100;
      const height = 'height' in node && typeof node.height === 'number' ? node.height : 100;
      const image = gradientToCss(
        plan.paint,
        width,
        height,
        (color, alpha, stop) =>
          resolver.resolveColor(color, alpha, TokenResolver.paintBoundId(stop)),
        plan.paint.opacity ?? 1
      );

      // Individual sides cannot form a ring. The first stop is the only colour
      // the gradient actually states, so a top-only gradient stroke becomes a
      // top-only border in that colour — the nearest thing CSS can say, instead
      // of dropping the stroke entirely.
      const first = plan.paint.gradientStops[0];
      const sideColor = first
        ? resolver.resolveColor(
            first.color,
            (first.color.a ?? 1) * (plan.paint.opacity ?? 1),
            TokenResolver.paintBoundId(first)
          )
        : resolver.resolveColor({ r: 0, g: 0, b: 0 }, 1);

      if (plan.ring) {
        // A ring on a pseudo-element, not a `border`: `border-image` is the
        // only CSS border that takes a gradient and it ignores
        // `border-radius`, which squares off every rounded card it touches.
        styles.gradientBorder = { image, width: w(plan.weights.top) };
      } else if (normalizedDivider) {
        const weight = Math.max(
          plan.weights.top,
          plan.weights.right,
          plan.weights.bottom,
          plan.weights.left
        );
        if (weight > 0) {
          const strokeVal = `${w(weight)} ${borderStyle} ${sideColor}`;
          if (normalizedDivider.axis === 'vertical') {
            styles.borderRight = strokeVal;
          } else {
            styles.borderTop = strokeVal;
          }
        }
        styles.boxSizing = 'border-box';
      } else {
        const { weights } = plan;
        if (weights.top > 0) styles.borderTop = `${w(weights.top)} ${borderStyle} ${sideColor}`;
        if (weights.right > 0) styles.borderRight = `${w(weights.right)} ${borderStyle} ${sideColor}`;
        if (weights.bottom > 0) styles.borderBottom = `${w(weights.bottom)} ${borderStyle} ${sideColor}`;
        if (weights.left > 0) styles.borderLeft = `${w(weights.left)} ${borderStyle} ${sideColor}`;
        styles.boxSizing = 'border-box';
      }
    }
  }

  // 4. Effects (Drop Shadow, Inner Shadow, Layer Blur, Background Blur)
  let effectStyleId = TokenResolver.styleId(node, 'effectStyleId');
  if (!effectStyleId && mainComp?.effectStyleId) {
    effectStyleId = mainComp.effectStyleId;
  }

  let rawEffects: readonly Effect[] = [];
  if ('effects' in node && Array.isArray(node.effects) && node.effects.length > 0) {
    rawEffects = node.effects;
  } else if (mainComp && Array.isArray(mainComp.effects) && mainComp.effects.length > 0) {
    rawEffects = mainComp.effects;
  }

  const effectStyle = resolver.effectStyle(effectStyleId);

  // The style's token is only a name for what is on the canvas while the two
  // still agree. An effect edited after the style was applied keeps the id but
  // changes the picture, and the token would quietly restore the old one.
  // Effects with bound fields are excluded too: the token holds one resolved
  // value and could not follow the node's variable mode.
  const canUseStyleTokens =
    effectStyle !== null &&
    rawEffects.length > 0 &&
    effectsMatch(rawEffects, effectStyle.effects) &&
    !effectStyle.effects.some(effectHasBoundFields);

  let appliedEffectStyle = false;
  if (effectStyle && canUseStyleTokens) {
    const active = effectStyle.effects.filter((e) => e.visible !== false);
    const shadowEffects = active.filter(
      (e) => e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW'
    );

    if (shadowEffects.length === active.length && active.length > 0 && effectStyle.shadow) {
      const ref = `var(${effectStyle.shadow.cssVarName})`;
      if (node.type !== 'TEXT') {
        styles.boxShadow = ref;
        appliedEffectStyle = true;
      } else if (active.every((e) => e.type === 'DROP_SHADOW' && (e.spread || 0) === 0)) {
        // `text-shadow` has neither spread nor inset; a style that needs either
        // cannot be expressed as the token and falls through to the raw path.
        styles.textShadow = ref;
        appliedEffectStyle = true;
      }
    } else if (
      active.length > 0 &&
      active.every((e) => e.type === 'LAYER_BLUR') &&
      effectStyle.filter
    ) {
      styles.filter = `var(${effectStyle.filter.cssVarName})`;
      appliedEffectStyle = true;
    } else if (
      active.length > 0 &&
      active.every((e) => e.type === 'BACKGROUND_BLUR') &&
      effectStyle.backdropFilter
    ) {
      styles.backdropFilter = `var(${effectStyle.backdropFilter.cssVarName})`;
      appliedEffectStyle = true;
    }
  }

  if (!appliedEffectStyle && rawEffects.length > 0) {
    // In Figma effects list and CSS box-shadow, the first listed shadow is rendered on top.
    const activeEffects = rawEffects.filter((e) => e.visible !== false);
    const shadows: string[] = [];
    const textShadows: string[] = [];
    const filters: string[] = [];
    const backdropFilters: string[] = [];

    // A CSS filter chain runs left to right, and an SVG filter only paints
    // inside its own region — which defaults to the element's box plus 10%.
    // So a texture that follows a blur, or a shadow that runs beside it, gets
    // cut into a square. The region has to be widened by everything the other
    // effects push outside the box.
    const outsideReach = activeEffects.reduce(
      (widest, effect) => {
        const reach = effectOuterReach(effect);
        return { x: Math.max(widest.x, reach.x), y: Math.max(widest.y, reach.y) };
      },
      { x: 0, y: 0 }
    );
    const boxWidth = 'width' in node && typeof node.width === 'number' ? node.width : 0;
    const boxHeight = 'height' in node && typeof node.height === 'number' ? node.height : 0;

    for (const effect of activeEffects) {
      const lengthFor = (field: 'radius' | 'spread' | 'offsetX' | 'offsetY', px: number): string =>
        resolver.lengthFor(TokenResolver.effectBoundId(effect, field), px) ??
        formatUnit(px, options.useRem, options.baseFontSize);

      if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
        const isInset = effect.type === 'INNER_SHADOW' ? 'inset ' : '';
        const x = lengthFor('offsetX', effect.offset.x);
        const y = lengthFor('offsetY', effect.offset.y);
        const radius = lengthFor('radius', effect.radius);
        const spread = lengthFor('spread', effect.spread || 0);

        const color = resolver.resolveColor(
          effect.color,
          effect.color.a,
          TokenResolver.effectBoundId(effect, 'color')
        );

        // Type casts its shadow from the glyphs, not from its box. Figma
        // applies the effect to the letterforms, so it has to leave as
        // `text-shadow`; as `box-shadow` it would draw a rectangle around the
        // text block, which is a different picture at every size.
        if (node.type === 'TEXT') {
          // `text-shadow` has no spread, and an inner shadow has no text
          // equivalent at all — dropping it beats drawing the wrong shape.
          if (effect.type === 'DROP_SHADOW') textShadows.push(`${x} ${y} ${radius} ${color}`);
          continue;
        }

        shadows.push(`${isInset}${x} ${y} ${radius} ${spread} ${color}`);
      } else if (effect.type === 'LAYER_BLUR') {
        filters.push(`blur(${lengthFor('radius', effect.radius)})`);
      } else if (effect.type === 'BACKGROUND_BLUR') {
        backdropFilters.push(`blur(${lengthFor('radius', effect.radius)})`);
      } else if ((effect as any).type === 'TEXTURE' || (effect as any).type === 'NOISE') {
        const textureEffect = effect as any;
        const radius = typeof textureEffect.radius === 'number' ? textureEffect.radius : 3;
        const sizeX =
          textureEffect.noiseSizeVector && typeof textureEffect.noiseSizeVector.x === 'number'
            ? textureEffect.noiseSizeVector.x
            : typeof textureEffect.noiseSize === 'number'
              ? textureEffect.noiseSize
              : 0.1;
        const sizeY =
          textureEffect.noiseSizeVector && typeof textureEffect.noiseSizeVector.y === 'number'
            ? textureEffect.noiseSizeVector.y
            : typeof textureEffect.noiseSize === 'number'
              ? textureEffect.noiseSize
              : 0.1;
        const freqX = Math.min(Math.max(Math.round((0.08 / Math.max(sizeX, 0.01)) * 100) / 100, 0.05), 2.0);
        const freqY = Math.min(Math.max(Math.round((0.08 / Math.max(sizeY, 0.01)) * 100) / 100, 0.05), 2.0);
        const freqStr = freqX === freqY ? `${freqX}` : `${freqX} ${freqY}`;
        // The displacement itself pushes the edge out by up to its own scale.
        const region = textureFilterRegion(outsideReach.x + radius, outsideReach.y + radius, boxWidth, boxHeight);
        // `clipToShape` is Figma saying the texture roughens the *inside* of
        // the layer and leaves its outline alone. Compositing the displaced
        // result back into the source alpha is what keeps a blurred circle
        // round instead of a torn one.
        const clip = textureEffect.clipToShape === false ? '' : `<feComposite in='d' in2='SourceGraphic' operator='in'/>`;
        const svgFilter = `<svg xmlns='http://www.w3.org/2000/svg'><filter id='f'${region}><feTurbulence type='fractalNoise' baseFrequency='${freqStr}' numOctaves='3' result='n'/><feDisplacementMap in='SourceGraphic' in2='n' scale='${radius}' xChannelSelector='R' yChannelSelector='G' result='d'/>${clip}</filter></svg>`;
        const encoded = encodeURIComponent(svgFilter).replace(/'/g, '%27');
        filters.push(`url('data:image/svg+xml,${encoded}#f')`);
      }
    }

    if (shadows.length > 0) {
      styles.boxShadow = shadows.join(', ');
    }
    if (textShadows.length > 0) {
      styles.textShadow = textShadows.join(', ');
    }
    if (filters.length > 0) {
      styles.filter = filters.join(' ');
    }
    if (backdropFilters.length > 0) {
      styles.backdropFilter = backdropFilters.join(' ');
    }
  }



  // 5. Opacity
  if ('opacity' in node && typeof node.opacity === 'number' && node.opacity < 1) {
    styles.opacity =
      resolver.numberFor(TokenResolver.boundId(node, 'opacity'), node.opacity) ??
      Math.round(node.opacity * 100) / 100;
  }

  // 5b. Blend mode — Figma MULTIPLY/SCREEN/etc map 1:1 to CSS
  const cssBlend = cssBlendMode(
    'blendMode' in node && typeof node.blendMode === 'string' ? node.blendMode : null
  );
  if (cssBlend) styles.mixBlendMode = cssBlend;

  // 5c. Masks are deliberately absent here. A mask is a clip on the *siblings*
  // of the mask node, not on the node itself, so it cannot be decided from one
  // node's own properties — see `masks.ts` and the mask pass in `index.ts`.

  // 6. Rotation / Transform
  //
  // A normalized divider already stands on its visual axis: its box was
  // swapped in `layout.ts` and its border follows that axis. Emitting the CSS
  // rotation on top would turn it back a quarter turn and undo the fix.
  if (
    !normalizedDivider &&
    'rotation' in node &&
    typeof node.rotation === 'number' &&
    Math.round(node.rotation) !== 0
  ) {
    const angle = Math.round(-node.rotation * 10) / 10;
    styles.transform = `rotate(${angle}deg)`;
  }

  return styles;
}
