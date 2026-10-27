# بررسی معماری نهایی پکیج خروجی Global Design System

> نسخه بررسی: ۱ · تاریخ: ۲۰۲۶-۱۰-۲۷ · وضعیت: پیش از پیاده‌سازی
> مبنای بررسی: `global-design-system-output-architecture.md`، سند پاسخ پیشنهادی سؤالات، و کد داخل `global-design-system-SOURCE (1).zip`.

---

## ۰. نتیجه در یک نگاه

- **جهت کلی درست است:** سند جدید سه لایه را از هم جدا می‌کند: مدل داخلی موتور، پکیج مصرفی AI، و خروجی‌های قابل‌مشاهده برای انسان. این همان تفکیکی است که در معماری قبلی گم شده بود.
- **اما سند جدید یک «ساختار» است، نه یک «قرارداد داده»:** هیچ‌کدام از فایل‌های جدید (`component.json`، فایل‌های `index.json`، `token-map.json`، `decisions.json`، `manifest.json`) اسکیمای مشخص ندارند. بدون این قراردادها، موتور جدید قابل تست، مهاجرت و اعتبارسنجی نیست.
- **سه موجودیت مهم در ساختار جدید جای مشخصی ندارند:** `content.md` (محتوای محصول و کاربران)، خروجی آیکون‌ها، و توکن‌های پیشنهادی. گزارش کامل اعتبارسنجی هم فقط با «خلاصه در `manifest.json`» جایگزین شده که برای رفع اشکال کافی نیست.
- **دو تصمیم قبلی برگشته‌اند:** `ai-control.md` برخلاف تصمیم Q-27/C-09/B-09 حذف نشده و مستقل مانده؛ `manifest.json` به ریشه منتقل شده. این‌ها می‌توانند تصمیم نهایی باشند، اما باید صریح تأیید شوند.
- **بزرگ‌ترین ریسک فنی:** `component.json` و `preview.html` با استخراج فعلی قابل تولید دقیق نیستند. موتور فعلی فقط مشخصات سطحی واریانت پیش‌فرض را می‌گیرد (حداکثر ۴ متن، بدون درخت فرزندان، بدون override/slot). اگر این شکاف دیده نشود، پکیج ادعای «کتابخانه کامپوننت» می‌کند اما داده‌اش ناقص است.

**حکم:** معماری هدف قابل قبول است؛ اما تا زمانی که تصمیم‌های N-01 تا N-14 تأیید و به JSON Schema تبدیل نشوند، شروع پیاده‌سازی یک بازنویسی پرریسک است.

---

## ۱. چه چیزی در سند جدید قطعی شده است

| # | تصمیم | اثر |
|---|---|---|
| ۱ | شش فایل ریشه: `SKILL.md`، `ai-control.md`، `design.md`، `tokens.css`، `components.css`، `manifest.json` | نقطه ورود روشن و قابل‌پیش‌بینی برای Agent |
| ۲ | `components/` به‌عنوان کتابخانه مستقل با `component.json`، `usage.md` و `preview.html` | کامپوننتی که در رفرنس نیست هم قابل استفاده می‌شود |
| ۳ | `references/` به‌عنوان شواهد بصری مستقل با `index.json` و HTML | رفرنس از تعریف کامپوننت جدا می‌شود |
| ۴ | `metadata/` فقط شامل `token-map.json` و `decisions.json` | کاهش پراکندگی متادیتا |
| ۵ | `assets/` یکپارچه برای فونت، تصویر و دارایی واقعی | حذف `fonts/` مستقل و مسیرهای موازی |
| ۶ | حذف `patterns/`، `tokens.md`، `validation.md`، `fonts/` و `styles/` | کاهش فایل‌های تکراری |
| ۷ | `canonical-model.json` فقط داخلی می‌ماند و در ZIP نمی‌آید | پکیج سبک‌تر، اما نیازمند قرارداد توزیع‌شده provenance |
| ۸ | `manifest.json` در ریشه، شامل مشخصات بسته و خلاصه اعتبارسنجی | جایگزین `metadata.json` و `export-manifest.json` |
| ۹ | CSS مشترک: رفرنس‌ها و پیش‌نمایش‌ها از `tokens.css` و `components.css` استفاده می‌کنند | حذف CSS تکراری و وابستگی ناسازگار |
| ۱۰ | تفکیک منبع حقیقت: توکن در `tokens.css`، ساختار کامپوننت در `components/`، شاهد در `references/`، تصمیم در `decisions.json` | جلوگیری از ادعای مالکیت نادرست |
| ۱۱ | مصرف on-demand: ابتدا `SKILL.md`، سپس فقط منابع مرتبط | کنترل Context |
| ۱۲ | الزام بررسی کد فعلی قبل از تغییر | جلوگیری از بازنویسی دوباره قابلیت‌های موجود |

این twelve مورد، ستون فقرات معماری جدید هستند و با اصل «عدم تکرار» و «مدل داده مشترک» سازگارند.

---

## ۲. تفکیک سه لایه

سند جدید درست تشخیص داده که سه نوع فایل با سه مصرف‌کننده متفاوت وجود دارد:

| لایه | مالک | محتوا | در ZIP؟ |
|---|---|---|---|
| موتور داخلی | پلاگین | Canonical Model، استخراج، نگاشت، اعتبارسنجی، تأییدها، شواهد | خیر |
| پکیج مصرفی AI | Agent | `SKILL.md`، `ai-control.md`، `design.md`، `tokens.css`، `components.css`، `manifest.json`، `components/`، `references/`، `metadata/`، `assets/` | بله |
| سطح بازبینی انسانی | طراح / تیم | HTML رفرنس، `preview.html`، گالری رفرنس، گزارش اختیاری اعتبارسنجی | بله، اما نباید همه در Context AI بارگذاری شود |

