/* ==========================================================================
   ForumMinds — upcoming.js
   The upcoming trainings showcase: a metrics bar, a featured card for the
   next session, and a timeline of the rest. Hovering a timeline card swaps
   it into the featured card.

   Renders the same six sessions the docket list did (FM.upcoming(6)) — the
   first as the feature, the remaining five on the timeline.

   FMDocket is deliberately untouched: the calendar, programmes and category
   pages all still render through it.

   Loads on index.html, after site.js.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.getElementById("upcoming");
  if (!root || typeof FM === "undefined") return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var upcoming = FM.upcoming();       /* every future dated session */
  var shown = FM.upcoming(6);         /* the six the docket used to list */
  if (!shown.length) return;

  var ICONS = {
    cal:   '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m8.5 15 2.2 2.2 4.3-4.3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 4 5.7 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.7-4-9s1.4-6.4 4-9z"/>',
    grid:  '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
    arrow: '<path d="M3.5 9h11m0 0-4-4m4 4-4 4"/>'
  };

  function svg(paths, box) {
    return '<svg viewBox="0 0 ' + (box || 24) + " " + (box || 24) + '" fill="none" ' +
      'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + paths + "</svg>";
  }
  function arrowSvg(cls) {
    return '<svg class="' + cls + '" viewBox="0 0 18 18" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' + ICONS.arrow + "</svg>";
  }

  /* ------------------------------------------------------------------------
     METRICS

     Counted from data/programmes.js at render time, not written down. That
     rules out two of the three figures the brief asked for:

       "18 Upcoming Trainings" — the schedule holds 8 dated sessions.
       "7 Countries"           — the venues cover 3: the UAE, Qatar and
                                 Saudi Arabia. Live Online and "At your
                                 premises" are not countries.

     Publishing either as written would put a number on a live page that the
     data contradicts. The third, "320+ Seats Available", has no source at
     all — there is no capacity field anywhere in the data — so a count of
     disciplines stands in its place. All three update themselves as the
     schedule changes.
     ------------------------------------------------------------------------ */
  function countries(list) {
    var seen = {};
    list.forEach(function (p) {
      var v = FM.venueLabel(p);
      if (!v) return;                       /* Live Online has no country */
      var parts = v.split(",");
      if (parts.length < 2) return;         /* "At your premises" likewise */
      var c = parts[parts.length - 1].trim();
      if (c) seen[c] = 1;
    });
    return Object.keys(seen).length;
  }

  function disciplines(list) {
    var seen = {};
    list.forEach(function (p) {
      (p.category || []).forEach(function (c) { seen[c] = 1; });
    });
    return Object.keys(seen).length;
  }

  var METRICS = [
    { n: upcoming.length,      label: "Upcoming trainings", icon: ICONS.cal },
    { n: countries(upcoming),  label: "Countries",          icon: ICONS.globe },
    { n: disciplines(upcoming), label: "Disciplines",       icon: ICONS.grid }
  ];

  var metricsEl = root.querySelector("[data-up-metrics]");
  if (metricsEl) {
    metricsEl.innerHTML = METRICS.map(function (m) {
      return '<li class="up__metric">' + svg(m.icon) +
        '<span class="up__metric-n" data-n="' + m.n + '">' + m.n + "</span>" +
        '<span class="up__metric-l">' + FM.esc(m.label) + "</span>" +
      "</li>";
    }).join("");
  }

  /* ------------------------------------------------------------------------
     Featured card
     ------------------------------------------------------------------------ */
  function daysUntil(p) {
    if (!p.startDate) return null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var start = FM.parse(p.startDate);
    return Math.max(0, Math.round((start - today) / 86400000));
  }

  /* SEATS
     There is no capacity data in this project — no seats, no places, no
     enrolment count on any programme. "18 / 25 Seats Filled" sitting under a
     Register button is a scarcity claim, and a hardcoded one would show the
     same fiction on every session and never move.

     So the bar is built but renders nothing until the data exists. Add
     `seats` (taken) and `capacity` (total) to a programme in
     data/programmes.js and it appears for that programme automatically. */
  function seatsHtml(p) {
    if (typeof p.seats !== "number" || typeof p.capacity !== "number") return "";
    if (p.capacity <= 0) return "";
    var fill = Math.min(1, p.seats / p.capacity);
    return '<div class="up__seats">' +
      '<span class="up__seats-l">' + p.seats + " / " + p.capacity + " seats filled</span>" +
      '<div class="up__bar"><span style="--fill:' + fill.toFixed(3) + '"></span></div>' +
    "</div>";
  }

  function featureHtml(p, isNext) {
    var cats = FM.categoryNames(p);
    var fmt = FM.format(p.format);
    var venue = FM.venueLabel(p);
    var days = daysUntil(p);

    var meta = [];
    if (cats.length) meta.push('<span class="up__badge">' + FM.esc(cats[0]) + "</span>");
    meta.push("<span>" + FM.esc(p.days) + " day" + (p.days === 1 ? "" : "s") + "</span>");
    if (fmt) meta.push('<span class="up__sep">·</span><span>' + FM.esc(fmt.name) + "</span>");
    if (venue) meta.push('<span class="up__sep">·</span><span>' + FM.esc(venue) + "</span>");

    /* "Starts in N days", not "Registration closes in N days" — the data
       records when a programme begins, not when its registration shuts. */
    var countdown = days === null ? "" :
      '<div class="up__count">' +
        '<span class="up__count-n">' + days + "</span>" +
        '<span class="up__count-l">day' + (days === 1 ? "" : "s") + " to start</span>" +
      "</div>";

    return '<div class="up__f-body" data-up-fbody>' +
      '<span class="up__f-label">' + (isNext ? "Next training" : "Upcoming training") + "</span>" +
      '<p class="up__f-date">' + FM.esc(FM.dateRange(p)) + "</p>" +
      '<h3 class="up__f-title">' + FM.esc(p.title) + "</h3>" +
      '<p class="up__f-meta">' + meta.join("") + "</p>" +
      '<div class="up__status">' + countdown + "</div>" +
      seatsHtml(p) +
      '<p class="up__f-sum">' + FM.esc(p.summary) + "</p>" +
      '<a class="up__f-cta" href="' + FM.esc(FM.href(p)) + '">Register now' +
        arrowSvg("") +
      "</a>" +
    "</div>" +
    '<div class="up__f-media">' +
      '<div class="up__f-img" role="img" aria-label="A trainer presenting to a room of professionals"></div>' +
      '<span class="up__f-veil" aria-hidden="true"></span>' +
    "</div>";
  }

  var featureEl = root.querySelector("[data-up-feature]");

  function setFeature(p, isNext) {
    if (!featureEl) return;
    featureEl.innerHTML = featureHtml(p, isNext);
  }

  setFeature(shown[0], true);

  /* ------------------------------------------------------------------------
     Timeline
     ------------------------------------------------------------------------ */
  var lineEl = root.querySelector("[data-up-timeline]");
  var rest = shown.slice(1);

  if (lineEl) {
    lineEl.innerHTML =
      '<span class="up__spine" data-up-spine aria-hidden="true">' +
        '<span class="up__pulse"></span>' +
      "</span>" +
      rest.map(function (x, i) {
        var d = FM.dateParts(x);
        var cats = FM.categoryNames(x);
        var fmt = FM.format(x.format);
        var venue = FM.venueLabel(x);

        var meta = [];
        if (cats.length) meta.push('<span class="up__badge">' + FM.esc(cats[0]) + "</span>");
        meta.push("<span>" + FM.esc(x.days) + " day" + (x.days === 1 ? "" : "s") + "</span>");
        if (fmt) meta.push('<span class="up__sep">·</span><span>' + FM.esc(fmt.name) + "</span>");
        if (venue) meta.push('<span class="up__sep">·</span><span>' + FM.esc(venue) + "</span>");

        return '<li class="up__event" style="transition-delay:' +
            (0.36 + i * 0.09).toFixed(2) + 's">' +
          '<a class="up__card" href="' + FM.esc(FM.href(x)) + '" data-i="' + i + '">' +
            '<span class="up__node" aria-hidden="true"></span>' +
            '<span class="up__when">' +
              '<span class="up__m">' + FM.esc(d.month) + "</span>" +
              '<span class="up__d">' + FM.esc(d.day) + "</span>" +
              '<span class="up__y">' + FM.esc(d.year) + "</span>" +
            "</span>" +
            '<span class="up__body">' +
              '<span class="up__title">' + FM.esc(x.title) + "</span>" +
              '<span class="up__meta">' + meta.join("") + "</span>" +
            "</span>" +
            arrowSvg("up__arrow") +
          "</a>" +
        "</li>";
      }).join("");
  }

  /* Hover swaps the featured card. Restores the next session on the way out,
     so the card is never left showing something the reader has moved past. */
  if (lineEl && featureEl && finePointer) {
    var current = -1;

    lineEl.addEventListener("pointerover", function (e) {
      var card = e.target.closest ? e.target.closest(".up__card") : null;
      if (!card) return;
      var i = Number(card.getAttribute("data-i"));
      if (i === current) return;
      current = i;
      swap(rest[i], false);
    });

    lineEl.addEventListener("pointerleave", function () {
      if (current === -1) return;
      current = -1;
      swap(shown[0], true);
    });

    function swap(p, isNext) {
      var body = featureEl.querySelector("[data-up-fbody]");
      if (!body || reduced) { setFeature(p, isNext); markIn(); return; }

      body.classList.add("is-swapping");
      window.setTimeout(function () {
        setFeature(p, isNext);
        markIn();
      }, 200);
    }

    /* setFeature replaces the markup, so anything the entrance already
       revealed has to be re-applied to the new nodes. */
    function markIn() {
      if (root.classList.contains("is-in")) {
        var bar = featureEl.querySelector(".up__bar span");
        if (bar) void bar.offsetWidth;
      }
    }
  }

  /* ------------------------------------------------------------------------
     Counting metrics + entrance
     ------------------------------------------------------------------------ */
  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function countUp(el, delay) {
    var target = Number(el.getAttribute("data-n"));
    var start = null;
    var DURATION = 1400;

    function step(now) {
      if (start === null) start = now;
      var elapsed = now - start - delay;
      if (elapsed <= 0) { window.requestAnimationFrame(step); return; }
      var t = Math.min(elapsed / DURATION, 1);
      el.textContent = Math.round(easeOutExpo(t) * target);
      if (t < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  function begin() {
    root.classList.add("is-in");
    if (reduced) return;   /* the real figures are already in the markup */
    var nums = root.querySelectorAll(".up__metric-n");
    Array.prototype.forEach.call(nums, function (el, i) {
      el.textContent = "0";
      countUp(el, i * 120);
    });
  }

  if (!("IntersectionObserver" in window)) {
    begin();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        begin();
      });
    }, { threshold: 0.15 });
    io.observe(root);
  }

  /* ------------------------------------------------------------------------
     Spine pulse — every 6-8s while the section is on screen. The animation
     lives in CSS; this only restarts it, by removing the class and forcing a
     reflow before adding it back.
     ------------------------------------------------------------------------ */
  var spine = root.querySelector("[data-up-spine]");

  if (spine && !reduced) {
    var pulseTimer = 0;
    var onScreen = false;

    function pulse() {
      pulseTimer = 0;
      if (!onScreen) return;
      spine.classList.remove("is-pulsing");
      void spine.offsetWidth;
      spine.classList.add("is-pulsing");
      schedulePulse();
    }

    function schedulePulse() {
      if (pulseTimer) window.clearTimeout(pulseTimer);
      pulseTimer = window.setTimeout(pulse, 6000 + Math.random() * 2000);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        onScreen = e[0].isIntersecting;
        if (onScreen && !pulseTimer) schedulePulse();
        else if (!onScreen && pulseTimer) { window.clearTimeout(pulseTimer); pulseTimer = 0; }
      }, { threshold: 0.1 }).observe(root);
    } else {
      onScreen = true;
      schedulePulse();
    }
  }
})();
