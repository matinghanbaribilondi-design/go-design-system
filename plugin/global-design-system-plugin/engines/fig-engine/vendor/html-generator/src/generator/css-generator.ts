import { IRNode, ConversionOptions, LayoutStyles, VisualStyles, TypographyStyles } from '../plugin/types/ir';
import { formatUnit } from '../plugin/converter/utils';
import { FONT_STACK_LTR, FONT_STACK_RTL } from '../shared/constants';
import { responsiveEnabled } from '../shared/responsive';
import { fallbackFaceCss, overridesFor } from '../shared/font-metrics';

/**
 * Converts layout styles to CSS declarations.
 * `options` is required so raw padding numbers honour the px/rem setting.
 */
function layoutToCssDeclarations(layout: LayoutStyles, options: ConversionOptions): string[] {
  const decs: string[] = [];

  if (layout.display) decs.push(`display: ${layout.display};`);
  if (layout.flexDirection) decs.push(`flex-direction: ${layout.flexDirection};`);
  if (layout.flexWrap) decs.push(`flex-wrap: ${layout.flexWrap};`);
  if (layout.justifyContent) decs.push(`justify-content: ${layout.justifyContent};`);
  if (layout.alignItems) decs.push(`align-items: ${layout.alignItems};`);
  if (layout.gridTemplateColumns) decs.push(`grid-template-columns: ${layout.gridTemplateColumns};`);
  if (layout.gridTemplateRows) decs.push(`grid-template-rows: ${layout.gridTemplateRows};`);
  if (layout.gridColumn) decs.push(`grid-column: ${layout.gridColumn};`);
  if (layout.gridRow) decs.push(`grid-row: ${layout.gridRow};`);
  if (layout.gap) decs.push(`gap: ${layout.gap};`);
  if (layout.rowGap) decs.push(`row-gap: ${layout.rowGap};`);
  if (layout.columnGap) decs.push(`column-gap: ${layout.columnGap};`);

  if (layout.padding) {
    const { top, right, bottom, left } = layout.padding;
    // A padding value is either a raw px number from Figma or an already-built
    // CSS string (a fluid `clamp()`); normalise both to a CSS length.
    const u = (v: number | string) =>
      typeof v === 'string' ? v : formatUnit(v, options.useRem, options.baseFontSize);
    if (top === bottom && right === left && top === right) {
      decs.push(`padding: ${u(top)};`);
    } else if (top === bottom && right === left) {
      decs.push(`padding: ${u(top)} ${u(right)};`);
    } else {
      decs.push(`padding: ${u(top)} ${u(right)} ${u(bottom)} ${u(left)};`);
    }
  }

  if (layout.containerType) decs.push(`container-type: ${layout.containerType};`);
  if (layout.position) decs.push(`position: ${layout.position};`);
  if (layout.boxSizing) decs.push(`box-sizing: ${layout.boxSizing};`);
  if (layout.margin !== undefined) decs.push(`margin: ${layout.margin};`);
  if (layout.marginInline !== undefined) decs.push(`margin-inline: ${layout.marginInline};`);
  if (layout.marginLeft !== undefined) decs.push(`margin-left: ${layout.marginLeft};`);
  if (layout.marginRight !== undefined) decs.push(`margin-right: ${layout.marginRight};`);
  if (layout.marginTop !== undefined) decs.push(`margin-top: ${layout.marginTop};`);
  if (layout.marginBottom !== undefined) decs.push(`margin-bottom: ${layout.marginBottom};`);
  if (layout.left !== undefined) decs.push(`left: ${layout.left};`);
  if (layout.top !== undefined) decs.push(`top: ${layout.top};`);
  if (layout.right !== undefined) decs.push(`right: ${layout.right};`);
  if (layout.bottom !== undefined) decs.push(`bottom: ${layout.bottom};`);
  // NOTE: `transform` is emitted by visualToCssDeclarations (merged). Skip here to avoid duplicates.

  if (layout.width !== undefined) decs.push(`width: ${layout.width};`);
  if (layout.height !== undefined) decs.push(`height: ${layout.height};`);
  if (layout.minWidth !== undefined) decs.push(`min-width: ${layout.minWidth};`);
  if (layout.maxWidth !== undefined) decs.push(`max-width: ${layout.maxWidth};`);
  if (layout.minHeight !== undefined) decs.push(`min-height: ${layout.minHeight};`);
  if (layout.maxHeight !== undefined) decs.push(`max-height: ${layout.maxHeight};`);

  if (layout.flexGrow !== undefined) decs.push(`flex-grow: ${layout.flexGrow};`);
  if (layout.flexShrink !== undefined) decs.push(`flex-shrink: ${layout.flexShrink};`);
  if (layout.alignSelf !== undefined) decs.push(`align-self: ${layout.alignSelf};`);
  if (layout.overflow !== undefined) decs.push(`overflow: ${layout.overflow};`);
  if (layout.zIndex !== undefined) decs.push(`z-index: ${layout.zIndex};`);
  if (layout.direction !== undefined) decs.push(`direction: ${layout.direction};`);
  if (layout.flexBasis !== undefined) decs.push(`flex-basis: ${layout.flexBasis};`);
  if (layout.aspectRatio !== undefined) decs.push(`aspect-ratio: ${layout.aspectRatio};`);
  if (layout.objectFit !== undefined) decs.push(`object-fit: ${layout.objectFit};`);

  return decs;
}

