/**
 * Generates the illustration assets used by the app:
 *   - assets/recipes/<id>.jpg   recipe covers (flat-lay compositions)
 *   - assets/emoji/<name>.png   ingredient icons and UI stickers
 *   - app icon, Android adaptive icon, splash icon and favicon
 * and the require() maps in src/data/emoji.ts and src/data/covers.ts.
 *
 * Food artwork comes from Microsoft Fluent Emoji (MIT) via @iconify-json/fluent-emoji,
 * plus a few custom dishes drawn below in the same style.
 *
 * Run with: npm run assets
 */
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import jpeg from 'jpeg-js';

const require = createRequire(import.meta.url);
const fluent = require('@iconify-json/fluent-emoji/icons.json');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const covers = JSON.parse(readFileSync(join(root, 'scripts/covers.json'), 'utf8'));

let uid = 0;
const nextId = () => `u${(uid++).toString(36)}`;

/** Makes gradient/filter ids unique so several drawings can share one SVG. */
function scopeIds(body) {
  const id = nextId();
  return body
    .replace(/id="([^"]+)"/g, `id="${id}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${id}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${id}-$1"`);
}

// ---------------------------------------------------------------------------
// Custom drawings (512 × 512 viewBox), styled to sit next to Fluent emoji.
// ---------------------------------------------------------------------------

function specks(list) {
  return list
    .map(([x, y, r, fill, extra = '']) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.72}" fill="${fill}" ${extra}/>`)
    .join('');
}

function bowl({ body = ['#FFFFFF', '#DCD6CB'], inner = '#EFEAE0', food, toppings = '' }) {
  return `
  <defs>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${body[0]}"/><stop offset="1" stop-color="${body[1]}"/></linearGradient>
    <radialGradient id="food" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="${food[0]}"/><stop offset="1" stop-color="${food[1]}"/></radialGradient>
  </defs>
  <ellipse cx="256" cy="214" rx="222" ry="90" fill="${inner}"/>
  <ellipse cx="256" cy="222" rx="202" ry="76" fill="url(#food)"/>
  ${toppings}
  <path d="M34,214 A222,90 0 0 0 478,214 C472,330 384,424 256,424 C128,424 40,330 34,214 Z" fill="url(#body)"/>
  <path d="M34,214 A222,90 0 0 0 478,214" fill="none" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="7"/>
  <path d="M84,282 C104,338 150,376 200,392" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="16" fill="none" stroke-linecap="round"/>
  <ellipse cx="256" cy="428" rx="92" ry="16" fill="${body[1]}"/>`;
}

function leafSpecks(points, color = '#5DA83A') {
  return points
    .map(
      ([x, y, rot]) =>
        `<path d="M0,0 C-7,-6 -7,-16 0,-22 C7,-16 7,-6 0,0 Z" fill="${color}" transform="translate(${x} ${y}) rotate(${rot}) scale(1.2)"/>`,
    )
    .join('');
}

function casserole({ dish = ['#E07A4F', '#B9552F'], rim = '#EE9166', top, spots = '', toppings = '' }) {
  return `
  <defs>
    <linearGradient id="side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dish[0]}"/><stop offset="1" stop-color="${dish[1]}"/></linearGradient>
    <radialGradient id="top" cx="45%" cy="40%" r="75%"><stop offset="0" stop-color="${top[0]}"/><stop offset="1" stop-color="${top[1]}"/></radialGradient>
  </defs>
  <rect x="10" y="236" width="70" height="46" rx="22" fill="${dish[1]}"/>
  <rect x="432" y="236" width="70" height="46" rx="22" fill="${dish[1]}"/>
  <rect x="40" y="206" width="432" height="196" rx="56" fill="url(#side)"/>
  <rect x="40" y="150" width="432" height="196" rx="62" fill="${rim}"/>
  <rect x="66" y="170" width="380" height="154" rx="46" fill="url(#top)"/>
  ${spots}
  ${toppings}
  <path d="M90,178 C150,166 260,164 330,168" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M70,360 C120,388 250,396 330,392" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="12" fill="none" stroke-linecap="round"/>`;
}

