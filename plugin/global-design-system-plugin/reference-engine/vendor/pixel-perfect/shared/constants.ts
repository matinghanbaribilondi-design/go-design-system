/**
 * Shared design constants for the converter pipeline.
 * Centralises magic numbers so behaviour is documented and tunable.
 */

/** Tolerance (px) when detecting optical centering of absolute text. */
export const CENTER_TOLERANCE_PX = 8;

/** Max container size that may be treated as a "small pill / button / gauge" for centering heuristics. */
export const SMALL_CONTAINER_MAX_WIDTH = 320;
export const SMALL_CONTAINER_MAX_HEIGHT = 320;

/** Max width/height (px) for auto-SVG export of shape-only frames. */
export const MAX_AUTO_SVG_SIZE = 600;

/** Opacity epsilon — values above this are treated as fully opaque. */
export const OPAQUE_THRESHOLD = 0.999;

/** Default font stack (LTR) used across generated CSS. */
export const FONT_STACK_LTR = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;

/** Default font stack (RTL) — Vazirmatn first for Persian/Arabic. */
export const FONT_STACK_RTL = `'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, sans-serif`;

/** Fallback font chain appended after every Figma font family. */
export const FONT_FALLBACK_CHAIN = `'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

/** Background applied to the preview stage wrapper. */
export const PREVIEW_STAGE_BG = 'transparent';
