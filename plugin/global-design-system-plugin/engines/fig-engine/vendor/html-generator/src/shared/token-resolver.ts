import type {
  EffectStyleTokenSet,
  ExportedToken,
  TextStyleTokenSet,
  VariablesExportResult,
} from '../plugin/variables/variable-collector';
import { figmaColorToRgba, figmaColorToHex, tokenValueMatchesPaint } from '../plugin/converter/utils';
import { normalizeColorKey } from '../plugin/variables/variable-collector';

export type TokenRegistry = VariablesExportResult | Map<string, ExportedToken> | undefined;

export interface TokenResolverOptions {
  /** Root font size, for comparing a `rem` token against a design px value. */
  baseFontSize?: number;
  /** The node currently being converted, for mode-aware token values. */
  node?: SceneNode;
  /** The node's parent, for deciding where a mode class has to be emitted. */
  parent?: SceneNode | null;
}

type BoundField =
  | 'itemSpacing'
  | 'counterAxisSpacing'
  | 'gridColumnGap'
  | 'gridRowGap'
  | 'cornerRadius'
  | 'topLeftRadius'
  | 'topRightRadius'
  | 'bottomRightRadius'
  | 'bottomLeftRadius'
  | 'fontSize'
  | 'fontFamily'
  | 'fontWeight'
  | 'fontStyle'
  | 'lineHeight'
  | 'letterSpacing'
  | 'paragraphSpacing'
  | 'fills0'
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'strokeWeight'
  | 'opacity'
  | 'width'
  | 'height'
  | 'minWidth'
  | 'maxWidth'
  | 'minHeight'
  | 'maxHeight';

/**
 * Centralises all Figma variable / style lookups.
 * Replaces the 5+ duplicated `boundVariables` blocks across layout/styles/typography.
 */
export class TokenResolver {
  private readonly tokensMap: Map<string, ExportedToken>;
  private readonly tokensByCssVar: Map<string, ExportedToken>;
  private readonly textStyleTokens: Map<string, TextStyleTokenSet>;
  private readonly effectStyleTokens: Map<string, EffectStyleTokenSet>;
  private readonly modeClasses: Map<string, string>;
  private readonly baseFontSize: number;
  private readonly node?: SceneNode;
  private readonly parent?: SceneNode | null;
  private readonly resolveColorFn?: VariablesExportResult['resolveColor'];

  constructor(registry?: TokenRegistry, options: TokenResolverOptions = {}) {
    if (registry instanceof Map) {
      this.tokensMap = registry;
      this.textStyleTokens = new Map();
      this.effectStyleTokens = new Map();
      this.modeClasses = new Map();
    } else {
      this.tokensMap = registry?.tokensMap ?? new Map<string, ExportedToken>();
      this.textStyleTokens = registry?.textStyles ?? new Map();
      this.effectStyleTokens = registry?.effectStyles ?? new Map();
      this.modeClasses = registry?.modeClasses ?? new Map();
      if (registry && 'resolveColor' in registry && typeof registry.resolveColor === 'function') {
        this.resolveColorFn = registry.resolveColor;
      }
    }
    this.tokensByCssVar = new Map();
    for (const token of this.tokensMap.values()) {
      if (!this.tokensByCssVar.has(token.cssVarName)) {
        this.tokensByCssVar.set(token.cssVarName, token);
      }
    }
    this.baseFontSize = options.baseFontSize ?? 16;
    this.node = options.node;
    this.parent = options.parent;
  }

  /** The text style token set applied to a layer or a text run. */
  textStyle(id: string | null | undefined): TextStyleTokenSet | null {
    if (!id) return null;
    return this.textStyleTokens.get(id) ?? null;
  }

  /** The effect style token set applied to a layer. */
  effectStyle(id: string | null | undefined): EffectStyleTokenSet | null {
    if (!id) return null;
    return this.effectStyleTokens.get(id) ?? null;
  }

  /** Returns `var(--token)` when a variable/style id is bound, otherwise null. */
  varFor(id: string | null | undefined): string | null {
    if (!id) return null;
    const token = this.tokensMap.get(id);
    if (!token) return null;
    // A dangling alias (`var(--x)` with no definition in the document) would
    // drop the whole declaration at computed-value time; fall back to the raw
    // value instead of emitting it.
    return this.rawValueFor(token) === null ? null : `var(${token.cssVarName})`;
  }

