import { TypographyStyles, ConversionOptions } from '../types/ir';
import { formatUnit, isRtlText } from './utils';
import { TokenResolver, TokenRegistry } from '../../shared/token-resolver';
import type { ExportedToken, TextStyleTokenSet } from '../variables/variable-collector';
import { hyperlinkUrl } from './links';
import { FONT_FALLBACK_CHAIN, FLUID_FONT_MIN_PX } from '../../shared/constants';
import { fluidTypeOrFixed } from '../../shared/fluid';
import { fontFamilyWithFallback, isEmbeddedFamily } from '../../shared/font-metrics';
import { responsiveEnabled } from '../../shared/responsive';

/**
 * The `font-family` value for one family.
 *
 * An embedded font is named twice: once as itself, once as the metric twin the
 * stylesheet registers for it. The twin is what paints the first frame while
 * the file is still arriving, and it is measured to sit exactly where the real
 * font will sit — see `src/shared/font-metrics.ts`.
 */
function familyStack(family: string, options: ConversionOptions): string {
  const fam = family.trim();
  if (!fam) return FONT_FALLBACK_CHAIN;
  return isEmbeddedFamily(fam, options.customFonts)
    ? fontFamilyWithFallback(fam, FONT_FALLBACK_CHAIN)
    : `'${fam}', ${FONT_FALLBACK_CHAIN}`;
}

/**
 * Maps font style names to numerical CSS font weights
 */
export function getFontWeightNumber(style: string): number {
  if (!style) return 400;
  // If already a number or numeric string (e.g. "600", "700")
  const num = parseInt(style, 10);
  if (!isNaN(num) && num >= 100 && num <= 950) return num;

  // Sanitize: lowercase, remove hyphens, underscores, spaces
  const s = style.toLowerCase().replace(/[-_\s]+/g, '');
  if (s.includes('thin') || s.includes('hairline')) return 100;
  if (s.includes('extralight') || s.includes('ultralight')) return 200;
  if (s.includes('light')) return 300;
  if (s.includes('medium')) return 500;
  if (s.includes('semibold') || s.includes('demibold')) return 600;
  if (s.includes('extrabold') || s.includes('ultrabold')) return 800;
  if (s.includes('extrablack') || s.includes('ultrablack')) return 950;
  if (s.includes('black') || s.includes('heavy')) return 900;
  if (s.includes('bold')) return 700;
  return 400; // Regular default
}

/**
 * Formats Figma line height to CSS line-height
 */
export function formatLineHeight(
  lineHeight: LineHeight | undefined | null,
  _fontSize: number,
  options: ConversionOptions
): string {
  if (!lineHeight || typeof lineHeight !== 'object' || !lineHeight.unit) {
    return 'normal';
  }
  if (lineHeight.unit === 'PIXELS') {
    return formatUnit(lineHeight.value, options.useRem, options.baseFontSize);
  }
  if (lineHeight.unit === 'PERCENT') {
    return `${Math.round((lineHeight.value / 100) * 100) / 100}`;
  }
  return 'normal';
}

/**
 * Formats Figma letter spacing to CSS letter-spacing
 */
export function formatLetterSpacing(
  letterSpacing: LetterSpacing | undefined | null,
  options: ConversionOptions
): string {
  if (!letterSpacing || typeof letterSpacing !== 'object' || !letterSpacing.unit) {
    return 'normal';
  }
  if (letterSpacing.unit === 'PIXELS') {
    return formatUnit(letterSpacing.value, options.useRem, options.baseFontSize);
  }
  if (letterSpacing.unit === 'PERCENT') {
    const emVal = Math.round((letterSpacing.value / 100) * 1000) / 1000;
    return `${emVal}em`;
  }
  return 'normal';
}

/** Two Figma line heights describe the same spacing. */
function sameLineHeight(a: LineHeight | null | undefined, b: LineHeight | null | undefined): boolean {
  if (!a || !b) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;
  if (a.unit !== b.unit) return false;
  // `AUTO` carries no value; only the unit matters.
  if (!('value' in a) || !('value' in b)) return true;
  return Math.abs(a.value - b.value) < 0.001;
}

/** Two Figma letter spacings describe the same tracking. */
function sameLetterSpacing(
  a: LetterSpacing | null | undefined,
  b: LetterSpacing | null | undefined
): boolean {
  if (!a || !b) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;
  return a.unit === b.unit && Math.abs(a.value - b.value) < 0.001;
}