function fillet({ grad, stripe, sear, x = 0, y = 0, scale = 1, rot = 0 }) {
  return `
  <g transform="translate(${x} ${y}) rotate(${rot} 256 256) translate(256 256) scale(${scale}) translate(-256 -256)">
    <defs><linearGradient id="fl" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${grad[0]}"/><stop offset="1" stop-color="${grad[1]}"/></linearGradient></defs>
    <path d="M62,292 C60,214 158,166 286,164 C404,162 464,212 458,272 C452,334 382,366 270,368 C148,370 64,352 62,292 Z" fill="url(#fl)"/>
    ${[140, 205, 270, 335, 395]
      .map(
        (sx, i) =>
          `<path d="M${sx},${184 - i * 3} C${sx + 26},${240} ${sx + 26},${300} ${sx + 10},${352 - i * 2}" stroke="${stripe}" stroke-width="11" stroke-opacity="0.75" fill="none" stroke-linecap="round"/>`,
      )
      .join('')}
    ${sear ? `<path d="M110,236 C190,196 320,186 420,222" stroke="${sear}" stroke-width="22" stroke-opacity="0.55" fill="none" stroke-linecap="round"/>` : ''}
    <path d="M118,214 C180,182 270,176 340,182" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="12" fill="none" stroke-linecap="round"/>
  </g>`;
}

