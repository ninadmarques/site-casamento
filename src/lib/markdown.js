// Tiny Markdown renderer for Guest Guide posts (no dependencies).
// Supports: front-matter, # headings, paragraphs, **bold**, *italic*, [links](url),
// - lists, 1. lists, > quotes, --- ornament, raw HTML blocks, and
//   ::swatches Caption|Name #hex|Name #hex   (colour swatches)

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function parseFrontMatter(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  m[1].split('\n').forEach((line) => {
    const i = line.indexOf(':');
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  return { data, body: m[2] };
}

const inline = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+|mailto:[^)\s]+|#[^)\s]*)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

function swatches(spec) {
  const parts = spec.split('|').map((p) => p.trim()).filter(Boolean);
  let caption = '';
  const chips = [];
  parts.forEach((p) => {
    const m = p.match(/^(.+?)\s+(#[0-9a-f]{3,8})$/i);
    if (m) chips.push(`<li style="--c:${m[2]}"><i></i><span>${esc(m[1])}</span></li>`);
    else caption = p;
  });
  return `<figure class="swatches">${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}<ul>${chips.join('')}</ul></figure>`;
}

export function renderMarkdown(src) {
  const blocks = src.replace(/\r/g, '').trim().split(/\n{2,}/);
  const html = [];
  for (const block of blocks) {
    const b = block.trim();
    if (!b) continue;
    if (b.startsWith('::swatches')) html.push(swatches(b.replace('::swatches', '')));
    else if (b.startsWith('<')) html.push(b);
    else if (/^---+$/.test(b)) html.push('<div class="orn" aria-hidden="true"><span></span><i>❧</i><span></span></div>');
    else if (/^#{1,3}\s/.test(b)) {
      const level = b.match(/^#+/)[0].length + 1; // # → h2 (the modal title is h1)
      html.push(`<h${level}>${inline(b.replace(/^#+\s*/, ''))}</h${level}>`);
    } else if (/^>\s?/.test(b)) html.push(`<blockquote>${inline(b.replace(/^>\s?/gm, ''))}</blockquote>`);
    else if (/^[-*]\s/.test(b)) html.push(`<ul>${b.split('\n').map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`);
    else if (/^\d+\.\s/.test(b)) html.push(`<ol>${b.split('\n').map((l) => `<li>${inline(l.replace(/^\d+\.\s+/, ''))}</li>`).join('')}</ol>`);
    else html.push(`<p>${inline(b.replace(/\n/g, ' '))}</p>`);
  }
  return html.join('\n');
}
