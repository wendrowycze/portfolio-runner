// Generator obrazów case'ów (placeholdery wg docs/04_STYL_I_ASSETY.md): `npm run paintings`.
// Wspólne: rama maureskowa, marmur, sylwetki-kariatydy; per case: motyw środkowy i rekwizyty postaci.
// Wynik: public/assets/paintings/<id>.svg (960×640, siatka 3×2). Żadnych ilustracji z zewnątrz.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const C = {
  bgDeep: '#261619',
  panelBg: '#3E2219',
  warn: '#742224',
  ground: '#895F47',
  gold: '#DFB67C',
  text: '#E2E9E1',
  textMuted: '#ACCBC6',
  cool: '#3D5E67',
  mid: '#11485D',
  far: '#0B2F2E',
};

const defs = (theme) => `
  <defs>
    <radialGradient id="glow" cx="50%" cy="38%" r="60%">
      <stop offset="0" stop-color="${theme === 'biznes' ? C.mid : C.panelBg}"/>
      <stop offset="1" stop-color="${theme === 'biznes' ? C.far : C.bgDeep}"/>
    </radialGradient>
    <pattern id="mauresque" width="48" height="48" patternUnits="userSpaceOnUse">
      <rect width="48" height="48" fill="${C.panelBg}"/>
      <path d="M24 3 L30 18 L45 24 L30 30 L24 45 L18 30 L3 24 L18 18 Z" fill="none" stroke="${C.gold}" stroke-width="2"/>
      <circle cx="24" cy="24" r="4" fill="${C.gold}"/>
      <path d="M0 0 L8 0 L0 8 Z M48 48 L40 48 L48 40 Z M48 0 L40 0 L48 8 Z M0 48 L8 48 L0 40 Z" fill="${C.ground}"/>
    </pattern>
    <pattern id="blueprint" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="${C.far}"/>
      <path d="M0 0 H40 M0 0 V40" fill="none" stroke="${C.gold}" stroke-opacity="0.35" stroke-width="1"/>
      <path d="M20 0 V40 M0 20 H40" fill="none" stroke="${C.gold}" stroke-opacity="0.12" stroke-width="1"/>
    </pattern>
    <pattern id="shelves" width="64" height="48" patternUnits="userSpaceOnUse">
      <rect width="64" height="48" fill="${C.far}"/>
      <rect x="0" y="40" width="64" height="4" fill="${C.ground}"/>
      <rect x="6" y="10" width="8" height="30" fill="${C.warn}"/><rect x="16" y="6" width="10" height="34" fill="${C.cool}"/>
      <rect x="28" y="12" width="7" height="28" fill="${C.gold}" fill-opacity="0.8"/><rect x="37" y="8" width="11" height="32" fill="${C.mid}"/><rect x="50" y="14" width="8" height="26" fill="${C.warn}"/>
    </pattern>
    <pattern id="marble" width="160" height="160" patternUnits="userSpaceOnUse">
      <rect width="160" height="160" fill="${theme === 'biznes' ? C.far : C.panelBg}"/>
      <path d="M-10 40 Q40 20 90 60 T170 50" fill="none" stroke="${C.ground}" stroke-opacity="0.35" stroke-width="2"/>
      <path d="M-10 120 Q60 90 110 130 T170 110" fill="none" stroke="${C.gold}" stroke-opacity="0.12" stroke-width="1.5"/>
    </pattern>
    <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.gold}"/>
      <stop offset="1" stop-color="${C.ground}"/>
    </linearGradient>
  </defs>`;

