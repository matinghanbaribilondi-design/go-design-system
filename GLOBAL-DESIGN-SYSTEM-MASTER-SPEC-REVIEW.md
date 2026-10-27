# بررسی سند GLOBAL-DESIGN-SYSTEM-MASTER-SPEC v3.0.0

> تاریخ: ۲۰۲۶-۱۰-۲۷
> مبنا: `GLOBAL-DESIGN-SYSTEM-MASTER-SPEC.md`
> وضعیت: پیش از پیاده‌سازی
> هدف: تشخیص اینکه سند جدید چه چیزی را واقعاً حل کرده، چه تناقض‌هایی دارد، و چه تصمیم‌هایی قبل از کدنویسی باقی مانده است.

---

## ۰. حکم کلی

این سند نسبت به نسخه قبلی یک جهش واقعی است:

- N-01 تا N-14 را به‌عنوان تصمیم ثبت کرده است.
- `content.md`، آیکون‌ها، دارایی‌ها، `sources.json` و گزارش کامل validation را به ساختار برگردانده است.
- مهم‌تر از همه، صادقانه گفته که خروجی فعلی نباید بیش از توان موتور ادعا کند (بخش‌های ۱۲.۴ و ۱۲.۵).

اما سند در سطح «اصول و مسئولیت‌ها» متوقف شده است. آنچه هنوز ندارد:

1. گرامر مشخص و قابل‌تست برای ID پایدار.
2. JSON Schema واقعی برای فایل‌های جدید؛ نمونه‌های بخش ۱۰ صریحاً «نمونه» هستند، نه قرارداد.
3. مدل وضعیت واحد؛ در سند پنج واژگان وضعیت متفاوت وجود دارد.
4. قاعده گیت خروجی؛ مشخص نیست کدام خطا مانع export است.
5. تصمیم درباره `rules/`، `examples/` و `schemas/` داخل پکیج.

اگر امروز کدنویسی شروع شود، دوباره همان مشکل قبلی پیش می‌آید: ساختار فایل‌ها درست است، اما هر مصرف‌کننده برداشت خودش را از فیلدها و وضعیت‌ها خواهد داشت.

---

## ۱. نقاط قوت سند

| موضوع | جایگاه در سند | چرا مهم است |
|---|---|---|
| تفکیک مدل داخلی، پکیج AI و شاهد بصری | بخش‌های ۱.۱، ۲.۸، ۴ | از تبدیل مستقیم Figma به Markdown جلوگیری می‌کند |
| ثبت N-01 تا N-14 به‌عنوان تصمیم | بخش ۶ | تصمیم‌ها از حالت پراکنده خارج شده‌اند |
| صداقت در پوشش کامپوننت | N-10 و ۸.۵ | جلوی ادعای «استخراج کامل» با داده سطحی را می‌گیرد |
| تفکیک شش نوع محدودیت API | ۱۲.۴ | «پشتیبانی نمی‌شود» را به یک برچسب مبهم تبدیل نمی‌کند |
| فهرست False Guarantees | ۱۲.۵ | دقیقاً همان ادعاهای خطرناکی را نام برده که باید ممنوع شوند |
| هفت سطح اعتبارسنجی | ۱۱.۱ | از وجود فایل تا پوشش قابلیت را پوشش می‌دهد |
| `content.md` و `metadata/context.json` | N-04 | زمینه محصول از دست نمی‌رود |
| `metadata/sources.json` | ۴.۱۳ | provenance به یک فایل قابل‌ارجاع تبدیل می‌شود |
| `metadata/icons.json` و `metadata/assets.json` | N-05 و N-11 | آیکون و دارایی جای مشخص پیدا می‌کنند |
| Regression و Round-Trip Test | ۱۸.۴ و ۱۸.۵ | پکیج باید مستقل از Figma قابل استفاده باشد |
| اصل جداسازی نسخه‌ها | ۱۷.۱ | package format، schema، plugin و model نباید یک عدد باشند |
| اصل چهار مرحله‌ای شدن UI | ۱۵ | UX را ساده‌تر می‌کند، اما تغییر محصولی مهمی است |

---

## ۲. تناقض‌ها و شکاف‌های داخلی

### ۲.۱. `rules/` بدون مسئولیت و بدون schema — P0

