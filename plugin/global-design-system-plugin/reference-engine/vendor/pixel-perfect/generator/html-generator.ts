import { IRNode, ConversionOptions } from '../plugin/types/ir';
import { generateCss } from './css-generator';
import { isRtlText } from '../plugin/converter/utils';
import { escapeHtml, segmentToInlineStyle } from '../shared/style-utils';

/**
 * Checks recursively if any text in the IR tree is RTL (Persian/Arabic)
 */
export function hasRtlInTree(node: IRNode): boolean {
  if (node.text && isRtlText(node.text)) return true;
  if (node.typography?.segments) {
    for (const seg of node.typography.segments) {
      if (isRtlText(seg.text)) return true;
    }
  }
  for (const child of node.children) {
    if (hasRtlInTree(child)) return true;
  }
  return false;
}

/**
 * Wraps phone numbers, multi-part digits, and numeric sequences inside RTL text with LTR isolation
 * so the Unicode Bidirectional Algorithm does not invert their chunk order (e.g. ۰۹۳۷ ۴۰۶ ۲۳۰۸).
 */
export function wrapBidiNumbers(text: string): string {
  const phonePattern = /(?:(?:\+?[\d\u0660-\u0669\u06F0-\u06F9]+[\s\-–—\.]*){2,}[\d\u0660-\u0669\u06F0-\u06F9]+)/g;
  return text.replace(phonePattern, (match) => {
    return `<span dir="ltr" style="unicode-bidi: isolate; display: inline-block;">${match}</span>`;
  });
}

/**
 * Generates styled span tags for multi-styled text segments
 */
function generateStyledSegmentsHtml(node: IRNode): string {
  if (!node.typography?.segments) {
    return wrapBidiNumbers(escapeHtml(node.text || ''));
  }

  return node.typography.segments
    .map((seg) => {
      const inline = segmentToInlineStyle(seg);
      const styleAttr = inline ? ` style="${inline}"` : '';
      return `<span${styleAttr}>${wrapBidiNumbers(escapeHtml(seg.text))}</span>`;
    })
    .join('');
}

/**
 * Generates semantic <li> items for bullet/ordered lists, preserving styled segments across list items
 */
function generateListItemsHtml(node: IRNode, indent: string): string {
  if (!node.typography?.segments || node.typography.segments.length <= 1) {
    const rawLines = (node.text || '').split('\n').map((l) => l.trim()).filter(Boolean);
    return rawLines
      .map((l) => {
        const clean = l.replace(/^[•\u2022\u25cf\u25aa-]\s*/, '');
        return `${indent}  <li>${wrapBidiNumbers(escapeHtml(clean))}</li>`;
      })
      .join('\n');
  }

  // Segments exist: group segments across line breaks
  interface SegmentRun {
    text: string;
    styleAttr: string;
  }
  const linesOfRuns: SegmentRun[][] = [[]];

  for (const seg of node.typography.segments) {
    const inline = segmentToInlineStyle(seg);
    const styleAttr = inline ? ` style="${inline}"` : '';

    const parts = seg.text.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        linesOfRuns.push([]);
      }
      const part = parts[i] ?? '';
      const currentLine = linesOfRuns[linesOfRuns.length - 1];
      if (currentLine && part.length > 0) {
        currentLine.push({ text: part, styleAttr });
      }
    }
  }

  return linesOfRuns
    .filter((runs) => runs.length > 0)
    .map((runs) => {
      // Strip leading bullet symbol from the first segment of this line if present
      const firstRun = runs[0];
      if (firstRun) {
        firstRun.text = firstRun.text.replace(/^[•\u2022\u25cf\u25aa-]\s*/, '');
      }
      const itemHtml = runs
        .map((r) => {
          if (!r.text) return '';
          if (r.styleAttr) return `<span${r.styleAttr}>${wrapBidiNumbers(escapeHtml(r.text))}</span>`;
          return wrapBidiNumbers(escapeHtml(r.text));
        })
        .join('');
      return `${indent}  <li>${itemHtml}</li>`;
    })
    .join('\n');
}

/**
 * Generates semantic, indented HTML markup from an IRNode tree
 */
export function generateHtml(
  node: IRNode,
  indentLevel: number = 0,
  isInsideButton: boolean = false
): string {
  const indent = '  '.repeat(indentLevel);
  // CRITICAL: HTML specification strictly forbids nesting a <button> inside another <button>.
  // If already inside a button, downgrade any child button to a div to prevent parser ejection.
  let tag = node.tag;
  if (isInsideButton && tag === 'button') {
    tag = 'div';
  }
  const isCurrentButton = tag === 'button';
  const nextInsideButton = isInsideButton || isCurrentButton;

  const classAttr = node.className ? ` class="${node.className}"` : '';

  // 1. Vector / SVG asset node
  if (node.asset && node.asset.type === 'svg') {
    let cleanSvg = node.asset.content.trim();
    // Ensure root svg scales to 100% of container and displays as block
    cleanSvg = cleanSvg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
      if (attrs.includes('style=')) {
        return match.replace(/style="([^"]*)"/i, 'style="width: 100%; height: 100%; display: block; $1"');
      }
      return `<svg style="width: 100%; height: 100%; display: block;"${attrs}>`;
    });
    return `${indent}<div${classAttr}>\n${indent}  ${cleanSvg}\n${indent}</div>`;
  }

  // 2. Image node
  if (node.asset && node.asset.type === 'image') {
    return `${indent}<img${classAttr} src="${node.asset.content}" alt="${escapeHtml(node.name)}" />`;
  }

  // 3. Text node
  if (node.type === 'TEXT') {
    const isRtl = node.typography?.direction === 'rtl' || isRtlText(node.text);
    const dirAttr = isRtl ? ' dir="rtl"' : '';

    if (node.typography?.isList) {
      const listContentHtml = generateListItemsHtml(node, indent);
      return `${indent}<${tag}${classAttr}${dirAttr}>\n${listContentHtml}\n${indent}</${tag}>`;
    }
    if (node.typography?.segments && node.typography.segments.length > 1) {
      const innerHtml = generateStyledSegmentsHtml(node);
      return `${indent}<${tag}${classAttr}${dirAttr}>${innerHtml}</${tag}>`;
    }
    return `${indent}<${tag}${classAttr}${dirAttr}>${wrapBidiNumbers(escapeHtml(node.text || ''))}</${tag}>`;
  }

  // 4. Container with children
  if (node.children && node.children.length > 0) {
    const childrenHtml = node.children
      .map((child) => generateHtml(child, indentLevel + 1, nextInsideButton))
      .join('\n');
    return `${indent}<${tag}${classAttr}>\n${childrenHtml}\n${indent}</${tag}>`;
  }

  // 5. Empty container / shape
  return `${indent}<${tag}${classAttr}></${tag}>`;
}

/**
 * Generates a complete standalone HTML document with embedded CSS, RTL support, and fonts
 */
export function generateFullHtmlDocument(
  rootNode: IRNode,
  options: ConversionOptions,
  variablesBlock?: string
): string {
  const isRtl = hasRtlInTree(rootNode);
  const css = generateCss(rootNode, options, isRtl, variablesBlock);
  const bodyHtml = generateHtml(rootNode, 1);

  const rtlAttrs = isRtl ? ' lang="fa" dir="rtl"' : ' lang="en"';
  const fontLinks = isRtl
    ? `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap" rel="stylesheet">`
    : '';

  return `<!DOCTYPE html>
<html${rtlAttrs}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(rootNode.name)}</title>
${fontLinks}
  <style>
${css
  .split('\n')
  .map((line) => (line ? `    ${line}` : ''))
  .join('\n')}
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
