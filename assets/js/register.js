/* ==========================================================================
   ForumMinds — register.js
   Populates the programme dropdown, validates the form, and shows the
   confirmation panel.

   ---------------------------------------------------------------------------
   SUBMISSIONS ARE LIVE (endpoint configured 2026-08-05)
   ---------------------------------------------------------------------------
   Registrations POST to the Formspree form below and arrive by email at the
   address that form is verified against (trainings@forumminds.com).

   contact.js posts to the SAME Formspree form, so both the registration form
   and the contact-page enquiry form land in one inbox. That is why each
   submission sets its own `_subject` before sending — without it the two are
   indistinguishable at a glance in the inbox. If they are ever split onto two
   Formspree forms, the _subject lines can stay as they are.

   Formspree's free tier allows 50 submissions per month across the form.
   If registrations start being missed, that limit is the first thing to check.

   IF THE ENDPOINT IS EVER CLEARED, the form falls back to MANUAL MODE: it
   opens the delegate's mail client with every answer prefilled and shows the
   #form-manual panel, which states plainly that nothing has been sent yet. It
   deliberately does NOT show the "Registration received" confirmation —
   telling someone we have their booking when no booking reached us is worse
   than having no form at all.
   ========================================================================== */

var ENDPOINT = "https://formspree.io/f/mbgrrqnz";

