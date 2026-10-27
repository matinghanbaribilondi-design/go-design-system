import { IRNode, ConversionOptions } from '../plugin/types/ir';
import { generateCss } from './css-generator';
import { isRtlText } from '../plugin/converter/utils';
import { escapeHtml, segmentToInlineStyle } from '../shared/style-utils';
import { paragraphsOfRuns } from '../shared/text-flow';

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
 * Wraps phone numbers inside RTL text with LTR isolation so the Unicode
 * Bidirectional Algorithm does not invert their chunk order (e.g. ۰۹۳۷ ۴۰۶ ۲۳۰۸).
 *
 * Only a number in three or more chunks is a phone number. Two chunks are a
 * range ("۲-۴"), and Figma lays a range out in the paragraph direction just
 * like a browser does. Isolating it would put the endpoints in the opposite
 * visual order from the design.
 */
export function wrapBidiNumbers(text: string): string {
  // Only match multi-chunk numbers separated by spaces or hyphens (e.g. "0912 345 6789", "+98 912-345-6789")
  // Do NOT match dates (with slashes /), times (:), two-chunk ranges, decimals, or isolated numbers.
  const phonePattern = /(?:\+?[\d\u0660-\u0669\u06F0-\u06F9]+(?:[\s\-–—]+[\d\u0660-\u0669\u06F0-\u06F9]+){2,})/g;
  return text.replace(phonePattern, (match) => {
    return `<span dir="ltr" style="unicode-bidi: isolate; display: inline-block;">${match}</span>`;
  });
}

/**
 * Formats text content by escaping HTML, converting newlines \n to <br />, and wrapping bidirectional numbers
 */
export function formatTextContent(rawText: string): string {
  const escaped = escapeHtml(rawText);
  const withBidi = wrapBidiNumbers(escaped);
  return withBidi.replace(/\r\n|\r|\n/g, '<br />');
}

/**
 * `<a href="…">…</a>`, or the content untouched when there is no destination.
 *
 * The anchor never replaces the element it sits in: a linked heading has to
 * stay an `<h2>`, and a linked paragraph a `<p>`.
 */
export function anchorHtml(href: string | undefined, inner: string): string {
  return href ? `<a href="${escapeHtml(href)}">${inner}</a>` : inner;
}

/**
 * Generates styled span tags for multi-styled text segments
 */
