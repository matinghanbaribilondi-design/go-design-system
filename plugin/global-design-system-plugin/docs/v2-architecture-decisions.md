# گزارش تصمیم‌های معماری v2.0

تاریخ: 2026-10-28

**به‌روزرسانی تأییدها:** D1 (Export یک‌طرفه)، D2 (شش سطح)، D3 (هر دو حالت CSS)، مسیر `reference/` در D4، D5 (Schema در پکیج توسعه) و D6 (خارج‌بودن `content.md` از default) تأیید و اعمال شدند. D7 همچنان Proposed است؛ پیشنهاد کامل آن در `docs/d7-font-asset-contract-proposal.md` قرار دارد.

## وضعیت فعلی

| تصمیم | وضعیت | اثر اعمال‌شده |
|---|---|---|
| D1 | Approved | `build()` رنگ‌محور و Experimental؛ محصول Export یک‌طرفه |
| D2 | Approved | شش سطح 0–5؛ نگاشت داخلی 0/2/5/7/9/10 |
| D3 | Approved و تست‌شده | Standalone پیش‌فرض؛ Shared با fallback |
| D4 | مسیر Approved؛ ساختار ساده انتخاب شد | `reference/index.json` Canonical؛ بدون پوشه‌های خالی source/generated |
| D5 | Approved | Schemaها در پکیج توسعه ماندند |
| D6 | Approved | `content.md` از default خارج شد؛ Context در `design.md` |
| D7 | Proposed | بدون فیلد عمومی مجوز تا تأیید |

بخش‌های زیر سابقه گزینه‌ها و اثرهای مهاجرت را نگه می‌دارند.

## D1. محصول Export یک‌طرفه است یا Compiler دوطرفه؟

- **گزینه‌ها:** Export یک‌طرفه؛ Compiler دوطرفه؛ Export با قابلیت Import آزمایشی.
- **وضعیت کد:** خروجی Figma → پکیج کامل است. `build()` فقط رنگ‌ها را با `figma.variables.createVariable` می‌سازد و Import کامل Component، Token، Variant یا Structure نیست.
- **پیامدها:** اگر Export باشد، `build()` باید Stub حذف یا Experimental علامت‌گذاری شود. اگر Compiler باشد، باید قرارداد Import، تعارض‌ها، شناسه‌ها و Migration طراحی و پیاده‌سازی شود.
- **اثر مهاجرت:** Export یک‌طرفه اثر مهاجرت کمی دارد. Compiler نیازمند مدل Canonical قابل‌نوشتن، Diff، Rollback و تست Import است.
- **تصمیم و پیاده‌سازی:** Export یک‌طرفه قرارداد عمومی است. پیام `build` با `status: experimental`، `direction: export-only` و `capability: colors-only` پاسخ می‌دهد؛ UI هیچ Workflow Import ندارد. هیچ Compiler دوطرفه‌ای در این Scope ساخته نشد.
- **وضعیت:** Approved and implemented.

## D2. مدل نهایی `ai-control.md`

- **تصمیم تأییدشده:** شش سطح UI با آزادی خلاقیت 0/20/40/60/80/100.
- **پیاده‌سازی:** نگاشت داخلی `0/2/5/7/9/10` حفظ شد و در `ai-control.md` مستند شد. درصدها آزادی طراحی‌اند، نه احتمال پیروی از قواعد؛ محدودیت‌های سخت در همهٔ سطوح اجباری‌اند.
- **وضعیت:** Approved and tested.

## D3. CSS مشترک یا Standalone برای Reference

- **تصمیم:** هر دو حالت، با Standalone به‌عنوان پیش‌فرض.
- **ارزیابی fig-engine:** `exportFrame` بدنه، CSS فریم، متغیرهای استفاده‌شده و Token Map را برمی‌گرداند؛ API لینک‌سازی CSS ندارد. Core می‌تواند با اطمینان `../tokens.css` را به HTML اضافه کند، بنابراین هر دو حالت بدون تغییر Vendor ممکن است.
- **پیاده‌سازی:** گزینهٔ صریح Reference CSS در UI؛ Shared فقط با وجود `tokens.css` و تعریف‌شدن همهٔ متغیرهای استفاده‌شده فعال می‌شود؛ در غیر این صورت Fallback قطعی به Standalone و ثبت دلیل در `reference/index.json.cssMode`.
- **وضعیت:** Approved and tested (paths، token consistency، missing stylesheet، fallback و determinism).

## D4. مسیر Canonical Reference

