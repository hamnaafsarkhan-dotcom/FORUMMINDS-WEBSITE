/* ==========================================================================
   ForumMinds — delivery.js
   Two things the "Three ways to run it" panels cannot do in CSS: fire the
   scroll entrance once, and follow the cursor with a soft spotlight.

   Everything else in that section is CSS — the expansion, the gold underline,
   the staggered highlights, the glass sweep, the button. The content is
   static markup, so with this file removed the section still renders, still
   reads and still responds to hover; it simply arrives without the entrance
   and without the spotlight.

   Loads on index.html, after site.js.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.getElementById("delivery");
  if (!root) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ------------------------------------------------------------------------
     Entrance

     One class on the section; the stagger is nth-child transition-delays in
     the stylesheet, so the sequence can be retuned without touching JS.
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
    }, { threshold: 0.15 });
    io.observe(root);
  }

  /* ------------------------------------------------------------------------
     Cursor spotlight

     One delegated listener on the row rather than one per panel, and the
     spotlight is moved with a transform only — never by redrawing the
     gradient or setting top/left — so tracking the cursor costs a compositor
     transform per frame and no layout or paint.

     Skipped without a fine pointer: there is no cursor to follow on a
     touchscreen, and the element would just sit there costing a layer.
     ------------------------------------------------------------------------ */
  var row = root.querySelector(".dlv__row");
  if (!row || !finePointer || reduced) return;

  var frame = 0;
  var active = null;
  var cx = 0;
  var cy = 0;

  row.addEventListener("pointermove", function (e) {
    var panel = e.target.closest ? e.target.closest(".dlv__panel") : null;
    active = panel;
    if (!panel) return;

    cx = e.clientX;
    cy = e.clientY;
    if (frame) return;

    frame = window.requestAnimationFrame(function () {
      frame = 0;
      if (!active) return;

      /* Read the box inside the frame, not the event: one layout read per
         frame however fast the pointer moves. It has to be re-read each time
         rather than cached — the panel is still growing while the pointer
         moves across it. */
      var r = active.getBoundingClientRect();
      var spot = active.querySelector(".dlv__spot");
      if (!spot) return;

      spot.style.transform =
        "translate3d(" + (cx - r.left).toFixed(1) + "px," +
                         (cy - r.top).toFixed(1) + "px,0)";
    });
  }, { passive: true });

  row.addEventListener("pointerleave", function () {
    if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
    active = null;
  });
})();
