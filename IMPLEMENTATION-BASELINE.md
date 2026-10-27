# Implementation Baseline — فاز صفر

> نسخه سند: 1.0
> تاریخ: 2026-10-27
> مبنای قرارداد: `GLOBAL-DESIGN-SYSTEM-IMPLEMENTATION-CONTRACT.md` v3.1.0
> نسخه واقعی پلاگین: **0.10.0** (از `package.json`)
> وضعیت: تکمیل‌شده — ورودی فاز ۱ (Contracts)
> دامنه: بازخوانی کد موجود؛ هیچ تغییر کدی انجام نشده است.

---

## ۰. خلاصه اجرایی

1. پلاگین فعلی یک **کامپایلر Figma → Markdown/CSS** است، نه یک exporter پکیج قراردادی. خروجی اصلی `design.md` + `tokens.css` است و داده‌های ساختاریافته فقط در حاشیه وجود دارند.
2. زیرساخت تست واقعی است: **۴۴ تست واحد** و یک **تست یکپارچه با Figma mock**، همه پاس. این نقطه قوت بزرگی است که باید حفظ شود.
3. بالغ‌ترین بخش، **خط لوله توکن** است: alias، mode، collision، derived token و نام‌گذاری CSS درست کار می‌کنند و تست دارند.
4. ضعیف‌ترین بخش، **هویت و ساختار** است: شناسه‌ها نام‌محورند (`component.<slug>`، `token.<slug>`)، مدل canonical و provenance ساختاریافته وجود ندارد، و هیچ JSON Schema ای در پروژه نیست.
5. از ۱۵ فایل الزامی قرارداد، فقط **۳ فایل کاملاً موجود** است (`design.md`، `tokens.css`، `ai-control.md`)؛ `manifest.json` جزئی است و بقیه غایب‌اند.
6. «Validation» فعلی، **کیفیت منبع طراحی** را می‌سنجد (توکن حل‌نشده، پوشش متغیر، مستندسازی)؛ اعتبارسنجی پکیج (ساختار، schema، cross-file، ZIP) وجود ندارد.
7. ادعای «validator فایل `validation.md` را می‌خواند که هرگز تولید نمی‌شود» **در کد 0.10.0 تأیید نشد**. `gen()` قبل از `lintPackage` یک نسخه درون‌حافظه‌ای از `validation.md` می‌سازد (`src/core.js:625`). این مورد در فهرست ادعاهای قبلی باید اصلاح شود.
8. نتیجه: مهاجرت اصلی، «بازنویسی موتور» نیست؛ **افزودن یک لایه مدل canonical + قرارداد JSON به موتور موجود** است، سپس جایگزینی تدریجی خروجی‌های Markdown-محور.

---

## ۱. محیط، منبع و روش

| مورد | مقدار |
|---|---|
| منبع کد | `global-design-system-SOURCE (1).zip` (۳۱۵ KB) |
| مسیر استخراج موقت | `C:\Users\matin.ghanbari\AppData\Local\Temp\gds2\global-design-system-plugin` |
| فایل ورودی پلاگین | `code.js` (۳٬۵۰۳ خط، build‌شده) |
| سورس اصلی | `src/core.js` (۱٬۲۳۳ خط) |
| رابط کاربری | `ui.html` (۴۲۵ خط، بدون build) |
| موتور رفرنس | `reference-engine/` (TypeScript + vendor + bundle ۹۷ KB) |
| Build | `scripts/build.mjs` با esbuild؛ `code.js` = bundle موتور + `src/core.js` |
| تست‌ها | `tests/core.test.js`، `tests/figma-mock.test.js`، `tests/fixture-realistic.js` |
| وابستگی اجرایی | هیچ (core خالص JS است) |
| وابستگی build | `esbuild ^0.25.0` (devDependency) |
| دسترسی شبکه | `networkAccess.allowedDomains: ["none"]` |
| دسترسی سند | `documentAccess: "dynamic-page"` |

### ۱.۱ اجرای تست‌ها (فاز ۰، گام ۳)

```
node tests/core.test.js        → 44 tests passed
node tests/figma-mock.test.js  → figma-mock tests passed
```

