/* ==========================================================================
   ForumMinds — scroll-expand-hero.js

   Drives the home page hero. While the expansion is running the page is held
   still and wheel/touch input is spent growing the photograph instead of
   scrolling; once it finishes the page unlocks and behaves normally.

   This file owns exactly one number: --p, a 0-to-1 progress value set on the
   hero element. Every size, offset and fade lives in main.css as a calc()
   off that property (section 7b). If the motion needs retuning, retune it
   there. If the *input* needs retuning — how far you have to scroll, how the
   thing unlocks — this is the file.

   WHY THE RESTING STATE IS THE FINISHED STATE
   The CSS defaults --p to 1, so the hero renders complete before this script
   runs and stays complete if it bails. Every bail-out below is therefore
   safe: worst case the visitor gets a normal, static, fully readable hero.

   Loads on index.html only, after site.js.
   ========================================================================== */

(function () {
  "use strict";

  var section = document.querySelector("[data-sx-hero]");
  if (!section) return;

  /* Bail-outs. Reduced motion is a stated preference and gets no hijacking.
     A hash or a non-zero scroll position means the visitor arrived pointed at
     something further down the page — locking them at the top and demanding
     an animation first would be hostile. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.location.hash) return;
  if (window.scrollY > 0) return;

  var root = document.documentElement;
  var lede = section.querySelector("[data-sx-lede]");
  var cue = section.querySelector("[data-sx-cue]");

  /* Tuning ---------------------------------------------------------------
     WHEEL and TOUCH are progress per pixel of input, so a full expansion is
     1/WHEEL px of wheel travel (~900px) or 1/TOUCH px of finger travel
     (~260px, about one comfortable swipe). Raise a number to make the
     expansion happen sooner. */
  var WHEEL = 0.0011;
  var TOUCH = 0.0038;
  var KEY = 0.28;   /* progress per arrow/page key press */
  var EASE = 0.16;  /* how fast the paint chases the input, per frame */

  /* State ---------------------------------------------------------------- */
  var target = 0;   /* where the input says we are */
  var shown = 0;    /* where the paint has actually got to */
  var locked = false;
  var frame = 0;
  var touchY = 0;

  /* ------------------------------------------------------------------------
     Paint

     Input is applied to `target` instantly, but `shown` chases it over a few
     frames. Wheel events arrive in coarse, uneven lumps — writing them
     straight to the DOM makes the expansion judder. This is the whole reason
     the two values are separate.
     ------------------------------------------------------------------------ */
  function render() {
    frame = 0;
    var gap = target - shown;
    shown = Math.abs(gap) < 0.0015 ? target : shown + gap * EASE;
    section.style.setProperty("--p", shown.toFixed(4));
    if (shown !== target) frame = window.requestAnimationFrame(render);
  }

  function paint() {
    if (!frame) frame = window.requestAnimationFrame(render);
  }

  function setTarget(value) {
    target = Math.min(1, Math.max(0, value));
    /* Unlock on intent, not on arrival. Waiting for the paint to catch up
       would swallow the tail of the gesture that finished the expansion. */
    if (target >= 1) unlock();
    paint();
  }

  /* ------------------------------------------------------------------------
     Lock / unlock

     `inert` on the lede is doing real work: while the hero is collapsed that
     block is at opacity 0 but still in the layout, so without it Tab would
     move focus to an invisible "Explore programmes" button.
     ------------------------------------------------------------------------ */
  function lock() {
    if (locked) return;
    locked = true;
    root.classList.add("sx-locked");
    section.classList.remove("is-expanded");
    if (lede) lede.inert = true;
    if (cue) cue.inert = false;
  }

  function unlock() {
    if (!locked) return;
    locked = false;
    root.classList.remove("sx-locked");
    section.classList.add("is-expanded");
    if (lede) lede.inert = false;
    if (cue) cue.inert = true;
  }

  /* ------------------------------------------------------------------------
     Input
     ------------------------------------------------------------------------ */

  /* Firefox reports wheel deltas in lines rather than pixels. */
  function wheelPixels(e) {
    return e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
  }

  function onWheel(e) {
    if (locked) {
      e.preventDefault();
      setTarget(target + wheelPixels(e) * WHEEL);
      return;
    }
    /* Scrolling back up past the top of the document re-engages the hero and
       plays the expansion backwards. The -8px floor keeps trackpad drift and
       momentum tails from snatching the page back on their own. */
    if (wheelPixels(e) < -8 && window.scrollY <= 0) {
      e.preventDefault();
      lock();
      setTarget(target + wheelPixels(e) * WHEEL);
    }
  }

  function onTouchStart(e) {
    touchY = e.touches[0].clientY;
  }

  function onTouchMove(e) {
    if (!touchY) return;
    var y = e.touches[0].clientY;
    var delta = touchY - y;

    if (locked) {
      e.preventDefault();
      setTarget(target + delta * TOUCH);
      touchY = y;
    } else if (delta < -14 && window.scrollY <= 0) {
      e.preventDefault();
      lock();
      setTarget(target + delta * TOUCH);
      touchY = y;
    }
  }

  function onTouchEnd() {
    touchY = 0;
  }

  function onKeyDown(e) {
    if (!locked) return;

    /* Never trap a keyboard user. Tab, Escape and End all finish the
       expansion outright — and Tab deliberately is not prevented, so focus
       carries on into a hero that is now visible and interactive. */
    if (e.key === "Tab" || e.key === "Escape" || e.key === "End") {
      setTarget(1);
      return;
    }

    if (e.key === "ArrowDown" || e.key === "PageDown" ||
        e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      setTarget(target + KEY);
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      setTarget(target - KEY);
    } else if (e.key === "Home") {
      e.preventDefault();
      setTarget(0);
    }
  }

  /* Backstop. html/body overflow is hidden while locked, but focus moves and
     anchor jumps can still shift the viewport in some browsers. */
  function onScroll() {
    if (locked && window.scrollY !== 0) window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------------------
     Start
     ------------------------------------------------------------------------ */
  section.classList.add("is-live");
  section.style.setProperty("--p", "0");

  /* A refresh part-way down the page would otherwise restore that offset and
     then get locked at it. */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  lock();

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("scroll", onScroll);

  if (cue) {
    cue.addEventListener("click", function () {
      setTarget(1);
    });
  }
})();
