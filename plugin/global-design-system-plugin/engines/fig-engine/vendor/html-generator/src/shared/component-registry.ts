import type {
  ComponentPropertyDefinition,
  ComponentOverride,
  IRNode,
  LayoutStyles,
  TypographyStyles,
  VisualStyles,
} from '../plugin/types/ir';

/**
 * Component reuse.
 *
 * A Figma file is mostly instances: the same button, card or nav item placed
 * forty times. Converting each one from scratch produces forty copies of the
 * same rules, differing only where the designer overrode something.
 *
 * This pass turns that around. The first instance of a master becomes the
 * *definition* — its classes are the component's classes, emitted once. Every
 * later instance is compared against it node by node and keeps only the
 * declarations that differ, in a modifier class:
 *
 *     <div class="c-button c-button--v2_3">…</div>
 *
 * The shared class carries the component; the modifier carries the override.
 * Nothing is emitted twice, and the markup keeps its own text and assets, so
 * two instances can say different things and show different images.
 *
 * Two rules keep this from ever changing what a frame looks like:
 *
 * 1. A definition is only reused when the instance is *structurally* the same
 *    — same tags, same child count, same set of styled properties, same assets.
 *    Anything else is left as a standalone copy.
 * 2. The first instance is never rewritten. It *is* the definition.
 */

export interface ComponentDefinition {
  /** Master component id. */
  id: string;
  /** Master name, as it appears in Figma. */
  name: string;
  /** The shared class, i.e. the canonical tree's root class. */
  className: string;
  /** How many instances use this definition, the first one included. */
  uses: number;
  /** The canonical subtree. Its classes are the component's classes. */
  tree: IRNode;
  /** Component Set identity; absent on hand-built legacy IR. */
  familyId?: string;
  familyName?: string;
  variantProperties?: Record<string, string>;
  componentProperties?: Record<string, string | boolean>;
  propertyDefinitions?: Record<string, ComponentPropertyDefinition>;
}

export interface ComponentVariantDefinition {
  id: string;
  name: string;
  className: string;
  uses: number;
  properties: Record<string, string>;
}

export interface ComponentFamilyDefinition {
  id: string;
  name: string;
  propertyDefinitions?: Record<string, ComponentPropertyDefinition>;
  variants: ComponentVariantDefinition[];
}

export interface DedupReport {
  definitions: ComponentDefinition[];
  /** Used Component Sets, grouped independently from concrete masters. */
  families: ComponentFamilyDefinition[];
  /** Instances rewritten to reuse a definition. */
  merged: number;
  /** Instances left standalone because they differ structurally. */
  standalone: number;
}

/** Structural equality of two style bags: same keys, same values. */
function sameShape(a: object | undefined, b: object | undefined): boolean {
  if (!a || !b) return !a && !b;
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key, i) => key === bKeys[i]);
}

/** Deep value equality for the values these style objects hold. */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

/** Keys of `instance` whose value differs from `base`. */
function changedKeys<T extends object>(instance: T, base: T): Partial<T> | undefined {
  const out: Record<string, unknown> = {};
  let count = 0;
  for (const key of Object.keys(instance) as (keyof T)[]) {
    if (!sameValue(instance[key], base[key])) {
      out[key as string] = instance[key];
      count += 1;
    }
  }
  return count > 0 ? (out as Partial<T>) : undefined;
}

/**
 * Whether an instance can reuse `base` without changing a single pixel.
 *
 * The key-set test matters more than it looks: if the base declares a
 * background and the instance has none, CSS has no way to *remove* it short of
 * an `unset`, so such an instance is not reusable — it is a different shape.
 */
function canReuse(instance: IRNode, base: IRNode): boolean {
  if (instance.tag !== base.tag || instance.type !== base.type) return false;
  if (instance.children.length !== base.children.length) return false;
  if ((instance.asset?.content ?? '') !== (base.asset?.content ?? '')) return false;
  if (!sameComponentRef(instance.componentRef, base.componentRef)) return false;
  // Attributes are part of the rendered control (checked, placeholder, type,
  // etc.). They cannot be represented by the style-only modifier class.
  if (JSON.stringify(instance.attrs ?? {}) !== JSON.stringify(base.attrs ?? {})) return false;
  if (instance.href !== base.href) return false;
  if (JSON.stringify(instance.themeClasses ?? []) !== JSON.stringify(base.themeClasses ?? [])) return false;
  // Pseudo-elements and compound transforms are emitted outside the ordinary
  // declaration diff. Falling back here is safer than silently painting the
  // definition's ring/transform on a different Variant.
  if (!sameValue(instance.visual.gradientBorder, base.visual.gradientBorder)) return false;
  if ((instance.visual.transform ?? '') !== (base.visual.transform ?? '')) return false;
  if ((instance.layout.transform ?? '') !== (base.layout.transform ?? '')) return false;
  if (!sameShape(instance.layout, base.layout)) return false;
  if (!sameShape(instance.visual, base.visual)) return false;
  if (!sameShape(instance.typography, base.typography)) return false;
  return instance.children.every((child, i) => {
    const counterpart = base.children[i];
    return counterpart ? canReuse(child, counterpart) : false;
  });
}

