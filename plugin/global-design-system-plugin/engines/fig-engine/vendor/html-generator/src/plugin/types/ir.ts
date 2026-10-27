export type TagType =
  | 'div'
  | 'section'
  | 'article'
  | 'header'
  | 'footer'
  | 'nav'
  | 'aside'
  | 'button'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'p'
  | 'span'
  | 'img'
  | 'svg'
  | 'a'
  | 'ul'
  | 'ol'
  | 'li'
  | 'input'
  | 'textarea'
  | 'select'
  | 'option'
  | 'label';

export interface LayoutStyles {
  display?: 'flex' | 'block' | 'inline-block' | 'grid';
  flexDirection?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
  flexWrap?: 'wrap' | 'nowrap';
  gap?: string;
  rowGap?: string;
  columnGap?: string;
  /**
   * Grid auto-layout. Figma's `layoutMode: 'GRID'` is a track model, not a flex
   * row: columns and rows are declared independently, a child can span several
   * of each, and the gaps are per axis. Emitting it as a column flex — which is
   * what a `layoutMode !== 'NONE'` branch does by default — silently rewrites
   * the design, so the track list is carried through verbatim.
   */
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  /** Cell placement, e.g. `2 / span 2`. Only set on a child of a grid frame. */
  gridColumn?: string;
  gridRow?: string;
  /**
   * Padding per side. Numbers are raw px, formatted to px/rem at generation
   * time via `formatUnit`; strings are emitted verbatim so a fluid `clamp()`
   * can be carried through unchanged.
   */
  padding?: {
    top: number | string;
    right: number | string;
    bottom: number | string;
    left: number | string;
  };
  boxSizing?: string;
  position?: 'relative' | 'absolute';
  left?: string;
  top?: string;
  right?: string;
  bottom?: string;
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string;
  alignSelf?: string;
  overflow?: 'hidden' | 'visible' | 'auto';
  zIndex?: number;
  direction?: 'ltr' | 'rtl';
  transform?: string;
  /** Figma Constraints API — preserved so scale/center layouts survive resize. */
  constraints?: {
    horizontal: string;
    vertical: string;
  };
  /** Negative item spacing in Figma AutoLayout (cannot be expressed as CSS gap) */
  itemSpacing?: number;
  /** Figma canvas stacking order: true means 'First on top' */
  itemReverseZIndex?: boolean;
  /**
   * Turns the node into an inline-size query container (`container-type`).
   * Set on a row whose children are layout *regions*, so a region can respond
   * to the width of the row it sits in rather than to the viewport.
   */
  containerType?: 'inline-size';
  /**
   * Set on a child of a regions row. Once the row can no longer hold its
   * regions side by side — i.e. the row itself is at most `maxInlineSize` wide
   * — the child fills the line it lands on, so a wrapped rail-and-body row
   * reads as a single stacked column instead of leaving a designed-width rail
   * stranded on its own line.
   *
   * Emitted as an unnamed `@container` query, so it always resolves against
   * this child's own row, whatever else is nested around it.
   */
  stackFill?: {
    /** The row's own inline size at which its regions stop fitting. */
    maxInlineSize: string;
  };
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  margin?: string;
  marginInline?: string;
  marginLeft?: string;
  marginRight?: string;
  marginTop?: string;
  marginBottom?: string;
}

export interface VisualStyles {
  background?: string;
  backgroundSize?: string;
  backgroundRepeat?: string;
  backgroundPosition?: string;
  borderRadius?: string;
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  boxSizing?: string;
  outline?: string;
  outlineOffset?: string;
  boxShadow?: string;
  /**
   * A drop shadow on type is not a box shadow. Figma applies the effect to the
   * glyphs, so it has to leave as `text-shadow`; emitting it as `box-shadow`
   * draws a shadow around the text box, which is a different picture at every
   * size. Only set on text nodes.
   */
  textShadow?: string;
  /**
   * A gradient stroke. Figma draws it as a stroke like any other, but a CSS
   * border takes a single colour and `border-image` — the only border that
   * accepts a gradient — ignores `border-radius`, so it squares off every
   * rounded card it is put on. The ring is drawn on a pseudo-element instead:
   * the same thickness, the same radius, and the gradient keeps the box it was
   * drawn in.
   */
  gradientBorder?: {
    /** The gradient as a CSS `<image>`. */
    image: string;
    /** Ring thickness, a CSS length. */
    width: string;
  };
  opacity?: number | string;
  filter?: string;
  backdropFilter?: string;
  transform?: string;
  clipPath?: string;
  mixBlendMode?: string;
  /**
   * `isolation: isolate` — set on a group that contains a blending child.
   * Figma blends a layer against the group it sits in; CSS blends it against
   * everything painted below it in the nearest stacking context, which is
   * usually the page. Isolation is what makes the group the backdrop.
   */
  isolation?: 'isolate';
}

