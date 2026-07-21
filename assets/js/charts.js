/* ==========================================================================
   Chart helpers — thin wrapper over Chart.js.
   - Colors resolved ONLY from design-system CSS variables (chart palette).
   - Auto re-themes on theme/lang change.
   - ChartCard adds a "Chart view <-> Table view" toggle + EmptyState.
   ========================================================================== */
(function (global) {
  "use strict";
  var UI = global.UI, Fmt = global.Fmt;
  var t = function (k, f) { return global.I18N ? I18N.t(k, f) : (f || k); };
  var registry = []; // {chart, build} for re-theming

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function palette() {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (i) { return cssVar("--chart-" + i); });
  }
  function role(name) { return cssVar("--chart-" + name); }
  function withAlpha(hex, a) {
    hex = (hex || "").trim();
    if (hex[0] !== "#") return hex;
    var n = hex.length === 4
      ? [parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16), parseInt(hex[3] + hex[3], 16)]
      : [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    return "rgba(" + n[0] + "," + n[1] + "," + n[2] + "," + a + ")";
  }

  function baseOptions(extra) {
    var grid = cssVar("--border-secondary");
    var text = cssVar("--text-tertiary");
    var tickFont = { family: cssVar("--font-family-base") || "Inter, sans-serif", size: 12 };
    var o = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: {
          display: true, position: "bottom",
          labels: { color: text, font: tickFont, usePointStyle: true, pointStyle: "circle", boxWidth: 8, padding: 16 }
        },
        tooltip: {
          /* Always a dark tooltip (readable in both light and dark themes) */
          backgroundColor: cssVar("--bg-overlay") || "#0c111d",
          titleColor: "#ffffff",
          bodyColor: "rgba(255,255,255,0.88)",
          borderColor: "rgba(255,255,255,0.10)", borderWidth: 1, padding: 12,
          cornerRadius: 8, titleFont: { family: tickFont.family, weight: "600", size: 13 },
          bodyFont: tickFont, usePointStyle: true, boxPadding: 4,
          callbacks: {}
        }
      },
      scales: {
        x: { grid: { display: false, color: grid }, ticks: { color: text, font: tickFont }, border: { color: grid } },
        y: { grid: { color: grid, drawBorder: false }, ticks: { color: text, font: tickFont, callback: function (v) { return Fmt.num(v, 0); } }, border: { display: false } }
      }
    };
    return deepMerge(o, extra || {});
  }

  function make(canvas, cfg, builder) {
    if (!global.Chart) { console.warn("Chart.js not loaded"); return null; }
    var chart = new global.Chart(canvas.getContext("2d"), cfg);
    registry.push({ chart: chart, canvas: canvas, build: builder });
    return chart;
  }

  /* ---------------- Chart builders (each returns Chart.js config) --------- */

  function doughnut(data) {
    var colors = palette();
    return {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: data.values.map(function (_, i) { return colors[i % colors.length]; }),
          borderColor: cssVar("--bg-primary"), borderWidth: 2, hoverOffset: 6
        }]
      },
      options: baseOptions({
        cutout: "62%",
        scales: { x: { display: false }, y: { display: false } },
        plugins: { tooltip: { callbacks: { label: function (c) {
          var total = c.dataset.data.reduce(function (a, b) { return a + b; }, 0);
          var pct = total ? (c.parsed / total * 100) : 0;
          return " " + c.label + ": " + Fmt.num(c.parsed) + " (" + Fmt.percent(pct) + ")";
        } } } }
      })
    };
  }

  function pie(data) {
    var cfg = doughnut(data); cfg.type = "pie"; cfg.options.cutout = "0%"; return cfg;
  }

  function valueFmt(money) { return money ? function (v) { return Fmt.compact(v); } : function (v) { return Fmt.num(v, 0); }; }
  function tooltipVal(money, v) { return money ? Fmt.currency(v, 0) : Fmt.num(v); }

  function bar(data, opts) {
    opts = opts || {};
    var horiz = !!opts.horizontal;
    var money = !!opts.money;
    var colors = palette();
    var datasets = data.datasets.map(function (ds, i) {
      return {
        label: ds.label, data: ds.values,
        backgroundColor: ds.color ? role(ds.color) : colors[i % colors.length],
        borderRadius: 6, borderSkipped: false, maxBarThickness: 48,
        stack: opts.stacked ? "s" : undefined
      };
    });
    // Category axis renders labels via getLabelForValue; value axis formats numbers.
    var catAxis = horiz ? "y" : "x";
    var valAxis = horiz ? "x" : "y";
    var scales = {};
    scales[catAxis] = { type: "category", stacked: !!opts.stacked, ticks: { callback: function (v) { return this.getLabelForValue(v); } } };
    scales[valAxis] = { stacked: !!opts.stacked, beginAtZero: true, ticks: { callback: valueFmt(money) } };
    return {
      type: "bar",
      data: { labels: data.labels, datasets: datasets },
      options: baseOptions({
        indexAxis: horiz ? "y" : "x",
        scales: scales,
        plugins: {
          legend: { display: data.datasets.length > 1 },
          tooltip: { callbacks: { label: function (c) { return " " + c.dataset.label + ": " + tooltipVal(money, c.parsed[horiz ? "x" : "y"]); } } }
        }
      })
    };
  }

  function line(data, opts) {
    opts = opts || {};
    var money = !!opts.money;
    var colors = palette();
    var datasets = data.datasets.map(function (ds, i) {
      var col = ds.color ? role(ds.color) : colors[i % colors.length];
      return {
        label: ds.label, data: ds.values,
        borderColor: col, backgroundColor: withAlpha(col, 0.12),
        borderWidth: 2, tension: 0.35, fill: !!ds.fill,
        pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: col,
        pointHoverBackgroundColor: col, pointBorderColor: cssVar("--bg-primary"), pointBorderWidth: 2
      };
    });
    return {
      type: "line",
      data: { labels: data.labels, datasets: datasets },
      options: baseOptions({
        scales: {
          x: { type: "category", ticks: { callback: function (v) { return this.getLabelForValue(v); } } },
          y: { beginAtZero: false, ticks: { callback: valueFmt(money) } }
        },
        plugins: { tooltip: { callbacks: { label: function (c) { return " " + c.dataset.label + ": " + tooltipVal(money, c.parsed.y); } } } }
      })
    };
  }

  function sparkline(canvas, values, colorRole) {
    var col = colorRole ? role(colorRole) : role("1");
    return make(canvas, {
      type: "line",
      data: { labels: values.map(function (_, i) { return i; }), datasets: [{
        data: values, borderColor: col, backgroundColor: withAlpha(col, 0.15),
        borderWidth: 2, tension: 0.4, fill: true, pointRadius: 0
      }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { line: { capBezierPoints: true } }
      }
    }, function () { return sparkline; });
  }

  /* ---------------- ChartCard: chart <-> table toggle + empty state -------- */
  /* opts: { title, subtitle, type:'doughnut'|'pie'|'bar'|'line', data, barOpts,
            table:{columns,rows,foot}, height, empty } */
  function ChartCard(opts) {
    opts = opts || {};
    var h = UI.h;
    var isEmpty = !opts.data || (opts.data.values && !opts.data.values.length) ||
      (opts.data.datasets && !opts.data.datasets.length) ||
      (opts.data.labels && !opts.data.labels.length);

    var canvasWrap = h("div", { class: "chart-canvas-wrap" });
    var tableWrap = h("div", { class: "hidden" });
    var body = h("div", { class: "card__body" });

    var headActions = h("div", { class: "card__head-actions" });
    if (opts.onEdit) headActions.appendChild(UI.editButton(opts.onEdit));
    var head = h("div", { class: "card__head" }, [
      h("div", {}, [
        h("div", { class: "card__title", text: opts.title || "" }),
        opts.subtitle ? h("div", { class: "card__subtitle", text: opts.subtitle }) : null
      ]),
      headActions
    ]);

    if (isEmpty) {
      body.appendChild(UI.EmptyState(opts.empty || {}));
      return h("div", { class: "card" }, [head, body]);
    }

    // toggle control
    var view = "chart";
    var toggle = UI.Segmented({
      value: "chart",
      items: [
        { id: "chart", label: t("common.chart_view"), icon: "chart" },
        { id: "table", label: t("common.table_view"), icon: "table" }
      ],
      onChange: function (v) {
        view = v;
        canvasWrap.classList.toggle("hidden", v !== "chart");
        tableWrap.classList.toggle("hidden", v !== "table");
      }
    });
    headActions.appendChild(toggle);

    // canvas
    var height = opts.height || 320;
    var canvas = h("canvas", { role: "img", "aria-label": opts.title || "" });
    var frame = h("div", { class: "chart-frame", style: "height:" + height + "px" }, canvas);
    canvasWrap.appendChild(frame);

    // table (accessible alternative)
    if (opts.table) tableWrap.appendChild(UI.DataTable(opts.table));
    else tableWrap.appendChild(autoTable(opts));

    body.appendChild(canvasWrap);
    body.appendChild(tableWrap);
    var card = h("div", { class: "card" }, [head, body]);

    // Build chart after mount so canvas has dimensions
    requestAnimationFrame(function () {
      var builder = { doughnut: doughnut, pie: pie, bar: bar, line: line }[opts.type] || bar;
      var cfg = opts.type === "bar" ? bar(opts.data, opts.barOpts) : builder(opts.data, opts.barOpts);
      make(canvas, cfg, function () { return opts; });
    });
    return card;
  }

  /* Auto-generate an accessible table from chart data when none supplied */
  function autoTable(opts) {
    var d = opts.data;
    if (d.values) {
      return UI.DataTable({
        columns: [
          { key: "l", label: t("common.name") },
          { key: "v", label: t("common.count"), align: "right", strong: true, render: function (r) { return Fmt.num(r.v); } }
        ],
        rows: d.labels.map(function (l, i) { return { l: l, v: d.values[i] }; })
      });
    }
    var cols = [{ key: "l", label: t("common.category") }];
    d.datasets.forEach(function (ds, i) {
      cols.push({ key: "d" + i, label: ds.label, align: "right", render: (function (idx) { return function (r) { return Fmt.num(r["d" + idx]); }; })(i) });
    });
    var rows = d.labels.map(function (l, ri) {
      var row = { l: l };
      d.datasets.forEach(function (ds, i) { row["d" + i] = ds.values[ri]; });
      return row;
    });
    return UI.DataTable({ columns: cols, rows: rows });
  }

  /* ---------------- Re-theme on theme/lang change ------------------------- */
  function retheme() {
    registry = registry.filter(function (r) {
      if (!r.chart || !r.chart.canvas || !document.body.contains(r.chart.canvas)) {
        if (r.chart) try { r.chart.destroy(); } catch (e) {}
        return false;
      }
      return true;
    });
    // simplest robust approach: destroy & let sections re-render on lang change.
  }
  function destroyAll() {
    registry.forEach(function (r) { try { r.chart.destroy(); } catch (e) {} });
    registry = [];
  }

  /* utils */
  function deepMerge(a, b) {
    var out = Array.isArray(a) ? a.slice() : Object.assign({}, a);
    Object.keys(b || {}).forEach(function (k) {
      if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && typeof out[k] === "object") out[k] = deepMerge(out[k], b[k]);
      else out[k] = b[k];
    });
    return out;
  }

  global.Charts = {
    ChartCard: ChartCard, sparkline: sparkline,
    doughnut: doughnut, pie: pie, bar: bar, line: line,
    make: make, destroyAll: destroyAll, retheme: retheme,
    palette: palette, role: role, cssVar: cssVar
  };
})(window);
