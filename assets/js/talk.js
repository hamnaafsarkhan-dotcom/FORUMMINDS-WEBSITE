/* ==========================================================================
   ForumMinds — talk.js
   Three things the contact cards cannot do in CSS: fire the entrance once,
   follow the cursor with a spotlight, and drift the background against the
   pointer.

   Everything else in that section — the hover lifts, the top-border sweep,
   the icon behaviours, the ribbon, the dim-the-siblings focus — is CSS. This
   file supplies only what CSS cannot know: where the pointer is, and whether
   the section has been reached.

   With this file removed the cards still render, still read and still respond
   to hover; they simply arrive without the entrance and without the lighting.

   Scoped to #talk. .card and .contact-card__icon are shared with other pages
   and are never touched.

   Loads on contact.html, after site.js.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.getElementById("talk");
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
    }, { threshold: 0.2 });
    io.observe(root);
  }

  /* ------------------------------------------------------------------------
     Spotlight and parallax

     Both read the same pointer position, so they share one listener and one
     frame. Skipped without a fine pointer: there is no cursor to follow on a
     touchscreen, and the two layers would just sit there costing memory.
     ------------------------------------------------------------------------ */
  var spot = root.querySelector("[data-talk-spot]");
  var field = root.querySelector("[data-talk-field]");
  if ((!spot && !field) || !finePointer || reduced) return;

  var PARALLAX = 7;          /* px — the brief's 5-8, almost imperceptible */
  var frame = 0;
  var px = 0;
  var py = 0;

  root.addEventListener("pointerenter", function () {
    root.classList.add("is-live");
  });

  root.addEventListener("pointerleave", function () {
    root.classList.remove("is-live");
    if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
    if (field) field.style.transform = "translate3d(0,0,0)";
  });

  root.addEventListener("pointermove", function (e) {
    px = e.clientX;
    py = e.clientY;
    if (frame) return;

    frame = window.requestAnimationFrame(function () {
      frame = 0;

      /* Read the box inside the frame, not the event: one layout read per
         frame however fast the pointer moves. */
      var r = root.getBoundingClientRect();
      var x = px - r.left;
      var y = py - r.top;

      if (spot) {
        spot.style.transform =
          "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      }
      if (field) {
        /* Opposite direction to the cursor, which is what reads as depth
           rather than as the background being dragged along. */
        var dx = (x / r.width - 0.5) * -2 * PARALLAX;
        var dy = (y / r.height - 0.5) * -2 * PARALLAX;
        field.style.transform =
          "translate3d(" + dx.toFixed(2) + "px," + dy.toFixed(2) + "px,0)";
      }
    });
  }, { passive: true });
})();