const CUSTOM = {
  'bowl-strogonoff': () =>
    bowl({
      body: ['#FFFFFF', '#D8D2C6'],
      food: ['#F0C49A', '#D99462'],
      toppings:
        specks([
          [150, 200, 26, '#F6DDB5'],
          [230, 178, 24, '#F4D7A9'],
          [330, 190, 27, '#F6DDB5'],
          [390, 224, 22, '#F4D7A9'],
          [270, 236, 25, '#F6DDB5'],
        ]) +
        [
          [190, 222],
          [300, 206],
          [360, 180],
          [120, 236],
        ]
          .map(
            ([x, y]) =>
              `<path d="M${x - 20},${y} A20,16 0 0 1 ${x + 20},${y} Z" fill="#C9A27E"/><rect x="${x - 6}" y="${y}" width="12" height="12" rx="4" fill="#B98E6A"/>`,
          )
          .join('') +
        leafSpecks([
          [210, 200, 20],
          [340, 214, -30],
          [260, 186, 60],
        ]),
    }),
  'bowl-stew': () =>
    bowl({
      body: ['#E07A4F', '#B04E2B'],
      inner: '#F2A57E',
      food: ['#A65A32', '#6E3418'],
      toppings:
        specks([
          [150, 206, 28, '#6A361C'],
          [250, 186, 30, '#5E2F18'],
          [350, 206, 26, '#6A361C'],
          [300, 234, 22, '#5E2F18'],
          [200, 232, 24, '#F2D08A'],
          [380, 184, 20, '#F2D08A'],
          [120, 234, 18, '#F2D08A'],
          [190, 184, 15, '#F28A2E'],
          [320, 178, 14, '#F28A2E'],
          [400, 232, 15, '#F28A2E'],
        ]) +
        leafSpecks([
          [240, 214, 10],
          [330, 196, -40],
          [160, 220, 50],
        ]),
    }),
  'bowl-risotto': () =>
    bowl({
      body: ['#6B8FD8', '#4262B8'],
      inner: '#9DB6EA',
      food: ['#F6EACB', '#E2CC98'],
      toppings:
        Array.from({ length: 26 }, (_, i) => {
          const x = 110 + ((i * 53) % 300);
          const y = 170 + ((i * 29) % 68);
          return `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="#FFF9EA" transform="rotate(${(i * 37) % 180} ${x} ${y})"/>`;
        }).join('') +
        [
          [170, 196],
          [270, 180],
          [350, 214],
          [220, 230],
        ]
          .map(
            ([x, y]) =>
              `<path d="M${x - 24},${y} A24,19 0 0 1 ${x + 24},${y} Z" fill="#A87750"/><rect x="${x - 7}" y="${y}" width="14" height="14" rx="5" fill="#8E6242"/>`,
          )
          .join('') +
        leafSpecks([
          [310, 190, 20],
          [200, 180, -30],
          [380, 190, 45],
        ]),
    }),
  'bowl-tropeiro': () =>
    bowl({
      body: ['#F2C14E', '#CF951F'],
      inner: '#F8DA8C',
      food: ['#D9B77A', '#B08850'],
      toppings:
        specks([
          [140, 206, 14, '#7B4A2B'],
          [180, 186, 13, '#6A3D22'],
          [230, 214, 14, '#7B4A2B'],
          [290, 190, 13, '#6A3D22'],
          [340, 222, 14, '#7B4A2B'],
          [380, 196, 13, '#6A3D22'],
          [260, 238, 12, '#7B4A2B'],
          [310, 170, 12, '#7B4A2B'],
          [200, 170, 16, '#D9695B'],
          [360, 176, 15, '#D9695B'],
          [150, 236, 14, '#E47E6E'],
          [250, 176, 15, '#FFD84D'],
          [320, 240, 14, '#FFFFFF'],
          [110, 216, 13, '#FFD84D'],
        ]) +
        leafSpecks(
          [
            [270, 206, 70],
            [190, 238, 20],
            [400, 222, -50],
            [330, 196, 30],
          ],
          '#3E8E2E',
        ),
    }),
  'bowl-soup': () =>
    bowl({
      body: ['#9CC5A1', '#6A9D73'],
      inner: '#C7E2CA',
      food: ['#F6CD6C', '#E5A53B'],
      toppings:
        specks([
          [150, 200, 16, '#F28A2E'],
          [300, 182, 15, '#F28A2E'],
          [370, 222, 16, '#F28A2E'],
          [210, 226, 18, '#FFF1C4'],
          [260, 190, 17, '#FFF1C4'],
          [120, 230, 15, '#FFF1C4'],
          [330, 236, 15, '#7DBB4B'],
          [190, 180, 14, '#7DBB4B'],
          [390, 190, 14, '#7DBB4B'],
          [240, 240, 13, '#F4D9C0'],
          [340, 168, 12, '#F4D9C0'],
        ]) +
        leafSpecks([
          [230, 204, 30],
          [310, 212, -20],
          [170, 214, 70],
          [280, 170, 0],
        ]),
    }),
  'bowl-pumpkin': () =>
    bowl({
      body: ['#FFFFFF', '#D8D2C6'],
      food: ['#FBB45A', '#EC8526'],
      toppings: `
        <path d="M150,212 C190,180 250,176 290,196 C330,216 360,214 380,200" stroke="#FFF6E6" stroke-width="12" fill="none" stroke-linecap="round"/>
        <path d="M180,226 C220,212 270,214 310,226" stroke="#FFF6E6" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"/>
        ${specks([
          [200, 186, 8, '#7B5A2B'],
          [330, 184, 7, '#7B5A2B'],
          [260, 230, 7, '#7B5A2B'],
          [360, 226, 8, '#7B5A2B'],
        ])}
        ${leafSpecks([
          [240, 198, 20],
          [300, 206, -30],
          [270, 186, 70],
        ])}`,
    }),
  'bowl-curry': () =>
    bowl({
      body: ['#6B8FD8', '#4262B8'],
      inner: '#9DB6EA',
      food: ['#F5BE4E', '#DC8A1E'],
      toppings:
        specks([
          [140, 206, 17, '#F1D39C'],
          [190, 184, 16, '#EACB8E'],
          [245, 214, 17, '#F1D39C'],
          [300, 186, 16, '#EACB8E'],
          [350, 220, 17, '#F1D39C'],
          [395, 196, 15, '#EACB8E'],
          [270, 240, 15, '#F1D39C'],
          [180, 234, 15, '#EACB8E'],
        ]) +
        leafSpecks(
          [
            [220, 190, 30],
            [320, 206, -40],
            [260, 176, 80],
            [370, 180, 10],
            [160, 222, -20],
          ],
          '#3E8E2E',
        ) +
        `<path d="M300,236 C320,226 340,228 356,238" stroke="#E4402B" stroke-width="10" fill="none" stroke-linecap="round"/>`,
    }),
  'bowl-lentil': () =>
    bowl({
      body: ['#F2C14E', '#CF951F'],
      inner: '#F8DA8C',
      food: ['#A7703F', '#734824'],
      toppings:
        Array.from({ length: 34 }, (_, i) => {
          const x = 108 + ((i * 47) % 300);
          const y = 168 + ((i * 31) % 72);
          return `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="${i % 3 ? '#8A5A30' : '#C0843F'}"/>`;
        }).join('') +
        specks([
          [170, 200, 15, '#F28A2E'],
          [330, 190, 14, '#F28A2E'],
          [260, 230, 15, '#F28A2E'],
          [390, 222, 13, '#9ACB6A'],
        ]) +
        leafSpecks([
          [230, 196, 20],
          [300, 222, -40],
          [360, 178, 50],
        ]),
    }),
  'bowl-friedrice': () =>
    bowl({
      body: ['#E07A4F', '#B04E2B'],
      inner: '#F2A57E',
      food: ['#F4E0A6', '#E0C07A'],
      toppings:
        Array.from({ length: 30 }, (_, i) => {
          const x = 108 + ((i * 59) % 304);
          const y = 168 + ((i * 23) % 72);
          return `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="#FFF8E4" transform="rotate(${(i * 41) % 180} ${x} ${y})"/>`;
        }).join('') +
        specks([
          [160, 196, 15, '#FFD84D'],
          [300, 214, 16, '#FFD84D'],
          [380, 186, 14, '#FFD84D'],
          [220, 180, 10, '#F28A2E'],
          [340, 176, 10, '#F28A2E'],
          [250, 232, 10, '#F28A2E'],
          [130, 226, 10, '#F28A2E'],
          [200, 214, 10, '#6DB33F'],
          [280, 186, 10, '#6DB33F'],
          [360, 236, 10, '#6DB33F'],
          [410, 214, 9, '#6DB33F'],
        ]),
    }),
  'salmon-bowl': () => `
    ${bowl({
      body: ['#FFFFFF', '#D8D2C6'],
      food: ['#FFFDF6', '#EDE6D6'],
      toppings: Array.from({ length: 24 }, (_, i) => {
        const x = 110 + ((i * 61) % 300);
        const y = 170 + ((i * 27) % 66);
        return `<ellipse cx="${x}" cy="${y}" rx="10" ry="5" fill="#FFFFFF" stroke="#EAE3D2" stroke-width="1.5" transform="rotate(${(i * 43) % 180} ${x} ${y})"/>`;
      }).join(''),
    })}
    ${fillet({ grad: ['#FF9E6E', '#EE6A45'], stripe: '#FFD5C0', sear: '#C9542F', y: -58, scale: 0.72, rot: -8 })}
    ${specks([
      [200, 150, 5, '#FFFFFF'],
      [240, 140, 5, '#FFFFFF'],
      [300, 150, 5, '#FFFFFF'],
      [270, 170, 5, '#F7EBD2'],
      [330, 160, 5, '#FFFFFF'],
    ])}
    ${[
      [112, 206],
      [140, 186],
      [128, 226],
    ]
      .map(
        ([x, y]) =>
          `<circle cx="${x}" cy="${y}" r="20" fill="#5FA83A"/><circle cx="${x - 6}" cy="${y - 6}" r="9" fill="#86C75A"/>`,
      )
      .join('')}
    ${leafSpecks(
      [
        [380, 196, 20],
        [400, 214, -20],
        [360, 220, 60],
      ],
      '#7CC24E',
    )}`,
  'fish-plate': () => `
    ${fillet({ grad: ['#FBE9C4', '#E8C184'], stripe: '#FFF6E2', sear: '#D9A152', y: 10 })}
    ${[
      [140, 330],
      [200, 356],
    ]
      .map(
        ([x, y]) =>
          `<circle cx="${x}" cy="${y}" r="36" fill="#9BD35A"/><circle cx="${x}" cy="${y}" r="28" fill="#D8F2A8"/><path d="M${x},${y - 28} V${y + 28} M${x - 28},${y} H${x + 28} M${x - 20},${y - 20} L${x + 20},${y + 20} M${x + 20},${y - 20} L${x - 20},${y + 20}" stroke="#9BD35A" stroke-width="3"/>`,
      )
      .join('')}
    ${leafSpecks(
      [
        [300, 230, 20],
        [350, 250, -30],
        [250, 250, 50],
        [390, 226, 10],
      ],
      '#4E9A2E',
    )}
    ${specks([
      [330, 330, 16, '#E4402B'],
      [372, 318, 15, '#EF5A3C'],
      [404, 290, 14, '#E4402B'],
    ])}`,
  'plate-pf': () => `
    <defs>
      <radialGradient id="beans" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#8E5832"/><stop offset="1" stop-color="#4E2A14"/></radialGradient>
      <radialGradient id="rice" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E9E2D2"/></radialGradient>
      <linearGradient id="beef" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A5634"/><stop offset="1" stop-color="#5A2B14"/></linearGradient>
    </defs>
    <path d="M36,214 C26,120 120,58 206,72 C290,86 312,176 286,250 C262,318 190,344 128,332 C70,320 42,280 36,214 Z" fill="url(#rice)"/>
    ${Array.from({ length: 46 }, (_, i) => {
      const x = 70 + ((i * 41) % 200);
      const y = 100 + ((i * 37) % 210);
      return `<ellipse cx="${x}" cy="${y}" rx="12" ry="5.5" fill="#FFFFFF" stroke="#E4DCCB" stroke-width="1.5" transform="rotate(${(i * 53) % 180} ${x} ${y})"/>`;
    }).join('')}
    <path d="M270,112 C300,50 420,44 466,104 C508,160 480,246 408,262 C340,278 280,240 268,190 C262,160 262,132 270,112 Z" fill="url(#beans)"/>
    ${[
      [320, 110, 20],
      [372, 96, -30],
      [424, 126, 40],
      [300, 170, -10],
      [356, 150, 60],
      [410, 186, 10],
      [340, 214, -40],
      [446, 212, 30],
      [390, 232, 70],
    ]
      .map(
        ([x, y, r]) =>
          `<ellipse cx="${x}" cy="${y}" rx="17" ry="11" fill="#A86A3E" transform="rotate(${r} ${x} ${y})"/><ellipse cx="${x - 5}" cy="${y - 4}" rx="6" ry="3" fill="#D9A77A" opacity="0.8" transform="rotate(${r} ${x} ${y})"/>`,
      )
      .join('')}
    ${[
      [150, 372, -14],
      [262, 392, 6],
      [372, 366, -18],
      [196, 440, 10],
      [322, 450, -6],
      [430, 424, 22],
      [104, 430, 30],
    ]
      .map(
        ([x, y, r]) =>
          `<g transform="rotate(${r} ${x} ${y})"><rect x="${x - 70}" y="${y - 22}" width="140" height="44" rx="22" fill="url(#beef)"/><rect x="${x - 56}" y="${y - 15}" width="104" height="9" rx="4.5" fill="#C27A52" opacity="0.8"/></g>`,
      )
      .join('')}
    ${[
      [190, 368],
      [300, 420],
      [390, 392],
      [240, 452],
      [120, 404],
    ]
      .map(
        ([x, y]) =>
          `<ellipse cx="${x}" cy="${y}" rx="38" ry="26" fill="none" stroke="#F3D089" stroke-width="10" opacity="0.95"/><ellipse cx="${x}" cy="${y}" rx="38" ry="26" fill="none" stroke="#C98A3A" stroke-width="3" opacity="0.6"/>`,
      )
      .join('')}
    ${leafSpecks([
      [230, 330, 20],
      [360, 330, -30],
      [150, 300, 50],
      [420, 300, 10],
      [280, 470, -60],
    ])}`,
  'skillet-shakshuka': () => `
    <defs>
      <radialGradient id="sauce" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="#EE6A45"/><stop offset="1" stop-color="#C23A22"/></radialGradient>
      <radialGradient id="yolk" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFD85C"/><stop offset="1" stop-color="#F59E0B"/></radialGradient>
    </defs>
    <rect x="380" y="230" width="132" height="52" rx="26" fill="#2F343B"/>
    <circle cx="232" cy="256" r="210" fill="#474D57"/>
    <circle cx="232" cy="256" r="194" fill="#353A42"/>
    <circle cx="232" cy="256" r="180" fill="url(#sauce)"/>
    ${[
      [170, 190],
      [300, 220],
      [200, 330],
    ]
      .map(
        ([x, y]) =>
          `<path d="M${x - 58},${y + 4} C${x - 60},${y - 40} ${x - 10},${y - 60} ${x + 30},${y - 48} C${x + 70},${y - 36} ${x + 66},${y + 30} ${x + 30},${y + 50} C${x - 10},${y + 70} ${x - 56},${y + 46} ${x - 58},${y + 4} Z" fill="#FFFDF7"/><circle cx="${x + 2}" cy="${y}" r="26" fill="url(#yolk)"/><circle cx="${x - 7}" cy="${y - 9}" r="7" fill="#FFFFFF" opacity="0.7"/>`,
      )
      .join('')}
    ${leafSpecks(
      [
        [280, 320, 20],
        [320, 300, -40],
        [120, 270, 50],
        [250, 140, 10],
        [350, 160, -20],
        [140, 330, 80],
      ],
      '#3E8E2E',
    )}
    ${specks([
      [330, 340, 8, '#FFE0B0'],
      [110, 220, 7, '#FFE0B0'],
      [260, 390, 8, '#FFE0B0'],
    ])}
    <path d="M110,120 C150,86 210,70 260,70" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="14" fill="none" stroke-linecap="round"/>`,
  'casserole-cheese': () =>
    casserole({
      top: ['#F7D77E', '#E6A13A'],
      spots: specks([
        [140, 210, 26, '#C9822A', 'opacity="0.55"'],
        [290, 196, 30, '#C9822A', 'opacity="0.5"'],
        [380, 260, 24, '#B8741F', 'opacity="0.55"'],
        [210, 280, 22, '#C9822A', 'opacity="0.5"'],
      ]),
      toppings: leafSpecks([
        [200, 220, 20],
        [330, 240, -30],
        [260, 280, 60],
        [400, 210, 10],
        [120, 270, -50],
      ]),
    }),
  'casserole-rice': () =>
    casserole({
      dish: ['#F3F0EA', '#CFC8BB'],
      rim: '#FFFFFF',
      top: ['#F6C46A', '#E48E3C'],
      spots: specks([
        [160, 220, 28, '#D94F2E', 'opacity="0.45"'],
        [330, 250, 30, '#D94F2E', 'opacity="0.4"'],
        [250, 200, 24, '#F7E4A8', 'opacity="0.9"'],
        [380, 204, 22, '#F7E4A8', 'opacity="0.9"'],
      ]),
      toppings:
        specks([
          [130, 260, 11, '#6DB33F'],
          [220, 250, 11, '#6DB33F'],
          [300, 290, 11, '#6DB33F'],
          [400, 270, 10, '#6DB33F'],
          [180, 200, 10, '#FFD84D'],
          [280, 230, 10, '#FFD84D'],
          [360, 300, 10, '#FFD84D'],
          [420, 230, 10, '#FFD84D'],
        ]) +
        leafSpecks([
          [240, 280, 20],
          [350, 220, -30],
        ]),
    }),
  'casserole-egg': () =>
    casserole({
      dish: ['#6B8FD8', '#4262B8'],
      rim: '#8AA9E8',
      top: ['#FBE37A', '#EFBF3A'],
      spots: specks([
        [180, 220, 24, '#D9A12A', 'opacity="0.45"'],
        [330, 270, 26, '#D9A12A', 'opacity="0.4"'],
      ]),
      toppings:
        leafSpecks(
          [
            [140, 230, 20],
            [230, 280, -30],
            [300, 210, 60],
            [390, 250, 10],
            [180, 290, -60],
            [360, 200, 40],
          ],
          '#3E8E2E',
        ) +
        specks([
          [260, 240, 14, '#E4402B'],
          [160, 200, 12, '#E4402B'],
          [410, 290, 12, '#E4402B'],
          [330, 300, 12, '#FFF6E0'],
        ]),
    }),
  pumpkin: () => `
    <defs>
      <radialGradient id="pk" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#FFB25A"/><stop offset="1" stop-color="#E06F1C"/></radialGradient>
      <linearGradient id="st" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8DBE4E"/><stop offset="1" stop-color="#4E7F2A"/></linearGradient>
    </defs>
    <ellipse cx="256" cy="300" rx="210" ry="168" fill="url(#pk)"/>
    <ellipse cx="170" cy="300" rx="92" ry="162" fill="#F3892D" opacity="0.55"/>
    <ellipse cx="342" cy="300" rx="92" ry="162" fill="#F3892D" opacity="0.55"/>
    <ellipse cx="256" cy="300" rx="62" ry="166" fill="#FFB866" opacity="0.7"/>
    <path d="M256,146 C250,112 262,84 296,68" stroke="url(#st)" stroke-width="30" stroke-linecap="round" fill="none"/>
    <path d="M280,120 C320,86 380,92 404,126 C360,140 316,140 280,120 Z" fill="#7DB544"/>
    <path d="M150,240 C170,200 200,180 230,172" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="16" fill="none" stroke-linecap="round"/>`,
};

