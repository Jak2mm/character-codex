// ===================== ADVENTURE SCENES =====================
// Original landscape pictures, drawn in code, one for each class and race theme. They fill the page
// behind the boxes in the "Adventure" layout. Colours come from the theme, in a day or night version.
// Shapes are simple layered silhouettes so they stay light and never compete with the text.

function sc_rng(seed){ let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const SC_W = 1600, SC_H = 900;
// a sc_ridge of mountains or hills across the picture
function sc_ridge(r, base, amp, step, fill, jag = 1){
  let d = `M0 ${SC_H} L0 ${base}`; let x = 0;
  while (x < SC_W){ const nx = x + step * (.6 + r() * .8); const peak = base - amp * (.3 + r() * .7);
    d += jag ? ` L${(x + nx) / 2} ${peak} L${nx} ${base - amp * r() * .25}` : ` Q${(x + nx) / 2} ${peak} ${nx} ${base - amp * r() * .2}`; x = nx; }
  return `<path d="${d} L${SC_W} ${SC_H} Z" fill="${fill}"/>`;
}
const sc_pine = (x, y, h, f) => `<path d="M${x} ${y - h} L${x + h * .28} ${y - h * .45} L${x + h * .16} ${y - h * .45} L${x + h * .34} y L${x - h * .34} ${y} L${x - h * .16} ${y - h * .45} L${x - h * .28} ${y - h * .45} Z" fill="${f}"/><rect x="${x - h * .04}" y="${y}" width="${h * .08}" height="${h * .1}" fill="${f}"/>`.replace(' y L', ` ${y} L`);
const sc_roundTree = (x, y, h, f) => `<rect x="${x - h * .05}" y="${y - h * .45}" width="${h * .1}" height="${h * .45}" fill="${f}"/><circle cx="${x}" cy="${y - h * .62}" r="${h * .32}" fill="${f}"/><circle cx="${x - h * .2}" cy="${y - h * .5}" r="${h * .22}" fill="${f}"/><circle cx="${x + h * .22}" cy="${y - h * .52}" r="${h * .24}" fill="${f}"/>`;
const sc_tallTree = (x, y, h, f) => `<path d="M${x - h * .03} ${y} L${x - h * .015} ${y - h} L${x + h * .015} ${y - h} L${x + h * .03} ${y} Z" fill="${f}"/><ellipse cx="${x}" cy="${y - h * .75}" rx="${h * .12}" ry="${h * .28}" fill="${f}"/><ellipse cx="${x}" cy="${y - h * .42}" rx="${h * .09}" ry="${h * .16}" fill="${f}"/>`;
function sc_forest(r, y, n, hmin, hmax, f, kind = 'sc_pine'){ let s = ''; for (let i = 0; i < n; i++){ const x = r() * SC_W, h = hmin + r() * (hmax - hmin); s += kind === 'sc_pine' ? sc_pine(x, y + r() * 30, h, f) : kind === 'tall' ? sc_tallTree(x, y + r() * 20, h, f) : sc_roundTree(x, y + r() * 25, h, f); } return s; }
const sc_windowsGlow = (pts, g) => pts.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w || 6}" height="${h || 10}" fill="${g}"/>`).join('');
function sc_stars(r, n, f, maxY = SC_H * .55){ let s = ''; for (let i = 0; i < n; i++) s += `<circle cx="${(r() * SC_W).toFixed(0)}" cy="${(r() * maxY).toFixed(0)}" r="${(r() * 1.6 + .3).toFixed(1)}" fill="${f}" opacity="${(.4 + r() * .6).toFixed(2)}"/>`; return s; }

