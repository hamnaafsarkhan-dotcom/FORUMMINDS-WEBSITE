/* ==========================================================================
   ForumMinds — programmes-render.js
   The filtering engine behind programmes.html and all 10 category pages.

   It reads data/programmes.js, draws the filter chips, renders the docket,
   and keeps the current filters in the URL so a filtered view can be shared
   or bookmarked.

   Usage — on programmes.html (all filters available):
       FMFilters.init({ mount: "#results", counter: "#result-count" });

   Usage — on a category page (locked to one category):
       FMFilters.init({ mount: "#results", counter: "#result-count",
                        lockCategory: "leadership" });
   ========================================================================== */

var FMFilters = (function () {
  "use strict";

  var state = { category: "all", format: "all", lock: null };
  var els = {};

  /* ------------------------------------------------------------------------
     Filtering
     ------------------------------------------------------------------------ */
  function results() {
    var list = FM.programmes.filter(function (p) {
      if (state.lock && p.category.indexOf(state.lock) === -1) { return false; }
      if (state.category !== "all" && p.category.indexOf(state.category) === -1) { return false; }
      if (state.format !== "all" && p.format !== state.format) { return false; }
      return true;
    });
    return FM.sorted(list);
  }

  /* ------------------------------------------------------------------------
     Chip groups
     ------------------------------------------------------------------------ */
  function chip(value, label, group) {
    return '<button type="button" class="chip" data-group="' + group + '" ' +
           'data-value="' + FM.esc(value) + '" aria-pressed="false">' +
           FM.esc(label) + "</button>";
  }

  function drawChips() {
    /* Category chips are omitted on category pages — the page IS the filter */
    if (els.categoryBar && !state.lock) {
      els.categoryBar.innerHTML =
        '<span class="filters__label">Discipline</span>' +
        chip("all", "All", "category") +
        FM.categories.map(function (c) {
          return chip(c.id, c.short, "category");
        }).join("");
    }

    if (els.formatBar) {
      els.formatBar.innerHTML =
        '<span class="filters__label">Format</span>' +
        chip("all", "All", "format") +
        FM.formats.map(function (f) {
          return chip(f.id, f.name, "format");
        }).join("");
    }

    /* One delegated listener for every chip on the page */
    Array.prototype.forEach.call(
      document.querySelectorAll(".chip[data-group]"),
      function (btn) {
        btn.addEventListener("click", function () {
          state[btn.dataset.group] = btn.dataset.value;
          apply(true);
        });
      }
    );
  }

  function syncChips() {
    Array.prototype.forEach.call(
      document.querySelectorAll(".chip[data-group]"),
      function (btn) {
        var on = state[btn.dataset.group] === btn.dataset.value;
        btn.setAttribute("aria-pressed", String(on));
      }
    );
  }

  /* ------------------------------------------------------------------------
     URL sync — so a filtered view can be linked to
     ------------------------------------------------------------------------ */
  function readUrl() {
    var q = new URLSearchParams(window.location.search);
    if (q.get("category") && FM.category(q.get("category"))) {
      state.category = q.get("category");
    }
    if (q.get("format") && FM.format(q.get("format"))) {
      state.format = q.get("format");
    }
  }

  function writeUrl() {
    var q = new URLSearchParams();
    if (state.category !== "all") { q.set("category", state.category); }
    if (state.format !== "all") { q.set("format", state.format); }
    var qs = q.toString();

    /* Browsers throw a SecurityError on history.replaceState for file://
       URLs. The filters must keep working when the site is opened by
       double-clicking a file, so a failure here is ignored deliberately —
       only the shareable-URL convenience is lost. */
    try {
      history.replaceState(null, "", qs ? "?" + qs : window.location.pathname);
    } catch (e) { /* file:// — no URL sync available */ }
  }

  /* ------------------------------------------------------------------------
     Render
     ------------------------------------------------------------------------ */
  function apply(updateUrl) {
    var list = results();

    FMDocket.render(els.mount, list);
    syncChips();

    if (els.counter) {
      els.counter.textContent =
        list.length + " programme" + (list.length === 1 ? "" : "s");
    }

    if (updateUrl) { writeUrl(); }
  }

  return {
    init: function (opts) {
      els.mount = document.querySelector(opts.mount);
      els.counter = opts.counter ? document.querySelector(opts.counter) : null;
      els.categoryBar = document.querySelector("#filter-category");
      els.formatBar = document.querySelector("#filter-format");

      state.lock = opts.lockCategory || null;

      readUrl();
      drawChips();
      apply(false);
    },

    /* Exposed so a page can render a plain, unfiltered docket */
    renderList: function (mount, list) {
      FMDocket.render(document.querySelector(mount), list);
    }
  };
})();