function bottle(liquid, cap, label) {
  return `
    <defs><linearGradient id="lq" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${liquid[0]}"/><stop offset="1" stop-color="${liquid[1]}"/></linearGradient></defs>
    <rect x="206" y="44" width="100" height="62" rx="20" fill="${cap}"/>
    <path d="M214,104 H298 V160 C356,182 380,226 380,282 V424 C380,452 358,472 330,472 H182 C154,472 132,452 132,424 V282 C132,226 156,182 214,160 Z" fill="url(#lq)"/>
    <rect x="152" y="292" width="208" height="118" rx="22" fill="#FFFDF6"/>
    <rect x="182" y="326" width="148" height="18" rx="9" fill="${label}"/>
    <rect x="206" y="358" width="100" height="14" rx="7" fill="${label}" opacity="0.5"/>
    <path d="M170,250 C176,220 194,198 218,186" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="16" fill="none" stroke-linecap="round"/>`;
}
CUSTOM['soy-bottle'] = () => bottle(['#5A2E1A', '#2E160C'], '#D93B2B', '#D93B2B');
CUSTOM['dende-bottle'] = () => bottle(['#F26B21', '#C2410C'], '#2F7D32', '#2F7D32');
CUSTOM['oil-bottle'] = () => bottle(['#F9D65C', '#E3A91E'], '#2F7D32', '#E3A91E');

