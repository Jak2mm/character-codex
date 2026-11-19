// ===================== ATTACK OPTIONS & ATTACKS OF OPPORTUNITY (3.5 SRD) =====================
// Situational modifiers you switch on during a fight (flanking, charging, Power Attack, sneak attack…).
// Only the options this character can use are listed. They feed the normal bonus system, so every
// attack, damage and AC number on every page includes them while they are on.
// Saved on the character as c.combat.opts = {flank:true, pa:2, …}; c.combat.aoo = attacks of opportunity used this round.

const hasFeat = (c, n) => (c.feats || []).some(f => normKey(f.n) === normKey(n));
const clsLvl = (c, n) => num((c.classes.find(k => k.n === n) || {}).lvl);
function combatOptsOf(c){ c.combat = c.combat || {round:0, turn:0, list:[]}; c.combat.opts = c.combat.opts || {}; return c.combat.opts; }

function optDefs(c){
  const tumble5 = num(((c.skills || {}).Tumble || {}).ranks) >= 5;
  const anyRanged = (c.attacks || []).some(a => weaponInfo(a).ranged), bab = num(D.bab), cha = num(D.Cha);
  const rogue = clsLvl(c, 'Rogue'), pal = clsLvl(c, 'Paladin'), precise = hasFeat(c, 'Precise Shot');
  return [
    {id: 'flank', g: 'Situation', label: 'Flanking', desc: '+2 on melee attacks. An ally threatens the same foe from the opposite side.', b: () => [B('atk.melee', 'untyped', 2)]},
    {id: 'high', g: 'Situation', label: 'Higher ground', desc: '+1 on melee attacks against a foe below you.', b: () => [B('atk.melee', 'untyped', 1)]},
    {id: 'charge', g: 'Situation', round: true, label: 'Charging', desc: '+2 on the charge attack, −2 to AC until your next turn.', b: () => [B('atk.melee', 'untyped', 2), B('ac', 'untyped', -2)]},
    {id: 'defensive', g: 'Situation', round: true, label: 'Fighting defensively', desc: `−4 on attacks this round, +${tumble5 ? 3 : 2} dodge bonus to AC${tumble5 ? ' (5 ranks in Tumble)' : ''}.`, b: () => [B('atk', 'untyped', -4), B('ac', 'dodge', tumble5 ? 3 : 2)]},
    {id: 'totaldef', g: 'Situation', round: true, label: 'Total defense', desc: `+${tumble5 ? 6 : 4} dodge bonus to AC${tumble5 ? ' (5 ranks in Tumble)' : ''}. You can't attack, including attacks of opportunity.`, b: () => [B('ac', 'dodge', tumble5 ? 6 : 4)]},
    anyRanged && {id: 'intomelee', g: 'Situation', label: 'Shooting into melee', desc: precise ? 'No penalty: you have Precise Shot.' : '−4 on ranged attacks at a foe who is in melee with an ally.', b: () => precise ? [] : [B('atk.ranged', 'untyped', -4)]},
    rogue && {id: 'sneak', g: 'Class', label: `Sneak attack (+${Math.ceil(rogue / 2)}d6)`, desc: 'Foe is flanked or denied its Dex bonus. Ranged only within 30 ft. Not against creatures immune to critical hits.', dice: `${Math.ceil(rogue / 2)}d6`},
    pal && {id: 'smite', g: 'Class', round: true, label: 'Smite evil', desc: `+${Math.max(0, cha)} attack (Cha) and +${pal} damage on one melee attack against an evil foe. ${1 + Math.floor(pal / 5)} per day.`, b: () => [B('atk.melee', 'untyped', Math.max(0, cha)), B('dmg.melee', 'untyped', pal)]},
    hasFeat(c, 'Power Attack') && {id: 'pa', g: 'Feats', n: true, max: Math.max(0, bab), label: 'Power Attack', desc: 'Take −N on melee attacks for +N damage (+2N with a two-handed weapon, no extra damage with a light weapon).'},
    hasFeat(c, 'Combat Expertise') && {id: 'ce', g: 'Feats', n: true, max: Math.max(0, Math.min(5, bab)), label: 'Combat Expertise', desc: 'Take −N on attacks for a +N dodge bonus to AC (up to 5).', b: v => [B('atk', 'untyped', -v), B('ac', 'dodge', v)]},
    hasFeat(c, 'Point Blank Shot') && anyRanged && {id: 'pbs', g: 'Feats', label: 'Point Blank Shot', desc: '+1 on ranged attack and damage rolls within 30 ft.', b: () => [B('atk.ranged', 'untyped', 1), B('dmg.ranged', 'untyped', 1)]},
    hasFeat(c, 'Rapid Shot') && anyRanged && {id: 'rapid', g: 'Feats', label: 'Rapid Shot', desc: 'One extra ranged attack at your highest bonus on a full attack; −2 on all ranged attacks that round.', b: () => [B('atk.ranged', 'untyped', -2)]},
  ].filter(Boolean);
}
// bonuses from the options that are on (called from collectBonuses)
function combatOptBonuses(c){
  const o = combatOptsOf(c), out = [];
  for (const d of optDefs(c)){ const v = o[d.id]; if (!v || !d.b) continue; const n = d.n ? Math.min(num(v), d.max) : 1; if (d.n && !n) continue;
    out.push({list: d.b(n), src: d.n ? `${d.label} (${n})` : d.label.replace(/ \(.*\)$/, ''), id: d.id}); }
  return out;
}
// extras worked out per weapon in atkCalc: Power Attack, sneak attack dice, Rapid Shot's extra attack
function atkOptExtras(c, a, kind, twoH){
  const o = combatOptsOf(c), wi = weaponInfo(a), out = {atk: 0, dmg: 0, dice: '', extraAtk: false, atkParts: [], dmgParts: []};
  if (kind === 'melee' && !wi.ranged && num(o.pa) && hasFeat(c, 'Power Attack')){
    const n = Math.min(num(o.pa), num(D.bab)); const d = wi.light && !wi.natural ? 0 : twoH ? 2 * n : n;
    out.atk -= n; out.dmg += d; out.atkParts.push([`Power Attack (−${n})`, -n]); out.dmgParts.push([`Power Attack${twoH ? ' ×2 (two hands)' : wi.light && !wi.natural ? ' (none with a light weapon)' : ''}`, d]); }
  if (o.sneak && clsLvl(c, 'Rogue')){ out.dice = `${Math.ceil(clsLvl(c, 'Rogue') / 2)}d6`; out.dmgParts.push(['Sneak attack', '+' + out.dice]); }
  if (o.rapid && hasFeat(c, 'Rapid Shot') && (wi.ranged || kind === 'ranged')) out.extraAtk = true;
  return out;
}