**نکته مهم:** `references/*.html` هم‌زمان شاهد بصری و بخشی از پکیج AI است. در `SKILL.md` باید صریح گفته شود چه زمانی این فایل‌ها خوانده می‌شوند؛ وگرنه Agent یا همه را می‌خواند یا هیچ‌کدام را.

---

## ۳. داده‌های جدید و وضعیت واقعی موتور

جدول زیر نشان می‌دهد کدام فایل واقعاً داده جدید است و کدام فقط بازآرایی داده موجود. این تفکیک برای برآورد کار و ریسک مهاجرت ضروری است.

| # | فایل / داده | امروز در کد | برای معماری جدید چه لازم است | نوع تغییر |
|---|---|---|---|---|
| ۱ | `SKILL.md` | ندارد | راهنمای ناوبری، ترتیب مطالعه، اعتبارسنجی خروجی | جدید |
| ۲ | `ai-control.md` | دارد (`aiControlMd`) | حفظ مستقل؛ تفکیک کامل از `SKILL.md` | بازآرایی/ویرایش |
| ۳ | `design.md` | دارد | حذف ارجاع به `tokens.md`، `components.md`، `validation.md`؛ بازنویسی بخش‌ها | تغییر ساختاری |
| ۴ | `tokens.css` | دارد (`tokensCss`؛ alias و mode دارد) | حفظ alias/mode؛ رفع collision متن؛ جداسازی proposed | ناقص |
| ۵ | `components.css` | ندارد؛ CSS در `components.md` و رفرنس inline است | CSS مشترک از Component IR | جدید (بخشی موجود) |
| ۶ | `manifest.json` | دارد ولی فقط `entities` | نسخه، منبع، scope، فایل‌ها، capabilities، validation، assets | ناقص |
| ۷ | `components/index.json` | ندارد | Registry ناوبری با ID، مسیر، وضعیت استخراج | جدید (داده موجود) |
| ۸ | `components/<slug>/component.json` | ندارد؛ `M.components` و `extractComponent` داده خام دارند | اسکیمای کامل variant/property/state/token/dependency/evidence | جدید (داده ناقص) |
| ۹ | `components/<slug>/usage.md` | بخشی در `components.md` | راهنمای استفاده با برچسب شاهد/استنباط | جدید |
| ۱۰ | `components/<slug>/preview.html` | ندارد؛ renderer رفرنس وجود دارد | پیش‌نمایش مستقل کامپوننت و واریانت‌های قابل‌نمایش | جدید |
| ۱۱ | `references/index.json` | ندارد؛ `reference/index.html` دارد | ایندکس ماشین‌خوان + ارتباطات + وضعیت استخراج | جدید |
| ۱۲ | `references/*.html` | دارد | استفاده از CSS مشترک + `data-component-id` / `data-variant` | بازنویسی |
| ۱۳ | `metadata/token-map.json` | منطق `refTokenMap` و `cssNameMap` دارد | نگاشت، alias، mode، candidate، status | جدید |
| ۱۴ | `metadata/decisions.json` | ندارد؛ `rulesMd`، `aiControl` و validation پراکنده‌اند | Rule Registry + Evidence + Approval + Proposal | جدید |
| ۱۵ | `metadata/validation.json` | `validation-report.json` دارد (tier ۲) | گزارش کامل ساختاریافته + خلاصه در manifest | جدید/ادغام |
| ۱۶ | `assets/` | `reference/assets` و `fonts.css` | دارایی مشترک + index و مجوز | ناقص |
| ۱۷ | `content.md` | دارد | در ساختار جدید جایی ندارد | تصمیم لازم |
| ۱۸ | `icons.json` / `reference/icons.html` | دارد | جای مشخص ندارد | تصمیم لازم |
| ۱۹ | `tokens.md` | دارد | حذف/ادغام در `design.md` | نیازمند تغییر |
| ۲۰ | `components.md` | دارد | حذف/تقسیم به `component.json` و `usage.md` | نیازمند تغییر |
| ۲۱ | `validation.md` | دارد | حذف | نیازمند تغییر |
| ۲۲ | `metadata.json` | دارد | ادغام در `manifest.json` | نیازمند تغییر |
| ۲۳ | `rules/validation-rules.json` | دارد | ادغام در `decisions.json` | نیازمند تغییر |
| ۲۴ | `canonical-model.json` | فایل مستقل ندارد | مدل داخلی | جدید داخلی |

### دسته‌بندی ریسک

- **دسته A — بازآرایی داده موجود (ریسک کم):** ۲، ۳، ۱۱، ۱۲، ۱۹، ۲۰، ۲۱، ۲۲، ۲۳.
- **دسته B — داده نیمه‌موجود (ریسک متوسط):** ۴، ۵، ۷، ۸ (بخش پایه)، ۹، ۱۰، ۱۳، ۱۶.
- **دسته C — داده واقعاً جدید (ریسک بالا):** ۱، ۶ (نسخه کامل)، ۸ (واریانت‌ها، override، slot)، ۱۴، ۱۵ (گزارش ساختاریافته).

