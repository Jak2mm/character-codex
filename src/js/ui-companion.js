// ===================== COMPANIONS: animal companions, familiars, paladin mounts, custom =====================
// c.companions = [{id, kind:'companion'|'familiar'|'mount'|'animal'|'custom', base, n, hp, tricks, notes, img, stats{} (custom)}]
const CR = SRD.companionRules || {};
const COMP_BASE = ['Badger', 'Camel', 'Dire Rat', 'Dog', 'Dog, Riding', 'Eagle', 'Hawk', 'Horse, Light', 'Horse, Heavy', 'Owl', 'Pony', 'Snake, Small Viper', 'Snake, Medium Viper', 'Wolf'];
const COMP_AQUATIC = ['Crocodile', 'Porpoise', 'Shark, Medium', 'Squid'];
const FAMILIARS = {Bat:'Bat', Cat:'Cat', Hawk:'Hawk', Lizard:'Lizard', Owl:'Owl', Rat:'Rat', Raven:'Raven', Snake:'Snake, Tiny Viper', Toad:'Toad', Weasel:'Weasel'};
const FAM_MASTER = {Bat:[B('skill:Listen', 'untyped', 3)], Cat:[B('skill:Move Silently', 'untyped', 3)], Lizard:[B('skill:Climb', 'untyped', 3)], Raven:[B('skill:Appraise', 'untyped', 3)],
  Snake:[B('skill:Bluff', 'untyped', 3)], Rat:[B('save.Fort', 'untyped', 2)], Weasel:[B('save.Ref', 'untyped', 2)], Toad:[B('hp', 'untyped', 3)], Hawk:[], Owl:[]};
const MOUNTS = ['Warhorse, Heavy', 'Pony, War'];
const COMP_KIND = {companion:'Animal companion', familiar:'Familiar', mount:'Paladin’s mount', animal:'Animal', custom:'Custom'};
const ALT_FIX = {'snake, giant constrictor':'Constrictor Snake, Giant', 'whale, orca':'Orca', 'snake, constrictor':'Constrictor Snake'};
const animalByName = n => { if (!n) return null; const k = String(n).toLowerCase(); return (SRD.animals || []).find(a => a.n.toLowerCase() === k)
  || (SRD.animals || []).find(a => a.n.toLowerCase() === (ALT_FIX[k] || '').toLowerCase())
  || (SRD.animals || []).find(a => a.n.toLowerCase() === k.split(', ').reverse().join(' ')); };
const altAdj = () => { const out = {}; for (const [k, v] of Object.entries(CR.alt || {})){ const a = animalByName(k); if (a) out[a.n] = v; } return out; };
const famName = base => Object.keys(FAMILIARS).find(k => FAMILIARS[k] === base) || '';
const ordRange = (s, n) => { const m = String(s).match(/(\d+)\D+(\d+)/); return m && n >= +m[1] && n <= +m[2]; };
const sNum = s => { const m = String(s || '').replace(/–/g, '-').match(/[+-]?\d+/); return m ? parseInt(m[0]) : 0; };

