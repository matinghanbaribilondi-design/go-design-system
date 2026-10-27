/**
 * Hyperlinks.
 *
 * Figma stores a link on the text layer (`hyperlink`) or on a character range
 * (`getRangeHyperlink` / the `hyperlink` field of a styled segment). Neither was
 * read anywhere in the converter, so every link a designer set arrived as plain
 * text: the word was there, the destination was not.
 *
 * Two kinds of link exist, and only one of them is an address:
 *
 *   URL   a real destination — `https://…`, `mailto:…`, `/pricing`
 *   NODE  a link to another layer in the same file, which is a Figma
 *         prototype interaction. There is no HTML target for a layer id, so a
 *         NODE link is deliberately not turned into an `href`: a dead `#` that
 *         looks like a link is worse than plain text.
 *
 * The URL is also filtered by scheme. The converter's output is a static page
 * someone will open, so `javascript:` and `data:` are not carried through —
 * a design file should not be able to put a script behind a word.
 */

/** A Figma hyperlink, structurally typed so it can be exercised without a document. */
export interface HyperlinkSource {
  type?: string;
  value?: string;
}

const SAFE_SCHEME = /^(https?:|mailto:|tel:)/i;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * The `href` for a Figma hyperlink, or `null` when there is nothing a browser
 * can follow.
 */
export function hyperlinkUrl(link: HyperlinkSource | null | undefined): string | null {
  if (!link || typeof link !== 'object') return null;
  if (link.type !== 'URL') return null;

  const value = typeof link.value === 'string' ? link.value.trim() : '';
  if (!value) return null;

  // A relative address has no scheme at all: `/pricing`, `docs/intro.html`,
  // `#top`, `//cdn.example.com/x`. Those are safe by definition.
  if (!HAS_SCHEME.test(value)) return value;

  return SAFE_SCHEME.test(value) ? value : null;
}
