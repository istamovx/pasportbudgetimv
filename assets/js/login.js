/* ==========================================================================
   Login page interactions (mock auth -> redirects to dashboard).
   ========================================================================== */
(function () {
  "use strict";
  function svg(paths) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%">' + paths + "</svg>";
  }
  var ICONS = {
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>'
  };
  function setIcon(el, name) { if (el) el.innerHTML = svg(ICONS[name] || ""); }

  // Populate icons
  setIcon(document.querySelector("#sso-btn .icon"), "login");
  document.querySelector(".login__info-icon").innerHTML = '<span class="icon">' + svg(ICONS.shield) + "</span>";
  document.querySelector(".login__support-icon").innerHTML = '<span class="icon">' + svg(ICONS.send) + "</span>";

  // Theme toggle
  var themeBtn = document.getElementById("theme-toggle");
  function theme() { return document.documentElement.getAttribute("data-theme") || "light"; }
  function paintTheme() { themeBtn.innerHTML = '<span class="icon">' + svg(theme() === "dark" ? ICONS.sun : ICONS.moon) + "</span>"; }
  themeBtn.addEventListener("click", function () {
    var next = theme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("pb.theme", next); } catch (e) {}
    paintTheme();
  });
  paintTheme();

  function enter() { window.location.href = "index.html"; }

  // SSO
  document.getElementById("sso-btn").addEventListener("click", enter);

  // Toggle password form (silliq kirish animatsiyasi bilan)
  var actions = document.getElementById("actions");
  var form = document.getElementById("pwd-form");
  function reveal(el) {
    el.classList.remove("hidden");
    el.classList.remove("anim-in");
    void el.offsetWidth; // animatsiyani qayta ishga tushirish
    el.classList.add("anim-in");
  }
  document.getElementById("pwd-toggle").addEventListener("click", function () {
    actions.classList.add("hidden"); reveal(form);
    var l = document.getElementById("login"); if (l) l.focus();
  });
  document.getElementById("pwd-back").addEventListener("click", function () {
    form.classList.add("hidden"); reveal(actions);
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); enter(); });
})();
