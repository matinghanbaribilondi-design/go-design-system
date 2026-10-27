import { IRNode, LayoutStyles, TypographyStyles, VisualStyles } from '../types/ir';
import {
  componentAwareNames,
  sanitizeClassName,
  translatePersianToSlug,
  type CheckableControlKind,
} from './utils';

export type FormControlKind = 'input' | 'textarea' | 'select';

interface TextHit {
  list: IRNode[];
  index: number;
  node: IRNode;
  direct: boolean;
}

const PLACEHOLDER_NAME_RE = /placeholder|hint|value|متن|راهنما|جایگزین/i;
const CHECKED_NAME_RE = /\bchecked\b|\bselected\b|\bactive\b|\bon\b|تیک|انتخاب\s*شده|فعال/i;
const RADIO_GROUP_NAME_RE = /\bradio\b|\bgroup\b|\boptions?\b|\bchoices?\b|رادیو|گروه/i;

/**
 * Every text layer under a control, with the list it sits in, so the chosen
 * one can be replaced in place. A field's placeholder is usually a direct
 * child, but a component may wrap its content in an inner frame.
 */
function collectTextHits(list: IRNode[], direct: boolean, out: TextHit[] = []): TextHit[] {
  list.forEach((node, index) => {
    if (node.type === 'TEXT') {
      out.push({ list, index, node, direct });
      return;
    }
    collectTextHits(node.children, false, out);
  });
  return out;
}

/**
 * The text that should become the placeholder. A layer called "Placeholder"
 * wins over an unlabelled one; a direct child wins over a deeply nested run,
 * because the direct one is what the component is visually built around.
 */
function pickPlaceholder(hits: TextHit[]): TextHit | null {
  const filled = hits.filter((hit) => (hit.node.text ?? '').trim().length > 0);
  return (
    filled.find((hit) => PLACEHOLDER_NAME_RE.test(hit.node.name)) ??
    filled.find((hit) => hit.direct) ??
    filled[0] ??
    hits.find((hit) => hit.direct) ??
    hits[0] ??
    null
  );
}

/** Font metrics belong on the control; list/segment metadata does not. */
function inputTypography(source?: TypographyStyles): TypographyStyles | undefined {
  if (!source) return undefined;
  const clean: TypographyStyles = { ...source };
  delete clean.segments;
  delete clean.isList;
  delete clean.listType;
  delete clean.listGap;
  delete clean.listBulletColor;
  delete clean.paragraphSpacing;
  return clean;
}

/**
 * A field whose whole box is the control. Flex declarations described the
 * Figma frame that held the placeholder; on the input itself they would turn
 * the native text box into a one-child flex container. Position, size, padding
 * and the visual box survive, because those are the design.
 */
function directControlLayout(source: LayoutStyles): LayoutStyles {
  const layout: LayoutStyles = { ...source, boxSizing: 'border-box' };
  delete layout.display;
  delete layout.flexDirection;
  delete layout.justifyContent;
  delete layout.alignItems;
  delete layout.flexWrap;
  delete layout.gap;
  delete layout.rowGap;
  delete layout.columnGap;
  delete layout.gridTemplateColumns;
  delete layout.gridTemplateRows;
  delete layout.gridColumn;
  delete layout.gridRow;
  delete layout.containerType;
  delete layout.stackFill;
  if (!layout.padding) layout.padding = { top: 0, right: 0, bottom: 0, left: 0 };
  if (!layout.width || layout.width === 'fit-content') layout.width = '100%';
  return layout;
}

/**
 * The browser paints a native control with its own background and border. A
 * Figma field's box is the design, so those defaults are cleared; per-side
 * strokes are kept and win over the base reset in the stylesheet's order.
 */
function directControlVisual(source: VisualStyles): VisualStyles {
  const visual: VisualStyles = { ...source };
  delete visual.gradientBorder;
  if (!visual.background) visual.background = 'transparent';
  if (!visual.border) visual.border = 'none';
  return visual;
}

