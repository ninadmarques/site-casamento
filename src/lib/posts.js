import { parseFrontMatter, renderMarkdown } from './markdown.js';

// Every .md file in src/content/posts/ becomes a Guest Guide card automatically.
// File names sort the cards: 01-…, 02-…  The slug is the name without number/extension.
const files = import.meta.glob('../content/posts/*.md', { query: '?raw', import: 'default', eager: true });

export const posts = Object.entries(files)
  .map(([path, raw]) => {
    const file = path.split('/').pop().replace(/\.md$/, '');
    const { data, body } = parseFrontMatter(raw);
    return {
      file,
      slug: file.replace(/^\d+-/, ''),
      title: data.title || file,
      category: data.category || 'Update',
      date: data.date || '',
      excerpt: data.excerpt || '',
      html: renderMarkdown(body),
    };
  })
  .sort((a, b) => a.file.localeCompare(b.file));

export const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};