// ---- attacks of opportunity: 1 a round, or 1 + Dex modifier with Combat Reflexes ----
function aooMax(c){ return hasFeat(c, 'Combat Reflexes') ? 1 + Math.max(0, num(D.Dex)) : 1; }
function aooBlock(c, compact){
  const max = aooMax(c), used = Math.min(num(c.combat.aoo), max), left = max - used, td = !!combatOptsOf(c).totaldef;
  const pips = Array.from({length: max}, (_, i) => `<span class="pip ${i < used ? 'used' : ''}"></span>`).join('');
  return `<div class="aoo ${compact ? 'compact' : ''}"><span class="cap">Attacks of opportunity</span><span class="pips">${pips}</span><b>${left} of ${max} left</b>
    <button class="btn sm ${left && !td ? 'pri' : ''}" data-aoo="use" ${left && !td ? '' : 'disabled'} title="${td ? 'Not while using total defense' : 'Use one and roll your main melee attack'}">Make attack of opportunity</button>
    ${used ? '<button class="btn sm ghost" data-aoo="undo" title="Give one back">Undo</button>' : ''}
    ${compact ? '' : `<span class="hint">${hasFeat(c, 'Combat Reflexes') ? `Combat Reflexes: 1 + Dex modifier (${sgn(num(D.Dex))}). You can also make them while flat-footed.` : 'One per round (Combat Reflexes gives more). Resets when the round moves on.'}</span>`}</div>`;
}

