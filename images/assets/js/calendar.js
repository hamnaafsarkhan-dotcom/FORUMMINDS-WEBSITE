/* ==========================================================================
   ForumMinds — calendar.js
   The training calendar: a month grid, a list view and filters.
   Reads everything from data/programmes.js.

   Programmes without dates are skipped here by design — an undated programme
   cannot be placed on a calendar. They still appear on programmes.html and on
   their category page.
   ========================================================================== */

(function () {
  "use strict";

  var grid = document.getElementById("cal-grid");
  var list = document.getElementById("cal-list");
  var label = document.getElementById("cal-label");
  var prevBtn = document.getElementById("cal-prev");
  var nextBtn = document.getElementById("cal-next");
  var counter = document.getElementById("cal-count");
  var toggle = document.getElementById("cal-view");

  if (!grid || !list) { return; }

  var DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  var state = { year: 0, month: 0, category: "all", format: "all", view: "month" };

  /* Below this width the 7-column grid stops being readable, so the page
     forces list view. Matches the CSS breakpoint that hides .cal-grid. */
  var narrow = window.matchMedia("(max-width: 900px)");

  /* ------------------------------------------------------------------------
     Data
     ------------------------------------------------------------------------ */

  /* Only dated programmes can appear on a calendar. */
  function dated() {
    return FM.programmes.filter(function (p) {
      if (!p.startDate) { return false; }
      if (state.category !== "all" && p.category.indexOf(state.category) === -1) { return false; }
      if (state.format !== "all" && p.format !== state.format) { return false; }
      return true;
    });
  }

  /* Programmes running on a given local date. */
  function onDay(d) {
    var iso = toIso(d);
    return dated().filter(function (p) {
      return p.startDate <= iso && iso <= (p.endDate || p.startDate);
    });
  }

  function toIso(d) {
    var m = String(d.getMonth() + 1);
    var day = String(d.getDate());
    return d.getFullYear() + "-" + (m.length < 2 ? "0" + m : m) +
           "-" + (day.length < 2 ? "0" + day : day);
  }

  /* The first and last month containing a programme. Navigation is clamped to
     this range so nobody pages endlessly through empty months. */
  function bounds() {
    var all = FM.programmes.filter(function (p) { return p.startDate; });
    var sorted = FM.sorted(all);
    if (!sorted.length) {
      var now = new Date();
      return { min: now, max: now };
    }
    var first = FM.parse(sorted[0].startDate);
    var lastP = sorted[sorted.length - 1];
    var last = FM.parse(lastP.endDate || lastP.startDate);
    return {
      min: new Date(first.getFullYear(), first.getMonth(), 1),
      max: new Date(last.getFullYear(), last.getMonth(), 1)
    };
  }

  /* ------------------------------------------------------------------------
     Month grid
     ------------------------------------------------------------------------ */
  function drawGrid() {
    var first = new Date(state.year, state.month, 1);
    var daysInMonth = new Date(state.year, state.month + 1, 0).getDate();

    /* JS getDay() is Sunday-first; shift so Monday is column 1. */
    var lead = (first.getDay() + 6) % 7;

    var today = toIso(new Date());
    var cells = "";

    /* Trailing days of the previous month, greyed */
    var prevDays = new Date(state.year, state.month, 0).getDate();
    for (var i = lead; i > 0; i--) {
      cells += '<div class="cal-cell cal-cell--pad" aria-hidden="true">' +
               '<span class="cal-cell__n">' + (prevDays - i + 1) + "</span></div>";
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var date = new Date(state.year, state.month, d);
      var iso = toIso(date);
      var evs = onDay(date);

      var cls = "cal-cell";
      if (evs.length) { cls += " cal-cell--has"; }
      if (iso === today) { cls += " cal-cell--today"; }

      var body = evs.map(function (p) {
        /* Only name the venue on the first day, or the cell gets noisy */
        var isFirst = p.startDate === iso;
        return '<a class="cal-ev" href="' + FM.esc(FM.href(p)) + '" ' +
               'title="' + FM.esc(p.title) + ' — ' + FM.esc(FM.dateRange(p)) + '">' +
               FM.esc(shorten(p.title)) +
               (isFirst ? "<span>" + FM.esc(p.venue) + "</span>" : "") +
               "</a>";
      }).join("");

      cells += '<div class="' + cls + '">' +
               '<span class="cal-cell__n">' + d + "</span>" + body + "</div>";
    }

    /* Leading days of the next month, to square off the grid */
    var used = lead + daysInMonth;
    var trail = (7 - (used % 7)) % 7;
    for (var t = 1; t <= trail; t++) {
      cells += '<div class="cal-cell cal-cell--pad" aria-hidden="true">' +
               '<span class="cal-cell__n">' + t + "</span></div>";
    }

    grid.innerHTML =
      DOW.map(function (d) {
        return '<div class="cal-grid__dow">' + d + "</div>";
      }).join("") + cells;
  }

  /* Long programme titles do not fit a calendar cell. */
  function shorten(title) {
    return title.length > 42 ? title.slice(0, 40).replace(/[\s,:]+$/, "") + "…" : title;
  }

  /* ------------------------------------------------------------------------
     List view — the docket, grouped by month
     ------------------------------------------------------------------------ */
  function drawList() {
    var items = FM.sorted(dated());

    if (!items.length) {
      list.innerHTML =
        '<div class="empty-state"><h3>No sessions match those filters</h3>' +
        '<p>Clear a filter, or <a href="contact.html">ask us to schedule this for your team</a>.</p></div>';
      return;
    }

    /* Group into months first, then build. Grouping while building the string
       needs fiddly open/close tracking and is easy to get wrong. */
    var groups = [];
    var index = {};

    items.forEach(function (p) {
      var s = FM.parse(p.startDate);
      var key = FM.MONTHS[s.getMonth()] + " " + s.getFullYear();
      if (index[key] === undefined) {
        index[key] = groups.length;
        groups.push({ key: key, items: [] });
      }
      groups[index[key]].items.push(p);
    });

    list.innerHTML = groups.map(function (g) {
      return '<section class="cal-group">' +
        '<h3 class="cal-group__head">' + FM.esc(g.key) + "</h3>" +
        '<div class="docket">' +
          g.items.map(function (p) {
            return '<div class="cal-item">' + FMDocket.row(p) + "</div>";
          }).join("") +
        "</div></section>";
    }).join("");
  }

  /* ------------------------------------------------------------------------
     Filters and view
     ------------------------------------------------------------------------ */
  function drawFilters() {
    var cat = document.getElementById("filter-category");
    var fmt = document.getElementById("filter-format");

    function chip(v, l, g) {
      return '<button type="button" class="chip" data-group="' + g + '" data-value="' +
             FM.esc(v) + '" aria-pressed="false">' + FM.esc(l) + "</button>";
    }

    if (cat) {
      cat.innerHTML = '<span class="filters__label">Discipline</span>' +
        chip("all", "All", "category") +
        FM.categories.map(function (c) { return chip(c.id, c.short, "category"); }).join("");
    }
    if (fmt) {
      fmt.innerHTML = '<span class="filters__label">Format</span>' +
        chip("all", "All", "format") +
        FM.formats.map(function (f) { return chip(f.id, f.name, "format"); }).join("");
    }

    Array.prototype.forEach.call(document.querySelectorAll(".chip[data-group]"), function (b) {
      b.addEventListener("click", function () {
        state[b.dataset.group] = b.dataset.value;
        render();
      });
    });
  }

  function setView(v) {
    state.view = v;
    if (toggle) {
      Array.prototype.forEach.call(toggle.querySelectorAll("button"), function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.view === v));
      });
    }
    render();
  }

  if (toggle) {
    toggle.addEventListener("click", function (e) {
      var b = e.target.closest("[data-view]");
      if (b) { setView(b.dataset.view); }
    });
  }

  /* ------------------------------------------------------------------------
     Navigation
     ------------------------------------------------------------------------ */
  function shift(delta) {
    var d = new Date(state.year, state.month + delta, 1);
    state.year = d.getFullYear();
    state.month = d.getMonth();
    render();
  }

  if (prevBtn) { prevBtn.addEventListener("click", function () { shift(-1); }); }
  if (nextBtn) { nextBtn.addEventListener("click", function () { shift(1); }); }

  /* ------------------------------------------------------------------------
     Render
     ------------------------------------------------------------------------ */
  function render() {
    /* Force list view on narrow screens — the grid is hidden by CSS there. */
    var view = narrow.matches ? "list" : state.view;

    grid.hidden = view !== "month";
    list.hidden = view !== "list";

    if (view === "month") { drawGrid(); } else { drawList(); }

    if (label) {
      label.textContent = FM.MONTHS[state.month] + " " + state.year;
    }

    /* Month navigation is only meaningful in month view */
    var navRow = document.getElementById("cal-nav");
    if (navRow) { navRow.hidden = view !== "month"; }

    var b = bounds();
    if (prevBtn) {
      prevBtn.disabled = state.year < b.min.getFullYear() ||
        (state.year === b.min.getFullYear() && state.month <= b.min.getMonth());
    }
    if (nextBtn) {
      nextBtn.disabled = state.year > b.max.getFullYear() ||
        (state.year === b.max.getFullYear() && state.month >= b.max.getMonth());
    }

    if (counter) {
      var n = dated().length;
      var undated = FM.programmes.length - FM.programmes.filter(function (p) {
        return p.startDate;
      }).length;
      counter.textContent = n + " scheduled session" + (n === 1 ? "" : "s") +
        (undated ? " · " + undated + " available on request" : "");
    }

    Array.prototype.forEach.call(document.querySelectorAll(".chip[data-group]"), function (btn) {
      btn.setAttribute("aria-pressed", String(state[btn.dataset.group] === btn.dataset.value));
    });
  }

  /* Re-render when crossing the grid/list breakpoint */
  if (narrow.addEventListener) {
    narrow.addEventListener("change", render);
  } else if (narrow.addListener) {
    narrow.addListener(render);   /* Safari < 14 */
  }

  /* ------------------------------------------------------------------------
     Start on the month of the next upcoming session, not on today's month —
     if the next training is three months out, that is what people want to see.
     ------------------------------------------------------------------------ */
  var next = FM.upcoming(1)[0];
  var startAt = next ? FM.parse(next.startDate) : new Date();
  state.year = startAt.getFullYear();
  state.month = startAt.getMonth();

  drawFilters();
  setView("month");
})();