/**
 * Converts visual styles to CSS declarations.
 * `layoutTransform` is merged with `visual.transform` so centering + rotation
 * don't overwrite each other (previously only one survived).
 */
function visualToCssDeclarations(visual: VisualStyles, layoutTransform?: string): string[] {
  const decs: string[] = [];

  if (visual.background) decs.push(`background: ${visual.background};`);
  if (visual.backgroundSize) decs.push(`background-size: ${visual.backgroundSize};`);
  if (visual.backgroundRepeat) decs.push(`background-repeat: ${visual.backgroundRepeat};`);
  if (visual.backgroundPosition) decs.push(`background-position: ${visual.backgroundPosition};`);
  if (visual.borderRadius) decs.push(`border-radius: ${visual.borderRadius};`);
  if (visual.boxSizing) decs.push(`box-sizing: ${visual.boxSizing};`);
  if (visual.outline) decs.push(`outline: ${visual.outline};`);
  if (visual.outlineOffset) decs.push(`outline-offset: ${visual.outlineOffset};`);
  if (visual.border) decs.push(`border: ${visual.border};`);
  if (visual.borderTop) decs.push(`border-top: ${visual.borderTop};`);
  if (visual.borderRight) decs.push(`border-right: ${visual.borderRight};`);
  if (visual.borderBottom) decs.push(`border-bottom: ${visual.borderBottom};`);
  if (visual.borderLeft) decs.push(`border-left: ${visual.borderLeft};`);
  if (visual.boxShadow) decs.push(`box-shadow: ${visual.boxShadow};`);
  if (visual.textShadow) decs.push(`text-shadow: ${visual.textShadow};`);
  if (visual.opacity !== undefined) decs.push(`opacity: ${visual.opacity};`);
  if (visual.filter) decs.push(`filter: ${visual.filter};`);
  if (visual.backdropFilter) {
    decs.push(`backdrop-filter: ${visual.backdropFilter};`);
    decs.push(`-webkit-backdrop-filter: ${visual.backdropFilter};`);
  }
  if (visual.mixBlendMode) decs.push(`mix-blend-mode: ${visual.mixBlendMode};`);
  if (visual.isolation) decs.push(`isolation: ${visual.isolation};`);
  if (visual.clipPath) decs.push(`clip-path: ${visual.clipPath};`);
  // Merge layout centering transform + visual rotation (both must survive)
  const mergedTransform = [layoutTransform, visual.transform].filter(Boolean).join(' ');
  if (mergedTransform) decs.push(`transform: ${mergedTransform};`);

  return decs;
}

/**
 * Converts typography styles to CSS declarations
 */