در ساختار پکیج، پوشه `rules/` با `index.json` آمده است (خط ۱۳۲)، اما:

- در بخش ۴ (Responsibilities) هیچ بخشی برای `rules/` وجود ندارد.
- N-02 می‌گوید تصمیم‌ها، پیشنهادها، تأییدها، تعارض‌ها و شواهد در `metadata/decisions.json` ذخیره شوند (خط ۶۰۷).
- تصمیم نهایی شماره ۸ هم همان `decisions.json` را تکرار می‌کند (خط ۱۸۱۹).

نتیجه: `rules/` یک پوشه یتیم است. یا باید Rule Registry مستقل باشد، یا باید حذف شود.

**پیشنهاد:** یکی از دو مسیر باید تأیید شود:

- **مسیر A (پیشنهادی):** `rules/` منبع قواعد ساختاریافته باشد؛ هر قاعده یک فایل `rules/<slug>/rule.json` با `id`، `statement`، `scope`، `enforcement`، `evidenceStatus`، `approvalStatus`، `evidenceIds`، `exceptions` و `fingerprint`. `decisions.json` فقط تأییدها، پیشنهادها، تعارض‌ها و شواهد را نگه دارد و به `ruleId` ارجاع دهد.
- **مسیر B:** `rules/` حذف شود و `rules[]` داخل `decisions.json` قرار بگیرد.

مسیر A برای مصرف on-demand بهتر است؛ چون AI می‌تواند فقط قواعد مرتبط با یک کامپوننت را بخواند.

### ۲.۲. `decisions.json` بدون Rule Registry و Evidence Schema — P0

بخش ۴.۱۱ فهرست نسبتاً کاملی از محتوا می‌دهد:

- تأییدهای کاربر
- پیشنهادهای ردشده
- نگاشت‌های پیشنهادی
- تعارض‌ها
- overrideها
- توضیح استنباط‌ها
- confidence و evidence
- تاریخچه حل‌وفصل

اما نمونه ۱۰.۳ فقط یک آرایه `decisions[]` دارد و هیچ‌کدام از این‌ها را نشان نمی‌دهد. همچنین:

- `rules[]` ندارد.
- `evidence[]` مستقل ندارد.
- `approvals[]` به‌عنوان تاریخچه ندارد.
- `conflicts[]` ندارد.
- `overrides[]` ندارد.
- سه محور `evidenceStatus` / `approvalStatus` / `enforcement` را به‌صورت صریح تعریف نمی‌کند.

**پیشنهاد:** schema پیشنهادی:

```json
{
  "schemaVersion": "1.0.0",
  "rules": [],
  "evidence": [],
  "approvals": [],
  "proposals": [],
  "conflicts": [],
  "overrides": []
}
```

هر rule باید حداقل این فیلدها را داشته باشد:

```json
{
  "id": "rule:...",
  "statement": "...",
  "scope": { "type": "global", "ids": [] },
  "enforcement": "must|should|may|must not",
  "evidenceStatus": "confirmed|observed|inferred|proposed|unavailable|unsupported",
  "approvalStatus": "proposed|approved|rejected|stale",
  "confidence": "high|medium|low|unknown",
  "evidenceIds": [],
  "method": "...",
  "exceptions": [],
  "fingerprint": "..."
}
```

بدون این ساختار، `decisions.json` به یک ظرف JSON بدون قرارداد تبدیل می‌شود.

### ۲.۳. `metadata/token-map.json` در فهرست فایل‌های الزامی نیست — P0

بخش ۳.۱ فایل‌های الزامی را لیست می‌کند (خط ۱۶۹ به بعد) و `metadata/token-map.json` در آن نیست. این در حالی است که:

- بخش ۴.۱۰ آن را فایل اصلی نگاشت توکن می‌داند.
- بخش ۱۹ (P0) می‌گوید «Implement token-map output».
- بدون token-map، رابطه توکن Figma با CSS variable و وضعیت نگاشت از بین می‌رود.

**پیشنهاد:** فهرست فایل‌های الزامی باید شرطی باشد:

- اگر توکن وجود دارد: `tokens.css` + `metadata/token-map.json` الزامی.
- اگر آیکون وجود دارد: `metadata/icons.json` الزامی.
- اگر دارایی وجود دارد: `metadata/assets.json` الزامی.
- اگر context وجود دارد: `metadata/context.json` الزامی.
- اگر rules وجود دارد: `rules/index.json` الزامی.

### ۲.۴. نسخه‌ها با هم قاطی شده‌اند — P0

بخش ۱۷.۱ می‌گوید چهار نسخه جدا لازم است: package format، JSON schemas، plugin implementation و canonical model. اما:

- نمونه manifest فقط `formatVersion: "3.0.0"` دارد (خط ۱۰۳۲).
- این عدد همان نسخه سند است، نه نسخه فرمت پکیج.
- `component.json`، `decisions.json` و `validation.json` هرکدام `schemaVersion: "1.0.0"` دارند.
- هیچ‌جا `pluginVersion` یا `modelVersion` نیامده است.

**پیشنهاد:** در manifest یک بلوک `versions` اضافه شود:

```json
"versions": {
  "spec": "3.0.0",
  "packageFormat": "1.0.0",
  "schemas": "1.0.0",
  "plugin": "0.10.0",
  "canonicalModel": "1.0.0"
}
```

`formatVersion` باید به `packageFormat` تغییر نام دهد تا با نسخه سند اشتباه نشود.

### ۲.۵. پنج واژگان وضعیت ناسازگار — P0

در سند حداقل پنج خانواده وضعیت وجود دارد:

| خانواده | جایگاه | مقادیر |
|---|---|---|
| وضعیت واقعیت | ۵.۶ | `confirmed`، `observed`، `inferred`، `proposed`، `unavailable`، `unsupported` |
| وضعیت پوشش کامپوننت | ۸.۵ | `complete`، `partial`، `metadata_only`، `visual_only`، `unsupported`، `failed` |
| وضعیت قابلیت | ۱۲.۱ | `implemented_verified`، `implemented_unverified`، `partial`، `planned`، `unsupported`، `not_applicable` |
| وضعیت اعتبارسنجی | ۱۱.۲ | `passed`، `warning`، `failed`، `not_run` |
| وضعیت خروجی AI | ۱۴.۱ | `proposal`، `inference`، `approved`، `rejected` |

همچنین manifest از `supported` / `partial` / `unknown` استفاده می‌کند (خط ۱۰۵۶) که با هیچ‌کدام از این‌ها یکی نیست.

**پیشنهاد:** یک Status Matrix واحد تعریف شود و در همه فایل‌ها از نام فیلدهای مشخص استفاده شود، نه `status` بدون پسوند:

- `evidenceStatus`
- `approvalStatus`
- `enforcement`
- `coverageStatus`
- `capabilityStatus`
- `validationStatus`
- `renderingStatus`

هر فایل باید فقط زیرمجموعه مجاز خودش را داشته باشد. مثلاً `component.json` نباید `capabilityStatus` داشته باشد؛ آن مخصوص manifest است.

### ۲.۶. `examples/` و `schemas/` داخل پکیج AI — P1

ساختار پکیج `schemas/` و `examples/` را دارد (خط ۱۴۵ و ۱۶۳)، اما:

- بخش ۳.۱ آن‌ها را الزامی نمی‌داند.
- بخش ۱۰.۵ می‌گوید schemaهای رسمی باید وجود داشته باشند و تست شوند.
- `examples/` شامل داده‌های ساختگی است (`Example Design System`، `component_example_button`).

خطر: اگر این‌ها داخل ZIP AI بروند، Agent ممکن است داده‌های نمونه را با داده واقعی اشتباه بگیرد.

**پیشنهاد:**

- `schemas/` فقط در بسته توسعه‌دهنده یا نسخه `developer` باشد، نه پکیج پیش‌فرض AI.
- `examples/` هرگز در ZIP تولیدی نباشد؛ در repo یا docs بماند.
- اگر schemaها در پکیج می‌مانند، باید خودشان اعتبارسنجی شوند و نسخه داشته باشند.

### ۲.۷. `content.md` و `metadata/context.json` بدون قاعده حاکمیت — P1

N-04 می‌گوید هر دو حفظ شوند، اما مشخص نمی‌کند:

- کدام منبع حقیقت است؟
- اگر محتوای کاربر با استنباط AI تفاوت داشت، کدام می‌ماند؟
- آیا `context.json` بازتاب ساختاریافته `content.md` است یا مستقل؟

**پیشنهاد:**

- `content.md` نسخه انسانی و قابل‌ویرایش توسط کاربر.
- `metadata/context.json` بازتاب ماشین‌خوان همان محتوا با `source: user|ai|inferred`.
- در تعارض، مقدار کاربر بر استنباط AI اولویت دارد.
- validation باید اختلاف بین این دو را گزارش کند.

### ۲.۸. `references/` دو نوع داده متفاوت را مخلوط کرده — P0

ساختار `references/` شامل `overview.html`، `colors.html`، `typography.html`، `spacing.html` و `components.html` است. این‌ها صفحات تولیدی style guide هستند، نه فریم‌های Figma.

تعریف ۲.۸ می‌گوید Reference Page یک صفحه HTML مستقل است که ظاهر یا رفتار را نشان می‌دهد و شاهد است، نه منبع حقیقت. این تعریف آن‌قدر گسترده است که هر دو نوع را شامل می‌شود.

مشکل: `references/index.json` نمی‌تواند هم‌زمان شاهد یک فریم Figma و یک صفحه تولیدی باشد، بدون اینکه نوع آن‌ها مشخص شود.

**پیشنهاد:**

- `references/` فقط برای فریم‌های Figma با `referenceType: "source-frame"`.
- صفحات تولیدی در `styleguide/` یا `docs/` با `referenceType: "styleguide"`.
- یا اگر یک پوشه می‌ماند، `referenceType` و `source` باید در index اجباری باشند: `source-frame`، `styleguide`، `component-gallery`، `icon-gallery`.

بدون این تفکیک، ادعای «رفرنس شاهد بصری Figma است» قابل دفاع نیست.

### ۲.۹. `usage.md` از ساختار حذف شده — P1

نسخه قبلی معماری برای هر کامپوننت `usage.md` داشت. سند جدید فقط `component.json` و `preview.html` دارد. مشخص نیست راهنمای استفاده هر کامپوننت کجا می‌رود.

**پیشنهاد:** یکی از این دو:

- `components/<slug>/usage.md` برگردد.
- یا در `component.json` یک شیء `usage` با فیلدهای `whenToUse`، `do`، `dont`، `accessibility`، `evidenceStatus` اضافه شود.

اگر قرار است `design.md` همه راهنمای استفاده را داشته باشد، با اصل on-demand و حجم `design.md` سازگار نیست.

### ۲.۱۰. اتصال `components.css` به `component.json` تعریف نشده — P0

بخش ۴.۷ می‌گوید `components.css` استایل مشترک کامپوننت‌ها را دارد. اما:

- فهرست فیلدهای `component.json` در ۸.۱ هیچ `css` یا `className` ندارد.
- نمونه ۱۰.۲ هیچ اشاره‌ای به کلاس CSS ندارد.
- `preview.html` و `references/*.html` باید بدانند از کدام کلاس استفاده کنند.

**پیشنهاد:** به `component.json` اضافه شود:

```json
"css": {
  "className": "ds-button",
  "variantClassName": "ds-button--primary",
  "file": "components.css"
}
```

و validation بررسی کند که هر `className` در `components.css` وجود دارد.

### ۲.۱۱. `@font-face` بدون خانه — P1

`tokens.css` فونت‌ها را لیست می‌کند، `assets/fonts/` فایل‌ها را نگه می‌دارد، اما هیچ فایل CSS برای `@font-face` تعریف نشده است. نسخه فعلی `reference/fonts.css` دارد؛ سند جدید آن را حذف کرده.

**پیشنهاد:** `assets/fonts/fonts.css` یا بخش `@font-face` در `tokens.css` تعریف شود و رفرنس‌ها/پیش‌نمایش‌ها به آن لینک شوند.

### ۲.۱۲. `adherence` و Creative Freedom حذف شده‌اند — P1

پلاگین فعلی `adherence_level` از ۰ تا ۱۰ دارد و `ai-control.md` بر اساس آن ساخته می‌شود. سند جدید از کنترل رفتار AI حرف می‌زند اما هیچ اشاره‌ای به این مقیاس یا سطوح آزادی خلاقیت ندارد.