بخش عمده «داده‌هایی که قبلاً نبوده» در دسته C قرار می‌گیرد؛ اما این داده عمدتاً **حکمرانی و روابط** است، نه استخراج خام جدید. فقط بند ۸ (واریانت‌ها و ساختار داخلی کامپوننت) استخراج واقعاً جدید می‌خواهد.

---

## ۴. تناقض‌ها و تصمیم‌های برگشتی

| موضوع | تصمیم قبلی | سند جدید | ریسک | پیشنهاد |
|---|---|---|---|---|
| `ai-control.md` | Q-27/C-09/B-09/D-02: پس از مهاجرت بازنشسته شود | حفظ مستقل در ریشه | دوگانگی `SKILL.md` و `ai-control.md` | حفظ مستقل؛ `SKILL.md` فقط ناوبری باشد؛ C-09 منسوخ شود |
| محل `manifest.json` | B-09: نقطه ورود خنثی؛ `metadata/export-manifest.json` | `manifest.json` در ریشه | کم | تأیید |
| `validation.md` | گزارش مستقل و قابل‌خواندن | حذف؛ خلاصه در manifest | از دست رفتن جزئیات و قابلیت دیباگ | افزودن `metadata/validation.json` |
| `tokens.md` | فایل مستقل توضیح توکن‌ها | ادغام در `design.md` | تورم `design.md` و تکرار مقادیر | فقط راهنمای کوتاه؛ جداول کامل در `tokens.css` و `token-map.json` |
| `rules.json` | B-07: `rules.json` منبع حاکم | `decisions.json` | از دست رفتن Rule Registry | `decisions.json` شامل `rules[]` کامل باشد |
| Component Registry | B-05/Q-22: `component-registry.json` جدا | ادغام در `components/index.json` | ابهام منبع حقیقت | index فقط ناوبری؛ `component.json` منبع ساختار |
| Approvals / Proposals | B-06/B-03: فایل‌های جدا | ادغام در `decisions.json` | از دست رفتن fingerprint و stale | اسکیمای کامل با سه محور مستقل |
| Proposed tokens | B-03: `tokens.proposed.css` | جایی ندارد | تبدیل توکن تأییدنشده به رسمی | فقط در `decisions.json`؛ بدون CSS |
| Canonical Model | Q-07: نرمال‌سازی و صادرات | فقط داخلی | از دست رفتن قابلیت دیباگ | داخلی + Source Registry |
| `content.md` | خروجی فعلی | حذف شده | از دست رفتن context محصول و کاربران | حفظ اختیاری یا ادغام هدفمند |
| Icons | `icons.json` و `reference/icons.html` | حذف شده | گم شدن آیکون‌ها و icon pack | `metadata/icons.json` + `assets/icons/` |
| گالری رفرنس | `reference/index.html` | `index.json` | از دست رفتن نمای انسانی | `index.html` اختیاری بماند |
| `components.css` | `styles/components.css` | ریشه | شکستن مسیرهای فعلی | به‌روزرسانی همه ارجاع‌ها |
| `preview.html` | Q-22: اختیاری | اختیاری | عدم قطعیت رفتار Export | پیش‌فرض full/agent روشن؛ minimal/standard خاموش |
| اعتبارسنجی بصری | Q-31/Q-32: CI و Playwright | اشاره نشده | ادعای اعتبارسنجی ناقص | خارج از موتور، در CI |
| مهاجرت | Q-29: تدریجی و نسخه‌دار | حذف فوری فایل‌های قدیمی | شکستن مصرف‌کننده‌ها | یک نسخه سازگاری یا فلگ مهاجرت |

موارد نیازمند تأیید صریح: `ai-control.md`، `validation.md`، `tokens.md`، `rules.json`/`decisions.json`، Approvals/Proposals، Proposed tokens، `content.md`، Icons، و Migration.

---

## ۵. شکاف‌های P0

### ۵.۱. Rule Registry در `decisions.json` تعریف نشده

سند جدید می‌گوید `decisions.json` وضعیت تأیید، منشأ شواهد و تصمیم‌ها را نگه می‌دارد؛ اما مدل قانون در سند معماری قبلی شامل این موارد است:

- Rule ID
- شرح قانون
- Scope
- Source
- Evidence Frame IDs
- روش استخراج
- Confidence
- Status
- Enforcement
- Exceptions

اگر `decisions.json` فقط یک شیء کلی باشد، این داده‌ها گم می‌شوند. باید `rules[]` با فیلدهای بالا و سه محور مستقل داشته باشد:

- `evidenceStatus`: `confirmed` / `observed` / `inferred`
- `approvalStatus`: `proposed` / `approved` / `rejected` / `stale`
- `enforcement`: `must` / `should` / `may` / `must not`

**پیشنهاد:** N-02.

### ۵.۲. Stable ID Grammar

سند جدید از «شناسه کامپوننت» حرف می‌زند اما فرمت آن را تعریف نمی‌کند. بدون ID پایدار:

- `usedIn` بین `components/` و `references/` می‌شکند.
- Rename کامپوننت باعث ایجاد هویت جدید می‌شود.
- Duplicate name قابل تفکیک نیست.
- AI نمی‌تواند ادعاها را به منبع برگرداند.

**پیشنهاد:** N-01؛ استفاده از گرامر B-01 و شیء `source` به‌عنوان مرجع حل، نه پارس کردن ID.

### ۵.۳. Component IR و عمق استخراج

کد فعلی در `src/core.js`:

- `componentSpec` فقط مشخصات ریشه را می‌گیرد (خط ۱۰۱۵ به بعد).
- برای Component Set فقط `n.children[0]` را می‌خواند (خط ۱۰۵۹).
- حداکثر ۴ متن را استخراج می‌کند (خط ۱۰۲۵).
- `variantDims` حداکثر ۳۰ واریانت را نگه می‌دارد (خط ۱۰۶۰).
- درخت فرزندان، override، slot و instance swap را ثبت نمی‌کند.

این برای `component.json` کامل و `preview.html` واریانت‌ها کافی نیست. باید یک **Component IR** بازگشتی ساخته شود که با رفرنس‌ها مشترک باشد، نه دو رندرر جدا.

**پیشنهاد:** N-10؛ در MVP می‌توان `component.json` را برای همه واریانت‌ها/پرپرتی‌ها/استیت‌ها کامل کرد اما `preview.html` فقط واریانت پیش‌فرض و واریانت‌های ساده را پوشش دهد؛ وضعیت `partial` صریح ثبت شود.

### ۵.۴. قرارداد رندر رفرنس

کد فعلی رفرنس را با CSS inline می‌سازد (`src/core.js:277`) و فقط `data-component="name"` می‌دهد (خط ۹۱۸). برای معماری جدید لازم است:

- `references/*.html` از `../tokens.css` و `../components.css` استفاده کند.
- هر عنصر قابل‌شناسایی `data-component-id`، `data-variant-id`، `data-component-match` و در صورت لزوم `data-token-id` داشته باشد.
- CSS مخصوص صفحه فقط برای layout باشد، نه رنگ و تایپوگرافی.
- اگر تطبیق کامپوننت مطمئن نیست، رندر بصری حفظ شود و `componentMatch: partial|none|ambiguous` ثبت شود.

**پیشنهاد:** N-08.

### ۵.۵. گزارش اعتبارسنجی و Gate خروجی

حذف `validation.md` درست است، اما خلاصه در `manifest.json` برای دیباگ کافی نیست. باید:

- `metadata/validation.json` گزارش کامل ماشین‌خوان داشته باشد.
- `manifest.validation` خلاصه داشته باشد: status، errors، warnings، checks، coverage، limitations، report path.
- خروجی فقط در خطاهای ساختاری بحرانی متوقف شود؛ هشدارهای طراحی/بصری مانع خروجی نشوند.
- `lintPackage` از خواندن `validation.md` رها شود.

**پیشنهاد:** N-03.

### ۵.۶. سیاست توکن پیشنهادی

B-03 پیشنهاد `tokens.proposed.css` را داده بود؛ سند جدید آن را حذف کرده. خطر اصلی این است که توکن پیشنهادی وارد `tokens.css` شود و AI آن را رسمی بداند.

**پیشنهاد:** N-06؛ پیشنهادها فقط در `decisions.json` با `status: proposed` ذخیره شوند. اگر preview لازم است، `metadata/proposed-tokens.json` جدا و هرگز در `tokens.css` ادغام نشود.

### ۵.۷. جای `content.md`، آیکون‌ها و Source Registry

- `content.md` شامل محصول، کاربران، اهداف، پلتفرم، زبان و استنباط‌هاست. حذف آن باعث می‌شود AI زمینه محصول را از دست بدهد.
- آیکون‌ها نه کامپوننت هستند و نه توکن؛ اما بخشی از زبان بصری‌اند. باید جای مشخص داشته باشند.
- با توزیع provenance در چند فایل، یک Source Registry لازم است تا `fileKey`، صفحه، `nodeId` و وضعیت remote قابل حل باشد.

**پیشنهاد:** N-04، N-05 و بخش `sources` در `manifest.json` یا `metadata/sources.json`.

### ۵.۸. اسکیمای `manifest.json` و مسئله Self-Hash

`manifest.json` نمی‌تواند هش خودش را در `files[]` داشته باشد. همچنین `generatedAt` می‌تواند Determinism را بشکند.

**پیشنهاد:** N-09؛ manifest خودش را از inventory حذف کند، `hash.excludes: ["manifest.json"]` ثبت شود، و تست Determinism فقط هش فایل‌های دیگر را مقایسه کند.

### ۵.۹. دامنه `components.css` و ابعاد ساختاری

تعارض قدیمی C-07 هنوز حل نشده:

- یک بخش می‌گوید مقادیر ثابت ابعاد کامپوننت مجاز است.
- بخش دیگر می‌گوید هیچ مقدار ثابتی نوشته نشود.

**پیشنهاد:** N-07؛ `components.css` فقط ویژگی‌های بصری (رنگ، تایپ، شعاع، سایه، فاصله) را با `var()` بنویسد. ابعاد ساختاری (width/height) فقط اگر از Figma استخراج شده و در `component.json` با `source: figma` ثبت شده باشد، به‌صورت literal مجاز است. این ابعاد «توکن طراحی» نیستند و نباید به‌عنوان توکن منتشر شوند. CSS چیدمان صفحه در رفرنس بماند، نه در `components.css`.

### ۵.۱۰. اندازه پکیج، Determinism و دامنه Remote

- `preview.html` برای هر کامپوننت + `component.json` + رفرنس‌ها + assets می‌تواند ZIP را بسیار بزرگ کند. مصرف on-demand اندازه ZIP را کم نمی‌کند.
- ترتیب فایل‌ها و کلیدهای JSON باید پایدار باشد.
- کامپوننت‌های کتابخانه remote ممکن است قابل خواندن نباشند؛ ادعای «همه کامپوننت‌ها» باید محدود و علامت‌گذاری شود.