/**
 * A field with an icon or another painted child keeps its wrapper, so the
 * child survives; the control replaces the placeholder inside it and fills the
 * space the text occupied.
 */
function nestedControlLayout(source?: LayoutStyles): LayoutStyles {
  const layout: LayoutStyles = {
    display: 'block',
    width: '100%',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: '0px',
    boxSizing: 'border-box',
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
  };

  if (source?.position === 'absolute') {
    layout.position = 'absolute';
    layout.left = source.left;
    layout.top = source.top;
    layout.right = source.right;
    layout.bottom = source.bottom;
    layout.width = source.width ?? '100%';
    delete layout.flexGrow;
    delete layout.flexShrink;
  }
  if (source?.alignSelf) layout.alignSelf = source.alignSelf;
  if (source?.direction) layout.direction = source.direction;
  return layout;
}

function inferInputType(names: string[]): string {
  const value = names.join(' ').toLowerCase();
  if (/password|passcode|پسورد|رمز/.test(value)) return 'password';
  if (/e-?mail|ایمیل/.test(value)) return 'email';
  if (/search|جستجو/.test(value)) return 'search';
  if (/\b(?:tel|phone|mobile|telephone)\b|تلفن|موبایل/.test(value)) return 'tel';
  if (/\burl\b|website|وب\s*سایت/.test(value)) return 'url';
  if (/\bnumber\b|numeric|عدد/.test(value)) return 'number';
  return 'text';
}

function fieldName(className: string): string {
  const name = className.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return name || 'field';
}

function choiceValue(className: string, label: string): string {
  return translatePersianToSlug(label) || fieldName(className);
}

/**
 * Radios are only exclusive when they share a name, so the frame that holds
 * them is the name. Without a group frame every radio would be its own group
 * and the browser would let the user pick all of them.
 */
function radioGroupName(node: SceneNode, fallback: string): string {
  let current: BaseNode | null = node.parent;
  for (let depth = 0; current && depth < 4; depth += 1, current = current.parent) {
    if (!RADIO_GROUP_NAME_RE.test(current.name)) continue;
    const slug = translatePersianToSlug(current.name);
    if (slug) return slug;
  }
  return fallback;
}

/**
 * A native select has no placeholder attribute; its visible value is an
 * `<option>`. The design's own text is that option, selected by default, which
 * is what keeps the exported control reading like the layer it came from.
 */
function selectOptions(value: string, node: SceneNode): IRNode[] {
  if (!value) return [];
  return [
    {
      id: `${node.id}:option`,
      name: `${node.name} option`,
      className: '',
      tag: 'option',
      type: 'OPTION',
      layout: {},
      visual: {},
      attrs: { value: translatePersianToSlug(value) || 'value', selected: 'selected' },
      text: value,
      children: [],
    },
  ];
}

function buildAttrs(
  kind: FormControlKind,
  names: string[],
  placeholder: string,
  className: string
): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (kind === 'input') attrs.type = inferInputType(names);
  if (placeholder && kind !== 'select') {
    attrs.placeholder =
      kind === 'textarea' ? placeholder : placeholder.replace(/\s*\r?\n\s*/g, ' ');
  }
  // A form control without a name is not submitted. The class is already a
  // stable, valid slug, so it is the name a static export can carry.
  attrs.name = fieldName(className);
  return attrs;
}

/**
 * Turns an input component into an actual `<input>`/`<textarea>`.
 *
 * A simple field becomes the control itself, so border, background, padding
 * and focus outline belong to one element. A field with icons keeps its frame
 * as a wrapper and gets the control in place of the placeholder text. Either
 * way the placeholder stops being painted as a paragraph, which is what made
 * the exported field a picture of a field.
 */
