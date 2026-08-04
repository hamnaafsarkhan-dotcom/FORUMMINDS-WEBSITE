/* ==========================================================================
   ForumMinds — programmes.js
   THE SINGLE SOURCE OF TRUTH for the whole site.

   Everything that lists, filters, counts or calendars a programme reads this
   file: the home page, the programmes page, all 10 category pages, the
   training calendar, and the registration form's dropdown.

   ---------------------------------------------------------------------------
   TO ADD A NEW PROGRAMME
   ---------------------------------------------------------------------------
   1. Copy any block inside PROGRAMMES below, paste it at the end of the list,
      and edit the values.
   2. Set "startDate" and "endDate" in YYYY-MM-DD form. The calendar and every
      "upcoming" list sort on these, so they must be correct.
   3. Set "category" to one or more of the IDs listed in CATEGORIES below.
   4. Point "url" at the programme's detail page filename.
   5. If the programme has no detail page yet, set "url" to "" and it will
      still appear in listings, linking to the register page instead.
   6. Set "country" — the training schedule's country filter groups on it.
      Use "Online" for remote delivery and "Your premises" for in-house.
   7. Set "image" to a landscape photo in assets/img/programmes/. If you leave
      it out, the schedule page falls back to a generated navy plate rather
      than a broken image, so it is safe to omit until you have a picture.
   That's it — the new programme appears everywhere automatically.

   ---------------------------------------------------------------------------
   FIELDS TO CONFIRM BEFORE GOING LIVE
   ---------------------------------------------------------------------------
   - "venue"  : city venues below are proposed, not confirmed. Only the
                "Live Online" entries are certain.
   - "fee"    : currently "On request" throughout, which routes buyers to the
                enquiry form. Replace with real figures when you set pricing.
   - "trainer": "Industry Expert" is what forumminds.com states today. Replace
                with real trainer names and bios when available.
   ========================================================================== */

/* Category IDs used by "category" below, in menu order.
   "blurb" shows on category cards; "lede" is the category page intro. */
const CATEGORIES = [
  {
    id: "leadership",
    name: "Leadership & Management",
    short: "Leadership",
    url: "category-leadership.html",
    blurb: "Build the judgement, presence and cross-cultural fluency senior roles demand.",
    lede: "Leadership in the Gulf means leading across nationalities, time zones and working cultures at once. These programmes build the judgement and self-awareness that lets managers do that well — not leadership theory, but the specific skills of directing people who do not share your assumptions."
  },
  {
    id: "ai",
    name: "Artificial Intelligence",
    short: "AI",
    url: "category-ai.html",
    blurb: "Put AI to work in real business processes, not slideware.",
    lede: "Most AI training either oversells or drowns delegates in theory. These programmes do neither. They take the tools your teams already have — spreadsheets, planning systems, reporting workflows — and show exactly where AI earns its place, and where it does not."
  },
  {
    id: "oil-gas",
    name: "Oil, Gas & Heavy Industries",
    short: "Oil & Gas",
    url: "category-oil-gas.html",
    blurb: "Asset integrity, reliability and plant performance for process industries.",
    lede: "Process plants fail in specific, well-understood ways. These programmes are built around those failure modes — vibration, fatigue, unplanned downtime — and the inspection, measurement and maintenance practice that catches them before they cost you a shutdown."
  },
  {
    id: "engineering-tech",
    name: "Engineering & Technology",
    short: "Engineering",
    url: "category-engineering-tech.html",
    blurb: "Applied engineering practice for maintenance, reliability and design teams.",
    lede: "Engineering training that assumes competence. These programmes start where a degree finishes: diagnosing real equipment, interpreting real measurement data, and making defensible calls under operational pressure."
  },
  {
    id: "finance",
    name: "Financial Management",
    short: "Finance",
    url: "category-financial-management.html",
    blurb: "Budgeting, forecasting and analysis that survives contact with the business.",
    lede: "Finance teams are asked to forecast further ahead with less certainty than ever. These programmes cover the modelling, budgeting and analytical technique that produces numbers the business will actually act on."
  },
  {
    id: "supply-chain",
    name: "Supply Chain Management",
    short: "Supply Chain",
    url: "category-supply-chain.html",
    blurb: "Build supply chains that absorb disruption instead of amplifying it.",
    lede: "Regional supply chains have spent five years absorbing shocks. These programmes cover the planning, visibility and decision-making practice — increasingly AI-assisted — that lets a network bend rather than break."
  },
  {
    id: "hr",
    name: "Human Resources",
    short: "HR",
    url: "category-hr.html",
    blurb: "Move HR from administration to genuine strategic contribution.",
    lede: "The gap between an HR function that processes people and one that shapes strategy is a specific set of skills: workforce planning, analytics, and the ability to argue a people case in business terms. That is what these programmes build."
  },
  {
    id: "office-admin",
    name: "Administration & Office Management",
    short: "Administration",
    url: "category-office-administration.html",
    blurb: "Elevate administrative roles into genuine business partnership.",
    lede: "Executive assistants and office managers hold more organisational context than almost anyone around them. These programmes turn that context into influence — anticipating decisions, managing upward, and thinking critically in an AI-assisted workplace."
  },
  {
    id: "esg",
    name: "ESG & Sustainability",
    short: "ESG",
    url: "category-esg.html",
    blurb: "Meet reporting obligations and build a credible sustainability position.",
    lede: "ESG has moved from voluntary reporting to a condition of doing business with international partners and lenders. These programmes cover the frameworks, data and disclosure practice that stands up to external scrutiny."
  },
  {
    id: "contract",
    name: "Contract Management",
    short: "Contracts",
    url: "category-contract-management.html",
    blurb: "Negotiate, administer and close out contracts that hold up under pressure.",
    lede: "A contract is only as good as its administration. These programmes cover drafting, negotiation, variation and claims management for the tendering and project environments common across the region."
  }
];