این یک تغییر رفتاری محصول است، نه فقط تغییر مستندات.

**پیشنهاد:** صریحاً تصمیم بگیرید:

- مقیاس ۰–۱۰ حفظ شود و در `ai-control.md` frontmatter بیاید؛ یا
- با یک مدل جدید (مثلاً سه سطح Strict/Compose/Explore) جایگزین شود و migration نوشته شود.

### ۲.۱۳. AI Assistance و دسترسی شبکه — P0/P1

بخش ۱.۱ خط لوله را شامل «Optional AI Assistance» می‌داند و بخش ۱۴ اجازه classification، naming، documentation و relationship proposal می‌دهد. اما manifest فعلی پلاگین `networkAccess.allowedDomains: ["none"]` دارد.

یعنی پلاگین نمی‌تواند در زمان اجرا به سرویس AI متصل شود. سند مشخص نمی‌کند:

- AI assistance داخل پلاگین اجرا می‌شود یا خارج از آن؟
- اگر خارج است، داده‌ها چگونه و با چه مجوزی ارسال می‌شوند؟
- آیا در MVP اصلاً فعال است؟

**پیشنهاد:**

- AI assistance به‌صورت پیش‌فرض خارج از پلاگین و اختیاری باشد.
- پلاگین فقط داده ساختاریافته و placeholder پیشنهاد تولید کند.
- هیچ داده‌ای بدون اقدام صریح کاربر از پلاگین خارج نشود.
- اگر در آینده سرویس remote اضافه شد، consent، data handling و network permission مستند شود.

### ۲.۱۴. Markdown Adapter در دامنه MVP است یا P3؟ — P1

بخش ۱۳.۳ Markdown Adapter را به‌عنوان یک مسئولیت توصیف می‌کند، اما بخش ۱۹ آن را در P3 («Additional source adapters») قرار می‌دهد. این ابهام باعث می‌شود تیم نتواند دامنه MVP را قطعی کند.

**پیشنهاد:** در MVP فقط Figma + context کاربر؛ Markdown adapter با وضعیت `planned` و فاز P3 ثبت شود.

### ۲.۱۵. Visual Validation، RTL و Accessibility — P1

هفت سطح اعتبارسنجی، مقایسه بصری با فریم Figma را پوشش نمی‌دهند. همچنین:

- RTL و i18n در سند نیامده‌اند، در حالی که پلاگین فعلی RTL را پشتیبانی می‌کند.
- Accessibility فقط در `design.md` و `ai-control.md` به‌عنوان متن آمده؛ هیچ فیلد ساختاریافته یا بررسی‌ای ندارد.

**پیشنهاد:**

- Visual validation را صریحاً خارج از موتور و در CI/Playwright تعریف کنید، یا آن را به‌عنوان `not_applicable` در capability matrix ثبت کنید.
- `direction`، `locale` و `a11y` را به metadata کامپوننت/رفرنس اضافه کنید.
- بررسی‌های a11y فقط با شاهد (کنتراست، label، focus) و نه استنباط خودکار.

### ۲.۱۶. ورک‌فلو چهار مرحله‌ای با UI فعلی هفت مرحله‌ای — P1

بخش ۱۵ چهار مرحله را ترجیح می‌دهد: Source، References، Build، Download. UI فعلی هفت مرحله دارد: Source، Content، Reference، Dependencies، Analyze، Review، Generate.

این یک تغییر محصولی مهم است. نگاشت پیشنهادی:

- Source = Source + Content
- References = Reference + Dependencies
- Build = Analyze + Review + Generate
- Download = result

**پیشنهاد:** این تغییر در یک تصمیم جداگانه تأیید شود؛ در غیر این صورت سند و UI از هم جدا می‌افتند.

### ۲.۱۷. توکن‌های مشتق‌شده و nearest-match — P0

موتور فعلی:

- توکن‌های مشتق‌شده برای spacing/radius می‌سازد.
- برای رنگ‌های بدون اتصال، نزدیک‌ترین توکن را انتخاب می‌کند.
- این مقادیر در `tokens.css` و Spec CSS ظاهر می‌شوند.

