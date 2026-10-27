var ReferenceEngine = (() => {
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

  // reference-engine/adapter.ts
  var adapter_exports = {};
  __export(adapter_exports, {
    contract: () => contract,
    exportFrame: () => exportFrame,
    id: () => id,
    version: () => version
  });

  // reference-engine/vendor/pixel-perfect/plugin/converter/utils.ts
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
  function uint8ArrayToBase64(bytes) {
    var _a, _b, _c, _d, _e, _f, _g;
    let binary = "";
    const len = bytes.byteLength;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (let i = 0; i < len; i += 3) {
      const b1 = (_a = bytes[i]) != null ? _a : 0;
      const b2 = i + 1 < len ? (_b = bytes[i + 1]) != null ? _b : 0 : 0;
      const b3 = i + 2 < len ? (_c = bytes[i + 2]) != null ? _c : 0 : 0;
      const enc1 = b1 >> 2;
      const enc2 = (b1 & 3) << 4 | b2 >> 4;
      const enc3 = (b2 & 15) << 2 | b3 >> 6;
      const enc4 = b3 & 63;
      binary += ((_d = chars[enc1]) != null ? _d : "") + ((_e = chars[enc2]) != null ? _e : "");
      binary += i + 1 < len ? (_f = chars[enc3]) != null ? _f : "" : "=";
      binary += i + 2 < len ? (_g = chars[enc4]) != null ? _g : "" : "=";
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
  function detectSemanticTag(node) {
    const name = node.name.toLowerCase();
    if (node.type === "TEXT") {
      if (name.includes("h1") || name.startsWith("header-1") || name.startsWith("title-1")) return "h1";
      if (name.includes("h2") || name.startsWith("header-2") || name.startsWith("title-2")) return "h2";
      if (name.includes("h3") || name.startsWith("header-3") || name.startsWith("title-3")) return "h3";
      if (name.includes("h4") || name.startsWith("header-4")) return "h4";
      if (name.includes("button") || name.includes("btn") || name.includes("\u062F\u06A9\u0645\u0647")) return "span";
      if (name.includes("label") || name.includes("\u0644\u06CC\u0628\u0644")) return "span";
      return "p";
    }
    const hasSubContainers = "children" in node && node.children.some(
      (c) => c.type === "FRAME" || c.type === "INSTANCE" || c.type === "COMPONENT" || c.type === "GROUP" || c.type === "SECTION" || c.type === "RECTANGLE"
    );
    if (hasSubContainers) {
      if (name.includes("nav") || name.includes("menu") || name.includes("\u0645\u0646\u0648")) return "nav";
      if (name.includes("header") || name.includes("\u0647\u062F\u0631")) return "header";
      if (name.includes("footer") || name.includes("\u0641\u0648\u062A\u0631")) return "footer";
      if (name.includes("section") || name.includes("\u0628\u062E\u0634")) return "section";
      if (name.includes("card") || name.includes("article")) return "article";
      return "div";
    }
    if (name.includes("button") || name.includes("btn") || name.startsWith("cta") || name.includes("\u062F\u06A9\u0645\u0647")) {
      return "button";
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

  // reference-engine/vendor/pixel-perfect/plugin/variables/varvar/colorSpaces.ts
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

  // reference-engine/vendor/pixel-perfect/shared/constants.ts
  var CENTER_TOLERANCE_PX = 8;
  var SMALL_CONTAINER_MAX_WIDTH = 320;
  var SMALL_CONTAINER_MAX_HEIGHT = 320;
  var MAX_AUTO_SVG_SIZE = 600;
  var FONT_STACK_LTR = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
  var FONT_STACK_RTL = `'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, sans-serif`;
  var FONT_FALLBACK_CHAIN = `'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

  // reference-engine/vendor/pixel-perfect/plugin/converter/typography.ts
  function getFontWeightNumber(style) {
    const s = (style || "").toLowerCase();
    if (s.includes("thin") || s.includes("hairline")) return 100;
    if (s.includes("extralight") || s.includes("ultralight")) return 200;
    if (s.includes("light")) return 300;
    if (s.includes("medium")) return 500;
    if (s.includes("semibold") || s.includes("demibold")) return 600;
    if (s.includes("extrabold") || s.includes("ultrabold")) return 800;
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
  function extractTypography(node, options, tokenRegistry) {
    var _a;
    const isRtl = isRtlText(node.characters);
    const resolver = new TokenResolver(tokenRegistry);
    const result = {
      textAlign: isRtl ? "right" : "left",
      direction: isRtl ? "rtl" : "ltr",
      whiteSpace: node.textAutoResize === "WIDTH_AND_HEIGHT" ? "nowrap" : "pre-wrap"
    };
    switch (node.textAlignHorizontal) {
      case "CENTER":
        result.textAlign = "center";
        break;
      case "RIGHT":
        result.textAlign = "right";
        break;
      case "JUSTIFIED":
        result.textAlign = "justify";
        break;
      case "LEFT":
        result.textAlign = "left";
        break;
      default:
        result.textAlign = isRtl ? "right" : "left";
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
      const rawLines = node.characters.split("\n").map((l) => l.trim()).filter(Boolean);
      if (rawLines.length > 1 && rawLines.every((l) => l.startsWith("\u2022") || l.startsWith("\u2022") || l.startsWith("- ") || l.startsWith("\u2013 "))) {
        isList = true;
        listType = "unordered";
      }
    }
    if (isList) {
      result.isList = true;
      result.listType = listType;
      let gap = 8;
      const listSpacing = node.listSpacing;
      if (typeof listSpacing === "number" && listSpacing > 0) {
        gap = listSpacing;
      } else if (typeof node.paragraphSpacing === "number" && node.paragraphSpacing > 0) {
        gap = node.paragraphSpacing;
      }
      result.listGap = formatUnit(gap, options.useRem, options.baseFontSize);
    }
    try {
      const segments = node.getStyledTextSegments([
        "fontSize",
        "fontName",
        "fontWeight",
        "fills",
        "lineHeight",
        "letterSpacing",
        "textDecoration",
        "textCase"
      ]);
      if (segments.length > 1) {
        result.segments = segments.map((seg) => {
          var _a2, _b, _c;
          const segFills = seg.fills.filter((f) => f.visible !== false && f.type === "SOLID");
          const firstFill = segFills[0];
          let color = result.color || resolver.resolveColor({ r: 0, g: 0, b: 0 }, 1);
          if (firstFill && firstFill.type === "SOLID") {
            color = resolver.resolveColor(firstFill.color, (_a2 = firstFill.opacity) != null ? _a2 : 1);
          }
          const weight = typeof seg.fontWeight === "number" ? seg.fontWeight : getFontWeightNumber(((_b = seg.fontName) == null ? void 0 : _b.style) || "Regular");
          let textDec = void 0;
          if (seg.textDecoration === "UNDERLINE") textDec = "underline";
          else if (seg.textDecoration === "STRIKETHROUGH") textDec = "line-through";
          let textTrans = void 0;
          if (seg.textCase === "UPPER") textTrans = "uppercase";
          else if (seg.textCase === "LOWER") textTrans = "lowercase";
          else if (seg.textCase === "TITLE") textTrans = "capitalize";
          const fam = ((_c = seg.fontName) == null ? void 0 : _c.family) || "";
          const fontFamily = fam ? `'${fam}', ${FONT_FALLBACK_CHAIN}` : FONT_FALLBACK_CHAIN;
          return {
            text: seg.characters,
            fontSize: formatUnit(seg.fontSize, options.useRem, options.baseFontSize),
            fontWeight: weight,
            fontFamily,
            lineHeight: formatLineHeight(seg.lineHeight, seg.fontSize, options),
            letterSpacing: formatLetterSpacing(seg.letterSpacing, options),
            color,
            textDecoration: textDec,
            textTransform: textTrans
          };
        });
      }
    } catch (err) {
      console.warn("[typography] getStyledTextSegments failed, falling back to uniform style:", err);
    }
    const boundFontSize = resolver.varFor(TokenResolver.boundId(node, "fontSize"));
    if (boundFontSize) {
      result.fontSize = boundFontSize;
    } else if (typeof node.fontSize === "number") {
      result.fontSize = formatUnit(node.fontSize, options.useRem, options.baseFontSize);
    }
    if (node.fontName && typeof node.fontName === "object" && "family" in node.fontName) {
      const fam = node.fontName.family;
      result.fontFamily = `'${fam}', ${FONT_FALLBACK_CHAIN}`;
      result.fontWeight = getFontWeightNumber(node.fontName.style);
    } else {
      result.fontFamily = FONT_FALLBACK_CHAIN;
    }
    if (node.lineHeight && typeof node.lineHeight === "object") {
      const fs = typeof node.fontSize === "number" ? node.fontSize : 16;
      result.lineHeight = formatLineHeight(node.lineHeight, fs, options);
    }
    if (node.letterSpacing && typeof node.letterSpacing === "object") {
      result.letterSpacing = formatLetterSpacing(node.letterSpacing, options);
    }
    const boundFillId = TokenResolver.boundId(node, "fills0");
    const fillStyleId = TokenResolver.styleId(node, "fillStyleId");
    if (Array.isArray(node.fills)) {
      const activeFill = node.fills.find((f) => f.visible !== false && f.type === "SOLID");
      if (activeFill && activeFill.type === "SOLID") {
        result.color = resolver.resolveColor(activeFill.color, (_a = activeFill.opacity) != null ? _a : 1, boundFillId, fillStyleId);
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
    if (truncApi.textTruncation === "ENDING") {
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
    }
    return result;
  }

  // reference-engine/vendor/pixel-perfect/plugin/variables/variable-collector.ts
  function normalizeColorKey(color, opacity = 1) {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = Math.round(opacity * 1e3) / 1e3;
    return `${r},${g},${b},${a}`;
  }

  // reference-engine/vendor/pixel-perfect/shared/token-resolver.ts
  var TokenResolver = class {
    constructor(registry) {
      __publicField(this, "tokensMap");
      __publicField(this, "resolveColorFn");
      var _a;
      if (registry instanceof Map) {
        this.tokensMap = registry;
      } else {
        this.tokensMap = (_a = registry == null ? void 0 : registry.tokensMap) != null ? _a : /* @__PURE__ */ new Map();
        if (registry && "resolveColor" in registry && typeof registry.resolveColor === "function") {
          this.resolveColorFn = registry.resolveColor;
        }
      }
    }
    /** Returns `var(--token)` when a variable/style id is bound, otherwise null. */
    varFor(id2) {
      if (!id2) return null;
      const token = this.tokensMap.get(id2);
      return token ? `var(${token.cssVarName})` : null;
    }
    /** Resolves any solid color strictly to a CSS variable var(--token) with NO hex/rgb fallbacks in classes. */
    resolveColor(color, opacity = 1, boundVarId, styleId) {
      var _a;
      const bound = (_a = this.varFor(boundVarId)) != null ? _a : this.varFor(styleId);
      if (bound) {
        const varName = bound.replace(/^var\(/, "").replace(/\)$/, "").split(",")[0].trim();
        return `var(${varName})`;
      }
      if (this.resolveColorFn) {
        const res = this.resolveColorFn(color, opacity, boundVarId, styleId);
        if (res.startsWith("var(")) {
          const varName = res.replace(/^var\(/, "").replace(/\)$/, "").split(",")[0].trim();
          return `var(${varName})`;
        }
        return res;
      }
      const key = normalizeColorKey(color, opacity);
      const byValue = this.tokensMap.get(key);
      if (byValue) {
        return `var(${byValue.cssVarName})`;
      }
      return opacity >= 1 ? figmaColorToHex(color) : figmaColorToRgba(color, opacity);
    }
    /** Reads a bound variable id from a SceneNode without `any` casts. */
    static boundId(node, path) {
      var _a, _b, _c;
      if (!("boundVariables" in node)) return null;
      const bv = node.boundVariables;
      if (!bv) return null;
      if (path === "fills0") {
        const fills = bv["fills"];
        return (_b = (_a = fills == null ? void 0 : fills[0]) == null ? void 0 : _a.id) != null ? _b : null;
      }
      const entry = bv[path];
      return (_c = entry == null ? void 0 : entry.id) != null ? _c : null;
    }
    /** Reads a style id (fill / stroke / effect) from a SceneNode without `any` casts. */
    static styleId(node, field) {
      if (!(field in node)) return null;
      const v = node[field];
      return typeof v === "string" && v.length > 0 ? v : null;
    }
  };

  // reference-engine/vendor/pixel-perfect/plugin/converter/layout.ts
  function extractLayout(node, parent, options, tokenRegistry) {
    const layout = {};
    const resolver = new TokenResolver(tokenRegistry);
    const isAutoLayoutParent = parent && "layoutMode" in parent && parent.layoutMode !== "NONE";
    const hasChildren = "children" in node && node.children.length > 0;
    const boxDims = getNodeBoxDimensions(node);
    const childOutsideSw = getChildrenMaxOutsideStroke(node);
    const isAutoLayout = "layoutMode" in node && node.layoutMode !== "NONE";
    const parentStrokesIncluded = Boolean(
      "strokesIncludedInLayout" in node && node.strokesIncludedInLayout
    );
    const extraChildSw = isAutoLayout && !parentStrokesIncluded ? childOutsideSw : 0;
    const nodeWidth = boxDims.width + (boxDims.outsideStrokeWeight === 0 ? extraChildSw * 2 : 0);
    const nodeHeight = boxDims.height + (boxDims.outsideStrokeWeight === 0 ? extraChildSw * 2 : 0);
    if ("layoutMode" in node && node.layoutMode !== "NONE") {
      layout.display = "flex";
      layout.flexDirection = node.layoutMode === "HORIZONTAL" ? "row" : "column";
      layout.direction = "ltr";
      layout.position = "relative";
      if ("layoutWrap" in node && node.layoutWrap === "WRAP") {
        layout.flexWrap = "wrap";
        if ("counterAxisSpacing" in node && typeof node.counterAxisSpacing === "number" && node.counterAxisSpacing > 0) {
          if (node.layoutMode === "HORIZONTAL") {
            layout.rowGap = formatUnit(node.counterAxisSpacing, options.useRem, options.baseFontSize);
          } else {
            layout.columnGap = formatUnit(node.counterAxisSpacing, options.useRem, options.baseFontSize);
          }
        }
      }
      let boundGap = null;
      const boundGapId = TokenResolver.boundId(node, "itemSpacing");
      if (boundGapId) {
        boundGap = resolver.varFor(boundGapId);
      }
      if (boundGap) {
        layout.gap = boundGap;
      } else if (typeof node.itemSpacing === "number" || extraChildSw > 0) {
        const rawItemSpacing = typeof node.itemSpacing === "number" ? node.itemSpacing : 0;
        const effectiveItemSpacing = rawItemSpacing - 2 * extraChildSw;
        if (effectiveItemSpacing > 0) {
          const gapVal = formatUnit(effectiveItemSpacing, options.useRem, options.baseFontSize);
          if (layout.flexWrap === "wrap" && layout.rowGap) {
            layout.columnGap = gapVal;
          } else {
            layout.gap = gapVal;
          }
        } else if (effectiveItemSpacing < 0) {
          layout.itemSpacing = effectiveItemSpacing;
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
      const pt = node.paddingTop || 0;
      const pr = node.paddingRight || 0;
      const pb = node.paddingBottom || 0;
      const pl = node.paddingLeft || 0;
      if (pt > 0 || pr > 0 || pb > 0 || pl > 0) {
        layout.padding = { top: pt, right: pr, bottom: pb, left: pl };
      }
    }
    if (!parent) {
      layout.position = "relative";
      layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
      layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
      layout.boxSizing = "border-box";
      if ("clipsContent" in node && node.clipsContent) {
        layout.overflow = "hidden";
      }
    } else if (isAutoLayoutParent) {
      if ("layoutPositioning" in node && node.layoutPositioning === "ABSOLUTE") {
        layout.position = "absolute";
        layout.left = formatUnit(node.x, options.useRem, options.baseFontSize);
        layout.top = formatUnit(node.y, options.useRem, options.baseFontSize);
        layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
        layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
      } else {
        const parentMode = parent.layoutMode;
        const isVerticalParent = parentMode === "VERTICAL";
        layout.flexShrink = 0;
        const sizingH = "layoutSizingHorizontal" in node ? node.layoutSizingHorizontal : void 0;
        const sizingV = "layoutSizingVertical" in node ? node.layoutSizingVertical : void 0;
        const align = "layoutAlign" in node ? node.layoutAlign : void 0;
        const grow = "layoutGrow" in node ? node.layoutGrow === 1 : false;
        const autoW = node.type === "TEXT" && node.textAutoResize === "WIDTH_AND_HEIGHT";
        const autoH = node.type === "TEXT" && node.textAutoResize !== "NONE";
        const primarySizing = isVerticalParent ? sizingV : sizingH;
        const counterSizing = isVerticalParent ? sizingH : sizingV;
        if (grow || primarySizing === "FILL") {
          layout.flexGrow = 1;
          layout.flexBasis = "0%";
          if (node.type !== "TEXT") {
            const size = isVerticalParent ? nodeHeight : nodeWidth;
            if (isVerticalParent) layout.minHeight = formatUnit(size, options.useRem, options.baseFontSize);
            else layout.minWidth = formatUnit(size, options.useRem, options.baseFontSize);
          }
        } else if (primarySizing === "HUG" || (isVerticalParent ? autoH : autoW)) {
          if (node.type !== "TEXT") {
            const fixedPrimary = isVerticalParent ? nodeHeight : nodeWidth;
            if (isVerticalParent) {
              layout.minHeight = formatUnit(fixedPrimary, options.useRem, options.baseFontSize);
            } else {
              layout.minWidth = formatUnit(fixedPrimary, options.useRem, options.baseFontSize);
            }
          }
        } else {
          const fixedPrimary = isVerticalParent ? nodeHeight : nodeWidth;
          if (isVerticalParent) layout.height = formatUnit(fixedPrimary, options.useRem, options.baseFontSize);
          else layout.width = formatUnit(fixedPrimary, options.useRem, options.baseFontSize);
        }
        if (align === "STRETCH" || counterSizing === "FILL") {
          layout.alignSelf = "stretch";
          if (isVerticalParent) layout.width = "100%";
          else layout.height = "100%";
        } else if (counterSizing === "HUG" || (isVerticalParent ? autoW : autoH)) {
          if (node.type !== "TEXT") {
            if (isVerticalParent) {
              layout.minWidth = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
            } else {
              layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
            }
          }
        } else {
          const fixedCounter = isVerticalParent ? nodeWidth : nodeHeight;
          if (isVerticalParent) layout.width = formatUnit(fixedCounter, options.useRem, options.baseFontSize);
          else layout.height = formatUnit(fixedCounter, options.useRem, options.baseFontSize);
        }
        if (node.type !== "TEXT") {
          if (!layout.height && layout.alignSelf !== "stretch") {
            layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          }
          if (!layout.width && layout.flexGrow !== 1) {
            layout.minWidth = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          }
        }
        if (hasChildren && !layout.position) {
          layout.position = "relative";
        }
      }
    } else {
      layout.position = "absolute";
      const rawX = typeof node.x === "number" ? node.x : 0;
      const rawY = typeof node.y === "number" ? node.y : 0;
      const parentX = parent && typeof parent.x === "number" ? parent.x : 0;
      const parentY = parent && typeof parent.y === "number" ? parent.y : 0;
      const relX = parent.type === "GROUP" ? rawX - parentX : rawX;
      const relY = parent.type === "GROUP" ? rawY - parentY : rawY;
      const parentW = "width" in parent && typeof parent.width === "number" ? parent.width : 0;
      const parentH = "height" in parent && typeof parent.height === "number" ? parent.height : 0;
      const rawNodeW = "width" in node && typeof node.width === "number" ? node.width : 0;
      const rawNodeH = "height" in node && typeof node.height === "number" ? node.height : 0;
      const isFullBleed = Math.abs(relX) < 1 && Math.abs(relY) < 1 && parentW > 0 && parentH > 0 && Math.abs(rawNodeW - parentW) < 1 && Math.abs(rawNodeH - parentH) < 1;
      if (isFullBleed) {
        layout.left = "0px";
        layout.top = "0px";
        layout.width = "100%";
        layout.height = "100%";
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
        const adjustedX = borderLeft > 0 ? relX - borderLeft : relX;
        const adjustedY = borderTop > 0 ? relY - borderTop : relY;
        layout.left = formatUnit(adjustedX, options.useRem, options.baseFontSize);
        layout.top = formatUnit(adjustedY, options.useRem, options.baseFontSize);
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
        const isParentSmallContainer = "width" in parent && "height" in parent && parent.width <= SMALL_CONTAINER_MAX_WIDTH && parent.height <= SMALL_CONTAINER_MAX_HEIGHT;
        const isHorizontallyCentered = isParentSmallContainer && "width" in parent && Math.abs(relX + node.width / 2 - parent.width / 2) < CENTER_TOLERANCE_PX;
        const isVerticallyCentered = isParentSmallContainer && "height" in parent && Math.abs(relY + node.height / 2 - parent.height / 2) < CENTER_TOLERANCE_PX;
        if (isHorizontallyCentered && isVerticallyCentered) {
          layout.left = "50%";
          layout.top = "50%";
          layout.transform = "translate(-50%, -50%)";
        } else if (isHorizontallyCentered) {
          layout.left = "50%";
          layout.top = formatUnit(relY, options.useRem, options.baseFontSize);
          layout.transform = "translateX(-50%)";
        } else if (isVerticallyCentered) {
          layout.left = formatUnit(relX, options.useRem, options.baseFontSize);
          layout.top = "50%";
          layout.transform = "translateY(-50%)";
        } else {
          layout.left = formatUnit(relX, options.useRem, options.baseFontSize);
          layout.top = formatUnit(relY, options.useRem, options.baseFontSize);
        }
        if (textNode.textAutoResize === "WIDTH_AND_HEIGHT") {
          layout.width = "fit-content";
        } else {
          layout.width = formatUnit(node.width, options.useRem, options.baseFontSize);
        }
        if (textNode.textAutoResize !== "NONE") {
        } else {
          layout.height = formatUnit(node.height, options.useRem, options.baseFontSize);
        }
      } else {
        if ("layoutMode" in node && node.layoutMode !== "NONE") {
          if ("layoutSizingHorizontal" in node && node.layoutSizingHorizontal === "HUG") {
            layout.width = "fit-content";
            layout.minWidth = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          } else {
            layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          }
          if ("layoutSizingVertical" in node && node.layoutSizingVertical === "HUG") {
            layout.height = "fit-content";
            layout.minHeight = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          } else {
            layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          }
        } else {
          if (!layout.width) {
            layout.width = formatUnit(nodeWidth, options.useRem, options.baseFontSize);
          }
          if (!layout.height) {
            layout.height = formatUnit(nodeHeight, options.useRem, options.baseFontSize);
          }
        }
      }
    }
    if (hasChildren && (!("layoutMode" in node) || node.layoutMode === "NONE") && !layout.position) {
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
    const mainComp = getMainComponent(node);
    const isClipping = "clipsContent" in node && Boolean(node.clipsContent) || mainComp && "clipsContent" in mainComp && Boolean(mainComp.clipsContent);
    if (isClipping) {
      layout.overflow = "hidden";
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
      if (h === "STRETCH" && layout.position === "absolute" && parent && "width" in parent) {
        const parentW = parent.width;
        const leftPx = typeof layout.left === "string" ? parseFloat(layout.left) || node.x : node.x;
        const rightPx = Math.max(0, parentW - leftPx - node.width);
        layout.left = formatUnit(leftPx, options.useRem, options.baseFontSize);
        layout.right = formatUnit(rightPx, options.useRem, options.baseFontSize);
        delete layout.width;
      }
      if (h === "CENTER" && layout.position === "absolute" && parent && "width" in parent) {
        layout.left = "50%";
        layout.transform = layout.transform ? `${layout.transform} translateX(-50%)` : "translateX(-50%)";
        layout.width = formatUnit(node.width, options.useRem, options.baseFontSize);
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
    return layout;
  }

  // reference-engine/vendor/pixel-perfect/plugin/converter/styles.ts
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
    const mainComp = getMainComponent2(node);
    if ("fills" in node && Array.isArray(node.fills) && node.fills.length > 0) {
      fillsList = node.fills;
    } else if (mainComp && Array.isArray(mainComp.fills) && mainComp.fills.length > 0) {
      fillsList = mainComp.fills;
    }
    if (fillsList.length === 0) return;
    const activeFills = fillsList.filter((f) => f.visible !== false);
    const boundFillId = TokenResolver.boundId(node, "fills0");
    let fillStyleId = TokenResolver.styleId(node, "fillStyleId");
    if (!fillStyleId && (mainComp == null ? void 0 : mainComp.fillStyleId) && typeof mainComp.fillStyleId === "string") {
      fillStyleId = mainComp.fillStyleId;
    }
    const layers = activeFills.length > 1 ? [...activeFills].reverse() : activeFills;
    const width = "width" in node && typeof node.width === "number" ? node.width : 100;
    const height = "height" in node && typeof node.height === "number" ? node.height : 100;
    for (let idx = 0; idx < layers.length; idx++) {
      const fill = layers[idx];
      const isLastLayer = idx === layers.length - 1;
      const fillOpacity = typeof fill.opacity === "number" ? fill.opacity : 1;
      if (fill.type === "SOLID") {
        const colorVal = resolver.resolveColor(fill.color, fillOpacity, boundFillId, fillStyleId);
        if (!isLastLayer) {
          bgLayers.push(`linear-gradient(0deg, ${colorVal}, ${colorVal})`);
        } else {
          bgLayers.push(colorVal);
        }
      } else if (fill.type === "IMAGE") {
        const mode = "scaleMode" in fill && typeof fill.scaleMode === "string" ? fill.scaleMode : "FILL";
        const size = mode === "FIT" ? "contain" : mode === "TILE" ? "auto" : "cover";
        bgLayers.push(`__FIGMA_IMAGE_FILL__:${size}`);
      } else if (fill.type === "GRADIENT_LINEAR") {
        const angle = gradientTransformToAngle(fill.gradientTransform, width, height);
        const stops = fill.gradientStops.map((stop) => {
          const stopAlpha = typeof stop.color.a === "number" ? stop.color.a : 1;
          const effectiveAlpha = Math.round(stopAlpha * fillOpacity * 1e3) / 1e3;
          const c = resolver.resolveColor(stop.color, effectiveAlpha);
          return `${c} ${Math.round(stop.position * 100)}%`;
        }).join(", ");
        bgLayers.push(`linear-gradient(${angle}deg, ${stops})`);
      } else if (fill.type === "GRADIENT_RADIAL") {
        const stops = fill.gradientStops.map((stop) => {
          const stopAlpha = typeof stop.color.a === "number" ? stop.color.a : 1;
          const effectiveAlpha = Math.round(stopAlpha * fillOpacity * 1e3) / 1e3;
          const c = resolver.resolveColor(stop.color, effectiveAlpha);
          return `${c} ${Math.round(stop.position * 100)}%`;
        }).join(", ");
        bgLayers.push(`radial-gradient(circle, ${stops})`);
      } else if (fill.type === "GRADIENT_DIAMOND") {
        const stops = fill.gradientStops.map((stop) => {
          const stopAlpha = typeof stop.color.a === "number" ? stop.color.a : 1;
          const effectiveAlpha = Math.round(stopAlpha * fillOpacity * 1e3) / 1e3;
          const c = resolver.resolveColor(stop.color, effectiveAlpha);
          return `${c} ${Math.round(stop.position * 100)}%`;
        }).join(", ");
        bgLayers.push(`conic-gradient(from 45deg at 50% 50%, ${stops})`);
      }
    }
  }
  function extractVisualStyles(node, options, tokenRegistry, parent) {
    var _a, _b, _c, _d, _e, _f, _g;
    const styles = {};
    const resolver = new TokenResolver(tokenRegistry);
    const mainComp = getMainComponent2(node);
    const bgLayers = [];
    extractFills(node, resolver, bgLayers);
    if (bgLayers.length > 0) {
      styles.background = bgLayers.join(", ");
    }
    const boundRadiusVar = resolver.varFor(TokenResolver.boundId(node, "cornerRadius"));
    if (node.type === "ELLIPSE") {
      styles.borderRadius = "50%";
    } else if (boundRadiusVar) {
      styles.borderRadius = boundRadiusVar;
    } else {
      let cr = "cornerRadius" in node ? node.cornerRadius : void 0;
      let targetNode = node;
      if ((cr === void 0 || cr === 0) && mainComp && "cornerRadius" in mainComp) {
        cr = mainComp.cornerRadius;
        targetNode = mainComp;
      }
      if (typeof cr === "number" && cr > 0) {
        styles.borderRadius = formatUnit(cr, options.useRem, options.baseFontSize);
      } else if (typeof figma !== "undefined" && cr === figma.mixed || typeof cr !== "number" && cr !== void 0 || "topLeftRadius" in targetNode) {
        const corners = ["topLeftRadius", "topRightRadius", "bottomRightRadius", "bottomLeftRadius"];
        const vals = corners.map((k) => {
          let val = typeof targetNode[k] === "number" ? targetNode[k] : 0;
          if (val === 0 && mainComp && typeof mainComp[k] === "number") {
            val = mainComp[k];
          }
          return formatUnit(val, options.useRem, options.baseFontSize);
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
    if (strokeList.length > 0) {
      const activeStroke = strokeList.find((s) => s.visible !== false && s.type === "SOLID");
      if (activeStroke && activeStroke.type === "SOLID") {
        const boundStrokeId = "boundVariables" in node ? (_d = (_c = (_b = (_a = node.boundVariables) == null ? void 0 : _a["strokes"]) == null ? void 0 : _b[0]) == null ? void 0 : _c.id) != null ? _d : null : null;
        let strokeStyleId = TokenResolver.styleId(node, "strokeStyleId");
        if (!strokeStyleId && (mainComp == null ? void 0 : mainComp.strokeStyleId)) {
          strokeStyleId = mainComp.strokeStyleId;
        }
        const strokeColor = resolver.resolveColor(
          activeStroke.color,
          (_e = activeStroke.opacity) != null ? _e : 1,
          boundStrokeId,
          strokeStyleId
        );
        const src = strokeSource;
        const isDashed = "dashPattern" in src && Array.isArray(src.dashPattern) && src.dashPattern.length > 0;
        const borderStyle = isDashed ? "dashed" : "solid";
        const topW = "strokeTopWeight" in src && typeof src.strokeTopWeight === "number" ? src.strokeTopWeight : 0;
        const rightW = "strokeRightWeight" in src && typeof src.strokeRightWeight === "number" ? src.strokeRightWeight : 0;
        const bottomW = "strokeBottomWeight" in src && typeof src.strokeBottomWeight === "number" ? src.strokeBottomWeight : 0;
        const leftW = "strokeLeftWeight" in src && typeof src.strokeLeftWeight === "number" ? src.strokeLeftWeight : 0;
        const hasIndividualStrokes = topW > 0 || rightW > 0 || bottomW > 0 || leftW > 0;
        let sw = 1;
        if ("strokeWeight" in node && typeof node.strokeWeight === "number") {
          sw = node.strokeWeight;
        } else if (mainComp && "strokeWeight" in mainComp && typeof mainComp.strokeWeight === "number") {
          sw = mainComp.strokeWeight;
        } else if ("strokeWeight" in src && typeof src.strokeWeight === "number") {
          sw = src.strokeWeight;
        }
        let strokeAlign = "INSIDE";
        if ("strokeAlign" in node && typeof node.strokeAlign === "string") {
          strokeAlign = node.strokeAlign;
        } else if (mainComp && "strokeAlign" in mainComp && typeof mainComp.strokeAlign === "string") {
          strokeAlign = mainComp.strokeAlign;
        } else if ("strokeAlign" in src && typeof src.strokeAlign === "string") {
          strokeAlign = src.strokeAlign;
        }
        let strokesIncluded = void 0;
        if ("strokesIncludedInLayout" in node && typeof node.strokesIncludedInLayout === "boolean") {
          strokesIncluded = node.strokesIncludedInLayout;
        } else if (mainComp && "strokesIncludedInLayout" in mainComp && typeof mainComp.strokesIncludedInLayout === "boolean") {
          strokesIncluded = mainComp.strokesIncludedInLayout;
        } else if (parent && "strokesIncludedInLayout" in parent && typeof parent.strokesIncludedInLayout === "boolean") {
          strokesIncluded = parent.strokesIncludedInLayout;
        } else if (parent) {
          const parentMainComp = getMainComponent2(parent);
          if (parentMainComp && "strokesIncludedInLayout" in parentMainComp && typeof parentMainComp.strokesIncludedInLayout === "boolean") {
            strokesIncluded = parentMainComp.strokesIncludedInLayout;
          }
        }
        if (hasIndividualStrokes) {
          if (topW > 0) styles.borderTop = `${formatUnit(topW, options.useRem, options.baseFontSize)} ${borderStyle} ${strokeColor}`;
          if (rightW > 0) styles.borderRight = `${formatUnit(rightW, options.useRem, options.baseFontSize)} ${borderStyle} ${strokeColor}`;
          if (bottomW > 0) styles.borderBottom = `${formatUnit(bottomW, options.useRem, options.baseFontSize)} ${borderStyle} ${strokeColor}`;
          if (leftW > 0) styles.borderLeft = `${formatUnit(leftW, options.useRem, options.baseFontSize)} ${borderStyle} ${strokeColor}`;
          styles.boxSizing = "border-box";
        } else if (sw > 0) {
          const strokeVal = `${formatUnit(sw, options.useRem, options.baseFontSize)} ${borderStyle} ${strokeColor}`;
          styles.border = strokeVal;
          styles.boxSizing = "border-box";
        }
      }
    }
    let effectStyleId = TokenResolver.styleId(node, "effectStyleId");
    if (!effectStyleId && (mainComp == null ? void 0 : mainComp.effectStyleId)) {
      effectStyleId = mainComp.effectStyleId;
    }
    const effectVar = resolver.varFor(effectStyleId);
    if (effectVar) {
      styles.boxShadow = effectVar;
    } else {
      let rawEffects = [];
      if ("effects" in node && Array.isArray(node.effects) && node.effects.length > 0) {
        rawEffects = node.effects;
      } else if (mainComp && Array.isArray(mainComp.effects) && mainComp.effects.length > 0) {
        rawEffects = mainComp.effects;
      }
      if (rawEffects.length > 0) {
        const activeEffects = rawEffects.filter((e) => e.visible !== false);
        const shadows = [];
        for (const effect of activeEffects) {
          if (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") {
            const isInset = effect.type === "INNER_SHADOW" ? "inset " : "";
            const x = formatUnit(effect.offset.x, options.useRem, options.baseFontSize);
            const y = formatUnit(effect.offset.y, options.useRem, options.baseFontSize);
            const radius = formatUnit(effect.radius, options.useRem, options.baseFontSize);
            const spread = formatUnit(effect.spread || 0, options.useRem, options.baseFontSize);
            const boundColorId = "boundVariables" in effect && effect.boundVariables && typeof effect.boundVariables === "object" ? (_g = (_f = effect.boundVariables) == null ? void 0 : _f["color"]) == null ? void 0 : _g.id : void 0;
            const color = resolver.resolveColor(effect.color, effect.color.a, boundColorId);
            shadows.push(`${isInset}${x} ${y} ${radius} ${spread} ${color}`);
          } else if (effect.type === "LAYER_BLUR") {
            styles.filter = `blur(${formatUnit(effect.radius, options.useRem, options.baseFontSize)})`;
          } else if (effect.type === "BACKGROUND_BLUR") {
            styles.backdropFilter = `blur(${formatUnit(effect.radius, options.useRem, options.baseFontSize)})`;
          }
        }
        if (shadows.length > 0) {
          styles.boxShadow = shadows.join(", ");
        }
      }
    }
    if ("opacity" in node && typeof node.opacity === "number" && node.opacity < 1) {
      styles.opacity = Math.round(node.opacity * 100) / 100;
    }
    if ("blendMode" in node && typeof node.blendMode === "string" && node.blendMode !== "NORMAL" && node.blendMode !== "PASS_THROUGH") {
      const blendMap = {
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
      const cssBlend = blendMap[node.blendMode];
      if (cssBlend) styles.mixBlendMode = cssBlend;
    }
    if ("isMask" in node && node.isMask === true) {
      styles.clipPath = "inset(0 round 0px)";
    }
    if ("rotation" in node && typeof node.rotation === "number" && Math.round(node.rotation) !== 0) {
      const angle = Math.round(-node.rotation * 10) / 10;
      styles.transform = `rotate(${angle}deg)`;
    }
    return styles;
  }

  // reference-engine/vendor/pixel-perfect/plugin/converter/assets.ts
  var ASSET_NAME_PATTERN = /(^|[-_\s])(icon|ic|arrow|chevron|close|dismiss|cross|cancel|x|search|check|menu|settings|bell|heart|star|trash|edit|share|filter|back|illustration|graphic|image|logo|badge|تصویر|آیکون|لوگو)([-_\s]|$)/;
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
    if (node.type === "VECTOR" || node.type === "STAR" || node.type === "LINE" || node.type === "POLYGON" || node.type === "BOOLEAN_OPERATION") {
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
  async function exportNodeAsImage(node, options) {
    try {
      const scale = getSmartImageExportScale(node, options);
      let bytes;
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
            bytes = await node.exportAsync({
              format: "PNG",
              constraint: { type: "SCALE", value: 1 }
            });
          }
        } else {
          bytes = await node.exportAsync({
            format: "PNG",
            constraint: { type: "SCALE", value: 1 }
          });
        }
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

  // reference-engine/vendor/pixel-perfect/plugin/converter/index.ts
  async function convertNodeToIR(node, parent, options, tokenRegistry, parentClassName, existingNamesSet = /* @__PURE__ */ new Set()) {
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
    const tag = detectSemanticTag(node);
    const isRoot = parent === null;
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
      const asset = await exportNodeAsImage(node, options);
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
      const typography = extractTypography(textNode, options, tokenRegistry);
      const finalTag = typography.isList ? typography.listType === "ordered" ? "ol" : "ul" : tag;
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
        children: []
      };
    }
    const layout = extractLayout(node, parent, options, tokenRegistry);
    const visual = extractVisualStyles(node, options, tokenRegistry, parent);
    if (visual.background && visual.background.includes("__FIGMA_IMAGE_FILL__")) {
      const asset = await exportNodeAsImage(node, options);
      if (asset) {
        const size = visual.background.includes("contain") ? "contain" : visual.background.includes(":auto") ? "auto" : "cover";
        const repeat = size === "auto" ? "repeat" : "no-repeat";
        const other = visual.background.split(", ").filter((l) => !l.startsWith("__FIGMA_IMAGE_FILL__")).join(", ");
        const imgLayer = `url("${asset.content}") center / ${size} ${repeat}`;
        visual.background = other ? `${imgLayer}, ${other}` : imgLayer;
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
      tag,
      type: node.type,
      layout,
      visual,
      children: []
    };
    if ("children" in node && Array.isArray(node.children)) {
      const childPromises = node.children.map(
        (child) => convertNodeToIR(child, node, options, tokenRegistry, className, existingNamesSet)
      );
      const childResults = await Promise.all(childPromises);
      irNode.children = childResults.filter((child) => child !== null);
    }
    return irNode;
  }

  // reference-engine/vendor/pixel-perfect/generator/css-generator.ts
  function layoutToCssDeclarations(layout, options) {
    const decs = [];
    if (layout.display) decs.push(`display: ${layout.display};`);
    if (layout.flexDirection) decs.push(`flex-direction: ${layout.flexDirection};`);
    if (layout.flexWrap) decs.push(`flex-wrap: ${layout.flexWrap};`);
    if (layout.justifyContent) decs.push(`justify-content: ${layout.justifyContent};`);
    if (layout.alignItems) decs.push(`align-items: ${layout.alignItems};`);
    if (layout.gap) decs.push(`gap: ${layout.gap};`);
    if (layout.rowGap) decs.push(`row-gap: ${layout.rowGap};`);
    if (layout.columnGap) decs.push(`column-gap: ${layout.columnGap};`);
    if (layout.padding) {
      const { top, right, bottom, left } = layout.padding;
      const u = (v) => formatUnit(v, options.useRem, options.baseFontSize);
      if (top === bottom && right === left && top === right) {
        if (top > 0) decs.push(`padding: ${u(top)};`);
      } else if (top === bottom && right === left) {
        decs.push(`padding: ${u(top)} ${u(right)};`);
      } else {
        decs.push(`padding: ${u(top)} ${u(right)} ${u(bottom)} ${u(left)};`);
      }
    }
    if (layout.position) decs.push(`position: ${layout.position};`);
    if (layout.boxSizing) decs.push(`box-sizing: ${layout.boxSizing};`);
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
    if (visual.opacity !== void 0) decs.push(`opacity: ${visual.opacity};`);
    if (visual.filter) decs.push(`filter: ${visual.filter};`);
    if (visual.backdropFilter) {
      decs.push(`backdrop-filter: ${visual.backdropFilter};`);
      decs.push(`-webkit-backdrop-filter: ${visual.backdropFilter};`);
    }
    if (visual.mixBlendMode) decs.push(`mix-blend-mode: ${visual.mixBlendMode};`);
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
    if (typo.lineHeight) decs.push(`line-height: ${typo.lineHeight};`);
    if (typo.letterSpacing && typo.letterSpacing !== "normal") decs.push(`letter-spacing: ${typo.letterSpacing};`);
    if (typo.textAlign) decs.push(`text-align: ${typo.textAlign};`);
    if (typo.color) decs.push(`color: ${typo.color};`);
    if (typo.textDecoration) decs.push(`text-decoration: ${typo.textDecoration};`);
    if (typo.textTransform) decs.push(`text-transform: ${typo.textTransform};`);
    if (typo.whiteSpace) decs.push(`white-space: ${typo.whiteSpace};`);
    if (typo.textOverflow) decs.push(`text-overflow: ${typo.textOverflow};`);
    if (typo.display) decs.push(`display: ${typo.display};`);
    if (typo.webkitLineClamp !== void 0) decs.push(`-webkit-line-clamp: ${typo.webkitLineClamp};`);
    if (typo.webkitBoxOrient) decs.push(`-webkit-box-orient: ${typo.webkitBoxOrient};`);
    if (typo.overflow) decs.push(`overflow: ${typo.overflow};`);
    if (typo.direction) {
      decs.push(`direction: ${typo.direction};`);
      if (typo.direction === "rtl") {
        decs.push("unicode-bidi: isolate;");
      }
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
  function generateFontFaceRules(options, forZip = false) {
    if (!options.customFonts || options.customFonts.length === 0) {
      return "";
    }
    const rules = ["/* --- Custom Typography (@font-face) --- */"];
    for (const font of options.customFonts) {
      const fontStyle = font.style.toLowerCase().includes("italic") ? "italic" : "normal";
      const isVar = font.isVariable || String(font.weight).includes(" ") || font.filename.toLowerCase().includes("vf") || font.family.toLowerCase().includes("vf");
      const fontWeight = isVar ? "100 1000" : font.weight || 400;
      const isBase64 = !forZip && options.embedFontsBase64 !== false;
      const fontUrl = isBase64 ? font.base64.startsWith("data:") ? font.base64 : `data:font/${font.format};base64,${font.base64}` : `./fonts/${font.filename}`;
      let src = `url('${fontUrl}') format('${font.format}')`;
      if (isVar && font.format === "woff2") {
        src = `url('${fontUrl}') format('woff2-variations'), url('${fontUrl}') format('woff2')`;
      }
      const familiesToRegister = /* @__PURE__ */ new Set();
      familiesToRegister.add(font.family);
      if (font.family.toLowerCase().includes("vf")) {
        const alias = font.family.replace(/\s*vf\s*/i, "").trim();
        if (alias) familiesToRegister.add(alias);
      } else if (isVar) {
        familiesToRegister.add(`${font.family} VF`);
        familiesToRegister.add(`${font.family}VF`);
      }
      if (font.family.toLowerCase().replace(/[\s-_]/g, "").includes("yekanbakh")) {
        familiesToRegister.add("Yekan Bakh");
        familiesToRegister.add("Yekan Bakh VF");
        familiesToRegister.add("YekanBakh");
        familiesToRegister.add("YekanBakh VF");
      }
      if (font.family.toLowerCase().replace(/[\s-_]/g, "").includes("iranyekan")) {
        familiesToRegister.add("IRANYekanX");
        familiesToRegister.add("IRANYekanXVF");
        familiesToRegister.add("IRAN Yekan");
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
    }
    return rules.join("\n\n");
  }
  function generateCss(rootNode, options, isRtl = false, variablesBlock, forZip = false) {
    const rules = [];
    const classNamesSeen = /* @__PURE__ */ new Set();
    if (variablesBlock) {
      rules.push(variablesBlock);
    }
    const fontFaceBlock = generateFontFaceRules(options, forZip);
    if (fontFaceBlock) {
      rules.push(fontFaceBlock);
    }
    if (options.includeReset) {
      const fontFamily = isRtl ? FONT_STACK_RTL : FONT_STACK_LTR;
      rules.push(`/* Modern CSS Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  font-family: ${fontFamily};
  -webkit-font-smoothing: antialiased;
  ${isRtl ? "direction: rtl;\n  text-align: right;" : ""}
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
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
}`);
    }
    function collectRules(node) {
      var _a;
      if (!classNamesSeen.has(node.className)) {
        classNamesSeen.add(node.className);
        const decs = [
          ...layoutToCssDeclarations(node.layout, options),
          ...visualToCssDeclarations(node.visual, node.layout.transform),
          ...typographyToCssDeclarations(node.typography)
        ];
        if (node.tag === "img" && !decs.some((d) => d.startsWith("object-fit:"))) {
          decs.push("object-fit: cover;");
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
        if ((_a = node.typography) == null ? void 0 : _a.isList) {
          const isRtl2 = node.typography.direction === "rtl";
          const bulletPadding = isRtl2 ? "padding-right: 18px;" : "padding-left: 18px;";
          const bulletPos = isRtl2 ? "right: 0;" : "left: 0;";
          const bulletColor = node.typography.listBulletColor || "inherit";
          rules.push(`.${node.className} > li {
  position: relative;
  ${bulletPadding}
  text-align: ${node.typography.textAlign || (isRtl2 ? "right" : "left")};
  direction: ${node.typography.direction || (isRtl2 ? "rtl" : "ltr")};
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
      for (const child of node.children) {
        collectRules(child);
      }
    }
    collectRules(rootNode);
    return rules.join("\n\n");
  }

  // reference-engine/vendor/pixel-perfect/shared/style-utils.ts
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

  // reference-engine/vendor/pixel-perfect/generator/html-generator.ts
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
    const phonePattern = /(?:(?:\+?[\d\u0660-\u0669\u06F0-\u06F9]+[\s\-–—\.]*){2,}[\d\u0660-\u0669\u06F0-\u06F9]+)/g;
    return text.replace(phonePattern, (match) => {
      return `<span dir="ltr" style="unicode-bidi: isolate; display: inline-block;">${match}</span>`;
    });
  }
  function generateStyledSegmentsHtml(node) {
    var _a;
    if (!((_a = node.typography) == null ? void 0 : _a.segments)) {
      return wrapBidiNumbers(escapeHtml(node.text || ""));
    }
    return node.typography.segments.map((seg) => {
      const inline = segmentToInlineStyle(seg);
      const styleAttr = inline ? ` style="${inline}"` : "";
      return `<span${styleAttr}>${wrapBidiNumbers(escapeHtml(seg.text))}</span>`;
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
  function generateHtml(node, indentLevel = 0, isInsideButton = false) {
    var _a, _b, _c;
    const indent = "  ".repeat(indentLevel);
    let tag = node.tag;
    if (isInsideButton && tag === "button") {
      tag = "div";
    }
    const isCurrentButton = tag === "button";
    const nextInsideButton = isInsideButton || isCurrentButton;
    const classAttr = node.className ? ` class="${node.className}"` : "";
    if (node.asset && node.asset.type === "svg") {
      let cleanSvg = node.asset.content.trim();
      cleanSvg = cleanSvg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
        if (attrs.includes("style=")) {
          return match.replace(/style="([^"]*)"/i, 'style="width: 100%; height: 100%; display: block; $1"');
        }
        return `<svg style="width: 100%; height: 100%; display: block;"${attrs}>`;
      });
      return `${indent}<div${classAttr}>
${indent}  ${cleanSvg}
${indent}</div>`;
    }
    if (node.asset && node.asset.type === "image") {
      return `${indent}<img${classAttr} src="${node.asset.content}" alt="${escapeHtml(node.name)}" />`;
    }
    if (node.type === "TEXT") {
      const isRtl = ((_a = node.typography) == null ? void 0 : _a.direction) === "rtl" || isRtlText(node.text);
      const dirAttr = isRtl ? ' dir="rtl"' : "";
      if ((_b = node.typography) == null ? void 0 : _b.isList) {
        const listContentHtml = generateListItemsHtml(node, indent);
        return `${indent}<${tag}${classAttr}${dirAttr}>
${listContentHtml}
${indent}</${tag}>`;
      }
      if (((_c = node.typography) == null ? void 0 : _c.segments) && node.typography.segments.length > 1) {
        const innerHtml = generateStyledSegmentsHtml(node);
        return `${indent}<${tag}${classAttr}${dirAttr}>${innerHtml}</${tag}>`;
      }
      return `${indent}<${tag}${classAttr}${dirAttr}>${wrapBidiNumbers(escapeHtml(node.text || ""))}</${tag}>`;
    }
    if (node.children && node.children.length > 0) {
      const childrenHtml = node.children.map((child) => generateHtml(child, indentLevel + 1, nextInsideButton)).join("\n");
      return `${indent}<${tag}${classAttr}>
${childrenHtml}
${indent}</${tag}>`;
    }
    return `${indent}<${tag}${classAttr}></${tag}>`;
  }

  // reference-engine/ENGINE.json
  var ENGINE_default = {
    id: "pixel-perfect",
    contract: 1,
    version: "1.0.0",
    source: "figma-pixel-perfect-html (your plugin), vendored unchanged under vendor/pixel-perfect/",
    syncedAt: "2026-10-13T04:45:07.316Z",
    filesHash: "0dea241734e4"
  };

  // reference-engine/adapter.ts
  var contract = 1;
  var id = ENGINE_default.id;
  var version = ENGINE_default.version;
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
    const mk = (key, css, type = "string") => ({ id: key, name: css, cssVarName: css, type, value: "" });
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
  function indexIR(n, byId, count) {
    byId.set(n.id, n.className);
    count.nodes++;
    if (n.asset) count.assets++;
    n.children.forEach((c) => indexIR(c, byId, count));
  }
  function addLinks(node, byId, gos) {
    try {
      const rx = node.reactions || [];
      rx.forEach((r) => (r.actions || (r.action ? [r.action] : [])).forEach((a) => {
        if (a && a["type"] === "NODE" && typeof a["destinationId"] === "string" && a["navigation"] !== "OVERLAY" && a["navigation"] !== "SWAP") {
          const cls = byId.get(node.id);
          if (cls) gos.set(cls, a["destinationId"]);
        }
      }));
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
    return text.replace(/data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)/g, (m, kind, b64) => {
      if (b64.length < 2e3) return m;
      const path = `assets/${hashStr(b64)}.${kind === "jpeg" ? "jpg" : kind}`;
      if (!files.has(path)) files.set(path, b64);
      return path;
    });
  }
  async function exportFrame(node, tokens, o = {}) {
    const options = {
      outputMode: "pure-css",
      useRem: false,
      baseFontSize: 16,
      includeReset: false,
      inlineAssets: true,
      semanticTags: o.semanticTags !== false,
      imageScale: o.imageScale === void 0 ? "auto" : o.imageScale
    };
    const registry = buildRegistry(tokens, o.matchColorsByValue !== false);
    const ir = await convertNodeToIR(node, null, options, registry);
    if (!ir) throw new Error("The frame is hidden or cannot be exported.");
    const rtl = hasRtlInTree(ir);
    let body = generateHtml(ir, 0);
    let css = generateCss(ir, options, rtl, void 0);
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
    const fs = {};
    collectFonts(node, fs);
    if (rtl) (fs["Vazirmatn"] = fs["Vazirmatn"] || /* @__PURE__ */ new Set()).add(400).add(700);
    const fonts = {};
    Object.keys(fs).forEach((f) => {
      fonts[f] = Array.from(fs[f]).sort((a, b) => a - b);
    });
    const vars = Array.from(new Set((css.match(/var\((--[\w-]+)/g) || []).map((m) => m.slice(4))));
    return { engine: id, version, name: node.name, width: Math.round(node.width), height: Math.round(node.height), bodyHtml: body, css, vars, links: Array.from(new Set(links)), fonts, rtl, nodes: count.nodes, assets: count.assets, files: Array.from(fileMap.entries()).map(([path, base64]) => ({ path, base64 })), notes: [] };
  }
  return __toCommonJS(adapter_exports);
})();