خروجی تست یکپارچه (mode=`standard`) این فایل‌ها را تولید کرد:

```
design.md, tokens.md, components.md, content.md, tokens.css,
reference/home.html, reference/settings.html, reference/index.html,
reference/icons.html, reference/snapshots/*.png, reference/thumbs/*.png,
ai-control.md, validation.md
```

نکته مهم: در mode=`standard` هیچ‌کدام از `manifest.json`، `metadata.json`، `validation-report.json`، `icons.json` و `rules/validation-rules.json` تولید نمی‌شوند، چون tier آن‌ها ۲ یا ۳ است.

### ۱.۲ محدودیت روش

- هیچ اجرای واقعی روی فایل Figma انجام نشده؛ تست‌ها mock هستند.
- `tests/fixture-realistic.js` یک fixture مصنوعی است، نه فایل واقعی Figma.
- اندازه‌گیری performance، مصرف حافظه و رفتار روی فایل‌های بزرگ انجام نشده است.
- نتایج این سند «وضعیت کد 0.10.0» است، نه تأیید رفتار در runtime واقعی.

---

## ۲. معماری واقعی فعلی

### ۲.۱ مسیر پردازش

```text
ui.html (۷ مرحله)
   │  پیام‌ها: discover / frames / detect / analyze / generate / build
   ▼
src/core.js
   ├── buildDraft()      استخراج متغیرها، استایل‌ها، کامپوننت‌ها، فریم‌ها
   ├── planDependencies() + applyPolicy()   سیاست وابستگی
   ├── enrichModel()     derived tokens، پوشش متغیر، CSS کامپوننت‌ها
   ├── validate()        کیفیت منبع طراحی
   ├── gen()             تولید فایل‌ها بر اساس tier
   └── sendFiles()       انتقال chunk‌شده به UI
   ▼
ui.html
   ├── نمایش درخت فایل و پیش‌نمایش
   ├── lintPackage (درون core، روی فایل‌های درون‌حافظه)
   └── zip()             ساخت ZIP در مرورگر (store-only)
```

### ۲.۲ توابع کلیدی

| حوزه | تابع | خط |
|---|---|---|
| حل alias و mode | `resolve()` | `src/core.js:22` |
| نام‌گذاری CSS و collision | `cssNameMap()` | `src/core.js:178` |
| تولید tokens.css | `tokensCss()` | `src/core.js:183` |
| رفرنس HTML | `referenceFiles()` | `src/core.js:264` |
| کیفیت منبع | `validate()` | `src/core.js:429` |
| lint پکیج | `lintPackage()` | `src/core.js:533` |
| تولید خروجی | `gen()` | `src/core.js:563` |
| استخراج مشخصات کامپوننت | `componentSpec()` | `src/core.js:1010` |
| استخراج کامپوننت | `extractComponent()` | `src/core.js:1034` |
| ساخت draft | `buildDraft()` | `src/core.js:1066` |
| تحلیل نهایی | `analyze()` | `src/core.js:1119` |

### ۲.۳ چرخه build

`src/core.js` و `reference-engine/` هرگز مستقیماً اجرا نمی‌شوند. تغییر در `src/core.js` بدون `node scripts/build.mjs` در `code.js` منعکس نمی‌شود. این نکته برای فازهای بعدی حیاتی است: هر تغییر باید در سورس + build + تست انجام شود.

---

## ۳. تطبیق UI فعلی با قرارداد

| قرارداد (§25) | وضعیت فعلی | شاهد |
|---|---|---|
| ۱. Source | موجود، اما شامل Content به‌عنوان مرحله جدا نیست | `ui.html:163` |
| ۲. References | موجود، اما «Content» یک مرحله مستقل بین Source و Reference است | `ui.html:163` |
| ۳. Build | موجود، اما به سه مرحله Dependencies / Analyze / Review شکسته شده | `ui.html:163` |
| ۴. Download | موجود، اما نام آن «Generate» است و به Export tool منتقل شده | `ui.html:163`, `ui.html:358` |

هفت مرحله فعلی: `Source → Content → Reference → Dependencies → Analyze → Review → Generate`.

تفاوت‌های عملکردی مهم:

- Content یک مرحله کامل محصولی است (پارس متن، inference، تأیید/رد) و حذف آن صرفاً یک تغییر UI نیست.
- Review یک صف تصمیم‌گیری واقعی دارد (`rq`, `S.review`)، نه فقط نمایش.
- Download گیت نشده است: `exZip` فقط وقتی فایل وجود دارد فعال می‌شود، نه وقتی validation خطای مسدودکننده دارد (`ui.html:358`).
- Progress واقعی است (پیام‌های `prog` از core)، نه تایمر.

---

## ۴. خروجی‌های فعلی در برابر فایل‌های الزامی قرارداد

| فایل الزامی (§2.1) | معادل فعلی | وضعیت | شاهد |
|---|---|---|---|
| `manifest.json` | `manifest.json` با `{ entities: {} }` | **جزئی** — فقط tier 2، بدون inventory/capabilities/validation | `src/core.js:631-634` |
| `SKILL.md` | ندارد | **غایب** | — |
| `ai-control.md` | موجود، اما معنای متفاوت (adherence 0–10) | **موجود با semantics متفاوت** | `src/core.js:593`, `:303` |
| `design.md` | موجود | **موجود** | `src/core.js:623` |
| `tokens.css` | موجود | **موجود** | `src/core.js:591` |
| `components.css` | ندارد؛ CSS در Markdown و inline است | **غایب** | `src/core.js:277`, `:493` |
| `components/index.json` | `components.md` | **غایب (فرمت اشتباه)** | `src/core.js:588` |
| `components/*/component.json` | ندارد | **غایب** | — |
| `components/*/usage.md` | ندارد | **غایب** | — |
| `components/*/preview.html` | ندارد | **غایب** | — |
| `references/index.json` | `reference/index.html` | **غایب (فرمت اشتباه)** | `src/core.js:280` |
| `references/source-evidence/` | `reference/*.html` بدون تفکیک نوع | **معادل ناقص** | `src/core.js:277` |
| `references/generated-guides/` | `reference/icons.html` فقط | **معادل ناقص** | `src/core.js:282` |
| `rules/index.json` | ندارد | **غایب** | — |
| `rules/design-rules.json` | قواعد ثابت داخل `design.md` | **غایب (ساختاریافته نیست)** | `src/core.js:524` |
| `metadata/token-map.json` | ندارد؛ نگاشت درون‌حافظه‌ای `cssNameMap` | **غایب** | `src/core.js:178` |
| `metadata/decisions.json` | ندارد؛ inferenceها در context هستند | **غایب** | `src/core.js:81` |
| `metadata/validation.json` | `validation-report.json` در ریشه + `validation.md` | **غایب (مسیر و schema اشتباه)** | `src/core.js:628`, `:634` |
| `metadata/sources.json` | ندارد؛ فقط `sourceFileName` در metadata.json | **غایب** | `src/core.js:630` |
| `metadata/context.json` | ندارد؛ context داخل Markdown است | **غایب** | `src/core.js:398` |
| `metadata/icons.json` | `icons.json` در ریشه، tier 2 | **جزئی** | `src/core.js:635` |
| `metadata/assets.json` | ندارد؛ assetها فقط در `reference/assets/` | **غایب** | `src/core.js:283` |
| `schemas/*.schema.json` | هیچ schema ای وجود ندارد | **غایب** | — |
| `content.md` (اختیاری) | موجود، پشت فلگ `contentPack` | **موجود** | `src/core.js:589` |

جمع‌بندی: **۳ فایل کامل**، **۲ فایل جزئی**، **۱ فایل با semantics متفاوت**، **بقیه غایب**.

نکته مسیر: فایل فعلی `metadata.json` در ریشه با پوشه الزامی `metadata/` هم‌نام است. در مهاجرت باید حذف یا ادغام شود، وگرنه در بعضی سیستم‌های فایل با پوشه تضاد پیدا می‌کند.

---

## ۵. ماتریس قابلیت‌ها

وضعیت‌ها بر اساس واژگان §7.2 قرارداد. «تأییدشده» یعنی کد + تست وجود دارد؛ نه تأیید runtime واقعی.