  /**
   * The `var(--token)` reference for a bound length, with a unit when the
   * token itself has none.
   *
   * A FLOAT variable only carries a unit when its Figma scopes say it is a
   * dimension (`CORNER_RADIUS`, `GAP`, `WIDTH_HEIGHT`, …). An unscoped one is
   * emitted bare by the VarVar exporter, and `padding: var(--x)` with `16` is
   * invalid CSS. `calc(var(--x) * 1px)` is the honest way to use it as a
   * length without redefining the token.
   *
   * @param id - The bound variable id
   * @param expectedPx - The value the design actually resolved to. A token is
   *   only used when it still carries that value (including in the node's
   *   active mode); otherwise the caller keeps the raw value.
   */
  lengthFor(id: string | null | undefined, expectedPx?: number): string | null {
    if (!id) return null;
    const token = this.tokensMap.get(id);
    if (!token) return null;
    const raw = this.rawValueFor(token);
    if (raw === null) return null;
    const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(px|rem|em|%|pt|cm|mm|in|pc|ex|ch|vh|vw|vmin|vmax)?$/i.exec(
      raw.trim()
    );
    if (!match || !match[1]) return null;
    const number = parseFloat(match[1]);
    if (!Number.isFinite(number)) return null;
    const unit = match[2]?.toLowerCase();

    if (expectedPx !== undefined) {
      let resolvedPx: number;
      if (!unit || unit === 'px') resolvedPx = number;
      else if (unit === 'rem' || unit === 'em') resolvedPx = number * this.baseFontSize;
      else if (unit === 'pt') resolvedPx = (number * 96) / 72;
      else if (unit === 'pc') resolvedPx = number * 16;
      else if (unit === 'in') resolvedPx = number * 96;
      else if (unit === 'cm') resolvedPx = (number * 96) / 2.54;
      else if (unit === 'mm') resolvedPx = (number * 96) / 25.4;
      else return null;
      if (Math.abs(resolvedPx - expectedPx) > 0.01) return null;
    }

    // A bare number is a length only once a unit is supplied.
    return unit ? `var(${token.cssVarName})` : `calc(var(${token.cssVarName}) * 1px)`;
  }

  /**
   * The `var(--token)` reference for a bound unitless number (opacity, font
   * weight), optionally checked against the value the node has.
   */
  numberFor(id: string | null | undefined, expected?: number): string | null {
    if (!id) return null;
    const token = this.tokensMap.get(id);
    if (!token) return null;
    const raw = this.rawValueFor(token);
    if (raw === null) return null;
    const number = Number(raw.trim());
    if (!Number.isFinite(number)) return null;
    if (expected !== undefined && Math.abs(number - expected) > 0.0001) return null;
    return `var(${token.cssVarName})`;
  }

  /**
   * The `var(--token)` reference for a bound string (font family), optionally
   * checked against the string the node actually renders with.
   */
  stringFor(id: string | null | undefined, expected?: string): string | null {
    if (!id) return null;
    const token = this.tokensMap.get(id);
    if (!token) return null;
    const raw = this.rawValueFor(token);
    if (raw === null) return null;
    if (expected !== undefined) {
      const value = raw.trim().replace(/^(["'])([\s\S]*)\1$/, '$2');
      if (value !== expected) return null;
    }
    return `var(${token.cssVarName})`;
  }

  /** Resolves any solid color strictly to a CSS variable var(--token) with NO hex/rgb fallbacks in classes. */
  resolveColor(
    color: RGB,
    opacity = 1,
    boundVarId?: string | null,
    styleId?: string | null
  ): string {
    // A token reference is only honest when the token's value is the paint
    // sitting on the node. Bindings outlive their paint — locally edited fills
    // keep the style id, styles get repainted, multi-mode variables resolve
    // per collection — and a stale reference silently repaints the node, so an
    // id whose token no longer matches is not used.
    const honestToken = (id: string | null | undefined): string | null => {
      if (!id) return null;
      const token = this.tokensMap.get(id);
      if (!token) return null;
      const resolved = this.rawValueFor(token);
      if (resolved === null || !tokenValueMatchesPaint(resolved, color, opacity)) return null;
      return `var(${token.cssVarName})`;
    };

    const bound = honestToken(boundVarId) ?? honestToken(styleId);
    if (bound) return bound;
    if (this.resolveColorFn) {
      // The registry's fallback matches by value and synthesizes a document
      // token for colours neither a style nor a variable claims.
      return this.resolveColorFn(color, opacity, boundVarId, styleId);
    }
    // Direct value match by normalized key
    const key = normalizeColorKey(color, opacity);
    const byValue = this.tokensMap.get(key);
    if (byValue) {
      return `var(${byValue.cssVarName})`;
    }
    return opacity >= 1 ? figmaColorToHex(color) : figmaColorToRgba(color, opacity);
  }

  /**
   * Mode classes this node must carry for its variable-bound values to
   * resolve. Only the node where a non-default mode begins gets the class;
   * descendants inherit the custom-property values through the cascade.
   */
  themeClassesFor(node: SceneNode | undefined = this.node): string[] {
    if (!node) return [];
    const resolved = readResolvedModes(node);
    if (!resolved) return [];
    const parentResolved = this.parent ? readResolvedModes(this.parent) : null;
    const classes: string[] = [];
    for (const [collectionId, modeId] of Object.entries(resolved)) {
      if (parentResolved && parentResolved[collectionId] === modeId) continue;
      const className = this.modeClasses.get(`${collectionId}:${modeId}`);
      if (className) classes.push(className);
    }
    return classes;
  }

  /**
   * The value a token actually resolves to, following aliases and applying
   * the node's mode where the token belongs to a collection that has one.
   */
  private rawValueFor(token: ExportedToken): string | null {
    let current = token;
    const modeId = this.modeIdFor(current);
    let value = (modeId && current.modeValues?.[modeId]) ?? current.value;
    const seen = new Set<string>();
    for (let depth = 0; depth < 16; depth++) {
      const match = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,[^)]*)?\)$/.exec(value.trim());
      if (!match || !match[1]) return value.trim();
      const name = match[1];
      // The boolean constants are defined by the exporter's root block but are
      // not variables, so they have no token entry.
      if (name === '--TRUE' || name === '--FALSE') return value.trim();
      if (seen.has(name)) return null;
      seen.add(name);
      const next = this.tokensByCssVar.get(name);
      if (!next) return null;
      const nextMode = this.modeIdFor(next) ?? modeId ?? next.defaultModeId;
      value = (nextMode && next.modeValues?.[nextMode]) ?? next.value;
      current = next;
    }
    return null;
  }

