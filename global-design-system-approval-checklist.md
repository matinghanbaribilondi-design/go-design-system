# Global Design System — چک‌لیست تأیید تصمیم‌ها

> نسخه: 0.1
> تاریخ: 2026-10-26
> وضعیت: در انتظار تأیید صاحب محصول
> مبنا: پاسخ‌های پیشنهادی به پرسش‌های باز + بررسی معماری
>
> **به‌روزرسانی 2026-10-27:** سند «معماری نهایی پکیج خروجی» برخی تصمیم‌های این چک‌لیست را تغییر داده است. جزئیات و تصمیم‌های جدید در [global-design-system-output-architecture-review.md](global-design-system-output-architecture-review.md) آمده است. موارد متأثر: D-02 (حفظ مستقل `ai-control.md`)، B-09 (انتقال `manifest.json` به ریشه)، B-06/B-07 (ادغام در `metadata/decisions.json`) و حذف `validation.md` از خروجی پیش‌فرض. تصمیم‌های جدید N-01 تا N-14 جایگزین بخشی از Bها هستند و باید قبل از فاز ۲ تأیید شوند.

## نحوه استفاده

- هر ردیف یک تصمیم قابل تأیید است.
- برای هر ردیف یکی از گزینه‌ها را علامت بزن: `☐ تأیید` / `☐ رد` / `☐ نیاز به تغییر`.
- موارد A و B باید قبل از فاز ۲ تعیین تکلیف شوند.
- موارد C به معنی «تأیید موکول شدن» هستند، نه فراموش شدن. برای هرکدام مالک و تاریخ بازگشت لازم است.
- بعد از تأیید، این فایل مبنای ADR-000 و قراردادهای فاز ۲ می‌شود.

## حداقل موارد لازم برای شروع فاز ۲

- همه موارد A
- B-01 تا B-07
- D-01

بدون این‌ها، فاز ۲ (Canonical Model) قابل شروع نیست.

---

## A. تصمیم‌های P0

| ID | تصمیم پیشنهادی | اثر / ریسک | وضعیت |
|---|---|---|---|
| A-01 | هسته مستقل از Agent؛ `SKILL.md` رابط Agent اصلی؛ adapterهای دیگر بعداً. | جلوگیری از وابستگی به یک vendor؛ اما Agent اصلی هنوز نام‌گذاری نشده. | ☐ تأیید ☐ رد ☐ تغییر |
| A-02 | MVP: یک فایل Figma در هر Export؛ همه موجودیت‌های قابل خواندن در دامنه؛ محدودیت remote صریحاً گزارش شود. | دامنه را کنترل می‌کند؛ بدون سقف تعداد، ریسک performance و حجم بسته. | ☐ تأیید ☐ رد ☐ تغییر |
| A-03 | MVP تک‌کاربره و آفلاین؛ تأییدها در `approvals.json` + cache محلی؛ همگام‌سازی تیمی بعداً. | تأییدها پایدار می‌شوند؛ اما هویت کاربر و merge نهایی مشخص نیست. | ☐ تأیید ☐ رد ☐ تغییر |
| A-04 | شناسه‌ها بر اساس نوع موجودیت و منبع؛ نام، slug و عنوان نمایشی شناسه پایدار نیستند. | پایه Registry و Provenance؛ اما فرمت دقیق ID هنوز تعیین نشده. | ☐ تأیید ☐ رد ☐ تغییر |
| A-05 | یک Canonical Schema نسخه‌بندی‌شده و JSON نرمال‌شده برای هر Export. | جلوگیری از دو مدل موازی؛ اما schema واقعی و migration هنوز نوشته نشده. | ☐ تأیید ☐ رد ☐ تغییر |
| A-06 | اتصال Variable و Style مستقل حفظ شود؛ Value Match یکتا فقط پیشنهاد؛ Match مبهم خودکار انتخاب نشود. | از توکن اشتباه جلوگیری می‌کند؛ اما precedence نمایش CSS هنوز مشخص نیست. | ☐ تأیید ☐ رد ☐ تغییر |
| A-07 | Derived Tokenها تا تأیید رسمی، official نیستند؛ `official`، `proposed` و `inferred` جدا باشند. | از توکن ساختگی جلوگیری می‌کند؛ اما نمایش proposed tokenها در خروجی قرارداد ندارد. | ☐ تأیید ☐ رد ☐ تغییر |
| A-08 | وضعیت Rule سه محور مستقل: `evidenceStatus`، `approvalStatus` و `enforcement`. | مدل وضعیت را واقعی می‌کند؛ transition rules هنوز تعریف نشده. | ☐ تأیید ☐ رد ☐ تغییر |
| A-09 | تأیید توسط کاربر، با ثبت target، تصمیم، زمان و fingerprint منبع؛ مدل تیمی بعداً. | audit trail ساده و قابل انتقال؛ اما schema فایل و cache مشخص نیست. | ☐ تأیید ☐ رد ☐ تغییر |
| A-10 | Reference Rendering ترکیبی از Shared Tokens، Component Templates و Source-Fidelity Layer. | وفاداری بصری و semantics را ترکیب می‌کند؛ contract v2 هنوز نوشته نشده. | ☐ تأیید ☐ رد ☐ تغییر |
| A-11 | وفاداری بصری حفظ شود؛ تطبیق هویت کامپوننت فقط با شواهد کافی؛ موارد نامطمئن گزارش شوند. | از تطبیق نادرست جلوگیری می‌کند؛ معیار «شواهد کافی» هنوز تعریف نشده. | ☐ تأیید ☐ رد ☐ تغییر |
| A-12 | Figma منبع داده اصلی؛ Canonical Model مدل نرمال‌شده؛ Rule Registry و Approval Records منبع تصمیم‌ها؛ CSS/HTML/Markdown خروجی یا راهنما. | source-of-truth را روشن می‌کند؛ آرتیفکت‌ها و precedence نهایی مشخص نیست. | ☐ تأیید ☐ رد ☐ تغییر |
| A-13 | اعتبارسنجی Schema و روابط در پلاگین؛ تست مرورگر و مقایسه بصری در CI با Playwright. | وعده غیرقابل اجرا را حذف می‌کند؛ ابزار و آستانه هنوز تعیین نشده. | ☐ تأیید ☐ رد ☐ تغییر |