| قابلیت | وضعیت | شاهد | توضیح |
|---|---|---|---|
| متغیرهای local | `implemented_verified` | `src/core.js:1069`، تست tokens.css | همه متغیرهای collection انتخاب‌شده خوانده می‌شوند |
| متغیرهای library/remote | `unsupported` | فقط `getLocalVariablesAsync` | alias به متغیر remote → `unresolved` |
| Collectionها | `implemented_verified` | `src/core.js:1069-1070` | نام و modeها خوانده می‌شوند |
| Modeها | `implemented_verified` | `src/core.js:204-208`, `:219` | خروجی `[data-theme]` |
| Aliasها (زنجیره مستقیم) | `implemented_verified` | `src/core.js:22-38`, `:198` | `var(--target)` حفظ می‌شود |
| Alias cycle | `implemented_unverified` | `src/core.js:26` | تشخیص وجود دارد، تست ندارد |
| Alias شکسته | `implemented_verified` | `src/core.js:32`, `:202` | به‌صورت comment گزارش می‌شود |
| استایل‌های text/paint/effect | `implemented_verified` | `src/core.js:1084-1090` | local + library استفاده‌شده |
| Typography | `implemented_verified` | `src/core.js:214-215` | کلاس `.text-*` |
| کامپوننت‌ها | `partial` | `src/core.js:1034-1063` | فقط سطح root |
| Component Setها | `partial` | `src/core.js:1046` | فقط `children[0]` |
| Variantها | `partial` | `src/core.js:1060` | شمارش کامل، ابعاد حداکثر ۳۰ |
| Component properties | `partial` | `src/core.js:1036-1043` | `componentPropertyDefinitions` + fallback از نام variant |
| Nested components | `partial` | `src/core.js:1046-1055` | یک سطح، حداکثر ۶۰ instance، رابطه نام‌محور |
| Instance overrides | `unsupported` | جست‌وجو نشده | `nd.overrides` خوانده نمی‌شود |
| Slots | `unsupported` | — | حتی اشاره‌ای نشده |
| Assets (تصاویر رفرنس) | `partial` | `src/core.js:230-236`, `:283` | فایل می‌شوند، registry ندارند |
| Icons | `partial` | `src/core.js:1149-1150` | تشخیص تست دارد؛ ID نام‌محور، سقف ۱۵۰ SVG و ۸ KB |
| Fontها | `partial` | `src/core.js:229`, `:281` | `@font-face` تولید می‌شود، فایل فونت ارسال نمی‌شود |
| مرجع HTML | `implemented_verified` | `tests/core.test.js` + mock | موتور + fallback |
| مرجع HTML در Figma واقعی | `implemented_unverified` | mock فقط | بدون اجرای واقعی |
| اعتبارسنجی کیفیت منبع | `implemented_verified` | `src/core.js:429-458` | خطا/هشدار واقعی |
| اعتبارسنجی پکیج/schema | `unsupported` | — | هیچ schema یا cross-file validator نیست |
| Provenance | `partial` | `figmaId`, `origin`, `requiredBy` | بدون timestamp/fieldPath/method |
| شناسه پایدار | `unsupported` | `src/core.js:1062`, `:1075` | نام‌محور |
| مدل canonical | `unsupported` | — | شیء ad-hoc داخلی |
| تصمیم‌ها/تأییدها | `partial` | `src/core.js:81-107` | inference + reject در حافظه، بدون ذخیره ساختاریافته |
| توکن‌های derived | `implemented_verified` | `src/core.js:211-212`, `:360` | وارد tokens.css می‌شوند، اما origin/approval جدا ندارند |
| Determinism | `partial` | sortها در `:1135` | timestamps متغیر، تست تکرارپذیری ندارد |
| AI | `not_applicable` | — | لایه AI وجود ندارد؛ پلاگین آفلاین است |
| ZIP | `partial` | `ui.html:337-342` | store-only، بدون بررسی مسیر/inventory |
| UI چهار مرحله‌ای | `planned` | `ui.html:163` | فعلاً ۷ مرحله |
| Content / context | `implemented_verified` | تست‌های context | facts/inference/reject |
| Ruleها | `partial` | `src/core.js:524`, `:636` | متن ثابت + فهرست کد خطاها، نه موجودیت rule |

---

