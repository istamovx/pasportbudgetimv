/* ==========================================================================
   Administrator sahifalari: Tashkilotlar, Foydalanuvchilar, Konstruktor,
   Klassifikatorlar, So'rovlar jurnali.
   app.js dagi App.{refresh, openOrg, pager} hook'laridan foydalanadi.
   ========================================================================== */
(function (global) {
  "use strict";
  var t = function (k, f) { return global.I18N ? I18N.t(k, f) : (f || k); };
  function h() { return UI.h.apply(null, arguments); }
  function AD() { return global.ADMIN_DATA; }

  /* Drawer orqali tahrirlash (app.js openEdit bilan bir xil uslub) */
  function editDrawer(desc, specs, apply) {
    var fields = specs.map(function (s) {
      return UI.FormField({ label: s.label, value: s.value != null ? s.value : "", type: s.type || "text", options: s.options, placeholder: s.placeholder });
    });
    UI.openDrawer({
      title: t("common.edit"), desc: desc, body: fields,
      onSave: function () {
        var vals = fields.map(function (f) { return f._input ? f._input.value : null; });
        if (apply) apply(vals);
        App.refresh();
      }
    });
  }

  function pageHead(title, desc, actions) {
    var head = h("div", { class: "page__head flex justify-between items-start gap-lg flex-wrap" }, [
      h("div", {}, [h("h1", { class: "page__title", text: title }), desc ? h("p", { class: "page__desc", text: desc }) : null])
    ]);
    if (actions) head.appendChild(h("div", { class: "flex gap-md flex-wrap" }, actions));
    return head;
  }

  function roleBadge(role) {
    var map = { admin: ["brand", t("role.admin")], manager: ["warning", t("users.role.manager")], user: ["neutral", t("users.role.user")] };
    var m = map[role] || map.user;
    return h("span", { class: "badge badge--dotless badge--" + m[0], text: m[1] });
  }

  /* ======================= 1. Tashkilotlar (reestr) ====================== */
  var orgState = { q: "", region: "all", status: "all", page: 1, per: 15, sel: {} };

  function renderOrgManage() {
    var page = h("div", { class: "page" });
    page.appendChild(pageHead(t("page.aorgmanage.title"), t("page.aorgmanage.desc")));

    var results = h("div");
    var searchInput = h("input", { class: "input org-search__input", type: "text", placeholder: t("org.search_ph"), value: orgState.q });
    searchInput.addEventListener("input", function () { orgState.q = searchInput.value.trim().toLowerCase(); orgState.page = 1; renderResults(); });

    var regionSel = UI.Select({
      value: orgState.region,
      options: [{ value: "all", label: t("admin.filter.region") + ": " + t("staff.filter.all") }].concat((global.UZB_VILOYATLAR || []).map(function (r) { return { value: r, label: r }; })),
      onChange: function (v) { orgState.region = v; orgState.page = 1; renderResults(); }
    });
    regionSel.classList.add("adm-filter");
    var statusSel = UI.Select({
      value: orgState.status,
      options: [
        { value: "all", label: t("common.status") + ": " + t("staff.filter.all") },
        { value: "active", label: t("st.active", "Faol") },
        { value: "progress", label: t("admin.kpi.progress") }
      ],
      onChange: function (v) { orgState.status = v; orgState.page = 1; renderResults(); }
    });
    statusSel.classList.add("adm-filter");

    page.appendChild(h("div", { class: "section" }, h("div", { class: "adm-toolbar" }, [
      h("div", { class: "org-search adm-search" }, [h("span", { class: "org-search__icon" }, UI.icon("search")), searchInput]),
      regionSel, statusSel,
      h("span", { class: "header__spacer" }),
      h("span", { class: "text-tertiary text-xs", text: t("admin.bulk_hint") })
    ])));
    page.appendChild(results);

    function orgsOf() { return global.App && App.orgs ? App.orgs() : []; }
    function filtered() {
      return orgsOf().filter(function (o) {
        if (orgState.region !== "all" && o.region !== orgState.region) return false;
        if (orgState.status === "active" && !o.filled) return false;
        if (orgState.status === "progress" && o.filled) return false;
        if (orgState.q && o.name.toLowerCase().indexOf(orgState.q) < 0 && o.stir.indexOf(orgState.q) < 0) return false;
        return true;
      });
    }
    function renderResults() {
      results.innerHTML = "";
      var list = filtered();
      var total = list.length, pages = Math.max(1, Math.ceil(total / orgState.per));
      if (orgState.page > pages) orgState.page = pages;
      var items = list.slice((orgState.page - 1) * orgState.per, (orgState.page - 1) * orgState.per + orgState.per);
      if (!items.length) { results.appendChild(UI.EmptyState({ icon: "search", title: t("common.not_found") })); return; }
      results.appendChild(h("div", { class: "card" }, h("div", { class: "card__body card__body--flush" }, UI.DataTable({
        sticky: true,
        columns: [
          { key: "name", label: t("admin.col.name"), sticky: "left", strong: true },
          { key: "stir", label: "STIR" },
          { key: "type", label: t("material.type") },
          { key: "region", label: t("admin.filter.region") },
          { key: "status", label: t("common.status"), render: function (r) { return UI.StatusBadge(r.filled ? "active" : "pending"); } },
          { key: "act", label: t("common.actions"), sticky: "right", render: function (r) {
            return h("div", { class: "flex gap-sm" }, [
              UI.Button({ icon: "eye", variant: "secondary", size: "sm", title: t("common.view", "Ko‘rish"), onClick: function () { App.openOrg(r); } }),
              UI.Button({ icon: "edit", variant: "secondary", size: "sm", title: t("common.edit"), onClick: function () {
                editDrawer(r.name, [
                  { label: t("admin.col.name"), value: r.name },
                  { label: "STIR", value: r.stir },
                  { label: t("material.type"), value: r.type }
                ], function (v) { r.name = v[0]; r.stir = v[1]; r.type = v[2]; });
              } })
            ]);
          } }
        ],
        rows: items
      }))));
      results.appendChild(App.pager(orgState, total, pages, renderResults));
    }
    renderResults();
    return page;
  }

  /* ======================= 2. Foydalanuvchilar ========================== */
  var usersState = { tab: "user", q: "" };

  function renderUsers() {
    var page = h("div", { class: "page" });
    page.appendChild(pageHead(t("page.ausers.title"), t("page.ausers.desc"), [
      UI.Button({ label: t("common.add"), variant: "primary", icon: "plus", onClick: function () {
        editDrawer(t("page.ausers.title"), [
          { label: "F.I.O", value: "" },
          { label: "JShShIR", value: "" }
        ], function (v) { AD().users.unshift({ fio: v[0], pinfl: v[1], org: "", stir: "", role: usersState.tab }); });
      } })
    ]));

    page.appendChild(UI.Tabs({
      active: usersState.tab,
      items: [
        { id: "user", label: t("users.tab.users"), render: function () { usersState.tab = "user"; return usersPanel("user"); } },
        { id: "manager", label: t("users.tab.managers"), render: function () { usersState.tab = "manager"; return usersPanel("manager"); } },
        { id: "admin", label: t("users.tab.admins"), render: function () { usersState.tab = "admin"; return usersPanel("admin"); } }
      ]
    }));
    return page;
  }

  function usersPanel(role) {
    var wrap = h("div", { class: "staff-panel" });
    var results = h("div");
    var searchInput = h("input", { class: "input org-search__input", type: "text", placeholder: "JShShIR yoki F.I.O...", value: usersState.q });
    searchInput.addEventListener("input", function () { usersState.q = searchInput.value.trim().toLowerCase(); renderList(); });
    wrap.appendChild(h("div", { class: "adm-toolbar" }, h("div", { class: "org-search adm-search" }, [h("span", { class: "org-search__icon" }, UI.icon("search")), searchInput])));
    wrap.appendChild(results);

    function renderList() {
      results.innerHTML = "";
      var list = AD().users.filter(function (u) {
        if (u.role !== role) return false;
        if (usersState.q && u.fio.toLowerCase().indexOf(usersState.q) < 0 && u.pinfl.indexOf(usersState.q) < 0) return false;
        return true;
      });
      if (!list.length) { results.appendChild(UI.EmptyState({ icon: "users", title: t("common.not_found") })); return; }
      results.appendChild(h("div", { class: "card" }, h("div", { class: "card__body card__body--flush" }, UI.DataTable({
        sticky: true,
        columns: [
          { key: "fio", label: "F.I.O", sticky: "left", strong: true },
          { key: "pinfl", label: "JShShIR", render: function (r) { return h("span", { class: "mono", text: r.pinfl }); } },
          { key: "org", label: t("role.org"), render: function (r) { return r.org ? r.org + (r.stir ? " · " + r.stir : "") : "—"; } },
          { key: "role", label: t("role.label"), render: function (r) { return roleBadge(r.role); } },
          { key: "act", label: t("common.actions"), sticky: "right", render: function (r) {
            return h("div", { class: "flex gap-sm" }, [
              UI.Button({ label: t("users.assign_org"), variant: "secondary", size: "sm", icon: "building", onClick: function () { assignOrgDrawer(r); } }),
              UI.Button({ label: t("users.change_role"), variant: "secondary", size: "sm", icon: "switch", onClick: function () { changeRoleDrawer(r); } })
            ]);
          } }
        ],
        rows: list
      }))));
    }
    renderList();
    return wrap;
  }

  function assignOrgDrawer(u) {
    var orgs = App.orgs();
    var listHost = h("div", { class: "assign-list" });
    var search = h("input", { class: "input", type: "text", placeholder: t("org.search_ph") });
    function renderList() {
      listHost.innerHTML = "";
      var q = search.value.trim().toLowerCase();
      var found = orgs.filter(function (o) { return !q || o.name.toLowerCase().indexOf(q) >= 0 || o.stir.indexOf(q) >= 0; }).slice(0, 8);
      if (!found.length) { listHost.appendChild(UI.EmptyState({ icon: "search", title: t("common.not_found") })); return; }
      found.forEach(function (o) {
        listHost.appendChild(h("button", { class: "assign-row" + (u.stir === o.stir ? " is-sel" : ""), type: "button", onClick: function () {
          u.org = o.name; u.stir = o.stir; UI.closeDrawer(); App.refresh();
        } }, [
          h("span", { class: "assign-row__icon" }, UI.icon("building")),
          h("span", { class: "assign-row__meta" }, [
            h("span", { class: "assign-row__name", text: o.name }),
            h("span", { class: "assign-row__stir", text: "STIR: " + o.stir })
          ]),
          u.stir === o.stir ? UI.icon("check", "assign-row__check") : null
        ]));
      });
    }
    search.addEventListener("input", renderList);
    UI.openDrawer({ title: t("users.assign_org"), desc: u.fio, body: [search, listHost], footer: false });
    renderList();
  }

  function changeRoleDrawer(u) {
    var sel = UI.Select({
      value: u.role,
      options: [
        { value: "user", label: t("users.role.user") },
        { value: "manager", label: t("users.role.manager") },
        { value: "admin", label: t("role.admin") }
      ]
    });
    UI.openDrawer({
      title: t("users.change_role"), desc: u.fio,
      body: h("div", { class: "field" }, [h("label", { class: "field__label", text: t("role.label") }), sel]),
      onSave: function () { u.role = sel.value; App.refresh(); }
    });
  }

  /* ======================= 3. Klassifikatorlar ========================== */
  var clsState = { item: null, q: "", region: "all" };

  function renderClassifiers() {
    var groups = AD().classifiers;
    if (!clsState.item) clsState.item = groups[0].items[0];
    var page = h("div", { class: "page" });
    page.appendChild(pageHead(t("page.aclassifiers.title"), t("page.aclassifiers.desc")));

    var detail = h("div", { class: "cls-detail" });
    var sideList = h("div", { class: "cls-list" });
    var search = h("input", { class: "input", type: "text", placeholder: t("common.search", "Qidirish...") });
    search.addEventListener("input", function () { clsState.q = search.value.trim().toLowerCase(); renderSide(); });

    function renderSide() {
      sideList.innerHTML = "";
      groups.forEach(function (g) {
        var items = g.items.filter(function (it) { return !clsState.q || it.label.toLowerCase().indexOf(clsState.q) >= 0; });
        if (!items.length) return;
        sideList.appendChild(h("div", { class: "cls-group-label", text: g.label }));
        items.forEach(function (it) {
          sideList.appendChild(h("button", {
            class: "cls-item" + (clsState.item === it ? " is-active" : ""), type: "button",
            onClick: function () { clsState.item = it; clsState.region = "all"; renderSide(); renderDetail(); }
          }, [h("span", { class: "cls-item__label", text: it.label }), h("span", { class: "count-pill", text: String(it.rows.length) })]));
        });
      });
    }

    function renderDetail() {
      detail.innerHTML = "";
      var it = clsState.item;
      var head = h("div", { class: "card__head" }, [
        h("div", {}, h("div", { class: "card__title", text: it.label })),
        h("div", { class: "card__head-actions" }, UI.Button({ label: t("common.add"), variant: "primary", size: "sm", icon: "plus", onClick: function () {
          editDrawer(it.label, (it.cols || [{ key: "name", label: t("common.name") }]).map(function (c) { return { label: c.label, value: "" }; }),
            function (v) { var row = {}; (it.cols || [{ key: "name" }]).forEach(function (c, i) { row[c.key] = v[i]; }); if (it.regionFilter) row.region = clsState.region !== "all" ? clsState.region : (global.UZB_VILOYATLAR || [])[0]; it.rows.unshift(row); });
        } }))
      ]);
      var body = h("div", { class: "card__body card__body--flush" });
      var rows = it.rows;
      if (it.regionFilter) {
        var regSel = UI.Select({
          value: clsState.region,
          options: [{ value: "all", label: t("admin.filter.region") + ": " + t("staff.filter.all") }].concat((global.UZB_VILOYATLAR || []).map(function (r) { return { value: r, label: r }; })),
          onChange: function (v) { clsState.region = v; renderDetail(); }
        });
        regSel.classList.add("adm-filter");
        head.querySelector(".card__head-actions").prepend(regSel);
        if (clsState.region !== "all") rows = rows.filter(function (r) { return r.region === clsState.region; });
      }
      var cols = (it.cols || [{ key: "name", label: t("common.name") }]).map(function (c) { return { key: c.key, label: c.label, strong: c.key === "name" }; });
      cols.push({ key: "act", label: t("common.actions"), align: "right", render: function (r) {
        return h("div", { class: "flex gap-sm justify-end" }, [
          UI.Button({ icon: "edit", variant: "tertiary", size: "sm", title: t("common.edit"), onClick: function () {
            editDrawer(it.label, (it.cols || [{ key: "name", label: t("common.name") }]).map(function (c) { return { label: c.label, value: r[c.key] }; }),
              function (v) { (it.cols || [{ key: "name" }]).forEach(function (c, i) { r[c.key] = v[i]; }); });
          } }),
          UI.Button({ icon: "trash", variant: "tertiary", size: "sm", title: t("common.delete"), onClick: function () {
            var i = it.rows.indexOf(r); if (i >= 0) it.rows.splice(i, 1); App.refresh();
          } })
        ]);
      } });
      body.appendChild(UI.DataTable({ columns: cols, rows: rows, empty: { icon: "inbox" } }));
      detail.appendChild(h("div", { class: "card" }, [head, body]));
    }

    page.appendChild(h("div", { class: "section cls-layout" }, [
      h("div", { class: "cls-side card" }, [h("div", { class: "cls-side__search" }, search), sideList]),
      detail
    ]));
    renderSide(); renderDetail();
    return page;
  }

  /* ======================= 4. Konstruktor =============================== */
  var conState = { soha: null, dir: null, menu: null, sub: null, builderView: "menus" };

  function renderConstructor() {
    var page = h("div", { class: "page" });
    page.appendChild(pageHead(t("page.aconstructor.title"), t("page.aconstructor.desc")));
    page.appendChild(UI.Tabs({
      items: [
        { id: "sohalar", label: t("con.tab.sohalar"), render: sohalarPanel },
        { id: "shtat", label: t("con.tab.shtat"), render: shtatPanel },
        { id: "builder", label: t("con.tab.builder"), render: builderPanel }
      ]
    }));
    return page;
  }

  /* --- 4a. Sohalar: soha -> yo'nalish -> menyu -> maydonlar --- */
  function sohalarPanel() {
    var wrap = h("div", { class: "staff-panel" });
    var host = h("div");
    wrap.appendChild(host);

    function renderRoot() {
      host.innerHTML = "";
      if (!conState.soha) {
        var grid = h("div", { class: "card" }, h("div", { class: "card__body card__body--flush" }, UI.DataTable({
          columns: [
            { key: "n", label: "T/R", render: function (r) { return String(AD().sohalar.indexOf(r) + 1); } },
            { key: "name", label: t("common.name"), strong: true },
            { key: "dirs", label: t("con.directions"), align: "right", render: function (r) { return String(r.directions.length); } },
            { key: "act", label: t("common.actions"), align: "right", render: function (r) {
              return UI.Button({ icon: "chevron-right", variant: "secondary", size: "sm", title: t("common.view", "Ko‘rish"), onClick: function () {
                conState.soha = r; conState.dir = r.directions[0]; conState.menu = null; conState.sub = null; renderRoot();
              } });
            } }
          ],
          rows: AD().sohalar
        })));
        host.appendChild(grid);
        return;
      }
      // Soha detail: 3 ustunli konfigurator
      var s = conState.soha;
      host.appendChild(h("div", { class: "con-head" }, [
        UI.Button({ label: t("common.back", "Ortga"), variant: "secondary", size: "sm", icon: "chevron-left", onClick: function () { conState.soha = null; renderRoot(); } }),
        h("div", { class: "con-head__title", text: s.name })
      ]));
      var cols = h("div", { class: "con-cols" });

      // 1-ustun: yo'nalishlar
      var dirCol = h("div", { class: "con-col card" });
      dirCol.appendChild(h("div", { class: "con-col__title", text: t("con.directions") }));
      s.directions.forEach(function (d) {
        dirCol.appendChild(h("button", { class: "con-row" + (conState.dir === d ? " is-active" : ""), type: "button", onClick: function () { conState.dir = d; conState.menu = null; conState.sub = null; renderRoot(); } }, [
          h("span", { class: "con-row__code", text: d.code }),
          h("span", { class: "con-row__label", text: d.name })
        ]));
      });

      // 2-ustun: menyular va submenyular
      var menuCol = h("div", { class: "con-col card" });
      menuCol.appendChild(h("div", { class: "con-col__title", text: t("con.pick_menu") }));
      (conState.dir ? conState.dir.menus : []).forEach(function (m) {
        menuCol.appendChild(h("button", { class: "con-row" + (conState.menu === m ? " is-active" : ""), type: "button", onClick: function () { conState.menu = conState.menu === m ? null : m; conState.sub = null; renderRoot(); } }, [
          h("span", { class: "con-row__label", text: m.label }),
          UI.icon(conState.menu === m ? "chevron-down" : "chevron-right", "con-row__chev")
        ]));
        if (conState.menu === m) m.submenus.forEach(function (sm) {
          menuCol.appendChild(h("button", { class: "con-row con-row--sub" + (conState.sub === sm ? " is-active" : ""), type: "button", onClick: function () { conState.sub = sm; renderRoot(); } },
            h("span", { class: "con-row__label", text: sm.label })));
        });
      });

      // 3-ustun: maydonlar (checkbox)
      var fieldCol = h("div", { class: "con-col card" });
      if (conState.sub) {
        fieldCol.appendChild(h("div", { class: "con-col__title", text: conState.sub.label }));
        conState.sub.fields.forEach(function (f) {
          var cb = h("input", { type: "checkbox" });
          cb.checked = f.on;
          cb.addEventListener("change", function () { f.on = cb.checked; });
          fieldCol.appendChild(h("label", { class: "con-check" }, [cb, h("span", { text: f.label })]));
        });
        fieldCol.appendChild(h("div", { class: "con-col__foot" }, [
          UI.Button({ label: t("common.cancel"), variant: "secondary", size: "sm", onClick: renderRoot }),
          UI.Button({ label: t("common.save"), variant: "primary", size: "sm", onClick: function () { renderRoot(); } })
        ]));
      } else {
        fieldCol.appendChild(UI.EmptyState({ icon: "check", title: t("con.pick_sub") }));
      }

      cols.appendChild(dirCol); cols.appendChild(menuCol); cols.appendChild(fieldCol);
      host.appendChild(cols);
    }
    renderRoot();
    return wrap;
  }

  /* --- 4b. Shtat shablonlari --- */
  function shtatPanel() {
    var wrap = h("div", { class: "staff-panel" });
    wrap.appendChild(h("div", { class: "card" }, h("div", { class: "card__body card__body--flush" }, UI.DataTable({
      sticky: true,
      columns: [
        { key: "n", label: "T/R", render: function (r) { return String(AD().shtatTemplates.indexOf(r) + 1); } },
        { key: "name", label: t("common.name"), sticky: "left", strong: true },
        { key: "created", label: t("con.created"), render: function (r) { return Fmt.date(r.created); } },
        { key: "updated", label: t("con.updated"), render: function (r) { return Fmt.date(r.updated); } },
        { key: "sohalar", label: t("con.tab.sohalar"), render: function (r) { return r.sohalar.join(", "); } },
        { key: "act", label: t("common.actions"), sticky: "right", render: function (r) {
          return UI.Button({ label: t("con.assign_soha"), variant: "secondary", size: "sm", icon: "switch", onClick: function () { assignSohaDrawer(r); } });
        } }
      ],
      rows: AD().shtatTemplates
    }))));
    return wrap;
  }

  function assignSohaDrawer(tpl) {
    var body = h("div", { class: "assign-list" });
    AD().sohalar.forEach(function (s) {
      var cb = h("input", { type: "checkbox" });
      cb.checked = tpl.sohalar.indexOf(s.name) >= 0;
      cb.addEventListener("change", function () {
        var i = tpl.sohalar.indexOf(s.name);
        if (cb.checked && i < 0) tpl.sohalar.push(s.name);
        if (!cb.checked && i >= 0) tpl.sohalar.splice(i, 1);
      });
      body.appendChild(h("label", { class: "con-check" }, [cb, h("span", { text: s.name })]));
    });
    UI.openDrawer({ title: t("con.assign_soha"), desc: tpl.name, body: body, onSave: function () { App.refresh(); } });
  }

  /* --- 4c. Builder --- */
  function builderPanel() {
    var wrap = h("div", { class: "staff-panel" });
    var host = h("div");
    var seg = UI.Segmented({
      value: conState.builderView,
      items: [
        { id: "menus", label: t("con.builder.menus"), icon: "grid" },
        { id: "fields", label: t("con.builder.fields"), icon: "table" },
        { id: "schema", label: t("con.builder.schema"), icon: "eye" }
      ],
      onChange: function (v) { conState.builderView = v; renderView(); }
    });
    wrap.appendChild(h("div", { class: "adm-toolbar" }, seg));
    wrap.appendChild(host);

    function renderView() {
      host.innerHTML = "";
      if (conState.builderView === "menus") {
        host.appendChild(h("div", { class: "card" }, h("div", { class: "card__body card__body--flush" }, UI.DataTable({
          sticky: true,
          columns: [
            { key: "name", label: t("common.name"), sticky: "left", strong: true },
            { key: "types", label: t("con.types"), align: "right", render: function (r) { return h("span", { class: "badge badge--dotless badge--brand", text: r.types > 99 ? "99+" : String(r.types) }); } },
            { key: "code", label: "Kod", render: function (r) { return h("span", { class: "mono", text: r.code }); } },
            { key: "order", label: t("con.order"), align: "right" },
            { key: "tabs", label: t("con.tabs"), align: "right", render: function (r) { return h("span", { class: "badge badge--dotless badge--success", text: String(r.tabs) }); } },
            { key: "active", label: t("common.status"), render: function (r) { return UI.StatusBadge(r.active ? "active" : "closed"); } },
            { key: "act", label: t("common.actions"), sticky: "right", render: function (r) {
              return UI.Button({ icon: "edit", variant: "tertiary", size: "sm", title: t("common.edit"), onClick: function () {
                editDrawer(r.name, [
                  { label: t("common.name"), value: r.name },
                  { label: "Kod", value: r.code },
                  { label: t("con.order"), value: r.order, type: "number" }
                ], function (v) { r.name = v[0]; r.code = v[1]; r.order = parseFloat(v[2]) || r.order; });
              } });
            } }
          ],
          rows: AD().builderMenus
        }))));
      } else if (conState.builderView === "fields") {
        host.appendChild(h("div", { class: "card" }, h("div", { class: "card__body card__body--flush" }, UI.DataTable({
          sticky: true,
          columns: [
            { key: "key", label: "Kalit", sticky: "left", render: function (r) { return h("span", { class: "mono", text: r.key }); } },
            { key: "name", label: t("common.name") },
            { key: "type", label: t("material.type"), render: function (r) { return h("span", { class: "badge badge--dotless badge--" + (r.type === "NUMBER" ? "brand" : "warning"), text: r.type }); } },
            { key: "required", label: t("con.required"), render: function (r) { return r.required ? "Ha" : "Yo‘q"; } },
            { key: "place", label: t("con.place"), align: "right" },
            { key: "active", label: t("common.status"), render: function (r) { return UI.StatusBadge(r.active ? "active" : "closed"); } }
          ],
          rows: AD().fieldDefs
        }))));
      } else {
        var sohaSel = UI.Select({ placeholder: t("con.pick_soha"), options: AD().sohalar.map(function (s) { return { value: s.name, label: s.name }; }) });
        var turSel = UI.Select({ placeholder: t("con.pick_type"), options: AD().builderMenus.map(function (m) { return { value: m.code, label: m.name }; }) });
        host.appendChild(h("div", { class: "card" }, [
          h("div", { class: "card__body" }, [
            h("div", { class: "form-grid" }, [
              h("div", { class: "field" }, [h("label", { class: "field__label", text: t("con.tab.sohalar") }), sohaSel]),
              h("div", { class: "field" }, [h("label", { class: "field__label", text: t("material.type") }), turSel])
            ]),
            UI.EmptyState({ icon: "inbox", title: t("con.schema_hint") })
          ])
        ]));
      }
    }
    renderView();
    return wrap;
  }

  /* ======================= 5. So'rovlar jurnali ========================= */
  var logState = { range: "all", method: "all", q: "", page: 1, per: 20, noun: "yozuv" };

  function renderLogs() {
    var page = h("div", { class: "page" });
    page.appendChild(pageHead(t("page.alogs.title"), t("page.alogs.desc")));

    var results = h("div");
    var rangeSeg = UI.Segmented({
      value: logState.range,
      items: [
        { id: "all", label: t("staff.filter.all") }, { id: "1h", label: "1 soat" }, { id: "24h", label: "24 soat" },
        { id: "7d", label: "7 kun" }, { id: "30d", label: "30 kun" }
      ],
      onChange: function (v) { logState.range = v; logState.page = 1; renderList(); }
    });
    var searchInput = h("input", { class: "input org-search__input", type: "text", placeholder: "Request ID, yo‘l, foydalanuvchi, STIR..." });
    searchInput.addEventListener("input", function () { logState.q = searchInput.value.trim().toLowerCase(); logState.page = 1; renderList(); });
    var methodSel = UI.Select({
      value: "all",
      options: [{ value: "all", label: "Metod: " + t("staff.filter.all") }, { value: "GET", label: "GET" }, { value: "POST", label: "POST" }],
      onChange: function (v) { logState.method = v; logState.page = 1; renderList(); }
    });
    methodSel.classList.add("adm-filter");

    page.appendChild(h("div", { class: "section" }, h("div", { class: "adm-toolbar" }, [
      rangeSeg,
      h("div", { class: "org-search adm-search" }, [h("span", { class: "org-search__icon" }, UI.icon("search")), searchInput]),
      methodSel
    ])));
    page.appendChild(results);

    function renderList() {
      results.innerHTML = "";
      var list = AD().logs.filter(function (r) {
        if (logState.method !== "all" && r.method !== logState.method) return false;
        if (logState.q && (r.path + r.user + r.stir + r.reqId).toLowerCase().indexOf(logState.q) < 0) return false;
        return true;
      });
      var total = list.length, pages = Math.max(1, Math.ceil(total / logState.per));
      if (logState.page > pages) logState.page = pages;
      var items = list.slice((logState.page - 1) * logState.per, (logState.page - 1) * logState.per + logState.per);
      if (!items.length) { results.appendChild(UI.EmptyState({ icon: "search", title: t("common.not_found") })); return; }
      results.appendChild(h("div", { class: "card" }, h("div", { class: "card__body card__body--flush" }, UI.DataTable({
        sticky: true,
        columns: [
          { key: "time", label: "Vaqt", sticky: "left", render: function (r) { return h("span", { class: "mono text-xs", text: r.time }); } },
          { key: "scope", label: "Maqsad", render: function (r) { return h("span", { class: "badge badge--dotless badge--" + (r.scope === "Fayl" ? "warning" : "brand"), text: r.scope }); } },
          { key: "method", label: "Metod", render: function (r) { return h("span", { class: "badge badge--dotless badge--" + (r.method === "POST" ? "success" : "neutral"), text: r.method }); } },
          { key: "path", label: "Yo‘l", render: function (r) { return h("span", { class: "mono text-xs", text: r.path }); } },
          { key: "status", label: t("common.status"), align: "right", render: function (r) { return h("span", { class: "badge badge--dotless badge--success", text: String(r.status) }); } },
          { key: "ms", label: "Davomiylik", align: "right", render: function (r) { return Fmt.num(r.ms) + " ms"; } },
          { key: "user", label: "Foydalanuvchi", render: function (r) { return h("div", {}, [h("div", { class: "font-medium", text: r.user }), h("div", { class: "text-tertiary text-xs", text: r.role })]); } },
          { key: "stir", label: "STIR", render: function (r) { return h("span", { class: "mono", text: r.stir }); } },
          { key: "reqId", label: "Request ID", render: function (r) { return h("span", { class: "mono text-xs", text: r.reqId }); } }
        ],
        rows: items
      }))));
      results.appendChild(App.pager(logState, total, pages, renderList));
    }
    renderList();
    return page;
  }

  global.AdminPages = {
    orgManage: renderOrgManage,
    users: renderUsers,
    classifiers: renderClassifiers,
    konstruktor: renderConstructor,
    logs: renderLogs
  };
})(window);
