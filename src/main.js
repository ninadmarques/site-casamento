import './styles.css';
import { site } from './content/site.js';
import { story } from './content/story.js';
import { gallery } from './content/gallery.js';
import { posts, formatDate } from './lib/posts.js';
import { crest, ornament } from './lib/crest.js';
import { googleCalendarUrl, icsBlobUrl } from './lib/calendar.js';
import { initRsvp, rsvpMarkup } from './rsvp.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Content files use '/images/…' paths; this makes them work under any base URL (e.g. GitHub Pages).
const asset = (p) => (/^(https?:|data:)/.test(p) ? p : import.meta.env.BASE_URL + String(p).replace(/^\//, ''));
const escAttr = (s) => String(s).replace(/"/g, '&quot;');

const head = (id, eyebrow, title, intro = '') => `
  <header class="section__head reveal">
    <p class="eyebrow">${eyebrow}</p>
    <h2 id="${id}">${title}</h2>
    ${ornament()}
    ${intro ? `<p class="lead">${intro}</p>` : ''}
  </header>`;

/* ── Navigation ─────────────────────────────────────────── */
$('#navLinks').innerHTML = site.nav.map((n) => `<a href="${n.href}">${n.label}</a>`).join('');
const nav = $('#nav'), toggle = $('#navToggle');
const setMenu = (open) => {
  nav.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
$$('#navLinks a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));
const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ── Hero ───────────────────────────────────────────────── */
$('#top').innerHTML = `
  <div class="hero__frame frame frame--double">
    <i class="frame-in"></i>
    <div class="hero__inner">
      <div class="hero__crest reveal">${crest({ letters: site.couple.initials })}</div>
      <p class="eyebrow reveal" style="--d:.1s">Save the Date</p>
      <h1 class="hero__title reveal" style="--d:.2s">
        <span>${site.couple.first}</span>
        <em class="amp">&amp;</em>
        <span>${site.couple.second}</span>
      </h1>
      <div class="orn orn--small reveal" style="--d:.3s" aria-hidden="true"><span></span><i>❧</i><span></span></div>
      <p class="hero__date reveal" style="--d:.35s">${site.date.display}</p>
      <p class="hero__place reveal" style="--d:.4s">${site.location.short}</p>

      <div class="countdown reveal" style="--d:.5s" id="countdown" role="timer" aria-label="Countdown to the wedding"></div>

      <div class="hero__cta reveal" style="--d:.6s">
        <a class="btn btn--solid" href="#rsvp">RSVP</a>
        <details class="menu">
          <summary class="btn btn--ghost">Add to Calendar</summary>
          <div class="menu__list">
            <a href="${googleCalendarUrl()}" target="_blank" rel="noopener">Google Calendar</a>
            <a href="#" id="icsLink" download="marina-and-hans-wedding.ics">Apple / Outlook (.ics)</a>
          </div>
        </details>
      </div>
    </div>
  </div>
  <a class="scrollcue" href="#story" aria-label="Scroll to our story"><span></span></a>`;

$('#icsLink').addEventListener('click', (e) => {
  e.currentTarget.href = icsBlobUrl();
});
document.addEventListener('click', (e) => {
  const m = $('.menu[open]');
  if (m && !m.contains(e.target)) m.removeAttribute('open');
});

/* ── Countdown ──────────────────────────────────────────── */
const cd = $('#countdown');
const target = new Date(site.date.startsAt).getTime();
const cell = (v, l) => `<div><b>${String(v).padStart(2, '0')}</b><span>${l}</span></div>`;
function tick() {
  const ms = target - Date.now();
  if (ms <= 0) {
    cd.innerHTML = `<p class="countdown__done">${Date.now() < new Date(site.date.endsAt).getTime() ? 'Today we celebrate!' : 'Just married — grazie mille!'}</p>`;
    return;
  }
  const s = Math.floor(ms / 1000);
  cd.innerHTML = cell(Math.floor(s / 86400), 'Days') + cell(Math.floor(s / 3600) % 24, 'Hours') + cell(Math.floor(s / 60) % 60, 'Minutes') + cell(s % 60, 'Seconds');
}
tick();
setInterval(tick, 1000);

/* ── Our Story ──────────────────────────────────────────── */
$('#story').innerHTML = `
  <div class="wrap">
    ${head('story-h', story.eyebrow, story.heading, story.intro)}
    ${story.chapters
      .map(
        (c, i) => `
      <article class="chapter ${i % 2 ? 'chapter--flip' : ''}">
        <figure class="chapter__img reveal">
          <div class="frame frame--double"><i class="frame-in"></i><img src="${asset(c.image)}" alt="${escAttr(c.alt)}" loading="lazy" /></div>
        </figure>
        <div class="chapter__text reveal" style="--d:.15s">
          <p class="eyebrow">${c.kicker}</p>
          <h3>${c.title}</h3>
          ${c.text.map((p) => `<p>${p}</p>`).join('')}
        </div>
      </article>`
      )
      .join('')}
  </div>`;

/* ── Vineyard banner (parallax) ─────────────────────────── */
const banner = $('#banner');
banner.style.backgroundImage = `url('${asset('/images/vineyard-banner.jpg')}')`;
if (!reduceMotion) {
  let ticking = false;
  const par = () => {
    const r = banner.parentElement.getBoundingClientRect();
    const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1..1
    banner.style.transform = `translate3d(0, ${(p * -40).toFixed(1)}px, 0) scale(1.12)`;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(par); } }, { passive: true });
  par();
}

/* ── Gallery + lightbox ─────────────────────────────────── */
$('#gallery').innerHTML = `
  <div class="wrap">
    ${head('gallery-h', gallery.eyebrow, gallery.heading, gallery.intro)}
    <div class="masonry">
      ${gallery.photos
        .map(
          (p, i) => `
        <button class="shot reveal" style="--d:${(i % 3) * 0.1}s;aspect-ratio:${p.ratio}" data-i="${i}" aria-label="Open photo: ${escAttr(p.alt)}">
          <img src="${asset(p.src)}" alt="${escAttr(p.alt)}" loading="lazy" />
          <span class="shot__cap">${p.caption || ''}</span>
        </button>`
        )
        .join('')}
    </div>
  </div>`;

const lb = $('#lightbox');
let cur = 0;
function showPhoto(i) {
  cur = (i + gallery.photos.length) % gallery.photos.length;
  const p = gallery.photos[cur];
  lb.innerHTML = `
    <div class="lightbox__frame frame frame--double"><i class="frame-in"></i>
      <img src="${asset(p.src)}" alt="${escAttr(p.alt)}" />
    </div>
    <p class="lightbox__cap">${p.caption || p.alt} <span>${cur + 1} / ${gallery.photos.length}</span></p>
    <button class="lb-btn lb-close" data-act="close" aria-label="Close">×</button>
    <button class="lb-btn lb-prev" data-act="prev" aria-label="Previous photo">‹</button>
    <button class="lb-btn lb-next" data-act="next" aria-label="Next photo">›</button>`;
}
$$('.shot').forEach((b) =>
  b.addEventListener('click', () => {
    showPhoto(+b.dataset.i);
    lb.showModal();
  })
);
lb.addEventListener('click', (e) => {
  const act = e.target.dataset?.act;
  if (act === 'prev') showPhoto(cur - 1);
  else if (act === 'next') showPhoto(cur + 1);
  else if (act === 'close' || e.target === lb) lb.close();
});
lb.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') showPhoto(cur - 1);
  if (e.key === 'ArrowRight') showPhoto(cur + 1);
});

/* ── Guest Guide (data-driven from /src/content/posts/*.md) ─ */
$('#guide').innerHTML = `
  <div class="wrap">
    ${head('guide-h', 'Journal & Guest Information', 'The Guest Guide', 'Everything you need to know — updated as the day approaches.')}
    <div class="cards">
      ${posts
        .map(
          (p, i) => `
        <article class="card reveal" style="--d:${(i % 2) * 0.12}s">
          <i class="frame-in"></i>
          <p class="eyebrow">${p.category}</p>
          <h3>${p.title}</h3>
          <p class="card__excerpt">${p.excerpt}</p>
          <footer>
            <time datetime="${p.date}">${formatDate(p.date)}</time>
            <button class="link" data-post="${p.slug}">Read more <span aria-hidden="true">→</span></button>
          </footer>
        </article>`
        )
        .join('')}
    </div>
  </div>`;

const pb = $('#postbox');
function openPost(slug) {
  const p = posts.find((x) => x.slug === slug);
  if (!p) return;
  pb.innerHTML = `
    <div class="postbox__paper frame frame--double"><i class="frame-in"></i>
      <button class="lb-btn lb-close" data-act="close" aria-label="Close">×</button>
      <div class="postbox__scroll">
        <p class="eyebrow">${p.category}</p>
        <h1>${p.title}</h1>
        ${ornament()}
        <div class="prose">${p.html}</div>
        <p class="postbox__date">Posted ${formatDate(p.date)}</p>
      </div>
    </div>`;
  pb.showModal();
  $('.postbox__scroll', pb).scrollTop = 0;
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-post]');
  if (t) openPost(t.dataset.post);
});
pb.addEventListener('click', (e) => {
  if (e.target === pb || e.target.dataset?.act === 'close') pb.close();
});

