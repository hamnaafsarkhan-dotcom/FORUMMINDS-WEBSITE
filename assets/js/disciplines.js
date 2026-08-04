/* ==========================================================================
   ForumMinds — disciplines.js
   The practice areas split showcase: ten disciplines listed on the left, the
   selected one shown in the panel on the right.

   Everything it renders comes from data/programmes.js — names, blurbs, live
   programme counts and destinations. Nothing is written here, so editing a
   discipline is still a one-file change in the data.

   Replaces the category card grid this page used to build inline. The icon
   set moved here with it; it is the same set, unchanged.

   Loads on index.html, after site.js.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.getElementById("disciplines");
  if (!root || typeof FM === "undefined" || !FM.categories) return;

  /* Line art, 24x24, stroked with currentColor so the list and the panel can
     colour their copies differently. */
  var icons = {
    "leadership":      '<path d="M12 3.5 14.7 9l6 .9-4.35 4.25L17.4 20 12 17.15 6.6 20l1.05-5.85L3.3 9.9 9.3 9z"/>',
    "ai":              '<rect x="6" y="6" width="12" height="12" rx="2.5"/><path d="M9.5 2.5v3.5M14.5 2.5v3.5M9.5 18v3.5M14.5 18v3.5M2.5 9.5H6M2.5 14.5H6M18 9.5h3.5M18 14.5h3.5"/>',
    "oil-gas":         '<path d="M5 21V9l7-6 7 6v12"/><path d="M9.5 21v-5.5h5V21"/><path d="M12 3v3.5"/>',
    "engineering-tech":'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>',
    "finance":         '<path d="M3.5 20.5h17"/><path d="M6.5 20.5V12M11 20.5V7M15.5 20.5v-6M20 20.5V4"/>',
    "supply-chain":    '<rect x="2.5" y="9.5" width="8" height="7" rx="1.5"/><path d="M13.5 9.5h4l4 3.5v3.5h-8z"/><circle cx="6.5" cy="19" r="2"/><circle cx="17.5" cy="19" r="2"/>',
    "hr":              '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20.5a6.2 6.2 0 0 1 12.4 0"/><path d="M16.5 5.2a3.4 3.4 0 0 1 0 6.6M17.5 14.6a6.2 6.2 0 0 1 3.7 5.9"/>',
    "office-admin":    '<rect x="3" y="6.5" width="18" height="14" rx="2"/><path d="M8.5 6.5V4.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v2"/><path d="M3 12h18"/>',
    "esg":             '<path d="M12 21c0-6 3.5-10 8.5-10.5C20 17 16.5 21 12 21z"/><path d="M12 21c0-5-3-8.5-7.5-9C5 17 8 21 12 21z"/><path d="M12 21v-4"/>',
    "contract":        '<path d="M6 2.8h8l4.5 4.5v14H6z"/><path d="M14 2.8v4.7h4.5"/><path d="M9 12.5h6M9 16h4"/>'
  };

  var cats = FM.categories;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var ROTATE = 5000;
  var LEAVE = 150;   /* keep in step with .disc__body.is-leaving in main.css */

  function svg(paths) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' + paths + "</svg>";
  }

  /* The card grid's wording, kept verbatim so the count reads the same as it
     always has — including "Enquire" for a discipline with nothing scheduled. */
  function countLabel(n) {
    return n ? n + " programme" + (n === 1 ? "" : "s") : "Enquire";
  }

  /* ------------------------------------------------------------------------
     Markup
     ------------------------------------------------------------------------ */
  function buildNav() {
    return '<div class="disc__nav" role="tablist" aria-orientation="vertical" ' +
      'aria-label="Practice areas">' +
      '<span class="disc__rail" aria-hidden="true"></span>' +
      '<span class="disc__marker" aria-hidden="true"></span>' +
      cats.map(function (c, i) {
        return '<button class="disc__item" type="button" role="tab"' +
          ' id="disc-tab-' + c.id + '"' +
          ' aria-controls="disc-panel"' +
          ' aria-selected="' + (i === 0 ? "true" : "false") + '"' +
          ' tabindex="' + (i === 0 ? "0" : "-1") + '">' +
          '<span class="disc__ico">' + svg(icons[c.id]) + "</span>" +
          '<span class="disc__name">' + FM.esc(c.name) + "</span>" +
          "</button>";
      }).join("") +
      "</div>";
  }

  /* The count and the call to action are ONE element, not two.
     The panel's floating card has to carry the programme count, and the count
     is also the only wording the call to action has ever used — "3 programmes"
     / "Enquire". Splitting them would mean either printing the count twice in
     one panel or writing a new CTA label, and inventing copy is off the table.
     So the card is the link: icon, count, arrow.

     The card has no supporting line for the same reason. The only unused text
     on a category is `lede`, which is a full paragraph and would duplicate the
     description sitting directly above it. */
  function bodyHtml(c) {
    var n = FM.byCategory(c.id).length;
    var art = svg(icons[c.id]);

    return '<span class="disc__mark" aria-hidden="true">' + art + "</span>" +
      '<span class="disc__badge" aria-hidden="true">' + art + "</span>" +
      "<h3>" + FM.esc(c.name) + "</h3>" +
      '<span class="disc__rule" aria-hidden="true"></span>' +
      "<p>" + FM.esc(c.blurb) + "</p>" +
      '<a class="disc__meta" href="' + c.url + '">' +
        '<span class="disc__meta-ico" aria-hidden="true">' + art + "</span>" +
        '<span class="disc__meta-n">' + countLabel(n) + "</span>" +
        '<span class="arw" aria-hidden="true">&rarr;</span>' +
      "</a>";
  }

  root.className += " disc";
  root.innerHTML = buildNav() +
    '<div class="disc__panel" role="tabpanel" id="disc-panel" tabindex="0">' +
      '<div class="disc__body"></div>' +
    "</div>";

  var nav = root.querySelector(".disc__nav");
  var marker = root.querySelector(".disc__marker");
  var panel = root.querySelector(".disc__panel");
  var body = root.querySelector(".disc__body");
  var buttons = Array.prototype.slice.call(root.querySelectorAll(".disc__item"));

  var current = -1;
  var swapTimer = 0;

  /* ------------------------------------------------------------------------
     Selection
     ------------------------------------------------------------------------ */
  function moveMarker() {
    var btn = buttons[current];
    marker.style.height = btn.offsetHeight + "px";
    marker.style.transform = "translateY(" + btn.offsetTop + "px)";
  }

  function render(c, animate) {
    if (swapTimer) { window.clearTimeout(swapTimer); swapTimer = 0; }

    if (!animate) {
      body.className = "disc__body";
      body.innerHTML = bodyHtml(c);
      return;
    }

    body.classList.add("is-leaving");
    swapTimer = window.setTimeout(function () {
      swapTimer = 0;
      body.innerHTML = bodyHtml(c);
      body.classList.remove("is-leaving");
      body.classList.add("is-entering");
      /* Commit the start state before releasing it, or the browser collapses
         both changes into one style resolution and nothing animates. */
      void body.offsetWidth;
      body.classList.remove("is-entering");
    }, LEAVE);
  }

  function select(i, animate) {
    if (i === current) return;

    buttons.forEach(function (btn, j) {
      var on = j === i;
      btn.setAttribute("aria-selected", on ? "true" : "false");
      btn.tabIndex = on ? 0 : -1;
    });

    current = i;
    panel.setAttribute("aria-labelledby", buttons[i].id);
    moveMarker();
    render(cats[i], animate && !reduced);
  }

  /* ------------------------------------------------------------------------
     Auto rotation

     Runs only while the section is on screen and unattended. focus counts as
     attention as much as the pointer does — without that, a keyboard user
     would have the panel changing underneath them while they read it, and
     there would be no way to stop it.
     ------------------------------------------------------------------------ */
  var timer = 0;
  var hovering = false;
  var focused = false;
  var onScreen = false;

  function stop() {
    if (timer) { window.clearInterval(timer); timer = 0; }
  }

  function sync() {
    stop();
    if (reduced || !onScreen || hovering || focused) return;
    timer = window.setInterval(function () {
      select((current + 1) % cats.length, true);
    }, ROTATE);
  }

  /* Any deliberate choice restarts the clock, so the panel is never yanked
     away a moment after the visitor picked it. */
  function choose(i) {
    select(i, true);
    sync();
  }

  buttons.forEach(function (btn, i) {
    btn.addEventListener("click", function () { choose(i); });
    /* Hover-to-select only where hovering is a real thing. On a touchscreen
       the click above is the whole interaction. */
    if (finePointer) {
      btn.addEventListener("mouseenter", function () { choose(i); });
    }
  });

  nav.addEventListener("keydown", function (e) {
    var last = cats.length - 1;
    var next;

    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = current === last ? 0 : current + 1;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = current === 0 ? last : current - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;

    e.preventDefault();
    choose(next);
    buttons[next].focus();
  });

  root.addEventListener("pointerenter", function () { hovering = true; sync(); });
  root.addEventListener("pointerleave", function () { hovering = false; sync(); });
  root.addEventListener("focusin", function () { focused = true; sync(); });
  root.addEventListener("focusout", function () { focused = false; sync(); });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      sync();
    }, { threshold: 0.2 }).observe(root);
  } else {
    onScreen = true;
  }

  /* The marker is measured in pixels, so it has to be re-measured whenever the
     boxes it was measured against can have changed. */
  window.addEventListener("resize", function () {
    if (current >= 0) moveMarker();
  });

  select(0, false);
  sync();
})();
