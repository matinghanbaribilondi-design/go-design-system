import { IRNode, ConversionOptions, LayoutStyles, VisualStyles, TypographyStyles } from '../plugin/types/ir';
import { formatUnit } from '../plugin/converter/utils';
import { FONT_STACK_LTR, FONT_STACK_RTL } from '../shared/constants';

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
  if (layout.gap) decs.push(`gap: ${layout.gap};`);
  if (layout.rowGap) decs.push(`row-gap: ${layout.rowGap};`);
  if (layout.columnGap) decs.push(`column-gap: ${layout.columnGap};`);

  if (layout.padding) {
    const { top, right, bottom, left } = layout.padding;
    const u = (v: number) => formatUnit(v, options.useRem, options.baseFontSize);
    if (top === bottom && right === left && top === right) {
      if (top > 0) decs.push(`padding: ${u(top)};`);
    } else if (top === bottom && right === left) {
      decs.push(`padding: ${u(top)} ${u(right)};`);
    } else {
      decs.push(`padding: ${u(top)} ${u(right)} ${u(bottom)} ${u(left)};`);
    }
  }

  if (layout.position) decs.push(`position: ${layout.position};`);
  if (layout.boxSizing) decs.push(`box-sizing: ${layout.boxSizing};`);
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
  if (visual.opacity !== undefined) decs.push(`opacity: ${visual.opacity};`);
  if (visual.filter) decs.push(`filter: ${visual.filter};`);
  if (visual.backdropFilter) {
    decs.push(`backdrop-filter: ${visual.backdropFilter};`);
    decs.push(`-webkit-backdrop-filter: ${visual.backdropFilter};`);
  }
  if (visual.mixBlendMode) decs.push(`mix-blend-mode: ${visual.mixBlendMode};`);
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
  if (typo.lineHeight) decs.push(`line-height: ${typo.lineHeight};`);
  if (typo.letterSpacing && typo.letterSpacing !== 'normal') decs.push(`letter-spacing: ${typo.letterSpacing};`);
  if (typo.textAlign) decs.push(`text-align: ${typo.textAlign};`);
  if (typo.color) decs.push(`color: ${typo.color};`);
  if (typo.textDecoration) decs.push(`text-decoration: ${typo.textDecoration};`);
  if (typo.textTransform) decs.push(`text-transform: ${typo.textTransform};`);
  if (typo.whiteSpace) decs.push(`white-space: ${typo.whiteSpace};`);
  if (typo.textOverflow) decs.push(`text-overflow: ${typo.textOverflow};`);
  if (typo.display) decs.push(`display: ${typo.display};`);
  if (typo.webkitLineClamp !== undefined) decs.push(`-webkit-line-clamp: ${typo.webkitLineClamp};`);
  if (typo.webkitBoxOrient) decs.push(`-webkit-box-orient: ${typo.webkitBoxOrient};`);
  if (typo.overflow) decs.push(`overflow: ${typo.overflow};`);
  if (typo.direction) {
    decs.push(`direction: ${typo.direction};`);
    if (typo.direction === 'rtl') {
      decs.push('unicode-bidi: isolate;');
    }
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
 * Generates @font-face rules for custom uploaded fonts or local font scaffolding
 */
export function generateFontFaceRules(options: ConversionOptions, forZip: boolean = false): string {
  if (!options.customFonts || options.customFonts.length === 0) {
    return '';
  }

  const rules: string[] = ['/* --- Custom Typography (@font-face) --- */'];
  for (const font of options.customFonts) {
    const fontStyle = font.style.toLowerCase().includes('italic') ? 'italic' : 'normal';
    const isVar =
      font.isVariable ||
      String(font.weight).includes(' ') ||
      font.filename.toLowerCase().includes('vf') ||
      font.family.toLowerCase().includes('vf');
    const fontWeight = isVar ? '100 1000' : font.weight || 400;
    const isBase64 = !forZip && options.embedFontsBase64 !== false;
    const fontUrl = isBase64
      ? (font.base64.startsWith('data:') ? font.base64 : `data:font/${font.format};base64,${font.base64}`)
      : `./fonts/${font.filename}`;

    let src = `url('${fontUrl}') format('${font.format}')`;
    if (isVar && font.format === 'woff2') {
      src = `url('${fontUrl}') format('woff2-variations'), url('${fontUrl}') format('woff2')`;
    }

    const familiesToRegister = new Set<string>();
    familiesToRegister.add(font.family);

    if (font.family.toLowerCase().includes('vf')) {
      const alias = font.family.replace(/\s*vf\s*/i, '').trim();
      if (alias) familiesToRegister.add(alias);
    } else if (isVar) {
      familiesToRegister.add(`${font.family} VF`);
      familiesToRegister.add(`${font.family}VF`);
    }

    if (font.family.toLowerCase().replace(/[\s-_]/g, '').includes('yekanbakh')) {
      familiesToRegister.add('Yekan Bakh');
      familiesToRegister.add('Yekan Bakh VF');
      familiesToRegister.add('YekanBakh');
      familiesToRegister.add('YekanBakh VF');
    }
    if (font.family.toLowerCase().replace(/[\s-_]/g, '').includes('iranyekan')) {
      familiesToRegister.add('IRANYekanX');
      familiesToRegister.add('IRANYekanXVF');
      familiesToRegister.add('IRAN Yekan');
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
  const rules: string[] = [];
  const classNamesSeen = new Set<string>();

  if (variablesBlock) {
    rules.push(variablesBlock);
  }

  const fontFaceBlock = generateFontFaceRules(options, forZip);
  if (fontFaceBlock) {
    rules.push(fontFaceBlock);
  }

  if (options.includeReset) {
    const fontFamily = isRtl ? FONT_STACK_RTL : FONT_STACK_LTR;

    rules.push(`/* Modern CSS Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  font-family: ${fontFamily};
  -webkit-font-smoothing: antialiased;
  ${isRtl ? 'direction: rtl;\n  text-align: right;' : ''}
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
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
}`);
  }

  function collectRules(node: IRNode) {
    if (!classNamesSeen.has(node.className)) {
      classNamesSeen.add(node.className);

      // Generate declarations for current node
      const decs: string[] = [
        ...layoutToCssDeclarations(node.layout, options),
        ...visualToCssDeclarations(node.visual, node.layout.transform),
        ...typographyToCssDeclarations(node.typography),
      ];

      if (node.tag === 'img' && !decs.some((d) => d.startsWith('object-fit:'))) {
        decs.push('object-fit: cover;');
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

    for (const child of node.children) {
      collectRules(child);
    }
  }

  collectRules(rootNode);

  return rules.join('\n\n');
}