/** Sylwetka postaci (origin: stopy na y=0). Ręce: pozycje dłoni względem barków. */
function figure(x, y, { left = [-62, -150], right = [62, -150], scale = 1 } = {}) {
  const arm = (hx, hy) =>
    `<path d="M${hx > 0 ? 20 : -20} -86 L${hx * 0.6} ${-86 + (hy + 86) * 0.5} L${hx} ${hy}" fill="none" stroke="${C.ground}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
     <path d="M${hx > 0 ? 20 : -20} -86 L${hx * 0.6} ${-86 + (hy + 86) * 0.5} L${hx} ${hy}" fill="none" stroke="${C.gold}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <circle cx="0" cy="-118" r="22" fill="${C.ground}" stroke="${C.gold}" stroke-width="3"/>
    <path d="M-26 -92 L26 -92 L38 24 L-38 24 Z" fill="${C.ground}" stroke="${C.gold}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M-14 -70 L14 -70 L18 -58 L-18 -58 Z" fill="${C.gold}"/>
    ${arm(left[0], left[1])}
    ${arm(right[0], right[1])}
    <path d="M-24 24 L-20 96 M24 24 L20 96" fill="none" stroke="${C.ground}" stroke-width="16" stroke-linecap="round"/>
    <path d="M-34 100 L-6 100 M6 100 L34 100" fill="none" stroke="${C.gold}" stroke-width="6" stroke-linecap="round"/>
  </g>`;
}

const rays = `<g stroke="${C.gold}" stroke-opacity="0.09" stroke-width="10">
    <path d="M480 120 L120 380"/><path d="M480 120 L220 60"/><path d="M480 120 L840 380"/><path d="M480 120 L740 60"/>
    <path d="M480 120 L60 200"/><path d="M480 120 L900 200"/><path d="M480 120 L480 -20"/>
  </g>`;