سند جدید فقط از «confirmed tokens» در `tokens.css` حرف می‌زند و برای derived/nearest-match سیاستی ندارد.

**پیشنهاد:**

- `token-map.json` وضعیت‌های `derived`، `nearest-match`، `unmapped` را ثبت کند.
- `tokens.css` یا این مقادیر را با کامنت/وضعیت مشخص منتشر کند، یا آن‌ها را از tokens رسمی جدا نگه دارد.
- برای هر توکن مشتق‌شده، یک proposal در `decisions.json` ثبت شود.
- هیچ توکن مشتق‌شده‌ای بدون تأیید «official» نشود.

### ۲.۱۸. Remote library و detached instance — P1

سند هیچ وضعیت صریحی برای این دو ندارد:

- کامپوننت‌های کتابخانه remote که تعریفشان قابل خواندن نیست.
- Instanceهای detached که هویت کامپوننت را از دست داده‌اند.

**پیشنهاد:** به `coverageStatus` اضافه شود: `remote-unavailable`، `detached`، `instance-only`. manifest limitations هم این موارد را گزارش کند.

### ۲.۱۹. Conflict Precedence بدون جدول — P1

بخش ۱۳.۴ می‌گوید تعارض‌ها با «documented precedence rules» حل شوند، اما جدولی وجود ندارد. این یکی از مهم‌ترین قواعد محصول است.

**پیشنهاد:** جدول اولویت پیشنهادی:

1. خواسته صریح کاربر در همان export.
2. داده معتبر Figma با اتصال مستقیم.
3. قراردادهای تأییدشده پروژه (`rules/` یا `decisions.json`).
4. توکن‌ها و کامپوننت‌های تأییدشده.
5. رفرنس‌های بصری.
6. استنباط AI.

هر تعارض باید در `decisions.json` ثبت شود و حل خودکار آن ممنوع باشد، مگر در محدوده‌ای که کاربر تأیید کرده است.

### ۲.۲۰. Size limit، Determinism و Migration — P2

- N-11 از «documented package size limits» حرف می‌زند اما هیچ عددی ندارد.
- `generatedAt` در manifest باعث می‌شود خروجی بایت‌به‌بایت deterministic نباشد.
- بخش ۱۷.۲ قاعده migration را می‌گوید اما جدول migration بین نسخه‌ها ندارد.

**پیشنهاد:** benchmark با یک فایل واقعی، تعیین سقف برای تعداد کامپوننت/رفرنس/asset، سیاست hash (manifest خودش را hash نکند، timestamp در hash فایل‌ها نباشد)، و جدول migration نسخه‌ها.

---

## ۳. وضعیت واقعی N-01 تا N-14

«Accepted» بودن یک تصمیم به معنای «قابل پیاده‌سازی بودن» نیست. جدول زیر تفاوت را نشان می‌دهد.

| ID | موضوع | وضعیت در سند | چه چیزی هنوز کم است |
|---|---|---|---|
| N-01 | Stable Entity IDs | اصل پذیرفته شده | گرامر ID، رفتار rename/delete/duplicate، الگوریتم fallback |
| N-02 | Decision & Evidence | محل ذخیره مشخص | schema، rules[]، evidence[]، سه محور، تاریخچه تأیید |
| N-03 | Validation Report | محل گزارش مشخص | schema کامل، coverage، limitations، گیت خروجی |
| N-04 | Project Context | دو فایل مشخص | schema، قاعده حاکمیت، همگام‌سازی |
| N-05 | Icon Registry | محل مشخص | schema، رابطه با components، icon pack |
| N-06 | Proposed Tokens | سیاست مشخص | فیلد وضعیت، محل ذخیره، نمایش اختیاری |
| N-07 | Component CSS Scope | دامنه مشخص | ابعاد ساختاری، قاعده token/fallback |
| N-08 | Reference Rendering | استراتژی hybrid | attributeهای variant/match، قرارداد fallback |
| N-09 | Manifest Contract | محتوا مشخص | schema، بلوک نسخه‌ها، hash، inventory واقعی |
| N-10 | Component Coverage | اصل صداقت | وضعیت واقعی هر قابلیت روی fixture |
| N-11 | Asset Registry | اصل ثبت | schema، سقف عددی، رفتار remote |
| N-12 | Versioning | اصل جداسازی | نمونه manifest، جدول migration |
| N-13 | Documentation Separation | تفکیک روشن | template و تست عدم تکرار |
| N-14 | Index Files | اصل ناوبری | schema، فیلدهای اجباری، consistency check |

