/* ==========================================================================
   ForumMinds — site.js
   Behaviour shared by every page: mobile nav, the programmes dropdown,
   scroll reveal, the footer year, and the docket renderer.

   Loads on every page, after data/programmes.js.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     Mobile navigation drawer
     ------------------------------------------------------------------------ */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });

    /* Close the drawer when a link inside it is followed */
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
    });
  }

  /* ------------------------------------------------------------------------
     Programmes dropdown

     Opens on hover on pointer devices, on click everywhere. Below the nav
     breakpoint it behaves as an accordion inside the drawer, which is why the
     hover handlers are gated on a media query.
     ------------------------------------------------------------------------ */
  var wideNav = window.matchMedia("(min-width: 1041px)");

  Array.prototype.forEach.call(document.querySelectorAll(".has-menu"), function (item) {
    var btn = item.querySelector("button");
    var menu = item.querySelector(".menu");
    if (!btn || !menu) { return; }

    var closeTimer;

    function open() { btn.setAttribute("aria-expanded", "true"); }
    function close() { btn.setAttribute("aria-expanded", "false"); }

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (btn.getAttribute("aria-expanded") === "true") { close(); } else { open(); }
    });

    item.addEventListener("mouseenter", function () {
      if (!wideNav.matches) { return; }
      window.clearTimeout(closeTimer);
      open();
    });

    item.addEventListener("mouseleave", function () {
      if (!wideNav.matches) { return; }
      closeTimer = window.setTimeout(close, 180);
    });

    /* Escape closes and returns focus to the trigger */
    item.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
        close();
        btn.focus();
      }
    });

    /* Clicking anywhere outside closes it */
    document.addEventListener("click", function (e) {
      if (!item.contains(e.target)) { close(); }
    });

    /* Tabbing out of the menu closes it */
    item.addEventListener("focusout", function (e) {
      if (wideNav.matches && !item.contains(e.relatedTarget)) { close(); }
    });
  });

  /* ------------------------------------------------------------------------
     Scroll reveal — fade and rise, once per element
     ------------------------------------------------------------------------ */
  var revealables = document.querySelectorAll(".reveal");

  if (revealables.length) {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(revealables, function (el) {
        el.classList.add("is-in");
      });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

      Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
    }
  }

  /* ------------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------------ */
  Array.prototype.forEach.call(document.querySelectorAll("[data-year]"), function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ------------------------------------------------------------------------
     Mega-menu featured panel — the next scheduled session.
     Filled from data so it can never go stale against the calendar.
     ------------------------------------------------------------------------ */
  var feature = document.getElementById("menu-feature");

  if (feature && typeof FM !== "undefined") {
    var next = FM.upcoming(1)[0];

    if (next) {
      var fmt = FM.format(next.format);
      feature.innerHTML =
        '<span class="eyebrow">Next session</span>' +
        '<span class="menu__feature-date">' + FM.esc(FM.dateRange(next)) + "</span>" +
        '<span class="menu__feature-title">' + FM.esc(next.title) + "</span>" +
        '<span class="menu__feature-meta">' + FM.esc([
            next.days + " day" + (next.days === 1 ? "" : "s"),
            fmt ? fmt.name : next.format,
            FM.venueLabel(next)
          ].filter(Boolean).join(" · ")) + "</span>" +
        '<a class="btn btn--primary" href="' + FM.esc(FM.href(next)) + '">View programme</a>';
    } else {
      feature.innerHTML =
        '<span class="eyebrow">Training calendar</span>' +
        '<span class="menu__feature-title">Dates for the next intake are being confirmed.</span>' +
        '<a class="btn btn--primary" href="contact.html">Ask about dates</a>';
    }
  }
})();


/* ==========================================================================
   THE DOCKET RENDERER

   Builds the site's signature schedule list. Used by the hero, the home page,
   the programmes page, every category page and the calendar's list view, so
   all of them stay visually identical and are fixed in one place.

   Usage:  FMDocket.render(containerElement, arrayOfProgrammes);
   ========================================================================== */

var FMDocket = (function () {
  "use strict";

  var ARROW =
    '<svg class="docket__go" width="18" height="18" viewBox="0 0 18 18" ' +
    'fill="none" aria-hidden="true"><path d="M3.5 9h11m0 0-4-4m4 4-4 4" ' +
    'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" ' +
    'stroke-linejoin="round"/></svg>';

  /* One docket row. Returns an HTML string. */
  function row(p) {
    var d = FM.dateParts(p);
    var fmt = FM.format(p.format);
    var cats = FM.categoryNames(p);

    var venue = FM.venueLabel(p);

    var meta = [];
    meta.push("<span>" + FM.esc(p.days) + " day" + (p.days === 1 ? "" : "s") + "</span>");
    if (fmt) { meta.push("<span>" + FM.esc(fmt.name) + "</span>"); }
    if (venue) { meta.push("<span>" + FM.esc(venue) + "</span>"); }
    if (cats.length) { meta.push("<span>" + FM.esc(cats[0]) + "</span>"); }

    return '<a class="docket__row" href="' + FM.esc(FM.href(p)) + '">' +
      '<span class="docket__date">' +
        '<span class="docket__month">' + FM.esc(d.month) + "</span>" +
        '<span class="docket__day">' + FM.esc(d.day) + "</span>" +
        '<span class="docket__year">' + FM.esc(d.year) + "</span>" +
      "</span>" +
      '<span class="docket__body">' +
        '<span class="docket__title">' + FM.esc(p.title) + "</span>" +
        '<span class="docket__meta">' + meta.join("") + "</span>" +
      "</span>" +
      ARROW +
    "</a>";
  }

  return {
    row: row,

    /* Replace a container's contents with a docket of the given programmes. */
    render: function (container, list) {
      if (!container) { return; }

      if (!list || !list.length) {
        container.innerHTML =
          '<div class="empty-state">' +
            "<h3>No programmes match those filters</h3>" +
            "<p>Clear a filter to widen the search, or " +
            '<a href="contact.html">ask us about a bespoke programme</a>.</p>' +
          "</div>";
        container.classList.remove("docket");
        return;
      }

      container.classList.add("docket");
      container.innerHTML = list.map(row).join("");
    }
  };
})();