/** `var(--token)` for an emitted token, or null when the style has no token. */
function tokenRef(token: ExportedToken | undefined): string | null {
  return token ? `var(${token.cssVarName})` : null;
}

/** The size token of a text style, only when the node still has the style's size. */
function styleSizeRef(
  style: TextStyleTokenSet | null,
  fontSize: number
): string | null {
  if (!style?.size || Math.abs(fontSize - style.fontSizePx) > 0.01) return null;
  return tokenRef(style.size);
}

/**
 * Extracts typography styles from a TextNode, including multi-styled segment analysis and RTL support
 *
 * @param containerWidthPx - Width of the nearest query container the text will
 *   be rendered in (the page root, or a stacked regions row). Fluid type is
 *   expressed in `cqi`, so the coefficient has to be derived from the same box
 *   that will resolve it — see `fluidTypeSize`.
 */
export function extractTypography(
  node: TextNode,
  options: ConversionOptions,
  tokenRegistry?: TokenRegistry,
  containerWidthPx?: number
): TypographyStyles {
  const isRtl = isRtlText(node.characters);
  const resolver = new TokenResolver(tokenRegistry, {
    baseFontSize: options.baseFontSize,
    node,
  });
  // A text layer keeps its style id after individual properties are edited.
  // The style is therefore a naming hint: each property below is referenced
  // only when the layer still carries the style's own value.
  const styleTokens = resolver.textStyle(TokenResolver.styleId(node, 'textStyleId'));

  const hasNewlines = Boolean(node.characters && /[\r\n]/.test(node.characters));
  const isAutoWidth = node.textAutoResize === 'WIDTH_AND_HEIGHT';
  const isExplicitWrap = node.textAutoResize === 'HEIGHT' || node.textAutoResize === 'NONE';

  let effectiveLineHeight = 0;
  const fs = typeof node.fontSize === 'number' ? node.fontSize : 16;
  if (node.lineHeight && typeof node.lineHeight === 'object') {
    if (node.lineHeight.unit === 'PIXELS') {
      effectiveLineHeight = node.lineHeight.value;
    } else if (node.lineHeight.unit === 'PERCENT') {
      effectiveLineHeight = fs * (node.lineHeight.value / 100);
    }
  }
  if (effectiveLineHeight <= 0) {
    effectiveLineHeight = fs * 1.25;
  }
  const isMultiLine = typeof node.height === 'number' && node.height > effectiveLineHeight * 1.35;

  // Only use nowrap for short, single-line elements (buttons, badges, labels <= 40 chars AND width <= 240px)
  // or auto-width text (WIDTH_AND_HEIGHT) that do NOT have newlines, are NOT multi-line, and are NOT explicit wrap.
  const isShortSingleLine = !hasNewlines && !isMultiLine && !isExplicitWrap && ((node.characters?.length || 0) <= 40 && node.width <= 240);
  const shouldNowrap = !hasNewlines && !isMultiLine && !isExplicitWrap && (isAutoWidth || isShortSingleLine);

  const result: TypographyStyles = {
    textAlign: isRtl ? 'right' : 'left',
    direction: isRtl ? 'rtl' : 'ltr',
    whiteSpace: shouldNowrap ? 'nowrap' : (hasNewlines ? 'pre-line' : 'normal'),
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  };

  // Horizontal text alignment
  switch (node.textAlignHorizontal) {
    case 'CENTER':
      result.textAlign = 'center';
      break;
    case 'RIGHT':
      result.textAlign = 'right';
      result.direction = 'rtl';
      break;
    case 'JUSTIFIED':
      result.textAlign = 'justify';
      break;
    case 'LEFT':
      result.textAlign = 'left';
      result.direction = 'ltr';
      break;
    default:
      result.textAlign = isRtl ? 'right' : 'left';
      result.direction = isRtl ? 'rtl' : 'ltr';
  }

  // Check if text is a bullet list or ordered list
  let isList = false;
  let listType: 'unordered' | 'ordered' = 'unordered';

  try {
    const listApi = node as TextNode & {
      getRangeListOptions?: (start: number, end: number) => { type?: string } | null;
    };
    if (typeof listApi.getRangeListOptions === 'function' && node.characters.length > 0) {
      const lo = listApi.getRangeListOptions(0, Math.min(1, node.characters.length));
      if (lo && typeof lo === 'object' && 'type' in lo && (lo.type === 'UNORDERED' || lo.type === 'ORDERED')) {
        isList = true;
        listType = lo.type === 'ORDERED' ? 'ordered' : 'unordered';
      }
    }
  } catch (e) {
    console.warn('[typography] list detection failed:', e);
  }

  if (!isList && node.characters) {
    const rawLines = node.characters.split(/\r\n|\r|\n/).map((l) => l.trim()).filter(Boolean);
    if (rawLines.length > 1 && rawLines.every((l) => l.startsWith('•') || l.startsWith('\u2022') || l.startsWith('- ') || l.startsWith('– '))) {
      isList = true;
      listType = 'unordered';
    }
  }

  const paragraphSpacingPx =
    typeof node.paragraphSpacing === 'number' ? node.paragraphSpacing : 0;
  const paragraphSpacingBindingId =
    TokenResolver.boundId(node, 'paragraphSpacing') ??
    styleTokens?.boundVariables?.paragraphSpacing?.id ??
    null;
  const paragraphSpacingRef =
    paragraphSpacingPx > 0
      ? resolver.lengthFor(paragraphSpacingBindingId, paragraphSpacingPx) ??
        (styleTokens?.paragraphSpacing &&
        Math.abs(styleTokens.paragraphSpacingPx - paragraphSpacingPx) < 0.01
          ? tokenRef(styleTokens.paragraphSpacing)
          : null)
      : null;

  if (isList) {
    result.isList = true;
    result.listType = listType;

    let gap = 8;
    const listSpacing = (node as TextNode & { listSpacing?: unknown }).listSpacing;
    let listGapRef: string | null = null;
    if (typeof listSpacing === 'number' && listSpacing > 0) {
      gap = listSpacing;
    } else if (paragraphSpacingPx > 0) {
      gap = paragraphSpacingPx;
      listGapRef = paragraphSpacingRef;
    }
    result.listGap = listGapRef ?? formatUnit(gap, options.useRem, options.baseFontSize);
  } else if (hasNewlines && paragraphSpacingPx > 0) {
    // The gap *between* paragraphs. A list uses it as its item gap above,
    // because a list item is a paragraph; ordinary copy needs it as the space
    // between two blocks, which the markup has to provide.
    result.paragraphSpacing =
      paragraphSpacingRef ?? formatUnit(paragraphSpacingPx, options.useRem, options.baseFontSize);
    // `pre-line` exists to keep the newlines that are now paragraph breaks. Left
    // on, it would also turn the newlines *between* the paragraph blocks in the
    // markup into line breaks, which is a line of empty space under every
    // paragraph.
    result.whiteSpace = 'normal';
  }

  // Inspect styled segments for mixed text styling
  try {
    const segments = node.getStyledTextSegments([
      'fontSize',
      'fontName',
      'fontWeight',
      'fills',
      'fillStyleId',
      'textStyleId',
      'lineHeight',
      'letterSpacing',
      'textDecoration',
      'textCase',
      'hyperlink',
    ]);

    if (segments.length > 1) {
      result.segments = segments.map((seg) => {
        // A run can carry its own text style. Like the layer-level style, it is
        // only referenced for the properties the run still has.
        const segStyleId =
          typeof seg.textStyleId === 'string' && seg.textStyleId.length > 0
            ? seg.textStyleId
            : null;
        const segStyle = resolver.textStyle(segStyleId);

        const segFills = (seg.fills as Paint[]).filter((f) => f.visible !== false && f.type === 'SOLID');
        const firstFill = segFills[0];
        let color = result.color || resolver.resolveColor({ r: 0, g: 0, b: 0 }, 1);
        if (firstFill && firstFill.type === 'SOLID') {
          const segFillStyleId =
            typeof seg.fillStyleId === 'string' && seg.fillStyleId.length > 0
              ? seg.fillStyleId
              : null;
          color = resolver.resolveColor(
            firstFill.color,
            firstFill.opacity ?? 1,
            TokenResolver.paintBoundId(firstFill),
            segFillStyleId
          );
        }

        const weight = typeof seg.fontWeight === 'number'
          ? seg.fontWeight
          : getFontWeightNumber(seg.fontName?.style || 'Regular');

        let textDec: string | undefined = undefined;
        if (seg.textDecoration === 'UNDERLINE') textDec = 'underline';
        else if (seg.textDecoration === 'STRIKETHROUGH') textDec = 'line-through';

        let textTrans: string | undefined = undefined;
        if (seg.textCase === 'UPPER') textTrans = 'uppercase';
        else if (seg.textCase === 'LOWER') textTrans = 'lowercase';
        else if (seg.textCase === 'TITLE') textTrans = 'capitalize';

        const fam = seg.fontName?.family || '';
        const fontFamily =
          segStyle && fam && fam === segStyle.fontFamily
            ? tokenRef(segStyle.family) ?? familyStack(fam, options)
            : familyStack(fam, options);

        const baseSegFontSize = formatUnit(seg.fontSize, options.useRem, options.baseFontSize);
        const styleFontSize = styleSizeRef(segStyle, seg.fontSize);
        const segFontSize =
          styleFontSize ??
          (responsiveEnabled(options) && typeof seg.fontSize === 'number'
            ? fluidTypeOrFixed(seg.fontSize, containerWidthPx ?? node.width, options, FLUID_FONT_MIN_PX)
            : baseSegFontSize);
        // A token keeps its designed size; only a raw size is made fluid, and
        // only a fluid size needs its line height / tracking re-expressed as a
        // ratio that follows it.
        const isSegFluid = !styleFontSize && segFontSize !== baseSegFontSize;

        const styleLineHeight =
          segStyle?.lineHeight && sameLineHeight(seg.lineHeight, segStyle.lineHeightValue)
            ? tokenRef(segStyle.lineHeight)
            : null;
        let segLineHeight = styleLineHeight ?? formatLineHeight(seg.lineHeight, seg.fontSize, options);
        if (
          !styleLineHeight &&
          isSegFluid &&
          seg.lineHeight &&
          typeof seg.lineHeight === 'object' &&
          seg.lineHeight.unit === 'PIXELS' &&
          seg.fontSize > 0
        ) {
          const ratio = Math.round((seg.lineHeight.value / seg.fontSize) * 1000) / 1000;
          if (ratio > 0) segLineHeight = String(ratio);
        }

        const styleLetterSpacing =
          segStyle?.letterSpacing &&
          sameLetterSpacing(seg.letterSpacing, segStyle.letterSpacingValue)
            ? tokenRef(segStyle.letterSpacing)
            : null;
        let segLetterSpacing =
          styleLetterSpacing ?? formatLetterSpacing(seg.letterSpacing, options);
        if (
          !styleLetterSpacing &&
          isSegFluid &&
          seg.letterSpacing &&
          typeof seg.letterSpacing === 'object' &&
          seg.letterSpacing.unit === 'PIXELS' &&
          seg.fontSize > 0
        ) {
          const em = Math.round((seg.letterSpacing.value / seg.fontSize) * 1000) / 1000;
          if (em !== 0) segLetterSpacing = `${em}em`;
        }

        const weightRef =
          segStyle && weight === segStyle.fontWeight ? tokenRef(segStyle.weight) : null;

        return {
          text: seg.characters,
          fontSize: segFontSize,
          fontWeight: weightRef ?? weight,
          fontFamily,
          lineHeight: segLineHeight,
          letterSpacing: segLetterSpacing,
          color,
          textDecoration: textDec,
          textTransform: textTrans,
          // A link that covers only part of the layer. Requesting `hyperlink`
          // in the field list is also what makes such a run its own segment:
          // identical styling either side of a link would otherwise merge into
          // one span and the destination would be lost.
          href: hyperlinkUrl(seg.hyperlink) ?? undefined,
        };
      });
    }
  } catch (err) {
    console.warn('[typography] getStyledTextSegments failed, falling back to uniform style:', err);
  }

  // Uniform base properties
  const fontSizePx = typeof node.fontSize === 'number' ? node.fontSize : 16;
  const fontSizeBindingId =
    TokenResolver.boundId(node, 'fontSize') ??
    styleTokens?.boundVariables?.fontSize?.id ??
    null;
  const boundFontSize = resolver.lengthFor(fontSizeBindingId, fontSizePx);
  const styleFontSize =
    typeof node.fontSize === 'number' ? styleSizeRef(styleTokens, node.fontSize) : null;

  if (boundFontSize) {
    result.fontSize = boundFontSize;
  } else if (styleFontSize) {
    result.fontSize = styleFontSize;
  } else if (typeof node.fontSize === 'number') {
    result.fontSize = formatUnit(node.fontSize, options.useRem, options.baseFontSize);
  }

  const directWeight = typeof (node as any).fontWeight === 'number' ? (node as any).fontWeight : undefined;
  const baseWeight = node.fontName && typeof node.fontName === 'object' && 'family' in node.fontName
    ? directWeight || getFontWeightNumber(node.fontName.style)
    : directWeight ?? 400;
  const weightBindingId =
    TokenResolver.boundId(node, 'fontWeight') ??
    styleTokens?.boundVariables?.fontWeight?.id ??
    null;
  const boundWeight = resolver.numberFor(weightBindingId, baseWeight);
  const styleWeight =
    styleTokens && baseWeight === styleTokens.fontWeight
      ? tokenRef(styleTokens.weight)
      : null;

  if (node.fontName && typeof node.fontName === 'object' && 'family' in node.fontName) {
    const fam = node.fontName.family;
    const familyBindingId =
      TokenResolver.boundId(node, 'fontFamily') ??
      styleTokens?.boundVariables?.fontFamily?.id ??
      null;
    const boundFamily = resolver.stringFor(familyBindingId, fam);
    const styleFamily =
      styleTokens && fam && fam === styleTokens.fontFamily
        ? tokenRef(styleTokens.family)
        : null;
    result.fontFamily = boundFamily
      ? `${boundFamily}, ${FONT_FALLBACK_CHAIN}`
      : styleFamily ?? familyStack(fam, options);
    result.fontWeight = boundWeight ?? styleWeight ?? baseWeight;
  } else {
    result.fontFamily = FONT_FALLBACK_CHAIN;
    if (boundWeight ?? styleWeight ?? directWeight) {
      result.fontWeight = (boundWeight ?? styleWeight ?? directWeight)!;
    }
  }

  if (node.lineHeight && typeof node.lineHeight === 'object') {
    const lineHeightBindingId =
      TokenResolver.boundId(node, 'lineHeight') ??
      styleTokens?.boundVariables?.lineHeight?.id ??
      null;
    const boundLineHeight =
      node.lineHeight.unit === 'PIXELS'
        ? resolver.lengthFor(lineHeightBindingId, node.lineHeight.value)
        : null;
    const styleLineHeight =
      styleTokens?.lineHeight && sameLineHeight(node.lineHeight, styleTokens.lineHeightValue)
        ? tokenRef(styleTokens.lineHeight)
        : null;
    result.lineHeight =
      boundLineHeight ??
      styleLineHeight ??
      formatLineHeight(node.lineHeight, fontSizePx, options);
  }

  if (node.letterSpacing && typeof node.letterSpacing === 'object') {
    const letterSpacingBindingId =
      TokenResolver.boundId(node, 'letterSpacing') ??
      styleTokens?.boundVariables?.letterSpacing?.id ??
      null;
    const boundLetterSpacing =
      node.letterSpacing.unit === 'PIXELS'
        ? resolver.lengthFor(letterSpacingBindingId, node.letterSpacing.value)
        : null;
    const styleLetterSpacing =
      styleTokens?.letterSpacing &&
      sameLetterSpacing(node.letterSpacing, styleTokens.letterSpacingValue)
        ? tokenRef(styleTokens.letterSpacing)
        : null;
    result.letterSpacing =
      boundLetterSpacing ??
      styleLetterSpacing ??
      formatLetterSpacing(node.letterSpacing, options);
  }

  // Color from fills or boundVariables. The binding belongs to the paint that
  // is actually visible, not blindly to `fills[0]`: a transparent underlay
  // bound to one token must not colour text painted by the next fill.
  const fillStyleId = TokenResolver.styleId(node, 'fillStyleId');

  if (Array.isArray(node.fills)) {
    const fillIndex = node.fills.findIndex((f) => f.visible !== false && f.type === 'SOLID');
    const activeFill = fillIndex >= 0 ? node.fills[fillIndex] : undefined;
    if (activeFill && activeFill.type === 'SOLID') {
      const paintBinding =
        TokenResolver.paintBoundId(activeFill) ??
        TokenResolver.boundArrayId(node, 'fills', fillIndex);
      result.color = resolver.resolveColor(
        activeFill.color,
        activeFill.opacity ?? 1,
        paintBinding,
        fillStyleId
      );
    }
  }

  // Text decoration & transform
  if (node.textDecoration === 'UNDERLINE') result.textDecoration = 'underline';
  else if (node.textDecoration === 'STRIKETHROUGH') result.textDecoration = 'line-through';

  if (node.textCase === 'UPPER') result.textTransform = 'uppercase';
  else if (node.textCase === 'LOWER') result.textTransform = 'lowercase';
  if (result.isList) {
    result.listBulletColor = result.color || (isRtl ? resolver.resolveColor({ r: 30 / 255, g: 41 / 255, b: 59 / 255 }, 1) : 'inherit');
  }

  // Fidelity: italic style + truncation (Figma textTruncation: ENDING -> ellipsis)
  const styleName = node.fontName && typeof node.fontName === 'object' && 'style' in node.fontName
    ? String(node.fontName.style).toLowerCase()
    : '';
  if (styleName.includes('italic') || styleName.includes('oblique')) {
    result.fontStyle = 'italic';
  }
  const truncApi = node as TextNode & { textTruncation?: unknown; maxLines?: unknown };
  const isExplicitTruncate = truncApi.textTruncation === 'ENDING' || (node as any).textAutoResize === 'TRUNCATE';
  if (isExplicitTruncate) {
    const maxLines = typeof truncApi.maxLines === 'number' ? truncApi.maxLines : 1;
    if (maxLines <= 1) {
      result.whiteSpace = 'nowrap';
      result.textOverflow = 'ellipsis';
      result.overflow = 'hidden';
    } else {
      result.display = '-webkit-box';
      result.webkitLineClamp = maxLines;
      result.webkitBoxOrient = 'vertical';
      result.overflow = 'hidden';
    }
  } else if (!hasNewlines && !isMultiLine && node.textAutoResize === 'NONE') {
    // Single-line fixed bounding box in Figma: text cannot expand vertically.
    // In CSS, single-line fixed containers truncate cleanly with ellipsis rather than wrapping/overflowing.
    result.whiteSpace = 'nowrap';
    result.textOverflow = 'ellipsis';
    result.overflow = 'hidden';
  }

  if (responsiveEnabled(options)) {
    if (!result.overflowWrap && result.whiteSpace !== 'nowrap') {
      result.overflowWrap = 'break-word';
    }
    // Fluid type: a display/heading size scales with the box it sits in between
    // a readable floor and its designed size, so a single clamp() replaces a
    // per-breakpoint font override. Body copy keeps its designed size — it is
    // already readable on a phone and shrinking it would only hurt legibility.
    // Bound (variable-driven) sizes are left untouched so a design token stays
    // the single source of truth.
    if (typeof node.fontSize === 'number' && !boundFontSize) {
      const fluidFs = fluidTypeOrFixed(
        node.fontSize,
        containerWidthPx ?? node.width,
        options,
        FLUID_FONT_MIN_PX
      );
      if (fluidFs !== result.fontSize) {
        result.fontSize = fluidFs;
        // A pixel line-height would stop tracking a now-fluid font size, so it
        // is re-expressed as a unitless ratio: identical at the design size and
        // it scales with the type automatically.
        if (
          node.lineHeight &&
          typeof node.lineHeight === 'object' &&
          node.lineHeight.unit === 'PIXELS' &&
          node.fontSize > 0
        ) {
          const ratio = Math.round((node.lineHeight.value / node.fontSize) * 1000) / 1000;
          if (ratio > 0) result.lineHeight = String(ratio);
        }
        // The same argument applies to tracking: a 2px letter-space on 48px
        // type is a different visual density once the type is 31px, so a
        // pixel value is re-expressed as the `em` ratio it represents.
        if (
          node.letterSpacing &&
          typeof node.letterSpacing === 'object' &&
          node.letterSpacing.unit === 'PIXELS' &&
          node.fontSize > 0
        ) {
          const em = Math.round((node.letterSpacing.value / node.fontSize) * 1000) / 1000;
          if (em !== 0) result.letterSpacing = `${em}em`;
        }
      }
    }
  }

  return result;
}
