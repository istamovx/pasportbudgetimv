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

  /* --- Health (8.1–8.8): CRUD forms matching the real system --- */
  function renderHealth() {
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.health.title", "page.health.desc"));
    var tabs = UI.Tabs({ items: [
      { id: "amb", label: t("health.tab.ambulatory"), render: healthAmbulatory },
      { id: "gpop", label: t("health.tab.general_pop"), render: healthGeneralPop },
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

  /* ---- Form building blocks ---- */
  function fmtField(v, dec) { return v == null ? "" : Fmt.num(v, dec || 0); }

  /* fields: [{key,label,computed,dec,value}]  -> card with grid + Saqlash */
  function formSection(title, fields, model, onSave, opts) {
    opts = opts || {};
    var grid = h("div", { class: "form-grid" });
    var refs = {};
    fields.forEach(function (f) {
      var val = f.computed ? fmtField(f.value, f.dec) : (model[f.key] == null ? "" : model[f.key]);
      var ff = UI.FormField({ label: f.label, value: val, type: f.computed ? "text" : "number",
        computed: f.computed, hint: f.hint });
      if (!f.computed) refs[f.key] = ff._input;
      grid.appendChild(ff);
    });
    var foot = h("div", { class: "form-section__foot" }, UI.Button({ label: t("common.save"), variant: "primary", icon: "check", onClick: function () {
      Object.keys(refs).forEach(function (k) { var raw = refs[k].value; model[k] = raw === "" ? null : num(raw); });
      if (onSave) onSave();
      navigate(current);
    } }));
    return h("div", { class: "form-section" }, [
      title ? h("div", { class: "form-section__title", text: title }) : null,
      h("div", { class: "form-section__body" }, grid),
      foot
    ]);
  }

  /* 8.1 Ambulator */
  function healthAmbulatory() {
    var a = D.health.ambulatory;
    var total = (a.age_0_18 || 0) + (a.age_18plus || 0);
    var fields = [
      { key: "attached_total", label: "Biriktirilgan jami aholi soni", computed: true, value: total },
      { key: "age_0_18", label: "0 yoshdan 18 yoshgacha aholi" },
      { key: "age_18plus", label: "18 yoshdan katta aholi" },
      { key: "teens", label: "17–18 yoshgacha o‘smirlar aholi" },
      { key: "fertile_women", label: "Tug‘ruq yoshidagi ayollar (15–49 yosh)" },
      { key: "births", label: "O‘tgan yil/chorak tug‘ilishlar soni" },
      { key: "deaths", label: "O‘tgan yil/chorak o‘limlar soni" },
      { key: "physio", label: "Bajarilgan fizioterapevtik birliklar soni" },
      { key: "free_meds", label: "Bepul/imtiyozli dori olayotgan bemorlar (4252430)" },
      { key: "women_18plus", label: "Biriktirilgan 18 yoshdan katta ayollar soni" },
      { key: "family_poly", label: "2-Tip OP ga biriktirilgan 1-Tip OP aholisi soni" },
      { key: "day_beds", label: "Kunduzgi statsionar o‘rinlar soni" },
      { key: "children_0_15", label: "Biriktirilgan 0–15 yoshgacha bolalar soni" },
      { key: "preschool", label: "Biriktirilgan MTT tarbiyalanuvchilari soni" },
      { key: "students", label: "Biriktirilgan talaba-texnikum o‘quvchilari soni" }
    ];
    return h("div", { class: "mt-xl" }, formSection(t("health.tab.ambulatory"), fields, a));
  }

  /* 8.2 Umumiy aholi */
  function healthGeneralPop() {
    var g = D.health.generalPopulation;
    var total = (g.age_0_18 || 0) + (g.age_18plus || 0);
    var fields = [
      { key: "total", label: "Hududdagi umumiy aholi soni", computed: true, value: total },
      { key: "age_0_18", label: "0 yoshdan 18 yoshgacha aholi" },
      { key: "age_18plus", label: "18 yoshdan katta yoshdagi aholi soni" },
      { key: "school", label: "Maktab o‘quvchilari soni" },
      { key: "women_18plus", label: "18 yoshdan oshgan katta ayollar soni" },
      { key: "preschool", label: "MTT tarbiyalanuvchilari soni" },
      { key: "students", label: "Talaba-texnikum o‘quvchilari soni" },
      { key: "children_0_15", label: "0–15 yoshgacha bolalar soni" }
    ];
    return h("div", { class: "mt-xl" }, formSection("Hududdagi umumiy aholi soni va boshqa ko‘rsatkichlar", fields, g));
  }

  /* 8.3 Statsionar — computed totals + department CRUD */
  function stSum(depts, side, f) { return depts.reduce(function (a, d) { return a + (d[side][f] || 0); }, 0); }
  function stExec(m) { return m.planDays ? m.factDays / m.planDays * 100 : 0; }
  function stAvg(m) { return m.patients ? m.factDays / m.patients : 0; }
  function stTotals(depts) {
    function side(s) { return { beds: stSum(depts, s, "beds"), planDays: stSum(depts, s, "planDays"), factDays: stSum(depts, s, "factDays"), patients: stSum(depts, s, "patients"), deaths: stSum(depts, s, "deaths") }; }
    var b = side("budget"), p = side("paid");
    var tot = { beds: b.beds + p.beds, planDays: b.planDays + p.planDays, factDays: b.factDays + p.factDays, patients: b.patients + p.patients, deaths: b.deaths + p.deaths };
    return { budget: b, paid: p, total: tot };
  }

  function healthStationary() {
    var st = D.health.stationary, depts = st.departments;
    var T = stTotals(depts);
    var wrap = h("div", { class: "mt-xl" });

    // KPIs + gauge
    var pct = stExec(T.total);
    wrap.appendChild(h("div", { class: "cols", style: "--cols:4;--cols-md:2" }, [
      UI.KpiCard({ label: t("h.beds"), value: Fmt.num(T.total.beds), icon: "box" }),
      UI.KpiCard({ label: t("h.patients"), value: Fmt.num(T.total.patients), icon: "users" }),
      UI.KpiCard({ label: t("h.exec"), value: Fmt.percent(pct), icon: "check" }),
      UI.KpiCard({ label: t("h.deaths_st"), value: Fmt.num(T.total.deaths), icon: "inbox" })
    ]));

    // Jami ko'rsatkichlar (computed, read-only)
    var jamiFields = [
      { label: "Jami — shifo o‘rinlari / koyka soni", value: T.total.beds },
      { label: "Jami — o‘rin-kun rejasi", value: T.total.planDays },
      { label: "Jami — o‘rin-kun bajarilishi", value: T.total.factDays },
      { label: "Jami — o‘rin-kun ijrosi (%)", value: stExec(T.total), dec: 2 },
      { label: "Jami — davolangan bemorlar", value: T.total.patients },
      { label: "Jami — o‘rtacha davolanish kuni", value: stAvg(T.total), dec: 2 },
      { label: "Jami — o‘limlar soni", value: T.total.deaths },
      { label: "Byudjet — shifo o‘rinlari soni", value: T.budget.beds },
      { label: "Byudjet — o‘rin-kun rejasi", value: T.budget.planDays },
      { label: "Byudjet — o‘rin-kun bajarilishi", value: T.budget.factDays },
      { label: "Byudjet — davolangan bemorlar", value: T.budget.patients },
      { label: "Byudjet — o‘lim soni", value: T.budget.deaths },
      { label: "Pullik — shifo o‘rinlari / koyka", value: T.paid.beds },
      { label: "Pullik — o‘rin-kun rejasi", value: T.paid.planDays },
      { label: "Pullik — o‘rin-kun bajarilishi", value: T.paid.factDays },
      { label: "Pullik — davolangan bemorlar", value: T.paid.patients },
      { label: "Pullik — o‘lim jami", value: T.paid.deaths }
    ].map(function (f) { return { key: "_ro", label: f.label, computed: true, value: f.value, dec: f.dec }; });
    wrap.appendChild(h("div", { class: "section mt-xl" }, formSection("Jami ko‘rsatkichlar", jamiFields, {})));

    // Departments (CRUD)
    var deptsWrap = h("div", { class: "section" });
    deptsWrap.appendChild(h("div", { class: "section__head" }, [
      h("div", { class: "section__title", text: "Bo‘linmalar (" + depts.length + ")" }),
      UI.Button({ label: "Bo‘lim qo‘shish", variant: "primary", icon: "plus", onClick: function () { addDept(st); } })
    ]));
    depts.forEach(function (d, i) { deptsWrap.appendChild(deptCard(st, d, i)); });
    wrap.appendChild(deptsWrap);
    return wrap;
  }

  function deptMetricsTable(d) {
    var rows = [
      { m: "Shifo o‘rinlari (koyka)", b: d.budget.beds, p: d.paid.beds },
      { m: "O‘rin-kun rejasi", b: d.budget.planDays, p: d.paid.planDays },
      { m: "O‘rin-kun bajarilishi", b: d.budget.factDays, p: d.paid.factDays },
      { m: "O‘rin-kun ijrosi (%)", b: stExec(d.budget), p: stExec(d.paid), pct: true },
      { m: "Davolangan bemorlar", b: d.budget.patients, p: d.paid.patients },
      { m: "Bir bemorni o‘rtacha davolanish kuni", b: stAvg(d.budget), p: stAvg(d.paid), dec: 2 },
      { m: "O‘lim soni", b: d.budget.deaths, p: d.paid.deaths }
    ];
    return UI.DataTable({
      sticky: true,
      columns: [
        { key: "m", label: t("health.metric"), sticky: "left", strong: true },
        { key: "b", label: t("mib.budget"), align: "right", render: function (r) { return r.pct ? Fmt.percent(r.b) : Fmt.num(r.b, r.dec || 0); } },
        { key: "p", label: t("mib.paid"), align: "right", render: function (r) { return r.pct ? Fmt.percent(r.p) : Fmt.num(r.p, r.dec || 0); } }
      ],
      rows: rows
    });
  }

  function deptCard(st, d, i) {
    return h("div", { class: "card mb-md" }, [
      h("div", { class: "card__head" }, [
        h("div", { class: "card__title", text: d.name }),
        h("div", { class: "card__head-actions" }, [
          UI.Button({ icon: "edit", variant: "secondary", size: "sm", label: t("common.edit"), onClick: function () { editDept(st, d); } }),
          UI.Button({ icon: "close", variant: "tertiary", size: "sm", title: t("common.close"), onClick: function () {
            st.departments.splice(i, 1); navigate(current);
          } })
        ])
      ]),
      h("div", { class: "card__body card__body--flush" }, deptMetricsTable(d))
    ]);
  }

  function deptFields(d) {
    return [
      { label: "Nomi", value: d.name, _name: true },
      { label: "Byudjet — Shifo o‘rinlari (koyka)", value: d.budget.beds, side: "budget", f: "beds" },
      { label: "Byudjet — O‘rin-kun rejasi", value: d.budget.planDays, side: "budget", f: "planDays" },
      { label: "Byudjet — O‘rin-kun bajarilishi", value: d.budget.factDays, side: "budget", f: "factDays" },
      { label: "Byudjet — Davolangan bemorlar", value: d.budget.patients, side: "budget", f: "patients" },
      { label: "Byudjet — O‘lim soni", value: d.budget.deaths, side: "budget", f: "deaths" },
      { label: "Pullik — Shifo o‘rinlari (koyka)", value: d.paid.beds, side: "paid", f: "beds" },
      { label: "Pullik — O‘rin-kun rejasi", value: d.paid.planDays, side: "paid", f: "planDays" },
      { label: "Pullik — O‘rin-kun bajarilishi", value: d.paid.factDays, side: "paid", f: "factDays" },
      { label: "Pullik — Davolangan bemorlar", value: d.paid.patients, side: "paid", f: "patients" },
      { label: "Pullik — O‘lim soni", value: d.paid.deaths, side: "paid", f: "deaths" }
    ];
  }

  function editDept(st, d) {
    var specs = deptFields(d).map(function (f) { return { label: f.label, value: f.value == null ? "" : f.value, type: f._name ? "text" : "number", _meta: f }; });
    var fields = specs.map(function (s) { return UI.FormField({ label: s.label, value: s.value, type: s.type }); });
    UI.openDrawer({
      title: t("common.edit"), desc: d.name, body: fields,
      onSave: function () {
        specs.forEach(function (s, i) {
          var raw = fields[i]._input.value; var m = s._meta;
          if (m._name) d.name = raw || d.name;
          else d[m.side][m.f] = raw === "" ? 0 : num(raw);
        });
        navigate(current);
      }
    });
  }

  function addDept(st) {
    var blank = { name: "Yangi bo‘lim", budget: { beds: 0, planDays: 0, factDays: 0, patients: 0, deaths: 0 }, paid: { beds: 0, planDays: 0, factDays: 0, patients: 0, deaths: 0 } };
    st.departments.push(blank);
    editDept(st, blank);
  }

  /* 8.4 Faoliyat (qo'shimcha) */
  function healthFacility() {
    var f = D.health.facility;
    var wrap = h("div", { class: "mt-xl" });
    var totalRooms = f.rooms.reduce(function (a, b) { return a + b; }, 0);
    var totalEq = f.equipment.reduce(function (a, b) { return a + b; }, 0);
    var totalArea = f.areas.reduce(function (a, b) { return a + b; }, 0);
    wrap.appendChild(h("div", { class: "cols", style: "--cols:4;--cols-md:2" }, [
      UI.KpiCard({ label: t("h.warehouses"), value: Fmt.num(f.warehouses), icon: "box" }),
      UI.KpiCard({ label: t("h.rooms"), value: Fmt.num(totalRooms), icon: "grid" }),
      UI.KpiCard({ label: t("h.equipment"), value: Fmt.num(totalEq), icon: "zap" }),
      UI.KpiCard({ label: t("h.areas"), value: Fmt.num(totalArea, 2), icon: "map" })
    ]));
    // editable form (csv arrays)
    var refs = {};
    var grid = h("div", { class: "form-grid" });
    var wh = UI.FormField({ label: t("h.warehouses"), value: f.warehouses, type: "number" }); refs.wh = wh._input; grid.appendChild(wh);
    var rooms = UI.FormField({ label: t("h.rooms") + " (vergul bilan)", value: f.rooms.join(", ") }); refs.rooms = rooms._input; grid.appendChild(rooms);
    var eq = UI.FormField({ label: t("h.equipment") + " (vergul bilan)", value: f.equipment.join(", ") }); refs.eq = eq._input; grid.appendChild(eq);
    var ar = UI.FormField({ label: t("h.areas") + " (vergul bilan)", value: f.areas.join(", ") }); refs.ar = ar._input; grid.appendChild(ar);
    function csv(s) { return String(s).split(",").map(function (x) { return num(x); }).filter(function (x) { return !isNaN(x); }); }
    var foot = h("div", { class: "form-section__foot" }, UI.Button({ label: t("common.save"), variant: "primary", icon: "check", onClick: function () {
      f.warehouses = num(refs.wh.value); f.rooms = csv(refs.rooms.value); f.equipment = csv(refs.eq.value); f.areas = csv(refs.ar.value); navigate(current);
    } }));
    wrap.appendChild(h("div", { class: "section mt-xl" }, h("div", { class: "form-section" }, [
      h("div", { class: "form-section__title", text: t("health.tab.facility") }),
      h("div", { class: "form-section__body" }, grid), foot
    ])));
    return wrap;
  }

  /* 8.5 Laboratoriya */
  function healthLab() {
    var lab = D.health.lab;
    var model = {}; lab.forEach(function (r) { model[r.key] = r.v; });
    var total = lab.filter(function (r) { return r.key !== "lab.total"; }).reduce(function (a, r) { return a + (model[r.key] || 0); }, 0);
    var fields = lab.map(function (r) {
      return r.key === "lab.total"
        ? { key: r.key, label: t(r.key), computed: true, value: total }
        : { key: r.key, label: t(r.key) };
    });
    var save = function () { lab.forEach(function (r) { if (r.key !== "lab.total") r.v = model[r.key] == null ? 0 : model[r.key]; }); };
    return h("div", { class: "mt-xl" }, formSection(t("health.tab.lab"), fields, model, save));
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
    var u = D.user, stir = "201190732";
    var trigger = h("button", { class: "profile", type: "button", title: u.name }, [
      h("div", { class: "avatar", text: u.initials }),
      h("div", { class: "profile__text" }, [
        h("span", { class: "profile__name", text: u.name }),
        h("span", { class: "profile__role", text: u.role })
      ]),
      UI.icon("chevron-down", "profile__chev")
    ]);
    var panel = h("div", { class: "menu__panel profile-panel" }, [
      h("div", { class: "profile-panel__user" }, [
        h("div", { class: "avatar avatar--lg", text: u.initials }),
        h("div", { class: "profile-panel__meta" }, [
          h("div", { class: "profile-panel__name", text: u.name, title: u.name }),
          h("div", { class: "profile-panel__role", text: u.role })
        ])
      ]),
      h("div", { class: "profile-panel__org" }, [
        h("div", { class: "profile-panel__org-icon" }, UI.icon("building")),
        h("div", { style: "min-width:0" }, [
          h("div", { class: "profile-panel__org-name", text: "“" + t("app.org") + "”", title: t("app.org") }),
          h("div", { class: "profile-panel__stir", text: "STIR: " + stir })
        ])
      ]),
      h("div", { class: "profile-panel__actions" }, [
        UI.Button({ label: "Tashkilot tanlash", variant: "secondary", icon: "switch", onClick: function () { panel.classList.remove("is-open"); } }),
        h("button", { class: "btn btn--danger-ghost", type: "button", onClick: function () { window.location.href = "login.html"; } }, [
          UI.icon("logout"), h("span", { text: "Tizimdan chiqish" })
        ])
      ])
    ]);
    var wrap = h("div", { class: "menu profile-menu" }, [trigger, panel]);
    trigger.addEventListener("click", function (e) { e.stopPropagation(); panel.classList.toggle("is-open"); });
    document.addEventListener("click", function () { panel.classList.remove("is-open"); });
    panel.addEventListener("click", function (e) { e.stopPropagation(); });
    return wrap;
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
