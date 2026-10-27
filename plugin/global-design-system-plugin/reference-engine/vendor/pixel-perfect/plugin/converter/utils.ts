import { TagType } from '../types/ir';

/**
 * Converts Figma RGB/RGBA to CSS rgba() string
 */
export function figmaColorToRgba(color: RGB, opacity: number = 1): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = Math.round(opacity * 1000) / 1000;
  if (a >= 1) {
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Converts Figma RGB to Hex string
 */
export function figmaColorToHex(color: RGB): string {
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

/**
 * Calculate linear gradient angle in CSS from Figma gradientTransform matrix [[a, c, tx], [b, d, ty]]
 * Handles 2D affine inverse and aspect ratio (width/height).
 */
export function gradientTransformToAngle(
  transform: Transform,
  width: number = 100,
  height: number = 100
): number {
  const [a, c] = transform[0];
  const [b, d] = transform[1];
  const det = a * d - b * c;
  if (Math.abs(det) < 1e-6) {
    const angleRad = Math.atan2(b, a);
    let angleDeg = Math.round((angleRad * 180) / Math.PI) + 90;
    if (angleDeg < 0) angleDeg += 360;
    return angleDeg % 360;
  }
  const dx = (d / det) * (width || 100);
  const dy = (-b / det) * (height || 100);
  return (Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90) + 360) % 360;
}

/**
 * Fast Base64 encoder for Uint8Array in Figma Sandbox
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i] ?? 0;
    const b2 = i + 1 < len ? (bytes[i + 1] ?? 0) : 0;
    const b3 = i + 2 < len ? (bytes[i + 2] ?? 0) : 0;

    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 3) << 4) | (b2 >> 4);
    const enc3 = ((b2 & 15) << 2) | (b3 >> 6);
    const enc4 = b3 & 63;

    binary += (chars[enc1] ?? '') + (chars[enc2] ?? '');
    binary += i + 1 < len ? (chars[enc3] ?? '') : '=';
    binary += i + 2 < len ? (chars[enc4] ?? '') : '=';
  }

  return binary;
}

/**
 * Decodes Uint8Array to UTF-8 string
 */
export function uint8ArrayToUtf8(bytes: Uint8Array): string {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const c = bytes[i++] ?? 0;
    if (c > 127) {
      if (c > 191 && c < 224) {
        const c2 = bytes[i++] ?? 0;
        result += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
      } else if (c > 223 && c < 240) {
        const c2 = bytes[i++] ?? 0;
        const c3 = bytes[i++] ?? 0;
        result += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      } else {
        const c2 = bytes[i++] ?? 0;
        const c3 = bytes[i++] ?? 0;
        const c4 = bytes[i++] ?? 0;
        let codePoint =
          ((c & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63);
        codePoint -= 0x10000;
        result += String.fromCharCode(
          0xd800 + (codePoint >> 10),
          0xdc00 + (codePoint & 0x3ff)
        );
      }
    } else {
      result += String.fromCharCode(c);
    }
  }
  return result;
}

/**
 * Checks if a string contains Persian/Arabic/RTL characters
 */
export function isRtlText(str?: string): boolean {
  if (!str) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str);
}