/* ── Travel & Stay ──────────────────────────────────────── */
const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.location.mapsQuery)}`;
$('#travel').innerHTML = `
  <div class="wrap">
    ${head('travel-h', 'Travel & Stay', 'Come to Frascati', 'A hill town of villas, vineyards and golden wine — twenty kilometres from the heart of Rome.')}
    <div class="travel__grid">
      <div class="travel__venue reveal frame frame--double">
        <i class="frame-in"></i>
        <p class="eyebrow">The Celebration</p>
        <h3>${site.location.venueName}</h3>
        <p>${site.location.address}</p>
        <p class="travel__date">${site.date.long}</p>
        <a class="btn btn--ghost" href="${mapUrl}" target="_blank" rel="noopener">Open in Maps</a>
      </div>
      ${site.travel
        .map(
          (t, i) => `
        <div class="travel__card reveal" style="--d:${(i + 1) * 0.12}s">
          <h3>${t.title}</h3>
          <p>${t.text}</p>
          <button class="link" data-post="${t.post}">${t.cta} <span aria-hidden="true">→</span></button>
        </div>`
        )
        .join('')}
    </div>
  </div>`;

/* ── RSVP ───────────────────────────────────────────────── */
$('#rsvp').innerHTML = `
  <div class="wrap wrap--narrow">
    ${head('rsvp-h', 'RSVP', 'Will you join us?', `Kindly reply by <strong>${site.rsvp.deadline}</strong>. Enter your name to find your invitation.`)}
    ${rsvpMarkup()}
  </div>`;
initRsvp();

/* ── Footer ─────────────────────────────────────────────── */
$('#footer').innerHTML = `
  ${crest({ className: 'crest--sm', letters: site.couple.initials })}
  <p class="footer__names">${site.couple.first} <em>&amp;</em> ${site.couple.second}</p>
  <p class="footer__meta">${site.date.display} · ${site.location.short}</p>
  <p class="footer__note">${site.footer}</p>`;

/* ── Reveal on scroll & active nav link ─────────────────── */
const io = new IntersectionObserver(
  (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }),
  { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
);
$$('.reveal').forEach((el) => (reduceMotion ? el.classList.add('in') : io.observe(el)));

const links = $$('#navLinks a');
const spy = new IntersectionObserver(
  (entries) => entries.forEach((en) => {
    if (en.isIntersecting) links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
  }),
  { rootMargin: '-45% 0px -50% 0px' }
);
[{ href: '#top' }, ...site.nav].forEach((n) => { const el = $(n.href); if (el) spy.observe(el); });
