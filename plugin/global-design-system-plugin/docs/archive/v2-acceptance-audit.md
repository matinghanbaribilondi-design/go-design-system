# ممیزی پذیرش برنامه v2.0 — آرشیو تاریخی

تاریخ ممیزی: 2026-10-28

> ⚠️ **این سند تاریخی است و دیگر وضعیت جاری را توصیف نمی‌کند.** بدنهٔ جدول‌ها همان چیزی است که در آن تاریخ ثبت شده و عمداً بازنویسی نشده تا سابقهٔ تصمیم‌گیری قابل ردیابی بماند.
>
> برای وضعیت امروز به [`../v2.0-acceptance-checklist.md`](../v2.0-acceptance-checklist.md) مراجعه کن. برای قرارداد فعلی به [`../traceability-matrix.md`](../traceability-matrix.md).
>
> **چه چیزهایی از زمان این ممیزی تغییر کرده‌اند:** UI Verification با ۱۰ خانوادهٔ قاعده، ZIP Round-trip با ۱۹ فایل، Manifest Metadata و Fingerprint، `reference/index.json` مستقل و Canonical، Benchmark Evaluator، شش سطح خلاقیت و حالت Shared CSS اضافه شدند؛ D1–D6 تأیید و اعمال شدند؛ تعداد آزمون‌های Core از ۵۵ به ۵۶ و Golden از ۱۲ به ۱۳ فایل رسید. همچنان باز: D7، Fixture واقعی Figma و اجرای واقعی Benchmark.
>
> جمله‌های «انجام نشده» و «ناقص» در بخش ۳ فقط برای تاریخ 2026-10-28 معتبرند.

## پاسخ کوتاه

**خیر، همهٔ برنامه انجام نشده است.** درخواست مستقیم مربوط به Componentها و References انجام شده است. بخش زیادی از برنامهٔ شش‌فازی نیز پیاده‌سازی و تست شده، اما اقلام باقی‌مانده‌ای وجود دارد که یا تصمیم معماری باز دارند یا هنوز پیاده‌سازی نشده‌اند.

## 1. درخواست مستقیم اولیه

| مورد | وضعیت | شاهد |
|---|---|---|
| دریافت خودکار همهٔ Component و Component Setها از همهٔ صفحات | انجام شده | پیمایش همهٔ `figma.root.children` در `buildDraft` بدون محدودیت انتخاب کاربر |
| حذف انتخاب اجباری Component توسط کاربر | انجام شده | `componentIds: null` و `componentHtml: true` در `selObj()`؛ استخراج Component به انتخاب کاربر وابسته نیست |
| خروجی HTML همهٔ Main Componentها و همهٔ Variantهای Component Set با fig-engine | انجام شده | حلقهٔ همهٔ Variantها با `FigEngine.exportComponent` و تست Figma mock |
| ثبت پوشش واقعی و خطای Variantهای ناموفق | انجام شده | `coverage`، `failed` و `COMPONENT_HTML_EXPORT_FAILED` |
| Select all در References | انجام شده در UI | دکمهٔ `refsAll` و انتخاب همهٔ `S.frames`؛ تست خودکار UI ندارد |
| Reference فقط از Frameهای اصلی صفحات و داخل Sectionها | انجام شده | `topFrames` و تست Figma mock |
| Reload زنده، Full view دو محوره، یک HTML مستقل برای هر Frame | انجام شده | UI و تست‌های موجود |
| Slider پنج‌موقعیتی سطح خلاقیت | انجام شده | `levelPicker()` و تست تطابق با `ai-control.md` |

## 2. اقلام پیاده‌سازی‌شده از برنامهٔ شش‌فازی

| قابلیت | وضعیت | شاهد |
|---|---|---|
| Validator چندفرمتی با کد، شدت، فایل، محل و پیام | انجام شده | `lintPackage`، `verify.mjs`، تست‌های Cross-format |
| نام‌گذاری CSS قطعی مستقل از ترتیب | انجام شده | `cssNameMap`، `nameHash` و تست Permutation |
| اولویت Binding بر Value-match و ثبت ابهام | انجام شده | `bindingCss`، `refTokenMap`، `valueMatchIssues` |
| Alias چندمرحله‌ای، شکسته و چرخه‌ای | انجام شده | `resolve` و تست‌های مربوط |
| آمار قابل‌توضیح Token و `metadata/token-map.json` | انجام شده | `tokenMapData` و تست مشترک Manifest/Token Map |
| نگاشت صریح Collection و Mode | انجام شده | `collections` و `[data-theme]` |
| Typography و وزن فونت استاندارد | انجام شده در محدودهٔ مقادیر شناخته‌شده | `cssValue` و `TOKEN_INVALID_CSS_VALUE` |
| Component Graph با Variant، Instance، Token و Dependency | انجام شده | `componentGraphData` و تست‌های Core/Figma mock |
| Pattern برای ساختار کل Frame | انجام شده در محدودهٔ Whole-frame | `patternData`، Fingerprint و Evidence |
| Reference Index و پروتکل Contextual Retrieval | انجام شده و Canonical شده | `reference/index.json`، Pointer در `components/index.json` و پروتکل `SKILL.md` |
| Verify آفلاین پکیج | انجام شده | `scripts/verify.mjs` و تست Verify |
| Schemaهای ماشینی فعلی | انجام شده برای فایل‌های موجود | هفت Schema در `schemas/` |
| Golden Fixture مصنوعی و مقایسهٔ بایت‌به‌بایت | انجام شده | `tests/fixture-golden.js` و `tests/fixtures/golden-package` |
| Benchmark کارایی کد | انجام شده | `scripts/benchmark.mjs` |

## 3. اقلام انجام‌نشده یا ناقص

