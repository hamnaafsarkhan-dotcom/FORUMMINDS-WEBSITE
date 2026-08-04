/* ==========================================================================
   ForumMinds — programme-page.js
   Powers the 9 programme detail pages.

   The written content on those pages (overview, objectives, agenda) is real
   HTML in the page itself, so it is indexable and readable without
   JavaScript. Everything factual that also appears elsewhere on the site —
   dates, duration, format, venue, level, fee — is injected from
   data/programmes.js instead, so a detail page can never disagree with the
   calendar or the catalogue.

   The page identifies itself with:  <body data-programme="piping-vibration">
   ========================================================================== */

(function () {
  "use strict";

  var slug = document.body.getAttribute("data-programme");
  if (!slug || typeof FM === "undefined") { return; }

  var p = FM.find(slug);

  if (!p) {
    /* The slug in the page does not match anything in programmes.js. Say so
       loudly in the console rather than silently rendering a broken page. */
    if (window.console) {
      console.error('programme-page.js: no programme with slug "' + slug +
                    '" in data/programmes.js');
    }
    return;
  }

  var fmt = FM.format(p.format);
  var fmtName = fmt ? fmt.name : p.format;

  /* ------------------------------------------------------------------------
     Hero meta line
     ------------------------------------------------------------------------ */
  var meta = document.getElementById("prog-meta");

  if (meta) {
    var bits = [
      FM.dateRange(p),
      p.days + " day" + (p.days === 1 ? "" : "s"),
      fmtName,
      FM.venueLabel(p),   /* null when it would just repeat the format */
      p.level
    ];
    meta.innerHTML = bits.filter(Boolean).map(function (b) {
      return "<span>" + FM.esc(b) + "</span>";
    }).join("");
  }

  /* ------------------------------------------------------------------------
     Enrolment panel
     ------------------------------------------------------------------------ */
  var enrol = document.getElementById("enrol");

  if (enrol) {
    var venue = FM.venueLabel(p);

    /* City venues are proposals, not bookings — say so where the venue is
       stated, rather than letting the row read as a confirmed fact. */
    var venueProposed = FM.venueIsProposed(p);
    var venueText = venue + (venueProposed ? " (proposed)" : "");

    var spec = [
      ["Dates", FM.dateRange(p)],
      ["Duration", p.days + " day" + (p.days === 1 ? "" : "s")],
      ["Format", fmtName],
      /* Venue is dropped when it only repeats the format, e.g. Live Online */
      venue ? ["Venue", venueText] : null,
      ["Level", p.level],
      ["Facilitator", p.trainer],
      ["Fee", p.fee]
    ].filter(Boolean);

    enrol.innerHTML =
      '<div class="enrol__head">' +
        '<span class="eyebrow">' +
          (p.startDate ? "Next session" : "Available on request") + "</span>" +
        '<span class="enrol__dates">' + FM.esc(FM.dateRange(p)) + "</span>" +
      "</div>" +
      '<div class="enrol__body">' +
        '<ul class="enrol__spec">' +
          spec.map(function (r) {
            return "<li><span class=\"k\">" + FM.esc(r[0]) + "</span>" +
                   "<span class=\"v\">" + FM.esc(r[1]) + "</span></li>";
          }).join("") +
        "</ul>" +
        '<a class="btn btn--primary btn--block" href="register.html?programme=' +
          encodeURIComponent(p.slug) + '">Register for this programme ' +
          '<span class="arw" aria-hidden="true">&rarr;</span></a>' +
        '<p class="enrol__note">No payment is taken online. We confirm availability ' +
          'and send a written quotation before anything is booked.</p>' +
        (venueProposed
          ? '<p class="enrol__note enrol__note--flag">The city shown is the ' +
            'proposed location. The exact venue is confirmed in writing before ' +
            'booking, and we will tell you if it changes.</p>'
          : "") +
        '<a class="btn btn--ghost btn--block" style="margin-top:0.75rem" ' +
          'href="contact.html">Ask a question</a>' +
      "</div>";
  }

  /* ------------------------------------------------------------------------
     Related programmes — same practice area, this one excluded
     ------------------------------------------------------------------------ */
  var related = document.getElementById("related");

  if (related) {
    var siblings = [];
    var seen = {};

    p.category.forEach(function (catId) {
      FM.byCategory(catId).forEach(function (other) {
        if (other.slug !== p.slug && !seen[other.slug]) {
          seen[other.slug] = true;
          siblings.push(other);
        }
      });
    });

    /* Nothing else in this discipline yet — fall back to what is coming up
       next, so the section never renders empty. */
    if (!siblings.length) {
      siblings = FM.upcoming(3).filter(function (o) { return o.slug !== p.slug; });
    }

    FMDocket.render(related, FM.sorted(siblings).slice(0, 4));
  }

  /* ------------------------------------------------------------------------
     Page title and description already exist in the HTML. Only the document
     title gets the dates appended, so a browser tab or a shared link carries
     the schedule with it.
     ------------------------------------------------------------------------ */
  if (p.startDate) {
    document.title = p.title + " — " + FM.dateRange(p) + " — ForumMinds";
  }

  /* ------------------------------------------------------------------------
     Course structured data

     Built from programmes.js rather than written into each page, for the same
     reason the facts above are: a hand-maintained copy would eventually
     disagree with the calendar. Google reads JSON-LD that JavaScript injects.

     Deliberately omitted: `offers`, because every fee is still "On request" —
     a price field with no price in it is worse than no price field. Add it
     here once real pricing exists. `location` names the city only, since the
     venue is proposed rather than booked (see FM.venueIsProposed).
     ------------------------------------------------------------------------ */
  var course = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": p.title,
    "description": p.summary,
    "url": "https://forumminds.com/" + (p.url || "register.html"),
    "provider": {
      "@type": "Organization",
      "name": "ForumMinds",
      "url": "https://forumminds.com/"
    },
    "educationalLevel": p.level,
    "inLanguage": "en"
  };

  if (p.image) {
    course.image = "https://forumminds.com/" + p.image;
  }

  if (p.startDate) {
    var mode = p.format === "online" ? "online"
             : p.format === "in-house" ? "onsite"
             : "onsite";

    var instance = {
      "@type": "CourseInstance",
      "courseMode": mode,
      "startDate": p.startDate,
      "endDate": p.endDate || p.startDate,
      "courseWorkload": "P" + p.days + "D"
    };

    var where = FM.venueLabel(p);
    if (where) {
      instance.location = { "@type": "Place", "name": where };
    }

    course.hasCourseInstance = instance;
  }

  var ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify(course, null, 2);
  document.head.appendChild(ld);
})();
