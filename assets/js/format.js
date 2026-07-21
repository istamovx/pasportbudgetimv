/* ==========================================================================
   Formatters — single source for numbers, currency, dates, percent.
   Thousands separator = non-breaking narrow space, decimal = comma.
   e.g. 1 250 468 378,95
   ========================================================================== */
(function (global) {
  "use strict";
  var NBSP = " "; // grouping space

  function num(value, decimals) {
    if (value == null || isNaN(value)) return "—";
    decimals = decimals == null ? 0 : decimals;
    var neg = value < 0;
    var abs = Math.abs(value);
    var fixed = abs.toFixed(decimals);
    var parts = fixed.split(".");
    var intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
    var out = intPart + (parts[1] ? "," + parts[1] : "");
    return (neg ? "−" : "") + out;
  }

  function currency(value, decimals) {
    return num(value, decimals == null ? 0 : decimals) + NBSP + (global.I18N ? I18N.t("common.currency") : "");
  }

  /* Compact for KPI: 1.25 mlrd / 340 mln / 12.4 ming */
  function compact(value) {
    if (value == null || isNaN(value)) return "—";
    var abs = Math.abs(value), neg = value < 0 ? "−" : "";
    var suffixes = [
      { v: 1e9, s: { "uz-latn": "mlrd", "uz-cyrl": "млрд", "ru": "млрд" } },
      { v: 1e6, s: { "uz-latn": "mln", "uz-cyrl": "млн", "ru": "млн" } },
      { v: 1e3, s: { "uz-latn": "ming", "uz-cyrl": "минг", "ru": "тыс." } }
    ];
    var lang = global.I18N ? I18N.current : "uz-latn";
    for (var i = 0; i < suffixes.length; i++) {
      if (abs >= suffixes[i].v) {
        var n = abs / suffixes[i].v;
        return neg + num(n, n < 10 ? 2 : n < 100 ? 1 : 0) + NBSP + suffixes[i].s[lang];
      }
    }
    return neg + num(abs, 0);
  }

  function percent(value, decimals) {
    return num(value, decimals == null ? 1 : decimals) + "%";
  }

  /* date: accepts ISO 'YYYY-MM-DD' -> 'DD.MM.YYYY' */
  function date(iso) {
    if (!iso) return "—";
    var p = String(iso).slice(0, 10).split("-");
    if (p.length !== 3) return iso;
    return p[2] + "." + p[1] + "." + p[0];
  }

  function monthLabel(index) {
    var keys = ["chart.jan", "chart.feb", "chart.mar", "chart.apr", "chart.may", "chart.jun",
      "chart.jul", "chart.aug", "chart.sep", "chart.oct", "chart.nov", "chart.dec"];
    return global.I18N ? I18N.t(keys[index]) : keys[index];
  }

  global.Fmt = {
    num: num, currency: currency, compact: compact,
    percent: percent, date: date, monthLabel: monthLabel, NBSP: NBSP
  };
})(window);