(function () {
  "use strict";

  var form = document.getElementById("register-form");
  if (!form) { return; }

  var alertBox = document.getElementById("form-alert");
  var alertList = document.getElementById("form-alert-list");
  var success = document.getElementById("form-success");
  var manual = document.getElementById("form-manual");
  var submitBtn = document.getElementById("form-submit");

  /* ------------------------------------------------------------------------
     Populate the programme dropdown from data/programmes.js
     ------------------------------------------------------------------------ */
  var select = document.getElementById("programme");

  if (select) {
    var scheduled = FM.upcoming();
    var undated = FM.programmes.filter(function (p) { return !p.startDate; });

    var html = '<option value="">Select a programme…</option>';

    if (scheduled.length) {
      html += '<optgroup label="Scheduled sessions">';
      html += scheduled.map(function (p) {
        return '<option value="' + FM.esc(p.slug) + '">' +
               FM.esc(p.title) + " — " + FM.esc(FM.dateRange(p)) +
               "</option>";
      }).join("");
      html += "</optgroup>";
    }

    if (undated.length) {
      html += '<optgroup label="Available on request">';
      html += undated.map(function (p) {
        return '<option value="' + FM.esc(p.slug) + '">' +
               FM.esc(p.title) + "</option>";
      }).join("");
      html += "</optgroup>";
    }

    html += '<optgroup label="Something else">' +
            '<option value="other">Another programme / not sure yet</option>' +
            "</optgroup>";

    select.innerHTML = html;

    /* Pre-select when arriving from a programme page via
       register.html?programme=<slug> */
    var wanted = new URLSearchParams(window.location.search).get("programme");
    if (wanted && FM.find(wanted)) {
      select.value = wanted;
      showProgrammeNote(FM.find(wanted));
    }

    select.addEventListener("change", function () {
      showProgrammeNote(FM.find(select.value));
    });
  }

  /* A small confirmation of what was selected, under the dropdown */
  function showProgrammeNote(p) {
    var note = document.getElementById("programme-note");
    if (!note) { return; }

    if (!p) {
      note.hidden = true;
      note.textContent = "";
      return;
    }

    var fmt = FM.format(p.format);
    var venue = FM.venueLabel(p);

    note.hidden = false;
    note.textContent = [
      FM.dateRange(p),
      p.days + " day" + (p.days === 1 ? "" : "s"),
      fmt ? fmt.name : p.format,
      venue
    ].filter(Boolean).join(" · ");
  }

  /* ------------------------------------------------------------------------
     Validation
     ------------------------------------------------------------------------ */
  var RULES = {
    fullname: { label: "Full name",
      test: function (v) { return v.trim().length >= 2; },
      msg: "Enter the delegate's full name." },

    jobtitle: { label: "Job title",
      test: function (v) { return v.trim().length >= 2; },
      msg: "Enter the delegate's job title." },

    company: { label: "Organisation",
      test: function (v) { return v.trim().length >= 2; },
      msg: "Enter your organisation's name." },

    email: { label: "Work email",
      test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      msg: "Enter a valid work email address, for example name@company.com." },

    phone: { label: "Phone",
      test: function (v) { return v.replace(/[^\d]/g, "").length >= 7; },
      msg: "Enter a contact number including the country code." },

    programme: { label: "Programme",
      test: function (v) { return v !== ""; },
      msg: "Choose which programme you are registering for." },

    delegates: { label: "Number of delegates",
      test: function (v) { return v !== "" && Number(v) >= 1 && Number(v) <= 500; },
      msg: "Enter how many delegates you are registering (1 or more)." }
  };

  function fieldError(name, message) {
    var input = form.elements[name];
    var err = document.getElementById("err-" + name);
    if (!input || !err) { return; }

    if (message) {
      input.setAttribute("aria-invalid", "true");
      err.textContent = message;
      err.classList.add("is-shown");
    } else {
      input.removeAttribute("aria-invalid");
      err.textContent = "";
      err.classList.remove("is-shown");
    }
  }

  function validateField(name) {
    var rule = RULES[name];
    var input = form.elements[name];
    if (!rule || !input) { return true; }

    var ok = rule.test(input.value);
    fieldError(name, ok ? null : rule.msg);
    return ok;
  }

  function validateAll() {
    var failed = [];
    Object.keys(RULES).forEach(function (name) {
      if (!validateField(name)) {
        failed.push({ name: name, label: RULES[name].label });
      }
    });
    return failed;
  }

  /* Re-validate a field once it has been corrected, but only after the user
     has left it — validating on every keystroke is hostile. */
  Object.keys(RULES).forEach(function (name) {
    var input = form.elements[name];
    if (!input) { return; }

    input.addEventListener("blur", function () {
      if (input.value !== "") { validateField(name); }
    });

    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true") { validateField(name); }
    });
  });

  /* ------------------------------------------------------------------------
     Submit
     ------------------------------------------------------------------------ */
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var failed = validateAll();

    if (failed.length) {
      alertList.innerHTML = failed.map(function (f) {
        return '<li><a href="#' + f.name + '">' + FM.esc(f.label) + "</a></li>";
      }).join("");
      alertBox.classList.add("is-shown");
      alertBox.focus();
      alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    alertBox.classList.remove("is-shown");

    if (!ENDPOINT) {
      /* Manual mode — no backend configured. Hand off to email rather than
         claiming a submission that never happened. See the note at the top. */
      handOffToEmail();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    /* The raw form posts the programme SLUG ("strategic-hr"), because that is
       what the <option> values carry. Sent as-is, the notification email reads
       "programme: strategic-hr" with no dates and no venue, and someone has to
       go and look it up. These extra fields resolve it to the real title and
       schedule at submit time, so the email is readable on its own.

       Underscore-prefixed names are Formspree's own: _subject sets the email
       subject line. Everything else just appears as a labelled row. */
    var data = new FormData(form);
    var chosen = FM.find(form.elements.programme.value);

    data.append("_subject",
      "Registration — " + (chosen ? chosen.title : "programme to be confirmed"));

    /* Makes Reply in the notification email go to the delegate rather than to
       Formspree, so a quotation can be sent straight back. */
    data.append("_replyto", form.elements.email.value.trim());

    if (chosen) {
      data.append("Programme title", chosen.title);
      data.append("Programme dates", FM.dateRange(chosen));
      data.append("Programme venue", chosen.venue +
        (FM.venueIsProposed(chosen) ? " (proposed)" : ""));
    }

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: data
    })
      .then(function (res) {
        if (!res.ok) { throw new Error("Request failed: " + res.status); }
        confirmSuccess();
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit registration";
        alertList.innerHTML =
          "<li>We could not send your registration just now. Please email " +
          '<a href="mailto:trainings@forumminds.com">trainings@forumminds.com</a> ' +
          "and we will pick it up from there.</li>";
        alertBox.classList.add("is-shown");
        alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
      });
  });

  /* ------------------------------------------------------------------------
     Confirmation
     ------------------------------------------------------------------------ */
  function confirmSuccess() {
    var p = FM.find(form.elements.programme.value);

    document.getElementById("recap-programme").textContent =
      p ? p.title : "To be confirmed";

    document.getElementById("recap-dates").textContent =
      p ? FM.dateRange(p) + " · " + p.venue : "We will be in touch to agree dates";

    document.getElementById("recap-delegates").textContent =
      form.elements.delegates.value +
      " delegate" + (Number(form.elements.delegates.value) === 1 ? "" : "s");

    document.getElementById("recap-email").textContent =
      form.elements.email.value.trim();

    reveal(success);
  }

  /* ------------------------------------------------------------------------
     Manual handoff (no ENDPOINT configured)

     Builds a plain-text email carrying every answer, opens the delegate's
     mail client with it, and shows the #form-manual panel. The panel says
     outright that nothing has been sent yet, so a delegate whose machine has
     no mail client still learns the truth and is given the address.
     ------------------------------------------------------------------------ */
  function handOffToEmail() {
    var p = FM.find(form.elements.programme.value);
    var delivery = form.querySelector('input[name="delivery"]:checked');

    document.getElementById("manual-programme").textContent =
      p ? p.title : "To be confirmed";
    document.getElementById("manual-dates").textContent =
      p ? FM.dateRange(p) + " · " + p.venue : "To be agreed";
    document.getElementById("manual-delegates").textContent =
      form.elements.delegates.value +
      " delegate" + (Number(form.elements.delegates.value) === 1 ? "" : "s");

    /* Labels here are for a human reading the email, not for the DOM, so they
       are written out rather than scraped from the <label> elements. */
    var lines = [
      ["Name", val("fullname")],
      ["Job title", val("jobtitle")],
      ["Organisation", val("company")],
      ["Industry", val("industry")],
      ["Email", val("email")],
      ["Phone", val("phone")],
      ["Country", val("country")],
      ["", ""],
      ["Programme", p ? p.title : form.elements.programme.value],
      ["Dates", p ? FM.dateRange(p) : "To be agreed"],
      ["Venue", p ? p.venue : "To be agreed"],
      ["Delegates", val("delegates")],
      ["Delivery format", delivery ? delivery.value : ""],
      ["", ""],
      ["Notes", val("notes")]
    ];

    var body = "Registration request from the ForumMinds website.\n\n" +
      lines.map(function (row) {
        if (!row[0]) { return ""; }
        return row[0] + ": " + (row[1] || "—");
      }).join("\n");

    var subject = "Registration — " + (p ? p.title : "ForumMinds programme");

    var href = "mailto:trainings@forumminds.com" +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);

    document.getElementById("manual-mailto").setAttribute("href", href);

    reveal(manual);

    /* Opening the client is a convenience, not the mechanism — the panel and
       its button work regardless of whether this does anything. */
    window.location.href = href;
  }

  function val(name) {
    var el = form.elements[name];
    return el ? String(el.value).trim() : "";
  }

  function reveal(panel) {
    form.hidden = true;
    panel.classList.add("is-shown");
    panel.setAttribute("tabindex", "-1");
    panel.focus();
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
})();