export function applyFormControlSemantics(
  irNode: IRNode,
  kind: FormControlKind,
  node: SceneNode,
  existingNamesSet: Set<string>
): void {
  const hits = collectTextHits(irNode.children, true);
  const placeholderHit = pickPlaceholder(hits);
  const placeholder = (placeholderHit?.node.text ?? '').trim();
  const names = componentAwareNames(node);

  const hasNonTextChild = irNode.children.some((child) => child.type !== 'TEXT');
  const canBeTheControl = !hasNonTextChild && hits.length <= 1 && !irNode.visual.gradientBorder;
  const options = kind === 'select' ? selectOptions(placeholder, node) : [];

  if (canBeTheControl) {
    if (placeholderHit) placeholderHit.list.splice(placeholderHit.index, 1);
    irNode.children = options;
    irNode.tag = kind;
    irNode.type = kind === 'input' ? 'INPUT' : kind === 'select' ? 'SELECT' : 'TEXTAREA';
    irNode.layout = directControlLayout(irNode.layout);
    irNode.visual = directControlVisual(irNode.visual);
    irNode.typography = inputTypography(placeholderHit?.node.typography);
    irNode.attrs = buildAttrs(kind, names, placeholder, irNode.className);
    return;
  }

  irNode.tag = 'div';
  const controlClass = sanitizeClassName('field', `${node.id}:input`, irNode.className, existingNamesSet);
  const control: IRNode = {
    id: `${node.id}:input`,
    name: `${node.name} field`,
    className: controlClass,
    tag: kind,
    type: kind === 'input' ? 'INPUT' : kind === 'select' ? 'SELECT' : 'TEXTAREA',
    layout: nestedControlLayout(placeholderHit?.node.layout),
    visual: { background: 'transparent', border: 'none' },
    typography: inputTypography(placeholderHit?.node.typography),
    // The name belongs to the field, not to the synthetic control's CSS class.
    attrs: buildAttrs(kind, names, placeholder, irNode.className),
    children: options,
  };

  if (placeholderHit) {
    placeholderHit.list.splice(placeholderHit.index, 1, control);
  } else {
    irNode.children.push(control);
  }
}

/**
 * Turns a checkbox, radio or switch component into a real choice.
 *
 * The design keeps its box, label and icons; the whole component becomes a
 * `<label>` and a native input is placed inside it, visually hidden. That is
 * the accessible pattern: clicking anywhere on the component toggles the
 * control, the keyboard can reach it, and a form receives its value. Drawing
 * a native square on top of the design would instead replace the visual the
 * designer made.
 */
export function applyCheckableSemantics(
  irNode: IRNode,
  kind: CheckableControlKind,
  node: SceneNode,
  existingNamesSet: Set<string>
): void {
  const hits = collectTextHits(irNode.children, true);
  const label = (pickPlaceholder(hits)?.node.text ?? '').trim();
  const names = componentAwareNames(node);
  if (node.type === 'INSTANCE') {
    const variants = (node as InstanceNode).variantProperties;
    if (variants) names.push(...Object.values(variants).map((value) => value.toLowerCase()));
  }

  const name =
    kind === 'radio' ? radioGroupName(node, 'radio') : fieldName(irNode.className);
  const value = choiceValue(irNode.className, label);

  const attrs: Record<string, string> = {
    type: kind === 'switch' ? 'checkbox' : kind,
    name,
    value,
  };
  if (kind === 'switch') attrs.role = 'switch';
  if (names.some((candidate) => CHECKED_NAME_RE.test(candidate))) attrs.checked = 'checked';

  irNode.tag = 'label';
  // A label is inline by birth; the frame it came from was block-level.
  if (!irNode.layout.display) irNode.layout.display = 'block';
  if (!irNode.layout.position) irNode.layout.position = 'relative';

  const controlClass = sanitizeClassName(
    'control',
    `${node.id}:control`,
    irNode.className,
    existingNamesSet
  );
  const control: IRNode = {
    id: `${node.id}:control`,
    name: `${node.name} control`,
    className: controlClass,
    tag: 'input',
    type: 'INPUT',
    layout: {
      position: 'absolute',
      left: '0px',
      top: '0px',
      width: '1px',
      height: '1px',
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      boxSizing: 'border-box',
      overflow: 'hidden',
    },
    visual: { opacity: 0, clipPath: 'inset(50%)' },
    attrs,
    children: [],
  };

  irNode.children.unshift(control);
}