- **گزینه‌ها:** `reference/`؛ `references/`؛ `references/source-evidence/` و `references/generated-guides/`.
- **وضعیت کد:** مسیر فعلی `reference/` است و Reference Index به‌صورت Nested در `components/index.json` قرار دارد؛ `reference/index.json` مستقل وجود ندارد.
- **پیامدها:** تغییر مسیر همهٔ لینک‌ها، Index، Manifest، تست‌ها و بستهٔ‌های قبلی را تحت تأثیر می‌گذارد.
- **اثر مهاجرت:** Rename + Rewrite تمام مسیرها + سازگاری موقت نسخهٔ قبلی لازم است.
- **پیشنهاد و نتیجه:** `reference/` حفظ شد و `reference/index.json` Canonical اضافه شد.
- **ارزیابی ساختار:** HTMLهای فعلی کاملاً Source Evidence هستند و هیچ Generated Guide در `reference/` تولید نمی‌شود. بنابراین پوشه‌های خالی ایجاد نشد؛ `role: source-evidence-index` و `classification.sourceEvidence` همان تفکیک را در Metadata نگه می‌دارند. `components/index.json.references` فقط Pointer است تا داده تکرار نشود.
- **وضعیت:** Approved and implemented.

## D5. Schemaها و Exampleها داخل پکیج AI یا پکیج توسعه؟

- **گزینه‌ها:** داخل پکیج AI؛ فقط پکیج توسعه؛ هر دو.
- **وضعیت کد:** `schemas/` در مخزن توسعه است و وارد ZIP نمی‌شود. Verify آفلاین این Schemaها را از مخزن می‌خواند.
- **پیامدها:** Schema داخل پکیج به اعتبارسنجی مستقل کمک می‌کند اما Context و اندازهٔ پکیج را زیاد می‌کند. Exampleها برای Agent کاربرد کمی دارند.
- **اثر مهاجرت:** افزودن Schema به ZIP نیازمند مسیر، Manifest و نسخه‌بندی است.
- **تصمیم و پیاده‌سازی:** Schemaهای توسعه در `schemas/` ماندند و وارد ZIP نمی‌شوند. Verify آفلاین از مخزن توسعه به آن‌ها دسترسی دارد؛ Schema هفتم برای `reference/index.json` فقط در پکیج توسعه اضافه شد.
- **وضعیت:** Approved and implemented.

## D6. مسئولیت و حضور تضمین‌شدهٔ `content.md`

- **تصمیم:** `content.md` در Scope جاری نیست و خروجی اجباری/default نیست.
- **پیاده‌سازی:** UI همیشه `ctx: { mode: 'skip' }` می‌فرستد، پس خروجی default فاقد `content.md` و فاقد ارجاع به آن است. Product Context در `design.md > Project Context` باقی می‌ماند.
- **محدودیت شناخته‌شده:** در `src/core.js` مقدار `contentPack` از `cm !== 'skip'` مشتق می‌شود و فلگ مستقل ندارد. یعنی خروجی default تضمین‌شده است، اما هر فراخوان آینده با `mode` غیر از `skip` بی‌درنگ `content.md` تولید می‌کند. برای سخت‌کردن این تضمین، `contentPack` باید فلگ مستقل شود و به `ctxMode` گره نخورد.
- **وضعیت:** Approved and tested.

## D7. قرارداد Canonical فونت و Asset

- **گزینه‌ها:** فایل مستقل `assets/index.json`؛ بخشی از Manifest؛ هر دو؛ فقط Metadata توسعه.
- **وضعیت کد:** Manifest وابستگی‌های خارجی فونت/Component را در `dependencies.external`، Assetهای بسته‌بندی‌شده را در `dependencies.bundledAssets` و فهرست فونت‌های بسته‌بندی‌شده را در `dependencies.bundledFonts` (اجباری در Schema، فعلاً همیشه خالی) ثبت می‌کند. فیلد مجوز، وضعیت فونت سفارشی و Workflow دریافت مجاز فونت وجود ندارد. هیچ فایل فونتی بسته‌بندی نمی‌شود، و `fonts.css` جداگانه‌ای هم ساخته نمی‌شود: قواعد `@font-face` به‌صورت inline در همان Reference HTMLی که فونت سفارشی دارد نوشته می‌شوند.
- **پیامدها:** بسته‌بندی فونت بدون مجوز ریسک حقوقی دارد. Google Fonts وابستگی خارجی است و Custom Font باید `custom-missing` باشد تا کاربر فایل مجاز ارائه کند.
- **اثر مهاجرت:** افزودن Schema، مسیر، وضعیت مجوز، Hash و قواعد Verify لازم است.
- **پیشنهاد:** قرارداد افزودنی شامل `status` با مقادیر `google`، `custom-missing`، `unknown-license`، `bundled` و فیلدهای `source`، `path`، `license`، `fingerprint`. فقط فونت کاربر با مجوز تأییدشده بسته‌بندی شود. جزئیات در `docs/d7-font-asset-contract-proposal.md`.
- **Blocker فعلی:** قرارداد مسیر/مجوز تأیید نشده و هیچ فایل فونت مجاز یا اطلاعات مجوز از کاربر دریافت نشده است.
- **نیازمند تأیید:** بله.

## جمع‌بندی

D1–D6 تأیید و پیاده‌سازی شده‌اند. D7 تنها تصمیم Proposed است. REAL Figma fixture، اجرای واقعی Benchmark و سیاست مجوز فونت/Asset همچنان Blocked هستند.