---

## B. قراردادهای پیشنهادی

این موارد پاسخ‌های مفهومی را به قرارداد فنی تبدیل می‌کنند. پیش‌فرض پیشنهادی من در ستون دوم است.

| ID | پیش‌فرض پیشنهادی | جایگزین | وضعیت |
|---|---|---|---|
| B-01 | گرامر ID: `node:<fileKey>:<nodeId>`، `component:<componentKey>`، `componentSet:<componentSetKey>`، `variant:<componentKey>:<variantHash>`، `token:<collectionId>:<variableId>`، `style:<styleId>`. rename پایدار؛ delete با tombstone؛ duplicate با ID جدید. | UUID تصادفی برای همه موجودیت‌ها | ☐ تأیید ☐ رد ☐ تغییر |
| B-02 | هر binding یک شیء `projection` داشته باشد: `{cssValue, source, tokenId, candidates, confidence}`. precedence: `Variable > Style > unique value match > raw`. | حذف value match در MVP و استفاده فقط از binding مستقیم | ☐ تأیید ☐ رد ☐ تغییر |
| B-03 | توکن‌های proposed در `tokens.proposed.json` و `tokens.proposed.css` جدا باشند و به‌صورت پیش‌فرض لود نشوند؛ کامپوننت‌ها مقدار خام + `data-token-status="proposed"` داشته باشند. | قرار دادن proposedها در `tokens.css` با کامنت | ☐ تأیید ☐ رد ☐ تغییر |
| B-04 | Collision با suffix پایدار بر اساس ID حل شود: `--text-h-1--<shortId>` و `.text-h-1--<shortId>`؛ validation در صورت collision حل‌نشده fail کند. | شکست کامل generation در صورت collision | ☐ تأیید ☐ رد ☐ تغییر |
| B-05 | قرارداد Reference v2: `componentMatch` با حالت‌های `exact / partial / none / ambiguous`؛ ویژگی‌های `data-node-id`، `data-component-key`، `data-component-set-key`، `data-variant`، `data-source`، `data-confidence`، `data-token-ref`؛ fallback: template → visual render → raw render. | Reference فقط بصری، بدون هویت کامپوننت | ☐ تأیید ☐ رد ☐ تغییر |
| B-06 | فایل `metadata/approvals.json` با schema مشخص، `targetFingerprint`، تاریخ، کاربر و تصمیم؛ cache محلی؛ تأیید stale به‌عنوان approved استفاده نشود. | فقط `figma.clientStorage` بدون فایل قابل انتقال | ☐ تأیید ☐ رد ☐ تغییر |
| B-07 | `rules.json` منبع تصمیم‌های تأییدشده باشد؛ `design.md` یک projection با بخش‌های curated و marker باشد، یا یک `design.curated.md` جدا داشته باشد. | `design.md` کاملاً generated و بدون ویرایش انسانی | ☐ تأیید ☐ رد ☐ تغییر |
| B-08 | Creative Freedom سه سطح: `F0` فقط استفاده، `F1` ترکیب با پیشنهاد فقط به‌صورت annotation، `F2` طراحی جدید با توکن/کامپوننت فقط به‌صورت proposal. پیش‌فرض MVP: Adherence 8 و `F1`. | یک اسلایدر Adherence بدون محور Freedom | ☐ تأیید ☐ رد ☐ تغییر |
| B-09 | `manifest.json` به‌عنوان entry point بی‌طرف با فهرست فایل‌ها، نقش، نسخه و hash؛ `SKILL.md` فقط adapter برای Agent اصلی. | فقط `SKILL.md` به‌عنوان entry point | ☐ تأیید ☐ رد ☐ تغییر |
| B-10 | سقف‌های MVP برای صفحه، کامپوننت، رفرنس، node و asset؛ remote component غیرقابل‌خواندن با `extractionStatus: remote-unavailable` و usage metadata ثبت شود. | بدون سقف در MVP و اتکا به Benchmark بعدی | ☐ تأیید ☐ رد ☐ تغییر |