## ۶. راستی‌آزمایی ادعاهای §23.3 قرارداد

| # | ادعا | نتیجه | شاهد |
|---|---|---|---|
| ۱ | ID کامپوننت از نام ساخته می‌شود | **تأیید شد** | `src/core.js:1062` — `'component.' + slug(n.name)` |
| ۲ | ID توکن از نام ساخته می‌شود | **تأیید شد** | `src/core.js:1075` — `'token.' + v.name.split('/')...` |
| ۳ | استخراج کامپوننت فقط سطح root | **تأیید شد** | `src/core.js:1015-1031` |
| ۴ | Component Set فقط اولین فرزند | **تأیید شد** | `src/core.js:1046` |
| ۵ | متن حداکثر ۴ مورد | **تأیید شد** | `src/core.js:1025` |
| ۶ | واریانت حداکثر ۳۰ | **تأیید شد** | `src/core.js:1060` |
| ۷ | Nested به‌صورت بازگشتی استخراج نمی‌شود | **تأیید شد با قید** | یک سطح استخراج می‌شود (`:1046-1055`) و در صورت `auto_include` به‌عنوان dependency استخراج می‌شود (`:1128-1133`)؛ بازگشت عمیق وجود ندارد |
| ۸ | Instance overrides استخراج نمی‌شود | **تأیید شد** | هیچ ارجاعی به `overrides` در کد نیست |
| ۹ | نگاشت semantic رفرنس نام‌محور است | **تأیید شد** | `src/core.js:918` — `data-component="name"` |
| ۱۰ | Validator فایل `validation.md` تولیدنشده را می‌خواند | **تأیید نشد** | `gen()` در `:625` نسخه درون‌حافظه‌ای را قبل از lint می‌سازد؛ تست «lint catches real defects» هم پاس می‌شود |
| ۱۱ | manifest فقط ساختار entity دارد | **تأیید شد** | `src/core.js:631-634` |
| ۱۲ | `decisions.json` تولید نمی‌شود | **تأیید شد** | — |
| ۱۳ | `sources.json` تولید نمی‌شود | **تأیید شد** | — |
| ۱۴ | `token-map.json` تولید نمی‌شود | **تأیید شد** | — |
| ۱۵ | `references/index.json` تولید نمی‌شود | **تأیید شد** | `reference/index.html` جایگزین آن است (`:280`) |

نتیجه: ۱۳ ادعا تأیید، ۱ ادعا رد، ۱ ادعا مشروط. مورد ردشده باید از فهرست نقص‌ها حذف شود؛ اما برای قفل کردن رفتار، بهتر است تست `VAL-003` با همان انتظار قرارداد اضافه شود.

---

## ۷. یافته‌های جدیدی که در قرارداد §23.3 نیستند

موارد زیر در جریان فاز ۰ کشف شدند و باید در فازهای بعدی تصمیم‌گیری شوند:

1. **manifest فقط در tier 2 تولید می‌شود.** پکیج `standard` بدون manifest است؛ در تضاد با الزامی بودن آن در §2.1.
2. **نسخه پلاگین hardcode شده است.** `generatorVersion: '0.10.0'` در `src/core.js:630`، در حالی که `package.json` منبع واقعی است. با هر bump ممکن است واگرا شود.
3. **تضاد نام `metadata.json` با پوشه `metadata/`.** باید در مهاجرت حذف یا ادغام شود.
4. **تضاد نام `reference/` با `references/`.** مسیر فعلی جمع نیست؛ قرارداد `references/` می‌خواهد.
5. **متغیرهای library پشتیبانی نمی‌شوند.** فقط `getLocalVariablesAsync` صدا زده می‌شود؛ alias به متغیر library «unresolved» می‌شود. این یک محدودیت مهم است که در قرارداد به‌صراحت نیامده.
6. **فایل‌های فونت ارسال نمی‌شوند.** `@font-face` به `fonts/<family>.woff2` اشاره می‌کند که در پکیج وجود ندارد؛ فقط دستور اضافه‌کردن آن نوشته می‌شود.
7. **ZIP هیچ اعتبارسنجی ندارد.** store-only است، مسیرها را نرمال نمی‌کند، `..` را رد نمی‌کند، inventory را چک نمی‌کند و سقف حجم ندارد (`ui.html:337-342`).
8. **Download گیت نشده است.** خطای مسدودکننده مانع دانلود نمی‌شود (`ui.html:358`).
9. **adherence عددی 0–10 است.** قرارداد سه محور `fact / adherence / freedom` با مقادیر گسسته می‌خواهد؛ نگاشت این دو تعریف نشده است.
10. **خروجی Markdown-محور است، نه JSON-محور.** بزرگ‌ترین هزینه مهاجرت همین است: `components.md` باید به `component.json` + `index.json` تبدیل شود و CSS مشترک از Markdown بیرون بیاید.
11. **تست‌ها fixture واقعی Figma ندارند.** قرارداد §18.3 fixture واقعی می‌خواهد؛ `fixture-realistic.js` مصنوعی است.
12. **`validation.md` و `validation-report.json` دو منبع حقیقت موازی‌اند.** یکی Markdown برای انسان، یکی JSON؛ هیچ‌کدام schema ندارند.

