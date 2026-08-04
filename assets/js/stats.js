/* ==========================================================================
   ForumMinds — stats.js
   Two enhancements for the stat cards: the numbers count up once when the
   row scrolls into view, and a soft gold spotlight follows the cursor inside
   each card.

   Both are strictly additive. The real figures are already in the markup, so
   with this file removed the cards render exactly as they look when the
   animation finishes. Nothing here creates content.

   THE NUMBERS ARE NOT CONFIGURED HERE
   Targets are read out of the DOM, so editing a figure in the HTML is the
   only edit needed — there is no list to keep in step. Whatever formatting
   the markup uses is reproduced: "2,500+" counts up grouped and keeps its
   plus, "20+" counts up ungrouped.

   Loads on index.html and about.html, after site.js.
   ========================================================================== */

(function () {
  "use strict";

  var rows = document.querySelectorAll(".stats");
  if (!rows.length) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var items = [];
  Array.prototype.forEach.call(rows, function (row) {
    Array.prototype.push.apply(items, row.querySelectorAll(".stats__item"));
  });

  /* ------------------------------------------------------------------------
     Count up

     Splits "2,500+" into the parts that do not change (a possible prefix and
     suffix) and the part that does. `grouped` records whether the source
     actually used thousands separators — reproducing that rather than always
     calling toLocaleString is what stops a figure written "1500" from
     silently becoming "1,500" at the end of the animation.
     ------------------------------------------------------------------------ */
  function parse(el) {
    var match = /^(\D*?)([\d][\d,]*)(.*)$/.exec(el.textContent.trim());
    if (!match) return null;
    return {
      el: el,
      prefix: match[1],
      suffix: match[3],
      grouped: match[2].indexOf(",") !== -1,
      target: Number(match[2].replace(/,/g, ""))
    };
  }

  function write(spec, value) {
    var n = spec.grouped ? value.toLocaleString("en-US") : String(value);
    spec.el.textContent = spec.prefix + n + spec.suffix;
  }

  /* Decelerating, so it lands softly instead of stopping dead. */
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  var DURATION = 1500;
  var STAGGER = 110;

  function countUp(spec, delay) {
    var start = null;

    function step(now) {
      if (start === null) start = now;
      var elapsed = now - start - delay;

      if (elapsed <= 0) { window.requestAnimationFrame(step); return; }

      var t = Math.min(elapsed / DURATION, 1);
      write(spec, Math.round(easeOutExpo(t) * spec.target));

      if (t < 1) window.requestAnimationFrame(step);
      /* The final write above is exact: easeOutExpo(1) is 1, so the last
         frame always lands on the parsed target rather than near it. */
    }

    window.requestAnimationFrame(step);
  }

  var specs = [];
  Array.prototype.forEach.call(rows, function (row) {
    var group = [];
    Array.prototype.forEach.call(row.querySelectorAll(".stats__n"), function (el) {
      var spec = parse(el);
      if (spec) group.push(spec);
    });
    if (group.length) specs.push(group);
  });

  if (!reduced && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        /* Once only. */
        observer.unobserve(entry.target);
        var group = entry.target.__statSpecs;
        group.forEach(function (spec, i) { countUp(spec, i * STAGGER); });
      });
    }, { threshold: 0.35 });

    specs.forEach(function (group, i) {
      var row = rows[i];
      row.__statSpecs = group;
      /* Zero them only now, immediately before observing. Doing it any
         earlier risks the real figures being visible and then snapping back
         to zero if the browser paints in between. */
      group.forEach(function (spec) { write(spec, 0); });
      observer.observe(row);
    });
  }

  /* ------------------------------------------------------------------------
     Cursor spotlight

     Skipped entirely without a fine pointer — there is no cursor to follow on
     a touchscreen, and the element would just sit there costing a layer.

     The pointer position is stored on move and read on the next frame, so
     several events inside one frame collapse into a single write. The
     getBoundingClientRect call is deliberately inside the frame callback for
     the same reason: one layout read per frame, not one per event.
     ------------------------------------------------------------------------ */
  if (finePointer && !reduced) {
    items.forEach(function (item) {
      var spot = document.createElement("span");
      spot.className = "stats__spot";
      spot.setAttribute("aria-hidden", "true");
      item.appendChild(spot);

      var frame = 0;
      var clientX = 0;
      var clientY = 0;

      item.addEventListener("pointermove", function (e) {
        clientX = e.clientX;
        clientY = e.clientY;
        if (frame) return;
        frame = window.requestAnimationFrame(function () {
          frame = 0;
          var rect = item.getBoundingClientRect();
          spot.style.transform =
            "translate3d(" + (clientX - rect.left) + "px," +
                             (clientY - rect.top) + "px,0)";
        });
      });

      item.addEventListener("pointerleave", function () {
        if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
      });
    });
  }
})();