**نتیجه:** از ۱۴ تصمیم، حدود ۴ مورد در سطح سیاست حل شده‌اند (N-06، N-10، N-13، N-14) و بقیه هنوز قرارداد اجرایی ندارند.

---

## ۴. تطبیق سند با کد فعلی

| ادعا / تصمیم سند | وضعیت در کد فعلی | شاهد | نتیجه |
|---|---|---|---|
| N-01: ID نباید از نام گرفته شود | IDهای توکن و کامپوننت از نام ساخته می‌شوند | `src/core.js:1062` و `src/core.js:1075` | نقض N-01 |
| N-10: پوشش کامپوننت باید صادق باشد | استخراج فقط سطحی و واریانت پیش‌فرض | `src/core.js:1015-1060` | سند درست تشخیص داده؛ وضعیت واقعی `partial` است |
| N-08: اتصال semantic در رفرنس | فقط `data-component` با نام | `src/core.js:918` | نقض N-08 |
| tokens.css با alias/mode | وجود دارد | `src/core.js:183-221` | قابل استفاده؛ اما collision متن هنوز هست (`:214`) |
| N-03: گزارش validation | `validation-report.json` وجود دارد | `src/core.js:634` | نیازمند rename/schema؛ `decisions.json` ندارد |
| N-09: manifest کامل | فقط `{entities:{}}` | `src/core.js:631-634` | نقض N-09 |
| N-04: content.md | وجود دارد | `src/core.js:589` | قابل حفظ |
| N-05: icons.json | وجود دارد | `src/core.js:635` | نیمه‌کامل |
| rules/ به‌عنوان registry | فقط `rules/validation-rules.json` | `src/core.js:636` | Rule Registry واقعی نیست |
| references/index.json | فقط `reference/index.html` | `src/core.js:280` | وجود ندارد |
| components.css مشترک | CSS در `components.md` و inline | `src/core.js:277` و `:493` | وجود ندارد |
| font CSS | `reference/fonts.css` | `src/core.js:281` | سند جایگزین ندارد |
| UI چهار مرحله‌ای | UI هفت مرحله‌ای | `ui.html` | تغییر محصولی لازم است |
| metadata.json | فایل جدا | `src/core.js:630` | باید در manifest ادغام شود |

این جدول نشان می‌دهد سند جدید در تشخیص مشکلات فعلی دقیق است، اما فاصله بین «تشخیص» و «قرارداد» هنوز زیاد است.

---

## ۵. تصمیم‌های باقی‌مانده R-01 تا R-14

| ID | تصمیم | پیشنهاد | اولویت |
|---|---|---|---|
| R-01 | گرامر ID پایدار | ID مبهم با `source` مرجع؛ rename پایدار، delete tombstone، duplicate ID جدید؛ fallback هش‌شده | P0 |
| R-02 | محل Rules | `rules/` به‌عنوان Registry مستقل؛ `decisions.json` فقط تصمیم/شاهد/تعارض | P0 |
| R-03 | Status Matrix | فیلدهای نام‌دار و نقشه نگاشت بین پنج خانواده وضعیت | P0 |
| R-04 | Required File Matrix | الزام شرطی token-map/icons/assets/context/rules | P0 |
| R-05 | Version Block | `spec/packageFormat/schemas/plugin/model` جدا در manifest | P0 |
| R-06 | Reference Taxonomy | تفکیک `source-frame` از `styleguide` و `component-gallery` | P0 |
| R-07 | Component CSS/Usage | افزودن `css` و `usage` به component.json یا بازگرداندن `usage.md` | P0 |
| R-08 | Derived/Nearest Tokens | وضعیت `derived`/`nearest-match`/`unmapped` + proposal | P0 |
| R-09 | Schemas/Examples Shipping | خارج از ZIP تولیدی؛ فقط بسته developer | P1 |
| R-10 | AI Assistance/Network | خارج از پلاگین و اختیاری؛ بدون ارسال داده بدون consent | P1 |
| R-11 | UI Four-Step | نگاشت رسمی از هفت مرحله فعلی به چهار مرحله | P1 |
| R-12 | RTL/A11y/Visual | افزودن فیلد جهت/ locale/ a11y و تصمیم visual validation | P1 |
| R-13 | Remote/Detached Coverage | وضعیت‌های `remote-unavailable` و `detached` | P1 |
| R-14 | Size/Determinism/Migration | benchmark، سیاست hash، جدول migration | P2 |

