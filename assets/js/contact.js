/* ==========================================================================
   ForumMinds — contact.js
   Validates the enquiry form on contact.html and either submits it or hands
   it off to email.

   ---------------------------------------------------------------------------
   SUBMISSIONS ARE LIVE (own Formspree form since 2026-08-05)
   ---------------------------------------------------------------------------
   This has its OWN Formspree form, separate from register.js's. The two
   started out sharing one form; this was split off so registrations and
   general enquiries land as distinct entries in Formspree's dashboard rather
   than one shared 50-per-month quota. Both still land in the same inbox
   (trainings@forumminds.com), and each submission still sets its own
   `_subject` ("Enquiry — <topic>") so they read clearly there too.

   IF THE ENDPOINT IS EVER CLEARED, the form falls back to MANUAL MODE: it
   opens the visitor's mail client with the message prefilled and says plainly
   that nothing has been sent yet. It never claims an enquiry was received when
   none was.
   ========================================================================== */

var CONTACT_ENDPOINT = "https://formspree.io/f/xwleeyvo";

(function () {
  "use strict";

  var form = document.getElementById("contact-form");
  if (!form) { return; }

  var alertBox  = document.getElementById("contact-alert");
  var alertList = document.getElementById("contact-alert-list");
  var success   = document.getElementById("contact-success");
  var manual    = document.getElementById("contact-manual");
  var submitBtn = document.getElementById("contact-submit");

  /* ------------------------------------------------------------------------
     The two cards at the top of the page jump down here. Each carries a
     data-topic, so arriving from "Request a Consultation" lands on a form
     that has already answered its own first question.
     ------------------------------------------------------------------------ */
  Array.prototype.forEach.call(
    document.querySelectorAll('a[href="#enquiry"][data-topic]'),
    function (link) {
      link.addEventListener("click", function () {
        var topic = link.getAttribute("data-topic");
        var select = form.elements.topic;
        /* Only if the option really exists — a typo in the markup should not
           leave the select on a value the form cannot validate. */
        for (var i = 0; i < select.options.length; i++) {
          if (select.options[i].value === topic || select.options[i].text === topic) {
            select.selectedIndex = i;
            return;
          }
        }
      });
    }
  );

  /* ------------------------------------------------------------------------
     Validation. Same shape as register.js — only the required fields are
     listed, so organisation and phone stay genuinely optional.
     ------------------------------------------------------------------------ */
  var RULES = {
    name: { label: "Your name",
      test: function (v) { return v.trim().length >= 2; },
      msg: "Enter your name." },

    email: { label: "Work email",
      test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      msg: "Enter a valid email address, for example name@company.com." },

    topic: { label: "Topic",
      test: function (v) { return v !== ""; },
      msg: "Choose what your enquiry is about." },

    message: { label: "Your message",
      test: function (v) { return v.trim().length >= 10; },
      msg: "Tell us a little more — at least a sentence." }
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

  /* Validate on blur, then live once a field is already marked invalid —
     validating on every keystroke from the start is hostile. */
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

    var failed = [];
    Object.keys(RULES).forEach(function (name) {
      if (!validateField(name)) { failed.push({ name: name, label: RULES[name].label }); }
    });

    if (failed.length) {
      alertList.innerHTML = failed.map(function (f) {
        var id = form.elements[f.name].id;
        return '<li><a href="#' + id + '">' + esc(f.label) + "</a></li>";
      }).join("");
      alertBox.classList.add("is-shown");
      alertBox.focus();
      alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    alertBox.classList.remove("is-shown");

    if (!CONTACT_ENDPOINT) {
      handOffToEmail();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    /* _subject is Formspree's own field — it sets the email subject line, so
       an enquiry is distinguishable from a registration in a shared inbox.
       _replyto makes Reply go to the visitor rather than to Formspree. */
    var data = new FormData(form);
    data.append("_subject", "Enquiry — " + (val("topic") || "ForumMinds website"));
    data.append("_replyto", val("email"));

    fetch(CONTACT_ENDPOINT, {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: data
    })
      .then(function (res) {
        if (!res.ok) { throw new Error("Request failed: " + res.status); }
        reveal(success);
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send enquiry <span class="arw" aria-hidden="true">&rarr;</span>';
        alertList.innerHTML =
          "<li>We could not send your message just now. Please email " +
          '<a href="mailto:trainings@forumminds.com">trainings@forumminds.com</a> ' +
          "and we will pick it up from there.</li>";
        alertBox.classList.add("is-shown");
        alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
      });
  });

  /* ------------------------------------------------------------------------
     Manual handoff (no CONTACT_ENDPOINT configured)
     ------------------------------------------------------------------------ */
  function handOffToEmail() {
    var body = "Enquiry from the ForumMinds website.\n\n" +
      "Name: "         + val("name") + "\n" +
      "Email: "        + val("email") + "\n" +
      "Organisation: " + (val("company") || "—") + "\n" +
      "Phone: "        + (val("phone") || "—") + "\n" +
      "Topic: "        + val("topic") + "\n\n" +
      "Message:\n"     + val("message");

    var href = "mailto:trainings@forumminds.com" +
      "?subject=" + encodeURIComponent("Enquiry — " + val("topic")) +
      "&body="    + encodeURIComponent(body);

    document.getElementById("contact-mailto").setAttribute("href", href);

    reveal(manual);

    /* Convenience only — the panel and its button work either way. */
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

  /* A local copy of FM.esc rather than a call to it: this form has nothing to
     do with programme data, and contact.js should not stop working if
     programmes.js is ever dropped from this page. Only the field labels above
     pass through it, but they get escaped rather than trusted. */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
