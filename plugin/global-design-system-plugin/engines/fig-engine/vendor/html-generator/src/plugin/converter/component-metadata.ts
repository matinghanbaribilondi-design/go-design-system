import type {
  ComponentPropertyDefinition,
  ComponentPropertyValue,
  ComponentRef,
} from '../types/ir';

/**
 * Figma exposes component metadata through a few different generations of its
 * plugin API. This reader deliberately treats every read as optional: metadata
 * must enrich an export, never make a perfectly renderable instance fail.
 */
type PropertyRecord = Record<string, unknown>;

function read<T>(get: () => T): T | undefined {
  try {
    return get();
  } catch {
    return undefined;
  }
}

function isPropertyValue(value: unknown): value is ComponentPropertyValue {
  return typeof value === 'string' || typeof value === 'boolean';
}

function recordOf(values: unknown): PropertyRecord | undefined {
  return values && typeof values === 'object' && !Array.isArray(values)
    ? (values as PropertyRecord)
    : undefined;
}

function stringRecord(values: unknown): Record<string, string> | undefined {
  const record = recordOf(values);
  if (!record) return undefined;
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string' && value.length > 0) output[key] = value;
  }
  return Object.keys(output).length > 0 ? output : undefined;
}

function componentPropertyRecord(values: unknown): Record<string, ComponentPropertyValue> | undefined {
  const record = recordOf(values);
  if (!record) return undefined;
  const output: Record<string, ComponentPropertyValue> = {};
  for (const [key, raw] of Object.entries(record)) {
    const value = recordOf(raw)?.value;
    if (isPropertyValue(value)) output[key] = value;
  }
  return Object.keys(output).length > 0 ? output : undefined;
}

function propertyDefinitions(values: unknown): Record<string, ComponentPropertyDefinition> | undefined {
  const record = recordOf(values);
  if (!record) return undefined;
  const output: Record<string, ComponentPropertyDefinition> = {};

  for (const [key, raw] of Object.entries(record)) {
    const definition = recordOf(raw);
    if (!definition || typeof definition.type !== 'string') continue;

    const normalized: ComponentPropertyDefinition = { type: definition.type };
    if (isPropertyValue(definition.defaultValue)) normalized.defaultValue = definition.defaultValue;
    if (Array.isArray(definition.variantOptions)) {
      const values = definition.variantOptions.filter((value): value is string => typeof value === 'string');
      if (values.length > 0) normalized.variantOptions = values;
    }
    output[key] = normalized;
  }

  return Object.keys(output).length > 0 ? output : undefined;
}

function legacyVariantDefinitions(
  componentSet: ComponentSetNode | undefined
): Record<string, ComponentPropertyDefinition> | undefined {
  if (!componentSet) return undefined;
  const groups = recordOf(read(() => componentSet.variantGroupProperties));
  if (!groups) return undefined;
  const output: Record<string, ComponentPropertyDefinition> = {};
  for (const [name, raw] of Object.entries(groups)) {
    const values = recordOf(raw)?.values;
    if (!Array.isArray(values)) continue;
    const variantOptions = values.filter((value): value is string => typeof value === 'string');
    if (variantOptions.length > 0) {
      output[name] = { type: 'VARIANT', variantOptions };
    }
  }
  return Object.keys(output).length > 0 ? output : undefined;
}

function mergeStrings(
  first: Record<string, string> | undefined,
  second: Record<string, string> | undefined
): Record<string, string> | undefined {
  const merged = { ...(first ?? {}), ...(second ?? {}) };
  return Object.keys(merged).length > 0 ? merged : undefined;
}

/**
 * Reads the stable identity of an Instance without touching layout, paint or
 * typography. The family is the Component Set when one exists; otherwise the
 * component itself is a one-variant family.
 */
export function readComponentMetadata(instance: InstanceNode, master: ComponentNode): ComponentRef {
  const parent = read(() => master.parent);
  const componentSet = parent?.type === 'COMPONENT_SET' ? (parent as ComponentSetNode) : undefined;
  const family = componentSet ?? master;

  const legacyInstanceVariants = stringRecord(read(() => instance.variantProperties));
  const modernProperties = read(() => instance.componentProperties);
  const modernVariantProperties: Record<string, string> = {};
  if (modernProperties && typeof modernProperties === 'object') {
    for (const [key, raw] of Object.entries(modernProperties)) {
      const value = recordOf(raw)?.value;
      const type = recordOf(raw)?.type;
      if (type === 'VARIANT' && typeof value === 'string') modernVariantProperties[key] = value;
    }
  }

  const componentProperties = componentPropertyRecord(modernProperties);
  const variantProperties = mergeStrings(legacyInstanceVariants, stringRecord(modernVariantProperties));
  const definitions = propertyDefinitions(
    read(() => (family as ComponentSetNode | ComponentNode).componentPropertyDefinitions)
  ) ?? legacyVariantDefinitions(componentSet);

  const result: ComponentRef = {
    id: master.id,
    name: master.name,
    familyId: family.id,
    familyName: family.name,
  };
  if (variantProperties) result.variantProperties = variantProperties;
  if (componentProperties) result.componentProperties = componentProperties;
  if (definitions) result.propertyDefinitions = definitions;

  return result;
}