**پیشنهاد:** N-11 و N-12.

---

## ۶. قراردادهای پیشنهادی N-01 تا N-14

| ID | موضوع | تصمیم پیشنهادی | وضعیت |
|---|---|---|---|
| N-01 | Stable ID | گرامر B-01؛ ID مبهم (opaque)؛ `source` مرجع حل؛ rename پایدار، delete tombstone، duplicate ID جدید | نیازمند تأیید |
| N-02 | `decisions.json` | شامل `rules[]`، `evidence[]`، `approvals[]`، `proposals[]`، `conflicts[]`؛ سه محور مستقل | نیازمند تأیید |
| N-03 | Validation | `metadata/validation.json` کامل + خلاصه در manifest؛ حذف `validation.md` از خروجی پیش‌فرض | نیازمند تأیید |
| N-04 | `content.md` | حفظ اختیاری در ریشه؛ یا ادغام در `design.md` + `metadata/context.json` | نیازمند تصمیم |
| N-05 | Icons | `metadata/icons.json` + `assets/icons/` + گالری اختیاری؛ آیکون فقط در صورت وجود کامپوننت Figma وارد registry شود | نیازمند تأیید |
| N-06 | Proposed tokens | فقط در `decisions.json`؛ بدون CSS؛ در صورت نیاز `metadata/proposed-tokens.json` | نیازمند تأیید |
| N-07 | `components.css` | فقط استایل بصری با token؛ ابعاد ساختاری literal فقط با شاهد Figma؛ layout در رفرنس | نیازمند تأیید |
| N-08 | Reference contract | CSS مشترک + data attributes + `componentMatch` + fallback بصری | نیازمند تأیید |
| N-09 | Manifest | اسکیمای کامل، inventory، capabilities، validation summary، assets، limitations؛ بدون self-hash | نیازمند تأیید |
| N-10 | Component depth | همه واریانت‌های واقعی، properties، states، nested/override/slot؛ preview اختیاری؛ وضعیت partial صریح | نیازمند تأیید |
| N-11 | Assets/Remote/Determinism | index دارایی + مجوز؛ remote stub؛ ترتیب پایدار؛ سقف حجم | نیازمند تأیید |
| N-12 | Versioning/Migration | `schemaVersion` هر فایل + `packageFormatVersion`؛ مهاجرت تدریجی و سازگاری یک نسخه | نیازمند تأیید |
| N-13 | تفکیک سه سند | `SKILL.md` ناوبری، `ai-control.md` کنترل رفتار، `design.md` قواعد پروژه؛ تست عدم تکرار | نیازمند تأیید |
| N-14 | Index minimal | `components/index.json` فقط ناوبری؛ `component.json` منبع؛ اعتبارسنجی سازگاری | نیازمند تأیید |

### ۶.۱. نمونه `component.json`

```json
{
  "schemaVersion": "1.0.0",
  "id": "component:fileKey:123:456",
  "name": "Button",
  "slug": "button",
  "kind": "component-set",
  "source": {
    "provider": "figma",
    "fileKey": "fileKey",
    "nodeId": "123:456",
    "remote": false
  },
  "description": "Primary action button.",
  "defaultVariantId": "variant:component:fileKey:123:456:789:012",
  "variants": [
    {
      "id": "variant:component:fileKey:123:456:789:012",
      "name": "Type=Primary, Size=M",
      "properties": {
        "Type": "Primary",
        "Size": "M"
      },
      "width": 120,
      "height": 40,
      "cssClass": "ds-button--primary-m",
      "preview": true
    }
  ],
  "properties": [
    {
      "name": "Type",
      "type": "VARIANT",
      "default": "Primary",
      "options": ["Primary", "Secondary"]
    }
  ],
  "states": ["Default", "Hover", "Disabled"],
  "tokens": [
    {
      "property": "background-color",
      "tokenId": "token:collectionId:variableId",
      "source": "variable"
    }
  ],
  "dependencies": [
    {
      "componentId": "component:fileKey:123:999",
      "kind": "nested-instance",
      "slot": null
    }
  ],
  "css": {
    "class": "ds-button",
    "file": "components.css"
  },
  "usedIn": ["reference:fileKey:111:222"],
  "evidence": [
    {
      "type": "figma-node",
      "nodeId": "123:456"
    }
  ],
  "extractionStatus": "complete",
  "warnings": []
}
```

نکته: `id` یک رشته مبهم است؛ هیچ مصرف‌کننده‌ای نباید آن را با split کردن پارس کند. حل هویت از `source` انجام می‌شود.

### ۶.۲. نمونه `components/index.json`

```json
{
  "schemaVersion": "1.0.0",
  "components": [
    {
      "id": "component:fileKey:123:456",
      "name": "Button",
      "slug": "button",
      "kind": "component-set",
      "path": "components/button/component.json",
      "usagePath": "components/button/usage.md",
      "previewPath": "components/button/preview.html",
      "source": {
        "fileKey": "fileKey",
        "nodeId": "123:456",
        "remote": false
      },
      "variants": 3,
      "properties": ["Type", "Size"],
      "states": ["Default", "Hover", "Disabled"],
      "tokenIds": ["token:collectionId:variableId"],
      "dependencies": ["component:fileKey:123:999"],
      "usedIn": ["reference:fileKey:111:222"],
      "extractionStatus": "complete",
      "warnings": []
    }
  ]
}
```

`components/index.json` یک نمای ناوبری است. اگر `tokenIds` یا `usedIn` با `component.json` اختلاف داشت، اعتبارسنجی باید خطا بدهد.