---

## ۸. شکاف‌های خود قرارداد که در جریان audit پیدا شد

این‌ها ایراد کد نیستند؛ نقاط مبهم در قرارداد v3.1.0 هستند که قبل از فاز ۱ باید بسته شوند:

| # | موضوع | مشکل | پیشنهاد |
|---|---|---|---|
| C-01 | `evidenceStatus` (§7.1) و Fact Dimension (§19.1) | دو واژگان تقریباً یکسان با مقادیر متفاوت (`unknown` در برابر `unavailable`/`unsupported`) | `evidenceStatus` برای موجودیت‌ها بماند؛ Fact فقط برای assertion/rule با نگاشت صریح |
| C-02 | `packageType` (§21.1) | بدون enum | `full` / `partial` / `diagnostic` تعریف شود |
| C-03 | `scope` (§21.1) | بدون schema | `{ pages[], collections[], componentIds[], frameIds[] }` |
| C-04 | `capabilities` (§21.3) | کلیدهای قابلیت فهرست نشده‌اند | یک Capability Registry با کلیدهای نرمال (`figma.variables.modes`) |
| C-05 | `component_preview` در `referenceType` (§8.1) | پیش‌نمایش کامپوننت هم در `components/*/preview.html` است هم نوعی reference | پیش‌نمایش فقط در `components/` بماند و `referenceType` حذف شود، یا برعکس |
| C-06 | محل `@font-face` | نه در `tokens.css` مشخص شده نه `components.css` | `components.css` یا فایل مستقل `assets/fonts/fonts.css` |
| C-07 | نگاشت adherence 0–10 به سه محور §19 | تعریف نشده | جدول نگاشت رسمی، یا حفظ عدد + افزودن دو محور جدید |
| C-08 | فازهای §26 | فازی برای تولید `SKILL.md`، `ai-control.md`، `design.md`، `content.md` وجود ندارد | به فاز ۵ یا فاز ۷ اضافه شود |
| C-09 | تست‌های پذیرش | تستی برای «proposal به rule رسمی تبدیل نشود» و «namespace اشتباه رد شود» نیست | `DEC-002` و `VAL-004` اضافه شود |
| C-10 | `metadata/context.json` | الزامی است حتی وقتی context وجود ندارد | اختیاری شود یا با `provided:false` صریح مجاز باشد |
| C-11 | `required` در inventory | تعریف نشده که برای هر `packageType` چه چیزی الزامی است | ماتریس required بر اساس `packageType` |
| C-12 | قطعیت نسخه‌ها | `pluginVersion` باید از build خوانده شود، اما build فعلی نسخه را تزریق نمی‌کند | build مکانیزم تزریق نسخه داشته باشد |

---

## ۹. نقاط قوتی که باید حفظ شوند

این‌ها سرمایه فعلی‌اند و بازنویسی نباید آن‌ها را از بین ببرد:

1. **۴۴ تست واحد + تست mock** با پوشش توکن، رفرنس، context و lint.
2. **خط لوله توکن**: alias، mode، collision، derived token، نام‌گذاری CSS.
3. **قرارداد موتور رفرنس** (`contract: 1`) با fallback داخلی و sync script.
4. **مدل context** با تفکیک fact / inference / reject و confidence.
5. **سیاست وابستگی** `auto_include` / `ask` / `ignore` با هشدار صریح.
6. **lint پکیج** به‌عنوان ابزار کیفیت داخلی؛ باید حفظ شود، اما جای validation قراردادی را نگیرد.
7. **طراحی offline** و عدم نیاز به شبکه.

---

## ۱۰. نتیجه فاز ۰ و ورودی فاز ۱

### ۱۰.۱ نتیجه

خط پایه ثبت شد. کد فعلی برای «تولید Markdown و CSS» بالغ است، اما برای «پکیج قراردادی JSON + schema + validation» پایه‌ای ندارد. ادعاهای قبلی عمدتاً درست بودند، به‌جز ادعای نقص validator که رد شد.

### ۱۰.۲ توصیه برای فاز ۱

ترتیب پیشنهادی، مطابق §30 قرارداد اما با یک اصلاح:

1. بستن ۱۲ شکاف قرارداد (بخش ۸) در سطح تصمیم — نه کد.
2. `common-definitions.schema.json` با Status Matrix.
3. `manifest.schema.json` با `packageType`/`scope`/`capabilities` تعریف‌شده.
4. `token-map.schema.json` و `decisions.schema.json`.
5. `component.schema.json` با `coverage` چندبعدی.
6. تست‌های schema با fixture معتبر/نامعتبر.
7. فقط پس از این‌ها، تغییر کد در `src/core.js` + build + تست.

### ۱۰.۳ سه تصمیمی که قبل از فاز ۱ لازم است

| تصمیم | گزینه پیشنهادی |
|---|---|
| `packageType` | سه مقدار: `full` (همه فایل‌های الزامی)، `partial` (بدون بخش‌های خالی، با توضیح در manifest)، `diagnostic` (خروجی ناقص، صریحاً نامعتبر) |
| Capability Registry | کلیدهای سه‌سطحی مثل `figma.variables.local`، `figma.components.variants`، `export.references` |
| محل `@font-face` | `components.css` برای فونت‌های کامپوننت + `assets/fonts/` برای فایل‌ها؛ `references/fonts.css` فعلی حذف شود |

---

## پیوست الف — فهرست فایل‌های پروژه

| فایل | خط | نقش |
|---|---|---|
| `manifest.json` | ۱۰ | manifest پلاگین Figma |
| `package.json` | ۱۴ | نسخه 0.10.0، اسکریپت‌ها |
| `src/core.js` | ۱٬۲۳۳ | تمام منطق استخراج، تحلیل و تولید |
| `ui.html` | ۴۲۵ | کل UI، ZIP، تنظیمات |
| `code.js` | ۳٬۵۰۳ | خروجی build (نباید دستی ویرایش شود) |
| `reference-engine/adapter.ts` | — | تنها رابط موتور رفرنس با core |
| `reference-engine/ENGINE.json` | ۸ | `pixel-perfect`, contract 1, v1.0.0 |
| `reference-engine/dist/reference-engine.bundle.js` | ۹۷ KB | bundle آماده |
| `scripts/build.mjs` | — | build + assemble |
| `tests/core.test.js` | ۲۹۳ | ۴۴ تست |
| `tests/figma-mock.test.js` | ۷۴ | تست یکپارچه با mock |
| `tests/fixture-realistic.js` | ۲۸ | fixture مصنوعی |
| `docs/traceability-matrix.md` | ۹۹ | ماتریس قابلیت نسخه ۰.۴ تا ۰.۱۰ |

## پیوست ب — دستورهای بازتولید

```bash
# استخراج
unzip -o "global-design-system-SOURCE (1).zip" -d /tmp/gds2

# تست
node tests/core.test.js
node tests/figma-mock.test.js

# build (نیازمند esbuild)
npm install
node scripts/build.mjs
```

---

*این سند فقط وضعیت را ثبت می‌کند. هیچ کدی در فاز ۰ تغییر نکرده است. تغییر بعدی باید پس از تأیید سه تصمیم بخش ۱۰.۳ و بستن شکاف‌های بخش ۸ باشد.*