function parseBlock(a){
  const size = (a.type || 'Medium').split(' ')[0]; const hdm = String(a['Hit Dice'] || '').match(/^\s*(\d+(?:\/\d+)?)\s*d(\d+)/);
  let hd = 1; if (hdm) hd = hdm[1].includes('/') ? eval(hdm[1]) : parseInt(hdm[1]);
  const ab = {}; for (const m of String(a.Abilities || '').matchAll(/(Str|Dex|Con|Int|Wis|Cha) (\d+|—)/g)) ab[m[1]] = m[2] === '—' ? null : parseInt(m[2]);
  const nat = sNum((String(a['Armor Class'] || '').match(/([+–-]\d+) natural/) || [])[1]);
  const [bab, gr] = String(a['Base Attack/Grapple'] || '+0/+0').split('/').map(sNum);
  const sv = {}; for (const m of String(a.Saves || '').matchAll(/(Fort|Ref|Will) ([+–-]\d+)/g)) sv[m[1]] = sNum(m[2]);
  return {size, hd, ab, nat, bab, gr, sv, init:sNum(a.Initiative), speed:a.Speed || '', attack:a.Attack || '', full:a['Full Attack'] || '', sa:a['Special Attacks'] || '', sq:a['Special Qualities'] || '',
    skills:a.Skills || '', feats:a.Feats || '', reach:a['Space/Reach'] || '', type:a.type || ''};
}
const amod = s => s == null ? 0 : Math.floor((s - 10) / 2);
// shift the "+N melee/ranged" attack numbers and the damage bonus by the change in BAB/ability
function shiftAttack(text, dAtk, dDmg){
  if (!text || text === '—') return text;
  let t = text.replace(/([+–-]\d+)(\s+(?:melee|ranged))/g, (m, n, rest) => sgn(sNum(n) + dAtk) + rest);
  if (dDmg) t = t.replace(/\((\d+d\d+)([+–-]\d+)?/g, (m, dice, b) => { const v = sNum(b) + dDmg; return `(${dice}${v ? (v > 0 ? '+' + v : '–' + Math.abs(v)) : ''}`; });
  return t;
}
function compLevels(c){
  const lv = n => num((c.classes.find(k => k.n === n) || {}).lvl);
  const ranger = lv('Ranger'); return {druid: lv('Druid') + (ranger >= 4 ? Math.floor(ranger / 2) : 0), arcane: lv('Sorcerer') + lv('Wizard'), paladin: lv('Paladin'), ranger};
}
function rowFor(table, n){ return (table || []).slice(1).find(r => ordRange(r[0], n)) || null; }
function specialsUpTo(table, n, col){ const out = []; for (const r of (table || []).slice(1)){ const m = String(r[0]).match(/(\d+)/); if (m && n >= +m[1]) String(r[col] || '').split(',').map(s => s.trim()).filter(s => s && s !== '—').forEach(s => out.push(s)); } return out; }

function compStats(c, x){
  const a = animalByName(x.base); const D0 = D; const L = compLevels(c); const out = {warn:'', specials:[], defs:{}, master:[]};
  if (x.kind === 'custom' || !a){ const s = x.stats || {}; Object.assign(out, {custom:true, type:s.type || '', hd:s.hd || '', hpMax:s.hp || '', init:s.init || '', speed:s.speed || '', ac:s.ac || '', bab:s.bab || '', attack:s.attack || '', saves:s.saves || '', abil:s.abil || '', sq:s.sq || '', skills:s.skills || '', feats:s.feats || ''}); return out; }
  const p = parseBlock(a); let hd = p.hd, ab = {...p.ab}, nat = p.nat, babOverride = null, saveOverride = null, hpMax = null;
  if (x.kind === 'companion'){
    const adj = altAdj()[a.n] || 0; const eff = L.druid - adj;
    if (L.druid < 1) out.warn = 'Only druids (and rangers from 4th level) get an animal companion. Its stats below are for a 1st-level druid.';
    else if (adj && eff < 1) out.warn = `${a.n} needs an effective druid level of ${adj + 1}+ (you have ${L.druid}).`;
    const lvl = Math.max(1, eff); const row = rowFor(CR.table, lvl);
    if (row){ hd += sNum(row[1]); nat += sNum(row[2]); if (ab.Str != null) ab.Str += sNum(row[3]); if (ab.Dex != null) ab.Dex += sNum(row[3]); out.tricks = sNum(row[4]); }
    out.specials = specialsUpTo(CR.table, lvl, 5); out.defs = CR.defs || {}; out.level = `effective druid level ${lvl}${adj ? ` (−${adj} for this animal)` : ''}`;
  } else if (x.kind === 'mount'){
    if (L.paladin < 5) out.warn = 'A paladin gets a special mount at 5th level. Stats below are for a 5th-level paladin.';
    const lvl = Math.max(5, L.paladin); const row = rowFor(CR.mountTable, lvl);
    if (row){ hd += sNum(row[1]); nat += sNum(row[2]); if (ab.Str != null) ab.Str += sNum(row[3]); ab.Int = sNum(row[4]); }
    out.specials = specialsUpTo(CR.mountTable, lvl, 5); out.defs = CR.mountDefs || {}; out.level = `paladin level ${lvl}`;
  } else if (x.kind === 'familiar'){
    if (L.arcane < 1) out.warn = 'Only sorcerers and wizards get familiars. Stats below are for a 1st-level master.';
    const lvl = Math.max(1, L.arcane); const row = rowFor(CR.famTable, lvl);
    if (row){ nat += sNum(row[1]); ab.Int = sNum(row[2]); }
    out.specials = specialsUpTo(CR.famTable, lvl, 3); out.defs = CR.famDefs || {}; out.level = `master level ${lvl}`;
    babOverride = D0.bab; hpMax = Math.floor(num(D0.hpMax) / 2);
    const mb = {Fort: num(D0['sv.Fort.base']), Ref: num(D0['sv.Ref.base']), Will: num(D0['sv.Will.base'])};
    const fb = {Fort: 2 + Math.floor(p.hd / 2), Ref: 2 + Math.floor(p.hd / 2), Will: Math.floor(p.hd / 3)};
    saveOverride = {Fort: Math.max(mb.Fort, fb.Fort), Ref: Math.max(mb.Ref, fb.Ref), Will: Math.max(mb.Will, fb.Will)};
    const fn = famName(a.n); out.master = FAM_MASTER[fn] || []; out.masterText = ((CR.familiars || []).find(r => r[0] === fn) || [])[1] || '';
    hd = Math.max(p.hd, D0.lvl || 1);
  }
  const SZ = SIZES[p.size] || SIZES.Medium; const strM = amod(ab.Str), dexM = amod(ab.Dex), conM = amod(ab.Con);
  const bab = babOverride != null ? babOverride : (x.kind === 'animal' ? p.bab : Math.floor(hd * 3 / 4));
  const good = h => 2 + Math.floor(h / 2), poor = h => Math.floor(h / 3);
  const baseSv = saveOverride || (x.kind === 'animal' ? {Fort:p.sv.Fort - amod(p.ab.Con), Ref:p.sv.Ref - amod(p.ab.Dex), Will:p.sv.Will - amod(p.ab.Wis)} : {Fort:good(hd), Ref:good(hd), Will:poor(hd)});
  const fin = /Weapon Finesse/i.test(p.feats); const useDex = x.kind === 'familiar' ? dexM > strM : fin;
  const atkMod = useDex ? dexM : strM; const baseAtkMod = fin ? amod(p.ab.Dex) : amod(p.ab.Str);
  const dAtk = (bab - p.bab) + (atkMod - baseAtkMod) + (x.kind === 'familiar' && !fin && useDex ? 0 : 0); const dDmg = strM - amod(p.ab.Str);
  Object.assign(out, {type:p.type, size:p.size, hd, abil:ab, nat, bab, grapple: bab + strM + SZ.gr, init: p.init - amod(p.ab.Dex) + dexM,
    ac: 10 + SZ.ac + dexM + nat, touch: 10 + SZ.ac + dexM, ff: 10 + SZ.ac + nat,
    hpMax: hpMax != null ? hpMax : Math.max(hd, Math.floor(4.5 * hd) + conM * Math.floor(hd)),
    fort: baseSv.Fort + conM, ref: baseSv.Ref + dexM, will: baseSv.Will + amod(ab.Wis),
    speed: p.speed + (x.kind === 'mount' && out.specials.some(s => /speed/i.test(s)) ? ' (+10 ft. improved speed)' : ''),
    attack: shiftAttack(p.attack, dAtk, dDmg), full: shiftAttack(p.full, dAtk, dDmg), sa:p.sa, sq:p.sq, skills:p.skills, feats:p.feats, reach:p.reach, baseHd:p.hd});
  return out;
}
// master's familiar bonus feeds the bonus system
function familiarBonuses(c){
  const out = []; for (const x of c.companions || []){ if (x.kind !== 'familiar' || x.away) continue; const fn = famName((animalByName(x.base) || {}).n);
    (FAM_MASTER[fn] || []).forEach(b => out.push({...b, src:`Familiar (${x.n || fn})`, key:'familiar', kind:'class'})); }
  return out;
}

// ---- companion numbers in one shape, for rules-based and custom companions alike ----
const numOr = (v, d = '') => { const m = String(v ?? '').replace(/–/g, '-').match(/[+-]?\d+/); return m ? parseInt(m[0]) : d; };
function compNums(s, x){
  if (!s.custom) return {hpMax: num(s.hpMax), ac: s.ac, touch: s.touch, ff: s.ff, init: s.init, speed: s.speed, bab: s.bab, grapple: s.grapple,
    sv: {Fort: s.fort, Ref: s.ref, Will: s.will}, abil: s.abil, attacks: parseAttacks(s.full || s.attack), attackText: s.attack, fullText: s.full};
  const t = x.stats || {}; const ac = String(t.ac || ''); const bg = String(t.bab || '').split('/');
  const sv = {}; for (const m of String(t.saves || '').replace(/–/g, '-').matchAll(/(Fort|Ref|Will)\w*\s*([+-]?\d+)/gi)) sv[m[1][0].toUpperCase() + m[1].slice(1, 4).toLowerCase().replace('for', 'ort')] = parseInt(m[2]);
  const ab = {}; for (const m of String(t.abil || '').matchAll(/(Str|Dex|Con|Int|Wis|Cha)\w*\s*(\d+|—|-)/gi)) ab[m[1][0].toUpperCase() + m[1].slice(1, 3).toLowerCase()] = /\d/.test(m[2]) ? parseInt(m[2]) : null;
  return {hpMax: numOr(t.hp), ac: numOr(ac), touch: numOr((ac.match(/touch\s*([+-]?\d+)/i) || [])[1]), ff: numOr((ac.match(/flat[- ]?footed\s*([+-]?\d+)/i) || [])[1]),
    init: numOr(t.init), speed: t.speed || '', bab: numOr(bg[0]), grapple: numOr(bg[1]), sv: {Fort: sv.Fort ?? '', Ref: sv.Ref ?? '', Will: sv.Will ?? ''}, abil: ab,
    attacks: parseAttacks(t.attack), attackText: t.attack || '', fullText: ''};
}
// "2 claws +5 melee (1d4+2) and bite +0 melee (1d6+1 plus trip)" → [{n, bonus:[5], kind, dmg:'1d4+2', extra}]
function parseAttacks(text){
  const out = []; const re = /(\d+\s+)?([A-Za-z][A-Za-z' -]*?)\s+((?:[+–-]\d+\/?)+)\s+(melee|ranged)(?:\s+touch)?\s*\(([^)]*)\)/g; let m;
  while ((m = re.exec(String(text || '')))){ const n = m[2].replace(/^(and|or)\s+/i, '').trim(); const dm = (m[5].match(/\d+d\d+(?:\s*[+–-]\s*\d+)?/) || [''])[0].replace(/\s+/g, '');
    out.push({n: (m[1] ? m[1].trim() + ' ' : '') + n, bonus: m[3].split('/').filter(Boolean).map(sNum), kind: m[4], dmg: dm, extra: m[5].replace(dm, '').trim().replace(/^[,;]\s*/, '')}); }
  return out;
}

// ---- each companion is a set of boxes like the main sheet: Full, Compact or hidden ----
const COMP_PANELS = [
  {id: 'info', title: 'Companion', size: 'full', keep: true, compact: true},
  {id: 'combat', title: 'Combat', size: 'full', compact: true},
  {id: 'abilities', title: 'Ability scores', size: 'half', compact: true},
  {id: 'saves', title: 'Saving throws', size: 'half', compact: true},
  {id: 'attacks', title: 'Attacks', size: 'full', compact: true},
  {id: 'gear', title: 'Gear', size: 'half', compact: true},
  {id: 'skills', title: 'Skills & feats', size: 'half', compact: true},
];
function compMode(x, id){ const L = (x.layout = x.layout || {mode: {}}); L.mode = L.mode || {};
  if (L.mode[id]) return L.mode[id];
  if (id === 'gear') return x.gear || x.kind === 'mount' || x.kind === 'custom' ? 'full' : 'hidden';
  return 'full'; }
function compSeg(x, p, cur){
  const opts = [['full', 'Full'], ['compact', 'Compact'], ...(p.keep ? [] : [['hidden', 'Hide']])];
  return `<span class="sp-mode" role="group" aria-label="${esc(p.title)} view">${opts.map(([v, l]) => `<button class="${cur === v ? 'on' : ''}" data-cmpmode="${x.id}" data-panel="${p.id}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join('')}</span>`;
}
const compTitle = x => x.n || x.base || 'Companion';

// one box of one companion, in the given mode ('full' | 'compact'); seg = the Full/Compact/Hide switch to show in its header
function compPanel(c, x, id, mode, seg){
  const i = c.companions.indexOf(x), P = f => `companions.${i}.${f}`, s = compStats(c, x), V = compNums(s, x);
  const p = COMP_PANELS.find(q => q.id === id), tools = seg || '';
  const hp = x.hp ?? V.hpMax, pct = V.hpMax ? Math.max(0, Math.min(1, num(hp) / V.hpMax)) : 0;
  const rollBox = (v, label, rollLabel, cls = '') => sbox(v === '' || v == null ? '<span class="sb-big">—</span>' : `<span class="sb-big ${rollLabel ? 'roll' : ''}" ${rollLabel ? `data-bonus="${num(v)}" data-label="${esc(compTitle(x))} · ${esc(rollLabel)}" title="Click to roll"` : ''}>${rollLabel ? sgn(num(v)) : esc(String(v))}</span>`, label, cls);
  if (id === 'info'){
    const defs = s.defs || {}; const st = bonusStatus(D);
    const sp = s.specials.map(n => { const k = Object.keys(defs).find(d => d.toLowerCase() === n.toLowerCase() || n.toLowerCase().startsWith(d.toLowerCase()));
      return `<span class="bchip" ${k ? `data-ref="compdef" data-name="${esc(x.kind)}|${esc(k)}" style="cursor:help"` : ''}>${esc(n)}</span>`; }).join('');
    const live = x.kind === 'familiar' && !x.away ? familiarBonuses({companions: [x]}) : [];
    if (mode === 'compact') return panel('Companion', `<div class="pb cmp-mini">${imgBox('comp', x)}<div class="grid" style="gap:6px;min-width:0"><div><b>${esc(x.base || 'Custom')}</b> <span class="pill acc">${esc(COMP_KIND[x.kind] || '')}</span></div>
        ${sp ? `<div class="bchips">${sp}</div>` : ''}${x.tricks ? `<div class="hint">Tricks: ${esc(x.tricks)}</div>` : ''}</div></div>`, tools, 'comp');
    return panel('Companion', `<div class="pb grid" style="gap:12px">
      ${s.warn ? `<p class="hint" style="margin:0;color:var(--warn)">${esc(s.warn)}</p>` : ''}
      <div class="w-head"><div class="w-imgcol">${imgBox('comp', x)}</div><div class="grid" style="gap:10px;min-width:0">
        <div class="fields">${F('Name', I(P('n'), x.n, 'placeholder="Give it a name" data-rerender-bar="1"'), 'wide')}${!s.custom || x.base ? F('Creature ' + (animalByName(x.base) ? refA('animal', x.base, 'ⓘ') : ''), `<span class="out sm" style="min-width:0;padding:0 8px;font-size:14px;justify-content:flex-start">${esc(x.base || 'Custom')}</span>`) : ''}</div>
        ${s.level ? `<p class="hint" style="margin:0">Worked out for ${esc(s.level)}${x.kind === 'familiar' ? ': HP is half yours, BAB is yours, saves use the better of yours or its own' : x.kind === 'companion' ? '. Every 4 total HD it also gains +1 to an ability score (add it yourself)' : ''}.</p>` : ''}
        ${sp ? `<div><div class="cap">Special abilities</div><div class="bchips" style="margin-top:4px">${sp}</div></div>` : ''}
        ${x.kind === 'familiar' && s.masterText ? `<div><div class="cap">You gain</div><div class="row" style="gap:6px;margin-top:4px">${live.length ? bonusChips(live, st) : ''}<span class="hint">${esc(s.masterText)}${s.master.length ? ' (applied to your sheet)' : ' (situational, not added)'}</span>
          <label class="mini"><input type="checkbox" data-k="${P('away')}" data-rerender="1" ${x.away ? 'checked' : ''}> More than 1 mile away</label></div></div>` : ''}
      </div></div>
      ${x.kind === 'companion' || x.kind === 'mount' || x.kind === 'animal' ? F(`Tricks${s.tricks ? ` <span class="hint">(${s.tricks} bonus trick${s.tricks === 1 ? '' : 's'} plus any you teach)</span>` : ''} ${refA('skill', 'Handle Animal', 'ⓘ')}`, I(P('tricks'), x.tricks, 'placeholder="e.g. Attack, Come, Defend, Guard, Heel, Track"')) : ''}
      ${F('Notes', LT(P('notes'), x.notes, 'Personality, anything else…', 3))}</div>`, tools, 'comp');
  }
  if (id === 'combat'){
    const hpBox = `<div class="hp-box"><div class="hp-top"><span class="sb-l">Hit points</span>${V.hpMax !== '' ? `<span class="pill ${pct > .5 ? 'good' : pct > .25 ? 'warn' : 'bad'}">${num(hp) <= 0 ? (num(hp) < 0 ? 'Dying' : 'Disabled') : pct > .5 ? 'Healthy' : 'Bloodied'}</span>` : ''}</div>
      <div class="hp-nums"><label class="hp-cur"><span class="vh">Current hit points</span>${N(P('hp'), hp, 'data-rerender="1"')}</label><span class="hp-sl">/</span><span class="hp-max">${V.hpMax === '' ? '?' : V.hpMax}</span></div>
      <div class="meter ${pct <= .25 ? 'bad' : pct <= .5 ? 'warn' : ''}"><i style="width:${pct * 100}%"></i></div>
      <div class="hp-ctl"><button class="btn sm hp-dmg" data-act="compDmg" data-id="${x.id}">Damage</button><input type="number" id="cmpDelta-${x.id}" placeholder="Amount" aria-label="Damage or healing amount"><button class="btn sm hp-heal" data-act="compHeal" data-id="${x.id}">Heal</button></div></div>`;
    const boxes = [rollBox(V.ac, 'Armor class', '', 'acc'), rollBox(V.touch, 'Touch'), rollBox(V.ff, 'Flat-footed'), rollBox(V.init, 'Initiative', 'Initiative'),
      sbox(`<span class="sb-big">${esc(String(numOr(V.speed, '—')))}</span>`, 'Speed (ft.)'), rollBox(V.bab === '' ? '' : sgn(num(V.bab)), 'Base attack'), rollBox(V.grapple, 'Grapple', 'Grapple')].join('');
    if (mode === 'compact') return panel('Combat', `<div class="pb cc-wrap">${hpBox}<div class="sbox-grid cc-grid">${boxes}</div></div>`, tools);
    const row = (l, v, raw) => v === '' || v == null ? '' : `<dt>${l}</dt><dd>${raw ? v : esc(String(v))}</dd>`;
    const detail = s.custom ? `<div class="w-stats">${[['type', 'Type / size'], ['hd', 'HD'], ['hp', 'Max HP'], ['init', 'Init'], ['speed', 'Speed'], ['ac', 'AC (touch, flat-footed)'], ['bab', 'BAB / Grapple']].map(([k, l]) => F(l, I(`${P('stats')}.${k}`, (x.stats || {})[k], 'placeholder="?" data-rerender="1"'))).join('')}</div>`
      : `<dl class="statblock comp-sb">${row('Type', `${s.type}${x.kind === 'familiar' ? ' (magical beast)' : ''}`)}${row('Hit Dice', `${s.hd}${s.baseHd !== s.hd ? ` (base ${s.baseHd})` : ''}`)}${row('Speed', s.speed)}
        ${row('Armor Class', `${s.ac}, touch ${s.touch}, flat-footed ${s.ff} <span class="hint">(natural ${sgn(s.nat)})</span>`, true)}${row('BAB / Grapple', `${sgn(s.bab)} / ${sgn(s.grapple)}`)}${row('Initiative', sgn(s.init))}
        ${row('Space / reach', s.reach)}${row('Special attacks', s.sa)}${row('Special qualities', s.sq)}</dl>`;
    return panel('Combat', `<div class="pb cc-wrap">${hpBox}${detail}</div>`, tools);
  }
  if (id === 'abilities'){
    if (mode === 'compact') return panel('Ability scores', `<div class="pb sbox-grid ab-grid">${ABIL.map(a => { const v = V.abil[a]; return `<div class="sbox ab-box"><div class="sb-l">${a.toUpperCase()}</div><div class="sb-v">${v == null ? '<span class="sb-big">—</span>' : `<span class="sb-big roll" data-bonus="${amod(v)}" data-label="${esc(compTitle(x))} · ${ABIL_FULL[a]} check" title="Click to roll">${v}</span>`}</div><div class="sb-sub">${v == null ? '' : sgn(amod(v))}</div></div>`; }).join('')}</div>`, tools);
    const tbl = `<div class="tbl-wrap"><table class="st"><thead><tr><th>Ability</th><th>Score</th><th>Mod</th></tr></thead><tbody>${ABIL.map(a => { const v = V.abil[a]; return `<tr><td><b>${a.toUpperCase()}</b> <span class="hint">${ABIL_FULL[a]}</span></td><td>${v == null ? '—' : v}</td><td>${v == null ? '—' : `<span class="out sm roll" data-bonus="${amod(v)}" data-label="${esc(compTitle(x))} · ${ABIL_FULL[a]} check">${sgn(amod(v))}</span>`}</td></tr>`; }).join('')}</tbody></table></div>`;
    return panel('Ability scores', (s.custom ? `<div class="pb">${F('Abilities (e.g. Str 12, Dex 15, Con 13, Int 2, Wis 12, Cha 6)', I(`${P('stats')}.abil`, (x.stats || {}).abil, 'data-rerender="1"'))}</div>` : '') + tbl, tools);
  }
  if (id === 'saves'){
    const NAMES = {Fort: 'Fortitude', Ref: 'Reflex', Will: 'Will'};
    const boxes = ['Fort', 'Ref', 'Will'].map(k => `<div class="sbox sv-box"><div class="sb-l">${NAMES[k]}</div><div class="sb-v">${V.sv[k] === '' ? '<span class="sb-big">—</span>' : `<span class="sb-big roll" data-bonus="${num(V.sv[k])}" data-label="${esc(compTitle(x))} · ${NAMES[k]} save" title="Click to roll">${sgn(num(V.sv[k]))}</span>`}</div><div class="sb-sub">&nbsp;</div></div>`).join('');
    if (mode === 'compact') return panel('Saving throws', `<div class="pb sbox-grid sv-grid">${boxes}</div>`, tools);
    return panel('Saving throws', `${s.custom ? `<div class="pb">${F('Saves (e.g. Fort +4, Ref +5, Will +1)', I(`${P('stats')}.saves`, (x.stats || {}).saves, 'data-rerender="1"'))}</div>` : ''}<div class="tbl-wrap"><table class="st"><thead><tr><th>Save</th><th>Total</th></tr></thead><tbody>${['Fort', 'Ref', 'Will'].map(k => `<tr><td><b>${NAMES[k]}</b></td><td>${V.sv[k] === '' ? '—' : `<span class="out sm roll" data-bonus="${num(V.sv[k])}" data-label="${esc(compTitle(x))} · ${NAMES[k]} save">${sgn(num(V.sv[k]))}</span>`}</td></tr>`).join('')}</tbody></table></div>`, tools);
  }
  if (id === 'attacks'){
    const rows = V.attacks.map((a, j) => `<div class="ca-row"><div class="ca-n"><b>${esc(a.n)}</b><span class="hint">${esc([a.kind, a.extra].filter(Boolean).join(' · '))}</span></div>
      <div class="ca-v"><span class="cap">Attack</span><span class="out sm roll" data-bonus="${a.bonus[0]}" data-label="${esc(compTitle(x))} · ${esc(a.n)}" title="Click to roll">${a.bonus.map(sgn).join('/')}</span></div>
      <div class="ca-v"><span class="cap">Damage</span>${a.dmg ? `<button class="out sm ca-dmg" data-act="rollExpr" data-expr="${esc(a.dmg)}" data-label="${esc(compTitle(x))} · ${esc(a.n)} damage" title="Click to roll damage">${esc(a.dmg)}</button>` : '<span class="hint">—</span>'}</div></div>`).join('');
    const list = `<div class="ca-list">${rows || `<div class="empty">${s.custom ? 'Type its attacks below, like “Bite +3 melee (1d6+1)”, and they become rollable here.' : 'No attacks listed for this creature.'}</div>`}</div>`;
    if (mode === 'compact') return panel('Attacks', list, tools);
    const text = s.custom ? `<div class="pb">${F('Attacks (e.g. Bite +3 melee (1d6+1); 2 claws +1 melee (1d4))', T(`${P('stats')}.attack`, (x.stats || {}).attack, 'rows="2" data-rerender="1"'))}</div>`
      : `<dl class="statblock comp-sb pb" style="margin:0;border:0">${V.attackText ? `<dt>Attack</dt><dd>${esc(V.attackText)}</dd>` : ''}${V.fullText ? `<dt>Full attack</dt><dd>${esc(V.fullText)}</dd>` : ''}</dl>`;
    return panel('Attacks', list + text, tools);
  }
  if (id === 'gear'){
    if (mode === 'compact') return panel('Gear', `<div class="pb">${x.gear ? esc(x.gear).replace(/\n/g, '<br>') : '<span class="hint">Nothing listed.</span>'}</div>`, tools);
    return panel('Gear', `<div class="pb">${T(P('gear'), x.gear || '', `rows="3" placeholder="${x.kind === 'mount' ? 'Saddle, bit and bridle, barding, saddlebags…' : 'Collar, barding, items it carries…'}"`)}</div>`, tools);
  }
  if (id === 'skills'){
    const sk = s.custom ? (x.stats || {}).skills : s.skills, ft = s.custom ? (x.stats || {}).feats : s.feats;
    if (mode === 'compact') return panel('Skills &amp; feats', `<div class="pb grid" style="gap:4px">${sk ? `<div><span class="cap">Skills</span> ${esc(sk)}</div>` : ''}${ft ? `<div><span class="cap">Feats</span> ${esc(ft)}</div>` : ''}${!sk && !ft ? '<span class="hint">None listed.</span>' : ''}</div>`, tools);
    return panel('Skills &amp; feats', s.custom ? `<div class="pb fields">${F('Skills', I(`${P('stats')}.skills`, (x.stats || {}).skills), 'wide')}${F('Feats', I(`${P('stats')}.feats`, (x.stats || {}).feats), 'wide')}${F('Special qualities', T(`${P('stats')}.sq`, (x.stats || {}).sq, 'rows="2"'), 'wide')}</div>`
      : `<dl class="statblock comp-sb pb" style="margin:0;border:0">${sk ? `<dt>Skills</dt><dd>${esc(sk)}</dd>` : ''}${ft ? `<dt>Feats</dt><dd>${esc(ft)}</dd>` : ''}</dl>`, tools);
  }
  return '';
}

function renderCompanions(c){
  c.companions = c.companions || []; const L = compLevels(c);
  const elig = [L.druid ? `animal companion (effective druid level ${L.druid})` : '', L.arcane ? `familiar (master level ${L.arcane})` : '', L.paladin >= 5 ? `special mount (paladin ${L.paladin})` : ''].filter(Boolean);
  const blocks = c.companions.map(x => {
    const inInit = !!compInitEntry(c, x);
    const items = COMP_PANELS.map(p => { const m = compMode(x, p.id); if (m === 'hidden') return '';
      return `<div class="sheet-sec sp-${p.size} sp-m-${m}" data-panel="${p.id}">${compPanel(c, x, p.id, m, compSeg(x, p, m))}</div>`; }).join('');
    const hid = COMP_PANELS.filter(p => compMode(x, p.id) === 'hidden');
    return `<div class="cmp-block"><div class="cmp-bar"><h2>${esc(compTitle(x))}</h2><span class="pill acc">${esc(COMP_KIND[x.kind] || '')}</span><span class="cmp-tools">
        <button class="btn sm ${inInit ? '' : 'pri'}" data-act="compInit" data-id="${x.id}">${inInit ? 'Roll initiative again' : 'Add to initiative'}</button><button class="btn ghost sm" data-act="compDel" data-id="${x.id}">Remove</button></span></div>
      <div class="sheet-grid">${items}</div>
      ${hid.length ? `<p class="hint sp-foot">Hidden: ${hid.map(p => `<a href="#" data-cmpmode="${x.id}" data-panel="${p.id}" data-v="full">${esc(p.title)}</a>`).join(', ')} (click to show).</p>` : ''}</div>`; }).join('');
  return `<div class="grid" style="gap:14px">
    <div class="panel"><div class="ph"><h2>Companions</h2><div class="tools"><button class="btn sm pri" data-act="compAdd">Add from the rules</button><button class="btn sm" data-act="compCustom">Add custom</button></div></div>
      <p class="pb hint" style="margin:0">${elig.length ? `Your classes give you: ${esc(elig.join(', '))}. Stats are worked out from the SRD tables for your level.` : 'Druids and rangers get animal companions, sorcerers and wizards get familiars, and paladins get a special mount at 5th level. You can also add any animal or a custom companion.'} Each box can be shown Full, Compact or hidden. Add a companion to initiative and its boxes also appear on Combat &amp; Effects.</p></div>
    ${blocks || `<div class="panel"><div class="empty"><b>No companions yet.</b><br>Add an animal companion, familiar or mount from the SRD lists, or make a custom one (a cohort, hireling, summoned ally or pet).</div></div>`}</div>`;
}
// the initiative entry for a companion (linked by id; older entries by name)
function compInitEntry(c, x){ const l = (c.combat || {}).list || []; return l.find(e => e.comp === x.id) || l.find(e => !e.comp && !e.me && e.n && e.n === compTitle(x)); }
document.addEventListener('click', e => { const b = e.target.closest('[data-cmpmode]'); if (!b) return; e.preventDefault(); const c = APP_cur(); if (!c) return;
  const x = (c.companions || []).find(v => v.id === b.dataset.cmpmode); if (!x) return; compMode(x, b.dataset.panel); x.layout.mode[b.dataset.panel] = b.dataset.v; markDirty(); renderAll(); });

// companions in initiative also get boxes on Combat & Effects (each Full or Compact, compact to start)
function trackerCompanions(c){
  const out = [];
  for (const x of c.companions || []){ if (!compInitEntry(c, x)) continue;
    out.push({id: 'h-cmp-' + x.id, full: () => `<h2 class="trk-h">${esc(compTitle(x))} <span class="pill acc">${esc(COMP_KIND[x.kind] || 'Companion')}</span></h2>`});
    for (const id of ['combat', 'abilities', 'saves', 'attacks']) out.push({id: `cmp-${x.id}-${id}`, full: () => compPanel(c, x, id, 'full'), compact: () => compPanel(c, x, id, 'compact'), def: 'compact'});
  }
  return out;
}
function openCompanionPicker(c){
  const L = compLevels(c); const adj = altAdj(); const entries = [];
  const add = (n, cat, sub, kind) => { const a = animalByName(n); if (a) entries.push({name:a.n, sub, cat, type:'animal', key:a.n, kind}); };
  COMP_BASE.forEach(n => add(n, 'Animal companions', 'druid level 1+', 'companion'));
  COMP_AQUATIC.forEach(n => add(n, 'Animal companions', 'aquatic campaigns', 'companion'));
  Object.entries(adj).sort((a, b) => a[1] - b[1]).forEach(([n, v]) => add(n, 'Animal companions (higher level)', `druid level ${v + 1}+${L.druid && L.druid < v + 1 ? ' (not yet)' : ''}`, 'companion'));
  Object.entries(FAMILIARS).forEach(([k, n]) => { const a = animalByName(n); if (a) entries.push({name:k, sub:((CR.familiars || []).find(r => r[0] === k) || [])[1] || '', cat:'Familiars', type:'animal', key:a.n, kind:'familiar'}); });
  MOUNTS.forEach(n => add(n, 'Paladin’s special mount', 'paladin level 5+', 'mount'));
  (SRD.animals || []).forEach(a => entries.push({name:a.n, sub:a.type, cat:'Any animal (unchanged stats)', type:'animal', key:a.n, kind:'animal'}));
  openPicker({title:'Add a companion', kind:'_comp', entries, onPick: e => {
    c.companions = c.companions || []; c.companions.push({id:uid('cmp'), kind:e.kind, base:e.key, n:'', tricks:'', notes:'', img:''}); markDirty(); renderAll(); return false; }, onCustom: () => { c.companions = c.companions || []; c.companions.push(newCustomComp()); markDirty(); renderAll(); }});
}
function newCustomComp(){ return {id:uid('cmp'), kind:'custom', base:'', n:'', tricks:'', notes:'', img:'', stats:{}}; }