export const PERSIAN_UI_DICTIONARY: Record<string, string> = {
  // Compound phrases
  'کارت ملی': 'national-card',
  'رمز یکبار مصرف': 'otp',
  'صفحه اصلی': 'home',
  'تب بار': 'tabbar',
  'نوار تب': 'tabbar',
  'سبد خرید': 'cart',
  'پیش فرض': 'default',
  'پیش‌فرض': 'default',
  'انتخاب شده': 'selected',
  'غیر فعال': 'disabled',
  'غیرفعال': 'disabled',

  // UI components
  'بنر': 'banner',
  'کارت': 'card',
  'تایید': 'confirm',
  'ثبت': 'submit',
  'ارسال': 'send',
  'دکمه': 'btn',
  'کلید': 'btn',
  'عنوان': 'title',
  'تیتر': 'title',
  'سرتیتر': 'heading',
  'متن': 'text',
  'توضیحات': 'desc',
  'توضیح': 'desc',
  'زیرعنوان': 'subtitle',
  'آیکون': 'icon',
  'ایکون': 'icon',
  'نشانه': 'icon',
  'ورودی': 'input',
  'اینپوت': 'input',
  'فیلد': 'field',
  'تصویر': 'image',
  'عکس': 'image',
  'لوگو': 'logo',
  'کانتینر': 'container',
  'باکس': 'box',
  'جعبه': 'box',
  'بسته': 'wrapper',
  'قاب': 'frame',
  'نوار': 'bar',
  'هدر': 'header',
  'سربرگ': 'header',
  'فوتر': 'footer',
  'پاورقی': 'footer',
  'تب': 'tab',
  'زبانه': 'tab',
  'منو': 'menu',
  'فهرست': 'menu',
  'آیتم': 'item',
  'مورد': 'item',
  'گزینه': 'option',
  'وضعیت': 'status',
  'جستجو': 'search',
  'سرچ': 'search',
  'برگشت': 'back',
  'بازگشت': 'back',
  'قبلی': 'prev',
  'بعدی': 'next',
  'پروفایل': 'profile',
  'کاربر': 'user',
  'حساب': 'account',
  'اعلان': 'notification',
  'نوتیفیکیشن': 'notification',
  'پیام': 'message',
  'هشدار': 'alert',
  'برچسب': 'badge',
  'تگ': 'tag',
  'چک باکس': 'checkbox',
  'رادیو': 'radio',
  'اسلایدر': 'slider',
  'مودال': 'modal',
  'پاپ آپ': 'modal',
  'دیالوگ': 'dialog',
  'لینک': 'link',
  'شماره': 'number',
  'تلفن': 'phone',
  'موبایل': 'mobile',
  'کد': 'code',
  'رمز': 'password',
  'خط': 'line',
  'جداکننده': 'divider',
  'پس زمینه': 'bg',
  'بک گراند': 'bg',
  'فلش': 'arrow',
  'پیکان': 'arrow',
  'چک': 'check',
  'تیک': 'check',
  'بستن': 'close',
  'لغو': 'cancel',
  'انصراف': 'cancel',
  'حذف': 'delete',
  'ویرایش': 'edit',
  'افزودن': 'add',
  'ایجاد': 'create',
  'راهنما': 'help',
  'تنظیمات': 'settings',
  'خانه': 'home',
  'فرم': 'form',
  'ردیف': 'row',
  'ستون': 'col',
  'گروه': 'group',
  'لیست': 'list',
  'قیمت': 'price',
  'مبلغ': 'amount',
  'تومان': 'toman',
  'تخفیف': 'discount',
  'تاریخ': 'date',
  'زمان': 'time',
  'ساعت': 'clock',
  'ستاره': 'star',
  'امتیاز': 'rate',
  'دیدگاه': 'comment',
  'نظرات': 'reviews',
  'فعال': 'active',
  'اصلی': 'primary',
  'فرعی': 'secondary',
  'موفق': 'success',
  'خطا': 'error',
  'جدید': 'new',
  'بزرگ': 'large',
  'کوچک': 'small',
};