export interface StyledTextSegment {
  text: string;
  fontSize: string;
  /** A weight, or a `var(--font-weight-*)` reference when a token supplies it. */
  fontWeight: number | string;
  fontFamily: string;
  lineHeight: string;
  letterSpacing: string;
  color: string;
  textDecoration?: string;
  textTransform?: string;
  /**
   * Destination of a hyperlink on this run, when Figma stores it per range.
   * A run with one is written as `<a href="…">` around its span.
   */
  href?: string;
}

export interface TypographyStyles {
  fontSize?: string;
  /** A weight, or a `var(--font-weight-*)` reference when a token supplies it. */
  fontWeight?: number | string;
  fontFamily?: string;
  fontStyle?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: string;
  textTransform?: string;
  color?: string;
  whiteSpace?: string;
  wordBreak?: string;
  overflowWrap?: string;
  textOverflow?: string;
  display?: string;
  webkitLineClamp?: number;
  webkitBoxOrient?: string;
  overflow?: string;
  direction?: 'rtl' | 'ltr';
  segments?: StyledTextSegment[];
  isList?: boolean;
  listType?: 'unordered' | 'ordered';
  listGap?: string;
  listBulletColor?: string;
  /**
   * Space between paragraphs of a multi-paragraph text layer.
   *
   * `paragraphSpacing` was read only as a *list* gap, so in ordinary multi-line
   * copy it had no effect at all: the newline became a `<br />` and every line
   * sat at `line-height`. The spacing is the gap between paragraphs, which is
   * why the markup has to become one block per paragraph — see `text-flow.ts`.
   */
  paragraphSpacing?: string;
  /**
   * `font-variant-numeric`, set on a container that reads as a table.
   *
   * Proportional digits are different widths, so a column of numbers drawn in
   * one does not line up; `tabular-nums` gives every digit the same advance.
   * The property inherits, so a single declaration on the table reaches every
   * cell — and nothing outside it, since tabular figures are wider and would
   * loosen running text. See `tabular.ts`.
   */
  fontVariantNumeric?: string;
}

export interface AssetData {
  type: 'svg' | 'image';
  mimeType?: string;
  content: string; // SVG string or data URL (base64)
  filename?: string;
}

export interface IRNode {
  id: string;
  name: string;
  className: string;
  /**
   * Variable-mode classes this node needs — `collection--mode` — because its
   * resolved mode differs from its parent's. CSS variables cascade, so only
   * the node where the mode changes carries the class.
   */
  themeClasses?: string[];
  tag: TagType;
  type: NodeType | string;
  layout: LayoutStyles;
  visual: VisualStyles;
  typography?: TypographyStyles;
  asset?: AssetData;
  text?: string;
  /**
   * Destination of a hyperlink on the whole layer. The markup wraps the text
   * in `<a href>` rather than replacing the element, so a linked heading stays
   * an `<h2>` and a linked paragraph stays a `<p>`.
   */
  href?: string;
  /**
   * Extra HTML attributes for a node that is more than a box. A form control
   * carries what makes it work — `type`, `name`, `placeholder` — and a button
   * says `type="button"` so it does not submit the form it happens to sit in.
   * Values are escaped by the emitters.
   */
  attrs?: Record<string, string>;
  children: IRNode[];
  /**
   * Set on the root of a component instance: the master it was built from.
   * The converter only records the link; `dedupeComponents` decides what to do
   * with it, so a conversion without the dedupe pass is byte-identical to one
   * that never knew about components.
   */
  componentRef?: ComponentRef;
  /**
   * Set on a node that reuses a component's class. Carries the declarations
   * this instance changes — everything else comes from the shared class, which
   * is emitted once for the whole export.
   */
  componentOverride?: ComponentOverride;
}

export type ComponentPropertyValue = string | boolean;

export interface ComponentPropertyDefinition {
  type: string;
  defaultValue?: ComponentPropertyValue;
  variantOptions?: string[];
}

/** A component instance's link back to its master. */
export interface ComponentRef {
  /** The concrete master/variant id, stable across the document. */
  id: string;
  /** Concrete master name, kept for backwards-compatible component markers. */
  name: string;
  /** Component Set id, or the master id for a standalone component. */
  familyId?: string;
  /** Component Set name, or the master name for a standalone component. */
  familyName?: string;
  /** Variant axis values, e.g. `{ Size: 'Medium', State: 'Hover' }`. */
  variantProperties?: Record<string, string>;
  /** Instance component properties, including text/boolean/swap values. */
  componentProperties?: Record<string, ComponentPropertyValue>;
  /** Definitions declared by the Component Set or standalone Component. */
  propertyDefinitions?: Record<string, ComponentPropertyDefinition>;
}

