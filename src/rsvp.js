// RSVP: guest-name lookup → personalised form → confirmation.
// Eligibility (who may reply, and for how many people) comes from your Google Sheet
// via src/lib/guests.js. The browser never receives the full guest list.
import { lookup, submit, isDemo } from './lib/guests.js';
import { demoGuests } from './content/demo-guests.js';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function rsvpMarkup() {
  return `
  <div class="rsvp__paper frame frame--double reveal">
    <i class="frame-in"></i>

    <form id="codeForm" novalidate>
      <div class="field" data-field="code">
        <label for="f-code">Your name</label>
        <input id="f-code" name="code" type="text" autocomplete="name" placeholder="e.g. Giulia Rossi" />
        <small class="err" role="alert"></small>
        <small class="hint">Type your name exactly as it appears on your invitation.</small>
      </div>
      <button class="btn btn--solid btn--wide" type="submit" id="codeSubmit">Find my invitation</button>
      ${isDemo ? `<p class="demo-note"><strong>Preview mode:</strong> the site is not yet connected to your guest sheet. Try ${demoGuests.map((g) => `<code>${g.name.split(' &')[0]}</code>`).join(', ')}.</p>` : ''}
    </form>

    <form id="rsvpForm" novalidate hidden>
      <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true" />
      <div class="invite" id="inviteCard"></div>

      <div class="field" data-field="name">
        <label for="f-name">Full name(s) of guest(s)</label>
        <input id="f-name" name="name" type="text" autocomplete="name" required />
        <small class="err" role="alert"></small>
      </div>

      <div class="field" data-field="email">
        <label for="f-email">Email address</label>
        <input id="f-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required />
        <small class="err" role="alert"></small>
      </div>

      <fieldset class="field" data-field="attending">
        <legend>Will you attend?</legend>
        <div class="choice">
          <label><input type="radio" name="attending" value="yes" /><span>Joyfully Accepts</span></label>
          <label><input type="radio" name="attending" value="no" /><span>Regretfully Declines</span></label>
        </div>
        <small class="err" role="alert"></small>
      </fieldset>

      <div class="field" data-field="party" id="partyField">
        <label for="f-party">Number of guests in your party</label>
        <select id="f-party" name="party"></select>
        <small class="hint" id="partyHint"></small>
      </div>

      <div class="field" data-field="dietary">
        <label for="f-diet">Dietary restrictions / allergies <em>(optional)</em></label>
        <textarea id="f-diet" name="dietary" rows="2" placeholder="Vegetarian, gluten-free, nut allergy…"></textarea>
      </div>

      <div class="field" data-field="note">
        <label for="f-note">Song request or a note for the couple <em>(optional)</em></label>
        <textarea id="f-note" name="note" rows="3" placeholder="The song that will get you on the dance floor…"></textarea>
      </div>

      <p class="form__error" id="formError" role="alert" hidden></p>
      <button class="btn btn--solid btn--wide" type="submit" id="rsvpSubmit">Send RSVP</button>
    </form>

    <div class="rsvp__thanks" id="rsvpThanks" hidden tabindex="-1" aria-live="polite"></div>
  </div>`;
}

