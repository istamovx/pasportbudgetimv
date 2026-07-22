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
    var page = h("div", { class: "page" });

    // Sarlavha + amallar
    page.appendChild(h("div", { class: "page__head flex justify-between items-start gap-lg flex-wrap" }, [
      h("div", { style: "min-width:0" }, [
        h("h1", { class: "page__title", text: org.name }),
        h("p", { class: "page__desc", text: "STIR: " + org.stir + (org.type ? " · " + org.type : "") })
      ]),
      h("div", { class: "flex gap-md flex-wrap" }, [
        UI.Button({ label: t("od.open_passport"), variant: "secondary", icon: "eye", onClick: function () { App.openOrg(org); } }),
        UI.Button({ label: t("common.back"), variant: "secondary", icon: "chevron-left", onClick: function () { App.navigate("aorgs"); } })
      ])
    ]));

    // Umumiy to'ldirilganlik hero
    var pctAll = od.userFields.total ? Math.round(od.userFields.done / od.userFields.total * 100) : 0;
    page.appendChild(h("div", { class: "section" }, h("div", { class: "card od-hero" }, [
      odRing(pctAll),
      h("div", { class: "od-hero__meta" }, [
        h("div", { class: "od-hero__label", text: t("od.overall") }),
        odBar(pctAll),
        h("div", { class: "od-hero__count", text: od.userFields.done + " / " + od.userFields.total + " " + t("od.fields") })
      ])
    ])));

    // Tablar
    page.appendChild(UI.Tabs({
      active: odState.tab,
      items: od.tabs.map(function (td) {
        return { id: td.id, label: [h("span", { text: td.label }), odPill(td)], render: function () { odState.tab = td.id; return odTabPanel(td); } };
      })
    }));
    return page;
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

  global.AdminPages = {
    orgManage: renderOrgManage,
    users: renderUsers,
    classifiers: renderClassifiers,
    konstruktor: renderConstructor,
    logs: renderLogs,
    orgDetail: renderOrgDetail,
    setDetailOrg: setDetailOrg
  };
})(window);