function drawing(name) {
  if (name.startsWith('custom:')) name = name.slice(7);
  if (CUSTOM[name]) return { body: scopeIds(CUSTOM[name]()), w: 512, h: 512 };
  const icon = fluent.icons[name] ?? fluent.icons[fluent.aliases?.[name]?.parent];
  if (!icon) throw new Error(`Unknown emoji "${name}"`);
  return { body: scopeIds(icon.body), w: icon.width ?? fluent.width, h: icon.height ?? fluent.height };
}

function place(name, cx, cy, size, rot = 0, shadow = 'shadow') {
  const { body, w, h } = drawing(name);
  return `<g transform="translate(${cx} ${cy}) rotate(${rot})"><g filter="url(#${shadow})"><svg x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" viewBox="0 0 ${w} ${h}">${body}</svg></g></g>`;
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function renderPng(svg, width) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

function renderJpeg(svg, width, quality = 82) {
  const img = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render();
  return jpeg.encode({ data: img.pixels, width: img.width, height: img.height }, quality).data;
}

function write(rel, data) {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
}

function hash(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

// ---------------------------------------------------------------------------
// Recipe covers
// ---------------------------------------------------------------------------

const PALETTES = {
  peach: ['#F2C38E', '#FAE0BF', '#E8A96A'],
  sage: ['#CFE3B5', '#E8F2DA', '#A9C98A'],
  butter: ['#F5DD8C', '#FBF0C6', '#E9C45A'],
  blush: ['#F4C4B8', '#FBE0D8', '#E79E8B'],
  sky: ['#C5DDEB', '#E3EFF7', '#98C0D8'],
  lilac: ['#D9CDEB', '#EEE8F7', '#B9A5DA'],
  terracotta: ['#E9B08F', '#F6D6C2', '#D88A60'],
  mint: ['#BFE3D0', '#E1F3E9', '#8FCBAE'],
  sand: ['#E8DCC4', '#F6F0E3', '#D4C09A'],
};

const DEFS = `
  <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#3A2A10" flood-opacity="0.22"/></filter>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="20"/></filter>`;

function coverSvg(id, spec) {
  const S = 960;
  const [bg, bg2, mat] = PALETTES[spec.palette];
  const h = hash(id);
  const jitter = (n, span) => ((((h >>> (n * 3)) & 0xff) / 255) * 2 - 1) * span;
  const slots = [
    [150, 165],
    [812, 170],
    [818, 800],
    [148, 806],
  ];
  const garnish = spec.garnish
    .slice(0, 4)
    .map((name, i) => {
      const [x, y] = slots[i];
      const size = 190 + jitter(i + 1, 22);
      return place(name, x + jitter(i + 5, 18), y + jitter(i + 9, 18), size, jitter(i + 2, 24));
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    <defs>${DEFS}
      <radialGradient id="bgg" cx="50%" cy="46%" r="75%"><stop offset="0" stop-color="${bg2}"/><stop offset="1" stop-color="${bg}"/></radialGradient>
      <pattern id="dots" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="3" fill="#FFFFFF" opacity="0.35"/></pattern>
    </defs>
    <rect width="${S}" height="${S}" fill="url(#bgg)"/>
    <rect width="${S}" height="${S}" fill="url(#dots)"/>
    <ellipse cx="480" cy="510" rx="330" ry="330" fill="#000000" opacity="0.1" filter="url(#soft)"/>
    <circle cx="480" cy="480" r="330" fill="${mat}"/>
    <circle cx="480" cy="480" r="302" fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="3"/>
    <circle cx="480" cy="480" r="272" fill="#FFFDF8"/>
    <circle cx="480" cy="480" r="246" fill="none" stroke="#EAE3D3" stroke-width="4"/>
    ${place(spec.main, 480, 470, 480, 0)}
    ${garnish}
  </svg>`;
}

// ---------------------------------------------------------------------------
// Brand mark
// ---------------------------------------------------------------------------

const LEAF = 'M0,0 C-78,-62 -86,-196 0,-290 C86,-196 78,-62 0,0 Z';

function sprig({ leaf = '#8FD14F', leafDark = '#6DB33F', vein = '#C9EFA0', stem = '#8FD14F' } = {}) {
  const leaves = [
    [512, 452, 0, 1],
    [500, 560, -50, 0.86],
    [524, 604, 52, 0.86],
    [506, 700, -58, 0.58],
    [518, 728, 60, 0.58],
  ];
  return `
    <path d="M512,470 C506,600 520,720 500,836" stroke="${stem}" stroke-width="26" stroke-linecap="round" fill="none"/>
    ${leaves
      .map(
        ([x, y, r, s], i) => `
      <g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">
        <path d="${LEAF}" fill="${i % 2 ? leafDark : leaf}"/>
        <path d="M0,-12 C4,-100 2,-190 0,-252" stroke="${vein}" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.8"/>
      </g>`,
      )
      .join('')}`;
}

function iconSvg({ background = true, mono = false, scale = 1 } = {}) {
  const colors = mono ? { leaf: '#FFFFFF', leafDark: '#FFFFFF', vein: '#FFFFFF00', stem: '#FFFFFF' } : undefined;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1E5638"/><stop offset="1" stop-color="#0E2E1E"/></linearGradient>
    </defs>
    ${background ? '<rect width="1024" height="1024" fill="url(#bg)"/>' : ''}
    ${background ? '<circle cx="820" cy="190" r="70" fill="#FFD45C"/>' : ''}
    <g transform="translate(512 560) scale(${scale}) translate(-512 -560)">${sprig(colors)}</g>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const ingredientSource = readFileSync(join(root, 'src/data/ingredients.ts'), 'utf8');
const ingredientIcons = [...new Set([...ingredientSource.matchAll(/icon: '([a-z0-9-]+)'/g)].map((m) => m[1]))];
const STICKERS = [
  'party-popper',
  'shopping-cart',
  'shopping-bags',
  'money-bag',
  'house',
  'sparkles',
  'check-mark-button',
  'warning',
  'fork-and-knife-with-plate',
  'red-heart',
  'thumbs-down',
  'cook',
  'busts-in-silhouette',
  'spiral-calendar',
  'link',
  'mobile-phone',
  'seedling',
  'herb',
  'fire',
  'timer-clock',
  'coin',
  'balance-scale',
  'flexed-biceps',
  'high-voltage',
  'leafy-green',
  'green-heart',
  'face-savoring-food',
  'partying-face',
  'clipboard',
  'package',
  'convenience-store',
  'department-store',
  'bento-box',
  'steaming-bowl',
  'green-salad',
  'poultry-leg',
  'glowing-star',
  'light-bulb',
];

const emojiNames = [...new Set([...ingredientIcons, ...STICKERS])].sort();
for (const name of emojiNames) {
  const { body, w, h } = drawing(name);
  const size = STICKERS.includes(name) ? 224 : 128;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
  write(`assets/emoji/${name}.png`, renderPng(svg, size));
}
write(
  'src/data/emoji.ts',
  `// Generated by scripts/generate-assets.mjs — do not edit by hand.\n/* eslint-disable */\nexport const EMOJI = {\n${emojiNames
    .map((n) => `  '${n}': require('../../assets/emoji/${n}.png'),`)
    .join('\n')}\n} as const;\n\nexport type EmojiName = keyof typeof EMOJI;\n`,
);
console.log(`emoji: ${emojiNames.length}`);

const coverIds = Object.keys(covers);
for (const id of coverIds) write(`assets/recipes/${id}.jpg`, renderJpeg(coverSvg(id, covers[id]), 900));
write(
  'src/data/covers.ts',
  `// Generated by scripts/generate-assets.mjs — do not edit by hand.\n/* eslint-disable */\nexport const COVERS: Record<string, number> = {\n${coverIds
    .map((id) => `  '${id}': require('../../assets/recipes/${id}.jpg'),`)
    .join('\n')}\n};\n`,
);
console.log(`covers: ${coverIds.length}`);

write('assets/icon.png', renderPng(iconSvg(), 1024));
write(
  'assets/android-icon-background.png',
  renderPng(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1E5638"/><stop offset="1" stop-color="#0E2E1E"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#bg)"/></svg>',
    512,
  ),
);
write('assets/android-icon-foreground.png', renderPng(iconSvg({ background: false, scale: 0.62 }), 1024));
write('assets/android-icon-monochrome.png', renderPng(iconSvg({ background: false, mono: true, scale: 0.62 }), 1024));
write('assets/splash-icon.png', renderPng(iconSvg({ background: false, scale: 0.9 }), 1024));
write('assets/favicon.png', renderPng(iconSvg(), 64));
console.log('brand assets done');

if (process.argv.includes('--preview')) {
  // Contact sheet of all covers for a quick visual check.
  const cols = 6;
  const cell = 240;
  const rows = Math.ceil(coverIds.length / cols);
  const tiles = coverIds
    .map((id, i) => {
      const inner = coverSvg(id, covers[id])
        .replace(/^<svg[^>]*>/, '')
        .replace(/<\/svg>\s*$/, '');
      return `<svg x="${(i % cols) * cell}" y="${Math.floor(i / cols) * cell}" width="${cell}" height="${cell}" viewBox="0 0 960 960">${scopeIds(inner)}</svg>`;
    })
    .join('');
  const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cell}" height="${rows * cell}">${tiles}</svg>`;
  write('scripts/.preview/covers.png', renderPng(sheet, cols * cell));
  console.log('preview: scripts/.preview/covers.png');
}