function typographyToCssDeclarations(typo?: TypographyStyles): string[] {
  if (!typo) return [];
  const decs: string[] = [];

  if (typo.fontFamily) decs.push(`font-family: ${typo.fontFamily};`);
  if (typo.fontSize) decs.push(`font-size: ${typo.fontSize};`);
  if (typo.fontWeight) decs.push(`font-weight: ${typo.fontWeight};`);
  if (typo.fontStyle) decs.push(`font-style: ${typo.fontStyle};`);
  if (typo.fontVariantNumeric) decs.push(`font-variant-numeric: ${typo.fontVariantNumeric};`);
  if (typo.lineHeight) decs.push(`line-height: ${typo.lineHeight};`);
  if (typo.letterSpacing && typo.letterSpacing !== 'normal') decs.push(`letter-spacing: ${typo.letterSpacing};`);
  if (typo.textAlign) decs.push(`text-align: ${typo.textAlign};`);
  if (typo.color) decs.push(`color: ${typo.color};`);
  if (typo.textDecoration) decs.push(`text-decoration: ${typo.textDecoration};`);
  if (typo.textTransform) decs.push(`text-transform: ${typo.textTransform};`);
  if (typo.whiteSpace) decs.push(`white-space: ${typo.whiteSpace};`);
  if (typo.wordBreak) decs.push(`word-break: ${typo.wordBreak};`);
  if (typo.overflowWrap) decs.push(`overflow-wrap: ${typo.overflowWrap};`);
  if (typo.textOverflow) decs.push(`text-overflow: ${typo.textOverflow};`);
  if (typo.display) decs.push(`display: ${typo.display};`);
  if (typo.webkitLineClamp !== undefined) decs.push(`-webkit-line-clamp: ${typo.webkitLineClamp};`);
  if (typo.webkitBoxOrient) decs.push(`-webkit-box-orient: ${typo.webkitBoxOrient};`);
  if (typo.overflow) decs.push(`overflow: ${typo.overflow};`);
  if (typo.direction) {
    decs.push(`direction: ${typo.direction};`);
    decs.push('unicode-bidi: isolate;');
  }

  if (typo.isList) {
    decs.push('list-style: none;');
    decs.push('margin: 0;');
    decs.push('padding: 0;');
    decs.push('display: flex;');
    decs.push('flex-direction: column;');
    if (typo.listGap) decs.push(`gap: ${typo.listGap};`);
  }

  return decs;
}

/**
 * A gradient stroke as a ring.
 *
 * `border-image` is the only CSS border that accepts a gradient, and it is
 * painted over the border box as a rectangle: `border-radius` is ignored, so a
 * 24px card with a gradient border arrives with square corners. A masked
 * pseudo-element keeps both properties — `border-radius: inherit` follows the
 * shape, and excluding the content box leaves exactly the border band.
 *
 * The ring sits inside the element, which is Figma's default `INSIDE` stroke
 * alignment. `box-sizing: border-box` is stated explicitly because the ring has
 * to be the same thickness whether or not the reset is included.
 */
function gradientBorderRule(
  className: string,
  ring: { image: string; width: string }
): string {
  const mask = 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)';
  return `.${className}::after {
  content: "";
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  border-radius: inherit;
  padding: ${ring.width};
  background: ${ring.image};
  -webkit-mask: ${mask};
  -webkit-mask-composite: xor;
  mask: ${mask};
  mask-composite: exclude;
  pointer-events: none;
}`;
}

/**
 * Generates @font-face rules for custom uploaded fonts or local font scaffolding
 */
