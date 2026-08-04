/* ==========================================================================
   ForumMinds — journey.js
   Drives the animated process line in "From enquiry to certificate": a glowing
   node travels the connector, lighting each milestone as it arrives, then the
   whole path holds gold for a moment and resets.

   NO TWEEN LOOP HERE
   The node is moved by setting one custom property and letting a CSS
   transition do the interpolation, so the movement runs on the compositor and
   the easing is declared in the stylesheet. This file only decides WHEN each
   state change happens; main.css decides what each one looks like.

   Scoped to #journey. The .step component is shared with training-formats.html
   and stays inert there.

   Loads on index.html, after site.js.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.getElementById("journey");
  if (!root) return;

  var wrap = root.querySelector(".steps--journey");
  var steps = wrap ? Array.prototype.slice.call(wrap.querySelectorAll(".step")) : [];
  if (!wrap || steps.length < 2) return;

  var node = wrap.querySelector(".jrn__node");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Timings, ms. Full cycle is the sum: about 9s. */
  var T = {
    appear:   500,
    toFirst:  420,
    hold:     600,   /* the pause at each milestone */
    travel:  1500,   /* keep in step with the transition on .jrn__node */
    complete: 2000,
    fade:      700,
    gap:       400
  };

  var timers = [];

  function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }
  function clearAll() {
    timers.forEach(window.clearTimeout);
    timers = [];
  }

  /* Runs [[delayBefore, fn], ...] as one cancellable chain. */
  function sequence(pairs) {
    var at = 0;
    pairs.forEach(function (pair) {
      at += pair[0];
      later(pair[1], at);
    });
    return at;
  }

  function reset() {
    wrap.classList.remove("is-running", "is-moving", "is-complete");
    steps.forEach(function (s) { s.classList.remove("is-active", "is-lit"); });
    if (node) node.style.setProperty("--nx", "0px");
  }

  /* ------------------------------------------------------------------------
     Where the node stops

     Measured rather than assumed: the grid is fluid, so the milestone spacing
     changes with the viewport and cannot be written down. Recomputed on every
     cycle and on resize.

     The x is the centre of each number, and the node rides the connector's own
     y — so it passes just beneath the numbers rather than through them.
     ------------------------------------------------------------------------ */
  function stops() {
    var base = wrap.getBoundingClientRect().left;
    return steps.map(function (s) {
      return Math.round(s.getBoundingClientRect().left - base + 17);
    });
  }

  /* All three milestones only sit on one row while the grid is three columns.
     At narrower widths they wrap, and a node travelling horizontally would
     run off into empty space — so those widths get the finished state
     instead. Comparing offsetTop is layout-driven, which means it keeps
     working if the breakpoints ever move. */
  function singleRow() {
    return steps[0].offsetTop === steps[steps.length - 1].offsetTop;
  }

  function showComplete() {
    reset();
    steps.forEach(function (s) { s.classList.add("is-lit"); });
    wrap.classList.add("is-complete");
  }

  /* ------------------------------------------------------------------------
     The cycle
     ------------------------------------------------------------------------ */
  function run() {
    clearAll();
    reset();

    if (reduced || !singleRow()) { showComplete(); return; }

    var x = stops();
    var plan = [];

    /* Appear just before the first milestone, small and faint. */
    plan.push([0, function () {
      node.style.setProperty("--nx", (x[0] - 46) + "px");
      wrap.classList.add("is-running");
    }]);

    /* Grow and slide onto milestone one. */
    plan.push([T.appear, function () {
      wrap.classList.add("is-moving");
      node.style.setProperty("--nx", x[0] + "px");
    }]);

    plan.push([T.toFirst, function () { steps[0].classList.add("is-active"); }]);

    /* Each leg: light the segment behind, move, then hand the highlight on.
       Only one step is ever active — the previous one is released at the
       moment the next arrives. */
    for (var i = 1; i < steps.length; i++) {
      (function (i) {
        plan.push([T.hold, function () {
          steps[i - 1].classList.add("is-lit");
          node.style.setProperty("--nx", x[i] + "px");
        }]);
        plan.push([T.travel, function () {
          steps[i - 1].classList.remove("is-active");
          steps[i].classList.add("is-active");
        }]);
      }(i));
    }

    /* Whole path lit, node retired. */
    plan.push([T.hold, function () {
      wrap.classList.remove("is-moving");
      wrap.classList.add("is-complete");
      steps.forEach(function (s) { s.classList.add("is-lit"); });
    }]);

    plan.push([T.complete, function () {
      steps.forEach(function (s) { s.classList.remove("is-active"); });
      wrap.classList.remove("is-running", "is-complete");
      steps.forEach(function (s) { s.classList.remove("is-lit"); });
    }]);

    var total = sequence(plan) + T.fade + T.gap;
    later(run, total);
  }

  /* ------------------------------------------------------------------------
     Only while on screen. A cycle running against a section nobody is looking
     at is wasted frames, and it also means the animation starts from the
     beginning when the reader actually arrives at it.
     ------------------------------------------------------------------------ */
  var running = false;

  function setVisible(on) {
    if (on === running) return;
    running = on;
    if (on) run();
    else { clearAll(); reset(); }
  }

  if (!("IntersectionObserver" in window)) {
    setVisible(true);
  } else {
    new IntersectionObserver(function (entries) {
      setVisible(entries[0].isIntersecting);
    }, { threshold: 0.3 }).observe(wrap);
  }

  /* The stop positions are pixel measurements, so they have to be taken again
     whenever the boxes they were measured from can have changed. */
  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      if (running) run();
    }, 200);
  }, { passive: true });
})();