/* Delivery format labels. IDs are used in "format" below. */
const FORMATS = [
  { id: "online",   name: "Live Online",  blurb: "Instructor-led over video, same content, no travel." },
  { id: "onsite",   name: "In-Person",    blurb: "Classroom delivery at a regional training venue." },
  { id: "in-house", name: "In-House",     blurb: "Delivered at your premises, tailored to your teams." }
];

/* --------------------------------------------------------------------------
   THE PROGRAMMES
   Dates and titles below are taken from forumminds.com and are correct.
   -------------------------------------------------------------------------- */
const PROGRAMMES = [
  {
    slug: "excel-beyond-basics",
    title: "Excel Beyond the Basics: Modern Tools, Analysis & AI",
    category: ["ai", "finance", "hr"],
    startDate: "2026-08-10",
    endDate: "2026-08-11",
    days: 2,
    format: "online",
    venue: "Live Online",
    level: "Intermediate",
    fee: "On request",
    trainer: "Industry Expert",
    country: "Online",
    image: "assets/img/programmes/excel-beyond-basics.jpg",
    url: "programme-excel-beyond-basics.html",
    summary: "Move past formulas into dynamic arrays, Power Query and the AI features now built into Excel — and know which of them to trust with a real dataset."
  },
  {
    slug: "strategic-hr",
    title: "Strategic Human Resources Management",
    category: ["hr", "leadership"],
    startDate: "2026-08-24",
    endDate: "2026-08-25",
    days: 2,
    format: "onsite",
    venue: "Riyadh, Saudi Arabia",
    level: "Advanced",
    fee: "On request",
    trainer: "Industry Expert",
    country: "Saudi Arabia",
    image: "assets/img/programmes/strategic-hr.jpg",
    url: "programme-strategic-hr.html",
    summary: "Connect workforce planning, capability building and HR analytics to business strategy, and learn to make the people case in the language the board uses."
  },
  {
    slug: "piping-vibration",
    title: "Piping Vibration & Fatigue Integrity Management",
    category: ["engineering-tech", "oil-gas"],
    startDate: "2026-08-24",
    endDate: "2026-08-26",
    days: 3,
    format: "online",
    venue: "Live Online",
    level: "Intermediate",
    fee: "On request",
    trainer: "Industry Expert",
    country: "Online",
    image: "assets/img/programmes/piping-vibration.jpg",
    url: "programme-piping-vibration.html",
    summary: "Practical guidance on identifying, assessing and mitigating piping vibration and fatigue risks in process plants, following Energy Institute screening methodology."
  },
  {
    slug: "cultural-intelligence",
    title: "Cultural Intelligence for Global Leaders Masterclass",
    category: ["leadership"],
    startDate: "2026-09-14",
    endDate: "2026-09-15",
    days: 2,
    format: "onsite",
    venue: "Dubai, UAE",
    level: "Advanced",
    fee: "On request",
    trainer: "Industry Expert",
    country: "United Arab Emirates",
    image: "assets/img/programmes/cultural-intelligence.jpg",
    url: "programme-cultural-intelligence.html",
    summary: "Lead teams that span nationalities and working cultures without defaulting to your own — the core leadership skill in a Gulf multinational."
  },
  {
    slug: "ai-supply-chains",
    title: "Driving Agility Through AI-Driven Supply Chains",
    category: ["ai", "supply-chain"],
    startDate: "2026-09-21",
    endDate: "2026-09-22",
    days: 2,
    format: "online",
    venue: "Live Online",
    level: "Intermediate",
    fee: "On request",
    trainer: "Industry Expert",
    country: "Online",
    image: "assets/img/programmes/ai-supply-chains.jpg",
    url: "programme-ai-supply-chains.html",
    summary: "Where machine learning genuinely improves demand planning, inventory and supplier risk — and where it quietly makes decisions worse."
  },
  {
    slug: "maintenance-scheduling",
    title: "Maintenance Scheduling using Big Data, IoT & Agent-Based Simulation",
    category: ["engineering-tech", "oil-gas", "ai"],
    startDate: "2026-10-12",
    endDate: "2026-10-14",
    days: 3,
    format: "onsite",
    venue: "Doha, Qatar",
    level: "Advanced",
    fee: "On request",
    trainer: "Industry Expert",
    country: "Qatar",
    image: "assets/img/programmes/maintenance-scheduling.jpg",
    url: "programme-maintenance-scheduling.html",
    summary: "Build maintenance schedules from condition data rather than calendars, using IoT telemetry and agent-based simulation to test a plan before committing to it."
  },
  {
    slug: "elite-executive-assistant",
    title: "The Elite Executive Assistant: From Support to Strategic Partner",
    category: ["office-admin"],
    startDate: "2026-11-10",
    endDate: "2026-11-11",
    days: 2,
    format: "onsite",
    venue: "Dubai, UAE",
    level: "Intermediate",
    fee: "On request",
    trainer: "Industry Expert",
    country: "United Arab Emirates",
    image: "assets/img/programmes/elite-executive-assistant.jpg",
    url: "programme-elite-executive-assistant.html",
    summary: "Anticipate rather than react: gatekeeping, upward management, stakeholder judgement and the commercial literacy that turns a support role into a partnership."
  },
  {
    slug: "advanced-budgeting",
    title: "Advanced Budgeting and Forecasting",
    category: ["finance"],
    startDate: "2026-11-18",
    endDate: "2026-11-19",
    days: 2,
    format: "online",
    venue: "Live Online",
    level: "Advanced",
    fee: "On request",
    trainer: "Industry Expert",
    country: "Online",
    image: "assets/img/programmes/advanced-budgeting.jpg",
    url: "programme-advanced-budgeting.html",
    summary: "Driver-based budgeting, rolling forecasts and scenario modelling — techniques for planning when the twelve-month annual budget has stopped being useful."
  },
  {
    slug: "ai-ready-critical-thinking",
    title: "AI-Ready Critical Thinking",
    category: ["office-admin", "ai", "leadership"],
    /* No dates published yet. Leave startDate and endDate as null and the
       programme shows as "Dates on request" everywhere and is skipped by the
       calendar. Fill both in to schedule it. */
    startDate: null,
    endDate: null,
    days: 2,
    format: "in-house",
    venue: "At your premises",
    level: "All levels",
    fee: "On request",
    trainer: "Industry Expert",
    country: "Your premises",
    image: "assets/img/programmes/ai-ready-critical-thinking.jpg",
    url: "programme-ai-ready-critical-thinking.html",
    summary: "How to interrogate an AI-generated answer: spotting confident nonsense, testing reasoning, and deciding what still needs a human judgement call."
  }
];