function attackOptionsPanel(c, compact){
  const o = combatOptsOf(c), defs = optDefs(c);
  const ctl = d => d.n
    ? `<select data-optn="${d.id}" aria-label="${esc(d.label)}">${Array.from({length: d.max + 1}, (_, i) => `<option value="${i}" ${num(o[d.id]) === i ? 'selected' : ''}>${i ? '−' + i : 'Off'}</option>`).join('')}</select>`
    : `<input type="checkbox" data-opt="${d.id}" ${o[d.id] ? 'checked' : ''} aria-label="${esc(d.label)}">`;
  const on = d => d.n ? num(o[d.id]) > 0 : !!o[d.id];
  let body;
  if (compact){
    body = `<div class="pb opt-chips">${defs.map(d => d.n
      ? `<label class="opt-chip ${on(d) ? 'on' : ''}" title="${esc(d.desc)}">${esc(d.label)} ${ctl(d)}</label>`
      : `<button class="opt-chip ${on(d) ? 'on' : ''}" data-opt="${d.id}" aria-pressed="${on(d)}" title="${esc(d.desc)}">${esc(d.label)}${d.round ? ' <small>this round</small>' : ''}</button>`).join('')}</div>${aooBlock(c, true)}`;
  } else {
    const groups = ['Situation', 'Class', 'Feats'].map(g => { const list = defs.filter(d => d.g === g); if (!list.length) return '';
      return `<div class="splv">${g === 'Feats' ? 'Your feats' : g === 'Class' ? 'Your class' : 'Situation'}</div>` + list.map(d => `<label class="opt-row ${on(d) ? 'on' : ''}">${ctl(d)}<span><b>${esc(d.label)}</b>${d.round ? ' <span class="pill">this round</span>' : ''}<span class="hint">${esc(d.desc)}</span></span></label>`).join(''); }).join('');
    body = `${aooBlock(c, false)}<div class="opt-list">${groups}</div>
      <p class="hint pb" style="margin:0">Options switched on here are included in every attack, damage and AC number. Ones marked <b>this round</b> switch off when the round moves on. Hover a total to see what's adding up.</p>`;
  }
  const n = defs.filter(on).length;
  return panel('Attack options', body, n ? `<button class="btn sm ghost" data-opt="clear">Clear ${n}</button>` : '');
}

// switching options
function setOpt(id, v){ const c = APP_cur(); if (!c) return; const o = combatOptsOf(c);
  if (id === 'clear'){ c.combat.opts = {}; }
  else { if (v) o[id] = v; else delete o[id];
    if (id === 'totaldef' && v){ delete o.defensive; delete o.charge; } if ((id === 'defensive' || id === 'charge') && v) delete o.totaldef; }
  markDirty(); renderAll(); }
document.addEventListener('change', e => { const t = e.target;
  if (t.dataset && t.dataset.opt && t.type === 'checkbox'){ setOpt(t.dataset.opt, t.checked); }
  if (t.dataset && t.dataset.optn){ setOpt(t.dataset.optn, num(t.value)); } });
document.addEventListener('click', e => { const b = e.target.closest('button[data-opt]'); if (b){ e.preventDefault(); const c = APP_cur(); setOpt(b.dataset.opt, b.dataset.opt === 'clear' ? 0 : !combatOptsOf(c)[b.dataset.opt]); return; }
  const a = e.target.closest('[data-aoo]'); if (!a) return; e.preventDefault(); const c = APP_cur(); if (!c) return;
  if (a.dataset.aoo === 'undo'){ c.combat.aoo = Math.max(0, num(c.combat.aoo) - 1); markDirty(); renderAll(); return; }
  if (num(c.combat.aoo) >= aooMax(c)) return; c.combat.aoo = num(c.combat.aoo) + 1;
  const w = c.attacks.find(x => x.eq && !weaponInfo(x).ranged) || c.attacks.find(x => !weaponInfo(x).ranged);
  markDirty(); renderAll();
  if (w){ const r = atkCalc(c, w, D); rollToast(`Attack of opportunity · ${w.n}`, r.first); } else toast('Attack of opportunity used.');
});
// called when the round moves on
function roundResetOpts(c){ const o = combatOptsOf(c); optDefs(c).forEach(d => { if (d.round) delete o[d.id]; }); c.combat.aoo = 0; }
