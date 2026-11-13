// Guest lookup + RSVP submission.
//   guestApi set  → talks to your Google Apps Script web app (apps-script/Code.gs)
//   guestApi empty → demo mode using src/content/demo-guests.js + localStorage
import { site } from '../content/site.js';
import { demoGuests } from '../content/demo-guests.js';

const api = site.rsvp.guestApi;
export const isDemo = !api;
// Same rules as the Apps Script: ignore case, accents and punctuation.
export const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
// Every name that can be used to find a party, e.g. "Giulia Rossi & Luca" → full name, "giulia rossi", "luca".
const aliases = (name) => [norm(name), ...String(name).split(/&|,|;|\+|\band\b|\bund\b|\be\b/i).map(norm)].filter(Boolean);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const demoStore = () => {
  try { const s = JSON.parse(localStorage.getItem('rsvp-demo') || '{}'); return Array.isArray(s) ? {} : s; } catch { return {}; }
};

export async function lookup(name) {
  const q = norm(name);
  if (isDemo) {
    await wait(400);
    const hits = q.length < 3 ? [] : demoGuests.filter((x) => aliases(x.name).includes(q));
    if (hits.length !== 1) return { ok: false, error: hits.length ? 'ambiguous' : 'not_found' };
    const g = hits[0];
    return { ok: true, party: { name: g.name, max: g.max }, response: demoStore()[norm(g.name)] || null };
  }
  const res = await fetch(`${api}?action=lookup&name=${encodeURIComponent(name)}`);
  return res.json();
}

export async function submit(payload) {
  if (isDemo) {
    await wait(500);
    const all = demoStore();
    all[norm(payload.partyName)] = payload;
    localStorage.setItem('rsvp-demo', JSON.stringify(all));
    console.info('[RSVP demo mode] Set rsvp.guestApi in src/content/site.js to save to your sheet.', payload);
    return { ok: true };
  }
  // text/plain keeps this a "simple" request, which Apps Script accepts without a CORS preflight.
  const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
  return res.json();
}
