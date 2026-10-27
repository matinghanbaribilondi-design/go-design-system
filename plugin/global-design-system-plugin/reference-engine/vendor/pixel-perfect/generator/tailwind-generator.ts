import { IRNode } from '../plugin/types/ir';
import { escapeHtml, segmentToInlineStyle } from '../shared/style-utils';

/**
 * Escapes characters for Tailwind arbitrary value brackets
 */
function toTwVal(val: string): string {
  return val.replace(/\s+/g, '_');
}

/**
 * Converts IRNode properties to a list of Tailwind CSS classes
 */
export function nodeToTailwindClasses(node: IRNode): string[] {
  const classes: string[] = [];
  const { layout, visual, typography } = node;

  // 1. Layout
  if (layout.display === 'flex') {
    classes.push('flex');
    if (layout.flexDirection === 'column') classes.push('flex-col');
    else if (layout.flexDirection === 'row') classes.push('flex-row');

    if (layout.flexWrap === 'wrap') classes.push('flex-wrap');

    // Justify
    if (layout.justifyContent === 'center') classes.push('justify-center');
    else if (layout.justifyContent === 'flex-end') classes.push('justify-end');
    else if (layout.justifyContent === 'space-between') classes.push('justify-between');
    else if (layout.justifyContent === 'space-around') classes.push('justify-around');
    else if (layout.justifyContent === 'flex-start') classes.push('justify-start');

    // Align Items
    if (layout.alignItems === 'center') classes.push('items-center');
    else if (layout.alignItems === 'flex-end') classes.push('items-end');
    else if (layout.alignItems === 'flex-start') classes.push('items-start');
    else if (layout.alignItems === 'stretch') classes.push('items-stretch');
    else if (layout.alignItems === 'baseline') classes.push('items-baseline');

    // Gap
    if (layout.gap) classes.push(`gap-[${toTwVal(layout.gap)}]`);
    if (layout.rowGap) classes.push(`gap-y-[${toTwVal(layout.rowGap)}]`);
    if (layout.columnGap) classes.push(`gap-x-[${toTwVal(layout.columnGap)}]`);
    if (layout.itemSpacing && layout.itemSpacing < 0) {
      const absVal = Math.abs(Math.round(layout.itemSpacing * 100) / 100);
      if (layout.flexDirection === 'column') {
        classes.push(`-space-y-[${absVal}px]`);
      } else {
        classes.push(`-space-x-[${absVal}px]`);
      }
    }

    // Direction
    if (layout.direction === 'ltr') classes.push('[direction:ltr]');
    else if (layout.direction === 'rtl') classes.push('[direction:rtl]');
  }

  if (node.tag === 'img') {
    classes.push('object-cover', 'block');
  }

  // Padding
  if (layout.padding) {
    const { top, right, bottom, left } = layout.padding;
    if (top === bottom && right === left && top === right && top > 0) {
      classes.push(`p-[${top}px]`);
    } else if (top === bottom && right === left) {
      if (right > 0) classes.push(`px-[${right}px]`);
      if (top > 0) classes.push(`py-[${top}px]`);
    } else {
      if (top > 0) classes.push(`pt-[${top}px]`);
      if (right > 0) classes.push(`pr-[${right}px]`);
      if (bottom > 0) classes.push(`pb-[${bottom}px]`);
      if (left > 0) classes.push(`pl-[${left}px]`);
    }
  }

  // Positioning
  if (layout.position === 'absolute') {
    classes.push('absolute');
    if (layout.left !== undefined) classes.push(`left-[${toTwVal(layout.left)}]`);
    if (layout.top !== undefined) classes.push(`top-[${toTwVal(layout.top)}]`);
    if (layout.right !== undefined) classes.push(`right-[${toTwVal(layout.right)}]`);
    if (layout.bottom !== undefined) classes.push(`bottom-[${toTwVal(layout.bottom)}]`);
  } else if (layout.position === 'relative') {
    classes.push('relative');
  }

  // Dimensions
  if (layout.width) classes.push(`w-[${toTwVal(layout.width)}]`);
  if (layout.height) classes.push(`h-[${toTwVal(layout.height)}]`);
  if (layout.minWidth) classes.push(`min-w-[${toTwVal(layout.minWidth)}]`);
  if (layout.maxWidth) classes.push(`max-w-[${toTwVal(layout.maxWidth)}]`);
  if (layout.minHeight) classes.push(`min-h-[${toTwVal(layout.minHeight)}]`);
  if (layout.maxHeight) classes.push(`max-h-[${toTwVal(layout.maxHeight)}]`);

  // Flex grow & self
  if (layout.flexGrow) classes.push('grow');
  if (layout.alignSelf === 'stretch') classes.push('self-stretch');

  // Overflow
  if (layout.overflow === 'hidden') classes.push('overflow-hidden');

  // 2. Visual Styles
  if (visual.background) {
    if (visual.background.startsWith('var(')) classes.push(`bg-[${toTwVal(visual.background)}]`);
    else if (visual.background.startsWith('linear-gradient') || visual.background.startsWith('radial-gradient'))
      classes.push(`bg-[${toTwVal(visual.background)}]`);
    else classes.push(`bg-[${toTwVal(visual.background)}]`);
  }
  if (visual.borderRadius) {
    if (visual.borderRadius === '50%' || visual.borderRadius === '9999px') {
      classes.push('rounded-full');
    } else {
      classes.push(`rounded-[${toTwVal(visual.borderRadius)}]`);
    }
  }
  if (visual.border) {
    classes.push(`border-[${toTwVal(visual.border)}]`);
  }
  if (visual.outline) {
    classes.push(`outline-[${toTwVal(visual.outline)}]`);
  }
  if (visual.outlineOffset) {
    classes.push(`outline-offset-[${toTwVal(visual.outlineOffset)}]`);
  }
  // Individual borders (grid of per-side weights)
  if (visual.borderTop) classes.push(`border-t-[${toTwVal(visual.borderTop)}]`);
  if (visual.borderRight) classes.push(`border-r-[${toTwVal(visual.borderRight)}]`);
  if (visual.borderBottom) classes.push(`border-b-[${toTwVal(visual.borderBottom)}]`);
  if (visual.borderLeft) classes.push(`border-l-[${toTwVal(visual.borderLeft)}]`);
  if (visual.boxShadow) {
    classes.push(`shadow-[${toTwVal(visual.boxShadow)}]`);
  }
  if (visual.opacity !== undefined && visual.opacity < 1) {
    classes.push(`opacity-[${visual.opacity}]`);
  }
  if (visual.filter) classes.push(`[filter:${toTwVal(visual.filter)}]`);
  if (visual.backdropFilter) classes.push(`backdrop-blur-[${toTwVal(visual.backdropFilter)}]`);
  if (visual.transform) classes.push(`[${toTwVal(visual.transform)}]`);

  // 3. Typography
  if (typography) {
    if (typography.fontSize) classes.push(`text-[${toTwVal(typography.fontSize)}]`);
    if (typography.color) classes.push(`text-[${toTwVal(typography.color)}]`);
    if (typography.lineHeight && typography.lineHeight !== 'normal') {
      classes.push(`leading-[${toTwVal(typography.lineHeight)}]`);
    }
    if (typography.letterSpacing && typography.letterSpacing !== 'normal') {
      classes.push(`tracking-[${toTwVal(typography.letterSpacing)}]`);
    }
    if (typography.textAlign === 'center') classes.push('text-center');
    else if (typography.textAlign === 'right') classes.push('text-right');
    else if (typography.textAlign === 'justify') classes.push('text-justify');

    // Font weight
    if (typography.fontWeight) {
      const w = typography.fontWeight;
      if (w === 300) classes.push('font-light');
      else if (w === 400) classes.push('font-normal');
      else if (w === 500) classes.push('font-medium');
      else if (w === 600) classes.push('font-semibold');
      else if (w === 700) classes.push('font-bold');
      else if (w === 800) classes.push('font-extrabold');
      else if (w === 900) classes.push('font-black');
      else classes.push(`font-[${w}]`);
    }

    if (typography.textDecoration === 'underline') classes.push('underline');
    else if (typography.textDecoration === 'line-through') classes.push('line-through');

    if (typography.textTransform === 'uppercase') classes.push('uppercase');
    else if (typography.textTransform === 'lowercase') classes.push('lowercase');
    else if (typography.textTransform === 'capitalize') classes.push('capitalize');

    if (typography.direction === 'rtl') {
      classes.push('[direction:rtl]');
      classes.push('[unicode-bidi:isolate]');
    }
  }

  return classes;
}