### ۶.۳. نمونه `references/index.json`

```json
{
  "schemaVersion": "1.0.0",
  "references": [
    {
      "id": "reference:fileKey:111:222",
      "name": "Dashboard",
      "page": "Screens",
      "frameId": "111:222",
      "path": "references/dashboard.html",
      "width": 1440,
      "height": 1024,
      "nodes": 412,
      "truncated": false,
      "rtl": false,
      "modes": ["light", "dark"],
      "componentIds": ["component:fileKey:123:456"],
      "tokenIds": ["token:collectionId:variableId"],
      "tags": ["dashboard", "overview"],
      "summary": "Main dashboard with KPI cards and a data table.",
      "assets": ["assets/images/chart.png"],
      "extractionStatus": "complete",
      "warnings": []
    }
  ]
}
```

این ساختار فیلدهای Q-35 را پوشش می‌دهد: نوع صفحه، تگ‌ها، شناسه کامپوننت‌ها، شناسه توکن‌ها، modeها، خلاصه و مسیر فایل.

### ۶.۴. نمونه `metadata/decisions.json`

```json
{
  "schemaVersion": "1.0.0",
  "rules": [
    {
      "id": "rule:9f2c1a",
      "statement": "Use semantic color tokens for surfaces.",
      "scope": {
        "type": "global",
        "ids": []
      },
      "enforcement": "should",
      "evidenceStatus": "confirmed",
      "approvalStatus": "approved",
      "confidence": 0.95,
      "evidenceIds": ["evidence:1a2b3c"],
      "method": "figma-binding",
      "exceptions": [],
      "fingerprint": "sha256:...",
      "updatedAt": "2026-10-27T00:00:00Z"
    }
  ],
  "evidence": [
    {
      "id": "evidence:1a2b3c",
      "source": {
        "type": "figma-variable",
        "fileKey": "fileKey",
        "nodeId": "123:456"
      },
      "location": "components/button/component.json#/tokens/0",
      "observedValue": "token:collectionId:variableId",
      "method": "direct-binding"
    }
  ],
  "approvals": [
    {
      "target": "rule:9f2c1a",
      "decision": "approved",
      "approvedBy": "local-user",
      "approvedAt": "2026-10-27T00:00:00Z",
      "sourceFingerprint": "sha256:...",
      "status": "current"
    }
  ],
  "proposals": [
    {
      "id": "proposal:token:surface-raised",
      "type": "token",
      "name": "--color-surface-raised",
      "value": "#ffffff",
      "reason": "Observed in 4 cards without a token.",
      "evidenceIds": ["evidence:1a2b3c"],
      "status": "proposed"
    }
  ],
  "conflicts": []
}
```

`approvalStatus` وضعیت جاری است و از آخرین `approvals[]` مشتق می‌شود؛ تاریخچه در آرایه می‌ماند. اگر fingerprint منبع تغییر کند، وضعیت باید `stale` شود.

### ۶.۵. نمونه `manifest.json`

```json
{
  "schemaVersion": "2.0.0",
  "packageFormat": "global-design-system",
  "generator": {
    "name": "Global Design System",
    "version": "1.0.0"
  },
  "generatedAt": "2026-10-27T00:00:00Z",
  "source": {
    "provider": "figma",
    "fileKey": "fileKey",
    "fileName": "Product Design",
    "pages": ["Screens", "Components"]
  },
  "scope": {
    "mode": "full",
    "tokens": 128,
    "components": 24,
    "references": 6
  },
  "entrypoints": {
    "agent": "SKILL.md",
    "design": "design.md",
    "control": "ai-control.md"
  },
  "capabilities": {
    "tokens": true,
    "aliases": true,
    "modes": true,
    "components": true,
    "variants": true,
    "references": true,
    "sharedCss": true,
    "previews": true,
    "assets": true,
    "visualValidation": false
  },
  "files": [
    {
      "path": "tokens.css",
      "role": "tokens",
      "bytes": 12034,
      "sha256": "..."
    }
  ],
  "validation": {
    "status": "warn",
    "errors": 0,
    "warnings": 3,
    "checks": 14,
    "coverage": {
      "variableBindings": 0.82,
      "references": 6,
      "components": 24
    },
    "limitations": ["Remote library components are not exported."],
    "report": "metadata/validation.json"
  },
  "assets": [
    {
      "path": "assets/fonts/Vazirmatn.woff2",
      "kind": "font",
      "license": "OFL-1.1",
      "source": "user",
      "usedBy": ["references/dashboard.html"]
    }
  ],
  "warnings": ["2 components have partial extraction."],
  "hash": {
    "algorithm": "sha256",
    "excludes": ["manifest.json"]
  }
}
```

### ۶.۶. نمونه `metadata/token-map.json`

```json
{
  "schemaVersion": "1.0.0",
  "tokens": [
    {
      "tokenId": "token:collectionId:variableId",
      "figmaName": "color/action/primary",
      "cssVar": "--color-action-primary",
      "type": "COLOR",
      "collection": "Semantic",
      "modes": {
        "light": {
          "value": "#0A7AFF",
          "aliasOf": null
        },
        "dark": {
          "value": "#3B9CFF",
          "aliasOf": null
        }
      },
      "aliases": [],
      "status": "direct",
      "usedBy": ["component:fileKey:123:456"]
    }
  ],
  "valueMatches": [
    {
      "value": "#0A7AFF",
      "property": "background-color",
      "candidates": ["token:collectionId:variableId"],
      "status": "ambiguous",
      "selected": null
    }
  ],
  "unmapped": [
    {
      "value": "#F5F5F5",
      "property": "background-color",
      "source": {
        "type": "figma-node",
        "fileKey": "fileKey",
        "nodeId": "123:456"
      },
      "status": "unmapped"
    }
  ]
}
```