---

## ۶. نقشه اجرا

| فاز | کار | معیار خروج |
|---|---|---|
| ۰ | تأیید R-01..R-08 و نوشتن JSON Schemaها | schemaها روی fixture معتبر و نامعتبر تست شوند |
| ۱ | Audit کد فعلی با Capability Matrix | هر قابلیت وضعیت `implemented_verified` یا `partial` یا `planned` داشته باشد |
| ۲ | Canonical Model و IDها | هویت پایدار در دو export متوالی تست شود |
| ۳ | لایه توکن | alias، mode، collision، derived، unmapped تست شوند |
| ۴ | Component IR | واریانت‌ها، propertyها، nested، override و coverage واقعی ثبت شوند |
| ۵ | References | index.json، CSS مشترک، semantic mapping و fallback تست شوند |
| ۶ | اسناد و پکیج | SKILL/ai-control/design/content و manifest نهایی شوند |
| ۷ | Validation، UI و Migration | خروجی ZIP واقعی و مستقل از Figma تست شود |

**قانون:** فاز ۴ قبل از فاز ۲ شروع نشود؛ Component IR به ID پایدار و مدل مرجع وابسته است. فاز ۶ قبل از فاز ۳ و ۴ شروع نشود؛ `design.md` و `manifest` باید از داده واقعی ساخته شوند، نه از placeholder.

---

## ۷. Definition of Ready قبل از کدنویسی

- [ ] R-01 تا R-08 تأیید شده‌اند.
- [ ] JSON Schemaهای رسمی برای manifest، component، indexها، decisions، token-map، validation، icons، sources و assets نوشته شده‌اند.
- [ ] Status Matrix واحد تأیید شده است.
- [ ] Required File Matrix شرطی تأیید شده است.
- [ ] محل `rules/` و schema آن قطعی شده است.
- [ ] تاکسونومی `references/` قطعی شده است.
- [ ] سیاست derived/nearest token قطعی شده است.
- [ ] وضعیت واقعی قابلیت‌ها روی یک فایل Figma واقعی اندازه‌گیری شده است.
- [ ] سیاست AI assistance و شبکه تأیید شده است.
- [ ] ورک‌فلو چهار مرحله‌ای تأیید یا به فاز بعد موکول شده است.
- [ ] دامنه RTL/a11y/visual validation مشخص شده است.
- [ ] جدول migration و version block تأیید شده است.

---

## ۸. جمع‌بندی

سند v3.0.0 یک **Master Contract** خوب است: اصول را روشن کرده، N-01..N-14 را ثبت کرده، و از ادعای بیش از توان موتور جلوگیری می‌کند. این دقیقاً همان چیزی بود که نسخه قبلی کم داشت.

اما هنوز یک **Implementation Contract** نیست. سه جمله برای جمع‌بندی:

1. **«Accepted» بودن N-01..N-14 به معنای آماده بودن برای کد نیست.** بیشتر آن‌ها اصل هستند، نه schema.
2. **بزرگ‌ترین تناقض داخلی، `rules/` در برابر `decisions.json` است.** تا این تصمیم گرفته نشود، Rule Registry نه در ساختار است و نه در داده.
3. **بزرگ‌ترین ریسک فنی، فاصله بین ادعای `components/` و استخراج سطحی فعلی است.** سند این را صادقانه پذیرفته؛ حالا باید وضعیت واقعی هر قابلیت را با fixture اندازه بگیرد.

**گام بعدی پیشنهادی:** تأیید R-01 تا R-08، نوشتن schemaها، و اجرای audit واقعی کد با Capability Matrix. تا این سه انجام نشود، افزودن متن بیشتر به معماری ارزش اجرایی جدیدی ایجاد نمی‌کند.
