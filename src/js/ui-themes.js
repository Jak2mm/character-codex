// ===================== THEMES =====================
// Each character can have its own look: colour palette, title and text fonts, box borders, title style,
// a background (a class/race pattern or your own picture) and a panel texture. Set on the Options page.
// Saved on the character as c.theme = {preset, colors:{paper, tab, accent, gold}, title, text, border, head, bg ('none', a picture's theme id or 'image'), bgImg, bgLum, glass (box opacity %), texture}
// Readability first: every palette is generated for light and dark mode and then checked; any text colour
// that doesn't reach WCAG AA contrast (4.5:1, 7:1 for body text) is darkened or lightened until it does.

// ---------- colour maths ----------
const hex2rgb = h => { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgb2hex = rgb => '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
function rgb2hsl([r, g, b]){ r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn){ const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s * 100, l * 100]; }
function hsl2hex(h, s, l){ s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgb2hex([f(0) * 255, f(8) * 255, f(4) * 255]); }
const hexL = (hex, l) => { const [h, s] = rgb2hsl(hex2rgb(hex)); return hsl2hex(h, s, l); };
function lum(hex){ return hex2rgb(hex).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce((t, v, i) => t + v * [.2126, .7152, .0722][i], 0); }
function contrast(a, b){ const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
// move fg's lightness away from bg until the contrast is reached (keeps its hue)
function ensure(fg, bg, ratio){
  if (contrast(fg, bg) >= ratio) return fg; const [h, s, l0] = rgb2hsl(hex2rgb(fg)); const darker = lum(bg) > .2;
  for (let i = 1; i <= 100; i++){ const l = darker ? l0 - i : l0 + i; if (l < 0 || l > 100) break; const c = hsl2hex(h, s, l); if (contrast(c, bg) >= ratio) return c; }
  return darker ? '#000000' : '#ffffff';
}
const mix = (a, b, t) => { const x = hex2rgb(a), y = hex2rgb(b); return rgb2hex(x.map((v, i) => v + (y[i] - v) * t)); };

// ---------- presets ----------
// h/s tint the paper and ink; tab = title tabs; accent = links, buttons, highlights; gold = badges and ornaments
const THEMES = [
  {id: 'classic', name: 'Classic record sheet', group: 'Classic', classic: true, title: 'classic', text: 'spectral', border: 'classic', head: 'tab', bg: 'none'},
  {id: 'parchment', name: 'Old parchment', group: 'Classic', h: 40, s: 38, tab: '#3b2a1a', accent: '#7a3b1d', gold: '#9a7424', title: 'fell', text: 'garamond', border: 'gilded', head: 'ribbon', bg: 'map', texture: 'parchment'},
  {id: 'barbarian', name: 'Barbarian', group: 'Class', h: 20, s: 25, tab: '#3a1f16', accent: '#9b2c1f', gold: '#a0612a', title: 'germania', text: 'alegreya', border: 'iron', head: 'banner', bg: 'claws'},
  {id: 'bard', name: 'Bard', group: 'Class', h: 300, s: 16, tab: '#3a1d3d', accent: '#7a2e7a', gold: '#a87d22', title: 'almendra', text: 'crimson', border: 'ornate', head: 'ribbon', bg: 'notes'},
  {id: 'cleric', name: 'Cleric', group: 'Class', h: 45, s: 32, tab: '#4a3a12', accent: '#7a5a10', gold: '#b08a24', title: 'cinzel', text: 'garamond', border: 'gilded', head: 'plaque', bg: 'sun'},
  {id: 'druid', name: 'Druid', group: 'Class', h: 95, s: 22, tab: '#2b3a1f', accent: '#3d6b2a', gold: '#8a6d2a', title: 'uncial', text: 'alegreya', border: 'vine', head: 'tab', bg: 'leaves', texture: 'linen'},
  {id: 'fighter', name: 'Fighter', group: 'Class', h: 215, s: 12, tab: '#2a3240', accent: '#2f5d8a', gold: '#8a7a5a', title: 'cinzel', text: 'spectral', border: 'iron', head: 'tab', bg: 'shields'},
  {id: 'monk', name: 'Monk', group: 'Class', h: 35, s: 30, tab: '#4a3420', accent: '#a0520f', gold: '#b8862a', title: 'marcellus', text: 'lora', border: 'knot', head: 'underline', bg: 'waves'},
  {id: 'paladin', name: 'Paladin', group: 'Class', h: 220, s: 25, tab: '#1e2a52', accent: '#2c4a9a', gold: '#a8852a', title: 'cinzel', text: 'garamond', border: 'gilded', head: 'banner', bg: 'lozenge'},
  {id: 'ranger', name: 'Ranger', group: 'Class', h: 110, s: 18, tab: '#2e3a24', accent: '#4f6b2a', gold: '#8a6a3a', title: 'fell', text: 'lora', border: 'vine', head: 'ribbon', bg: 'pines'},
  {id: 'rogue', name: 'Rogue', group: 'Class', h: 260, s: 8, tab: '#1c1a22', accent: '#8a2a3a', gold: '#8a7480', title: 'metamorphous', text: 'crimson', border: 'runic', head: 'underline', bg: 'keys'},
  {id: 'sorcerer', name: 'Sorcerer', group: 'Class', h: 345, s: 20, tab: '#3a1220', accent: '#9a1f3a', gold: '#b0602a', title: 'almendra', text: 'crimson', border: 'ornate', head: 'banner', bg: 'scales'},
  {id: 'wizard', name: 'Wizard', group: 'Class', h: 235, s: 25, tab: '#1d1f4a', accent: '#3a3a9a', gold: '#8a6aa8', title: 'medieval', text: 'garamond', border: 'runic', head: 'ribbon', bg: 'stars'},
  {id: 'human', name: 'Human', group: 'Race', h: 30, s: 20, tab: '#2f2a24', accent: '#2d4f86', gold: '#9a7424', title: 'cinzel', text: 'spectral', border: 'double', head: 'tab', bg: 'map'},
  {id: 'elf', name: 'Elf', group: 'Race', h: 160, s: 20, tab: '#173a33', accent: '#1f6b5a', gold: '#7d8790', title: 'uncial', text: 'alegreya', border: 'vine', head: 'underline', bg: 'vines'},
  {id: 'dwarf', name: 'Dwarf', group: 'Race', h: 25, s: 20, tab: '#2f2620', accent: '#a04a14', gold: '#a8742a', title: 'germania', text: 'alegreya', border: 'knot', head: 'plaque', bg: 'stones'},
  {id: 'gnome', name: 'Gnome', group: 'Race', h: 180, s: 22, tab: '#24383a', accent: '#1a6f78', gold: '#b0602a', title: 'metamorphous', text: 'lora', border: 'runic', head: 'ribbon', bg: 'gears'},
  {id: 'halfelf', name: 'Half-elf', group: 'Race', h: 250, s: 15, tab: '#2a2840', accent: '#4a4a8a', gold: '#8a7aa8', title: 'almendra', text: 'crimson', border: 'ornate', head: 'ribbon', bg: 'moons'},
  {id: 'halforc', name: 'Half-orc', group: 'Race', h: 75, s: 15, tab: '#2e3020', accent: '#7a3a12', gold: '#8a7a2a', title: 'germania', text: 'alegreya', border: 'iron', head: 'banner', bg: 'paint'},
  {id: 'halfling', name: 'Halfling', group: 'Race', h: 70, s: 30, tab: '#4a3a1f', accent: '#55741d', gold: '#a8802a', title: 'marcellus', text: 'lora', border: 'double', head: 'tab', bg: 'checks', texture: 'linen'},
];
const RACE_THEME = {'Human': 'human', 'Elf': 'elf', 'Dwarf': 'dwarf', 'Gnome': 'gnome', 'Half-Elf': 'halfelf', 'Half-elf': 'halfelf', 'Half-Orc': 'halforc', 'Half-orc': 'halforc', 'Halfling': 'halfling'};

// title fonts: decorative is fine for short headings; body text fonts are all chosen for easy reading
const TITLE_FONTS = {
  classic: {n: 'Classic (condensed sans)', f: '"Barlow Condensed","Arial Narrow",Arial,sans-serif'},
  cinzel: {n: 'Cinzel (carved Roman)', g: 'Cinzel:wght@500;700', f: '"Cinzel",Georgia,serif', ls: '.06em'},
  marcellus: {n: 'Marcellus (temple)', g: 'Marcellus+SC', f: '"Marcellus SC",Georgia,serif', ls: '.06em'},
  fell: {n: 'Fell (old printed book)', g: 'IM+Fell+English+SC', f: '"IM Fell English SC",Georgia,serif', ls: '.05em'},
  uncial: {n: 'Uncial (Celtic, elvish)', g: 'Uncial+Antiqua', f: '"Uncial Antiqua",Georgia,serif', ls: '.03em', tt: 'none'},
  medieval: {n: 'Medieval (scribe)', g: 'MedievalSharp', f: '"MedievalSharp",Georgia,serif', ls: '.04em'},
  almendra: {n: 'Almendra (fairy-tale)', g: 'Almendra+SC:wght@400;700', f: '"Almendra SC",Georgia,serif', ls: '.04em'},
  metamorphous: {n: 'Metamorphous (arcane)', g: 'Metamorphous', f: '"Metamorphous",Georgia,serif', ls: '.03em'},
  germania: {n: 'Germania (rugged)', g: 'Germania+One', f: '"Germania One",Impact,sans-serif', ls: '.06em'},
  pirata: {n: 'Blackletter (gothic)', g: 'Pirata+One', f: '"Pirata One",Georgia,serif', ls: '.02em', tt: 'none', w: 400},
};
const TEXT_FONTS = {
  spectral: {n: 'Spectral (classic)', f: '"Spectral",Georgia,"Times New Roman",serif'},
  garamond: {n: 'EB Garamond (book)', g: 'EB+Garamond:ital,wght@0,400;0,600;1,400', f: '"EB Garamond",Georgia,serif', size: '1.06'},
  crimson: {n: 'Crimson Pro (novel)', g: 'Crimson+Pro:ital,wght@0,400;0,600;1,400', f: '"Crimson Pro",Georgia,serif', size: '1.06'},
  alegreya: {n: 'Alegreya (storybook)', g: 'Alegreya:ital,wght@0,400;0,600;1,400', f: '"Alegreya",Georgia,serif'},
  lora: {n: 'Lora (soft serif)', g: 'Lora:ital,wght@0,400;0,600;1,400', f: '"Lora",Georgia,serif'},
  merriweather: {n: 'Merriweather (extra clear)', g: 'Merriweather:ital,wght@0,400;0,700;1,400', f: '"Merriweather",Georgia,serif', size: '.95'},
  sans: {n: 'Plain sans-serif (clearest)', f: '"Barlow",system-ui,-apple-system,"Segoe UI",sans-serif'},
};
const STYLES = {adventure: 'Adventure (framed boxes)', sheet: 'Record sheet (paper and boxes)'};
const BORDERS = {notch: 'Notched glowing frame', classic: 'Classic thin line', double: 'Double line', gilded: 'Gilded frame', ornate: 'Ornate scrollwork', knot: 'Knotwork corners', runic: 'Runic studs', iron: 'Riveted iron', vine: 'Leaves and vines', soft: 'No border, soft shadow'};
const HEADS = {tab: 'Black tab (record sheet)', ribbon: 'Ribbon', banner: 'Pointed banner', plaque: 'Plaque', underline: 'Underlined title'};
const TEXTURES = {none: 'None (flat)', parchment: 'Parchment', linen: 'Linen'};
const BGS = {scene: 'Scene (landscape for this theme)', none: 'None', stars: 'Stars and sigils', scales: 'Dragon scales', sun: 'Radiant sun', lozenge: 'Heraldic diamonds', shields: 'Shields', claws: 'Claw marks', keys: 'Keyholes', pines: 'Pine forest', leaves: 'Leaves', waves: 'Waves', notes: 'Music notes',
  vines: 'Vines', stones: 'Carved stone', gears: 'Gears', checks: 'Gingham', paint: 'War paint', moons: 'Moons', map: 'Old map'};

const themeById = id => THEMES.find(t => t.id === id) || THEMES[0];
function suggestedTheme(c){
  const top = [...(c.classes || [])].sort((a, b) => num(b.lvl) - num(a.lvl))[0];
  const k = top && THEMES.find(t => t.group === 'Class' && t.name.toLowerCase() === String(top.n).toLowerCase());
  return k ? k.id : (RACE_THEME[c.race] || 'classic');
}
// the character's theme with every setting filled in
function themeOf(c){
  const t = (c && c.theme) || {}; const P = themeById(t.preset || 'classic');
  return {preset: P.id, P, colors: Object.assign({}, P.classic ? {paper: '#f2f1ec', tab: '#1b1d22', accent: '#2d4f86', gold: '#85621c'} : {paper: hsl2hex(P.h, P.s, 92), tab: P.tab, accent: P.accent, gold: P.gold}, t.colors || {}),
    style: t.style || (P.group === 'Classic' ? 'sheet' : 'adventure'),
    title: t.title || P.title || 'classic', text: t.text || P.text || 'spectral', head: t.head || P.head || 'tab',
    border: t.border || ((t.style || (P.group === 'Classic' ? 'sheet' : 'adventure')) === 'adventure' ? 'notch' : P.border || 'classic'),
    bg: themeBg(t, P), bgImg: t.bgImg || '', bgLum: t.bgLum, glass: t.glass ?? null, texture: t.texture || P.texture || 'none', custom: !!t.colors};
}
// background: 'none', a painted picture (its theme id) or 'image' (your own). Older saves (drawn scenes, patterns) use the theme's picture.
function themeBg(t, P){
  const def = SCENE_ART[P.id] ? P.id : 'none', b = t.bg;
  if (b === 'none' || (b === 'image' && t.bgImg) || (b && SCENE_ART[b])) return b;
  return def;
}
const isDarkMode = () => { const a = document.documentElement.getAttribute('data-theme'); return a === 'dark' || (!a && matchMedia('(prefers-color-scheme: dark)').matches); };

// ---------- palette: light and dark, checked for readability ----------
function buildPalette(T, dark){
  if (T.P.classic && !T.custom) return null; // the built-in palette (already checked)
  const pc = T.colors; const [h, s0] = rgb2hsl(hex2rgb(pc.paper || '#f2f1ec')); const s = Math.min(s0, 45);
  const V = {};
  if (!dark){
    V.paper = hsl2hex(h, s, Math.max(86, Math.min(95, rgb2hsl(hex2rgb(pc.paper))[2]))); V.sheet = hsl2hex(h, s * .55, 97.5);
    V.ink = hsl2hex(h, 22, 11); V['ink-2'] = hsl2hex(h, 10, 32); V.rule = hsl2hex(h, s * .5, 74); V['rule-2'] = hsl2hex(h, s * .5, 86);
    V.tab = pc.tab; V.accent = pc.accent; V.gold = pc.gold;
  } else {
    V.paper = hsl2hex(h, Math.min(s, 25), 8); V.sheet = hsl2hex(h, Math.min(s, 20), 12);
    V.ink = hsl2hex(h, 18, 90); V['ink-2'] = hsl2hex(h, 10, 70); V.rule = hsl2hex(h, Math.min(s, 18), 27); V['rule-2'] = hsl2hex(h, Math.min(s, 18), 18);
    const [th, ts] = rgb2hsl(hex2rgb(pc.tab)); V.tab = hsl2hex(th, Math.min(ts, 35), 80);
    const [ah, as] = rgb2hsl(hex2rgb(pc.accent)); V.accent = hsl2hex(ah, Math.min(as, 70), 72);
    const [gh, gs] = rgb2hsl(hex2rgb(pc.gold)); V.gold = hsl2hex(gh, Math.min(gs, 65), 62);
  }
  // readability checks (and fixes)
  V.ink = ensure(V.ink, V.sheet, 9); V.ink = ensure(V.ink, V.paper, 7); V['ink-2'] = ensure(V['ink-2'], V.sheet, 5.2); V['ink-2'] = ensure(V['ink-2'], V.paper, 4.5);
  V['tab-fg'] = contrast('#ffffff', V.tab) >= contrast('#111111', V.tab) ? hsl2hex(rgb2hsl(hex2rgb(V.tab))[0], 25, 97) : hsl2hex(rgb2hsl(hex2rgb(V.tab))[0], 25, 9);
  if (contrast(V['tab-fg'], V.tab) < 7) V.tab = ensure(V.tab, V['tab-fg'], 7);
  V.accent = ensure(V.accent, V.sheet, 4.6); V.gold = ensure(V.gold, V.sheet, 4.6);
  V['accent-soft'] = mix(V.sheet, V.accent, dark ? .22 : .14); V['gold-soft'] = mix(V.sheet, V.gold, dark ? .22 : .16);
  V.accent = ensure(V.accent, V['accent-soft'], 4.5); V.gold = ensure(V.gold, V['gold-soft'], 4.5);
  if (contrast(V.ink, V.tab) < 3 && !dark){} // tabs carry their own text colour
  return V;
}
// the lowest contrast among the pairs the app uses for text (shown on the Options page)
function paletteReport(){
  const cs = getComputedStyle(document.documentElement), g = k => cs.getPropertyValue('--' + k).trim();
  const pairs = [['Body text', 'ink', 'sheet'], ['Page text', 'ink', 'paper'], ['Hints', 'ink-2', 'sheet'], ['Titles', 'tab-fg', 'tab'], ['Links and buttons', 'accent', 'sheet'], ['Badges', 'sheet', 'gold']];
  return pairs.map(([n, a, b]) => ({n, r: contrast(g(a), g(b))}));
}

// ---------- borders drawn as a 9-slice picture in the theme's colours ----------
function frameSVG(style, line, deco, accent){
  if (style === 'notch') return notchFrameSVG(accent || line, deco);
  const L = line, A = deco; let corner = '', edge = '', base = '';
  const sq = (x) => `<rect x="${x}" y="${x}" width="${60 - 2 * x}" height="${60 - 2 * x}" fill="none"`;
  if (style === 'gilded'){ base = `${sq(3)} stroke="${A}" stroke-width="3.2"/>${sq(9)} stroke="${L}" stroke-width="1.6"/>`; corner = `<rect x="1" y="1" width="9" height="9" fill="${A}"/><rect x="4" y="4" width="3" height="3" fill="${L}"/>`; }
  if (style === 'ornate'){ base = `${sq(6)} stroke="${A}" stroke-width="2.4"/>`;
    corner = `<path d="M6 19 C6 10 10 6 19 6 M1.5 14 C4.5 14 7 11.5 7 8.5 C7 5 9.5 2.5 13 2.5 M14 1.5 C14 4.5 11.5 7 8.5 7" fill="none" stroke="${A}" stroke-width="2.2" stroke-linecap="round"/><circle cx="3.2" cy="3.2" r="2.6" fill="${A}"/>`; }
  if (style === 'knot'){ base = `${sq(6)} stroke="${L}" stroke-width="2"/>`;
    corner = `<rect x="1.5" y="1.5" width="13" height="13" fill="none" stroke="${A}" stroke-width="2.4"/><path d="M1.5 8 H14.5 M8 1.5 V14.5" stroke="${A}" stroke-width="2.4"/><rect x="5" y="5" width="6" height="6" fill="${A}"/>`; }
  if (style === 'runic'){ base = `${sq(6)} stroke="${L}" stroke-width="2" stroke-dasharray="6 4"/>`;
    corner = `<path d="M6.5 0 L13 6.5 L6.5 13 L0 6.5 Z" fill="${A}"/>`; edge = `<path d="M30 2 L34 6 L30 10 L26 6 Z" fill="${A}"/>`; }
  if (style === 'iron'){ base = `${sq(5)} stroke="${L}" stroke-width="6"/>`;
    corner = `<rect x="0" y="0" width="15" height="15" rx="2" fill="${L}"/><circle cx="7.5" cy="7.5" r="3.2" fill="${A}"/>`; edge = `<circle cx="30" cy="5" r="2.4" fill="${A}"/>`; }
  if (style === 'vine'){ base = `${sq(6)} stroke="${A}" stroke-width="2"/>`;
    corner = `<path d="M2 14 C2 6 6 2 14 2" fill="none" stroke="${A}" stroke-width="2.2"/><path d="M8 8 C3 8 1 5 1 1 C5 1 8 3 8 8 Z" fill="${A}"/><path d="M14 4 C14 1 17 0 19 0 C19 3 17 4 14 4Z M4 14 C1 14 0 17 0 19 C3 19 4 17 4 14Z" fill="${A}"/>`;
    edge = `<path d="M30 6 C27 3 27 1 30 0 C33 1 33 3 30 6Z" fill="${A}" opacity=".85"/>`; }
  if (!base) return '';
  // corners: draw the top-left one and mirror it; edges: one motif centred on each side
  const c4 = corner ? ['', 'translate(60 0) scale(-1 1)', 'translate(0 60) scale(1 -1)', 'translate(60 60) scale(-1 -1)'].map(t => `<g transform="${t}">${corner}</g>`).join('') : '';
  const e4 = edge ? ['', 'rotate(90 30 30)', 'rotate(180 30 30)', 'rotate(270 30 30)'].map(t => `<g transform="${t}">${edge}</g>`).join('') : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">${base}${e4}${c4}</svg>`;
}
const svgURL = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

// ---------- background patterns (original drawings, very faint) ----------
function bgSVG(id, a, b){
  const S = (w, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}"><g fill="none" stroke="${a}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  const P = {
    stars: S(140, `<circle cx="70" cy="70" r="26"/><circle cx="70" cy="70" r="20"/><path d="M70 50 L87 80 L53 80 Z"/><path d="M20 20 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z M118 110 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" fill="${b}" stroke="none"/><circle cx="110" cy="25" r="1.5" fill="${a}"/><circle cx="30" cy="115" r="1.2" fill="${a}"/>`),
    scales: S(48, `<path d="M0 24 A12 12 0 0 1 24 24 A12 12 0 0 1 48 24 M-12 48 A12 12 0 0 1 12 48 A12 12 0 0 1 36 48 A12 12 0 0 1 60 48 M-12 0 A12 12 0 0 1 12 0 A12 12 0 0 1 36 0 A12 12 0 0 1 60 0"/>`),
    sun: S(160, `<circle cx="80" cy="80" r="16"/>${Array.from({length: 12}, (_, i) => { const t = i * Math.PI / 6; return `<path d="M${80 + 24 * Math.cos(t)} ${80 + 24 * Math.sin(t)} L${80 + 38 * Math.cos(t)} ${80 + 38 * Math.sin(t)}"/>`; }).join('')}<circle cx="10" cy="10" r="2" fill="${b}" stroke="none"/><circle cx="150" cy="150" r="2" fill="${b}" stroke="none"/>`),
    lozenge: S(60, `<path d="M30 2 L58 30 L30 58 L2 30 Z"/><circle cx="30" cy="30" r="3" fill="${b}" stroke="none"/>`),
    shields: S(100, `<path d="M30 20 h30 v18 c0 14 -15 22 -15 22 c0 0 -15 -8 -15 -22 Z"/><path d="M80 70 L96 86 M96 70 L80 86"/>`),
    claws: S(120, `<path d="M20 20 C35 40 40 55 42 75 M32 15 C47 35 52 50 54 70 M44 12 C59 32 64 47 66 67"/><path d="M85 85 C92 95 95 102 96 112 M93 82 C100 92 103 99 104 109" stroke="${b}"/>`),
    keys: S(110, `<circle cx="35" cy="35" r="8"/><path d="M31 41 L27 60 H43 L39 41"/><path d="M80 80 l12 12 M86 74 l12 12" stroke="${b}"/>`),
    pines: S(120, `<path d="M30 20 L44 50 H36 L48 74 H12 L24 50 H16 Z M30 74 V84"/><path d="M90 60 L100 82 H94 L103 100 H77 L86 82 H80 Z" stroke="${b}"/>`),
    leaves: S(120, `<path d="M30 70 C30 40 50 25 75 22 C72 48 58 66 30 70 Z M30 70 C45 55 58 42 75 22"/><path d="M85 105 C85 92 94 85 106 84 C104 96 98 103 85 105 Z" stroke="${b}"/>`),
    waves: S(80, `<path d="M0 40 A20 20 0 0 1 40 40 A20 20 0 0 1 80 40 M8 40 A12 12 0 0 1 32 40 M48 40 A12 12 0 0 1 72 40 M-40 80 A20 20 0 0 1 0 80 A20 20 0 0 1 40 80 A20 20 0 0 1 80 80 A20 20 0 0 1 120 80 M-20 0 A20 20 0 0 1 20 0 A20 20 0 0 1 60 0 A20 20 0 0 1 100 0"/>`),
    notes: S(120, `<path d="M30 70 V30 L55 24 V64"/><ellipse cx="25" cy="72" rx="6" ry="4.5" fill="${a}"/><ellipse cx="50" cy="66" rx="6" ry="4.5" fill="${a}"/><path d="M92 100 V78 Q100 82 104 90" stroke="${b}"/><ellipse cx="88" cy="101" rx="5" ry="4" fill="${b}" stroke="none"/>`),
    vines: S(140, `<path d="M0 70 C35 40 70 100 105 70 C120 57 130 55 140 70"/><path d="M35 55 C30 45 36 38 44 38 C44 47 40 53 35 55Z M72 86 C70 96 76 102 84 101 C84 93 79 88 72 86Z" fill="${b}" stroke="none"/>`),
    stones: S(80, `<path d="M0 20 H80 M0 60 H80 M20 20 V60 M60 60 V80 M60 0 V20 M40 20 L46 30 L40 40 L34 30 Z"/>`),
    gears: S(120, `<circle cx="40" cy="40" r="14"/><circle cx="40" cy="40" r="5"/>${Array.from({length: 8}, (_, i) => { const t = i * Math.PI / 4; return `<path d="M${40 + 14 * Math.cos(t)} ${40 + 14 * Math.sin(t)} L${40 + 20 * Math.cos(t)} ${40 + 20 * Math.sin(t)}" stroke-width="4"/>`; }).join('')}<circle cx="92" cy="92" r="8" stroke="${b}"/>`),
    checks: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="20" height="40" fill="${a}" opacity=".5"/><rect width="40" height="20" fill="${a}" opacity=".5"/></svg>`,
    paint: S(120, `<path d="M15 30 L35 50 L55 30 L75 50 L95 30" stroke-width="4"/><path d="M30 85 h20 M30 95 h20 M30 105 h20" stroke="${b}" stroke-width="3"/>`),
    moons: S(120, `<path d="M45 25 A22 22 0 1 0 45 69 A16 16 0 1 1 45 25 Z"/><circle cx="95" cy="95" r="2" fill="${b}" stroke="none"/><circle cx="20" cy="100" r="1.5" fill="${b}" stroke="none"/>`),
    map: S(200, `<path d="M0 50 H200 M0 100 H200 M0 150 H200 M50 0 V200 M100 0 V200 M150 0 V200" stroke-width=".8" stroke-dasharray="3 5"/><circle cx="100" cy="100" r="22"/><path d="M100 72 L105 100 L100 128 L95 100 Z M72 100 L100 95 L128 100 L100 105 Z" fill="${b}" stroke="none"/>`),
  };
  return P[id] || '';
}

// ---------- applying the theme ----------
const THEME_VARS = ['paper', 'sheet', 'ink', 'ink-2', 'rule', 'rule-2', 'tab', 'tab-fg', 'accent', 'accent-soft', 'gold', 'gold-soft'];
let themeFontsLoaded = '';
// UI scale: zooms the whole app on this device (every character), 75–150%
const UI_SCALE_KEY = 'ccodex-uiscale';
const uiScale = () => { const v = num(lsGet(UI_SCALE_KEY)); return v >= 75 && v <= 150 ? v : 100; };
function applyUiScale(v = uiScale()){ document.documentElement.style.zoom = v === 100 ? '' : v / 100; const o = document.querySelector('.th-scale-v'); if (o) o.textContent = v + '%'; }
applyUiScale();
document.addEventListener('input', e => { if (e.target.id !== 'uiScale') return; const v = Math.round(num(e.target.value)); lsSet(UI_SCALE_KEY, v); applyUiScale(v); });
document.addEventListener('click', e => { const b = e.target.closest('[data-uiscale]'); if (!b) return; e.preventDefault(); const v = num(b.dataset.uiscale); lsSet(UI_SCALE_KEY, v); applyUiScale(v); const r = document.getElementById('uiScale'); if (r) r.value = v; });
const GLASS = {l: 66, d: 58}; // how solid boxes are over a picture by default (light / dark), in %; Customise → Box opacity changes it
const GLASS_MIN = 50;  // the lowest Box opacity offered (text is checked readable down to here)
const glassOf = (T, dark) => Math.max(GLASS_MIN, Math.min(100, T.glass != null ? num(T.glass) : dark ? GLASS.d : GLASS.l));
function applyCharTheme(c){
  const root = document.documentElement, T = themeOf(c), dark = isDarkMode(), V = buildPalette(T, dark);
  THEME_VARS.forEach(k => root.style.removeProperty('--' + k)); if (V) THEME_VARS.forEach(k => V[k] && root.style.setProperty('--' + k, V[k]));
  // fonts (loaded only when used)
  const tf = TITLE_FONTS[T.title] || TITLE_FONTS.classic, xf = TEXT_FONTS[T.text] || TEXT_FONTS.spectral;
  const fam = [tf.g, xf.g].filter(Boolean).map(g => 'family=' + g).join('&');
  if (fam && fam !== themeFontsLoaded){ let l = document.getElementById('themeFonts'); if (!l){ l = document.createElement('link'); l.id = 'themeFonts'; l.rel = 'stylesheet'; document.head.appendChild(l); }
    l.href = `https://fonts.googleapis.com/css2?${fam}&display=swap`; themeFontsLoaded = fam; }
  root.style.setProperty('--f-title', tf.f); root.style.setProperty('--title-ls', tf.ls || '.1em'); root.style.setProperty('--title-tt', tf.tt || 'uppercase'); root.style.setProperty('--title-w', String(tf.w || 700));
  root.style.setProperty('--f-text', xf.f); root.style.setProperty('--text-scale', xf.size || '1');
  // border, title style, texture
  const B = document.body; B.dataset.border = T.border; B.dataset.head = T.head; B.dataset.texture = T.texture; B.dataset.style = T.style;
  const cs = getComputedStyle(root), line = cs.getPropertyValue('--rule').trim() || '#c9c6bc', deco = cs.getPropertyValue('--gold').trim() || '#9a7424';
  const accentC = cs.getPropertyValue('--accent').trim(), sheetC = cs.getPropertyValue('--sheet').trim();
  const fr = frameSVG(T.border, mix(line, cs.getPropertyValue('--ink').trim() || '#000', .25), deco, accentC);
  root.style.setProperty('--shield', svgURL(shieldSVG(sheetC, accentC))); if (fr) root.style.setProperty('--frame', svgURL(fr)); else root.style.removeProperty('--frame');
  // background: a faint pattern, or your own picture under a wash of the page colour
  const paper = cs.getPropertyValue('--paper').trim();
  // a picture behind see-through boxes: a painted theme picture, or your own
  let src = '', lum = .3;
  if (T.bg === 'image' && T.bgImg && IMG.src(T.bgImg)){ src = IMG.src(T.bgImg); lum = T.bgLum ?? .3; }
  else if (SCENE_ART[T.bg]){ src = SCENE_ART[T.bg]; lum = SCENE_ART_LUM[T.bg] ?? .3; }
  if (src){
    const [pr, pg, pb] = hex2rgb(paper), g = glassOf(T, dark);
    // bright pictures get a darker wash in dark mode so light text stays readable
    const wash = `rgba(${pr},${pg},${pb},${dark ? Math.min(.62, Math.max(.06, (lum - .12) * 1.9)) : .1})`;
    root.style.setProperty('--glass', g + '%'); root.style.setProperty('--glass-bar', Math.min(100, dark ? Math.max(54, g - 2) : Math.max(74, g + 10)) + '%'); root.style.setProperty('--glass-field', Math.max(86, g) + '%');
    root.style.setProperty('--bg-img', `linear-gradient(${wash},${wash}), url("${src}")`); root.style.setProperty('--bg-op', '1');
    B.classList.add('has-bg'); B.dataset.bgkind = 'scene-art';
    // in light mode hints and accent text are darkened a little to stay readable through see-through boxes
    // (more so the more see-through the boxes are); in dark mode they're lightened when boxes go below the default
    const extra = Math.max(0, ((dark ? GLASS.d : GLASS.l) - g) / ((dark ? GLASS.d : GLASS.l) - GLASS_MIN));
    if (V && !dark){ root.style.setProperty('--ink-2', mix(V['ink-2'], V.ink, .4 + .35 * extra)); root.style.setProperty('--accent', mix(V.accent, V.ink, .42 + .4 * extra)); }
    if (V && dark && extra){ root.style.setProperty('--ink-2', mix(V['ink-2'], V.ink, .3 * extra)); root.style.setProperty('--accent', mix(V.accent, V.ink, .25 * extra)); }
  } else { root.style.removeProperty('--bg-img'); B.classList.remove('has-bg'); delete B.dataset.bgkind; }
  void paper;
}
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyCharTheme(APP_cur())); } catch {}