export function generateFontFaceRules(options: ConversionOptions, forZip: boolean = false): string {
  if (!options.customFonts || options.customFonts.length === 0) {
    return '';
  }

  const rules: string[] = ['/* --- Custom Typography (@font-face) --- */'];
  /** A family's weights all share one metric twin; registering it twice adds nothing. */
  const twinSeen = new Set<string>();
  for (const font of options.customFonts) {
      const fontStyle = font.style.toLowerCase().includes('italic') ? 'italic' : 'normal';
      const isVar =
        font.isVariable ||
        String(font.weight).includes(' ') ||
        font.filename.toLowerCase().includes('vf') ||
        font.filename.toLowerCase().includes('variable') ||
        font.family.toLowerCase().includes('vf') ||
        font.family.toLowerCase().includes('variable');
      const fontWeight = isVar ? '100 1000' : font.weight || 400;

      const fmt = font.format as string;
      const formatCss =
        fmt === 'ttf'
          ? 'truetype'
          : fmt === 'otf'
          ? 'opentype'
          : font.format;

      const mimeFormat =
        fmt === 'ttf'
          ? 'font/truetype'
          : fmt === 'otf'
          ? 'font/opentype'
          : `font/${font.format}`;

      const isBase64 = !forZip && options.embedFontsBase64 !== false;
      const fontUrl = isBase64
        ? (font.base64.startsWith('data:') ? font.base64 : `data:${mimeFormat};base64,${font.base64}`)
        : `./fonts/${font.filename}`;

      let src = `url('${fontUrl}') format('${formatCss}')`;
      if (isVar) {
        if (formatCss === 'woff2') {
          src = `url('${fontUrl}') format('woff2-variations'), url('${fontUrl}') format('woff2')`;
        } else if (formatCss === 'truetype' || formatCss === 'opentype') {
          src = `url('${fontUrl}') format('${formatCss}-variations'), url('${fontUrl}') format('${formatCss}')`;
        }
      }

      const familiesToRegister = new Set<string>();
      familiesToRegister.add(font.family);

      // Generic font alias generation:
      // Generates aliases for variable fonts (with/without 'VF', with/without spaces) generically for any font family
      const baseClean = font.family.replace(/\s*vf\s*$/i, '').trim();
      if (baseClean) {
        familiesToRegister.add(baseClean);
        familiesToRegister.add(baseClean.replace(/\s+/g, ''));
      }

      if (isVar || /vf\b/i.test(font.family)) {
        if (baseClean) {
          familiesToRegister.add(`${baseClean} VF`);
          familiesToRegister.add(`${baseClean}VF`);
          familiesToRegister.add(`${baseClean.replace(/\s+/g, '')} VF`);
          familiesToRegister.add(`${baseClean.replace(/\s+/g, '')}VF`);
        }
      }

      for (const fam of familiesToRegister) {
        rules.push(`@font-face {
  font-family: '${fam}';
  font-style: ${fontStyle};
  font-weight: ${fontWeight};
  font-display: swap;
  src: ${src};
}`);
      }

      // A fallback wearing this font's own measurements, so text that renders
      // before the font arrives occupies the same line boxes. Nothing is
      // downloaded for it: `src: local(…)` is the machine's own sans.
      if (!twinSeen.has(font.family)) {
        twinSeen.add(font.family);
        const overrides = overridesFor(font.family, font.base64);
        if (overrides) {
          rules.push(fallbackFaceCss(font.family, overrides));
        }
      }
    }

  return rules.join('\n\n');
}

/**
 * Generates formatted pure CSS from an IRNode tree
 */
export function generateCss(
  rootNode: IRNode,
  options: ConversionOptions,
  isRtl: boolean = false,
  variablesBlock?: string,
  forZip: boolean = false
): string {
  return generateCssForRoots([rootNode], options, isRtl, variablesBlock, forZip);
}

/** The reset every stylesheet starts with. */
function resetBlock(isRtl: boolean, responsive: boolean): string {
  const fontFamily = isRtl ? FONT_STACK_RTL : FONT_STACK_LTR;
  const bodyLayout = responsive
    ? `
body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
}`
    : '';

  return `/* Modern CSS Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
  background: transparent;
  font-family: ${fontFamily};
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  ${isRtl ? 'direction: rtl;\n  text-align: right;' : ''}
}${bodyLayout}
button {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: inherit;
}
img {
  display: block;
  max-width: 100%;
}`;
}

/**
 * A stylesheet built while the trees are walked.
 *
 * The whole-document helper below can serve a one-shot conversion, but a large
 * archive converts page after page and cannot keep every tree alive until the
 * end. The builder owns the state that has to survive across trees — seen
 * classes, stacking queries, whether a link exists — so each tree can be
 * written and released as soon as it is done.
 *
 * The head (tokens, font faces, reset) is assembled in `finish`, because the
 * document's direction is only known once every page has been converted.
 */
export interface CssBuilder {
  addRoot(root: IRNode): void;
  finish(isRtl: boolean, variablesBlock?: string): string;
}