function sceneSVG(id, V, dark){
  const r = sc_rng(id), A = V.accent, G = V.gold;
  const hue = rgb2hsl(hex2rgb(V.tab))[0], ah = rgb2hsl(hex2rgb(A))[0];
  // sky and silhouette colours: deep at night, soft at day
  const sky1 = dark ? hsl2hex(hue, 35, 10) : hsl2hex(ah, 35, 82), sky2 = dark ? hsl2hex(ah, 40, 24) : hsl2hex(hue, 40, 93);
  const far = dark ? hsl2hex(hue, 25, 17) : hsl2hex(ah, 18, 72), mid = dark ? hsl2hex(hue, 25, 12) : hsl2hex(hue, 16, 58), near = dark ? hsl2hex(hue, 25, 7) : hsl2hex(hue, 18, 40);
  const glow = dark ? hsl2hex(rgb2hsl(hex2rgb(G))[0], 80, 62) : hsl2hex(rgb2hsl(hex2rgb(G))[0], 70, 55), lightF = dark ? '#f6efd8' : '#ffffff';
  const moon = (x, y, rr) => `<circle cx="${x}" cy="${y}" r="${rr * 2.4}" fill="${lightF}" opacity=".08"/><circle cx="${x}" cy="${y}" r="${rr}" fill="${lightF}" opacity="${dark ? .9 : .75}"/>`;
  const sun = (x, y, rr) => `<circle cx="${x}" cy="${y}" r="${rr * 3}" fill="${glow}" opacity=".18"/><circle cx="${x}" cy="${y}" r="${rr}" fill="${glow}" opacity=".85"/>`;
  const sky = (dark ? sc_stars(r, 140, lightF) : '');
  let body = '';
  switch (id){
    case 'wizard': body = moon(1250, 170, 46) + sc_ridge(r, 640, 220, 260, far) + `<g fill="${mid}"><rect x="300" y="300" width="90" height="420"/><path d="M285 305 L345 150 L405 305 Z"/><rect x="390" y="420" width="70" height="300"/><path d="M380 425 L425 330 L470 425 Z"/></g>${sc_windowsGlow([[335, 360], [335, 430], [335, 500], [418, 480]], glow)}<circle cx="345" cy="150" r="10" fill="${glow}"/><circle cx="345" cy="150" r="40" fill="${glow}" opacity=".15"/>` + sc_ridge(r, 760, 90, 180, near, 0); break;
    case 'sorcerer': body = `<path d="M900 640 L1080 380 L1140 400 L1300 640 Z" fill="${far}"/><path d="M1070 385 Q1110 300 1150 395" stroke="${glow}" stroke-width="10" fill="none" opacity=".7"/><circle cx="1110" cy="330" r="80" fill="${glow}" opacity=".12"/>` + sc_ridge(r, 660, 160, 220, far) +
      `<path d="M420 260 Q470 230 520 250 L600 200 L560 262 Q640 250 700 300 Q620 290 560 310 L520 360 L500 305 Q450 300 420 260 Z" fill="${mid}"/>` + sc_ridge(r, 770, 100, 170, near); break;
    case 'cleric': body = sun(800, 300, 70) + Array.from({length: 14}, (_, i) => { const t = Math.PI + i * Math.PI / 13; return `<path d="M800 300 L${800 + 900 * Math.cos(t)} ${300 + 900 * Math.sin(t)}" stroke="${glow}" stroke-width="18" opacity=".07"/>`; }).join('') + sc_ridge(r, 650, 120, 280, far, 0) +
      `<g fill="${mid}"><path d="M640 520 L800 450 L960 520 Z"/><rect x="650" y="520" width="300" height="20"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${665 + i * 52}" y="540" width="20" height="120"/>`).join('')}<rect x="630" y="660" width="340" height="22"/></g>` + sc_ridge(r, 770, 70, 220, near, 0); break;
    case 'paladin': body = sun(1150, 380, 60) + sc_ridge(r, 620, 170, 260, far) +
      `<g fill="${mid}"><rect x="420" y="460" width="420" height="260"/>${[400, 560, 700, 820].map((x, i) => `<rect x="${x}" y="${i % 2 ? 380 : 420}" width="60" height="${i % 2 ? 340 : 300}"/><path d="M${x - 6} ${i % 2 ? 382 : 422} L${x + 30} ${i % 2 ? 320 : 360} L${x + 66} ${i % 2 ? 382 : 422} Z"/>`).join('')}${Array.from({length: 13}, (_, i) => `<rect x="${420 + i * 33}" y="446" width="18" height="16"/>`).join('')}</g>` +
      [590, 730].map(x => `<path d="M${x + 30} 320 V250" stroke="${mid}" stroke-width="4"/><path d="M${x + 32} 252 h50 l-12 14 l12 14 h-50 Z" fill="${A}"/>`).join('') + `<path d="M600 720 h60 v-70 a30 30 0 0 1 60 0 v70 Z" fill="${near}"/>` + sc_ridge(r, 780, 60, 200, near, 0); break;
    case 'fighter': body = sun(300, 260, 50) + sc_ridge(r, 640, 150, 300, far, 0) + sc_ridge(r, 720, 80, 200, mid, 0) +
      [300, 520, 1100, 1300].map((x, i) => `<path d="M${x} 720 V${520 - i * 10}" stroke="${near}" stroke-width="5"/><path d="M${x + 2} ${522 - i * 10} h70 v42 l-35 -12 l-35 12 Z" fill="${i % 2 ? A : G}" opacity=".8"/>`).join('') +
      Array.from({length: 26}, (_, i) => `<path d="M${200 + i * 48} 800 L${230 + i * 48 + r() * 20} ${600 + r() * 60}" stroke="${near}" stroke-width="3"/>`).join('') + sc_ridge(r, 800, 40, 160, near, 0); break;
    case 'barbarian': body = (dark ? '' : '') + sc_ridge(r, 600, 300, 200, far) + `<g fill="${lightF}" opacity="${dark ? .35 : .6}">${Array.from({length: 7}, () => { const x = r() * SC_W; return `<path d="M${x} ${330 + r() * 40} l40 60 h-80 Z"/>`; }).join('')}</g>` + sc_ridge(r, 720, 140, 160, mid) +
      `<path d="M760 760 l20 -40 l20 40 Z" fill="${glow}"/><circle cx="780" cy="740" r="60" fill="${glow}" opacity=".18"/>` + sc_ridge(r, 800, 50, 140, near); break;
    case 'rogue': body = moon(1200, 160, 52) + `<g fill="${mid}">${Array.from({length: 18}, (_, i) => { const x = i * 95 - 20, w = 70 + r() * 50, h = 160 + r() * 260; return `<rect x="${x}" y="${SC_H - h}" width="${w}" height="${h}"/><path d="M${x - 8} ${SC_H - h} L${x + w / 2} ${SC_H - h - 50 - r() * 30} L${x + w + 8} ${SC_H - h} Z"/>`; }).join('')}</g>` +
      sc_windowsGlow(Array.from({length: 26}, () => [r() * SC_W, 560 + r() * 260, 8, 12]), glow) + `<path d="M0 900 V740 h300 v-30 h200 v30 h400 v-50 h300 v50 h400 V900 Z" fill="${near}"/>`; break;
    case 'ranger': body = sun(1300, 220, 40) + sc_ridge(r, 560, 200, 260, far) + sc_forest(r, 640, 40, 70, 140, mid) + `<path d="M260 210 q40 -20 80 0 q-40 -6 -80 0 Z M300 205 l-6 -12 l12 0 Z" fill="${mid}"/>` + sc_forest(r, 800, 30, 120, 230, near); break;
    case 'druid': body = moon(400, 180, 40) + sc_ridge(r, 600, 140, 300, far, 0) + sc_forest(r, 660, 22, 120, 200, mid, 'round') +
      `<g fill="${mid}">${[0, 1, 2, 3, 4, 5, 6].map(i => { const a = Math.PI * (i / 6), x = 800 + Math.cos(a) * 260, y = 700 - Math.sin(a) * 40; return `<rect x="${x - 18}" y="${y - 110}" width="36" height="110"/>`; }).join('')}<rect x="770" y="560" width="60" height="18"/></g>` + sc_forest(r, 820, 14, 180, 300, near, 'round'); break;
    case 'monk': body = sun(1200, 260, 55) + sc_ridge(r, 560, 320, 240, far) + `<path d="M980 300 Q990 500 1000 700" stroke="${lightF}" stroke-width="10" opacity=".35" fill="none"/>` +
      `<g fill="${mid}"><path d="M560 470 Q640 440 720 470 L700 480 H580 Z"/><rect x="595" y="480" width="90" height="50"/><path d="M540 540 Q640 505 740 540 L715 552 H565 Z"/><rect x="580" y="552" width="120" height="70"/></g>${sc_windowsGlow([[630, 500, 20, 18], [628, 575, 24, 22]], glow)}` + sc_ridge(r, 720, 120, 200, mid, 0) + sc_ridge(r, 820, 60, 160, near, 0); break;
    case 'bard': body = moon(1350, 160, 36) + sc_ridge(r, 600, 120, 260, far, 0) +
      `<g fill="${mid}">${Array.from({length: 9}, (_, i) => { const x = 180 + i * 150, h = 160 + r() * 100; return `<rect x="${x}" y="${720 - h}" width="120" height="${h}"/><path d="M${x - 10} ${720 - h} L${x + 60} ${650 - h} L${x + 130} ${720 - h} Z"/>`; }).join('')}</g>` +
      sc_windowsGlow(Array.from({length: 16}, (_, i) => [210 + Math.floor(i / 2) * 150 + (i % 2) * 50, 600 + r() * 60, 14, 18]), glow) +
      `<path d="M100 470 Q400 560 700 470 Q1000 560 1400 470" stroke="${mid}" stroke-width="2" fill="none"/>${Array.from({length: 12}, (_, i) => `<circle cx="${130 + i * 110}" cy="${500 + Math.sin(i) * 18}" r="6" fill="${glow}"/>`).join('')}` + `<rect x="0" y="720" width="${SC_W}" height="180" fill="${near}"/>`; break;
    case 'elf': body = moon(1150, 200, 60) + sc_ridge(r, 620, 120, 300, far, 0) + sc_forest(r, 760, 26, 300, 520, mid, 'tall') + sc_windowsGlow(Array.from({length: 30}, () => [r() * SC_W, 300 + r() * 400, 3, 3]), glow) + sc_forest(r, 880, 14, 400, 620, near, 'tall'); break;
    case 'dwarf': body = sc_ridge(r, 640, 380, 260, far) + sc_ridge(r, 720, 240, 220, mid) +
      `<path d="M700 720 V600 a100 100 0 0 1 200 0 V720 Z" fill="${near}"/><path d="M730 720 V610 a70 70 0 0 1 140 0 V720 Z" fill="${glow}" opacity=".85"/><circle cx="800" cy="650" r="160" fill="${glow}" opacity=".12"/>` +
      `<g fill="${mid}"><rect x="640" y="560" width="40" height="160"/><rect x="920" y="560" width="40" height="160"/></g>` + sc_ridge(r, 820, 60, 180, near); break;
    case 'gnome': body = sun(1250, 230, 45) + sc_ridge(r, 620, 120, 300, far, 0) + sc_ridge(r, 720, 90, 260, mid, 0) +
      `<g fill="${near}"><path d="M480 720 L500 470 L560 470 L580 720 Z"/></g><g transform="translate(530 470)">${[0, 1, 2, 3].map(i => `<rect x="-6" y="-170" width="12" height="170" fill="${mid}" transform="rotate(${i * 90 + 20})"/>`).join('')}<circle r="16" fill="${G}"/></g>` +
      `<g transform="translate(1100 650)"><circle r="46" fill="none" stroke="${mid}" stroke-width="16"/>${Array.from({length: 10}, (_, i) => `<rect x="-8" y="-66" width="16" height="22" fill="${mid}" transform="rotate(${i * 36})"/>`).join('')}</g>` + sc_ridge(r, 820, 40, 200, near, 0); break;
    case 'halfling': body = sun(1250, 220, 55) + sc_ridge(r, 600, 80, 380, far, 0) + sc_ridge(r, 690, 90, 340, mid, 0) +
      [[420, 700], [900, 720], [1300, 690]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="38" fill="${near}"/><circle cx="${x}" cy="${y}" r="30" fill="${A}" opacity=".9"/><circle cx="${x + 14}" cy="${y + 4}" r="3" fill="${G}"/><rect x="${x + 70}" y="${y - 20}" width="24" height="24" fill="${glow}"/>`).join('') +
      sc_forest(r, 640, 10, 60, 100, mid, 'round') + sc_ridge(r, 820, 50, 300, near, 0); break;
    case 'halforc': body = (dark ? moon(300, 200, 40) : sun(300, 200, 40)) + sc_ridge(r, 620, 260, 180, far) + sc_ridge(r, 740, 160, 140, mid) +
      [[600, 760], [1000, 780]].map(([x, y]) => `<path d="M${x - 18} ${y} l18 -50 l18 50 Z" fill="${glow}"/><circle cx="${x}" cy="${y - 20}" r="70" fill="${glow}" opacity=".16"/>`).join('') +
      `<path d="M820 760 V560" stroke="${near}" stroke-width="6"/><path d="M822 562 h60 v70 l-30 -18 l-30 18 Z" fill="${A}"/>` + sc_ridge(r, 830, 50, 140, near); break;
    case 'halfelf': body = moon(1000, 230, 42) + `<rect x="0" y="560" width="${SC_W}" height="60" fill="${sky2}" opacity=".5"/>` + sc_ridge(r, 600, 120, 300, far, 0) + sc_forest(r, 660, 28, 140, 260, mid, 'tall') + sc_forest(r, 680, 20, 90, 160, mid, 'round') +
      `<path d="M0 760 Q400 700 800 760 T1600 740 V790 Q1200 820 800 800 T0 810 Z" fill="${lightF}" opacity="${dark ? .12 : .35}"/>` + sc_forest(r, 860, 12, 200, 340, near, 'tall'); break;
    case 'human': body = sun(1200, 240, 50) + sc_ridge(r, 600, 140, 320, far, 0) +
      `<g fill="${mid}"><rect x="520" y="480" width="260" height="200"/>${[500, 610, 760].map((x, i) => `<rect x="${x}" y="${i === 1 ? 400 : 440}" width="50" height="${i === 1 ? 280 : 240}"/><path d="M${x - 6} ${i === 1 ? 402 : 442} L${x + 25} ${i === 1 ? 350 : 395} L${x + 56} ${i === 1 ? 402 : 442} Z"/>`).join('')}</g>` +
      Array.from({length: 7}, (_, i) => `<path d="M0 ${700 + i * 30} Q800 ${670 + i * 34} 1600 ${700 + i * 30}" stroke="${mid}" stroke-width="2" fill="none" opacity=".6"/>`).join('') + sc_ridge(r, 820, 40, 260, near, 0); break;
    default: body = (dark ? moon(1200, 200, 40) : sun(1200, 200, 40)) + sc_ridge(r, 620, 160, 260, far) + sc_ridge(r, 740, 110, 200, mid) + sc_ridge(r, 830, 50, 160, near);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SC_W} ${SC_H}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient></defs><rect width="${SC_W}" height="${SC_H}" fill="url(#sk)"/>${sky}${body}</svg>`;
}
// the notched "adventure" frame for boxes, and a shield shape for the Armor Class box
function notchFrameSVG(line, glow){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><path d="M11 1.5 H49 L58.5 11 V49 L49 58.5 H11 L1.5 49 V11 Z" fill="none" stroke="${line}" stroke-width="2"/><path d="M4 16 V12 L12 4 H16 M44 4 H48 L56 12 V16 M56 44 V48 L48 56 H44 M16 56 H12 L4 48 V44" fill="none" stroke="${glow}" stroke-width="2.4"/></svg>`;
}
function shieldSVG(fill, line){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110" preserveAspectRatio="none"><path d="M4 4 H96 V58 C96 82 72 98 50 106 C28 98 4 82 4 58 Z" fill="${fill}" stroke="${line}" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>`;
}
