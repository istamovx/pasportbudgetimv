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
              UI.Button({ icon: "eye", variant: "secondary", size: "sm", title: t("common.view", "Ko‘rish"), onClick: function () { App.openOrgDetail(r); } }),
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

  /* ============== 6. Tashkilot ma'lumotlari (drill-in) ================== */
  var odState = { org: null, tab: "umumiy", view: null, assetsPage: { page: 1, per: 15, noun: "qator" } };

  function odBar(pct) {
    return h("div", { class: "od-bar" }, [
      h("div", { class: "od-bar__fill", style: "width:" + Math.max(0, Math.min(100, pct)) + "%" }),
      pct >= 100 ? h("span", { class: "od-bar__check" }, UI.icon("check")) : null
    ]);
  }
  function odRing(pct, size) {
    size = size || 84;
    var sw = 8, r = (size - sw) / 2, c = 2 * Math.PI * r, half = size / 2;
    var wrap = h("div", { class: "od-ring", style: "width:" + size + "px;height:" + size + "px" });
    wrap.innerHTML =
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '">' +
      '<circle cx="' + half + '" cy="' + half + '" r="' + r + '" fill="none" stroke="var(--border-secondary)" stroke-width="' + sw + '"/>' +
      '<circle cx="' + half + '" cy="' + half + '" r="' + r + '" fill="none" stroke="var(--utility-success-500, #17b26a)" stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="' + (c * pct / 100) + " " + c + '" transform="rotate(-90 ' + half + " " + half + ')"/>' +
      "</svg>";
    wrap.appendChild(h("span", { class: "od-ring__val", text: Math.round(pct) + "%" }));
    return wrap;
  }
  function odPill(tabDef) {
    if (tabDef.pct != null && tabDef.pill) return [pctPill(tabDef.pct), countPill(tabDef.pill)];
    if (tabDef.pct != null) return pctPill(tabDef.pct);
    if (tabDef.pill) return countPill(tabDef.pill);
    return null;
    function pctPill(p) { return h("span", { class: "od-pill " + (p >= 100 ? "od-pill--ok" : "od-pill--zero"), text: p + "%" }); }
    function countPill(txt) { return h("span", { class: "od-pill od-pill--n", text: txt }); }
  }

  function setDetailOrg(o) { odState.org = o; odState.tab = "umumiy"; odState.view = null; }

  function renderOrgDetail() {
    if (!odState.org) odState.org = App.orgs()[0];
    if (odState.view === "staffint") return integrationTable({
      title: "Xodimlar integratsiyasi",
      cols: [
        { key: "cat", label: "Xodim kategoriyasi" },
        { key: "type", label: "Xodim turi" },
        { key: "pos", label: "Lavozim", strong: true },
        { key: "intId", label: "Integratsiya ID", align: "right" },
        { key: "qty", label: "Shtat miqdorlari", align: "right", render: function (r) { return h("span", { class: "mono text-xs", text: r.qty }); } }
      ],
      rows: AD().orgDetail.staffIntegration
    });
    if (odState.view === "assets") return integrationTable({
      title: "Asosiy vositalar", paged: true,
      cols: [
        { key: "inv", label: "Inventar raqami", sticky: "left", render: function (r) { return h("span", { class: "mono text-xs", text: r.inv }); } },
        { key: "name", label: "Asosiy vositalar nomi", strong: true },
        { key: "fio", label: "F.I.O" },
        { key: "dept", label: "Bo‘lim" },
        { key: "hisob", label: "Hisob" },
        { key: "article", label: "Xarajat moddalari" },
        { key: "unit", label: "Hisob birligi" },
        { key: "qty", label: "Miqdor", align: "right", render: function (r) { return Fmt.num(r.qty); } },
        { key: "sum", label: "Summa", align: "right", render: function (r) { return Fmt.currency(r.sum); } }
      ],
      rows: AD().orgDetail.assets
    });
    if (odState.view === "transport") return integrationTable({
      title: "Transport vositalari (YHXBB)",
      cols: [
        { key: "plate", label: t("material.plate"), sticky: "left", strong: true },
        { key: "model", label: t("material.model") },
        { key: "color", label: t("material.color") },
        { key: "pass", label: t("material.pass") },
        { key: "reg", label: t("material.reg"), render: function (r) { return Fmt.date(r.reg); } },
        { key: "inspection", label: t("material.inspection"), render: function (r) { return Fmt.date(r.inspection); } }
      ],
      rows: global.DATA.material.vehicles
    });

    var od = AD().orgDetail, org = odState.org;
    var D = global.DATA;
    var page = h("div", { class: "page" });
    var pctAll = od.userFields.total ? Math.round(od.userFields.done / od.userFields.total * 100) : 0;

    // Qaytish (tashkilot roliga o'tilmaydi — barcha ma'lumot shu sahifada)
    page.appendChild(h("div", { class: "flex justify-between items-start gap-lg flex-wrap", style: "margin-bottom:var(--spacing-lg)" },
      h("button", { class: "odx-back", type: "button", onClick: function () { App.navigate("aorgs"); } }, [UI.icon("chevron-left"), h("span", { text: t("od.back_registry") })])));

    // Gradient hero banner
    page.appendChild(h("div", { class: "odx-hero" }, [
      h("h1", { class: "odx-hero__name", text: org.name }),
      h("div", { class: "odx-hero__badges" }, [
        h("span", { class: "odx-badge odx-badge--ok", text: t("st.active", "Faol") }),
        h("span", { class: "odx-badge", text: "Sog‘liqni saqlash" }),
        h("span", { class: "odx-badge", text: (org.region || "Toshkent shahri").replace(" viloyati", "") }),
        h("span", { class: "odx-badge", text: "Davlat muassasasi" })
      ]),
      h("div", { class: "odx-hero__facts" }, [
        heroFact("STIR", org.stir),
        heroFact(t("odx.org_code"), "G71"),
        heroFact(t("odx.founded"), "2000"),
        heroFact(t("odx.ownership"), "Davlat mulki"),
        heroFact(t("odx.authority"), "Sog‘liqni saqlash vazirligi")
      ])
    ]));

    // KPI qatori
    var staffCount = D.staff.totals.physical;
    var assetsTotal = 471280; // mln so'm (integratsiyadan)
    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:4;--cols-md:2" }, [
      App.kpi("users", t("odx.kpi.staff"), staffCount, null, ""),
      App.kpi("wallet", t("odx.kpi.assets"), Fmt.num(assetsTotal) + " mln", null, "ok"),
      App.kpi("check", t("odx.kpi.fill"), pctAll + "%", pctAll, pctAll >= 100 ? "ok" : "warn"),
      App.kpi("shield", t("odx.kpi.errors"), 0, null, "")
    ])));

    // 2 ustunli asosiy grid
    var leftCol = h("div", { class: "odx-col" });
    var rightCol = h("div", { class: "odx-col" });

    // Rekvizitlar
    // Rekvizitlar — hero'da chiqqan STIR/kod/yil/holat BU YERDA TAKRORLANMAYDI,
    // faqat qo'shimcha rekvizitlar ko'rsatiladi
    leftCol.appendChild(infoCard("clipboard", t("odx.rekvizit"), [
      [t("g.oked"), "72110"],
      [t("g.cadastre_date"), "14.12.2022"],
      [t("g.doc_organ"), "Prezident Farmoni — № 5130, 27.05.2021"],
      [t("g.stat_cert"), "Mavjud"],
      [t("g.rental"), "Ijarada turmaydi"]
    ], true));

    // Rahbar va aloqa
    var dep = (D.general.deputies || [])[0] || { name: "—", phone: "—" };
    leftCol.appendChild(infoCard("users", t("odx.leader"), [
      [t("odx.leader_name"), dep.name], ["Telefon", dep.phone],
      [t("odx.address"), "Toshkent shahri, Yakkasaroy tumani"]
    ], true));

    // Bank va xazina hisobvaraqlari
    leftCol.appendChild(infoCard("wallet", t("odx.bank"), (D.general.dts.accounts || []).map(function (a) {
      return [t(a.key), a.end != null ? Fmt.currency(a.end) : "—"];
    }), false));

    // Ko'chmas mulk
    var fac = D.material.facility || { rooms: [], areas: [] };
    var roomsTotal = (fac.rooms || []).reduce(function (a, b) { return a + b; }, 0);
    var areaTotal = (fac.areas || []).reduce(function (a, b) { return a + b; }, 0);
    leftCol.appendChild(infoCard("building", t("odx.realty"), [
      [t("odx.bld_count"), Fmt.num(D.location.buildings.length) + " ta"],
      [t("odx.rooms"), Fmt.num(roomsTotal) + " ta"],
      [t("dash.kpi.area"), Fmt.num(Math.round(areaTotal)) + " m²"]
    ], false));

    // Joylashuv kartasi (belgilangan joy bilan)
    var b0 = D.location.buildings[0] || { lat: 41.311, lng: 69.279 };
    var mapEl = h("div", { class: "odx-map", id: "odx-map" });
    leftCol.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card__head" }, h("div", {}, [h("div", { class: "card__title", text: t("odx.location") }), h("div", { class: "card__subtitle", text: b0.city + ", " + b0.district })])),
      h("div", { class: "card__body" }, mapEl)
    ]));
    setTimeout(function () {
      if (!global.L || !mapEl.isConnected) return;
      try {
        var m = global.L.map(mapEl, { scrollWheelZoom: false }).setView([b0.lat, b0.lng], 16);
        global.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 20, attribution: "© OpenStreetMap" }).addTo(m);
        global.L.circle([b0.lat, b0.lng], { radius: 120, color: "#1570ef", fillColor: "#1570ef", fillOpacity: 0.15, weight: 2 }).addTo(m);
        global.L.marker([b0.lat, b0.lng]).addTo(m).bindPopup("<b>" + org.name + "</b><br>" + b0.city + ", " + b0.district).openPopup();
      } catch (e) {}
    }, 60);

    // O'ng ustun: aktivlar donut
    var DIST = [
      ["Binolar va inshootlar", 40.4], ["Mashina va uskunalar", 23.2], ["Transport vositalari", 14.1],
      ["Inventar va jihozlar", 13.1], ["Yer resurslari", 7.1], ["Boshqa asosiy vositalar", 2.2]
    ];
    var donutCanvas = h("canvas", { width: "220", height: "220" });
    var legend = h("div", { class: "odx-legend" }, DIST.map(function (d, i) {
      return h("div", { class: "odx-legend__row" }, [
        h("span", { class: "odx-legend__dot", style: "background:var(--chart-" + (i + 1) + ")" }),
        h("span", { class: "odx-legend__name", text: d[0] }),
        h("b", { class: "odx-legend__val", text: d[1] + "%" })
      ]);
    }));
    rightCol.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card__head" }, h("div", {}, h("div", { class: "card__title", text: t("odx.assets_dist") }))),
      h("div", { class: "card__body" }, [
        h("div", { class: "odx-donut" }, [donutCanvas, h("div", { class: "odx-donut__center" }, [h("b", { text: Fmt.num(assetsTotal) + " mln" }), h("span", { text: t("odx.kpi.assets").toLowerCase() })])]),
        legend
      ])
    ]));
    setTimeout(function () {
      if (!global.Chart || !donutCanvas.isConnected) return;
      var css = getComputedStyle(document.documentElement);
      try {
        new global.Chart(donutCanvas, {
          type: "doughnut",
          data: { labels: DIST.map(function (d) { return d[0]; }), datasets: [{ data: DIST.map(function (d) { return d[1]; }),
            backgroundColor: DIST.map(function (_, i) { return css.getPropertyValue("--chart-" + (i + 1)).trim() || "#1570ef"; }),
            borderWidth: 2, borderColor: css.getPropertyValue("--bg-primary").trim() || "#fff" }] },
          options: { cutout: "74%", plugins: { legend: { display: false } }, animation: { duration: 400 } }
        });
      } catch (e) {}
    }, 60);

    // To'ldirilganlik — bo'limlar kesimida (KPI dagi umumiy foizni takrorlamaydi)
    rightCol.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card__head" }, h("div", {}, h("div", { class: "card__title", text: t("odx.fill_by_tab") }))),
      h("div", { class: "card__body odx-fillist" }, od.tabs.map(function (td) {
        var pct = td.pct != null ? td.pct : (td.integrations
          ? Math.round(td.integrations.filter(function (g) { return g.loaded; }).length / td.integrations.length * 100)
          : 0);
        return h("div", { class: "odx-fillist__row" }, [
          h("span", { class: "odx-fillist__name", text: td.label }),
          odBar(pct),
          h("span", { class: "odx-fillist__pct", text: pct + "%" })
        ]);
      }))
    ]));

    // O'zgarishlar tarixi
    rightCol.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card__head" }, h("div", {}, h("div", { class: "card__title", text: t("odx.history") }))),
      h("div", { class: "card__body odx-timeline" }, [
        timeItem(t("odx.h1"), "2026-06-19 · UZASBO"),
        timeItem(t("odx.h2"), "2026-06-01 · " + dep.name.split(" ")[0]),
        timeItem(t("odx.h3"), "2026-05-12 · YHXBB")
      ])
    ]));

    page.appendChild(h("div", { class: "section odx-grid" }, [leftCol, rightCol]));

    // To'ldirilganlik tablari (bo'limlar + integratsiyalar + tashkilot sahifalari)
    page.appendChild(h("div", { class: "staff-group-heading", text: t("odx.fill_title") }));
    page.appendChild(UI.Tabs({
      active: odState.tab,
      items: od.tabs.map(function (td) {
        return { id: td.id, label: [h("span", { text: td.label }), odPill(td)], render: function () { odState.tab = td.id; return odTabPanel(td); } };
      })
    }));
    return page;

    function heroFact(label, val) {
      return h("div", { class: "odx-fact" }, [h("span", { class: "odx-fact__l", text: label }), h("b", { class: "odx-fact__v", text: val })]);
    }
    function infoCard(icon, title, rows, open) {
      var body = h("div", { class: "odx-info__body" }, rows.map(function (r) {
        var row = h("div", { class: "odx-info__row" });
        row.appendChild(h("span", { class: "odx-info__label", text: r[0] }));
        var v = h("span", { class: "odx-info__value" });
        UI.append(v, r[1]);
        row.appendChild(v);
        return row;
      }));
      var headBtn = h("button", { class: "odx-info__head", type: "button" }, [
        h("span", { class: "odx-info__icon" }, UI.icon(icon)),
        h("span", { class: "odx-info__title", text: title }),
        UI.icon("chevron-down", "odx-info__chev")
      ]);
      var card = h("div", { class: "card odx-info" + (open ? " is-open" : "") }, [headBtn, body]);
      headBtn.addEventListener("click", function () { card.classList.toggle("is-open"); });
      return card;
    }
    function timeItem(title, sub) {
      return h("div", { class: "odx-time" }, [
        h("span", { class: "odx-time__dot" }),
        h("div", {}, [h("div", { class: "odx-time__title", text: title }), h("div", { class: "odx-time__sub", text: sub })])
      ]);
    }
  }

  function odTabPanel(td) {
    var wrap = h("div", { class: "staff-panel" });
    if (td.sections && td.sections.length) {
      var done = 0, total = 0;
      td.sections.forEach(function (s) { done += s.done; total += s.total; });
      var pct = total ? Math.round(done / total * 100) : (td.pct || 0);
      wrap.appendChild(h("div", { class: "od-sum" }, [
        odBar(pct),
        h("span", { class: "od-sum__label", text: done + " / " + total + " " + t("od.fields_done") })
      ]));
      wrap.appendChild(h("div", { class: "od-secs" }, td.sections.map(function (s) {
        var sp = s.total ? Math.round(s.done / s.total * 100) : 0;
        return h("div", { class: "od-sec card" }, [
          h("div", { class: "od-sec__title", text: s.title }),
          h("div", { class: "od-sec__bar" }, [odBar(sp), s.total === 0 ? h("span", { class: "od-sec__pct", text: "0%" }) : null]),
          h("div", { class: "od-sec__count", text: s.done + " / " + s.total + " " + t("od.fields") })
        ]);
      })));
    }
    if (td.integrations && td.integrations.length) {
      wrap.appendChild(h("div", { class: "od-secs" }, td.integrations.map(function (g) {
        var clickable = g.loaded && (g.id === "staffint" || g.id === "assets" || g.id === "transport");
        var card = h(clickable ? "button" : "div", {
          class: "od-int card" + (g.loaded ? " is-loaded" : "") + (clickable ? " is-clickable" : ""), type: clickable ? "button" : null,
          onClick: clickable ? function () { odState.view = g.id; App.refresh(); } : null
        }, [
          h("div", { class: "od-int__top" }, [
            h("span", { class: "od-int__dot" }),
            h("span", { class: "od-int__title", text: g.title }),
            h("span", { class: "badge badge--dotless " + (g.loaded ? "badge--success" : "badge--neutral"), text: g.loaded ? t("od.loaded") : t("od.not_loaded") })
          ]),
          g.updated ? h("div", { class: "od-int__sub", text: t("od.last_update") + ": " + g.updated.slice(0, 10) + (g.rows ? " · " + Fmt.num(g.rows) + " " + t("od.rows") : "") }) : h("div", { class: "od-int__sub", text: t("od.waiting") }),
          clickable ? h("span", { class: "od-int__chev" }, UI.icon("chevron-right")) : null
        ]);
        return card;
      })));
    }
    if ((!td.sections || !td.sections.length) && (!td.integrations || !td.integrations.length)) {
      wrap.appendChild(UI.EmptyState({ icon: "inbox" }));
    }
    // Tashkilot rolidagi tegishli sahifani to'liq ko'rsatish
    var ORG_SECTION_MAP = { umumiy: "general", joylashuv: "location", kadrlar: "staff", mtb: "material", kommunal: "utilities", qarzlar: "debts", mib: "mib" };
    var secId = ORG_SECTION_MAP[td.id];
    if (secId && global.App && App.renderSection) {
      var embedded = App.renderSection(secId);
      if (embedded) {
        wrap.appendChild(h("div", { class: "od-embed-head" }, [
          h("span", { class: "od-embed-head__line" }),
          h("span", { class: "od-embed-head__label", text: t("od.embed_title") }),
          h("span", { class: "od-embed-head__line" })
        ]));
        wrap.appendChild(h("div", { class: "od-embed" }, embedded));
      }
    }
    return wrap;
  }

  /* Integratsiya jadvali (drill-in sahifa) */
  function integrationTable(opts) {
    var page = h("div", { class: "page" });
    page.appendChild(h("div", { class: "page__head flex justify-between items-start gap-lg flex-wrap" }, [
      h("div", {}, [
        h("h1", { class: "page__title", text: opts.title }),
        h("p", { class: "page__desc flex items-center gap-md flex-wrap" }, [
          h("span", { class: "od-tag", text: "INTEGRATION" }),
          h("span", { text: t("common.total") + ": " + Fmt.num(opts.rows.length) + " " + t("od.rows") })
        ])
      ]),
      h("div", { class: "flex gap-md flex-wrap" }, [
        UI.Button({ label: t("od.excel"), variant: "secondary", icon: "download", onClick: function () { exportCsv(opts); } }),
        UI.Button({ label: t("common.back"), variant: "secondary", icon: "chevron-left", onClick: function () { odState.view = null; App.refresh(); } })
      ])
    ]));

    var results = h("div");
    page.appendChild(h("div", { class: "section" }, results));
    function renderRows() {
      results.innerHTML = "";
      var rows = opts.rows;
      var st = odState.assetsPage;
      var pages = 1;
      if (opts.paged) {
        pages = Math.max(1, Math.ceil(rows.length / st.per));
        if (st.page > pages) st.page = pages;
        rows = rows.slice((st.page - 1) * st.per, (st.page - 1) * st.per + st.per);
      }
      results.appendChild(h("div", { class: "card" }, h("div", { class: "card__body card__body--flush" },
        UI.DataTable({ sticky: true, columns: opts.cols, rows: rows }))));
      if (opts.paged) results.appendChild(App.pager(st, opts.rows.length, pages, renderRows));
    }
    renderRows();

    page.appendChild(h("div", { class: "od-legend" }, [
      h("span", { class: "od-legend__item" }, [h("span", { class: "od-legend__dot od-legend__dot--user" }), h("span", { text: t("od.legend_user") })]),
      h("span", { class: "od-legend__item" }, [h("span", { class: "od-legend__dot od-legend__dot--int" }), h("span", { text: t("od.legend_int") })])
    ]));
    return page;
  }

  function exportCsv(opts) {
    var head = opts.cols.map(function (c) { return c.label; });
    var lines = [head.join(";")];
    opts.rows.forEach(function (r) {
      lines.push(opts.cols.map(function (c) { var v = r[c.key]; return typeof v === "string" ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(";"));
    });
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = opts.title.toLowerCase().replace(/\s+/g, "-") + ".csv";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
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

  /* ======================= 7. Bosh sahifa (xarita dashboard) ============ */
  var dashState = { region: null, district: null, soha: "all", type: "all", metric: "buildings" };

  /* Metrikalar — kartalar saralaydi: xarita, reyting va legenda shu metrikaga bo'yaladi */
  var DASH_METRICS = [
    { id: "orgs", icon: "building", key: "dash.m.orgs", tone: "", calc: function (list) { var o = {}; list.forEach(function (b) { o[b.org] = 1; }); return Object.keys(o).length; }, fmt: function (v) { return Fmt.num(v); } },
    { id: "buildings", icon: "grid", key: "dash.kpi.buildings", tone: "ok", calc: function (list) { return list.length; }, fmt: function (v) { return Fmt.num(v); } },
    { id: "area", icon: "map", key: "dash.kpi.area", tone: "", calc: function (list) { return list.reduce(function (a, b) { return a + b.area; }, 0); }, fmt: function (v) { return Fmt.compact(v) + " m²"; } },
    { id: "repair", icon: "refresh", key: "dash.kpi.repair", tone: "warn", calc: function (list) { return list.filter(function (b) { return b.status === "repair"; }).length; }, fmt: function (v) { return Fmt.num(v); } }
  ];
  function dashMetric() { return DASH_METRICS.filter(function (m) { return m.id === dashState.metric; })[0] || DASH_METRICS[1]; }
  var SVG_NS = "http://www.w3.org/2000/svg";

  function bLabel(n) { return Fmt.num(n) + " ta"; }
  function buildingsOf(regionName) {
    return AD().buildings.filter(function (b) { return !regionName || b.region === regionName; });
  }

  /* SVG xarita: entries — viloyatlar yoki tumanlar; opts: {value(e), max, onClick(e), tooltip(e), fit} */
  function uzMap(entries, opts) {
    var wrap = h("div", { class: "uzmap-wrap" });
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 970 590");
    svg.setAttribute("fill", "none");
    svg.classList.add("uzmap");
    var tip = h("div", { class: "uzmap-tip" });
    var selItems = [];
    function syncSel() {
      if (!opts.selected) return;
      selItems.forEach(function (it) {
        var on = !!opts.selected(it.e);
        it.base.classList.toggle("is-selected", on);
        it.hit.classList.toggle("is-selected", on);
      });
    }

    entries.forEach(function (e) {
      var inert = opts.inert && opts.inert(e);
      var g0 = e.g && e.g[0], g1 = (e.g && e.g[1]) || g0;
      if (!g0) return;
      var base = document.createElementNS(SVG_NS, "path");
      base.setAttribute("d", g0.d);
      base.setAttribute("class", "uzmap__base" + (inert ? " is-inert" : ""));
      if (!inert && opts.value) {
        var v = opts.value(e), ratio = opts.max ? v / opts.max : 0;
        base.style.fillOpacity = String(0.18 + 0.82 * Math.max(0, Math.min(1, ratio)));
      }
      svg.appendChild(base);
      if (inert) return;

      var hit = document.createElementNS(SVG_NS, "path");
      hit.setAttribute("d", g1.d);
      hit.setAttribute("class", "uzmap__hit");
      selItems.push({ e: e, base: base, hit: hit });
      hit.addEventListener("click", function () { if (opts.onClick) opts.onClick(e); syncSel(); });
      hit.addEventListener("mouseenter", function () { base.classList.add("is-hover"); hit.classList.add("is-hover"); if (opts.tooltip) { tip.innerHTML = ""; UI.append(tip, opts.tooltip(e)); tip.classList.add("is-on"); } });
      hit.addEventListener("mousemove", function (ev) {
        var r = wrap.getBoundingClientRect();
        var x = ev.clientX - r.left + 14, y = ev.clientY - r.top + 14;
        if (x + tip.offsetWidth > r.width - 8) x = ev.clientX - r.left - tip.offsetWidth - 14;
        if (y + tip.offsetHeight > r.height - 8) y = ev.clientY - r.top - tip.offsetHeight - 14;
        tip.style.left = x + "px"; tip.style.top = y + "px";
      });
      hit.addEventListener("mouseleave", function () { base.classList.remove("is-hover"); hit.classList.remove("is-hover"); tip.classList.remove("is-on"); });
      svg.appendChild(hit);
    });

    syncSel();
    wrap._syncSel = syncSel;
    wrap.appendChild(svg);
    wrap.appendChild(tip);
    if (opts.fit) setTimeout(function () {
      try { var bb = svg.getBBox(); svg.setAttribute("viewBox", (bb.x - 12) + " " + (bb.y - 12) + " " + (bb.width + 24) + " " + (bb.height + 24)); } catch (e) {}
    }, 0);
    return wrap;
  }

  function distName(type) {
    var s = type.replace(/_sh$/, "*shahri").replace(/_tumani?$/, "*tumani").replace(/[_-]/g, " ").replace("*", " ");
    if (s.indexOf(" shahri") < 0 && s.indexOf(" tumani") < 0) s += " tumani";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  /* Tuman nomlarini solishtirish uchun normalizatsiya ("Zarbdor tumani" == "Zarbdor") */
  function distBase(s) {
    return String(s).toLowerCase().replace(/\s+(tumani|shahri|shahar)$/i, "").replace(/[‘’'ʻ`-]/g, "").trim();
  }

  function renderDashboard() {
    return dashState.region ? dashRegionView() : dashCountryView();
  }

  function dashCountryView() {
    var names = AD().mapRegionNames;
    var all = AD().buildings;
    var metric = dashMetric();

    // Har hudud uchun aktiv metrika qiymati
    var regionVals = {};
    Object.keys(names).forEach(function (k) { regionVals[k] = metric.calc(all.filter(function (b) { return b.regionKey === k; })); });
    var maxVal = Math.max.apply(null, Object.keys(regionVals).map(function (k) { return regionVals[k]; })) || 1;

    var page = h("div", { class: "page" });
    page.appendChild(pageHead(t("dash.title"), t("dash.desc")));

    // Metric kartalar — bosilsa butun dashboard shu metrikaga saralanadi
    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:4;--cols-md:2" },
      DASH_METRICS.map(function (m) {
        var val = m.id === "orgs" ? App.orgs().length : m.calc(all);
        var card = h("button", { class: "adm-kpi metric-card" + (dashState.metric === m.id ? " is-active" : ""), type: "button",
          "aria-pressed": dashState.metric === m.id ? "true" : "false",
          onClick: function () { dashState.metric = m.id; App.refresh(); } }, [
          h("div", { class: "adm-kpi__icon adm-kpi__icon--" + (m.tone || "brand") }, UI.icon(m.icon)),
          h("div", { class: "adm-kpi__meta" }, [
            h("div", { class: "adm-kpi__label", text: t(m.key) }),
            h("div", { class: "adm-kpi__row" }, [
              h("span", { class: "adm-kpi__value", text: m.fmt(val) }),
              dashState.metric === m.id ? h("span", { class: "metric-card__tag", text: t("dash.metric_on") }) : null
            ])
          ])
        ]);
        return card;
      })
    )));

    // Xarita + hudud reytingi (aktiv metrika bo'yicha)
    var mapEntries = global.UZMAP_REGIONS || [];
    var map = uzMap(mapEntries, {
      inert: function (e) { return !names[e.type]; },
      value: function (e) { return regionVals[e.type] || 0; },
      max: maxVal,
      onClick: function (e) { dashState.region = e.type; dashState.district = null; dashState.soha = "all"; dashState.type = "all"; App.refresh(); },
      tooltip: function (e) {
        var rn = names[e.type], list = buildingsOf(rn);
        var orgs = {}; list.forEach(function (b) { orgs[b.org] = 1; });
        var area = list.reduce(function (a, b) { return a + b.area; }, 0);
        return [
          h("div", { class: "uzmap-tip__title", text: rn }),
          tipRow(t("dash.m.orgs"), bLabel(Object.keys(orgs).length)),
          tipRow(t("dash.kpi.buildings"), bLabel(list.length)),
          tipRow(t("dash.kpi.area"), Fmt.num(area) + " m²"),
          tipRow(t("dash.kpi.repair"), bLabel(list.filter(function (b) { return b.status === "repair"; }).length)),
          h("div", { class: "uzmap-tip__hint", text: t("dash.tip_hint") })
        ];
      }
    });

    var rank = h("div", { class: "dash-rank card" });
    rank.appendChild(h("div", { class: "con-col__title", text: t("dash.rank_title") + " · " + t(metric.key).toLowerCase() }));
    Object.keys(names)
      .map(function (k) { return { key: k, name: names[k], val: regionVals[k] || 0 }; })
      .sort(function (a, b) { return b.val - a.val; })
      .forEach(function (r) {
        rank.appendChild(h("button", { class: "dash-rank__row", type: "button", onClick: function () { dashState.region = r.key; dashState.district = null; App.refresh(); } }, [
          h("span", { class: "dash-rank__name", text: r.name }),
          h("span", { class: "dash-rank__bar" }, h("span", { class: "dash-rank__fill", style: "width:" + Math.round(r.val / maxVal * 100) + "%" })),
          h("span", { class: "dash-rank__val", text: metric.id === "area" ? Fmt.compact(r.val) : String(r.val) })
        ]));
      });

    page.appendChild(h("div", { class: "section dash-map-grid" }, [
      h("div", { class: "card dash-map-card" }, [
        h("div", { class: "card__head" }, [
          h("div", {}, [h("div", { class: "card__title", text: t("dash.map_title") }), h("div", { class: "card__subtitle", text: t("dash.map_sub") + " · " + t(metric.key) })]),
          h("div", { class: "dash-legend" }, [
            h("span", { class: "dash-legend__label", text: t("dash.legend_few") }),
            h("span", { class: "dash-legend__scale" }),
            h("span", { class: "dash-legend__label", text: t("dash.legend_many") })
          ])
        ]),
        h("div", { class: "card__body" }, map)
      ]),
      rank
    ]));

    // TOP tashkilotlar (bino maydoni bo'yicha) — bosilsa binolarigacha kirish
    var byOrg = {};
    all.forEach(function (b) {
      if (!byOrg[b.org]) byOrg[b.org] = { org: b.org, region: b.region, count: 0, area: 0, list: [] };
      byOrg[b.org].count++; byOrg[b.org].area += b.area; byOrg[b.org].list.push(b);
    });
    var top = Object.keys(byOrg).map(function (k) { return byOrg[k]; }).sort(function (a, b) { return b.area - a.area; }).slice(0, 6);
    var topCard = h("div", { class: "card" }, [
      h("div", { class: "card__head" }, h("div", {}, [
        h("div", { class: "card__title", text: t("dash.top_title") }),
        h("div", { class: "card__subtitle", text: t("dash.top_sub") })
      ])),
      h("div", { class: "card__body card__body--flush" }, top.map(function (o, i) {
        return h("button", { class: "dash-top", type: "button", onClick: function () { openOrgBuildingsDrawer(o); } }, [
          h("span", { class: "dash-top__rank dash-top__rank--" + (i + 1), text: String(i + 1) }),
          h("span", { class: "dash-top__meta" }, [
            h("span", { class: "dash-top__name", text: o.org }),
            h("span", { class: "dash-top__sub", text: o.region + " · " + Fmt.num(o.count) + " " + t("dash.kpi.buildings").toLowerCase() })
          ]),
          h("span", { class: "dash-top__val" }, [h("b", { text: Fmt.num(o.area) }), h("span", { text: " m²" })]),
          UI.icon("chevron-right", "dash-top__chev")
        ]);
      }))
    ]);
    page.appendChild(h("div", { class: "section" }, topCard));
    return page;
  }

  /* TOP tashkilot: binolari ro'yxati (ildizgacha) */
  function openOrgBuildingsDrawer(o) {
    var body = h("div", { class: "assign-list" }, o.list.map(function (b) {
      return h("button", { class: "assign-row", type: "button", onClick: function () { openBuildingDrawer(b); } }, [
        h("span", { class: "assign-row__icon" }, UI.icon("building")),
        h("span", { class: "assign-row__meta" }, [
          h("span", { class: "assign-row__name", text: b.type + " · " + b.district }),
          h("span", { class: "assign-row__stir", text: Fmt.num(b.area) + " m² · " + b.built + (b.renovated ? " / " + b.renovated : "") })
        ]),
        UI.icon("chevron-right", "assign-row__check")
      ]);
    }));
    UI.openDrawer({ title: o.org, desc: o.region + " · " + Fmt.num(o.area) + " m²", body: body, footer: false });
  }

  /* Bino kartochkasi (eng quyi daraja): joylashuv xaritasi + pasportga o'tish */
  function openBuildingDrawer(b) {
    function row(l, v) { return h("div", { class: "odx-info__row" }, [h("span", { class: "odx-info__label", text: l }), h("span", { class: "odx-info__value" }, typeof v === "string" ? h("span", { text: v }) : v)]); }
    var mapEl = h("div", { class: "odx-map odx-map--sm" });
    UI.openDrawer({
      title: b.type,
      desc: b.org,
      body: h("div", {}, [
        mapEl,
        row(t("admin.filter.region"), b.region),
        row("Tuman", b.district),
        row(t("dash.soha"), b.soha),
        row(t("dash.col.area"), Fmt.num(b.area) + " m²"),
        row(t("dash.col.built"), String(b.built)),
        row(t("dash.col.renovated"), b.renovated ? String(b.renovated) : "—"),
        row(t("common.status"), h("span", { class: "badge badge--dotless badge--" + (b.status === "good" ? "success" : "warning"), text: b.status === "good" ? t("dash.st_good") : t("dash.st_repair") })),
        h("div", { class: "flex justify-end", style: "margin-top:var(--spacing-lg)" },
          UI.Button({ label: t("dash.open_org"), variant: "primary", icon: "eye", onClick: function () {
            UI.closeDrawer();
            App.openOrgDetail({ name: b.org, stir: b.stir || "—", region: b.region, type: b.soha });
          } }))
      ]),
      footer: false
    });
    if (b.lat && b.lng) setTimeout(function () {
      if (!global.L || !mapEl.isConnected) return;
      try {
        var m = global.L.map(mapEl, { scrollWheelZoom: false, zoomControl: false }).setView([b.lat, b.lng], 14);
        global.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
        global.L.marker([b.lat, b.lng]).addTo(m).bindPopup("<b>" + b.type + "</b><br>" + b.org).openPopup();
      } catch (e) {}
    }, 80);
  }
  function tipRow(label, val) {
    return h("div", { class: "uzmap-tip__row" }, [h("span", { text: label }), h("b", { text: val })]);
  }

  /* Viloyat kesimi: tuman xaritasi + bino turlari + reestr */
  function dashRegionView() {
    var names = AD().mapRegionNames;
    var regionKey = dashState.region, regionName = names[regionKey];
    var entry = (global.UZMAP_REGIONS || []).filter(function (e) { return e.type === regionKey; })[0];
    var list = buildingsOf(regionName);

    var page = h("div", { class: "page" });

    // Breadcrumb: Bosh sahifa -> viloyat (-> tuman filtri); joyida yangilanadi
    var crumbs = h("div", { class: "crumbs", style: "margin-bottom:var(--spacing-lg)" });
    function renderCrumbs() {
      crumbs.innerHTML = "";
      crumbs.appendChild(h("button", { class: "crumbs__link", type: "button", onClick: function () { dashState.region = null; dashState.district = null; App.refresh(); } }, h("span", { text: t("dash.title") })));
      crumbs.appendChild(h("span", { class: "crumbs__sep" }, UI.icon("chevron-right")));
      if (dashState.district) {
        crumbs.appendChild(h("button", { class: "crumbs__link", type: "button", onClick: function () {
          dashState.district = null;
          if (dmapWrap && dmapWrap._syncSel) dmapWrap._syncSel();
          syncChip(); renderCrumbs(); renderBody();
        } }, h("span", { text: regionName })));
        crumbs.appendChild(h("span", { class: "crumbs__sep" }, UI.icon("chevron-right")));
        crumbs.appendChild(h("span", { class: "crumbs__cur", text: dashState.district }));
      } else {
        crumbs.appendChild(h("span", { class: "crumbs__cur", text: regionName }));
      }
    }
    renderCrumbs();
    page.appendChild(crumbs);

    page.appendChild(h("div", { class: "page__head" }, h("div", {}, [
      h("h1", { class: "page__title", text: regionName }),
      h("p", { class: "page__desc", text: t("dash.region_desc") })
    ])));

    // KPI (hudud kesimi)
    var orgs = {}; list.forEach(function (b) { orgs[b.org] = 1; });
    var area = list.reduce(function (a, b) { return a + b.area; }, 0);
    var needRepair = list.filter(function (b) { return b.status === "repair"; }).length;
    page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:4;--cols-md:2" }, [
      App.kpi("building", t("admin.kpi.orgs"), Object.keys(orgs).length, null, ""),
      App.kpi("grid", t("dash.kpi.buildings"), list.length, null, "ok"),
      App.kpi("map", t("dash.kpi.area"), Fmt.num(area) + " m²", null, ""),
      App.kpi("refresh", t("dash.kpi.repair"), needRepair, list.length ? Math.round(needRepair / list.length * 100) : 0, "warn")
    ])));

    // Tuman xaritasi — tuman bosilsa reestr JOYIDA filtrlanadi (sahifa qayta chizilmaydi)
    var byDistrict = {}; list.forEach(function (b) { var k = distBase(b.district); byDistrict[k] = (byDistrict[k] || 0) + 1; });
    var dmapWrap = null;
    var chipHost = h("div", { class: "card__head-actions" });
    function syncChip() {
      chipHost.innerHTML = "";
      if (!dashState.district) return;
      chipHost.appendChild(h("button", { class: "dash-chip is-active", type: "button", onClick: function () {
        dashState.district = null;
        if (dmapWrap && dmapWrap._syncSel) dmapWrap._syncSel();
        syncChip(); renderCrumbs(); renderBody();
      } }, [h("span", { text: dashState.district }), h("span", { class: "dash-chip__n", text: "✕" })]));
    }
    if (entry && entry.districts && entry.districts.length) {
      dmapWrap = uzMap(entry.districts, {
        fit: true,
        value: function (d) { return byDistrict[distBase(distName(d.type))] || 1; },
        max: Math.max.apply(null, Object.keys(byDistrict).length ? Object.keys(byDistrict).map(function (k) { return byDistrict[k]; }) : [1]),
        selected: function (d) { return !!dashState.district && distBase(distName(d.type)) === distBase(dashState.district); },
        onClick: function (d) {
          var dn = distName(d.type);
          dashState.district = dashState.district === dn ? null : dn;
          syncChip(); renderCrumbs(); renderBody();
        },
        tooltip: function (d) {
          var dn = distName(d.type), dbase = distBase(dn);
          var db = list.filter(function (b) { return distBase(b.district) === dbase; });
          var darea = db.reduce(function (a, b) { return a + b.area; }, 0);
          return [
            h("div", { class: "uzmap-tip__title", text: dn }),
            tipRow(t("dash.kpi.buildings"), bLabel(db.length)),
            db.length ? tipRow(t("dash.kpi.area"), Fmt.num(darea) + " m²") : null,
            h("div", { class: "uzmap-tip__hint", text: t("dash.district_hint") })
          ];
        }
      });
      syncChip();
      page.appendChild(h("div", { class: "section" }, h("div", { class: "card" }, [
        h("div", { class: "card__head" }, [
          h("div", {}, [h("div", { class: "card__title", text: t("dash.district_map") }), h("div", { class: "card__subtitle", text: regionName })]),
          chipHost
        ]),
        h("div", { class: "card__body dash-district-map" }, dmapWrap)
      ])));
    }

    // Soha filtri + bino turlari chiplari (tuman filtri bilan)
    var filteredBySoha = function () {
      return list.filter(function (b) {
        if (dashState.district && distBase(b.district) !== distBase(dashState.district)) return false;
        return dashState.soha === "all" || b.soha === dashState.soha;
      });
    };
    var body = h("div");
    var sohaSel = UI.Select({
      value: dashState.soha,
      options: [{ value: "all", label: t("dash.soha") + ": " + t("staff.filter.all") }].concat(AD().buildingSoha.map(function (s) { return { value: s, label: s }; })),
      onChange: function (v) { dashState.soha = v; dashState.type = "all"; renderBody(); }
    });
    sohaSel.classList.add("adm-filter");
    page.appendChild(h("div", { class: "section" }, [h("div", { class: "adm-toolbar", style: "margin-bottom:var(--spacing-lg)" }, sohaSel), body]));

    function renderBody() {
      body.innerHTML = "";
      var bl = filteredBySoha();
      var byType = {}; bl.forEach(function (b) { byType[b.type] = (byType[b.type] || 0) + 1; });

      // Tur chiplari
      var chips = h("div", { class: "dash-chips" });
      chips.appendChild(chip(t("staff.filter.all"), bl.length, dashState.type === "all", function () { dashState.type = "all"; renderBody(); }));
      AD().buildingTypes.forEach(function (tp) {
        if (!byType[tp]) return;
        chips.appendChild(chip(tp, byType[tp], dashState.type === tp, function () { dashState.type = tp; renderBody(); }));
      });
      body.appendChild(chips);

      var rows = bl.filter(function (b) { return dashState.type === "all" || b.type === dashState.type; });
      body.appendChild(h("div", { class: "card" }, h("div", { class: "card__body card__body--flush" }, UI.DataTable({
        sticky: true,
        columns: [
          { key: "type", label: t("dash.col.type"), sticky: "left", strong: true },
          { key: "org", label: t("role.org") },
          { key: "soha", label: t("dash.soha") },
          { key: "district", label: t("admin.filter.region") },
          { key: "area", label: t("dash.col.area"), align: "right", render: function (r) { return Fmt.num(r.area) + " m²"; } },
          { key: "built", label: t("dash.col.built"), align: "right" },
          { key: "renovated", label: t("dash.col.renovated"), align: "right", render: function (r) { return r.renovated || "—"; } },
          { key: "status", label: t("common.status"), render: function (r) { return h("span", { class: "badge badge--dotless badge--" + (r.status === "good" ? "success" : "warning"), text: r.status === "good" ? t("dash.st_good") : t("dash.st_repair") }); } },
          { key: "act", label: t("common.actions"), sticky: "right", render: function (r) {
            return UI.Button({ icon: "eye", variant: "secondary", size: "sm", title: t("common.view", "Ko‘rish"), onClick: function () { openBuildingDrawer(r); } });
          } }
        ],
        rows: rows,
        empty: { icon: "building" }
      }))));
    }
    function chip(label, count, active, onClick) {
      return h("button", { class: "dash-chip" + (active ? " is-active" : ""), type: "button", onClick: onClick }, [
        h("span", { text: label }), h("span", { class: "dash-chip__n", text: String(count) })
      ]);
    }
    renderBody();
    return page;
  }

  /* ======================= 8. Sohalar (kartalar) ======================== */
  var sohaPageState = { sel: null, region: null, district: null };
  var SOHA_ICONS = {
    "Sog‘liqni saqlash": "heart", "Ijtimoiy himoya tashkilotlari": "users", "Sport": "zap",
    "Madaniyat": "grid", "Umumiy ta’lim": "clipboard", "Maktabgacha ta’lim": "heart",
    "Sud, prokuratura va adliya organlari": "shield", "Davlat markaziy hokimiyati va davlat boshqaruvi organlari": "building",
    "Suv xo‘jaligi": "map", "Qishloq xo‘jaligi": "map", "Fan (oliy ta’lim va ilmiy tadqiqiot muassasalari)": "clipboard"
  };
  function sohaStats(s, i) {
    // Deterministik ko'rsatkichlar; mavjud binolar datasetiga mos kelsa, undan olinadi
    var b = AD().buildings.filter(function (x) { return x.soha === s.name; }).length;
    return {
      orgs: 40 + ((i * 137) % 380),
      buildings: b || 60 + ((i * 61) % 300),
      staff: 1200 + ((i * 997) % 9000)
    };
  }

  function renderSohalarPage() {
    if (sohaPageState.sel) return sohaDetailPage(sohaPageState.sel);
    var page = h("div", { class: "page" });
    page.appendChild(pageHead(t("page.asohalar.title"), t("page.asohalar.desc")));
    page.appendChild(h("div", { class: "soha-grid" }, AD().sohalar.map(function (s, i) {
      var st = sohaStats(s, i);
      return h("button", { class: "soha-card card", type: "button", onClick: function () { sohaPageState.sel = s; sohaPageState.region = null; sohaPageState.district = null; App.refresh(); } }, [
        h("div", { class: "soha-card__head" }, [
          h("span", { class: "soha-card__tile", style: "background:var(--chart-" + ((i % 6) + 1) + ")" }, UI.icon(SOHA_ICONS[s.name] || "box")),
          h("span", { class: "soha-card__name", text: s.name })
        ]),
        h("div", { class: "soha-card__stats" }, [
          sohaStat(t("soha.orgs"), st.orgs),
          sohaStat(t("soha.buildings"), st.buildings),
          sohaStat(t("soha.staff"), st.staff)
        ])
      ]);
    })));
    return page;

    function sohaStat(label, val) {
      return h("div", { class: "soha-card__stat" }, [
        h("span", { class: "soha-card__stat-l", text: label }),
        h("b", { class: "soha-card__stat-v", text: Fmt.num(val) })
      ]);
    }
  }

  /* Soha ichi — chuqur drill: soha -> hududlar -> tumanlar -> tashkilotlar */
  function sohaRegionStats(si, ri) {
    var orgs = 4 + ((si * 7 + ri * 13) % 34);
    return { orgs: orgs, buildings: orgs + ((si * 3 + ri * 5) % 42), staff: orgs * (14 + ((si + ri) % 26)) };
  }
  function sohaDistrictStats(si, ri, di) {
    var orgs = 1 + ((si * 5 + ri * 3 + di * 7) % 9);
    return { orgs: orgs, buildings: orgs + ((si + ri + di * 3) % 7), staff: orgs * (10 + ((si + di) % 22)) };
  }
  function sohaOrgName(s, district, j) {
    var n = s.name;
    if (n === "Sog‘liqni saqlash") return district + " " + (j + 1) + "-son oilaviy poliklinikasi";
    if (n === "Umumiy ta’lim") return "“" + (100 + j * 3) + "-sonli umumiy o‘rta ta’lim maktabi” DM";
    if (n === "Maktabgacha ta’lim") return district + " " + (20 + j) + "-sonli MTT";
    if (n === "Madaniyat") return district + " " + (j + 1) + "-madaniyat uyi";
    if (n === "Sport") return district + " bolalar-o‘smirlar sport maktabi";
    return district + " " + n.split(" ")[0].toLowerCase() + " bo‘limi" + (j ? " №" + (j + 1) : "");
  }

  function sohaCrumbs() {
    var st = sohaPageState;
    var parts = [
      { label: t("page.asohalar.title"), onClick: function () { st.sel = null; st.region = null; st.district = null; App.refresh(); } },
      { label: st.sel.name, onClick: st.region ? function () { st.region = null; st.district = null; App.refresh(); } : null }
    ];
    if (st.region) parts.push({ label: st.region, onClick: st.district ? function () { st.district = null; App.refresh(); } : null });
    if (st.district) parts.push({ label: st.district, onClick: null });
    var row = h("div", { class: "crumbs" });
    parts.forEach(function (p, idx) {
      if (idx) row.appendChild(h("span", { class: "crumbs__sep" }, UI.icon("chevron-right")));
      row.appendChild(p.onClick
        ? h("button", { class: "crumbs__link", type: "button", onClick: p.onClick }, h("span", { text: p.label }))
        : h("span", { class: "crumbs__cur", text: p.label }));
    });
    return row;
  }

  function drillTable(cols, rows) {
    return h("div", { class: "card" }, h("div", { class: "card__body card__body--flush" }, UI.DataTable({ sticky: true, columns: cols, rows: rows })));
  }

  function sohaDetailPage(s) {
    var st = sohaPageState;
    var si = AD().sohalar.indexOf(s);
    var page = h("div", { class: "page" });
    page.appendChild(h("div", { style: "margin-bottom:var(--spacing-lg)" }, sohaCrumbs()));

    var names = AD().mapRegionNames;
    var regionList = Object.keys(names).map(function (k) { return names[k]; });

    if (!st.region) {
      // 2-daraja: hududlar ro'yxati
      var tot = sohaStats(s, si);
      page.appendChild(pageHead(s.name, t("soha.detail_desc")));
      page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:3;--cols-md:1" }, [
        App.kpi("building", t("soha.orgs"), tot.orgs, null, ""),
        App.kpi("grid", t("soha.buildings"), tot.buildings, null, "ok"),
        App.kpi("users", t("soha.staff"), tot.staff, null, "")
      ])));
      page.appendChild(h("div", { class: "staff-group-heading", text: t("soha.regions") }));
      page.appendChild(h("div", { class: "section" }, drillTable([
        { key: "name", label: t("admin.filter.region"), sticky: "left", strong: true },
        { key: "orgs", label: t("soha.orgs"), align: "right", render: function (r) { return Fmt.num(r.orgs); } },
        { key: "buildings", label: t("soha.buildings"), align: "right", render: function (r) { return Fmt.num(r.buildings); } },
        { key: "staff", label: t("soha.staff"), align: "right", render: function (r) { return Fmt.num(r.staff); } },
        { key: "act", label: "", sticky: "right", render: function (r) {
          return UI.Button({ icon: "chevron-right", variant: "secondary", size: "sm", title: t("common.view", "Ko‘rish"), onClick: function () { st.region = r.name; App.refresh(); } });
        } }
      ], regionList.map(function (rn, ri) { var x = sohaRegionStats(si, ri); return { name: rn, orgs: x.orgs, buildings: x.buildings, staff: x.staff }; }))));
      return page;
    }

    var ri = regionList.indexOf(st.region);
    var districts = (global.UZB_REGIONS && global.UZB_REGIONS[st.region]) || ["Markaziy tuman"];

    if (!st.district) {
      // 3-daraja: tanlangan hudud ichida tumanlar
      var rs = sohaRegionStats(si, ri);
      page.appendChild(pageHead(st.region, s.name + " — " + t("soha.districts_desc")));
      page.appendChild(h("div", { class: "section" }, h("div", { class: "cols", style: "--cols:3;--cols-md:1" }, [
        App.kpi("building", t("soha.orgs"), rs.orgs, null, ""),
        App.kpi("grid", t("soha.buildings"), rs.buildings, null, "ok"),
        App.kpi("users", t("soha.staff"), rs.staff, null, "")
      ])));
      page.appendChild(h("div", { class: "staff-group-heading", text: t("soha.districts") }));
      page.appendChild(h("div", { class: "section" }, drillTable([
        { key: "name", label: "Tuman", sticky: "left", strong: true },
        { key: "orgs", label: t("soha.orgs"), align: "right", render: function (r) { return Fmt.num(r.orgs); } },
        { key: "buildings", label: t("soha.buildings"), align: "right", render: function (r) { return Fmt.num(r.buildings); } },
        { key: "staff", label: t("soha.staff"), align: "right", render: function (r) { return Fmt.num(r.staff); } },
        { key: "act", label: "", sticky: "right", render: function (r) {
          return UI.Button({ icon: "chevron-right", variant: "secondary", size: "sm", title: t("common.view", "Ko‘rish"), onClick: function () { st.district = r.name; App.refresh(); } });
        } }
      ], districts.map(function (dn, di) { var x = sohaDistrictStats(si, ri, di); return { name: dn, orgs: x.orgs, buildings: x.buildings, staff: x.staff }; }))));
      return page;
    }

    // 4-daraja: tuman ichidagi tashkilotlar (bosilsa pasportga)
    var di = districts.indexOf(st.district);
    var ds = sohaDistrictStats(si, ri, Math.max(0, di));
    var orgs = [];
    for (var j = 0; j < ds.orgs; j++) {
      orgs.push({
        name: sohaOrgName(s, st.district, j),
        stir: "2" + String(10000000 + ((si * 131 + ri * 977 + di * 89 + j * 7919) % 89999999)),
        buildings: 1 + ((j + di) % 4),
        staff: 12 + ((si + j * 17) % 160)
      });
    }
    page.appendChild(pageHead(st.district, s.name + " — " + t("soha.orgs_desc")));
    page.appendChild(h("div", { class: "section" }, drillTable([
      { key: "name", label: t("admin.col.name"), sticky: "left", strong: true },
      { key: "stir", label: "STIR", render: function (r) { return h("span", { class: "mono", text: r.stir }); } },
      { key: "buildings", label: t("soha.buildings"), align: "right", render: function (r) { return Fmt.num(r.buildings); } },
      { key: "staff", label: t("soha.staff"), align: "right", render: function (r) { return Fmt.num(r.staff); } },
      { key: "act", label: t("common.actions"), sticky: "right", render: function (r) {
        return UI.Button({ icon: "eye", variant: "secondary", size: "sm", title: t("common.view", "Ko‘rish"), onClick: function () {
          App.openOrgDetail({ name: r.name, stir: r.stir, region: st.region, type: s.name });
        } });
      } }
    ], orgs)));
    return page;
  }

  global.AdminPages = {
    dashboard: renderDashboard,
    sohalar: renderSohalarPage,
    orgManage: renderOrgManage,
    users: renderUsers,
    classifiers: renderClassifiers,
    konstruktor: renderConstructor,
    logs: renderLogs,
    orgDetail: renderOrgDetail,
    setDetailOrg: setDetailOrg
  };
})(window);
