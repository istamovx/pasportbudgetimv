/* ==========================================================================
   App bootstrap: shell wiring (sidebar/header/theme/lang) + section router.
   ========================================================================== */
(function (global) {
  "use strict";
  var UI = global.UI, Charts = global.Charts, Fmt = global.Fmt, D = global.DATA;
  var h = UI.h, t = function (k, f) { return I18N.t(k, f); };

  /* Resolve language-variant free-text values */
  function loc(item) {
    if (item == null) return "";
    if (typeof item === "string") return item;
    var lang = I18N.current;
    if (lang === "ru" && item.ru) return item.ru;
    if (lang === "uz-cyrl" && item.cyr) return item.cyr;
    if (item.value != null) return item.value;
    if (item.name != null) return item.name;
    return "";
  }
  function tv(item) { // key/value with optional i18nValue flag
    var v = item.i18nValue ? t(item.value) : loc(item);
    return v;
  }
  function money(v) { return Fmt.currency(v, 0); }
  function num(v) { v = parseFloat(String(v).replace(/[^\d.\-]/g, "")); return isNaN(v) ? 0 : v; }
  function setLoc(item, val) {
    var lang = I18N.current;
    if (lang === "ru") item.ru = val; else if (lang === "uz-cyrl") item.cyr = val; else item.value = val;
    if (item.i18nValue) { item.i18nValue = false; item.value = val; }
  }

  /* ---- Editable-card helpers (organization role: every block is editable) ---- */
  function cardHead(titleKey, opts) {
    opts = opts || {};
    var left = h("div", {}, [
      h("div", { class: "card__title", text: typeof titleKey === "string" ? t(titleKey) : titleKey }),
      opts.subtitle ? h("div", { class: "card__subtitle", text: opts.subtitle }) : null
    ]);
    var actions = h("div", { class: "card__head-actions" });
    if (opts.extra) actions.appendChild(opts.extra);
    if (opts.onEdit) actions.appendChild(UI.editButton(opts.onEdit));
    return h("div", { class: "card__head" }, [left, actions]);
  }

  /* specs: [{label, value, type, disabled, computed, hint}] -> apply(values[]) */
  function openEdit(desc, specs, apply) {
    var fields = specs.map(function (s) {
      return UI.FormField({
        label: s.label, value: s.value != null ? s.value : "", type: s.type || "text",
        disabled: s.disabled, computed: s.computed, hint: s.hint
      });
    });
    UI.openDrawer({
      title: t("common.edit"), desc: desc, body: fields,
      onSave: function () {
        var vals = fields.map(function (f) { return f._input ? f._input.value : null; });
        if (apply) apply(vals);
        navigate(current);
      }
    });
  }

  /* Edit a list of {key, budget, paid} rows (budget/paid pair per row) */
  function editBudgetPaid(descKey, rows) {
    var specs = [];
    rows.forEach(function (r) {
      specs.push({ label: t(r.key) + " — " + t("mib.budget"), value: r.budget, type: "number" });
      specs.push({ label: t(r.key) + " — " + t("mib.paid"), value: r.paid, type: "number" });
    });
    openEdit(t(descKey), specs, function (vals) {
      var i = 0; rows.forEach(function (r) { r.budget = num(vals[i++]); r.paid = num(vals[i++]); });
    });
  }

  /* Edit a list of {key, value} rows (single numeric per row) */
  function editKeyValues(descKey, rows) {
    openEdit(t(descKey), rows.map(function (r) { return { label: t(r.key), value: r.value, type: "number" }; }),
      function (vals) { rows.forEach(function (r, i) { r.value = num(vals[i]); }); });
  }

  /* ----------------------------- Sections ------------------------------- */
  var SECTIONS = {
    general: renderGeneral,
    location: renderLocation,
    staff: renderStaff,
    material: renderMaterial,
    utilities: renderUtilities,
    debts: renderDebts,
    mib: renderMib,
    health: renderHealth
  };

  var NAV = [
    { id: "general", icon: "grid" },
    { id: "location", icon: "map" },
    { id: "staff", icon: "users" },
    { id: "material", icon: "box" },
    { id: "utilities", icon: "zap" },
    { id: "debts", icon: "wallet" },
    { id: "mib", icon: "shield" },
    { id: "health", icon: "heart" }
  ];

  function pageHead(titleKey, descKey, actions) {
    var head = h("div", { class: "page__head flex justify-between items-start gap-lg flex-wrap" }, [
      h("div", {}, [
        h("h1", { class: "page__title", text: t(titleKey) }),
        h("p", { class: "page__desc", text: t(descKey) })
      ])
    ]);
    if (actions) head.appendChild(h("div", { class: "flex gap-md flex-wrap" }, actions));
    return head;
  }

  /* --- General --- */
  function renderGeneral() {
    var g = D.general;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.general.title", "page.general.desc"));

    // KPIs
    var kpis = h("div", { class: "cols", style: "--cols:4;--cols-md:2" }, [
      UI.KpiCard({ label: t("general.kpi.staff_total"), value: Fmt.num(g.kpi.staffTotal) + " " + t("common.people"), icon: "users",
        trend: { dir: "up", text: "+3.2%" } }),
      UI.KpiCard({ label: t("general.kpi.occupied"), value: Fmt.num(g.kpi.occupied), icon: "check",
        trend: { dir: "up", text: "88.6%" } }),
      UI.KpiCard({ label: t("general.kpi.vacant"), value: Fmt.num(g.kpi.vacant), icon: "inbox",
        trend: { dir: "down", text: "−4" } }),
      UI.KpiCard({ label: t("general.kpi.debt"), value: Fmt.compact(g.kpi.debt), icon: "wallet",
        trend: { dir: "down", text: "−2.1%" } })
    ]);
    page.appendChild(h("div", { class: "section" }, kpis));

    // Key-value cards (equal columns) — each block editable
    var kvCols = h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [
      kvCard("general.basic", g.basic, function () { editKvRows("general.basic", g.basic); }),
      kvCard("general.contact", g.contact, function () { editKvRows("general.contact", g.contact); })
    ]);
    page.appendChild(h("div", { class: "section" }, kvCols));

    // Money movement bar + stacked source
    page.appendChild(h("div", { class: "section" },
      h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [
        mibMovementCard(), mibSourceCard()
      ])
    ));
    return page;
  }

  function kvCard(titleKey, rows, onEdit) {
    var kv = h("div", { class: "kv" });
    rows.forEach(function (r) {
      kv.appendChild(h("div", { class: "kv__key", text: t(r.key) }));
      kv.appendChild(h("div", { class: "kv__val", text: tv(r) }));
    });
    return h("div", { class: "card" }, [
      cardHead(titleKey, { onEdit: onEdit }),
      h("div", { class: "card__body card__body--flush" }, kv)
    ]);
  }

  /* Edit key/value rows (text; INN stays read-only) */
  function editKvRows(descKey, rows) {
    var specs = rows.map(function (r) {
      return { label: t(r.key), value: tv(r), disabled: r.key === "general.f.inn" };
    });
    openEdit(t(descKey), specs, function (vals) {
      rows.forEach(function (r, i) { if (r.key !== "general.f.inn") setLoc(r, vals[i]); });
    });
  }

  /* --- MIB / money movement cards (shared by General + MIB page) --- */
  function mibMovementCard() {
    var m = D.mib.movement;
    return Charts.ChartCard({
      title: t("mib.movement"), subtitle: t("mib.budget") + " · " + t("mib.paid"),
      type: "bar", barOpts: { money: true },
      onEdit: function () { editBudgetPaid("mib.movement", m); },
      data: {
        labels: m.map(function (r) { return t(r.key); }),
        datasets: [
          { label: t("mib.budget"), values: m.map(function (r) { return r.budget; }), color: "plan" },
          { label: t("mib.paid"), values: m.map(function (r) { return r.paid; }), color: "actual" }
        ]
      },
      height: 300
    });
  }
  function mibSourceCard() {
    var s = D.mib.sources;
    return Charts.ChartCard({
      title: t("mib.by_source"), subtitle: t("mib.income"),
      type: "bar", barOpts: { stacked: true, money: true },
      onEdit: function () { editBudgetPaid("mib.by_source", s); },
      data: {
        labels: s.map(function (r) { return t(r.key); }),
        datasets: [
          { label: t("mib.budget"), values: s.map(function (r) { return r.budget; }), color: "plan" },
          { label: t("mib.paid"), values: s.map(function (r) { return r.paid; }), color: "actual" }
        ]
      },
      height: 300
    });
  }

  /* --- Location --- */
  var locationMap = null;
  function renderLocation() {
    var l = D.location;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.location.title", "page.location.desc"));

    // Real interactive map (Leaflet + OpenStreetMap)
    var mapEl = h("div", { class: "map", id: "org-map" });
    var mapCard = h("div", { class: "card" }, [
      cardHead(t("general.f.address"), {
        subtitle: loc(l.address),
        extra: UI.StatusBadge("", { variant: "brand", label: l.lat.toFixed(4) + ", " + l.lng.toFixed(4), dotless: true }),
        onEdit: function () {
          openEdit(t("nav.location"), [
            { label: t("general.f.address"), value: loc(l.address) },
            { label: "Latitude", value: l.lat, type: "number" },
            { label: "Longitude", value: l.lng, type: "number" }
          ], function (v) { setLoc(l.address, v[0]); l.lat = num(v[1]); l.lng = num(v[2]); });
        }
      }),
      h("div", { class: "card__body card__body--flush" }, mapEl)
    ]);
    page.appendChild(h("div", { class: "section" }, mapCard));

    var branchTable = h("div", { class: "card" }, [
      cardHead("nav.location", { onEdit: function () { addBranch(l); } }),
      h("div", { class: "card__body card__body--flush" }, UI.DataTable({
        sticky: true,
        columns: [
          { key: "name", label: t("common.name"), sticky: "left", strong: true, render: function (r) { return loc(r); } },
          { key: "area", label: "m²", align: "right" },
          { key: "staff", label: t("general.kpi.staff_total"), align: "right", render: function (r) { return Fmt.num(r.staff); } },
          { key: "act", label: t("common.actions"), sticky: "right", render: function (r) {
            return UI.Button({ icon: "edit", variant: "tertiary", size: "sm", title: t("common.edit"), onClick: function () {
              openEdit(loc(r), [
                { label: t("common.name"), value: loc(r) },
                { label: "m²", value: r.area },
                { label: t("general.kpi.staff_total"), value: r.staff, type: "number" }
              ], function (v) { setLoc(r, v[0]); r.area = v[1]; r.staff = num(v[2]); });
            } });
          } }
        ],
        rows: l.branches
      }))
    ]);
    page.appendChild(h("div", { class: "section" }, branchTable));

    // Init map after the container is mounted and has dimensions
    requestAnimationFrame(function () { initLocationMap(mapEl, l); });
    return page;
  }

  function initLocationMap(el, l) {
    if (!global.L || !document.body.contains(el)) return;
    if (locationMap) { try { locationMap.remove(); } catch (e) {} locationMap = null; }
    el.classList.toggle("map--dark", (document.documentElement.getAttribute("data-theme") === "dark"));

    var map = global.L.map(el, { scrollWheelZoom: false, attributionControl: true }).setView([l.lat, l.lng], 15);
    global.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "© OpenStreetMap"
    }).addTo(map);

    var markerIcon = global.L.icon({
      iconUrl: "assets/vendor/leaflet/images/marker-icon.png",
      iconRetinaUrl: "assets/vendor/leaflet/images/marker-icon-2x.png",
      shadowUrl: "assets/vendor/leaflet/images/marker-shadow.png",
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });
    global.L.marker([l.lat, l.lng], { icon: markerIcon }).addTo(map)
      .bindPopup("<b>" + t("app.org") + "</b><br>" + loc(l.address));
    locationMap = map;
    // enable wheel-zoom only after click (avoids hijacking page scroll)
    map.on("click", function () { map.scrollWheelZoom.enable(); });
    setTimeout(function () { try { map.invalidateSize(); } catch (e) {} }, 200);
  }

  function addBranch(l) {
    openEdit(t("common.add"), [
      { label: t("common.name"), value: "" },
      { label: "m²", value: "" },
      { label: t("general.kpi.staff_total"), value: 0, type: "number" }
    ], function (v) { l.branches.push({ name: v[0], area: v[1], staff: num(v[2]) }); });
  }

  /* --- Staff --- */
  function renderStaff() {
    var s = D.staff;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.staff.title", "page.staff.desc"));

    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [
      Charts.ChartCard({
        title: t("staff.by_position"), type: "doughnut",
        onEdit: function () { editKeyValues("staff.by_position", s.byPosition); },
        data: { labels: s.byPosition.map(function (r) { return t(r.key); }), values: s.byPosition.map(function (r) { return r.value; }) },
        height: 320
      }),
      Charts.ChartCard({
        title: t("staff.by_tarif"), type: "bar", barOpts: { horizontal: true },
        onEdit: function () { editKeyValues("staff.by_tarif", s.byTarif); },
        data: { labels: s.byTarif.map(function (r) { return t(r.key); }), datasets: [{ label: t("common.count"), values: s.byTarif.map(function (r) { return r.value; }), color: "1" }] },
        height: 320
      })
    ])));

    page.appendChild(h("div", { class: "section" }, Charts.ChartCard({
      title: t("staff.compare"), type: "bar",
      onEdit: function () {
        var specs = [];
        s.compare.forEach(function (r) {
          specs.push({ label: t(r.key) + " — " + t("staff.col.staff"), value: r.staff, type: "number" });
          specs.push({ label: t(r.key) + " — " + t("staff.col.occupied"), value: r.occupied, type: "number" });
          specs.push({ label: t(r.key) + " — " + t("staff.col.vacant"), value: r.vacant, type: "number" });
        });
        openEdit(t("staff.compare"), specs, function (v) {
          var i = 0; s.compare.forEach(function (r) { r.staff = num(v[i++]); r.occupied = num(v[i++]); r.vacant = num(v[i++]); });
        });
      },
      data: {
        labels: s.compare.map(function (r) { return t(r.key); }),
        datasets: [
          { label: t("staff.col.staff"), values: s.compare.map(function (r) { return r.staff; }), color: "plan" },
          { label: t("staff.col.occupied"), values: s.compare.map(function (r) { return r.occupied; }), color: "positive" },
          { label: t("staff.col.vacant"), values: s.compare.map(function (r) { return r.vacant; }), color: "negative" }
        ]
      },
      height: 340,
      table: {
        sticky: true,
        columns: [
          { key: "key", label: t("common.category"), sticky: "left", strong: true, render: function (r) { return t(r.key); } },
          { key: "staff", label: t("staff.col.staff"), align: "right", render: function (r) { return Fmt.num(r.staff); } },
          { key: "occupied", label: t("staff.col.occupied"), align: "right", render: function (r) { return Fmt.num(r.occupied); } },
          { key: "vacant", label: t("staff.col.vacant"), align: "right", render: function (r) { return Fmt.num(r.vacant); } }
        ],
        rows: s.compare
      }
    })));
    return page;
  }

  /* --- Material --- */
  function renderMaterial() {
    var m = D.material;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.material.title", "page.material.desc"));

    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [
      Charts.ChartCard({
        title: t("material.by_model"), subtitle: t("material.transport"), type: "pie",
        onEdit: function () { editKeyValues("material.by_model", m.transport); },
        data: { labels: m.transport.map(function (r) { return t(r.key); }), values: m.transport.map(function (r) { return r.value; }) },
        height: 320
      }),
      h("div", { class: "card" }, [
        cardHead("material.transport", { onEdit: function () {
          openEdit(t("common.add"), [
            { label: t("material.model"), value: "" },
            { label: t("material.year"), value: "", type: "number" },
            { label: t("material.plate"), value: "" }
          ], function (v) { m.vehicles.push({ model: v[0], type: "veh.car", year: num(v[1]), plate: v[2] }); });
        } }),
        h("div", { class: "card__body card__body--flush" }, UI.DataTable({
          sticky: true,
          columns: [
            { key: "model", label: t("material.model"), sticky: "left", strong: true },
            { key: "type", label: t("material.type"), render: function (r) { return UI.StatusBadge("", { variant: "brand", label: t(r.type), dotless: true }); } },
            { key: "year", label: t("material.year"), align: "right" },
            { key: "plate", label: t("material.plate") },
            { key: "act", label: t("common.actions"), sticky: "right", render: function (r) {
              return UI.Button({ icon: "edit", variant: "tertiary", size: "sm", title: t("common.edit"), onClick: function () {
                openEdit(r.model, [
                  { label: t("material.model"), value: r.model },
                  { label: t("material.year"), value: r.year, type: "number" },
                  { label: t("material.plate"), value: r.plate }
                ], function (v) { r.model = v[0]; r.year = num(v[1]); r.plate = v[2]; });
              } });
            } }
          ],
          rows: m.vehicles
        }))
      ])
    ])));
    return page;
  }

  /* --- Utilities --- */
  function renderUtilities() {
    var u = D.utilities;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.utilities.title", "page.utilities.desc"));

    var total = u.rows.reduce(function (a, r) { return a + r.cost; }, 0);
    page.appendChild(h("div", { class: "section" }, Charts.ChartCard({
      title: t("util.by_service"), type: "bar", barOpts: { horizontal: true, money: true },
      onEdit: function () {
        var specs = [];
        u.rows.forEach(function (r) {
          specs.push({ label: t(r.key) + " — " + t("util.consumption"), value: r.consumption });
          specs.push({ label: t(r.key) + " — " + t("util.cost"), value: r.cost, type: "number" });
        });
        openEdit(t("util.by_service"), specs, function (v) {
          var i = 0; u.rows.forEach(function (r) { r.consumption = v[i++]; r.cost = num(v[i++]); });
        });
      },
      data: { labels: u.rows.map(function (r) { return t(r.key); }), datasets: [{ label: t("util.cost"), values: u.rows.map(function (r) { return r.cost; }), color: "1" }] },
      height: 320,
      table: {
        sticky: true,
        columns: [
          { key: "key", label: t("util.service"), sticky: "left", strong: true, render: function (r) { return t(r.key); } },
          { key: "consumption", label: t("util.consumption"), align: "right" },
          { key: "cost", label: t("util.cost"), align: "right", render: function (r) { return money(r.cost); } },
          { key: "status", label: t("common.status"), render: function (r) { return UI.StatusBadge(r.status); } }
        ],
        rows: u.rows,
        foot: [
          { content: t("common.total") },
          { content: "" },
          { content: money(total), align: "right" },
          { content: "" }
        ]
      }
    })));
    return page;
  }

  /* --- Debts --- */
  function renderDebts() {
    var db = D.debts;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.debts.title", "page.debts.desc", [
      UI.Button({ label: t("common.add"), variant: "primary", icon: "plus", onClick: function () {
        openEdit(t("debts.table.title"), [
          { label: t("debts.counterparty"), value: "" },
          { label: t("common.amount"), value: 0, type: "number" },
          { label: t("common.date"), value: D.meta.updatedAt, type: "date" }
        ], function (v) { db.rows.push({ cp: v[0], amount: num(v[1]), date: v[2], status: "new" }); });
      } })
    ]));

    var months = D.monthKeys.map(function (k) { return t(k); });
    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:3;--cols-md:1" }, [
      UI.KpiCard({ label: t("debts.kpi.debt"), value: Fmt.compact(db.kpi.debt), icon: "wallet", trend: { dir: "down", text: "−2.1%" } }),
      UI.KpiCard({ label: t("debts.kpi.surcharge"), value: Fmt.compact(db.kpi.surcharge), icon: "up", trend: { dir: "up", text: "+3.6%" } }),
      UI.KpiCard({ label: t("debts.kpi.overpay"), value: Fmt.compact(db.kpi.overpay), icon: "down", trend: { dir: "up", text: "+0.8%" } })
    ])));

    page.appendChild(h("div", { class: "section" }, Charts.ChartCard({
      title: t("debts.dynamics"), subtitle: D.meta.reportYear + "", type: "line", barOpts: { money: true },
      onEdit: function () {
        openEdit(t("debts.dynamics"), [
          { label: t("debts.series.debt"), value: db.kpi.debt, type: "number" },
          { label: t("debts.series.surcharge"), value: db.kpi.surcharge, type: "number" },
          { label: t("debts.series.overpay"), value: db.kpi.overpay, type: "number" }
        ], function (v) {
          db.kpi.debt = num(v[0]); db.kpi.surcharge = num(v[1]); db.kpi.overpay = num(v[2]);
          db.series.debt[db.series.debt.length - 1] = db.kpi.debt;
          db.series.surcharge[db.series.surcharge.length - 1] = db.kpi.surcharge;
          db.series.overpay[db.series.overpay.length - 1] = db.kpi.overpay;
        });
      },
      data: {
        labels: months,
        datasets: [
          { label: t("debts.series.debt"), values: db.series.debt, color: "10", fill: true },
          { label: t("debts.series.surcharge"), values: db.series.surcharge, color: "4" },
          { label: t("debts.series.overpay"), values: db.series.overpay, color: "3" }
        ]
      },
      height: 340,
      table: {
        columns: [{ key: "l", label: t("chart.months") }]
          .concat([["debt", "debts.series.debt"], ["surcharge", "debts.series.surcharge"], ["overpay", "debts.series.overpay"]].map(function (p) {
            return { key: p[0], label: t(p[1]), align: "right", render: (function (k) { return function (r) { return money(r[k]); }; })(p[0]) };
          })),
        rows: months.map(function (mo, i) { return { l: mo, debt: db.series.debt[i], surcharge: db.series.surcharge[i], overpay: db.series.overpay[i] }; })
      }
    })));

    page.appendChild(h("div", { class: "section" }, h("div", { class: "card" }, [
      h("div", { class: "card__head" }, h("div", { class: "card__title", text: t("debts.table.title") })),
      h("div", { class: "card__body card__body--flush" }, UI.DataTable({
        sticky: true,
        columns: [
          { key: "cp", label: t("debts.counterparty"), sticky: "left", strong: true },
          { key: "date", label: t("common.date"), render: function (r) { return Fmt.date(r.date); } },
          { key: "amount", label: t("common.amount"), align: "right", render: function (r) { return money(r.amount); } },
          { key: "status", label: t("common.status"), render: function (r) { return UI.StatusBadge(r.status); } },
          { key: "act", label: t("common.actions"), sticky: "right", render: function (r) { return UI.Button({ icon: "edit", variant: "tertiary", size: "sm", title: t("common.edit"), onClick: function () {
            openEdit(r.cp, [
              { label: t("debts.counterparty"), value: r.cp },
              { label: t("common.amount"), value: r.amount, type: "number" },
              { label: t("common.date"), value: r.date, type: "date" }
            ], function (v) { r.cp = v[0]; r.amount = num(v[1]); r.date = v[2]; });
          } }); } }
        ],
        rows: db.rows
      }))
    ])));
    return page;
  }

  /* --- MIB --- */
  function renderMib() {
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.mib.title", "page.mib.desc"));
    // KPIs from movement
    var m = D.mib.movement;
    function sum(key) { var r = m.filter(function (x) { return x.key === key; })[0]; return r ? r.budget + r.paid : 0; }
    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:4;--cols-md:2" },
      m.map(function (r, i) {
        return UI.KpiCard({ label: t(r.key), value: Fmt.compact(r.budget + r.paid), icon: ["wallet", "up", "down", "shield"][i] });
      })
    )));
    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [mibMovementCard(), mibSourceCard()])));
    return page;
  }

  /* --- Health --- */
  function renderHealth() {
    var hd = D.health;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.health.title", "page.health.desc"));

    // Gauge / progress for bed-day execution
    var pct = Math.round(hd.bedDayExecution * 1000) / 10;
    var gaugeCard = h("div", { class: "card" }, [
      cardHead("health.bedday_exec", { onEdit: function () {
        openEdit(t("health.bedday_exec"), [
          { label: t("health.bedday_fact"), value: hd.bedByType.factBedDays[0], type: "number" },
          { label: t("health.bedday_plan"), value: hd.bedByType.planBedDays[0], type: "number" }
        ], function (v) {
          hd.bedByType.factBedDays[0] = num(v[0]); hd.bedByType.planBedDays[0] = num(v[1]);
          hd.bedDayExecution = hd.bedByType.planBedDays[0] ? hd.bedByType.factBedDays[0] / hd.bedByType.planBedDays[0] : 0;
        });
      } }),
      h("div", { class: "card__body" }, [
        h("div", { class: "flex items-center justify-between mb-md" }, [
          h("span", { class: "text-display-sm tabular", style: "color:var(--text-primary)", text: Fmt.percent(pct) }),
          UI.StatusBadge("", { variant: pct >= 90 ? "success" : pct >= 75 ? "warning" : "danger", label: pct + "% " + t("common.of_plan"), dotless: true })
        ]),
        (function () {
          var bar = h("div", { class: "progress" }, h("div", { class: "progress__bar" + (pct >= 90 ? " progress__bar--success" : "") , style: "width:0%" }));
          requestAnimationFrame(function () { bar.firstChild.style.width = Math.min(pct, 100) + "%"; });
          return bar;
        })(),
        h("p", { class: "field__hint mt-md", text: Fmt.num(hd.bedByType.factBedDays[0]) + " / " + Fmt.num(hd.bedByType.planBedDays[0]) + " " + t("health.bedday_plan").toLowerCase() })
      ])
    ]);

    // beds/plan/fact bar for stationary
    var bedCard = Charts.ChartCard({
      title: t("health.stationary"), subtitle: t("health.bedday_plan") + " · " + t("health.bedday_fact"),
      type: "bar",
      onEdit: function () {
        openEdit(t("health.stationary"), [
          { label: t("health.bedday_plan"), value: hd.bedByType.planBedDays[0], type: "number" },
          { label: t("health.bedday_fact"), value: hd.bedByType.factBedDays[0], type: "number" }
        ], function (v) {
          hd.bedByType.planBedDays[0] = num(v[0]); hd.bedByType.factBedDays[0] = num(v[1]);
          hd.bedDayExecution = hd.bedByType.planBedDays[0] ? hd.bedByType.factBedDays[0] / hd.bedByType.planBedDays[0] : 0;
        });
      },
      data: {
        labels: [t("health.bedday_plan"), t("health.bedday_fact")],
        datasets: [{ label: t("health.stationary"), values: [hd.bedByType.planBedDays[0], hd.bedByType.factBedDays[0]], color: "1" }]
      },
      height: 300
    });

    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [gaugeCard, bedCard])));

    // patients by type (budget/paid/total)
    var b = hd.byBudget.metrics;
    page.appendChild(h("div", { class: "section" }, Charts.ChartCard({
      title: t("health.patients"), subtitle: t("health.by_type"), type: "bar",
      onEdit: function () { editBudgetPaid("health.patients", b); },
      data: {
        labels: b.map(function (r) { return t(r.key); }),
        datasets: [
          { label: t("mib.budget"), values: b.map(function (r) { return r.budget; }), color: "plan" },
          { label: t("mib.paid"), values: b.map(function (r) { return r.paid; }), color: "actual" },
          { label: t("common.total"), values: b.map(function (r) { return r.budget + r.paid; }), color: "positive" }
        ]
      },
      height: 320
    })));

    // patients stationary vs ambulatory
    page.appendChild(h("div", { class: "section" }, Charts.ChartCard({
      title: t("health.patients"), subtitle: t("health.stationary") + " · " + t("health.ambulatory"), type: "doughnut",
      onEdit: function () {
        openEdit(t("health.patients"), [
          { label: t("health.stationary"), value: hd.bedByType.patients[0], type: "number" },
          { label: t("health.ambulatory"), value: hd.bedByType.patients[1], type: "number" }
        ], function (v) { hd.bedByType.patients[0] = num(v[0]); hd.bedByType.patients[1] = num(v[1]); });
      },
      data: { labels: [t("health.stationary"), t("health.ambulatory")], values: hd.bedByType.patients },
      height: 300
    })));
    return page;
  }

  /* ----------------------------- Sparklines ------------------------------ */
  function mountSparklines(root) {
    root.querySelectorAll(".kpi").forEach(function (card) {
      if (card._sparkCanvas && card._sparkData) {
        Charts.sparkline(card._sparkCanvas, card._sparkData, card._sparkColor);
      }
    });
  }

  /* ----------------------------- Router --------------------------------- */
  var current = "general";
  var mainEl, navEls = {};

  function navigate(id) {
    if (!SECTIONS[id]) id = "general";
    current = id;
    try { localStorage.setItem("pb.section", id); } catch (e) {}
    Charts.destroyAll();
    if (locationMap) { try { locationMap.remove(); } catch (e) {} locationMap = null; }
    mainEl.innerHTML = "";
    var node = SECTIONS[id]();
    mainEl.appendChild(node);
    mountSparklines(node);
    // update nav active + header title
    Object.keys(navEls).forEach(function (k) { navEls[k].classList.toggle("is-active", k === id); });
    document.getElementById("header-title").textContent = t("nav." + id);
    closeMobileSidebar();
    mainEl.scrollTop = 0; window.scrollTo(0, 0);
  }

  /* ----------------------------- Shell ---------------------------------- */
  function buildShell() {
    var app = document.getElementById("app");

    // Sidebar
    var nav = h("nav", { class: "sidebar__nav" });
    nav.appendChild(h("div", { class: "sidebar__nav-label", "data-i18n": "nav.menu", text: t("nav.menu") }));
    NAV.forEach(function (item) {
      var el = h("button", { class: "nav-item", type: "button", dataset: { label: t("nav." + item.id) }, onClick: function () { navigate(item.id); } }, [
        h("span", { class: "nav-item__icon" }, UI.icon(item.icon)),
        h("span", { class: "nav-item__label", "data-i18n": "nav." + item.id, text: t("nav." + item.id) })
      ]);
      navEls[item.id] = el;
      nav.appendChild(el);
    });

    var collapseBtn = h("button", { class: "sidebar__collapse-btn", type: "button", "aria-label": "Collapse", title: "Collapse", onClick: toggleCollapse },
      UI.icon("chevron-left"));

    var sidebar = h("aside", { class: "sidebar", id: "sidebar" }, [
      h("div", { class: "sidebar__brand" }, [
        h("img", { class: "sidebar__logo sidebar__logo--symbol", src: "assets/img/Symbol.svg", alt: t("app.name"), width: "34", height: "34" }),
        h("div", { class: "sidebar__brand-text" }, [
          h("div", { class: "sidebar__brand-name", "data-i18n": "app.name", text: t("app.name") }),
          h("div", { class: "sidebar__brand-sub", "data-i18n": "app.subtitle", text: t("app.subtitle") })
        ]),
        collapseBtn
      ]),
      nav,
      h("div", { class: "sidebar__footer" }, orgChip())
    ]);

    var scrim = h("div", { class: "scrim", id: "sidebar-scrim", onClick: closeMobileSidebar });

    // Header
    var header = h("header", { class: "header" }, [
      h("button", { class: "hamburger", type: "button", "aria-label": "Menu", onClick: openMobileSidebar }, UI.icon("menu")),
      h("div", { class: "header__title", id: "header-title", text: t("nav.general") }),
      h("div", { class: "header__spacer" }),
      h("div", { class: "header__actions" }, [langMenu(), themeToggle(), profile()])
    ]);

    mainEl = h("main", { class: "main", id: "main" });

    app.appendChild(sidebar);
    app.appendChild(scrim);
    app.appendChild(header);
    app.appendChild(mainEl);
  }

  function orgChip() {
    return h("div", { class: "org-chip flex items-center gap-md" }, [
      h("div", { class: "avatar", text: "TT" }),
      h("div", { class: "org-chip__text", style: "min-width:0" }, [
        h("div", { class: "font-medium", style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap", "data-i18n": "app.org", text: t("app.org"), title: t("app.org") }),
        h("div", { class: "text-tertiary text-xs", "data-i18n": "app.org_short", text: t("app.org_short") })
      ])
    ]);
  }

  function profile() {
    var name = t("general.f.head") + ": A. R. Karimov";
    return h("button", { class: "profile", type: "button", title: name }, [
      h("div", { class: "avatar", text: "AK" }),
      h("span", { class: "profile__name", text: "A. R. Karimov" })
    ]);
  }

  /* Language menu */
  function langMenu() {
    var panel = h("div", { class: "menu__panel" });
    I18N.langs.forEach(function (lng) {
      panel.appendChild(h("button", {
        class: "menu__item" + (lng === I18N.current ? " is-active" : ""), type: "button",
        onClick: function () { I18N.setLang(lng); rerenderShellText(); navigate(current); panel.classList.remove("is-open"); }
      }, [h("span", { text: I18N.t("lang." + lng) }), lng === I18N.current ? UI.icon("check", "menu__check") : h("span")]));
    });
    var btn = h("button", { class: "btn btn--secondary btn--sm", type: "button", title: t("lang.label") }, [
      UI.icon("globe"), h("span", { id: "lang-label", text: shortLang() })
    ]);
    var wrap = h("div", { class: "menu" }, [btn, panel]);
    btn.addEventListener("click", function (e) { e.stopPropagation(); panel.classList.toggle("is-open"); });
    document.addEventListener("click", function () { panel.classList.remove("is-open"); });
    return wrap;
  }
  function shortLang() { return { "uz-latn": "UZ", "uz-cyrl": "ЎЗ", "ru": "RU" }[I18N.current]; }

  /* Theme toggle */
  function themeToggle() {
    var btn = h("button", { class: "btn btn--secondary btn--icon btn--sm", type: "button", "aria-label": t("theme.toggle"), title: t("theme.toggle") });
    function paint() { btn.innerHTML = ""; btn.appendChild(UI.icon(currentTheme() === "dark" ? "sun" : "moon")); }
    btn.addEventListener("click", function () { setTheme(currentTheme() === "dark" ? "light" : "dark"); paint(); navigate(current); });
    paint();
    return btn;
  }

  function rerenderShellText() {
    I18N.apply(document);
    var ll = document.getElementById("lang-label"); if (ll) ll.textContent = shortLang();
    // refresh collapsed-mode tooltips
    NAV.forEach(function (item) { if (navEls[item.id]) navEls[item.id].dataset.label = t("nav." + item.id); });
  }

  /* Theme helpers */
  function currentTheme() { return document.documentElement.getAttribute("data-theme") || "light"; }
  function setTheme(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    try { localStorage.setItem("pb.theme", mode); } catch (e) {}
  }
  function initTheme() {
    var saved = null; try { saved = localStorage.getItem("pb.theme"); } catch (e) {}
    if (!saved) saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(saved);
  }

  /* Collapse sidebar (desktop) */
  function toggleCollapse() {
    var app = document.getElementById("app");
    var collapsed = app.classList.toggle("is-collapsed");
    try { localStorage.setItem("pb.collapsed", collapsed ? "1" : "0"); } catch (e) {}
    // charts + map must resize to the new width
    setTimeout(function () {
      if (global.Chart) Object.values(global.Chart.instances || {}).forEach(function (c) { try { c.resize(); } catch (e) {} });
      if (locationMap) try { locationMap.invalidateSize(); } catch (e) {}
    }, 260);
  }
  function initCollapse() {
    var c = null; try { c = localStorage.getItem("pb.collapsed"); } catch (e) {}
    if (c === "1") document.getElementById("app").classList.add("is-collapsed");
  }

  /* Mobile sidebar */
  function openMobileSidebar() { document.getElementById("sidebar").classList.add("is-open"); document.getElementById("sidebar-scrim").classList.add("is-open"); }
  function closeMobileSidebar() { var s = document.getElementById("sidebar"); if (s) s.classList.remove("is-open"); var sc = document.getElementById("sidebar-scrim"); if (sc) sc.classList.remove("is-open"); }

  /* ----------------------------- Boot ----------------------------------- */
  function boot() {
    I18N.init();
    initTheme();
    buildShell();
    initCollapse();
    var start = "general";
    try { start = localStorage.getItem("pb.section") || "general"; } catch (e) {}
    navigate(start);
    // re-theme charts when OS theme changes (only if user hasn't overridden handled above)
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  global.App = { navigate: function (id) { navigate(id); } };
})(window);