// ---------- the Options page ----------
function themeSwatch(P, dark){
  const T = {P, colors: P.classic ? {} : {paper: hsl2hex(P.h, P.s, 92), tab: P.tab, accent: P.accent, gold: P.gold}, custom: false};
  const V = buildPalette(T, dark) || (dark ? {paper: '#121419', sheet: '#1a1d23', ink: '#e9e6dd', tab: '#d8d3c6', 'tab-fg': '#15171b', accent: '#8fb0e6', gold: '#d6ad5a'} : {paper: '#f2f1ec', sheet: '#fbfaf7', ink: '#1b1d22', tab: '#1b1d22', 'tab-fg': '#f6f4ee', accent: '#2d4f86', gold: '#85621c'});
  const tf = TITLE_FONTS[P.title] || TITLE_FONTS.classic;
  const scene = SCENE_ART[P.id] ? `url("${SCENE_ART[P.id]}")` : !P.classic && P.group !== 'Classic' ? svgURL(sceneSVG(P.id, {accent: V.accent, gold: V.gold, tab: V.tab}, dark)) : '';
  if (scene) return `<span class="th-sw th-scene" style="background-image:${scene.replace(/"/g, '&quot;')}"><span class="th-sw-p" style="background:${V.sheet};border-color:${V.accent}"><span class="th-sw-t" style="background:${V.tab};color:${V['tab-fg']};font-family:${esc(tf.f)}">Aa</span><span class="th-sw-l" style="background:${V.ink}"></span><span class="th-sw-l s" style="background:${V.accent}"></span><span class="th-sw-d" style="background:${V.gold}"></span></span></span>`;
  return `<span class="th-sw" style="background:${V.paper}"><span class="th-sw-p" style="background:${V.sheet};border-color:${V.gold}"><span class="th-sw-t" style="background:${V.tab};color:${V['tab-fg']};font-family:${esc(tf.f)}">Aa</span><span class="th-sw-l" style="background:${V.ink}"></span><span class="th-sw-l s" style="background:${V.accent}"></span><span class="th-sw-d" style="background:${V.gold}"></span></span></span>`;
}
function renderOptionsPage(c){
  const T = themeOf(c), dark = isDarkMode(), sug = suggestedTheme(c), t = c.theme || {};
  const card = P => `<button class="th-card ${T.preset === P.id ? 'on' : ''}" data-th="preset" data-v="${P.id}" aria-pressed="${T.preset === P.id}">${themeSwatch(P, dark)}<span class="th-n">${esc(P.name)}${P.id === sug ? ' <span class="pill acc">suggested</span>' : ''}</span></button>`;
  const groups = ['Class', 'Race', 'Classic'].map(g => `<div class="th-group"><div class="cap">${g === 'Classic' ? 'General' : g === 'Class' ? 'By class' : 'By race'}</div><div class="th-cards">${THEMES.filter(P => P.group === g).map(card).join('')}</div></div>`).join('');
  const sel = (k, map, cur) => `<select data-th="${k}">${Object.entries(map).map(([v, x]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${esc(typeof x === 'string' ? x : x.n)}</option>`).join('')}</select>`;
  const cs = getComputedStyle(document.documentElement), g = k => cs.getPropertyValue('--' + k).trim();
  const colorIn = (k, label) => `<label class="th-color"><input type="color" data-th="color" data-k="${k}" value="${esc(T.colors[k] || (k === 'paper' ? '#f2f1ec' : g(k)))}"><span>${label}</span></label>`;
  const rep = paletteReport(), worst = Math.min(...rep.map(r => r.r));
  const report = `<div class="th-report ${worst >= 4.5 ? 'ok' : 'bad'}"><b>${worst >= 4.5 ? '✓ All text is easy to read' : 'Some text is hard to read'}</b><span class="hint">${rep.map(r => `${r.n} ${r.r.toFixed(1)}:1`).join(' · ')}</span></div>`;
  const artName = id => (THEMES.find(x => x.id === id) || {name: id}).name;
  const bgSel = `<select data-th="bg"><option value="none" ${T.bg === 'none' ? 'selected' : ''}>None</option>
    ${['Class', 'Race', 'Classic'].map(gr => `<optgroup label="${gr === 'Classic' ? 'General' : gr}">${THEMES.filter(P => P.group === gr && SCENE_ART[P.id]).map(P => `<option value="${P.id}" ${T.bg === P.id ? 'selected' : ''}>${esc(P.name)}${P.id === T.preset ? ' (this theme)' : ''}</option>`).join('')}</optgroup>`).join('')}
    ${T.bgImg ? `<option value="image" ${T.bg === 'image' ? 'selected' : ''}>Your picture</option>` : ''}<option value="upload">Upload background…</option></select>`;
  const g0 = glassOf(T, dark);
  const themeP = panel(`Theme for ${esc(c.name || 'this character')}`, `<div class="pb grid" style="gap:14px">
      <p class="hint" style="margin:0">Each character keeps its own theme. Pick a starting point, then change any part below. Colours are checked automatically so text stays readable in light and dark mode.</p>
      ${groups}</div>`,
    `${T.preset !== sug ? `<button class="btn sm pri" data-th="preset" data-v="${sug}">Use suggested (${esc(themeById(sug).name)})</button>` : ''}<button class="btn sm" data-th="all" title="Copy this theme to every character">Use for all characters</button>`);
  const custP = panel('Customise', `<div class="pb grid" style="gap:14px">
      <div><div class="cap">Colours</div><div class="th-colors">${colorIn('paper', 'Page')}${colorIn('tab', 'Titles')}${colorIn('accent', 'Accent')}${colorIn('gold', 'Highlights')}</div>
        <p class="hint" style="margin:4px 0 0">${T.custom ? 'Your own colours. ' : ''}In dark mode the same colours are used as tints of a dark page. ${T.custom ? '<a href="#" data-th="nocolors">Back to the theme\'s colours</a>' : ''}</p></div>
      <div class="fields th-fields">
        ${F('Layout', sel('style', STYLES, T.style))}${F('Title font', sel('title', TITLE_FONTS, T.title))}${F('Text font (notes and descriptions)', sel('text', TEXT_FONTS, T.text))}
        ${F('Box border', sel('border', BORDERS, T.border))}${F('Title style', sel('head', HEADS, T.head))}
        ${F('Background', bgSel)}${F('Box texture', sel('texture', TEXTURES, T.texture))}</div>
      <input type="file" id="thBgFile" accept="image/*" hidden>
      ${T.bg === 'image' && T.bgImg && IMG.src(T.bgImg) ? `<div class="row th-bgimg"><span class="th-bgthumb" style="background-image:url('${IMG.src(T.bgImg)}')"></span><label class="btn sm" for="thBgFile">Change picture</label></div>` : ''}
      ${T.bg !== 'none' ? `<div><label class="row th-glass" style="gap:8px"><span class="cap">Box opacity</span><input type="range" data-th="glass" min="${GLASS_MIN}" max="100" step="1" value="${g0}" style="flex:1" aria-label="Box opacity"><span class="hint th-glass-v">${g0}%</span></label>
        <p class="hint" style="margin:2px 0 0">Lower lets more of the background show through the boxes. ${T.glass != null ? '<a href="#" data-th="glassauto">Back to automatic</a>' : 'Automatic for light and dark mode.'} On phones, boxes stay solid.</p></div>` : ''}
      <div><label class="row th-glass" style="gap:8px"><span class="cap">UI scale</span><input type="range" id="uiScale" min="75" max="150" step="5" value="${uiScale()}" style="flex:1" aria-label="UI scale"><span class="hint th-scale-v">${uiScale()}%</span></label>
        <p class="hint" style="margin:2px 0 0">Makes everything bigger or smaller on this device, for every character. <a href="#" data-uiscale="100">Back to 100%</a></p></div>
      ${report}
      <div class="th-preview"><div class="cap">Preview</div><section class="panel"><div class="ph"><h2>Saving throws</h2><div class="tools"><button class="btn sm pri">Button</button></div></div>
        <div class="pb grid" style="gap:6px"><p style="margin:0;font-family:var(--f-text);font-size:calc(15px * var(--text-scale,1))">The prior spoke of a bell lost beneath the abbey, and of <a href="#" class="ref" onclick="return false">Lord Abott</a>'s men on the road.</p>
        <div class="row"><span class="pill acc">Accent</span><span class="pill gold">Highlight</span><span class="hint">Hint text</span><span class="badge-demo">3</span></div></div></section></div>
    </div>`, `<button class="btn sm ghost" data-th="reset">Reset to theme</button>`);
  // app-wide settings (the same as on the start screen)
  const mode = themePref(), inst = document.getElementById('installApp'), canInstall = inst && !inst.hidden, n = Object.keys(APP.chars).length;
  const appP = panel('App', `<div class="pb grid" style="gap:14px">
      <div><div class="cap">Light or dark</div><div class="seg" style="padding:6px 0 0" role="radiogroup">${[['auto', 'Match my device'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<button class="${mode === v ? 'on' : ''}" data-th="mode" data-v="${v}" role="radio" aria-checked="${mode === v}">${l}</button>`).join('')}</div></div>
      <label class="mini"><input type="checkbox" id="st-pref" ${startPrefOn() ? 'checked' : ''}> Show the start screen when the app opens</label>
      <div><div class="cap">Backups</div><div class="row" style="margin-top:4px"><button class="btn sm" data-st="backup" ${n ? '' : 'disabled'}>Back up all ${n} character${n === 1 ? '' : 's'}</button><label class="btn sm" for="impFile">Restore or import…</label>${canInstall ? '<button class="btn sm" data-st="install">Install app</button>' : ''}</div></div>
      ${saveLocationBlock()}
      ${updatesBlock()}
    </div>`);
  const logP = panel('Change log', `<div class="pb">${changelogBlock(3)}</div>`, `<button class="btn sm" data-upd="log">Full change log</button>`);
  return `<div class="grid opt-page" style="gap:14px">${themeP}<div class="grid g2 opt-cols" style="align-items:start">${custP}<div class="grid" style="gap:14px">${appP}${logP}</div></div>${versionFooter()}</div>`;
}

// ---------- changing the theme ----------
function setTheme(c, k, v){
  const t = c.theme = c.theme || {};
  if (k === 'preset'){ c.theme = {preset: v, bg: t.bg === 'image' ? 'image' : undefined, bgImg: t.bgImg, bgLum: t.bgLum, glass: t.glass}; for (const x of ['bg', 'bgImg', 'bgLum', 'glass']) if (c.theme[x] == null) delete c.theme[x]; }
  else if (k === 'reset'){ c.theme = {preset: t.preset || 'classic', bgImg: t.bgImg, bgLum: t.bgLum}; for (const x of ['bgImg', 'bgLum']) if (c.theme[x] == null) delete c.theme[x]; }
  else if (k === 'glassauto'){ delete t.glass; }
  else if (k === 'nocolors'){ delete t.colors; }
  else if (k === 'bg'){ if (v === 'theme') delete t.bg; else t.bg = v; }
  else if (k === 'style'){ t.style = v; delete t.border; if (t.bg !== 'image') delete t.bg; }
  else t[k] = v;
  markDirty(); renderAll();
}
document.addEventListener('click', e => { const b = e.target.closest('button[data-th], a[data-th]'); if (!b) return; e.preventDefault(); const c = APP_cur(); if (!c) return; const k = b.dataset.th;
  if (k === 'mode'){ try { localStorage.setItem(THEME_PREF, b.dataset.v); } catch {} applyTheme(b.dataset.v); renderAll(); return; }
  if (k === 'all'){ if (!armConfirm(b, 'Apply to all? Click again')) return; const copy = JSON.stringify(c.theme || {}); for (const x of Object.values(APP.chars)){ if (x === c) continue; x.theme = JSON.parse(copy); markDirty(x.id); } toast(`Every character now uses this theme.`); return; }
  if (k === 'preset' || k === 'reset' || k === 'nocolors' || k === 'glassauto') setTheme(c, k, b.dataset.v); });
document.addEventListener('change', e => { const el = e.target; if (!el.dataset || !el.dataset.th) return; const c = APP_cur(); if (!c) return; const k = el.dataset.th;
  if (k === 'color'){ const T = themeOf(c); c.theme = c.theme || {}; c.theme.colors = Object.assign({}, T.colors, {[el.dataset.k]: el.value}); markDirty(); renderAll(); return; }
  if (k === 'glass') return; // handled while dragging (below)
  if (k === 'bg' && el.value === 'upload'){ el.value = themeOf(c).bg; const f = document.getElementById('thBgFile'); if (f) f.click(); return; }
  setTheme(c, k, el.value); });
// Box opacity: updates live while dragging
document.addEventListener('input', e => { const el = e.target; if (!el.dataset || el.dataset.th !== 'glass') return; const c = APP_cur(); if (!c) return; c.theme = c.theme || {}; c.theme.glass = num(el.value);
  const s = el.parentElement.querySelector('.th-glass-v'); if (s) s.textContent = el.value + '%'; applyCharTheme(c); markDirty(); });
document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.th === 'glass') renderAll(); });
// how bright a picture is (0–1), so dark mode can dim bright pictures
function imageLum(src){ return new Promise(res => { const im = new Image(); im.onload = () => { try { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 32; const x = cv.getContext('2d'); x.drawImage(im, 0, 0, 64, 32);
  const d = x.getImageData(0, 0, 64, 32).data; let t = 0; for (let i = 0; i < d.length; i += 4) t += .299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]; res(+(t / (d.length / 4) / 255).toFixed(3)); } catch { res(.3); } }; im.onerror = () => res(.3); im.src = src; }); }
document.addEventListener('change', async e => { if (e.target.id !== 'thBgFile') return; const f = e.target.files[0]; e.target.value = ''; if (!f) return; const c = APP_cur(); if (!c) return;
  if (!/^image\//.test(f.type)){ toast('That file isn\'t an image.', 'warn'); return; }
  try { const d = await imageToDataURL(f, 1600); c.theme = c.theme || {}; if (c.theme.bgImg) IMG.drop(c.theme.bgImg); c.theme.bgImg = IMG.put(d); c.theme.bgLum = await imageLum(d); c.theme.bg = 'image'; markDirty(); renderAll(); toast('Background picture set.'); }
  catch { toast('That image couldn\'t be read.', 'warn'); } });

window.THEMES_READY = true;