وضعیت‌های مجاز نگاشت: `direct`، `style`، `alias`، `value-match`، `ambiguous`، `derived`، `proposed`، `unmapped`.

---

## ۷. نقشه مهاجرت پیشنهادی

| فاز | کار اصلی | خروجی | معیار پذیرش |
|---|---|---|---|
| ۰ | تثبیت قراردادها | تصویب N-01..N-14؛ JSON Schemaها؛ جدول مهاجرت | همه فایل‌های جدید schema دارند؛ P0 باز نیست |
| ۱ | Canonical Model و IDs | موجودیت‌های منبع، توکن، استایل، کامپوننت، واریانت، رفرنس، رابطه، شاهد، تأیید | خروجی فعلی از مدل جدید بازتولید شود یا اختلاف مستند شود |
| ۲ | لایه توکن | `tokens.css`، `token-map.json`، `decisions.json` اولیه | alias، mode، collision، unmapped و proposed تست شوند |
| ۳ | لایه کامپوننت | Component IR؛ `component.json`، `index.json`، `usage.md`، `components.css` | کامپوننت بدون استفاده در رفرنس هم صادر شود؛ واریانت‌ها و وضعیت partial ثبت شوند |
| ۴ | لایه رفرنس | `references/index.json`؛ HTML با CSS مشترک و data attributes | کامپوننت مشترک در دو رفرنس به یک ID اشاره کند؛ وفاداری بصری حفظ شود |
| ۵ | اسناد ریشه و پکیج | `SKILL.md`، `ai-control.md`، `design.md`، `manifest.json`؛ حذف فایل‌های قدیمی | هیچ ارجاع شکسته‌ای نماند؛ ساختار پکیج مطابق هدف باشد |
| ۶ | اعتبارسنجی | validation ساختاری، طراحی و بصری؛ `metadata/validation.json` | خطاهای بحرانی مانع خروجی شوند؛ هشدارها قابل ردیابی باشند |
| ۷ | UI، مستندات، مهاجرت | نمای پکیج در UI؛ به‌روزرسانی docs/tests؛ راهنمای مهاجرت | خروجی واقعی Figma در ZIP باز شود و Agent بتواند از `SKILL.md` شروع کند |

**قانون ترتیب:** فاز ۳ نباید قبل از فاز ۱ شروع شود؛ Component IR به ID پایدار و مدل مرجع وابسته است. فاز ۴ نباید قبل از فاز ۳ شروع شود؛ رفرنس مشترک به `components.css` و identity کامپوننت نیاز دارد.

---

## ۸. تست‌های پذیرش

| # | سناریو | انتظار |
|---|---|---|
| ۱ | فایل بدون کامپوننت | `components/index.json` با آرایه خالی؛ پوشه کامپوننت ساخته نشود |
| ۲ | کامپوننتی که در هیچ رفرنسی نیست | همچنان در `components/` صادر شود |
| ۳ | یک کامپوننت در دو رفرنس | یک `component.json`؛ دو `usedIn` |
| ۴ | دو کامپوننت با نام یکسان | slug یکتا با پسوند کوتاه ID؛ IDها پایدار |
| ۵ | زنجیره alias توکن | `tokens.css` از `var()` استفاده کند؛ `token-map` زنجیره را حفظ کند |
| ۶ | چند mode | `[data-theme]` درست تولید شود؛ رفرنس قابل سوییچ باشد |
| ۷ | رنگ بدون توکن | `unmapped` ثبت شود؛ توکن ساختگی ساخته نشود |
| ۸ | تطبیق مقدار مبهم | `candidates` ثبت شود؛ انتخاب خودکار انجام نشود |
| ۹ | توکن مشتق‌شده | `status: derived`؛ وارد مجموعه رسمی نشود |
| ۱۰ | خاموش بودن validation | `validation.md` وجود نداشته باشد؛ `manifest.validation.status` صریح باشد |
| ۱۱ | خطای ساختاری بحرانی | خروجی متوقف شود یا `manifest.validation.status: fail` ثبت شود |
| ۱۲ | رفرنس بزرگ و truncated | `truncated: true` در index؛ هشدار در manifest |
| ۱۳ | کامپوننت remote | stub با `remote-unavailable`؛ ادعای پوشش کامل نشود |
| ۱۴ | رفرنس RTL | `dir="rtl"`؛ فونت و data attributes درست |
| ۱۵ | فونت سفارشی گم‌شده | هشدار دارایی؛ fallback؛ manifest limitation |
| ۱۶ | preview خاموش | `previewPath: null`؛ هیچ لینک شکسته‌ای نباشد |
| ۱۷ | ZIP با مسیرهای تودرتو و فایل باینری | استخراج سالم؛ UTF-8 درست |
| ۱۸ | Determinism | هش فایل‌ها به‌جز manifest یکسان باشد |
| ۱۹ | اعتبارسنجی JSON Schema | همه فایل‌های JSON معتبر باشند |
| ۲۰ | مصرف Context | `SKILL.md` مسیر مطالعه کم‌حجم را نشان دهد؛ اندازه در benchmark ثبت شود |

---

## ۹. سند جدید چه سؤالاتی را پاسخ می‌دهد؟