/**
 * The difference between one instance and its component's canonical tree.
 *
 * Only the declarations that actually differ are kept. A node with no
 * `componentOverride` is styled entirely by its shared class.
 */
export interface ComponentOverride {
  /** Modifier class emitted next to the shared class. */
  className: string;
  layout?: Partial<LayoutStyles>;
  visual?: Partial<VisualStyles>;
  typography?: Partial<TypographyStyles>;
}

export type OutputMode = 'pure-css' | 'tailwind' | 'inline-css';

export interface UsedFont {
  family: string;
  styles: string[];
}

export interface CustomFontData {
  id: string;
  family: string;
  style: string;
  weight: number | string;
  format: 'woff2' | 'woff' | 'truetype' | 'opentype';
  base64: string;
  filename: string;
  isVariable?: boolean;
}

export interface ConversionOptions {
  outputMode: OutputMode;
  useRem: boolean;
  baseFontSize: number;
  includeReset: boolean;
  inlineAssets: boolean;
  semanticTags: boolean;
  embedFontsBase64?: boolean;
  customFonts?: CustomFontData[];
  imageScale?: number | 'auto';
  /** Master switch for fluid/intrinsic responsive output. */
  responsive?: boolean;
  /**
   * Let multi-column rows reflow through `flex-wrap` + `min-width` floors.
   * This is intrinsic reflow, not a breakpoint: the browser decides when to
   * wrap based on available space.
   */
  intrinsicReflow?: boolean;
  /**
   * Width (px) the selected root frame was designed at. Fluid lengths use it as
   * the reference for their `vw` coefficient, so they render exactly as
   * designed at this width and scale from there.
   */
  designWidth?: number;
  /**
   * Reuse one class per component instead of re-emitting its styles at every
   * instance. Instances keep their own deviations in a modifier class.
   *
   * Only instances of the same master that are structurally identical can
   * share a definition; anything else falls back to a standalone copy, so the
   * switch can never change what a frame looks like.
   */
  componentDedup?: boolean;
  /**
   * Add component/family/variant data attributes to selection HTML. The plugin
   * UI enables this by default because it is data-only; direct generator calls
   * remain unchanged unless they pass `componentMarkers` explicitly.
   */
  componentMetadata?: boolean;
  /**
   * Emit `data-figma-id="<id>"` on every converted node, so a pixel diff can
   * name the layer it is looking at.
   *
   * Off by default, and off means *off*: the normal output has to stay
   * byte-identical, so nothing reads this unless something asked for it. The
   * mirror harness turns it on, because "12% of the page changed" is useless at
   * 3am while "the layer `1:42` moved" is an answer. The `IRNode` has carried
   * the id all along — the emitters were dropping it, which is what made a diff
   * unable to point at anything.
   */
  debugFigmaIds?: boolean;
}

export interface DebugNodeSummary {
  name: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible?: boolean;
  layoutMode?: string;
  layoutPositioning?: string;
  primaryAlign?: string;
  counterAlign?: string;
  itemSpacing?: number | string;
  clipsContent?: boolean;
  constraints?: unknown;
  padding?: { top?: unknown; right?: unknown; bottom?: unknown; left?: unknown };
  children?: DebugNodeSummary[];
}

/**
 * One selected frame, converted on its own.
 *
 * A multi-frame selection is not one document: each frame is a page of its own.
 * The shared pieces — the stylesheet, the tokens and the fonts — stay on
 * `ConversionResult`; everything that differs per frame lives here.
 */
export interface FrameResult {
  /** Figma node id, kept so an export can link back to the source frame. */
  nodeId?: string;
  nodeName: string;
  width: number;
  height: number;
  isRtl: boolean;
  html: string;
  combinedHtml: string;
  tailwindHtml: string;
  debugTree?: DebugNodeSummary;
}

export interface ConversionResult {
  nodeName: string;
  width: number;
  height: number;
  html: string;
  css: string;
  combinedHtml: string;
  tailwindHtml: string;
  assets: { filename: string; content: string; type: string }[];
  debugTree?: DebugNodeSummary;
  /**
   * Every frame of a multi-frame selection, in Figma's selection order.
   *
   * Absent for a single selection, where the top-level fields already describe
   * the one frame. When present, the top-level frame fields mirror the first
   * entry so older consumers still have a valid document; `css`, `assets`,
   * tokens and fonts are shared by all of them.
   */
  frames?: FrameResult[];
  variablesBlock?: string;
  tokensCSS?: string;
  tokensTailwind?: string;
  tokensJSON?: string;
  tokensJS?: string;
  tokensCSV?: string;
  usedFonts?: UsedFont[];
  customFonts?: CustomFontData[];
}