function frame(theme, inner, inscription) {
  const pattern = theme === 'biznes' ? 'blueprint' : theme === 'edukacja' ? 'shelves' : 'mauresque';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640" width="960" height="640">
  <!-- Wygenerowane przez scripts/paintings.mjs (npm run paintings). Nie edytować ręcznie. -->
  ${defs(theme)}
  <rect width="960" height="640" fill="url(#${pattern})"/>
  <rect x="36" y="36" width="888" height="568" fill="url(#marble)"/>
  <rect x="36" y="36" width="888" height="568" fill="url(#glow)" opacity="0.75"/>
  <rect x="36" y="36" width="888" height="568" fill="none" stroke="${C.gold}" stroke-width="6"/>
  <rect x="48" y="48" width="864" height="544" fill="none" stroke="${C.ground}" stroke-width="2"/>
  ${rays}
  ${inner}
  <rect x="60" y="576" width="840" height="4" fill="${C.gold}"/>
  <text x="480" y="600" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="15" letter-spacing="6" fill="${C.gold}">${inscription}</text>
</svg>
`;
}

// ---------- rekwizyty ----------
const plinth = (x, y, w) =>
  `<rect x="${x - w / 2}" y="${y}" width="${w}" height="12" fill="${C.gold}"/><rect x="${x - w / 2 - 16}" y="${y + 12}" width="${w + 32}" height="12" fill="${C.ground}" stroke="${C.gold}" stroke-width="2"/>`;
const mask = (x, y, r = 14, smile = true) =>
  `<g transform="translate(${x} ${y})"><path d="M-${r} -${r} Q0 -${r * 1.9} ${r} -${r} Q${r * 1.2} ${r * 0.4} 0 ${r * 1.2} Q-${r * 1.2} ${r * 0.4} -${r} -${r} Z" fill="${C.text}" stroke="${C.gold}" stroke-width="2"/><circle cx="-${r * 0.4}" cy="-${r * 0.4}" r="2.5" fill="${C.panelBg}"/><circle cx="${r * 0.4}" cy="-${r * 0.4}" r="2.5" fill="${C.panelBg}"/><path d="M-${r * 0.5} ${r * 0.3} Q0 ${smile ? r * 0.8 : -r * 0.1} ${r * 0.5} ${r * 0.3}" stroke="${C.panelBg}" stroke-width="2.5" fill="none"/></g>`;
const card = (x, y, w, h, tilt, lines = 3) =>
  `<g transform="translate(${x} ${y}) rotate(${tilt})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="4" fill="${C.text}" stroke="${C.gold}" stroke-width="3"/>${Array.from({ length: lines }, (_, i) => `<rect x="${-w / 2 + 10}" y="${-h / 2 + 14 + i * 12}" width="${w - 20 - (i % 2) * 14}" height="4" fill="${C.ground}"/>`).join('')}</g>`;
const bubble = (x, y, w, h, text) =>
  `<g transform="translate(${x} ${y})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" fill="${C.text}" stroke="${C.gold}" stroke-width="2"/><path d="M-8 ${h / 2} L0 ${h / 2 + 12} L8 ${h / 2} Z" fill="${C.text}"/><text x="0" y="6" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="${C.panelBg}">${text}</text></g>`;
const chart = (x, y, values, w = 200, h = 120) => {
  const bw = w / values.length;
  const max = Math.max(...values);
  return `<g transform="translate(${x} ${y})"><path d="M0 0 V${h} H${w}" fill="none" stroke="${C.gold}" stroke-width="3"/>${values
    .map(
      (v, i) =>
        `<rect x="${i * bw + 6}" y="${h - (v / max) * (h - 10)}" width="${bw - 12}" height="${(v / max) * (h - 10)}" fill="${i === values.length - 1 ? C.warn : C.ground}" stroke="${C.gold}" stroke-width="2"/>`,
    )
    .join('')}</g>`;
};

// ---------- motywy per case ----------
const PAINTINGS = {
  'kultura-futura': {
    theme: 'kultura',
    inscription: 'BIENNALE PRZYSZŁOŚCI KULTURY · KRAKÓW',
    inner: `
      <g id="globe">
        ${plinth(480, 400, 160)}
        <circle cx="480" cy="270" r="110" fill="${C.panelBg}" stroke="${C.gold}" stroke-width="6"/>
        <ellipse cx="480" cy="270" rx="45" ry="110" fill="none" stroke="${C.gold}" stroke-width="3"/>
        <ellipse cx="480" cy="270" rx="110" ry="40" fill="none" stroke="${C.gold}" stroke-width="3"/>
        <line x1="370" y1="270" x2="590" y2="270" stroke="${C.gold}" stroke-width="3"/>
        ${[
          [300, 150],
          [660, 130],
          [250, 330],
          [700, 330],
          [560, 90],
          [400, 90],
        ]
          .map(
            ([nx, ny]) =>
              `<line x1="480" y1="270" x2="${nx}" y2="${ny}" stroke="${C.gold}" stroke-opacity="0.6" stroke-width="2"/><circle cx="${nx}" cy="${ny}" r="9" fill="${C.text}" stroke="${C.gold}" stroke-width="3"/>`,
          )
          .join('')}
        <text x="480" y="278" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="${C.text}" letter-spacing="3">VR · AR</text>
      </g>
      ${figure(262, 470, { left: [-70, -140], right: [50, -150] })}
      <g transform="translate(192 330) rotate(-10)">${card(0, 0, 44, 60, 0, 4)}</g>
      ${figure(480, 476)}
      <rect x="446" y="-10" width="68" height="22" rx="6" transform="translate(0 366)" fill="${C.text}" stroke="${C.gold}" stroke-width="3"/>
      ${figure(698, 470, { left: [-50, -150], right: [70, -140] })}
      <path d="M768 330 L780 460" stroke="${C.text}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="768" cy="330" r="6" fill="${C.gold}"/>`,
  },
  'cyrograf-na-kwadrat': {
    theme: 'kultura',
    inscription: 'ŚLEDZTWO · PARLAMENT STUDENTÓW RP · MMXXI',
    inner: `
      <rect x="230" y="110" width="500" height="300" rx="6" fill="${C.panelBg}" stroke="${C.ground}" stroke-width="10"/>
      <rect x="230" y="110" width="500" height="300" fill="none" stroke="${C.gold}" stroke-width="3"/>
      ${[
        [280, 150, -6],
        [360, 170, 4],
        [300, 250, 3],
        [400, 300, -5],
        [340, 350, 6],
        [470, 200, -3],
        [450, 340, 2],
      ]
        .map(([cx, cy, t]) => card(cx, cy, 56, 40, t, 2))
        .join('')}
      <g stroke="${C.warn}" stroke-width="3" fill="none"><path d="M280 150 L360 170 L470 200 M300 250 L400 300 L450 340 M360 170 L300 250 M470 200 L400 300"/></g>
      ${[
        [280, 150],
        [360, 170],
        [300, 250],
        [400, 300],
        [340, 350],
        [470, 200],
        [450, 340],
      ]
        .map(
          ([cx, cy]) =>
            `<circle cx="${cx}" cy="${cy - 20}" r="4" fill="${C.warn}" stroke="${C.gold}" stroke-width="1.5"/>`,
        )
        .join('')}
      ${chart(520, 150, [2, 3, 3, 4, 9, 12], 190, 220)}
      <text x="615" y="395" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="${C.gold}" letter-spacing="2">2013 → 2021</text>
      <g transform="translate(150 420)"><circle cx="0" cy="0" r="46" fill="none" stroke="${C.text}" stroke-width="10"/><circle cx="0" cy="0" r="38" fill="${C.gold}" fill-opacity="0.18"/><path d="M34 34 L86 86" stroke="${C.text}" stroke-width="14" stroke-linecap="round"/></g>
      ${figure(300, 500, { left: [-60, -140], right: [58, -150], scale: 0.7 })}
      ${figure(480, 506, { left: [-56, -150], right: [56, -150], scale: 0.7 })}
      ${figure(660, 500, { left: [-58, -150], right: [60, -140], scale: 0.7 })}
      <rect x="452" y="336" width="56" height="18" rx="3" fill="${C.text}" stroke="${C.gold}" stroke-width="2"/>`,
  },
  'ko-kreacja-mkidn': {
    theme: 'kultura',
    inscription: 'CANVAS KO-KREACJI · BARDZO MŁODA KULTURA · LUBLIN',
    inner: `
      <rect x="200" y="100" width="560" height="260" rx="8" fill="${C.text}" stroke="${C.gold}" stroke-width="8"/>
      ${['MIASTO', 'MIESZKAŃCY', 'OŚRODEK']
        .map(
          (label, i) =>
            `<g transform="translate(${200 + i * 186.6} 100)"><rect x="0" y="0" width="186.6" height="44" fill="${C.ground}" stroke="${C.gold}" stroke-width="2"/><text x="93" y="29" text-anchor="middle" font-family="Georgia, serif" font-size="16" letter-spacing="2" fill="${C.text}">${label}</text>${[0, 1, 2].map((r) => `<rect x="${22 + (r % 2) * 10}" y="${64 + r * 64}" width="140" height="44" rx="3" fill="${[C.gold, C.textMuted, C.warn][(i + r) % 3]}" fill-opacity="0.85" transform="rotate(${(r - 1) * 2 * (i % 2 ? -1 : 1)} 93 ${86 + r * 64})"/>`).join('')}</g>`,
        )
        .join('')}
      <line x1="386.6" y1="100" x2="386.6" y2="360" stroke="${C.gold}" stroke-width="3"/>
      <line x1="573.2" y1="100" x2="573.2" y2="360" stroke="${C.gold}" stroke-width="3"/>
      <rect x="160" y="420" width="640" height="16" fill="${C.ground}" stroke="${C.gold}" stroke-width="2"/>
      ${figure(262, 476, { left: [-64, -150], right: [56, -160], scale: 0.9 })}
      ${figure(480, 480, { left: [-60, -160], right: [60, -160], scale: 0.9 })}
      ${figure(698, 476, { left: [-56, -160], right: [64, -150], scale: 0.9 })}`,
  },
  kalejdoskop: {
    theme: 'kultura',
    inscription: 'KALEJDOSKOP · GARDZIENICE · 120 AKTORÓW · 4 KRAJE',
    inner: `
      <g transform="translate(480 250)" fill="none" stroke="${C.gold}" stroke-opacity="0.5" stroke-width="2">
        ${[0, 30, 60, 90, 120, 150].map((a) => `<polygon points="0,-150 130,75 -130,75" transform="rotate(${a})"/>`).join('')}
      </g>
      <g id="palace">
        <rect x="280" y="230" width="400" height="150" fill="${C.panelBg}" stroke="${C.gold}" stroke-width="4"/>
        <path d="M262 232 L698 232 L480 150 Z" fill="${C.ground}" stroke="${C.gold}" stroke-width="4" stroke-linejoin="round"/>
        ${[320, 400, 480, 560, 640].map((cx) => `<rect x="${cx - 12}" y="240" width="24" height="140" fill="url(#stone)"/><rect x="${cx - 18}" y="236" width="36" height="8" fill="${C.gold}"/>`).join('')}
        ${[360, 440, 520, 600].map((cx) => `<rect x="${cx - 16}" y="270" width="32" height="48" fill="${C.gold}" fill-opacity="0.35" stroke="${C.gold}" stroke-width="2"/>`).join('')}
        <path d="M456 380 L456 320 A24 24 0 0 1 504 320 L504 380 Z" fill="${C.gold}" fill-opacity="0.5" stroke="${C.gold}" stroke-width="3"/>
        ${plinth(480, 380, 420)}
      </g>
      <g transform="translate(480 500)"><path d="M-40 40 L-10 -30 L0 -60 L10 -30 L40 40 Z" fill="${C.warn}" stroke="${C.gold}" stroke-width="3" stroke-linejoin="round"/><path d="M-18 40 L-4 0 L0 -20 L4 0 L18 40 Z" fill="${C.gold}"/><rect x="-60" y="40" width="120" height="8" fill="${C.ground}"/></g>
      ${figure(230, 470, { left: [-60, -150], right: [80, -190] })}
      <path d="M310 275 L330 240" stroke="${C.text}" stroke-width="8" stroke-linecap="round"/><rect x="298" y="268" width="24" height="6" transform="rotate(-60 310 271)" fill="${C.gold}"/>
      ${figure(730, 470, { left: [-80, -190], right: [56, -150] })}
      <path d="M650 280 L622 250 L648 232 L670 262 Z" fill="${C.text}" stroke="${C.gold}" stroke-width="2"/>`,
  },
  'ewaluacja-festiwali': {
    theme: 'kultura',
    inscription: 'PRZEDZIERANKA · EWALUACJA FESTIWALU · 100 STRON',
    inner: `
      <g transform="translate(200 120) rotate(-6)">
        <path d="M0 0 H300 V210 H0 Z" fill="${C.text}" stroke="${C.gold}" stroke-width="4"/>
        ${[0, 1, 2, 3, 4].map((i) => `<rect x="24" y="${26 + i * 34}" width="${170 - (i % 2) * 40}" height="6" fill="${C.ground}"/><path d="M300 ${20 + i * 34} l-14 8 l14 8" fill="${i % 2 ? C.warn : C.text}" stroke="${C.warn}" stroke-width="2"/>`).join('')}
        <text x="24" y="16" font-family="Georgia, serif" font-size="12" fill="${C.warn}" letter-spacing="2">NADERWIJ TU</text>
      </g>
      ${figure(560, 330, { left: [-56, -150], right: [56, -150], scale: 0.6 })}
      ${[
        [470, 140, 0],
        [640, 150, 12],
        [450, 230, -8],
        [660, 240, 6],
        [500, 300, 10],
        [620, 310, -12],
        [560, 100, -4],
      ]
        .map(
          ([cx, cy, t]) =>
            `<g transform="translate(${cx} ${cy}) rotate(${t})"><rect x="-26" y="-26" width="52" height="52" fill="${C.ground}" stroke="${C.gold}" stroke-width="3"/><rect x="-26" y="-26" width="52" height="12" fill="${C.gold}"/></g>`,
        )
        .join('')}
      <rect x="160" y="420" width="640" height="16" fill="${C.ground}" stroke="${C.gold}" stroke-width="2"/>
      ${figure(262, 480, { left: [-64, -150], right: [56, -160], scale: 0.9 })}
      ${figure(698, 480, { left: [-56, -160], right: [64, -150], scale: 0.9 })}
      <g transform="translate(150 500)"><circle cx="0" cy="0" r="34" fill="none" stroke="${C.text}" stroke-width="8"/><path d="M26 26 L64 64" stroke="${C.text}" stroke-width="11" stroke-linecap="round"/></g>`,
  },
  'up-arta': {
    theme: 'kultura',
    inscription: "UP-ART'A · GDYNIA DESIGN DAYS · MMXIX",
    inner: `
      <g stroke="${C.gold}" stroke-opacity="0.45" stroke-width="2" fill="none">
        <path d="M120 120 H260 V200 H320 M840 120 H700 V200 H640 M120 460 H260 V400 H320 M840 460 H700 V400 H640"/>
        ${[
          [120, 120],
          [840, 120],
          [120, 460],
          [840, 460],
        ]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${C.gold}"/>`)
          .join('')}
      </g>
      <g transform="translate(480 290)">
        <rect x="-150" y="-150" width="300" height="300" rx="10" fill="${C.panelBg}" stroke="${C.gold}" stroke-width="8"/>
        ${[0, 90, 180, 270]
          .map(
            (a) =>
              `<g transform="rotate(${a})">${Array.from({ length: 8 }, (_, i) => `<rect x="${-140 + i * 35}" y="-150" width="33" height="52" fill="${C.text}" stroke="${C.ground}" stroke-width="2"/>`).join('')}${[0, 1, 3, 4, 5].map((i) => `<rect x="${-118 + i * 35}" y="-150" width="18" height="32" fill="${C.bgDeep}"/>`).join('')}<rect x="-140" y="-96" width="280" height="6" fill="${C.gold}" fill-opacity="0.8"/></g>`,
          )
          .join('')}
        <circle cx="0" cy="0" r="52" fill="${C.bgDeep}" stroke="${C.gold}" stroke-width="4"/>
        <text x="0" y="-8" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="${C.gold}" letter-spacing="2">ASYSTUJE</text>
        <text x="0" y="12" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="${C.gold}" letter-spacing="2">GRA · UCZY</text>
        <text x="0" y="30" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="${C.gold}" letter-spacing="2">SŁUCHA</text>
      </g>
      ${figure(230, 500, { left: [-60, -150], right: [70, -150], scale: 0.85 })}
      ${figure(730, 500, { left: [-70, -150], right: [60, -150], scale: 0.85 })}
      <path d="M170 375 L150 330" stroke="${C.text}" stroke-width="6" stroke-linecap="round"/><circle cx="150" cy="326" r="6" fill="${C.warn}"/>
      <rect x="770" y="350" width="34" height="42" rx="3" fill="${C.text}" stroke="${C.gold}" stroke-width="2"/>`,
  },
  'gra-teatralna-improvisio': {
    theme: 'kultura',
    inscription: 'IMPROVISIO · SYTUACJA · POSTAĆ · PRZEDMIOT',
    inner: `
      ${card(360, 260, 170, 240, -14, 6)}
      ${card(480, 240, 170, 240, 0, 6)}
      ${card(600, 260, 170, 240, 14, 6)}
      ${mask(360, 190, 20)}
      <g transform="translate(480 170)"><rect x="-30" y="-20" width="60" height="40" rx="10" fill="${C.ground}" stroke="${C.gold}" stroke-width="3"/><path d="M-6 20 L0 32 L6 20 Z" fill="${C.ground}"/></g>
      <g transform="translate(600 190) rotate(14)"><path d="M-26 10 L-26 -10 L26 -10 L26 10 Z" fill="${C.bgDeep}" stroke="${C.gold}" stroke-width="3"/>${[-18, -6, 6, 18].map((kx) => `<rect x="${kx - 4}" y="-8" width="8" height="12" fill="${C.text}"/>`).join('')}</g>
      <text x="480" y="420" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="${C.gold}" letter-spacing="3">EASY TO PLAY · HARD TO MASTER</text>
      ${figure(210, 500, { left: [-60, -150], right: [66, -180], scale: 0.85 })}
      ${mask(268, 350, 16, false)}
      ${figure(750, 500, { left: [-66, -180], right: [60, -150], scale: 0.85 })}
      ${mask(692, 350, 16, true)}`,
  },
  'scouting-pfr': {
    theme: 'biznes',
    inscription: 'SZKOŁA PIONIERÓW PFR · ANALIZA KONKURENCJI · 3 EDYCJE',
    inner: `
      <g transform="translate(480 250)" fill="none" stroke="${C.gold}" stroke-width="3">
        <circle r="120"/><circle r="90" stroke-dasharray="6 8"/><circle r="12" fill="${C.gold}"/>
        <path d="M0 -120 L14 0 L0 120 L-14 0 Z" fill="${C.text}"/><path d="M-120 0 L0 14 L120 0 L0 -14 Z" fill="${C.textMuted}"/>
        <text x="0" y="-132" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="${C.gold}" stroke="none">RYNEK</text>
      </g>
      ${chart(150, 140, [3, 5, 4, 8, 11], 170, 130)}
      <g transform="translate(700 170) rotate(-30)"><rect x="0" y="-14" width="120" height="28" rx="6" fill="${C.textMuted}" stroke="${C.gold}" stroke-width="3"/><rect x="110" y="-20" width="40" height="40" rx="6" fill="${C.text}" stroke="${C.gold}" stroke-width="3"/><circle cx="130" cy="0" r="9" fill="${C.mid}"/></g>
      ${['EN', 'PL', 'DE', 'ES', 'UA'].map((l, i) => bubble(200 + i * 140, 400, 60, 34, l)).join('')}
      ${figure(262, 520, { left: [-60, -150], right: [56, -150], scale: 0.75 })}
      ${figure(480, 526, { left: [-56, -150], right: [56, -150], scale: 0.75 })}
      ${figure(698, 520, { left: [-56, -150], right: [60, -150], scale: 0.75 })}`,
  },
  'narzedziownik-biz': {
    theme: 'edukacja',
    inscription: 'ZWOLNIENI Z TEORII · NARZĘDZIOWNIK BIZ · 60 003 UCZNIÓW',
    inner: `
      <g transform="translate(480 230)">
        <rect x="-150" y="-70" width="300" height="130" rx="8" fill="${C.ground}" stroke="${C.gold}" stroke-width="5"/>
        <rect x="-150" y="-70" width="300" height="22" fill="${C.gold}"/>
        <rect x="-30" y="-92" width="60" height="30" rx="6" fill="none" stroke="${C.gold}" stroke-width="5"/>
        <g stroke="${C.text}" stroke-width="10" stroke-linecap="round"><path d="M-110 -20 L-60 40"/><path d="M-40 -30 L-40 40"/><path d="M20 -30 L60 40"/><path d="M100 -20 L100 40"/></g>
        <circle cx="-110" cy="-24" r="14" fill="${C.gold}"/><rect x="-52" y="-42" width="24" height="16" fill="${C.gold}"/><path d="M8 -40 L32 -40 L20 -18 Z" fill="${C.gold}"/><rect x="88" y="-40" width="24" height="24" rx="12" fill="${C.gold}"/>
      </g>
      ${chart(120, 130, [2, 4, 9, 14, 20], 170, 120)}
      <g transform="translate(700 130)"><rect x="0" y="0" width="150" height="100" fill="${C.far}" stroke="${C.gold}" stroke-width="4"/><text x="75" y="60" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="${C.text}">BIZ</text></g>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${140 + i * 120}" y="430" width="90" height="18" fill="${C.ground}" stroke="${C.gold}" stroke-width="2"/>`).join('')}
      ${figure(240, 520, { left: [-60, -150], right: [70, -190], scale: 0.75 })}
      ${figure(720, 520, { left: [-70, -190], right: [60, -150], scale: 0.75 })}`,
  },
  'tajemnica-pieczeci': {
    theme: 'edukacja',
    inscription: 'UNIWERSYTET SWPS · TAJEMNICA PIECZĘCI · 6 KAMPUSÓW',
    inner: `
      <g transform="translate(480 220)">
        <circle r="86" fill="${C.warn}" stroke="${C.gold}" stroke-width="6"/>
        <circle r="62" fill="none" stroke="${C.gold}" stroke-width="3" stroke-dasharray="8 6"/>
        <path d="M0 -44 L14 -12 L48 -12 L20 10 L30 44 L0 24 L-30 44 L-20 10 L-48 -12 L-14 -12 Z" fill="${C.gold}"/>
      </g>
      ${[0, 1, 2, 3, 4, 5]
        .map((i) => {
          const x = 110 + i * 148;
          const h = 60 + (i % 3) * 22;
          return `<g transform="translate(${x} 400)"><rect x="-22" y="${-h}" width="44" height="${h}" fill="${C.cool}" stroke="${C.gold}" stroke-width="3"/><path d="M-28 ${-h} L0 ${-h - 28} L28 ${-h} Z" fill="${C.ground}" stroke="${C.gold}" stroke-width="3"/><rect x="-6" y="${-h + 16}" width="12" height="18" fill="${C.text}"/></g>`;
        })
        .join('')}
      <ellipse cx="480" cy="470" rx="200" ry="30" fill="${C.ground}" stroke="${C.gold}" stroke-width="4"/>
      ${figure(330, 560, { left: [-50, -150], right: [60, -150], scale: 0.62 })}
      ${figure(480, 566, { left: [-56, -170], right: [56, -170], scale: 0.62 })}
      ${figure(630, 560, { left: [-60, -150], right: [50, -150], scale: 0.62 })}`,
  },
  'nasa-space-apps': {
    theme: 'biznes',
    inscription: 'NASA SPACE APPS CHALLENGE 2023 · PCIS · 5. MIEJSCE',
    inner: `
      <g transform="translate(480 250)" fill="none" stroke="${C.gold}" stroke-width="3">
        <ellipse rx="300" ry="110" stroke-dasharray="10 8"/><ellipse rx="220" ry="80" stroke-opacity="0.5"/>
        <circle r="70" fill="${C.mid}" stroke-width="5"/>
        <path d="M-40 -10 Q-10 -40 20 -20 T60 10" stroke="${C.text}" stroke-width="6" stroke-linecap="round"/>
      </g>
      <g transform="translate(700 150) rotate(-20)"><rect x="-26" y="-14" width="52" height="28" fill="${C.text}" stroke="${C.gold}" stroke-width="3"/><rect x="-90" y="-8" width="56" height="16" fill="${C.cool}" stroke="${C.gold}" stroke-width="3"/><rect x="34" y="-8" width="56" height="16" fill="${C.cool}" stroke="${C.gold}" stroke-width="3"/><circle cx="0" cy="-30" r="8" fill="${C.gold}"/></g>
      ${[
        [120, 110],
        [200, 70],
        [860, 90],
        [820, 160],
        [150, 300],
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${C.text}"/>`)
        .join('')}
      <g transform="translate(480 470)"><rect x="-130" y="-70" width="260" height="70" fill="${C.far}" stroke="${C.gold}" stroke-width="4"/><path d="M-110 -20 L-80 -45 L-50 -30 L-20 -55 L10 -35 L40 -50 L70 -25 L100 -40" fill="none" stroke="${C.gold}" stroke-width="4"/><rect x="-140" y="0" width="280" height="12" fill="${C.ground}"/></g>
      <text x="480" y="130" text-anchor="middle" font-family="Georgia, serif" font-size="26" letter-spacing="10" fill="${C.gold}">PCIS</text>
      ${figure(300, 560, { left: [-50, -150], right: [70, -190], scale: 0.66 })}
      ${figure(660, 560, { left: [-70, -190], right: [50, -150], scale: 0.66 })}`,
  },
};

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'public', 'assets', 'paintings');
mkdirSync(out, { recursive: true });
for (const [id, spec] of Object.entries(PAINTINGS)) {
  writeFileSync(join(out, `${id}.svg`), frame(spec.theme, spec.inner, spec.inscription));
  console.log(`paintings: ${id}.svg`);
}
