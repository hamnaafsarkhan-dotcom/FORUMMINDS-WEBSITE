# ForumMinds Website — Handoff

Static marketing site for **ForumMinds**, a corporate training provider headquartered in Karachi, selling into the Gulf/Middle East. It replaces forumminds.com, an old WordPress LMS theme whose demo content had leaked into production (course URLs like `nutrition-masterclass`, trainers listed as `admin`, a two-day course showing "96 hours").

Build started 2026-07-29. Plain HTML/CSS/JS, **no build step, no npm, no framework**. Every file is edited and opened directly.

**A git repository now exists** (initialized 2026-08-04, local only, nothing pushed anywhere). The first commit, `89aff97`, is the site exactly as it stood at the pre-launch audit, *before* any of the audit fixes — so every deleted file is recoverable with `git checkout 89aff97 -- <path>`, including the 40MB of photography removed in §6.

---

## 1. How to work on this site

- Open any `.html` file directly in a browser (`file://`) — nothing needs a server. If you add fetch-based features later, you'll need `python -m http.server` or similar because `file://` blocks fetch.
- **Exception: `register.html`'s form can only be submitted on the deployed site** — see §5.1c. It posts to Netlify Forms, which only exists once Netlify has published the page, so a submit from `file://` or a local static server will always fail into the "could not send" panel. Everything else on the page — the dropdown, the validation, the error summary — works locally.
- Git is initialized locally on branch `main`, remote `origin` → `github.com/hamnaafsarkhan-dotcom/FORUMMINDS-WEBSITE`.
- There is **no package.json, no bundler, no linter**. Don't introduce one unless asked — that's a deliberate constraint (Hamna doesn't want a build step to maintain).
- **Image work has no CLI tooling here.** There is no ImageMagick, no Node, no working Python in this environment. Resizing and re-encoding was done with PowerShell + `System.Drawing`, and WebP decoding needs `PresentationCore`'s WIC decoder instead (`System.Drawing` cannot read WebP at all). Working scripts are described in §10.

---

## 2. Project structure

```
index.html                          Home page
about.html                          About ForumMinds
contact.html                        Contact page (has #talk section, see _talk2.html below)
programmes.html                     All-programmes listing
register.html                       Registration form (UI only — see §5)
training-schedule.html              THE TRAINING SCHEDULE — the site's signature interactive
                                     page. Calendar view + Schedule view behind a segmented
                                     control, both rendered from one filtered list. See §8.
calendar.html                       Redirect stub only. The page moved to
                                     training-schedule.html when the "Calendar" nav item was
                                     renamed; this file exists so old bookmarks and printed
                                     links still land somewhere. Carries noindex + an absolute
                                     canonical, and is excluded from sitemap.xml and robots.txt.
                                     Safe to delete if you add a 301 at the host instead.

register-handler.php                Backend for register.html: validates the POST server-side
                                     and appends a backup row to registrations.csv. See §5.1.
registrations.csv                   Backup of every registration, written by register-handler.php.
                                     Gitignored (delegate PII) and blocked from direct web access
                                     by .htaccess. Does not exist until the first live submission.
.htaccess                           Denies direct requests to registrations.csv.

robots.txt                          Allows everything except the calendar.html stub; points
                                     at the sitemap.
sitemap.xml                         All 26 real pages with priorities. NOT generated at build
                                     time (there is no build) — regenerate it by hand when you
                                     add or remove a page, or it will quietly go stale.
favicon.ico                         Root-level icon. Browsers request /favicon.ico regardless
                                     of what the <link> tags say, so it lives here rather than
                                     in assets/. See §9.
training-formats.html               Explains Live Online / In-Person / In-House
category-*.html   (10 files)        One page per training category (leadership, ai, oil-gas,
                                     engineering-tech, financial-management, supply-chain, hr,
                                     office-administration, esg, contract-management)
programme-*.html  (9 files)         One detail page per scheduled programme
_talk2.html                         DEV SCRATCH TOOL, not a site page — loads contact.html in an
                                     iframe, strips animations/transitions, and force-reveals the
                                     #talk section so it can be inspected/screenshotted without
                                     waiting on scroll-triggered reveal animations. Safe to delete
                                     if you don't need to preview that section this way; harmless
                                     to leave.

data/
  programmes.js                     SINGLE SOURCE OF TRUTH. Defines CATEGORIES, FORMATS, and
                                     PROGRAMMES arrays, plus an FM helper object (sort, filter,
                                     date formatting, escaping) used by every page that lists,
                                     filters, or calendars a programme. Extensive comments at the
                                     top of the file explain how to add a new programme.

assets/
  css/main.css                      Single stylesheet for the entire site (~5,000 lines). All
                                     colour/type/spacing tokens live in one :root block at the top
                                     — nothing else in the file hardcodes a colour. See §4.
                                     Section 18 is the whole training schedule, prefixed .ts.
  img/                              about.jpg, formats.jpg (page-head photos)
    hero-home.jpg  hero-home-sm.jpg     The homepage hero photograph, at 1672px and 900px.
                                     Re-exported from the old 1.4MB PNG at 96KB / 40KB. CSS
                                     serves the small one by default and the large one above
                                     40rem — see the comment on .hero::before in main.css.
    upcoming-feature.jpg  -sm.jpg   Same treatment for the "upcoming programmes" panel photo.
    band-texture.jpg                The blurred band texture (was images/next to hero.jpg).
                                     Still a 612x408 source used at ~1400 wide — see §5.
    og-forumminds.jpg               1200x630 social share card, generated from the hero photo
                                     plus the reversed logo. Referenced by every page's
                                     og:image and twitter:image.
    favicon-512.png                 The "O" mark on a navy plate, cropped from the master
    apple-touch-icon.png             artwork. See §9.
    logo-forumminds.png             THE BRAND LOGO — full colour, used in the header of every
                                     page. Hamna's finalized artwork, supplied as
                                     images/Logo.png (8311x1084) and resampled to 1288x168 for
                                     the web. Nothing about the artwork was changed. See §9.
    logo-forumminds-white.png       Reversed (white-on-transparent) copy of the same file, used
                                     in the footer only, where the footer's dark background would
                                     otherwise make the navy wordmark invisible. Generated by an
                                     automated colour swap (navy -> white, gold arc untouched) —
                                     replace with a designer-supplied reversed file if one ever
                                     turns up. See §9.
  img/programmes/                   One landscape photograph per programme, named by slug, used
                                     by the training schedule's featured panel. All CC0 stock —
                                     see CREDITS.txt in that folder for the licence record and
                                     the replacement spec. All nine are 960x640 JPEG at q80,
                                     45–141KB. If you drop a replacement in, re-encode it —
                                     the originals averaged 340KB for the same pixels.
  js/
    site.js                         Global: nav, header behaviour, shared interactions
    programmes-render.js            Renders programme cards/listings from data/programmes.js
    programme-page.js                Populates a single programme-*.html detail page
    training-schedule.js            Training schedule: segmented control, month calendar,
                                     featured panel, schedule list, filters, counters
    register.js                     Registration form — validation + submission (see §5)
    contact.js                      Enquiry form on contact.html — validation + submission.
                                     Mirrors register.js, including its ENDPOINT switch (see §5)
    disciplines.js, journey.js, why.js, stats.js, upcoming.js, delivery.js, talk.js,
    logo-wall.js, scroll-expand-hero.js   Page-specific widgets/sections

images/                             Now holds ONE file: Logo.png, the untouched 8311x1084 master
                                     artwork (§9). It is not referenced by any page — it is kept
                                     as the source of truth for re-exporting the logo, and is
                                     small enough (142KB) not to matter. Everything else that
                                     was in here was unreferenced and has been removed (§6).

logos/                              Client/partner logos for the logo wall (ADNOC, Baker Hughes,
                                     DEWA, DP World, Emirates, Petroleum Development Corp,
                                     Qatar Airways, SABIC, Saudi Aramco, Schneider Electric,
                                     Siemens) — all SVG.
```

---

## 3. Completed work

- All 27 real pages built and cross-linked: home, about, contact, programmes listing, register, training schedule, training-formats, 10 category pages, 9 programme detail pages.
- `data/programmes.js` fully populated with 9 real programmes (titles, dates, categories, formats, levels, summaries) taken from forumminds.com, with one (`ai-ready-critical-thinking`) intentionally left undated pending a real schedule.
- Home page, category pages, and the training schedule all render dynamically from `data/programmes.js` — confirmed no page hardcodes programme data that would drift out of sync.
- **Training schedule page built (2026-08-01)** and the nav item renamed from "Calendar" to "Training Schedule" across every page — see §8.
- Full design system built in `assets/css/main.css`: colour palette derived from the ForumMinds logo (navy `--accent`/`--deep` + gold `--gold`, with accessibility contrast ratios documented inline), fluid type scale, spacing scale, shared header/footer across all pages.
- Hero section on `index.html` uses a distinct typeface pair (Playfair Display / Inter) loaded only on that page, with a documented one-line rollback to the site-wide pair (Newsreader/Archivo) if the four-typeface footprint becomes a problem.
- Registration form (`register.html` + `assets/js/register.js`) fully built: dropdown populated from programmes data, client-side validation, success/error states — everything except actually sending the submission anywhere (see §5).

---

## 4. Design decisions & conventions

**Design decision-making pattern:** Hamna consistently defers visual/technical choices ("whatever suits best", "choose yourself") and directs instead by reference (an existing site, a Dribbble link, "take inspiration from gpstrategies.com"). Established working pattern: pick the option, state the reasoning in a sentence or two, build it, and show a render — don't present multiple-choice design questions. Do still ask Hamna directly about anything only they can know: real programme dates, venues, fees, trainer names, brand assets.

**Colour system** (`assets/css/main.css` `:root` block):
- `--gold` (#C9A227) / `--gold-bright` / `--gold-tint` — accents, marks, active states, dark-surface text. Gold is only 2.3:1 on white, so **never use it as text colour on a light background** — use `--accent` instead.
- `--accent` (#14395F) — coloured text/fills on light backgrounds, AA-passing both directions.
- **`--surface-1` … `--surface-7`** — the near-white ramp, added 2026-08-08. Eight light gradients across the file were each hand-mixed from their own near-white stops (twenty-odd values within a few units of each other and of `--paper`). They are now steps on one named ramp. `--surface-3` is the same value as `--paper`. Nothing moved by more than 2/255 in the conversion — verified by pixel-diffing every page, see §11.
- **`--gold-lift` / `-hi` / `-mid` / `-deep` / `-deeper` / `-hover`** plus **`--fill-gold`** and **`--fill-gold-hover`** — the gold gradient fills. Both gradients had been written out twice in the file; they are now one token each.
- **`--dlv-cool-*` / `--dlv-neut-*` / `--dlv-warm-*`** — three deliberately different hues that colour-code the delivery-format panels. They are a set: change one and the other two must move with it or the coding breaks.
- **`--success` / `--danger-tint` / `--notice-tint`** — pale status washes. None of them is safe to set type in; `--danger` is the text colour.
- **`--slate-soft` was #75849A and is now #5F6C7D** (2026-08-08). The old value failed WCAG AA everywhere it was used: its note said "use at 14px+ only", but WCAG's 3:1 allowance is for *large* text, meaning 24px regular or 18.66px bold — not 14px. All 34 usages set 14px or 12px, so all of them needed 4.5:1 and got 3.8:1 on white. The new value is the smallest darkening that clears 4.5:1 against every surface in the ramp (4.5:1 on the darkest, 5.3:1 on white), with hue unchanged. A measured contrast table for the whole ramp is in the `:root` block.

  **This is the one change in that pass that is visible** — captions and metadata are slightly darker. Everything else was imperceptible by construction.
- `--hero-navy` / `--hero-gold` / `--hero-gold-dark` — a deliberately distinct, slightly warmer palette used **only** in the hero brief. Read the comment at `assets/css/main.css` line ~33 before reusing these elsewhere — they're close enough to the main tokens to read as a mismatch where the two meet (e.g. hero button next to header Register button). If you'd rather unify to one gold, the file documents the exact one-line change (`--gold: #D9A441`, delete `--hero-gold`).
- Full palette also has dark surfaces (`--deep`, `--deep-2`, `--deep-line`) and light surfaces/text (`--ink`, `--slate`, `--slate-soft`, `--paper`, `--white`, `--line`).

**Typography:** `--display` (Newsreader) for headings, `--sans` (Archivo) for body, site-wide. Hero-only pair `--hero-serif` (Playfair Display) / `--hero-sans` (Inter) loaded solely on `index.html`.

**Layout tokens:** fluid `clamp()`-based type scale (`--t-hero` through `--t-micro`) and spacing scale (`--gutter`, `--section-y`), `--max: 1240px` content width, `--radius`/`--radius-lg` for corners.

**Coding conventions observed in the codebase — follow these when extending it:**
- Every page shares the same header/footer markup; a comment at the top of `index.html`'s header block says "change it, change it everywhere" — there's no templating, so shared-markup edits must be applied to all 27 files by hand (or scripted).
- `main.css` is deliberately one file, not split per page/component.
- JS files are one per feature/widget, IIFE-wrapped, vanilla JS (no framework, no jQuery).
- Comments in code lean toward explaining *why* (accessibility ratios, browser quirks, ordering constraints) rather than *what*.

---

## 5. Pending / not yet real

1. **~~No form endpoint~~ — RESOLVED 2026-08-05, registration re-pointed at Netlify Forms 2026-08-17.**

   > **⚠️ Read §5.1c first.** The site is deployed on Netlify, which serves static files and will not run PHP, so **`register-handler.php` is no longer called by anything.** The rest of this section describes the PHP path as it was built and verified; all of it still holds if the handler is ever put back on a PHP host, but it is not what runs today. `contact.html` is unaffected — Formspree is a third-party endpoint and works fine on Netlify.

   `register.html` and `contact.html` use two different mechanisms:

   - **`assets/js/contact.js`** → still Formspree, `var CONTACT_ENDPOINT = "https://formspree.io/f/xwleeyvo"`. Submissions arrive by email at `trainings@forumminds.com`, `_subject`/`_replyto` set per submission.
   - **`assets/js/register.js`** → switched the same day, later on 2026-08-05, to a self-hosted PHP handler instead of Formspree: `var ENDPOINT = "register-handler.php"`. Registrations now:
     1. Are validated again server-side by `register-handler.php` (mirrors the client-side `RULES` in `register.js` — keep both in sync if a field changes).
     2. Get appended as a backup row to `registrations.csv` (root directory, gitignored — it holds delegate PII and must never be committed or web-accessible).
   - **`.htaccess`** in the root denies direct requests to `registrations.csv`, so it can't be fetched by guessing the URL — on top of it being outside git entirely.
   - **`register.js` still enriches the payload before sending.** The `<option>` values are slugs, so a raw post would read `programme: strategic-hr` with no dates or venue. It appends `programme_title`, `programme_dates` and `programme_venue` (carrying the "(proposed)" qualifier) resolved from `programmes.js` at submit time; `register-handler.php` uses these for a readable CSV row, falling back to the raw slug if they're absent.

     **Those three names must stay lowercase-with-underscores on both sides.** PHP rewrites spaces in incoming field names to underscores, so a field posted as `Programme title` arrives as `$_POST['Programme_title']` — the first cut of this used the spaced names on both sides and the handler read empty strings for all three, silently falling back to the slug on every registration. Underscored names remove the trap instead of compensating for it.
   - **The handler always returns JSON** (`{ success, message }`); `register.js` shows `message` in the error panel on failure rather than a generic string, so a validation miss server-side is legible to the delegate instead of just "something went wrong." If the body will not parse as JSON at all (PHP not enabled on the host, a 500 page, a captive portal), the parser's own message is swallowed and the generic wording is used — `Unexpected token '<'` is not something to put in front of a delegate.
   - **Spam gate**, two silent checks in `register-handler.php` (§5.1a below). The form is public, so nothing stops an automated script from posting to it directly and filling the CSV with junk rows.
   - **Clearing `ENDPOINT`** (either form) restores manual mode — the mail-client handoff with the "not sent yet" panel. That fallback is still in the code and still correct; it is what makes the site safe to deploy even if the Formspree account lapses or `register-handler.php` isn't reachable yet.
   - **No WhatsApp/CallMeBot integration.** An earlier draft of this handler sent an instant WhatsApp notification via CallMeBot on every registration. Removed 2026-08-07 at Hamna's request before it ever went live — the CSV backup is the only record now. `config.php` (which held the CallMeBot phone number and API key) has been deleted; nothing references it any more.

   ### 5.1a The spam gate

   Two hidden fields in `register.html`, both checked by `register-handler.php`:

   - `website` — a **honeypot**, positioned off-screen (deliberately *not* `display:none`, which some bots skip), `aria-hidden`, `tabindex="-1"`. A human never meets it, so anything in it came from something filling in every input it found.
   - `t` — `register.js` stamps `Date.now()` into it at page load. A post arriving under three seconds later is a bot.

   Both rejections are **silent**: the response is byte-identical to a real success, so a bot cannot tell which check caught it and tune around it. Rejections are recorded in the server error log.

   The time check only fires in the **0–3s window**. A missing `t` means the JS did not run — a broken page, not a bot — and a *negative* elapsed time means the delegate's clock disagrees with the server's (or a 32-bit PHP build overflowed the millisecond value). Neither discards the registration. Silently dropping a real booking is a much worse failure than letting a bot through.

   ### 5.1b Handler verification — done 2026-08-16

   **The handler now runs and behaves as documented.** Previously it had never been executed at all, because there was no PHP binary in this environment. Verified against **PHP 8.3.33** (NTS, Windows) served by `php -S localhost:8000` from the project root, posting the same field set `register.js` sends:

   | Case | Result |
   | --- | --- |
   | `php -l` syntax check | Clean — the file's first ever parse |
   | `mbstring` present | Loaded; `mb_strlen`/`mb_substr` work |
   | Valid submission | 200, `{"success":true}`, header row + data row written |
   | Bad email | 422, `"Please check: Work email."`, nothing written |
   | Honeypot filled | 200 success, **no row** — byte-identical to a real success |
   | Submitted under 3s | 200 success, **no row** |
   | Missing `t` stamp | Saved, as intended — a broken page is not a bot |
   | Clock 10 minutes ahead | Saved — skew does not discard a booking |
   | Second submission | Appended; header not repeated |
   | `GET` instead of `POST` | 405 |

   Both spam rejections wrote their one line to the error log. The `programme_title` / `programme_dates` / `programme_venue` underscore trap (above) is genuinely avoided — all three arrived populated rather than falling back to the slug.

   **The browser path is verified too.** A temporary same-origin harness page drove the real form in headless Chrome — that is the only way to script it, since `file://` cannot reach the handler. It confirmed, in order: the dropdown populates with 9 programmes from `programmes.js`; the load-time `t` stamp is set; an empty submit is blocked by the client-side `RULES` with the alert panel shown; choosing a programme fills the note under the dropdown; and after waiting out the 3s gate, submitting shows `#form-success` with the correct recap (programme title, delegate count, email) **and writes a row**. The row is what proves it — a submission dropped by the spam gate also reports success, so the panel alone would not have distinguished the two. The harness has been deleted.

   **The one thing still unverifiable here: the `.htaccess` deny rule.** PHP's built-in server does not read `.htaccess`, so `registrations.csv` was freely downloadable over `localhost:8000`. That is an artefact of the test server, not a finding — but the PII protection remains **unverified** and can only be checked on the real host. Request `https://<domain>/registrations.csv` after deploying; anything other than 403 means the rule is not in force.

   **Two faults the verification found, both fixed 2026-08-16:**

   - **`register.html` stated an unconfirmed venue as fact.** The note under the dropdown and the success recap printed `p.venue` raw — "Riyadh, Saudi Arabia" — while the programme pages correctly print "Riyadh, Saudi Arabia (proposed)". The submitted payload was already qualified, so only the two panels the delegate actually reads were wrong, which is the worst place for it. `register.js` now has a `venueText()` helper used by the note, both recaps and the manual-mode email, and the submit handler reuses it instead of repeating the expression. This resolves itself as venues are confirmed — `venueIsProposed()` already returns false for `CONFIRMED_VENUES` slugs, for "At your premises", and for format-derived venues like "Live Online".
   - **The CSV had no UTF-8 BOM.** The rows are UTF-8, but Excel on Windows opens a double-clicked `.csv` in the system ANSI codepage unless a BOM says otherwise, so "24–25 Aug 2026" arrived as "24â€“25 Aug 2026" — and a non-Latin delegate name would have been unrecoverable from the spreadsheet, which matters for a Gulf and Pakistan audience. `register-handler.php` now writes the BOM once, in the same `$isNew` branch that writes the header. Verified: BOM present, header intact, en-dash preserved.

   **One cosmetic wart, working as designed.** `csvSafe()` prefixes an apostrophe to any value starting with `=+-@`, so a phone number stored from the form reads `'+92 300 1234567`. The form asks for a country code, so this will affect essentially every row. The escaping is correct — an unescaped leading `+` is a formula to Excel — and only the display is affected; noted here so it does not get mistaken for corruption.

   Two host requirements worth checking before deploying: the handler needs **mbstring** (`mb_strlen`/`mb_substr`) — confirmed working locally, but the host's build is what counts — and `.htaccess` is only read by **Apache or LiteSpeed** — on Nginx the CSV is not protected, and the deny rule must be translated into the server config by hand.

   `registrations.csv` was deleted after verification, so the file does not exist and the first real registration will create it with a fresh BOM and header. Do not upload a copy of it.

   ### 5.1c Netlify Forms — what runs today (2026-08-17)

   Netlify hosts static files and **will not run PHP**, so the registration form no longer posts to `register-handler.php`. The handler is still in the repo, unchanged apart from a "not in use" header, and `register.html` still carries every field it expects — nothing calls it.

   **How the wiring works:**

   - `register.html`'s `<form>` carries `name="registration"`, `method="POST"`, `data-netlify="true"` and `netlify-honeypot="website"`, plus a hidden `form-name` input repeating the name. Netlify reads the form and its field list **from the published HTML at deploy time**.
   - `assets/js/register.js` has `var FORM_NAME = "registration"` where `ENDPOINT` used to be. It still intercepts the submit and posts by `fetch` — urlencoded, to `/`, with `form-name` in the body — so the existing `#form-success` recap panel can be shown in place instead of the delegate being navigated away to Netlify's generic success page.
   - **No `action=` on the form, deliberately.** If the JS never runs, the browser does a plain POST to the same page, Netlify still records the registration, and the delegate lands on Netlify's own success page. Degraded, but not lost.
   - **`programme_title` / `programme_dates` / `programme_venue` are now real hidden inputs** in `register.html`, filled by `register.js` at submit time. They used to be appended to the `FormData`. That no longer works: **Netlify only stores fields it saw in the published markup and silently ignores anything else**, so an appended value would have vanished and every submission would have read `programme: strategic-hr` with no dates or venue. The underscored names are kept — harmless here, and they keep the PHP handler usable.

   **What to check after the first deploy:**

   1. **The form is registered.** Netlify dashboard → **Forms** should list `registration` after a deploy. If it does not, the markup did not reach the published HTML and every submission will 404 — `register.js` then shows the "could not send" wording with the mailto fallback.
   2. **A real submission arrives.** Submit once and confirm the entry appears under Forms → registration, with `programme_title`, `programme_dates` and `programme_venue` populated rather than blank.
   3. **Turn on notifications.** Netlify does not email anyone by default — set Forms → **Notifications** → email to `trainings@forumminds.com`, or the submissions sit in the dashboard unseen.
   4. **The spam gate is now half of what it was.** The `website` honeypot is handed to Netlify via `netlify-honeypot` and still works. The `t` timestamp check does **not** — it lived in the PHP handler and Netlify has no equivalent hook. The field is still stamped and posted, but nothing reads it. Netlify's own spam filtering plus the honeypot are the whole gate today.
   5. **`registrations.csv` no longer exists** on a Netlify deploy — there is no server-side write. The Netlify dashboard is the only record; export it periodically if a backup matters. The `.htaccess` deny rule is also inert on Netlify (it is Apache/LiteSpeed only), which no longer matters because there is no CSV to protect.

   ### 5.1d Only if the PHP handler is ever put back

   On a PHP host, point `register.js`'s `fetch` back at `register-handler.php` and restore the JSON-parsing `.then` around it — the commit of 2026-08-17 has both. Leave `FORM_NAME` set to anything non-empty; clearing it is the separate manual-email mode, not the PHP path. Then the original host checks apply:

   1. **PHP runs at all.** If `register-handler.php` is served as plain text, every submission fails; `register.js` swallows the unparseable body and shows the generic "could not send" wording with the mailto fallback, so the form degrades safely but silently. Submit once and confirm a row appears.
   2. **`mbstring` is enabled** — `mb_strlen`/`mb_substr`. Confirmed working locally on PHP 8.3.33, but the host's build is what counts.
   3. **`registrations.csv` is not web-readable.** Request it directly; expect 403. On **Nginx the `.htaccess` does nothing** and the deny rule must be translated into the server config by hand — this is delegate PII.
   4. **The directory is writable** by the PHP user, or `fopen` fails and the delegate gets "We could not save your registration."

2. **Three placeholder fields throughout `data/programmes.js`,** flagged in that file's own header comment:
   - `venue` — city venues are proposed, not confirmed (only "Live Online" entries are certain). This is now *visible to the visitor*: programme pages render the venue as "Riyadh, Saudi Arabia (proposed)" plus a note under the enrolment panel. To confirm a venue, replace the string and add the slug to `FM.CONFIRMED_VENUES` in `data/programmes.js` — the qualifier disappears for that programme only.
   - `fee` — "On request" for every programme; replace with real pricing when set.
   - `trainer` — "Industry Expert" for every programme (matches what forumminds.com currently states); replace with real names/bios when available.
3. **`ai-ready-critical-thinking` programme has no schedule yet** (`startDate`/`endDate` are `null` by design) — it shows as "Dates on request", cannot be plotted on the calendar, and instead appears as an "also available on request" chip under the calendar and as a `DATES / TBC` row in the Schedule view. Fill in dates once scheduled.
4. **Programme photographs are CC0 stock, not real ForumMinds sessions.** `assets/img/programmes/` holds one landscape photo per programme; the licence record and replacement spec are in `CREDITS.txt` alongside them. Swap in real session photography before launch if you have it — drop a file in with the same name, no code change.
5. Do not present venue/fee/trainer placeholders or the stock photography as final in any client-facing communication — they need real input from Hamna before launch.

---

## 6. Cleanup — DONE (2026-08-04)

The deploy directory went from **42.7MB to 5.0MB**. Everything removed was verified unreferenced first, by searching every `.html`, `.css` and `.js` file for each filename in both raw and URL-encoded form (the CSS used `%20` for names with spaces, which is why a naive search missed them).

Removed: `images/engineer.jpg` (13.8MB), `images/happy-young-man-architect-hard-hat-holding-folder.jpg` (13.5MB), `images/low-angle-shot-man-looking-away.jpg` (9.3MB), the superseded `images/female hero.png` and `images/hero image background.png` PNGs, `images/next to hero.jpg` (moved to `assets/img/band-texture.jpg`), the stale `images/assets/` + `images/data/` duplicate tree, `assets/img/hero.jpg` (unused since the hero photo changed), the superseded `assets/img/logo.png` and the three unused logo SVGs, plus `_talk2.html` and `assets/js/calendar.js`.

**All of it is recoverable:** `git checkout 89aff97 -- "<path>"`. Nothing was deleted before that baseline commit existed.

`images/Logo.png` was deliberately kept — it is the untouched master artwork (§9) and the source for re-exporting the logo and favicons.

---

## 7. Quick orientation for a new conversation

- Read `data/programmes.js` first — it explains itself and controls most of the site's dynamic content.
- Read the `:root` block at the top of `assets/css/main.css` before making any visual change — every colour, font, and spacing value is a token there.
- If asked to add a programme: follow the numbered instructions at the top of `data/programmes.js` (copy a block, fill in `startDate`/`endDate` as `YYYY-MM-DD`, set `category` to existing IDs, point `url` at a detail page or leave `""` to fall back to the register page).
- If asked to add a new page: copy the header/footer markup verbatim from an existing page (e.g. `about.html`) since there's no shared template.
- No test suite, no CI, no deployment pipeline exists — verify changes by opening the file in a browser.

---

## 8. The training schedule page

`training-schedule.html` + `assets/js/training-schedule.js` + section 18 of `assets/css/main.css`
(every selector prefixed `.ts`, so nothing can leak into another page).

**One data source, two renderings.** `filtered()` in the JS produces a single array from
`data/programmes.js` on every change; the Calendar pane and the Schedule pane both render from
that same array. Switching tabs is a cross-fade between two panes that are already in sync —
no reload, no refetch, and the two views can never disagree.

**What's on the page,** top to bottom: heading and lede → a four-value summary bar whose
counters animate when it scrolls into view → an Apple-style segmented control (the navy thumb
slides, 350ms) → five shared filters (search, discipline, delivery mode, country, month) →
the active pane.

- *Calendar pane* — a compact custom month grid beside a large featured programme panel.
  Today gets a ring; every day a session runs gets a glowing dot per programme (hover expands
  the dot and raises a soft ripple, click fills the day navy and pulses). The panel cross-fades
  over 400ms whenever the selection changes. Where two programmes share a date (24–25 August
  does), the panel gets a "1 of 2 on this date" pager.
- *Schedule pane* — the same programmes as executive rows: date block, discipline, title,
  location, delivery, duration, register arrow. Hover lifts the row and slides the arrow.

**Things worth knowing before you edit it:**

- The month arrows are clamped to the range of real session dates, so you cannot page into
  empty months. Add a programme in, say, February and February becomes reachable automatically.
- The summary bar counts live from `programmes.js`. It currently reads **8 upcoming programmes,
  3 countries, 3 delivery formats** because that is what the data actually contains. The
  original brief asked for 18 / 7 / 4 — those numbers were not in the data, and hardcoding them
  would have put a false claim on the page. Add the programmes and the counters follow.
- Two new fields per programme feed this page: `country` (the country filter groups on it; use
  `"Online"` or `"Your premises"` for the non-places) and `image`. Both are documented in the
  header comment of `data/programmes.js`. `image` is optional — omit it and the panel falls back
  to a navy plate rather than a broken image.
- Four new helpers live on `FM`: `days()`, `iso()`, `countries()`, `dateRangeLong()`,
  `durationLabel()`. Nothing else on the site uses them yet.
- Every animation is transform/opacity only, 350–450ms, on one easing curve (`--ts-ease`).
  `prefers-reduced-motion: reduce` flattens the entire section — the last rule in section 18.
- The entrance animation reveals the section by adding `.is-ready`. That happens on a double
  rAF *and* a 120ms timeout: rAF does not fire in a background tab, and everything inside `.ts`
  starts at `opacity: 0`, so without the timeout the page would look blank until focused.

---

## 9. The brand logo (added 2026-08-02)

Hamna supplied the finalized logo as `images/Logo.png` — 8311x1084, navy wordmark with the
orange quarter-arc inside the "O". **That artwork is not to be redesigned, recoloured,
reshaped or recreated.** It now appears in the header and footer of all 26 pages.

**The asset.** No SVG was supplied, so the PNG is used. `images/Logo.png` stays as the
untouched master. `assets/img/logo-forumminds.png` is the web copy: the same image resampled
to 1288x168 (stepped halving through a canvas — a pure downscale, nothing else touched),
because shipping a 9-megapixel file to render a 40px logo costs about 36MB of decoded bitmap
on every page load. Replace both together if the artwork is ever reissued.

**Sizing is driven by WIDTH** (`--brand-w`, `--footmark-w` in `:root`), with `height: auto`.
Set one axis and let the other derive — that is what makes distortion impossible. Width is the
control rather than height because this is a 7.667:1 wordmark: its *length* is what competes
with the nav in the header and with three link columns in the footer. Height is a consequence.

| | `--brand-w` (header) | `--footmark-w` (footer) | Header bar |
|---|---|---|---|
| Desktop (>1040px) | 200px (→26px tall) | 280px (→37px tall) | 88px |
| Tablet (≤1040px)  | 184px (→24px tall) | 250px (→33px tall) | 80px |
| Mobile (≤640px)   | 164px (→21px tall) | 220px (→29px tall) | 72px |

`--header-h` drives the bar, the mobile nav drawer's offset and the full-screen hero's `100svh`
subtraction, so those three stay in step — change it in one place per breakpoint. The logo size
is **independent of it**: the bar is sized by the Register button (~46px), the tallest thing in
the row, and the logo sits inside that with clear space around it. At 1288x168 the file is a 6x
asset at the largest step, which is what keeps it sharp on Retina/HiDPI.

`width` + `height: auto` + `max-width: 100%` is self-protecting: if a container runs out of
room the width clamps and the height re-derives from the file's own ratio, so a squeeze scales
the mark down instead of stretching it. That is why neither rule needs `object-fit` any more.

The markup carries the file's **intrinsic** `width="1288" height="168"`, not the rendered size.
Those attributes exist only to give the browser the aspect ratio up front (CLS prevention);
CSS supplies the real dimensions. Leaving them intrinsic means they never need touching again
when the rendered sizes change.

**Sizing history (revised twice on 2026-08-02).** Shipped at 56px tall / 429px wide on the
reasoning that the bar should be the logo plus even clear space — correct arithmetic, wrong
optics. Cut to 40px/306px, then to the current 200px wide. The mark carries only 15px of
built-in padding per side (verified by sampling the alpha channel), so it reads at nearly its
full 9:1 *ink* ratio — visually a long horizontal rule of type, and length was what made it
shout. At 200px it holds about a sixth of the 1240px wrap, its cap height lands ~1.5x the 14px
nav links, and the row reads brand → nav → CTA in that order rather than all at once. Bar
heights were left alone throughout, so each reduction became clear space, not a shorter header.

Below ~360px the mark plus the tightened Register button no longer fits, so at ≤640px only,
`.brand` is allowed to shrink (`flex-shrink: 1; min-width: 0`). The nav is already in the
drawer by then, so nothing but the CTA competes with it. Above 640px `.brand` stays
`flex-shrink: 0` so the nav can never push into the logo.

**If a more compact lockup is ever supplied**, the width numbers above stay as they are and the
heights re-derive themselves. That is the whole reason sizing is width-driven — an artwork
swap should not require re-tuning three breakpoints. See the export spec at the end of this
section.

**Two things to know before touching this:**

1. **The footer logo is a separate reversed asset, `logo-forumminds-white.png` — the white
   plate is gone.** The footer is `--ink` (#0B1B2B) and the artwork is navy, about 1.5:1 against
   it, so placed as-supplied it is invisible. That was originally solved with a white clear-space
   plate. The plate worked but read as a sticker: a bright rectangle punched into a dark footer,
   the loudest thing in the section and the only hard-edged white box on the page.

   The first pass at fixing that used `filter: brightness(0) invert(1)` on the original file.
   That works but is destructive — it drives *every* opaque pixel to white, so the gold arc in
   the O went white along with the navy wordmark. `logo-forumminds-white.png` fixes that: it is
   the same file with only the navy pixels replaced with white (matched by colour distance —
   the source has exactly two inks, navy `rgb(19,45,82)` and gold `rgb(245,158,11)`, so this is
   an exact swap, not an approximation), leaving the gold arc intact and the background fully
   transparent. `.footmark img` now just points at this file — no filter, no runtime cost, and
   it survives things a CSS filter wouldn't (e.g. dark-mode-aware backgrounds, print).

   Both files should be regenerated together if the artwork is ever reissued. **If a
   professionally reversed asset is later supplied by the designer, prefer that** — this one was
   produced with an automated colour swap, which is a fair stand-in but not the primary source
   of truth for the brand.
2. **The favicon is now the real mark** (replaced 2026-08-04; it used to be the superseded
   `assets/img/logo.png`). A 7.667:1 wordmark makes a hopeless favicon, so the icon is the
   **"O" mark on its own** — cropped straight out of `images/Logo.png` rather than redrawn.

   How it was cut, in case it needs redoing: the glyph boundaries were found by scanning the
   master for fully-empty pixel columns between letters, which puts the "O" at x 823–1685,
   y 116–977 (862 x 861 — essentially square, which is what makes it work). The navy pixels
   were then swapped to white by the same two-ink colour distance rule used for
   `logo-forumminds-white.png`, leaving the gold arc untouched, and the result was centred at
   62% scale on a `--ink` (#0B1B2B) plate.

   White-on-navy rather than navy-on-transparent **on purpose**: a transparent favicon
   disappears against a dark browser tab strip, which is where a large share of them are seen.

   Four files ship: `favicon.ico` at the site root (a 32px PNG in an ICO container — browsers
   request `/favicon.ico` by path regardless of what the `<link>` tags say),
   `assets/img/favicon-512.png`, and `assets/img/apple-touch-icon.png` at 180px. Regenerate all
   four together from the master if the artwork is ever reissued.

The old footer lockup — an inline SVG ring plus `<b>FORUM</b><span>MINDS</span>` text, a
hand-built approximation of the logo — has been removed along with its `.footmark__ring` and
`.footmark__type` rules. The real logo replaces it.

The footer grid's first column has a `minmax(19rem, 1.55fr)` floor and spans the full row in
the two-column layout, so the mark always has room. The floor was 23.5rem when the logo sat on
a padded 337px plate; with the plate gone and the mark at 280px (17.5rem) it was reserving
space for furniture that no longer exists, so it was cut to 19rem — enough for the mark plus
~1.5rem of slack, with the rest handed back to the three link columns.

### Export spec for a replacement lockup

The current artwork is **7.667:1** — a long single-line wordmark. That ratio is the root of the
sizing tension: any height that gives the letters presence also makes the mark very long. A
more compact lockup (stacked, or mark-left/wordmark-right on two lines) would fix it at source.

If one is produced, target **≈4:1** — that is the one ratio that satisfies both intended boxes
(header 180–220 × 42–48, footer 260–320 × 70–90) with no distortion:

| | renders at | from `--brand-w` / `--footmark-w` |
|---|---|---|
| Header | 200 × 50 | `--brand-w: 200px` (unchanged) |
| Footer | 280 × 70 | `--footmark-w: 280px` (unchanged) |

- **Format:** SVG preferred (resolution-independent, tiny, no @2x needed). If PNG, export
  **1200 × 300** — 6x the header render, 4.3x the footer.
- **Background:** transparent. Do not bake in a white box.
- **Padding:** include ~8% clear space on all four sides, as the current file does vertically.
  Artwork cropped tight to the letterforms has no optical breathing room and always reads
  bigger than its measured size.
- **Two colourways:** the full-colour version for the header, and a **reversed (white wordmark,
  gold arc retained)** version for the footer — replacing `logo-forumminds-white.png`, which is
  currently an automated stand-in rather than designer artwork.

Dropping a ≈4:1 file in needs no CSS changes at all — the width variables stay, heights
re-derive. Just replace both PNGs (`logo-forumminds.png` and `logo-forumminds-white.png`) and
every page picks it up, since both are referenced by path, not inlined.

---

## 10. Pre-launch audit (2026-08-02) and the fixes applied (2026-08-04)

An independent audit — static review plus headless-browser verification, no files changed —
scored the site **66/100, not launch-ready**, with one blocker. Its verdict was that the design,
layout, accessibility and security posture were all genuinely solid, and that what was blocking
launch was functional and content hygiene rather than anything visual. That read was correct.

Everything it raised has now been worked through. What follows is what changed and, where it
matters, why a particular route was chosen — the reasoning is more useful than the list.

### The blocker — fixed

`register.js` had `ENDPOINT = ""`, so the form validated fully, showed *"Registration received…
we will send a written quotation within one working day"*, and sent nothing anywhere. Every
person who registered got a confident false confirmation.

The obvious fix — paste in a Formspree URL — needs an account only Hamna can create, so the site
would have stayed un-deployable until that happened. Instead the failure mode itself was fixed:
with no endpoint configured both forms now run in **manual mode**, opening the visitor's mail
client with every answer prefilled and showing a panel that states plainly the message has not
been sent yet. The success confirmation is now only ever shown after a real submission. Setting
`ENDPOINT` / `CONTACT_ENDPOINT` upgrades both forms automatically with no markup change (§5.1).

### High severity — all fixed

- **Two 1.4MB unoptimized PNGs, and no lazy loading anywhere.** Both were photographs shipped
  as PNG. Re-exported to JPEG at two widths each: **2.85MB → 189KB desktop, 80KB mobile (93%)**.
  A `background-image` cannot use `srcset`, so the resolution switch is a media query — and the
  *small* file is the base rule with the large one as the `min-width` upgrade, because done the
  other way round phones would download both. The footer logo (26 pages) and the schedule's
  programme photos are now `loading="lazy"`.
- **Venues presented as fact while `programmes.js` documented them as proposed.** Programme
  pages now render "Riyadh, Saudi Arabia (proposed)" with an explanatory note under the
  enrolment panel. Driven by `FM.venueIsProposed()`, which correctly returns false for
  "Live Online" and "At your premises" — those follow from the delivery format and are not
  proposals. Confirm a venue by adding its slug to `FM.CONFIRMED_VENUES`.
- **No robots.txt, sitemap.xml, canonical tags or social metadata anywhere.** All added across
  26 pages, plus a generated 1200x630 `og-forumminds.jpg` share card. Also added, beyond what
  the audit asked for: `Organization` + `WebSite` JSON-LD on the homepage, and `Course` JSON-LD
  built from `programmes.js` on every programme page. The `Course` schema deliberately omits
  `offers` — every fee is still "On request", and a price field with no price in it is worse
  than no price field at all.
- **No git repository.** Initialized. `89aff97` is the pre-fix baseline.
- **38MB of unreferenced files shipping to production.** See §6 — 40MB in the end, each file
  verified unreferenced first, all recoverable from the baseline commit.

### Medium and low severity — all fixed

- **`contact.html` had no real form, only `mailto:` links** that do nothing for anyone without a
  desktop mail client. A full enquiry form now sits at `#enquiry`, mirroring register.html's
  markup, validation and ARIA wiring. Two of the three cards jump to it and preselect the topic;
  the third stays a genuine `mailto:` because "email us directly" is a real thing to want.
- **30+ hardcoded `border-radius` values against two tokens.** The honest reading was that the
  tokens described about a fifth of the design, not that the design was wrong — so the scale was
  extended to match reality (`--radius-xs` through `--radius-3xl`, plus `--radius-pill` and
  `--radius-circle`) and all 72 declarations mapped onto it. Nothing moved by more than 2px.
- **No `<noscript>` anywhere** despite most content being JS-rendered or IntersectionObserver-
  gated. Added to all 26 pages. It does two jobs: a `<style>` block force-reveals every section
  that starts at `opacity: 0` (without it the page renders blank, not merely reduced), and a
  panel tells the visitor the listings will be empty and gives them the email address.
- **Favicon still the superseded logo** — replaced with the "O" mark, see §9.
- **`_talk2.html` and the unused `calendar.js` in the deploy directory** — removed.
- **Off-token near-white hex tints.** Initially left alone, then **reversed and fixed on
  2026-08-08** — see §11. The original reasoning was that each one is a stop inside a gradient
  (`#FAFBFC → #F6F9FB → #F2F6FA`), and that collapsing them onto `--paper` would flatten the
  gradients into flat fills. That was true of collapsing them onto *one* token, but it was the
  wrong conclusion: a gradient does not need anonymous values, it needs a **ramp**. They are now
  steps on `--surface-1 … --surface-7` and every gradient is exactly as deep as it was.
- **Region messaging inconsistency.** Reviewed and **kept as is, deliberately.** The audit
  overstated it — it is 6 pages, not every category page, and most mentions are substantive
  editorial copy (leadership across Gulf cultures, cultural intelligence) rather than
  positioning. The framing is also factual: venues are Riyadh, Dubai and Doha, and about.html
  states clients are concentrated in the UAE, Saudi Arabia and Qatar. Scrubbing it would cost
  real regional search traffic and orphan copy written for that market. A neutral hero plus a
  regional specialism is a coherent posture, not a contradiction. Revisit only if Hamna wants
  to change the positioning itself.

### Found during the work, not in the audit

- **`assets/img/programmes/ai-supply-chains.jpg` was not a JPEG.** It was a **WebP file with a
  `.jpg` extension**. Browsers sniff the content type so it rendered fine, which is why the
  audit's asset check passed it — but the label was wrong, and any image pipeline that trusts
  the extension would choke on it. Converted to a real JPEG (351KB → 128KB). Note that
  `System.Drawing` cannot decode WebP at all; `PresentationCore`'s WIC decoder can.
- **The brand name was written "Forum Minds" in 6 places**, five of them on the homepage.
  The brand is **ForumMinds**, one word — it is the logo. Normalized.
- **Every two-column form row was ~18px out of vertical alignment**, on both forms. Cause:
  `.field { margin-bottom }` combined with `.field:last-child { margin-bottom: 0 }` meant the
  second field in each row was the parent's last child and lost its margin. Grid stretches both
  cells to equal height, so the one *without* the margin ended up taller, and because the label
  above it has `flex-grow`, that extra height went into the label and pushed its input down.
  Fixed by moving the spacing onto `.field-row`, where it belongs.
- **An unterminated CSS comment at what was line 4416** silently swallowed the comment that
  followed it — a leftover from the removed "practice areas split showcase" component. Removed.
- **The 9 programme photos averaged 340KB** for 960x640. Re-encoded at q80: **3.0MB → 0.9MB**.
  Two were already better than q80 and grew, so those two were restored rather than kept.

### Still outstanding — needs Hamna, not code

1. ~~The form endpoint~~ — **done 2026-08-05.** The two forms use different mechanisms: `contact.html` posts to Formspree, `register.html` to the self-hosted `register-handler.php` (§5.1). The handler was verified end to end on 2026-08-16 (§5.1b).
2. Real `fee` and `trainer` values — both are placeholders on all nine programmes (§5.2).
3. Dates for `ai-ready-critical-thinking` (§5.3).
4. Real session photography to replace the CC0 stock (§5.4).
5. `assets/img/band-texture.jpg` is a 612x408 source used at ~1400px wide. The 2px blur on it
   is load-bearing — it is what stops the upscale from reading as a low-quality image. A
   2000px+ replacement lets the blur drop to 0.
6. Confirmed venues. Every city venue still renders as "(proposed)" sitewide, now including
   `register.html` (§5.1b). Confirming one is a two-line edit per programme — replace the
   venue string and add the slug to `FM.CONFIRMED_VENUES` in `data/programmes.js`.

**None of items 2–6 block a technical launch; they are all statements the site currently makes
honestly** ("On request", "Industry Expert", "(proposed)", stock photography). They block
launching without those caveats being true. Item 5 in §5 stands: do not present any of them as
final in client-facing communication.

### Verification

A scripted sweep re-checks all of the above *and* everything the original audit listed as
already clean, so a regression cannot hide behind a fix: canonical/OG/favicon/noscript on every
page, no broken internal links, no broken CSS `url()`, every `<script src>` resolving, alt text
on all 54 images, exactly one `<h1>` per page, no `eval`/`document.write`/secrets, balanced
braces and comments, and no remaining hardcoded radii. All pages were also rendered in headless
Chrome to confirm the JS-driven content actually appears — 13 dropdown options, 117 schedule
nodes, 9 catalogue cards, Course JSON-LD on programme pages.

Two notes if you write similar checks. A filename-only reference search produces false
positives: `about.jpg` matched both `assets/img/about.jpg` and the stale
`images/assets/img/about.jpg`, which nearly spared a file that was genuinely dead. And a regex
for `href="..."` will match JavaScript string concatenation inside inline `<script>` blocks
(`href="' + x.url + '"`) and report it as a broken link — it is not.

**A tooling note for headless testing in this sandbox.** Chrome's `--headless=new --screenshot
--window-size=<W>,<H>` is unreliable below roughly 500px width — it lays out at a wider viewport
than requested while encoding the canvas at the requested size, which looks exactly like a
horizontal-overflow bug but is not one. Two further traps found this time: Chrome needs an
explicit `--user-data-dir` or it can hang indefinitely on first run, and its **child processes
keep the redirected stdout handle open after the parent exits** — so reading the dump
immediately after `WaitForExit` silently returns the *previous* page's output, which looks like
every page rendering identically. Retry the read until the handle frees.

---

## 11. Colour & design-system pass (2026-08-08)

Aimed at the two audit categories that scored lowest on things code could actually change:
**Colour & imagery 6/10** and **Design system consistency 6/10** (§10). Both of those scores
predate the 2026-08-04 fixes, so part of each was already closed before this pass started.

### What the audit asked for, and where each item stands

| Audit finding | Category | Status |
|---|---|---|
| Two 1.4–1.5MB unoptimized hero PNGs | Colour & imagery | Fixed 2026-08-04 |
| No Open Graph image | Colour & imagery | Fixed 2026-08-04 |
| 612×408 photo upscaled past its resolution | Colour & imagery | **Still open — needs a photograph, not code** |
| 11+ one-off `border-radius` values | Design system | Fixed 2026-08-04 |
| Single-use hex colours outside the token block | Design system | **Fixed in this pass** |

### The colour literals

Roughly forty hex literals sat outside `:root`. They are now fifteen, and every one of those
fifteen falls into a documented category — the exceptions list is written into the `:root`
block itself, with the current count, so a future reader can tell whether the system is being
followed or has quietly drifted:

1. the **definition** of a section-local custom property (a literal has to live somewhere);
2. stops of a **one-off dark gradient field used exactly once** (the Why tiles, the upcoming
   card, the journey band) — art direction for a single surface, not a reusable scale;
3. `#000` inside a `mask-image`, where it is an alpha value and not a colour;
4. `#fff` / `#000` in the **print stylesheet**, which should be pure black on white regardless
   of the screen palette.

New scales: `--surface-1…7`, the gold ramp plus `--fill-gold` / `--fill-gold-hover`, the three
`--dlv-*` delivery hues, and `--success` / `--danger-tint` / `--notice-tint`. Two dead tokens
were found: `--ts-glow` (removed) and `--t-hero` (kept, with a note — it is the head of the
type scale and the documented one-line hero rollback needs it back).

### The accessibility defect found on the way

`--slate-soft` was **failing WCAG AA in all 34 places it was used.** Its own note said "use at
14px+ only", which misreads the rule: WCAG's 3:1 allowance applies to *large* text — 24px
regular or 18.66px bold — and every usage sets 14px or 12px. It measured 3.8:1 on white against
a 4.5:1 requirement. Corrected to `#5F6C7D`, the smallest darkening that clears 4.5:1 on every
surface in the ramp, hue unchanged. Full measured table is in `:root`.

This is worth knowing because the audit *praised* this file for documenting its contrast ratios
inline. It did — the numbers were just never checked against the size the text is actually set
at, which is the half of the rule that is easy to miss.

### How "nothing moved" was verified

Not by eye. Every page was rendered twice — once with the pre-change stylesheet, once with the
new one — and pixel-diffed. Two traps worth knowing if you repeat this:

- **Entrance animations make renders non-deterministic.** The first diff showed 236,000 changed
  pixels on `training-schedule.html` and a max delta of 216/255, which looks like a serious
  regression. It was the `.is-ready` reveal (§8) caught at different points in its fade. The
  control that proves it: render the *same* stylesheet twice and diff that. On the programme
  page the same-CSS control diff was byte-for-byte identical to the change diff — i.e. entirely
  noise.
- **Render with `--force-prefers-reduced-motion`.** That flattens the animated sections (§8) and
  makes the comparison deterministic. Under it the real numbers were: `index` and the programme
  pages **zero** changed pixels; `training-schedule` and `contact` changed by exactly **1/255**,
  with five pixels at 2/255 across the whole site. Below the perceptual threshold, as designed.

The `--slate-soft` correction was made *after* those diffs and is deliberately excluded from
them — it is a real, intended visual change.

### Still needs Hamna, not code

`assets/img/band-texture.jpg` is 612×408 and is used at roughly 1400px wide in two places
(`.section--photo::before` and `.closing__img`). **No larger original exists** — the git baseline
copy at `89aff97:images/next to hero.jpg` is the same 612×408 file, so it cannot be recovered by
re-exporting. The first use hides the upscale behind a 2px blur; the second has no blur and is
the exposed one. A 2000px+ replacement lets the blur drop to 0 and closes the last Colour &
imagery item. Drop a file in at the same path — no code change needed.