export function initRsvp() {
  const $ = (id) => document.getElementById(id);
  const codeForm = $('codeForm'), form = $('rsvpForm'), thanks = $('rsvpThanks');
  const submitBtn = $('rsvpSubmit'), formError = $('formError'), partyField = $('partyField');
  let invite = null; // { party:{name,max}, response }

  const setErr = (scope, name, msg) => {
    const wrap = scope.querySelector(`[data-field="${name}"]`);
    if (!wrap) return;
    wrap.classList.toggle('has-error', !!msg);
    wrap.querySelector('.err').textContent = msg || '';
  };

  /* ── Step 1: find the invitation ── */
  async function findInvite(raw) {
    const name = String(raw || '').trim();
    if (name.length < 3) return setErr(codeForm, 'code', 'Please enter your name as it appears on your invitation.');
    const btn = $('codeSubmit');
    btn.disabled = true; btn.textContent = 'Looking…';
    try {
      const r = await lookup(name);
      if (!r.ok) {
        setErr(codeForm, 'code', r.error === 'not_found' ? 'We could not find that name. Please check the spelling, or try your full name as written on the invitation.'
          : r.error === 'ambiguous' ? 'More than one invitation matches that name — please type your full name, or contact us.'
          : 'Something went wrong — please try again in a moment.');
        return;
      }
      invite = r;
      showForm();
    } catch (e) {
      console.error(e);
      setErr(codeForm, 'code', 'We could not reach the guest list. Please try again in a moment.');
    } finally {
      btn.disabled = false; btn.textContent = 'Find my invitation';
    }
  }
  codeForm.addEventListener('submit', (e) => { e.preventDefault(); setErr(codeForm, 'code', ''); findInvite(codeForm.code.value); });
  codeForm.addEventListener('input', () => setErr(codeForm, 'code', ''));

  /* ── Step 2: personalised form ── */
  function showForm() {
    const { party, response } = invite;
    const max = Math.max(1, party.max);
    $('inviteCard').innerHTML = `
      <p class="eyebrow">Your invitation</p>
      <h3>${esc(party.name)}</h3>
      <p>${max === 1 ? 'Your invitation is for <strong>one guest</strong>.' : `Your invitation is for up to <strong>${max} guests</strong>.`}
      <button type="button" class="link link--small" id="changeCode">Not you?</button></p>
      ${response ? '<p class="invite__again">We already have a reply from you — change anything below and send it again to update.</p>' : ''}`;

    form.reset();
    $('f-party').innerHTML = Array.from({ length: max }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
    $('partyHint').textContent = max > 1 ? `Up to ${max} guests, including yourself.` : '';
    form.name.value = response?.name || party.name;
    form.email.value = response?.email || '';
    if (response?.attending) form.querySelector(`input[name="attending"][value="${response.attending}"]`).checked = true;
    if (response?.party > 0) form.party.value = Math.min(response.party, max);
    form.dietary.value = response?.dietary || '';
    form.note.value = response?.note || '';
    syncParty();
    ['name', 'email', 'attending'].forEach((k) => setErr(form, k, ''));
    formError.hidden = true;

    codeForm.hidden = true; thanks.hidden = true; form.hidden = false;
    $('changeCode').addEventListener('click', () => { invite = null; form.hidden = true; codeForm.hidden = false; codeForm.code.focus(); });
    form.name.focus({ preventScroll: true });
  }

  const syncParty = () => (partyField.hidden = form.attending.value === 'no' || invite.party.max <= 1);
  form.addEventListener('change', (e) => { if (e.target.name === 'attending') syncParty(); if (e.target.name) setErr(form, e.target.name, ''); });
  form.addEventListener('input', (e) => e.target.name && setErr(form, e.target.name, ''));

  const read = () => {
    const f = new FormData(form);
    return {
      name: (f.get('name') || '').toString().trim(),
      email: (f.get('email') || '').toString().trim(),
      attending: f.get('attending') || '',
      party: Number(f.get('party') || 1),
      dietary: (f.get('dietary') || '').toString().trim(),
      note: (f.get('note') || '').toString().trim(),
      _gotcha: f.get('_gotcha') || '',
    };
  };
  const validate = (d) => {
    const errs = {};
    if (d.name.length < 2) errs.name = 'Please tell us who is replying.';
    if (!emailRe.test(d.email)) errs.email = 'Please enter a valid email address.';
    if (!d.attending) errs.attending = 'Please let us know if you can come.';
    return errs;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;
    const data = read();
    if (data._gotcha) return; // honeypot
    const errs = validate(data);
    ['name', 'email', 'attending'].forEach((k) => setErr(form, k, errs[k]));
    const first = Object.keys(errs)[0];
    if (first) return form.querySelector(`[data-field="${first}"] input`)?.focus();

    data.party = data.attending === 'no' ? 0 : invite.party.max <= 1 ? 1 : Math.min(Math.max(data.party, 1), invite.party.max);
    delete data._gotcha;
    submitBtn.disabled = true; submitBtn.textContent = 'Sending…';
    try {
      const r = await submit({ ...data, partyName: invite.party.name });
      if (!r.ok) throw new Error(r.error || 'failed');
      invite.response = { ...data };
      showThanks(data);
    } catch (err) {
      console.error(err);
      formError.textContent = err.message === 'closed'
        ? 'Replies are now closed — please contact us directly.'
        : 'Sorry — something went wrong sending your reply. Please try again in a moment.';
      formError.hidden = false;
    } finally {
      submitBtn.disabled = false; submitBtn.textContent = 'Send RSVP';
    }
  });

  function showThanks(d) {
    const first = d.name.split(/[\s&,]+/)[0];
    const yes = d.attending === 'yes';
    thanks.innerHTML = `
      <p class="eyebrow">${yes ? 'Grazie mille' : 'Grazie di cuore'}</p>
      <h3>${yes ? `We can’t wait to see you, ${esc(first)}!` : `We’ll miss you, ${esc(first)}.`}</h3>
      <div class="orn" aria-hidden="true"><span></span><i>❧</i><span></span></div>
      <p>${yes
        ? `Your joyful reply has arrived${d.party > 1 ? ` for ${d.party} guests` : ''}. We will write to <strong>${esc(d.email)}</strong> with any updates. Keep an eye on the Guest Guide for travel and schedule updates.`
        : 'Thank you for letting us know. You will be in our hearts on the day — and we will raise a glass to you.'}</p>
      <p class="rsvp__edit">Made a mistake? <button type="button" class="link" id="rsvpAgain">Change your reply</button></p>`;
    form.hidden = true; thanks.hidden = false; thanks.focus();
    $('rsvpAgain').addEventListener('click', showForm);
  }

  // Personal links: https://your-site/?name=Giulia+Rossi opens the form directly.
  const pre = new URLSearchParams(location.search).get('name');
  if (pre) {
    codeForm.code.value = pre;
    findInvite(pre).then(() => invite && document.getElementById('rsvp').scrollIntoView());
  }
}
