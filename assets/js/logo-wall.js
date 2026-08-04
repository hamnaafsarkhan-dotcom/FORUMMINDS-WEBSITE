/* ==========================================================================
   ForumMinds — logo-wall.js
   "Trusted by Leading Organisations": two marquee rows of client logos, a
   rotating featured card, and a strip of counted metrics.

   THE ARTWORK IS NEVER TOUCHED
   Each logo is the supplied SVG rendered as-is — no recolouring, no filter,
   no cropping, no redraw. The only thing this file decides about a logo is
   how tall to let it sit inside its card (see OPTICAL SIZING below).

   Replaces trust.js.  Loads on index.html, after site.js.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.getElementById("logo-wall");
  if (!root) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ------------------------------------------------------------------------
     OPTICAL SIZING

     These eleven files disagree wildly about shape. Siemens is a 6.3:1
     wordmark; Emirates is 0.94:1; four of them are square 1:1 canvases:

         siemens          6.29 : 1
         qatar-airways    3.54 : 1
         sabic            1.88 : 1
         baker-hughes     1.81 : 1
         dp-world         1.59 : 1
         adnoc            1.37 : 1
         aramco/dewa/pdo/schneider   1.00 : 1
         emirates         0.94 : 1

     One shared max-height cannot serve that range. At 46px the square marks
     read as huge blocks while Siemens becomes a 7px hairline; equalise on
     width instead and the squares shrink to nothing.

     Aspect ratio alone is not enough either. Several of these files carry a
     lot of empty canvas around the mark — the four exported on a 192.756
     square are the worst, and Aramco, Schneider and PDO each fill only about
     a third of theirs. Sized purely by ratio they came out visibly tiny next
     to Siemens, so the values below were set by measuring the RENDERED box
     and correcting, not by arithmetic on the viewBox.

     `h` is the only tuning knob, and it is a display cap — the artwork itself
     is never scaled, cropped or altered. Raise it to make one logo read
     larger; the ceiling is the card's 78px content height.

     `s` is a second, optional knob for the worst offenders: a display zoom
     past the content box. Only the file's own transparent margin overflows
     and the card clips it, so nothing is cropped from the artwork — it is
     simply shown larger. Most logos need no `s` at all.

     `cat` keys into CATEGORIES below — it drives the accent strip colour, the
     hover badge and the caption shown when a card is featured.
     ------------------------------------------------------------------------ */
  var LOGOS = [
    { name: "Saudi Aramco",                 file: "saudi-aramco.svg",                       h: 78, s: 1.34, cat: "energy" },
    { name: "ADNOC",                        file: "adnoc.svg",                              h: 58,          cat: "energy" },
    { name: "SABIC",                        file: "sabic-1.svg",                            h: 58,          cat: "energy" },
    { name: "DEWA",                         file: "dewa.svg",                               h: 68, s: 1.12, cat: "utilities" },
    { name: "Emirates",                     file: "emirates-1.svg",                         h: 70,          cat: "aviation" },
    { name: "DP World",                     file: "dp-world-2021-logo.svg",                 h: 50,          cat: "logistics" },
    { name: "Baker Hughes",                 file: "baker-hughes-1.svg",                     h: 44,          cat: "energy" },
    { name: "Siemens",                      file: "siemens-ag-logo.svg",                    h: 26,          cat: "energy" },
    { name: "Schneider Electric",           file: "schneider-electric.svg",                 h: 78, s: 1.38, cat: "utilities" },
    { name: "Petroleum Development Oman",   file: "petroleum-development-corporation.svg",  h: 78, s: 1.42, cat: "utilities" },
    { name: "Qatar Airways",                file: "qatar-airways-1.svg",                    h: 34,          cat: "aviation" }
  ];

  /* ------------------------------------------------------------------------
     Categories

     `logistics` is not in the brief's list. DP World is a ports and logistics
     operator and does not belong under energy, utilities or aviation, so it
     has its own entry rather than being filed somewhere inaccurate.

     `telecom` is defined but currently unused — the brief lists STC and e&
     under it and neither logo exists in the project. The moment those files
     arrive, adding two LOGOS rows with cat: "telecom" is the whole job.
     ------------------------------------------------------------------------ */
  var CATEGORIES = {
    energy:    { label: "Energy",    colour: "#B8912C", caption: "Technical Learning" },
    utilities: { label: "Utilities", colour: "#12695F", caption: "Capability Building" },
    aviation:  { label: "Aviation",  colour: "#1B4F86", caption: "Executive Education" },
    logistics: { label: "Logistics", colour: "#4E6B7A", caption: "Corporate Training" },
    telecom:   { label: "Telecom",   colour: "#5B5670", caption: "Leadership Development" }
  };

  var LOGO_DIR = "logos/";

  /* ------------------------------------------------------------------------
     Metrics

     Not derived from anything. Every other figure on this page counts itself
     out of data/programmes.js and cannot drift; these four were supplied with
     the brief and are published exactly as given. If one is wrong it has to
     be corrected here — nothing will catch it.
     ------------------------------------------------------------------------ */
  var STATS = [
    { n: 350, suffix: "+", label: "Corporate Clients" },
    { n: 48,  suffix: "",  label: "Countries Served" },
    { n: 150, suffix: "+", label: "Expert Trainers" },
    { n: 95,  suffix: "%", label: "Client Satisfaction" }
  ];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ------------------------------------------------------------------------
     Wall

     Each row prints its logos twice. The CSS animates the track a flat -50%,
     which lands exactly on the head of the second copy — so the loop closes
     seamlessly for any number of logos, with nothing measured here. The
     duplicate is hidden from assistive tech; it is the same list again.
     ------------------------------------------------------------------------ */
  function tile(logo, i) {
    var cat = CATEGORIES[logo.cat] || CATEGORIES.energy;

    return '<div class="lw__tile" style="--d:' + (0.30 + i * 0.06).toFixed(2) + 's">' +
      '<div class="lw__float" style="--fd:-' + (i * 0.83 % 6).toFixed(2) + 's">' +
        '<div class="lw__card" style="--cat:' + cat.colour + '">' +

          '<span class="lw__spot" aria-hidden="true"></span>' +

          '<img class="lw__logo" src="' + esc(LOGO_DIR + logo.file) + '"' +
            ' alt="' + esc(logo.name) + '"' +
            ' style="--h:' + logo.h + "px" +
              (logo.s ? ";--s:" + logo.s : "") + '"' +
            ' loading="lazy" decoding="async">' +

          /* preserveAspectRatio="none" lets the rect stretch to whatever the
             card is; pathLength="100" keeps the dash maths size-independent. */
          '<svg class="lw__edge" viewBox="0 0 220 110" preserveAspectRatio="none" aria-hidden="true">' +
            '<rect x="0.75" y="0.75" width="218.5" height="108.5" rx="17.25" pathLength="100"/>' +
          "</svg>" +

          '<span class="lw__bar" aria-hidden="true"></span>' +
          '<span class="lw__tag" aria-hidden="true">' + esc(cat.label) + "</span>" +
          '<span class="lw__cap" aria-hidden="true">' + esc(cat.caption) + "</span>" +
        "</div>" +
      "</div>" +
    "</div>";
  }

  function buildRow(list, variant) {
    var set = list.map(tile).join("");
    return '<div class="lw__row lw__row--' + variant + '">' +
      '<div class="lw__track">' +
        '<div class="lw__set">' + set + "</div>" +
        '<div class="lw__set lw__set--dup" aria-hidden="true">' + set + "</div>" +
      "</div>" +
    "</div>";
  }

  var wall = root.querySelector("[data-lw-wall]");
  if (wall && LOGOS.length) {
    /* Split so neither row is a strict subset of the other — with an odd
       count the two rows carry different logos, which reads as a wall rather
       than as one list shown twice. */
    var half = Math.ceil(LOGOS.length / 2);
    wall.innerHTML = buildRow(LOGOS.slice(0, half), "a") +
                     buildRow(LOGOS.slice(half), "b");
  }

  /* ------------------------------------------------------------------------
     Metrics markup + counting
     ------------------------------------------------------------------------ */
  var statsEl = root.querySelector("[data-lw-stats]");
  if (statsEl) {
    statsEl.innerHTML = STATS.map(function (s) {
      return '<li class="lw__stat">' +
        '<span class="lw__stat-n" data-n="' + s.n + '" data-suffix="' + esc(s.suffix) + '">' +
          s.n + esc(s.suffix) +
        "</span>" +
        '<span class="lw__stat-l">' + esc(s.label) + "</span>" +
      "</li>";
    }).join("");
  }

  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function countUp(el, delay) {
    var target = Number(el.getAttribute("data-n"));
    var suffix = el.getAttribute("data-suffix") || "";
    var DURATION = 1500;
    var start = null;

    function step(now) {
      if (start === null) start = now;
      var elapsed = now - start - delay;
      if (elapsed <= 0) { window.requestAnimationFrame(step); return; }
      var t = Math.min(elapsed / DURATION, 1);
      el.textContent = Math.round(easeOutExpo(t) * target) + suffix;
      if (t < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------------
     Entrance
     ------------------------------------------------------------------------ */
  var numbers = statsEl ? statsEl.querySelectorAll(".lw__stat-n") : [];

  function begin() {
    root.classList.add("is-in");
    if (reduced) return;   /* the real figures are already in the markup */
    Array.prototype.forEach.call(numbers, function (el, i) {
      el.textContent = "0" + (el.getAttribute("data-suffix") || "");
      countUp(el, i * 110);
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
    }, { threshold: 0.2 });
    io.observe(root);
  }

  /* ------------------------------------------------------------------------
     Featured rotation

     One card at a time, 3s on, the next 15-20s later. Both copies of a logo
     are highlighted together — they are the same company, and lighting only
     one of them looks like a rendering fault when the seam scrolls past.

     setTimeout rather than setInterval, because the gap is re-randomised
     every cycle. Only runs while the section is on screen; a timer firing
     against an off-screen wall is pure waste.
     ------------------------------------------------------------------------ */
  if (!reduced) {
    var cards = Array.prototype.slice.call(root.querySelectorAll(".lw__card"));
    var timer = 0;
    var onScreen = false;
    var last = -1;

    function nameOf(card) {
      return card.querySelector(".lw__logo").getAttribute("alt");
    }

    function feature() {
      timer = 0;
      if (!onScreen || !cards.length) return;

      var pick;
      do { pick = Math.floor(Math.random() * cards.length); }
      while (cards.length > 1 && pick === last);
      last = pick;

      var name = nameOf(cards[pick]);
      var group = cards.filter(function (c) { return nameOf(c) === name; });

      group.forEach(function (c) { c.classList.add("is-featured"); });
      window.setTimeout(function () {
        group.forEach(function (c) { c.classList.remove("is-featured"); });
      }, 3000);

      schedule();
    }

    function schedule() {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(feature, 15000 + Math.random() * 5000);
    }

    function runFeature(on) {
      onScreen = on;
      if (on && !timer) schedule();
      else if (!on && timer) { window.clearTimeout(timer); timer = 0; }
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { runFeature(e[0].isIntersecting); },
        { threshold: 0.1 }).observe(root);
    } else {
      runFeature(true);
    }
  }

  /* ------------------------------------------------------------------------
     Card tilt and cursor spotlight

     One delegated listener on the wall rather than two per card — 22 cards
     would otherwise mean 44 listeners for an effect only ever active on one
     of them.

     The tilt writes --rx/--ry and nothing else. The transform that consumes
     them lives in the stylesheet alongside the hover lift and the featured
     scale; see the note above .lw__card for why none of the three may write
     `transform` itself.
     ------------------------------------------------------------------------ */
  if (wall && finePointer && !reduced) {
    var MAX_TILT = 4;          /* degrees — past ~5 it reads as a gimmick */
    var tiltFrame = 0;
    var active = null;
    var cx = 0, cy = 0;

    function resetCard(card) {
      if (!card) return;
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    }

    wall.addEventListener("pointermove", function (e) {
      var card = e.target.closest ? e.target.closest(".lw__card") : null;

      if (card !== active) {
        resetCard(active);
        active = card;
      }
      if (!card) return;

      cx = e.clientX;
      cy = e.clientY;
      if (tiltFrame) return;

      tiltFrame = window.requestAnimationFrame(function () {
        tiltFrame = 0;
        if (!active) return;

        /* Read the box inside the frame, not the event: one layout read per
           frame however fast the pointer moves. */
        var r = active.getBoundingClientRect();
        var px = (cx - r.left) / r.width;
        var py = (cy - r.top) / r.height;

        active.style.setProperty("--ry", ((px - 0.5) * 2 * MAX_TILT).toFixed(2) + "deg");
        active.style.setProperty("--rx", ((0.5 - py) * 2 * MAX_TILT).toFixed(2) + "deg");

        var spot = active.querySelector(".lw__spot");
        if (spot) {
          spot.style.transform =
            "translate3d(" + (cx - r.left).toFixed(1) + "px," +
                             (cy - r.top).toFixed(1) + "px,0)";
        }
      });
    }, { passive: true });

    wall.addEventListener("pointerleave", function () {
      if (tiltFrame) { window.cancelAnimationFrame(tiltFrame); tiltFrame = 0; }
      resetCard(active);
      active = null;
    });
  }

  /* ------------------------------------------------------------------------
     Mouse parallax — 3px, pointer devices only.

     Written to the wall wrapper, which owns no other transform. The rows use
     one for their entrance and the tracks one for the marquee; writing here
     would overwrite whichever it landed on.
     ------------------------------------------------------------------------ */
  if (wall && finePointer && !reduced) {
    var MAX = 3;
    var frame = 0;
    var mx = 0, my = 0;

    root.addEventListener("pointermove", function (e) {
      mx = e.clientX;
      my = e.clientY;
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        frame = 0;
        var r = root.getBoundingClientRect();
        var dx = ((mx - r.left) / r.width - 0.5) * 2;
        var dy = ((my - r.top) / r.height - 0.5) * 2;
        wall.style.transform =
          "translate3d(" + (dx * MAX).toFixed(2) + "px," +
                           (dy * MAX).toFixed(2) + "px,0)";
      });
    });

    root.addEventListener("pointerleave", function () {
      if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
      wall.style.transform = "translate3d(0,0,0)";
    });
  }

  /* ------------------------------------------------------------------------
     Field parallax on scroll. A scroll listener rather than a view() timeline
     because this section has `overflow: hidden`, which makes it a scroll
     container — a view timeline would resolve against a box that never
     scrolls.
     ------------------------------------------------------------------------ */
  var field = root.querySelector("[data-lw-field]");

  if (field && !reduced) {
    var RANGE = 34;
    var ticking = false;
    var inView = false;

    function place() {
      ticking = false;
      var r = root.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      field.style.transform = "translate3d(0," + ((p - 0.5) * RANGE).toFixed(1) + "px,0)";
    }

    function onScroll() {
      if (!inView || ticking) return;
      ticking = true;
      window.requestAnimationFrame(place);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        inView = e[0].isIntersecting;
        if (inView) place();
      }, { threshold: 0 }).observe(root);
    } else {
      inView = true;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    place();
  }
})();
