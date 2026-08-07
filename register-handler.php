<?php
/* ==========================================================================
   ForumMinds — register-handler.php
   Receives register.html's POST, validates the same fields register.js
   validates client-side, and appends a CSV backup row. Mirrors the field
   set/rules in assets/js/register.js's RULES object — keep the two in sync.

   The response is ALWAYS JSON: { "success": bool, "message": string }.
   register.js renders `message` straight into the error panel, so every
   message here has to read as something a delegate can act on.
   ========================================================================== */

header('Content-Type: application/json; charset=utf-8');

function respond($success, $message, $status = null) {
    http_response_code($status !== null ? $status : ($success ? 200 : 422));
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

/* A PHP notice or warning printed before the JSON turns the body into
   something res.json() cannot parse, which the delegate would see as a
   failure for a registration that actually saved. Errors go to the server
   log instead. */
ini_set('display_errors', '0');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Invalid request method.', 405);
}

/* Length caps are a backstop, not a validation rule: nothing on the form is
   meant to be this long, and without them one automated post can bloat the
   CSV with an unbounded field. */
function field($name, $max = 300) {
    $value = isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
    return mb_substr($value, 0, $max);
}

$fullname       = field('fullname');
$jobtitle       = field('jobtitle');
$company        = field('company');
$industry       = field('industry');
$email          = field('email');
$phone          = field('phone', 40);
$country        = field('country');
$programme      = field('programme');
$delegates      = field('delegates', 10);
$delivery       = field('delivery', 40);
$notes          = field('notes', 2000);

/* Sent by register.js in addition to the raw programme slug, resolved from
   data/programmes.js at submit time, so the CSV row is readable without a
   lookup. Optional — fall back to the slug if absent.

   Names are lowercase with underscores ON PURPOSE. PHP rewrites spaces in
   incoming field names to underscores, so a field posted as "Programme
   title" arrives as $_POST['Programme_title'] and reading the spaced name
   returns nothing at all. Keeping both sides underscored removes the trap
   rather than compensating for it — register.js appends these exact keys. */
$programmeTitle = field('programme_title');
$programmeDates = field('programme_dates');
$programmeVenue = field('programme_venue');

/* ---------------------------------------------------------------------------
   Spam gate

   The form is public, so nothing stops an automated script from posting to
   it directly and filling the CSV with junk rows.

   Two cheap signals, both silent: a rejected post gets the same generic
   response an accepted one would, so a bot learns nothing about which check
   caught it.

   1. Honeypot — a field hidden from people, so anything in it came from
      something filling in every input it found.
   2. Elapsed time — register.js stamps the page-load time into `t`. A human
      cannot complete eleven fields in under three seconds. Only enforced when
      `t` is present and numeric: a missing stamp means the JS did not run,
      which is a broken page, not a bot, and a real registration should not be
      thrown away over it.

      `t` comes off the delegate's own clock and is compared against the
      server's, so a NEGATIVE elapsed time means the two disagree — a machine
      set ahead, or a 32-bit PHP build overflowing the millisecond value —
      not a fast submission. Only the 0–3s window is treated as a bot, so
      clock skew can never silently discard a real registration.
   --------------------------------------------------------------------------- */
$elapsed = isset($_POST['t']) && ctype_digit((string) $_POST['t'])
    ? (time() * 1000) - (int) $_POST['t']
    : null;

$tooFast = $elapsed !== null && $elapsed >= 0 && $elapsed < 3000;

if (field('website', 100) !== '' || $tooFast) {
    error_log('register-handler: submission rejected by spam gate.');
    respond(true, 'Registration received.');
}

$errors = [];

if (mb_strlen($fullname) < 2)                    { $errors[] = 'Full name'; }
if (mb_strlen($jobtitle) < 2)                    { $errors[] = 'Job title'; }
if (mb_strlen($company) < 2)                     { $errors[] = 'Organisation'; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL))  { $errors[] = 'Work email'; }
if (strlen(preg_replace('/\D/', '', $phone)) < 7) { $errors[] = 'Phone'; }
if ($programme === '')                            { $errors[] = 'Programme'; }
if (!ctype_digit($delegates) || (int) $delegates < 1 || (int) $delegates > 500) {
    $errors[] = 'Number of delegates';
}

if ($errors) {
    respond(false, 'Please check: ' . implode(', ', $errors) . '.');
}

/* ---------------------------------------------------------------------------
   CSV backup

   Values are prefixed with a leading apostrophe when they start with
   =, +, -, @, tab or carriage return — those characters make Excel/Sheets
   interpret a cell as a formula when the CSV is opened, so an unescaped
   delegate-supplied field (e.g. a "notes" entry starting with "=") could
   otherwise run arbitrary spreadsheet formulas on whoever opens the file
   (CSV/formula injection).
   --------------------------------------------------------------------------- */
function csvSafe($value) {
    if ($value !== '' && strpbrk($value[0], "=+-@\t\r") !== false) {
        return "'" . $value;
    }
    return $value;
}

$csvFile = __DIR__ . '/registrations.csv';
$isNew = !file_exists($csvFile);

$row = array_map('csvSafe', [
    date('Y-m-d H:i:s'),
    $fullname, $jobtitle, $company, $industry,
    $email, $phone, $country,
    $programme, $programmeTitle, $programmeDates, $programmeVenue,
    $delegates, $delivery, $notes,
]);

$fh = @fopen($csvFile, 'a');
if ($fh === false) {
    error_log('register-handler: could not open ' . $csvFile . ' for writing.');
    respond(false, 'We could not save your registration.');
}

/* The lock is best-effort. If it cannot be taken (some shared hosts and
   network filesystems refuse), the row is still written — an appended line
   that might interleave under simultaneous submissions is a far better
   outcome than a registration dropped on the floor. */
$locked = flock($fh, LOCK_EX);
if ($isNew) {
    fputcsv($fh, [
        'Submitted At', 'Full Name', 'Job Title', 'Organisation', 'Industry',
        'Email', 'Phone', 'Country',
        'Programme Slug', 'Programme Title', 'Programme Dates', 'Programme Venue',
        'Delegates', 'Delivery', 'Notes',
    ]);
}
fputcsv($fh, $row);
if ($locked) { flock($fh, LOCK_UN); }
fclose($fh);

respond(true, 'Registration received.');