### پاسخ قطعی یا قابل استخراج

- Q-22: فایل‌های کامپوننت (`component.json`، `usage.md`، `preview.html`).
- Q-26: منبع حقیقت (`tokens.css`، `components/`، `references/`، `decisions.json`).
- Q-27: نقش اسناد؛ اما با برگشت تصمیم `ai-control.md`.
- Q-28: الزام بررسی کد فعلی.
- Q-29: جدول مهاجرت؛ اما بدون نسخه‌بندی و سازگاری.
- Q-30: یک پکیج برای هر فایل Figma و مصرف on-demand؛ بدون size budget.
- Q-31: اعتبارسنجی در موتور و خلاصه در manifest؛ بدون تفکیک کامل structural/design/visual.
- Q-35: `references/index.json`؛ اما بدون فهرست فیلدها.

### نیازمند قرارداد (پاسخ در سند جدید نیست)

- Q-06: استراتژی ID پایدار.
- Q-07: اسکیمای Canonical Model.
- Q-08: مدل‌سازی واریانت و property.
- Q-09: detached instance، override، nested instance، slot.
- Q-11: اولویت اتصال Variable/Style و تطبیق مقدار.
- Q-12: alias، mode و توکن ترکیبی.
- Q-14: وضعیت توکن مشتق‌شده.
- Q-16..Q-20: سه محور، fingerprint، confidence، Evidence Record.
- Q-21/Q-23: قرارداد رفرنس hybrid و اولویت وفاداری بصری.
- Q-24: تفکیک default/override/nested/slot.
- Q-25: حالت‌ها و modeها در رفرنس، مجوز دارایی.

### خارج از دامنه این سند

- Q-01..Q-05: Agent هدف، دامنه فایل، offline/team، خروجی اصلی.
- Q-10: ادغام کامپوننت‌های مشابه.
- Q-13: مقدار مبهم و حذف نشدن مقدار خام.
- Q-15: نام نمایشی و slug.
- Q-32..Q-34: baseline بصری، threshold، lint score.
- Q-36..Q-41: Creative Freedom، پیشنهاد AI، عملکرد، امنیت، RTL/a11y، workflow تأیید.

**نتیجه:** این سند حدود ۸ تصمیم ساختاری را قطعی می‌کند، چند مورد را سطحی لمس می‌کند، و بقیه را به سند پاسخ‌های قبلی و قراردادهای جدید وامی‌گذارد. بنابراین جایگزین سند پاسخ‌ها نیست؛ مکمل آن است.

---

## ۱۰. تصمیم‌های فوری قبل از کدنویسی

- [ ] **N-01** گرامر ID پایدار تأیید شود.
- [ ] **N-02** `decisions.json` به Rule Registry کامل با سه محور تبدیل شود.
- [ ] **N-03** `metadata/validation.json` + خلاصه manifest تأیید شود.
- [ ] **N-04** جای `content.md` مشخص شود (حفظ اختیاری یا ادغام هدفمند).
- [ ] **N-05** جای آیکون‌ها مشخص شود.
- [ ] **N-06** سیاست توکن پیشنهادی نهایی شود.
- [ ] **N-07** دامنه `components.css` و ابعاد ساختاری حل شود.
- [ ] **N-08** قرارداد رفرنس hybrid تأیید شود.
- [ ] **N-09** اسکیمای manifest و Self-Hash تأیید شود.
- [ ] **N-10** عمق استخراج کامپوننت و preview در MVP مشخص شود.
- [ ] **N-11** assets، remote، determinism و size budget تأیید شود.
- [ ] **N-12** نسخه‌بندی و مهاجرت تأیید شود.
- [ ] **N-13** تفکیک `SKILL.md` / `ai-control.md` / `design.md` تأیید شود.
- [ ] **N-14** index ناوبری و قاعده عدم تکرار تأیید شود.

**حداقل برای شروع فاز ۱:** N-01، N-02، N-03، N-06، N-09، N-10، N-12.

---

## ۱۱. جمع‌بندی

سند جدید یک قدم درست است: پکیج را از مدل داخلی جدا می‌کند، فایل‌های تکراری را حذف می‌کند، و `components/` و `references/` را به‌عنوان دو نوع داده مستقل نگه می‌دارد. این تصمیم‌ها با اصل «مدل داده مشترک» و «عدم تکرار» سازگارند.

اما سند هنوز یک **معماری هدف** است، نه یک **قرارداد پیاده‌سازی**. سه چیز قبل از کد باید اضافه شود:

1. **JSON Schema برای همه فایل‌های جدید**، به‌ویژه `component.json` و `decisions.json`.
2. **Rule Registry و Evidence Record**، تا `decisions.json` به یک ظرف بدون ساختار تبدیل نشود.
3. **تصمیم درباره داده‌های گم‌شده**: `content.md`، آیکون‌ها، توکن پیشنهادی، و گزارش کامل validation.

اگر بخواهیم ریسک اصلی را در یک جمله بگوییم: پکیج جدید وعده `components/` ساختاریافته می‌دهد، اما موتور فعلی فقط پوسته واریانت پیش‌فرض را استخراج می‌کند. این شکاف باید اول حل شود، وگرنه بقیه ساختار روی داده ناقص سوار می‌شود.

**گام بعدی پیشنهادی:** تأیید N-01..N-14 → نوشتن schemaها → فاز ۱ (Canonical Model + IDs) بدون تغییر خروجی → سپس Component IR و بازنویسی رفرنس.
