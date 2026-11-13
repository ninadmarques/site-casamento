// Custom SVG crest: shield with the couple's initials, flanked by olive branches.

function branch(side) {
  // Quadratic bezier from the base, curling up the side of the shield.
  const P0 = [150, 244], P1 = [38, 214], P2 = [74, 62];
  const at = (t) => [
    (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0],
    (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1],
  ];
  const tan = (t) => [
    2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]),
    2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]),
  ];
  let leaves = '';
  const n = 9;
  for (let i = 0; i < n; i++) {
    const t = 0.1 + (i / (n - 1)) * 0.88;
    const [x, y] = at(t);
    const [dx, dy] = tan(t);
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    const len = 15 - t * 5;
    [-1, 1].forEach((s) => {
      leaves += `<ellipse cx="${(len * 0.55).toFixed(1)}" cy="0" rx="${len * 0.55}" ry="${(len * 0.2).toFixed(1)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(ang + s * 52).toFixed(1)})" fill="url(#leaf)" stroke="#424D33" stroke-width=".5" stroke-opacity=".5"/>`;
    });
  }
  const tip = at(1);
  leaves += `<ellipse cx="4" cy="0" rx="6" ry="2.4" transform="translate(${tip[0]} ${tip[1]}) rotate(${(Math.atan2(tan(1)[1], tan(1)[0]) * 180) / Math.PI})" fill="url(#leaf)" stroke="#424D33" stroke-width=".5" stroke-opacity=".5"/>`;
  const stem = `<path d="M${P0} Q${P1} ${P2}" fill="none" stroke="#424D33" stroke-width="1.4" stroke-linecap="round"/>`;
  return `<g ${side === 'r' ? 'transform="translate(300 0) scale(-1 1)"' : ''}>${stem}${leaves}</g>`;
}

export function crest({ className = '', label = 'M and H monogram crest', letters = ['M', 'H'] } = {}) {
  return `
<svg class="crest ${className}" viewBox="0 0 300 262" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8C9A76"/><stop offset="1" stop-color="#5A6746"/></linearGradient>
  </defs>
  ${branch('l')}${branch('r')}
  <!-- crown flourish -->
  <g fill="none" stroke="#B59A63" stroke-width="1.2" stroke-linecap="round">
    <path d="M126 38 Q138 28 150 34 Q162 28 174 38"/>
    <path d="M132 44 Q150 36 168 44"/>
    <circle cx="150" cy="27" r="2.6" fill="#B59A63"/>
    <circle cx="124" cy="39" r="1.6" fill="#B59A63"/><circle cx="176" cy="39" r="1.6" fill="#B59A63"/>
  </g>
  <!-- shield (double line) -->
  <path d="M103 54 H197 Q202 54 202 60 V128 Q202 186 150 216 Q98 186 98 128 V60 Q98 54 103 54 Z" fill="#F6F3EB" stroke="#B59A63" stroke-width="2"/>
  <path d="M109 62 H191 V128 Q191 178 150 205 Q109 178 109 128 Z" fill="none" stroke="#B59A63" stroke-width=".8" opacity=".7"/>
  <line x1="122" y1="132" x2="178" y2="132" stroke="#B59A63" stroke-width="1"/>
  <circle cx="150" cy="132" r="2.2" fill="#B59A63"/>
  <g font-family="'Cormorant Garamond', Georgia, serif" font-size="58" font-weight="500" fill="#424D33" text-anchor="middle">
    <text x="150" y="119">${letters[0]}</text>
    <text x="150" y="187">${letters[1]}</text>
  </g>
  <!-- crossed stems -->
  <path d="M130 250 L172 238 M170 250 L128 238" stroke="#424D33" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;
}

export const ornament = (cls = '') =>
  `<div class="orn ${cls}" aria-hidden="true"><span></span><i>❧</i><span></span></div>`;