  private modeIdFor(token: ExportedToken): string | undefined {
    if (!this.node || !token.collectionId) return undefined;
    const modes = readResolvedModes(this.node);
    return modes?.[token.collectionId];
  }

  /** Reads a bound variable id from a SceneNode without `any` casts. */
  static boundId(node: SceneNode, path: BoundField): string | null {
    if (!('boundVariables' in node)) return null;
    const bv = node.boundVariables as Record<string, unknown> | undefined;
    if (!bv) return null;
    if (path === 'fills0') {
      return TokenResolver.boundArrayId(node, 'fills', 0);
    }
    const entry = bv[path] as { id?: string } | undefined;
    return entry?.id ?? null;
  }

  /** Reads one entry of an array-valued binding (`fills`, `strokes`, `effects`). */
  static boundArrayId(
    node: SceneNode,
    path: 'fills' | 'strokes' | 'effects' | 'textRangeFills',
    index: number
  ): string | null {
    if (!('boundVariables' in node)) return null;
    const bv = node.boundVariables as Record<string, unknown> | undefined;
    if (!bv) return null;
    const entries = bv[path] as Array<{ id?: string }> | undefined;
    return entries?.[index]?.id ?? null;
  }

  /** A paint's own variable binding, if it carries one. */
  static paintBoundId(paint: Paint | ColorStop): string | null {
    const bound = (paint as unknown as { boundVariables?: { color?: { id?: string } } })
      .boundVariables;
    return bound?.color?.id ?? null;
  }

  /** One geometry/colour binding on an effect. */
  static effectBoundId(
    effect: Effect,
    field: 'color' | 'radius' | 'spread' | 'offsetX' | 'offsetY'
  ): string | null {
    const bound = (effect as unknown as { boundVariables?: Record<string, { id?: string }> })
      .boundVariables;
    return bound?.[field]?.id ?? null;
  }

  /** Reads a style id (fill / stroke / effect / text) from a SceneNode without `any` casts. */
  static styleId(
    node: SceneNode,
    field: 'fillStyleId' | 'strokeStyleId' | 'effectStyleId' | 'textStyleId'
  ): string | null {
    if (!(field in node)) return null;
    const v = (node as unknown as Record<string, unknown>)[field];
    return typeof v === 'string' && v.length > 0 ? v : null;
  }
}

/** The effective variable modes on a node, when the property is available. */
function readResolvedModes(node: BaseNode): Record<string, string> | null {
  const modes = (node as unknown as { resolvedVariableModes?: unknown }).resolvedVariableModes;
  if (!modes || typeof modes !== 'object') return null;
  return modes as Record<string, string>;
}
