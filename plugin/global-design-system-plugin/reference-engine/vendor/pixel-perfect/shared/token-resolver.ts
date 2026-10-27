import type { ExportedToken, VariablesExportResult } from '../plugin/variables/variable-collector';
import { figmaColorToRgba, figmaColorToHex } from '../plugin/converter/utils';
import { normalizeColorKey } from '../plugin/variables/variable-collector';

export type TokenRegistry = VariablesExportResult | Map<string, ExportedToken> | undefined;

/**
 * Centralises all Figma variable / style lookups.
 * Replaces the 5+ duplicated `boundVariables` blocks across layout/styles/typography.
 */
export class TokenResolver {
  private readonly tokensMap: Map<string, ExportedToken>;
  private readonly resolveColorFn?: VariablesExportResult['resolveColor'];

  constructor(registry?: TokenRegistry) {
    if (registry instanceof Map) {
      this.tokensMap = registry;
    } else {
      this.tokensMap = registry?.tokensMap ?? new Map<string, ExportedToken>();
      if (registry && 'resolveColor' in registry && typeof registry.resolveColor === 'function') {
        this.resolveColorFn = registry.resolveColor;
      }
    }
  }

  /** Returns `var(--token)` when a variable/style id is bound, otherwise null. */
  varFor(id: string | null | undefined): string | null {
    if (!id) return null;
    const token = this.tokensMap.get(id);
    return token ? `var(${token.cssVarName})` : null;
  }

  /** Resolves any solid color strictly to a CSS variable var(--token) with NO hex/rgb fallbacks in classes. */
  resolveColor(
    color: RGB,
    opacity = 1,
    boundVarId?: string | null,
    styleId?: string | null
  ): string {
    const bound = this.varFor(boundVarId) ?? this.varFor(styleId);
    if (bound) {
      const varName = bound.replace(/^var\(/, '').replace(/\)$/, '').split(',')[0]!.trim();
      return `var(${varName})`;
    }
    if (this.resolveColorFn) {
      const res = this.resolveColorFn(color, opacity, boundVarId, styleId);
      if (res.startsWith('var(')) {
        const varName = res.replace(/^var\(/, '').replace(/\)$/, '').split(',')[0]!.trim();
        return `var(${varName})`;
      }
      return res;
    }
    // Direct value match by normalized key
    const key = normalizeColorKey(color, opacity);
    const byValue = this.tokensMap.get(key);
    if (byValue) {
      return `var(${byValue.cssVarName})`;
    }
    return opacity >= 1 ? figmaColorToHex(color) : figmaColorToRgba(color, opacity);
  }

  /** Reads a bound variable id from a SceneNode without `any` casts. */
  static boundId(
    node: SceneNode,
    path:
      | 'itemSpacing'
      | 'cornerRadius'
      | 'fontSize'
      | 'fills0'
      | 'paddingTop'
      | 'paddingRight'
      | 'paddingBottom'
      | 'paddingLeft'
      | 'strokeWeight'
      | 'opacity'
      | 'width'
      | 'height'
  ): string | null {
    if (!('boundVariables' in node)) return null;
    const bv = node.boundVariables as Record<string, unknown> | undefined;
    if (!bv) return null;
    if (path === 'fills0') {
      const fills = bv['fills'] as Array<{ id?: string }> | undefined;
      return fills?.[0]?.id ?? null;
    }
    const entry = bv[path] as { id?: string } | undefined;
    return entry?.id ?? null;
  }

  /** Reads a style id (fill / stroke / effect) from a SceneNode without `any` casts. */
  static styleId(node: SceneNode, field: 'fillStyleId' | 'strokeStyleId' | 'effectStyleId'): string | null {
    if (!(field in node)) return null;
    const v = (node as unknown as Record<string, unknown>)[field];
    return typeof v === 'string' && v.length > 0 ? v : null;
  }
}
