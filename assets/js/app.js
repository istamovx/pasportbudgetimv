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

  /* ---- Rollar: org (tashkilot) / admin (barcha tashkilotlar) ---- */
  var ROLE = "org";
  try { ROLE = localStorage.getItem("pb.role") === "admin" ? "admin" : "org"; } catch (e) {}
  var adminCtx = { org: null }; // admin tanlagan tashkilot (pasportga kirganda)

  var ADMIN_SECTIONS = {
    adashboard: function () { return global.AdminPages.dashboard(); },
    aorgs: function () { return renderAdminOrgs(); },
    aorgmanage: function () { return global.AdminPages.orgManage(); },
    ausers: function () { return global.AdminPages.users(); },
    aconstructor: function () { return global.AdminPages.konstruktor(); },
    aclassifiers: function () { return global.AdminPages.classifiers(); },
    alogs: function () { return global.AdminPages.logs(); },
    aorgdetail: function () { return global.AdminPages.orgDetail(); },
    asohalar: function () { return global.AdminPages.sohalar(); }
  };
  var ADMIN_NAV = [
    { heading: "admin.group.main" },
    { id: "adashboard", icon: "grid" },
    { id: "aorgs", icon: "chart" },
    { id: "asohalar", icon: "box" },
    { id: "aorgmanage", icon: "building" },
    { id: "ausers", icon: "users" },
    { heading: "admin.group.system" },
    { id: "aconstructor", icon: "edit" },
    { id: "aclassifiers", icon: "table" },
    { id: "alogs", icon: "clipboard" }
  ];

  function isAdminHome() { return ROLE === "admin" && !adminCtx.org; }
  function currentSections() { return isAdminHome() ? ADMIN_SECTIONS : SECTIONS; }
  function currentNavItems() { return isAdminHome() ? ADMIN_NAV : NAV; }

  function rebuildShell(startId) {
    var app = document.getElementById("app");
    app.innerHTML = "";
    navEls = {};
    buildShell();
    initCollapse();
    navigate(startId);
  }

  function setRole(r) {
    ROLE = r === "admin" ? "admin" : "org";
    try { localStorage.setItem("pb.role", ROLE); } catch (e) {}
    adminCtx.org = null;
    rebuildShell(ROLE === "admin" ? "adashboard" : "general");
  }

  function adminOpenOrg(o) {
    adminCtx.org = o;
    rebuildShell("general");
  }
  function adminBackToList() {
    adminCtx.org = null;
    rebuildShell("aorgs");
  }

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
  /* Numbered section header (passport-style) */
  function secHead(num, title, sub, onEdit) {
    var head = h("div", { class: "sec-head" }, [
      h("span", { class: "sec-head__num", text: num }),
      h("div", { class: "sec-head__text" }, [
        h("h2", { class: "sec-head__title", text: title }),
        sub ? h("p", { class: "sec-head__sub", text: sub }) : null
      ])
    ]);
    if (onEdit) head.appendChild(UI.editButton(onEdit));
    return head;
  }
  function secBlock(num, title, sub, body, onEdit) {
    return h("div", { class: "section sec" }, [secHead(num, title, sub, onEdit), body]);
  }

  /* --- General --- */
  function renderGeneral() {
    var g = D.general, s = D.staff, dts = g.dts;
    var page = h("div", { class: "page" });
    function findVal(rows, key) { var r = rows.filter(function (x) { return x.key === key; })[0]; return r ? tv(r) : "—"; }

    // Passport identity header
    function fact(label, value, mono) {
      return h("div", { class: "passport-head__fact" }, [
        h("span", { class: "passport-head__fact-k", text: label }),
        h("span", { class: "passport-head__fact-v" + (mono ? " mono" : ""), text: value })
      ]);
    }
    var head = h("div", { class: "passport-head" }, [
      h("div", { class: "passport-head__top" }, [
        h("div", { class: "passport-head__id" }, [
          h("div", { class: "passport-head__logo" }, h("img", { src: "assets/img/Symbol.svg", alt: "", width: "34", height: "34" })),
          h("div", {}, [
            h("div", { class: "passport-head__eyebrow", text: (t("app.subtitle") + " · " + D.meta.reportYear).toUpperCase() }),
            h("h1", { class: "passport-head__name", text: t("app.org") })
          ])
        ]),
        UI.StatusBadge("active")
      ]),
      h("div", { class: "passport-head__strip" }, [
        fact(t("g.stir"), findVal(g.basic, "g.stir"), true),
        fact(t("g.oked"), findVal(g.basic, "g.oked"), true),
        fact(t("g.direction"), findVal(g.basic, "g.direction")),
        fact(t("g.founded"), findVal(g.basic, "g.founded")),
        fact(t("g.district"), findVal(g.funding.rows, "g.district")),
        fact(t("common.updated"), Fmt.date(D.meta.updatedAt))
      ])
    ]);
    page.appendChild(h("div", { class: "section" }, head));

    // KPIs (derived)
    var ins = dts.accounts.filter(function (a) { return a.key === "acc.insurance"; })[0] || {};
    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:4;--cols-md:2" }, [
      UI.KpiCard({ label: t("general.kpi.staff_total"), value: Fmt.num(s.totals.plan), icon: "users" }),
      UI.KpiCard({ label: t("general.kpi.occupied"), value: Fmt.num(s.totals.occupied), icon: "check" }),
      UI.KpiCard({ label: t("general.kpi.vacant"), value: Fmt.num(s.totals.vacant), icon: "inbox" }),
      UI.KpiCard({ label: t("acc.income"), value: Fmt.compact(ins.income || 0), icon: "wallet" })
    ])));

    // 01 Asosiy ma'lumotlar (full width, dense)
    page.appendChild(secBlock("01", t("general.basic"), null,
      kvCard(null, g.basic, null, { cols2: true }), function () { editKvRows("general.basic", g.basic); }));

    // 02 Faoliyati va rejimi
    page.appendChild(secBlock("02", t("general.activity"), null,
      kvCard(null, g.activity), function () { editKvRows("general.activity", g.activity); }));

    // 03 Mablag' ajratilishi + hisob raqamlar
    page.appendChild(secBlock("03", t("general.funding"), null, h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [
      kvCard(null, g.funding.rows),
      accountsCard()
    ]), function () { editKvRows("general.funding", g.funding.rows); }));

    // 04 Aloqa + rahbar o'rinbosarlari
    page.appendChild(secBlock("04", t("general.contact"), null, h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [
      kvCard(null, g.contact),
      deputiesCard()
    ]), function () { editKvRows("general.contact", g.contact); }));

    // 05 Filiallar (empty)
    page.appendChild(secBlock("05", t("general.branches"), null, h("div", { class: "card" },
      h("div", { class: "card__body card__body--flush" }, g.branches.length ? branchesTable(g.branches) : UI.EmptyState({ icon: "box" })))));

    // 06 DTS moliyalashtirish
    page.appendChild(secBlock("06", t("general.dts"), null, dtsCard()));
    return page;
  }

  function accountsTbl(items) {
    return UI.DataTable({
      sticky: true,
      columns: [
        { key: "i", label: "#", render: function (r) { return String(r.i); } },
        { key: "n", label: t("acc.number"), strong: true, render: function (r) { return h("span", { class: "mono", text: r.n }); } }
      ],
      rows: items.map(function (n, i) { return { i: i + 1, n: n }; })
    });
  }
  function openAccountsDrawer() {
    var f = D.general.funding;
    UI.openDrawer({
      title: t("acc.number") + "lari", desc: t("app.org"), footer: false,
      body: [
        h("div", { class: "field__label mb-md", text: t("general.bank_budget") + " (" + f.budgetAccounts.length + ")" }),
        accountsTbl(f.budgetAccounts),
        h("div", { class: "field__label mb-md", style: "margin-top:var(--spacing-2xl)", text: t("general.bank_offbudget") + " (" + f.offBudgetAccounts.length + ")" }),
        accountsTbl(f.offBudgetAccounts)
      ]
    });
  }
  function accountsCard() {
    var f = D.general.funding;
    function statRow(labelKey, count) {
      return h("div", { class: "acc-stat" }, [
        h("div", { class: "acc-stat__icon" }, UI.icon("wallet")),
        h("div", { class: "acc-stat__body" }, [
          h("div", { class: "acc-stat__label", text: t(labelKey) }),
          h("div", { class: "acc-stat__value", text: Fmt.num(count) + " " + t("common.units") })
        ])
      ]);
    }
    return h("div", { class: "card" }, [
      cardHead("general.bank_budget", {}),
      h("div", { class: "card__body", style: "display:flex;flex-direction:column;gap:var(--spacing-lg)" }, [
        statRow("general.bank_budget", f.budgetAccounts.length),
        statRow("general.bank_offbudget", f.offBudgetAccounts.length),
        UI.Button({ label: t("acc.view_all"), variant: "secondary", icon: "chevron-right", onClick: openAccountsDrawer })
      ])
    ]);
  }

  function initials(name) {
    var p = String(name).trim().split(/\s+/);
    return ((p[0] || "")[0] || "").toUpperCase() + ((p[1] || "")[0] || "").toUpperCase();
  }
  function deputiesCard() {
    var g = D.general;
    var rows = h("div", { class: "contact-rows" }, g.deputies.map(function (d) {
      return h("div", { class: "contact-row" }, [
        h("div", { class: "contact-row__avatar", text: initials(d.name) }),
        h("div", { class: "contact-row__body" }, [
          h("div", { class: "contact-row__name", text: d.name, title: d.name }),
          h("div", { class: "contact-row__role", text: t("general.deputies") })
        ]),
        h("a", { class: "contact-row__phone", href: "tel:" + d.phone.replace(/\s/g, ""), text: d.phone })
      ]);
    }));
    return h("div", { class: "card" }, [
      cardHead("general.deputies", {}),
      h("div", { class: "card__body card__body--flush" }, rows)
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

  function kvCard(titleKey, rows, onEdit, opts) {
    opts = opts || {};
    var grid = h("div", { class: "info-grid" + (opts.cols2 ? "" : " info-grid--2") });
    rows.forEach(function (r) {
      var val = tv(r);
      var isEmpty = !val;
      var isMono = val && /^[+\d\s.\-/]+$/.test(val);
      var isWide = val && val.length > 42;
      grid.appendChild(h("div", { class: "info-tile" + (isWide ? " info-tile--wide" : "") }, [
        h("div", { class: "info-tile__label", text: t(r.key) }),
        h("div", { class: "info-tile__value" + (isEmpty ? " info-tile__value--empty" : "") + (isMono ? " info-tile__value--mono" : ""),
          text: val || t("common.no_value") })
      ]));
    });
    var body = h("div", { class: "card__body" }, grid);
    if (!titleKey) return h("div", { class: "card" }, body);
    return h("div", { class: "card" }, [cardHead(titleKey, { onEdit: onEdit }), body]);
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

  /* --- Location: building list + multi-step wizard --- */
  var locationMap = null;
  var locState = { mode: "list", bIndex: 0, step: "joylashuv" };

  var WIZ_STEPS = ["joylashuv", "bino", "qavatlar", "xonalar", "kommunal", "ijara", "infra", "polygon"];

  function stepStatus(b, step) {
    switch (step) {
      case "joylashuv": return b.joylashuv ? { s: "done", n: null } : { s: "notstarted", n: null };
      case "bino": return b.bino ? { s: "done", n: (b.bino.count || 1) } : { s: "notstarted", n: 0 };
      case "qavatlar": return { s: b.qavatlar && b.qavatlar.length ? "done" : "notstarted", n: (b.qavatlar || []).length };
      case "xonalar": return { s: b.xonalar && b.xonalar.length ? "done" : "na", n: (b.xonalar || []).length };
      case "kommunal": return b.kommunal ? { s: "done", n: null } : { s: "notstarted", n: null };
      case "ijara": return b.ijara ? { s: "done", n: 1 } : { s: "na", n: 0 };
      case "infra": return { s: b.infratuzilma && b.infratuzilma.count ? "done" : "notstarted", n: b.infratuzilma ? b.infratuzilma.count : 0 };
      case "polygon": return { s: b.polygon ? "done" : "notstarted", n: b.polygon ? 1 : 0 };
    }
    return { s: "notstarted", n: null };
  }

  function renderLocation() {
    return locState.mode === "wizard" ? renderBuildingWizard() : renderLocationList();
  }

  function renderLocationList() {
    var l = D.location;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.location.title", "loc.page_desc", [
      UI.Button({ label: t("loc.add_building"), variant: "primary", icon: "plus", onClick: function () {
        l.buildings.push({ no: l.buildings.length + 1, status: "new", name: "Yangi bino", city: "—", district: "—", lat: 41.311, lng: 69.279, joylashuv: null, bino: null, qavatlar: [], xonalar: [], kommunal: null, ijara: null, infratuzilma: null, polygon: null });
        navigate(current);
      } })
    ]));

    // Asosiy joylashuv
    var mainWrap = h("div", { class: "section" });
    mainWrap.appendChild(secHead("", t("loc.main_location"), null));
    mainWrap.lastChild.querySelector(".sec-head__title").appendChild(h("span", { class: "count-pill", text: String(l.buildings.length) }));
    mainWrap.querySelector(".sec-head__num").remove();
    var grid = h("div", { class: "cols", style: "--cols:3;--cols-md:2" });
    l.buildings.forEach(function (b, i) { grid.appendChild(buildingCard(b, i)); });
    mainWrap.appendChild(grid);
    page.appendChild(mainWrap);

    // Filiallar joylashuvi
    var brWrap = h("div", { class: "section" });
    brWrap.appendChild(secHead("", t("loc.branches_location"), null));
    brWrap.lastChild.querySelector(".sec-head__title").appendChild(h("span", { class: "count-pill", text: String(l.branches.length) }));
    brWrap.querySelector(".sec-head__num").remove();
    brWrap.appendChild(h("div", { class: "card" }, h("div", { class: "card__body card__body--flush" },
      l.branches.length ? branchesTable(l.branches) : UI.EmptyState({ icon: "map" }))));
    page.appendChild(brWrap);
    return page;
  }

  function buildingCard(b, i) {
    return h("div", { class: "bld-card" }, [
      h("div", { class: "bld-card__top" }, [
        h("div", { class: "bld-card__icon" }, UI.icon("map")),
        h("span", { class: "bld-card__no", text: "#" + b.no }),
        h("span", { class: "bld-card__spacer" }),
        UI.StatusBadge(b.status || "new")
      ]),
      h("div", { class: "bld-card__name", text: b.name, title: b.name }),
      h("div", { class: "bld-card__tags" }, [
        h("span", { class: "bld-tag", text: b.city }),
        h("span", { class: "bld-card__dot", text: "•" }),
        h("span", { class: "bld-tag", text: b.district })
      ]),
      h("div", { class: "bld-card__actions" }, [
        UI.Button({ icon: "edit", variant: "secondary", size: "sm", title: t("common.edit"), onClick: function () { openBuildingEdit(b); } }),
        UI.Button({ icon: "trash", variant: "secondary", size: "sm", title: t("common.delete"), onClick: function () { confirmDeleteBuilding(i); } }),
        UI.Button({ label: t("loc.enter_building"), variant: "primary", icon: "chevron-right", onClick: function () {
          locState = { mode: "wizard", bIndex: i, step: "joylashuv" }; navigate(current);
        } })
      ])
    ]);
  }

  function confirmDeleteBuilding(i) {
    var b = D.location.buildings[i];
    UI.openModal({
      title: t("common.delete") + "?", size: "sm",
      body: h("p", { style: "color:var(--text-secondary)", text: "“" + b.name + "” binosini o‘chirmoqchimisiz? Bu amalni bekor qilib bo‘lmaydi." }),
      foot: [
        UI.Button({ label: t("common.cancel"), variant: "secondary", onClick: function () { UI.closeModal(); } }),
        UI.Button({ label: t("common.delete"), variant: "danger", icon: "trash", onClick: function () {
          D.location.buildings.splice(i, 1);
          D.location.buildings.forEach(function (x, idx) { x.no = idx + 1; });
          UI.closeModal(); navigate(current);
        } })
      ]
    });
  }

  function openBuildingEdit(b) {
    openEdit(t("loc.main_location"), [
      { label: t("common.name"), value: b.name },
      { label: t("lf.viloyat"), value: b.city },
      { label: t("lf.tuman"), value: b.district }
    ], function (v) { b.name = v[0]; b.city = v[1]; b.district = v[2]; });
  }

  /* ---- Wizard ---- */
  function renderBuildingWizard() {
    var b = D.location.buildings[locState.bIndex];
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("loc.enter_building_title", "loc.page_desc", [
      UI.Button({ label: t("loc.back"), variant: "secondary", icon: "chevron-left", onClick: function () {
        locState.mode = "list"; navigate(current);
      } })
    ]));

    var layout = h("div", { class: "wizard" });
    // stepper
    var stepper = h("div", { class: "wizard__steps" }, WIZ_STEPS.map(function (step) {
      var st = stepStatus(b, step);
      var isActive = step === locState.step;
      var item = h("button", { class: "wstep" + (isActive ? " is-active" : "") + (st.s === "na" ? " is-na" : ""), type: "button",
        onClick: function () { locState.step = step; navigate(current); } }, [
        h("span", { class: "wstep__dot wstep__dot--" + st.s }, st.s === "done" ? UI.icon("check") : h("span", { class: "wstep__ring" })),
        h("div", { class: "wstep__text" }, [
          h("div", { class: "wstep__title", text: t("step." + step) }),
          h("div", { class: "wstep__status", text: t("st." + st.s) })
        ])
      ]);
      if (st.n != null) item.appendChild(h("span", { class: "wstep__count", text: String(st.n) }));
      return item;
    }));

    var content = h("div", { class: "wizard__content" }, buildStepContent(b, locState.step));
    layout.appendChild(stepper);
    layout.appendChild(content);
    page.appendChild(h("div", { class: "section" }, layout));
    return page;
  }

  function stepNav(prevStep, nextStep) {
    var row = h("div", { class: "form-section__foot", style: "justify-content:space-between" }, [
      prevStep ? UI.Button({ label: t("loc.prev"), variant: "secondary", icon: "chevron-left", onClick: function () { locState.step = prevStep; navigate(current); } }) : h("span"),
      nextStep ? UI.Button({ label: t("loc.next"), variant: "primary", icon: "chevron-right", onClick: function () { locState.step = nextStep; navigate(current); } }) : h("span")
    ]);
    return row;
  }

  function buildStepContent(b, step) {
    var idx = WIZ_STEPS.indexOf(step);
    var prev = idx > 0 ? WIZ_STEPS[idx - 1] : null;
    var next = idx < WIZ_STEPS.length - 1 ? WIZ_STEPS[idx + 1] : null;

    if (step === "joylashuv") {
      var j = b.joylashuv || (b.joylashuv = { address: "", geo: "", lat: 0, lng: 0, fenceType: "", distanceKm: 0, viloyat: b.city, tuman: b.district, fullAddress: "" });
      var refs = {};
      var GEO_DIRS = ["Markaz", "Shimol", "Shimoli-sharq", "Sharq", "Janubi-sharq", "Janub", "Janubi-g‘arb", "G‘arb", "Shimoli-g‘arb"];
      var FENCE_TYPES = ["Rabitssa to‘ri (to‘r panjara)", "G‘isht devor", "Beton devor", "Metall panjara", "Yog‘och to‘siq", "O‘ralmagan"];
      var vloyatlar = global.UZB_VILOYATLAR || [];
      function fld(key, label, val, opts) { var f = UI.FormField(Object.assign({ label: label, value: val == null ? "" : val }, opts || {})); refs[key] = f._input; return f; }

      var viloyatField = UI.FormField({ label: "* " + t("lf.viloyat"), type: "select", value: j.viloyat, placeholder: "Tanlang", options: vloyatlar,
        onChange: function (v) { rebuildTuman(v, null); } });
      refs.viloyat = viloyatField._input;
      var tumanField = UI.FormField({ label: "* " + t("lf.tuman"), type: "select", value: j.tuman, placeholder: "Tanlang", options: (global.UZB_REGIONS[j.viloyat] || []) });
      refs.tuman = tumanField._input;
      function rebuildTuman(vil, keep) {
        if (refs.tuman && refs.tuman._setOptions) refs.tuman._setOptions(global.UZB_REGIONS[vil] || [], keep);
      }

      var grid = h("div", { class: "form-grid" }, [
        fld("address", "* " + t("lf.address"), j.address, { placeholder: "Ko‘cha, uy raqami" }),
        fld("geo", "* " + t("lf.geo"), j.geo, { type: "select", placeholder: "Tanlang", options: GEO_DIRS }),
        h("div", { class: "field" }, [
          h("label", { class: "field__label", text: t("lf.coords") }),
          h("div", { class: "flex gap-md" }, [
            (function () { var f = UI.FormField({ label: "", value: j.lat, type: "number", placeholder: "Kenglik" }); refs.lat = f._input; f.querySelector(".field__label").remove(); return f; })(),
            (function () { var f = UI.FormField({ label: "", value: j.lng, type: "number", placeholder: "Uzunlik" }); refs.lng = f._input; f.querySelector(".field__label").remove(); return f; })()
          ])
        ]),
        fld("fenceType", "* " + t("lf.fence"), j.fenceType, { type: "select", placeholder: "Tanlang", options: FENCE_TYPES }),
        fld("distanceKm", "* " + t("lf.distance"), j.distanceKm, { type: "number", placeholder: "0" }),
        viloyatField,
        tumanField
      ]);
      var full = h("div", { class: "wizard__full" }, [
        h("div", { class: "info-tile__label", text: t("lf.full_address") }),
        h("div", { class: "info-tile__value", text: j.fullAddress || "—" })
      ]);
      var foot = h("div", { class: "form-section__foot" }, UI.Button({ label: t("loc.next"), variant: "primary", icon: "chevron-right", onClick: function () {
        j.address = refs.address.value; j.geo = refs.geo.value; j.lat = num(refs.lat.value); j.lng = num(refs.lng.value);
        j.fenceType = refs.fenceType.value; j.distanceKm = num(refs.distanceKm.value); j.viloyat = refs.viloyat.value; j.tuman = refs.tuman.value;
        j.fullAddress = [j.viloyat, j.tuman, j.address].filter(Boolean).join(", ");
        locState.step = "bino"; navigate(current);
      } }));
      return h("div", { class: "form-section" }, [
        h("div", { class: "form-section__title", text: t("loc.building_info") }),
        h("div", { class: "form-section__body" }, [grid, full]),
        foot
      ]);
    }

    if (step === "bino") {
      var bi = b.bino || (b.bino = { buildYear: null, floors: null, area: null, material: "", condition: "" });
      var model = bi;
      var fields = [
        { key: "buildYear", label: t("bf.build_year"), type: "number" },
        { key: "floors", label: t("bf.floors"), type: "number" },
        { key: "area", label: t("bf.area"), type: "number" },
        { key: "material", label: t("bf.material"), type: "text" },
        { key: "condition", label: t("bf.condition"), type: "text" }
      ];
      return wizardForm(t("step.bino"), fields, model, prev, next);
    }

    if (step === "kommunal") {
      var k = b.kommunal || (b.kommunal = {});
      var kfields = [
        { key: "electricity", label: t("util.electricity") }, { key: "gas", label: t("util.gas") },
        { key: "water", label: t("util.water") }, { key: "heating", label: t("util.heating") }, { key: "sewage", label: "Kanalizatsiya" }
      ];
      var body = h("div", { class: "info-grid" }, kfields.map(function (f) {
        return h("div", { class: "info-tile" }, [
          h("div", { class: "info-tile__label", text: f.label }),
          UI.StatusBadge(k[f.key] ? "active" : "closed", { label: k[f.key] ? "Mavjud" : "Yo‘q" })
        ]);
      }));
      return h("div", { class: "form-section" }, [
        h("div", { class: "form-section__title", text: t("step.kommunal") }),
        h("div", { class: "form-section__body" }, body),
        stepNav(prev, next)
      ]);
    }

    if (step === "infra") {
      var inf = b.infratuzilma || (b.infratuzilma = { count: 0, items: [] });
      var chips = h("div", { class: "flex flex-wrap gap-md" }, (inf.items || []).map(function (it) {
        return UI.StatusBadge("", { variant: "brand", label: it, dotless: true });
      }));
      return h("div", { class: "form-section" }, [
        h("div", { class: "form-section__title", text: t("step.infra") + " (" + (inf.count || 0) + ")" }),
        h("div", { class: "form-section__body" }, (inf.items && inf.items.length) ? chips : UI.EmptyState({ icon: "grid" })),
        stepNav(prev, next)
      ]);
    }

    if (step === "polygon") {
      var mapEl = h("div", { class: "map map--draw", id: "poly-map" });
      var areaOut = h("span", { class: "poly-area__val mono", text: b.polygon && b.polygon.area ? Fmt.num(b.polygon.area, 0) + " m²" : "—" });
      var ptsOut = h("span", { class: "poly-area__pts", text: (b.polygon && b.polygon.points ? b.polygon.points.length : 0) + " nuqta" });
      var toolbar = h("div", { class: "poly-toolbar" }, [
        h("div", { class: "poly-hint", text: "Xaritaga bosib bino maydoni burchaklarini belgilang" }),
        h("div", { class: "poly-area" }, [h("span", { class: "poly-area__label", text: "Maydon:" }), areaOut, h("span", { class: "poly-area__dot", text: "·" }), ptsOut]),
        h("div", { class: "flex gap-md" }, [
          UI.Button({ label: "Tozalash", variant: "secondary", icon: "close", onClick: function () { if (window._polyReset) window._polyReset(); } }),
          UI.Button({ label: t("common.save"), variant: "primary", icon: "check", onClick: function () { if (window._polySave) window._polySave(); } })
        ])
      ]);
      requestAnimationFrame(function () { initPolygonMap(mapEl, b, areaOut, ptsOut); });
      return h("div", { class: "form-section" }, [
        h("div", { class: "form-section__title", text: t("step.polygon") }),
        h("div", { class: "form-section__body" }, [toolbar, mapEl]),
        stepNav(prev, next)
      ]);
    }

    // qavatlar / xonalar / ijara -> empty step
    return h("div", { class: "form-section" }, [
      h("div", { class: "form-section__title", text: t("step." + step) }),
      h("div", { class: "form-section__body" }, UI.EmptyState({ icon: "grid" })),
      stepNav(prev, next)
    ]);
  }

  /* Polygon drawing map: click to add vertices; computes area (m²) */
  function polygonAreaM2(points, latRef) {
    if (points.length < 3) return 0;
    var mPerDegLat = 111320, mPerDegLng = 111320 * Math.cos(latRef * Math.PI / 180);
    var xy = points.map(function (p) { return [p[1] * mPerDegLng, p[0] * mPerDegLat]; });
    var a = 0;
    for (var i = 0; i < xy.length; i++) { var j2 = (i + 1) % xy.length; a += xy[i][0] * xy[j2][1] - xy[j2][0] * xy[i][1]; }
    return Math.abs(a / 2);
  }
  function initPolygonMap(el, b, areaOut, ptsOut) {
    if (!global.L || !document.body.contains(el)) return;
    if (locationMap) { try { locationMap.remove(); } catch (e) {} locationMap = null; }
    el.classList.toggle("map--dark", document.documentElement.getAttribute("data-theme") === "dark");
    var center = [b.lat || 41.311, b.lng || 69.279];
    var map = global.L.map(el, { scrollWheelZoom: true }).setView(center, 17);
    global.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 20, attribution: "© OpenStreetMap" }).addTo(map);
    locationMap = map;
    var pts = (b.polygon && b.polygon.points ? b.polygon.points.slice() : []);
    var poly = null, markers = [];
    var brand = Charts.cssVar("--utility-brand-500") || "#155eef";
    function redraw() {
      if (poly) { map.removeLayer(poly); poly = null; }
      markers.forEach(function (m) { map.removeLayer(m); }); markers = [];
      pts.forEach(function (p, i) {
        var mk = global.L.circleMarker(p, { radius: 5, color: brand, fillColor: brand, fillOpacity: 1, weight: 2 }).addTo(map);
        markers.push(mk);
      });
      if (pts.length >= 2) poly = global.L.polygon(pts, { color: brand, weight: 2, fillColor: brand, fillOpacity: 0.15 }).addTo(map);
      var area = polygonAreaM2(pts, center[0]);
      areaOut.textContent = pts.length >= 3 ? Fmt.num(area, 0) + " m²" : "—";
      ptsOut.textContent = pts.length + " nuqta";
    }
    map.on("click", function (e) { pts.push([e.latlng.lat, e.latlng.lng]); redraw(); });
    window._polyReset = function () { pts = []; redraw(); };
    window._polySave = function () {
      b.polygon = { points: pts.slice(), area: polygonAreaM2(pts, center[0]) };
      UI.openDrawer && null; // no-op
      locState.step = "polygon"; navigate(current);
    };
    if (pts.length) redraw();
    setTimeout(function () { try { map.invalidateSize(); } catch (e) {} }, 200);
  }

  function wizardForm(title, fields, model, prev, next) {
    var refs = {};
    var grid = h("div", { class: "form-grid" }, fields.map(function (f) {
      var ff = UI.FormField({ label: f.label, value: model[f.key] == null ? "" : model[f.key], type: f.type || "text" });
      refs[f.key] = ff._input; return ff;
    }));
    var foot = h("div", { class: "form-section__foot", style: "justify-content:space-between" }, [
      prev ? UI.Button({ label: t("loc.prev"), variant: "secondary", icon: "chevron-left", onClick: function () { locState.step = prev; navigate(current); } }) : h("span"),
      UI.Button({ label: t("common.save"), variant: "primary", icon: "check", onClick: function () {
        fields.forEach(function (f) { var raw = refs[f.key].value; model[f.key] = f.type === "number" ? (raw === "" ? null : num(raw)) : raw; });
        if (next) locState.step = next; navigate(current);
      } })
    ]);
    return h("div", { class: "form-section" }, [
      h("div", { class: "form-section__title", text: title }),
      h("div", { class: "form-section__body" }, grid), foot
    ]);
  }

  /* --- Staff --- */
  function renderStaff() {
    var s = D.staff;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.staff.title", "page.staff.desc"));

    page.appendChild(UI.Tabs({
      items: [
        { id: "umumiy", label: t("staff.tab.umumiy"), render: function () { return staffOverviewPanel(s); } },
        { id: "band", label: t("staff.tab.band"), render: function () { return staffShtatPanel(s, "occupied"); } },
        { id: "jismoniy", label: t("staff.tab.jismoniy"), render: function () { return staffShtatPanel(s, "physical"); } },
        { id: "malaka", label: t("staff.tab.malaka"), render: function () { return staffMalakaPanel(s); } },
        { id: "vakant", label: t("staff.tab.vakant"), render: function () { return staffShtatPanel(s, "vacant"); } },
        { id: "stavka", label: t("staff.tab.stavka"), render: function () { return staffStavkaPanel(s); } },
        { id: "qolgan", label: t("staff.tab.qolgan"), render: function () { return staffQolganPanel(s); } }
      ]
    }));
    return page;
  }

  /* Tab 1: Umumiy kadrlar — KPI + chartlar (avvalgi ko'rinish) */
  function staffOverviewPanel(s) {
    var page = h("div", { class: "staff-panel" });

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

  /* Accordion guruh: sarlavha + "Soni: X ta" + yig'iladigan qatorlar + Tahrirlash */
  function staffCnt(v) { return Fmt.num(v, v % 1 === 0 ? 0 : (v * 10) % 1 === 0 ? 1 : 2); }
  function staffAccGroup(opts) {
    var hasRows = opts.rows && opts.rows.length;
    var head = h("button", { class: "acc-grp__head", type: "button" }, [
      h("span", { class: "acc-grp__title" }, [
        h("b", { text: opts.title }),
        h("span", { class: "acc-grp__count", text: " — " + t("common.count") + ": " + staffCnt(opts.total) + " " + t("staff.soni_ta") })
      ]),
      hasRows ? UI.icon("chevron-down", "acc-grp__chev") : null
    ]);
    var root = h("div", { class: "acc-grp" }, head);
    if (hasRows) {
      var body = h("div", { class: "acc-grp__body" });
      opts.rows.forEach(function (r) {
        body.appendChild(h("div", { class: "acc-grp__row" }, [
          h("span", { class: "acc-grp__label", text: r.label }),
          h("b", { class: "acc-grp__val", text: staffCnt(r.value) + " " + t("staff.soni_ta") })
        ]));
      });
      if (opts.onEdit) body.appendChild(h("div", { class: "acc-grp__foot" },
        UI.Button({ label: t("common.edit"), icon: "edit", variant: "secondary", size: "sm", onClick: opts.onEdit })));
      root.appendChild(body);
      head.addEventListener("click", function () { root.classList.toggle("is-open"); });
      if (opts.open) root.classList.add("is-open");
    } else {
      head.classList.add("is-static");
    }
    return root;
  }

  /* Panel toolbar: filtr + yangilash. options bermasa: Barchasi/Shtat/Ta'rif */
  function staffToolbar(onFilter, onRefresh, options) {
    var sel = UI.Select({
      value: "all",
      options: options || [
        { value: "all", label: t("staff.filter.all") },
        { value: "shtat", label: t("staff.shtat_heading") },
        { value: "tarif", label: t("staff.tarif_heading") }
      ],
      onChange: onFilter
    });
    sel.classList.add("staff-filter");
    return { el: h("div", { class: "staff-toolbar" }, [
      sel,
      h("button", { class: "icon-btn", type: "button", "aria-label": t("common.refresh"), title: t("common.refresh"), onClick: onRefresh }, UI.icon("refresh"))
    ]), sel: sel };
  }

  /* Tab 2/3/5/7: shtat lavozimlari accordionlari — field: occupied|physical|vacant|plan */
  function staffShtatPanel(s, field) {
    var wrap = h("div", { class: "staff-panel" });
    var listHost = h("div", { class: "staff-groups" });
    var tb = staffToolbar(function () { renderList(); }, function () { renderList(); });
    wrap.appendChild(tb.el);
    wrap.appendChild(listHost);

    function editGroup(cat) {
      var det = s.categoryDetails[cat.key] || [];
      openEdit(t(cat.key), det.map(function (r) { return { label: r.label, value: r[field], type: "number" }; }), function (v) {
        det.forEach(function (r, i) { r[field] = num(v[i]); });
        cat[field] = det.reduce(function (a, r) { return a + r[field]; }, 0);
        s.totals[field] = s.categories.reduce(function (a, c) { return a + c[field]; }, 0);
      });
    }

    function renderList() {
      listHost.innerHTML = "";
      var f = tb.sel.value;
      if (f !== "tarif") {
        listHost.appendChild(h("div", { class: "staff-group-heading", text: t("staff.shtat_heading") }));
        s.categories.forEach(function (c, i) {
          listHost.appendChild(staffAccGroup({
            title: t(c.key.replace(".cat.", ".grp.")), total: c[field], open: i === 0,
            rows: (s.categoryDetails[c.key] || []).map(function (r) { return { label: r.label, value: r[field] }; }),
            onEdit: function () { editGroup(c); }
          }));
        });
        listHost.appendChild(staffAccGroup({ title: t("staff.total_shtat"), total: s.totals[field] }));
      }
      if (f !== "shtat") {
        listHost.appendChild(h("div", { class: "staff-group-heading", text: t("staff.tarif_heading") }));
        s.byTarif.forEach(function (r) {
          listHost.appendChild(staffAccGroup({
            title: t(r.key), total: r[field],
            rows: [
              { label: t("staff.col.plan"), value: r.plan },
              { label: t("staff.col.occupied"), value: r.occupied },
              { label: t("staff.col.physical"), value: r.physical },
              { label: t("staff.col.vacant"), value: r.vacant }
            ],
            onEdit: function () {
              openEdit(t(r.key), [
                { label: t("staff.col.plan"), value: r.plan, type: "number" },
                { label: t("staff.col.occupied"), value: r.occupied, type: "number" },
                { label: t("staff.col.physical"), value: r.physical, type: "number" },
                { label: t("staff.col.vacant"), value: r.vacant, type: "number" }
              ], function (v) { r.plan = num(v[0]); r.occupied = num(v[1]); r.physical = num(v[2]); r.vacant = num(v[3]); });
            }
          }));
        });
      }
    }
    renderList();
    return wrap;
  }

  /* Tab 4: malaka toifalari — filtri guruh nomlari bo'yicha */
  function staffMalakaPanel(s) {
    var wrap = h("div", { class: "staff-panel" });
    var listHost = h("div", { class: "staff-groups" });
    var tb = staffToolbar(function () { renderList(); }, function () { renderList(); },
      [{ value: "all", label: t("staff.filter.all") }].concat(s.malaka.map(function (g, i) { return { value: String(i), label: g.group }; })));
    wrap.appendChild(tb.el);
    wrap.appendChild(listHost);
    function renderList() {
      listHost.innerHTML = "";
      var f = tb.sel.value;
      listHost.appendChild(h("div", { class: "staff-group-heading", text: t("staff.tab.malaka") }));
      s.malaka.forEach(function (g, i) {
        if (f !== "all" && f !== String(i)) return;
        var total = g.rows.reduce(function (a, r) { return a + r.value; }, 0);
        listHost.appendChild(staffAccGroup({
          title: g.group, total: total, open: f !== "all" || i === 0, rows: g.rows,
          onEdit: function () {
            openEdit(g.group, g.rows.map(function (r) { return { label: r.label, value: r.value, type: "number" }; }),
              function (v) { g.rows.forEach(function (r, j) { r.value = num(v[j]); }); });
          }
        }));
      });
    }
    renderList();
    return wrap;
  }

  /* Tab 7: qolgan shtat lavozimlari — ilmiy daraja + shtat bo'yicha reja */
  function staffQolganPanel(s) {
    var wrap = h("div", { class: "staff-panel" });
    var listHost = h("div", { class: "staff-groups" });
    var tb = staffToolbar(function () { renderList(); }, function () { renderList(); }, [
      { value: "all", label: t("staff.filter.all") },
      { value: "ilmiy", label: t("staff.ilmiy_heading") },
      { value: "shtat", label: t("staff.shtat_heading") }
    ]);
    wrap.appendChild(tb.el);
    wrap.appendChild(listHost);
    function renderList() {
      listHost.innerHTML = "";
      var f = tb.sel.value;
      if (f !== "shtat") {
        listHost.appendChild(h("div", { class: "staff-group-heading", text: t("staff.ilmiy_heading") }));
        var total = s.ilmiyDaraja.reduce(function (a, r) { return a + r.value; }, 0);
        listHost.appendChild(staffAccGroup({
          title: t("staff.ilmiy_heading"), total: total, open: true, rows: s.ilmiyDaraja,
          onEdit: function () {
            openEdit(t("staff.ilmiy_heading"), s.ilmiyDaraja.map(function (r) { return { label: r.label, value: r.value, type: "number" }; }),
              function (v) { s.ilmiyDaraja.forEach(function (r, j) { r.value = num(v[j]); }); });
          }
        }));
      }
      if (f !== "ilmiy") {
        listHost.appendChild(h("div", { class: "staff-group-heading", text: t("staff.shtat_heading") }));
        s.categories.forEach(function (c) {
          listHost.appendChild(staffAccGroup({
            title: t(c.key.replace(".cat.", ".grp.")), total: c.plan,
            rows: (s.categoryDetails[c.key] || []).map(function (r) { return { label: r.label, value: r.plan }; }),
            onEdit: function () {
              var det = s.categoryDetails[c.key] || [];
              openEdit(t(c.key), det.map(function (r) { return { label: r.label, value: r.plan, type: "number" }; }), function (v) {
                det.forEach(function (r, i) { r.plan = num(v[i]); });
                c.plan = det.reduce(function (a, r) { return a + r.plan; }, 0);
                s.totals.plan = s.categories.reduce(function (a, x) { return a + x.plan; }, 0);
              });
            }
          }));
        });
        listHost.appendChild(staffAccGroup({ title: t("staff.total_shtat"), total: s.totals.plan }));
      }
    }
    renderList();
    return wrap;
  }

  /* Tab 6: pedagogik va tibbiyot stavkalari — tibbiyot/pedagogik filtri bilan */
  function staffStavkaPanel(s) {
    var wrap = h("div", { class: "staff-panel" });
    var listHost = h("div", { class: "staff-groups" });
    var tb = staffToolbar(function () { renderList(); }, function () { renderList(); }, [
      { value: "all", label: t("staff.filter.all") },
      { value: "med", label: t("staff.medstaff") },
      { value: "ped", label: t("staff.tarif.pedagog") }
    ]);
    wrap.appendChild(tb.el);
    wrap.appendChild(listHost);
    var MED = ["staff.tarif.doctors", "staff.tarif.mid_med", "staff.tarif.junior_med"];
    var src = { "staff.tarif.doctors": s.doctors };
    s.byTarif.forEach(function (r) { src[r.key] = r; });
    function group(key, open) {
      var r = src[key]; if (!r) return null;
      return staffAccGroup({
        title: t(key) + " stavkasi", total: r.plan, open: open,
        rows: [
          { label: t("staff.col.plan"), value: r.plan },
          { label: t("staff.col.occupied"), value: r.occupied },
          { label: t("staff.col.vacant"), value: r.vacant }
        ],
        onEdit: function () {
          openEdit(t(key), [
            { label: t("staff.col.plan"), value: r.plan, type: "number" },
            { label: t("staff.col.occupied"), value: r.occupied, type: "number" },
            { label: t("staff.col.vacant"), value: r.vacant, type: "number" }
          ], function (v) { r.plan = num(v[0]); r.occupied = num(v[1]); r.vacant = num(v[2]); });
        }
      });
    }
    function renderList() {
      listHost.innerHTML = "";
      var f = tb.sel.value;
      if (f !== "ped") {
        listHost.appendChild(h("div", { class: "staff-group-heading", text: t("staff.medstaff") }));
        MED.forEach(function (key, i) { var g = group(key, i === 0); if (g) listHost.appendChild(g); });
        listHost.appendChild(staffAccGroup({ title: t("staff.medstaff"), total: s.medStaff.plan }));
      }
      if (f !== "med") {
        listHost.appendChild(h("div", { class: "staff-group-heading", text: t("staff.tarif.pedagog") }));
        var g = group("staff.tarif.pedagog", f === "ped"); if (g) listHost.appendChild(g);
      }
    }
    renderList();
    return wrap;
  }

  /* --- Material --- */
  function transportSummaryCard(m, modelLabels, byModel) {
    var total = m.vehicles.length || 1;
    var palette = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--chart-6"];
    var rows = modelLabels.map(function (name, i) {
      var count = byModel[name], pct = Math.round(count / total * 100);
      var color = "var(" + palette[i % palette.length] + ")";
      return h("div", { class: "brk__row" }, [
        h("div", { class: "brk__top" }, [
          h("span", { class: "brk__name" }, [h("span", { class: "brk__dot", style: "background:" + color }), h("span", { text: name })]),
          h("span", { class: "brk__count" }, [h("b", { text: String(count) }), h("span", { class: "brk__pct", text: " · " + pct + "%" })])
        ]),
        h("div", { class: "progress" }, h("div", { class: "progress__bar", style: "width:" + pct + "%;background:" + color }))
      ]);
    });
    var chartView = h("div", {}, [
      h("div", { class: "stat-hero" }, [
        h("div", { class: "stat-hero__icon" }, UI.icon("box")),
        h("div", {}, [
          h("div", { class: "stat-hero__value", text: Fmt.num(m.vehicles.length) }),
          h("div", { class: "stat-hero__label", text: t("common.units") + " · " + t("material.transport").toLowerCase() })
        ])
      ]),
      h("div", { class: "brk" }, rows)
    ]);
    var tableView = h("div", { class: "hidden" }, UI.DataTable({
      columns: [
        { key: "m", label: t("material.model"), strong: true },
        { key: "c", label: t("common.count"), align: "right", render: function (r) { return Fmt.num(r.c); } },
        { key: "p", label: t("common.percent"), align: "right", render: function (r) { return Fmt.percent(r.p, 0); } }
      ],
      rows: modelLabels.map(function (name) { return { m: name, c: byModel[name], p: Math.round(byModel[name] / total * 100) }; }),
      foot: [{ content: t("common.total") }, { content: Fmt.num(m.vehicles.length), align: "right" }, { content: "100%", align: "right" }]
    }));
    var toggle = UI.Segmented({
      value: "chart",
      items: [{ id: "chart", label: t("common.chart_view"), icon: "chart" }, { id: "table", label: t("common.table_view"), icon: "table" }],
      onChange: function (v) { chartView.classList.toggle("hidden", v !== "chart"); tableView.classList.toggle("hidden", v !== "table"); }
    });
    return h("div", { class: "card" }, [
      h("div", { class: "card__head" }, [
        h("div", {}, h("div", { class: "card__title", text: t("material.transport") })),
        h("div", { class: "card__head-actions" }, toggle)
      ]),
      h("div", { class: "card__body" }, [chartView, tableView])
    ]);
  }

  var matState = { view: "transport" };

  function renderMaterial() {
    var m = D.material;
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.material.title", "page.material.desc"));

    // Inventarizatsiyalar statistikasi — 3 ta tanlov kartasi
    var CARDS = [
      { id: "transport", icon: "box", label: t("material.transport") },
      { id: "security", icon: "shield", label: t("material.card.security") },
      { id: "inventory", icon: "clipboard", label: t("material.card.inventory") }
    ];
    var sec = h("div", { class: "section" });
    sec.appendChild(h("div", { class: "staff-group-heading", text: t("material.inv_stats") }));
    sec.appendChild(h("div", { class: "inv-cards" }, CARDS.map(function (c) {
      return h("button", {
        class: "inv-card" + (matState.view === c.id ? " is-active" : ""), type: "button",
        "aria-pressed": matState.view === c.id ? "true" : "false",
        onClick: function () { matState.view = c.id; navigate(current); }
      }, [
        h("span", { class: "inv-card__icon" }, UI.icon(c.icon)),
        h("span", { class: "inv-card__label", text: c.label })
      ]);
    })));
    page.appendChild(sec);

    if (matState.view === "security") page.appendChild(materialSecurityView(m));
    else if (matState.view === "inventory") page.appendChild(materialInventoryView(m));
    else page.appendChild(materialTransportView(m));
    return page;
  }

  /* Transport vositalari ko'rinishi: analitika + limitlar + UZASBO + YHXBB */
  function materialTransportView(m) {
    var wrap = h("div");

    // model distribution
    var byModel = {};
    m.vehicles.forEach(function (v) { byModel[v.model] = (byModel[v.model] || 0) + 1; });
    var modelLabels = Object.keys(byModel), modelValues = modelLabels.map(function (k) { return byModel[k]; });

    wrap.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:2;--cols-md:1" }, [
      Charts.ChartCard({
        title: t("material.by_model"), subtitle: t("material.transport"), type: "pie",
        data: { labels: modelLabels, values: modelValues },
        height: 320
      }),
      transportSummaryCard(m, modelLabels, byModel)
    ])));

    // Avtomobil limitlari
    wrap.appendChild(h("div", { class: "section" }, h("div", { class: "card" }, [
      h("div", { class: "card__head" }, [
        h("div", {}, h("div", { class: "card__title", text: t("material.limits.title") + " (UZASBO)" })),
        h("div", { class: "card__head-actions" }, UI.editButton(function () {
          var r = m.autoLimits[0];
          openEdit(t("material.limits.title"), [
            { label: t("material.limits.doc"), value: r.doc },
            { label: t("material.limits.date"), value: r.date, type: "date" },
            { label: t("material.limits.limit"), value: r.limit, type: "number" },
            { label: t("material.limits.available"), value: r.available, type: "number" }
          ], function (v) { r.doc = v[0]; r.date = v[1]; r.limit = num(v[2]); r.available = num(v[3]); });
        }))
      ]),
      h("div", { class: "card__body card__body--flush" }, UI.DataTable({
        columns: [
          { key: "i", label: "#", render: function (r, i) { return String(m.autoLimits.indexOf(r) + 1); } },
          { key: "doc", label: t("material.limits.doc"), strong: true },
          { key: "date", label: t("material.limits.date"), render: function (r) { return Fmt.date(r.date); } },
          { key: "limit", label: t("material.limits.limit"), align: "right", render: function (r) { return Fmt.num(r.limit); } },
          { key: "available", label: t("material.limits.available"), align: "right", render: function (r) { return Fmt.num(r.available); } }
        ],
        rows: m.autoLimits
      }))
    ])));

    // UZASBO — jihozlar ro'yxati (bo'sh bo'lishi mumkin)
    wrap.appendChild(h("div", { class: "section" }, h("div", { class: "card" }, [
      h("div", { class: "card__head" }, [
        h("div", {}, h("div", { class: "card__title", text: "UZASBO" })),
        h("div", { class: "card__head-actions" }, UI.Button({ label: t("material.uzasbo_update"), variant: "primary", icon: "refresh", size: "sm", onClick: function () { navigate(current); } }))
      ]),
      h("div", { class: "card__body card__body--flush" }, UI.DataTable({
        columns: [
          { key: "name", label: t("material.uz.name"), strong: true },
          { key: "model", label: t("material.model") },
          { key: "year", label: t("material.uz.year") },
          { key: "group", label: t("material.uz.group") }
        ],
        rows: m.uzasbo,
        empty: { icon: "inbox" }
      }))
    ])));

    // YHXBB — transport vositalari ro'yxati
    wrap.appendChild(h("div", { class: "section" }, h("div", { class: "card" }, [
      h("div", { class: "card__head" }, [
        h("div", {}, h("div", { class: "card__title", text: "YHXBB" }), h("div", { class: "card__subtitle", text: t("material.transport") })),
        h("div", { class: "card__head-actions" }, [
          UI.Button({ label: t("material.yhxbb_update"), variant: "primary", icon: "refresh", size: "sm", onClick: function () { navigate(current); } }),
          UI.Button({ icon: "plus", variant: "secondary", size: "sm", title: t("common.add"), onClick: function () {
            openEdit(t("common.add"), [
              { label: t("material.model"), value: "" },
              { label: t("material.plate"), value: "" },
              { label: t("material.color"), value: "" }
            ], function (v) { m.vehicles.push({ pass: "—", plate: v[1], model: v[0], color: v[2], reg: D.meta.updatedAt, dept: "—", inspection: "—" }); });
          } })
        ])
      ]),
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
    return wrap;
  }

  /* Qo'riqlash xizmati xarajatlari ko'rinishi */
  function materialSecurityView(m) {
    var wrap = h("div");
    var totalYearly = m.security.reduce(function (a, r) { return a + r.yearly; }, 0);
    wrap.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:3;--cols-md:1" }, [
      UI.KpiCard({ label: t("material.sec.yearly") + " (" + m.security[0].year + ")", value: Fmt.currency(m.security[0].yearly), icon: "shield" }),
      UI.KpiCard({ label: t("material.sec.monthly") + " (" + m.security[0].year + ")", value: Fmt.currency(m.security[0].monthly), icon: "wallet" }),
      UI.KpiCard({ label: t("common.total"), value: Fmt.currency(totalYearly), icon: "chart" })
    ])));
    wrap.appendChild(h("div", { class: "section" }, h("div", { class: "card" }, [
      h("div", { class: "card__head" }, [
        h("div", {}, h("div", { class: "card__title", text: t("material.card.security") })),
        h("div", { class: "card__head-actions" }, UI.Button({ icon: "plus", variant: "secondary", size: "sm", title: t("common.add"), onClick: function () {
          openEdit(t("common.add"), [
            { label: t("material.sec.year"), value: new Date().getFullYear(), type: "number" },
            { label: t("material.sec.org"), value: "" },
            { label: t("material.sec.contract"), value: "" },
            { label: t("material.sec.monthly"), value: 0, type: "number" }
          ], function (v) { m.security.unshift({ year: num(v[0]), org: v[1], contract: v[2], monthly: num(v[3]), yearly: num(v[3]) * 12 }); });
        } }))
      ]),
      h("div", { class: "card__body card__body--flush" }, UI.DataTable({
        sticky: true,
        columns: [
          { key: "year", label: t("material.sec.year"), strong: true },
          { key: "org", label: t("material.sec.org") },
          { key: "contract", label: t("material.sec.contract") },
          { key: "monthly", label: t("material.sec.monthly"), align: "right", render: function (r) { return Fmt.currency(r.monthly); } },
          { key: "yearly", label: t("material.sec.yearly"), align: "right", render: function (r) { return Fmt.currency(r.yearly); } },
          { key: "act", label: t("common.actions"), sticky: "right", render: function (r) {
            return UI.Button({ icon: "edit", variant: "tertiary", size: "sm", title: t("common.edit"), onClick: function () {
              openEdit(String(r.year), [
                { label: t("material.sec.org"), value: r.org },
                { label: t("material.sec.contract"), value: r.contract },
                { label: t("material.sec.monthly"), value: r.monthly, type: "number" }
              ], function (v) { r.org = v[0]; r.contract = v[1]; r.monthly = num(v[2]); r.yearly = r.monthly * 12; });
            } });
          } }
        ],
        rows: m.security
      }))
    ])));
    return wrap;
  }

  /* Inventarizatsiya hisoboti ko'rinishi */
  function materialInventoryView(m) {
    var wrap = h("div");
    wrap.appendChild(h("div", { class: "section" }, h("div", { class: "card" }, [
      h("div", { class: "card__head" }, [
        h("div", {}, h("div", { class: "card__title", text: t("material.card.inventory") })),
        h("div", { class: "card__head-actions" }, UI.Button({ icon: "plus", variant: "secondary", size: "sm", title: t("common.add"), onClick: function () {
          openEdit(t("common.add"), [
            { label: t("material.inv.date"), value: D.meta.updatedAt, type: "date" },
            { label: t("material.inv.number"), value: "" },
            { label: t("material.inv.type"), value: "" },
            { label: t("material.inv.items"), value: 0, type: "number" }
          ], function (v) { m.inventory.unshift({ date: v[0], number: v[1], type: v[2], items: num(v[3]), shortage: 0, status: "new" }); });
        } }))
      ]),
      h("div", { class: "card__body card__body--flush" }, UI.DataTable({
        sticky: true,
        columns: [
          { key: "number", label: t("material.inv.number"), sticky: "left", strong: true },
          { key: "date", label: t("material.inv.date"), render: function (r) { return Fmt.date(r.date); } },
          { key: "type", label: t("material.inv.type") },
          { key: "items", label: t("material.inv.items"), align: "right", render: function (r) { return Fmt.num(r.items); } },
          { key: "shortage", label: t("material.inv.shortage"), align: "right", render: function (r) { return Fmt.num(r.shortage); } },
          { key: "status", label: t("common.status"), render: function (r) { return UI.StatusBadge(r.status); } },
          { key: "act", label: t("common.actions"), sticky: "right", render: function (r) {
            return UI.Button({ icon: "edit", variant: "tertiary", size: "sm", title: t("common.edit"), onClick: function () {
              openEdit(r.number, [
                { label: t("material.inv.type"), value: r.type },
                { label: t("material.inv.items"), value: r.items, type: "number" },
                { label: t("material.inv.shortage"), value: r.shortage, type: "number" }
              ], function (v) { r.type = v[0]; r.items = num(v[1]); r.shortage = num(v[2]); });
            } });
          } }
        ],
        rows: m.inventory
      }))
    ])));
    return wrap;
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
    var reg = currentSections();
    if (!reg[id]) id = isAdminHome() ? "adashboard" : "general";
    current = id;
    try { localStorage.setItem("pb.section", id); } catch (e) {}
    Charts.destroyAll();
    if (locationMap) { try { locationMap.remove(); } catch (e) {} locationMap = null; }
    mainEl.innerHTML = "";
    var node = reg[id]();
    injectCrumbs(node, id);
    mainEl.appendChild(node);
    mountSparklines(node);
    // update nav active + header title
    Object.keys(navEls).forEach(function (k) { navEls[k].classList.toggle("is-active", k === id); });
    document.getElementById("header-title").textContent = t("nav." + id);
    closeMobileSidebar();
    mainEl.scrollTop = 0; window.scrollTo(0, 0);
  }

  /* Markaziy breadcrumb: har sahifa tepasida to'liq yo'l ko'rinadi.
     O'z ichki zanjirini boshqaradigan drill sahifalar mustasno. */
  var CRUMB_SELF_MANAGED = { adashboard: 1, asohalar: 1, aorgdetail: 1 };
  function injectCrumbs(node, id) {
    if (CRUMB_SELF_MANAGED[id]) return;
    var rootId = isAdminHome() ? "adashboard" : "general";
    var parts = [];
    if (id === rootId) {
      parts.push({ label: t("nav." + id) });
    } else {
      parts.push({ label: t("nav." + rootId), onClick: function () { navigate(rootId); } });
      parts.push({ label: t("nav." + id) });
    }
    var bar = UI.Crumbs(parts);
    bar.classList.add("crumbs--page");
    node.insertBefore(bar, node.firstChild);
  }

  /* ------------------------- Admin sahifalari --------------------------- */

  /* Bosh sahifa — hozircha bo'sh; kontent barcha sahifalar tayyor bo'lgach belgilanadi */
  function renderAdminDashboard() {
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.adashboard.title", "page.adashboard.desc"));
    page.appendChild(h("div", { class: "section" }, h("div", { class: "card" },
      h("div", { class: "card__body" }, UI.EmptyState({
        icon: "grid",
        title: t("admin.dash_empty_title"),
        desc: t("admin.dash_empty_desc")
      })))));
    return page;
  }

  /* Ma'lumotlar — barcha tashkilotlar kesimida to'ldirilganlik */
  var admOrgsState = { q: "", region: "all", type: "all", page: 1, per: 20 };
  function renderAdminOrgs() {
    var orgs = getMockOrgs();
    var page = h("div", { class: "page" });
    page.appendChild(pageHead("page.aorgs.title", "page.aorgs.desc", [
      UI.Button({ label: t("admin.full_report"), variant: "primary", icon: "download", onClick: function () { exportOrgsCsv(orgs, "hisobot-to-liq"); } })
    ]));

    // KPI kartalar
    var total = orgs.length;
    var filled = orgs.filter(function (o) { return o.filled; }).length;
    var progress = total - filled;
    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:3;--cols-md:1" }, [
      admKpi("building", t("admin.kpi.orgs"), total, 100, ""),
      admKpi("check", t("admin.kpi.filled"), filled, Math.round(filled / total * 10000) / 100, "ok"),
      admKpi("refresh", t("admin.kpi.progress"), progress, Math.round(progress / total * 10000) / 100, "warn")
    ])));

    // Tablar: Tashkilotlar / Sohalar / Hududlar
    page.appendChild(h("div", { class: "section" }, UI.Tabs({
      items: [
        { id: "orgs", label: t("admin.tab.orgs"), render: function () { return admOrgsTable(orgs); } },
        { id: "fields", label: t("admin.tab.fields"), render: function () { return admGroupTable(orgs, "type", t("admin.filter.type")); } },
        { id: "regions", label: t("admin.tab.regions"), render: function () { return admGroupTable(orgs, "region", t("admin.filter.region")); } }
      ]
    })));
    return page;
  }

  function admKpi(icon, label, value, pct, tone) {
    return h("div", { class: "adm-kpi" }, [
      h("div", { class: "adm-kpi__icon adm-kpi__icon--" + (tone || "brand") }, UI.icon(icon)),
      h("div", { class: "adm-kpi__meta" }, [
        h("div", { class: "adm-kpi__label", text: label }),
        h("div", { class: "adm-kpi__row" }, [
          h("span", { class: "adm-kpi__value", text: typeof value === "number" ? Fmt.num(value) : String(value) }),
          pct == null ? null : h("span", { class: "adm-kpi__pct adm-kpi__pct--" + (tone || "brand"), text: Fmt.num(pct, pct % 1 ? 2 : 0) + " %" })
        ])
      ])
    ]);
  }

  function admOrgsTable(orgs) {
    var wrap = h("div", { class: "staff-panel" });
    var results = h("div");

    var searchInput = h("input", { class: "input org-search__input", type: "text", placeholder: t("org.search_ph"), value: admOrgsState.q });
    searchInput.addEventListener("input", function () { admOrgsState.q = searchInput.value.trim().toLowerCase(); admOrgsState.page = 1; renderResults(); });
    var searchBar = h("div", { class: "org-search adm-search" }, [h("span", { class: "org-search__icon" }, UI.icon("search")), searchInput]);

    var regionSel = UI.Select({
      value: admOrgsState.region,
      options: [{ value: "all", label: t("admin.filter.region") + ": " + t("staff.filter.all") }].concat((global.UZB_VILOYATLAR || []).map(function (r) { return { value: r, label: r }; })),
      onChange: function (v) { admOrgsState.region = v; admOrgsState.page = 1; renderResults(); }
    });
    regionSel.classList.add("adm-filter");

    var toolbar = h("div", { class: "adm-toolbar" }, [
      searchBar, regionSel,
      h("span", { class: "header__spacer" }),
      UI.Button({ label: t("admin.excel"), variant: "secondary", size: "sm", icon: "download", onClick: function () { exportOrgsCsv(filtered(), "tashkilotlar"); } })
    ]);
    wrap.appendChild(toolbar);
    wrap.appendChild(results);

    function filtered() {
      return getMockOrgs().filter(function (o) {
        if (admOrgsState.region !== "all" && o.region !== admOrgsState.region) return false;
        if (admOrgsState.q && o.name.toLowerCase().indexOf(admOrgsState.q) < 0 && o.stir.indexOf(admOrgsState.q) < 0) return false;
        return true;
      });
    }
    function renderResults() {
      results.innerHTML = "";
      var list = filtered();
      var total = list.length, pages = Math.max(1, Math.ceil(total / admOrgsState.per));
      if (admOrgsState.page > pages) admOrgsState.page = pages;
      var start = (admOrgsState.page - 1) * admOrgsState.per;
      var items = list.slice(start, start + admOrgsState.per);
      if (!items.length) { results.appendChild(UI.EmptyState({ icon: "search", title: t("common.not_found") })); return; }
      results.appendChild(h("div", { class: "card" }, h("div", { class: "card__body card__body--flush" }, UI.DataTable({
        sticky: true,
        columns: [
          { key: "n", label: "T/R", render: function (r) { return String(getMockOrgs().indexOf(r) + 1); } },
          { key: "name", label: t("admin.col.name"), sticky: "left", strong: true },
          { key: "stir", label: "STIR" },
          { key: "menusTotal", label: t("admin.col.menus"), align: "right" },
          { key: "menusInProgress", label: t("admin.col.inprogress"), align: "right" },
          { key: "menusUnfilled", label: t("admin.col.unfilled"), align: "right" },
          { key: "fillPct", label: t("admin.col.pct"), align: "right", render: function (r) { return Fmt.num(r.fillPct, 2) + " %"; } },
          { key: "act", label: t("common.actions"), sticky: "right", render: function (r) {
            return UI.Button({ icon: "eye", variant: "secondary", size: "sm", title: t("common.view", "Ko‘rish"), onClick: function () { global.App.openOrgDetail(r); } });
          } }
        ],
        rows: items,
        onRow: function (r) { global.App.openOrgDetail(r); }
      }))));
      results.appendChild(orgListPager(admOrgsState, total, pages, renderResults));
    }
    renderResults();
    return wrap;
  }

  /* Soha/Hudud kesimidagi jamlanma jadval */
  function admGroupTable(orgs, field, colLabel) {
    var map = {};
    orgs.forEach(function (o) {
      var k = o[field] || "—";
      if (!map[k]) map[k] = { key: k, count: 0, filled: 0, pctSum: 0 };
      map[k].count++; if (o.filled) map[k].filled++; map[k].pctSum += o.fillPct;
    });
    var rows = Object.keys(map).sort().map(function (k) { return map[k]; });
    return h("div", { class: "card" }, h("div", { class: "card__body card__body--flush" }, UI.DataTable({
      sticky: true,
      columns: [
        { key: "key", label: colLabel, sticky: "left", strong: true },
        { key: "count", label: t("admin.col.orgs"), align: "right", render: function (r) { return Fmt.num(r.count); } },
        { key: "filled", label: t("admin.kpi.filled"), align: "right", render: function (r) { return Fmt.num(r.filled); } },
        { key: "progress", label: t("admin.kpi.progress"), align: "right", render: function (r) { return Fmt.num(r.count - r.filled); } },
        { key: "pct", label: t("admin.col.pct"), align: "right", render: function (r) { return Fmt.num(r.pctSum / r.count, 2) + " %"; } }
      ],
      rows: rows
    })));
  }

  /* Umumiy pager (Ma'lumotlar jadvali uchun) */
  function orgListPager(state, total, pages, rerender) {
    var wrap = h("div", { class: "org-pager" });
    var nav = h("div", { class: "org-pager__nav" });
    function btn(label, page, opts) {
      opts = opts || {};
      return h("button", { class: "org-page" + (opts.active ? " is-active" : "") + (opts.dis ? " is-dis" : ""), type: "button", disabled: opts.dis,
        onClick: function () { if (!opts.dis && page) { state.page = page; rerender(); } } }, label);
    }
    nav.appendChild(btn(UI.icon("chevron-left"), state.page - 1, { dis: state.page <= 1 }));
    var win = [];
    for (var p = 1; p <= pages; p++) { if (p === 1 || p === pages || Math.abs(p - state.page) <= 1) win.push(p); else if (win[win.length - 1] !== "…") win.push("…"); }
    win.forEach(function (p) { nav.appendChild(p === "…" ? h("span", { class: "org-page__ell", text: "…" }) : btn(String(p), p, { active: p === state.page })); });
    nav.appendChild(btn(UI.icon("chevron-right"), state.page + 1, { dis: state.page >= pages }));
    wrap.appendChild(h("div", { class: "org-pager__info", text: Fmt.num(total) + " ta " + (state.noun || "tashkilot") }));
    wrap.appendChild(nav);
    return wrap;
  }

  /* CSV eksport (Excel ochadi) */
  function exportOrgsCsv(list, name) {
    var head = ["T/R", t("admin.col.name"), "STIR", t("admin.filter.region"), t("admin.col.menus"), t("admin.col.inprogress"), t("admin.col.unfilled"), t("admin.col.pct")];
    var lines = [head.join(";")];
    list.forEach(function (o, i) {
      lines.push([i + 1, '"' + o.name.replace(/"/g, '""') + '"', o.stir, o.region, o.menusTotal, o.menusInProgress, o.menusUnfilled, o.fillPct + "%"].join(";"));
    });
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name + ".csv";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ----------------------------- Shell ---------------------------------- */
  function buildShell() {
    var app = document.getElementById("app");

    // Sidebar
    var nav = h("nav", { class: "sidebar__nav" });
    if (ROLE === "admin" && adminCtx.org) {
      nav.appendChild(h("button", { class: "nav-item nav-item--back", type: "button", dataset: { label: t("admin.back") }, onClick: adminBackToList }, [
        h("span", { class: "nav-item__icon" }, UI.icon("chevron-left")),
        h("span", { class: "nav-item__label", text: t("admin.back") })
      ]));
    }
    if (!isAdminHome()) nav.appendChild(h("div", { class: "sidebar__nav-label", "data-i18n": "nav.menu", text: t("nav.menu") }));
    currentNavItems().forEach(function (item) {
      if (item.heading) { nav.appendChild(h("div", { class: "sidebar__nav-label", text: t(item.heading) })); return; }
      var el = h("button", { class: "nav-item", type: "button", dataset: { label: t("nav." + item.id) }, onClick: function () {
        if (global.AdminPages && global.AdminPages.resetDrill) global.AdminPages.resetDrill(item.id);
        navigate(item.id);
      } }, [
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
          h("div", { class: "sidebar__brand-sub", text: ROLE === "admin" ? t("app.subtitle_admin") : t("app.subtitle") })
        ]),
        collapseBtn
      ]),
      nav,
      h("div", { class: "sidebar__footer" }, orgChip())
    ]);

    var scrim = h("div", { class: "scrim", id: "sidebar-scrim", onClick: closeMobileSidebar });

    // Header
    var header = h("header", { class: "header" }, [
      h("div", { class: "header__inner" }, [
        h("button", { class: "hamburger", type: "button", "aria-label": "Menu", onClick: openMobileSidebar }, UI.icon("menu")),
        h("div", { class: "header__title", id: "header-title", text: t("nav.general") }),
        h("div", { class: "header__spacer" }),
        h("div", { class: "header__actions" }, [themeToggle(), profile()])
      ])
    ]);

    mainEl = h("main", { class: "main", id: "main" });

    app.appendChild(sidebar);
    app.appendChild(scrim);
    app.appendChild(header);
    app.appendChild(mainEl);
  }

  function orgChip() {
    if (ROLE === "admin" && adminCtx.org) {
      return h("div", { class: "org-chip flex items-center gap-md" }, [
        h("div", { class: "avatar", text: "TA" }),
        h("div", { class: "org-chip__text", style: "min-width:0" }, [
          h("div", { class: "font-medium", style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap", text: adminCtx.org.name, title: adminCtx.org.name }),
          h("div", { class: "text-tertiary text-xs", text: "STIR: " + adminCtx.org.stir })
        ])
      ]);
    }
    if (ROLE === "admin") {
      return h("div", { class: "org-chip flex items-center gap-md" }, [
        h("div", { class: "avatar", text: "AD" }),
        h("div", { class: "org-chip__text", style: "min-width:0" }, [
          h("div", { class: "font-medium", style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap", text: t("admin.all_orgs") }),
          h("div", { class: "text-tertiary text-xs", text: Fmt.num(getMockOrgs().length) + " ta tashkilot" })
        ])
      ]);
    }
    return h("div", { class: "org-chip flex items-center gap-md" }, [
      h("div", { class: "avatar", text: "TT" }),
      h("div", { class: "org-chip__text", style: "min-width:0" }, [
        h("div", { class: "font-medium", style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap", "data-i18n": "app.org", text: t("app.org"), title: t("app.org") }),
        h("div", { class: "text-tertiary text-xs", "data-i18n": "app.org_short", text: t("app.org_short") })
      ])
    ]);
  }

  /* ---- Organization picker (admin: choose organization) ---- */
  var _mockOrgs = null;
  function getMockOrgs() {
    if (_mockOrgs) return _mockOrgs;
    var types = [
      "Umumta’lim maktabi (I guruh) (Kontingent 1601 va undan ortiq)",
      "Umumta’lim maktabi (IV guruh) (Kontingent 400 nafargacha)",
      "Umumta’lim maktabi (III guruh) (Kontingent 401–880 nafargacha)",
      "Umumiy turdagi davlat maktabgacha ta’lim tashkiloti",
      "Oilaviy poliklinikalar",
      "Ixtisoslashtirilgan markazlar, shifoxonalar va koykali dispanserlar",
      "Tuman markaziy shifoxonasi"
    ];
    var regions = global.UZB_VILOYATLAR || [];
    var list = [{ name: "“" + t("app.org").toUpperCase() + "” DAVLAT MUASSASASI", stir: "201190732", type: types[5], current: true }];
    for (var i = 1; i <= 239; i++) {
      var n = 100 + i;
      var stir = "2" + String(100000000 + (i * 7919) % 899999999);
      list.push({ name: "“" + n + "-SONLI UMUMIY O‘RTA TA’LIM MAKTABI” DAVLAT MUASSASASI", stir: stir.slice(0, 9), type: types[i % types.length] });
    }
    // Admin ko'rinishi uchun determinstik to'ldirilganlik ma'lumotlari
    list.forEach(function (o, i) {
      o.region = regions.length ? regions[i % regions.length] : "—";
      o.menusTotal = 2 + (i % 3);                               // 2..4
      o.menusInProgress = o.menusTotal - (i % 9 === 0 ? 1 : 0); // ~11% da 1 tasi qolgan
      o.menusUnfilled = o.menusTotal - o.menusInProgress;
      o.fillPct = i % 9 === 0 ? 80 + (i % 17) : 92 + (i % 9);   // 80..100
      if (o.fillPct > 100) o.fillPct = 100;
      o.filled = i % 9 !== 0;
    });
    _mockOrgs = list;
    return list;
  }

  function orgCard(o) {
    return h("button", { class: "org-card" + (o.current ? " is-current" : ""), type: "button", title: o.name, onClick: function () {
      UI.closeModal();
      if (ROLE === "admin") global.App.openOrgDetail(o); // admin: tanlangan tashkilot ma'lumotiga o'tish
    } }, [
      h("div", { class: "org-card__head" }, [
        h("div", { class: "org-card__icon" }, UI.icon("building")),
        o.current ? UI.StatusBadge("", { variant: "success", label: "Joriy", dotless: true }) : h("span")
      ]),
      h("div", { class: "org-card__name", text: o.name }),
      h("div", { class: "org-card__stir" }, ["STIR: ", h("span", { class: "mono", text: o.stir })]),
      h("div", { class: "org-card__type", text: o.type })
    ]);
  }

  function openOrgPicker() {
    var orgs = getMockOrgs();
    var state = { q: "", page: 1, per: 20 };
    var results = h("div", { class: "org-results" });

    var searchInput = h("input", { class: "input org-search__input", type: "text", placeholder: t("org.search_ph") });
    searchInput.addEventListener("input", function () { state.q = searchInput.value.trim().toLowerCase(); state.page = 1; renderResults(); });
    var searchBar = h("div", { class: "org-search" }, [h("span", { class: "org-search__icon" }, UI.icon("search")), searchInput]);

    function filtered() {
      if (!state.q) return orgs;
      return orgs.filter(function (o) { return o.name.toLowerCase().indexOf(state.q) >= 0 || o.stir.indexOf(state.q) >= 0; });
    }
    function pager(total, pages) {
      var wrap = h("div", { class: "org-pager" });
      var nav = h("div", { class: "org-pager__nav" });
      function btn(label, page, opts) {
        opts = opts || {};
        return h("button", { class: "org-page" + (opts.active ? " is-active" : "") + (opts.dis ? " is-dis" : ""), type: "button", disabled: opts.dis,
          onClick: function () { if (!opts.dis && page) { state.page = page; renderResults(); } } }, label);
      }
      nav.appendChild(btn(UI.icon("chevron-left"), state.page - 1, { dis: state.page <= 1 }));
      var win = [];
      for (var p = 1; p <= pages; p++) { if (p === 1 || p === pages || Math.abs(p - state.page) <= 1) win.push(p); else if (win[win.length - 1] !== "…") win.push("…"); }
      win.forEach(function (p) { nav.appendChild(p === "…" ? h("span", { class: "org-page__ell", text: "…" }) : btn(String(p), p, { active: p === state.page })); });
      nav.appendChild(btn(UI.icon("chevron-right"), state.page + 1, { dis: state.page >= pages }));
      wrap.appendChild(h("div", { class: "org-pager__info", text: Fmt.num(total) + " ta tashkilot" }));
      wrap.appendChild(nav);
      return wrap;
    }
    function renderResults() {
      results.innerHTML = "";
      var list = filtered();
      var total = list.length, pages = Math.max(1, Math.ceil(total / state.per));
      if (state.page > pages) state.page = pages;
      var start = (state.page - 1) * state.per;
      var items = list.slice(start, start + state.per);
      if (!items.length) { results.appendChild(UI.EmptyState({ icon: "search", title: t("common.not_found") })); return; }
      results.appendChild(h("div", { class: "org-grid" }, items.map(orgCard)));
      results.appendChild(pager(total, pages));
    }

    UI.openModal({ title: t("org.select"), size: "full", body: [searchBar, results] });
    renderResults();
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
      h("div", { class: "profile-panel__roles" }, [
        h("div", { class: "profile-panel__roles-label", text: t("role.label") }),
        roleItem("org", "building", t("role.org")),
        roleItem("admin", "shield", t("role.admin"))
      ]),
      h("div", { class: "profile-panel__actions" }, [
        ROLE === "admin" ? UI.Button({ label: "Tashkilot tanlash", variant: "secondary", icon: "switch", onClick: function () { panel.classList.remove("is-open"); openOrgPicker(); } }) : null,
        h("button", { class: "btn btn--danger-ghost", type: "button", onClick: function () { window.location.href = "login.html"; } }, [
          UI.icon("logout"), h("span", { text: "Tizimdan chiqish" })
        ])
      ])
    ]);
    function roleItem(r, icon, label) {
      var active = ROLE === r;
      return h("button", {
        class: "role-item" + (active ? " is-active" : ""), type: "button",
        onClick: function () { if (!active) { panel.classList.remove("is-open"); setRole(r); } }
      }, [
        h("span", { class: "role-item__icon" }, UI.icon(icon)),
        h("span", { class: "role-item__label", text: label }),
        active ? UI.icon("check", "role-item__check") : null
      ]);
    }
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

  global.App = {
    navigate: function (id) { navigate(id); },
    refresh: function () { navigate(current); },
    openOrg: adminOpenOrg,
    openOrgDetail: function (o) { global.AdminPages.setDetailOrg(o); navigate("aorgdetail"); },
    renderSection: function (id) { return SECTIONS[id] ? SECTIONS[id]() : null; }, // org bo'limini boshqa sahifa ichiga joylash uchun
    orgs: getMockOrgs,
    pager: orgListPager,
    kpi: admKpi
  };
})(window);