export function createCssBuilder(options: ConversionOptions, forZip: boolean = false): CssBuilder {
  const rules: string[] = [];
  const classNamesSeen = new Set<string>();
  /** Set when any layer or run is a hyperlink; see the anchor rule below. */
  let sawLink = false;

  // Regions that fill their line once their row has stacked, grouped by the
  // row width at which that happens. Collected while walking the tree and
  // emitted after every class rule, so the `@container` override always wins
  // over the child's own `flex-basis` / `max-width`.
  const stackRules = new Map<string, string[]>();

  function collectRules(node: IRNode) {
    if (node.href) sawLink = true;
    if (node.typography?.segments?.some((seg) => seg.href)) sawLink = true;
    if (!classNamesSeen.has(node.className)) {
      classNamesSeen.add(node.className);

      // Generate declarations for current node
      const decs: string[] = [
        ...layoutToCssDeclarations(node.layout, options),
        ...visualToCssDeclarations(node.visual, node.layout.transform),
        ...typographyToCssDeclarations(node.typography),
      ];

      if (node.tag === 'img' && !decs.some((d) => d.startsWith('object-fit:'))) {
        decs.push(node.layout?.objectFit ? `object-fit: ${node.layout.objectFit};` : 'object-fit: cover;');
      }

      // A native control brings its own chrome: a white background, an inset
      // border and platform appearance. The design's declarations above are
      // the box, so the browser's are cleared.
      if (node.tag === 'input' || node.tag === 'textarea') {
        decs.push('appearance: none;', '-webkit-appearance: none;');
      }

      // A gradient ring is positioned against its host, so the host has to be a
      // containing block. `relative` changes nothing else: the element already
      // sits where the layout put it.
      const ring = node.visual.gradientBorder;
      if (ring && !node.layout.position) {
        decs.push('position: relative;');
      }

      // Add box-sizing border-box to all custom containers
      if (
        !options.includeReset &&
        (node.layout.padding || node.visual.border) &&
        !decs.some((d) => d.startsWith('box-sizing:'))
      ) {
        decs.unshift('box-sizing: border-box;');
      }

      if (decs.length > 0) {
        const formattedDecs = decs.map((d) => `  ${d}`).join('\n');
        rules.push(`.${node.className} {\n${formattedDecs}\n}`);
      }

      // What Figma paints inside a field is the design's own text, but on a
      // native control that string can only be an attribute — and the browser
      // renders `placeholder` with a dimmed user-agent colour. Re-stating the
      // layer's colour and alignment keeps an exported field reading like the
      // canvas instead of like an empty hint.
      if ((node.tag === 'input' || node.tag === 'textarea') && node.attrs?.placeholder) {
        const placeholderDecs: string[] = [];
        if (node.typography?.color) {
          placeholderDecs.push(`color: ${node.typography.color};`, 'opacity: 1;');
        }
        if (node.typography?.textAlign) placeholderDecs.push(`text-align: ${node.typography.textAlign};`);
        if (node.typography?.direction) placeholderDecs.push(`direction: ${node.typography.direction};`);
        if (placeholderDecs.length > 0) {
          rules.push(
            `.${node.className}::placeholder {\n${placeholderDecs.map((d) => `  ${d}`).join('\n')}\n}`
          );
        }
      }

      // The ring is a second box, so it needs its own rule rather than another
      // declaration on the host.
      if (ring) {
        rules.push(gradientBorderRule(node.className, ring));
      }

      // Handle negative itemSpacing in AutoLayout (cannot be expressed as CSS gap)
      if (node.layout.itemSpacing && node.layout.itemSpacing < 0) {
        const spacingVal = formatUnit(node.layout.itemSpacing, options.useRem, options.baseFontSize);
        if (node.layout.flexDirection === 'column') {
          rules.push(`.${node.className} > * + * {\n  margin-top: ${spacingVal};\n}`);
        } else {
          rules.push(`.${node.className} > * + * {\n  margin-inline-start: ${spacingVal};\n}`);
        }
      }

      // Handle Figma canvas stacking order ('First on top')
      if (node.layout.itemReverseZIndex && node.children.length > 1) {
        node.children.forEach((child, idx) => {
          const z = node.children.length - idx;
          rules.push(`.${child.className} {\n  z-index: ${z};\n}`);
        });
      }

      // A region of a stacked row: remember it so the container query can be
      // emitted once the whole tree has been walked.
      if (node.layout.stackFill) {
        const { maxInlineSize } = node.layout.stackFill;
        const selectors = stackRules.get(maxInlineSize);
        if (selectors) {
          selectors.push(`.${node.className}`);
        } else {
          stackRules.set(maxInlineSize, [`.${node.className}`]);
        }
      }

      // Add list-item styles if node is a list
      if (node.typography?.isList) {
        const isRtl = node.typography.direction === 'rtl';
        const bulletPadding = isRtl ? 'padding-right: 18px;' : 'padding-left: 18px;';
        const bulletPos = isRtl ? 'right: 0;' : 'left: 0;';
        const bulletColor = node.typography.listBulletColor || 'inherit';

        rules.push(`.${node.className} > li {\n  position: relative;\n  ${bulletPadding}\n  text-align: ${node.typography.textAlign || (isRtl ? 'right' : 'left')};\n  direction: ${node.typography.direction || (isRtl ? 'rtl' : 'ltr')};\n  line-height: inherit;\n}`);

        rules.push(`.${node.className} > li::before {\n  content: "•";\n  position: absolute;\n  ${bulletPos}\n  top: 0;\n  color: ${bulletColor};\n  font-size: 1.1em;\n  line-height: inherit;\n}`);
      }
    }

    // A reused component: everything the instance keeps from its component is
    // already in the shared class above, so only this instance's own
    // deviations are written here. Emitted outside the seen-class guard — the
    // shared class is skipped on every instance after the first, but each
    // instance's modifier is its own.
    if (node.componentOverride) {
      const { className, layout, visual, typography } = node.componentOverride;
      const overrideDecs = [
        ...layoutToCssDeclarations((layout ?? {}) as LayoutStyles, options),
        ...visualToCssDeclarations((visual ?? {}) as VisualStyles, node.layout.transform),
        ...typographyToCssDeclarations(typography as TypographyStyles | undefined),
      ];
      if (overrideDecs.length > 0) {
        rules.push(`.${className} {\n${overrideDecs.map((d) => `  ${d}`).join('\n')}\n}`);
      }
    }

    for (const child of node.children) {
      collectRules(child);
    }
  }

  return {
    addRoot(root: IRNode): void {
      collectRules(root);
    },

    finish(isRtl: boolean, variablesBlock?: string): string {
      const head: string[] = [];
      if (variablesBlock) {
        head.push(variablesBlock);
      }

      const fontFaceBlock = generateFontFaceRules(options, forZip);
      if (fontFaceBlock) {
        head.push(fontFaceBlock);
      }

      if (options.includeReset) {
        head.push(resetBlock(isRtl, responsiveEnabled(options)));
      }

      const tail: string[] = [];

      // A link carries the design's own colour and decoration. In Figma the words
      // are styled by the designer; a browser would otherwise make every one of
      // them blue and underlined, which is a look the design never had. Emitted
      // only when the page actually has a link, so nothing else changes.
      // (Tailwind's preflight already does this, so both outputs agree.)
      if (sawLink) {
        tail.push(`/* Links keep the design's own colour and decoration. */
a {
  color: inherit;
  text-decoration: inherit;
}`);
      }

      // Smart stacking. A row of layout *regions* (a rail beside a body, rather
      // than a grid of interchangeable items) is marked as its own inline-size
      // query container, and each of its regions is told to fill the line once that
      // row can no longer hold them side by side. The threshold is the row's own
      // wrap point, accumulated from the regions' sizes and the gaps between them —
      // a property of the design, not of any particular viewport. The query is
      // unnamed, so it always resolves against the child's own row.
      //
      // The comparison is strict on purpose. A packed row was drawn with its
      // columns and gaps adding up to exactly its own width, so it *does* still fit
      // at the threshold; only below it does the browser break the line. A
      // `max-width` query would match at the threshold itself and stack a row at
      // the very size it was drawn at. Tailwind's `@max-[…]` variant compiles to
      // the same strict form, so both outputs agree.
      for (const [maxInlineSize, selectors] of stackRules) {
        tail.push(
          `/* Stacked regions — below the row's own wrap point each region fills its line. */\n` +
            `@container (width < ${maxInlineSize}) {\n` +
            `  ${selectors.join(',\n  ')} {\n    flex-basis: 100%;\n    max-width: 100%;\n  }\n}`
        );
      }

      // Responsiveness is intrinsic. It comes from the flex layout itself —
      // proportional `flex`, `flex-wrap` with `min-width` floors, `max-width: 100%`
      // — plus design-derived `clamp()` lengths on the values that genuinely need
      // to scale (section padding, large gaps, display type). Every one of those
      // rules is continuous, so the output adapts at any width for any design and
      // there is no viewport breakpoint left to emit. Nothing here is hand-tuned
      // for a specific device.

      return [...head, ...rules, ...tail].join('\n\n');
    },
  };
}

/**
 * Generates one stylesheet for several trees.
 *
 * A whole-file export converts every page into its own tree but must not emit
 * the reset, the tokens or a component's rules once per page. Walking the roots
 * together keeps the seen-class guard meaningful across the whole document, so
 * a component shared by nine pages is written once.
 */
export function generateCssForRoots(
  roots: IRNode[],
  options: ConversionOptions,
  isRtl: boolean = false,
  variablesBlock?: string,
  forZip: boolean = false
): string {
  const builder = createCssBuilder(options, forZip);
  for (const root of roots) {
    builder.addRoot(root);
  }
  return builder.finish(isRtl, variablesBlock);
}