/* ==========================================================================
   HELPERS — used by every other script. Nothing below needs editing.
   ========================================================================== */

const FM = {
  programmes: PROGRAMMES,
  categories: CATEGORIES,
  formats: FORMATS,

  category: function (id) {
    return CATEGORIES.filter(function (c) { return c.id === id; })[0] || null;
  },

  format: function (id) {
    return FORMATS.filter(function (f) { return f.id === id; })[0] || null;
  },

  /* Programmes in a category, soonest first, undated last. */
  byCategory: function (id) {
    return FM.sorted(PROGRAMMES.filter(function (p) {
      return p.category.indexOf(id) !== -1;
    }));
  },

  /* Sort by start date. Programmes without dates sort to the end. */
  sorted: function (list) {
    return list.slice().sort(function (a, b) {
      if (!a.startDate && !b.startDate) { return 0; }
      if (!a.startDate) { return 1; }
      if (!b.startDate) { return -1; }
      return a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0;
    });
  },

  /* The next N scheduled programmes from today. Falls back to the soonest
     dated programmes if every published date is in the past, so the site
     never shows an empty schedule. */
  upcoming: function (n) {
    var today = new Date().toISOString().slice(0, 10);
    var dated = FM.sorted(PROGRAMMES.filter(function (p) { return p.startDate; }));
    var future = dated.filter(function (p) { return p.endDate >= today; });
    var list = future.length ? future : dated;
    return typeof n === "number" ? list.slice(0, n) : list;
  },

  find: function (slug) {
    return PROGRAMMES.filter(function (p) { return p.slug === slug; })[0] || null;
  },

  /* Parse "2026-08-24" as a LOCAL date. Using new Date(str) would parse it as
     UTC and shift the day backwards for anyone west of Greenwich. */
  parse: function (iso) {
    if (!iso) { return null; }
    var b = iso.split("-");
    return new Date(+b[0], +b[1] - 1, +b[2]);
  },

  MONTHS: ["January", "February", "March", "April", "May", "June",
           "July", "August", "September", "October", "November", "December"],

  /* "24 – 26 Aug 2026", "10 – 11 Aug 2026", or "Dates on request". */
  dateRange: function (p) {
    if (!p.startDate) { return "Dates on request"; }
    var s = FM.parse(p.startDate), e = FM.parse(p.endDate || p.startDate);
    var sm = FM.MONTHS[s.getMonth()].slice(0, 3);
    var em = FM.MONTHS[e.getMonth()].slice(0, 3);
    if (s.getTime() === e.getTime()) { return s.getDate() + " " + sm + " " + s.getFullYear(); }
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return s.getDate() + "–" + e.getDate() + " " + sm + " " + s.getFullYear();
    }
    return s.getDate() + " " + sm + " – " + e.getDate() + " " + em + " " + e.getFullYear();
  },

  /* Pieces for the docket's date block. */
  dateParts: function (p) {
    if (!p.startDate) {
      return { month: "TBC", day: "—", year: "On request" };
    }
    var s = FM.parse(p.startDate), e = FM.parse(p.endDate || p.startDate);
    var day = s.getDate() === e.getDate() && s.getMonth() === e.getMonth()
      ? String(s.getDate())
      : s.getDate() + "–" + e.getDate();
    return {
      month: FM.MONTHS[s.getMonth()].slice(0, 3).toUpperCase(),
      day: day,
      year: String(s.getFullYear())
    };
  },

  /* The venue, unless it just repeats the format name. An online programme
     has format "Live Online" and venue "Live Online", and printing both
     produces "Live Online · Live Online" everywhere it appears.
     Returns null when the venue adds nothing. */
  venueLabel: function (p) {
    var f = FM.format(p.format);
    if (f && f.name === p.venue) { return null; }
    return p.venue;
  },

  /* True when the venue is a proposed city rather than a settled fact.
     "Live Online" and "At your premises" are certain — they are properties of
     the delivery format, not bookings. Every named city is a proposal until
     Hamna confirms the hotel/centre (see the "venue" note in the header
     comment above). Pages use this to qualify the venue in the copy, so a
     delegate is never told a city is booked when it is not.

     Confirming a venue means editing nothing here: replace the city string
     with the real venue and add the slug to CONFIRMED_VENUES below. */
  venueIsProposed: function (p) {
    var label = FM.venueLabel(p);
    if (!label) { return false; }                       /* format-derived */
    if (label === "At your premises") { return false; } /* the client's own site */
    return FM.CONFIRMED_VENUES.indexOf(p.slug) === -1;
  },

  /* Slugs whose venue is booked and can be stated as fact. Add to this list
     as venues are confirmed; the "proposed" qualifier disappears per
     programme, with no other change needed. */
  CONFIRMED_VENUES: [],

  /* Category names for a programme, e.g. "Engineering · Oil & Gas" */
  categoryNames: function (p) {
    return p.category.map(function (id) {
      var c = FM.category(id);
      return c ? c.short : id;
    });
  },

  /* Where a programme card should link. Falls back to the register page for
     programmes that do not have a detail page yet. */
  href: function (p) {
    return p.url || ("register.html?programme=" + encodeURIComponent(p.slug));
  },

  /* Every day a programme occupies, as "YYYY-MM-DD" strings. A three-day
     course returns three dates. The training schedule marks all of them, so
     a delegate looking at the 25th sees the course that started on the 24th.
     Returns [] for an unscheduled programme. */
  days: function (p) {
    if (!p.startDate) { return []; }
    var out = [];
    var d = FM.parse(p.startDate);
    var end = FM.parse(p.endDate || p.startDate);
    while (d <= end) {
      out.push(FM.iso(d));
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
    return out;
  },

  /* A Date back to "YYYY-MM-DD". Deliberately not toISOString(), which
     converts to UTC first and can hand back yesterday's date. */
  iso: function (d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  },

  /* Countries with a scheduled programme, in menu order: real countries
     first alphabetically, then the two non-places. */
  countries: function () {
    var seen = [], soft = ["Online", "Your premises"];
    PROGRAMMES.forEach(function (p) {
      var c = p.country || "";
      if (c && seen.indexOf(c) === -1) { seen.push(c); }
    });
    var real = seen.filter(function (c) { return soft.indexOf(c) === -1; }).sort();
    return real.concat(soft.filter(function (c) { return seen.indexOf(c) !== -1; }));
  },

  /* "24–26 August 2026" — the long form the featured panel uses. */
  dateRangeLong: function (p) {
    if (!p.startDate) { return "Dates on request"; }
    var s = FM.parse(p.startDate), e = FM.parse(p.endDate || p.startDate);
    var sm = FM.MONTHS[s.getMonth()], em = FM.MONTHS[e.getMonth()];
    if (s.getTime() === e.getTime()) { return s.getDate() + " " + sm + " " + s.getFullYear(); }
    if (sm === em && s.getFullYear() === e.getFullYear()) {
      return s.getDate() + "–" + e.getDate() + " " + sm + " " + s.getFullYear();
    }
    return s.getDate() + " " + sm + " – " + e.getDate() + " " + em + " " + e.getFullYear();
  },

  /* "2 days" / "3 days". */
  durationLabel: function (p) {
    return p.days + (p.days === 1 ? " day" : " days");
  },

  /* Escape text before putting it into innerHTML. */
  esc: function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
};
