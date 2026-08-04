/* ==========================================================================
   ForumMinds — training-schedule.js
   Drives training-schedule.html: the segmented Calendar / Schedule control,
   the custom month calendar, the featured programme panel, the executive
   schedule list, the filter row and the summary counters.

   ONE DATA SOURCE, TWO RENDERINGS
   Everything below reads data/programmes.js. filtered() is computed once per
   change and both panes render from that same array, which is why switching
   tabs is instant and can never show two different answers. Nothing here
   fetches, and nothing reloads the page.

   The calendar can only plot programmes that have dates. Undated ones (the
   in-house programme) are not dropped — they render under the calendar as
   "available on request" chips, and appear in the Schedule list at the end.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.getElementById("ts");
  if (!root || typeof FM === "undefined") { return; }

  var grid       = document.getElementById("ts-grid");
  var monthLabel = document.getElementById("ts-month-label");
  var prevBtn    = document.getElementById("ts-prev");
  var nextBtn    = document.getElementById("ts-next");
  var feature    = document.getElementById("ts-feature");
  var featInner  = document.getElementById("ts-feature-inner");
  var list       = document.getElementById("ts-list");
  var switcher   = document.getElementById("ts-switch");
  var countEl    = document.getElementById("ts-count");
  var clearBtn   = document.getElementById("ts-clear");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  var state = {
    view: "calendar",
    year: 0,
    month: 0,
    date: null,     /* selected ISO date */
    index: 0,       /* which programme on that date, when more than one */
    q: "",
    discipline: "",
    format: "",
    country: "",
    monthKey: ""    /* "2026-09" */
  };

  /* ------------------------------------------------------------------------
     DATA
     ------------------------------------------------------------------------ */

  function matches(p) {
    if (state.discipline && p.category.indexOf(state.discipline) === -1) { return false; }
    if (state.format && p.format !== state.format) { return false; }
    if (state.country && p.country !== state.country) { return false; }
    if (state.monthKey) {
      if (!p.startDate) { return false; }
      if (!FM.days(p).some(function (d) { return d.slice(0, 7) === state.monthKey; })) { return false; }
    }
    if (state.q) {
      var hay = (p.title + " " + p.summary + " " + (p.venue || "") + " " +
                 FM.categoryNames(p).join(" ")).toLowerCase();
      if (hay.indexOf(state.q) === -1) { return false; }
    }
    return true;
  }

  function filtered()  { return FM.sorted(FM.programmes.filter(matches)); }
  function scheduled() { return filtered().filter(function (p) { return p.startDate; }); }
  function onRequest() { return filtered().filter(function (p) { return !p.startDate; }); }

  /* Programmes running on an ISO date, out of the current filtered set. */
  function onDate(iso) {
    return scheduled().filter(function (p) {
      return p.startDate <= iso && iso <= (p.endDate || p.startDate);
    });
  }

  /* The window the month arrows may travel, taken from all programmes rather
     than the filtered set so navigation does not jump about as filters change. */
  var bounds = (function () {
    var dated = FM.programmes.filter(function (p) { return p.startDate; });
    if (!dated.length) { return null; }
    var starts = dated.map(function (p) { return p.startDate; }).sort();
    var ends = dated.map(function (p) { return p.endDate || p.startDate; }).sort();
    return { first: FM.parse(starts[0]), last: FM.parse(ends[ends.length - 1]) };
  })();

  function monthValue(y, m) { return y * 12 + m; }

  function inBounds(y, m) {
    if (!bounds) { return true; }
    var v = monthValue(y, m);
    return v >= monthValue(bounds.first.getFullYear(), bounds.first.getMonth()) &&
           v <= monthValue(bounds.last.getFullYear(), bounds.last.getMonth());
  }

  /* ------------------------------------------------------------------------
     FILTER CONTROLS
     ------------------------------------------------------------------------ */

  function option(value, label) {
    var o = document.createElement("option");
    o.value = value;
    o.textContent = label;
    return o;
  }

  function buildFilters() {
    var disc = document.getElementById("ts-discipline");
    FM.categories.forEach(function (c) { disc.appendChild(option(c.id, c.name)); });

    var fmt = document.getElementById("ts-format");
    FM.formats.forEach(function (f) { fmt.appendChild(option(f.id, f.name)); });

    var ctry = document.getElementById("ts-country");
    FM.countries().forEach(function (c) { ctry.appendChild(option(c, c)); });

    /* Only months that actually contain a session — an empty month in a
       filter dropdown is a dead end. */
    var months = [];
    FM.programmes.forEach(function (p) {
      FM.days(p).forEach(function (d) {
        var key = d.slice(0, 7);
        if (months.indexOf(key) === -1) { months.push(key); }
      });
    });
    months.sort();
    var monthSel = document.getElementById("ts-month");
    months.forEach(function (key) {
      var parts = key.split("-");
      monthSel.appendChild(option(key, FM.MONTHS[+parts[1] - 1] + " " + parts[0]));
    });

    document.getElementById("ts-q").addEventListener("input", function (e) {
      state.q = e.target.value.trim().toLowerCase();
      onFilterChange();
    });
    disc.addEventListener("change", function (e) { state.discipline = e.target.value; onFilterChange(); });
    fmt.addEventListener("change", function (e) { state.format = e.target.value; onFilterChange(); });
    ctry.addEventListener("change", function (e) { state.country = e.target.value; onFilterChange(); });
    monthSel.addEventListener("change", function (e) {
      state.monthKey = e.target.value;
      if (state.monthKey) {
        var b = state.monthKey.split("-");
        state.year = +b[0];
        state.month = +b[1] - 1;
      }
      onFilterChange();
    });

    clearBtn.addEventListener("click", function () {
      state.q = state.discipline = state.format = state.country = state.monthKey = "";
      document.getElementById("ts-q").value = "";
      disc.value = fmt.value = ctry.value = monthSel.value = "";
      onFilterChange();
    });
  }

  function anyFilter() {
    return !!(state.q || state.discipline || state.format || state.country || state.monthKey);
  }

  function onFilterChange() {
    clearBtn.hidden = !anyFilter();

    var n = filtered().length;
    countEl.textContent = n === FM.programmes.length
      ? ""
      : n + (n === 1 ? " programme" : " programmes") + " match";

    /* Keep the selection valid: if the selected date lost its programme,
       move to the first session still in the set. */
    if (!state.date || !onDate(state.date).length) {
      selectFirstAvailable(false);
    } else {
      state.index = 0;
    }

    renderMonth(0);
    renderFeature();
    renderList();
  }

  function selectFirstAvailable(jumpMonth) {
    var next = scheduled()[0];
    state.index = 0;
    if (!next) { state.date = null; return; }
    state.date = next.startDate;
    if (jumpMonth !== false) {
      var d = FM.parse(next.startDate);
      state.year = d.getFullYear();
      state.month = d.getMonth();
    }
  }

  /* ------------------------------------------------------------------------
     CALENDAR
     ------------------------------------------------------------------------ */

  var todayIso = FM.iso(new Date());

  /* Monday-first offset for a month's 1st. */
  function leadingBlanks(y, m) {
    var dow = new Date(y, m, 1).getDay();   /* 0 = Sunday */
    return (dow + 6) % 7;
  }

  /* direction: -1 back, 1 forward, 0 no slide. */
  function renderMonth(direction) {
    var y = state.year, m = state.month;
    monthLabel.textContent = FM.MONTHS[m] + " " + y;

    prevBtn.disabled = !inBounds(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1);
    nextBtn.disabled = !inBounds(m === 11 ? y + 1 : y, m === 11 ? 0 : m + 1);

    var frag = document.createDocumentFragment();
    var blanks = leadingBlanks(y, m);
    var total = new Date(y, m + 1, 0).getDate();
    var i, cell;

    for (i = 0; i < blanks; i++) {
      cell = document.createElement("span");
      cell.className = "ts-day ts-day--blank";
      cell.setAttribute("aria-hidden", "true");
      frag.appendChild(cell);
    }

    for (i = 1; i <= total; i++) {
      var iso = FM.iso(new Date(y, m, i));
      var sessions = onDate(iso);

      cell = document.createElement("button");
      cell.type = "button";
      cell.className = "ts-day";
      cell.dataset.date = iso;
      cell.style.setProperty("--i", String(blanks + i));

      if (iso === todayIso) { cell.classList.add("is-today"); }
      if (sessions.length) { cell.classList.add("has-session"); }
      if (iso === state.date) {
        cell.classList.add("is-selected");
        cell.setAttribute("aria-current", "date");
      }

      var num = document.createElement("span");
      num.className = "ts-day__n";
      num.textContent = String(i);
      cell.appendChild(num);

      if (sessions.length) {
        var dots = document.createElement("span");
        dots.className = "ts-day__dots";
        dots.setAttribute("aria-hidden", "true");
        for (var d = 0; d < Math.min(sessions.length, 3); d++) {
          var dot = document.createElement("i");
          dot.style.setProperty("--d", String(d));
          dots.appendChild(dot);
        }
        cell.appendChild(dots);
        cell.setAttribute("aria-label",
          i + " " + FM.MONTHS[m] + " " + y + " — " + sessions.length +
          (sessions.length === 1 ? " session" : " sessions"));
      } else {
        cell.disabled = true;
        cell.setAttribute("aria-label", i + " " + FM.MONTHS[m] + " " + y + " — no sessions");
      }

      frag.appendChild(cell);
    }

    if (direction && !reduce.matches) {
      grid.classList.add(direction > 0 ? "is-leaving-left" : "is-leaving-right");
      window.setTimeout(function () {
        grid.classList.remove("is-leaving-left", "is-leaving-right");
        grid.innerHTML = "";
        grid.appendChild(frag);
        grid.classList.add(direction > 0 ? "is-entering-right" : "is-entering-left");
        /* Force a reflow so the entering class actually animates. */
        void grid.offsetWidth;
        grid.classList.remove("is-entering-right", "is-entering-left");
      }, 180);
    } else {
      grid.innerHTML = "";
      grid.appendChild(frag);
    }
  }

  function step(direction) {
    var y = state.year, m = state.month + direction;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    if (!inBounds(y, m)) { return; }
    state.year = y;
    state.month = m;

    /* Follow the month with the panel: select the first session in view, so
       the featured programme always belongs to the month on screen. */
    var firstHere = scheduled().filter(function (p) {
      return FM.days(p).some(function (d) {
        return d.slice(0, 7) === y + "-" + (m + 1 < 10 ? "0" : "") + (m + 1);
      });
    })[0];
    if (firstHere) {
      state.date = FM.days(firstHere).filter(function (d) {
        return d.slice(0, 7) === y + "-" + (m + 1 < 10 ? "0" : "") + (m + 1);
      })[0];
      state.index = 0;
    }

    renderMonth(direction);
    renderFeature();
  }

  grid.addEventListener("click", function (e) {
    var cell = e.target.closest(".ts-day");
    if (!cell || cell.disabled || !cell.dataset.date) { return; }
    var prev = grid.querySelector(".ts-day.is-selected");
    if (prev) { prev.classList.remove("is-selected"); prev.removeAttribute("aria-current"); }
    cell.classList.remove("is-selected");
    void cell.offsetWidth;              /* restart the pulse if the same day is re-clicked */
    cell.classList.add("is-selected");
    cell.setAttribute("aria-current", "date");
    state.date = cell.dataset.date;
    state.index = 0;
    renderFeature();
  });

  prevBtn.addEventListener("click", function () { step(-1); });
  nextBtn.addEventListener("click", function () { step(1); });

  /* Arrow keys move between days, the way a real date picker behaves. */
  grid.addEventListener("keydown", function (e) {
    var map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (!(e.key in map)) { return; }
    var cells = Array.prototype.slice.call(grid.querySelectorAll(".ts-day:not(.ts-day--blank)"));
    var at = cells.indexOf(document.activeElement);
    if (at === -1) { return; }
    e.preventDefault();
    var target = cells[at + map[e.key]];
    if (target) { target.focus(); }
  });

  /* ------------------------------------------------------------------------
     FEATURED PROGRAMME PANEL
     ------------------------------------------------------------------------ */

  /* Where the delegate physically is. venueLabel() returns null when the
     venue only repeats the delivery format ("Live Online / Live Online"), so
     both views say something true and non-repetitive instead. */
  function locationLabel(p) {
    return FM.venueLabel(p) || (p.country === "Online" ? "Anywhere" : p.country) || "—";
  }

  function featureRow(label, value) {
    if (!value) { return ""; }
    return '<div class="ts-feature__row">' +
             '<dt>' + FM.esc(label) + '</dt>' +
             '<dd>' + FM.esc(value) + '</dd>' +
           '</div>';
  }

  function featureHtml(p, siblings) {
    var fmt = FM.format(p.format);
    var pager = "";

    if (siblings > 1) {
      pager = '<div class="ts-feature__pager">' +
                '<button type="button" class="ts-feature__page" data-step="-1" aria-label="Previous programme on this date">' +
                  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>' +
                '</button>' +
                '<span>' + (state.index + 1) + ' of ' + siblings + ' on this date</span>' +
                '<button type="button" class="ts-feature__page" data-step="1" aria-label="Next programme on this date">' +
                  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>' +
                '</button>' +
              '</div>';
    }

    return '' +
      '<div class="ts-feature__media">' +
        (p.image
          ? '<img src="' + FM.esc(p.image) + '" alt="" decoding="async" loading="lazy" ' +
            'onerror="this.closest(\'.ts-feature__media\').classList.add(\'is-empty\');this.remove();">'
          : "") +
        '<span class="ts-feature__scrim" aria-hidden="true"></span>' +
        '<span class="ts-feature__date">' + FM.esc(FM.dateRangeLong(p)) + '</span>' +
      '</div>' +
      '<div class="ts-feature__body">' +
        '<p class="ts-feature__disc">' + FM.esc(FM.categoryNames(p).join(" · ")) + '</p>' +
        '<h2 class="ts-feature__title"><a href="' + FM.esc(FM.href(p)) + '">' + FM.esc(p.title) + '</a></h2>' +
        '<p class="ts-feature__summary">' + FM.esc(p.summary) + '</p>' +
        '<dl class="ts-feature__meta">' +
          featureRow("Duration", FM.durationLabel(p)) +
          featureRow("Delivery", fmt ? fmt.name : "") +
          featureRow("Location", locationLabel(p)) +
          featureRow("Level", p.level) +
        '</dl>' +
        '<div class="ts-feature__actions">' +
          '<a class="btn btn--primary ts-feature__cta" href="register.html?programme=' +
            encodeURIComponent(p.slug) + '">Register <span class="arw" aria-hidden="true">&rarr;</span></a>' +
          (p.url ? '<a class="link-arw ts-feature__more" href="' + FM.esc(p.url) +
                   '">Programme detail <span class="arw" aria-hidden="true">&rarr;</span></a>' : "") +
        '</div>' +
        pager +
      '</div>';
  }

  function emptyFeatureHtml() {
    return '<div class="ts-feature__empty">' +
             '<h2>No sessions match those filters</h2>' +
             '<p>Widen the filters above, or ask us to run any programme in the ' +
             'catalogue in-house on dates that suit you.</p>' +
             '<a class="btn btn--ghost" href="contact.html">Talk to us</a>' +
           '</div>';
  }

  var swapTimer = null;

  function renderFeature() {
    var sessions = state.date ? onDate(state.date) : [];
    if (state.index >= sessions.length) { state.index = 0; }
    var p = sessions[state.index];
    var html = p ? featureHtml(p, sessions.length) : emptyFeatureHtml();

    if (reduce.matches) {
      featInner.innerHTML = html;
      return;
    }

    window.clearTimeout(swapTimer);
    feature.classList.add("is-swapping");
    swapTimer = window.setTimeout(function () {
      featInner.innerHTML = html;
      feature.classList.remove("is-swapping");
    }, 180);
  }

  featInner.addEventListener("click", function (e) {
    var pageBtn = e.target.closest(".ts-feature__page");
    if (!pageBtn) { return; }
    var sessions = onDate(state.date);
    state.index = (state.index + Number(pageBtn.dataset.step) + sessions.length) % sessions.length;
    renderFeature();
  });

  /* ------------------------------------------------------------------------
     SCHEDULE LIST
     ------------------------------------------------------------------------ */

  function rowHtml(p) {
    var fmt = FM.format(p.format);
    var parts = FM.dateParts(p);

    /* dateParts spells the undated case out in words ("On request"), which is
       too long for a 4.6rem date block. Compress it for this row only. */
    if (!p.startDate) { parts = { day: "—", month: "DATES", year: "TBC" }; }

    return '' +
      '<article class="ts-row">' +
        '<div class="ts-row__date">' +
          '<span class="ts-row__day">' + FM.esc(parts.day) + '</span>' +
          '<span class="ts-row__mon">' + FM.esc(parts.month) + '</span>' +
          '<span class="ts-row__yr">' + FM.esc(parts.year) + '</span>' +
        '</div>' +
        '<div class="ts-row__main">' +
          '<p class="ts-row__disc">' + FM.esc(FM.categoryNames(p).join(" · ")) + '</p>' +
          '<h3 class="ts-row__title">' +
            '<a class="ts-row__link" href="' + FM.esc(FM.href(p)) + '">' + FM.esc(p.title) + '</a>' +
          '</h3>' +
        '</div>' +
        '<div class="ts-row__cell"><span>Location</span>' + FM.esc(locationLabel(p)) + '</div>' +
        '<div class="ts-row__cell"><span>Delivery</span>' + FM.esc(fmt ? fmt.name : "—") + '</div>' +
        '<div class="ts-row__cell"><span>Duration</span>' + FM.esc(FM.durationLabel(p)) + '</div>' +
        '<a class="ts-row__cta" href="register.html?programme=' + encodeURIComponent(p.slug) + '" ' +
           'aria-label="Register for ' + FM.esc(p.title) + '">' +
          '<span>Register</span>' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>' +
        '</a>' +
      '</article>';
  }

  function renderList() {
    var rows = filtered();
    if (!rows.length) {
      list.innerHTML = '<p class="ts-list__empty">No programmes match those filters. ' +
                       '<a href="contact.html">Ask us about in-house delivery</a>.</p>';
      return;
    }
    list.innerHTML = rows.map(rowHtml).join("");
    Array.prototype.forEach.call(list.children, function (row, i) {
      row.style.setProperty("--i", String(i));
    });
  }

  /* ------------------------------------------------------------------------
     ON-REQUEST CHIPS (undated programmes, shown under the calendar)
     ------------------------------------------------------------------------ */

  function renderRequestChips() {
    var host = document.querySelector(".ts-cal__key");
    var existing = document.getElementById("ts-onrequest");
    if (existing) { existing.remove(); }

    var items = onRequest();
    if (!items.length || !host) { return; }

    var wrap = document.createElement("p");
    wrap.className = "ts-cal__request";
    wrap.id = "ts-onrequest";
    wrap.innerHTML = '<span class="ts-cal__request-lead">Also available on request</span>' +
      items.map(function (p) {
        return '<a class="ts-chip" href="' + FM.esc(FM.href(p)) + '">' + FM.esc(p.title) + '</a>';
      }).join("");
    host.parentNode.insertBefore(wrap, host.nextSibling);
  }

  /* ------------------------------------------------------------------------
     SEGMENTED CONTROL
     ------------------------------------------------------------------------ */

  function moveThumb() {
    var thumb = switcher.querySelector(".ts-switch__thumb");
    var active = switcher.querySelector(".ts-switch__btn.is-active");
    if (!thumb || !active) { return; }
    thumb.style.width = active.offsetWidth + "px";
    thumb.style.transform = "translateX(" + (active.offsetLeft - active.parentNode.clientLeft) + "px)";
  }

  function setView(view) {
    if (view === state.view) { return; }
    state.view = view;

    Array.prototype.forEach.call(switcher.querySelectorAll(".ts-switch__btn"), function (b) {
      var on = b.dataset.view === view;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    moveThumb();

    var showing = document.getElementById("ts-pane-" + view);
    var hiding = document.getElementById("ts-pane-" + (view === "calendar" ? "schedule" : "calendar"));

    hiding.classList.remove("is-active");
    if (reduce.matches) {
      hiding.hidden = true;
      showing.hidden = false;
      showing.classList.add("is-active");
      return;
    }
    window.setTimeout(function () {
      hiding.hidden = true;
      showing.hidden = false;
      void showing.offsetWidth;
      showing.classList.add("is-active");
      if (view === "calendar") { moveThumb(); }
    }, 200);
  }

  switcher.addEventListener("click", function (e) {
    var btn = e.target.closest(".ts-switch__btn");
    if (btn) { setView(btn.dataset.view); }
  });

  switcher.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") { return; }
    e.preventDefault();
    setView(state.view === "calendar" ? "schedule" : "calendar");
    switcher.querySelector(".ts-switch__btn.is-active").focus();
  });

  window.addEventListener("resize", moveThumb);

  /* ------------------------------------------------------------------------
     SUMMARY COUNTERS
     ------------------------------------------------------------------------ */

  function buildStats() {
    var upcoming = FM.upcoming().length;
    var countries = FM.countries().filter(function (c) {
      return c !== "Online" && c !== "Your premises";
    }).length;
    var formats = FM.formats.filter(function (f) {
      return FM.programmes.some(function (p) { return p.format === f.id; });
    }).length;

    setTarget("ts-stat-programmes", upcoming);
    setTarget("ts-stat-countries", countries);
    setTarget("ts-stat-formats", formats);
  }

  function setTarget(id, value) {
    var el = document.getElementById(id);
    if (!el) { return; }
    el.dataset.countTo = String(value);
    el.textContent = reduce.matches ? String(value) : "0";
  }

  var countersRan = false;

  function runCounters() {
    if (countersRan) { return; }
    countersRan = true;

    var nums = document.querySelectorAll("#ts-stats [data-count-to]");
    Array.prototype.forEach.call(nums, function (el) {
      var target = Number(el.dataset.countTo) || 0;
      if (reduce.matches || target === 0) { el.textContent = String(target); return; }
      var start = null, dur = 900;
      function frame(t) {
        if (start === null) { start = t; }
        var k = Math.min((t - start) / dur, 1);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) { window.requestAnimationFrame(frame); }
      }
      window.requestAnimationFrame(frame);
      /* A count that never finishes reads as broken data. If rAF is throttled
         — background tab, heavy page — land on the real number anyway. */
      window.setTimeout(function () { el.textContent = String(target); }, dur + 200);
    });
  }

  function watchStats() {
    var bar = document.getElementById("ts-stats");
    if (!bar) { return; }
    if (!("IntersectionObserver" in window)) { runCounters(); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounters(); io.disconnect(); }
      });
    }, { threshold: 0.4 });
    io.observe(bar);

    /* The bar sits just under the h1, so on a normal load it is already on
       screen. Belt and braces for the case where the observer never fires. */
    window.setTimeout(function () {
      if (bar.getBoundingClientRect().top < window.innerHeight) { runCounters(); }
    }, 700);
  }

  /* ------------------------------------------------------------------------
     BOOT
     ------------------------------------------------------------------------ */

  buildFilters();
  buildStats();
  selectFirstAvailable(true);

  /* No dated programmes at all — fall back to today's month rather than
     leaving the calendar on 1970. */
  if (!state.year) {
    var now = new Date();
    state.year = now.getFullYear();
    state.month = now.getMonth();
  }

  renderMonth(0);
  renderFeature();
  renderList();
  renderRequestChips();
  onFilterChange();
  moveThumb();
  watchStats();

  /* Entrance animation. Added after first paint so the staggered dates and
     the sliding panel start from a settled layout.

     The timeout is not belt-and-braces: requestAnimationFrame does not fire
     in a background tab, and everything inside .ts starts at opacity 0. Open
     the page in a new tab without this and the calendar stays invisible until
     the tab is focused. */
  function reveal() { root.classList.add("is-ready"); }
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(reveal);
  });
  window.setTimeout(reveal, 120);

})();