const PERSIAN_CHAR_MAP: Record<string, string> = {
  'ا': 'a', 'آ': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
  'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z',
  'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's',
  'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f',
  'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'و': 'v', 'ه': 'h', 'ی': 'y', 'ي': 'y', 'ئ': 'e', 'ء': '', 'ة': 'eh',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

export function transliteratePersian(str: string): string {
  let result = '';
  for (const char of str) {
    if (PERSIAN_CHAR_MAP[char] !== undefined) {
      result += PERSIAN_CHAR_MAP[char];
    } else {
      result += char;
    }
  }
  return result;
}

export function translatePersianToSlug(text: string): string {
  let normalized = text
    .toLowerCase()
    .trim()
    .replace(/\u200c/g, ' ') // zero-width non-joiner to space
    .replace(/[ـ\s]+/g, ' ');

  // 1. Check dictionary phrases (longest keys first)
  const sortedKeys = Object.keys(PERSIAN_UI_DICTIONARY).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (normalized.includes(key)) {
      const reg = new RegExp(key, 'g');
      normalized = normalized.replace(reg, ` ${PERSIAN_UI_DICTIONARY[key]} `);
    }
  }

  // 2. Transliterate any remaining Persian characters
  normalized = transliteratePersian(normalized);

  // 3. Clean to valid kebab-case
  return normalized
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Sanitize Figma layer name into valid unique CSS class name.
 * Uses Persian UI dictionary + transliteration, BEM hierarchy, and collision-based scoping.
 */
export function sanitizeClassName(
  name: string,
  nodeId: string,
  parentClassName?: string,
  existingNamesSet?: Set<string>
): string {
  let slug = translatePersianToSlug(name || 'layer');

  if (!slug || /^[0-9]/.test(slug)) {
    slug = `layer${slug ? `-${slug}` : ''}`;
  }

  let finalName = slug;

  // BEM Hierarchy if parentClassName is provided
  if (parentClassName && parentClassName.length > 0 && !parentClassName.startsWith('layer-')) {
    const parentBase = parentClassName.split('__')[0]!;
    const isModifier = /^(active|disabled|selected|primary|secondary|error|success|hover|focus|large|small|new)$/.test(slug);

    if (isModifier) {
      finalName = `${parentBase}--${slug}`;
    } else {
      finalName = `${parentBase}__${slug}`;
    }
  }

  // Collision deduplication
  if (existingNamesSet) {
    if (!existingNamesSet.has(finalName)) {
      existingNamesSet.add(finalName);
      return finalName;
    }
    const withHash = `${finalName}-${shortHash(nodeId).slice(0, 4)}`;
    existingNamesSet.add(withHash);
    return withHash;
  }

  // Fallback for single-node call
  return `${finalName}-${shortHash(nodeId)}`;
}

/** Deterministic 6-char base36 hash of a Figma node id (e.g. "1:2345" -> "a1b2c3"). */
export function shortHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c, 31) >>> 0;
  }
  const combined = ((h1 ^ h2) >>> 0).toString(36);
  return combined.padStart(6, '0').slice(-6);
}

/**
 * Guess semantic HTML tag based on node type and naming conventions
 */
export function detectSemanticTag(node: SceneNode): TagType {
  const name = node.name.toLowerCase();

  if (node.type === 'TEXT') {
    if (name.includes('h1') || name.startsWith('header-1') || name.startsWith('title-1')) return 'h1';
    if (name.includes('h2') || name.startsWith('header-2') || name.startsWith('title-2')) return 'h2';
    if (name.includes('h3') || name.startsWith('header-3') || name.startsWith('title-3')) return 'h3';
    if (name.includes('h4') || name.startsWith('header-4')) return 'h4';
    if (name.includes('button') || name.includes('btn') || name.includes('دکمه')) return 'span';
    if (name.includes('label') || name.includes('لیبل')) return 'span';
    return 'p';
  }

  // CRITICAL: If container has sub-containers (frames, instances, groups, rectangles),
  // it is a layout wrapper or section, NEVER a <button>! In HTML, <button> cannot contain other buttons or complex frames.
  const hasSubContainers =
    'children' in node &&
    node.children.some(
      (c) =>
        c.type === 'FRAME' ||
        c.type === 'INSTANCE' ||
        c.type === 'COMPONENT' ||
        c.type === 'GROUP' ||
        c.type === 'SECTION' ||
        c.type === 'RECTANGLE'
    );

  if (hasSubContainers) {
    if (name.includes('nav') || name.includes('menu') || name.includes('منو')) return 'nav';
    if (name.includes('header') || name.includes('هدر')) return 'header';
    if (name.includes('footer') || name.includes('فوتر')) return 'footer';
    if (name.includes('section') || name.includes('بخش')) return 'section';
    if (name.includes('card') || name.includes('article')) return 'article';
    return 'div';
  }

  if (name.includes('button') || name.includes('btn') || name.startsWith('cta') || name.includes('دکمه')) {
    return 'button';
  }
  if (name.includes('nav') || name.includes('menu') || name.includes('navbar') || name.includes('منو')) {
    return 'nav';
  }
  if (name.includes('header') || name.includes('هدر')) {
    return 'header';
  }
  if (name.includes('footer') || name.includes('فوتر')) {
    return 'footer';
  }
  if (name.includes('card') || name.includes('article')) {
    return 'article';
  }
  if (name.includes('section') || name.includes('بخش')) {
    return 'section';
  }

  return 'div';
}

