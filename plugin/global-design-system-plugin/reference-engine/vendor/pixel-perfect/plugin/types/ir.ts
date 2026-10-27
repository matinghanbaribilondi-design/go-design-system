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
  | 'li';

export interface LayoutStyles {
  display?: 'flex' | 'block' | 'inline-block';
  flexDirection?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
  flexWrap?: 'wrap' | 'nowrap';
  gap?: string;
  rowGap?: string;
  columnGap?: string;
  /** Raw pixel values — formatted to px/rem at generation time via `formatUnit`. */
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
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
  opacity?: number;
  filter?: string;
  backdropFilter?: string;
  transform?: string;
  clipPath?: string;
  mixBlendMode?: string;
}

export interface StyledTextSegment {
  text: string;
  fontSize: string;
  fontWeight: number;
  fontFamily: string;
  lineHeight: string;
  letterSpacing: string;
  color: string;
  textDecoration?: string;
  textTransform?: string;
}

export interface TypographyStyles {
  fontSize?: string;
  fontWeight?: number;
  fontFamily?: string;
  fontStyle?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: string;
  textTransform?: string;
  color?: string;
  whiteSpace?: string;
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
  tag: TagType;
  type: NodeType | string;
  layout: LayoutStyles;
  visual: VisualStyles;
  typography?: TypographyStyles;
  asset?: AssetData;
  text?: string;
  children: IRNode[];
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
  children?: DebugNodeSummary[];
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
  variablesBlock?: string;
  tokensCSS?: string;
  tokensTailwind?: string;
  tokensJSON?: string;
  tokensJS?: string;
  tokensCSV?: string;
  usedFonts?: UsedFont[];
  customFonts?: CustomFontData[];
}
