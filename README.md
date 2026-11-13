# Marina & Hans — Wedding Website

A static, single-page wedding site (Vite + vanilla JS, no framework, no backend). Everything a guest sees comes from plain content files, so you never need to touch the layout code.

```bash
npm install      # first time only
npm run dev      # preview at http://localhost:5173
npm run build    # production files in /dist (deploy to Netlify, Vercel, GitHub Pages…)
```

## Where to edit things

| What | File |
| --- | --- |
| Names, date, venue, nav links, RSVP deadline, footer | `src/content/site.js` |
| "Our Story" chapters (text + photo) | `src/content/story.js` |
| Gallery photo list and captions | `src/content/gallery.js` |
| Guest Guide posts | `src/content/posts/*.md` |
| Colours and fonts | top of `src/styles.css` (`:root` variables) |

## Replacing the placeholder photos

- **Gallery:** drop your photos into `public/images/gallery/`, then update the `src` lines in `src/content/gallery.js`. Add or remove entries freely (`ratio` = width ÷ height, e.g. 1.5 for landscape, 0.8 for portrait).
- **Our Story:** replace the files in `public/images/story/` (or point `image` in `src/content/story.js` to new files).
- **Vineyard banner:** `public/images/vineyard-banner.jpg` (cropped from your Save the Date).

The current images are illustrated SVG placeholders. JPG, PNG and WebP all work.

## Editing the Guest Guide

Each Markdown file in `src/content/posts/` becomes a card, and clicking it opens the full text. To publish a new post, add a file such as `05-photographer.md`:

```markdown
---
title: A Note From Us
category: Update
date: 2026-12-01
excerpt: One sentence shown on the card.
---

Your text here. Use **bold**, *italic*, [links](https://example.com),
`- ` bullet lists, `1. ` numbered lists, `## ` headings and `> ` notes.

::swatches Our palette|Sage #788565|Terracotta #C27D5E
```

- The number prefix only controls the order (01, 02, …).
- `::swatches Caption|Name #hex|Name #hex` draws the colour dots.
- The four sample posts (accommodation, dress code, travel, itinerary) contain **sample details and placeholder booking codes** — please verify hotel names, prices, train times and the schedule before sharing.
- The "Travel & Stay" cards link to posts by file name without the number: `accommodation`, `getting-there`.

## Guest list & RSVP (Google Sheets)

You control who can reply, and for how many people, from a private Google Sheet. A guest types their name, the site finds their invitation, shows "up to N guests", and never lets them reply for more. Replies are written back into the same sheet. The full guest list is never sent to the browser.

**One-time setup (about 10 minutes):**

1. Create a Google Sheet. Rename the first tab to **`Guests`** and copy in `apps-script/guests-template.csv`:
   `Party name | Max guests | Private notes`.
2. **Extensions → Apps Script**, paste in all of `apps-script/Code.gs`, and save.
3. **Deploy → New deployment → Web app** → *Execute as: Me*, *Who has access: Anyone* → Deploy (approve the permissions). Copy the **Web app URL** (ends in `/exec`).
4. Paste it into `rsvp.guestApi` in `src/content/site.js`, then restart `npm run dev` (or rebuild).

**Day to day:**

- Add, remove or change a party (or its *Max guests*) in the `Guests` tab. It takes effect immediately, with no redeploy.
- Replies appear in a `Responses` tab (created automatically): one row per party, updated if a guest changes their answer. Compare it with `Guests` to see who has not replied.
- **How names match:** capitals, accents and punctuation are ignored, and the party name is split on `&`, `and`, `und`, `e` and commas. So `Giulia Rossi & Luca Bianchi` can be found by typing the full text, `Giulia Rossi`, or `Luca Bianchi`. A partial name such as just `Giulia` will not match.
- If two parties share a name, guests see "more than one invitation matches" and must give their full name. Make the party names distinct, for example `John Smith (Hans's uncle)`, and tell them what to type.
- Personal link: `https://your-site/?name=Giulia+Rossi` opens that guest's form directly.
- To close replies, set `RSVP_CLOSES = '2027-03-01'` at the top of `Code.gs` (then **Deploy → Manage deployments → Edit → New version**).
- If you change `Code.gs`, redeploy a *new version* of the web app. The URL stays the same.

**Notes**

- Keep the sheet **private**. The script runs as you, so guests never need access to the sheet itself.
- Name lookup is convenient but is not secret: anyone who knows a guest's full name can open their form and reply for them. For a wedding this is usually fine, and the allowance still caps the numbers. Guests only ever see their own party's name and allowance. If you later want it stricter, add an invitation code column.
- **Without `guestApi`**, the site runs in preview mode with the sample parties in `src/content/demo-guests.js`. Replies stay in that browser only. **Set `guestApi` before sharing the site.**

## Calendar & countdown

Both use `date.startsAt` / `date.endsAt` in `src/content/site.js` (currently a 16:00–23:30 Rome-time placeholder). Update them once the ceremony time is final.
