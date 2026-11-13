/**
 * Marina & Hans — RSVP backend (Google Apps Script, bound to your Google Sheet)
 *
 * Sheet tab "Guests"    : Party name | Max guests | Private notes
 *                         e.g. "Giulia Rossi & Luca Bianchi" | 2 | friends from Rome
 * Sheet tab "Responses" : created automatically (one row per party)
 *
 * A guest looks themselves up by typing their name. It matches the full party name
 * or any single name inside it (split on "&", "and" or ","), ignoring capitals,
 * accents and punctuation. The guest list is never sent to the browser: only the
 * matched party's name and allowance are returned.
 *
 * Deploy: Extensions > Apps Script > paste this > Deploy > New deployment >
 * Web app > Execute as: Me, Who has access: Anyone. Copy the /exec URL into
 * rsvp.guestApi in src/content/site.js.
 */
var GUESTS_SHEET = 'Guests';
var RESPONSES_SHEET = 'Responses';
var RESPONSE_HEADERS = ['Party name', 'Updated', 'Name(s) given', 'Email', 'Attending', 'Guests', 'Dietary', 'Note', 'Max allowed'];
var RSVP_CLOSES = ''; // optional, e.g. '2027-03-01' — replies after this date are refused

function norm_(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
function names_(partyName) { // every name that may be used to find this party
  var full = norm_(partyName), out = [full];
  String(partyName).split(/&|,|;|\+|\band\b|\bund\b|\be\b/i).forEach(function (p) { p = norm_(p); if (p) out.push(p); });
  return out;
}
function safe_(v) { v = String(v == null ? '' : v).slice(0, 600); return /^[=+\-@]/.test(v) ? "'" + v : v; } // block formula injection
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// Returns {name, max} | {error: 'not_found' | 'ambiguous'}
function findGuest_(query) {
  var q = norm_(query);
  if (q.length < 3) return { error: 'not_found' };
  var rows = SpreadsheetApp.getActive().getSheetByName(GUESTS_SHEET).getDataRange().getValues(), hits = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] && names_(rows[i][0]).indexOf(q) !== -1) hits.push({ name: String(rows[i][0]), max: Math.max(0, parseInt(rows[i][1], 10) || 0) });
  }
  if (hits.length === 1) return hits[0];
  return { error: hits.length ? 'ambiguous' : 'not_found' };
}

function responsesSheet_() {
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(RESPONSES_SHEET);
  if (!sh) { sh = ss.insertSheet(RESPONSES_SHEET); sh.appendRow(RESPONSE_HEADERS); sh.setFrozenRows(1); }
  return sh;
}
function findResponseRow_(sh, partyName) {
  var key = norm_(partyName), names = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues();
  for (var i = 1; i < names.length; i++) if (norm_(names[i][0]) === key) return i + 1;
  return 0;
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action !== 'lookup') return json_({ ok: false, error: 'bad_request' });
  var g = findGuest_(p.name);
  if (g.error) return json_({ ok: false, error: g.error });
  var sh = responsesSheet_(), row = findResponseRow_(sh, g.name), saved = null;
  if (row) {
    var r = sh.getRange(row, 1, 1, RESPONSE_HEADERS.length).getValues()[0];
    saved = { name: r[2], email: r[3], attending: r[4], party: r[5], dietary: r[6], note: r[7] };
  }
  return json_({ ok: true, party: g, response: saved });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var d = JSON.parse(e.postData.contents), g = findGuest_(d.partyName);
    if (g.error) return json_({ ok: false, error: g.error });
    if (RSVP_CLOSES && new Date() > new Date(RSVP_CLOSES + 'T23:59:59')) return json_({ ok: false, error: 'closed' });
    var attending = d.attending === 'yes' ? 'yes' : 'no';
    var guests = attending === 'yes' ? Math.min(Math.max(parseInt(d.party, 10) || 1, 1), g.max) : 0; // never above the allowance
    var email = String(d.email || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json_({ ok: false, error: 'invalid_email' });
    var sh = responsesSheet_(), row = findResponseRow_(sh, g.name);
    var values = [g.name, new Date(), safe_(d.name), safe_(email), attending, guests, safe_(d.dietary), safe_(d.note), g.max];
    if (row) sh.getRange(row, 1, 1, values.length).setValues([values]); else sh.appendRow(values);
    return json_({ ok: true, party: guests });
  } catch (err) {
    return json_({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}
