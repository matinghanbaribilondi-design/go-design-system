// GENERATED FILE — do not edit. Sources: engines/fig-engine/ (module) + src/core.js. Build: node scripts/build.mjs
// ===== HTML engine: fig-engine v1.0.0 (contract 1, sha1 340bef7978) =====
var FigEngine = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // engines/fig-engine/adapter.ts
  var adapter_exports = {};
  __export(adapter_exports, {
    capabilities: () => capabilities,
    contract: () => contract,
    exportComponent: () => exportComponent,
    exportFrame: () => exportFrame,
    id: () => id,
    version: () => version
  });

  // engines/fig-engine/vendor/html-generator/src/plugin/variables/varvar/colorSpaces.ts
  var DTCG_COLOR_SPACES = [
    "srgb",
    "srgb-linear",
    "hsl",
    "hwb",
    "lab",
    "lch",
    "oklab",
    "oklch",
    "display-p3",
    "a98-rgb",
    "prophoto-rgb",
    "rec2020",
    "xyz-d65",
    "xyz-d50"
  ];
  var COLOR_SPACE_SET = new Set(DTCG_COLOR_SPACES);
  var LIN_SRGB_TO_XYZ = [
    [506752 / 1228815, 87881 / 245763, 12673 / 70218],
    [87098 / 409605, 175762 / 245763, 12673 / 175545],
    [7918 / 409605, 87881 / 737289, 1001167 / 1053270]
  ];
  var XYZ_TO_LIN_SRGB = [
    [12831 / 3959, -329 / 214, -1974 / 3959],
    [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
    [705 / 12673, -2585 / 12673, 705 / 667]
  ];
  var LIN_P3_TO_XYZ = [
    [608311 / 1250200, 189793 / 714400, 198249 / 1000160],
    [35783 / 156275, 247089 / 357200, 198249 / 2500400],
    [0 / 1, 32229 / 714400, 5220557 / 5000800]
  ];
  var LIN_A98_TO_XYZ = [
    [573536 / 994567, 263643 / 1420810, 187206 / 994567],
    [591459 / 1989134, 6239551 / 9945670, 374412 / 4972835],
    [53769 / 1989134, 351524 / 4972835, 4929758 / 4972835]
  ];
  var LIN_REC2020_TO_XYZ = [
    [63426534 / 99577255, 20160776 / 139408157, 47086771 / 278816314],
    [26158966 / 99577255, 472592308 / 697040785, 8267143 / 139408157],
    [0 / 1, 19567812 / 697040785, 295819943 / 278816314]
  ];
  var D50_WHITE = [
    0.3457 / 0.3585,
    1,
    (1 - 0.3457 - 0.3585) / 0.3585
  ];
  var LAB_EPSILON = 216 / 24389;
  var LAB_KAPPA = 24389 / 27;

  // engines/fig-engine/vendor/html-generator/src/plugin/variables/varvar/color.ts
  var cssColorToRgba = (css) => {
    const trimmed = css.trim();
    const rgbaMatch = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(trimmed);
    if (rgbaMatch && rgbaMatch[1] && rgbaMatch[2] && rgbaMatch[3]) {
      const r = rgbaMatch[1];
      const g = rgbaMatch[2];
      const b = rgbaMatch[3];
      const a = rgbaMatch[4];
      return {
        r: parseFloat(r) / 255,
        g: parseFloat(g) / 255,
        b: parseFloat(b) / 255,
        a: a !== void 0 ? parseFloat(a) : 1
      };
    }
    const hexMatch = /^#([0-9a-f]{3,8})$/i.exec(trimmed);
    if (hexMatch && hexMatch[1]) {
      let hex = hexMatch[1];
      if (hex.length === 3 || hex.length === 4) {
        hex = hex.split("").map((c) => c + c).join("");
      }
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    }
    throw new Error(`Unrecognized CSS color value: "${css}"`);
  };

  // engines/fig-engine/vendor/html-generator/src/plugin/converter/utils.ts
  function figmaColorToRgba(color, opacity = 1) {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = Math.round(opacity * 1e3) / 1e3;
    if (a >= 1) {
      return `rgb(${r}, ${g}, ${b})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  function figmaColorToHex(color) {
    const r = Math.round(color.r * 255).toString(16).padStart(2, "0");
    const g = Math.round(color.g * 255).toString(16).padStart(2, "0");
    const b = Math.round(color.b * 255).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  function tokenValueMatchesPaint(tokenValue, color, opacity = 1) {
    let tokenRgba;
    try {
      tokenRgba = cssColorToRgba(tokenValue);
    } catch {
      return false;
    }
    const quantize = (v) => Math.round(v * 255) / 255;
    const eps = 1 / 255 + 1e-9;
    const alpha = Math.round(opacity * 1e3) / 1e3;
    return Math.abs(quantize(tokenRgba.r) - quantize(color.r)) <= eps && Math.abs(quantize(tokenRgba.g) - quantize(color.g)) <= eps && Math.abs(quantize(tokenRgba.b) - quantize(color.b)) <= eps && Math.abs(tokenRgba.a - alpha) <= eps;
  }
  function gradientTransformToAngle(transform, width = 100, height = 100) {
    const [a, c] = transform[0];
    const [b, d] = transform[1];
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-6) {
      const angleRad = Math.atan2(b, a);
      let angleDeg = Math.round(angleRad * 180 / Math.PI) + 90;
      if (angleDeg < 0) angleDeg += 360;
      return angleDeg % 360;
    }
    const dx = d / det * (width || 100);
    const dy = -b / det * (height || 100);
    return (Math.round(Math.atan2(dy, dx) * 180 / Math.PI + 90) + 360) % 360;
  }
  function gradientGeometry(transform, width, height) {
    const [a, c, tx] = transform[0];
    const [b, d, ty] = transform[1];
    const w = width > 0 ? width : 100;
    const h = height > 0 ? height : 100;
    const pct = (value) => `${Math.round(value * 100) / 100}%`;
    const centerX = (a * 0.5 + c * 0.5 + tx) * w;
    const centerY = (b * 0.5 + d * 0.5 + ty) * h;
    const radiusX = 0.5 * Math.hypot(a * w, b * h);
    const radiusY = 0.5 * Math.hypot(c * w, d * h);
    const degrees = Math.atan2(b * h, a * w) * 180 / Math.PI + 90;
    const normalized = (degrees % 360 + 360) % 360;
    return {
      center: `${pct(centerX / w * 100)} ${pct(centerY / h * 100)}`,
      radii: `${pct(radiusX / w * 100)} ${pct(radiusY / h * 100)}`,
      startAngle: `${Math.round(normalized)}deg`
    };
  }
  function gradientToCss(fill, width, height, resolveColor, opacity = 1) {
    const stops = fill.gradientStops.map((stop) => {
      const stopAlpha = typeof stop.color.a === "number" ? stop.color.a : 1;
      const effectiveAlpha = Math.round(stopAlpha * opacity * 1e3) / 1e3;
      return `${resolveColor(stop.color, effectiveAlpha, stop)} ${Math.round(stop.position * 100)}%`;
    }).join(", ");
    const geometry = gradientGeometry(fill.gradientTransform, width, height);
    switch (fill.type) {
      case "GRADIENT_LINEAR":
        return `linear-gradient(${gradientTransformToAngle(fill.gradientTransform, width, height)}deg, ${stops})`;
      case "GRADIENT_RADIAL":
        return `radial-gradient(ellipse ${geometry.radii} at ${geometry.center}, ${stops})`;
      case "GRADIENT_ANGULAR":
        return `conic-gradient(from ${geometry.startAngle} at ${geometry.center}, ${stops})`;
      default:
        return `conic-gradient(from 45deg at ${geometry.center}, ${stops})`;
    }
  }
  function uint8ArrayToBase64(bytes) {
    var _a, _b, _c, _d, _e, _f, _g;
    let binary = "";
    const len2 = bytes.byteLength;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (let i = 0; i < len2; i += 3) {
      const b1 = (_a = bytes[i]) != null ? _a : 0;
      const b2 = i + 1 < len2 ? (_b = bytes[i + 1]) != null ? _b : 0 : 0;
      const b3 = i + 2 < len2 ? (_c = bytes[i + 2]) != null ? _c : 0 : 0;
      const enc1 = b1 >> 2;
      const enc2 = (b1 & 3) << 4 | b2 >> 4;
      const enc3 = (b2 & 15) << 2 | b3 >> 6;
      const enc4 = b3 & 63;
      binary += ((_d = chars[enc1]) != null ? _d : "") + ((_e = chars[enc2]) != null ? _e : "");
      binary += i + 1 < len2 ? (_f = chars[enc3]) != null ? _f : "" : "=";
      binary += i + 2 < len2 ? (_g = chars[enc4]) != null ? _g : "" : "=";
    }
    return binary;
  }
  function uint8ArrayToUtf8(bytes) {
    var _a, _b, _c, _d, _e, _f, _g;
    let result = "";
    let i = 0;
    while (i < bytes.length) {
      const c = (_a = bytes[i++]) != null ? _a : 0;
      if (c > 127) {
        if (c > 191 && c < 224) {
          const c2 = (_b = bytes[i++]) != null ? _b : 0;
          result += String.fromCharCode((c & 31) << 6 | c2 & 63);
        } else if (c > 223 && c < 240) {
          const c2 = (_c = bytes[i++]) != null ? _c : 0;
          const c3 = (_d = bytes[i++]) != null ? _d : 0;
          result += String.fromCharCode((c & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
        } else {
          const c2 = (_e = bytes[i++]) != null ? _e : 0;
          const c3 = (_f = bytes[i++]) != null ? _f : 0;
          const c4 = (_g = bytes[i++]) != null ? _g : 0;
          let codePoint = (c & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63;
          codePoint -= 65536;
          result += String.fromCharCode(
            55296 + (codePoint >> 10),
            56320 + (codePoint & 1023)
          );
        }
      } else {
        result += String.fromCharCode(c);
      }
    }
    return result;
  }
  function isRtlText(str) {
    if (!str) return false;
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str);
  }
  var PERSIAN_UI_DICTIONARY = {
    // Compound phrases
    "\u06A9\u0627\u0631\u062A \u0645\u0644\u06CC": "national-card",
    "\u0631\u0645\u0632 \u06CC\u06A9\u0628\u0627\u0631 \u0645\u0635\u0631\u0641": "otp",
    "\u0635\u0641\u062D\u0647 \u0627\u0635\u0644\u06CC": "home",
    "\u062A\u0628 \u0628\u0627\u0631": "tabbar",
    "\u0646\u0648\u0627\u0631 \u062A\u0628": "tabbar",
    "\u0633\u0628\u062F \u062E\u0631\u06CC\u062F": "cart",
    "\u067E\u06CC\u0634 \u0641\u0631\u0636": "default",
    "\u067E\u06CC\u0634\u200C\u0641\u0631\u0636": "default",
    "\u0627\u0646\u062A\u062E\u0627\u0628 \u0634\u062F\u0647": "selected",
    "\u063A\u06CC\u0631 \u0641\u0639\u0627\u0644": "disabled",
    "\u063A\u06CC\u0631\u0641\u0639\u0627\u0644": "disabled",
    // UI components
    "\u0628\u0646\u0631": "banner",
    "\u06A9\u0627\u0631\u062A": "card",
    "\u062A\u0627\u06CC\u06CC\u062F": "confirm",
    "\u062B\u0628\u062A": "submit",
    "\u0627\u0631\u0633\u0627\u0644": "send",
    "\u062F\u06A9\u0645\u0647": "btn",
    "\u06A9\u0644\u06CC\u062F": "btn",
    "\u0639\u0646\u0648\u0627\u0646": "title",
    "\u062A\u06CC\u062A\u0631": "title",
    "\u0633\u0631\u062A\u06CC\u062A\u0631": "heading",
    "\u0645\u062A\u0646": "text",
    "\u062A\u0648\u0636\u06CC\u062D\u0627\u062A": "desc",
    "\u062A\u0648\u0636\u06CC\u062D": "desc",
    "\u0632\u06CC\u0631\u0639\u0646\u0648\u0627\u0646": "subtitle",
    "\u0622\u06CC\u06A9\u0648\u0646": "icon",
    "\u0627\u06CC\u06A9\u0648\u0646": "icon",
    "\u0646\u0634\u0627\u0646\u0647": "icon",
    "\u0648\u0631\u0648\u062F\u06CC": "input",
    "\u0627\u06CC\u0646\u067E\u0648\u062A": "input",
    "\u0641\u06CC\u0644\u062F": "field",
    "\u062A\u0635\u0648\u06CC\u0631": "image",
    "\u0639\u06A9\u0633": "image",
    "\u0644\u0648\u06AF\u0648": "logo",
    "\u06A9\u0627\u0646\u062A\u06CC\u0646\u0631": "container",
    "\u0628\u0627\u06A9\u0633": "box",
    "\u062C\u0639\u0628\u0647": "box",
    "\u0628\u0633\u062A\u0647": "wrapper",
    "\u0642\u0627\u0628": "frame",
    "\u0646\u0648\u0627\u0631": "bar",
    "\u0647\u062F\u0631": "header",
    "\u0633\u0631\u0628\u0631\u06AF": "header",
    "\u0641\u0648\u062A\u0631": "footer",
    "\u067E\u0627\u0648\u0631\u0642\u06CC": "footer",
    "\u062A\u0628": "tab",
    "\u0632\u0628\u0627\u0646\u0647": "tab",
    "\u0645\u0646\u0648": "menu",
    "\u0641\u0647\u0631\u0633\u062A": "menu",
    "\u0622\u06CC\u062A\u0645": "item",
    "\u0645\u0648\u0631\u062F": "item",
    "\u06AF\u0632\u06CC\u0646\u0647": "option",
    "\u0648\u0636\u0639\u06CC\u062A": "status",
    "\u062C\u0633\u062A\u062C\u0648": "search",
    "\u0633\u0631\u0686": "search",
    "\u0628\u0631\u06AF\u0634\u062A": "back",
    "\u0628\u0627\u0632\u06AF\u0634\u062A": "back",
    "\u0642\u0628\u0644\u06CC": "prev",
    "\u0628\u0639\u062F\u06CC": "next",
    "\u067E\u0631\u0648\u0641\u0627\u06CC\u0644": "profile",
    "\u06A9\u0627\u0631\u0628\u0631": "user",
    "\u062D\u0633\u0627\u0628": "account",
    "\u0627\u0639\u0644\u0627\u0646": "notification",
    "\u0646\u0648\u062A\u06CC\u0641\u06CC\u06A9\u06CC\u0634\u0646": "notification",
    "\u067E\u06CC\u0627\u0645": "message",
    "\u0647\u0634\u062F\u0627\u0631": "alert",
    "\u0628\u0631\u0686\u0633\u0628": "badge",
    "\u062A\u06AF": "tag",
    "\u0686\u06A9 \u0628\u0627\u06A9\u0633": "checkbox",
    "\u0631\u0627\u062F\u06CC\u0648": "radio",
    "\u0627\u0633\u0644\u0627\u06CC\u062F\u0631": "slider",
    "\u0645\u0648\u062F\u0627\u0644": "modal",
    "\u067E\u0627\u067E \u0622\u067E": "modal",
    "\u062F\u06CC\u0627\u0644\u0648\u06AF": "dialog",
    "\u0644\u06CC\u0646\u06A9": "link",
    "\u0634\u0645\u0627\u0631\u0647": "number",
    "\u062A\u0644\u0641\u0646": "phone",
    "\u0645\u0648\u0628\u0627\u06CC\u0644": "mobile",
    "\u06A9\u062F": "code",
    "\u0631\u0645\u0632": "password",
    "\u062E\u0637": "line",
    "\u062C\u062F\u0627\u06A9\u0646\u0646\u062F\u0647": "divider",
    "\u067E\u0633 \u0632\u0645\u06CC\u0646\u0647": "bg",
    "\u0628\u06A9 \u06AF\u0631\u0627\u0646\u062F": "bg",
    "\u0641\u0644\u0634": "arrow",
    "\u067E\u06CC\u06A9\u0627\u0646": "arrow",
    "\u0686\u06A9": "check",
    "\u062A\u06CC\u06A9": "check",
    "\u0628\u0633\u062A\u0646": "close",
    "\u0644\u063A\u0648": "cancel",
    "\u0627\u0646\u0635\u0631\u0627\u0641": "cancel",
    "\u062D\u0630\u0641": "delete",
    "\u0648\u06CC\u0631\u0627\u06CC\u0634": "edit",
    "\u0627\u0641\u0632\u0648\u062F\u0646": "add",
    "\u0627\u06CC\u062C\u0627\u062F": "create",
    "\u0631\u0627\u0647\u0646\u0645\u0627": "help",
    "\u062A\u0646\u0638\u06CC\u0645\u0627\u062A": "settings",
    "\u062E\u0627\u0646\u0647": "home",
    "\u0641\u0631\u0645": "form",
    "\u0631\u062F\u06CC\u0641": "row",
    "\u0633\u062A\u0648\u0646": "col",
    "\u06AF\u0631\u0648\u0647": "group",
    "\u0644\u06CC\u0633\u062A": "list",
    "\u0642\u06CC\u0645\u062A": "price",
    "\u0645\u0628\u0644\u063A": "amount",
    "\u062A\u0648\u0645\u0627\u0646": "toman",
    "\u062A\u062E\u0641\u06CC\u0641": "discount",
    "\u062A\u0627\u0631\u06CC\u062E": "date",
    "\u0632\u0645\u0627\u0646": "time",
    "\u0633\u0627\u0639\u062A": "clock",
    "\u0633\u062A\u0627\u0631\u0647": "star",
    "\u0627\u0645\u062A\u06CC\u0627\u0632": "rate",
    "\u062F\u06CC\u062F\u06AF\u0627\u0647": "comment",
    "\u0646\u0638\u0631\u0627\u062A": "reviews",
    "\u0641\u0639\u0627\u0644": "active",
    "\u0627\u0635\u0644\u06CC": "primary",
    "\u0641\u0631\u0639\u06CC": "secondary",
    "\u0645\u0648\u0641\u0642": "success",
    "\u062E\u0637\u0627": "error",
    "\u062C\u062F\u06CC\u062F": "new",
    "\u0628\u0632\u0631\u06AF": "large",
    "\u06A9\u0648\u0686\u06A9": "small"
  };
  var PERSIAN_CHAR_MAP = {
    "\u0627": "a",
    "\u0622": "a",
    "\u0628": "b",
    "\u067E": "p",
    "\u062A": "t",
    "\u062B": "s",
    "\u062C": "j",
    "\u0686": "ch",
    "\u062D": "h",
    "\u062E": "kh",
    "\u062F": "d",
    "\u0630": "z",
    "\u0631": "r",
    "\u0632": "z",
    "\u0698": "zh",
    "\u0633": "s",
    "\u0634": "sh",
    "\u0635": "s",
    "\u0636": "z",
    "\u0637": "t",
    "\u0638": "z",
    "\u0639": "a",
    "\u063A": "gh",
    "\u0641": "f",
    "\u0642": "gh",
    "\u06A9": "k",
    "\u06AF": "g",
    "\u0644": "l",
    "\u0645": "m",
    "\u0646": "n",
    "\u0648": "v",
    "\u0647": "h",
    "\u06CC": "y",
    "\u064A": "y",
    "\u0626": "e",
    "\u0621": "",
    "\u0629": "eh",
    "\u06F0": "0",
    "\u06F1": "1",
    "\u06F2": "2",
    "\u06F3": "3",
    "\u06F4": "4",
    "\u06F5": "5",
    "\u06F6": "6",
    "\u06F7": "7",
    "\u06F8": "8",
    "\u06F9": "9"
  };
  function transliteratePersian(str) {
    let result = "";
    for (const char of str) {
      if (PERSIAN_CHAR_MAP[char] !== void 0) {
        result += PERSIAN_CHAR_MAP[char];
      } else {
        result += char;
      }
    }
    return result;
  }
  function translatePersianToSlug(text) {
    let normalized = text.toLowerCase().trim().replace(/\u200c/g, " ").replace(/[ـ\s]+/g, " ");
    const sortedKeys = Object.keys(PERSIAN_UI_DICTIONARY).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (normalized.includes(key)) {
        const reg = new RegExp(key, "g");
        normalized = normalized.replace(reg, ` ${PERSIAN_UI_DICTIONARY[key]} `);
      }
    }
    normalized = transliteratePersian(normalized);
    return normalized.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  }
  function sanitizeClassName(name, nodeId, parentClassName, existingNamesSet) {
    let slug = translatePersianToSlug(name || "layer");
    if (!slug || /^[0-9]/.test(slug)) {
      slug = `layer${slug ? `-${slug}` : ""}`;
    }
    let finalName = slug;
    if (parentClassName && parentClassName.length > 0 && !parentClassName.startsWith("layer-")) {
      const parentBase = parentClassName.split("__")[0];
      const isModifier = /^(active|disabled|selected|primary|secondary|error|success|hover|focus|large|small|new)$/.test(slug);
      if (isModifier) {
        finalName = `${parentBase}--${slug}`;
      } else {
        finalName = `${parentBase}__${slug}`;
      }
    }
    if (existingNamesSet) {
      if (!existingNamesSet.has(finalName)) {
        existingNamesSet.add(finalName);
        return finalName;
      }
      const withHash = `${finalName}-${shortHash(nodeId).slice(0, 4)}`;
      existingNamesSet.add(withHash);
      return withHash;
    }
    return `${finalName}-${shortHash(nodeId)}`;
  }
  function shortHash(input) {
    let h1 = 2166136261;
    let h2 = 16777619;
    for (let i = 0; i < input.length; i++) {
      const c = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
      h2 = Math.imul(h2 + c, 31) >>> 0;
    }
    const combined = ((h1 ^ h2) >>> 0).toString(36);
    return combined.padStart(6, "0").slice(-6);
  }
  var TEXTAREA_NAME_RE = /\btext[\s_-]?area\b|\bmultiline\b|\bmulti[\s_-]?line\b|چند\s*خطی/i;
  var INPUT_NAME_RE = /\binput\b|\binput[\s_-]?field\b|\btext[\s_-]?field\b|\btext[\s_-]?box\b|\btext[\s_-]?input\b|\bsearch[\s_-]?(?:box|bar|field)\b|اینپوت|فیلد|کادر\s*ورودی/i;
  var BUTTON_CONTAINER_RE = /\bbuttons\b|\bctas\b|\bbtn[\s_-]?(?:group|list|row|bar)\b|\bbutton[\s_-]?(?:group|list|row|bar|set|container|wrapper|area)\b/i;
  var CHECKBOX_NAME_RE = /\bcheck[\s_-]?box(?:es)?\b|چک\s*باکس|چک‌باکس/i;
  var RADIO_NAME_RE = /\bradios?\b|رادیو/i;
  var SWITCH_NAME_RE = /\bswitch(?:es)?\b|\btoggle(?:s)?\b|سوئیچ|سوییچ|تاگل/i;
  var SELECT_NAME_RE = /\bselect\b|\bdropdown\b|\bcombo[\s_-]?box\b|\bcombobox\b|\bselect[\s_-]?picker\b|لیست\s*کشویی|دراپ\s*داون|سلکت/i;
  var CHOICE_CONTAINER_RE = /\bcheck[\s_-]?box(?:es)?[\s_-]?(?:group|list|row|set)\b|\bradio(?:s)?[\s_-]?(?:button[\s_-]?)?(?:group|list|row|set)\b|\bswitch(?:es)?[\s_-]?(?:group|list|row|set)\b|گروه\s*(?:رادیو|چک|سوئیچ|سوییچ)/i;
  function looksLikeTextareaName(name) {
    return TEXTAREA_NAME_RE.test(name);
  }
  function looksLikeInputName(name) {
    return INPUT_NAME_RE.test(name);
  }
  function looksLikeCheckableName(name) {
    if (CHOICE_CONTAINER_RE.test(name)) return false;
    return CHECKBOX_NAME_RE.test(name) || RADIO_NAME_RE.test(name) || SWITCH_NAME_RE.test(name);
  }
  function looksLikeSelectName(name) {
    const lower = name.toLowerCase();
    if (/\b(?:nav|navigation|menu|mega[\s_-]?menu)\b/.test(lower) && !/\bselect\b/.test(lower)) {
      return false;
    }
    return SELECT_NAME_RE.test(lower);
  }
  function paintsSeveralValues(node) {
    let count = 0;
    const visit = (current) => {
      if (count > 1) return;
      if (current.visible === false) return;
      if (current.type === "TEXT") {
        if (current.characters.trim()) count += 1;
        return;
      }
      if ("children" in current) {
        for (const child of current.children) {
          visit(child);
          if (count > 1) return;
        }
      }
    };
    visit(node);
    return count > 1;
  }
  function looksLikeButtonName(name) {
    const lower = name.toLowerCase();
    if (BUTTON_CONTAINER_RE.test(lower)) return false;
    if (looksLikeCheckableName(lower) || looksLikeSelectName(lower)) return false;
    return lower.includes("button") || lower.includes("btn") || lower.startsWith("cta") || lower.includes("\u062F\u06A9\u0645\u0647");
  }
  function detectCheckableKind(node) {
    for (const name of componentAwareNames(node)) {
      if (CHOICE_CONTAINER_RE.test(name)) continue;
      if (CHECKBOX_NAME_RE.test(name)) return "checkbox";
      if (RADIO_NAME_RE.test(name)) return "radio";
      if (SWITCH_NAME_RE.test(name)) return "switch";
    }
    return null;
  }
  function componentAwareNames(node) {
    const names = [];
    if (node.type === "INSTANCE") {
      const master = node._resolvedMainComponent;
      if (master == null ? void 0 : master.name) names.push(master.name);
    }
    if (node.name) names.push(node.name);
    const seen = /* @__PURE__ */ new Set();
    return names.map((name) => name.toLowerCase()).filter((name) => {
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }
  var LEAF_SHAPE_TYPES = /* @__PURE__ */ new Set(["RECTANGLE", "ELLIPSE", "VECTOR", "LINE", "STAR", "POLYGON"]);
  var CONTROL_PART_RE = /label|caption|icon|title|\bbox\b|\btrack\b|\bthumb\b|\bhandle\b|\bknob\b|\bindicator\b|\bmark\b|\btick\b|\bbackground\b|\bbg\b/i;
  function directChildrenReadAs(node, predicate) {
    if (!("children" in node) || !Array.isArray(node.children)) return false;
    const rootIsComponent = node.type === "INSTANCE" || node.type === "COMPONENT";
    return node.children.some((child) => {
      if (child.type === "TEXT" || LEAF_SHAPE_TYPES.has(child.type)) return false;
      if (rootIsComponent && child.type !== "INSTANCE" && child.type !== "COMPONENT") return false;
      return predicate(child.name);
    });
  }
  function childReadsAsControlName(name) {
    if (CONTROL_PART_RE.test(name)) return false;
    return looksLikeButtonName(name) || looksLikeInputName(name) || looksLikeTextareaName(name) || looksLikeCheckableName(name) || looksLikeSelectName(name);
  }
  function detectSemanticTag(node, semanticTags = true) {
    if (!semanticTags) return node.type === "TEXT" ? "p" : "div";
    const name = node.name.toLowerCase();
    const names = componentAwareNames(node);
    const anyName = (predicate) => names.some(predicate);
    if (node.type === "TEXT") {
      if (name.includes("h1") || name.startsWith("header-1") || name.startsWith("title-1")) return "h1";
      if (name.includes("h2") || name.startsWith("header-2") || name.startsWith("title-2")) return "h2";
      if (name.includes("h3") || name.startsWith("header-3") || name.startsWith("title-3")) return "h3";
      if (name.includes("h4") || name.startsWith("header-4")) return "h4";
      if (name.includes("button") || name.includes("btn") || name.includes("\u062F\u06A9\u0645\u0647")) return "span";
      if (name.includes("label") || name.includes("\u0644\u06CC\u0628\u0644")) return "span";
      return "p";
    }
    const childIsControl = directChildrenReadAs(node, childReadsAsControlName);
    if (!childIsControl) {
      if (anyName(looksLikeTextareaName)) return "textarea";
      if (anyName(looksLikeCheckableName)) return "input";
      if (anyName(looksLikeSelectName) && !paintsSeveralValues(node)) return "select";
      if (anyName(looksLikeInputName)) return "input";
    }
    if (!childIsControl && anyName(looksLikeButtonName)) return "button";
    const hasSubContainers = "children" in node && node.children.some(
      (c) => c.type === "FRAME" || c.type === "INSTANCE" || c.type === "COMPONENT" || c.type === "GROUP" || c.type === "SECTION" || c.type === "RECTANGLE"
    );
    if (hasSubContainers) {
      if (anyName((value) => value.includes("nav") || value.includes("menu") || value.includes("\u0645\u0646\u0648"))) return "nav";
      if (anyName((value) => value.includes("header") || value.includes("\u0647\u062F\u0631"))) return "header";
      if (anyName((value) => value.includes("footer") || value.includes("\u0641\u0648\u062A\u0631"))) return "footer";
      if (anyName((value) => value.includes("section") || value.includes("\u0628\u062E\u0634"))) return "section";
      if (anyName((value) => value.includes("card") || value.includes("article"))) return "article";
      return "div";
    }
    if (name.includes("nav") || name.includes("menu") || name.includes("navbar") || name.includes("\u0645\u0646\u0648")) {
      return "nav";
    }
    if (name.includes("header") || name.includes("\u0647\u062F\u0631")) {
      return "header";
    }
    if (name.includes("footer") || name.includes("\u0641\u0648\u062A\u0631")) {
      return "footer";
    }
    if (name.includes("card") || name.includes("article")) {
      return "article";
    }
    if (name.includes("section") || name.includes("\u0628\u062E\u0634")) {
      return "section";
    }
    return "div";
  }
  function formatUnit(value, useRem = false, baseFontSize = 16) {
    const rounded = Math.round(value * 100) / 100;
    if (rounded === 0) return "0px";
    if (!useRem) return `${rounded}px`;
    const remValue = Math.round(rounded / baseFontSize * 1e3) / 1e3;
    return `${remValue}rem`;
  }
  function getMainComponent(node) {
    if (node.type === "INSTANCE") {
      const inst = node;
      if ("_resolvedMainComponent" in inst && inst._resolvedMainComponent) {
        return inst._resolvedMainComponent;
      }
      try {
        if ("mainComponent" in inst && inst.mainComponent) {
          return inst.mainComponent;
        }
      } catch {
      }
    }
    return null;
  }
  function getOutsideStrokeWeight(node) {
    let strokeAlign = "INSIDE";
    const mainComp = getMainComponent(node);
    if ("strokeAlign" in node && typeof node.strokeAlign === "string") {
      strokeAlign = node.strokeAlign;
    } else if (mainComp && "strokeAlign" in mainComp && typeof mainComp.strokeAlign === "string") {
      strokeAlign = mainComp.strokeAlign;
    }
    if (strokeAlign !== "OUTSIDE") return 0;
    let hasVisibleStroke = false;
    if ("strokes" in node && Array.isArray(node.strokes)) {
      hasVisibleStroke = node.strokes.some((s) => s.visible !== false);
    }
    if (!hasVisibleStroke && mainComp && "strokes" in mainComp && Array.isArray(mainComp.strokes)) {
      hasVisibleStroke = mainComp.strokes.some((s) => s.visible !== false);
    }
    if (!hasVisibleStroke) return 0;
    let sw = 0;
    if ("strokeWeight" in node && typeof node.strokeWeight === "number") {
      sw = node.strokeWeight;
    } else if (mainComp && "strokeWeight" in mainComp && typeof mainComp.strokeWeight === "number") {
      sw = mainComp.strokeWeight;
    }
    return sw > 0 ? sw : 0;
  }
  function getChildrenMaxOutsideStroke(node) {
    if (!("children" in node) || !Array.isArray(node.children)) return 0;
    let maxSw = 0;
    for (const child of node.children) {
      const sw = getOutsideStrokeWeight(child);
      if (sw > maxSw) maxSw = sw;
    }
    return maxSw;
  }
  function getNodeBoxDimensions(node) {
    const outsideSw = getOutsideStrokeWeight(node);
    const w = "width" in node && typeof node.width === "number" ? node.width : 0;
    const h = "height" in node && typeof node.height === "number" ? node.height : 0;
    return {
      width: w + outsideSw * 2,
      height: h + outsideSw * 2,
      outsideStrokeWeight: outsideSw
    };
  }

  // engines/fig-engine/vendor/html-generator/src/plugin/converter/strokes.ts
  var GRADIENT_TYPES = /* @__PURE__ */ new Set([
    "GRADIENT_LINEAR",
    "GRADIENT_RADIAL",
    "GRADIENT_ANGULAR",
    "GRADIENT_DIAMOND"
  ]);
  function activeStroke(strokes) {
    if (!strokes || strokes.length === 0) return null;
    for (let i = strokes.length - 1; i >= 0; i -= 1) {
      const paint = strokes[i];
      if (paint && paint.visible !== false) return paint;
    }
    return null;
  }
  function isGradientPaint(paint) {
    return paint !== null && GRADIENT_TYPES.has(paint.type);
  }
  function readMain(src) {
    var _a;
    const resolved = src._resolvedMainComponent;
    if (resolved) return resolved;
    try {
      return (_a = src.mainComponent) != null ? _a : {};
    } catch {
      return {};
    }
  }
  function readStrokeShape(src) {
    const main = readMain(src);
    const inherited = (key) => {
      var _a;
      return (_a = src[key]) != null ? _a : main[key];
    };
    const num2 = (value) => typeof value === "number" && value > 0 ? value : 0;
    const rawWeight = inherited("strokeWeight");
    const uniform = typeof rawWeight === "number" ? num2(rawWeight) : 1;
    const sides = {
      top: num2(inherited("strokeTopWeight")),
      right: num2(inherited("strokeRightWeight")),
      bottom: num2(inherited("strokeBottomWeight")),
      left: num2(inherited("strokeLeftWeight"))
    };
    const anySide = sides.top > 0 || sides.right > 0 || sides.bottom > 0 || sides.left > 0;
    if (anySide) return { weights: sides, perSide: true };
    return { weights: { top: uniform, right: uniform, bottom: uniform, left: uniform }, perSide: false };
  }
  function isUniform(weights) {
    return weights.top > 0 && weights.top === weights.right && weights.top === weights.bottom && weights.top === weights.left;
  }
  function strokeAlignOf(src) {
    var _a;
    const value = (_a = src["strokeAlign"]) != null ? _a : readMain(src)["strokeAlign"];
    return typeof value === "string" ? value : "INSIDE";
  }
  function strokesIncludedInLayout(src) {
    var _a;
    const value = (_a = src["strokesIncludedInLayout"]) != null ? _a : readMain(src)["strokesIncludedInLayout"];
    return value === true;
  }
  function layoutBorderWeights(node) {
    const src = node;
    if (strokesIncludedInLayout(src)) return null;
    const own = "strokes" in node ? node.strokes : void 0;
    const strokes = Array.isArray(own) && own.length > 0 ? own : readMain(src)["strokes"];
    const paint = activeStroke(strokes);
    if (!paint) return null;
    const weights = readStrokeShape(src).weights;
    if (!weights.top && !weights.right && !weights.bottom && !weights.left) return null;
    if (isGradientPaint(paint)) {
      return isUniform(weights) ? null : weights;
    }
    if (strokeAlignOf(src) === "OUTSIDE") return null;
    return weights;
  }
  function planStroke(strokes, src, isLine = false) {
    const paint = activeStroke(strokes);
    if (!paint) return { kind: "none" };
    const { weights, perSide } = readStrokeShape(src);
    const anySide = weights.top > 0 || weights.right > 0 || weights.bottom > 0 || weights.left > 0;
    if (!anySide) return { kind: "none" };
    if (isGradientPaint(paint)) {
      const ring = !isLine && isUniform(weights);
      return { kind: "gradient", paint, weights, ring };
    }
    if (paint.type === "SOLID") {
      return { kind: "solid", paint, weights, perSide };
    }
    return { kind: "none" };
  }

  // engines/fig-engine/vendor/html-generator/src/shared/constants.ts
  var MAX_AUTO_SVG_SIZE = 600;
  var FONT_STACK_LTR = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
  var FONT_STACK_RTL = `'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, sans-serif`;
  var FONT_FALLBACK_CHAIN = `'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  var FLUID_MIN_RATIO = 0.65;
  var FLUID_PADDING_MIN_PX = 32;
  var FLUID_GAP_MIN_PX = 24;
  var FLUID_FONT_MIN_PX = 28;
  var MIN_COLUMN_WIDTH_PX = 280;
  var INTRINSIC_CONTROL_MAX_PX = 64;
  var MULTI_COLUMN_MIN_WIDTH_PX = 460;
  var MULTI_COLUMN_MIN_CHILDREN_PX = 400;
  var SUBSTANTIAL_CHILD_MIN_PX = 120;
  var PHONE_FIT_WIDTH_PX = 340;
  var HEADER_MAX_HEIGHT_PX = 96;
  var TOOLBAR_WIDE_CHILD_MIN_PX = 200;
  var TOOLBAR_SLOT_MIN_PX = 180;
  var REGION_WIDTH_RATIO_MAX = 0.7;
  var ROW_FILL_MIN_RATIO = 0.95;
  var ROW_FILL_SLACK_PX = 4;
  var COUNTER_FILL_MIN_RATIO = 0.96;
  var COUNTER_FILL_SLACK_PX = 4;
  var DOMINANT_CHILD_MIN_RATIO = 0.5;
  var FREEFORM_SPAN_MIN_RATIO = 0.8;
  var EDGE_ANCHOR_TOLERANCE_PX = 2;
  var EDGE_ANCHOR_MIN_RATIO = 0.015;
  var QUADRANT_ANCHOR_MAX_RATIO = 0.12;
  var QUADRANT_ANCHOR_MAX_PX = 64;
  var FREEFORM_FLOW_OVERLAP_TOLERANCE_PX = 2;
  var FREEFORM_FLOW_ALIGN_TOLERANCE_PX = 6;
  var ORTHOGONAL_ROTATION_EPSILON_DEGREES = 0.01;
  var TABULAR_MIN_ROWS = 2;
  var TABULAR_MIN_COLUMNS = 2;
  var TABULAR_MIN_NUMERIC_SHARE = 0.6;

  // engines/fig-engine/vendor/html-generator/src/plugin/converter/dividers.ts
  var DIVIDER_NAME_PATTERN = /^(line|divider|separator|rule|border|stroke|خط|جداکننده)/i;
  function rawSize(node) {
    return {
      width: "width" in node && typeof node.width === "number" ? node.width : 0,
      height: "height" in node && typeof node.height === "number" ? node.height : 0
    };
  }
  function rotationOf(node) {
    return "rotation" in node && typeof node.rotation === "number" ? node.rotation : 0;
  }
  function orthogonalQuarterTurn(node) {
    const normalized = (rotationOf(node) % 360 + 360) % 360;
    const snapped = Math.round(normalized / 90) * 90;
    const delta = Math.abs(normalized - snapped);
    const distance = Math.min(delta, 360 - delta);
    if (distance > ORTHOGONAL_ROTATION_EPSILON_DEGREES) return null;
    return snapped / 90 % 4;
  }
  function localAxis(node, width, height) {
    if (node.type === "LINE") {
      if (width > 0 && height <= 0) return "horizontal";
      if (height > 0 && width <= 0) return "vertical";
      return width >= height ? "horizontal" : "vertical";
    }
    const named = DIVIDER_NAME_PATTERN.test(node.name.trim());
    const horizontal = height <= 1 && width >= 10 || named && height <= 2 && width >= height || height === 0 && width > 0;
    const vertical = width <= 1 && height >= 10 || named && width <= 2 && height >= width || width === 0 && height > 0;
    if (horizontal && !vertical) return "horizontal";
    if (vertical && !horizontal) return "vertical";
    return null;
  }
  function readDividerGeometry(node) {
    if (node.type !== "LINE" && node.type !== "VECTOR" && node.type !== "RECTANGLE") return null;
    const quarterTurn = orthogonalQuarterTurn(node);
    if (quarterTurn === null) return null;
    const { width, height } = rawSize(node);
    const local = localAxis(node, width, height);
    if (!local) return null;
    const crossesAxes = quarterTurn % 2 === 1;
    const axis = crossesAxes ? local === "horizontal" ? "vertical" : "horizontal" : local;
    return {
      axis,
      quarterTurn,
      width: crossesAxes ? height : width,
      height: crossesAxes ? width : height,
      lengthPx: local === "horizontal" ? width : height,
      thicknessPx: local === "horizontal" ? height : width
    };
  }
  function isInLayoutFlow(node, parent) {
    if (!parent) return true;
    if (!("layoutMode" in parent) || parent.layoutMode === "NONE") return false;
    if ("layoutPositioning" in node && node.layoutPositioning === "ABSOLUTE") return false;
    return true;
  }

  // engines/fig-engine/vendor/html-generator/src/plugin/converter/links.ts
  var SAFE_SCHEME = /^(https?:|mailto:|tel:)/i;
  var HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
  function hyperlinkUrl(link) {
    if (!link || typeof link !== "object") return null;
    if (link.type !== "URL") return null;
    const value = typeof link.value === "string" ? link.value.trim() : "";
    if (!value) return null;
    if (!HAS_SCHEME.test(value)) return value;
    return SAFE_SCHEME.test(value) ? value : null;
  }

  // engines/fig-engine/vendor/html-generator/src/shared/responsive.ts
  function responsiveEnabled(options) {
    return options.responsive === true;
  }
  function intrinsicReflowEnabled(options) {
    return responsiveEnabled(options) && options.intrinsicReflow !== false;
  }

  // engines/fig-engine/vendor/html-generator/src/shared/fluid.ts
  function fluidFloor(designPx, minRatio = FLUID_MIN_RATIO) {
    return Math.round(designPx * minRatio);
  }
  function fluidPercent(designPx, referencePx) {
    if (!(designPx > 0) || !(referencePx > 0)) return 0;
    return Math.round(designPx / referencePx * 1e4) / 100;
  }
  function isWorthFluid(designPx, floor) {
    return designPx > 0 && designPx - floor >= 2;
  }
  function unitFor(options) {
    return (v) => formatUnit(v, options.useRem, options.baseFontSize);
  }
  function fluidLength(designPx, referencePx, options, minRatio = FLUID_MIN_RATIO) {
    if (!responsiveEnabled(options)) return null;
    if (!Number.isFinite(designPx) || !Number.isFinite(referencePx)) return null;
    if (designPx <= 0 || referencePx <= 0) return null;
    const floor = fluidFloor(designPx, minRatio);
    if (!isWorthFluid(designPx, floor)) return null;
    const percent = fluidPercent(designPx, referencePx);
    if (percent <= 0) return null;
    const unit = unitFor(options);
    return `clamp(${unit(floor)}, ${percent}%, ${unit(designPx)})`;
  }
  function fluidOrFixed(designPx, referencePx, options, thresholdPx, minRatio = FLUID_MIN_RATIO) {
    if (designPx >= thresholdPx) {
      const fluid = fluidLength(designPx, referencePx, options, minRatio);
      if (fluid) return fluid;
    }
    return formatUnit(designPx, options.useRem, options.baseFontSize);
  }
  function fluidTypeSize(designPx, containerPx, options, minRatio = FLUID_MIN_RATIO) {
    if (!responsiveEnabled(options)) return null;
    if (!Number.isFinite(designPx) || !Number.isFinite(containerPx)) return null;
    if (designPx <= 0 || containerPx <= 0) return null;
    const floor = fluidFloor(designPx, minRatio);
    if (!isWorthFluid(designPx, floor)) return null;
    const percent = fluidPercent(designPx, containerPx);
    if (percent <= 0) return null;
    const unit = unitFor(options);
    return `clamp(${unit(floor)}, ${percent}cqi, ${unit(designPx)})`;
  }
  function fluidTypeOrFixed(designPx, containerPx, options, thresholdPx, minRatio = FLUID_MIN_RATIO) {
    if (designPx >= thresholdPx) {
      const fluid = fluidTypeSize(designPx, containerPx, options, minRatio);
      if (fluid) return fluid;
    }
    return formatUnit(designPx, options.useRem, options.baseFontSize);
  }
  function columnFloorPx(widthPx, minRatio = FLUID_MIN_RATIO) {
    if (!Number.isFinite(widthPx) || widthPx <= 0) return 0;
    return Math.round(Math.min(widthPx * minRatio, MIN_COLUMN_WIDTH_PX));
  }
  function wrapFloor(floorPx, options) {
    const value = formatUnit(floorPx, options.useRem, options.baseFontSize);
    return responsiveEnabled(options) ? `min(${value}, 100%)` : value;
  }

  // engines/fig-engine/vendor/html-generator/src/shared/font-metrics.ts
  var REFERENCE = {
    unitsPerEm: 2048,
    ascender: 1854,
    descender: 434,
    lineGap: 67,
    avgCharWidth: 904
  };
  var BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  function base64ToBytes(input) {
    const clean = input.includes(",") ? input.slice(input.indexOf(",") + 1) : input;
    const bytes = [];
    let buffer = 0;
    let bits = 0;
    for (const char of clean) {
      const value = BASE64.indexOf(char);
      if (value < 0) continue;
      buffer = buffer << 6 | value;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        bytes.push(buffer >> bits & 255);
      }
    }
    return Uint8Array.from(bytes);
  }
  function u16(view, offset) {
    return view.getUint16(offset, false);
  }
  function i16(view, offset) {
    return view.getInt16(offset, false);
  }
  function u32(view, offset) {
    return view.getUint32(offset, false);
  }
  function tag(view, offset) {
    return String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
  }
  function parseFontMetrics(bytes) {
    if (bytes.length < 12) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const version2 = u32(view, 0);
    const isSfnt = version2 === 65536 || tag(view, 0) === "OTTO" || tag(view, 0) === "true";
    if (!isSfnt) return null;
    const numTables = u16(view, 4);
    if (numTables === 0 || numTables > 512) return null;
    const tables = /* @__PURE__ */ new Map();
    for (let i = 0; i < numTables; i += 1) {
      const record = 12 + i * 16;
      if (record + 16 > bytes.length) return null;
      tables.set(tag(view, record), {
        offset: u32(view, record + 8),
        length: u32(view, record + 12)
      });
    }
    const head = tables.get("head");
    const hhea = tables.get("hhea");
    if (!head || !hhea) return null;
    if (head.offset + 54 > bytes.length || hhea.offset + 36 > bytes.length) return null;
    const unitsPerEm = u16(view, head.offset + 18);
    if (!unitsPerEm || unitsPerEm < 16 || unitsPerEm > 16384) return null;
    const ascender = i16(view, hhea.offset + 4);
    const descender = i16(view, hhea.offset + 6);
    const lineGap = i16(view, hhea.offset + 8);
    if (ascender === 0 && descender === 0) return null;
    let avgCharWidth = null;
    const os2 = tables.get("OS/2");
    if (os2 && os2.offset + 4 <= bytes.length) {
      const value = i16(view, os2.offset + 2);
      if (value > 0) avgCharWidth = value;
    }
    return {
      unitsPerEm,
      ascender,
      descender: Math.abs(descender),
      lineGap: Math.max(0, lineGap),
      avgCharWidth
    };
  }
  function metricOverrides(metrics) {
    const perEm = (units) => units / metrics.unitsPerEm;
    const sizeAdjust = metrics.avgCharWidth === null ? 1 : perEm(metrics.avgCharWidth) / (REFERENCE.avgCharWidth / REFERENCE.unitsPerEm);
    const ascent = perEm(metrics.ascender) / sizeAdjust;
    const descent = perEm(metrics.descender) / sizeAdjust;
    const lineGap = perEm(metrics.lineGap) / sizeAdjust;
    return {
      sizeAdjust: Math.round(sizeAdjust * 1e4) / 100,
      ascentOverride: Math.round(ascent * 1e4) / 100,
      descentOverride: Math.round(descent * 1e4) / 100,
      lineGapOverride: Math.round(lineGap * 1e4) / 100
    };
  }
  function fallbackFamily(family) {
    return `${family} Fallback`;
  }
  function isEmbeddedFamily(family, fonts) {
    if (!fonts || fonts.length === 0) return false;
    const wanted = family.trim();
    return fonts.some((font) => font.family.trim() === wanted);
  }
  function fontFamilyWithFallback(family, chain) {
    const fam = family.trim();
    if (!fam) return chain;
    const quoted = `'${fam.replace(/'/g, "\\'")}'`;
    const twin = fallbackFamily(fam).replace(/'/g, "\\'");
    return `${quoted}, '${twin}', ${chain}`;
  }
  var cache = /* @__PURE__ */ new Map();
  function overridesFor(family, base64) {
    const key = `${family}\0${base64.length}`;
    const hit = cache.get(key);
    if (hit !== void 0) return hit;
    const metrics = parseFontMetrics(base64ToBytes(base64));
    const overrides = metrics ? metricOverrides(metrics) : null;
    cache.set(key, overrides);
    return overrides;
  }
  function fallbackFaceCss(family, overrides) {
    return `@font-face {
  font-family: '${fallbackFamily(family)}';
  src: local('Arial'), local('Helvetica'), local('Liberation Sans'), local('Nimbus Sans');
  size-adjust: ${overrides.sizeAdjust}%;
  ascent-override: ${overrides.ascentOverride}%;
  descent-override: ${overrides.descentOverride}%;
  line-gap-override: ${overrides.lineGapOverride}%;
}`;
  }

  // engines/fig-engine/vendor/html-generator/src/plugin/converter/typography.ts
  function familyStack(family, options) {
    const fam = family.trim();
    if (!fam) return FONT_FALLBACK_CHAIN;
    return isEmbeddedFamily(fam, options.customFonts) ? fontFamilyWithFallback(fam, FONT_FALLBACK_CHAIN) : `'${fam}', ${FONT_FALLBACK_CHAIN}`;
  }
  function getFontWeightNumber(style) {
    if (!style) return 400;
    const num2 = parseInt(style, 10);
    if (!isNaN(num2) && num2 >= 100 && num2 <= 950) return num2;
    const s = style.toLowerCase().replace(/[-_\s]+/g, "");
    if (s.includes("thin") || s.includes("hairline")) return 100;
    if (s.includes("extralight") || s.includes("ultralight")) return 200;
    if (s.includes("light")) return 300;
    if (s.includes("medium")) return 500;
    if (s.includes("semibold") || s.includes("demibold")) return 600;
    if (s.includes("extrabold") || s.includes("ultrabold")) return 800;
    if (s.includes("extrablack") || s.includes("ultrablack")) return 950;
    if (s.includes("black") || s.includes("heavy")) return 900;
    if (s.includes("bold")) return 700;
    return 400;
  }
  function formatLineHeight(lineHeight, _fontSize, options) {
    if (!lineHeight || typeof lineHeight !== "object" || !lineHeight.unit) {
      return "normal";
    }
    if (lineHeight.unit === "PIXELS") {
      return formatUnit(lineHeight.value, options.useRem, options.baseFontSize);
    }
    if (lineHeight.unit === "PERCENT") {
      return `${Math.round(lineHeight.value / 100 * 100) / 100}`;
    }
    return "normal";
  }
  function formatLetterSpacing(letterSpacing, options) {
    if (!letterSpacing || typeof letterSpacing !== "object" || !letterSpacing.unit) {
      return "normal";
    }
    if (letterSpacing.unit === "PIXELS") {
      return formatUnit(letterSpacing.value, options.useRem, options.baseFontSize);
    }
    if (letterSpacing.unit === "PERCENT") {
      const emVal = Math.round(letterSpacing.value / 100 * 1e3) / 1e3;
      return `${emVal}em`;
    }
    return "normal";
  }
  function sameLineHeight(a, b) {
    if (!a || !b) return false;
    if (typeof a !== "object" || typeof b !== "object") return a === b;
    if (a.unit !== b.unit) return false;
    if (!("value" in a) || !("value" in b)) return true;
    return Math.abs(a.value - b.value) < 1e-3;
  }
  function sameLetterSpacing(a, b) {
    if (!a || !b) return false;
    if (typeof a !== "object" || typeof b !== "object") return a === b;
    return a.unit === b.unit && Math.abs(a.value - b.value) < 1e-3;
  }
  function tokenRef(token) {
    return token ? `var(${token.cssVarName})` : null;
  }
  function styleSizeRef(style, fontSize) {
    if (!(style == null ? void 0 : style.size) || Math.abs(fontSize - style.fontSizePx) > 0.01) return null;
    return tokenRef(style.size);
  }
  function extractTypography(node, options, tokenRegistry, containerWidthPx) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G;
    const isRtl = isRtlText(node.characters);
    const resolver = new TokenResolver(tokenRegistry, {
      baseFontSize: options.baseFontSize,
      node
    });
    const styleTokens = resolver.textStyle(TokenResolver.styleId(node, "textStyleId"));
    const hasNewlines = Boolean(node.characters && /[\r\n]/.test(node.characters));
    const isAutoWidth = node.textAutoResize === "WIDTH_AND_HEIGHT";
    const isExplicitWrap = node.textAutoResize === "HEIGHT" || node.textAutoResize === "NONE";
    let effectiveLineHeight = 0;
    const fs = typeof node.fontSize === "number" ? node.fontSize : 16;
    if (node.lineHeight && typeof node.lineHeight === "object") {
      if (node.lineHeight.unit === "PIXELS") {
        effectiveLineHeight = node.lineHeight.value;
      } else if (node.lineHeight.unit === "PERCENT") {
        effectiveLineHeight = fs * (node.lineHeight.value / 100);
      }
    }
    if (effectiveLineHeight <= 0) {
      effectiveLineHeight = fs * 1.25;
    }
    const isMultiLine = typeof node.height === "number" && node.height > effectiveLineHeight * 1.35;
    const isShortSingleLine = !hasNewlines && !isMultiLine && !isExplicitWrap && ((((_a = node.characters) == null ? void 0 : _a.length) || 0) <= 40 && node.width <= 240);
    const shouldNowrap = !hasNewlines && !isMultiLine && !isExplicitWrap && (isAutoWidth || isShortSingleLine);
    const result = {
      textAlign: isRtl ? "right" : "left",
      direction: isRtl ? "rtl" : "ltr",
      whiteSpace: shouldNowrap ? "nowrap" : hasNewlines ? "pre-line" : "normal",
      wordBreak: "break-word",
      overflowWrap: "break-word"
    };
    switch (node.textAlignHorizontal) {
      case "CENTER":
        result.textAlign = "center";
        break;
      case "RIGHT":
        result.textAlign = "right";
        result.direction = "rtl";
        break;
      case "JUSTIFIED":
        result.textAlign = "justify";
        break;
      case "LEFT":
        result.textAlign = "left";
        result.direction = "ltr";
        break;
      default:
        result.textAlign = isRtl ? "right" : "left";
        result.direction = isRtl ? "rtl" : "ltr";
    }
    let isList = false;
    let listType = "unordered";
    try {
      const listApi = node;
      if (typeof listApi.getRangeListOptions === "function" && node.characters.length > 0) {
        const lo = listApi.getRangeListOptions(0, Math.min(1, node.characters.length));
        if (lo && typeof lo === "object" && "type" in lo && (lo.type === "UNORDERED" || lo.type === "ORDERED")) {
          isList = true;
          listType = lo.type === "ORDERED" ? "ordered" : "unordered";
        }
      }
    } catch (e) {
      console.warn("[typography] list detection failed:", e);
    }
    if (!isList && node.characters) {
      const rawLines = node.characters.split(/\r\n|\r|\n/).map((l) => l.trim()).filter(Boolean);
      if (rawLines.length > 1 && rawLines.every((l) => l.startsWith("\u2022") || l.startsWith("\u2022") || l.startsWith("- ") || l.startsWith("\u2013 "))) {
        isList = true;
        listType = "unordered";
      }
    }
    const paragraphSpacingPx = typeof node.paragraphSpacing === "number" ? node.paragraphSpacing : 0;
    const paragraphSpacingBindingId = (_e = (_d = TokenResolver.boundId(node, "paragraphSpacing")) != null ? _d : (_c = (_b = styleTokens == null ? void 0 : styleTokens.boundVariables) == null ? void 0 : _b.paragraphSpacing) == null ? void 0 : _c.id) != null ? _e : null;
    const paragraphSpacingRef = paragraphSpacingPx > 0 ? (_f = resolver.lengthFor(paragraphSpacingBindingId, paragraphSpacingPx)) != null ? _f : (styleTokens == null ? void 0 : styleTokens.paragraphSpacing) && Math.abs(styleTokens.paragraphSpacingPx - paragraphSpacingPx) < 0.01 ? tokenRef(styleTokens.paragraphSpacing) : null : null;
    if (isList) {
      result.isList = true;
      result.listType = listType;
      let gap = 8;
      const listSpacing = node.listSpacing;
      let listGapRef = null;
      if (typeof listSpacing === "number" && listSpacing > 0) {
        gap = listSpacing;
      } else if (paragraphSpacingPx > 0) {
        gap = paragraphSpacingPx;
        listGapRef = paragraphSpacingRef;
      }
      result.listGap = listGapRef != null ? listGapRef : formatUnit(gap, options.useRem, options.baseFontSize);
    } else if (hasNewlines && paragraphSpacingPx > 0) {
      result.paragraphSpacing = paragraphSpacingRef != null ? paragraphSpacingRef : formatUnit(paragraphSpacingPx, options.useRem, options.baseFontSize);
      result.whiteSpace = "normal";
    }
    try {
      const segments = node.getStyledTextSegments([
        "fontSize",
        "fontName",
        "fontWeight",
        "fills",
        "fillStyleId",
        "textStyleId",
        "lineHeight",
        "letterSpacing",
        "textDecoration",
        "textCase",
        "hyperlink"
      ]);
      if (segments.length > 1) {
        result.segments = segments.map((seg) => {
          var _a2, _b2, _c2, _d2, _e2;
          const segStyleId = typeof seg.textStyleId === "string" && seg.textStyleId.length > 0 ? seg.textStyleId : null;
          const segStyle = resolver.textStyle(segStyleId);
          const segFills = seg.fills.filter((f) => f.visible !== false && f.type === "SOLID");
          const firstFill = segFills[0];
          let color = result.color || resolver.resolveColor({ r: 0, g: 0, b: 0 }, 1);
          if (firstFill && firstFill.type === "SOLID") {
            const segFillStyleId = typeof seg.fillStyleId === "string" && seg.fillStyleId.length > 0 ? seg.fillStyleId : null;
            color = resolver.resolveColor(
              firstFill.color,
              (_a2 = firstFill.opacity) != null ? _a2 : 1,
              TokenResolver.paintBoundId(firstFill),
              segFillStyleId
            );
          }
          const weight = typeof seg.fontWeight === "number" ? seg.fontWeight : getFontWeightNumber(((_b2 = seg.fontName) == null ? void 0 : _b2.style) || "Regular");
          let textDec = void 0;
          if (seg.textDecoration === "UNDERLINE") textDec = "underline";
          else if (seg.textDecoration === "STRIKETHROUGH") textDec = "line-through";
          let textTrans = void 0;
          if (seg.textCase === "UPPER") textTrans = "uppercase";
          else if (seg.textCase === "LOWER") textTrans = "lowercase";
          else if (seg.textCase === "TITLE") textTrans = "capitalize";
          const fam = ((_c2 = seg.fontName) == null ? void 0 : _c2.family) || "";
          const fontFamily = segStyle && fam && fam === segStyle.fontFamily ? (_d2 = tokenRef(segStyle.family)) != null ? _d2 : familyStack(fam, options) : familyStack(fam, options);
          const baseSegFontSize = formatUnit(seg.fontSize, options.useRem, options.baseFontSize);
          const styleFontSize2 = styleSizeRef(segStyle, seg.fontSize);
          const segFontSize = styleFontSize2 != null ? styleFontSize2 : responsiveEnabled(options) && typeof seg.fontSize === "number" ? fluidTypeOrFixed(seg.fontSize, containerWidthPx != null ? containerWidthPx : node.width, options, FLUID_FONT_MIN_PX) : baseSegFontSize;
          const isSegFluid = !styleFontSize2 && segFontSize !== baseSegFontSize;
          const styleLineHeight = (segStyle == null ? void 0 : segStyle.lineHeight) && sameLineHeight(seg.lineHeight, segStyle.lineHeightValue) ? tokenRef(segStyle.lineHeight) : null;
          let segLineHeight = styleLineHeight != null ? styleLineHeight : formatLineHeight(seg.lineHeight, seg.fontSize, options);
          if (!styleLineHeight && isSegFluid && seg.lineHeight && typeof seg.lineHeight === "object" && seg.lineHeight.unit === "PIXELS" && seg.fontSize > 0) {
            const ratio = Math.round(seg.lineHeight.value / seg.fontSize * 1e3) / 1e3;
            if (ratio > 0) segLineHeight = String(ratio);
          }
          const styleLetterSpacing = (segStyle == null ? void 0 : segStyle.letterSpacing) && sameLetterSpacing(seg.letterSpacing, segStyle.letterSpacingValue) ? tokenRef(segStyle.letterSpacing) : null;
          let segLetterSpacing = styleLetterSpacing != null ? styleLetterSpacing : formatLetterSpacing(seg.letterSpacing, options);
          if (!styleLetterSpacing && isSegFluid && seg.letterSpacing && typeof seg.letterSpacing === "object" && seg.letterSpacing.unit === "PIXELS" && seg.fontSize > 0) {
            const em = Math.round(seg.letterSpacing.value / seg.fontSize * 1e3) / 1e3;
            if (em !== 0) segLetterSpacing = `${em}em`;
          }
          const weightRef = segStyle && weight === segStyle.fontWeight ? tokenRef(segStyle.weight) : null;
          return {
            text: seg.characters,
            fontSize: segFontSize,
            fontWeight: weightRef != null ? weightRef : weight,
            fontFamily,
            lineHeight: segLineHeight,
            letterSpacing: segLetterSpacing,
            color,
            textDecoration: textDec,
            textTransform: textTrans,
            // A link that covers only part of the layer. Requesting `hyperlink`
            // in the field list is also what makes such a run its own segment:
            // identical styling either side of a link would otherwise merge into
            // one span and the destination would be lost.
            href: (_e2 = hyperlinkUrl(seg.hyperlink)) != null ? _e2 : void 0
          };
        });
      }
    } catch (err) {
      console.warn("[typography] getStyledTextSegments failed, falling back to uniform style:", err);
    }
    const fontSizePx = typeof node.fontSize === "number" ? node.fontSize : 16;
    const fontSizeBindingId = (_j = (_i = TokenResolver.boundId(node, "fontSize")) != null ? _i : (_h = (_g = styleTokens == null ? void 0 : styleTokens.boundVariables) == null ? void 0 : _g.fontSize) == null ? void 0 : _h.id) != null ? _j : null;
    const boundFontSize = resolver.lengthFor(fontSizeBindingId, fontSizePx);
    const styleFontSize = typeof node.fontSize === "number" ? styleSizeRef(styleTokens, node.fontSize) : null;
    if (boundFontSize) {
      result.fontSize = boundFontSize;
    } else if (styleFontSize) {
      result.fontSize = styleFontSize;
    } else if (typeof node.fontSize === "number") {
      result.fontSize = formatUnit(node.fontSize, options.useRem, options.baseFontSize);
    }
    const directWeight = typeof node.fontWeight === "number" ? node.fontWeight : void 0;
    const baseWeight = node.fontName && typeof node.fontName === "object" && "family" in node.fontName ? directWeight || getFontWeightNumber(node.fontName.style) : directWeight != null ? directWeight : 400;
    const weightBindingId = (_n = (_m = TokenResolver.boundId(node, "fontWeight")) != null ? _m : (_l = (_k = styleTokens == null ? void 0 : styleTokens.boundVariables) == null ? void 0 : _k.fontWeight) == null ? void 0 : _l.id) != null ? _n : null;
    const boundWeight = resolver.numberFor(weightBindingId, baseWeight);
    const styleWeight = styleTokens && baseWeight === styleTokens.fontWeight ? tokenRef(styleTokens.weight) : null;
    if (node.fontName && typeof node.fontName === "object" && "family" in node.fontName) {
      const fam = node.fontName.family;
      const familyBindingId = (_r = (_q = TokenResolver.boundId(node, "fontFamily")) != null ? _q : (_p = (_o = styleTokens == null ? void 0 : styleTokens.boundVariables) == null ? void 0 : _o.fontFamily) == null ? void 0 : _p.id) != null ? _r : null;
      const boundFamily = resolver.stringFor(familyBindingId, fam);
      const styleFamily = styleTokens && fam && fam === styleTokens.fontFamily ? tokenRef(styleTokens.family) : null;
      result.fontFamily = boundFamily ? `${boundFamily}, ${FONT_FALLBACK_CHAIN}` : styleFamily != null ? styleFamily : familyStack(fam, options);
      result.fontWeight = (_s = boundWeight != null ? boundWeight : styleWeight) != null ? _s : baseWeight;
    } else {
      result.fontFamily = FONT_FALLBACK_CHAIN;
      if ((_t = boundWeight != null ? boundWeight : styleWeight) != null ? _t : directWeight) {
        result.fontWeight = (_u = boundWeight != null ? boundWeight : styleWeight) != null ? _u : directWeight;
      }
    }
    if (node.lineHeight && typeof node.lineHeight === "object") {
      const lineHeightBindingId = (_y = (_x = TokenResolver.boundId(node, "lineHeight")) != null ? _x : (_w = (_v = styleTokens == null ? void 0 : styleTokens.boundVariables) == null ? void 0 : _v.lineHeight) == null ? void 0 : _w.id) != null ? _y : null;
      const boundLineHeight = node.lineHeight.unit === "PIXELS" ? resolver.lengthFor(lineHeightBindingId, node.lineHeight.value) : null;
      const styleLineHeight = (styleTokens == null ? void 0 : styleTokens.lineHeight) && sameLineHeight(node.lineHeight, styleTokens.lineHeightValue) ? tokenRef(styleTokens.lineHeight) : null;
      result.lineHeight = (_z = boundLineHeight != null ? boundLineHeight : styleLineHeight) != null ? _z : formatLineHeight(node.lineHeight, fontSizePx, options);
    }
    if (node.letterSpacing && typeof node.letterSpacing === "object") {
      const letterSpacingBindingId = (_D = (_C = TokenResolver.boundId(node, "letterSpacing")) != null ? _C : (_B = (_A = styleTokens == null ? void 0 : styleTokens.boundVariables) == null ? void 0 : _A.letterSpacing) == null ? void 0 : _B.id) != null ? _D : null;
      const boundLetterSpacing = node.letterSpacing.unit === "PIXELS" ? resolver.lengthFor(letterSpacingBindingId, node.letterSpacing.value) : null;
      const styleLetterSpacing = (styleTokens == null ? void 0 : styleTokens.letterSpacing) && sameLetterSpacing(node.letterSpacing, styleTokens.letterSpacingValue) ? tokenRef(styleTokens.letterSpacing) : null;
      result.letterSpacing = (_E = boundLetterSpacing != null ? boundLetterSpacing : styleLetterSpacing) != null ? _E : formatLetterSpacing(node.letterSpacing, options);
    }
    const fillStyleId = TokenResolver.styleId(node, "fillStyleId");
    if (Array.isArray(node.fills)) {
      const fillIndex = node.fills.findIndex((f) => f.visible !== false && f.type === "SOLID");
      const activeFill = fillIndex >= 0 ? node.fills[fillIndex] : void 0;
      if (activeFill && activeFill.type === "SOLID") {
        const paintBinding = (_F = TokenResolver.paintBoundId(activeFill)) != null ? _F : TokenResolver.boundArrayId(node, "fills", fillIndex);
        result.color = resolver.resolveColor(
          activeFill.color,
          (_G = activeFill.opacity) != null ? _G : 1,
          paintBinding,
          fillStyleId
        );
      }
    }
    if (node.textDecoration === "UNDERLINE") result.textDecoration = "underline";
    else if (node.textDecoration === "STRIKETHROUGH") result.textDecoration = "line-through";
    if (node.textCase === "UPPER") result.textTransform = "uppercase";
    else if (node.textCase === "LOWER") result.textTransform = "lowercase";
    if (result.isList) {
      result.listBulletColor = result.color || (isRtl ? resolver.resolveColor({ r: 30 / 255, g: 41 / 255, b: 59 / 255 }, 1) : "inherit");
    }
    const styleName = node.fontName && typeof node.fontName === "object" && "style" in node.fontName ? String(node.fontName.style).toLowerCase() : "";
    if (styleName.includes("italic") || styleName.includes("oblique")) {
      result.fontStyle = "italic";
    }
    const truncApi = node;
    const isExplicitTruncate = truncApi.textTruncation === "ENDING" || node.textAutoResize === "TRUNCATE";
    if (isExplicitTruncate) {
      const maxLines = typeof truncApi.maxLines === "number" ? truncApi.maxLines : 1;
      if (maxLines <= 1) {
        result.whiteSpace = "nowrap";
        result.textOverflow = "ellipsis";
        result.overflow = "hidden";
      } else {
        result.display = "-webkit-box";
        result.webkitLineClamp = maxLines;
        result.webkitBoxOrient = "vertical";
        result.overflow = "hidden";
      }
    } else if (!hasNewlines && !isMultiLine && node.textAutoResize === "NONE") {
      result.whiteSpace = "nowrap";
      result.textOverflow = "ellipsis";
      result.overflow = "hidden";
    }
    if (responsiveEnabled(options)) {
      if (!result.overflowWrap && result.whiteSpace !== "nowrap") {
        result.overflowWrap = "break-word";
      }
      if (typeof node.fontSize === "number" && !boundFontSize) {
        const fluidFs = fluidTypeOrFixed(
          node.fontSize,
          containerWidthPx != null ? containerWidthPx : node.width,
          options,
          FLUID_FONT_MIN_PX
        );
        if (fluidFs !== result.fontSize) {
          result.fontSize = fluidFs;
          if (node.lineHeight && typeof node.lineHeight === "object" && node.lineHeight.unit === "PIXELS" && node.fontSize > 0) {
            const ratio = Math.round(node.lineHeight.value / node.fontSize * 1e3) / 1e3;
            if (ratio > 0) result.lineHeight = String(ratio);
          }
          if (node.letterSpacing && typeof node.letterSpacing === "object" && node.letterSpacing.unit === "PIXELS" && node.fontSize > 0) {
            const em = Math.round(node.letterSpacing.value / node.fontSize * 1e3) / 1e3;
            if (em !== 0) result.letterSpacing = `${em}em`;
          }
        }
      }
    }
    return result;
  }

  // engines/fig-engine/vendor/html-generator/src/plugin/variables/variable-collector.ts
  function normalizeColorKey(color, opacity = 1) {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = Math.round(opacity * 1e3) / 1e3;
    return `${r},${g},${b},${a}`;
  }

  // engines/fig-engine/vendor/html-generator/src/shared/token-resolver.ts
  var TokenResolver = class _TokenResolver {
    constructor(registry, options = {}) {
      __publicField(this, "tokensMap");
      __publicField(this, "tokensByCssVar");
      __publicField(this, "textStyleTokens");
      __publicField(this, "effectStyleTokens");
      __publicField(this, "modeClasses");
      __publicField(this, "baseFontSize");
      __publicField(this, "node");
      __publicField(this, "parent");
      __publicField(this, "resolveColorFn");
      var _a, _b, _c, _d, _e;
      if (registry instanceof Map) {
        this.tokensMap = registry;
        this.textStyleTokens = /* @__PURE__ */ new Map();
        this.effectStyleTokens = /* @__PURE__ */ new Map();
        this.modeClasses = /* @__PURE__ */ new Map();
      } else {
        this.tokensMap = (_a = registry == null ? void 0 : registry.tokensMap) != null ? _a : /* @__PURE__ */ new Map();
        this.textStyleTokens = (_b = registry == null ? void 0 : registry.textStyles) != null ? _b : /* @__PURE__ */ new Map();
        this.effectStyleTokens = (_c = registry == null ? void 0 : registry.effectStyles) != null ? _c : /* @__PURE__ */ new Map();
        this.modeClasses = (_d = registry == null ? void 0 : registry.modeClasses) != null ? _d : /* @__PURE__ */ new Map();
        if (registry && "resolveColor" in registry && typeof registry.resolveColor === "function") {
          this.resolveColorFn = registry.resolveColor;
        }
      }
      this.tokensByCssVar = /* @__PURE__ */ new Map();
      for (const token of this.tokensMap.values()) {
        if (!this.tokensByCssVar.has(token.cssVarName)) {
          this.tokensByCssVar.set(token.cssVarName, token);
        }
      }
      this.baseFontSize = (_e = options.baseFontSize) != null ? _e : 16;
      this.node = options.node;
      this.parent = options.parent;
    }
    /** The text style token set applied to a layer or a text run. */
    textStyle(id2) {
      var _a;
      if (!id2) return null;
      return (_a = this.textStyleTokens.get(id2)) != null ? _a : null;
    }
    /** The effect style token set applied to a layer. */
    effectStyle(id2) {
      var _a;
      if (!id2) return null;
      return (_a = this.effectStyleTokens.get(id2)) != null ? _a : null;
    }
    /** Returns `var(--token)` when a variable/style id is bound, otherwise null. */
    varFor(id2) {
      if (!id2) return null;
      const token = this.tokensMap.get(id2);
      if (!token) return null;
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
    lengthFor(id2, expectedPx) {
      var _a;
      if (!id2) return null;
      const token = this.tokensMap.get(id2);
      if (!token) return null;
      const raw = this.rawValueFor(token);
      if (raw === null) return null;
      const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(px|rem|em|%|pt|cm|mm|in|pc|ex|ch|vh|vw|vmin|vmax)?$/i.exec(
        raw.trim()
      );
      if (!match || !match[1]) return null;
      const number = parseFloat(match[1]);
      if (!Number.isFinite(number)) return null;
      const unit = (_a = match[2]) == null ? void 0 : _a.toLowerCase();
      if (expectedPx !== void 0) {
        let resolvedPx;
        if (!unit || unit === "px") resolvedPx = number;
        else if (unit === "rem" || unit === "em") resolvedPx = number * this.baseFontSize;
        else if (unit === "pt") resolvedPx = number * 96 / 72;
        else if (unit === "pc") resolvedPx = number * 16;
        else if (unit === "in") resolvedPx = number * 96;
        else if (unit === "cm") resolvedPx = number * 96 / 2.54;
        else if (unit === "mm") resolvedPx = number * 96 / 25.4;
        else return null;
        if (Math.abs(resolvedPx - expectedPx) > 0.01) return null;
      }
      return unit ? `var(${token.cssVarName})` : `calc(var(${token.cssVarName}) * 1px)`;
    }
    /**
     * The `var(--token)` reference for a bound unitless number (opacity, font
     * weight), optionally checked against the value the node has.
     */
    numberFor(id2, expected) {
      if (!id2) return null;
      const token = this.tokensMap.get(id2);
      if (!token) return null;
      const raw = this.rawValueFor(token);
      if (raw === null) return null;
      const number = Number(raw.trim());
      if (!Number.isFinite(number)) return null;
      if (expected !== void 0 && Math.abs(number - expected) > 1e-4) return null;
      return `var(${token.cssVarName})`;
    }
    /**
     * The `var(--token)` reference for a bound string (font family), optionally
     * checked against the string the node actually renders with.
     */
    stringFor(id2, expected) {
      if (!id2) return null;
      const token = this.tokensMap.get(id2);
      if (!token) return null;
      const raw = this.rawValueFor(token);
      if (raw === null) return null;
      if (expected !== void 0) {
        const value = raw.trim().replace(/^(["'])([\s\S]*)\1$/, "$2");
        if (value !== expected) return null;
      }
      return `var(${token.cssVarName})`;
    }
    /** Resolves any solid color strictly to a CSS variable var(--token) with NO hex/rgb fallbacks in classes. */
    resolveColor(color, opacity = 1, boundVarId, styleId) {
      var _a;
      const honestToken = (id2) => {
        if (!id2) return null;
        const token = this.tokensMap.get(id2);
        if (!token) return null;
        const resolved = this.rawValueFor(token);
        if (resolved === null || !tokenValueMatchesPaint(resolved, color, opacity)) return null;
        return `var(${token.cssVarName})`;
      };
      const bound = (_a = honestToken(boundVarId)) != null ? _a : honestToken(styleId);
      if (bound) return bound;
      if (this.resolveColorFn) {
        return this.resolveColorFn(color, opacity, boundVarId, styleId);
      }
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
    themeClassesFor(node = this.node) {
      if (!node) return [];
      const resolved = readResolvedModes(node);
      if (!resolved) return [];
      const parentResolved = this.parent ? readResolvedModes(this.parent) : null;
      const classes = [];
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
    rawValueFor(token) {
      var _a, _b, _c, _d, _e, _f;
      let current = token;
      const modeId = this.modeIdFor(current);
      let value = (_b = modeId && ((_a = current.modeValues) == null ? void 0 : _a[modeId])) != null ? _b : current.value;
      const seen = /* @__PURE__ */ new Set();
      for (let depth = 0; depth < 16; depth++) {
        const match = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,[^)]*)?\)$/.exec(value.trim());
        if (!match || !match[1]) return value.trim();
        const name = match[1];
        if (name === "--TRUE" || name === "--FALSE") return value.trim();
        if (seen.has(name)) return null;
        seen.add(name);
        const next = this.tokensByCssVar.get(name);
        if (!next) return null;
        const nextMode = (_d = (_c = this.modeIdFor(next)) != null ? _c : modeId) != null ? _d : next.defaultModeId;
        value = (_f = nextMode && ((_e = next.modeValues) == null ? void 0 : _e[nextMode])) != null ? _f : next.value;
        current = next;
      }
      return null;
    }
    modeIdFor(token) {
      if (!this.node || !token.collectionId) return void 0;
      const modes = readResolvedModes(this.node);
      return modes == null ? void 0 : modes[token.collectionId];
    }
    /** Reads a bound variable id from a SceneNode without `any` casts. */
    static boundId(node, path) {
      var _a;
      if (!("boundVariables" in node)) return null;
      const bv = node.boundVariables;
      if (!bv) return null;
      if (path === "fills0") {
        return _TokenResolver.boundArrayId(node, "fills", 0);
      }
      const entry = bv[path];
      return (_a = entry == null ? void 0 : entry.id) != null ? _a : null;
    }
    /** Reads one entry of an array-valued binding (`fills`, `strokes`, `effects`). */
    static boundArrayId(node, path, index) {
      var _a, _b;
      if (!("boundVariables" in node)) return null;
      const bv = node.boundVariables;
      if (!bv) return null;
      const entries = bv[path];
      return (_b = (_a = entries == null ? void 0 : entries[index]) == null ? void 0 : _a.id) != null ? _b : null;
    }
    /** A paint's own variable binding, if it carries one. */
    static paintBoundId(paint) {
      var _a, _b;
      const bound = paint.boundVariables;
      return (_b = (_a = bound == null ? void 0 : bound.color) == null ? void 0 : _a.id) != null ? _b : null;
    }
    /** One geometry/colour binding on an effect. */
    static effectBoundId(effect, field) {
      var _a, _b;
      const bound = effect.boundVariables;
      return (_b = (_a = bound == null ? void 0 : bound[field]) == null ? void 0 : _a.id) != null ? _b : null;
    }
    /** Reads a style id (fill / stroke / effect / text) from a SceneNode without `any` casts. */
    static styleId(node, field) {
      if (!(field in node)) return null;
      const v = node[field];
      return typeof v === "string" && v.length > 0 ? v : null;
    }
  };
  function readResolvedModes(node) {
    const modes = node.resolvedVariableModes;
    if (!modes || typeof modes !== "object") return null;
    return modes;
  }

  // engines/fig-engine/vendor/html-generator/src/shared/sizing.ts
  function mainAxisBox(sizing, options) {
    var _a;
    const { role, drawnPx, grow } = sizing;
    const drawn = formatUnit(drawnPx, options.useRem, options.baseFontSize);
    if (role === "fixed") {
      const rigid = {
        width: drawn,
        flexGrow: 0,
        flexShrink: 0
      };
      if (responsiveEnabled(options)) rigid.maxWidth = "100%";
      return rigid;
    }
    const floorPx = Math.min((_a = sizing.floorPx) != null ? _a : 0, drawnPx > 0 ? drawnPx : 0);
    const minWidth = sizing.floorToContent ? "min-content" : floorPx > 0 ? wrapFloor(floorPx, options) : "0";
    if (role === "fill") {
      return {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: "0%",
        minWidth,
        // A `fill` fills by default. Asking for `cap: 'drawn'` turns it into a
        // *flexible slot*: it starts at nothing, grows into whatever the row has
        // spare, and stops at the width it was drawn at.
        //
        // That cap is what makes a slot compress instead of breaking its row. A
        // flex line breaks on each item's *hypothetical* size — its basis clamped
        // by min/max — and it does so before any shrinking is considered. A 700px
        // basis in a 768px bar therefore breaks the line even though the slot
        // would have been perfectly happy at 416px. With a zero basis the
        // hypothetical size is the slot's floor, so the line only breaks when the
        // slot can no longer be used.
        //
        // Free space also lands in the right place: when a bar has two slots the
        // smaller one hits its cap first and the rest goes to the larger, which
        // is the drawn proportion without needing to state it.
        maxWidth: sizing.cap === "drawn" ? drawn : "100%"
      };
    }
    return {
      flexGrow: grow ? 1 : 0,
      flexShrink: 1,
      flexBasis: drawn,
      minWidth,
      maxWidth: sizing.cap === "full" ? "100%" : drawn
    };
  }
  function applyMainAxis(layout, box) {
    delete layout.width;
    delete layout.minWidth;
    delete layout.maxWidth;
    delete layout.flexGrow;
    delete layout.flexShrink;
    delete layout.flexBasis;
    return Object.assign(layout, box);
  }

  // engines/fig-engine/vendor/html-generator/src/plugin/converter/layout.ts
  function isIntrinsicControl(node, width, height) {
    if (width > 0 && height > 0 && width <= INTRINSIC_CONTROL_MAX_PX && height <= INTRINSIC_CONTROL_MAX_PX) {
      return true;
    }
    return /(^|[-_\s])(icon|ic|avatar|آواتار|logo|لوگو|dot|badge|chip|tag|pill|btn|button|دکمه|checkbox|radio|switch|toggle|arrow|chevron)([-_\s]|$)/i.test(
      (node.name || "").trim()
    );
  }
  function isProportionalRowChild(node, width, height) {
    if (node.type === "TEXT") return false;
    return !isIntrinsicControl(node, width, height);
  }
  function isHorizontallyCenteredInParent(node, parent, relX, parentW) {
    if (!parent || parentW <= 0) return false;
    const nodeW = "width" in node && typeof node.width === "number" ? node.width : 0;
    if (nodeW <= 0) return false;
    if (node.type === "TEXT") {
      const textNode = node;
      if (textNode.textAlignHorizontal === "RIGHT") {
        return false;
      }
      const isRtl = isRtlText(textNode.characters);
      if (isRtl && textNode.textAlignHorizontal !== "CENTER") {
        return false;
      }
    }
    const centerDiff = Math.abs(relX + nodeW / 2 - parentW / 2);
    if (centerDiff > 1.5) {
      return false;
    }
    if ("children" in parent && Array.isArray(parent.children) && parent.children.length > 1) {
      const nodeY = typeof node.y === "number" ? node.y : 0;
      const nodeH = typeof node.height === "number" ? node.height : 0;
      const hasHorizontalNeighbors = parent.children.some((sibling) => {
        if (sibling === node || !sibling.visible) return false;
        const sibY = typeof sibling.y === "number" ? sibling.y : 0;
        const sibH = typeof sibling.height === "number" ? sibling.height : 0;
        const verticalOverlap = Math.max(0, Math.min(nodeY + nodeH, sibY + sibH) - Math.max(nodeY, sibY));
        if (verticalOverlap > Math.min(nodeH, sibH) * 0.4) {
          const sibX = typeof sibling.x === "number" ? sibling.x : 0;
          const sibW = typeof sibling.width === "number" ? sibling.width : 0;
          if (sibX + sibW <= relX + 2 || sibX >= relX + nodeW - 2) {
            return true;
          }
        }
        return false;
      });
      if (hasHorizontalNeighbors) {
        return false;
      }
    }
    const leftMargin = relX;
    const rightMargin = parentW - (relX + nodeW);
    return Math.abs(leftMargin - rightMargin) <= 3;
  }
  function isVerticallyCenteredInParent(node, parent, relY, parentH) {
    if (!parent || parentH <= 0) return false;
    const nodeH = "height" in node && typeof node.height === "number" ? node.height : 0;
    if (nodeH <= 0) return false;
    const centerDiff = Math.abs(relY + nodeH / 2 - parentH / 2);
    if (centerDiff > 1.5) {
      return false;
    }
    if (node.type === "TEXT") {
      const textNode = node;
      return textNode.textAlignVertical === "CENTER";
    }
    if ("children" in parent && Array.isArray(parent.children) && parent.children.filter((c) => c.visible !== false).length > 1) {
      return false;
    }
    const topMargin = relY;
    const bottomMargin = parentH - (relY + nodeH);
    return Math.abs(topMargin - bottomMargin) <= 3;
  }
  function edgeAnchorTolerancePx(parentSize) {
    return Math.max(EDGE_ANCHOR_TOLERANCE_PX, parentSize * EDGE_ANCHOR_MIN_RATIO);
  }
  function spansFreeformAxis(startGap, size, parentSize) {
    if (parentSize <= 0 || size <= 0) return false;
    if (size < parentSize * FREEFORM_SPAN_MIN_RATIO) return false;
    return Math.abs(startGap - (parentSize - startGap - size)) <= 2;
  }
  function isVerticallyCenteredFreeform(node, parent, relY, parentH) {
    if (!parent || parentH <= 0) return false;
    const nodeH = "height" in node && typeof node.height === "number" ? node.height : 0;
    if (nodeH <= 0) return false;
    if (Math.abs(relY + nodeH / 2 - parentH / 2) > 1.5) return false;
    const parentW = "width" in parent && typeof parent.width === "number" ? parent.width : 0;
    if ("children" in parent && Array.isArray(parent.children) && parent.children.length > 1) {
      const nodeX = typeof node.x === "number" ? node.x : 0;
      const nodeW = "width" in node && typeof node.width === "number" ? node.width : 0;
      const inStack = parent.children.some((sibling) => {
        if (sibling === node || !sibling.visible) return false;
        const sibX = typeof sibling.x === "number" ? sibling.x : 0;
        const sibW = "width" in sibling && typeof sibling.width === "number" ? sibling.width : 0;
        const sibY = typeof sibling.y === "number" ? sibling.y : 0;
        const sibH = "height" in sibling && typeof sibling.height === "number" ? sibling.height : 0;
        if (parentW > 0 && sibW >= parentW * FREEFORM_SPAN_MIN_RATIO) {
          const tolerance = edgeAnchorTolerancePx(parentH);
          if (sibY <= tolerance || Math.abs(parentH - (sibY + sibH)) <= tolerance) return false;
        }
        const horizontalOverlap = Math.max(0, Math.min(nodeX + nodeW, sibX + sibW) - Math.max(nodeX, sibX));
        if (horizontalOverlap <= Math.min(nodeW, sibW) * 0.4) return false;
        return sibY + sibH <= relY + 2 || sibY >= relY + nodeH - 2;
      });
      if (inStack) return false;
    }
    const topMargin = relY;
    const bottomMargin = parentH - (relY + nodeH);
    return Math.abs(topMargin - bottomMargin) <= 3;
  }
  function absoluteAnchor(constraint, startGap, size, parentSize, centered) {
    if (constraint === "STRETCH") return "stretch";
    if (constraint === "MAX") return "end";
    if (constraint === "CENTER") return centered ? "center" : "start";
    if (constraint === "SCALE") return "start";
    if (parentSize <= 0 || size <= 0) return "start";
    const endGap = parentSize - startGap - size;
    const tolerance = edgeAnchorTolerancePx(parentSize);
    if (Math.abs(startGap) <= tolerance && Math.abs(endGap) <= tolerance) return "stretch";
    if (centered) return "center";
    if (Math.abs(endGap) <= tolerance) return "end";
    const quadrantMax = Math.min(QUADRANT_ANCHOR_MAX_PX, parentSize * QUADRANT_ANCHOR_MAX_RATIO);
    if (endGap >= -tolerance && endGap <= quadrantMax && startGap > endGap * 2 && startGap + size / 2 > parentSize * 0.65) {
      return "end";
    }
    return "start";
  }
  function addTransform(existing, addition) {
    if (!existing) return addition;
    if (existing.includes("translate(-50%") || existing.includes(addition)) return existing;
    const other = addition === "translateX(-50%)" ? "translateY(-50%)" : "translateX(-50%)";
    if (existing === other) return "translate(-50%, -50%)";
    return `${existing} ${addition}`;
  }
  function absoluteInlineCap(layout) {
    if (!layout.width) return null;
    const lengthOffset = (value) => {
      if (!value) return null;
      const trimmed = value.trim();
      if (!/^-?\d+(?:\.\d+)?(?:px|rem)$/.test(trimmed)) return null;
      return trimmed;
    };
    const left = lengthOffset(layout.left);
    const right = lengthOffset(layout.right);
    if (!left && !right) {
      return layout.left !== void 0 || layout.right !== void 0 ? "100%" : null;
    }
    if (left && right) return `calc(100% - ${left} - ${right})`;
    return `calc(100% - ${left != null ? left : right})`;
  }
  function applyAbsoluteAnchor(layout, axis, anchor, startGap, size, parentSize, options) {
    const unit = (v) => formatUnit(v, options.useRem, options.baseFontSize);
    const endGap = parentSize - startGap - size;
    if (axis === "horizontal") {
      switch (anchor) {
        case "stretch":
          layout.left = unit(startGap);
          layout.right = unit(endGap);
          delete layout.width;
          break;
        case "center":
          layout.left = "50%";
          layout.transform = addTransform(layout.transform, "translateX(-50%)");
          break;
        case "end":
          layout.right = unit(endGap);
          delete layout.left;
          break;
        case "start":
          layout.left = unit(startGap);
          break;
      }
      return;
    }
    switch (anchor) {
      case "stretch":
        layout.top = unit(startGap);
        layout.bottom = unit(endGap);
        delete layout.height;
        break;
      case "center":
        layout.top = "50%";
        layout.transform = addTransform(layout.transform, "translateY(-50%)");
        break;
      case "end":
        layout.bottom = unit(endGap);
        delete layout.top;
        break;
      case "start":
        layout.top = unit(startGap);
        break;
    }
  }
  var freeformFlowCache = /* @__PURE__ */ new WeakMap();
  function inferFreeformFlow(node, options) {
    var _a;
    if (!responsiveEnabled(options) || !intrinsicReflowEnabled(options)) return null;
    if (!node || typeof node !== "object") return null;
    if ("layoutMode" in node && node.layoutMode && node.layoutMode !== "NONE") return null;
    if (node.type !== "FRAME" && node.type !== "COMPONENT" && node.type !== "INSTANCE" && node.type !== "SECTION") {
      return null;
    }
    if (freeformFlowCache.has(node)) {
      return (_a = freeformFlowCache.get(node)) != null ? _a : null;
    }
    const compute = () => {
      if (!("children" in node) || !Array.isArray(node.children)) return null;
      const visible = node.children.filter((c) => c.visible !== false);
      if (visible.length < 2) return null;
      const frameW = nodeWidthOf(node);
      const frameH = "height" in node && typeof node.height === "number" ? node.height : 0;
      if (frameW <= 0 || frameH <= 0) return null;
      for (const child of visible) {
        if ("rotation" in child && typeof child.rotation === "number" && Math.abs(child.rotation) > 0.1) {
          return null;
        }
        if ("constraints" in child && child.constraints) {
          const c = child.constraints;
          if (c.horizontal && c.horizontal !== "MIN") return null;
          if (c.vertical && c.vertical !== "MIN") return null;
        }
      }
      const boxes = visible.map((c) => {
        const x = "x" in c && typeof c.x === "number" ? c.x : 0;
        const y = "y" in c && typeof c.y === "number" ? c.y : 0;
        const w = nodeWidthOf(c);
        const h = "height" in c && typeof c.height === "number" ? c.height : 0;
        return { node: c, x, y, w, h };
      });
      if (boxes.some((b) => b.w <= 0 || b.h <= 0)) return null;
      if (boxes.some(
        (b) => b.x < -FREEFORM_FLOW_OVERLAP_TOLERANCE_PX || b.y < -FREEFORM_FLOW_OVERLAP_TOLERANCE_PX || b.x + b.w > frameW + FREEFORM_FLOW_OVERLAP_TOLERANCE_PX || b.y + b.h > frameH + FREEFORM_FLOW_OVERLAP_TOLERANCE_PX
      )) {
        return null;
      }
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          if (overlapX > FREEFORM_FLOW_OVERLAP_TOLERANCE_PX && overlapY > FREEFORM_FLOW_OVERLAP_TOLERANCE_PX) {
            return null;
          }
        }
      }
      const isOrderedH = boxes.every(
        (b, i) => i === 0 || b.x >= boxes[i - 1].x + boxes[i - 1].w - FREEFORM_FLOW_OVERLAP_TOLERANCE_PX
      );
      if (isOrderedH && frameW >= MULTI_COLUMN_MIN_WIDTH_PX) {
        const first = boxes[0];
        const last = boxes[boxes.length - 1];
        const gapsH = [];
        for (let i = 1; i < boxes.length; i++) {
          gapsH.push(Math.max(0, boxes[i].x - (boxes[i - 1].x + boxes[i - 1].w)));
        }
        const minGap = Math.min(...gapsH);
        const maxGap = Math.max(...gapsH);
        const uniformGap = maxGap - minGap <= FREEFORM_FLOW_ALIGN_TOLERANCE_PX;
        const minY = Math.min(...boxes.map((b) => b.y));
        const maxY = Math.max(...boxes.map((b) => b.y));
        const minBottom = Math.min(...boxes.map((b) => frameH - (b.y + b.h)));
        const topAligned = maxY - minY <= FREEFORM_FLOW_ALIGN_TOLERANCE_PX;
        const centerAligned = Math.max(...boxes.map((b) => b.y + b.h / 2)) - Math.min(...boxes.map((b) => b.y + b.h / 2)) <= FREEFORM_FLOW_ALIGN_TOLERANCE_PX;
        const padLeft = Math.max(0, Math.round(first.x));
        const padRight = Math.max(0, Math.round(frameW - (last.x + last.w)));
        const symmetricSides = Math.abs(padLeft - padRight) <= Math.max(8, frameW * 0.02);
        const totalSpan = last.x + last.w - first.x;
        const packsFrame = totalSpan >= (frameW - padLeft - padRight) * ROW_FILL_MIN_RATIO - ROW_FILL_SLACK_PX;
        const substantialCount = boxes.filter((b) => b.w >= SUBSTANTIAL_CHILD_MIN_PX).length;
        if (uniformGap && (topAligned || centerAligned) && symmetricSides && packsFrame && substantialCount >= 2 && totalSpan > PHONE_FIT_WIDTH_PX) {
          const gap = Math.round(gapsH.reduce((s, g) => s + g, 0) / gapsH.length);
          return {
            direction: "HORIZONTAL",
            paddingTop: Math.max(0, Math.round(minY)),
            paddingRight: padRight,
            paddingBottom: Math.max(0, Math.round(minBottom)),
            paddingLeft: padLeft,
            itemSpacing: gap,
            counterAxisAlignItems: topAligned ? "MIN" : "CENTER"
          };
        }
      }
      return null;
    };
    const result = compute();
    freeformFlowCache.set(node, result);
    return result;
  }
  function withInferredAutoLayout(node, flow) {
    return new Proxy(node, {
      get(target, prop, receiver) {
        if (prop === "layoutMode") return flow.direction;
        if (prop === "paddingTop") return flow.paddingTop;
        if (prop === "paddingRight") return flow.paddingRight;
        if (prop === "paddingBottom") return flow.paddingBottom;
        if (prop === "paddingLeft") return flow.paddingLeft;
        if (prop === "itemSpacing") return flow.itemSpacing;
        if (prop === "primaryAxisAlignItems") return "MIN";
        if (prop === "counterAxisAlignItems") return flow.counterAxisAlignItems;
        return Reflect.get(target, prop, receiver);
      },
      has(target, prop) {
        if (prop === "layoutMode" || prop === "paddingTop" || prop === "paddingRight" || prop === "paddingBottom" || prop === "paddingLeft" || prop === "itemSpacing" || prop === "primaryAxisAlignItems" || prop === "counterAxisAlignItems") {
          return true;
        }
        return Reflect.has(target, prop);
      }
    });
  }
  function flexChildren(node) {
    if (!("children" in node) || !Array.isArray(node.children)) return [];
    return node.children.filter((child) => {
      if (child.visible === false) return false;
      if ("layoutPositioning" in child && child.layoutPositioning === "ABSOLUTE") {
        return false;
      }
      const main = getMainComponent(child);
      return !(main && "layoutPositioning" in main && main.layoutPositioning === "ABSOLUTE");
    });
  }
  function nodeWidthOf(node) {
    const divider = readDividerGeometry(node);
    if (divider) return divider.width;
    return "width" in node && typeof node.width === "number" ? node.width : 0;
  }
  function nodeHeightOf(node) {
    const divider = readDividerGeometry(node);
    if (divider) return divider.height;
    return "height" in node && typeof node.height === "number" ? node.height : 0;
  }
  function isStackableRegion(child) {
    return nodeWidthOf(child) >= SUBSTANTIAL_CHILD_MIN_PX;
  }
  function columnWrapSizePx(child, row, options) {
    const width = nodeWidthOf(child);
    return isFlexibleColumn(child, row, options) ? columnFloorPx(width) : width;
  }
  function declaresFill(child) {
    return "layoutGrow" in child && child.layoutGrow === 1 || "layoutSizingHorizontal" in child && child.layoutSizingHorizontal === "FILL";
  }
  function isFlexibleColumn(child, row, options) {
    if (declaresFill(child)) return true;
    const height = "height" in child && typeof child.height === "number" ? child.height : 0;
    return isImplicitFillInRow(child, nodeWidthOf(child), height, row, options);
  }
  function sameNode(a, b) {
    if (a === b) return true;
    return Boolean(a.id) && a.id === b.id;
  }
  function rowBodyOf(row) {
    const regions = flexChildren(row).filter(isStackableRegion);
    const first = regions[0];
    if (regions.length < 2 || !first) return null;
    let widest = first;
    for (const region of regions) {
      if (nodeWidthOf(region) > nodeWidthOf(widest)) widest = region;
    }
    return widest;
  }
  function isImplicitFillInRow(child, width, height, row, options) {
    if (!responsiveEnabled(options)) return false;
    if (isMultiColumnRow(row)) {
      if (!isRegionsRow(row)) return false;
      if (!intrinsicReflowEnabled(options)) return false;
      if (!isPackedRow(row)) return false;
      const body = rowBodyOf(row);
      if (!body || !sameNode(body, child)) return false;
      return isProportionalRowChild(child, width, height);
    }
    if (!isPackedRow(row)) return false;
    return isImplicitFillChild(child, width, height, row);
  }
  function designGapPx(node) {
    const spacing = "itemSpacing" in node && typeof node.itemSpacing === "number" ? node.itemSpacing : 0;
    return Math.max(0, spacing);
  }
  function spansContainer(size, container) {
    if (!(size > 0) || !(container > 0)) return false;
    const slack = Math.max(COUNTER_FILL_SLACK_PX, container * (1 - COUNTER_FILL_MIN_RATIO));
    return container - size <= slack;
  }
  function rowInnerMainPx(row) {
    return innerWidthPx(row);
  }
  function innerWidthPx(node) {
    const width = nodeWidthOf(node);
    const left = "paddingLeft" in node && typeof node.paddingLeft === "number" ? node.paddingLeft : 0;
    const right = "paddingRight" in node && typeof node.paddingRight === "number" ? node.paddingRight : 0;
    return Math.max(0, width - left - right);
  }
  function isPackedRow(row) {
    const inner = rowInnerMainPx(row);
    if (inner <= 0) return false;
    const children = flexChildren(row);
    if (children.length === 0) return false;
    if (row.primaryAxisAlignItems === "SPACE_BETWEEN" && children.length > 1) return true;
    const drawn = children.reduce((sum, child) => sum + nodeWidthOf(child), 0);
    if (children.length === 1) return spansContainer(drawn, inner);
    const gaps = designGapPx(row) * (children.length - 1);
    const slack = Math.max(ROW_FILL_SLACK_PX, inner * (1 - ROW_FILL_MIN_RATIO));
    return inner - (drawn + gaps) <= slack;
  }
  function isImplicitFillChild(node, width, height, row) {
    const inner = rowInnerMainPx(row);
    if (inner <= 0) return false;
    if (width < inner * DOMINANT_CHILD_MIN_RATIO) return false;
    if (isIntrinsicControl(node, width, height)) return false;
    if (node.type === "TEXT") {
      return node.textAutoResize !== "WIDTH_AND_HEIGHT";
    }
    return isProportionalRowChild(node, width, height);
  }
  function isFluidGap(designGap, referencePx, options) {
    return responsiveEnabled(options) && designGap >= FLUID_GAP_MIN_PX && fluidLength(designGap, referencePx, options, FLUID_MIN_RATIO) !== null;
  }
  function rowWrapThresholdPx(node, options) {
    const children = flexChildren(node);
    if (children.length === 0) return 0;
    const columns = children.reduce((sum, child) => sum + columnWrapSizePx(child, node, options), 0);
    const gaps = children.length - 1;
    const designGap = designGapPx(node);
    const inner = rowInnerMainPx(node);
    const padding = Math.max(0, nodeWidthOf(node) - inner);
    if (gaps === 0 || designGap <= 0) return Math.round(columns + padding);
    const widestFit = columns + gaps * designGap;
    if (!isFluidGap(designGap, inner, options) || inner <= 0) {
      return Math.round(widestFit + padding);
    }
    if (widestFit >= inner) return Math.round(widestFit + padding);
    const slope = gaps * designGap / inner;
    const linear = columns / (1 - slope);
    const floorWidth = fluidFloor(designGap, FLUID_MIN_RATIO) * inner / designGap;
    if (linear >= floorWidth && linear <= inner) return Math.round(linear + padding);
    return Math.round(columns + gaps * fluidFloor(designGap, FLUID_MIN_RATIO) + padding);
  }
  function isRegionsRow(node) {
    const regions = flexChildren(node).filter(isStackableRegion);
    if (regions.length < 2) return false;
    const widths = regions.map(nodeWidthOf);
    const widest = Math.max(...widths);
    const narrowest = Math.min(...widths);
    if (widest <= 0) return false;
    return narrowest / widest < REGION_WIDTH_RATIO_MAX;
  }
  function isStackingRegionRow(node, options) {
    if (!intrinsicReflowEnabled(options)) return false;
    if (!("layoutMode" in node) || node.layoutMode !== "HORIZONTAL") return false;
    if ("layoutWrap" in node && node.layoutWrap === "WRAP") return false;
    if (!isMultiColumnRow(node) || !isRegionsRow(node)) return false;
    return !isHorizontallyHugging(node);
  }
  function isHorizontallyHugging(node) {
    if ("layoutSizingHorizontal" in node && node.layoutSizingHorizontal === "HUG") {
      return true;
    }
    if (!("layoutMode" in node)) return false;
    if (node.layoutMode === "HORIZONTAL") {
      return "primaryAxisSizingMode" in node && node.primaryAxisSizingMode === "AUTO";
    }
    if (node.layoutMode === "VERTICAL") {
      return "counterAxisSizingMode" in node && node.counterAxisSizingMode === "AUTO";
    }
    return false;
  }
  function isControlCluster(node) {
    if (!("layoutMode" in node) || node.layoutMode !== "HORIZONTAL") return false;
    const children = flexChildren(node);
    if (children.length === 0) return false;
    return children.every((child) => {
      const h = "height" in child && typeof child.height === "number" ? child.height : 0;
      return isIntrinsicControl(child, nodeWidthOf(child), h);
    });
  }
  function isToolbarRow(node) {
    if (!("layoutMode" in node) || node.layoutMode !== "HORIZONTAL") return false;
    if ("layoutWrap" in node && node.layoutWrap === "WRAP") return false;
    const height = "height" in node && typeof node.height === "number" ? node.height : 0;
    if (height <= 0 || height > HEADER_MAX_HEIGHT_PX) return false;
    const children = flexChildren(node);
    if (children.length < 2 || children.length > 6) return false;
    const hasControl = children.some((child) => {
      const h = "height" in child && typeof child.height === "number" ? child.height : 0;
      return isIntrinsicControl(child, nodeWidthOf(child), h);
    });
    const hasWideChild = children.some((child) => nodeWidthOf(child) >= TOOLBAR_WIDE_CHILD_MIN_PX);
    return hasControl && hasWideChild;
  }
  function isMultiColumnRow(node) {
    if (!("layoutMode" in node) || node.layoutMode !== "HORIZONTAL") return false;
    if ("layoutWrap" in node && node.layoutWrap === "WRAP") return false;
    if (!("children" in node) || !Array.isArray(node.children)) return false;
    const visibleChildren = flexChildren(node);
    if (visibleChildren.length < 2) return false;
    const nodeW = "width" in node && typeof node.width === "number" ? node.width : 0;
    const isButtonOrTag = /(button|btn|tag|badge|chip|pill|دکمه|تگ|بج)/i.test((node.name || "").trim());
    if (isButtonOrTag) return false;
    if (isToolbarRow(node)) return false;
    const isAllSmallControls = visibleChildren.every((c) => {
      return nodeWidthOf(c) <= INTRINSIC_CONTROL_MAX_PX;
    });
    if (isAllSmallControls) return false;
    if (visibleChildren.length === 2) {
      const first = visibleChildren[0];
      const second = visibleChildren[1];
      if (first && second) {
        const w1 = nodeWidthOf(first);
        const w2 = nodeWidthOf(second);
        if (w1 <= INTRINSIC_CONTROL_MAX_PX && w2 < MIN_COLUMN_WIDTH_PX || w2 <= INTRINSIC_CONTROL_MAX_PX && w1 < MIN_COLUMN_WIDTH_PX) {
          return false;
        }
      }
    }
    const rawGap = typeof node.itemSpacing === "number" ? Math.max(0, node.itemSpacing) : 0;
    const totalGap = rawGap * (visibleChildren.length - 1);
    const totalChildrenWidth = visibleChildren.reduce((sum, c) => sum + nodeWidthOf(c), 0);
    if (totalChildrenWidth + totalGap <= PHONE_FIT_WIDTH_PX) {
      return false;
    }
    const substantialChildren = visibleChildren.filter((c) => {
      const w = nodeWidthOf(c);
      const isFill = "layoutGrow" in c && c.layoutGrow === 1 || "layoutSizingHorizontal" in c && c.layoutSizingHorizontal === "FILL";
      return w >= SUBSTANTIAL_CHILD_MIN_PX || isFill;
    });
    return (nodeW >= MULTI_COLUMN_MIN_WIDTH_PX || totalChildrenWidth >= MULTI_COLUMN_MIN_CHILDREN_PX) && substantialChildren.length >= 2;
  }
  function gridTrackSizes(node, axis) {
    const key = axis === "column" ? "gridColumnSizes" : "gridRowSizes";
    const value = node[key];
    return Array.isArray(value) ? value : null;
  }
  function gridTrackCount(node, axis) {
    const key = axis === "column" ? "gridColumnCount" : "gridRowCount";
    const value = node[key];
    return typeof value === "number" && value > 0 ? Math.round(value) : 0;
  }
  function gridGapPx(node, axis) {
    const key = axis === "column" ? "gridColumnGap" : "gridRowGap";
    const value = node[key];
    return typeof value === "number" && value > 0 ? value : 0;
  }
  function gridIsUniform(node) {
    const positioning = node.gridItemsPositioning;
    if (typeof positioning === "string" && positioning !== "ROW_AUTO_FLOW") return false;
    return flexChildren(node).every((child) => {
      var _a, _b;
      const cell = child;
      return ((_a = cell.gridColumnSpan) != null ? _a : 1) <= 1 && ((_b = cell.gridRowSpan) != null ? _b : 1) <= 1;
    });
  }
  function gridReflows(node, options) {
    var _a;
    return ((_a = gridTemplate(node, "column", options)) != null ? _a : "").includes("auto-fit");
  }
  function gridGap(node, axis, options) {
    const gap = gridGapPx(node, axis);
    if (gap <= 0) return null;
    if (axis === "column" && options.responsive) {
      return fluidOrFixed(gap, innerWidthPx(node), options, FLUID_GAP_MIN_PX);
    }
    return formatUnit(gap, options.useRem, options.baseFontSize);
  }
  function gridTemplate(node, axis, options) {
    const count = gridTrackCount(node, axis);
    const sizes = gridTrackSizes(node, axis);
    if (!sizes || sizes.length === 0) {
      return count > 0 ? `repeat(${count}, minmax(0, 1fr))` : null;
    }
    const allFlexible = sizes.every((track) => track.type !== "FIXED");
    if (axis === "column" && allFlexible && count >= 2 && gridIsUniform(node) && responsiveEnabled(options) && intrinsicReflowEnabled(options)) {
      const inner = rowInnerMainPx(node);
      const gap = gridGapPx(node, "column");
      const designed = (inner - gap * (count - 1)) / count;
      if (inner > 0 && designed >= 1) {
        const floor = formatUnit(Math.round(designed * 100) / 100, options.useRem, options.baseFontSize);
        return `repeat(auto-fit, minmax(min(${floor}, 100%), 1fr))`;
      }
    }
    return sizes.map(
      (track) => {
        var _a;
        return track.type === "FIXED" ? formatUnit((_a = track.value) != null ? _a : 0, options.useRem, options.baseFontSize) : "minmax(0, 1fr)";
      }
    ).join(" ");
  }
  function extractLayout(rawNode, rawParent, options, tokenRegistry) {
    var _a;
    const inferredNodeFlow = inferFreeformFlow(rawNode, options);
    const node = inferredNodeFlow ? withInferredAutoLayout(rawNode, inferredNodeFlow) : rawNode;
    const inferredParentFlow = rawParent ? inferFreeformFlow(rawParent, options) : null;
    const parent = rawParent && inferredParentFlow ? withInferredAutoLayout(rawParent, inferredParentFlow) : rawParent;
    const layout = {};
    const resolver = new TokenResolver(tokenRegistry, {
      baseFontSize: options.baseFontSize,
      node
    });
    const gapWithToken = (value, field, px) => {
      var _a2;
      if (!value) return null;
      if (value !== formatUnit(px, options.useRem, options.baseFontSize)) return value;
      return (_a2 = resolver.lengthFor(TokenResolver.boundId(node, field), px)) != null ? _a2 : value;
    };
    const isAutoLayoutParent = parent && "layoutMode" in parent && parent.layoutMode !== "NONE";
    const hasChildren = "children" in node && node.children.length > 0;
    const boxDims = getNodeBoxDimensions(node);
    const dividerGeometry = readDividerGeometry(node);
    const inFlowDivider = dividerGeometry && isInLayoutFlow(node, parent) ? dividerGeometry : null;
    const boxWidth = inFlowDivider ? inFlowDivider.width : boxDims.width;
    const boxHeight = inFlowDivider ? inFlowDivider.height : boxDims.height;
    const childOutsideSw = getChildrenMaxOutsideStroke(node);
    const isAutoLayout = "layoutMode" in node && node.layoutMode !== "NONE";
    const parentStrokesIncluded = Boolean(
      "strokesIncludedInLayout" in node && node.strokesIncludedInLayout
    );
    const extraChildSw = isAutoLayout && !parentStrokesIncluded ? childOutsideSw : 0;
    const nodeWidth = boxWidth + (boxDims.outsideStrokeWeight === 0 ? extraChildSw * 2 : 0);
    const nodeHeight = boxHeight + (boxDims.outsideStrokeWeight === 0 ? extraChildSw * 2 : 0);
    const containingWidthPx = parent ? isAutoLayoutParent ? innerWidthPx(parent) : nodeWidthOf(parent) : nodeWidth;
    if ("layoutMode" in node && node.layoutMode !== "NONE") {
      const isGridFrame = node.layoutMode === "GRID";
      layout.position = "relative";
      if (isGridFrame) {
        layout.display = "grid";
        layout.direction = "ltr";
        const columns = gridTemplate(node, "column", options);
        if (columns) layout.gridTemplateColumns = columns;
        if (!columns || !columns.includes("auto-fit")) {
          const rows = gridTemplate(node, "row", options);
          if (rows) layout.gridTemplateRows = rows;
        }
        const columnGap = gapWithToken(
          gridGap(node, "column", options),
          "gridColumnGap",
          gridGapPx(node, "column")
        );
        const rowGap = gapWithToken(
          gridGap(node, "row", options),
          "gridRowGap",
          gridGapPx(node, "row")
        );
        if (columnGap) layout.columnGap = columnGap;
        if (rowGap) layout.rowGap = rowGap;
      } else {
        layout.display = "flex";
        layout.flexDirection = node.layoutMode === "HORIZONTAL" ? "row" : "column";
        layout.direction = "ltr";
        const shouldReflow = intrinsicReflowEnabled(options) && isMultiColumnRow(node);
        if ("layoutWrap" in node && node.layoutWrap === "WRAP" || shouldReflow || intrinsicReflowEnabled(options) && isToolbarRow(node)) {
          layout.flexWrap = "wrap";
          if ("counterAxisSpacing" in node && typeof node.counterAxisSpacing === "number" && node.counterAxisSpacing > 0) {
            const crossGap = (_a = resolver.lengthFor(
              TokenResolver.boundId(node, "counterAxisSpacing"),
              node.counterAxisSpacing
            )) != null ? _a : formatUnit(node.counterAxisSpacing, options.useRem, options.baseFontSize);
            if (node.layoutMode === "HORIZONTAL") {
              layout.rowGap = crossGap;
            } else {
              layout.columnGap = crossGap;
            }
          }
        }
        const rawItemSpacing = typeof node.itemSpacing === "number" ? node.itemSpacing : 0;
        const boundGap = rawItemSpacing > 0 && extraChildSw === 0 ? resolver.lengthFor(TokenResolver.boundId(node, "itemSpacing"), rawItemSpacing) : null;
        const isSpaceBetween = node.primaryAxisAlignItems === "SPACE_BETWEEN" && layout.flexWrap !== "wrap";
        if (!isSpaceBetween) {
          if (boundGap) {
            layout.gap = boundGap;
          } else if (typeof node.itemSpacing === "number" || extraChildSw > 0) {
            const effectiveItemSpacing = rawItemSpacing - 2 * extraChildSw;
            if (effectiveItemSpacing > 0) {
              const gapVal = responsiveEnabled(options) ? fluidOrFixed(effectiveItemSpacing, innerWidthPx(node), options, FLUID_GAP_MIN_PX) : formatUnit(effectiveItemSpacing, options.useRem, options.baseFontSize);
              if (layout.flexWrap === "wrap" && layout.rowGap) {
                layout.columnGap = gapVal;
              } else {
                layout.gap = gapVal;
              }
            } else if (effectiveItemSpacing < 0) {
              layout.itemSpacing = effectiveItemSpacing;
            }
          }
        }
        if ("itemReverseZIndex" in node && Boolean(node.itemReverseZIndex)) {
          layout.itemReverseZIndex = true;
        }
        switch (node.primaryAxisAlignItems) {
          case "MIN":
            layout.justifyContent = "flex-start";
            break;
          case "CENTER":
            layout.justifyContent = "center";
            break;
          case "MAX":
            layout.justifyContent = "flex-end";
            break;
          case "SPACE_BETWEEN":
            layout.justifyContent = "space-between";
            break;
        }
        switch (node.counterAxisAlignItems) {
          case "MIN":
            layout.alignItems = "flex-start";
            break;
          case "CENTER":
            layout.alignItems = "center";
            break;
          case "MAX":
            layout.alignItems = "flex-end";
            break;
          case "BASELINE":
            layout.alignItems = "baseline";
            break;
        }
      }
      let pt = node.paddingTop || 0;
      let pr = node.paddingRight || 0;
      let pb = node.paddingBottom || 0;
      let pl = node.paddingLeft || 0;
      const layoutBorder = layoutBorderWeights(node);
      if (layoutBorder) {
        pt = Math.max(0, pt - layoutBorder.top);
        pr = Math.max(0, pr - layoutBorder.right);
        pb = Math.max(0, pb - layoutBorder.bottom);
        pl = Math.max(0, pl - layoutBorder.left);
      }
      const isHoriz = node.layoutMode === "HORIZONTAL";
      const isHugH = "layoutSizingHorizontal" in node && node.layoutSizingHorizontal === "HUG" || "layoutMode" in node && node.layoutMode === "HORIZONTAL" && node.primaryAxisSizingMode === "AUTO" || "layoutMode" in node && node.layoutMode === "VERTICAL" && node.counterAxisSizingMode === "AUTO";
      const isHugV = "layoutSizingVertical" in node && node.layoutSizingVertical === "HUG" || "layoutMode" in node && node.layoutMode === "VERTICAL" && node.primaryAxisSizingMode === "AUTO" || "layoutMode" in node && node.layoutMode === "HORIZONTAL" && node.counterAxisSizingMode === "AUTO";
      const isFillH = "layoutSizingHorizontal" in node && node.layoutSizingHorizontal === "FILL";
      const isFillV = "layoutSizingVertical" in node && node.layoutSizingVertical === "FILL";
      const isFixedH = !isHugH && !isFillH;
      const isFixedV = !isHugV && !isFillV;
      const isCenteredH = isHoriz ? node.primaryAxisAlignItems === "CENTER" : node.counterAxisAlignItems === "CENTER";
      const isCenteredV = isHoriz ? node.counterAxisAlignItems === "CENTER" : node.primaryAxisAlignItems === "CENTER";
      let minChildW = 0;
      let minChildH = 0;
      if (hasChildren && "children" in node && Array.isArray(node.children)) {
        let totalW = 0;
        let maxW = 0;
        let totalH = 0;
        let maxH = 0;
        const nonAbsoluteChildren = node.children.filter(
          (c) => c.visible !== false && !("layoutPositioning" in c && c.layoutPositioning === "ABSOLUTE")
        );
        const rawGap = typeof node.itemSpacing === "number" && node.itemSpacing > 0 && node.primaryAxisAlignItems !== "SPACE_BETWEEN" ? node.itemSpacing : 0;
        const totalGap = nonAbsoluteChildren.length > 1 ? rawGap * (nonAbsoluteChildren.length - 1) : 0;
        for (const child of nonAbsoluteChildren) {
          const cw = nodeWidthOf(child);
          const ch = nodeHeightOf(child);
          totalW += cw;
          maxW = Math.max(maxW, cw);
          totalH += ch;
          maxH = Math.max(maxH, ch);
        }
        minChildW = isHoriz ? totalW + totalGap : maxW;
        minChildH = isHoriz ? maxH : totalH + totalGap;
      }
      if (isFixedH && nodeWidth > 0 && minChildW > 0) {
        const isFakePl = pl > 0 && pr === 0 && Math.abs(pl - (nodeWidth - minChildW)) <= 4;
        if (isFakePl) {
          if (isHoriz) {
            layout.justifyContent = "flex-end";
          } else {
            layout.alignItems = "flex-end";
          }
          pl = 0;
        }
        const isFakePr = pr > 0 && pl === 0 && Math.abs(pr - (nodeWidth - minChildW)) <= 4;
        if (isFakePr) {
          if (isHoriz) {
            layout.justifyContent = "flex-start";
          } else {
            layout.alignItems = "flex-start";
          }
          pr = 0;
        }
      }
      if (isFixedV && nodeHeight > 0 && minChildH > 0) {
        const isFakePt = pt > 0 && pb === 0 && Math.abs(pt - (nodeHeight - minChildH)) <= 4;
        if (isFakePt) {
          if (isHoriz) {
            layout.alignItems = "flex-end";
          } else {
            layout.justifyContent = "flex-end";
          }
          pt = 0;
        }
      }
      if (isFixedH && nodeWidth > 0) {
        if (pl + pr >= nodeWidth || minChildW > 0 && pl + pr + minChildW > nodeWidth) {
          if (isCenteredH) {
            pl = 0;
            pr = 0;
          } else {
            const maxAvailW = Math.max(0, nodeWidth - minChildW);
            pl = Math.min(pl, maxAvailW);
            pr = Math.max(0, maxAvailW - pl);
          }
        }
      }
      if (isFixedV && nodeHeight > 0) {
        if (pt + pb >= nodeHeight || minChildH > 0 && pt + pb + minChildH > nodeHeight) {
          if (isCenteredV) {
            pt = 0;
            pb = 0;
          } else {
            const maxAvailH = Math.max(0, nodeHeight - minChildH);
            pt = Math.min(pt, maxAvailH);
            pb = Math.max(0, maxAvailH - pt);
          }
        }
      }
      if (pt > 0 || pr > 0 || pb > 0 || pl > 0) {
        const padValue = (side, px) => {
          var _a2, _b;
          const binding = TokenResolver.boundId(node, side);
          if (!responsiveEnabled(options)) {
            return (_a2 = resolver.lengthFor(binding, px)) != null ? _a2 : px;
          }
          const fluid = fluidOrFixed(px, containingWidthPx, options, FLUID_PADDING_MIN_PX);
          if (fluid !== formatUnit(px, options.useRem, options.baseFontSize)) return fluid;
          return (_b = resolver.lengthFor(binding, px)) != null ? _b : fluid;
        };
        layout.padding = {
          top: padValue("paddingTop", pt),
          right: padValue("paddingRight", pr),
          bottom: padValue("paddingBottom", pb),
          left: padValue("paddingLeft", pl)
        };
      }
      if (isStackingRegionRow(node, options)) {
        layout.containerType = "inline-size";
      }
    }
    const mainComp = getMainComponent(node);
    const isClipping = "clipsContent" in node && typeof node.clipsContent === "boolean" ? Boolean(node.clipsContent) : mainComp && "clipsContent" in mainComp && typeof mainComp.clipsContent === "boolean" ? Boolean(mainComp.clipsContent) : false;
    if (!parent) {
      layout.position = "relative";
      layout.boxSizing = "border-box";
      if (responsiveEnabled(options)) {
        layout.width = "100%";
        layout.maxWidth = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
        layout.marginInline = "auto";
        layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
        layout.containerType = "inline-size";
      } else {
        layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
        layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
      }
      if (isClipping) {
        layout.overflow = "hidden";
      }
    } else if (isAutoLayoutParent) {
      const mainComp2 = getMainComponent(node);
      const isExplicitAbsolute = "layoutPositioning" in node && node.layoutPositioning === "ABSOLUTE" || mainComp2 && "layoutPositioning" in mainComp2 && mainComp2.layoutPositioning === "ABSOLUTE";
      if (isExplicitAbsolute) {
        layout.position = "absolute";
        const rawX = typeof node.x === "number" ? node.x : 0;
        const rawY = typeof node.y === "number" ? node.y : 0;
        const parentW = parent && "width" in parent && typeof parent.width === "number" ? parent.width : 0;
        const parentH = parent && "height" in parent && typeof parent.height === "number" ? parent.height : 0;
        const coversParent = parentW > 0 && parentH > 0 && Math.abs(rawX) <= 2 && Math.abs(rawY) <= 2 && Math.abs(nodeWidth - parentW) <= 4 && Math.abs(nodeHeight - parentH) <= 4;
        if (coversParent) {
          layout.left = "0px";
          layout.top = "0px";
          layout.width = "100%";
          layout.height = "100%";
          layout.objectFit = "cover";
        } else {
          layout.left = formatUnit(rawX, options.useRem, options.baseFontSize);
          layout.top = formatUnit(rawY, options.useRem, options.baseFontSize);
          layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          if (responsiveEnabled(options) && node.type !== "TEXT") {
            const constraints = "constraints" in node && node.constraints ? node.constraints : {};
            const spansH = !isHorizontallyHugging(node) && spansFreeformAxis(rawX, nodeWidth, parentW);
            const spansV = spansFreeformAxis(rawY, nodeHeight, parentH);
            if (spansH) {
              layout.left = formatUnit(rawX, options.useRem, options.baseFontSize);
              layout.right = formatUnit(parentW - rawX - nodeWidth, options.useRem, options.baseFontSize);
              delete layout.width;
            } else {
              const anchorH = absoluteAnchor(
                constraints.horizontal,
                rawX,
                nodeWidth,
                parentW,
                isHorizontallyCenteredInParent(node, parent, rawX, parentW)
              );
              applyAbsoluteAnchor(layout, "horizontal", anchorH, rawX, nodeWidth, parentW, options);
            }
            if (spansV) {
              layout.top = formatUnit(rawY, options.useRem, options.baseFontSize);
              layout.bottom = formatUnit(parentH - rawY - nodeHeight, options.useRem, options.baseFontSize);
              delete layout.height;
            } else {
              const anchorV = absoluteAnchor(
                constraints.vertical,
                rawY,
                nodeHeight,
                parentH,
                isVerticallyCenteredFreeform(node, parent, rawY, parentH)
              );
              applyAbsoluteAnchor(layout, "vertical", anchorV, rawY, nodeHeight, parentH, options);
            }
          }
        }
        const parentChildren = parent && "children" in parent && Array.isArray(parent.children) ? parent.children : [];
        const childIdx = parentChildren.findIndex((c) => c === node || c.id && c.id === node.id);
        const isChildAbsolute = (c) => c === node || c.id && c.id === node.id ? true : c.layoutPositioning === "ABSOLUTE";
        const firstFlexIdx = parentChildren.findIndex((c) => c.visible !== false && !isChildAbsolute(c));
        const isBackgroundLayer = childIdx !== -1 && firstFlexIdx !== -1 && childIdx < firstFlexIdx;
        if (!layout.zIndex) {
          layout.zIndex = isBackgroundLayer ? 0 : 1;
        }
      } else if (parent && "layoutMode" in parent && parent.layoutMode === "GRID") {
        const gridChild = node;
        const placement = (anchor, span) => {
          if (typeof anchor !== "number") return void 0;
          const cells = Math.max(1, span != null ? span : 1);
          return cells > 1 ? `${anchor + 1} / span ${cells}` : `${anchor + 1}`;
        };
        if (!gridReflows(parent, options)) {
          const column = placement(gridChild.gridColumnAnchorIndex, gridChild.gridColumnSpan);
          const row = placement(gridChild.gridRowAnchorIndex, gridChild.gridRowSpan);
          if (column) layout.gridColumn = column;
          if (row) layout.gridRow = row;
        }
        const fillsH = "layoutSizingHorizontal" in node && node.layoutSizingHorizontal === "FILL" || "layoutGrow" in node && node.layoutGrow === 1;
        const fillsV = "layoutSizingVertical" in node && node.layoutSizingVertical === "FILL";
        if (node.type === "TEXT") {
          const textNode = node;
          if (fillsH || textNode.textAutoResize !== "WIDTH_AND_HEIGHT") {
            layout.width = "100%";
          } else {
            layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
            layout.maxWidth = "100%";
          }
        } else {
          layout.width = fillsH ? "100%" : formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          layout.minWidth = "0";
          if (fillsV) {
            layout.height = "100%";
          } else if (options.responsive && hasChildren && nodeHeight > HEADER_MAX_HEIGHT_PX) {
            layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          } else {
            layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          }
        }
      } else {
        const parentMode = parent.layoutMode;
        const isVerticalParent = parentMode === "VERTICAL";
        layout.flexShrink = options.responsive ? 1 : 0;
        const parentIsColumnRow = !isVerticalParent && parent !== null && isMultiColumnRow(parent);
        const parentReflows = intrinsicReflowEnabled(options) && parentIsColumnRow;
        const parentStacksRegions = !isVerticalParent && parent !== null && isStackingRegionRow(parent, options);
        const parentIsPackedGrid = parentReflows && parent !== null && !isRegionsRow(parent) && isPackedRow(parent);
        const isImplicitFill = !isVerticalParent && parent !== null && isImplicitFillInRow(node, nodeWidth, nodeHeight, parent, options);
        const isAutoH = "layoutSizingHorizontal" in node && node.layoutSizingHorizontal === "HUG" || "layoutMode" in node && node.layoutMode === "HORIZONTAL" && node.primaryAxisSizingMode === "AUTO" || "layoutMode" in node && node.layoutMode === "VERTICAL" && node.counterAxisSizingMode === "AUTO";
        const isAutoV = "layoutSizingVertical" in node && node.layoutSizingVertical === "HUG" || "layoutMode" in node && node.layoutMode === "VERTICAL" && node.primaryAxisSizingMode === "AUTO" || "layoutMode" in node && node.layoutMode === "HORIZONTAL" && node.counterAxisSizingMode === "AUTO";
        const sizingH = isAutoH ? "HUG" : "layoutSizingHorizontal" in node ? node.layoutSizingHorizontal : void 0;
        const sizingV = isAutoV ? "HUG" : "layoutSizingVertical" in node ? node.layoutSizingVertical : void 0;
        const align = "layoutAlign" in node ? node.layoutAlign : void 0;
        const grow = "layoutGrow" in node ? node.layoutGrow === 1 : false;
        const autoW = node.type === "TEXT" && node.textAutoResize === "WIDTH_AND_HEIGHT";
        const autoH = node.type === "TEXT" && node.textAutoResize !== "NONE";
        const primarySizing = isVerticalParent ? sizingV : sizingH;
        const counterSizing = isVerticalParent ? sizingH : sizingV;
        const parentIsToolbar = !isVerticalParent && parent !== null && isToolbarRow(parent);
        const parentSpreads = parent !== null && "primaryAxisAlignItems" in parent && parent.primaryAxisAlignItems === "SPACE_BETWEEN";
        if (isVerticalParent) {
          if (grow || primarySizing === "FILL") {
            layout.flexGrow = 1;
            layout.flexShrink = 1;
            layout.flexBasis = "0%";
            layout.minHeight = "0";
          } else if (primarySizing === "HUG" || autoH) {
            if (node.type !== "TEXT") {
              layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
              layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
            }
          } else {
            const isContainer = "layoutMode" in node && node.layoutMode !== "NONE" && hasChildren;
            if (responsiveEnabled(options) && isContainer && nodeHeight > HEADER_MAX_HEIGHT_PX) {
              layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
            } else {
              layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
            }
          }
        } else if (grow || primarySizing === "FILL") {
          applyMainAxis(
            layout,
            mainAxisBox(
              {
                role: "fill",
                drawnPx: nodeWidth,
                grow: true,
                floorPx: parentReflows ? columnFloorPx(nodeWidth) : 0
              },
              options
            )
          );
        } else if (primarySizing === "HUG" || autoW) {
          if (node.type !== "TEXT") {
            const hugW = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
            layout.width = hugW;
            if (responsiveEnabled(options)) {
              layout.maxWidth = hugW;
              layout.minWidth = "0";
            } else {
              layout.minWidth = hugW;
            }
          } else {
            const textW = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
            layout.width = textW;
            if (responsiveEnabled(options)) {
              layout.maxWidth = "100%";
              layout.minWidth = "0";
            } else {
              layout.minWidth = textW;
            }
          }
        } else if (isImplicitFill) {
          const toolbarSlot = parentIsToolbar && parentSpreads;
          applyMainAxis(
            layout,
            mainAxisBox(
              {
                role: "fill",
                drawnPx: nodeWidth,
                grow: true,
                floorPx: parentIsToolbar ? TOOLBAR_SLOT_MIN_PX : parentReflows ? columnFloorPx(nodeWidth) : 0,
                cap: toolbarSlot ? "drawn" : "full"
              },
              options
            )
          );
        } else if (node.type === "TEXT") {
          const textNode = node;
          const textChars = textNode.characters || "";
          const isAutoWidth = textNode.textAutoResize === "WIDTH_AND_HEIGHT";
          const isExplicitWrap = textNode.textAutoResize === "HEIGHT" || textNode.textAutoResize === "NONE";
          let effectiveLineHeight = 0;
          const fs = typeof textNode.fontSize === "number" ? textNode.fontSize : 16;
          if (textNode.lineHeight && typeof textNode.lineHeight === "object") {
            if (textNode.lineHeight.unit === "PIXELS") {
              effectiveLineHeight = textNode.lineHeight.value;
            } else if (textNode.lineHeight.unit === "PERCENT") {
              effectiveLineHeight = fs * (textNode.lineHeight.value / 100);
            }
          }
          if (effectiveLineHeight <= 0) {
            effectiveLineHeight = fs * 1.25;
          }
          const isMultiLine = typeof textNode.height === "number" && textNode.height > effectiveLineHeight * 1.35;
          if (isExplicitWrap || isMultiLine || textChars.includes("\n")) {
            layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
            layout.maxWidth = "100%";
          } else if (isAutoWidth || textChars.length <= 40 && nodeWidth <= 240) {
            const textW = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
            if (responsiveEnabled(options)) {
              layout.width = textW;
              layout.maxWidth = "100%";
              layout.minWidth = "0";
            } else {
              layout.minWidth = textW;
            }
          } else {
            layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
            if (responsiveEnabled(options) && !layout.maxWidth) {
              layout.maxWidth = "100%";
            }
          }
        } else if (responsiveEnabled(options) && isProportionalRowChild(node, nodeWidth, nodeHeight)) {
          applyMainAxis(
            layout,
            mainAxisBox(
              {
                role: "share",
                drawnPx: nodeWidth,
                grow: parentReflows,
                floorPx: parentReflows ? columnFloorPx(nodeWidth) : 0,
                floorToContent: isControlCluster(node),
                cap: parentIsPackedGrid ? "full" : "drawn"
              },
              options
            )
          );
        } else {
          applyMainAxis(
            layout,
            mainAxisBox({ role: "fixed", drawnPx: nodeWidth, grow: false }, options)
          );
        }
        const padCounterStart = isVerticalParent ? parent.paddingLeft || 0 : parent.paddingTop || 0;
        const padCounterEnd = isVerticalParent ? parent.paddingRight || 0 : parent.paddingBottom || 0;
        const parentCounterDim = isVerticalParent ? parent.width : parent.height;
        const parentInnerCounter = parentCounterDim - padCounterStart - padCounterEnd;
        const childCounterDim = isVerticalParent ? nodeWidth : nodeHeight;
        const isCircleOrSquare = node.type === "ELLIPSE" || Math.abs(nodeWidth - nodeHeight) <= 1 && (/(avatar|آواتار|circle|دایره|badge|icon|ic[-_]|point|dot)/i.test((node.name || "").trim()) || "cornerRadius" in node && typeof node.cornerRadius === "number" && node.cornerRadius >= nodeWidth / 2 - 2 || Boolean(parent && /(avatar|آواتار)/i.test((parent.name || "").trim())));
        const spansParentCounter = !isCircleOrSquare && isVerticalParent && spansContainer(childCounterDim, parentInnerCounter);
        if (isCircleOrSquare) {
          const dim = Math.min(nodeWidth, nodeHeight) || nodeWidth;
          const dimStr = formatUnit(dim, options.useRem, options.baseFontSize);
          layout.width = dimStr;
          layout.height = dimStr;
          layout.minWidth = dimStr;
          layout.minHeight = dimStr;
          layout.aspectRatio = "1 / 1";
          layout.flexShrink = 0;
          delete layout.alignSelf;
        } else if (align === "STRETCH" || counterSizing === "FILL" || spansParentCounter) {
          layout.alignSelf = "stretch";
          if (isVerticalParent) layout.width = "100%";
          else layout.height = "100%";
        } else if (counterSizing === "HUG" || (isVerticalParent ? autoW : autoH)) {
          if (node.type !== "TEXT") {
            if (isVerticalParent) {
              const hugW = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
              layout.width = hugW;
              if (responsiveEnabled(options)) {
                layout.maxWidth = "100%";
                layout.minWidth = "0";
              } else {
                layout.minWidth = hugW;
              }
            } else {
              layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
              layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
            }
          }
        } else {
          const fixedCounter = isVerticalParent ? nodeWidth : nodeHeight;
          if (isVerticalParent) {
            layout.width = formatUnit(fixedCounter, options.useRem, options.baseFontSize);
            if (options.responsive && !layout.maxWidth) {
              layout.maxWidth = "100%";
            }
            if (node.type === "TEXT") {
              layout.maxWidth = "100%";
            }
          } else {
            const isContainer = "layoutMode" in node && node.layoutMode !== "NONE" && hasChildren;
            if (options.responsive && isContainer && nodeHeight > HEADER_MAX_HEIGHT_PX) {
              layout.minHeight = formatUnit(fixedCounter, options.useRem, options.baseFontSize);
            } else {
              layout.height = formatUnit(fixedCounter, options.useRem, options.baseFontSize);
            }
          }
        }
        if (node.type !== "TEXT" && !layout.height && layout.alignSelf !== "stretch") {
          layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
        }
        if (parentStacksRegions && parent !== null && isStackableRegion(node)) {
          layout.stackFill = {
            maxInlineSize: formatUnit(rowWrapThresholdPx(parent, options), options.useRem, options.baseFontSize)
          };
        }
        const parentChildren = parent && "children" in parent && Array.isArray(parent.children) ? parent.children : [];
        const myIdx = parentChildren.findIndex((c) => c === node || c.id && c.id === node.id);
        const hasPrecedingAbsoluteChild = myIdx !== -1 && parentChildren.some(
          (c, idx) => idx < myIdx && c.visible !== false && c.layoutPositioning === "ABSOLUTE"
        );
        if (hasPrecedingAbsoluteChild) {
          layout.position = "relative";
          if (!layout.zIndex) {
            layout.zIndex = 1;
          }
        } else if (hasChildren && !layout.position) {
          layout.position = "relative";
        }
      }
    } else {
      layout.position = "absolute";
      const rawX = typeof node.x === "number" ? node.x : 0;
      const rawY = typeof node.y === "number" ? node.y : 0;
      const parentX = parent && typeof parent.x === "number" ? parent.x : 0;
      const parentY = parent && typeof parent.y === "number" ? parent.y : 0;
      let relX = parent.type === "GROUP" ? rawX - parentX : rawX;
      let relY = parent.type === "GROUP" ? rawY - parentY : rawY;
      const isUnrotated = (!("rotation" in node) || node.rotation === 0 || !node.rotation) && (!parent || !("rotation" in parent) || parent.rotation === 0 || !parent.rotation);
      if (isUnrotated && "absoluteBoundingBox" in node && node.absoluteBoundingBox && parent && "absoluteBoundingBox" in parent && parent.absoluteBoundingBox) {
        const nodeBbox = node.absoluteBoundingBox;
        const parentBbox = parent.absoluteBoundingBox;
        if (typeof nodeBbox.x === "number" && typeof parentBbox.x === "number") {
          relX = nodeBbox.x - parentBbox.x;
        }
        if (typeof nodeBbox.y === "number" && typeof parentBbox.y === "number") {
          relY = nodeBbox.y - parentBbox.y;
        }
      }
      const parentW = "width" in parent && typeof parent.width === "number" ? parent.width : 0;
      const parentH = "height" in parent && typeof parent.height === "number" ? parent.height : 0;
      const rawNodeW = "width" in node && typeof node.width === "number" ? node.width : 0;
      const rawNodeH = "height" in node && typeof node.height === "number" ? node.height : 0;
      const coversParent = parentW > 0 && parentH > 0 && relX <= 2 && relY <= 2 && rawNodeW >= parentW - 4 && rawNodeH >= parentH - 4;
      const isFullBleed = coversParent || Math.abs(relX) <= 2 && Math.abs(relY) <= 2 && parentW > 0 && parentH > 0 && Math.abs(rawNodeW - parentW) <= 4 && Math.abs(rawNodeH - parentH) <= 4;
      let adjustedX = relX;
      let adjustedY = relY;
      if (isFullBleed) {
        layout.left = "0px";
        layout.top = "0px";
        layout.width = "100%";
        layout.height = "100%";
        layout.objectFit = "cover";
      } else {
        let borderTop = 0;
        let borderLeft = 0;
        let parentStrokeAlign = "INSIDE";
        const parentMainComp = getMainComponent(parent);
        if ("strokeAlign" in parent && typeof parent.strokeAlign === "string") {
          parentStrokeAlign = parent.strokeAlign;
        } else if (parentMainComp && "strokeAlign" in parentMainComp && typeof parentMainComp.strokeAlign === "string") {
          parentStrokeAlign = parentMainComp.strokeAlign;
        }
        let parentStrokesIncluded2 = false;
        if ("strokesIncludedInLayout" in parent && typeof parent.strokesIncludedInLayout === "boolean") {
          parentStrokesIncluded2 = parent.strokesIncludedInLayout;
        } else if (parentMainComp && "strokesIncludedInLayout" in parentMainComp && typeof parentMainComp.strokesIncludedInLayout === "boolean") {
          parentStrokesIncluded2 = parentMainComp.strokesIncludedInLayout;
        }
        const isAutoLayoutParent2 = "layoutMode" in parent && parent.layoutMode !== "NONE";
        const shouldOffsetBorder = parentStrokeAlign !== "OUTSIDE" && (!isAutoLayoutParent2 || parentStrokesIncluded2);
        if (shouldOffsetBorder && "strokes" in parent && Array.isArray(parent.strokes) && parent.strokes.some((s) => s.visible !== false)) {
          if ("strokeTopWeight" in parent && typeof parent.strokeTopWeight === "number") {
            borderTop = parent.strokeTopWeight || 0;
            borderLeft = parent.strokeLeftWeight || 0;
          } else if ("strokeWeight" in parent && typeof parent.strokeWeight === "number") {
            borderTop = parent.strokeWeight || 0;
            borderLeft = parent.strokeWeight || 0;
          }
        }
        adjustedX = borderLeft > 0 ? relX - borderLeft : relX;
        adjustedY = borderTop > 0 ? relY - borderTop : relY;
        const constraints = "constraints" in node && node.constraints ? node.constraints : {};
        const isRtlParent = Boolean(
          parent && "children" in parent && Array.isArray(parent.children) && parent.children.some(
            (c) => c.type === "TEXT" && typeof c.characters === "string" && isRtlText(c.characters)
          )
        );
        const isAnchoredRight = constraints.horizontal === "MAX" || isRtlParent && parentW > 0 && adjustedX + rawNodeW / 2 > parentW / 2;
        if (isAnchoredRight) {
          const rightPx = parentW - adjustedX - rawNodeW;
          layout.right = formatUnit(rightPx, options.useRem, options.baseFontSize);
          delete layout.left;
        } else {
          layout.left = formatUnit(adjustedX, options.useRem, options.baseFontSize);
        }
        layout.top = formatUnit(adjustedY, options.useRem, options.baseFontSize);
      }
      const canInferAnchor = options.responsive === true && node.type !== "TEXT" && !isFullBleed && parent.type !== "GROUP";
      let spansH = canInferAnchor && !isHorizontallyHugging(node) && spansFreeformAxis(adjustedX, rawNodeW, parentW);
      let spansV = canInferAnchor && spansFreeformAxis(adjustedY, rawNodeH, parentH);
      if (spansH) {
        layout.left = formatUnit(adjustedX, options.useRem, options.baseFontSize);
        layout.right = formatUnit(parentW - adjustedX - rawNodeW, options.useRem, options.baseFontSize);
      }
      if (spansV) {
        layout.top = formatUnit(adjustedY, options.useRem, options.baseFontSize);
        layout.bottom = formatUnit(parentH - adjustedY - rawNodeH, options.useRem, options.baseFontSize);
      }
      if (canInferAnchor) {
        const constraints = "constraints" in node && node.constraints ? node.constraints : {};
        if (!spansH) {
          const anchor = absoluteAnchor(
            constraints.horizontal,
            adjustedX,
            rawNodeW,
            parentW,
            isHorizontallyCenteredInParent(node, parent, relX, parentW)
          );
          applyAbsoluteAnchor(layout, "horizontal", anchor, adjustedX, rawNodeW, parentW, options);
          if (anchor === "stretch") spansH = true;
        }
        if (!spansV) {
          const anchor = absoluteAnchor(
            constraints.vertical,
            adjustedY,
            rawNodeH,
            parentH,
            isVerticallyCenteredFreeform(node, parent, relY, parentH)
          );
          applyAbsoluteAnchor(layout, "vertical", anchor, adjustedY, rawNodeH, parentH, options);
          if (anchor === "stretch") spansV = true;
        }
      }
      if (node.type === "TEXT") {
        const textNode = node;
        if (textNode.textAlignVertical === "CENTER") {
          layout.display = "flex";
          layout.alignItems = "center";
          if (textNode.textAlignHorizontal === "CENTER") {
            layout.justifyContent = "center";
          } else if (textNode.textAlignHorizontal === "RIGHT") {
            layout.justifyContent = "flex-end";
          } else {
            layout.justifyContent = "flex-start";
          }
        }
        const isHorizontallyCentered = isHorizontallyCenteredInParent(node, parent, relX, parentW);
        const isVerticallyCentered = isVerticallyCenteredInParent(node, parent, relY, parentH);
        if (isHorizontallyCentered && isVerticallyCentered) {
          layout.left = "50%";
          layout.top = "50%";
          layout.transform = "translate(-50%, -50%)";
        } else if (isHorizontallyCentered) {
          layout.left = "50%";
          layout.top = formatUnit(adjustedY, options.useRem, options.baseFontSize);
          layout.transform = "translateX(-50%)";
        } else if (isVerticallyCentered) {
          layout.left = formatUnit(adjustedX, options.useRem, options.baseFontSize);
          layout.top = "50%";
          layout.transform = "translateY(-50%)";
        } else {
          const isRtl = isRtlText(textNode.characters);
          const isRightAligned = textNode.textAlignHorizontal === "RIGHT" || isRtl;
          const isAnchoredRight = parentW > 0 && adjustedX + node.width / 2 > parentW / 2;
          if (isRightAligned && isAnchoredRight) {
            const rightPx = parentW - adjustedX - node.width;
            layout.right = formatUnit(rightPx, options.useRem, options.baseFontSize);
            delete layout.left;
          } else {
            layout.left = formatUnit(adjustedX, options.useRem, options.baseFontSize);
          }
          layout.top = formatUnit(adjustedY, options.useRem, options.baseFontSize);
        }
        if (textNode.textAutoResize === "WIDTH_AND_HEIGHT") {
          layout.width = "fit-content";
          if (responsiveEnabled(options) || textNode.characters && textNode.characters.includes("\n")) {
            layout.maxWidth = "100%";
          }
        } else {
          layout.width = formatUnit(node.width, options.useRem, options.baseFontSize);
          layout.maxWidth = "100%";
        }
        if (textNode.textAutoResize !== "NONE") {
        } else {
          layout.height = formatUnit(node.height, options.useRem, options.baseFontSize);
        }
      } else {
        if ("layoutMode" in node && node.layoutMode !== "NONE") {
          const isHugH = "layoutSizingHorizontal" in node && node.layoutSizingHorizontal === "HUG" || node.layoutMode === "HORIZONTAL" && "primaryAxisSizingMode" in node && node.primaryAxisSizingMode === "AUTO" || node.layoutMode === "VERTICAL" && "counterAxisSizingMode" in node && node.counterAxisSizingMode === "AUTO";
          const isHugV = "layoutSizingVertical" in node && node.layoutSizingVertical === "HUG" || node.layoutMode === "VERTICAL" && "primaryAxisSizingMode" in node && node.primaryAxisSizingMode === "AUTO" || node.layoutMode === "HORIZONTAL" && "counterAxisSizingMode" in node && node.counterAxisSizingMode === "AUTO";
          if (isHugH) {
            layout.width = "fit-content";
            if (responsiveEnabled(options)) {
              layout.maxWidth = "100%";
            } else {
              layout.minWidth = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
            }
          } else if (!spansH) {
            layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
            if (options.responsive && !layout.maxWidth) {
              layout.maxWidth = "100%";
            }
          }
          if (isHugV) {
            layout.height = "fit-content";
            layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          } else if (!spansV) {
            layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          }
        } else {
          if (!layout.width && !spansH) {
            layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
            if (options.responsive && !layout.maxWidth) {
              layout.maxWidth = "100%";
            }
          }
          if (!layout.height && !spansV) {
            layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          }
        }
      }
    }
    const hasAbsoluteChild = hasChildren && "children" in node && Array.isArray(node.children) && node.children.some((c) => {
      if (c.visible === false) return false;
      if (c.layoutPositioning === "ABSOLUTE") return true;
      const cMain = getMainComponent(c);
      return cMain && cMain.layoutPositioning === "ABSOLUTE";
    });
    if (hasChildren && !layout.position && (!("layoutMode" in node) || node.layoutMode === "NONE" || hasAbsoluteChild)) {
      layout.position = "relative";
    }
    if ("minWidth" in node && typeof node.minWidth === "number" && node.minWidth > 0) {
      layout.minWidth = formatUnit(node.minWidth, options.useRem, options.baseFontSize);
    }
    if ("maxWidth" in node && typeof node.maxWidth === "number" && node.maxWidth > 0) {
      layout.maxWidth = formatUnit(node.maxWidth, options.useRem, options.baseFontSize);
    }
    if ("minHeight" in node && typeof node.minHeight === "number" && node.minHeight > 0) {
      layout.minHeight = formatUnit(node.minHeight, options.useRem, options.baseFontSize);
    }
    if ("maxHeight" in node && typeof node.maxHeight === "number" && node.maxHeight > 0) {
      layout.maxHeight = formatUnit(node.maxHeight, options.useRem, options.baseFontSize);
    }
    if (isClipping) {
      const isHugFrame = parent !== null && "layoutMode" in node && node.layoutMode !== "NONE" && !("cornerRadius" in node && typeof node.cornerRadius === "number" && node.cornerRadius > 0) && !hasAbsoluteChild && ("layoutSizingHorizontal" in node && node.layoutSizingHorizontal === "HUG" || node.layoutMode === "HORIZONTAL" && node.primaryAxisSizingMode === "AUTO" || node.layoutMode === "VERTICAL" && node.counterAxisSizingMode === "AUTO");
      if (!isHugFrame) {
        layout.overflow = "hidden";
      }
    } else if ("children" in node && Array.isArray(node.children) && node.children.length > 0) {
      const hasRoundedShape = "cornerRadius" in node && typeof node.cornerRadius === "number" && node.cornerRadius > 0 || node.type === "ELLIPSE" || mainComp && "cornerRadius" in mainComp && typeof mainComp.cornerRadius === "number" && mainComp.cornerRadius > 0;
      const hasImageChild = node.children.some(
        (c) => c.type === "ELLIPSE" || "fills" in c && Array.isArray(c.fills) && c.fills.some((f) => f.type === "IMAGE")
      );
      if (hasRoundedShape && hasImageChild) {
        layout.overflow = "hidden";
      }
    }
    if ("strokeTopWeight" in node && "strokeRightWeight" in node && "strokeBottomWeight" in node && "strokeLeftWeight" in node) {
      const st = node.strokeTopWeight || 0;
      const sr = node.strokeRightWeight || 0;
      const sb = node.strokeBottomWeight || 0;
      const sl = node.strokeLeftWeight || 0;
      if (st !== sr || st !== sb || st !== sl) {
        layout.boxSizing = "border-box";
      }
    }
    if ("constraints" in node && node.constraints && typeof node.constraints === "object") {
      const h = node.constraints.horizontal;
      const v = node.constraints.vertical;
      if (h && h !== "MIN" && v && v !== "MIN") {
        layout.constraints = { horizontal: h, vertical: v };
      }
      if (h === "MAX" && layout.position === "absolute" && parent && "width" in parent && layout.right === void 0) {
        const parentW = parent.width;
        const leftPx = typeof layout.left === "string" && !layout.left.endsWith("%") ? parseFloat(layout.left) : typeof node.x === "number" ? node.x : 0;
        const rightPx = parentW - leftPx - node.width;
        layout.right = formatUnit(rightPx, options.useRem, options.baseFontSize);
        delete layout.left;
      }
      if (v === "MAX" && layout.position === "absolute" && parent && "height" in parent) {
        const parentH = parent.height;
        const topPx = typeof layout.top === "string" && !layout.top.endsWith("%") ? parseFloat(layout.top) : typeof node.y === "number" ? node.y : 0;
        const bottomPx = parentH - topPx - node.height;
        layout.bottom = formatUnit(bottomPx, options.useRem, options.baseFontSize);
        delete layout.top;
      }
      if (h === "STRETCH" && layout.position === "absolute" && parent && "width" in parent) {
        const parentW = parent.width;
        const leftPx = typeof layout.left === "string" && !layout.left.endsWith("%") ? parseFloat(layout.left) : typeof node.x === "number" ? node.x : 0;
        const rightPx = parentW - leftPx - node.width;
        layout.left = formatUnit(leftPx, options.useRem, options.baseFontSize);
        layout.right = formatUnit(rightPx, options.useRem, options.baseFontSize);
        delete layout.width;
        if (layout.transform) {
          layout.transform = layout.transform.replace("translateX(-50%)", "").trim();
          if (!layout.transform) delete layout.transform;
        }
      }
      if (v === "STRETCH" && layout.position === "absolute" && parent && "height" in parent) {
        const parentH = parent.height;
        const topPx = typeof layout.top === "string" && !layout.top.endsWith("%") ? parseFloat(layout.top) : typeof node.y === "number" ? node.y : 0;
        const bottomPx = parentH - topPx - node.height;
        layout.top = formatUnit(topPx, options.useRem, options.baseFontSize);
        layout.bottom = formatUnit(bottomPx, options.useRem, options.baseFontSize);
        delete layout.height;
        if (layout.transform) {
          layout.transform = layout.transform.replace("translateY(-50%)", "").trim();
          if (!layout.transform) delete layout.transform;
        }
      }
      if (layout.position === "absolute" && parent && "width" in parent) {
        const parentW = typeof parent.width === "number" ? parent.width : 0;
        const parentH = "height" in parent && typeof parent.height === "number" ? parent.height : 0;
        const rawNodeW = typeof node.width === "number" ? node.width : 0;
        const rawNodeH = typeof node.height === "number" ? node.height : 0;
        let curRelX = typeof node.x === "number" ? node.x : 0;
        let curRelY = typeof node.y === "number" ? node.y : 0;
        if ("absoluteBoundingBox" in node && node.absoluteBoundingBox && "absoluteBoundingBox" in parent && parent.absoluteBoundingBox) {
          const nb = node.absoluteBoundingBox;
          const pb = parent.absoluteBoundingBox;
          if (typeof nb.x === "number" && typeof pb.x === "number") curRelX = nb.x - pb.x;
          if (typeof nb.y === "number" && typeof pb.y === "number") curRelY = nb.y - pb.y;
        }
        const isAutoWidthText = node.type === "TEXT" && node.textAutoResize === "WIDTH_AND_HEIGHT";
        const isRightOrRtlNotCenter = node.type === "TEXT" && (node.textAlignHorizontal === "RIGHT" || isRtlText(node.characters) && node.textAlignHorizontal !== "CENTER");
        const isOverhangingX = curRelX < -0.5 || parentW > 0 && curRelX + rawNodeW > parentW + 0.5;
        const isOverhangingY = curRelY < -0.5 || parentH > 0 && curRelY + rawNodeH > parentH + 0.5;
        const isCenterH = h === "CENTER" && !isOverhangingX && parentW > 0 && !isRightOrRtlNotCenter && layout.right === void 0;
        const isCenterV = v === "CENTER" && !isOverhangingY && parentH > 0 && layout.bottom === void 0;
        const unit = (value) => formatUnit(value, options.useRem, options.baseFontSize);
        const centeredOffset = (offsetPx) => {
          const rounded = Math.round(offsetPx);
          if (rounded === 0) return "50%";
          return rounded > 0 ? `calc(50% + ${unit(rounded)})` : `calc(50% - ${unit(-rounded)})`;
        };
        const centerOffsetH = parentW > 0 ? curRelX + rawNodeW / 2 - parentW / 2 : 0;
        const centerOffsetV = parentH > 0 ? curRelY + rawNodeH / 2 - parentH / 2 : 0;
        if (isCenterH && isCenterV) {
          layout.left = centeredOffset(centerOffsetH);
          layout.top = centeredOffset(centerOffsetV);
          layout.transform = "translate(-50%, -50%)";
          if (!isAutoWidthText) {
            layout.width = formatUnit(node.width, options.useRem, options.baseFontSize);
          }
        } else if (isCenterH) {
          layout.left = centeredOffset(centerOffsetH);
          layout.transform = addTransform(layout.transform, "translateX(-50%)");
          if (!isAutoWidthText) {
            layout.width = formatUnit(node.width, options.useRem, options.baseFontSize);
          }
        } else if (isCenterV) {
          layout.top = centeredOffset(centerOffsetV);
          layout.transform = addTransform(layout.transform, "translateY(-50%)");
        }
      }
      if ((h === "SCALE" || v === "SCALE") && parent && "width" in parent && "height" in parent) {
        if (h === "SCALE" && parent.width > 0) {
          const pct = Math.round(node.width / parent.width * 1e4) / 100;
          layout.width = `${pct}%`;
        }
        if (v === "SCALE" && parent.height > 0) {
          const pct = Math.round(node.height / parent.height * 1e4) / 100;
          layout.height = `${pct}%`;
        }
      }
    }
    if (responsiveEnabled(options) && layout.position === "absolute") {
      const cap = absoluteInlineCap(layout);
      if (cap) layout.maxWidth = cap;
    }
    const dimensionWithToken = (value, field, px) => {
      var _a2;
      if (value === void 0 || !(px > 0)) return value;
      if (value !== formatUnit(px, options.useRem, options.baseFontSize)) return value;
      return (_a2 = resolver.lengthFor(TokenResolver.boundId(node, field), px)) != null ? _a2 : value;
    };
    layout.width = dimensionWithToken(layout.width, "width", nodeWidth);
    layout.height = dimensionWithToken(layout.height, "height", nodeHeight);
    layout.minWidth = dimensionWithToken(layout.minWidth, "minWidth", nodeWidth);
    layout.minHeight = dimensionWithToken(layout.minHeight, "minHeight", nodeHeight);
    layout.maxWidth = dimensionWithToken(layout.maxWidth, "maxWidth", nodeWidth);
    layout.maxHeight = dimensionWithToken(layout.maxHeight, "maxHeight", nodeHeight);
    return layout;
  }

  // engines/fig-engine/vendor/html-generator/src/plugin/converter/blend.ts
  var CSS_BLEND_MODES = {
    MULTIPLY: "multiply",
    SCREEN: "screen",
    OVERLAY: "overlay",
    DARKEN: "darken",
    LIGHTEN: "lighten",
    COLOR_DODGE: "color-dodge",
    COLOR_BURN: "color-burn",
    HARD_LIGHT: "hard-light",
    SOFT_LIGHT: "soft-light",
    DIFFERENCE: "difference",
    EXCLUSION: "exclusion",
    HUE: "hue",
    SATURATION: "saturation",
    COLOR: "color",
    LUMINOSITY: "luminosity"
  };
  function cssBlendMode(figmaBlend) {
    var _a;
    if (!figmaBlend || figmaBlend === "NORMAL" || figmaBlend === "PASS_THROUGH") return null;
    return (_a = CSS_BLEND_MODES[figmaBlend]) != null ? _a : null;
  }
  function needsIsolation(children) {
    return children.some((child) => child.visual.mixBlendMode !== void 0);
  }

  // engines/fig-engine/vendor/html-generator/src/plugin/converter/styles.ts
  function getMainComponent2(node) {
    if (node.type === "INSTANCE") {
      const inst = node;
      const resolved = inst._resolvedMainComponent;
      if (resolved) return resolved;
      try {
        return inst.mainComponent || null;
      } catch {
        return null;
      }
    }
    return null;
  }
  function extractFills(node, resolver, bgLayers) {
    let fillsList = [];
    let fillSource = node;
    const mainComp = getMainComponent2(node);
    if ("fills" in node && Array.isArray(node.fills) && node.fills.length > 0) {
      fillsList = node.fills;
    } else if (mainComp && Array.isArray(mainComp.fills) && mainComp.fills.length > 0) {
      fillsList = mainComp.fills;
      fillSource = mainComp;
    }
    if (fillsList.length === 0) return;
    const activeFills = fillsList.map((fill, index) => ({ fill, index })).filter(({ fill }) => fill.visible !== false);
    let fillStyleId = TokenResolver.styleId(node, "fillStyleId");
    if (!fillStyleId && (mainComp == null ? void 0 : mainComp.fillStyleId) && typeof mainComp.fillStyleId === "string") {
      fillStyleId = mainComp.fillStyleId;
    }
    const bindingFor = (fill, index) => {
      var _a, _b;
      return (_b = (_a = TokenResolver.paintBoundId(fill)) != null ? _a : TokenResolver.boundArrayId(fillSource, "fills", index)) != null ? _b : fillSource !== node ? TokenResolver.boundArrayId(node, "fills", index) : null;
    };
    const layers = activeFills.length > 1 ? [...activeFills].reverse() : activeFills;
    const width = "width" in node && typeof node.width === "number" ? node.width : 100;
    const height = "height" in node && typeof node.height === "number" ? node.height : 100;
    for (let idx = 0; idx < layers.length; idx++) {
      const { fill, index } = layers[idx];
      const isLastLayer = idx === layers.length - 1;
      const fillOpacity = typeof fill.opacity === "number" ? fill.opacity : 1;
      if (fill.type === "SOLID") {
        const colorVal = resolver.resolveColor(
          fill.color,
          fillOpacity,
          bindingFor(fill, index),
          fillStyleId
        );
        if (!isLastLayer) {
          bgLayers.push(`linear-gradient(0deg, ${colorVal}, ${colorVal})`);
        } else {
          bgLayers.push(colorVal);
        }
      } else if (fill.type === "IMAGE") {
        const mode = "scaleMode" in fill && typeof fill.scaleMode === "string" ? fill.scaleMode : "FILL";
        const size = mode === "FIT" ? "contain" : mode === "TILE" ? "auto" : "cover";
        bgLayers.push(`__FIGMA_IMAGE_FILL__:${size}`);
      } else if (fill.type === "GRADIENT_LINEAR" || fill.type === "GRADIENT_RADIAL" || fill.type === "GRADIENT_ANGULAR" || fill.type === "GRADIENT_DIAMOND") {
        bgLayers.push(
          gradientToCss(
            fill,
            width,
            height,
            (color, alpha, stop) => resolver.resolveColor(color, alpha, TokenResolver.paintBoundId(stop)),
            fillOpacity
          )
        );
      }
    }
  }
  function textureFilterRegion(padXPx, padYPx, width, height) {
    if (width <= 0 || height <= 0) return "";
    const one = (v) => Math.round(v * 10) / 10;
    const px = one(Math.max(0, padXPx) / width * 100);
    const py = one(Math.max(0, padYPx) / height * 100);
    return ` x='-${px}%' y='-${py}%' width='${one(100 + px * 2)}%' height='${one(100 + py * 2)}%'`;
  }
  function effectOuterReach(effect) {
    if (effect.type === "LAYER_BLUR") {
      const reach = effect.radius * 3;
      return { x: reach, y: reach };
    }
    if (effect.type === "DROP_SHADOW") {
      const blurred = effect.radius * 3 + (effect.spread || 0);
      return {
        x: Math.abs(effect.offset.x) + blurred,
        y: Math.abs(effect.offset.y) + blurred
      };
    }
    return { x: 0, y: 0 };
  }
  function effectColorEqual(a, b) {
    return Math.abs(a.r - b.r) < 1e-4 && Math.abs(a.g - b.g) < 1e-4 && Math.abs(a.b - b.b) < 1e-4 && Math.abs(a.a - b.a) < 1e-4;
  }
  function effectsMatch(a, b) {
    const active = (list) => list.filter((e) => e.visible !== false);
    const left = active(a);
    const right = active(b);
    if (left.length !== right.length) return false;
    return left.every((effect, i) => {
      const other = right[i];
      if (!other || effect.type !== other.type) return false;
      const radiusA = "radius" in effect ? effect.radius : 0;
      const radiusB = "radius" in other ? other.radius : 0;
      if (Math.abs(radiusA - radiusB) > 1e-3) return false;
      if (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") {
        const o = other;
        if (Math.abs(effect.offset.x - o.offset.x) > 1e-3) return false;
        if (Math.abs(effect.offset.y - o.offset.y) > 1e-3) return false;
        if (Math.abs((effect.spread || 0) - (o.spread || 0)) > 1e-3) return false;
        if (!effectColorEqual(effect.color, o.color)) return false;
      }
      return true;
    });
  }
  function effectHasBoundFields(effect) {
    return TokenResolver.effectBoundId(effect, "color") !== null || TokenResolver.effectBoundId(effect, "radius") !== null || TokenResolver.effectBoundId(effect, "spread") !== null || TokenResolver.effectBoundId(effect, "offsetX") !== null || TokenResolver.effectBoundId(effect, "offsetY") !== null;
  }
  function extractVisualStyles(node, options, tokenRegistry, parent) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const styles = {};
    const resolver = new TokenResolver(tokenRegistry, {
      baseFontSize: options.baseFontSize,
      node
    });
    const mainComp = getMainComponent2(node);
    const divider = readDividerGeometry(node);
    const normalizedDivider = divider && isInLayoutFlow(node, parent != null ? parent : null) ? divider : null;
    const bgLayers = [];
    extractFills(node, resolver, bgLayers);
    if (bgLayers.length > 0) {
      styles.background = bgLayers.join(", ");
    }
    if (node.type === "ELLIPSE") {
      styles.borderRadius = "50%";
    } else {
      let cr = "cornerRadius" in node ? node.cornerRadius : void 0;
      let targetNode = node;
      if ((cr === void 0 || cr === 0) && mainComp && "cornerRadius" in mainComp) {
        cr = mainComp.cornerRadius;
        targetNode = mainComp;
      }
      const radiusBinding = (field) => {
        var _a2;
        return (_a2 = TokenResolver.boundId(node, field)) != null ? _a2 : mainComp ? TokenResolver.boundId(mainComp, field) : null;
      };
      if (typeof cr === "number" && cr > 0) {
        const nodeW = "width" in node && typeof node.width === "number" ? node.width : 0;
        const nodeH = "height" in node && typeof node.height === "number" ? node.height : 0;
        if (nodeW > 0 && nodeH > 0 && Math.abs(nodeW - nodeH) <= 1 && cr >= nodeW / 2 - 2) {
          styles.borderRadius = "50%";
        } else {
          styles.borderRadius = (_a = resolver.lengthFor(radiusBinding("cornerRadius"), cr)) != null ? _a : formatUnit(cr, options.useRem, options.baseFontSize);
        }
      } else if (typeof figma !== "undefined" && cr === figma.mixed || typeof cr !== "number" && cr !== void 0 || "topLeftRadius" in targetNode) {
        const corners = ["topLeftRadius", "topRightRadius", "bottomRightRadius", "bottomLeftRadius"];
        const vals = corners.map((k) => {
          var _a2;
          let val = typeof targetNode[k] === "number" ? targetNode[k] : 0;
          if (val === 0 && mainComp && typeof mainComp[k] === "number") {
            val = mainComp[k];
          }
          return (_a2 = resolver.lengthFor(radiusBinding(k), val)) != null ? _a2 : formatUnit(val, options.useRem, options.baseFontSize);
        });
        if (vals.some((v) => v !== "0px")) {
          styles.borderRadius = vals.join(" ");
        }
      }
    }
    let strokeList = [];
    let strokeSource = node;
    if ("strokes" in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
      strokeList = node.strokes;
    } else if (mainComp && Array.isArray(mainComp.strokes) && mainComp.strokes.length > 0) {
      strokeList = mainComp.strokes;
      strokeSource = mainComp;
    }
    const plan = planStroke(
      strokeList,
      strokeSource,
      node.type === "LINE" || normalizedDivider !== null
    );
    if (plan.kind !== "none") {
      const src = strokeSource;
      const isDashed = "dashPattern" in src && Array.isArray(src.dashPattern) && src.dashPattern.length > 0;
      const borderStyle = isDashed ? "dashed" : "solid";
      const u = (px) => formatUnit(px, options.useRem, options.baseFontSize);
      const boundStrokeId = (_c = (_b = TokenResolver.paintBoundId(plan.paint)) != null ? _b : TokenResolver.boundArrayId(strokeSource, "strokes", 0)) != null ? _c : strokeSource !== node ? TokenResolver.boundArrayId(node, "strokes", 0) : null;
      const strokeWeightId = (_d = TokenResolver.boundId(strokeSource, "strokeWeight")) != null ? _d : strokeSource !== node ? TokenResolver.boundId(node, "strokeWeight") : null;
      const w = (px) => {
        var _a2;
        return (_a2 = resolver.lengthFor(strokeWeightId, px)) != null ? _a2 : u(px);
      };
      let strokeStyleId = TokenResolver.styleId(node, "strokeStyleId");
      if (!strokeStyleId && (mainComp == null ? void 0 : mainComp.strokeStyleId)) {
        strokeStyleId = mainComp.strokeStyleId;
      }
      if (plan.kind === "solid") {
        const strokeColor = resolver.resolveColor(
          plan.paint.color,
          (_e = plan.paint.opacity) != null ? _e : 1,
          boundStrokeId,
          strokeStyleId
        );
        const { weights, perSide } = plan;
        if (normalizedDivider) {
          const weight = Math.max(weights.top, weights.right, weights.bottom, weights.left);
          if (weight > 0) {
            const strokeVal = `${w(weight)} ${borderStyle} ${strokeColor}`;
            if (normalizedDivider.axis === "vertical") {
              styles.borderRight = strokeVal;
            } else {
              styles.borderTop = strokeVal;
            }
          }
          styles.boxSizing = "border-box";
        } else if (perSide) {
          if (weights.top > 0) styles.borderTop = `${w(weights.top)} ${borderStyle} ${strokeColor}`;
          if (weights.right > 0) styles.borderRight = `${w(weights.right)} ${borderStyle} ${strokeColor}`;
          if (weights.bottom > 0) styles.borderBottom = `${w(weights.bottom)} ${borderStyle} ${strokeColor}`;
          if (weights.left > 0) styles.borderLeft = `${w(weights.left)} ${borderStyle} ${strokeColor}`;
          styles.boxSizing = "border-box";
        } else {
          const sw = weights.top;
          if (sw > 0) {
            const strokeVal = `${w(sw)} ${borderStyle} ${strokeColor}`;
            const hasW = "width" in node && typeof node.width === "number";
            const hasH = "height" in node && typeof node.height === "number";
            const nodeW = hasW ? node.width : void 0;
            const nodeH = hasH ? node.height : void 0;
            const isDividerNamed = /^(line|divider|separator|rule|border|stroke|خط|جداکننده)/i.test((node.name || "").trim());
            const isVectorOrShape = node.type === "VECTOR" || node.type === "RECTANGLE";
            let is1DLine = node.type === "LINE";
            let isVertical = false;
            if (node.type === "LINE") {
              isVertical = hasW && nodeW < 1 && hasH && nodeH >= 1 || hasH && nodeH > 1 && (!hasW || nodeW <= 1);
            } else if (isVectorOrShape && hasW && hasH) {
              const isHoriz = nodeH <= 1 && nodeW >= 10 || isDividerNamed && nodeH <= 2 && nodeW >= nodeH || nodeH === 0 && nodeW > 0;
              const isVert = nodeW <= 1 && nodeH >= 10 || isDividerNamed && nodeW <= 2 && nodeH >= nodeW || nodeW === 0 && nodeH > 0;
              if (isHoriz) {
                is1DLine = true;
                isVertical = false;
              } else if (isVert) {
                is1DLine = true;
                isVertical = true;
              }
            }
            if (is1DLine) {
              if (isVertical) {
                styles.borderRight = strokeVal;
              } else {
                styles.borderTop = strokeVal;
              }
            } else {
              styles.border = strokeVal;
            }
            styles.boxSizing = "border-box";
          }
        }
      } else if (plan.kind === "gradient") {
        const width = "width" in node && typeof node.width === "number" ? node.width : 100;
        const height = "height" in node && typeof node.height === "number" ? node.height : 100;
        const image = gradientToCss(
          plan.paint,
          width,
          height,
          (color, alpha, stop) => resolver.resolveColor(color, alpha, TokenResolver.paintBoundId(stop)),
          (_f = plan.paint.opacity) != null ? _f : 1
        );
        const first = plan.paint.gradientStops[0];
        const sideColor = first ? resolver.resolveColor(
          first.color,
          ((_g = first.color.a) != null ? _g : 1) * ((_h = plan.paint.opacity) != null ? _h : 1),
          TokenResolver.paintBoundId(first)
        ) : resolver.resolveColor({ r: 0, g: 0, b: 0 }, 1);
        if (plan.ring) {
          styles.gradientBorder = { image, width: w(plan.weights.top) };
        } else if (normalizedDivider) {
          const weight = Math.max(
            plan.weights.top,
            plan.weights.right,
            plan.weights.bottom,
            plan.weights.left
          );
          if (weight > 0) {
            const strokeVal = `${w(weight)} ${borderStyle} ${sideColor}`;
            if (normalizedDivider.axis === "vertical") {
              styles.borderRight = strokeVal;
            } else {
              styles.borderTop = strokeVal;
            }
          }
          styles.boxSizing = "border-box";
        } else {
          const { weights } = plan;
          if (weights.top > 0) styles.borderTop = `${w(weights.top)} ${borderStyle} ${sideColor}`;
          if (weights.right > 0) styles.borderRight = `${w(weights.right)} ${borderStyle} ${sideColor}`;
          if (weights.bottom > 0) styles.borderBottom = `${w(weights.bottom)} ${borderStyle} ${sideColor}`;
          if (weights.left > 0) styles.borderLeft = `${w(weights.left)} ${borderStyle} ${sideColor}`;
          styles.boxSizing = "border-box";
        }
      }
    }
    let effectStyleId = TokenResolver.styleId(node, "effectStyleId");
    if (!effectStyleId && (mainComp == null ? void 0 : mainComp.effectStyleId)) {
      effectStyleId = mainComp.effectStyleId;
    }
    let rawEffects = [];
    if ("effects" in node && Array.isArray(node.effects) && node.effects.length > 0) {
      rawEffects = node.effects;
    } else if (mainComp && Array.isArray(mainComp.effects) && mainComp.effects.length > 0) {
      rawEffects = mainComp.effects;
    }
    const effectStyle = resolver.effectStyle(effectStyleId);
    const canUseStyleTokens = effectStyle !== null && rawEffects.length > 0 && effectsMatch(rawEffects, effectStyle.effects) && !effectStyle.effects.some(effectHasBoundFields);
    let appliedEffectStyle = false;
    if (effectStyle && canUseStyleTokens) {
      const active = effectStyle.effects.filter((e) => e.visible !== false);
      const shadowEffects = active.filter(
        (e) => e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW"
      );
      if (shadowEffects.length === active.length && active.length > 0 && effectStyle.shadow) {
        const ref = `var(${effectStyle.shadow.cssVarName})`;
        if (node.type !== "TEXT") {
          styles.boxShadow = ref;
          appliedEffectStyle = true;
        } else if (active.every((e) => e.type === "DROP_SHADOW" && (e.spread || 0) === 0)) {
          styles.textShadow = ref;
          appliedEffectStyle = true;
        }
      } else if (active.length > 0 && active.every((e) => e.type === "LAYER_BLUR") && effectStyle.filter) {
        styles.filter = `var(${effectStyle.filter.cssVarName})`;
        appliedEffectStyle = true;
      } else if (active.length > 0 && active.every((e) => e.type === "BACKGROUND_BLUR") && effectStyle.backdropFilter) {
        styles.backdropFilter = `var(${effectStyle.backdropFilter.cssVarName})`;
        appliedEffectStyle = true;
      }
    }
    if (!appliedEffectStyle && rawEffects.length > 0) {
      const activeEffects = rawEffects.filter((e) => e.visible !== false);
      const shadows = [];
      const textShadows = [];
      const filters = [];
      const backdropFilters = [];
      const outsideReach = activeEffects.reduce(
        (widest, effect) => {
          const reach = effectOuterReach(effect);
          return { x: Math.max(widest.x, reach.x), y: Math.max(widest.y, reach.y) };
        },
        { x: 0, y: 0 }
      );
      const boxWidth = "width" in node && typeof node.width === "number" ? node.width : 0;
      const boxHeight = "height" in node && typeof node.height === "number" ? node.height : 0;
      for (const effect of activeEffects) {
        const lengthFor = (field, px) => {
          var _a2;
          return (_a2 = resolver.lengthFor(TokenResolver.effectBoundId(effect, field), px)) != null ? _a2 : formatUnit(px, options.useRem, options.baseFontSize);
        };
        if (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") {
          const isInset = effect.type === "INNER_SHADOW" ? "inset " : "";
          const x = lengthFor("offsetX", effect.offset.x);
          const y = lengthFor("offsetY", effect.offset.y);
          const radius = lengthFor("radius", effect.radius);
          const spread = lengthFor("spread", effect.spread || 0);
          const color = resolver.resolveColor(
            effect.color,
            effect.color.a,
            TokenResolver.effectBoundId(effect, "color")
          );
          if (node.type === "TEXT") {
            if (effect.type === "DROP_SHADOW") textShadows.push(`${x} ${y} ${radius} ${color}`);
            continue;
          }
          shadows.push(`${isInset}${x} ${y} ${radius} ${spread} ${color}`);
        } else if (effect.type === "LAYER_BLUR") {
          filters.push(`blur(${lengthFor("radius", effect.radius)})`);
        } else if (effect.type === "BACKGROUND_BLUR") {
          backdropFilters.push(`blur(${lengthFor("radius", effect.radius)})`);
        } else if (effect.type === "TEXTURE" || effect.type === "NOISE") {
          const textureEffect = effect;
          const radius = typeof textureEffect.radius === "number" ? textureEffect.radius : 3;
          const sizeX = textureEffect.noiseSizeVector && typeof textureEffect.noiseSizeVector.x === "number" ? textureEffect.noiseSizeVector.x : typeof textureEffect.noiseSize === "number" ? textureEffect.noiseSize : 0.1;
          const sizeY = textureEffect.noiseSizeVector && typeof textureEffect.noiseSizeVector.y === "number" ? textureEffect.noiseSizeVector.y : typeof textureEffect.noiseSize === "number" ? textureEffect.noiseSize : 0.1;
          const freqX = Math.min(Math.max(Math.round(0.08 / Math.max(sizeX, 0.01) * 100) / 100, 0.05), 2);
          const freqY = Math.min(Math.max(Math.round(0.08 / Math.max(sizeY, 0.01) * 100) / 100, 0.05), 2);
          const freqStr = freqX === freqY ? `${freqX}` : `${freqX} ${freqY}`;
          const region = textureFilterRegion(outsideReach.x + radius, outsideReach.y + radius, boxWidth, boxHeight);
          const clip = textureEffect.clipToShape === false ? "" : `<feComposite in='d' in2='SourceGraphic' operator='in'/>`;
          const svgFilter = `<svg xmlns='http://www.w3.org/2000/svg'><filter id='f'${region}><feTurbulence type='fractalNoise' baseFrequency='${freqStr}' numOctaves='3' result='n'/><feDisplacementMap in='SourceGraphic' in2='n' scale='${radius}' xChannelSelector='R' yChannelSelector='G' result='d'/>${clip}</filter></svg>`;
          const encoded = encodeURIComponent(svgFilter).replace(/'/g, "%27");
          filters.push(`url('data:image/svg+xml,${encoded}#f')`);
        }
      }
      if (shadows.length > 0) {
        styles.boxShadow = shadows.join(", ");
      }
      if (textShadows.length > 0) {
        styles.textShadow = textShadows.join(", ");
      }
      if (filters.length > 0) {
        styles.filter = filters.join(" ");
      }
      if (backdropFilters.length > 0) {
        styles.backdropFilter = backdropFilters.join(" ");
      }
    }
    if ("opacity" in node && typeof node.opacity === "number" && node.opacity < 1) {
      styles.opacity = (_i = resolver.numberFor(TokenResolver.boundId(node, "opacity"), node.opacity)) != null ? _i : Math.round(node.opacity * 100) / 100;
    }
    const cssBlend = cssBlendMode(
      "blendMode" in node && typeof node.blendMode === "string" ? node.blendMode : null
    );
    if (cssBlend) styles.mixBlendMode = cssBlend;
    if (!normalizedDivider && "rotation" in node && typeof node.rotation === "number" && Math.round(node.rotation) !== 0) {
      const angle = Math.round(-node.rotation * 10) / 10;
      styles.transform = `rotate(${angle}deg)`;
    }
    return styles;
  }

  // engines/fig-engine/vendor/html-generator/src/plugin/converter/form-controls.ts
  var PLACEHOLDER_NAME_RE = /placeholder|hint|value|متن|راهنما|جایگزین/i;
  var CHECKED_NAME_RE = /\bchecked\b|\bselected\b|\bactive\b|\bon\b|تیک|انتخاب\s*شده|فعال/i;
  var RADIO_GROUP_NAME_RE = /\bradio\b|\bgroup\b|\boptions?\b|\bchoices?\b|رادیو|گروه/i;
  function collectTextHits(list, direct, out = []) {
    list.forEach((node, index) => {
      if (node.type === "TEXT") {
        out.push({ list, index, node, direct });
        return;
      }
      collectTextHits(node.children, false, out);
    });
    return out;
  }
  function pickPlaceholder(hits) {
    var _a, _b, _c, _d, _e;
    const filled = hits.filter((hit) => {
      var _a2;
      return ((_a2 = hit.node.text) != null ? _a2 : "").trim().length > 0;
    });
    return (_e = (_d = (_c = (_b = (_a = filled.find((hit) => PLACEHOLDER_NAME_RE.test(hit.node.name))) != null ? _a : filled.find((hit) => hit.direct)) != null ? _b : filled[0]) != null ? _c : hits.find((hit) => hit.direct)) != null ? _d : hits[0]) != null ? _e : null;
  }
  function inputTypography(source) {
    if (!source) return void 0;
    const clean = { ...source };
    delete clean.segments;
    delete clean.isList;
    delete clean.listType;
    delete clean.listGap;
    delete clean.listBulletColor;
    delete clean.paragraphSpacing;
    return clean;
  }
  function directControlLayout(source) {
    const layout = { ...source, boxSizing: "border-box" };
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
    if (!layout.width || layout.width === "fit-content") layout.width = "100%";
    return layout;
  }
  function directControlVisual(source) {
    const visual = { ...source };
    delete visual.gradientBorder;
    if (!visual.background) visual.background = "transparent";
    if (!visual.border) visual.border = "none";
    return visual;
  }
  function nestedControlLayout(source) {
    var _a;
    const layout = {
      display: "block",
      width: "100%",
      flexGrow: 1,
      flexShrink: 1,
      minWidth: "0px",
      boxSizing: "border-box",
      padding: { top: 0, right: 0, bottom: 0, left: 0 }
    };
    if ((source == null ? void 0 : source.position) === "absolute") {
      layout.position = "absolute";
      layout.left = source.left;
      layout.top = source.top;
      layout.right = source.right;
      layout.bottom = source.bottom;
      layout.width = (_a = source.width) != null ? _a : "100%";
      delete layout.flexGrow;
      delete layout.flexShrink;
    }
    if (source == null ? void 0 : source.alignSelf) layout.alignSelf = source.alignSelf;
    if (source == null ? void 0 : source.direction) layout.direction = source.direction;
    return layout;
  }
  function inferInputType(names) {
    const value = names.join(" ").toLowerCase();
    if (/password|passcode|پسورد|رمز/.test(value)) return "password";
    if (/e-?mail|ایمیل/.test(value)) return "email";
    if (/search|جستجو/.test(value)) return "search";
    if (/\b(?:tel|phone|mobile|telephone)\b|تلفن|موبایل/.test(value)) return "tel";
    if (/\burl\b|website|وب\s*سایت/.test(value)) return "url";
    if (/\bnumber\b|numeric|عدد/.test(value)) return "number";
    return "text";
  }
  function fieldName(className) {
    const name = className.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    return name || "field";
  }
  function choiceValue(className, label) {
    return translatePersianToSlug(label) || fieldName(className);
  }
  function radioGroupName(node, fallback) {
    let current = node.parent;
    for (let depth = 0; current && depth < 4; depth += 1, current = current.parent) {
      if (!RADIO_GROUP_NAME_RE.test(current.name)) continue;
      const slug = translatePersianToSlug(current.name);
      if (slug) return slug;
    }
    return fallback;
  }
  function selectOptions(value, node) {
    if (!value) return [];
    return [
      {
        id: `${node.id}:option`,
        name: `${node.name} option`,
        className: "",
        tag: "option",
        type: "OPTION",
        layout: {},
        visual: {},
        attrs: { value: translatePersianToSlug(value) || "value", selected: "selected" },
        text: value,
        children: []
      }
    ];
  }
  function buildAttrs(kind, names, placeholder, className) {
    const attrs = {};
    if (kind === "input") attrs.type = inferInputType(names);
    if (placeholder && kind !== "select") {
      attrs.placeholder = kind === "textarea" ? placeholder : placeholder.replace(/\s*\r?\n\s*/g, " ");
    }
    attrs.name = fieldName(className);
    return attrs;
  }
  function applyFormControlSemantics(irNode, kind, node, existingNamesSet) {
    var _a;
    const hits = collectTextHits(irNode.children, true);
    const placeholderHit = pickPlaceholder(hits);
    const placeholder = ((_a = placeholderHit == null ? void 0 : placeholderHit.node.text) != null ? _a : "").trim();
    const names = componentAwareNames(node);
    const hasNonTextChild = irNode.children.some((child) => child.type !== "TEXT");
    const canBeTheControl = !hasNonTextChild && hits.length <= 1 && !irNode.visual.gradientBorder;
    const options = kind === "select" ? selectOptions(placeholder, node) : [];
    if (canBeTheControl) {
      if (placeholderHit) placeholderHit.list.splice(placeholderHit.index, 1);
      irNode.children = options;
      irNode.tag = kind;
      irNode.type = kind === "input" ? "INPUT" : kind === "select" ? "SELECT" : "TEXTAREA";
      irNode.layout = directControlLayout(irNode.layout);
      irNode.visual = directControlVisual(irNode.visual);
      irNode.typography = inputTypography(placeholderHit == null ? void 0 : placeholderHit.node.typography);
      irNode.attrs = buildAttrs(kind, names, placeholder, irNode.className);
      return;
    }
    irNode.tag = "div";
    const controlClass = sanitizeClassName("field", `${node.id}:input`, irNode.className, existingNamesSet);
    const control = {
      id: `${node.id}:input`,
      name: `${node.name} field`,
      className: controlClass,
      tag: kind,
      type: kind === "input" ? "INPUT" : kind === "select" ? "SELECT" : "TEXTAREA",
      layout: nestedControlLayout(placeholderHit == null ? void 0 : placeholderHit.node.layout),
      visual: { background: "transparent", border: "none" },
      typography: inputTypography(placeholderHit == null ? void 0 : placeholderHit.node.typography),
      // The name belongs to the field, not to the synthetic control's CSS class.
      attrs: buildAttrs(kind, names, placeholder, irNode.className),
      children: options
    };
    if (placeholderHit) {
      placeholderHit.list.splice(placeholderHit.index, 1, control);
    } else {
      irNode.children.push(control);
    }
  }
  function applyCheckableSemantics(irNode, kind, node, existingNamesSet) {
    var _a, _b;
    const hits = collectTextHits(irNode.children, true);
    const label = ((_b = (_a = pickPlaceholder(hits)) == null ? void 0 : _a.node.text) != null ? _b : "").trim();
    const names = componentAwareNames(node);
    if (node.type === "INSTANCE") {
      const instance = node;
      let addedPropertyValue = false;
      try {
        const properties = instance.componentProperties;
        for (const property of Object.values(properties != null ? properties : {})) {
          if (typeof property.value === "string") {
            names.push(property.value.toLowerCase());
            addedPropertyValue = true;
          }
        }
      } catch {
      }
      if (!addedPropertyValue) {
        try {
          const variants = instance.variantProperties;
          if (variants) names.push(...Object.values(variants).map((value2) => value2.toLowerCase()));
        } catch {
        }
      }
    }
    const name = kind === "radio" ? radioGroupName(node, "radio") : fieldName(irNode.className);
    const value = choiceValue(irNode.className, label);
    const attrs = {
      type: kind === "switch" ? "checkbox" : kind,
      name,
      value
    };
    if (kind === "switch") attrs.role = "switch";
    if (names.some((candidate) => CHECKED_NAME_RE.test(candidate))) attrs.checked = "checked";
    irNode.tag = "label";
    if (!irNode.layout.display) irNode.layout.display = "block";
    if (!irNode.layout.position) irNode.layout.position = "relative";
    const controlClass = sanitizeClassName(
      "control",
      `${node.id}:control`,
      irNode.className,
      existingNamesSet
    );
    const control = {
      id: `${node.id}:control`,
      name: `${node.name} control`,
      className: controlClass,
      tag: "input",
      type: "INPUT",
      layout: {
        position: "absolute",
        left: "0px",
        top: "0px",
        width: "1px",
        height: "1px",
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        boxSizing: "border-box",
        overflow: "hidden"
      },
      visual: { opacity: 0, clipPath: "inset(50%)" },
      attrs,
      children: []
    };
    irNode.children.unshift(control);
  }

  // engines/fig-engine/vendor/html-generator/src/plugin/converter/masks.ts
  function isMaskNode(node) {
    return node.isMask === true;
  }
  function maskClipsFor(siblings, format) {
    const clips = /* @__PURE__ */ new Map();
    let mask = null;
    for (const sibling of siblings) {
      const node = sibling;
      if (node.isMask === true) {
        mask = node;
        continue;
      }
      if (!mask) continue;
      const clip = clipFor(mask, node, format);
      if (clip.clipPath !== void 0 || clip.alpha < 1) {
        clips.set(node.id, clip);
      }
    }
    return clips;
  }
  function clipFor(mask, sibling, format) {
    const alpha = maskAlpha(mask);
    const maskW = num(mask.width);
    const maskH = num(mask.height);
    const boxW = num(sibling.width);
    const boxH = num(sibling.height);
    if (maskW <= 0 || maskH <= 0 || boxW <= 0 || boxH <= 0) return { alpha };
    const { dx, dy } = offsetBetween(mask, sibling);
    if (mask.type === "ELLIPSE") {
      const rx = len(format, maskW / 2);
      const ry = len(format, maskH / 2);
      const cx = len(format, dx + maskW / 2);
      const cy = len(format, dy + maskH / 2);
      return { clipPath: `ellipse(${rx} ${ry} at ${cx} ${cy})`, alpha };
    }
    const raw = {
      top: dy,
      right: boxW - (dx + maskW),
      bottom: boxH - (dy + maskH),
      left: dx
    };
    const inset = {
      top: Math.max(0, raw.top),
      right: Math.max(0, raw.right),
      bottom: Math.max(0, raw.bottom),
      left: Math.max(0, raw.left)
    };
    const radii = cornerRadii(mask, format, {
      top: raw.top < 0,
      right: raw.right < 0,
      bottom: raw.bottom < 0,
      left: raw.left < 0
    });
    const containsSibling = inset.top === 0 && inset.right === 0 && inset.bottom === 0 && inset.left === 0;
    if (containsSibling && !radii) return { alpha };
    const sides = [inset.top, inset.right, inset.bottom, inset.left].map((value) => len(format, value)).join(" ");
    return { clipPath: `inset(${sides}${radii ? ` round ${radii}` : ""})`, alpha };
  }
  function cornerRadii(mask, format, clipped) {
    const uniform = typeof mask.cornerRadius === "number" ? mask.cornerRadius : 0;
    const corner = (value) => typeof value === "number" ? value : uniform;
    let tl = corner(mask.topLeftRadius);
    let tr = corner(mask.topRightRadius);
    let br = corner(mask.bottomRightRadius);
    let bl = corner(mask.bottomLeftRadius);
    if (clipped.top || clipped.left) tl = 0;
    if (clipped.top || clipped.right) tr = 0;
    if (clipped.bottom || clipped.right) br = 0;
    if (clipped.bottom || clipped.left) bl = 0;
    if (tl <= 0 && tr <= 0 && br <= 0 && bl <= 0) return null;
    if (tl === tr && tr === br && br === bl) return len(format, tl);
    return [tl, tr, br, bl].map((value) => len(format, value)).join(" ");
  }
  function maskAlpha(mask) {
    var _a, _b;
    const type = (_a = mask.maskType) != null ? _a : "ALPHA";
    if (type === "VECTOR") return 1;
    const nodeOpacity = clamp01(typeof mask.opacity === "number" ? mask.opacity : 1);
    const fills = Array.isArray(mask.fills) ? mask.fills : [];
    const fill = fills.find((paint) => paint && paint.visible !== false);
    if (!fill || fill.type !== "SOLID") return nodeOpacity;
    const color = fill.color;
    const paintAlpha = clamp01(((_b = color.a) != null ? _b : 1) * (typeof fill.opacity === "number" ? fill.opacity : 1));
    const luminance = type === "LUMINANCE" ? 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b : 1;
    return clamp01(paintAlpha * luminance * nodeOpacity);
  }
  function offsetBetween(mask, sibling) {
    const maskOrigin = absoluteOrigin(mask);
    const siblingOrigin = absoluteOrigin(sibling);
    if (maskOrigin && siblingOrigin) {
      return { dx: maskOrigin.x - siblingOrigin.x, dy: maskOrigin.y - siblingOrigin.y };
    }
    return { dx: num(mask.x) - num(sibling.x), dy: num(mask.y) - num(sibling.y) };
  }
  function absoluteOrigin(node) {
    const transform = node.absoluteTransform;
    if (Array.isArray(transform) && Array.isArray(transform[0]) && Array.isArray(transform[1])) {
      const x = transform[0][2];
      const y = transform[1][2];
      if (typeof x === "number" && typeof y === "number") return { x, y };
    }
    const box = node.absoluteBoundingBox;
    if (box && typeof box.x === "number" && typeof box.y === "number") {
      return { x: box.x, y: box.y };
    }
    return null;
  }
  function len(format, px) {
    const rounded = Math.round(px * 100) / 100;
    return rounded === 0 ? "0" : format(rounded);
  }
  function num(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  }
  function clamp01(value) {
    if (!Number.isFinite(value)) return 1;
    return Math.min(1, Math.max(0, value));
  }

  // engines/fig-engine/vendor/html-generator/src/shared/tabular.ts
  var NUMERIC_NOISE = /[\s.,%$€£¥+−\-–—/():;'"]/g;
  var DIGITS = /[0-9\u0660-\u0669\u06F0-\u06F9]/;
  function isNumericText(text) {
    if (!text) return false;
    const stripped = text.replace(NUMERIC_NOISE, "");
    if (stripped.length === 0) return false;
    return DIGITS.test(stripped) && !/[^\d\u0660-\u0669\u06F0-\u06F9]/.test(stripped);
  }
  function textOf(node) {
    var _a;
    if (node.text) return node.text;
    const segments = (_a = node.typography) == null ? void 0 : _a.segments;
    if (!segments || segments.length === 0) return "";
    return segments.map((segment) => segment.text).join("");
  }
  function widthOf(node) {
    var _a;
    const width = (_a = node.layout.width) != null ? _a : node.layout.minWidth;
    return typeof width === "string" && width.length > 0 ? width : null;
  }
  function textsUnder(node, out = []) {
    const own = textOf(node);
    if (own) out.push(own);
    for (const child of node.children) textsUnder(child, out);
    return out;
  }
  function looksTabular(node) {
    const rows = node.children;
    if (rows.length < TABULAR_MIN_ROWS) return false;
    const stacked = node.layout.display === "grid" || node.layout.display === "flex" && node.layout.flexDirection !== "row";
    if (!stacked) return false;
    const columns = rows[0].children.length;
    if (columns < TABULAR_MIN_COLUMNS) return false;
    const rowWidth = widthOf(rows[0]);
    if (!rowWidth) return false;
    for (const row of rows) {
      if (row.children.length !== columns) return false;
      if (widthOf(row) !== rowWidth) return false;
    }
    for (let column = 0; column < columns; column += 1) {
      const cellWidth = widthOf(rows[0].children[column]);
      if (!cellWidth) return false;
      for (const row of rows) {
        if (widthOf(row.children[column]) !== cellWidth) return false;
      }
    }
    const texts = rows.flatMap((row) => textsUnder(row)).filter((text) => text.trim().length > 0);
    if (texts.length === 0) return false;
    const numeric = texts.filter(isNumericText).length;
    return numeric / texts.length >= TABULAR_MIN_NUMERIC_SHARE;
  }

  // engines/fig-engine/vendor/html-generator/src/plugin/converter/assets.ts
  var ASSET_NAME_PATTERN = /(^|[-_\s])(icon|ic|arrow|chevron|close|dismiss|cross|cancel|x|search|check|menu|settings|bell|heart|star|trash|edit|share|filter|back|illustration|graphic|image|logo|badge|qr|scan|barcode|تصویر|آیکون|لوگو|بارکد|کیو[-_\s]?آر)([-_\s]|$)/;
  function hasBlurEffect(node) {
    if ("effects" in node && Array.isArray(node.effects)) {
      if (node.effects.some(
        (e) => e.visible !== false && (e.type === "LAYER_BLUR" || e.type === "BACKGROUND_BLUR" || e.type === "TEXTURE" || e.type === "NOISE")
      )) {
        return true;
      }
    }
    const mainComp = getMainComponent(node);
    if (mainComp && "effects" in mainComp && Array.isArray(mainComp.effects)) {
      if (mainComp.effects.some(
        (e) => e.visible !== false && (e.type === "LAYER_BLUR" || e.type === "BACKGROUND_BLUR" || e.type === "TEXTURE" || e.type === "NOISE")
      )) {
        return true;
      }
    }
    if ("children" in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        if (child.visible !== false && hasBlurEffect(child)) {
          return true;
        }
      }
    }
    return false;
  }
  function hasImageDescendant(node) {
    if (hasImageFill(node)) return true;
    if ("children" in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        if (hasImageDescendant(child)) return true;
      }
    }
    return false;
  }
  function hasTextDescendant(node) {
    if (node.type === "TEXT") return true;
    if ("children" in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        if (hasTextDescendant(child)) return true;
      }
    }
    return false;
  }
  function shouldExportAsSingleVector(node, isRoot = false) {
    if (isRoot) return false;
    if (hasImageDescendant(node)) return false;
    const isLine = node.type === "LINE";
    const isVector = node.type === "VECTOR";
    if (isLine || isVector) {
      const rot = Math.abs(Math.round("rotation" in node && typeof node.rotation === "number" ? node.rotation : 0));
      const isOrthogonal = rot % 90 === 0;
      const w = "width" in node && typeof node.width === "number" ? node.width : 0;
      const h = "height" in node && typeof node.height === "number" ? node.height : 0;
      if (isLine) {
        if (isOrthogonal) {
          return false;
        }
        return true;
      }
      if (isVector && isOrthogonal) {
        const isDividerNamed = /^(line|divider|separator|rule|border|stroke|خط|جداکننده)/i.test(node.name.trim());
        const isHorizontalDivider = h <= 1 && w >= 10 || isDividerNamed && h <= 2 || h === 0 && w > 0;
        const isVerticalDivider = w <= 1 && h >= 10 || isDividerNamed && w <= 2 || w === 0 && h > 0;
        if (isHorizontalDivider || isVerticalDivider || h === 0 || w === 0) {
          return false;
        }
      }
    }
    if (node.type === "VECTOR" || node.type === "STAR" || node.type === "POLYGON" || node.type === "BOOLEAN_OPERATION") {
      return true;
    }
    if (node.type === "ELLIPSE") {
      const ellipse = node;
      if ("arcData" in ellipse && ellipse.arcData) {
        const sweep = Math.abs(ellipse.arcData.endingAngle - ellipse.arcData.startingAngle);
        if (ellipse.arcData.innerRadius > 0 || sweep > 1e-3 && sweep < 2 * Math.PI - 0.01) {
          return true;
        }
      }
    }
    const name = node.name.toLowerCase();
    if (node.type === "GROUP" || node.type === "FRAME" || node.type === "INSTANCE") {
      if (hasBlurEffect(node)) {
        return false;
      }
      if ("children" in node && node.children.length > 1) {
        const hasShapeChild = node.children.some(
          (c) => c.visible !== false && (c.type === "RECTANGLE" || c.type === "ELLIPSE")
        );
        const hasIconChild = node.children.some(
          (c) => c.visible !== false && (c.type === "INSTANCE" || c.type === "GROUP" || c.type === "VECTOR")
        );
        if (hasShapeChild && hasIconChild) {
          return false;
        }
      }
      if (ASSET_NAME_PATTERN.test(name)) {
        if (!hasTextDescendant(node)) {
          return true;
        }
      }
      if ("children" in node && node.children.length > 0) {
        if (!hasTextDescendant(node)) {
          if (node.type === "GROUP") {
            return true;
          }
          if (node.width <= 48 && node.height <= 48) {
            const hasVectorChild = node.children.some(
              (c) => c.type === "VECTOR" || c.type === "BOOLEAN_OPERATION" || c.type === "STAR" || c.type === "LINE" || c.type === "POLYGON" || c.type === "GROUP"
            );
            if (hasVectorChild) {
              return true;
            }
          }
          if ("layoutMode" in node && node.layoutMode === "NONE") {
            const isContainerName = /(button|btn|card|modal|dialog|container|input|box|row|header|body|footer|panel|pill|tab|state-layer|core)/.test(name);
            if (!isContainerName) {
              const allChildrenAreShapes = node.children.every(
                (c) => c.type === "VECTOR" || c.type === "BOOLEAN_OPERATION" || c.type === "STAR" || c.type === "LINE" || c.type === "POLYGON" || c.type === "ELLIPSE" || c.type === "RECTANGLE" || c.type === "GROUP"
              );
              if (allChildrenAreShapes && node.width <= MAX_AUTO_SVG_SIZE && node.height <= MAX_AUTO_SVG_SIZE) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }
  function hasImageFill(node) {
    if ("fills" in node && Array.isArray(node.fills)) {
      return node.fills.some((f) => f.visible !== false && f.type === "IMAGE");
    }
    return false;
  }
  async function exportVectorAsSvg(node) {
    try {
      let bytes;
      try {
        bytes = await node.exportAsync({
          format: "SVG",
          svgIdAttribute: false,
          svgOutlineText: true,
          useAbsoluteBounds: true
        });
      } catch {
        bytes = await node.exportAsync({
          format: "SVG",
          svgIdAttribute: false,
          svgOutlineText: true
        });
      }
      const svgString = uint8ArrayToUtf8(bytes);
      return {
        type: "svg",
        content: svgString,
        filename: `${node.name.toLowerCase().replace(/[^a-z0-9]/g, "-") || "vector"}.svg`
      };
    } catch (err) {
      console.warn(`Failed to export vector node ${node.name}:`, err);
      return null;
    }
  }
  function getSmartImageExportScale(node, options) {
    if (options && typeof options.imageScale === "number" && options.imageScale > 0) {
      return options.imageScale;
    }
    const w = "width" in node && typeof node.width === "number" ? node.width : 0;
    const h = "height" in node && typeof node.height === "number" ? node.height : 0;
    const maxDim = Math.max(w, h);
    if (maxDim <= 0) {
      return 2;
    }
    if (maxDim <= 160) {
      return 3;
    }
    if (maxDim <= 800) {
      return 2;
    }
    if (maxDim * 2 <= 2560) {
      return 2;
    }
    const calculated = Math.round(2560 / maxDim * 10) / 10;
    return Math.max(1.5, Math.min(2, calculated));
  }
  var imageExports = /* @__PURE__ */ new Map();
  async function exportNodeAsImage(node, options) {
    const key = exportKey(node, options);
    if (key === null) return exportImageOnce(node, options);
    const cached = imageExports.get(key);
    if (cached) return cached;
    const pending = exportImageOnce(node, options);
    imageExports.set(key, pending);
    return pending;
  }
  function exportKey(node, options) {
    const id2 = node.id;
    if (typeof id2 !== "string" || id2.length === 0) return null;
    const scale = typeof (options == null ? void 0 : options.imageScale) === "number" ? options.imageScale : "auto";
    return `${id2}\0${scale}`;
  }
  async function exportImageOnce(node, options) {
    try {
      const scale = getSmartImageExportScale(node, options);
      let bytes = null;
      try {
        bytes = await node.exportAsync({
          format: "PNG",
          constraint: { type: "SCALE", value: scale }
        });
      } catch {
        if (scale > 2) {
          try {
            bytes = await node.exportAsync({
              format: "PNG",
              constraint: { type: "SCALE", value: 2 }
            });
          } catch {
            try {
              bytes = await node.exportAsync({
                format: "PNG",
                constraint: { type: "SCALE", value: 1 }
              });
            } catch {
            }
          }
        } else {
          try {
            bytes = await node.exportAsync({
              format: "PNG",
              constraint: { type: "SCALE", value: 1 }
            });
          } catch {
          }
        }
      }
      if ((!bytes || bytes.length === 0) && "fills" in node && Array.isArray(node.fills)) {
        try {
          const imageFill = node.fills.find(
            (f) => f && f.visible !== false && f.type === "IMAGE" && f.imageHash
          );
          if (imageFill && typeof figma !== "undefined" && typeof figma.getImageByHash === "function") {
            const img = figma.getImageByHash(imageFill.imageHash);
            if (img && typeof img.getBytesAsync === "function") {
              bytes = await img.getBytesAsync();
            }
          }
        } catch (hashErr) {
          console.warn(`[assets] getImageByHash fallback failed for ${node.name}:`, hashErr);
        }
      }
      if (!bytes || bytes.length === 0) {
        return null;
      }
      const base64 = uint8ArrayToBase64(bytes);
      const dataUrl = `data:image/png;base64,${base64}`;
      return {
        type: "image",
        mimeType: "image/png",
        content: dataUrl,
        filename: `${node.name.toLowerCase().replace(/[^a-z0-9]/g, "-") || "image"}.png`
      };
    } catch (err) {
      console.warn(`Failed to export image node ${node.name}:`, err);
      return null;
    }
  }

  // engines/fig-engine/vendor/html-generator/src/plugin/converter/component-metadata.ts
  function read(get) {
    try {
      return get();
    } catch {
      return void 0;
    }
  }
  function isPropertyValue(value) {
    return typeof value === "string" || typeof value === "boolean";
  }
  function recordOf(values) {
    return values && typeof values === "object" && !Array.isArray(values) ? values : void 0;
  }
  function stringRecord(values) {
    const record = recordOf(values);
    if (!record) return void 0;
    const output = {};
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === "string" && value.length > 0) output[key] = value;
    }
    return Object.keys(output).length > 0 ? output : void 0;
  }
  function componentPropertyRecord(values) {
    var _a;
    const record = recordOf(values);
    if (!record) return void 0;
    const output = {};
    for (const [key, raw] of Object.entries(record)) {
      const value = (_a = recordOf(raw)) == null ? void 0 : _a.value;
      if (isPropertyValue(value)) output[key] = value;
    }
    return Object.keys(output).length > 0 ? output : void 0;
  }
  function propertyDefinitions(values) {
    const record = recordOf(values);
    if (!record) return void 0;
    const output = {};
    for (const [key, raw] of Object.entries(record)) {
      const definition = recordOf(raw);
      if (!definition || typeof definition.type !== "string") continue;
      const normalized = { type: definition.type };
      if (isPropertyValue(definition.defaultValue)) normalized.defaultValue = definition.defaultValue;
      if (Array.isArray(definition.variantOptions)) {
        const values2 = definition.variantOptions.filter((value) => typeof value === "string");
        if (values2.length > 0) normalized.variantOptions = values2;
      }
      output[key] = normalized;
    }
    return Object.keys(output).length > 0 ? output : void 0;
  }
  function legacyVariantDefinitions(componentSet) {
    var _a;
    if (!componentSet) return void 0;
    const groups = recordOf(read(() => componentSet.variantGroupProperties));
    if (!groups) return void 0;
    const output = {};
    for (const [name, raw] of Object.entries(groups)) {
      const values = (_a = recordOf(raw)) == null ? void 0 : _a.values;
      if (!Array.isArray(values)) continue;
      const variantOptions = values.filter((value) => typeof value === "string");
      if (variantOptions.length > 0) {
        output[name] = { type: "VARIANT", variantOptions };
      }
    }
    return Object.keys(output).length > 0 ? output : void 0;
  }
  function mergeStrings(first, second) {
    const merged = { ...first != null ? first : {}, ...second != null ? second : {} };
    return Object.keys(merged).length > 0 ? merged : void 0;
  }
  function readComponentMetadata(instance, master) {
    var _a, _b, _c;
    const parent = read(() => master.parent);
    const componentSet = (parent == null ? void 0 : parent.type) === "COMPONENT_SET" ? parent : void 0;
    const family = componentSet != null ? componentSet : master;
    const legacyInstanceVariants = stringRecord(read(() => instance.variantProperties));
    const modernProperties = read(() => instance.componentProperties);
    const modernVariantProperties = {};
    if (modernProperties && typeof modernProperties === "object") {
      for (const [key, raw] of Object.entries(modernProperties)) {
        const value = (_a = recordOf(raw)) == null ? void 0 : _a.value;
        const type = (_b = recordOf(raw)) == null ? void 0 : _b.type;
        if (type === "VARIANT" && typeof value === "string") modernVariantProperties[key] = value;
      }
    }
    const componentProperties = componentPropertyRecord(modernProperties);
    const variantProperties = mergeStrings(legacyInstanceVariants, stringRecord(modernVariantProperties));
    const definitions = (_c = propertyDefinitions(
      read(() => family.componentPropertyDefinitions)
    )) != null ? _c : legacyVariantDefinitions(componentSet);
    const result = {
      id: master.id,
      name: master.name,
      familyId: family.id,
      familyName: family.name
    };
    if (variantProperties) result.variantProperties = variantProperties;
    if (componentProperties) result.componentProperties = componentProperties;
    if (definitions) result.propertyDefinitions = definitions;
    return result;
  }

  // engines/fig-engine/vendor/html-generator/src/plugin/converter/index.ts
  async function convertNodeToIR(node, parent, options, tokenRegistry, parentClassName, existingNamesSet = /* @__PURE__ */ new Set(), containerWidthPx) {
    const ir = await convertNodeBody(
      node,
      parent,
      options,
      tokenRegistry,
      parentClassName,
      existingNamesSet,
      containerWidthPx
    );
    if (!ir) return null;
    if (tokenRegistry) {
      const themeResolver = new TokenResolver(tokenRegistry, { node, parent });
      const themeClasses = themeResolver.themeClassesFor(node);
      if (themeClasses.length > 0) ir.themeClasses = themeClasses;
    }
    if (node.type === "INSTANCE") {
      const master = node._resolvedMainComponent;
      if (master && master.id) {
        ir.componentRef = readComponentMetadata(node, master);
      }
    }
    return ir;
  }
  async function convertNodeBody(node, parent, options, tokenRegistry, parentClassName, existingNamesSet = /* @__PURE__ */ new Set(), containerWidthPx) {
    var _a;
    if (!node.visible) {
      return null;
    }
    if (node.type === "INSTANCE") {
      const inst = node;
      if (typeof inst.getMainComponentAsync === "function") {
        try {
          const resolved = await inst.getMainComponentAsync();
          if (resolved) {
            inst._resolvedMainComponent = resolved;
          }
        } catch {
        }
      } else {
        try {
          if ("mainComponent" in inst && inst.mainComponent) {
            inst._resolvedMainComponent = inst.mainComponent;
          }
        } catch {
        }
      }
    }
    const className = sanitizeClassName(node.name, node.id, parentClassName, existingNamesSet);
    const tag2 = detectSemanticTag(node, options.semanticTags);
    const isRoot = parent === null;
    const nodeWidthPx = "width" in node && typeof node.width === "number" ? node.width : 0;
    const typeContainerWidth = isRoot || isStackingRegionRow(node, options) ? nodeWidthPx : containerWidthPx != null ? containerWidthPx : nodeWidthPx;
    if (shouldExportAsSingleVector(node, isRoot)) {
      const layout2 = extractLayout(node, parent, options, tokenRegistry);
      const rawVisual = extractVisualStyles(node, options, tokenRegistry, parent);
      const visual2 = {};
      if (rawVisual.opacity !== void 0) visual2.opacity = rawVisual.opacity;
      if (rawVisual.transform) visual2.transform = rawVisual.transform;
      if (rawVisual.mixBlendMode) visual2.mixBlendMode = rawVisual.mixBlendMode;
      const asset = await exportVectorAsSvg(node);
      return {
        id: node.id,
        name: node.name,
        className,
        tag: "div",
        type: node.type,
        layout: layout2,
        visual: visual2,
        asset: asset || void 0,
        children: []
      };
    }
    if (hasImageFill(node) && (!("children" in node) || node.children.length === 0)) {
      const layout2 = extractLayout(node, parent, options, tokenRegistry);
      const visual2 = extractVisualStyles(node, options, tokenRegistry, parent);
      delete visual2.gradientBorder;
      const asset = await exportNodeAsImage(node, options);
      if (!asset) {
        return {
          id: node.id,
          name: node.name,
          className,
          tag: "div",
          type: node.type,
          layout: layout2,
          visual: visual2,
          children: []
        };
      }
      delete visual2.background;
      delete visual2.backgroundSize;
      delete visual2.backgroundRepeat;
      delete visual2.backgroundPosition;
      const isFullBleedOfParent = Boolean(
        parent && "width" in parent && "height" in parent && Math.abs(node.width - parent.width) < 1 && Math.abs(node.height - parent.height) < 1
      );
      const parentHasVisibleStroke = Boolean(
        parent && "strokes" in parent && Array.isArray(parent.strokes) && parent.strokes.some((s) => s.visible !== false)
      );
      if (isFullBleedOfParent && parentHasVisibleStroke) {
        delete visual2.border;
        delete visual2.borderTop;
        delete visual2.borderRight;
        delete visual2.borderBottom;
        delete visual2.borderLeft;
        delete visual2.outline;
        if (visual2.boxShadow && visual2.boxShadow.startsWith("0 0 0 ")) {
          delete visual2.boxShadow;
        }
      }
      const isQrOrBarcode = /(qr|scan|barcode|بارکد|کیو[-_\s]?آر)/i.test(node.name) || Boolean(parent && /(qr|scan|barcode|بارکد|کیو[-_\s]?آر)/i.test(parent.name));
      if (isQrOrBarcode) {
        layout2.objectFit = "contain";
        const ratio = node.width > 0 && node.height > 0 ? node.width / node.height : 1;
        if (ratio >= 0.75 && ratio <= 1.33) {
          layout2.aspectRatio = "1 / 1";
        }
      }
      let parentInnerW = 0;
      if (parent && "width" in parent && typeof parent.width === "number") {
        const pl = "paddingLeft" in parent && typeof parent.paddingLeft === "number" ? parent.paddingLeft : 0;
        const pr = "paddingRight" in parent && typeof parent.paddingRight === "number" ? parent.paddingRight : 0;
        parentInnerW = parent.width - pl - pr;
      }
      const matchesParentWidth = parentInnerW > 0 && spansContainer(node.width, parentInnerW);
      const isQrInContainer = isQrOrBarcode && parentInnerW > 0 && spansContainer(node.width, parentInnerW);
      const figmaW = formatUnit(node.width, options.useRem, options.baseFontSize);
      const figmaH = formatUnit(node.height, options.useRem, options.baseFontSize);
      const isCoveringBackground = layout2.position === "absolute" && layout2.width === "100%" && layout2.height === "100%";
      const isCircleImage = node.type === "ELLIPSE" || Math.abs(node.width - node.height) <= 1 && (/(avatar|آواتار|circle|دایره|badge|icon|ic[-_]|point|dot)/i.test((node.name || "").trim()) || Boolean(parent && /(avatar|آواتار)/i.test((parent.name || "").trim())) || "cornerRadius" in node && typeof node.cornerRadius === "number" && node.cornerRadius >= node.width / 2 - 2);
      if (isCircleImage) {
        layout2.width = figmaW;
        layout2.height = figmaH;
        layout2.minWidth = figmaW;
        layout2.minHeight = figmaH;
        layout2.maxWidth = figmaW;
        layout2.aspectRatio = "1 / 1";
        layout2.objectFit = "cover";
        layout2.flexShrink = 0;
        delete layout2.alignSelf;
        visual2.borderRadius = "50%";
      } else if (isCoveringBackground) {
        layout2.width = "100%";
        layout2.height = "100%";
        layout2.maxWidth = "100%";
        layout2.objectFit = "cover";
        if (parent && ("cornerRadius" in parent || "borderRadius" in parent)) {
          visual2.borderRadius = "inherit";
        }
      } else if (matchesParentWidth || isQrInContainer) {
        layout2.width = "100%";
        layout2.maxWidth = options.responsive && matchesParentWidth ? "100%" : figmaW;
        layout2.alignSelf = "stretch";
        if (layout2.aspectRatio) {
          layout2.height = "auto";
        }
      } else {
        layout2.width = figmaW;
        layout2.maxWidth = figmaW;
        if (!layout2.aspectRatio) {
          layout2.height = figmaH;
        }
      }
      if (!layout2.aspectRatio && node.width > 0 && node.height > 0) {
        const w = Math.round(node.width / node.height * 1e4) / 100;
        layout2.aspectRatio = `${w} / 1`;
      }
      if (layout2.aspectRatio && options.responsive && !isCoveringBackground) {
        layout2.height = "auto";
      }
      if (!layout2.maxWidth) {
        layout2.maxWidth = figmaW;
      }
      return {
        id: node.id,
        name: node.name,
        className,
        tag: "img",
        type: node.type,
        layout: layout2,
        visual: visual2,
        asset: asset || void 0,
        children: []
      };
    }
    if (node.type === "TEXT") {
      const textNode = node;
      const layout2 = extractLayout(node, parent, options, tokenRegistry);
      const visual2 = extractVisualStyles(node, options, tokenRegistry, parent);
      delete visual2.background;
      const typography = extractTypography(textNode, options, tokenRegistry, typeContainerWidth);
      const finalTag = typography.isList ? typography.listType === "ordered" ? "ol" : "ul" : tag2;
      const href = hyperlinkUrl(
        textNode.hyperlink
      );
      return {
        id: node.id,
        name: node.name,
        className,
        tag: finalTag,
        type: node.type,
        layout: layout2,
        visual: visual2,
        typography,
        text: textNode.characters,
        href: href != null ? href : void 0,
        children: []
      };
    }
    const layout = extractLayout(node, parent, options, tokenRegistry);
    const visual = extractVisualStyles(node, options, tokenRegistry, parent);
    let containerAsset;
    let childrenToConvert = "children" in node && Array.isArray(node.children) ? [...node.children] : [];
    const maskClips = childrenToConvert.some(isMaskNode) ? maskClipsFor(childrenToConvert, (px) => formatUnit(px, options.useRem, options.baseFontSize)) : null;
    if (maskClips) {
      childrenToConvert = childrenToConvert.filter((child) => !isMaskNode(child));
    }
    if (!visual.background && childrenToConvert.length > 0) {
      const parentW = "width" in node && typeof node.width === "number" ? node.width : 0;
      const parentH = "height" in node && typeof node.height === "number" ? node.height : 0;
      const isContainerFreeform = !("layoutMode" in node) || node.layoutMode === "NONE";
      while (childrenToConvert.length > 0 && parentW > 0 && parentH > 0) {
        const bgChild = childrenToConvert[0];
        if (!bgChild) break;
        const isChildAbsolute = bgChild.layoutPositioning === "ABSOLUTE";
        if (!isContainerFreeform && !isChildAbsolute) break;
        const childW = "width" in bgChild && typeof bgChild.width === "number" ? bgChild.width : 0;
        const childH = "height" in bgChild && typeof bgChild.height === "number" ? bgChild.height : 0;
        const childX = typeof bgChild.x === "number" ? bgChild.x : 0;
        const childY = typeof bgChild.y === "number" ? bgChild.y : 0;
        const coversParent = childW > 0 && childH > 0 && childX <= 4 && childY <= 4 && childX + childW >= parentW - 4 && childY + childH >= parentH - 4;
        const isLeafShape = bgChild.visible !== false && bgChild.type !== "TEXT" && (!("children" in bgChild) || !Array.isArray(bgChild.children) || bgChild.children.length === 0);
        const childFills = "fills" in bgChild && Array.isArray(bgChild.fills) ? bgChild.fills : [];
        const hasFills = childFills.some((f) => f && f.visible !== false);
        const hasNoStrokes = !("strokes" in bgChild && Array.isArray(bgChild.strokes) && bgChild.strokes.some((s) => s && s.visible !== false));
        const isMasked = (maskClips == null ? void 0 : maskClips.has(bgChild.id)) === true;
        const isCoveringBackdrop = coversParent && isLeafShape && hasFills && hasNoStrokes && !isMasked && (childrenToConvert.length > 1 || hasImageFill(bgChild) && childFills.filter((f) => f.visible !== false).length > 1);
        if (!isCoveringBackdrop) break;
        const bgVisual = extractVisualStyles(bgChild, options, tokenRegistry, node);
        let childBg = bgVisual.background;
        if (childBg && childBg.includes("__FIGMA_IMAGE_FILL__")) {
          const asset = await exportNodeAsImage(bgChild, options);
          if (asset) {
            containerAsset = asset;
            const size = childBg.includes("contain") ? "contain" : childBg.includes(":auto") ? "auto" : "cover";
            const repeat = size === "auto" ? "repeat" : "no-repeat";
            const imgLayer = `url("${asset.content}") center / ${size} ${repeat}`;
            childBg = childBg.replace(/__FIGMA_IMAGE_FILL__:[a-z]+/, imgLayer);
            visual.backgroundSize = size;
            visual.backgroundRepeat = repeat;
            visual.backgroundPosition = "center";
          } else {
            childBg = childBg.split(", ").filter((l) => !l.startsWith("__FIGMA_IMAGE_FILL__")).join(", ");
          }
        }
        if (childBg) {
          visual.background = visual.background ? `${childBg}, ${visual.background}` : childBg;
          if (bgVisual.opacity !== void 0 && visual.opacity === void 0) {
            visual.opacity = bgVisual.opacity;
          }
        }
        childrenToConvert.shift();
      }
    }
    if (visual.background && visual.background.includes("__FIGMA_IMAGE_FILL__")) {
      const asset = await exportNodeAsImage(node, options);
      if (asset) {
        containerAsset = asset;
        const size = visual.background.includes("contain") ? "contain" : visual.background.includes(":auto") ? "auto" : "cover";
        const repeat = size === "auto" ? "repeat" : "no-repeat";
        const imgLayer = `url("${asset.content}") center / ${size} ${repeat}`;
        visual.background = visual.background.replace(/__FIGMA_IMAGE_FILL__:[a-z]+/, imgLayer);
        visual.backgroundSize = size;
        visual.backgroundRepeat = repeat;
        visual.backgroundPosition = "center";
      } else {
        visual.background = visual.background.split(", ").filter((l) => !l.startsWith("__FIGMA_IMAGE_FILL__")).join(", ");
        if (!visual.background) delete visual.background;
      }
    }
    const irNode = {
      id: node.id,
      name: node.name,
      className,
      tag: tag2,
      type: node.type,
      layout,
      visual,
      asset: containerAsset,
      children: []
    };
    if (tag2 === "button") {
      irNode.attrs = { type: "button" };
    }
    if (childrenToConvert.length > 0) {
      const children = childrenToConvert;
      if (children.length <= 25) {
        const childPromises = children.map(
          (child) => convertNodeToIR(child, node, options, tokenRegistry, className, existingNamesSet, typeContainerWidth)
        );
        const childResults = await Promise.all(childPromises);
        irNode.children = childResults.filter((child) => child !== null);
      } else {
        const childResults = [];
        const BATCH_SIZE = 25;
        for (let i = 0; i < children.length; i += BATCH_SIZE) {
          const batch = children.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.all(
            batch.map(
              (child) => convertNodeToIR(child, node, options, tokenRegistry, className, existingNamesSet, typeContainerWidth)
            )
          );
          for (const res of batchResults) {
            childResults.push(res);
          }
          if (i + BATCH_SIZE < children.length) {
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }
        irNode.children = childResults.filter((child) => child !== null);
      }
    }
    if (maskClips) {
      applyMaskClips(irNode.children, maskClips);
    }
    if (needsIsolation(irNode.children)) {
      irNode.visual.isolation = "isolate";
    }
    if (looksTabular(irNode)) {
      irNode.typography = { ...(_a = irNode.typography) != null ? _a : {}, fontVariantNumeric: "tabular-nums" };
    }
    if (tag2 === "input") {
      const checkable = detectCheckableKind(node);
      if (checkable) {
        applyCheckableSemantics(irNode, checkable, node, existingNamesSet);
      } else {
        applyFormControlSemantics(irNode, tag2, node, existingNamesSet);
      }
    } else if (tag2 === "textarea" || tag2 === "select") {
      applyFormControlSemantics(irNode, tag2, node, existingNamesSet);
    }
    return irNode;
  }
  function applyMaskClips(children, clips) {
    for (const child of children) {
      const clip = clips.get(child.id);
      if (!clip) continue;
      if (clip.clipPath && !child.visual.clipPath) {
        child.visual.clipPath = clip.clipPath;
      }
      if (clip.alpha < 1) {
        const alpha = Math.round(clip.alpha * 1e3) / 1e3;
        const own = child.visual.opacity;
        if (typeof own === "number") {
          child.visual.opacity = Math.round(own * clip.alpha * 100) / 100;
        } else if (typeof own === "string") {
          child.visual.opacity = `calc(${own} * ${alpha})`;
        } else {
          child.visual.opacity = Math.round(clip.alpha * 100) / 100;
        }
      }
    }
  }

  // engines/fig-engine/vendor/html-generator/src/generator/css-generator.ts
  function layoutToCssDeclarations(layout, options) {
    const decs = [];
    if (layout.display) decs.push(`display: ${layout.display};`);
    if (layout.flexDirection) decs.push(`flex-direction: ${layout.flexDirection};`);
    if (layout.flexWrap) decs.push(`flex-wrap: ${layout.flexWrap};`);
    if (layout.justifyContent) decs.push(`justify-content: ${layout.justifyContent};`);
    if (layout.alignItems) decs.push(`align-items: ${layout.alignItems};`);
    if (layout.gridTemplateColumns) decs.push(`grid-template-columns: ${layout.gridTemplateColumns};`);
    if (layout.gridTemplateRows) decs.push(`grid-template-rows: ${layout.gridTemplateRows};`);
    if (layout.gridColumn) decs.push(`grid-column: ${layout.gridColumn};`);
    if (layout.gridRow) decs.push(`grid-row: ${layout.gridRow};`);
    if (layout.gap) decs.push(`gap: ${layout.gap};`);
    if (layout.rowGap) decs.push(`row-gap: ${layout.rowGap};`);
    if (layout.columnGap) decs.push(`column-gap: ${layout.columnGap};`);
    if (layout.padding) {
      const { top, right, bottom, left } = layout.padding;
      const u = (v) => typeof v === "string" ? v : formatUnit(v, options.useRem, options.baseFontSize);
      if (top === bottom && right === left && top === right) {
        decs.push(`padding: ${u(top)};`);
      } else if (top === bottom && right === left) {
        decs.push(`padding: ${u(top)} ${u(right)};`);
      } else {
        decs.push(`padding: ${u(top)} ${u(right)} ${u(bottom)} ${u(left)};`);
      }
    }
    if (layout.containerType) decs.push(`container-type: ${layout.containerType};`);
    if (layout.position) decs.push(`position: ${layout.position};`);
    if (layout.boxSizing) decs.push(`box-sizing: ${layout.boxSizing};`);
    if (layout.margin !== void 0) decs.push(`margin: ${layout.margin};`);
    if (layout.marginInline !== void 0) decs.push(`margin-inline: ${layout.marginInline};`);
    if (layout.marginLeft !== void 0) decs.push(`margin-left: ${layout.marginLeft};`);
    if (layout.marginRight !== void 0) decs.push(`margin-right: ${layout.marginRight};`);
    if (layout.marginTop !== void 0) decs.push(`margin-top: ${layout.marginTop};`);
    if (layout.marginBottom !== void 0) decs.push(`margin-bottom: ${layout.marginBottom};`);
    if (layout.left !== void 0) decs.push(`left: ${layout.left};`);
    if (layout.top !== void 0) decs.push(`top: ${layout.top};`);
    if (layout.right !== void 0) decs.push(`right: ${layout.right};`);
    if (layout.bottom !== void 0) decs.push(`bottom: ${layout.bottom};`);
    if (layout.width !== void 0) decs.push(`width: ${layout.width};`);
    if (layout.height !== void 0) decs.push(`height: ${layout.height};`);
    if (layout.minWidth !== void 0) decs.push(`min-width: ${layout.minWidth};`);
    if (layout.maxWidth !== void 0) decs.push(`max-width: ${layout.maxWidth};`);
    if (layout.minHeight !== void 0) decs.push(`min-height: ${layout.minHeight};`);
    if (layout.maxHeight !== void 0) decs.push(`max-height: ${layout.maxHeight};`);
    if (layout.flexGrow !== void 0) decs.push(`flex-grow: ${layout.flexGrow};`);
    if (layout.flexShrink !== void 0) decs.push(`flex-shrink: ${layout.flexShrink};`);
    if (layout.alignSelf !== void 0) decs.push(`align-self: ${layout.alignSelf};`);
    if (layout.overflow !== void 0) decs.push(`overflow: ${layout.overflow};`);
    if (layout.zIndex !== void 0) decs.push(`z-index: ${layout.zIndex};`);
    if (layout.direction !== void 0) decs.push(`direction: ${layout.direction};`);
    if (layout.flexBasis !== void 0) decs.push(`flex-basis: ${layout.flexBasis};`);
    if (layout.aspectRatio !== void 0) decs.push(`aspect-ratio: ${layout.aspectRatio};`);
    if (layout.objectFit !== void 0) decs.push(`object-fit: ${layout.objectFit};`);
    return decs;
  }
  function visualToCssDeclarations(visual, layoutTransform) {
    const decs = [];
    if (visual.background) decs.push(`background: ${visual.background};`);
    if (visual.backgroundSize) decs.push(`background-size: ${visual.backgroundSize};`);
    if (visual.backgroundRepeat) decs.push(`background-repeat: ${visual.backgroundRepeat};`);
    if (visual.backgroundPosition) decs.push(`background-position: ${visual.backgroundPosition};`);
    if (visual.borderRadius) decs.push(`border-radius: ${visual.borderRadius};`);
    if (visual.boxSizing) decs.push(`box-sizing: ${visual.boxSizing};`);
    if (visual.outline) decs.push(`outline: ${visual.outline};`);
    if (visual.outlineOffset) decs.push(`outline-offset: ${visual.outlineOffset};`);
    if (visual.border) decs.push(`border: ${visual.border};`);
    if (visual.borderTop) decs.push(`border-top: ${visual.borderTop};`);
    if (visual.borderRight) decs.push(`border-right: ${visual.borderRight};`);
    if (visual.borderBottom) decs.push(`border-bottom: ${visual.borderBottom};`);
    if (visual.borderLeft) decs.push(`border-left: ${visual.borderLeft};`);
    if (visual.boxShadow) decs.push(`box-shadow: ${visual.boxShadow};`);
    if (visual.textShadow) decs.push(`text-shadow: ${visual.textShadow};`);
    if (visual.opacity !== void 0) decs.push(`opacity: ${visual.opacity};`);
    if (visual.filter) decs.push(`filter: ${visual.filter};`);
    if (visual.backdropFilter) {
      decs.push(`backdrop-filter: ${visual.backdropFilter};`);
      decs.push(`-webkit-backdrop-filter: ${visual.backdropFilter};`);
    }
    if (visual.mixBlendMode) decs.push(`mix-blend-mode: ${visual.mixBlendMode};`);
    if (visual.isolation) decs.push(`isolation: ${visual.isolation};`);
    if (visual.clipPath) decs.push(`clip-path: ${visual.clipPath};`);
    const mergedTransform = [layoutTransform, visual.transform].filter(Boolean).join(" ");
    if (mergedTransform) decs.push(`transform: ${mergedTransform};`);
    return decs;
  }
  function typographyToCssDeclarations(typo) {
    if (!typo) return [];
    const decs = [];
    if (typo.fontFamily) decs.push(`font-family: ${typo.fontFamily};`);
    if (typo.fontSize) decs.push(`font-size: ${typo.fontSize};`);
    if (typo.fontWeight) decs.push(`font-weight: ${typo.fontWeight};`);
    if (typo.fontStyle) decs.push(`font-style: ${typo.fontStyle};`);
    if (typo.fontVariantNumeric) decs.push(`font-variant-numeric: ${typo.fontVariantNumeric};`);
    if (typo.lineHeight) decs.push(`line-height: ${typo.lineHeight};`);
    if (typo.letterSpacing && typo.letterSpacing !== "normal") decs.push(`letter-spacing: ${typo.letterSpacing};`);
    if (typo.textAlign) decs.push(`text-align: ${typo.textAlign};`);
    if (typo.color) decs.push(`color: ${typo.color};`);
    if (typo.textDecoration) decs.push(`text-decoration: ${typo.textDecoration};`);
    if (typo.textTransform) decs.push(`text-transform: ${typo.textTransform};`);
    if (typo.whiteSpace) decs.push(`white-space: ${typo.whiteSpace};`);
    if (typo.wordBreak) decs.push(`word-break: ${typo.wordBreak};`);
    if (typo.overflowWrap) decs.push(`overflow-wrap: ${typo.overflowWrap};`);
    if (typo.textOverflow) decs.push(`text-overflow: ${typo.textOverflow};`);
    if (typo.display) decs.push(`display: ${typo.display};`);
    if (typo.webkitLineClamp !== void 0) decs.push(`-webkit-line-clamp: ${typo.webkitLineClamp};`);
    if (typo.webkitBoxOrient) decs.push(`-webkit-box-orient: ${typo.webkitBoxOrient};`);
    if (typo.overflow) decs.push(`overflow: ${typo.overflow};`);
    if (typo.direction) {
      decs.push(`direction: ${typo.direction};`);
      decs.push("unicode-bidi: isolate;");
    }
    if (typo.isList) {
      decs.push("list-style: none;");
      decs.push("margin: 0;");
      decs.push("padding: 0;");
      decs.push("display: flex;");
      decs.push("flex-direction: column;");
      if (typo.listGap) decs.push(`gap: ${typo.listGap};`);
    }
    return decs;
  }
  function gradientBorderRule(className, ring) {
    const mask = "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)";
    return `.${className}::after {
  content: "";
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  border-radius: inherit;
  padding: ${ring.width};
  background: ${ring.image};
  -webkit-mask: ${mask};
  -webkit-mask-composite: xor;
  mask: ${mask};
  mask-composite: exclude;
  pointer-events: none;
}`;
  }
  function generateFontFaceRules(options, forZip = false) {
    if (!options.customFonts || options.customFonts.length === 0) {
      return "";
    }
    const rules = ["/* --- Custom Typography (@font-face) --- */"];
    const twinSeen = /* @__PURE__ */ new Set();
    for (const font of options.customFonts) {
      const fontStyle = font.style.toLowerCase().includes("italic") ? "italic" : "normal";
      const isVar = font.isVariable || String(font.weight).includes(" ") || font.filename.toLowerCase().includes("vf") || font.filename.toLowerCase().includes("variable") || font.family.toLowerCase().includes("vf") || font.family.toLowerCase().includes("variable");
      const fontWeight = isVar ? "100 1000" : font.weight || 400;
      const fmt = font.format;
      const formatCss = fmt === "ttf" ? "truetype" : fmt === "otf" ? "opentype" : font.format;
      const mimeFormat = fmt === "ttf" ? "font/truetype" : fmt === "otf" ? "font/opentype" : `font/${font.format}`;
      const isBase64 = !forZip && options.embedFontsBase64 !== false;
      const fontUrl = isBase64 ? font.base64.startsWith("data:") ? font.base64 : `data:${mimeFormat};base64,${font.base64}` : `./fonts/${font.filename}`;
      let src = `url('${fontUrl}') format('${formatCss}')`;
      if (isVar) {
        if (formatCss === "woff2") {
          src = `url('${fontUrl}') format('woff2-variations'), url('${fontUrl}') format('woff2')`;
        } else if (formatCss === "truetype" || formatCss === "opentype") {
          src = `url('${fontUrl}') format('${formatCss}-variations'), url('${fontUrl}') format('${formatCss}')`;
        }
      }
      const familiesToRegister = /* @__PURE__ */ new Set();
      familiesToRegister.add(font.family);
      const baseClean = font.family.replace(/\s*vf\s*$/i, "").trim();
      if (baseClean) {
        familiesToRegister.add(baseClean);
        familiesToRegister.add(baseClean.replace(/\s+/g, ""));
      }
      if (isVar || /vf\b/i.test(font.family)) {
        if (baseClean) {
          familiesToRegister.add(`${baseClean} VF`);
          familiesToRegister.add(`${baseClean}VF`);
          familiesToRegister.add(`${baseClean.replace(/\s+/g, "")} VF`);
          familiesToRegister.add(`${baseClean.replace(/\s+/g, "")}VF`);
        }
      }
      for (const fam of familiesToRegister) {
        rules.push(`@font-face {
  font-family: '${fam}';
  font-style: ${fontStyle};
  font-weight: ${fontWeight};
  font-display: swap;
  src: ${src};
}`);
      }
      if (!twinSeen.has(font.family)) {
        twinSeen.add(font.family);
        const overrides = overridesFor(font.family, font.base64);
        if (overrides) {
          rules.push(fallbackFaceCss(font.family, overrides));
        }
      }
    }
    return rules.join("\n\n");
  }
  function resetBlock(isRtl, responsive) {
    const fontFamily = isRtl ? FONT_STACK_RTL : FONT_STACK_LTR;
    const bodyLayout = responsive ? `
body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
}` : "";
    return `/* Modern CSS Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
  background: transparent;
  font-family: ${fontFamily};
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  ${isRtl ? "direction: rtl;\n  text-align: right;" : ""}
}${bodyLayout}
button {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: inherit;
}
img {
  display: block;
  max-width: 100%;
}`;
  }
  function createCssBuilder(options, forZip = false) {
    const rules = [];
    const classNamesSeen = /* @__PURE__ */ new Set();
    let sawLink = false;
    const stackRules = /* @__PURE__ */ new Map();
    function collectRules(node) {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      if (node.href) sawLink = true;
      if ((_b = (_a = node.typography) == null ? void 0 : _a.segments) == null ? void 0 : _b.some((seg) => seg.href)) sawLink = true;
      if (!classNamesSeen.has(node.className)) {
        classNamesSeen.add(node.className);
        const decs = [
          ...layoutToCssDeclarations(node.layout, options),
          ...visualToCssDeclarations(node.visual, node.layout.transform),
          ...typographyToCssDeclarations(node.typography)
        ];
        if (node.tag === "img" && !decs.some((d) => d.startsWith("object-fit:"))) {
          decs.push(((_c = node.layout) == null ? void 0 : _c.objectFit) ? `object-fit: ${node.layout.objectFit};` : "object-fit: cover;");
        }
        if (node.tag === "input" || node.tag === "textarea") {
          decs.push("appearance: none;", "-webkit-appearance: none;");
        }
        const ring = node.visual.gradientBorder;
        if (ring && !node.layout.position) {
          decs.push("position: relative;");
        }
        if (!options.includeReset && (node.layout.padding || node.visual.border) && !decs.some((d) => d.startsWith("box-sizing:"))) {
          decs.unshift("box-sizing: border-box;");
        }
        if (decs.length > 0) {
          const formattedDecs = decs.map((d) => `  ${d}`).join("\n");
          rules.push(`.${node.className} {
${formattedDecs}
}`);
        }
        if ((node.tag === "input" || node.tag === "textarea") && ((_d = node.attrs) == null ? void 0 : _d.placeholder)) {
          const placeholderDecs = [];
          if ((_e = node.typography) == null ? void 0 : _e.color) {
            placeholderDecs.push(`color: ${node.typography.color};`, "opacity: 1;");
          }
          if ((_f = node.typography) == null ? void 0 : _f.textAlign) placeholderDecs.push(`text-align: ${node.typography.textAlign};`);
          if ((_g = node.typography) == null ? void 0 : _g.direction) placeholderDecs.push(`direction: ${node.typography.direction};`);
          if (placeholderDecs.length > 0) {
            rules.push(
              `.${node.className}::placeholder {
${placeholderDecs.map((d) => `  ${d}`).join("\n")}
}`
            );
          }
        }
        if (ring) {
          rules.push(gradientBorderRule(node.className, ring));
        }
        if (node.layout.itemSpacing && node.layout.itemSpacing < 0) {
          const spacingVal = formatUnit(node.layout.itemSpacing, options.useRem, options.baseFontSize);
          if (node.layout.flexDirection === "column") {
            rules.push(`.${node.className} > * + * {
  margin-top: ${spacingVal};
}`);
          } else {
            rules.push(`.${node.className} > * + * {
  margin-inline-start: ${spacingVal};
}`);
          }
        }
        if (node.layout.itemReverseZIndex && node.children.length > 1) {
          node.children.forEach((child, idx) => {
            const z = node.children.length - idx;
            rules.push(`.${child.className} {
  z-index: ${z};
}`);
          });
        }
        if (node.layout.stackFill) {
          const { maxInlineSize } = node.layout.stackFill;
          const selectors = stackRules.get(maxInlineSize);
          if (selectors) {
            selectors.push(`.${node.className}`);
          } else {
            stackRules.set(maxInlineSize, [`.${node.className}`]);
          }
        }
        if ((_h = node.typography) == null ? void 0 : _h.isList) {
          const isRtl = node.typography.direction === "rtl";
          const bulletPadding = isRtl ? "padding-right: 18px;" : "padding-left: 18px;";
          const bulletPos = isRtl ? "right: 0;" : "left: 0;";
          const bulletColor = node.typography.listBulletColor || "inherit";
          rules.push(`.${node.className} > li {
  position: relative;
  ${bulletPadding}
  text-align: ${node.typography.textAlign || (isRtl ? "right" : "left")};
  direction: ${node.typography.direction || (isRtl ? "rtl" : "ltr")};
  line-height: inherit;
}`);
          rules.push(`.${node.className} > li::before {
  content: "\u2022";
  position: absolute;
  ${bulletPos}
  top: 0;
  color: ${bulletColor};
  font-size: 1.1em;
  line-height: inherit;
}`);
        }
      }
      if (node.componentOverride) {
        const { className, layout, visual, typography } = node.componentOverride;
        const overrideDecs = [
          ...layoutToCssDeclarations(layout != null ? layout : {}, options),
          ...visualToCssDeclarations(visual != null ? visual : {}, node.layout.transform),
          ...typographyToCssDeclarations(typography)
        ];
        if (overrideDecs.length > 0) {
          rules.push(`.${className} {
${overrideDecs.map((d) => `  ${d}`).join("\n")}
}`);
        }
      }
      for (const child of node.children) {
        collectRules(child);
      }
    }
    return {
      addRoot(root) {
        collectRules(root);
      },
      finish(isRtl, variablesBlock) {
        const head = [];
        if (variablesBlock) {
          head.push(variablesBlock);
        }
        const fontFaceBlock = generateFontFaceRules(options, forZip);
        if (fontFaceBlock) {
          head.push(fontFaceBlock);
        }
        if (options.includeReset) {
          head.push(resetBlock(isRtl, responsiveEnabled(options)));
        }
        const tail = [];
        if (sawLink) {
          tail.push(`/* Links keep the design's own colour and decoration. */
a {
  color: inherit;
  text-decoration: inherit;
}`);
        }
        for (const [maxInlineSize, selectors] of stackRules) {
          tail.push(
            `/* Stacked regions \u2014 below the row's own wrap point each region fills its line. */
@container (width < ${maxInlineSize}) {
  ${selectors.join(",\n  ")} {
    flex-basis: 100%;
    max-width: 100%;
  }
}`
          );
        }
        return [...head, ...rules, ...tail].join("\n\n");
      }
    };
  }

  // engines/fig-engine/vendor/html-generator/src/shared/style-utils.ts
  function segmentToInlineStyle(seg) {
    const parts = [];
    if (seg.fontFamily && seg.fontFamily !== "inherit")
      parts.push(`font-family: ${seg.fontFamily.replace(/"/g, "'")}`);
    if (seg.fontSize) parts.push(`font-size: ${seg.fontSize}`);
    if (seg.fontWeight && seg.fontWeight !== 400) parts.push(`font-weight: ${seg.fontWeight}`);
    if (seg.color) parts.push(`color: ${seg.color}`);
    if (seg.lineHeight && seg.lineHeight !== "normal") parts.push(`line-height: ${seg.lineHeight}`);
    if (seg.letterSpacing && seg.letterSpacing !== "normal")
      parts.push(`letter-spacing: ${seg.letterSpacing}`);
    if (seg.textDecoration) parts.push(`text-decoration: ${seg.textDecoration}`);
    if (seg.textTransform) parts.push(`text-transform: ${seg.textTransform}`);
    return parts.join("; ");
  }
  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // engines/fig-engine/vendor/html-generator/src/shared/text-flow.ts
  var PARAGRAPH_BREAK = /\r\n|\r|\n/;
  function paragraphsOfRuns(runs) {
    const paragraphs = [[]];
    for (const run of runs) {
      const parts = run.text.split(PARAGRAPH_BREAK);
      parts.forEach((part, index) => {
        if (index > 0) paragraphs.push([]);
        if (part.length > 0) {
          paragraphs[paragraphs.length - 1].push({
            text: part,
            styleAttr: run.styleAttr,
            href: run.href
          });
        }
      });
    }
    return paragraphs;
  }

  // engines/fig-engine/vendor/html-generator/src/generator/html-generator.ts
  function hasRtlInTree(node) {
    var _a;
    if (node.text && isRtlText(node.text)) return true;
    if ((_a = node.typography) == null ? void 0 : _a.segments) {
      for (const seg of node.typography.segments) {
        if (isRtlText(seg.text)) return true;
      }
    }
    for (const child of node.children) {
      if (hasRtlInTree(child)) return true;
    }
    return false;
  }
  function wrapBidiNumbers(text) {
    const phonePattern = /(?:\+?[\d\u0660-\u0669\u06F0-\u06F9]+(?:[\s\-–—]+[\d\u0660-\u0669\u06F0-\u06F9]+){2,})/g;
    return text.replace(phonePattern, (match) => {
      return `<span dir="ltr" style="unicode-bidi: isolate; display: inline-block;">${match}</span>`;
    });
  }
  function formatTextContent(rawText) {
    const escaped = escapeHtml(rawText);
    const withBidi = wrapBidiNumbers(escaped);
    return withBidi.replace(/\r\n|\r|\n/g, "<br />");
  }
  function anchorHtml(href, inner) {
    return href ? `<a href="${escapeHtml(href)}">${inner}</a>` : inner;
  }
  function generateStyledSegmentsHtml(node) {
    var _a;
    if (!((_a = node.typography) == null ? void 0 : _a.segments)) {
      return formatTextContent(node.text || "");
    }
    return node.typography.segments.map((seg) => {
      const inline = segmentToInlineStyle(seg);
      const styleAttr = inline ? ` style="${inline}"` : "";
      const span = `<span${styleAttr}>${formatTextContent(seg.text)}</span>`;
      return node.href ? span : anchorHtml(seg.href, span);
    }).join("");
  }
  function generateListItemsHtml(node, indent) {
    var _a, _b;
    if (!((_a = node.typography) == null ? void 0 : _a.segments) || node.typography.segments.length <= 1) {
      const rawLines = (node.text || "").split("\n").map((l) => l.trim()).filter(Boolean);
      return rawLines.map((l) => {
        const clean = l.replace(/^[•\u2022\u25cf\u25aa-]\s*/, "");
        return `${indent}  <li>${wrapBidiNumbers(escapeHtml(clean))}</li>`;
      }).join("\n");
    }
    const linesOfRuns = [[]];
    for (const seg of node.typography.segments) {
      const inline = segmentToInlineStyle(seg);
      const styleAttr = inline ? ` style="${inline}"` : "";
      const parts = seg.text.split("\n");
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          linesOfRuns.push([]);
        }
        const part = (_b = parts[i]) != null ? _b : "";
        const currentLine = linesOfRuns[linesOfRuns.length - 1];
        if (currentLine && part.length > 0) {
          currentLine.push({ text: part, styleAttr });
        }
      }
    }
    return linesOfRuns.filter((runs) => runs.length > 0).map((runs) => {
      const firstRun = runs[0];
      if (firstRun) {
        firstRun.text = firstRun.text.replace(/^[•\u2022\u25cf\u25aa-]\s*/, "");
      }
      const itemHtml = runs.map((r) => {
        if (!r.text) return "";
        if (r.styleAttr) return `<span${r.styleAttr}>${wrapBidiNumbers(escapeHtml(r.text))}</span>`;
        return wrapBidiNumbers(escapeHtml(r.text));
      }).join("");
      return `${indent}  <li>${itemHtml}</li>`;
    }).join("\n");
  }
  function componentMarkerAttrs(node) {
    var _a, _b;
    const ref = node.componentRef;
    if (!ref) return "";
    const attrs = [
      `data-component="${escapeHtml(ref.name)}"`,
      `data-component-id="${escapeHtml(ref.id)}"`,
      ref.familyName ? `data-component-family="${escapeHtml(ref.familyName)}"` : "",
      ref.familyId ? `data-component-family-id="${escapeHtml(ref.familyId)}"` : ""
    ];
    for (const [name, value] of Object.entries((_a = ref.variantProperties) != null ? _a : {})) {
      attrs.push(`data-variant-${dataAttributeName(name)}="${escapeHtml(value)}"`);
    }
    for (const [name, value] of Object.entries((_b = ref.componentProperties) != null ? _b : {})) {
      attrs.push(`data-component-prop-${dataAttributeName(name)}="${escapeHtml(String(value))}"`);
    }
    return ` ${attrs.filter(Boolean).join(" ")}`;
  }
  function dataAttributeName(name) {
    const slug = name.trim().replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
    return slug || "value";
  }
  function figmaIdAttr(node, options) {
    if (!options.debugFigmaIds || !node.id) return "";
    return ` data-figma-id="${escapeHtml(node.id)}"`;
  }
  function generateParagraphHtml(node, indent) {
    var _a, _b, _c, _d;
    const spacing = (_b = (_a = node.typography) == null ? void 0 : _a.paragraphSpacing) != null ? _b : "0px";
    const segments = (_c = node.typography) == null ? void 0 : _c.segments;
    const runs = segments && segments.length > 1 ? segments.map((seg) => ({ text: seg.text, styleAttr: segmentToInlineStyle(seg), href: seg.href })) : [{ text: (_d = node.text) != null ? _d : "", href: node.href }];
    const paragraphs = paragraphsOfRuns(runs);
    return paragraphs.map((runsOfParagraph, index) => {
      const isLast = index === paragraphs.length - 1;
      const margin = isLast ? "" : `margin-bottom: ${spacing};`;
      const inner = runsOfParagraph.length === 0 ? "<br />" : runsOfParagraph.map((run) => {
        const text = formatTextContent(run.text);
        const styled = run.styleAttr ? `<span style="${run.styleAttr}">${text}</span>` : text;
        return node.href ? styled : anchorHtml(run.href, styled);
      }).join("");
      return `${indent}  <span style="display: block;${margin ? ` ${margin}` : ""}">${inner}</span>`;
    }).join("\n");
  }
  function htmlAttrs(node) {
    if (!node.attrs) return "";
    return Object.entries(node.attrs).filter(([, value]) => value !== "").map(([key, value]) => ` ${key}="${escapeHtml(String(value))}"`).join("");
  }
  var PHRASING_TAGS = /* @__PURE__ */ new Set([
    "span",
    "a",
    "button",
    "input",
    "textarea",
    "label",
    "img",
    "br",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "small",
    "code"
  ]);
  function generateHtml(node, indentLevel = 0, insidePhrasing = false, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g;
    const indent = "  ".repeat(indentLevel);
    let tag2 = node.tag;
    if (insidePhrasing) {
      if (tag2 === "button" || !PHRASING_TAGS.has(tag2)) tag2 = "span";
    }
    const isPhrasingContainer = tag2 === "button" || tag2 === "label";
    const nextInsidePhrasing = insidePhrasing || isPhrasingContainer;
    const classNames = [
      node.componentOverride ? `${node.className} ${node.componentOverride.className}` : node.className,
      ...(_a = node.themeClasses) != null ? _a : []
    ].filter(Boolean).join(" ");
    const classAttr = classNames ? ` class="${classNames}"` : "";
    const componentAttr = options.componentMarkers ? componentMarkerAttrs(node) : "";
    const figmaAttr = figmaIdAttr(node, options);
    const extraAttrs = htmlAttrs(node);
    if (node.asset && node.asset.type === "svg") {
      let cleanSvg = node.asset.content.trim();
      cleanSvg = cleanSvg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
        if (attrs.includes("style=")) {
          return match.replace(/style="([^"]*)"/i, 'style="width: 100%; height: 100%; display: block; $1"');
        }
        return `<svg style="width: 100%; height: 100%; display: block;"${attrs}>`;
      });
      const wrapperTag = insidePhrasing ? "span" : "div";
      return `${indent}<${wrapperTag}${classAttr}${componentAttr}${figmaAttr}${extraAttrs}>
${indent}  ${cleanSvg}
${indent}</${wrapperTag}>`;
    }
    if (node.asset && node.asset.type === "image" && tag2 === "img") {
      return `${indent}<img${classAttr}${componentAttr}${figmaAttr}${extraAttrs} src="${node.asset.content}" alt="${escapeHtml(node.name)}" />`;
    }
    if (tag2 === "input") {
      return `${indent}<input${classAttr}${componentAttr}${figmaAttr}${extraAttrs} />`;
    }
    if (tag2 === "textarea") {
      return `${indent}<textarea${classAttr}${componentAttr}${figmaAttr}${extraAttrs}>${escapeHtml((_b = node.text) != null ? _b : "")}</textarea>`;
    }
    if (tag2 === "option") {
      const label = escapeHtml(((_c = node.text) != null ? _c : "").replace(/\s+/g, " ").trim());
      return `${indent}<option${classAttr}${componentAttr}${figmaAttr}${extraAttrs}>${label}</option>`;
    }
    if (node.type === "TEXT") {
      const isExplicitDir = (_d = node.typography) == null ? void 0 : _d.direction;
      const isRtl = isExplicitDir ? isExplicitDir === "rtl" : isRtlText(node.text);
      const dirAttr = isRtl ? ' dir="rtl"' : isExplicitDir === "ltr" ? ' dir="ltr"' : "";
      if ((_e = node.typography) == null ? void 0 : _e.isList) {
        const listContentHtml = generateListItemsHtml(node, indent);
        return `${indent}<${tag2}${classAttr}${componentAttr}${figmaAttr}${extraAttrs}${dirAttr}>
${listContentHtml}
${indent}</${tag2}>`;
      }
      const link = (inner) => anchorHtml(node.href, inner);
      if ((_f = node.typography) == null ? void 0 : _f.paragraphSpacing) {
        return `${indent}<${tag2}${classAttr}${componentAttr}${figmaAttr}${extraAttrs}${dirAttr}>${link(`
${generateParagraphHtml(node, indent)}
${indent}`)}</${tag2}>`;
      }
      if (((_g = node.typography) == null ? void 0 : _g.segments) && node.typography.segments.length > 1) {
        const innerHtml = generateStyledSegmentsHtml(node);
        return `${indent}<${tag2}${classAttr}${componentAttr}${figmaAttr}${extraAttrs}${dirAttr}>${link(innerHtml)}</${tag2}>`;
      }
      return `${indent}<${tag2}${classAttr}${componentAttr}${figmaAttr}${extraAttrs}${dirAttr}>${link(formatTextContent(node.text || ""))}</${tag2}>`;
    }
    if (node.children && node.children.length > 0) {
      const childrenHtml = node.children.map((child) => generateHtml(child, indentLevel + 1, nextInsidePhrasing, options)).join("\n");
      return `${indent}<${tag2}${classAttr}${componentAttr}${figmaAttr}${extraAttrs}>
${childrenHtml}
${indent}</${tag2}>`;
    }
    return `${indent}<${tag2}${classAttr}${componentAttr}${figmaAttr}${extraAttrs}></${tag2}>`;
  }

  // engines/fig-engine/ENGINE.json
  var ENGINE_default = {
    id: "fig-engine",
    contract: 1,
    version: "1.0.0",
    renderer: "html-generator",
    source: {
      figEngine: {
        path: "C:\\Users\\matin.ghanbari\\Desktop\\git hub\\figma-ai\\fig-engine",
        version: "1.0.0",
        commit: "4b02080"
      },
      htmlGenerator: {
        path: "C:\\Users\\matin.ghanbari\\Desktop\\git hub\\figma-ai\\html-generator",
        version: "1.0.0",
        commit: "4b02080"
      }
    },
    syncedAt: "2026-10-27T14:05:55.256Z",
    filesHash: "63c4c172135e",
    files: 40,
    entries: [
      "html-generator/src/plugin/converter/index.ts",
      "html-generator/src/plugin/converter/utils.ts",
      "html-generator/src/plugin/variables/variable-collector.ts",
      "html-generator/src/generator/html-generator.ts",
      "html-generator/src/generator/css-generator.ts",
      "html-generator/src/shared/component-registry.ts"
    ]
  };

  // engines/fig-engine/adapter.ts
  var contract = 1;
  var id = ENGINE_default.id;
  var version = ENGINE_default.version;
  var capabilities = ["frame", "component", "markers", "metadata"];
  function readOpt(get) {
    try {
      return get();
    } catch {
      return void 0;
    }
  }
  function componentMeta(node) {
    const parent = readOpt(() => node.parent);
    const family = parent && parent.type === "COMPONENT_SET" ? parent : node;
    const meta = { id: node.id, name: node.name, familyId: family.id, familyName: family.name };
    const variants = readOpt(() => node.variantProperties);
    if (variants && Object.keys(variants).length) meta.variantProperties = variants;
    const defs = readOpt(() => family.componentPropertyDefinitions);
    const out = {};
    Object.keys(defs || {}).forEach((k) => {
      const d = defs[k];
      if (!d || typeof d.type !== "string") return;
      const one = { type: d.type };
      if (typeof d.defaultValue === "string" || typeof d.defaultValue === "boolean") one.defaultValue = d.defaultValue;
      if (Array.isArray(d.variantOptions) && d.variantOptions.length) one.variantOptions = d.variantOptions.filter((x) => typeof x === "string");
      out[k] = one;
    });
    if (Object.keys(out).length) meta.propertyDefinitions = out;
    return meta;
  }
  function usedComponents(root) {
    const byId = /* @__PURE__ */ new Map();
    const walk = (n) => {
      const ref = n.componentRef;
      if (ref) {
        let usage = byId.get(ref.id);
        if (!usage) {
          usage = { id: ref.id, name: ref.name, familyId: ref.familyId || ref.id, familyName: ref.familyName || ref.name, variantProperties: ref.variantProperties, propertyDefinitions: ref.propertyDefinitions, instances: [] };
          byId.set(ref.id, usage);
        }
        if (!usage.instances.some((x) => x.id === n.id)) usage.instances.push({ id: n.id, name: n.name });
      }
      n.children.forEach(walk);
    };
    walk(root);
    return Array.from(byId.values());
  }
  function frameStructure(n) {
    const ref = n.componentRef;
    const out = { id: n.id, tag: n.tag, children: n.children.map(frameStructure) };
    if (ref) {
      out.componentId = ref.id;
      out.componentName = ref.name;
      out.componentFamilyId = ref.familyId || ref.id;
      out.componentFamilyName = ref.familyName || ref.name;
      if (ref.variantProperties) out.variantProperties = ref.variantProperties;
    }
    if (n.href) out.link = true;
    if (n.attrs && n.attrs.type) out.control = n.attrs.type;
    return out;
  }
  function hexKey(hex) {
    const h = hex.replace("#", "");
    if (h.length !== 6 && h.length !== 8) return null;
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? Math.round(parseInt(h.slice(6, 8), 16) / 255 * 1e3) / 1e3 : 1;
    if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
    return `${r},${g},${b},${a}`;
  }
  function buildRegistry(tokens, matchColors) {
    const tokensMap = /* @__PURE__ */ new Map();
    const colorValueMap = /* @__PURE__ */ new Map();
    const mk = (key, css, type = "string") => ({
      id: key,
      name: css,
      cssVarName: css,
      type,
      value: ""
    });
    Object.keys(tokens.variables || {}).forEach((k) => tokensMap.set(k, mk(k, tokens.variables[k])));
    Object.keys(tokens.styles || {}).forEach((k) => tokensMap.set(k, mk(k, tokens.styles[k])));
    if (matchColors) {
      Object.keys(tokens.colors || {}).forEach((hex) => {
        const key = hexKey(hex);
        if (key) colorValueMap.set(key, mk(key, tokens.colors[hex], "color"));
      });
    }
    return {
      tokens: [],
      cssVariablesBlock: "",
      tokensMap,
      colorValueMap,
      syntheticTokens: /* @__PURE__ */ new Map(),
      textStyles: /* @__PURE__ */ new Map(),
      effectStyles: /* @__PURE__ */ new Map(),
      modeClasses: /* @__PURE__ */ new Map(),
      resolveColor: (color, opacity = 1, boundVarId, styleId) => {
        const bound = boundVarId && tokensMap.get(boundVarId) || styleId && tokensMap.get(styleId) || null;
        if (bound) return `var(${bound.cssVarName})`;
        const byValue = matchColors ? colorValueMap.get(normalizeColorKey(color, opacity)) : void 0;
        if (byValue) return `var(${byValue.cssVarName})`;
        return opacity >= 1 ? figmaColorToHex(color) : figmaColorToRgba(color, opacity);
      },
      getCssVariablesBlock: () => "",
      getTailwindThemeBlock: () => ""
    };
  }
  function conversionOptions(o) {
    return {
      outputMode: "pure-css",
      useRem: false,
      baseFontSize: 16,
      includeReset: false,
      inlineAssets: true,
      semanticTags: o.semanticTags !== false,
      imageScale: o.imageScale === void 0 ? "auto" : o.imageScale,
      responsive: o.responsive === true,
      componentDedup: false
    };
  }
  function indexIR(n, byId, count) {
    byId.set(n.id, n.className);
    count.nodes++;
    if (n.asset) count.assets++;
    n.children.forEach((c) => indexIR(c, byId, count));
  }
  function addLinks(node, byId, gos) {
    try {
      const rx = node.reactions || [];
      rx.forEach(
        (r) => (r.actions || (r.action ? [r.action] : [])).forEach((a) => {
          if (a && a["type"] === "NODE" && typeof a["destinationId"] === "string" && a["navigation"] !== "OVERLAY" && a["navigation"] !== "SWAP") {
            const cls = byId.get(node.id);
            if (cls) gos.set(cls, a["destinationId"]);
          }
        })
      );
    } catch {
    }
    if ("children" in node && Array.isArray(node.children)) {
      node.children.forEach((c) => addLinks(c, byId, gos));
    }
  }
  function collectFonts(node, fonts) {
    if (node.type === "TEXT") {
      const t = node;
      try {
        t.getStyledTextSegments(["fontName", "fontWeight"]).forEach((s) => {
          const fam = s.fontName && s.fontName.family;
          if (fam) (fonts[fam] = fonts[fam] || /* @__PURE__ */ new Set()).add(s.fontWeight || 400);
        });
      } catch {
        const fn = t.fontName;
        if (fn && fn.family) (fonts[fn.family] = fonts[fn.family] || /* @__PURE__ */ new Set()).add(400);
      }
    }
    if ("children" in node && Array.isArray(node.children)) {
      node.children.forEach((c) => collectFonts(c, fonts));
    }
  }
  function hashStr(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i) | 0;
    return (h >>> 0).toString(36) + s.length.toString(36);
  }
  function externalizeImages(text, files) {
    return text.replace(
      /data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)/g,
      (m, kind, b64) => {
        if (b64.length < 2e3) return m;
        const path = `assets/${hashStr(b64)}.${kind === "jpeg" ? "jpg" : kind}`;
        if (!files.has(path)) files.set(path, b64);
        return path;
      }
    );
  }
  function varsOf(css) {
    return Array.from(new Set((css.match(/var\((--[\w-]+)/g) || []).map((m) => m.slice(4))));
  }
  function fontsOf(node, rtl) {
    const fs = {};
    collectFonts(node, fs);
    if (rtl) (fs["Vazirmatn"] = fs["Vazirmatn"] || /* @__PURE__ */ new Set()).add(400).add(700);
    const fonts = {};
    Object.keys(fs).forEach((f) => {
      fonts[f] = Array.from(fs[f]).sort((a, b) => a - b);
    });
    return fonts;
  }
  function renderCss(ir, options, rtl) {
    const builder = createCssBuilder(options, false);
    builder.addRoot(ir);
    return builder.finish(rtl);
  }
  async function exportFrame(node, tokens, o = {}) {
    const options = conversionOptions(o);
    const registry = buildRegistry(tokens, o.matchColorsByValue !== false);
    const ir = await convertNodeToIR(node, null, options, registry);
    if (!ir) throw new Error("The frame is hidden or cannot be exported.");
    const rtl = hasRtlInTree(ir);
    let body = generateHtml(ir, 0, false, { componentMarkers: true });
    let css = renderCss(ir, options, rtl);
    const fileMap = /* @__PURE__ */ new Map();
    if (!o.embedImages) {
      body = externalizeImages(body, fileMap);
      css = externalizeImages(css, fileMap);
    }
    const byId = /* @__PURE__ */ new Map(), count = { nodes: 0, assets: 0 };
    indexIR(ir, byId, count);
    const gos = /* @__PURE__ */ new Map();
    addLinks(node, byId, gos);
    const links = [];
    gos.forEach((dest, cls) => {
      links.push(dest);
      body = body.split(`class="${cls}"`).join(`class="${cls}" data-go="${dest}"`);
    });
    return {
      engine: id,
      version,
      name: node.name,
      width: Math.round(node.width),
      height: Math.round(node.height),
      bodyHtml: body,
      css,
      vars: varsOf(css),
      links: Array.from(new Set(links)),
      fonts: fontsOf(node, rtl),
      rtl,
      nodes: count.nodes,
      assets: count.assets,
      components: usedComponents(ir),
      structure: frameStructure(ir),
      files: Array.from(fileMap.entries()).map(([path, base64]) => ({ path, base64 })),
      notes: []
    };
  }
  async function exportComponent(node, tokens, o = {}, classNames) {
    const options = conversionOptions(o);
    const registry = buildRegistry(tokens, o.matchColorsByValue !== false);
    const root = node.type === "COMPONENT_SET" ? node.children[0] || node : node;
    const ir = await convertNodeToIR(
      root,
      null,
      options,
      registry,
      void 0,
      classNames || /* @__PURE__ */ new Set()
    );
    if (!ir) throw new Error("The component is hidden or cannot be exported.");
    const rtl = hasRtlInTree(ir);
    let html = generateHtml(ir, 0);
    let css = renderCss(ir, options, rtl);
    const fileMap = /* @__PURE__ */ new Map();
    if (!o.embedImages) {
      html = externalizeImages(html, fileMap);
      css = externalizeImages(css, fileMap);
    }
    const count = { nodes: 0, assets: 0 };
    indexIR(ir, /* @__PURE__ */ new Map(), count);
    return {
      engine: id,
      version,
      nodeId: node.id,
      name: node.name,
      className: ir.className,
      width: Math.round(root.width),
      height: Math.round(root.height),
      html,
      css,
      vars: varsOf(css),
      nodes: count.nodes,
      metadata: componentMeta(root),
      files: Array.from(fileMap.entries()).map(([path, base64]) => ({ path, base64 })),
      notes: []
    };
  }
  return __toCommonJS(adapter_exports);
})();

// ===== Core =====
// Global Design System — Figma <-> design.md compiler (v0.2, step-by-step)
// Flow: Discover -> Scope -> Sections -> Variables -> Components -> Dependencies -> Extract -> Review -> Generate
if (typeof figma !== 'undefined') {
  figma.showUI(__html__, { width: 920, height: 720 });
  figma.clientStorage.getAsync('ui-size').then(sz => { if (sz && sz.w && sz.h) { const s = uiSize(sz.w, sz.h); figma.ui.resize(s[0], s[1]); } });
}

const EXC = /(archive|old|draft|test|experiment|deprecated|legacy|temp|wip|sandbox)/i;
const REC = /(design system|foundation|token|component|ui kit|style|documentation|library|icon)/i;
const post = (type, data) => figma.ui.postMessage({ type, data });
const prog = (value, label) => post('progress', { value, label });
function uiSize(w, h) {
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(v) || lo)));
  return [clamp(w, 520, 1400), clamp(h, 420, 1400)];
}
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unnamed';
const hex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase() +
  (c.a !== undefined && c.a < 1 ? Math.round(c.a * 255).toString(16).padStart(2, '0').toUpperCase() : '');
const rgb = h => { h = h.replace('#', ''); return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 }; };
let MODEL = null, DISC = null;

// ---------- Token helpers ----------
function fmt(val, type) {
  if (type === 'COLOR' && val && typeof val === 'object') return hex(val);
  if (typeof val === 'number') return String(Math.round(val * 1000) / 1000);
  if (typeof val === 'string' || typeof val === 'boolean') return String(val);
  return null;
}
function resolve(v, modeId, byId, colById) {
  const chain = [], ids = [], seen = new Set();
  let cur = v, mid = modeId, aliasId = null;
  for (let i = 0; i < 25; i++) {
    if (seen.has(cur.id)) return { status: 'circular', chain, ids, aliasId };
    seen.add(cur.id);
    if (!(mid in cur.valuesByMode)) mid = colById[cur.variableCollectionId].defaultModeId;
    const val = cur.valuesByMode[mid];
    if (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS') {
      if (aliasId === null) aliasId = val.id;
      const next = byId[val.id];
      if (!next) return { status: 'unresolved', chain, ids, aliasId };
      chain.push(next.name); ids.push(next.id); cur = next; continue;
    }
    const f = fmt(val, cur.resolvedType);
    return f === null ? { status: 'invalid', chain, ids, aliasId } : { status: 'resolved', value: f, chain, ids, aliasId };
  }
  return { status: 'circular', chain, ids, aliasId };
}
function category(v) {
  const n = v.name.toLowerCase();
  if (v.resolvedType === 'COLOR') return ['color', 'type'];
  const map = [['radius', /radius|corner/], ['spacing', /spacing|space|gap|padding|margin/], ['opacity', /opacity|alpha/],
    ['typography', /font|text|type|line|letter|weight/], ['size', /size|width|height/], ['border', /border|stroke/],
    ['z-index', /z-?index|layer/], ['motion', /motion|duration|ease/], ['breakpoint', /breakpoint/], ['shadow', /shadow|elevation/]];
  for (const [c, re] of map) if (re.test(n)) return [c, 'name-heuristic'];
  return ['other', 'name-heuristic'];
}

// ---------- Project Context (pure; user-provided vs figma facts vs inferences) ----------
const CTX_KEYS = { product: /^(product|project|app|brand|name)$/i, description: /^(description|summary|overview|about)$/i, users: /^(users?|audience|target users?|personas?|primary users?)$/i,
  goals: /^(goals?|objectives?|purpose|main goals?)$/i, capabilities: /^(capabilit(y|ies)|features?)$/i, flows: /^(flows?|journeys?|user flows?|main flows?)$/i,
  platforms: /^(platforms?)$/i, language: /^(languages?|locale)$/i, direction: /^(direction|dir|text direction)$/i };
const keyOf = s => Object.keys(CTX_KEYS).find(k => CTX_KEYS[k].test(String(s).trim().replace(/:$/, '')));
const splitList = s => String(s || '').split(/\n|;|,|•/).map(x => x.replace(/^\s*[-*]\s*/, '').trim()).filter(Boolean);
const PLAT = [['web', /\bweb(site)?\b|browser/i], ['mobile', /\bmobile\b|\bios\b|\bandroid\b|iphone/i], ['desktop', /\bdesktop\b|\bmac(os)?\b|\bwindows\b/i]];
const normPlat = s => { const hit = PLAT.find(p => p[1].test(s)); return hit ? hit[0] : 'other'; };
function parseContext(text) {
  const f = { product: '', description: '', users: [], goals: [], capabilities: [], flows: [], platforms: [], language: '', direction: '' }, notes = [];
  const put = (k, v) => { if (!v) return; if (['users', 'goals', 'capabilities', 'flows', 'platforms'].includes(k)) f[k].push(...splitList(v)); else f[k] = f[k] ? f[k] + ' ' + v : v; };
  let cur = null, sawBullet = false;
  const LISTS = ['users', 'goals', 'capabilities', 'flows', 'platforms'];
  String(text || '').split(/\r?\n/).forEach(raw => {
    const l = raw.trim(); if (!l) return;
    let m = l.match(/^#{1,6}\s*(.+?)\s*$/);
    if (m) { cur = keyOf(m[1]) || null; sawBullet = false; if (!cur) notes.push(m[1]); return; }
    m = l.match(/^[-*]?\s*([A-Za-z ]{2,24}):\s*(.*)$/);
    if (m && keyOf(m[1])) { cur = keyOf(m[1]); sawBullet = false; put(cur, m[2]); return; }
    const bullet = /^[-*\u2022]\s+/.test(l);
    if (cur && LISTS.includes(cur) && !bullet && sawBullet) { notes.push(l); cur = null; return; }
    if (bullet) sawBullet = true;
    if (cur) put(cur, l); else notes.push(l);
  });
  const inferences = [], t = String(text || '');
  if (!f.platforms.length) PLAT.forEach(p => { const mm = t.match(p[1]); if (mm) inferences.push({ field: 'platforms', value: p[0], statement: 'Platform may include ' + p[0], confidence: 0.6, evidence: ['pasted text mentions "' + mm[0] + '"'] }); });
  const rtl = (t.match(/[\u0590-\u08FF]/g) || []).length, letters = (t.match(/\p{L}/gu) || []).length;
  if (!f.direction && letters > 20 && rtl / letters > 0.3) inferences.push({ field: 'direction', value: 'RTL', statement: 'Text direction may be RTL', confidence: 0.8, evidence: [Math.round(rtl / letters * 100) + '% of letters in the pasted text are right-to-left script'] });
  return { fields: f, inferences, unmapped: notes };
}
const toList = v => Array.isArray(v) ? v.filter(Boolean) : splitList(v);
function buildContext(form, figmaFacts, figInf, auto) {
  form = form || {};
  const P = parseContext(form.pasted), pf = P.fields, facts = [], pick = (k, scalar) => {
    const fv = scalar ? String(form[k] || '').trim() : toList(form[k]);
    const empty = scalar ? !fv : !fv.length;
    if (!empty) return { v: fv, src: 'user' };
    const pv = pf[k]; return (scalar ? pv : pv.length) ? { v: pv, src: 'user (pasted context)' } : { v: scalar ? '' : [], src: null };
  };
  const C = { src: {}, descAuto: false, provided: false, product: { name: '', description: '' }, users: [], goals: [], capabilities: [], flows: [], platforms: [], localization: { language: '', direction: '' }, notes: [], facts, inferences: [], unknown: [] };
  const fill = (k, scalar, set, label) => { const r = pick(k, scalar); if (r.src) { C.src[label] = r.src; C.provided = true; set(r.v); (scalar ? [r.v] : r.v).forEach(x => facts.push({ statement: label + ': ' + x, source: r.src })); } else C.unknown.push(label); };
  fill('product', true, v => C.product.name = v, 'Product');
  fill('description', true, v => C.product.description = v, 'Description');
  fill('users', false, v => C.users = v, 'Users'); fill('goals', false, v => C.goals = v, 'Goals');
  fill('capabilities', false, v => C.capabilities = v, 'Capabilities'); fill('flows', false, v => C.flows = v, 'Flows');
  fill('platforms', false, v => C.platforms = v.map(x => /^(web|mobile|desktop|other)$/i.test(x) ? x.toLowerCase() : normPlat(x)).filter((x, i, a) => a.indexOf(x) === i), 'Platforms');
  fill('language', true, v => C.localization.language = v, 'Language'); fill('direction', true, v => C.localization.direction = v.toUpperCase(), 'Direction');
  if (auto && auto.name && !C.product.name) { C.product.name = auto.name; C.src.Product = 'figma (file name)'; C.unknown = C.unknown.filter(x => x !== 'Product'); facts.push({ statement: 'Product: ' + auto.name, source: 'figma (file name)' }); }
  if (auto && auto.description && !C.product.description) { C.product.description = auto.description; C.descAuto = true; C.unknown = C.unknown.filter(x => x !== 'Description'); facts.push({ statement: 'Description: ' + auto.description, source: 'auto (from file data)' }); }
  const notes = []; if (String(form.notes || '').trim()) { notes.push(String(form.notes).trim()); C.provided = true; }
  C.notes = notes.concat(P.unmapped);
  P.inferences.forEach(i => { const taken = i.field === 'direction' ? C.localization.direction : C.platforms.length; if (!taken) C.inferences.push({ id: 'inf:' + C.inferences.length, statement: i.statement, confidence: i.confidence, evidence: i.evidence, source: 'inference' }); });
  (figInf || []).filter(i => !((i.field === 'platforms' && C.platforms.length) || (i.field === 'direction' && C.localization.direction) || (i.field === 'language' && C.localization.language))).forEach(i => C.inferences.push({ id: 'inf:' + C.inferences.length, statement: i.statement, confidence: i.confidence, evidence: i.evidence, source: 'inference' }));
  (figmaFacts || []).forEach(s => facts.push({ statement: s, source: 'figma' }));
  return C;
}

// ---------- Dependencies (pure): plan -> policy ----------
function planDependencies(components, tokens, have, byId, expand) {
  const map = {}, q = [], add = (id, by, reason) => {
    if (have.has(id) || !byId[id]) return;
    let e = map[id]; if (!e) { e = map[id] = { key: 'token:' + id, kind: 'token', id, name: byId[id].name, requiredBy: [] }; q.push(id); }
    if (!e.requiredBy.some(r => r.by === by && r.reason === reason)) e.requiredBy.push({ by, reason });
  };
  components.forEach(c => c._tokenIds.forEach(id => add(id, c.name, 'Bound variable')));
  tokens.forEach(t => t._chainIds.forEach(id => add(id, t.name, 'Alias target')));
  while (q.length) { const id = q.pop(); expand(id).forEach(x => add(x, byId[id].name, 'Alias target')); }
  const sel = new Set(components.map(c => c.name)), miss = {};
  components.forEach(c => (c._nested || []).forEach(n => {
    if (sel.has(n.name)) return;
    const e = miss[n.name] || (miss[n.name] = { key: 'component:' + n.name, kind: 'component', name: n.name, nodeId: n.nodeId, remote: !!n.remote, requiredBy: [] });
    if (!e.requiredBy.some(r => r.by === c.name)) e.requiredBy.push({ by: c.name, reason: 'Nested component instance' });
  }));
  const byName = (a, b) => a.name.localeCompare(b.name);
  return { tokenDeps: Object.values(map).sort(byName), missing: Object.values(miss).sort(byName) };
}
// policy: 'auto_include' | 'ask' | 'ignore'; dd = { include: [keys] (ask), components: { name: 'include'|'continue' } }
function applyPolicy(plan, policy, dd) {
  dd = dd || {}; const inc = new Set(dd.include || []), cd = dd.components || {};
  const tokens = plan.tokenDeps.filter(d => policy === 'auto_include' || (policy === 'ask' && inc.has(d.key)));
  const comps = plan.missing.filter(m => !m.remote && (cd[m.name] === 'include' || (cd[m.name] !== 'continue' && (policy === 'auto_include' || (policy === 'ask' && inc.has(m.key))))));
  const tk = new Set(tokens.map(t => t.key)), ck = new Set(comps.map(c => c.key)), warn = [], cnt = {};
  plan.tokenDeps.filter(d => !tk.has(d.key)).forEach(d => d.requiredBy.forEach(r => cnt[r.by] = (cnt[r.by] || 0) + 1));
  Object.keys(cnt).sort().forEach(by => warn.push({ code: 'DEPENDENCY_EXCLUDED', severity: 'warning', entityId: by, message: by + ' depends on ' + cnt[by] + ' token(s) that are not included. The generated design.md may be incomplete.', recovery: 'Use Auto Include or review dependencies.' }));
  plan.missing.filter(m => !ck.has(m.key)).forEach(m => m.requiredBy.forEach(r => warn.push({ code: 'DEPENDENCY_MISSING_COMPONENT', severity: 'warning', entityId: r.by, message: r.by + ' contains nested component "' + m.name + '" which is not included' + (m.remote ? ' (library component, cannot be read)' : '') + '.', recovery: 'Expand scope or include the component.' })));
  return { tokenIds: tokens.map(t => t.id), tokenDeps: tokens, components: comps, warnings: warn };
}

// ---------- Icons & frame inference (pure) ----------
const VEC = ['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'LINE', 'POLYGON'];
const ICON_DEFAULT = { max: 64, min: 8, sizes: [12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48], selfVector: true, names: true };
let ICON_RULES = ICON_DEFAULT;
function iconScore(d, rules) {
  const R = Object.assign({}, ICON_DEFAULT, ICON_RULES, rules || {});
  let s = 0; const ev = [], nm = String(d.name || ''), ctx = (d.page || '') + ' ' + (d.path || '');
  if (R.names && /(^|[\s/_-])(icons?|ic|glyphs?|symbols?|pictograms?)([\s/_-]|$)/i.test(nm)) { s += 0.5; ev.push('name contains an icon keyword'); }
  if (R.names && /icon/i.test(ctx)) { s += 0.2; ev.push('lives in an icon-named page or group'); }
  const w = Math.round(d.w || 0), h = Math.round(d.h || 0), mx = Math.max(w, h), mn = Math.min(w, h);
  if (mx > 0 && mx <= R.max && mn >= R.min) {
    s += mx <= 32 ? 0.25 : 0.2; ev.push(w + '×' + h + 'px is icon-sized'); if (mn / mx >= 0.8) s += 0.05;
    if (Math.abs(w - h) <= 1 && R.sizes.includes(w) && R.sizes.includes(h)) { s += 0.2; ev.push('standard icon size ' + w + '×' + h); }
    if (R.selfVector && VEC.includes(d.selfType)) { s += 0.3; ev.push('is a vector shape'); }
  }
  const t = d.types || [];
  if (t.some(x => VEC.includes(x)) && t.every(x => VEC.includes(x) || ['FRAME', 'GROUP', 'ELLIPSE', 'RECTANGLE', 'COMPONENT', 'INSTANCE'].includes(x)) && !d.hasText) { s += 0.25; ev.push('contains vector shapes and no text'); }
  if (d.hasText) { s -= 0.4; ev.push('contains text (less likely an icon)'); }
  s = Math.max(0, Math.min(1, s));
  return { score: Math.round(s * 100) / 100, isIcon: s >= 0.55, evidence: ev };
}

// ---------- CSS tokens (pure): exact names, aliases kept as var(), modes as [data-theme] ----------
const cssVar = n => '--' + String(n).split('/').map(slug).join('-');
const fontWeightValue = sty => { sty = String(sty || '').toLowerCase(); if (!sty) return null; return /black|heavy/.test(sty) ? 900 : /extra ?bold|ultra ?bold/.test(sty) ? 800 : /semi ?bold|demi/.test(sty) ? 600 : /bold/.test(sty) ? 700 : /medium/.test(sty) ? 500 : /normal|regular|book/.test(sty) ? 400 : /extra ?light|ultra ?light/.test(sty) ? 200 : /light/.test(sty) ? 300 : /thin|hairline/.test(sty) ? 100 : null; };
const fontWeightOf = sty => fontWeightValue(sty) || 400;
function cssUnit(t) {
  const n = t.name.toLowerCase(), c = t.category;
  if (['spacing', 'radius', 'size', 'border', 'breakpoint'].includes(c)) return 'px';
  if (c === 'typography') return /weight|family|style|ratio/.test(n) ? '' : 'px';
  if (c === 'motion') return /duration|delay|time/.test(n) ? 'ms' : '';
  return '';
}
function cssValue(t, v) {
  if (t.type === 'FLOAT') { let x = String(v); if (t.category === 'opacity' && Number(v) > 1) x = String(Math.round(Number(v)) / 100); return x + cssUnit(t); }
  if (t.type === 'STRING' && t.category === 'typography' && /weight/i.test(t.name)) return fontWeightValue(v);
  if (t.type === 'STRING') return '"' + String(v).replace(/"/g, '\\"') + '"';
  return String(v);
}
const lhCss = s => s === 'auto' ? 'normal' : /%$/.test(s) ? String(Math.round(parseFloat(s) * 100) / 10000) : s;
const lsCss = s => /%$/.test(s) ? (Math.round(parseFloat(s) * 100) / 10000) + 'em' : s;
const styleSlug = n => String(n).split('/').map(slug).join('-');
function nameHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
function cssNameMap(tokens) {
  const groups = {}, used = new Set(), byFigma = {}, byName = {}, collisions = [], nameCount = {};
  tokens.forEach(t => { const base = cssVar(t.name); (groups[base] = groups[base] || []).push(t); nameCount[t.name] = (nameCount[t.name] || 0) + 1; });
  Object.keys(groups).sort().forEach(base => {
    const list = groups[base].slice().sort((a, b) => String(a.collection || '').localeCompare(String(b.collection || '')) || String(a.figmaId).localeCompare(String(b.figmaId)) || a.name.localeCompare(b.name));
    list.forEach(t => {
      let nm = base;
      if (list.length > 1) {
        collisions.push(t.name);
        const suffix = nameHash(String(t.collection || '') + '\u0000' + String(t.figmaId));
        nm = base + '-' + suffix;
        let k = 2;
        while (used.has(nm)) nm = base + '-' + suffix + '-' + k++;
      }
      used.add(nm); byFigma[t.figmaId] = nm;
      if (nameCount[t.name] === 1) byName[t.name] = nm;
    });
  });
  return { byFigma, byName, collisions };
}
function tokensCss(M, tokens, only) {
  tokens = tokens || M.tokens;
  const N = cssNameMap(tokens), root = [], themes = {}, modeOrder = [];
  let keep = null;
  if (only) { keep = new Set(only); let ch = true; while (ch) { ch = false; tokens.forEach(t => { if (!keep.has(N.byFigma[t.figmaId])) return; Object.values(t.modes).forEach(r => { const a = r.aliasId ? N.byFigma[r.aliasId] : r.chain && r.chain.length ? N.byName[r.chain[0]] : null; if (a && !keep.has(a)) { keep.add(a); ch = true; } }); }); } }
  const L = [];
  if (!only) L.push('/* tokens.css — generated from the Figma file "' + M.fileName + '"', ' * Rules: see design.md > "Rules for AI agents". Use ONLY the variables and .text-* classes below, written exactly.', ' * If a value is missing, follow ai-control.md for the current adherence level. Comments show the exact Figma names. */', '');
  const allDep = tokens.length > 0 && tokens.every(t => t.origin === 'dependency');
  const byCol = {}; tokens.forEach(t => (byCol[t.collection] = byCol[t.collection] || []).push(t));
  Object.keys(byCol).sort().forEach(col => {
    const list = byCol[col].filter(t => !keep || keep.has(N.byFigma[t.figmaId])); if (!list.length) return; const modes = Object.keys(list[0].modes);
    root.push('', '  /* ' + col + ' */');
    list.forEach(t => {
      const valOf = m => {
        const r = t.modes[m]; if (!r || r.status !== 'resolved' || t.type === 'BOOLEAN') return null;
        const alias = r.aliasId ? N.byFigma[r.aliasId] : r.chain && r.chain.length ? N.byName[r.chain[0]] : null;
        if (alias) return 'var(' + alias + ')';
        return cssValue(t, r.value);
      };
      const base = valOf(modes[0]), name = N.byFigma[t.figmaId];
      if (base === null) { root.push('  /* ' + name + ': ' + t.name + ' — unresolved or unsupported type, not emitted */'); return; }
      root.push('  ' + name + ': ' + base + '; /* ' + t.name + (!allDep && t.origin === 'dependency' ? ' (dependency)' : '') + ' */');
      modes.slice(1).forEach(m => {
        const v = valOf(m); if (v === null || v === base) return;
        const key = styleSlug(m); if (!themes[key]) { themes[key] = { mode: m, lines: [] }; modeOrder.push(key); }
        themes[key].lines.push('  ' + name + ': ' + v + ';');
      });
    });
  });
  const DV = !only && M.enriched ? M.enriched.derived : [];
  if (DV.length) { root.push('', '  /* derived from the design (no Figma variable exists for these values) */'); DV.forEach(d => root.push('  ' + d.css + ': ' + d.value + ';')); }
  const S = only ? { text: [], paint: [], effect: [] } : (M.styles || { text: [], paint: [], effect: [] }), tl = [];
  S.text.forEach(s => { const k = '--text-' + styleSlug(s.name); root.push('', '  /* text style: ' + s.name + ' */', '  ' + k + '-family: "' + s.family + '";', '  ' + k + '-size: ' + s.size + 'px;', '  ' + k + '-weight: ' + fontWeightOf(s.fstyle) + ';', '  ' + k + '-line-height: ' + lhCss(s.lineHeight) + ';', '  ' + k + '-letter-spacing: ' + lsCss(s.letterSpacing) + ';');
    tl.push('.text-' + styleSlug(s.name) + ' { /* ' + s.name + ' */\n  font-family: var(' + k + '-family);\n  font-size: var(' + k + '-size);\n  font-weight: var(' + k + '-weight);\n  line-height: var(' + k + '-line-height);\n  letter-spacing: var(' + k + '-letter-spacing);\n' + (/italic/i.test(s.fstyle) ? '  font-style: italic;\n' : '') + '}'); });
  S.paint.forEach(s => { if (s.css) root.push('  --paint-' + styleSlug(s.name) + ': ' + s.css + '; /* paint style: ' + s.name + ' */'); });
  S.effect.forEach(s => { if (s.css) root.push('  --shadow-' + styleSlug(s.name) + ': ' + s.css + '; /* effect style: ' + s.name + ' */'); });
  L.push(':root {' + root.join('\n') + '\n}');
  modeOrder.forEach(k => L.push('', '[data-theme="' + k + '"] { /* mode: ' + themes[k].mode + ' */\n' + themes[k].lines.join('\n') + '\n}'));
  if (tl.length) L.push('', '/* ---- Text styles ---- */', tl.join('\n\n'));
  return { content: L.join('\n') + '\n', names: N };
}
function tokenMapData(M, tokens, N, css) {
  const rows = tokens.map(t => {
    const cssVar = N.byFigma[t.figmaId], emitted = new RegExp('(?:^|\\n)\\s*' + cssVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:').test(css || ''), modes = {};
    Object.entries(t.modes).forEach(([name, r]) => { modes[name] = { status: r.status, value: r.status === 'resolved' ? r.value : null, aliasId: r.aliasId || null, aliasIds: (t.aliasIds && t.aliasIds[name]) || [], chain: (r.chain || []).slice() }; });
    return { id: t.id, figmaId: t.figmaId, name: t.name, type: t.type, collection: t.collection, collectionId: t.collectionId || null, defaultMode: t.defaultMode || Object.keys(t.modes)[0] || null, cssVar, cssEmitted: emitted, role: t.role || 'unknown', roleStatus: t.roleStatus || 'observed', roleSource: t.roleSource || 'figma-structure', origin: t.origin, requiredBy: (t.requiredBy || []).slice(), usedBy: (t.usedBy || []).slice(), modes, status: Object.values(t.modes).every(r => r.status === 'resolved') ? 'resolved' : 'unresolved' };
  });
  const values = tokens.reduce((a, t) => a.concat(Object.values(t.modes)), []), count = status => values.filter(r => r.status === status).length;
  const stats = { sourceTokens: tokens.length, aliasTokens: tokens.filter(t => Object.values(t.modes).some(r => r.aliasId || (r.chain || []).length)).length, modeValues: { total: values.length, resolved: count('resolved'), unresolved: count('unresolved'), circular: count('circular'), invalid: count('invalid') }, cssVariables: rows.filter(t => t.cssEmitted).length, notEmitted: rows.filter(t => !t.cssEmitted).length, ambiguousValues: valueMatchIssues(tokens).length };
  const collections = (M.collections || []).map(c => ({ id: c.id || null, name: c.name, defaultMode: c.defaultMode || (c.modes || [])[0] || null, modes: (c.modes || []).map((m, i) => ({ name: m, id: c.modeMap && c.modeMap[m] || null, theme: i === 0 ? null : styleSlug(m), status: 'mapped' })) }));
  return { source: { type: 'figma', fileName: M.fileName }, stats, collections, tokens: rows };
}
function componentGraphData(M, rows, failed) {
  rows = rows || []; failed = failed || [];
  const components = M.components || [], byFamily = Object.fromEntries(components.map(c => [c.figmaId, c])), tokenById = Object.fromEntries((M.tokens || []).map(t => [t.figmaId, t])), tokenByName = Object.fromEntries((M.tokens || []).map(t => [t.name, t]));
  const instances = [];
  refFileNames(M).forEach(r => (r.components || []).forEach(u => {
    const detailed = Array.isArray(u.instances) && u.instances.length > 0, observed = detailed ? u.instances : [{ id: null, name: u.name }];
    observed.forEach(i => instances.push({ id: i.id || null, name: i.name || u.name, componentId: u.id, familyId: u.familyId || u.id, variantProperties: u.variantProperties || {}, referenceId: r.id, reference: r.name, page: r.page, file: 'reference/' + r.file, status: 'observed', evidence: detailed ? 'figma-instance' : 'figma-component-reference' }));
  }));
  instances.sort((a, b) => a.file.localeCompare(b.file) || String(a.id || '').localeCompare(String(b.id || '')) || a.componentId.localeCompare(b.componentId));
  const rowsFor = c => rows.filter(r => (r.familyId || r.variantOf || r.figmaId) === c.figmaId);
  const failedFor = c => failed.filter(f => f.id === c.id || String(f.id || '').indexOf(c.id + '.variant.') === 0 || f.figmaId === c.figmaId);
  const edges = [], families = components.map(c => {
    const successful = rowsFor(c), failures = failedFor(c), famInstances = instances.filter(i => i.familyId === c.figmaId);
    const variants = successful.map(r => ({ id: r.nodeId || r.figmaId, entityId: r.id, familyId: c.figmaId, name: r.metadata && r.metadata.name || r.name, exportName: r.name, properties: r.metadata && r.metadata.variantProperties || {}, isDefault: r.isDefault !== false, status: 'exported', file: r.file, usedIn: (r.usedIn || []).slice().sort() })).concat(failures.map(f => ({ id: f.figmaId || null, entityId: f.id, familyId: c.figmaId, name: f.name, exportName: f.name, properties: {}, isDefault: f.id === c.id, status: 'failed', file: null, error: f.reason, usedIn: [] })));
    variants.sort((a, b) => (a.isDefault === b.isDefault ? a.exportName.localeCompare(b.exportName) : a.isDefault ? -1 : 1));
    const dependencies = (c._nested || []).map(d => {
      const status = byFamily[d.nodeId] ? 'resolved' : d.remote ? 'external' : 'missing';
      edges.push({ from: c.figmaId, to: d.nodeId, type: 'nested-component', status });
      return { id: d.nodeId, name: d.name, status, remote: d.remote === true };
    }).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    const tokenIds = new Set(c._tokenIds || []); (c.tokens || []).forEach(n => { if (tokenByName[n]) tokenIds.add(tokenByName[n].figmaId); });
    const tokens = [...tokenIds].map(id => tokenById[id]).filter(Boolean).map(t => ({ id: t.id, figmaId: t.figmaId, name: t.name })).sort((a, b) => a.name.localeCompare(b.name) || a.figmaId.localeCompare(b.figmaId));
    const sourceVariants = c.variants || 1, status = failures.length ? (successful.length ? 'partial' : 'failed') : successful.length < sourceVariants ? 'partial' : 'extracted';
    const limitations = failures.map(f => 'HTML export failed for ' + f.name + ': ' + f.reason).concat(dependencies.filter(d => d.status !== 'resolved').map(d => 'Nested component ' + d.name + ' is ' + d.status + '.'));
    return { id: c.figmaId, entityId: c.id, name: c.name, kind: c.kind, page: c.page, description: c.description || '', properties: c.properties || [], states: c.states || [], variants, tokens, dependencies, instances: famInstances, usedIn: [...new Set(famInstances.map(i => i.file.replace(/^reference\//, '')))].sort(), extraction: { status, sourceVariants, exportedVariants: successful.length, failedVariants: failures.length, limitations } };
  });
  const stats = { families: families.length, sourceVariants: families.reduce((n, f) => n + f.extraction.sourceVariants, 0), exportedVariants: rows.length, failedVariants: failed.length, instances: instances.length, dependencies: edges.length, missingDependencies: edges.filter(e => e.status === 'missing').length, externalDependencies: edges.filter(e => e.status === 'external').length };
  return { families, edges, stats };
}

// ---------- Observed reference patterns ----------
const HTML_VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const htmlEntity = s => String(s || '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function htmlStructure(html) {
  const roots = [], stack = [], re = /<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>/g;
  let m;
  while ((m = re.exec(String(html || '')))) {
    const token = m[0];
    if (token.startsWith('<!--') || token.startsWith('<!')) continue;
    if (token.startsWith('</')) {
      const tag = token.slice(2, -1).trim().toLowerCase();
      for (let i = stack.length - 1; i >= 0; i--) if (stack[i].tag === tag) { stack.length = i; break; }
      continue;
    }
    const head = /^<([a-zA-Z][\w:-]*)/.exec(token);
    if (!head) continue;
    const tag = head[1].toLowerCase(), attrs = {}, body = token.slice(head[0].length, token.length - 1);
    const ar = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    let a;
    while ((a = ar.exec(body))) attrs[a[1].toLowerCase()] = htmlEntity(a[2] === undefined ? (a[3] === undefined ? a[4] : a[3]) : a[2]);
    const n = { id: null, tag, children: [] };
    if (attrs['data-component'] || attrs['data-component-family']) {
      n.componentId = attrs['data-component-id'] || null;
      n.componentName = attrs['data-component'] || attrs['data-component-family'];
      n.componentFamilyId = attrs['data-component-family-id'] || n.componentId;
      n.componentFamilyName = attrs['data-component-family'] || n.componentName;
      const variants = {};
      Object.keys(attrs).filter(k => k.startsWith('data-variant-')).sort().forEach(k => { variants[k.slice(13)] = attrs[k]; });
      if (Object.keys(variants).length) n.variantProperties = variants;
    }
    if (attrs.href || attrs['data-go']) n.link = true;
    if (attrs.type) n.control = attrs.type;
    (stack.length ? stack[stack.length - 1].children : roots).push(n);
    if (!token.endsWith('/>') && !HTML_VOID.has(tag)) stack.push(n);
  }
  return roots;
}
function sortedPatternProps(props) {
  const out = {};
  Object.keys(props || {}).sort().forEach(k => { out[k] = String(props[k]); });
  return out;
}
function normalizePatternNode(n) {
  const out = { tag: String(n.tag || 'div').toLowerCase() };
  const component = n.componentFamilyName || n.componentName;
  if (component) out.component = component;
  if (n.link) out.link = true;
  if (n.control) out.control = String(n.control);
  out.children = (n.children || []).map(normalizePatternNode);
  return out;
}
function patternFingerprint(key) {
  return 'structure-v1:' + nameHash(key) + '-' + nameHash('\u0000' + key) + '-' + key.length.toString(36);
}
function patternExceptions(occurrences) {
  const out = [], sizes = [...new Set(occurrences.map(o => o.width + 'x' + o.height))];
  if (sizes.length > 1) out.push({ type: 'viewport-size', observations: occurrences.map(o => ({ referenceId: o.referenceId, file: o.file, width: o.width, height: o.height })) });
  const byFamily = {};
  occurrences.forEach(o => (o.components || []).forEach(c => {
    const key = c.familyId || c.componentId || c.name;
    (byFamily[key] = byFamily[key] || []).push({ referenceId: o.referenceId, file: o.file, componentId: c.componentId, instanceId: c.instanceId, variantProperties: c.variantProperties });
  }));
  Object.keys(byFamily).sort().forEach(familyId => {
    const observations = byFamily[familyId], states = [...new Set(observations.map(o => JSON.stringify(o.variantProperties)))];
    if (states.length > 1) out.push({ type: 'component-variant', familyId, observations });
  });
  return out;
}
function patternData(M) {
  const groups = new Map();
  refFileNames(M).forEach(r => {
    const fromIr = !!r.structure, roots = fromIr ? [r.structure] : htmlStructure(r.body);
    if (!fromIr && roots.length === 1) roots[0].id = r.id;
    const structure = roots.filter(Boolean).map(normalizePatternNode), key = JSON.stringify(structure), nodes = [], components = [];
    const walk = (n, path) => {
      const row = { id: n.id || null, path: path.join('.'), tag: String(n.tag || 'div').toLowerCase() };
      if (n.componentId || n.componentName) {
        row.componentId = n.componentId || null;
        row.familyId = n.componentFamilyId || n.componentId || null;
        row.name = n.componentName || n.componentFamilyName;
        components.push({ componentId: row.componentId, familyId: row.familyId, name: row.name, instanceId: n.id || null, variantProperties: sortedPatternProps(n.variantProperties) });
      }
      nodes.push(row);
      (n.children || []).forEach((c, i) => walk(c, path.concat(i)));
    };
    roots.filter(Boolean).forEach((n, i) => walk(n, [i]));
    components.sort((a, b) => String(a.familyId || '').localeCompare(String(b.familyId || '')) || String(a.componentId || '').localeCompare(String(b.componentId || '')) || String(a.instanceId || '').localeCompare(String(b.instanceId || '')));
    const occurrence = { referenceId: r.id, reference: r.name, page: r.page, file: 'reference/' + r.file, width: r.w, height: r.h, evidenceLevel: fromIr ? 'figma-ir' : 'reference-html', nodes, components };
    if (!groups.has(key)) groups.set(key, { key, structure, occurrences: [] });
    groups.get(key).occurrences.push(occurrence);
  });
  const used = {}, patterns = [...groups.values()].sort((a, b) => a.key.localeCompare(b.key)).map(g => {
    const fingerprint = patternFingerprint(g.key), base = 'pattern.' + fingerprint.slice(fingerprint.indexOf(':') + 1);
    let id = base, i = 2; while (used[id]) id = base + '-' + i++; used[id] = true;
    const occurrences = g.occurrences.sort((a, b) => a.file.localeCompare(b.file) || a.referenceId.localeCompare(b.referenceId));
    const limitations = [];
    if (occurrences.some(o => o.evidenceLevel !== 'figma-ir')) limitations.push('Fallback HTML does not provide non-component Figma node IDs.');
    return { id, fingerprint, status: 'Observed', structure: g.structure, occurrences, exceptions: patternExceptions(occurrences), limitations };
  });
  const stats = { references: patterns.reduce((n, p) => n + p.occurrences.length, 0), patterns: patterns.length, repeatedPatterns: patterns.filter(p => p.occurrences.length > 1).length, groupedReferences: patterns.reduce((n, p) => n + (p.occurrences.length > 1 ? p.occurrences.length : 0), 0), singletonPatterns: patterns.filter(p => p.occurrences.length === 1).length };
  return { schemaVersion: '1.0.0', status: 'Observed', fingerprint: { algorithm: 'dual-fnv1a32-length', normalization: 'html-structure-v1', excludes: ['text content', 'generated class names', 'inline styles', 'Figma node IDs', 'component variant values'] }, limitations: ['Patterns describe observed HTML structure, not inferred semantic intent or visual similarity.'], stats, patterns };
}

// ---------- Reference HTML documents (pure assembly) ----------
const fileSlug = (name, used) => { const base = slug(name); let k = base, i = 2; while (used[k]) k = base + '-' + i++; used[k] = 1; return k; };
const GOOGLE_FONTS = new Set('inter,roboto,open sans,lato,poppins,montserrat,vazirmatn,vazir,noto sans,noto sans arabic,noto naskh arabic,noto kufi arabic,nunito,nunito sans,raleway,source sans 3,source sans pro,dm sans,work sans,manrope,ibm plex sans,ibm plex sans arabic,playfair display,merriweather,cairo,tajawal,almarai,rubik,mulish,ubuntu,oswald,outfit,sora,plus jakarta sans,space grotesk,figtree,lexend,jost,barlow,karla,quicksand,josefin sans,fira sans,heebo,assistant,pt sans,roboto condensed,roboto mono,jetbrains mono,fira code,inconsolata,cormorant garamond,lora,libre baskerville,dm serif display,arvo,bebas neue,anton,archivo,red hat display,urbanist,albert sans,instrument sans,geist,readex pro,harmattan,lalezar,changa,reem kufi,markazi text,amiri,scheherazade new,mada,el messiri,baloo bhaijaan 2'.split(','));
const isGoogleFont = f => GOOGLE_FONTS.has(String(f).toLowerCase());
const fontsLink = f => { const fam = Object.keys(f || {}).filter(isGoogleFont); return fam.length ? '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?' + fam.map(n => 'family=' + encodeURIComponent(n).replace(/%20/g, '+') + ':wght@' + [...new Set((f[n] || []).concat([400]))].sort((a, b) => a - b).join(';')).join('&') + '&display=swap">' : ''; };
const fontsCss = all => Object.keys(all).filter(f => !isGoogleFont(f)).sort().map(f => '@font-face { font-family: "' + f + '"; src: local("' + f + '"), url("fonts/' + f + '.woff2") format("woff2"), url("fonts/' + f + '.ttf") format("truetype"), url("fonts/' + f + '.otf") format("opentype"); font-weight: 100 900; font-display: swap; }').join('\n');
function extractDataImages(text, files) {
  return String(text).replace(/data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)/g, (m, kind, b64) => {
    if (b64.length < 2000) return m; let h = 5381; for (let i = 0; i < b64.length; i++) h = ((h << 5) + h + b64.charCodeAt(i)) | 0;
    const path = 'assets/' + (h >>> 0).toString(36) + b64.length.toString(36) + '.' + (kind === 'jpeg' ? 'jpg' : kind); if (!files.has(path)) files.set(path, b64); return path;
  });
}
const REF_CSS = '*{box-sizing:border-box;margin:0;padding:0}body{background:#fff;-webkit-font-smoothing:antialiased}:where(body button){font:inherit;color:inherit;background:transparent;border:none;cursor:pointer;text-align:inherit}:where(body img){display:block;max-width:100%}';
/** File name for a frame: the frame's own name, only made filesystem-safe. */
function refFileName(name, used) {
  const clean = String(name).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'frame';
  let k = clean, i = 2; while (used[k.toLowerCase()]) k = clean + ' (' + i++ + ')';
  used[k.toLowerCase()] = 1; return k + '.html';
}
/** Names are assigned once per analysis, so every document and index agrees. */
function refFileNames(M) {
  const refs = M.refs || [], used = {};
  refs.forEach(r => { if (r.file) used[r.file.toLowerCase()] = 1; });
  refs.forEach(r => { if (!r.file) r.file = refFileName(r.name, used); });
  return refs;
}
/** Prototype destinations become the file names of the frames actually in the package. */
function frameLinks(body, targets) {
  return body.replace(/data-go="([^"]+)"/g, (m, id) => (targets[id] ? 'data-go="' + targets[id] + '"' : m));
}
/** One frame, one HTML file: nothing but the frame and the CSS it needs. */
function refDoc(M, r, vars) {
  const fonts = r.fonts || {}, targets = {};
  refFileNames(M).forEach(x => { targets[x.id] = x.file; });
  const custom = Object.keys(fonts).filter(f => !isGoogleFont(f)).sort();
  const own = {}; custom.forEach(f => { own[f] = fonts[f]; });
  return '<!doctype html>\n<html lang="en"' + (r.rtl ? ' dir="rtl"' : '') + '>\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + escH(r.name) + '</title>\n' + fontsLink(fonts) +
    '<!-- Figma frame "' + escH(r.name) + '" (' + escH(r.page) + ') · ' + r.w + '×' + r.h + ' px · rendered by ' + escH(r.engine || 'the HTML engine') + '. Values come from the token variables below; see tokens.css. -->\n' +
    '<style>\n' + vars + '\n' + REF_CSS + '\n' + (r.css || '') + '\n' +
    (custom.length ? '/* Custom fonts are not on Google Fonts: drop ' + custom.map(f => '"' + f + '.woff2"').join(', ') + ' into a fonts/ folder next to this file. */\n' + fontsCss(own) + '\n' : '') +
    '</style>\n</head>\n<body>\n' + frameLinks(r.body, targets) + '\n</body>\n</html>\n';
}
function referenceFiles(M, toks) {
  const files = [], refs = refFileNames(M), embed = !!M.refEmbed, bin = new Map();
  refs.forEach(r => {
    if (!embed) (r.files || []).forEach(f => bin.set(f.path, f.base64));
    files.push({ path: 'reference/' + r.file, content: refDoc(M, r, tokensCss(M, toks, new Set(r.vars || [])).content), tier: 0 });
  });
  bin.forEach((b64, p) => files.push({ path: 'reference/' + p, content: b64, binary: true, tier: 0 }));
  return files;
}

// ---------- AI control: adherence level 0-10 ----------
const LEVELS = [
  ['Strict', 'Assemble screens only from existing components, using exact variants and sizes from components.md. Copy existing patterns and layouts as they appear in the reference frames.', 'Invent layouts, components, spacing combinations or states.', 'Stop and report `MISSING TOKEN` or `MISSING COMPONENT`.'],
  ['Near-strict', 'Same as 0, and also reorder, repeat or remove existing blocks and change content (text, data).', 'Create new component structures.', 'Stop and report `MISSING TOKEN` or `MISSING COMPONENT`.'],
  ['Faithful', 'Compose new screens from existing components and patterns, using any existing spacing and size tokens.', 'Create new components or variants.', 'Stop and report `MISSING TOKEN` or `MISSING COMPONENT`.'],
  ['Guided', 'Create new layouts and compositions from existing components, using any existing variant or state.', 'Create new component structures.', 'Use the closest existing token and list it under "Closest-match substitutions".'],
  ['Balanced', 'Build simple new components from existing tokens and text styles, following the naming convention.', 'Leave the visual language of the system.', 'Use the closest existing token and list it under "Closest-match substitutions".'],
  ['Flexible', 'Create new components and layouts; vary density, hierarchy and alignment; combine tokens freely.', 'Use values outside the token set.', 'Use the closest existing token and list it under "Closest-match substitutions".'],
  ['Adaptive', 'Propose alternative layouts and flows; extend components with new states or variants built from tokens.', 'Use values outside the token set.', 'Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name.'],
  ['Creative', 'Introduce new patterns, visual hierarchy ideas, motion (using motion tokens if they exist) and imagery placeholders.', 'Use values outside the token set.', 'Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name.'],
  ['Exploratory', 'Rethink layout and structure substantially; deliver 2–3 distinct options; propose new components.', 'Use values outside the token set.', 'Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name.'],
  ['Bold', 'Explore composition, rhythm and expression freely within the palette and type scale.', 'Use values outside the token set.', 'Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name.'],
  ['Open', 'Maximum creative freedom: treat the system as a visual language and propose new tokens, components and patterns.', 'Write a literal value inline. Every value is a token or a named proposed token.', 'Add it to a "Proposed tokens" list (name, value, reason) and reference it by that name.']
];
const clampLevel = n => Math.max(0, Math.min(10, Math.round(Number(n))) || 0);
/** The slider's five positions, each mapped to a real level of ai-control.md. */
const CREATIVITY_STEPS = [['Strict', 0, 100], ['Conservative', 2, 80], ['Balanced', 5, 60], ['Creative', 7, 40], ['Open', 10, 20]];
function levelPicker() {
  return CREATIVITY_STEPS.map((s, position) => ({
    position, label: s[0], adherence: s[1], rule: s[2], creative: 100 - s[2], levelName: LEVELS[s[1]][0]
  }));
}
function levelLine(n) { const L = LEVELS[clampLevel(n)]; return 'Level ' + clampLevel(n) + ' — ' + L[0] + '. You may: ' + L[1] + ' You must not: ' + L[2] + ' If something is missing: ' + L[3]; }
function aiControlMd(level) {
  const n = clampLevel(level), L = LEVELS[n];
  return '---\nadherence_level: ' + n + '\n---\n# AI Control — adherence to the design system\n\nAdherence goes from 0 (follow the rules exactly) to 10 (maximum creative freedom). **Change the number above to change the behavior.** You can also tell the AI: "set adherence_level to 7".\n\n' +
    '## How to use (for AI agents)\n\n1. At the start of every task, read `adherence_level` from the front matter above. Re-read it every time; the user may have changed it.\n2. Apply the "Always" rules and the behavior of the current level.\n3. End your answer with `Adherence level used: N`.\n\n' +
    '## Always (every level)\n\n- Never write a literal color, size, spacing, radius, shadow or font value. Use `var(--name)` from tokens.css and the `.text-*` classes.\n- Never edit tokens.css or the Figma variables and styles.\n- Never use a font, text style or icon that is not in the system. Creativity lives in composition, hierarchy and structure, not in hand-set styles.\n- Creativity never changes how values are written: every value stays a token (or a named proposed token at levels 6–10).\n\n' +
    '## Current level: ' + n + ' — ' + L[0] + '\n\n- You may: ' + L[1] + '\n- You must not: ' + L[2] + '\n- If something is missing: ' + L[3] + '\n\n' +
    '## All levels\n\n' + tbl(['Level', 'Name', 'You may', 'You must not', 'If something is missing'], LEVELS.map((x, i) => [i, x[0], x[1], x[2], x[3]]));
}

function skillMd(M, X) {
  const comps = M.components || [], refs = M.refs || [], html = (M.componentHtml && M.componentHtml.ok) || [];
  const files = ['`design.md` — rules and overview', '`tokens.css` — every value', '`components.css` + `components/*.html` — component markup and spec', '`components/index.json` — component graph and observed reference patterns'];
  if (refs.length) files.push('`reference/*.html` — one file per frame, that frame only');
  files.push('`manifest.json` — sources, entities and outputs');
  return '---\nname: ' + slug(M.fileName || 'design-system') + '-design-system\ndescription: Design system exported from the Figma file "' + (M.fileName || '') + '". Use when building UI that must follow these tokens, components and rules.\n---\n' +
    '# ' + (M.fileName || 'Design System') + ' — agent entrypoint\n\n' +
    'This package is the source of truth. Do not restyle it from screenshots; read the files.\n\n' +
    '## Read order\n\n' + files.map((f, i) => (i + 1) + '. ' + f).join('\n') + '\n\n' +
    '## Authority\n\n' +
    '- Values come from `tokens.css` only: colors, spacing, radius, borders, shadows, typography.\n' +
    '- Components come from `components/index.json`; the HTML next to it is the canonical markup for the default variant.\n' +
    '- `reference/` pages are evidence of composition, not a source of values.\n' +
    '- If a value or component is missing, say so and propose a token; never hard-code a replacement.\n\n' +
    '## Rules\n\n' +
    '- Use `var(--name)` and the `.text-*` classes; never literals.\n' +
    '- Keep component structure and class names from `components/*.html` unless the user asks for a variant.\n' +
    '- Do not edit `tokens.css`, `components.css` or `manifest.json` by hand.\n' +
    '- Read `ai-control.md` before creative work: its `adherence_level` controls how far you may deviate.\n\n' +
    '## Inventory\n\n' + tbl(['Item', 'Count'], [['Tokens', (M.tokens || []).length], ['Components', comps.length], ['Component HTML', html.length], ['Icons', X && X.icons ? X.icons.total : 0], ['Reference pages', refs.length], ['Observed patterns', X && X.patterns ? X.patterns.stats.patterns : 0], ['Text styles', M.styles.text.length]]) +
    (comps.length ? '\n## Components\n\n' + comps.slice(0, 40).map(c => '- ' + c.name + ' (' + c.kind + ', ' + c.variants + ' variant(s))').join('\n') + '\n' : '') +
    (refs.length ? '\n## References\n\n' + refFileNames(M).slice(0, 40).map(r => '- ' + r.name + ' → `reference/' + r.file + '`').join('\n') + '\n' : '');
}

const r2n = v => Math.round(v * 100) / 100;
const estTokens = s => Math.ceil(String(s).length / 4);
const GENERIC_NAME = /^(frame|group|rectangle|ellipse|vector|section|page|artboard|untitled)[\s_-]*\d*$/i;
const hexRgb = h => { h = String(h).replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
function nearestColor(hexv, list) {
  const a = hexRgb(hexv); let best = null;
  list.forEach(t => { const b = hexRgb(t.hex), d = Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2)); if (!best || d < best.d) best = { css: t.css, hex: t.hex, d: Math.round(d * 10) / 10 }; });
  return best;
}
function uniquifyComponents(components) {
  const seen = {}; components.forEach(c => { c.baseName = c.baseName || c.name; });
  components.forEach(c => { const k = c.baseName; seen[k] = (seen[k] || 0) + 1; if (seen[k] > 1) { c.name = k + ' (' + seen[k] + ')'; c.id = 'component.' + slug(c.name); } });
}
function matchTextStyle(t, styles) {
  if (t.size == null) return { exact: [], near: [] };
  const same = styles.filter(s => Math.abs(s.size - t.size) < 0.5), lhPx = s => /px$/.test(s.lineHeight) ? parseFloat(s.lineHeight) : null, cls = s => '.text-' + styleSlug(s.name);
  const exact = same.filter(s => (!t.weight || fontWeightOf(s.fstyle) === t.weight) && (t.lh == null || lhPx(s) == null || Math.abs(lhPx(s) - t.lh) < 0.5));
  return { exact: exact.map(cls), near: same.filter(s => exact.indexOf(s) < 0).map(cls) };
}
const PACKS_RE = [['Iconsax', /(^|\/)(vuesax|iconsax)(\/|$)/i], ['Lucide Icons', /lucide/i], ['Phosphor Icons', /(^|\/)ph[-/]|phosphor/i], ['Tabler Icons', /tabler/i], ['Heroicons', /heroicons?/i], ['Remix Icon', /(^|\/)ri[-/]|remix/i],
  ['Material Symbols', /material|(^|\/)md[-/]/i], ['Font Awesome', /(^|\/)fa[srlb]?[-/]|font ?awesome/i], ['Icons8', /icons8/i], ['Streamline Icons', /streamline/i], ['Radix Icons', /radix/i], ['Fluent UI Icons', /fluent/i], ['Eva Icons', /(^|\/)eva[-/]/i],
  ['Hugeicons', /huge ?icons/i], ['Solar Icons', /solar/i], ['Iconoir', /iconoir/i], ['Iconly', /iconly/i]];
function guessPack(names) {
  let best = null; PACKS_RE.forEach(p => { const n = names.filter(x => p[1].test(x)).length; if (n && (!best || n > best.n)) best = { name: p[0], n }; });
  return best && best.n / Math.max(names.length, 1) >= 0.4 ? best.name : '';
}
function iconSummary(M) {
  const I = M.icons || []; if (!I.length) return null;
  const used = I.filter(i => (i.usedIn || []).length), lib = I.filter(i => !(i.usedIn || []).length), pref = {}, sizes = {};
  I.forEach(i => { const p = i.name.split('/').slice(0, -1).join('/'); if (p) pref[p] = (pref[p] || 0) + 1; sizes[i.w + '×' + i.h] = (sizes[i.w + '×' + i.h] || 0) + 1; });
  const topPref = Object.keys(pref).sort((a, b) => pref[b] - pref[a])[0] || '', topSize = Object.keys(sizes).sort((a, b) => sizes[b] - sizes[a])[0];
  const guess = M.iconPack ? '' : guessPack(I.filter(i => i.named).map(i => i.name)), uniqNames = [...new Set(I.filter(i => i.named).map(i => i.name))];
  const byName = {}; used.forEach(i => { const o = byName[i.name] = byName[i.name] || { name: i.name, w: i.w, h: i.h, kind: i.kind, places: new Set(), n: 0 }; o.n++; (i.usedIn || []).forEach(x => o.places.add(x)); });
  return { total: I.length, uniqueNamed: uniqNames.length, unnamed: I.filter(i => !i.named).length, usedList: Object.keys(byName).sort().map(k => ({ name: k, w: byName[k].w, h: byName[k].h, kind: byName[k].kind, places: [...byName[k].places].sort() })), libraryCount: lib.length, pack: M.iconPack || guess, packSource: M.iconPack ? 'chosen by you' : guess ? 'inferred from icon names' : '', pattern: topPref ? topPref + '/{name}' : '', size: topSize || '', examples: uniqNames.slice(0, 6) };
}
function groupScreens(M) {
  const all = M.screens || [], real = all.filter(s => !s.sheet), sheets = all.filter(s => s.sheet), by = {};
  real.forEach(s => (by[s.page] = by[s.page] || []).push(s));
  const klass = w => w >= 1024 ? 'desktop (≥1024px)' : w <= 480 ? 'mobile (≤480px)' : 'tablet/other';
  return { pages: Object.keys(by).sort().map(pg => { const L = by[pg], sz = {}; L.forEach(s => { const k = klass(s.w); sz[k] = (sz[k] || 0) + 1; }); return { page: pg, count: L.length, sizes: sz, named: [...new Set(L.filter(s => !GENERIC_NAME.test(String(s.name).trim())).map(s => s.name))] }; }), sheets: sheets.length, total: all.length };
}
function deriveTokens(components, taken) {
  const sp = {}, rad = {}, bw = {};
  components.forEach(c => (c.spec || []).forEach(x => { if (x.bound || !x.raw) return; const v = parseFloat(x.raw); if (!isFinite(v) || v <= 0) return; if (/^(padding-|gap$)/.test(x.prop)) sp[v] = (sp[v] || 0) + 1; else if (x.prop === 'border-radius') rad[v] = (rad[v] || 0) + 1; else if (x.prop === 'border-width') bw[v] = (bw[v] || 0) + 1; }));
  const out = [], mk = (map, prefix, cat) => Object.keys(map).map(Number).sort((a, b) => a - b).forEach(v => { let css = '--' + prefix + '-' + String(v).replace('.', '-'); while (taken[css]) css += '-d'; taken[css] = 1; out.push({ css, value: v + 'px', category: cat, uses: map[v], px: v }); });
  mk(sp, 'space', 'spacing'); mk(rad, 'radius', 'radius'); mk(bw, 'border-width', 'border'); return out;
}
const bindingCss = (x, N) => (x.boundId && N.byFigma[x.boundId]) || N.byName[x.bound] || cssVar(x.bound);
function enrichModel(M) {
  if (M.enriched) return M.enriched;
  uniquifyComponents(M.components);
  const N = cssNameMap(M.tokens), taken = {}; Object.keys(N.byFigma).forEach(k => taken[N.byFigma[k]] = 1);
  const colorCandidates = colorValueCandidates(M.tokens);
  const colorToks = M.tokens.filter(t => t.type === 'COLOR').map(t => { const r = Object.values(t.modes)[0]; return r && r.status === 'resolved' && colorCandidates[String(r.value).toUpperCase()].length === 1 ? { css: N.byFigma[t.figmaId], hex: String(r.value).slice(0, 7).toUpperCase(), role: t.role } : null; }).filter(Boolean).sort((a, b) => (a.role === 'semantic' ? 0 : 1) - (b.role === 'semantic' ? 0 : 1));
  const derived = deriveTokens(M.components, taken), dmap = {}; derived.forEach(d => dmap[d.px + '|' + d.category] = d.css);
  const cov = { total: 0, bound: 0, derived: 0, exact: 0, nearest: 0, text: { total: 0, bound: 0, exact: 0, near: 0, none: 0 } }, gaps = {};
  M.components.forEach(c => {
    const lines = [], sp = c.spec || [], get = p => sp.find(x => x.prop === p), box = (names, mapKey) => {
      const items = names.map(n => get(n)); if (!items.some(Boolean)) return null;
      return items.map(x => { if (!x) return '0'; const v = parseFloat(x.raw); if (x.bound) { cov.total++; cov.bound++; return 'var(' + (bindingCss(x, N)) + ')'; } if (!isFinite(v) || v === 0) return '0'; cov.total++; cov.derived++; return 'var(' + dmap[v + '|' + mapKey] + ')'; });
    };
    lines.push('display: flex; flex-direction: ' + ((get('flex-direction') || {}).raw || 'row') + ';'); if (!get('display')) lines.pop();
    const pad = box(['padding-top', 'padding-right', 'padding-bottom', 'padding-left'], 'spacing');
    if (pad && pad.some(v => v !== '0')) lines.push('padding: ' + (pad[0] === pad[2] && pad[1] === pad[3] ? (pad[0] === pad[1] ? pad[0] : pad[0] + ' ' + pad[1]) : pad.join(' ')) + ';');
    const gap = box(['gap'], 'spacing'); if (gap && gap[0] !== '0') lines.push('gap: ' + gap[0] + ';');
    const rd = box(['border-radius'], 'radius'); if (rd && rd[0] !== '0') lines.push('border-radius: ' + rd[0] + ';');
    const bwid = box(['border-width'], 'border');
    const colorOf = x => {
      cov.total++;
      if (x.bound) { cov.bound++; return { v: 'var(' + (bindingCss(x, N)) + ')', note: '' }; }
      const hx = String(x.raw).slice(0, 7).toUpperCase(), nn = nearestColor(hx, colorToks); if (!nn) return { v: x.raw, note: '' };
      if (nn.d === 0) { cov.exact++; return { v: 'var(' + nn.css + ')', note: '' }; }
      cov.nearest++; const g = gaps[hx] = gaps[hx] || { hex: hx, uses: 0, nearest: nn }; g.uses++; return { v: 'var(' + nn.css + ')', note: ' /* Figma: ' + hx + ' has no token; nearest, distance ' + nn.d + ' */' };
    };
    const bc = get('border-color'), bg = get('background-color');
    if (bwid && bc && bwid[0] !== '0') { const cc = colorOf(bc); lines.push('border: ' + bwid[0] + ' solid ' + cc.v + ';' + cc.note); }
    if (bg) { const cc = colorOf(bg); lines.push('background-color: ' + cc.v + ';' + cc.note); }
    const w = get('width'), h = get('height'); if (w && h && !w.bound && !h.bound) lines.push('width: ' + w.raw + '; height: ' + h.raw + '; /* fixed size from Figma */'); else { if (w) lines.push('width: ' + (w.bound ? 'var(' + (bindingCss(w, N)) + ')' : w.raw) + ';'); if (h) lines.push('height: ' + (h.bound ? 'var(' + (bindingCss(h, N)) + ')' : h.raw) + ';'); }
    const texts = [];
    sp.filter(x => x.prop === 'text').forEach(x => { cov.text.total++; if (x.textStyle) { cov.text.bound++; texts.push('"' + x.node + '" → .text-' + styleSlug(x.textStyle)); return; } const m = matchTextStyle({ size: x.size, weight: x.weight, lh: x.lh }, M.styles.text || []); if (m.exact.length) { cov.text.exact++; texts.push('"' + x.node + '" → ' + m.exact[0] + ' (exact match: ' + x.raw + ')'); } else if (m.near.length) { cov.text.near++; texts.push('"' + x.node + '" → closest ' + m.near.slice(0, 2).join(' or ') + ' (same size, weight differs)'); } else { cov.text.none++; texts.push('"' + x.node + '" → no text style has size ' + x.raw + ' (report it, do not invent one)'); } });
    c.css = { lines, texts };
  });
  M.enriched = { derived, colorGaps: Object.keys(gaps).map(k => gaps[k]).sort((a, b) => b.uses - a.uses), coverage: cov, icons: iconSummary(M), screens: groupScreens(M), patterns: patternData(M) };
  return M.enriched;
}

// ---------- Project context rendering (compact) ----------
function ctxMd(C, rejInf, X, contentPack) {
  const rej = new Set(rejInf || []), L = [];
  const src = k => (C.src && C.src[k]) || '', tag = k => /user/.test(src(k)) ? '' : src(k) ? ' (' + src(k).replace(/\s*\(.*$/, '') + ')' : '';
  if (C.product.name) L.push('- Product: ' + C.product.name + (C.provided && /user/.test(src('Product')) ? '' : ' (from the Figma file name)'));
  if (C.product.description && !C.descAuto) L.push('- Description: ' + C.product.description);
  if (C.users.length) L.push('- Users: ' + C.users.join(', ') + tag('Users')); if (C.goals.length) L.push('- Goals: ' + C.goals.join(', ') + tag('Goals'));
  if (C.capabilities.length) L.push('- Capabilities: ' + C.capabilities.join(', ')); if (C.flows.length) L.push('- Flows: ' + C.flows.join(', '));
  if (C.platforms.length) L.push('- Platforms: ' + C.platforms.join(', ')); if (C.localization.language) L.push('- Language: ' + C.localization.language + tag('Language')); if (C.localization.direction) L.push('- Direction: ' + C.localization.direction + tag('Direction'));
  C.notes.forEach(n => L.push('- Note: ' + n));
  if (X && X.screens && X.screens.total) L.push('- Screens: ' + (X.screens.total - X.screens.sheets) + ' top-level frame(s) on ' + X.screens.pages.length + ' page(s)' + (X.screens.sheets ? ', ' + X.screens.sheets + ' icon sheet(s) excluded' : '') + (contentPack ? ' (details in content.md)' : ''));
  C.inferences.filter(i => !rej.has(i.id)).forEach(i => L.push('- [inference ' + Math.round(i.confidence * 100) + '%] ' + i.statement + ' — ' + i.evidence.join('; ')));
  const miss = C.unknown.filter(u => !(u === 'Product' && C.product.name) && !(u === 'Description' && C.product.description));
  if (miss.length && C.provided) L.push('- Not provided: ' + miss.join(', '));
  return '## Project Context\n\n' + (C.provided ? '' : '_No user-provided context._\n\n') + L.join('\n') + '\n';
}

// ---------- Frame inference (clusters, icon sheets excluded by the caller) ----------
function inferFromFrames(frames, texts) {
  const out = [], w = frames.map(f => f.w).filter(Boolean), n = w.length, narrow = w.filter(x => x <= 480).length, wide = w.filter(x => x >= 1024).length;
  if (n >= 3 && wide >= 2 && wide / n >= 0.15) out.push({ field: 'platforms', value: 'web', statement: 'Platform may include web or desktop', confidence: 0.65, evidence: [wide + ' of ' + n + ' top-level frames are 1024px wide or more'] });
  if (n >= 3 && narrow >= 2 && narrow / n >= 0.15) out.push({ field: 'platforms', value: 'mobile', statement: 'Platform may include mobile', confidence: 0.65, evidence: [narrow + ' of ' + n + ' top-level frames are 480px wide or less'] });
  const t = (texts || []).join(' '), rtl = (t.match(/[\u0590-\u08FF]/g) || []).length, letters = (t.match(/\p{L}/gu) || []).length;
  if (letters >= 12 && rtl / letters > 0.3) {
    out.push({ field: 'direction', value: 'RTL', statement: 'Text direction may be RTL', confidence: 0.7, evidence: [Math.round(rtl / letters * 100) + '% of letters in page, frame and component names are right-to-left script'] });
    const fa = /[\u067E\u0686\u0698\u06AF\u06A9\u06CC]/.test(t);
    out.push({ field: 'language', value: fa ? 'Persian' : 'Arabic', statement: 'Language may be ' + (fa ? 'Persian' : 'Arabic'), confidence: 0.6, evidence: ['right-to-left script found in names' + (fa ? ' (Persian-specific letters present)' : '')] });
  }
  return out;
}

// ---------- Validation (weighted, explainable) ----------
function validate(M, extra) {
  const X = enrichModel(M), issues = (extra || []).slice(), add = (code, severity, entityId, message, recovery) => issues.push({ code, severity, entityId, message, recovery });
  M.tokens.forEach(t => Object.entries(t.modes).forEach(([m, r]) => {
    if (r.status === 'circular') add('TOKEN_CIRCULAR_REFERENCE', 'error', t.id, 'Circular alias in mode "' + m + '".', 'Review token aliases.');
    else if (r.status === 'unresolved') add('TOKEN_UNRESOLVED_REFERENCE', 'error', t.id, 'Alias target missing in mode "' + m + '".', 'Restore or relink the aliased variable.');
    else if (r.status === 'invalid') add('TOKEN_INVALID_VALUE', 'warning', t.id, 'Unsupported value type in mode "' + m + '".', 'Check variable value.');
    else if (r.status === 'resolved' && !r.chain.length && cssValue(t, r.value) === null) add('TOKEN_INVALID_CSS_VALUE', 'error', t.id, 'Value cannot be mapped to valid CSS in mode "' + m + '".', 'Use a standard value or bind the token explicitly.');
  }));
  const sepOf = n => n.includes('/') ? '/' : n.includes('.') ? '.' : n.includes('-') ? '-' : 'none', cnt = {};
  M.tokens.forEach(t => { const s = sepOf(t.name); cnt[s] = (cnt[s] || 0) + 1; });
  const dom = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]; let bad = 0;
  M.tokens.forEach(t => { if (sepOf(t.name) !== dom) { bad++; add('NAMING_INCONSISTENT', 'warning', t.id, 'Name differs from dominant separator "' + dom + '".', 'Rename for consistency.'); } });
  M.components.forEach(c => {
    if (!c.description) add('COMPONENT_UNDOCUMENTED', 'warning', c.name, 'No description.', 'Add a component description in Figma.');
    if (c.kind === 'component-set' && !c.states.length) add('COMPONENT_NO_STATES', 'info', c.name, 'No State variant property detected.', 'Add a State property if the component is interactive.');
    if (c.css && c.css.texts.some(x => /closest|no text style/.test(x))) add('TEXT_STYLE_NOT_BOUND', 'info', c.name, 'Text is not bound to a text style.', 'Bind the text to the suggested text style in Figma.');
  });
  X.colorGaps.forEach(g => add('COLOR_NOT_TOKENIZED', 'info', g.hex, 'Color used ' + g.uses + '× has no token (nearest ' + g.nearest.css + ', distance ' + g.nearest.d + ').', 'Create a color variable or use the nearest token.'));
  const tr = M.tokens.reduce((a, t) => a + Object.values(t.modes).filter(r => r.status === 'resolved').length, 0), tt = M.tokens.reduce((a, t) => a + Object.keys(t.modes).length, 0), dims = [], cov = X.coverage;
  if (tt) dims.push({ name: 'Token integrity', w: 3, score: Math.round(tr / tt * 100), basis: tr + ' of ' + tt + ' mode values resolved' });
  if (M.tokens.length) dims.push({ name: 'Naming consistency', w: 1, score: Math.round((M.tokens.length - bad) / M.tokens.length * 100), basis: (M.tokens.length - bad) + ' of ' + M.tokens.length + ' names follow "' + dom + '"' });
  if (cov.total) dims.push({ name: 'Variable coverage', w: 3, score: Math.round(cov.bound / cov.total * 100), basis: cov.bound + ' of ' + cov.total + ' style properties in components are bound to Figma variables' });
  if (cov.text.total) dims.push({ name: 'Text-style coverage', w: 2, score: Math.round(cov.text.bound / cov.text.total * 100), basis: cov.text.bound + ' of ' + cov.text.total + ' text layers use a text style' });
  if (M.components.length) {
    const d = M.components.filter(c => c.description).length, s = M.components.filter(c => c.kind === 'component' || c.states.length).length;
    dims.push({ name: 'Documentation', w: 1, score: Math.round(d / M.components.length * 100), basis: d + ' of ' + M.components.length + ' components documented' });
    dims.push({ name: 'State coverage', w: 1, score: Math.round(s / M.components.length * 100), basis: s + ' of ' + M.components.length + ' components with states (or single)' });
  }
  const W = dims.reduce((a, d) => a + d.w, 0);
  return { issues, dims, overall: dims.length ? Math.round(dims.reduce((a, d) => a + d.score * d.w, 0) / W) : null, errors: issues.filter(i => i.severity === 'error').length, warnings: issues.filter(i => i.severity === 'warning').length, info: issues.filter(i => i.severity === 'info').length };
}
function aggregateIssues(issues) {
  const by = {}; issues.forEach(i => { const k = i.severity + '|' + i.code; (by[k] = by[k] || { severity: i.severity, code: i.code, recovery: i.recovery, items: [], message: i.message }).items.push(i.entityId); });
  const rank = { error: 3, warning: 2, info: 1 };
  return Object.keys(by).map(k => by[k]).sort((a, b) => rank[b.severity] * b.items.length - rank[a.severity] * a.items.length || a.code.localeCompare(b.code));
}
// ---------- Markdown builders ----------
const anchorOf = s => String(s).toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-');
const modeVal = t => { const ks = Object.keys(t.modes); if (ks.length === 1) { const r = t.modes[ks[0]]; return r.status === 'resolved' ? r.value : '(' + r.status + ')'; } return modeStr(t); };
const capList = (a, n) => a.length > n ? a.slice(0, n).join(', ') + ' +' + (a.length - n) : a.join(', ');
function iconsMd(M, X) {
  const I = X.icons; if (!I && !M.iconPack) return '';
  if (!I) return '\n## Icons\n\n- Icon pack: ' + M.iconPack + '\n';
  const L = ['\n## Icons\n', '- Icon pack: ' + (I.pack || 'Not provided') + (I.packSource ? ' (' + I.packSource + ')' : ''), '- Detected: ' + I.total + ' (' + I.uniqueNamed + ' distinct names' + (I.unnamed ? ', ' + I.unnamed + ' without a meaningful name' : '') + ')', '- Used in the selected design: ' + I.usedList.length];
  if (I.size) L.push('- Typical size: ' + I.size + 'px'); if (I.pattern) L.push('- Naming pattern: `' + I.pattern + '`'); if (I.libraryCount) L.push('- ' + I.libraryCount + ' more icons exist in the library but are not used in the selected design' + (I.examples.length ? ' (examples: ' + I.examples.join(', ') + '). The full list is in icons.json (Full / Agent mode)' : ''));
  L.push('', 'Use an icon from the pack by name; never draw a custom icon.', '');
  if (I.usedList.length) L.push(tbl(['Icon', 'Size', 'Used in'], I.usedList.slice(0, 80).map(i => [i.name, i.w + '×' + i.h, capList(i.places, 4)])) + (I.usedList.length > 80 ? '\n_+' + (I.usedList.length - 80) + ' more used icons._\n' : ''));
  return L.join('\n') + '\n';
}
function componentsMd(M, X, TCN) {
  const iconNames = new Set((M.icons || []).map(i => i.name));
  let t = '# Components\n\n';
  const sizeOf = c => { const d = c.variantDims || []; if (!d.length) return ''; const u = [...new Set(d.map(v => v.w + '×' + v.h))]; return u.length === 1 ? u[0] : u.length + ' sizes'; };
  if (M.components.length) {
    t += tbl(['Component', 'Kind', 'Variants', 'Size', 'Page'], M.components.map(c => ['[' + c.name + '](#' + anchorOf(c.name) + ')', c.kind, c.variants, sizeOf(c) || '—', c.page])) + '\n';
    M.components.forEach(c => {
      const head = ['`' + c.id + '`', c.kind, 'page: ' + c.page, c.variants + ' variant(s)', 'figma:' + c.figmaId]; if (c.origin === 'dependency') head.push('dependency of ' + c.requiredBy.join(', '));
      t += '## ' + c.name + '\n\n' + head.join(' · ') + '\n' + (c.description ? '\nPurpose: ' + c.description + '\n' : '') + '\n';
      const d = c.variantDims || [], u = [...new Set(d.map(v => v.w + '×' + v.h))];
      if (u.length > 1) t += '**Dimensions by variant**\n\n' + tbl(['Variant', 'Width', 'Height'], d.map(v => [v.name, v.w + 'px', v.h + 'px'])) + '\n'; else if (u.length === 1) t += '**Size:** ' + u[0] + 'px (all variants)\n\n';
      if (c.properties.length) t += '**Properties**\n\n' + tbl(['Name', 'Type', 'Default', 'Options'], c.properties.map(p => [p.name, p.type, p.default, (p.options || []).join(', ')])) + '\n';
      if (c.states.length) t += '**States:** ' + c.states.join(', ') + '\n\n';
      const tv = c.tokens.map(n => '`' + (TCN.byName[n] || cssVar(n)) + '`'); if (tv.length) t += '**Tokens:** ' + tv.join(', ') + '\n\n';
      const ic = c.dependencies.filter(x => iconNames.has(x) || (X.icons && X.icons.pattern && x.indexOf(X.icons.pattern.split('/{')[0].split('/')[0] + '/') === 0)), oth = c.dependencies.filter(x => ic.indexOf(x) < 0);
      if (oth.length || ic.length) t += '**Uses:** ' + [oth.length ? 'components: ' + oth.join(', ') : '', ic.length ? 'icons: ' + ic.length + ' (' + capList(ic, 4) + ')' : ''].filter(Boolean).join('; ') + '\n\n';
      if (c.css && c.css.lines.length) t += '**Spec (CSS, default variant)**\n\n```css\n.' + slug(c.name) + ' {\n' + c.css.lines.map(l => '  ' + l).join('\n') + '\n}\n```\n\n';
      if (c.css && c.css.texts.length) t += '**Text**\n\n' + c.css.texts.map(x => '- ' + x).join('\n') + '\n\n';
    });
  } else t += NA + '\n';
  return t + iconsMd(M, X);
}
function contentMd(M, rejInf) {
  const X = enrichModel(M), C = M.context, rej = new Set(rejInf || []), list = a => a.map(x => '- ' + x).join('\n'), cats = {}; M.tokens.forEach(t => cats[t.category] = (cats[t.category] || 0) + 1);
  let s = '# Content & Product Handoff\n\n> For a designer or AI agent who continues this product. Facts come from Figma or from you; derived rules and inferences are marked.\n\n';
  s += '## Product\n\n- Name: ' + (C.product.name || 'Not provided') + '\n' + (C.product.description && !C.descAuto ? '- Description: ' + C.product.description + '\n' : '') + '- Source file: ' + M.fileName + '\n';
  const given = [['Users', C.users], ['Goals', C.goals], ['Capabilities', C.capabilities], ['Flows', C.flows]].filter(x => x[1].length);
  given.forEach(x => s += '\n## ' + x[0] + '\n\n' + list(x[1]) + '\n');
  const miss = ['Users', 'Goals', 'Capabilities', 'Flows'].filter(k => !given.some(x => x[0] === k));
  s += '\n## Platforms & Localization\n\n- Platforms: ' + (C.platforms.join(', ') || 'Not provided') + '\n- Language: ' + (C.localization.language || 'Not provided') + '\n- Direction: ' + (C.localization.direction || 'Not provided') + '\n';
  if (C.notes.length) s += '\n## Notes\n\n' + list(C.notes) + '\n';
  const themeN = M.collections.filter(c => c.modes.length > 1);
  s += '\n## Design system at a glance\n\n- Tokens: ' + M.tokens.length + (X.derived.length ? ' + ' + X.derived.length + ' derived' : '') + ' (' + (Object.keys(cats).sort().map(k => k + ' ' + cats[k]).join(', ') || 'none') + ')\n- Themes: ' + (themeN.length ? themeN.map(c => c.name + ' [' + c.modes.join(', ') + ']').join('; ') : 'single mode') + '\n- Text styles: ' + M.styles.text.length + '\n- Components: ' + M.components.length + '\n- Icons: ' + (X.icons ? X.icons.total + ' (pack: ' + (X.icons.pack || 'not provided') + ')' : 'none') + '\n- Token naming separator: "' + domSep(M.tokens) + '"\n';
  s += '\n## Components\n\n' + (M.components.length ? tbl(['Component', 'Variants', 'States', 'Purpose'], M.components.map(c => [c.name, c.variants, c.states.join(', ') || '—', c.description || '—'])) : NA);
  const S = X.screens;
  s += '\n## Screens & structure\n\n';
  if (!S.total) s += NA; else {
    S.pages.forEach(p => { s += '- **' + p.page + '** — ' + p.count + ' frame(s): ' + Object.keys(p.sizes).map(k => p.sizes[k] + ' ' + k).join(', ') + (p.named.length ? '. Named: ' + capList(p.named, 10) : '') + '\n'; });
    if (S.sheets) s += '- ' + S.sheets + ' icon sheet(s) were recognized and are not counted as screens.\n';
  }
  s += '\n## Guidance for continuing (derived from the data)\n\n- Use only variables and `.text-*` classes from tokens.css, written exactly; never hard-code values.\n- Follow the "' + domSep(M.tokens) + '" naming separator and reuse the existing components before creating new ones.\n';
  if (themeN.length) s += '- Support every theme mode: ' + themeN.map(c => c.modes.join(', ')).join('; ') + '.\n';
  const inf = C.inferences.filter(i => !rej.has(i.id));
  if (inf.length) s += '\n## Inferences (not verified)\n\n' + inf.map(i => '- [' + Math.round(i.confidence * 100) + '%] ' + i.statement + ' — ' + i.evidence.join('; ')).join('\n') + '\n';
  if (miss.length) s += '\n## To complete\n\nAdd in the Content step and regenerate: ' + miss.join(', ') + '.\n';
  return s;
}
function rulesMd(M) {
  const themes = (M.collections || []).filter(c => c.modes.length > 1);
  return '\n### Rules for AI agents (mandatory)\n\n1. Use ONLY the CSS variables, `.text-*` classes, paint and shadow variables defined in tokens.css (including the derived tokens), written exactly: `var(--name)`. tokens.css is the single source of truth for values.\n' +
    '2. Never write a literal color, spacing, radius, shadow or font value. Never estimate, round or "normalize" a value. The only literals allowed are the fixed component sizes (width, height) given in components.md.\n3. Typography: use only the `.text-*` classes listed under Typography. Font sizes that are not listed do not exist.\n' +
    '4. Component structure and sizes: take them from components.md (Size and Spec CSS). The Spec already uses tokens; do not guess heights, paddings or radii.\n5. Prefer semantic tokens over primitive tokens.\n' +
    '6. If a needed value does not exist, follow the "If something is missing" line of the current level in ai-control.md (strict levels: stop and report `MISSING TOKEN: <what is needed>`; higher levels: closest token or a named proposed token). Never invent a literal value.\n' +
    (themes.length ? '7. Support every theme mode via `[data-theme="<mode>"]`: ' + [...new Set([].concat(...themes.map(c => c.modes)))].join(', ') + '.\n' : '7. This file has a single mode; no theme switching is needed.\n') +
    '8. Before answering, list every variable and class you used and confirm each exists in tokens.css.\n9. Creative freedom is set by `adherence_level` (0–10) in ai-control.md. Read it before every task. Rules 1 and 2 never change at any level.\n';
}
function packageLintFindings(files, M) {
  const findings = [], byPath = new Map(files.map(f => [f.path, f])), parsed = {};
  const add = (code, severity, file, location, message, recovery) => findings.push({ code, severity, file, location: location || 'root', message, recovery });
  const at = (content, index) => { const before = content.slice(0, Math.max(0, index)); const line = before.split('\n').length, col = index - before.lastIndexOf('\n'); return 'line ' + line + ', column ' + col; };
  const resolveRef = (from, raw) => {
    let value = String(raw || '').trim(); if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return null;
    const hash = value.indexOf('#'), anchor = hash >= 0 ? value.slice(hash + 1) : ''; value = value.slice(0, hash >= 0 ? hash : undefined).split('?')[0];
    try { value = decodeURIComponent(value); } catch (e) { return { invalid: true, anchor }; }
    const base = value.startsWith('/') ? [] : from.split('/').slice(0, -1), parts = base.concat(value.split('/')), out = [];
    for (const part of parts) { if (!part || part === '.') continue; if (part === '..') { if (!out.length) return { invalid: true, anchor }; out.pop(); } else out.push(part); }
    return { path: out.join('/'), anchor };
  };
  const checkRef = (file, raw, index, root) => {
    const r = resolveRef(root ? '' : file, raw); if (!r) return;
    const content = (byPath.get(file) || {}).content || '', loc = at(content, index || 0);
    if (r.invalid || !r.path && !r.anchor) { add('PACKAGE_INVALID_REFERENCE', 'error', file, loc, 'Invalid internal reference "' + raw + '".', 'Use a valid package-relative path.'); return; }
    const targetPath = r.path || file, target = byPath.get(targetPath);
    if (!target) { add('PACKAGE_BROKEN_REFERENCE', 'error', file, loc, 'Target "' + raw + '" does not exist.', 'Generate the target or remove the reference.'); return; }
    if (!r.anchor || typeof target.content !== 'string') return;
    const anchor = decodeURIComponent(r.anchor), found = /\.md$/i.test(targetPath)
      ? (target.content.match(/^#{1,6}\s+.+$/gm) || []).some(h => anchorOf(h.replace(/^#{1,6}\s+/, '')) === anchor)
      : new RegExp('\\bid=["\\\']' + anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\\\']').test(target.content);
    if (!found) add('PACKAGE_BROKEN_ANCHOR', 'error', file, loc, 'Anchor "' + r.anchor + '" does not exist in ' + targetPath + '.', 'Link to an existing heading or element ID.');
  };
  files.forEach(f => {
    if (f.binary || typeof f.content !== 'string') return;
    if (/\.json$/i.test(f.path)) {
      try { parsed[f.path] = JSON.parse(f.content); } catch (e) { add('JSON_INVALID', 'error', f.path, at(f.content, Number((String(e.message).match(/position\s+(\d+)/) || [])[1]) || 0), e.message, 'Fix the JSON syntax.'); }
    }
    if (/\.md$/i.test(f.path)) { const re = /!?\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+[^)]*)?\)/g; let m; while ((m = re.exec(f.content))) checkRef(f.path, m[1] || m[2], m.index); }
    if (/\.html$/i.test(f.path)) { const re = /\b(?:href|src|data-go)\s*=\s*["']([^"']+)["']/g; let m; while ((m = re.exec(f.content))) checkRef(f.path, m[1], m.index); }
    if (/\.(?:css|html)$/i.test(f.path)) {
      const re = /url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g; let m; while ((m = re.exec(f.content))) checkRef(f.path, m[2], m.index);
      const im = /@import\s+(?:url\()?\s*["']([^"']+)["']/g; while ((m = im.exec(f.content))) checkRef(f.path, m[1], m.index);
    }
    if (/\.css$/i.test(f.path)) {
      const opens = (f.content.match(/\{/g) || []).length, closes = (f.content.match(/\}/g) || []).length;
      if (opens !== closes) add('CSS_UNBALANCED_BLOCK', 'error', f.path, 'root', 'CSS has ' + opens + ' opening and ' + closes + ' closing braces.', 'Fix the generated CSS block structure.');
      const bad = /(?:\[object Object\]|\bundefined\b|\bNaN\b|font-weight\s*:\s*(?:Regular|Bold|Medium)\b)/.exec(f.content);
      if (bad) add('CSS_INVALID_VALUE', 'error', f.path, at(f.content, bad.index), 'Invalid CSS value "' + bad[0] + '".', 'Use a resolved, standards-based CSS value.');
    }
  });
  const schema = (path, predicate, message) => { if (Object.prototype.hasOwnProperty.call(parsed, path) && !predicate(parsed[path])) add('JSON_SCHEMA_INVALID', 'error', path, 'root', message, 'Regenerate the file with the required schema.'); };
  schema('manifest.json', x => x && !Array.isArray(x) && x.entities && !Array.isArray(x.entities), 'manifest.json requires an entities object.');
  schema('components/index.json', x => x && typeof x.schemaVersion === 'string' && Array.isArray(x.components) && Array.isArray(x.failed) && (!Object.prototype.hasOwnProperty.call(x, 'patterns') || x.patterns && Array.isArray(x.patterns.patterns) && x.patterns.stats), 'Component index requires schemaVersion, components and failed; patterns, when present, require stats and pattern rows.');
  schema('validation-report.json', x => x && Array.isArray(x.issues) && Array.isArray(x.dims), 'Validation report requires issues and dims arrays.');
  schema('metadata.json', x => x && typeof x.schemaVersion === 'string' && typeof x.generatedAt === 'string', 'metadata.json requires schemaVersion and generatedAt.');
  schema('metadata/token-map.json', x => x && Array.isArray(x.tokens) && Array.isArray(x.collections) && x.stats && x.stats.modeValues, 'token-map.json requires stats, collections and tokens.');
  schema('icons.json', Array.isArray, 'icons.json must contain an array.');
  schema('rules/validation-rules.json', Array.isArray, 'validation-rules.json must contain an array.');
  const defined = new Set(), globalCss = byPath.get('tokens.css');
  files.forEach(f => { if (!f.binary && typeof f.content === 'string' && /\.(?:css|html)$/i.test(f.path)) { const re = /(--[\w-]+)\s*:/g; let m; while ((m = re.exec(f.content))) defined.add(m[1]); } });
  files.forEach(f => { if (!f.binary && typeof f.content === 'string' && /\.(?:css|html)$/i.test(f.path)) { const re = /var\(\s*(--[\w-]+)/g; let m; while ((m = re.exec(f.content))) if (!defined.has(m[1])) add('CSS_TOKEN_UNDEFINED', 'error', f.path, at(f.content, m.index), 'Variable ' + m[1] + ' is not defined in the package.', 'Define the variable or use an existing token.'); } });
  const man = parsed['manifest.json'];
  if (man && man.entities && !Array.isArray(man.entities)) {
    const entries = Object.entries(man.entities), tokenEntries = entries.filter(([, e]) => e.source && e.source.type === 'figma_variable'), componentEntries = entries.filter(([, e]) => e.source && /^figma_component/.test(e.source.type));
    if (tokenEntries.length !== M.tokens.length) add('MANIFEST_COUNT_MISMATCH', 'error', 'manifest.json', 'entities', tokenEntries.length + ' token entities do not match ' + M.tokens.length + ' model tokens.', 'Generate manifest statistics from the shared model.');
    if (componentEntries.length !== M.components.length) add('MANIFEST_COUNT_MISMATCH', 'error', 'manifest.json', 'entities', componentEntries.length + ' component entities do not match ' + M.components.length + ' model components.', 'Generate manifest statistics from the shared model.');
    entries.forEach(([id, e]) => {
      const out = e.output || {};
      if (out.cssVar) { if (!globalCss || !defined.has(out.cssVar)) add('MANIFEST_TOKEN_MISSING', 'error', 'manifest.json', 'entities.' + id + '.output.cssVar', out.cssVar + ' is not defined in tokens.css.', 'Use the CSS name generated for this token.'); const md = byPath.get('tokens.md'); if (md && !md.content.includes('`' + out.cssVar + '`')) add('TOKEN_DOCUMENTATION_MISMATCH', 'error', 'tokens.md', 'entities.' + id, out.cssVar + ' is missing from tokens.md.', 'Generate token documentation from the same model.'); }
      if (out.mdPath) checkRef('manifest.json', out.mdPath, 0, true);
      if (out.html) checkRef('manifest.json', out.html, 0, true);
    });
  }
  const tokenMap = parsed['metadata/token-map.json'];
  if (tokenMap && Array.isArray(tokenMap.tokens)) {
    if (tokenMap.tokens.length !== M.tokens.length) add('TOKEN_MAP_COUNT_MISMATCH', 'error', 'metadata/token-map.json', 'tokens', tokenMap.tokens.length + ' token rows do not match ' + M.tokens.length + ' model tokens.', 'Generate token-map.json from the shared model.');
    tokenMap.tokens.forEach(t => { if (t.cssEmitted && (!globalCss || !defined.has(t.cssVar))) add('TOKEN_MAP_CSS_MISMATCH', 'error', 'metadata/token-map.json', 'tokens.' + t.id + '.cssVar', (t.cssVar || '(missing)') + ' is marked emitted but is absent from tokens.css.', 'Use the CSS name generated for this token.'); });
    if (man && man.stats && man.stats.tokens && JSON.stringify(man.stats.tokens) !== JSON.stringify(tokenMap.stats)) add('TOKEN_STATS_MISMATCH', 'error', 'manifest.json', 'stats.tokens', 'Manifest token statistics differ from token-map.json.', 'Generate both statistics objects from one calculation.');
  }
  const index = parsed['components/index.json'];
  if (index && Array.isArray(index.components)) {
    index.components.forEach(c => { if (c.file) checkRef('', c.file, 0, true); (c.usedIn || []).forEach(u => checkRef('', 'reference/' + u, 0, true)); });
    if (index.coverage && (index.coverage.exportedVariants !== index.components.length || index.coverage.failedVariants !== index.failed.length)) add('COMPONENT_COVERAGE_MISMATCH', 'error', 'components/index.json', 'coverage', 'Component coverage counts do not match the exported and failed rows.', 'Calculate coverage from the shared extraction results.');
    const graph = index.graph;
    if (graph && Array.isArray(graph.families)) {
      const local = new Set(M.components.map(c => c.figmaId));
      if (graph.families.length !== M.components.length) add('COMPONENT_GRAPH_COUNT_MISMATCH', 'error', 'components/index.json', 'graph.families', 'Component graph does not cover every extracted component family.', 'Build graph families from the shared component model.');
      graph.families.forEach(f => {
        (f.dependencies || []).forEach(d => { if (d.status === 'resolved' && !local.has(d.id)) add('COMPONENT_GRAPH_DEPENDENCY_INVALID', 'error', 'components/index.json', 'graph.families.' + f.id + '.dependencies', 'Resolved dependency ' + d.id + ' is absent from the component model.', 'Resolve dependencies by their stable Figma IDs.'); });
        (f.instances || []).forEach(i => { if (i.file) checkRef('', i.file, 0, true); });
      });
      if (graph.stats && (graph.stats.exportedVariants !== index.components.length || graph.stats.failedVariants !== index.failed.length)) add('COMPONENT_GRAPH_STATS_MISMATCH', 'error', 'components/index.json', 'graph.stats', 'Component graph statistics disagree with the component index.', 'Calculate graph and index coverage from the same rows.');
    }
    const observed = index.patterns;
    if (observed && Array.isArray(observed.patterns)) {
      const expected = patternData(M), prints = x => x.map(p => p.fingerprint).sort();
      if (JSON.stringify(observed.stats) !== JSON.stringify(expected.stats)) add('PATTERN_STATS_MISMATCH', 'error', 'components/index.json', 'patterns.stats', 'Observed pattern counts differ from the grouped reference evidence.', 'Group references by normalized structure before calculating pattern counts.');
      if (JSON.stringify(prints(observed.patterns)) !== JSON.stringify(prints(expected.patterns))) add('PATTERN_FINGERPRINT_MISMATCH', 'error', 'components/index.json', 'patterns.patterns', 'Pattern fingerprints differ from the normalized reference structures.', 'Regenerate fingerprints from the shared structure normalization.');
      observed.patterns.forEach(p => (p.occurrences || []).forEach(o => {
        const source = (M.refs || []).find(r => r.id === o.referenceId);
        if (!source || o.file !== 'reference/' + source.file) add('PATTERN_EVIDENCE_INVALID', 'error', 'components/index.json', 'patterns.patterns.' + p.id + '.occurrences', 'Pattern evidence does not match a source reference and its HTML file.', 'Link observations to the exact exported reference.');
        if (o.file) checkRef('', o.file, 0, true);
      }));
      if (man && man.stats && man.stats.patterns && JSON.stringify(man.stats.patterns) !== JSON.stringify(observed.stats)) add('PATTERN_STATS_MISMATCH', 'error', 'manifest.json', 'stats.patterns', 'Manifest pattern statistics differ from the observed pattern index.', 'Generate both statistics objects from the grouped reference data.');
    }
  }
  const names = {}; (M.collections || []).forEach(c => { names[c.name] = (names[c.name] || 0) + 1; });
  Object.keys(names).filter(n => names[n] > 1).forEach(n => add('COLLECTION_DUPLICATE_NAME', 'warning', 'tokens.css', 'collection ' + n, 'Collection name "' + n + '" is ambiguous.', 'Rename duplicate collections in Figma.'));
  (M.collections || []).forEach(c => {
    const list = M.tokens.filter(t => t.collection === c.name), modes = c.modes || [];
    modes.slice(1).forEach(mode => {
      const differs = list.some(t => { const first = t.modes[modes[0]] || Object.values(t.modes)[0], cur = t.modes[mode]; return first && cur && first.status === 'resolved' && cur.status === 'resolved' && (first.value !== cur.value || (first.chain || []).join('|') !== (cur.chain || []).join('|')); });
      if (differs && globalCss && !globalCss.content.includes('[data-theme="' + styleSlug(mode) + '"]')) add('THEME_MODE_MISSING', 'error', 'tokens.css', 'mode ' + mode, 'Mode "' + mode + '" has different values but no theme selector.', 'Emit an explicit mapping for every source mode.');
    });
  });
  return findings;
}
function lintPackage(files, M) {
  const by = p => (files.find(f => f.path === p) || { content: '' }).content, md = files.filter(f => /\.md$/.test(f.path)), mdAll = md.map(f => f.content).join('\n'), tokensTotal = md.reduce((a, f) => a + estTokens(f.content), 0);
  const comp = by('components.md'), design = by('design.md'), css = by('tokens.css'), checks = [], findings = packageLintFindings(files, M);
  const add = (id, label, w, pass, detail, partial) => checks.push({ id, label, w, got: pass ? w : (partial || 0), pass, detail });
  add('size', 'Total Markdown size is small enough for an AI context', 10, tokensTotal <= 30000, '≈ ' + tokensTotal + ' tokens (limit 30000)', tokensTotal <= 60000 ? 5 : 0);
  const iconRows = (comp.split('## Icons')[1] || '').split('\n').filter(l => /^\| /.test(l)).length - 2;
  add('icons', 'Icon library is summarized, not dumped', 10, iconRows <= 80, Math.max(iconRows, 0) + ' icon rows (limit 80)');
  const heads = comp.match(/^## .+$/gm) || [], dup = heads.filter((h, i) => heads.indexOf(h) !== i), ids = (comp.match(/^`component\.[^`]+`/gm) || []), dupId = ids.filter((h, i) => ids.indexOf(h) !== i);
  add('unique', 'Component names and IDs are unique', 10, !dup.length && !dupId.length, dup.length + dupId.length + ' duplicate(s)');
  const noise = (design + by('tokens.md') + comp + css).match(/\d+\.\d{4,}/g) || [];
  add('floats', 'No floating-point noise in numbers', 5, !noise.length, noise.length + ' value(s)');
  let lit = 0; (comp.match(/```css[\s\S]*?```/g) || []).forEach(b => b.split('\n').forEach(l => { const m = l.match(/^\s+([a-z-]+):\s*(.*)$/); if (!m || /^(width|height|min-|max-)/.test(m[1])) return; const v = m[2].replace(/\/\*.*?\*\//g, '').replace(/width:\s*[\d.]+px;?\s*height:\s*[\d.]+px;?/, ''); if (/#[0-9a-fA-F]{3,8}\b/.test(v) || /\b\d*\.?\d+px\b/.test(v)) lit++; }));
  add('literals', 'Spec CSS has no literal colors or spacing (rules match the data)', 10, lit === 0, lit + ' literal line(s)');
  const unguided = (comp.match(/^- ".*"(?! →).*$/gm) || []).length;
  add('text', 'Every text layer has a mapping, a suggestion or an explicit report', 10, unguided === 0, unguided + ' text layer(s) without guidance');
  const boiler = (mdAll.match(/not available from the selected sources/gi) || []).length;
  add('boiler', 'No repeated boilerplate', 5, boiler <= 3, boiler + ' repeated notice(s)');
  const generic = (mdAll.match(/Frame \d{6,}/g) || []).length;
  add('names', 'No meaningless frame names', 5, generic === 0, generic + ' generic name(s)');
  add('dupfacts', 'Frame list appears once (no duplication across files)', 5, !/Frame "/.test(design), /Frame "/.test(design) ? 'frame list in design.md' : 'ok');
  add('order', 'design.md starts with a read order', 5, /### Read order/.test(design), 'read order');
  const mentioned = (design.match(/- Package: ([^\n]+)/) || ['', ''])[1].split(',').map(x => x.trim().replace(/ \(this file\)| \(HTML\)/g, '').replace(/\/ .*$/, '/')).filter(Boolean), missing = mentioned.filter(m => !files.some(f => f.path === m || f.path.indexOf(m) === 0));
  add('exists', 'Every file named in the package line exists', 5, missing.length === 0, missing.length ? 'missing: ' + missing.join(', ') : 'ok');
  add('integrity', 'JSON, internal references, CSS variables and manifests are consistent', 10, findings.length === 0, findings.length + ' finding(s)');
  const multi = (M.collections || []).some(c => c.modes.length > 1), contr = !multi && /Support every theme mode/.test(mdAll + css);
  add('contra', 'No contradictions (themes, rules and data agree)', 5, !contr, contr ? 'theme rule without modes' : 'ok');
  const rows = (by('validation.md').split('## Findings')[1] || '').split('\n').filter(l => /^\| /.test(l)).length - 2, sourceIssues = (M.validation && M.validation.issues) || [];
  add('valid', 'Validation findings are aggregated and self-check reflects source findings', 5, rows <= 25 && !sourceIssues.some(i => i.severity === 'error' || i.severity === 'warning'), Math.max(rows, 0) + ' grouped row(s), ' + sourceIssues.filter(i => i.severity === 'error' || i.severity === 'warning').length + ' error/warning finding(s)');
  const total = checks.reduce((a, c) => a + c.w, 0), got = checks.reduce((a, c) => a + c.got, 0);
  return { score: Math.round(got / total * 100), checks, findings };
}
function gen(M, mode, rejected, rejInf) {
  const X = enrichModel(M), OS = M.sections, on = k => OS[k] !== false, V = M.validation, rej = new Set(rejected || []), minimal = mode === 'minimal', files = [];
  const toks = M.tokens.map(t => t.categorySource === 'name-heuristic' && rej.has(t.category) ? Object.assign({}, t, { category: 'other' }) : t);
  const cats = {}; toks.forEach(t => (cats[t.category] = cats[t.category] || []).push(t));
  const catNames = Object.keys(cats).sort(), nStyles = M.styles.text.length + M.styles.paint.length + M.styles.effect.length;
  const TC = tokensCss(M, toks), TCN = TC.names, TM = tokenMapData(M, toks, TCN, TC.content), TS = TM.stats, tmById = Object.fromEntries(TM.tokens.map(t => [t.id, t])), allDep = toks.length > 0 && toks.every(t => t.origin === 'dependency');
  const usedStr = t => { const u = t.usedBy || []; return u.length ? capList(u, 4) : '—'; };
  const catTbl = c => tbl(['Figma name', 'CSS variable', 'Role', 'Value', 'Alias', 'Used by'], cats[c].map(t => [t.name + (!allDep && t.origin === 'dependency' ? ' (dependency)' : ''), tmById[t.id].cssEmitted ? '`' + TCN.byFigma[t.figmaId] + '`' : '— (not emitted)', t.role, modeVal(t), (Object.values(t.modes)[0].chain || []).join(' → ') || '—', usedStr(t)]));
  const anyLib = M.styles.text.some(s => s.origin === 'library');
  const textClassTbl = tbl(['Figma text style', 'CSS class', 'Font', 'Size', 'Weight', 'Line height', 'Letter spacing'].concat(anyLib ? ['Origin'] : []), M.styles.text.map(s => [s.name, '`.text-' + styleSlug(s.name) + '`', s.family, s.size + 'px', fontWeightOf(s.fstyle), lhCss(s.lineHeight), lsCss(s.letterSpacing)].concat(anyLib ? [s.origin || 'local'] : [])));
  const themes = M.collections.filter(c => c.modes.length > 1);
  const derivedTbl = X.derived.length ? tbl(['CSS variable', 'Value', 'Used'], X.derived.map(d => ['`' + d.css + '`', d.value, d.uses + '×'])) : '';
  const gapTbl = X.colorGaps.length ? tbl(['Figma color', 'Used', 'Nearest token', 'Distance'], X.colorGaps.map(g => [g.hex, g.uses + '×', '`' + g.nearest.css + '` (' + g.nearest.hex + ')', g.nearest.d])) : '';

  // ---- tokens.md
  if ((on('tokens') && (toks.length || M.styles.paint.length || M.styles.effect.length || X.derived.length)) && !minimal) {
    let t = '# Tokens\n\nValues live in `tokens.css`; this file explains them.\n\n## Accounting\n\n' + tbl(['Measure', 'Count'], [['Source tokens', TS.sourceTokens], ['Tokens with aliases', TS.aliasTokens], ['Mode values', TS.modeValues.total], ['Resolved mode values', TS.modeValues.resolved], ['Unresolved / circular / invalid mode values', TS.modeValues.unresolved + ' / ' + TS.modeValues.circular + ' / ' + TS.modeValues.invalid], ['CSS variables emitted from source tokens', TS.cssVariables], ['Source tokens not emitted', TS.notEmitted], ['Ambiguous shared color values', TS.ambiguousValues]]) + '\nCounts differ by definition: a source token can contain several mode values, and unresolved or unsupported tokens are not emitted as CSS variables.\n\n';
    catNames.forEach(c => { t += '## ' + c + '\n\n' + (cats[c][0].categorySource === 'name-heuristic' ? '_Category inferred from variable names._\n\n' : '') + catTbl(c) + '\n'; });
    if (derivedTbl) t += '## Derived tokens\n\nValues used in the design that have no Figma variable. They are real tokens in tokens.css; use them instead of literals.\n\n' + derivedTbl + '\n';
    if (gapTbl) t += '## Colors used but not tokenized\n\nA design-system gap: these colors appear in components without a variable. The nearest token is used in the Spec CSS.\n\n' + gapTbl + '\n';
    if (M.styles.paint.length) t += '## Paint styles\n\n' + tbl(['Style', 'CSS variable', 'Value', 'Origin'], M.styles.paint.map(s => [s.name, s.css ? '`--paint-' + styleSlug(s.name) + '`' : '—', s.value, s.origin || 'local'])) + '\n';
    if (M.styles.effect.length) t += '## Effect styles\n\n' + tbl(['Style', 'CSS variable', 'Value', 'Origin'], M.styles.effect.map(s => [s.name, s.css ? '`--shadow-' + styleSlug(s.name) + '`' : '—', s.value, s.origin || 'local'])) + '\n';
    files.push({ path: 'tokens.md', content: t, tier: 1 });
  }
  // ---- components.md, content.md
  if (!minimal && on('components') && (M.components.length || (M.icons || []).length || M.iconPack)) files.push({ path: 'components.md', content: componentsMd(M, X, TCN), tier: 1 });
  if (M.contentPack) files.push({ path: 'content.md', content: contentMd(M, rejInf), tier: 0 });
  // ---- tokens.css, reference, component HTML, ai-control
  if (toks.length || nStyles || X.derived.length) files.push({ path: 'tokens.css', content: TC.content, tier: 0 });
  files.push({ path: 'SKILL.md', content: skillMd(M, X), tier: 0 });
  referenceFiles(M, toks).forEach(f => files.push(f));
  const CH = M.componentHtml || { ok: [], failed: [] }, compFiles = {};
  const compUsed = {};
  refFileNames(M).forEach(r => (r.components || []).forEach(u => {
    const page = r.file || r.name + '.html';
    [u.id, u.familyId].forEach(k => { if (k) ((compUsed[k] = compUsed[k] || new Set()).add(page)); });
  }));
  if (!minimal && (CH.ok.length || CH.failed.length || (M.refs || []).length)) {
    const used = {}, rows = [];
    let ccss = '/* Component HTML rendered by ' + (CH.engine || 'the HTML engine') + '. Values come from tokens.css. */\n';
    CH.ok.forEach(c => {
      const file = 'components/' + fileSlug(c.name, used) + '.html';
      compFiles[c.figmaId] = file;
      ccss += '\n/* ' + c.name + ' */\n' + c.css + '\n';
      const doc = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + escH(c.name) + ' — component</title>\n<link rel="stylesheet" href="../tokens.css">\n<link rel="stylesheet" href="../components.css">\n</head>\n<body style="margin:24px;background:#fff">\n' + c.html + '\n</body>\n</html>\n';
      files.push({ path: file, content: doc, tier: 1 });
      rows.push({ id: c.id, name: c.name, figmaId: c.figmaId, nodeId: c.nodeId || c.figmaId, familyId: c.meta && c.meta.familyId || c.variantOf || c.figmaId, variantOf: c.variantOf || null, isDefault: c.isDefault !== false, className: c.className, file, width: c.w, height: c.h, nodes: c.nodes, vars: c.vars, metadata: c.meta || null, usedIn: Array.from(compUsed[c.figmaId] || (c.meta && compUsed[c.meta.familyId]) || []).sort() });
    });
    const graph = componentGraphData(M, rows, CH.failed);
    if (CH.ok.length) files.push({ path: 'components.css', content: ccss, tier: 0 });
    files.push({ path: 'components/index.json', content: JSON.stringify({ schemaVersion: '1.0.0', engine: CH.engine || null, coverage: CH.coverage || { sourceFamilies: M.components.length, sourceVariants: M.components.reduce((n, c) => n + (c.variants || 1), 0), exportedFamilies: graph.families.filter(f => f.extraction.exportedVariants > 0).length, exportedVariants: rows.length, failedVariants: CH.failed.length }, components: rows, failed: CH.failed, graph, patterns: X.patterns }, null, 2), tier: 1 });
  }
  if (toks.length || nStyles) files.push({ path: 'ai-control.md', content: aiControlMd(M.adherence === undefined ? 3 : M.adherence), tier: 0 });
  // ---- validation.md (self-check added after lint)
  const agg = aggregateIssues(V.issues), fixFirst = agg.slice(0, 3);
  const validationBase = '# Validation\n\n## Health' + (V.overall === null ? '' : ': ' + V.overall + '%') + '\n\n' + (tbl(['Dimension', 'Weight', 'Score', 'Basis'], V.dims.map(x => [x.name, x.w, x.score + '%', x.basis])) || NA) +
    (fixFirst.length ? '\n## Fix first\n\n' + fixFirst.map((a, i) => (i + 1) + '. **' + a.code + '** ×' + a.items.length + ' — ' + a.recovery).join('\n') + '\n' : '') +
    '\n## Findings\n\n' + (agg.length ? tbl(['Severity', 'Code', 'Count', 'Affected', 'How to fix'], agg.map(a => [a.severity, a.code, a.items.length, capList(a.items, 6), a.recovery])) : '_No findings._\n');
  // ---- design.md (read order uses real sizes)
  const sizeOf = f => f ? '≈ ' + estTokens(f.content) + ' tokens' : '';
  const cs = X.coverage, covPct = cs.total ? Math.round(cs.bound / cs.total * 100) : null;
  const pkgNames = ['SKILL.md', 'design.md', 'tokens.css', 'tokens.md', 'components.md', 'content.md', 'ai-control.md', 'validation.md'];
  const present = n => files.some(f => f.path === n) || n === 'design.md' || n === 'validation.md';
  const hasRefs = M.refs && M.refs.length, fileOf = n => files.find(f => f.path === n);
  const readOrder = [['SKILL.md', 'Agent entrypoint: read order, authority, inventory', sizeOf(fileOf('SKILL.md'))], ['design.md', 'Rules, typography, overview', 'this file'], ['tokens.css', 'ALL values: variables, text classes, shadows (single source of truth)', sizeOf(fileOf('tokens.css'))], ['ai-control.md', 'Creative freedom level (read before every task)', sizeOf(fileOf('ai-control.md'))],
    ['components.md', 'Component list, sizes and Spec CSS; open only the component you need', sizeOf(fileOf('components.md'))], ['components/index.json', 'Component graph and observed reference structures', sizeOf(fileOf('components/index.json'))], ['tokens.md', 'Explains tokens: names, usage, gaps', sizeOf(fileOf('tokens.md'))], ['content.md', 'Product, users, screens (context only)', sizeOf(fileOf('content.md'))],
    ['validation.md', 'Design-system health and what to fix', '≈ ' + estTokens(validationBase) + ' tokens']].filter(r => present(r[0]));
  const pkgLine = pkgNames.filter(present).join(', ') + (hasRefs ? ', reference/ (one HTML per frame)' : '') + (M.componentHtml && M.componentHtml.ok.length ? ', components/ (HTML)' : '');
  let d = '# Design System\n\n## Overview\n\n- Source: Figma file "' + M.fileName + '"\n- Scope: ' + (M.pages.join(', ') || 'none') + '\n- Entities: ' + toks.length + ' tokens' + (X.derived.length ? ' (+' + X.derived.length + ' derived)' : '') + ', ' + M.components.length + ' components, ' + (X.icons ? X.icons.total + ' icons (' + (X.icons.pack || 'pack not provided') + '), ' : '') + nStyles + ' styles\n' +
    (covPct === null ? '' : '- Variable coverage: ' + cs.bound + ' of ' + cs.total + ' style properties in components use Figma variables (' + covPct + '%); the rest use derived or nearest tokens, so Spec CSS never needs literals.\n') + '- Dependency policy: ' + M.depPolicy + ' (' + M.depSummary.tokens + ' token(s), ' + M.depSummary.components + ' component(s) included as dependencies)\n- Package: ' + pkgLine + '\n';
  d += '\n### Read order\n\n' + tbl(['File', 'Purpose', 'Size'], readOrder.map(r => ['`' + r[0] + '`', r[1], r[2]])) + RULES_PLACEHOLDER;
  d = d.replace(RULES_PLACEHOLDER, rulesMd(M));
  const sec = {};
  sec.projectContext = ctxMd(M.context, rejInf, X, M.contentPack === true);
  sec.tokens = '## Tokens\n\nSource of truth for values: `tokens.css` (exact Figma names in comments).\n\n' + (!toks.length ? NA : minimal ? catNames.map(c => '### ' + c + '\n\n' + catTbl(c)).join('\n') : tbl(['Category', 'Count'], catNames.map(c => [c, cats[c].length])) + (X.derived.length ? '\nDerived tokens: ' + X.derived.length + ' (spacing, radius, border widths used in the design)\n' : '') + (nStyles ? '\nStyles: ' + M.styles.text.length + ' text, ' + M.styles.paint.length + ' paint, ' + M.styles.effect.length + ' effect\n' : '') + '\nDetails: tokens.md\n');
  sec.themes = '## Themes\n\n' + (themes.length ? tbl(['Collection', 'Modes'], themes.map(c => [c.name, c.modes.join(', ')])) : 'Single mode. No theme switching.\n');
  sec.typography = '## Typography\n\nUse only these text styles (classes are defined in tokens.css).\n\n' + (!M.styles.text.length ? NA : textClassTbl);
  sec.components = '## Components\n\n' + (M.components.length ? tbl(['Component', 'Kind', 'Variants', 'States'], M.components.map(c => [minimal ? c.name : '[' + c.name + '](components.md#' + anchorOf(c.name) + ')', c.kind, c.variants, c.states.join(', ') || '—'])) + (X.icons ? '\nIcons: ' + X.icons.total + ' (pack: ' + (X.icons.pack || 'not provided') + (minimal ? ')' : '), see components.md') + '\n' : '') : NA);
  sec.patterns = '## Patterns\n\n' + (X.patterns.stats.patterns ? 'Observed HTML structures: ' + X.patterns.stats.patterns + ' across ' + X.patterns.stats.references + ' reference(s); ' + X.patterns.stats.repeatedPatterns + ' structure(s) repeat. Fingerprints exclude text, generated classes, styles, node IDs and variant values. Evidence, exceptions and normalized trees are in components/index.json. These observations are not inferred semantic rules.\n' : NA);
  sec.validation = '## Validation\n\n- Health: ' + (V.overall === null ? 'n/a' : V.overall + '%') + ' · Errors ' + V.errors + ' · Warnings ' + V.warnings + ' · Info ' + V.info + (minimal ? '' : ' (details: validation.md)') + '\n';
  const order = ['projectContext', 'tokens', 'themes', 'typography', 'components', 'patterns'], out = order.filter(k => (k === 'projectContext' ? on('projectContext') : on(k))).map(k => sec[k]);
  const absent = UNS.filter(u => on(u[0])).map(u => u[1]);
  d += '\n' + out.join('\n') + (absent.length ? '\n## Other sections\n\n' + absent.join(', ') + ': not available from the selected sources.\n' : '') + (on('validation') ? '\n' + sec.validation : '');
  const designFile = { path: 'design.md', content: d, tier: 0 };
  files.push({ path: 'metadata/token-map.json', content: JSON.stringify(TM, null, 2), tier: 2 });
  const man = { entities: {}, stats: { tokens: TS, patterns: X.patterns.stats } };
  toks.forEach(t => man.entities[t.id] = { source: { type: 'figma_variable', id: t.figmaId }, output: { mdPath: 'tokens.md#' + slug(t.category), cssVar: tmById[t.id].cssEmitted ? TCN.byFigma[t.figmaId] : null, status: tmById[t.id].status } });
  M.components.forEach(c => man.entities[c.id] = { source: { type: 'figma_' + c.kind.replace('-', '_'), id: c.figmaId }, output: { mdPath: 'components.md#' + anchorOf(c.name), html: compFiles[c.figmaId] || null } });
  const manifestFile = { path: 'manifest.json', content: JSON.stringify(man, null, 2), tier: 2 };
  // ---- lint -> validation.md
  const prelim = [designFile].concat(files, [{ path: 'validation.md', content: validationBase, tier: 1 }, manifestFile]);
  const lint = lintPackage(prelim, M); M.lint = lint;
  const packageFindings = lint.findings.length ? '\n## Package findings\n\n' + tbl(['Severity', 'Code', 'File', 'Location', 'Finding'], lint.findings.map(i => [i.severity, i.code, i.file, i.location, i.message])) : '';
  const validation = validationBase + packageFindings + '\n## Package self-check: ' + lint.score + ' / 100\n\n' + tbl(['Check', 'Result', 'Detail'], lint.checks.map(c => [c.label, c.pass ? 'pass' : 'FAIL', c.detail]));
  if (on('validation')) files.push({ path: 'validation.md', content: validation, tier: 1 });
  files.unshift(designFile);
  files.push({ path: 'metadata.json', content: JSON.stringify({ schemaVersion: '1.0.0', generatorVersion: '0.10.0', generatedAt: new Date().toISOString(), source: 'figma', sourceFileName: M.fileName, scopePages: M.pages, mode, packageQuality: lint.score }, null, 2), tier: 2 });
  files.push(manifestFile, { path: 'validation-report.json', content: JSON.stringify(Object.assign({}, V, { packageQuality: lint.score, packageFindings: lint.findings }), null, 2), tier: 2 });
  if ((M.icons || []).length) files.push({ path: 'icons.json', content: JSON.stringify((M.icons || []).map(i => ({ name: i.name, named: i.named, kind: i.kind, size: i.w + 'x' + i.h, confidence: i.confidence, usedIn: i.usedIn, figmaId: i.figmaId })), null, 2), tier: 2 });
  files.push({ path: 'rules/validation-rules.json', content: JSON.stringify([...new Set(V.issues.map(i => i.code))].sort().map(c => ({ ruleId: c, source: 'derived', deterministic: true })), null, 2), tier: 3 });
  return files.filter(f => f.tier <= { minimal: 0, standard: 1, full: 2, agent: 3 }[mode]);
}
const RULES_PLACEHOLDER = '\n@@RULES@@\n';

// ---------- Prompt generator (pure) ----------
const OUT_FMT = {
  spec: ['Design specification', 'A structured, tool-agnostic specification: layout tree, which token and component each element uses, every state, and responsive behaviour. No code.'],
  html: ['HTML + CSS', 'Semantic HTML and CSS that uses CSS custom properties named after the tokens below. No hard-coded colors, sizes or radii.'],
  react: ['React + TypeScript', 'Functional React components in TypeScript. Map tokens to CSS variables or a Tailwind theme. Components must mirror the listed design-system components.'],
  swiftui: ['SwiftUI', 'SwiftUI views with a Theme type that holds the tokens below. Mirror the listed components.'],
  figma: ['Figma Plugin API code', 'JavaScript for the Figma Plugin API that builds the frame from the existing variables and components by name. Do not create new styles.']
};
function promptData(M) {
  const first = t => { const r = Object.values(t.modes)[0]; return r && r.status === 'resolved' ? r.value : '(' + (r ? r.status : 'n/a') + ')'; };
  return { name: M.context.product.name || M.fileName, description: M.context.product.description, users: M.context.users, goals: M.context.goals, platforms: M.context.platforms,
    language: M.context.localization.language, direction: M.context.localization.direction, themes: M.collections.map(c => c.name + ' [' + c.modes.join(', ') + ']'),
    tokens: M.tokens.map(t => ({ name: t.name, css: cssNameMap(M.tokens).byFigma[t.figmaId], category: t.category, role: t.role, value: first(t) })), textStyles: M.styles.text.map(s => '.text-' + styleSlug(s.name) + ' — ' + s.font + ' ' + s.size + 'px, line ' + s.lineHeight + ' (Figma: ' + s.name + ')'),
    components: M.components.map(c => ({ name: c.name, variants: c.variants, states: c.states, props: c.properties.map(p => p.name) })), icons: (M.icons || []).filter(i => i.named).map(i => i.name), iconPack: M.iconPack || '', sep: domSep(M.tokens), files: M.fileList || [] };
}
function buildPrompt(o, d) {
  o = o || {}; d = d || {};
  const f = OUT_FMT[o.format] || OUT_FMT.spec, NP = 'Not provided', lvl = o.detail || 'standard', states = o.states && o.states.length ? o.states : ['default', 'hover', 'focus', 'disabled'];
  const tok = d.tokens || [], comps = d.components || [], L = [], H = t => L.push('', '# ' + t, ''), cap = (a, n) => a.length > n ? a.slice(0, n).concat(['… (' + (a.length - n) + ' more in the attached files)']) : a;
  const sem = tok.filter(t => t.role === 'semantic'), pick = lvl === 'full' ? tok : (sem.length ? sem : tok), tn = lvl === 'full' ? 400 : lvl === 'standard' ? 60 : 0;
  H('ROLE'); L.push('You are a senior product designer and front-end engineer. You work strictly inside an existing design system and never improvise visual values.');
  H('OBJECTIVE'); L.push('Design: ' + (o.target || '[describe the screen, flow, component or section to design]'), 'Name: ' + (o.name || NP), 'Purpose: ' + (o.purpose || NP));
  H('PRODUCT CONTEXT');
  L.push('- Product: ' + (d.name || NP), '- Description: ' + (d.description || NP), '- Users: ' + ((d.users || []).join(', ') || NP), '- Goals: ' + ((d.goals || []).join(', ') || NP),
    '- Platform: ' + (o.platform || (d.platforms || []).join(', ') || NP), '- Language: ' + (o.language || d.language || NP), '- Direction: ' + (o.direction || d.direction || NP));
  H('DESIGN SYSTEM — SINGLE SOURCE OF TRUTH');
  if ((d.files || []).length) L.push('Attached files (authoritative if you can read them): ' + d.files.join(', '), '');
  L.push('Rules:', '1. Use only the tokens, text styles, components and icons listed here, written exactly (CSS variables as var(--name), text styles as their class). Never write a literal color, size, spacing, radius or font value.', '2. Never invent a color, spacing, radius, font, icon or component. If something is missing, say so and propose the closest existing option.',
    '3. Prefer semantic tokens over primitive tokens.', '4. Name every token and component you use.', '5. Support every theme mode listed.', '6. For icons, use only the listed icons or the named icon pack. Never draw custom icons.', '',
    'Naming convention: "' + (d.sep || 'unknown') + '" separator', 'Themes: ' + ((d.themes || []).join('; ') || NP));
  L.push('', '## Tokens (' + tok.length + ')');
  if (!tok.length) L.push(NP); else if (lvl === 'compact') { const c = {}; tok.forEach(t => c[t.category] = (c[t.category] || 0) + 1); L.push(Object.keys(c).sort().map(k => k + ': ' + c[k]).join(', '), 'Semantic examples: ' + (sem.slice(0, 30).map(t => t.name).join(', ') || NP)); }
  else cap(pick.map(t => '- ' + (t.css ? 'var(' + t.css + ')' : t.name) + ' = ' + t.value + (t.css ? '   /* ' + t.name + ' */' : '')), tn).forEach(x => L.push(x));
  L.push('', '## Text styles'); (d.textStyles || []).length ? cap(d.textStyles.map(x => '- ' + x), lvl === 'compact' ? 8 : 25).forEach(x => L.push(x)) : L.push(NP);
  L.push('', '## Components (' + comps.length + ')');
  comps.length ? cap(comps.map(c => '- ' + c.name + (lvl === 'compact' ? '' : ' — ' + c.variants + ' variant(s)' + (c.states.length ? '; states: ' + c.states.join(', ') : '') + (c.props.length ? '; props: ' + c.props.join(', ') : ''))), lvl === 'full' ? 300 : lvl === 'standard' ? 60 : 25).forEach(x => L.push(x)) : L.push(NP);
  L.push('', '## Icons (' + (d.icons || []).length + ')', 'Icon pack: ' + (o.iconPack || d.iconPack || NP), (d.icons || []).length ? cap(d.icons, lvl === 'compact' ? 15 : 60).join(', ') : NP);
  H('REQUIREMENTS');
  L.push('- Cover these states: ' + states.join(', '), '- Responsive: define behaviour for the target platform' + (o.platform ? ' (' + o.platform + ')' : '') + '.');
  if (o.a11y !== false) L.push('- Accessibility: text contrast at least 4.5:1, visible focus state, touch targets at least 44px, never rely on color alone.');
  if (String(o.direction || d.direction).toUpperCase() === 'RTL') L.push('- RTL: mirror layout, icons that imply direction, and alignment.');
  if (o.extra) L.push('- Additional: ' + o.extra);
  if (o.adherence !== undefined && o.adherence !== null && o.adherence !== '') { H('CREATIVITY CONTROL'); L.push('Adherence level: ' + clampLevel(o.adherence) + ' / 10 (0 = follow the rules exactly, 10 = maximum creative freedom).', 'If ai-control.md is attached, read `adherence_level` from it and follow its table; if it differs from this value, the file wins. Re-read it before every task, because it may change.', 'If it is not attached, apply: ' + levelLine(o.adherence), 'At every level: never write a literal color, size, spacing, radius, shadow or font value.'); }
  H('OUTPUT FORMAT');
  L.push('Format: ' + f[0], f[1], '', 'Answer with these parts, in order:', '1. Assumptions (only if something was missing)', '2. The result', '3. Table of every token and component used', '4. Open questions');
  H('PROCESS');
  L.push(o.ask === false ? '1. State your assumptions, then proceed.' : '1. If critical information is missing, ask at most 3 questions first. Otherwise state assumptions and proceed.', '2. Build the result using only the design system above.', '3. Run the self-check below before answering.');
  H('SELF-CHECK');
  L.push('- [ ] Every color, size, radius and font comes from a listed token or text style', '- [ ] Every component and icon used exists in the lists above', '- [ ] All requested states are covered', '- [ ] Every theme mode is supported', '- [ ] The output follows the requested format');
  return L.join('\n').replace(/^\n/, '') + '\n';
}

// ---------- Discovery ----------
async function discover() {
  await figma.loadAllPagesAsync();
  const comps = []; let descN = 0;
  const pages = figma.root.children.map(p => {
    const found = p.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] }).filter(n => !(n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET'));
    found.forEach(n => { const b = n.type === 'COMPONENT_SET' ? (n.children[0] || n) : n; const ic = iconScore(descN++ < 600 ? Object.assign(describe(b), { name: n.name }) : { name: n.name, w: b.width, h: b.height, page: p.name, types: [], hasText: false }); comps.push({ id: n.id, name: n.name, pageId: p.id, page: p.name, kind: n.type === 'COMPONENT_SET' ? 'component-set' : 'component', variants: n.type === 'COMPONENT_SET' ? n.children.length : 1, excluded: EXC.test(n.name), icon: ic.isIcon, iconConf: ic.score }); });
    return { id: p.id, name: p.name, frames: p.children.filter(c => c.type === 'FRAME' || c.type === 'SECTION').length, components: found.length, recommendation: EXC.test(p.name) ? 'Excluded' : REC.test(p.name) ? 'Recommended' : 'Review' };
  });
  const [vars, cols, ps, ts, es] = await Promise.all([figma.variables.getLocalVariablesAsync(), figma.variables.getLocalVariableCollectionsAsync(),
    figma.getLocalPaintStylesAsync(), figma.getLocalTextStylesAsync(), figma.getLocalEffectStylesAsync()]);
  const cats = {}, vcount = {}; vars.forEach(v => { const c = category(v)[0]; cats[c] = (cats[c] || 0) + 1; const o = vcount[v.variableCollectionId] = vcount[v.variableCollectionId] || {}; o[c] = (o[c] || 0) + 1; });
  DISC = { fileName: figma.root.name, comps };
  const collections = cols.map(c => ({ id: c.id, name: c.name, excluded: EXC.test(c.name), modes: c.modes.length, variables: vars.filter(v => v.variableCollectionId === c.id).length }));
  const styleList = [].concat(ts.map(x => ({ id: x.id, kind: 'text', name: x.name })), ps.map(x => ({ id: x.id, kind: 'paint', name: x.name })), es.map(x => ({ id: x.id, kind: 'effect', name: x.name })));
  const saved = await figma.clientStorage.getAsync('sel2'), settings = await figma.clientStorage.getAsync('settings');
  post('discover', { fileName: figma.root.name, pages, collections, comps, cats, vcount, styleList, saved, settings, engine: engineInfo(), steps: levelPicker(),
    counts: { pages: pages.length, collections: cols.length, variables: vars.length, styles: ps.length + ts.length + es.length, components: comps.length } });
}

// ---------- Figma-side helpers: icons, styles, frames ----------
let ICON = { cache: {}, map: {}, smallN: 0 }, BYID = {}, STYN = {};
// The canvases a page offers for references and screens: frames at page level or
// inside sections at any depth. Descent goes through SECTION only and stops at the
// first frame, so a frame nested inside a design is never offered on its own.
async function topFrames(page) {
  const out = [];
  async function walk(n) {
    for (const c of n.children || []) {
      if (c.type === 'SECTION') { try { if (typeof c.loadAsync === 'function') await c.loadAsync(); } catch (e) { /* section not readable */ } await walk(c); }
      else if (c.type === 'FRAME') out.push(c);
    }
  }
  await walk(page);
  return out;
}
function describe(n) {
  const types = new Set([n.type]); let hasText = n.type === 'TEXT';
  try { (n.findAll ? n.findAll(() => true) : []).slice(0, 60).forEach(c => { types.add(c.type); if (c.type === 'TEXT') hasText = true; }); } catch (e) { /* ignore */ }
  const path = []; let p = n.parent; while (p && p.type !== 'PAGE' && path.length < 6) { path.push(p.name); p = p.parent; }
  return { selfType: n.type, name: n.name, w: n.width, h: n.height, page: p && p.type === 'PAGE' ? p.name : '', path: path.join('/'), types: [...types], hasText };
}
function iconInfo(t) {
  if (ICON.cache[t.id] !== undefined) return ICON.cache[t.id];
  const base = t.type === 'COMPONENT_SET' ? (t.children[0] || t) : t, d = describe(base); d.name = t.name; d.path = describe(t).path;
  const r = iconScore(d);
  ICON.cache[t.id] = r.isIcon ? { id: t.id, name: t.name, kind: t.type === 'COMPONENT_SET' ? 'component-set' : 'component', w: Math.round(base.width), h: Math.round(base.height), score: r.score, evidence: r.evidence, base } : null;
  return ICON.cache[t.id];
}
function noteIcon(t, usedIn) {
  const i = iconInfo(t); if (!i) return null;
  const rec = ICON.map[t.id] || (ICON.map[t.id] = { id: i.id, name: i.name, kind: i.kind, w: i.w, h: i.h, score: i.score, evidence: i.evidence, usedIn: new Set() });
  if (usedIn) rec.usedIn.add(usedIn);
  return i;
}
function noteFrameIcon(x, usedIn) {
  const key = 'frame:' + x.name; if (ICON.map[key]) { ICON.map[key].usedIn.add(usedIn); return; }
  const r = iconScore(describe(x)); if (!r.isIcon) return;
  ICON.cache[x.id] = { base: x }; ICON.map[key] = { id: x.id, name: x.name, kind: 'frame', w: Math.round(x.width), h: Math.round(x.height), score: r.score, evidence: r.evidence, usedIn: new Set([usedIn]) };
}
const GENERIC = /^(frame|group|vector|rectangle|ellipse|union|subtract|intersect|exclude|line|polygon|star|boolean|icon)[\s_-]*\d*$/i;
const hashS = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
async function scanSmall(fr, usedInName) {
  let cand = [];
  try { cand = fr.findAll(x => ['FRAME', 'GROUP', 'BOOLEAN_OPERATION', 'VECTOR'].includes(x.type) && x.width <= 64 && x.height <= 64 && x.width >= 8 && x.height >= 8).slice(0, 200); } catch (e) { return; }
  const matched = new Set();
  for (const x of cand) {
    if (ICON.smallN >= 300) return;
    let p = x.parent, skip = false; while (p && p.id !== fr.id) { if (matched.has(p.id)) { skip = true; break; } p = p.parent; }
    if (skip) continue;
    const r = iconScore(describe(x)); if (!r.isIcon) continue;
    matched.add(x.id); ICON.smallN++;
    const named = !GENERIC.test(String(x.name).trim());
    let key = 'frame:' + x.name;
    if (!named) { let sv = ''; try { sv = await x.exportAsync({ format: 'SVG_STRING' }); } catch (e) { /* ignore */ } key = 'svg:' + hashS(sv || x.id); }
    if (ICON.map[key]) { ICON.map[key].usedIn.add(usedInName); continue; }
    ICON.cache[x.id] = { base: x };
    ICON.map[key] = { id: x.id, name: named ? x.name : '', unnamed: !named, kind: 'frame', w: Math.round(x.width), h: Math.round(x.height), score: r.score, evidence: r.evidence.concat(named ? [] : ['has no meaningful name; identified by shape and size']), usedIn: new Set([usedInName]) };
  }
}
let SHEETS = new Set();
async function scanFrames(pageIds) {
  let n = 0; SHEETS = new Set();
  for (const pid of pageIds) {
    const page = await figma.getNodeByIdAsync(pid); if (!page || page.type !== 'PAGE') continue;
    for (const fr of await topFrames(page)) {
      if (n++ >= 80) return;
      const insts = fr.findAllWithCriteria({ types: ['INSTANCE'] }).slice(0, 800);
      let iconInst = 0;
      for (let i = 0; i < insts.length; i += 50) {
        const mcs = await Promise.all(insts.slice(i, i + 50).map(x => x.getMainComponentAsync().catch(() => null)));
        mcs.forEach(mc => { if (mc && noteIcon(mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : mc, fr.name)) iconInst++; });
      }
      const before = ICON.smallN;
      await scanSmall(fr, fr.name);
      const smallFound = ICON.smallN - before, total = insts.length + smallFound;
      if ((iconInst + smallFound) >= 8 && (iconInst + smallFound) / Math.max(total, 1) >= 0.7) SHEETS.add(fr.id);
    }
  }
}
function styleRec(s, origin) {
  const g = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
  const hx = c => c ? hex(c) : '';
  if (s.type === 'TEXT') {
    const lh = g(() => s.lineHeight, { unit: 'AUTO' }), ls = g(() => s.letterSpacing, { unit: 'PIXELS', value: 0 }), fam = g(() => s.fontName.family, 'Unknown'), sty = g(() => s.fontName.style, 'Regular');
    return { kind: 'text', id: s.id, name: s.name, origin, family: fam, fstyle: sty, font: fam + ' ' + sty, size: Math.round(g(() => s.fontSize, 0) * 100) / 100,
      lineHeight: lh.unit === 'AUTO' ? 'auto' : Math.round(lh.value * 100) / 100 + (lh.unit === 'PERCENT' ? '%' : 'px'), letterSpacing: Math.round((ls.value || 0) * 100) / 100 + (ls.unit === 'PERCENT' ? '%' : 'px') };
  }
  if (s.type === 'PAINT') {
    const p = g(() => s.paints[0], null), stops = p && p.gradientStops ? p.gradientStops : [];
    const c = !p ? '' : p.type === 'SOLID' ? hex(Object.assign({}, p.color, { a: p.opacity })) : p.type.indexOf('GRADIENT') === 0 ? 'linear-gradient(180deg, ' + stops.map(x => hx(x.color) + ' ' + Math.round(x.position * 100) + '%').join(', ') + ')' : '';
    return { kind: 'paint', id: s.id, name: s.name, origin, css: c, value: !p ? 'empty' : p.type === 'SOLID' ? c : p.type.indexOf('GRADIENT') === 0 ? p.type.toLowerCase().replace('_', ' ') + ' (' + stops.map(x => hx(x.color)).join(' → ') + ')' : p.type.toLowerCase() + ' (not representable as CSS)' };
  }
  if (s.type === 'EFFECT') {
    const fx = g(() => s.effects, []), sh = fx.filter(e => e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW');
    return { kind: 'effect', id: s.id, name: s.name, origin, css: sh.map(e => (e.type === 'INNER_SHADOW' ? 'inset ' : '') + (e.offset ? e.offset.x : 0) + 'px ' + (e.offset ? e.offset.y : 0) + 'px ' + e.radius + 'px ' + (e.spread || 0) + 'px ' + hx(e.color)).join(', '),
      value: fx.map(e => e.type + (e.radius !== undefined ? ' blur ' + e.radius : '') + (e.offset ? ' offset ' + e.offset.x + ',' + e.offset.y : '') + (e.color ? ' ' + hx(e.color) : '')).join('; ') || 'empty' };
  }
  return null;
}

// ---------- Frame -> standalone HTML (design-faithful, tokens as var()) ----------
const cssNum = v => Math.round(v * 100) / 100;
const varName = cssVar;
const escH = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const BLEND = { MULTIPLY: 'multiply', SCREEN: 'screen', OVERLAY: 'overlay', DARKEN: 'darken', LIGHTEN: 'lighten', COLOR_DODGE: 'color-dodge', COLOR_BURN: 'color-burn', HARD_LIGHT: 'hard-light', SOFT_LIGHT: 'soft-light', DIFFERENCE: 'difference', EXCLUSION: 'exclusion', HUE: 'hue', SATURATION: 'saturation', COLOR: 'color', LUMINOSITY: 'luminosity' };
const JUST = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', SPACE_BETWEEN: 'space-between' }, ALIGN = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', BASELINE: 'baseline' };
function colorCss(c, o, boundId, byId) {
  const a = (o === undefined ? 1 : o) * (c.a === undefined ? 1 : c.a), h = a < 1 ? 'rgba(' + [c.r, c.g, c.b].map(x => Math.round(x * 255)).join(',') + ',' + cssNum(a) + ')' : hex({ r: c.r, g: c.g, b: c.b });
  if (boundId && byId && byId[boundId]) { st_used(byId[boundId].name); return 'var(' + varName(byId[boundId].name) + ', ' + h + ')'; }
  return h;
}
let USED_VARS = new Set(); const st_used = n => USED_VARS.add(varName(n));
function imgMime(b) { return b[0] === 0xFF && b[1] === 0xD8 ? 'image/jpeg' : b[0] === 0x47 ? 'image/gif' : b[0] === 0x52 && b[1] === 0x49 ? 'image/webp' : 'image/png'; }
async function imageUrl(hash, st) {
  if (!hash || st.imgBytes > 3000000) return null;
  try { const im = figma.getImageByHash(hash); if (!im) return null; const b = await im.getBytesAsync(); st.imgBytes += b.length; return 'data:' + imgMime(b) + ';base64,' + figma.base64Encode(b); } catch (e) { return null; }
}
function gradCss(p, w, h, st) {
  const T = p.gradientTransform, stops = p.gradientStops; if (!T || !stops || !stops.length) return null;
  const a = T[0][0], b = T[0][1], tx = T[0][2], c = T[1][0], d = T[1][1], ty = T[1][2], det = a * d - b * c; if (!det) return null;
  const inv = (x, y) => [(d * (x - tx) - b * (y - ty)) / det, (-c * (x - tx) + a * (y - ty)) / det];
  const col = s => colorCss(s.color, p.opacity, s.boundVariables && s.boundVariables.color && s.boundVariables.color.id, st.byId);
  if (p.type === 'GRADIENT_LINEAR') {
    const s = inv(0, 0.5), e = inv(1, 0.5), sx = s[0] * w, sy = s[1] * h, dx = e[0] * w - sx, dy = e[1] * h - sy, len = Math.hypot(dx, dy); if (!len) return null;
    const ux = dx / len, uy = dy / len, L = Math.abs(w * ux) + Math.abs(h * uy) || 1, ang = Math.atan2(ux, -uy) * 180 / Math.PI;
    return 'linear-gradient(' + cssNum(ang) + 'deg, ' + stops.map(g => { const px = sx + g.position * dx, py = sy + g.position * dy, t = ((px - w / 2) * ux + (py - h / 2) * uy) / L + 0.5; return col(g) + ' ' + cssNum(t * 100) + '%'; }).join(', ') + ')';
  }
  if (p.type === 'GRADIENT_RADIAL' || p.type === 'GRADIENT_DIAMOND') {
    const c0 = inv(0.5, 0.5), r1 = inv(1, 0.5), r2 = inv(0.5, 1), rx = Math.hypot((r1[0] - c0[0]) * w, (r1[1] - c0[1]) * h), ry = Math.hypot((r2[0] - c0[0]) * w, (r2[1] - c0[1]) * h);
    return 'radial-gradient(ellipse ' + cssNum(rx) + 'px ' + cssNum(ry) + 'px at ' + cssNum(c0[0] * w) + 'px ' + cssNum(c0[1] * h) + 'px, ' + stops.map(g => col(g) + ' ' + cssNum(g.position * 100) + '%').join(', ') + ')';
  }
  return 'linear-gradient(' + col(stops[0]) + ', ' + col(stops[stops.length - 1]) + ')';
}
async function paintLayers(paints, w, h, st) {
  if (!Array.isArray(paints)) return [];
  const out = [];
  for (const p of paints.filter(x => x.visible !== false).reverse()) {
    if (p.type === 'SOLID') out.push({ kind: 'solid', css: colorCss(p.color, p.opacity, p.boundVariables && p.boundVariables.color && p.boundVariables.color.id, st.byId) });
    else if (p.type.indexOf('GRADIENT_') === 0) { const g = gradCss(p, w, h, st); if (g) out.push({ kind: 'grad', css: g }); }
    else if (p.type === 'IMAGE') { const u = await imageUrl(p.imageHash, st); out.push({ kind: 'img', css: u ? 'url("' + u + '") center / ' + (p.scaleMode === 'FIT' ? 'contain no-repeat' : p.scaleMode === 'TILE' ? 'auto repeat' : 'cover no-repeat') : 'linear-gradient(#d9d9d9, #d9d9d9)' }); }
  }
  return out;
}
async function svgOf(n, st) {
  if (st.svgs++ > 400) return '<!-- svg budget reached -->';
  try { const s = await n.exportAsync({ format: 'SVG_STRING' }); return s.length <= 30000 ? s.replace(/<\?xml[^>]*>\s*/, '').replace(/\s(width|height)="[\d.]+"/g, (m, k) => m) : '<!-- svg omitted: larger than 30 KB -->'; } catch (e) { return '<!-- svg export failed -->'; }
}
function textSeg(seg, st) {
  const css = [], sty = String(seg.fontName && seg.fontName.style || '').toLowerCase();
  if (seg.fontName && seg.fontName.family) { css.push('font-family:"' + seg.fontName.family + '",system-ui,sans-serif'); (st.fonts[seg.fontName.family] = st.fonts[seg.fontName.family] || new Set()).add(seg.fontWeight || fontWeightOf(sty)); }
  if (typeof seg.fontSize === 'number') css.push('font-size:' + cssNum(seg.fontSize) + 'px');
  css.push('font-weight:' + (seg.fontWeight || fontWeightOf(sty))); if (/italic|oblique/.test(sty)) css.push('font-style:italic');
  if (seg.lineHeight && seg.lineHeight.unit) css.push('line-height:' + (seg.lineHeight.unit === 'AUTO' ? 'normal' : seg.lineHeight.unit === 'PERCENT' ? cssNum(seg.lineHeight.value / 100) : cssNum(seg.lineHeight.value) + 'px'));
  if (seg.letterSpacing && seg.letterSpacing.value) css.push('letter-spacing:' + (seg.letterSpacing.unit === 'PERCENT' ? cssNum(seg.letterSpacing.value / 100) + 'em' : cssNum(seg.letterSpacing.value) + 'px'));
  if (seg.textDecoration === 'UNDERLINE') css.push('text-decoration:underline'); else if (seg.textDecoration === 'STRIKETHROUGH') css.push('text-decoration:line-through');
  if (seg.textCase === 'UPPER') css.push('text-transform:uppercase'); else if (seg.textCase === 'LOWER') css.push('text-transform:lowercase'); else if (seg.textCase === 'TITLE') css.push('text-transform:capitalize');
  const f = Array.isArray(seg.fills) ? seg.fills.find(x => x.visible !== false && x.type === 'SOLID') : null;
  if (f) css.push('color:' + colorCss(f.color, f.opacity, f.boundVariables && f.boundVariables.color && f.boundVariables.color.id, st.byId));
  return css.join(';');
}
async function nodeHtml(n, st, parent, depth) {
  if (st.count >= st.max || st.chars > st.maxChars) { st.truncated = true; return ''; }
  if (n.visible === false) return '';
  if (n.isMask) { st.notes.add('mask layers are not applied'); return ''; }
  st.count++;
  const pad = '  '.repeat(Math.min(depth, 12)), css = [], isText = n.type === 'TEXT', isVec = VEC.includes(n.type), w = n.width, h = n.height;
  const pAL = parent && parent.layoutMode && parent.layoutMode !== 'NONE' && n.layoutPositioning !== 'ABSOLUTE', horizP = pAL && parent.layoutMode === 'HORIZONTAL';
  const abs = parent && !pAL;
  const gx = parent && parent.type === 'GROUP' ? parent.x : 0, gy = parent && parent.type === 'GROUP' ? parent.y : 0;
  if (abs) css.push('position:absolute', 'left:' + cssNum(n.x - gx) + 'px', 'top:' + cssNum(n.y - gy) + 'px');
  const sh = n.layoutSizingHorizontal, sv = n.layoutSizingVertical;
  if (sh === 'FILL' && parent) css.push(pAL ? (horizP ? 'flex:1 1 0;min-width:0' : 'align-self:stretch') : 'width:100%'); else if (sh === 'HUG' && !isVec) css.push(isText ? 'width:max-content' : 'width:fit-content'); else css.push('width:' + cssNum(w) + 'px');
  if (sv === 'FILL' && parent) css.push(pAL ? (!horizP ? 'flex:1 1 0;min-height:0' : 'align-self:stretch') : 'height:100%'); else if (sv === 'HUG' && !isVec) { /* natural height */ } else if (!isText) css.push('height:' + cssNum(h) + 'px'); else css.push('min-height:' + cssNum(h) + 'px');
  if (pAL && sh !== 'FILL' && sv !== 'FILL') css.push('flex-shrink:0');
  ['minWidth', 'maxWidth', 'minHeight', 'maxHeight'].forEach(k => { if (typeof n[k] === 'number') css.push(k.replace(/[A-Z]/g, c => '-' + c.toLowerCase()) + ':' + cssNum(n[k]) + 'px'); });
  const kids = 'children' in n ? n.children : [];
  if (n.layoutMode && n.layoutMode !== 'NONE') {
    css.push('display:flex', 'flex-direction:' + (n.layoutMode === 'HORIZONTAL' ? 'row' : 'column'), 'gap:' + cssNum(n.itemSpacing || 0) + 'px', 'justify-content:' + (JUST[n.primaryAxisAlignItems] || 'flex-start'), 'align-items:' + (ALIGN[n.counterAxisAlignItems] || 'flex-start'));
    if (n.layoutWrap === 'WRAP') { css.push('flex-wrap:wrap'); if (n.counterAxisSpacing) css.push('row-gap:' + cssNum(n.counterAxisSpacing) + 'px'); }
    css.push('padding:' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].map(x => cssNum(x || 0) + 'px').join(' '), 'box-sizing:border-box');
  } else if (kids.length && !abs) css.push('position:relative');
  else if (kids.length && abs) { /* already absolute: acts as containing block */ }
  const layers = isVec ? [] : await paintLayers(n.fills, w, h, st);
  if (!isText && layers.length) { if (layers.length === 1 && layers[0].kind === 'solid') css.push('background-color:' + layers[0].css); else css.push('background:' + layers.map(l => l.kind === 'solid' ? 'linear-gradient(' + l.css + ',' + l.css + ')' : l.css).join(', ')); }
  const sl = isVec ? [] : await paintLayers(n.strokes, w, h, st), shadows = [];
  if (sl.length && sl[0].kind !== 'img' && typeof n.strokeWeight === 'number' && n.strokeWeight > 0) {
    const sc = sl[0].kind === 'solid' ? sl[0].css : 'currentColor', wt = n.strokeWeight, sty = n.dashPattern && n.dashPattern.length ? 'dashed' : 'solid';
    if (n.strokeAlign === 'OUTSIDE') shadows.push('0 0 0 ' + cssNum(wt) + 'px ' + sc);
    else if (typeof n.strokeTopWeight === 'number' && (n.strokeTopWeight !== n.strokeBottomWeight || n.strokeLeftWeight !== n.strokeRightWeight || n.strokeTopWeight !== n.strokeLeftWeight)) css.push('border-style:' + sty, 'border-color:' + sc, 'border-width:' + [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight].map(x => cssNum(x) + 'px').join(' '), 'box-sizing:border-box');
    else css.push('border:' + cssNum(wt) + 'px ' + sty + ' ' + sc, 'box-sizing:border-box');
  }
  if (n.type === 'ELLIPSE') css.push('border-radius:50%'); else if (typeof n.cornerRadius === 'number' && n.cornerRadius > 0) css.push('border-radius:' + cssNum(n.cornerRadius) + 'px');
  else if ('topLeftRadius' in n && (n.topLeftRadius || n.topRightRadius || n.bottomRightRadius || n.bottomLeftRadius)) css.push('border-radius:' + [n.topLeftRadius, n.topRightRadius, n.bottomRightRadius, n.bottomLeftRadius].map(x => cssNum(x || 0) + 'px').join(' '));
  if (Array.isArray(n.effects) && !isVec) n.effects.filter(e => e.visible !== false).forEach(e => {
    if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') shadows.push((e.type === 'INNER_SHADOW' ? 'inset ' : '') + cssNum(e.offset.x) + 'px ' + cssNum(e.offset.y) + 'px ' + cssNum(e.radius) + 'px ' + cssNum(e.spread || 0) + 'px ' + colorCss(e.color, undefined, null, st.byId));
    else if (e.type === 'LAYER_BLUR') css.push('filter:blur(' + cssNum(e.radius / 2) + 'px)'); else if (e.type === 'BACKGROUND_BLUR') css.push('backdrop-filter:blur(' + cssNum(e.radius / 2) + 'px)');
  });
  if (shadows.length) css.push('box-shadow:' + shadows.join(', '));
  if (typeof n.opacity === 'number' && n.opacity < 1) css.push('opacity:' + cssNum(n.opacity));
  if (n.blendMode && BLEND[n.blendMode]) css.push('mix-blend-mode:' + BLEND[n.blendMode]);
  if (typeof n.rotation === 'number' && Math.abs(n.rotation) > 0.01) css.push('transform:rotate(' + cssNum(-n.rotation) + 'deg)', 'transform-origin:0 0');
  if (n.clipsContent) css.push('overflow:hidden');
  let tag = 'div', inner = '', attrs = ' data-name="' + escH(n.name) + '"';
  if (isText) {
    css.push('margin:0', 'white-space:' + (n.textAutoResize === 'WIDTH_AND_HEIGHT' ? 'pre' : 'pre-wrap'), 'word-break:break-word');
    if (n.textAlignHorizontal) css.push('text-align:' + ({ LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' })[n.textAlignHorizontal]);
    if (n.textAlignVertical === 'CENTER' || n.textAlignVertical === 'BOTTOM') css.push('display:flex', 'flex-direction:column', 'justify-content:' + (n.textAlignVertical === 'CENTER' ? 'center' : 'flex-end'));
    if (n.textTruncation === 'ENDING') css.push('overflow:hidden', 'text-overflow:ellipsis');
    let segs = null;
    try { segs = n.getStyledTextSegments(['fontSize', 'fontName', 'fontWeight', 'fills', 'letterSpacing', 'lineHeight', 'textDecoration', 'textCase']); } catch (e) { /* fall back */ }
    if (!segs || !segs.length) segs = [{ characters: n.characters, fontSize: n.fontSize, fontName: n.fontName, fills: n.fills, lineHeight: n.lineHeight, letterSpacing: n.letterSpacing }];
    inner = segs.map(sg => '<span style="' + escH(textSeg(sg, st)) + '">' + escH(sg.characters) + '</span>').join('');
    if (n.textAlignVertical === 'CENTER' || n.textAlignVertical === 'BOTTOM') inner = '<span style="display:block">' + inner + '</span>';
  } else if (isVec) {
    inner = '\n' + pad + '  ' + await svgOf(n, st) + '\n' + pad; css.push('display:block');
  } else if (n.type === 'INSTANCE') {
    const mc = await n.getMainComponentAsync().catch(() => null), t = mc && (mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : mc);
    if (t) { attrs += ' data-component="' + escH(t.name) + '"'; if (iconInfo(t)) { inner = '\n' + pad + '  ' + await svgOf(n, st) + '\n' + pad; attrs += ' data-icon="true"'; } }
  }
  try { (n.reactions || []).forEach(r => (r.actions || (r.action ? [r.action] : [])).forEach(a => { if (a && a.type === 'NODE' && a.destinationId && a.navigation !== 'OVERLAY' && a.navigation !== 'SWAP') { attrs += ' data-go="' + escH(a.destinationId) + '"'; st.links.add(a.destinationId); css.push('cursor:pointer'); } })); } catch (e) { /* ignore */ }
  if (!inner && kids.length) { const parts = []; for (const k of kids) { const s = await nodeHtml(k, st, n, depth + 1); if (s) parts.push(s); } if (parts.length) inner = '\n' + parts.join('\n') + '\n' + pad; }
  const out = pad + '<' + tag + attrs + ' style="' + css.filter(Boolean).join(';') + '">' + inner + '</' + tag + '>';
  st.chars += out.length; return out;
}
async function frameRef(n, byId) {
  USED_VARS = new Set();
  const st = { count: 0, max: 1500, chars: 0, maxChars: 700000, truncated: false, byId, imgBytes: 0, svgs: 0, fonts: {}, links: new Set(), notes: new Set() };
  const body = await nodeHtml(n, st, null, 0);
  const fonts = {}; Object.keys(st.fonts).forEach(f => fonts[f] = [...st.fonts[f]].sort((a, b) => a - b));
  return { id: n.id, name: n.name, page: pageOf(n), w: Math.round(n.width), h: Math.round(n.height), nodes: st.count, truncated: st.truncated, body, links: [...st.links], fonts, vars: [...USED_VARS], notes: [...st.notes] };
}
function rootVars(tokens) {
  const U = { spacing: 'px', radius: 'px', size: 'px', border: 'px', breakpoint: 'px' };
  return tokens.map(t => { const r = Object.values(t.modes)[0]; if (!r || r.status !== 'resolved' || (t.type !== 'COLOR' && t.type !== 'FLOAT')) return null; return '  ' + varName(t.name) + ': ' + r.value + (t.type === 'FLOAT' ? (U[t.category] || '') : '') + ';'; }).filter(Boolean).slice(0, 300);
}
async function rescanIcons(msg) {
  const flags = {};
  for (const c of (DISC ? DISC.comps : []).slice(0, 600)) {
    const nd = await figma.getNodeByIdAsync(c.id); if (!nd) continue;
    const b = nd.type === 'COMPONENT_SET' ? (nd.children[0] || nd) : nd, r = iconScore(Object.assign(describe(b), { name: nd.name }), msg.rules || {});
    flags[c.id] = { icon: r.isIcon, conf: r.score };
  }
  post('icons-rescanned', { flags });
}
async function listFrames(msg) {
  await figma.loadAllPagesAsync(); const out = [], names = [], t0 = Date.now();
  for (const k in THUMBS) delete THUMBS[k];
  for (const pid of msg.pageIds) {
    const page = await figma.getNodeByIdAsync(pid); if (!page || page.type !== 'PAGE') continue;
    await page.loadAsync(); names.push(page.name);
    for (const f of await topFrames(page)) { let inst = null; if (Date.now() - t0 < 4000) { try { inst = f.findAllWithCriteria({ types: ['INSTANCE'] }).length; } catch (e) { inst = null; } } out.push({ id: f.id, name: f.name, page: page.name, w: Math.round(f.width), h: Math.round(f.height), instances: inst, excluded: EXC.test(f.name) || EXC.test(page.name) }); }
  }
  const rec = out.filter(f => !f.excluded && f.w >= 280 && (f.instances || 0) >= 3).sort((a, b) => (b.instances || 0) - (a.instances || 0)).slice(0, 10).map(f => f.id);
  out.forEach(f => f.recommended = rec.includes(f.id));
  const c = msg.counts || {};
  post('frames', { frames: out, draft: { product: figma.root.name, description: 'Design system file with ' + (c.components || 0) + ' component(s), ' + (c.tokens || 0) + ' token(s) and ' + (c.styles || 0) + ' style(s) across ' + names.length + ' page(s).', inferences: inferFromFrames(out, names.concat(out.map(f => f.name), msg.compNames || [])) } });
}
const THUMBS = {};
const THUMB_CAPS = { card: [360, 700, 350000], full: [1500, 4000, 2000000] };
async function frameThumb(msg) {
  const id = msg.id; if (!id) return;
  const size = msg.size === 'full' ? 'full' : 'card', cap = THUMB_CAPS[size], key = id + ':' + size;
  if (THUMBS[key] !== undefined) { post('frame-thumb', { id, size, dataUrl: THUMBS[key] }); return; }
  try {
    const n = await figma.getNodeByIdAsync(id);
    if (!n) throw new Error('Frame is no longer in the file');
    if (typeof n.loadAsync === 'function') await n.loadAsync();
    const w = Math.max(1, n.width), h = Math.max(1, n.height);
    let scale = Math.min(1, cap[0] / w, cap[1] / h), b = new Uint8Array(1);
    for (let i = 0; i < 4; i++) {
      b = await n.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
      if (b.length <= cap[2]) break;
      scale *= 0.6;
    }
    if (b.length > cap[2]) throw new Error('This frame is too heavy to preview in the panel');
    const dataUrl = 'data:image/png;base64,' + figma.base64Encode(b);
    THUMBS[key] = dataUrl;
    post('frame-thumb', { id, size, dataUrl, w: Math.round(n.width), h: Math.round(n.height), pw: Math.round(w * scale), ph: Math.round(h * scale) });
  } catch (e) {
    THUMBS[key] = '';
    post('frame-thumb', { id, size, error: String((e && e.message) || e) });
  }
}

// ---------- HTML engine (pluggable module: engines/fig-engine/) ----------
function engineModule() {
  try { if (typeof FigEngine !== 'undefined' && FigEngine && FigEngine.contract === 1) return FigEngine; } catch (e) { /* not bundled */ }
  try { if (typeof ReferenceEngine !== 'undefined' && ReferenceEngine && ReferenceEngine.contract === 1) return ReferenceEngine; } catch (e) { /* legacy engine */ }
  return null;
}
function getEngine(sel) {
  const E = engineModule();
  return E && sel.refEngine !== 'builtin' ? E : null;
}
function engineInfo() {
  const E = engineModule();
  return E ? { available: true, id: E.id, version: E.version, capabilities: E.capabilities || ['frame'] } : { available: false };
}
function colorValueCandidates(tokens) {
  const cand = {};
  tokens.forEach(t => { const r = Object.values(t.modes)[0]; if (t.type === 'COLOR' && r && r.status === 'resolved') (cand[String(r.value).toUpperCase()] = cand[String(r.value).toUpperCase()] || []).push(t); });
  return cand;
}
function valueMatchIssues(tokens) {
  const cand = colorValueCandidates(tokens), out = [];
  Object.keys(cand).sort().forEach(value => {
    const list = cand[value];
    if (list.length > 1) out.push({ code: 'TOKEN_VALUE_MATCH_AMBIGUOUS', severity: 'warning', entityId: value, message: list.length + ' tokens share value ' + value + ': ' + list.map(t => t.name).sort().join(', ') + '. Unbound value matching is disabled for this value.', recovery: 'Bind the property explicitly to the intended variable.' });
  });
  return out;
}
function refTokenMap(tokens, styles) {
  const N = cssNameMap(tokens), variables = {}, st = {}, cand = colorValueCandidates(tokens), colors = {};
  tokens.forEach(t => { variables[t.figmaId] = N.byFigma[t.figmaId]; });
  Object.keys(cand).forEach(k => { const L = cand[k]; if (L.length === 1) colors[k] = N.byFigma[L[0].figmaId]; });
  ((styles && styles.paint) || []).forEach(x => { if (x.css) st[x.id] = '--paint-' + styleSlug(x.name); });
  ((styles && styles.effect) || []).forEach(x => { if (x.css) st[x.id] = '--shadow-' + styleSlug(x.name); });
  return { variables, styles: st, colors };
}
async function refFrame(nd, byId, E, tokMap, sel) {
  const embed = sel.refEmbedImages === true; let engineErr = null;
  if (E) {
    try {
      const r = await E.exportFrame(nd, tokMap, { matchColorsByValue: sel.refMatchColors !== false, embedImages: embed });
      return { id: nd.id, name: nd.name, page: pageOf(nd), w: r.width, h: r.height, nodes: r.nodes, truncated: false, body: r.bodyHtml, css: r.css, files: r.files || [], engine: r.engine + '@' + r.version, rtl: r.rtl, links: r.links, fonts: r.fonts, vars: r.vars, components: r.components || [], structure: r.structure || null, notes: [...(r.notes || [])] };
    } catch (e) { engineErr = String((e && e.message) || e); }
  }
  const rec = await frameRef(nd, byId); rec.css = rec.css || ''; rec.files = []; rec.components = [];
  if (!embed) { const m = new Map(); rec.body = extractDataImages(rec.body, m); m.forEach((b64, path) => rec.files.push({ path, base64: b64 })); }
  rec.engine = engineErr ? 'builtin (fallback)' : 'builtin'; if (engineErr) rec.notes = (rec.notes || []).concat(['Rendered with the built-in renderer because the engine failed: ' + engineErr]);
  return rec;
}

function sendFiles(files, lint) {
  const CH = 600000; post('files-begin', { count: files.length });
  files.forEach(f => {
    if (f.content.length <= CH) post('file', { path: f.path, content: f.content, binary: !!f.binary });
    else { const n = Math.ceil(f.content.length / CH); for (let i = 0; i < n; i++) post('file-chunk', { path: f.path, binary: !!f.binary, i, n, part: f.content.slice(i * CH, (i + 1) * CH) }); }
  });
  post('files-done', { lint });
}

// ---------- Extraction ----------
let DRAFT = null;
const selKey = s => JSON.stringify([s.pageIds, s.collectionIds, s.categories, s.styles, s.styleIds, s.libStyles, s.componentIds, s.iconRules]);
const pageOf = n => { let p = n; while (p && p.type !== 'PAGE') p = p.parent; return p ? p.name : '(external library)'; };

async function componentSpec(root) {
  const sp = [], b = root.boundVariables || {}, px = v => typeof v === 'number' ? Math.round(v * 100) / 100 + 'px' : null;
  const bi = k => { const a = b[k], al = Array.isArray(a) ? a[0] : a; return al && al.id || null; };
  const bn = k => { const id = bi(k); return id && BYID[id] ? BYID[id].name : null; };
  const paintOf = arr => Array.isArray(arr) ? arr.find(x => x.visible !== false && x.type === 'SOLID') : null;
  const pbi = p => p && p.boundVariables && p.boundVariables.color && p.boundVariables.color.id || null;
  const pb = p => { const id = pbi(p); return id && BYID[id] ? BYID[id].name : null; };
  sp.push({ prop: 'width', raw: px(root.width), bound: bn('width'), boundId: bi('width') }, { prop: 'height', raw: px(root.height), bound: bn('height'), boundId: bi('height') });
  if (root.layoutMode && root.layoutMode !== 'NONE') {
    sp.push({ prop: 'display', raw: 'flex' }, { prop: 'flex-direction', raw: root.layoutMode === 'HORIZONTAL' ? 'row' : 'column' }, { prop: 'gap', raw: px(root.itemSpacing), bound: bn('itemSpacing'), boundId: bi('itemSpacing') });
    [['padding-top', 'paddingTop'], ['padding-right', 'paddingRight'], ['padding-bottom', 'paddingBottom'], ['padding-left', 'paddingLeft']].forEach(x => sp.push({ prop: x[0], raw: px(root[x[1]]), bound: bn(x[1]), boundId: bi(x[1]) }));
  }
  const rad = typeof root.cornerRadius === 'number' ? root.cornerRadius : (typeof root.topLeftRadius === 'number' ? root.topLeftRadius : null);
  if (rad !== null) sp.push({ prop: 'border-radius', raw: px(rad), bound: bn('topLeftRadius') || bn('cornerRadius'), boundId: bi('topLeftRadius') || bi('cornerRadius') });
  const f = paintOf(root.fills); if (f) sp.push({ prop: 'background-color', raw: hex({ r: f.color.r, g: f.color.g, b: f.color.b, a: f.opacity }), bound: pb(f), boundId: pbi(f) });
  const st = paintOf(root.strokes);
  if (st && typeof root.strokeWeight === 'number' && root.strokeWeight > 0) sp.push({ prop: 'border-width', raw: px(root.strokeWeight), bound: bn('strokeWeight'), boundId: bi('strokeWeight') }, { prop: 'border-color', raw: hex({ r: st.color.r, g: st.color.g, b: st.color.b, a: st.opacity }), bound: pb(st), boundId: pbi(st) });
  const texts = root.findAll ? root.findAll(x => x.type === 'TEXT').slice(0, 4) : [];
  for (const t of texts) {
    let sn = null;
    try { if (typeof t.textStyleId === 'string' && t.textStyleId) { if (!STYN[t.textStyleId]) { const stl = await figma.getStyleByIdAsync(t.textStyleId); STYN[t.textStyleId] = stl ? stl.name : ''; } sn = STYN[t.textStyleId] || null; } } catch (e) { /* ignore */ }
    const lhv = t.lineHeight && t.lineHeight.unit === 'PIXELS' ? Math.round(t.lineHeight.value * 100) / 100 : null, wt = typeof t.fontWeight === 'number' ? t.fontWeight : null;
    sp.push({ prop: 'text', node: t.name, textStyle: sn, size: typeof t.fontSize === 'number' ? Math.round(t.fontSize * 100) / 100 : null, weight: wt, lh: lhv, raw: typeof t.fontSize === 'number' ? Math.round(t.fontSize * 100) / 100 + 'px' : null });
  }
  return sp.filter(x => x.raw || x.bound || x.textStyle);
}
function defaultComponentVariant(n) {
  if (!n || n.type !== 'COMPONENT_SET') return n;
  const variants = n.children.filter(x => x.type === 'COMPONENT'), defs = n.componentPropertyDefinitions || {}, axes = Object.keys(defs).filter(k => defs[k].type === 'VARIANT');
  return variants.find(x => axes.length && axes.every(k => String((x.variantProperties || {})[k]) === String(defs[k].defaultValue))) || variants[0] || n;
}
async function extractComponent(n, pageName) {
  const isSet = n.type === 'COMPONENT_SET', issues = [];
  let properties;
  try {
    properties = Object.entries(n.componentPropertyDefinitions || {}).map(([k, d]) => ({ name: k.replace(/#\d+:\d+$/, ''), type: d.type, default: String(d.defaultValue), options: d.variantOptions || null }));
  } catch (e) {
    const map = {};
    (isSet ? n.children : []).forEach(ch => ch.name.split(',').forEach(part => { const kv = part.split('='); if (kv.length !== 2) return; const k = kv[0].trim(), v = kv[1].trim(); (map[k] = map[k] || []); if (!map[k].includes(v)) map[k].push(v); }));
    properties = Object.keys(map).map(k => ({ name: k, type: 'VARIANT', default: map[k][0], options: map[k] }));
    issues.push({ code: 'COMPONENT_SET_HAS_ERRORS', severity: 'warning', entityId: 'component.' + slug(n.name), message: 'Figma reports errors in component set "' + n.name + '"; properties were read from variant names.', recovery: 'Fix duplicate or invalid variants in Figma.' });
  }
  const states = []; properties.forEach(p => { if (p.type === 'VARIANT' && /state|status/i.test(p.name) && p.options) p.options.forEach(o => states.push(o)); });
  const root = defaultComponentVariant(n), ids = new Set(), styleIds = new Set(), nested = {}, roots = isSet ? n.children.filter(x => x.type === 'COMPONENT') : [root];
  const nodes = roots.concat(...roots.map(r => r.findAll(() => true)));
  const walk = x => { if (!x || typeof x !== 'object') return; if (Array.isArray(x)) return x.forEach(walk); if (x.type === 'VARIABLE_ALIAS' && x.id) ids.add(x.id); else Object.values(x).forEach(walk); };
  for (const nd of nodes) {
    try { walk(nd.boundVariables); walk(nd.fills); walk(nd.strokes); walk(nd.effects); } catch (e) { /* mixed values */ }
    try { ['textStyleId', 'fillStyleId', 'strokeStyleId', 'effectStyleId'].forEach(k => { const v = nd[k]; if (typeof v === 'string' && v) styleIds.add(v); }); } catch (e) { /* mixed */ }
    if (nd.type === 'INSTANCE') {
      const mc = await nd.getMainComponentAsync();
      if (mc) { const t = mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : mc; if (t.name !== n.name) nested[t.name] = { name: t.name, nodeId: t.id, remote: t.remote === true }; noteIcon(t, n.name); }
    }
  }
  const iconR = noteIcon(n, null);
  let spec = [], variantDims = [];
  try { spec = await componentSpec(root); } catch (e) { /* ignore */ }
  if (isSet) variantDims = n.children.map(ch => ({ name: ch.name, w: Math.round(ch.width), h: Math.round(ch.height) }));
  if (!iconR) { try { await scanSmall(root, n.name); } catch (e) { /* ignore */ } }
  return { issues, comp: { spec, variantDims, icon: !!iconR, id: 'component.' + slug(n.name), figmaId: n.id, name: n.name, kind: isSet ? 'component-set' : 'component', page: pageName, description: n.description || '', origin: 'selection', requiredBy: [],
    variants: isSet ? n.children.length : 1, properties, states, tokens: [], dependencies: Object.keys(nested).sort(), _nested: Object.values(nested), _tokenIds: [...ids], _styleIds: [...styleIds] } };
}

async function buildDraft(sel, quiet) {
  const say = (v, l) => { if (!quiet) prog(v, l); };
  say(5, 'Reading variables…');
  const allVars = await figma.variables.getLocalVariablesAsync(), cols = await figma.variables.getLocalVariableCollectionsAsync(), byId = {}, colById = {};
  allVars.forEach(v => byId[v.id] = v); cols.forEach(c => colById[c.id] = c);
  const mk = (v, dep) => {
    const col = colById[v.variableCollectionId], modes = {}, chainIds = [], aliasIds = {};
    col.modes.forEach(m => { const r = resolve(v, m.modeId, byId, colById); chainIds.push(...r.ids); aliasIds[m.name] = r.ids.slice(); delete r.ids; modes[m.name] = r; });
    const [cat, src] = category(v), first = v.valuesByMode[col.defaultModeId], semantic = !!(first && first.type === 'VARIABLE_ALIAS');
    return { id: 'token.' + v.name.split('/').map(slug).join('.'), figmaId: v.id, name: v.name, type: v.resolvedType, category: cat, categorySource: src, collection: col.name, collectionId: col.id, defaultMode: (col.modes.find(m => m.modeId === col.defaultModeId) || col.modes[0]).name,
      role: semantic ? 'semantic' : 'primitive', roleStatus: 'observed', roleSource: semantic ? 'figma-alias' : 'figma-value', origin: dep ? 'dependency' : 'selection', requiredBy: [], modes, aliasIds, usedBy: [], _chainIds: chainIds };
  };
  const tokens = [], have = new Set();
  allVars.forEach(v => { if (sel.collectionIds.includes(v.variableCollectionId) && (!sel.categories || sel.categories.includes(category(v)[0]))) { tokens.push(mk(v, false)); have.add(v.id); } });

  say(20, 'Reading styles…');
  ICON = { cache: {}, map: {}, smallN: 0 }; BYID = byId; STYN = {}; ICON_RULES = Object.assign({}, ICON_DEFAULT, sel.iconRules || {});
  const styles = { text: [], paint: [], effect: [] }, issues = [];
  if (sel.styles) {
    const readers = [['text', () => figma.getLocalTextStylesAsync()], ['paint', () => figma.getLocalPaintStylesAsync()], ['effect', () => figma.getLocalEffectStylesAsync()]];
    for (const [k, fn] of readers) {
      try { (await fn()).forEach(x => { if (sel.styleIds && !sel.styleIds.includes(x.id)) return; const r = styleRec(x, 'local'); if (r) styles[k].push(r); else issues.push({ code: 'STYLE_UNREADABLE', severity: 'warning', entityId: 'style:' + x.name, message: 'Style "' + x.name + '" could not be read.', recovery: 'Open the style in Figma and check it.' }); }); }
      catch (e) { issues.push({ code: 'STYLES_UNREADABLE', severity: 'warning', entityId: 'styles.' + k, message: 'Could not read ' + k + ' styles: ' + String((e && e.message) || e), recovery: 'Retry; if it persists, check the file for broken styles.' }); }
    }
  }
  const components = [], screens = [], pagesOut = [];
  // Screens are evidence from the chosen pages; the component library is not a per-run
  // choice — every COMPONENT / COMPONENT_SET in the file is exported, from every page.
  for (let pi = 0; pi < sel.pageIds.length; pi++) {
    const page = await figma.getNodeByIdAsync(sel.pageIds[pi]);
    if (!page || page.type !== 'PAGE') continue;
    await page.loadAsync(); pagesOut.push(page.name);
    (await topFrames(page)).forEach(c => { if (screens.length < 200) screens.push({ name: c.name, page: page.name, id: c.id, w: Math.round(c.width) }); });
  }
  const scans = [];
  let totalC = 0;
  for (const page of figma.root.children.filter(p => p.type === 'PAGE')) {
    await page.loadAsync();
    const found = page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] }).filter(n => !(n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET'));
    if (found.length) { scans.push({ page, found }); totalC += found.length; }
  }
  let done = 0;
  for (const { page, found } of scans) {
    for (let i = 0; i < found.length; i++) {
      done++;
      say(30 + Math.round((done / Math.max(1, totalC)) * 50), 'Component ' + done + '/' + totalC + ': ' + found[i].name);
      const r = await extractComponent(found[i], page.name); components.push(r.comp); issues.push(...r.issues);
      if (done % 10 === 0) await new Promise(res => setTimeout(res, 0));
    }
  }

  if (sel.styles && sel.libStyles !== false) {
    const known = new Set([].concat(styles.text, styles.paint, styles.effect).map(x => x.id)), used = new Set(); components.forEach(c => c._styleIds.forEach(id => used.add(id)));
    for (const id of used) { if (known.has(id)) continue; try { const st = await figma.getStyleByIdAsync(id), r = st && styleRec(st, st.remote ? 'library' : 'local'); if (r) { styles[r.kind].push(r); known.add(id); } } catch (e) { /* inaccessible style */ } }
    Object.keys(styles).forEach(k => styles[k].sort((a, b) => a.name.localeCompare(b.name)));
  }
  components.sort((a, b) => a.name.localeCompare(b.name));
  const expand = id => mk(byId[id], true)._chainIds;
  DRAFT = { key: selKey(sel), byId, colById, mk, expand, tokens, have, styles, components, screens, pagesOut, issues, cols };
  return DRAFT;
}

async function detect(sel) {
  const D = await buildDraft(sel, true), plan = planDependencies(D.components, D.tokens, D.have, D.byId, D.expand);
  post('deps', { plan, selected: { components: D.components.length, tokens: D.tokens.length } });
}

async function analyze(sel, ctxForm, dd) {
  await figma.clientStorage.setAsync('sel2', sel);
  const D = DRAFT && DRAFT.key === selKey(sel) ? DRAFT : await buildDraft(sel, false);
  prog(82, 'Resolving dependencies…');
  const plan = planDependencies(D.components, D.tokens, D.have, D.byId, D.expand), pol = applyPolicy(plan, sel.depPolicy, dd);
  const tokens = D.tokens.slice(), have = new Set(D.have), components = D.components.slice(), issues = D.issues.concat(pol.warnings);
  const addTokens = list => list.forEach(d => { if (have.has(d.id) || !D.byId[d.id]) return; const t = D.mk(D.byId[d.id], true); t.requiredBy = d.requiredBy.map(r => r.by).filter((x, i, a) => a.indexOf(x) === i).sort(); tokens.push(t); have.add(d.id); });
  addTokens(pol.tokenDeps);
  const added = [];
  for (const m of pol.components) {
    const node = await figma.getNodeByIdAsync(m.nodeId);
    if (!node || node.remote) { issues.push({ code: 'DEPENDENCY_MISSING_COMPONENT', severity: 'warning', entityId: m.name, message: 'Component "' + m.name + '" could not be read.', recovery: 'Open the library file or expand scope.' }); continue; }
    const r = await extractComponent(node, pageOf(node)); r.comp.origin = 'dependency'; r.comp.requiredBy = m.requiredBy.map(x => x.by).sort();
    components.push(r.comp); added.push(r.comp); issues.push(...r.issues);
  }
  if (added.length && sel.depPolicy === 'auto_include') addTokens(planDependencies(added, [], have, D.byId, D.expand).tokenDeps);
  components.sort((a, b) => a.name.localeCompare(b.name) || a.figmaId.localeCompare(b.figmaId)); tokens.sort((a, b) => a.name.localeCompare(b.name));
  uniquifyComponents(components);
  const usedBy = {};
  components.forEach(c => { c.tokens = [...new Set(c._tokenIds.map(id => D.byId[id] && D.byId[id].name).filter(Boolean))].sort(); c._tokenIds.forEach(id => (usedBy[id] = usedBy[id] || new Set()).add(c.name)); });
  tokens.forEach(t => { if (usedBy[t.figmaId]) t.usedBy = [...usedBy[t.figmaId]].sort(); });
  issues.push(...valueMatchIssues(tokens));

  const facts = ['Selected scope contains ' + D.pagesOut.length + ' page(s) and ' + D.screens.length + ' top-level frame(s).'].concat(D.screens.slice(0, 30).map(s => 'Frame "' + s.name + '" on page "' + s.page + '" (' + s.id + ')'));
  const designComps = components.filter(c => !c.icon);
  const cm = (ctxForm && ctxForm.mode) || 'skip';
  if (sel.icons !== false) { prog(88, 'Detecting icons…'); await scanFrames(sel.pageIds); } else SHEETS = new Set();
  D.screens.forEach(x => { x.sheet = SHEETS.has(x.id); });
  const figInf = inferFromFrames(D.screens.filter(x => !x.sheet), D.pagesOut.concat(D.screens.filter(x => !x.sheet).map(x => x.name), components.map(c => c.name)));
  if (sel.icons === false) ICON.map = {};
  Object.values(ICON.map).filter(r => r.unnamed).sort((a, b) => a.w - b.w || a.h - b.h || String(a.id).localeCompare(String(b.id))).forEach((r, i) => { r.name = 'Unnamed icon ' + (i + 1) + ' (' + r.w + '×' + r.h + ')'; });
  const icons = Object.values(ICON.map).map(r => ({ id: 'icon.' + slug(r.name), figmaId: r.id, name: r.name, named: !r.unnamed, label: 'Icon', kind: r.kind, w: r.w, h: r.h, confidence: r.score, evidence: r.evidence, usedIn: [...r.usedIn].sort(), svg: '' })).sort((a, b) => (a.named === b.named ? a.name.localeCompare(b.name) : a.named ? -1 : 1));
  if (sel.iconSvg) { prog(92, 'Exporting icon SVG…'); for (const ic of icons.slice(0, 150)) { try { const c = ICON.cache[ic.figmaId], sv = c && c.base ? await c.base.exportAsync({ format: 'SVG_STRING' }) : ''; ic.svg = sv && sv.length <= 8000 ? sv.replace(/<\?xml[^>]*>\s*/, '') : ''; } catch (e) { /* skip */ } } }
  const refs = [], refReport = { ok: [], failed: [] };
  for (const id of (sel.refFrameIds || [])) { prog(95, 'Reference frame ' + (refs.length + 1) + '…'); try { const nd = await figma.getNodeByIdAsync(id); if (nd && nd.type === 'FRAME') { const rf = await refFrame(nd, D.byId, getEngine(sel), refTokenMap(tokens, D.styles), sel); refs.push(rf); refReport.ok.push({ id: rf.id, name: rf.name, nodes: rf.nodes, engine: rf.engine, images: (rf.files || []).length, notes: rf.notes || [] }); } else refReport.failed.push({ id, name: nd ? nd.name : id, reason: 'Not a top-level frame' }); } catch (e) { const why = String((e && e.message) || e); refReport.failed.push({ id, name: id, reason: why }); issues.push({ code: 'REFERENCE_FAILED', severity: 'warning', entityId: id, message: 'Frame could not be converted to code: ' + why, recovery: 'Deselect it or simplify the frame.' }); } }
  const E = getEngine(sel), compExport = { ok: [], failed: [], engine: E ? E.id + '@' + E.version : null };
  if (E && typeof E.exportComponent === 'function') {
    prog(96, 'Rendering component HTML…');
    const tokMap = refTokenMap(tokens, D.styles), classNames = new Set(), totalHtml = designComps.reduce((n, c) => n + (c.kind === 'component-set' ? c.variants || 1 : 1), 0); let rendered = 0;
    for (const c of designComps) {
      let nd;
      try { nd = await figma.getNodeByIdAsync(c.figmaId); if (!nd) throw new Error('Node is no longer in the file'); } catch (e) { compExport.failed.push({ id: c.id, name: c.name, reason: String((e && e.message) || e) }); continue; }
      const variants = nd.type === 'COMPONENT_SET' ? nd.children.filter(x => x.type === 'COMPONENT') : [nd], defaultNode = defaultComponentVariant(nd);
      for (const variant of variants) {
        rendered++; const isDefault = variant.id === defaultNode.id, name = isDefault ? c.name : c.name + ' / ' + variant.name;
        if (rendered % 5 === 1) prog(96, 'Component HTML ' + rendered + '/' + totalHtml);
        try {
          const r = await E.exportComponent(variant, tokMap, { matchColorsByValue: sel.refMatchColors !== false, embedImages: true }, classNames);
          compExport.ok.push({ id: isDefault ? c.id : c.id + '.variant.' + slug(variant.id), name, figmaId: isDefault ? c.figmaId : variant.id, nodeId: variant.id, variantOf: isDefault ? null : c.figmaId, isDefault, className: r.className, html: r.html, css: r.css, w: r.width, h: r.height, nodes: r.nodes, vars: r.vars, meta: r.metadata || null });
        } catch (e) { compExport.failed.push({ id: isDefault ? c.id : c.id + '.variant.' + slug(variant.id), name, figmaId: variant.id, reason: String((e && e.message) || e) }); }
        if (rendered % 5 === 0) await new Promise(res => setTimeout(res, 0));
      }
    }
    compExport.coverage = { sourceFamilies: designComps.length, sourceVariants: totalHtml, exportedFamilies: new Set(compExport.ok.map(x => x.variantOf || x.figmaId)).size, exportedVariants: compExport.ok.length, failedVariants: compExport.failed.length };
    compExport.failed.forEach(x => issues.push({ code: 'COMPONENT_HTML_EXPORT_FAILED', severity: 'error', entityId: x.id, message: 'HTML export failed for ' + x.name + ': ' + x.reason, recovery: 'Fix the component or inspect the fig-engine error; partial coverage is reported.' }));
  }
  const nSty = D.styles.text.length + D.styles.paint.length + D.styles.effect.length, autoDesc = 'Design system file with ' + designComps.length + ' component(s), ' + tokens.length + ' token(s) and ' + nSty + ' style(s) across ' + D.pagesOut.length + ' page(s).';
  D.cols.filter(c => sel.collectionIds.includes(c.id)).forEach(c => facts.push('Variable collection "' + c.name + '" has ' + c.modes.length + ' mode(s): ' + c.modes.map(m => m.name).join(', ')));
  if (designComps.length) facts.push('The file contains ' + designComps.length + ' component(s) or component set(s) across all pages.');
  MODEL = { icons, iconPack: sel.iconPack || '', adherence: sel.adherence === undefined || sel.adherence === null ? 3 : clampLevel(sel.adherence), refs, refEmbed: sel.refEmbedImages === true, rootVars: rootVars(tokens), fileName: figma.root.name, pages: D.pagesOut, tokens, styles: D.styles, components: designComps, screens: D.screens, collections: D.cols.filter(c => sel.collectionIds.includes(c.id)).map(c => ({ id: c.id, name: c.name, defaultMode: (c.modes.find(m => m.modeId === c.defaultModeId) || c.modes[0]).name, modes: c.modes.map(m => m.name), modeMap: Object.fromEntries(c.modes.map(m => [m.name, m.modeId])) })),
    componentHtml: compExport,
    sections: sel.sections || {}, context: cm === 'skip' ? buildContext({}, facts, []) : buildContext(ctxForm, facts, figInf, { name: figma.root.name, description: autoDesc }), contentPack: cm !== 'skip', ctxMode: cm, depPolicy: sel.depPolicy,
    depSummary: { tokens: tokens.filter(t => t.origin === 'dependency').length, components: components.filter(c => c.origin === 'dependency').length } };
  MODEL.validation = validate(MODEL, issues);
  MODEL.fileList = null;
  const review = [], heur = {};
  tokens.forEach(t => { if (t.categorySource === 'name-heuristic' && t.category !== 'other') (heur[t.category] = heur[t.category] || []).push(t.name); });
  Object.keys(heur).sort().forEach(c => review.push({ id: 'cat:' + c, kind: 'Low confidence', title: 'Category "' + c + '" was inferred from variable names', detail: heur[c].length + ' token(s)', confidence: 0.7, evidence: heur[c].slice(0, 3), decidable: true }));
  MODEL.context.inferences.forEach(i => review.push({ id: i.id, kind: 'Context inference', title: i.statement, detail: 'from pasted context', confidence: i.confidence, evidence: i.evidence, decidable: true }));
  MODEL.validation.issues.filter(i => i.severity === 'error' || i.code.indexOf('DEPENDENCY_') === 0).slice(0, 60).forEach((i, k) => review.push({ id: 'iss:' + k, kind: i.code === 'DEPENDENCY_EXCLUDED' || i.code === 'DEPENDENCY_MISSING_COMPONENT' ? 'Missing dependency' : 'Unresolved reference', title: i.code + ' · ' + i.entityId, detail: i.message + ' ' + i.recovery, confidence: 1, evidence: [], decidable: false }));
  prog(100, 'Done');
  post('analysis', { summary: { pages: D.pagesOut.length, tokens: tokens.length, deps: MODEL.depSummary.tokens + MODEL.depSummary.components, components: designComps.length, componentsHtml: compExport.ok.length, styles: D.styles.text.length + D.styles.paint.length + D.styles.effect.length, screens: D.screens.length, icons: icons.length, refs: refs.length }, validation: MODEL.validation, review, refReport, compReport: { ok: compExport.ok.length, failed: compExport.failed, engine: compExport.engine } });
}

// ---------- Validation ----------

// ---------- design.md package generator (max 5 Markdown files, grouped by category) ----------
const esc = s => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const tbl = (h, rows) => rows.length ? '| ' + h.join(' | ') + ' |\n|' + h.map(() => '---').join('|') + '|\n' + rows.map(r => '| ' + r.map(esc).join(' | ') + ' |').join('\n') + '\n' : '';
const NA = '_Not available from the selected sources (unsupported or not detected)._\n';
const modeStr = t => Object.entries(t.modes).map(([m, r]) => m + ': ' + (r.status === 'resolved' ? r.value : '(' + r.status + ')')).join('; ');
const tokRows = L => L.map(t => [t.name + (t.origin === 'dependency' ? ' (dependency)' : ''), t.role, modeStr(t), (Object.values(t.modes)[0].chain || []).join(' → ') || '—']);
const UNS = [['foundations', 'Foundations'], ['layout', 'Layout'], ['responsive', 'Responsive'], ['interaction', 'Interaction'], ['accessibility', 'Accessibility'], ['content', 'Content'], ['documentation', 'Documentation'], ['governance', 'Governance']];



function referenceMd(M) {
  let s = '# Reference\n\n> Visual reference exported from Figma as HTML + CSS. Layout is generated from the node tree and can differ from Figma in details. Colors point to token variables when they were bound.\n\n';
  if ((M.rootVars || []).length) s += '## CSS variables (from tokens)\n\n```css\n:root {\n' + M.rootVars.join('\n') + '\n}\n```\n\n';
  (M.refs || []).forEach(r => { s += '## ' + r.name + '\n\n- Page: ' + r.page + '\n- Size: ' + r.w + '×' + r.h + 'px\n- Nodes: ' + r.nodes + (r.truncated ? ' (truncated)' : '') + '\n- Source: figma:' + r.id + '\n\n```html\n' + r.html + '\n```\n\n'; });
  const sv = (M.icons || []).filter(i => i.svg);
  if (sv.length) { s += '## Icons (SVG)\n\n'; sv.forEach(i => s += '### ' + i.name + '\n\n```svg\n' + i.svg + '\n```\n\n'); }
  return s;
}

// ---------- content.md: product identity & handoff document ----------
function domSep(tokens) {
  const f = n => n.includes('/') ? '/' : n.includes('.') ? '.' : n.includes('-') ? '-' : 'none', c = {};
  tokens.forEach(t => { const k = f(t.name); c[k] = (c[k] || 0) + 1; });
  return Object.keys(c).sort((a, b) => c[b] - c[a])[0] || 'none';
}

// ---------- design.md -> Figma (colors only, create-only) ----------
async function build(items) {
  if (!items.length) return post('built', { created: 0, skipped: 0 });
  const existing = new Set((await figma.variables.getLocalVariablesAsync()).map(v => v.name));
  const col = figma.variables.createVariableCollection('design.md import');
  let created = 0, skipped = 0;
  for (const it of items) {
    if (existing.has(it.name)) { skipped++; continue; }
    figma.variables.createVariable(it.name, col, 'COLOR').setValueForMode(col.defaultModeId, rgb(it.hex)); created++;
  }
  if (!created) col.remove();
  figma.notify('Created ' + created + ' variable(s)');
  post('built', { created, skipped });
}

async function resizeUi(msg) {
  const s = uiSize(msg.w, msg.h);
  figma.ui.resize(s[0], s[1]);
  if (msg.commit) await figma.clientStorage.setAsync('ui-size', { w: s[0], h: s[1] });
}

if (typeof figma !== 'undefined') figma.ui.onmessage = async msg => {
  try {
    if (msg.type === 'discover') await discover();
    else if (msg.type === 'detect') await detect(msg.sel);
    else if (msg.type === 'frames') await listFrames(msg);
    else if (msg.type === 'frame-thumb') await frameThumb(msg);
    else if (msg.type === 'resize') await resizeUi(msg);
    else if (msg.type === 'rescan-icons') await rescanIcons(msg);
    else if (msg.type === 'prompt') {
      const d = MODEL ? promptData(MODEL) : { name: DISC ? DISC.fileName : '', components: DISC ? DISC.comps.slice(0, 200).map(c => ({ name: c.name, variants: c.variants, states: [], props: [] })) : [], tokens: [], textStyles: [], icons: DISC ? DISC.comps.filter(c => c.icon).map(c => c.name) : [], themes: [] };
      d.files = msg.files || []; post('prompt-result', { text: buildPrompt(msg.opts, d), hasModel: !!MODEL, defaults: { name: d.name, platform: (d.platforms || [])[0] || '', language: d.language || '', direction: d.direction || '' } });
    }
    else if (msg.type === 'parse-context') post('context-parsed', parseContext(msg.text));
    else if (msg.type === 'analyze') await analyze(msg.sel, msg.ctx, msg.dd);
    else if (msg.type === 'generate') { if (!MODEL) throw new Error('Run the analysis first.'); if (msg.adherence !== undefined && msg.adherence !== null) MODEL.adherence = clampLevel(msg.adherence); { const out = gen(MODEL, msg.mode, msg.rejected, msg.rejInf); sendFiles(out, MODEL.lint); } }
    else if (msg.type === 'build') await build(msg.items);
    else if (msg.type === 'settings-set') await figma.clientStorage.setAsync('settings', msg.data);
    else if (msg.type === 'reset') { await figma.clientStorage.deleteAsync('sel2'); figma.notify('Saved selection cleared'); }
    else if (msg.type === 'close') figma.closePlugin();
  } catch (e) { post('error', { message: String((e && e.message) || e) }); }
};
if (typeof module !== 'undefined') module.exports = { sendFiles, uiSize, levelPicker, extractDataImages, refDoc, refFileNames, refFileName, validate, enrichModel, patternData, lintPackage, aggregateIssues, uniquifyComponents, matchTextStyle, nearestColor, guessPack, engineInfo, refTokenMap, valueMatchIssues, aiControlMd, levelLine, referenceFiles, tokensCss, cssNameMap, cssValue, cssVar, iconScore, inferFromFrames, buildPrompt, promptData, referenceMd, iconsMd, parseContext, buildContext, ctxMd, contentMd, planDependencies, applyPolicy, resolve, gen };
