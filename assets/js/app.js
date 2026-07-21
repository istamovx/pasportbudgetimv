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
  /* --- General --- */
  function renderGeneral() {
    var g = D.general, s = D.staff, dts = g.dts;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.general.title", "page.general.desc"));

    // KPIs (derived)
    var ins = dts.accounts.filter(function (a) { return a.key === "acc.insurance"; })[0] || {};
    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:4;--cols-md:2" }, [
      UI.KpiCard({ label: t("general.kpi.staff_total"), value: Fmt.num(s.totals.plan), icon: "users" }),
      UI.KpiCard({ label: t("general.kpi.occupied"), value: Fmt.num(s.totals.occupied), icon: "check" }),
      UI.KpiCard({ label: t("general.kpi.vacant"), value: Fmt.num(s.totals.vacant), icon: "inbox" }),
      UI.KpiCard({ label: t("acc.income"), value: Fmt.compact(ins.income || 0), icon: "wallet" })
    ])));

    // 1.1 Asosiy + 1.2 Faoliyati
    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [
      kvCard("general.basic", g.basic, function () { editKvRows("general.basic", g.basic); }),
      kvCard("general.activity", g.activity, function () { editKvRows("general.activity", g.activity); })
    ])));

    // 1.3 Mablag' + bank accounts
    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [
      kvCard("general.funding", g.funding.rows, function () { editKvRows("general.funding", g.funding.rows); }),
      accountsCard()
    ])));

    // 1.4 Aloqa + rahbar o'rinbosarlari
    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [
      kvCard("general.contact", g.contact, function () { editKvRows("general.contact", g.contact); }),
      deputiesCard()
    ])));

    // 1.5 Filiallar (empty)
    page.appendChild(h("div", { class: "section" }, h("div", { class: "card" }, [
      cardHead("general.branches", {}),
      h("div", { class: "card__body card__body--flush" },
        g.branches.length ? branchesTable(g.branches) : UI.EmptyState({ icon: "box" }))
    ])));

    // 1.6 DTS moliyalashtirish
    page.appendChild(h("div", { class: "section" }, dtsCard()));
    return page;
  }

  function accountsCard() {
    var f = D.general.funding;
    function list(items) {
      return h("div", { class: "acc-list" }, items.map(function (a) { return h("code", { class: "acc-num", text: a }); }));
    }
    return h("div", { class: "card" }, [
      cardHead("general.bank_budget", { subtitle: t("general.bank_offbudget") }),
      h("div", { class: "card__body", style: "display:flex;flex-direction:column;gap:var(--spacing-xl)" }, [
        h("div", {}, [h("div", { class: "field__label mb-md", text: t("general.bank_budget") + " (" + f.budgetAccounts.length + ")" }), list(f.budgetAccounts)]),
        h("div", {}, [h("div", { class: "field__label mb-md", text: t("general.bank_offbudget") + " (" + f.offBudgetAccounts.length + ")" }), list(f.offBudgetAccounts)])
      ])
    ]);
  }

  function deputiesCard() {
    var g = D.general;
    return h("div", { class: "card" }, [
      cardHead("general.deputies", {}),
      h("div", { class: "card__body card__body--flush" }, UI.DataTable({
        sticky: true,
        columns: [
          { key: "name", label: t("common.name"), sticky: "left", strong: true },
          { key: "phone", label: t("general.f.phone"), align: "right" }
        ],
        rows: g.deputies
      }))
    ]);
  }

  function dtsCard() {
    var dts = D.general.dts;
    var accCols = [
      { key: "key", label: t("common.name"), sticky: "left", strong: true, render: function (r) { return t(r.key); } },
      { key: "start", label: t("acc.start"), align: "right", render: function (r) { return r.start == null ? "—" : money(r.start); } },
      { key: "income", label: t("acc.income"), align: "right", render: function (r) { return r.income == null ? "—" : money(r.income); } },
      { key: "expense", label: t("acc.expense"), align: "right", render: function (r) { return r.expense == null ? "—" : money(r.expense); } },
      { key: "end", label: t("acc.end"), align: "right", render: function (r) { return r.end == null ? "—" : money(r.end); } }
    ];
    var chart = Charts.ChartCard({
      title: t("general.dts"), subtitle: t("general.dts_accounts"), type: "bar", barOpts: { money: true },
      onEdit: function () {
        var specs = [];
        dts.accounts.forEach(function (a) {
          specs.push({ label: t(a.key) + " — " + t("acc.income"), value: a.income, type: "number" });
          specs.push({ label: t(a.key) + " — " + t("acc.expense"), value: a.expense, type: "number" });
        });
        openEdit(t("general.dts"), specs, function (v) {
          var i = 0; dts.accounts.forEach(function (a) { a.income = num(v[i++]); a.expense = num(v[i++]); });
        });
      },
      data: {
        labels: dts.accounts.map(function (a) { return t(a.key); }),
        datasets: [
          { label: t("acc.income"), values: dts.accounts.map(function (a) { return a.income || 0; }), color: "plan" },
          { label: t("acc.expense"), values: dts.accounts.map(function (a) { return a.expense || 0; }), color: "actual" }
        ]
      },
      table: { sticky: true, columns: accCols, rows: dts.accounts },
      height: 300
    });
    var contract = h("div", { class: "card" }, [
      cardHead("general.dts_contract", { onEdit: function () {
        openEdit(t("general.dts_contract"), [
          { label: t("dts.number"), value: dts.contract.number },
          { label: t("dts.date"), value: dts.contract.date },
          { label: t("dts.total"), value: dts.contract.total, type: "number" }
        ], function (v) { dts.contract.number = v[0]; dts.contract.date = v[1]; dts.contract.total = num(v[2]); });
      } }),
      h("div", { class: "card__body card__body--flush" }, h("div", { class: "kv" }, [
        h("div", { class: "kv__key", text: t("dts.number") }), h("div", { class: "kv__val", text: dts.contract.number }),
        h("div", { class: "kv__key", text: t("dts.date") }), h("div", { class: "kv__val", text: dts.contract.date }),
        h("div", { class: "kv__key", text: t("dts.total") }), h("div", { class: "kv__val strong", text: money(dts.contract.total) })
      ]))
    ]);
    return h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [chart, contract]);
  }

  function kvCard(titleKey, rows, onEdit) {
    var kv = h("div", { class: "kv" });
    rows.forEach(function (r) {
      var val = tv(r);
      kv.appendChild(h("div", { class: "kv__key", text: t(r.key) }));
      kv.appendChild(h("div", { class: "kv__val" + (val ? "" : " kv__val--empty"), text: val || t("common.no_value") }));
    });
    return h("div", { class: "card" }, [
      cardHead(titleKey, { onEdit: onEdit }),
      h("div", { class: "card__body card__body--flush" }, kv)
    ]);
  }

  function editKvRows(descKey, rows) {
    var specs = rows.map(function (r) {
      return { label: t(r.key), value: tv(r), disabled: r.i18nValue && r.key === "g.name" ? false : false };
    });
    openEdit(t(descKey), specs, function (vals) { rows.forEach(function (r, i) { setLoc(r, vals[i]); }); });
  }

  function branchesTable(rows) {
    return UI.DataTable({
      sticky: true,
      columns: [
        { key: "name", label: t("common.name"), sticky: "left", strong: true, render: function (r) { return loc(r); } },
        { key: "area", label: "m²", align: "right" },
        { key: "staff", label: t("general.kpi.staff_total"), align: "right", render: function (r) { return Fmt.num(r.staff); } }
      ],
      rows: rows
    });
  }

  /* --- Location --- */
  var locationMap = null;
  function renderLocation() {
    var l = D.location;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.location.title", "page.location.desc"));

    var mapEl = h("div", { class: "map", id: "org-map" });
    var mapCard = h("div", { class: "card" }, [
      cardHead(t("general.f.address"), {
        subtitle: loc(l.address),
        extra: h("div", { class: "flex items-center gap-md" }, [
          UI.StatusBadge(l.status || "new"),
          UI.StatusBadge("", { variant: "brand", label: l.lat.toFixed(4) + ", " + l.lng.toFixed(4), dotless: true })
        ]),
        onEdit: function () {
          openEdit(t("nav.location"), [
            { label: t("general.f.address"), value: loc(l.address) },
            { label: "Latitude", value: l.lat, type: "number" },
            { label: "Longitude", value: l.lng, type: "number" }
          ], function (v) { setLoc(l.address, v[0]); l.lat = num(v[1]); l.lng = num(v[2]); });
        }
      }),
      h("div", { class: "card__body card__body--flush" }, [
        h("div", { class: "kv" }, [
          h("div", { class: "kv__key", text: t("general.f.region") }),
          h("div", { class: "kv__val", text: l.city + " • " + l.district })
        ]),
        mapEl
      ])
    ]);
    page.appendChild(h("div", { class: "section" }, mapCard));

    // 1.5 Filiallar joylashuvi (empty)
    page.appendChild(h("div", { class: "section" }, h("div", { class: "card" }, [
      cardHead("general.branches", {}),
      h("div", { class: "card__body card__body--flush" },
        l.branches.length ? branchesTable(l.branches) : UI.EmptyState({ icon: "map" }))
    ])));

    requestAnimationFrame(function () { initLocationMap(mapEl, l); });
    return page;
  }

  function initLocationMap(el, l) {
    if (!global.L || !document.body.contains(el)) return;
    if (locationMap) { try { locationMap.remove(); } catch (e) {} locationMap = null; }
    el.classList.toggle("map--dark", (document.documentElement.getAttribute("data-theme") === "dark"));
    var map = global.L.map(el, { scrollWheelZoom: false }).setView([l.lat, l.lng], 15);
    global.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
    var markerIcon = global.L.icon({
      iconUrl: "assets/vendor/leaflet/images/marker-icon.png",
      iconRetinaUrl: "assets/vendor/leaflet/images/marker-icon-2x.png",
      shadowUrl: "assets/vendor/leaflet/images/marker-shadow.png",
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });
    global.L.marker([l.lat, l.lng], { icon: markerIcon }).addTo(map).bindPopup("<b>" + t("app.org") + "</b><br>" + loc(l.address));
    locationMap = map;
    map.on("click", function () { map.scrollWheelZoom.enable(); });
    setTimeout(function () { try { map.invalidateSize(); } catch (e) {} }, 200);
  }

  /* --- Staff --- */
  function renderStaff() {
    var s = D.staff;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.staff.title", "page.staff.desc"));

    // KPIs
    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:4;--cols-md:2" }, [
      UI.KpiCard({ label: t("staff.col.plan"), value: Fmt.num(s.totals.plan), icon: "users" }),
      UI.KpiCard({ label: t("staff.col.occupied"), value: Fmt.num(s.totals.occupied), icon: "check" }),
      UI.KpiCard({ label: t("staff.col.physical"), value: Fmt.num(s.totals.physical), icon: "users" }),
      UI.KpiCard({ label: t("staff.col.vacant"), value: Fmt.num(s.totals.vacant), icon: "inbox" })
    ])));

    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [
      Charts.ChartCard({
        title: t("staff.by_position"), type: "doughnut",
        onEdit: function () {
          openEdit(t("staff.by_position"), s.categories.map(function (r) { return { label: t(r.key), value: r.occupied, type: "number" }; }),
            function (v) { s.categories.forEach(function (r, i) { r.occupied = num(v[i]); }); });
        },
        data: { labels: s.categories.map(function (r) { return t(r.key); }), values: s.categories.map(function (r) { return r.occupied; }) },
        height: 320
      }),
      Charts.ChartCard({
        title: t("staff.by_tarif"), type: "bar", barOpts: { horizontal: true },
        onEdit: function () {
          openEdit(t("staff.by_tarif"), s.byTarif.map(function (r) { return { label: t(r.key), value: r.plan, type: "number" }; }),
            function (v) { s.byTarif.forEach(function (r, i) { r.plan = num(v[i]); }); });
        },
        data: { labels: s.byTarif.map(function (r) { return t(r.key); }), datasets: [{ label: t("staff.col.plan"), values: s.byTarif.map(function (r) { return r.plan; }), color: "1" }] },
        height: 320
      })
    ])));

    // Compare chart + full table (with summary rows)
    var tableRows = s.categories.concat(s.byTarif);
    var summary = [
      { key: "staff.total_row", plan: s.totals.plan, occupied: s.totals.occupied, physical: s.totals.physical, vacant: s.totals.vacant },
      { key: "staff.medstaff", plan: s.medStaff.plan, occupied: s.medStaff.occupied, physical: s.medStaff.physical, vacant: s.medStaff.vacant },
      { key: "staff.doctors_row", plan: s.doctors.plan, occupied: s.doctors.occupied, physical: s.doctors.physical, vacant: s.doctors.vacant }
    ];
    page.appendChild(h("div", { class: "section" }, Charts.ChartCard({
      title: t("staff.compare"), type: "bar",
      onEdit: function () {
        var specs = [];
        s.categories.forEach(function (r) {
          specs.push({ label: t(r.key) + " — " + t("staff.col.plan"), value: r.plan, type: "number" });
          specs.push({ label: t(r.key) + " — " + t("staff.col.occupied"), value: r.occupied, type: "number" });
          specs.push({ label: t(r.key) + " — " + t("staff.col.vacant"), value: r.vacant, type: "number" });
        });
        openEdit(t("staff.compare"), specs, function (v) {
          var i = 0; s.categories.forEach(function (r) { r.plan = num(v[i++]); r.occupied = num(v[i++]); r.vacant = num(v[i++]); });
        });
      },
      data: {
        labels: s.categories.map(function (r) { return t(r.key); }),
        datasets: [
          { label: t("staff.col.plan"), values: s.categories.map(function (r) { return r.plan; }), color: "plan" },
          { label: t("staff.col.occupied"), values: s.categories.map(function (r) { return r.occupied; }), color: "positive" },
          { label: t("staff.col.vacant"), values: s.categories.map(function (r) { return r.vacant; }), color: "negative" }
        ]
      },
      height: 340,
      table: {
        sticky: true,
        columns: [
          { key: "key", label: t("common.category"), sticky: "left", strong: true, render: function (r) { return t(r.key); } },
          { key: "plan", label: t("staff.col.plan"), align: "right", render: function (r) { return Fmt.num(r.plan); } },
          { key: "occupied", label: t("staff.col.occupied"), align: "right", render: function (r) { return Fmt.num(r.occupied); } },
          { key: "physical", label: t("staff.col.physical"), align: "right", render: function (r) { return Fmt.num(r.physical); } },
          { key: "vacant", label: t("staff.col.vacant"), align: "right", render: function (r) { return Fmt.num(r.vacant); } }
        ],
        rows: tableRows.concat(summary)
      }
    })));
    return page;
  }

  /* --- Material --- */
  function renderMaterial() {
    var m = D.material;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.material.title", "page.material.desc"));

    // model distribution
    var byModel = {};
    m.vehicles.forEach(function (v) { byModel[v.model] = (byModel[v.model] || 0) + 1; });
    var modelLabels = Object.keys(byModel), modelValues = modelLabels.map(function (k) { return byModel[k]; });

    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [
      Charts.ChartCard({
        title: t("material.by_model"), subtitle: t("material.transport"), type: "pie",
        data: { labels: modelLabels, values: modelValues },
        height: 320
      }),
      UI.KpiCard({ label: t("material.transport"), value: Fmt.num(m.vehicles.length) + " " + t("common.units"), icon: "box" })
    ])));

    page.appendChild(h("div", { class: "section" }, h("div", { class: "card" }, [
      cardHead("material.transport", { onEdit: function () {
        openEdit(t("common.add"), [
          { label: t("material.model"), value: "" },
          { label: t("material.plate"), value: "" },
          { label: t("material.color"), value: "" }
        ], function (v) { m.vehicles.push({ pass: "—", plate: v[1], model: v[0], color: v[2], reg: D.meta.updatedAt, dept: "—", inspection: "—" }); });
      } }),
      h("div", { class: "card__body card__body--flush" }, UI.DataTable({
        sticky: true,
        columns: [
          { key: "plate", label: t("material.plate"), sticky: "left", strong: true },
          { key: "model", label: t("material.model") },
          { key: "color", label: t("material.color") },
          { key: "pass", label: t("material.pass") },
          { key: "reg", label: t("material.reg"), render: function (r) { return Fmt.date(r.reg); } },
          { key: "dept", label: t("material.dept") },
          { key: "inspection", label: t("material.inspection"), render: function (r) { return r.inspection === "—" ? "—" : Fmt.date(r.inspection); } },
          { key: "act", label: t("common.actions"), sticky: "right", render: function (r) {
            return UI.Button({ icon: "edit", variant: "tertiary", size: "sm", title: t("common.edit"), onClick: function () {
              openEdit(r.model, [
                { label: t("material.model"), value: r.model },
                { label: t("material.plate"), value: r.plate },
                { label: t("material.color"), value: r.color },
                { label: t("material.dept"), value: r.dept }
              ], function (v) { r.model = v[0]; r.plate = v[1]; r.color = v[2]; r.dept = v[3]; });
            } });
          } }
        ],
        rows: m.vehicles
      }))
    ])));

    // Auto limits (empty)
    page.appendChild(h("div", { class: "section" }, h("div", { class: "card" }, [
      cardHead("material.auto_limits", {}),
      h("div", { class: "card__body card__body--flush" }, UI.EmptyState({ icon: "zap" }))
    ])));
    return page;
  }

  /* --- Utilities (empty) --- */
  function renderUtilities() {
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.utilities.title", "page.utilities.desc"));
    page.appendChild(h("div", { class: "section" }, h("div", { class: "card" }, [
      h("div", { class: "card__body card__body--flush" }, UI.EmptyState({ icon: "zap" }))
    ])));
    return page;
  }

  /* --- Debts --- */
  function renderDebts() {
    var db = D.debts;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.debts.title", "page.debts.desc", [
      UI.Button({ label: t("common.add"), variant: "primary", icon: "plus", onClick: function () {
        openEdit(t("debts.table.title"), [
          { label: t("debts.district"), value: "" },
          { label: t("debts.kpi.overpay"), value: 0, type: "number" },
          { label: t("common.date"), value: D.meta.updatedAt, type: "date" }
        ], function (v) { db.rows.unshift({ date: v[2], district: v[0], debt: 0, surcharge: 0, overpay: num(v[1]), status: "new" }); });
      } })
    ]));

    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:3;--cols-md:1" }, [
      UI.KpiCard({ label: t("debts.kpi.debt"), value: Fmt.compact(db.kpi.debt), icon: "wallet" }),
      UI.KpiCard({ label: t("debts.kpi.surcharge"), value: Fmt.compact(db.kpi.surcharge), icon: "up" }),
      UI.KpiCard({ label: t("debts.kpi.overpay"), value: Fmt.compact(db.kpi.overpay), icon: "down" })
    ])));

    // Overpay by record (bar)
    page.appendChild(h("div", { class: "section" }, Charts.ChartCard({
      title: t("debts.kpi.overpay"), subtitle: t("debts.dynamics"), type: "bar", barOpts: { money: true },
      data: {
        labels: db.rows.map(function (r) { return Fmt.date(r.date) + " • " + r.district; }),
        datasets: [{ label: t("debts.kpi.overpay"), values: db.rows.map(function (r) { return r.overpay; }), color: "3" }]
      },
      height: 300
    })));

    page.appendChild(h("div", { class: "section" }, h("div", { class: "card" }, [
      cardHead("debts.table.title", {}),
      h("div", { class: "card__body card__body--flush" }, UI.DataTable({
        sticky: true,
        columns: [
          { key: "date", label: t("common.date"), sticky: "left", strong: true, render: function (r) { return Fmt.date(r.date); } },
          { key: "district", label: t("debts.district") },
          { key: "debt", label: t("debts.kpi.debt"), align: "right", render: function (r) { return money(r.debt); } },
          { key: "surcharge", label: t("debts.kpi.surcharge"), align: "right", render: function (r) { return money(r.surcharge); } },
          { key: "overpay", label: t("debts.kpi.overpay"), align: "right", render: function (r) { return money(r.overpay); } },
          { key: "act", label: t("common.actions"), sticky: "right", render: function (r) {
            return UI.Button({ icon: "edit", variant: "tertiary", size: "sm", title: t("common.edit"), onClick: function () {
              openEdit(r.district, [
                { label: t("debts.kpi.debt"), value: r.debt, type: "number" },
                { label: t("debts.kpi.surcharge"), value: r.surcharge, type: "number" },
                { label: t("debts.kpi.overpay"), value: r.overpay, type: "number" }
              ], function (v) { r.debt = num(v[0]); r.surcharge = num(v[1]); r.overpay = num(v[2]); });
            } });
          } }
        ],
        rows: db.rows
      }))
    ])));
    return page;
  }

  /* --- MIB (enforcement) — empty --- */
  function renderMib() {
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.mib.title", "page.mib.desc"));
    page.appendChild(h("div", { class: "section" }, h("div", { class: "card" }, [
      h("div", { class: "card__body card__body--flush" },
        D.mib.rows.length ? UI.DataTable({ sticky: true, columns: [
          { key: "region", label: t("mib.region2"), sticky: "left", strong: true },
          { key: "creditor", label: t("mib.creditor") },
          { key: "exec", label: t("mib.exec_body") },
          { key: "balance", label: t("mib.balance_acc") }
        ], rows: D.mib.rows }) : UI.EmptyState({ icon: "shield" }))
    ])));
    return page;
  }

  /* --- Health (8.1-8.8 via Tabs) --- */
  function renderHealth() {
    var hd = D.health;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.health.title", "page.health.desc"));

    var tabs = UI.Tabs({ items: [
      { id: "amb", label: t("health.tab.ambulatory"), render: healthAmbulatory },
      { id: "gpop", label: t("health.tab.general_pop"), render: function () { return emptyCard("users"); } },
      { id: "stat", label: t("health.tab.stationary"), render: healthStationary },
      { id: "fac", label: t("health.tab.facility"), render: healthFacility },
      { id: "lab", label: t("health.tab.lab"), render: healthLab },
      { id: "blood", label: t("health.tab.blood"), render: function () { return emptyCard("heart"); } },
      { id: "forensic", label: t("health.tab.forensic"), render: function () { return emptyCard("shield"); } },
      { id: "emerg", label: t("health.tab.emergency"), render: function () { return emptyCard("zap"); } }
    ] });
    page.appendChild(h("div", { class: "section" }, tabs));
    return page;
  }

  function emptyCard(icon) {
    return h("div", { class: "card mt-xl" }, h("div", { class: "card__body card__body--flush" }, UI.EmptyState({ icon: icon })));
  }

  function healthAmbulatory() {
    var rows = D.health.ambulatory;
    var wrap = h("div", { class: "mt-xl" });
    wrap.appendChild(h("div", { class: "cols", style: "--cols:3;--cols-md:2", id: "amb-grid" },
      rows.map(function (r) { return UI.KpiCard({ label: t(r.key), value: Fmt.num(r.v), icon: "heart" }); })));
    return wrap;
  }

  function healthStationary() {
    var st = D.health.stationary;
    var wrap = h("div", { class: "mt-xl" });
    // KPIs + gauge
    var kpis = h("div", { class: "cols", style: "--cols:4;--cols-md:2" }, [
      UI.KpiCard({ label: t("h.beds"), value: Fmt.num(st.total.beds), icon: "box" }),
      UI.KpiCard({ label: t("h.patients"), value: Fmt.num(st.total.patients), icon: "users" }),
      UI.KpiCard({ label: t("h.avg_days"), value: Fmt.num(st.total.avgDays, 2), icon: "check" }),
      UI.KpiCard({ label: t("h.deaths_st"), value: Fmt.num(st.total.deaths), icon: "inbox" })
    ]);
    wrap.appendChild(h("div", { class: "section" }, kpis));

    // gauge
    var pct = st.total.exec;
    var gauge = h("div", { class: "card" }, [
      cardHead("h.exec", {}),
      h("div", { class: "card__body" }, [
        h("div", { class: "flex items-center justify-between mb-md" }, [
          h("span", { class: "text-display-sm tabular", style: "color:var(--text-primary)", text: Fmt.percent(pct) }),
          UI.StatusBadge("", { variant: pct >= 90 ? "success" : pct >= 75 ? "warning" : "danger", label: pct + "% " + t("common.of_plan"), dotless: true })
        ]),
        (function () { var b = h("div", { class: "progress" }, h("div", { class: "progress__bar" + (pct >= 90 ? " progress__bar--success" : ""), style: "width:0%" }));
          requestAnimationFrame(function () { b.firstChild.style.width = Math.min(pct, 100) + "%"; }); return b; })(),
        h("p", { class: "field__hint mt-md", text: Fmt.num(st.total.factDays) + " / " + Fmt.num(st.total.planDays) + " " + t("h.plan_days").toLowerCase() })
      ])
    ]);
    var bedDayChart = Charts.ChartCard({
      title: t("h.plan_days") + " · " + t("h.fact_days"), type: "bar",
      data: {
        labels: [t("mib.budget"), t("mib.paid"), t("common.total")],
        datasets: [
          { label: t("h.plan_days"), values: [st.budget.planDays, st.paid.planDays, st.total.planDays], color: "plan" },
          { label: t("h.fact_days"), values: [st.budget.factDays, st.paid.factDays, st.total.factDays], color: "actual" }
        ]
      }, height: 300
    });
    wrap.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [gauge, bedDayChart])));

    // patients bar + full table
    var patientsChart = Charts.ChartCard({
      title: t("h.patients"), subtitle: t("health.by_type"), type: "bar",
      data: {
        labels: [t("mib.budget"), t("mib.paid"), t("common.total")],
        datasets: [{ label: t("h.patients"), values: [st.budget.patients, st.paid.patients, st.total.patients], color: "1" }]
      }, height: 300,
      table: {
        sticky: true,
        columns: [
          { key: "m", label: t("health.metric"), sticky: "left", strong: true, render: function (r) { return t(r.m); } },
          { key: "total", label: t("common.total"), align: "right", render: function (r) { return r.pct ? Fmt.percent(r.total) : Fmt.num(r.total, r.dec || 0); } },
          { key: "budget", label: t("mib.budget"), align: "right", render: function (r) { return r.pct ? Fmt.percent(r.budget) : Fmt.num(r.budget, r.dec || 0); } },
          { key: "paid", label: t("mib.paid"), align: "right", render: function (r) { return r.pct ? Fmt.percent(r.paid) : Fmt.num(r.paid, r.dec || 0); } }
        ],
        rows: [
          { m: "h.beds", total: st.total.beds, budget: st.budget.beds, paid: st.paid.beds },
          { m: "h.plan_days", total: st.total.planDays, budget: st.budget.planDays, paid: st.paid.planDays },
          { m: "h.fact_days", total: st.total.factDays, budget: st.budget.factDays, paid: st.paid.factDays },
          { m: "h.exec", total: st.total.exec, budget: st.budget.exec, paid: st.paid.exec, pct: true },
          { m: "h.patients", total: st.total.patients, budget: st.budget.patients, paid: st.paid.patients },
          { m: "h.avg_days", total: st.total.avgDays, budget: st.budget.avgDays, paid: st.paid.avgDays, dec: 2 },
          { m: "h.deaths_st", total: st.total.deaths, budget: st.budget.deaths, paid: st.paid.deaths }
        ]
      }
    });
    wrap.appendChild(h("div", { class: "section" }, patientsChart));
    return wrap;
  }

  function healthFacility() {
    var f = D.health.facility;
    var totalRooms = f.rooms.reduce(function (a, b) { return a + b; }, 0);
    var totalEq = f.equipment.reduce(function (a, b) { return a + b; }, 0);
    var totalArea = f.areas.reduce(function (a, b) { return a + b; }, 0);
    var wrap = h("div", { class: "mt-xl" });
    wrap.appendChild(h("div", { class: "cols", style: "--cols:4;--cols-md:2" }, [
      UI.KpiCard({ label: t("h.warehouses"), value: Fmt.num(f.warehouses), icon: "box" }),
      UI.KpiCard({ label: t("h.rooms"), value: Fmt.num(totalRooms), icon: "grid" }),
      UI.KpiCard({ label: t("h.equipment"), value: Fmt.num(totalEq), icon: "zap" }),
      UI.KpiCard({ label: t("h.areas"), value: Fmt.num(totalArea, 2), icon: "map" })
    ]));
    wrap.appendChild(h("div", { class: "section mt-xl" }, Charts.ChartCard({
      title: t("h.areas"), type: "bar", barOpts: { horizontal: true },
      data: { labels: f.areas.map(function (_, i) { return "№ " + (i + 1); }), datasets: [{ label: t("h.areas"), values: f.areas, color: "6" }] },
      height: 320
    })));
    return wrap;
  }

  function healthLab() {
    var lab = D.health.lab;
    var wrap = h("div", { class: "mt-xl" });
    var items = lab.filter(function (r) { return r.key !== "lab.total"; });
    wrap.appendChild(Charts.ChartCard({
      title: t("lab.total"), subtitle: Fmt.num(lab[0].v), type: "bar", barOpts: { horizontal: true },
      onEdit: function () {
        openEdit(t("lab.total"), lab.map(function (r) { return { label: t(r.key), value: r.v, type: "number" }; }),
          function (v) { lab.forEach(function (r, i) { r.v = num(v[i]); }); });
      },
      data: { labels: items.map(function (r) { return t(r.key); }), datasets: [{ label: t("common.count"), values: items.map(function (r) { return r.v; }), color: "2" }] },
      height: 400,
      table: {
        sticky: true,
        columns: [
          { key: "key", label: t("health.metric"), sticky: "left", strong: true, render: function (r) { return t(r.key); } },
          { key: "v", label: t("common.count"), align: "right", render: function (r) { return Fmt.num(r.v); } }
        ],
        rows: lab
      }
    }));
    return wrap;
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
      h("div", { class: "header__actions" }, [themeToggle(), profile()])
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
    I18N.setLang("uz-latn"); // project is Uzbek-only for now; localization comes later
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