| مورد | وضعیت | علت یا شکاف |
|---|---|---|
| اعتبارسنجی UI تولیدشده توسط `verify.mjs` | انجام نشده | ابزار فعلی فقط پکیج را بررسی می‌کند؛ بررسی Literal ممنوع، Token ناموجود، Variant نامعتبر، Mode پشتیبانی‌نشده و Asset گمشده در UI هدف ندارد |
| قرارداد وضعیت فونت و مجوز Asset | انجام نشده | وضعیت‌های `google`، `custom-missing`، `unknown-license` و `bundled` در Manifest یا فایل ماشینی ثبت نمی‌شوند |
| Manifest کامل | ناقص | `generatorVersion`، شناسهٔ واقعی فایل Figma، Scope، Capabilities، Assetها، Hash فایل‌های خروجی و Limitations در Manifest نیستند |
| `metadata/decisions.json` | انجام نشده | مدل Rules/Evidence/Approvals/Proposals/Conflicts و وضعیت `stale` وجود ندارد |
| ساختار Canonical پکیج | تثبیت نشده | مسیر `reference/` یا `references/`، محل Schema، خروجی پیش‌فرض `validation.md` و `tokens.md` همچنان تصمیم باز است |
| `reference/index.json` مستقل | انجام نشده | اطلاعات Reference داخل `components/index.json` قرار گرفته تا مسیر Canonical تثبیت نشود |
| `components/<component-id>/component.json` | انجام نشده | جزئیات در Graph موجود است، اما ساختار فایل مستقل هر Component تثبیت نشده |
| Tag، Mode، Structure Summary و Extraction Status در Reference Index | ناقص | ایندکس فعلی Page، Size، Pattern، Component، Variant، Token و Link دارد اما همهٔ فیلدهای پیشنهادی را ندارد |
| Pattern برای بخش‌های تکرارشونده داخل صفحه | انجام نشده | استخراج فعلی Whole-frame است و Sub-section patterns را جدا نمی‌کند |
| تفکیک صریح «حالت‌های یک صفحه» از ساختارهای مستقل | ناقص | گروه‌بندی ساختاری انجام می‌شود، اما State-of-page به‌عنوان یک رابطهٔ مستقل ثبت نمی‌شود |
| Golden Fixture از فایل واقعی و ناشناس‌شده | انجام نشده | Fixture فعلی مصنوعی و کوچک است؛ فایل واقعی ناشناس‌شده دریافت نشده است |
| تست کامل چرخهٔ ZIP | ناقص | فایل‌ها تست می‌شوند، اما ZIP خروجی UI به‌صورت Golden باز و بررسی نمی‌شود |
| Benchmark سه‌حالتهٔ اثرگذاری AI | انجام نشده | Benchmark فعلی فقط زمان و حجم تولید را می‌سنجد؛ ۵ تا ۶ وظیفهٔ ثابت و معیارهای AI efficacy را ندارد |
| پاک‌سازی `reference-engine`، Fallback و Stubها | انجام نشده | حذف این‌ها به تصمیم محصول و Fallback وابسته است |
| تعیین تکلیف `build()` | انجام نشده | تصمیم Export یک‌طرفه یا Compiler دوطرفه باز است |
| تصمیم نهایی `ai-control.md` | انجام نشده | مدل ۰–۱۰، ۰–۴، B-08 و Contract §19 هنوز داوری نشده‌اند |

## 4. اقلام وابسته به هفت تصمیم باز

| تصمیم | اقلام مسدودشده |
|---|---|
| Export یا Compiler دوطرفه | سرنوشت `build()` و نام/دامنهٔ محصول |
| مدل نهایی `ai-control.md` | قرارداد نهایی خلاقیت و آزادی |
| CSS مشترک یا Standalone برای Reference | حالت خروجی و وضعیت Self-contained |
| مسیر Canonical Reference | `reference/index.json` و همهٔ ارجاع‌ها |
| محل Schema و Example | آیا `schemas/` داخل پکیج AI باشد |
| مسئولیت `content.md` | خروجی تضمین‌شده یا حذف و انتقال مسئولیت |
| قرارداد Asset، فونت و مجوز | Schema، مسیر، وضعیت مجوز و بسته‌بندی |

## 5. شکاف‌های تست

- Select all در References تست خودکار UI ندارد.
- هیچ Fixture از فایل واقعی و ناشناس‌شدهٔ Figma وجود ندارد.
- Benchmark اثربخشی سه‌حالته و وظایف ثابت وجود ندارد.
- اعتبارسنجی UI تولیدشده تست ندارد.
- چرخهٔ ZIP خروجی UI به‌صورت خودکار باز و بررسی نمی‌شود.

## 6. وضعیت آزمون‌های موجود

- ۵۵ آزمون Core
- آزمون یکپارچهٔ Figma Mock
- آزمون Golden با ۱۲ فایل
- آزمون Verify و همهٔ Schemaها

همهٔ این آزمون‌ها در آخرین اجرا موفق بوده‌اند، اما این مجموعهٔ آزمون‌ها همهٔ چک‌لیست برنامهٔ v2.0 را پوشش نمی‌دهد.

## 7. اولویت پیشنهادی برای ادامه

1. افزودن حالت اعتبارسنجی UI به `verify.mjs`.
2. دریافت یک فایل واقعی ناشناس‌شده برای Golden و تست ZIP کامل.
3. تعریف ۵ تا ۶ وظیفهٔ ثابت و بنچمارک سه‌حالتهٔ AI.
4. تکمیل فیلدهای مستقل Manifest و Reference Index.
5. گرفتن تصمیم‌های معماری باز و سپس تثبیت مسیرها، `decisions.json`، قرارداد فونت/Asset و ساختار نهایی پکیج.
