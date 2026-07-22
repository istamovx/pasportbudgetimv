/* ==========================================================================
   Reusable UI components (vanilla JS factory functions).
   Every component returns a DOM node. Reusable for future Admin (multi-org):
   they take plain data objects, never global singletons.
   ========================================================================== */
(function (global) {
  "use strict";
  var t = function (k, f) { return global.I18N ? I18N.t(k, f) : (f || k); };

  /* ---- Tiny hyperscript helper ---- */
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "text") el.textContent = v;
      else if (k === "dataset") Object.keys(v).forEach(function (d) { el.dataset[d] = v[d]; });
      else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v);
    });
    if (children != null) append(el, children);
    return el;
  }
  function append(el, children) {
    if (Array.isArray(children)) children.forEach(function (c) { append(el, c); });
    else if (children instanceof Node) el.appendChild(children);
    else if (children != null) el.appendChild(document.createTextNode(String(children)));
  }

  /* ---- Icon set (inline SVG, 24x24, currentColor) ---- */
  var ICONS = {
    grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
    map: '<path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3zM9 7v13M15 4v13"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12l8.73-5.04M12 22V12"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
    menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    table: '<path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18"/>',
    chart: '<path d="M3 3v18h18M7 16l4-4 3 3 5-6"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    down: '<path d="M12 5v14M5 12l7 7 7-7"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    refresh: '<path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    globe: '<path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    "chevron-left": '<path d="M15 18l-6-6 6-6"/>',
    "chevron-down": '<path d="M6 9l6 6 6-6"/>',
    "chevron-right": '<path d="M9 18l6-6-6-6"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14M10 11v6M14 11v6"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
    building: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/>',
    "switch": '<path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7"/>'
  };
  function icon(name, cls) {
    var svg = 'data:', wrap = h("span", { class: "icon " + (cls || ""), "aria-hidden": "true" });
    wrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%">' + (ICONS[name] || "") + '</svg>';
    return wrap;
  }

  /* ---- EmptyState ---- */
  function EmptyState(opts) {
    opts = opts || {};
    var node = h("div", { class: "empty", role: "status" }, [
      h("div", { class: "empty__icon" }, icon(opts.icon || "inbox")),
      h("div", { class: "empty__title" }, opts.title || t("empty.title")),
      h("div", { class: "empty__desc" }, opts.desc || t("empty.desc"))
    ]);
    if (opts.cta) {
      node.appendChild(h("div", { class: "empty__cta" },
        Button({ label: opts.cta, variant: "secondary", icon: "plus", onClick: opts.onCta })));
    }
    return node;
  }

  /* ---- Button ---- */
  function Button(opts) {
    opts = opts || {};
    var b = h("button", {
      class: "btn btn--" + (opts.variant || "secondary") + (opts.size ? " btn--" + opts.size : ""),
      type: "button", disabled: opts.disabled,
      onClick: opts.onClick, title: opts.title
    });
    if (opts.icon) b.appendChild(icon(opts.icon));
    if (opts.label) b.appendChild(h("span", { text: opts.label }));
    return b;
  }

  /* ---- Edit button (pencil) — used on every editable block ---- */
  function editButton(onClick, label) {
    return h("button", {
      class: "btn btn--secondary btn--sm", type: "button",
      title: label || t("common.edit"), "aria-label": label || t("common.edit"),
      onClick: onClick
    }, [icon("edit"), h("span", { class: "btn__label-md", text: label || t("common.edit") })]);
  }

  /* ---- StatusBadge ---- */
  var STATUS_MAP = {
    new: { cls: "brand", key: "status.new" },
    active: { cls: "success", key: "status.active" },
    pending: { cls: "warning", key: "status.pending" },
    closed: { cls: "neutral", key: "status.closed" },
    overdue: { cls: "danger", key: "status.overdue" }
  };
  function StatusBadge(status, opts) {
    opts = opts || {};
    var m = STATUS_MAP[status] || { cls: opts.variant || "neutral", key: null };
    var label = opts.label || (m.key ? t(m.key) : status);
    return h("span", { class: "badge badge--" + m.cls + (opts.dotless ? " badge--dotless" : "") }, label);
  }

  /* ---- KpiCard (with optional sparkline placeholder canvas) ---- */
  function KpiCard(opts) {
    opts = opts || {};
    var top = h("div", { class: "kpi__top" }, []);
    if (opts.icon) top.appendChild(h("span", { class: "kpi__icon" }, icon(opts.icon)));
    top.appendChild(h("div", { class: "kpi__label", text: opts.label }));

    var kids = [top, h("div", { class: "kpi__value", text: opts.value })];

    var spark = null;
    if (opts.trend || opts.sparkline) {
      var foot = h("div", { class: "kpi__foot" });
      if (opts.trend) {
        var dir = opts.trend.dir === "down" ? "down" : "up";
        foot.appendChild(h("span", { class: "kpi__trend kpi__trend--" + dir }, [h("span", { text: opts.trend.text })]));
      }
      if (opts.sparkline) { spark = h("canvas", { class: "kpi__spark", width: "192", height: "64" }); foot.appendChild(spark); }
      kids.push(foot);
    }

    var card = h("div", { class: "kpi" }, kids);
    // expose sparkline canvas so chart helper can render into it
    card._sparkCanvas = spark;
    card._sparkData = opts.sparkline;
    card._sparkColor = opts.sparkColor;
    return card;
  }

  /* ---- Custom Select (modern dropdown) ---- */
  function normOpts(list) { return (list || []).map(function (o) { return typeof o === "string" ? { value: o, label: o } : o; }); }
  function Select(opts) {
    opts = opts || {};
    var value = opts.value != null ? String(opts.value) : "";
    var options = normOpts(opts.options);
    var valueEl = h("span", { class: "select-ui__value" });
    var control = h("button", { class: "select-ui__control", type: "button" }, [valueEl, h("span", { class: "select-ui__chev" }, icon("chevron-down"))]);
    var panel = h("div", { class: "select-ui__panel", role: "listbox" });
    var root = h("div", { class: "select-ui" + (opts.disabled ? " is-disabled" : "") }, [control, panel]);

    function labelFor(v) { for (var i = 0; i < options.length; i++) if (String(options[i].value) === String(v)) return options[i].label; return ""; }
    function renderValue() { var lbl = labelFor(value); valueEl.textContent = lbl || (opts.placeholder || "Tanlang"); valueEl.classList.toggle("is-placeholder", !lbl); }
    function renderOptions() {
      panel.innerHTML = "";
      if (!options.length) { panel.appendChild(h("div", { class: "select-ui__empty", text: "—" })); return; }
      options.forEach(function (o) {
        var sel = String(o.value) === String(value);
        var opt = h("div", { class: "select-ui__opt" + (sel ? " is-sel" : ""), role: "option", dataset: { value: o.value } },
          [h("span", { class: "select-ui__opt-label", text: o.label }), sel ? icon("check", "select-ui__check") : null]);
        opt.addEventListener("click", function (e) { e.stopPropagation(); setValue(o.value); close(); if (opts.onChange) opts.onChange(value); });
        panel.appendChild(opt);
      });
    }
    function setValue(v) { value = String(v); renderValue(); renderOptions(); }
    function open() {
      if (opts.disabled) return;
      // close any other open selects
      document.querySelectorAll(".select-ui.is-open").forEach(function (s) { if (s !== root) s.classList.remove("is-open", "is-up"); });
      var r = control.getBoundingClientRect();
      root.classList.toggle("is-up", (window.innerHeight - r.bottom) < 280 && r.top > 280);
      root.classList.add("is-open");
      var selEl = panel.querySelector(".is-sel"); if (selEl) selEl.scrollIntoView({ block: "nearest" });
    }
    function close() { root.classList.remove("is-open", "is-up"); }
    control.addEventListener("click", function (e) { e.stopPropagation(); root.classList.contains("is-open") ? close() : open(); });
    document.addEventListener("click", function (e) { if (!root.contains(e.target)) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    renderValue(); renderOptions();
    Object.defineProperty(root, "value", { get: function () { return value; }, set: function (v) { setValue(v); } });
    root._setOptions = function (newOpts, val) { options = normOpts(newOpts); value = val != null ? String(val) : ""; renderValue(); renderOptions(); };
    return root;
  }

  /* ---- FormField ---- */
  function FormField(opts) {
    opts = opts || {};
    var id = "f_" + Math.abs(hash(opts.label + (opts.name || "")));
    var labelChildren = [h("span", { text: opts.label })];
    if (opts.required) labelChildren.push(h("span", { class: "req", text: "*" }));
    if (opts.computed) labelChildren.push(h("span", { class: "field__badge field__badge--fx", text: "fx" }));
    else if (opts.readonly || opts.disabled) labelChildren.push(h("span", { class: "field__badge field__badge--ro", title: "read-only", text: "🔒" }));

    var input;
    if (opts.type === "select") {
      input = Select({ value: opts.value, options: opts.options, placeholder: opts.placeholder, disabled: opts.disabled, onChange: opts.onChange });
    } else {
      input = h("input", {
        class: "input" + (opts.computed ? " is-fx" : ""),
        id: id, type: opts.type || "text",
        value: opts.value != null ? opts.value : "",
        placeholder: opts.placeholder || "",
        disabled: opts.disabled || opts.readonly || opts.computed,
        name: opts.name || ""
      });
    }
    var wrap = h("div", { class: "field" + (opts.error ? " has-error" : "") }, [
      h("label", { class: "field__label", for: id }, labelChildren),
      input
    ]);
    if (opts.hint) wrap.appendChild(h("div", { class: "field__hint", text: opts.hint }));
    if (opts.error) wrap.appendChild(h("div", { class: "field__error", text: opts.error }));
    wrap._input = input;
    return wrap;
  }

  /* ---- Tabs (scrollable; no overflow-duplication bug) ---- */
  function Tabs(opts) {
    opts = opts || {};
    var items = opts.items || [];
    var active = opts.active || (items[0] && items[0].id);
    var bar = h("div", { class: "tabs", role: "tablist" });
    var panelHost = h("div", { class: "tabs__panels" });

    function select(id) {
      active = id;
      bar.querySelectorAll(".tab").forEach(function (b) {
        b.classList.toggle("is-active", b.dataset.id === id);
        b.setAttribute("aria-selected", b.dataset.id === id ? "true" : "false");
      });
      panelHost.innerHTML = "";
      var it = items.filter(function (x) { return x.id === id; })[0];
      if (it && it.render) panelHost.appendChild(it.render());
      if (opts.onChange) opts.onChange(id);
    }
    items.forEach(function (it) {
      bar.appendChild(h("button", {
        class: "tab" + (it.id === active ? " is-active" : ""),
        role: "tab", dataset: { id: it.id }, type: "button",
        "aria-selected": it.id === active ? "true" : "false",
        onClick: function () { select(it.id); }
      }, it.label));
    });
    var root = h("div", { class: "tabs-wrap" }, [bar, panelHost]);
    // initial panel
    setTimeout(function () { select(active); }, 0);
    root._select = select;
    return root;
  }

  /* ---- Segmented (chart <-> table) ---- */
  function Segmented(opts) {
    opts = opts || {};
    var value = opts.value || (opts.items[0] && opts.items[0].id);
    var group = h("div", { class: "segmented", role: "group" });
    opts.items.forEach(function (it) {
      var b = h("button", {
        class: "segmented__btn" + (it.id === value ? " is-active" : ""),
        type: "button", dataset: { id: it.id }, title: it.label,
        "aria-pressed": it.id === value ? "true" : "false",
        onClick: function () {
          value = it.id;
          group.querySelectorAll(".segmented__btn").forEach(function (x) {
            x.classList.toggle("is-active", x.dataset.id === value);
            x.setAttribute("aria-pressed", x.dataset.id === value ? "true" : "false");
          });
          if (opts.onChange) opts.onChange(value);
        }
      }, [it.icon ? icon(it.icon) : null, h("span", { text: it.label })]);
      group.appendChild(b);
    });
    return group;
  }

  /* ---- DataTable ----
     opts: { columns:[{key,label,align,sticky:'left'|'right',render,strong}], rows:[], foot:[], sticky:true, caption }
  */
  function DataTable(opts) {
    opts = opts || {};
    var cols = opts.columns || [];
    if (!opts.rows || !opts.rows.length) {
      return EmptyState(opts.empty || {});
    }
    var table = h("table", { class: "table" + (opts.sticky ? " table--sticky" : "") });
    if (opts.caption) table.appendChild(h("caption", { class: "sr-only", text: opts.caption }));

    var thead = h("thead"), htr = h("tr");
    cols.forEach(function (c) {
      htr.appendChild(h("th", {
        class: (c.align === "right" ? "num " : "") + stickyClass(c.sticky),
        scope: "col"
      }, c.label));
    });
    thead.appendChild(htr); table.appendChild(thead);

    var tbody = h("tbody");
    opts.rows.forEach(function (row) {
      var tr = h("tr");
      cols.forEach(function (c) {
        var content = c.render ? c.render(row) : row[c.key];
        var td = h("td", {
          class: (c.align === "right" ? "num " : "") + (c.strong ? "strong " : "") + stickyClass(c.sticky)
        });
        append(td, content);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    if (opts.foot && opts.foot.length) {
      var tfoot = h("tfoot"), ftr = h("tr");
      opts.foot.forEach(function (cell) {
        ftr.appendChild(h("td", { class: (cell.align === "right" ? "num " : "") }, cell.content));
      });
      tfoot.appendChild(ftr); table.appendChild(tfoot);
    }
    return h("div", { class: "table-wrap" }, table);
  }
  function stickyClass(s) { return s === "left" ? "col-sticky-left" : s === "right" ? "col-sticky-right" : ""; }

  /* ---- Drawer (single instance, mounted to body) ---- */
  var drawerEl = null, scrimEl = null;
  function ensureDrawer() {
    if (drawerEl) return;
    scrimEl = h("div", { class: "scrim", onClick: closeDrawer });
    drawerEl = h("div", { class: "drawer", role: "dialog", "aria-modal": "true" });
    document.body.appendChild(scrimEl);
    document.body.appendChild(drawerEl);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });
  }
  function openDrawer(opts) {
    ensureDrawer();
    opts = opts || {};
    drawerEl.innerHTML = "";
    var head = h("div", { class: "drawer__head" }, [
      h("div", {}, [
        h("div", { class: "drawer__title", text: opts.title || "" }),
        opts.desc ? h("div", { class: "drawer__desc", text: opts.desc }) : null
      ]),
      h("button", { class: "icon-btn", type: "button", "aria-label": t("common.close"), onClick: closeDrawer }, icon("close"))
    ]);
    var body = h("div", { class: "drawer__body" });
    append(body, opts.body || "");
    drawerEl.appendChild(head);
    drawerEl.appendChild(body);
    if (opts.footer !== false) {
      var foot = h("div", { class: "drawer__foot" }, [
        Button({ label: t("common.cancel"), variant: "secondary", onClick: closeDrawer }),
        Button({ label: opts.saveLabel || t("common.save"), variant: "primary", icon: "check", onClick: function () {
          if (opts.onSave) opts.onSave();
          closeDrawer();
        } })
      ]);
      drawerEl.appendChild(foot);
    }
    requestAnimationFrame(function () {
      scrimEl.classList.add("is-open");
      drawerEl.classList.add("is-open");
    });
  }
  function closeDrawer() {
    if (!drawerEl) return;
    scrimEl.classList.remove("is-open");
    drawerEl.classList.remove("is-open");
  }

  /* ---- Modal (centered dialog) ---- */
  var modalEl = null, modalScrim = null;
  function ensureModal() {
    if (modalEl) return;
    modalScrim = h("div", { class: "modal-scrim", onClick: closeModal });
    modalEl = h("div", { class: "modal", role: "dialog", "aria-modal": "true" });
    document.body.appendChild(modalScrim);
    document.body.appendChild(modalEl);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  }
  function openModal(opts) {
    ensureModal();
    opts = opts || {};
    modalEl.className = "modal" + (opts.size ? " modal--" + opts.size : "");
    modalEl.innerHTML = "";
    var head = h("div", { class: "modal__head" }, [
      h("div", {}, [
        h("div", { class: "modal__title", text: opts.title || "" }),
        opts.desc ? h("div", { class: "modal__desc", text: opts.desc }) : null
      ]),
      h("button", { class: "icon-btn", type: "button", "aria-label": t("common.close"), onClick: closeModal }, icon("close"))
    ]);
    var body = h("div", { class: "modal__body" });
    append(body, opts.body || "");
    modalEl.appendChild(head);
    modalEl.appendChild(body);
    if (opts.foot) { var f = h("div", { class: "modal__foot" }); append(f, opts.foot); modalEl.appendChild(f); }
    requestAnimationFrame(function () { modalScrim.classList.add("is-open"); modalEl.classList.add("is-open"); });
    return { body: body, close: closeModal };
  }
  function closeModal() { if (!modalEl) return; modalScrim.classList.remove("is-open"); modalEl.classList.remove("is-open"); }

  function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return h; }

  global.UI = {
    h: h, append: append, icon: icon, ICONS: ICONS,
    EmptyState: EmptyState, Button: Button, StatusBadge: StatusBadge,
    KpiCard: KpiCard, FormField: FormField, Select: Select, Tabs: Tabs, Segmented: Segmented,
    DataTable: DataTable, openDrawer: openDrawer, closeDrawer: closeDrawer,
    openModal: openModal, closeModal: closeModal, editButton: editButton
  };
})(window);
