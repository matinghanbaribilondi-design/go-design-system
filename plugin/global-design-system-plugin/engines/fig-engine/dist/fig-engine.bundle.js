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
