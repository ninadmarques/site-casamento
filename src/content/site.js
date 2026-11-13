// ─────────────────────────────────────────────────────────────
//  SITE SETTINGS — edit names, dates, venue and RSVP options here
// ─────────────────────────────────────────────────────────────
export const site = {
  couple: { first: 'Marina', second: 'Hans', initials: ['M', 'H'] },

  title: 'Marina & Hans · Frascati · 04 . 06 . 2027',
  tagline: 'Together with our families, we invite you to celebrate among the vines of Frascati.',

  date: {
    display: '04 . 06 . 2027',
    long: 'Friday, June 4, 2027',
    // Used by the countdown + "Add to Calendar". Times are Rome time (CEST = +02:00).
    startsAt: '2027-06-04T16:00:00+02:00',
    endsAt: '2027-06-04T23:30:00+02:00',
  },

  location: {
    short: 'Frascati · Rome · Italy',
    venueName: 'Villa among the vines (venue to be announced)',
    address: 'Frascati, Metropolitan City of Rome, Italy',
    mapsQuery: 'Frascati, Rome, Italy',
  },

  nav: [
    { label: 'Our Story', href: '#story' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Guest Guide', href: '#guide' },
    { label: 'Travel & Stay', href: '#travel' },
    { label: 'RSVP', href: '#rsvp' },
  ],

  // "Travel & Stay" quick cards — `post` is the file name of a Guest Guide post
  // (without the number prefix and .md), e.g. "accommodation".
  travel: [
    { title: 'Where to stay', text: 'Hotels, agriturismi and villas in Frascati and nearby Rome, with booking codes.', post: 'accommodation', cta: 'See stays' },
    { title: 'Getting there', text: 'Airports, the train from Roma Termini and our guest shuttle.', post: 'getting-there', cta: 'Plan your trip' },
  ],

  rsvp: {
    deadline: 'March 1, 2027',
    // Paste the Web App URL of your Google Apps Script here (see README, "Guest list").
    // Leave empty to run in preview mode with the sample guests in demo-guests.js.
    guestApi: '',
  },

  footer: 'Con amore — we cannot wait to celebrate with you.',
};
