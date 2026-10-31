# پیشنهاد قرارداد فونت و Asset (D7)

وضعیت: **Proposed — نیازمند تأیید**

## شواهد فعلی

- Manifest اکنون `dependencies.external` را برای Google Font، فونت سفارشی و Component خارجی ثبت می‌کند و Assetهای استخراج‌شده در `dependencies.bundledAssets` قرار می‌گیرند.
- هیچ فایل فونتی بسته‌بندی نمی‌شود و هیچ ادعای مجوز یا Fingerprint فونت وجود ندارد.
- `fig-engine` HTML و CSS می‌دهد؛ Plugin API فایل فونت قابل‌دانلود ارائه نمی‌دهد.
- Verify پکیج وجود فایل Assetهای ثبت‌شده و لینک‌های محلی را بررسی می‌کند، اما مجوز فونت را نمی‌تواند اثبات کند.

## گزینه‌ها

1. **فقط `manifest.json`:** کمترین فایل را دارد اما فهرست کامل Font/Asset و مجوزها Manifest را سنگین می‌کند.
2. **فقط `assets/index.json`:** فهرست کامل و مستقل دارد اما Manifest برای ناوبری خلاصه اطلاعات Asset خالی می‌ماند.
3. **هر دو:** `assets/index.json` منبع کامل و Manifest فقط شمارش/اشاره. سازگاری بیشتری دارد اما ریسک تکرار و واگرایی دارد.

## پیشنهاد

گزینه ۳ با منبع حقیقت واحد:

- `assets/index.json`: فهرست کامل فونت‌ها و Assetها.
- `manifest.json.dependencies`: فقط شمارش و مسیر `assets/index.json`؛ بدون تکرار جزئیات مجوز.
- فقط اگر Font/Asset وجود داشته باشد فایل تولید شود.

### Schema پیشنهادی `assets/index.json`

```json
{
  "schemaVersion": "1.0.0",
  "fonts": [
    {
      "id": "font:Inter",
      "name": "Inter",
      "status": "google",
      "source": "text-style",
      "path": null,
      "license": { "status": "not-applicable", "spdx": "OFL-1.1", "evidence": "Google Fonts" },
      "fingerprint": null,
      "weights": [400, 700],
      "usedBy": ["Heading/H1"]
    }
  ],
  "assets": [
    {
      "id": "asset:abc",
      "kind": "figma-image",
      "path": "reference/assets/abc.png",
      "sourceReference": "Home",
      "license": { "status": "unknown", "spdx": null, "evidence": null },
      "fingerprint": "fnv1a32-dual:..."
    }
  ]
}
```

### وضعیت‌های الزامی فونت

| Status | معنا | Path | Fingerprint | مجاز به بسته‌بندی |
|---|---|---|---|---|
| `google` | وابستگی Google Fonts | null | null | خیر؛ Dependency خارجی |
| `custom-missing` | فونت سفارشی استفاده شده اما فایل ارائه نشده | null | null | خیر؛ باید اعلام شود |
| `unknown-license` | فایل هست اما مجوز تأیید نشده | فایل | دارد | خیر تا تأیید مجوز |
| `bundled` | فایل ارائه‌شده و مجوز تأییدشده | فایل | دارد | بله |

### قواعد Validation

- `bundled` بدون Path موجود یا Fingerprint معتبر: Error.
- `bundled` با مجوز `unknown` یا بدون Evidence: Error.
- `unknown-license` نباید به‌عنوان مجاز بسته‌بندی شود.
- `custom-missing` نباید Path یا Fingerprint ادعا کند.
- `google` باید Dependency خارجی باشد.
- Fingerprint فقط از محتوای واقعی؛ هیچ مقدار ساختگی مجاز نیست.
- Assetهای ثبت‌شده باید در ZIP موجود باشند.

## اثر مهاجرت

- افزودن یک فایل خروجی Tier 1، یک Schema توسعه و به‌روزرسانی Golden/ZIP.
- Manifest فعلی افزودنی می‌ماند؛ `dependencies.bundledAssets` می‌تواند پس از تأیید به شمارش/اشاره تبدیل شود.
- هیچ مسیر موجود Reference تغییر نمی‌کند.
- بدون Workflow دریافت فایل فونت و تأیید مجوز، وضعیت `bundled` نباید تولید شود.

## Blocker

- Privacy/حقوقی باید سیاست مجوز را تأیید کند.
- Workflow دریافت فونت مجاز و تأیید مجوز وجود ندارد.
- Figma Plugin API فایل فونت ارائه نمی‌دهد؛ هیچ استخراج خودکار نباید ادعا شود.

تا تأیید، Manifest فقط Dependencyهای قابل‌مشاهده و Assetهای واقعاً بسته‌بندی‌شده را ثبت می‌کند و Verify مجوز را ادعا نمی‌کند.
