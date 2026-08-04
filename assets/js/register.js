/* ==========================================================================
   ForumMinds — register.js
   Populates the programme dropdown, validates the form, and shows the
   confirmation panel.

   ---------------------------------------------------------------------------
   IMPORTANT — REGISTRATIONS ARE NOT BEING EMAILED YET
   ---------------------------------------------------------------------------
   The form validates fully and confirms to the delegate, but nothing is sent
   anywhere. To start receiving registrations by email:

     1. Create a free form at https://formspree.io or https://web3forms.com
     2. Copy the endpoint URL they give you.
     3. Paste it into ENDPOINT below, replacing the empty string.

   That single change switches the form from demo mode to live. The submit
   handler already does the fetch, the error handling and the success state.
   ========================================================================== */

var ENDPOINT = "";   /* <-- paste your Formspree / Web3Forms URL here */

(function () {
  "use strict";

  var form = document.getElementById("register-form");
  if (!form) { return; }

  var alertBox = document.getElementById("form-alert");
  var alertList = document.getElementById("form-alert-list");
  var success = document.getElementById("form-success");
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
      /* Demo mode — no backend configured yet. See the note at the top. */
      confirmSuccess();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: new FormData(form)
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

    form.hidden = true;
    success.classList.add("is-shown");
    success.setAttribute("tabindex", "-1");
    success.focus();
    success.scrollIntoView({ behavior: "smooth", block: "start" });
  }
})();
