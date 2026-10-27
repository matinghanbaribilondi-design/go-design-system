import type { StyledTextSegment } from '../plugin/types/ir';

/** Builds an inline-style string from a styled text segment. Shared by HTML + Tailwind generators. */
export function segmentToInlineStyle(seg: StyledTextSegment): string {
  const parts: string[] = [];
  if (seg.fontFamily && seg.fontFamily !== 'inherit')
    parts.push(`font-family: ${seg.fontFamily.replace(/"/g, "'")}`);
  if (seg.fontSize) parts.push(`font-size: ${seg.fontSize}`);
  if (seg.fontWeight && seg.fontWeight !== 400) parts.push(`font-weight: ${seg.fontWeight}`);
  if (seg.color) parts.push(`color: ${seg.color}`);
  if (seg.lineHeight && seg.lineHeight !== 'normal') parts.push(`line-height: ${seg.lineHeight}`);
  if (seg.letterSpacing && seg.letterSpacing !== 'normal')
    parts.push(`letter-spacing: ${seg.letterSpacing}`);
  if (seg.textDecoration) parts.push(`text-decoration: ${seg.textDecoration}`);
  if (seg.textTransform) parts.push(`text-transform: ${seg.textTransform}`);
  return parts.join('; ');
}

/** Escapes HTML special characters (shared by generators + UI export). */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** File-safe slug for downloads: `My Frame 2` -> `my-frame-2`. */
export function toFileSlug(name: string, fallback = 'export'): string {
  const slug = (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}