/**
 * Recursively generates HTML with Tailwind CSS classes
 */
export function generateTailwindHtml(
  node: IRNode,
  indentLevel: number = 0,
  isInsideButton: boolean = false
): string {
  const indent = '  '.repeat(indentLevel);
  let tag = node.tag;
  if (isInsideButton && tag === 'button') {
    tag = 'div';
  }
  const isCurrentButton = tag === 'button';
  const nextInsideButton = isInsideButton || isCurrentButton;

  const classes = nodeToTailwindClasses(node).join(' ');
  const classAttr = classes ? ` class="${classes}"` : '';

  // SVG Asset
  if (node.asset && node.asset.type === 'svg') {
    let cleanSvg = node.asset.content.trim();
    cleanSvg = cleanSvg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
      if (attrs.includes('style=')) {
        return match.replace(/style="([^"]*)"/i, 'style="width: 100%; height: 100%; display: block; $1"');
      }
      return `<svg style="width: 100%; height: 100%; display: block;"${attrs}>`;
    });
    return `${indent}<div${classAttr}>\n${indent}  ${cleanSvg}\n${indent}</div>`;
  }

  // Image Asset
  if (node.asset && node.asset.type === 'image') {
    return `${indent}<img${classAttr} src="${node.asset.content}" alt="${escapeHtml(node.name)}" />`;
  }

  // Text (preserve segments + lists, escape content)
  if (node.type === 'TEXT') {
    const isRtl = node.typography?.direction === 'rtl';
    const dirAttr = isRtl ? ' dir="rtl"' : '';

    if (node.typography?.isList) {
      const items = (node.text || '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const clean = l.replace(/^[•\u2022\u25cf\u25aa-]\s*/, '');
          return `${indent}  <li>${escapeHtml(clean)}</li>`;
        })
        .join('\n');
      return `${indent}<${tag}${classAttr}${dirAttr}>\n${items}\n${indent}</${tag}>`;
    }
    if (node.typography?.segments && node.typography.segments.length > 1) {
      const inner = node.typography.segments
        .map((seg) => {
          const inline = segmentToInlineStyle(seg);
          return `<span${inline ? ` style="${inline}"` : ''}>${escapeHtml(seg.text)}</span>`;
        })
        .join('');
      return `${indent}<${tag}${classAttr}${dirAttr}>${inner}</${tag}>`;
    }
    return `${indent}<${tag}${classAttr}${dirAttr}>${escapeHtml(node.text || '')}</${tag}>`;
  }

  // Container with children
  if (node.children && node.children.length > 0) {
    const childrenHtml = node.children
      .map((child) => generateTailwindHtml(child, indentLevel + 1, nextInsideButton))
      .join('\n');
    return `${indent}<${tag}${classAttr}>\n${childrenHtml}\n${indent}</${tag}>`;
  }

  // Leaf container
  return `${indent}<${tag}${classAttr}></${tag}>`;
}
