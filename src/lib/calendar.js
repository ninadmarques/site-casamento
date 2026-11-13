import { site } from '../content/site.js';

const stamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const title = `Wedding of ${site.couple.first} & ${site.couple.second}`;
const where = `${site.location.venueName}, ${site.location.address}`;
const about = `${site.tagline}\n\nMore details on the wedding website.`;

export const googleCalendarUrl = () => {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${stamp(site.date.startsAt)}/${stamp(site.date.endsAt)}`,
    details: about,
    location: where,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
};

export const icsBlobUrl = () => {
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Marina and Hans//Wedding//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:marina-hans-wedding-2027@wedding`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(site.date.startsAt)}`,
    `DTEND:${stamp(site.date.endsAt)}`,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(where)}`,
    `DESCRIPTION:${esc(about)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
};