/**
 * Format pixel value with optional rem conversion
 */
export function formatUnit(value: number, useRem: boolean = false, baseFontSize: number = 16): string {
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) return '0px';
  if (!useRem) return `${rounded}px`;
  const remValue = Math.round((rounded / baseFontSize) * 1000) / 1000;
  return `${remValue}rem`;
}

/**
 * Safely resolves the main ComponentNode for an InstanceNode
 */
export function getMainComponent(node: SceneNode): ComponentNode | null {
  if (node.type === 'INSTANCE') {
    const inst = node as InstanceNode;
    if ('_resolvedMainComponent' in inst && inst._resolvedMainComponent) {
      return inst._resolvedMainComponent as ComponentNode;
    }
    try {
      if ('mainComponent' in inst && inst.mainComponent) {
        return inst.mainComponent;
      }
    } catch {}
  }
  return null;
}

/**
 * Safely extracts the outside stroke weight (if any) from a node or its main component.
 * Returns 0 if stroke is INSIDE, CENTER, invisible, or absent.
 */
export function getOutsideStrokeWeight(node: SceneNode): number {
  let strokeAlign = 'INSIDE';
  const mainComp = getMainComponent(node);

  if ('strokeAlign' in node && typeof (node as any).strokeAlign === 'string') {
    strokeAlign = (node as any).strokeAlign;
  } else if (mainComp && 'strokeAlign' in mainComp && typeof (mainComp as any).strokeAlign === 'string') {
    strokeAlign = (mainComp as any).strokeAlign;
  }

  if (strokeAlign !== 'OUTSIDE') return 0;

  let hasVisibleStroke = false;
  if ('strokes' in node && Array.isArray(node.strokes)) {
    hasVisibleStroke = node.strokes.some((s) => s.visible !== false);
  }
  if (!hasVisibleStroke && mainComp && 'strokes' in mainComp && Array.isArray(mainComp.strokes)) {
    hasVisibleStroke = mainComp.strokes.some((s) => s.visible !== false);
  }

  if (!hasVisibleStroke) return 0;

  let sw = 0;
  if ('strokeWeight' in node && typeof (node as any).strokeWeight === 'number') {
    sw = (node as any).strokeWeight;
  } else if (mainComp && 'strokeWeight' in mainComp && typeof (mainComp as any).strokeWeight === 'number') {
    sw = (mainComp as any).strokeWeight;
  }

  return sw > 0 ? sw : 0;
}

/**
 * Returns the maximum outside stroke weight among immediate children of a container.
 */
export function getChildrenMaxOutsideStroke(node: SceneNode): number {
  if (!('children' in node) || !Array.isArray(node.children)) return 0;
  let maxSw = 0;
  for (const child of node.children) {
    const sw = getOutsideStrokeWeight(child);
    if (sw > maxSw) maxSw = sw;
  }
  return maxSw;
}

/**
 * Computes outer box dimensions for CSS box-sizing: border-box.
 * For nodes with strokeAlign: 'OUTSIDE', outer dimensions are width + 2*sw, height + 2*sw,
 * so the inner content area (padding-box) matches the original Figma inner bounds exactly.
 */
export function getNodeBoxDimensions(node: SceneNode): {
  width: number;
  height: number;
  outsideStrokeWeight: number;
} {
  const outsideSw = getOutsideStrokeWeight(node);
  const w = 'width' in node && typeof node.width === 'number' ? node.width : 0;
  const h = 'height' in node && typeof node.height === 'number' ? node.height : 0;

  return {
    width: w + outsideSw * 2,
    height: h + outsideSw * 2,
    outsideStrokeWeight: outsideSw,
  };
}