function generateStyledSegmentsHtml(node: IRNode): string {
  if (!node.typography?.segments) {
    return formatTextContent(node.text || '');
  }

  return node.typography.segments
    .map((seg) => {
      const inline = segmentToInlineStyle(seg);
      const styleAttr = inline ? ` style="${inline}"` : '';
      const span = `<span${styleAttr}>${formatTextContent(seg.text)}</span>`;
      // A whole-layer link already wraps everything, and an `<a>` inside an
      // `<a>` is not a thing a browser can build.
      return node.href ? span : anchorHtml(seg.href, span);
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

export interface HtmlGenerationOptions {
  /**
   * Emit `data-component` / `data-component-id` on every node that came from a
   * Figma component.
   *
   * Off by default so the single-frame export stays byte-identical. The
   * whole-file export turns it on because there the markup and
   * `components/*.html` have to be provably the same thing: the attribute is
   * how a page states *which* component a subtree is, and it is the only link
   * between the two that a static HTML file can actually carry.
   */
  componentMarkers?: boolean;
  /**
   * Emit `data-figma-id="<id>"` on every node, for a pixel diff to point at.
   *
   * Off by default so the normal output is unchanged; the mirror harness is the
   * one thing that turns it on. The id is already on the node — emitting it is
   * the difference between a diff that says "12% of the page changed" and one
   * that says "layer `1:42` moved".
   */
  debugFigmaIds?: boolean;
}

/**
 * `data-component="Button" data-component-id="1:23"`.
 *
 * The name is for the human reading the markup; the id is for the machine,
 * because Figma happily names two components "Button" and the id is the only
 * thing that stays unique across a file.
 */
export function componentMarkerAttrs(node: IRNode): string {
  const ref = node.componentRef;
  if (!ref) return '';
  const attrs = [
    `data-component="${escapeHtml(ref.name)}"`,
    `data-component-id="${escapeHtml(ref.id)}"`,
    ref.familyName ? `data-component-family="${escapeHtml(ref.familyName)}"` : '',
    ref.familyId ? `data-component-family-id="${escapeHtml(ref.familyId)}"` : '',
  ];

  for (const [name, value] of Object.entries(ref.variantProperties ?? {})) {
    attrs.push(`data-variant-${dataAttributeName(name)}="${escapeHtml(value)}"`);
  }
  for (const [name, value] of Object.entries(ref.componentProperties ?? {})) {
    attrs.push(`data-component-prop-${dataAttributeName(name)}="${escapeHtml(String(value))}"`);
  }

  return ` ${attrs.filter(Boolean).join(' ')}`;
}

/** Converts a Figma property name into a stable, HTML-safe data attribute suffix. */
function dataAttributeName(name: string): string {
  const slug = name
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return slug || 'value';
}

/**
 * `data-figma-id="1:42"` — the node's Figma id, or nothing when the option is
 * off or the node has no id to give (a synthesised root always has one; a node
 * built by hand in a test might not, and that must not be an error).
 */
function figmaIdAttr(node: IRNode, options: HtmlGenerationOptions): string {
  if (!options.debugFigmaIds || !node.id) return '';
  return ` data-figma-id="${escapeHtml(node.id)}"`;
}

/**
 * One block per paragraph, with the design's paragraph spacing between them.
 *
 * A `<br />` is a line break inside a block, and a margin has nothing to attach
 * to between two of those. So a layer with `paragraphSpacing` is written as one
 * block per paragraph; the gap goes on every block but the last, because space
 * after the final paragraph would make the box taller than the design.
 *
 * An empty paragraph keeps a `<br />` so it still occupies its line instead of
 * collapsing to nothing.
 */
export function generateParagraphHtml(node: IRNode, indent: string): string {
  const spacing = node.typography?.paragraphSpacing ?? '0px';
  const segments = node.typography?.segments;
  const runs =
    segments && segments.length > 1
      ? segments.map((seg) => ({ text: seg.text, styleAttr: segmentToInlineStyle(seg), href: seg.href }))
      : [{ text: node.text ?? '', href: node.href }];

  const paragraphs = paragraphsOfRuns(runs);
  return paragraphs
    .map((runsOfParagraph, index) => {
      const isLast = index === paragraphs.length - 1;
      const margin = isLast ? '' : `margin-bottom: ${spacing};`;
      const inner =
        runsOfParagraph.length === 0
          ? '<br />'
          : runsOfParagraph
              .map((run) => {
                const text = formatTextContent(run.text);
                const styled = run.styleAttr ? `<span style="${run.styleAttr}">${text}</span>` : text;
                return node.href ? styled : anchorHtml(run.href, styled);
              })
              .join('');
      return `${indent}  <span style="display: block;${margin ? ` ${margin}` : ''}">${inner}</span>`;
    })
    .join('\n');
}

/**
 * `type="text" placeholder="Email" name="email"` for a node that is a real
 * control rather than a box. Values are escaped, because a placeholder is
 * designer-authored text and may contain quotes.
 */
export function htmlAttrs(node: IRNode): string {
  if (!node.attrs) return '';
  return Object.entries(node.attrs)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => ` ${key}="${escapeHtml(String(value))}"`)
    .join('');
}

/**
 * Content a `<button>` or `<label>` is allowed to contain. Figma's components
 * carry wrapper frames, rectangles and icon instances; those all have to leave
 * as phrasing elements, or the markup is a block inside a button. A nested
 * button becomes a span for the same reason.
 */
export const PHRASING_TAGS = new Set<string>([
  'span',
  'a',
  'button',
  'input',
  'textarea',
  'label',
  'img',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'small',
  'code',
]);

/**
 * Generates semantic, indented HTML markup from an IRNode tree
 */
export function generateHtml(
  node: IRNode,
  indentLevel: number = 0,
  insidePhrasing: boolean = false,
  options: HtmlGenerationOptions = {}
): string {
  const indent = '  '.repeat(indentLevel);
  // A button and a label both accept phrasing content only. Figma's internals
  // are frames within frames, so inside either one every block has to leave as
  // a span (and a nested button cannot stay a button at all).
  let tag = node.tag;
  if (insidePhrasing) {
    if (tag === 'button' || !PHRASING_TAGS.has(tag)) tag = 'span';
  }
  const isPhrasingContainer = tag === 'button' || tag === 'label';
  const nextInsidePhrasing = insidePhrasing || isPhrasingContainer;

  // A reused component carries its shared class plus the modifier that holds
  // this instance's own deviations. The shared class is what makes the markup
  // read as "this is a Button", not as a copy of one.
  const classNames = [
    node.componentOverride
      ? `${node.className} ${node.componentOverride.className}`
      : node.className,
    ...(node.themeClasses ?? []),
  ]
    .filter(Boolean)
    .join(' ');
  const classAttr = classNames ? ` class="${classNames}"` : '';
  const componentAttr = options.componentMarkers ? componentMarkerAttrs(node) : '';
  const figmaAttr = figmaIdAttr(node, options);
  const extraAttrs = htmlAttrs(node);

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
    // An icon inside a button or label cannot be wrapped in a div.
    const wrapperTag = insidePhrasing ? 'span' : 'div';
    return `${indent}<${wrapperTag}${classAttr}${componentAttr}${figmaAttr}${extraAttrs}>\n${indent}  ${cleanSvg}\n${indent}</${wrapperTag}>`;
  }

  // 2. Image node (only when semantic tag is 'img')
  if (node.asset && node.asset.type === 'image' && tag === 'img') {
    return `${indent}<img${classAttr}${componentAttr}${figmaAttr}${extraAttrs} src="${node.asset.content}" alt="${escapeHtml(node.name)}" />`;
  }

  // 3. Form controls. A native control is a replaced element: it cannot hold
  // the paragraph that used to be the placeholder, which is why the text is an
  // attribute on the control instead.
  if (tag === 'input') {
    return `${indent}<input${classAttr}${componentAttr}${figmaAttr}${extraAttrs} />`;
  }
  if (tag === 'textarea') {
    return `${indent}<textarea${classAttr}${componentAttr}${figmaAttr}${extraAttrs}>${escapeHtml(node.text ?? '')}</textarea>`;
  }
  if (tag === 'option') {
    const label = escapeHtml((node.text ?? '').replace(/\s+/g, ' ').trim());
    return `${indent}<option${classAttr}${componentAttr}${figmaAttr}${extraAttrs}>${label}</option>`;
  }

  // 4. Text node
  if (node.type === 'TEXT') {
    const isExplicitDir = node.typography?.direction;
    const isRtl = isExplicitDir ? isExplicitDir === 'rtl' : isRtlText(node.text);
    const dirAttr = isRtl ? ' dir="rtl"' : (isExplicitDir === 'ltr' ? ' dir="ltr"' : '');

    if (node.typography?.isList) {
      const listContentHtml = generateListItemsHtml(node, indent);
      return `${indent}<${tag}${classAttr}${componentAttr}${figmaAttr}${extraAttrs}${dirAttr}>\n${listContentHtml}\n${indent}</${tag}>`;
    }
    // A link on the whole layer wraps the content; the element keeps its tag,
    // so a linked heading is still a heading. A list has no single run to wrap,
    // so a whole-layer link on one is left as text (its per-range links work).
    const link = (inner: string) => anchorHtml(node.href, inner);
    // Paragraph spacing needs paragraph boxes; a `<br />` cannot carry a margin.
    if (node.typography?.paragraphSpacing) {
      return `${indent}<${tag}${classAttr}${componentAttr}${figmaAttr}${extraAttrs}${dirAttr}>${link(`\n${generateParagraphHtml(node, indent)}\n${indent}`)}</${tag}>`;
    }
    if (node.typography?.segments && node.typography.segments.length > 1) {
      const innerHtml = generateStyledSegmentsHtml(node);
      return `${indent}<${tag}${classAttr}${componentAttr}${figmaAttr}${extraAttrs}${dirAttr}>${link(innerHtml)}</${tag}>`;
    }
    return `${indent}<${tag}${classAttr}${componentAttr}${figmaAttr}${extraAttrs}${dirAttr}>${link(formatTextContent(node.text || ''))}</${tag}>`;
  }

  // 5. Container with children
  if (node.children && node.children.length > 0) {
    const childrenHtml = node.children
      .map((child) => generateHtml(child, indentLevel + 1, nextInsidePhrasing, options))
      .join('\n');
    return `${indent}<${tag}${classAttr}${componentAttr}${figmaAttr}${extraAttrs}>\n${childrenHtml}\n${indent}</${tag}>`;
  }

  // 6. Empty container / shape
  return `${indent}<${tag}${classAttr}${componentAttr}${figmaAttr}${extraAttrs}></${tag}>`;
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
  const bodyHtml = generateHtml(rootNode, 1, false, {
    debugFigmaIds: options.debugFigmaIds,
    componentMarkers: options.componentMetadata === true,
  });

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