/** Component identity is semantic metadata, not just another style bag. */
function sameComponentRef(
  a: IRNode['componentRef'],
  b: IRNode['componentRef']
): boolean {
  if (!a || !b) return !a && !b;
  return (
    a.id === b.id &&
    a.familyId === b.familyId &&
    a.familyName === b.familyName &&
    sameValue(a.variantProperties, b.variantProperties) &&
    sameValue(a.propertyDefinitions, b.propertyDefinitions)
  );
}

/**
 * Rewrites one instance against its definition.
 *
 * `prefix` makes modifier classes unique per instance; `counter` makes them
 * unique per node inside it, so a deep override never collides with another.
 */
function reuse(instance: IRNode, base: IRNode, prefix: string, counter: { n: number }): void {
  const layout = changedKeys<LayoutStyles>(instance.layout, base.layout);
  const visual = changedKeys<VisualStyles>(instance.visual, base.visual);
  const typography = instance.typography
    ? changedKeys<TypographyStyles>(instance.typography, base.typography ?? {})
    : undefined;

  instance.className = base.className;

  if (layout || visual || typography) {
    const override: ComponentOverride = { className: `${base.className}--${prefix}${counter.n++}` };
    if (layout) override.layout = layout;
    if (visual) override.visual = visual;
    if (typography) override.typography = typography;
    instance.componentOverride = override;
  } else {
    delete instance.componentOverride;
  }

  instance.children.forEach((child, i) => {
    const counterpart = base.children[i];
    if (counterpart) reuse(child, counterpart, prefix, counter);
  });
}

/**
 * Dedupes every component instance in the given trees, in place.
 *
 * Call it once, over the whole export, so a component used on page 1 and page
 * 9 shares one definition.
 */
export function dedupeComponents(roots: IRNode[]): DedupReport {
  const registry = createComponentRegistry();
  for (const root of roots) {
    registry.adopt(root);
  }
  return {
    definitions: registry.definitions,
    families: registry.families,
    merged: registry.merged,
    standalone: registry.standalone,
  };
}

/**
 * The same pass, fed one tree at a time.
 *
 * A large archive converts a frame, writes it and releases it; the registry
 * carries the definitions and counters that outlive the tree. `adopt` must be
 * called in the same order as `dedupeComponents` would have walked the roots,
 * because a definition is whichever instance is seen first and modifier names
 * depend on how many instances preceded them. Under that order it is the same
 * pass, not an approximation of it.
 */
export interface ComponentRegistry {
  /** Definitions in first-use order, the same list `dedupeComponents` returns. */
  readonly definitions: ComponentDefinition[];
  readonly families: ComponentFamilyDefinition[];
  readonly merged: number;
  readonly standalone: number;
  /** Dedupes one tree in place and returns the definitions it introduced. */
  adopt(root: IRNode): ComponentDefinition[];
}

export function createComponentRegistry(): ComponentRegistry {
  const definitions = new Map<string, ComponentDefinition>();
  const ordered: ComponentDefinition[] = [];
  const families = new Map<string, ComponentFamilyDefinition>();
  const orderedFamilies: ComponentFamilyDefinition[] = [];
  let merged = 0;
  let standalone = 0;

  const visit = (node: IRNode): void => {
    const ref = node.componentRef;
    if (ref) {
      const existing = definitions.get(ref.id);
      if (!existing) {
        const familyId = ref.familyId ?? ref.id;
        const familyName = ref.familyName ?? ref.name;
        const definition: ComponentDefinition = {
          id: ref.id,
          name: ref.name,
          className: node.className,
          uses: 1,
          tree: node,
          familyId,
          familyName,
          variantProperties: ref.variantProperties,
          componentProperties: ref.componentProperties,
          propertyDefinitions: ref.propertyDefinitions,
        };
        definitions.set(ref.id, definition);
        ordered.push(definition);

        let family = families.get(familyId);
        if (!family) {
          family = {
            id: familyId,
            name: familyName,
            propertyDefinitions: ref.propertyDefinitions,
            variants: [],
          };
          families.set(familyId, family);
          orderedFamilies.push(family);
        }
        family.variants.push({
          id: ref.id,
          name: ref.name,
          className: node.className,
          uses: 1,
          properties: { ...(ref.variantProperties ?? {}) },
        });
      } else if (canReuse(node, existing.tree)) {
        const family = families.get(existing.familyId ?? existing.id);
        const variant = family?.variants.find((item) => item.id === existing.id);
        // Count every occurrence of the concrete variant, including instances
        // that stay standalone because their local structure cannot be safely
        // represented by a style-only modifier.
        if (variant) variant.uses += 1;
        existing.uses += 1;
        reuse(node, existing.tree, `v${existing.uses}_`, { n: 0 });
        merged += 1;
      } else {
        const family = families.get(existing.familyId ?? existing.id);
        const variant = family?.variants.find((item) => item.id === existing.id);
        if (variant) variant.uses += 1;
        standalone += 1;
      }
      // Nested instances belong to this component's own tree. Two parents
      // rewriting the same nested node would fight over its class, so a
      // definition owns everything below its root.
      return;
    }
    for (const child of node.children) visit(child);
  };

  return {
    get definitions() {
      return ordered;
    },
    get families() {
      return orderedFamilies;
    },
    get merged() {
      return merged;
    },
    get standalone() {
      return standalone;
    },
    adopt(root: IRNode): ComponentDefinition[] {
      const before = ordered.length;
      visit(root);
      return ordered.slice(before);
    },
  };
}
