# E-Pasport Budjet — Tashkilot kabineti (UI/UX redesign)

Davlat "Budjet Passport" tizimining **tashkilot roli** uchun qayta ishlangan
interfeys. Faqat **vanilla HTML / CSS / JavaScript** + **Chart.js** (lokal
vendor). Barcha rang, spacing, radius, typografiya va soyalar Figma "Blue"
dizayn tizimidagi tokenlardan olingan — yangi qiymatlar kiritilmagan.

## Ishga tushirish
Bino talab qilinmaydi. `index.html` faylini brauzerda oching (yoki oddiy
statik server orqali):

```bash
python3 -m http.server 8080   # so'ng http://localhost:8080
```

## Struktura
```
index.html
assets/
  css/
    tokens.css        # Dizayn tokenlari (light/dark) — ranglar Figma JSON'dan generatsiya
    base.css          # Reset + typografiya + layout utilitalari
    components.css    # Qayta ishlatiladigan komponentlar uslublari
    app.css           # Ilova qobig'i: sidebar, header, kartalar, grid
  js/
    i18n.js           # Yagona i18n mexanizmi (uz-latn / uz-cyrl / ru)
    format.js         # Raqam / valyuta / sana / foiz formatteri
    data.js           # Mock data (window.DATA)
    components.js     # EmptyState, DataTable, Tabs, KpiCard, FormField, Drawer, StatusBadge, Segmented
    charts.js         # Chart.js wrapper (dizayn palitrasi, chart↔jadval toggle)
    app.js            # Router + barcha bo'limlar
  img/
    logo.svg          # To'liq logo (symbol + wordmark) — kengaytirilgan sidebar
    symbol.svg        # Symbol/mark — favicon va yig'ilgan (collapsed) sidebar
  vendor/
    chart.umd.js      # Chart.js 4.4.1 (lokal)
data/
  organization.json   # Mock data JSON ko'rinishida (kelajakdagi Admin roli uchun)
```

## Asosiy imkoniyatlar
- **Data vizualizatsiya:** doughnut/pie, grouped/stacked/horizontal bar, line
  (time-series), sparkline KPI'lar, gauge/progress. Har bir chart uchun
  **"Chart ko'rinishi ↔ Jadval ko'rinishi"** toggle (accessibility).
- **i18n (P0):** butun interfeys bitta tilda — uzbek lotin, uzbek kirill, rus.
  Til localStorage'da saqlanadi.
- **Light / Dark mode:** Figma color modes'dan to'liq moslangan, tokenlar orqali.
- **Reusable komponentlar (P0):** yagona EmptyState, responsive DataTable
  (sticky birinchi ustun + sticky-right amallar), scrollable Tabs (overflow
  bug'siz), KpiCard (+ sparkline), FormField (fx/read-only belgilari), Drawer
  (border-box, kesilmaydi), StatusBadge (tokenlardan, tarjima qilingan).
- **Responsiv:** sidebar kichik ekranda drawer, jadvallar/chartlar mobilda buzilmaydi.
- **Yagona formatter:** `1 250 468 378,95` (mingliklar ajratilgan, o'nlik vergul).

## Bo'limlar
Umumiy ma'lumot · Joylashuv · Kadrlar · Moddiy texnik baza · Kommunal ·
Mavjud qarzlar · Tibbiy sug'urta (MIB) · Sog'liqni saqlash.

## Logo / Symbol
- **`assets/img/logo.svg`** — kengaytirilgan sidebar'da ko'rinadigan to'liq logo.
- **`assets/img/symbol.svg`** — favicon sifatida (`index.html` `<link rel="icon">`)
  va sidebar **yig'ilganda (collapsed)** ko'rsatiladigan symbol/mark.
- Sidebar yuqorisidagi tugma orqali yig'iladi/ochiladi; holat localStorage'da
  saqlanadi. Yig'ilganda nav elementlari faqat ikonka + hover tooltip ko'rsatadi.
- O'zingizning brend logotipingizni qo'yish uchun shu ikki SVG faylni almashtiring
  (o'lchamlar: symbol 40×40, logo ~160×40).

## Kelajakdagi Admin roli
Komponentlar plain data obyektlari bilan ishlaydi (global singleton'larsiz),
shu bois multi-tashkilot data'ga oson moslashtiriladi. `data/organization.json`
kelajakda tashkilotlar massiviga aylantirilishi mumkin.

## Dizayn tokenlari xulosasi
- **Brand:** blue (`#155eef`).
- **Radius:** none→2→4→6→8→10→12→16→20→24 / full.
- **Spacing:** 4px shkala (2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48…).
- **Ranglar:** semantik Text / Background / Border / Foreground + Utility
  palitralari (chart uchun `--chart-1..10`).
