/* ==========================================================================
   ForumMinds — why.js
   Two things the Why ForumMinds bento cannot do in CSS alone: the pointer
   tilt on tile 4, and the slow parallax on the background field. Plus the
   one-shot trigger for the scroll entrance.

   Everything else in that section — the light sweep, the drawing rules, the
   illustration reveal, the pulse, the staggered entrance — is CSS. This file
   only supplies the two values CSS cannot know: where the pointer is, and
   how far the section has travelled.

   With this file removed the section still renders and still reads; it
   simply arrives without the entrance and sits flat.

   Loads on index.html, after site.js.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.getElementById("why");
  if (!root) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ------------------------------------------------------------------------
     Entrance

     One class on the section; the stagger is nth-child transition-delays in
     the stylesheet. Keeping the timing in CSS means the sequence can be
     retuned without touching JavaScript.
     ------------------------------------------------------------------------ */
  if (!("IntersectionObserver" in window)) {
    root.classList.add("is-in");
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        root.classList.add("is-in");
      });
    }, { threshold: 0.12 });
    io.observe(root);
  }

  /* ------------------------------------------------------------------------
     Tile 4 — pointer tilt

     Writes two custom properties and nothing else; the transform that uses
     them lives in the stylesheet, defaulting to zero. So a tile with no
     script attached is simply a flat tile, not a broken one.

     Skipped without a fine pointer: there is no hover on a touchscreen, and
     a tilt that can only be triggered by tapping is a tilt nobody sees.
     ------------------------------------------------------------------------ */
  var tilt = root.querySelector("[data-why-tilt]");

  if (tilt && finePointer && !reduced) {
    var MAX = 5;          /* degrees — past about 6 it stops reading as depth */
    var frame = 0;
    var px = 0;
    var py = 0;

    tilt.addEventListener("pointermove", function (e) {
      px = e.clientX;
      py = e.clientY;
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        frame = 0;
        /* Read the box inside the frame, not the event: one layout read per
           frame however fast the pointer moves. */
        var r = tilt.getBoundingClientRect();
        var cx = (px - r.left) / r.width - 0.5;
        var cy = (py - r.top) / r.height - 0.5;
        tilt.style.setProperty("--ry", (cx * MAX * 2).toFixed(2) + "deg");
        tilt.style.setProperty("--rx", (-cy * MAX * 2).toFixed(2) + "deg");
      });
    });

    tilt.addEventListener("pointerleave", function () {
      if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
      tilt.style.setProperty("--rx", "0deg");
      tilt.style.setProperty("--ry", "0deg");
    });
  }

  /* ------------------------------------------------------------------------
     Background parallax

     The field drifts about 40px against the page across the whole time the
     section is on screen. Driven from a scroll listener rather than a
     scroll-driven CSS timeline because the field sits inside a section with
     `overflow: hidden` — which makes that section a scroll container, and a
     view() timeline would then resolve against a box that never scrolls.
     (Learned the hard way on the photographic band.)
     ------------------------------------------------------------------------ */
  var field = root.querySelector("[data-why-field]");

  if (field && !reduced) {
    var RANGE = 40;
    var ticking = false;
    var visible = false;

    function place() {
      ticking = false;
      var r = root.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      /* 0 as the section's top reaches the bottom of the screen, 1 as its
         bottom leaves the top. */
      var progress = (vh - r.top) / (vh + r.height);
      progress = Math.min(1, Math.max(0, progress));
      field.style.transform =
        "translate3d(0," + ((progress - 0.5) * RANGE).toFixed(1) + "px,0)";
    }

    function onScroll() {
      if (!visible || ticking) return;
      ticking = true;
      window.requestAnimationFrame(place);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) place();
      }, { threshold: 0 }).observe(root);
    } else {
      visible = true;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    place();
  }
})();
