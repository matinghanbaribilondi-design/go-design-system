import { TypographyStyles, ConversionOptions } from '../types/ir';
import { formatUnit, isRtlText } from './utils';
import { TokenResolver, TokenRegistry } from '../../shared/token-resolver';
import { FONT_FALLBACK_CHAIN } from '../../shared/constants';

/**
 * Maps font style names to numerical CSS font weights
 */
export function getFontWeightNumber(style: string): number {
  const s = (style || '').toLowerCase();
  if (s.includes('thin') || s.includes('hairline')) return 100;
  if (s.includes('extralight') || s.includes('ultralight')) return 200;
  if (s.includes('light')) return 300;
  if (s.includes('medium')) return 500;
  if (s.includes('semibold') || s.includes('demibold')) return 600;
  if (s.includes('extrabold') || s.includes('ultrabold')) return 800;
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

/**
 * Extracts typography styles from a TextNode, including multi-styled segment analysis and RTL support
 */
export function extractTypography(
  node: TextNode,
  options: ConversionOptions,
  tokenRegistry?: TokenRegistry
): TypographyStyles {
  const isRtl = isRtlText(node.characters);
  const resolver = new TokenResolver(tokenRegistry);

  const result: TypographyStyles = {
    textAlign: isRtl ? 'right' : 'left',
    direction: isRtl ? 'rtl' : 'ltr',
    whiteSpace: node.textAutoResize === 'WIDTH_AND_HEIGHT' ? 'nowrap' : 'pre-wrap',
  };

  // Horizontal text alignment
  switch (node.textAlignHorizontal) {
    case 'CENTER':
      result.textAlign = 'center';
      break;
    case 'RIGHT':
      result.textAlign = 'right';
      break;
    case 'JUSTIFIED':
      result.textAlign = 'justify';
      break;
    case 'LEFT':
      result.textAlign = 'left';
      break;
    default:
      result.textAlign = isRtl ? 'right' : 'left';
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
    const rawLines = node.characters.split('\n').map((l) => l.trim()).filter(Boolean);
    if (rawLines.length > 1 && rawLines.every((l) => l.startsWith('•') || l.startsWith('\u2022') || l.startsWith('- ') || l.startsWith('– '))) {
      isList = true;
      listType = 'unordered';
    }
  }

  if (isList) {
    result.isList = true;
    result.listType = listType;

    let gap = 8;
    const listSpacing = (node as TextNode & { listSpacing?: unknown }).listSpacing;
    if (typeof listSpacing === 'number' && listSpacing > 0) {
      gap = listSpacing;
    } else if (typeof node.paragraphSpacing === 'number' && node.paragraphSpacing > 0) {
      gap = node.paragraphSpacing;
    }
    result.listGap = formatUnit(gap, options.useRem, options.baseFontSize);
  }

  // Inspect styled segments for mixed text styling
  try {
    const segments = node.getStyledTextSegments([
      'fontSize',
      'fontName',
      'fontWeight',
      'fills',
      'lineHeight',
      'letterSpacing',
      'textDecoration',
      'textCase',
    ]);

    if (segments.length > 1) {
      result.segments = segments.map((seg) => {
        const segFills = (seg.fills as Paint[]).filter((f) => f.visible !== false && f.type === 'SOLID');
        const firstFill = segFills[0];
        let color = result.color || resolver.resolveColor({ r: 0, g: 0, b: 0 }, 1);
        if (firstFill && firstFill.type === 'SOLID') {
          color = resolver.resolveColor(firstFill.color, firstFill.opacity ?? 1);
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
        const fontFamily = fam
          ? `'${fam}', ${FONT_FALLBACK_CHAIN}`
          : FONT_FALLBACK_CHAIN;

        return {
          text: seg.characters,
          fontSize: formatUnit(seg.fontSize, options.useRem, options.baseFontSize),
          fontWeight: weight,
          fontFamily,
          lineHeight: formatLineHeight(seg.lineHeight, seg.fontSize, options),
          letterSpacing: formatLetterSpacing(seg.letterSpacing, options),
          color,
          textDecoration: textDec,
          textTransform: textTrans,
        };
      });
    }
  } catch (err) {
    console.warn('[typography] getStyledTextSegments failed, falling back to uniform style:', err);
  }

  // Uniform base properties
  const boundFontSize = resolver.varFor(TokenResolver.boundId(node, 'fontSize'));

  if (boundFontSize) {
    result.fontSize = boundFontSize;
  } else if (typeof node.fontSize === 'number') {
    result.fontSize = formatUnit(node.fontSize, options.useRem, options.baseFontSize);
  }

  if (node.fontName && typeof node.fontName === 'object' && 'family' in node.fontName) {
    const fam = node.fontName.family;
    result.fontFamily = `'${fam}', ${FONT_FALLBACK_CHAIN}`;
    result.fontWeight = getFontWeightNumber(node.fontName.style);
  } else {
    result.fontFamily = FONT_FALLBACK_CHAIN;
  }

  if (node.lineHeight && typeof node.lineHeight === 'object') {
    const fs = typeof node.fontSize === 'number' ? node.fontSize : 16;
    result.lineHeight = formatLineHeight(node.lineHeight, fs, options);
  }

  if (node.letterSpacing && typeof node.letterSpacing === 'object') {
    result.letterSpacing = formatLetterSpacing(node.letterSpacing, options);
  }

  // Color from fills or boundVariables
  const boundFillId = TokenResolver.boundId(node, 'fills0');
  const fillStyleId = TokenResolver.styleId(node, 'fillStyleId');

  if (Array.isArray(node.fills)) {
    const activeFill = node.fills.find((f) => f.visible !== false && f.type === 'SOLID');
    if (activeFill && activeFill.type === 'SOLID') {
      result.color = resolver.resolveColor(activeFill.color, activeFill.opacity ?? 1, boundFillId, fillStyleId);
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
  if (truncApi.textTruncation === 'ENDING') {
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
  }

  return result;
}