---

## C. موارد موکول‌شده

تأیید این بخش یعنی «موکول شدن با شرط بازگشت» پذیرفته شده است، نه فراموش شدن.

| ID | مورد | موکول به | شرط بازگشت | وضعیت |
|---|---|---|---|---|
| C-01 | خروجی‌های React / SwiftUI / Specification | بعد از تثبیت بسته MVP | Canonical Schema v1 تأیید شود | ☐ تأیید ☐ رد ☐ تغییر |
| C-02 | نگاشت فایل‌های فعلی (keep / merge / move) | بعد از audit کد | گزارش audit تأیید شود | ☐ تأیید ☐ رد ☐ تغییر |
| C-03 | جدول مهاجرت و backward compatibility | بعد از Package Spec | Package Spec تأیید شود | ☐ تأیید ☐ رد ☐ تغییر |
| C-04 | بودجه حجم و تعداد رفرنس‌ها | بعد از Benchmark | Baseline عملکرد ثبت شود | ☐ تأیید ☐ رد ☐ تغییر |
| C-05 | آستانه Pass/Fail بصری | بعد از Benchmark | Playwright harness آماده شود | ☐ تأیید ☐ رد ☐ تغییر |
| C-06 | سقف‌های عددی performance | بعد از Vertical Slice | مسیر end-to-end اجرا شود | ☐ تأیید ☐ رد ☐ تغییر |
| C-07 | جزئیات سیاست لایسنس asset | بعد از بررسی حقوقی | پیش‌نویس policy آماده شود | ☐ تأیید ☐ رد ☐ تغییر |
| C-08 | جزئیات Accessibility / RTL / Permissionها | بعد از Canonical Model v1 | schema مدل تأیید شود | ☐ تأیید ☐ رد ☐ تغییر |

نکته: C-08 فقط جزئیات را موکول می‌کند؛ **لحاظ کردن RTL، a11y و permissionها در مدل و تست‌ها از همین ابتدا الزامی است.**

---

## D. تصمیم‌های باز

### D-01 — Agent اصلی MVP

- **گزینه‌ها:** Claude / Cursor / یک agent عمومی / چند agent هم‌زمان.
- **پیشنهاد:** Claude به‌عنوان Agent اصلی MVP، به‌همراه `manifest.json` بی‌طرف برای سایر Agentها.
- **چرا:** `SKILL.md` بدون یک Agent مشخص، entry point و رفتار بهینه ندارد.
- **وضعیت:** ☐ تأیید ☐ رد ☐ نیاز به تغییر

### D-02 — سرنوشت `ai-control.md`

- **گزینه‌ها:** حذف کامل / نگه‌داشتن به‌عنوان compatibility alias / ادغام در `design.md` و `SKILL.md`.
- **پیشنهاد:** ادغام قواعد در `design.md` و `SKILL.md`، و نگه‌داشتن `ai-control.md` به‌عنوان stub تا پایان دوره مهاجرت.
- **چرا:** مصرف‌کننده‌های فعلی پکیج نباید یک‌شبه بشکنند.
- **وضعیت:** ☐ تأیید ☐ رد ☐ نیاز به تغییر

### D-03 — رفتار asset بدون مجوز مشخص

- **گزینه‌ها:** حذف کامل / placeholder با وضعیت `license-unknown` / لینک خارجی / جاسازی با هشدار.
- **پیشنهاد:** placeholder + وضعیت `license-unknown`؛ جاسازی خودکار در Self-contained ممنوع.
- **چرا:** جلوگیری از ریسک حقوقی و در عین حال حفظ ساختار رفرنس.
- **وضعیت:** ☐ تأیید ☐ رد ☐ نیاز به تغییر

### D-04 — دامنه نام و محصول

- **گزینه‌ها:** یک فایل Figma در MVP / چند فایل از ابتدا / کتابخانه کامل.
- **پیشنهاد:** MVP یک فایل؛ پشتیبانی multi-file در فاز بعد و با حفظ نام «Global».
- **چرا:** نام محصول ممکن است انتظار multi-file ایجاد کند؛ باید در مستندات صریح شود.
- **وضعیت:** ☐ تأیید ☐ رد ☐ نیاز به تغییر

---

## E. تأیید نهایی

```text
تأییدکننده:
تاریخ:
نسخه سند:

موارد تأییدشده:
موارد ردشده:
موارد نیازمند تغییر:
شرایط تأیید:
```

### بعد از تأیید

- موارد A به ADR-000 و baseline معماری تبدیل می‌شوند.
- موارد B به قراردادهای فاز ۲ تبدیل می‌شوند: ID، Projection، Approval، Reference و Package.
- موارد C با مالک و تاریخ در backlog ثبت می‌شوند.
- اجرای فاز ۲ فقط بعد از تأیید همه A و B-01 تا B-07 و D-01 شروع می‌شود.
