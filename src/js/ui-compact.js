// ===================== COMPACT PANELS (3.5 SRD) =====================
// Short versions of the busiest sheet panels, for play at the table: big numbers in boxes with the
// label underneath. A player picks Full, Compact or Hidden per panel (Customise sheet, or the
// toggle in the panel's title bar). The Combat & Effects page also uses these so you rarely need
// to leave it during a fight. All numbers come from the same D values as the full panels.

// one stat box: big value on top, small label under it
const sbox = (val, label, extra = '') => `<div class="sbox ${extra}"><div class="sb-v">${val}</div><div class="sb-l">${label}</div></div>`;

function compactAbilities35(c){
  const boxes = ABIL.map(a => { const t = num(c.abil[a].temp) !== 0, k = t ? 't' : '';
    const score = `<span class="sb-big roll" data-roll="ab.${a}.${k}mod" data-label="${ABIL_FULL[a]} check" data-o="ab.${a}.${t ? 'tscore' : 'total'}" data-ref="bd" data-name="ab.${a}" title="Click to roll a ${ABIL_FULL[a]} check"></span>`;
    return `<div class="sbox ab-box${t ? ' temp' : ''}"${t ? ' title="Includes a temporary adjustment"' : ''}><div class="sb-l">${refA('gloss', a, a.toUpperCase(), 'tag')}</div><div class="sb-v">${score}</div>
      <div class="sb-sub" title="Modifier${t ? ' with temporary adjustment' : ''}"><span data-o="ab.${a}.${k}mod" data-fmt="sgn"></span></div></div>`; }).join('');
  return panel('Ability scores', `<div class="pb sbox-grid ab-grid">${boxes}</div>`);
}

function compactSaves35(c){
  const NAMES = {Fort: 'Fortitude', Ref: 'Reflex', Will: 'Will'}, AB = {Fort: 'Con', Ref: 'Dex', Will: 'Wis'};
  const boxes = ['Fort', 'Ref', 'Will'].map(s => `<div class="sbox sv-box"><div class="sb-l">${refA('gloss', s, NAMES[s], 'tag')}</div>
      <div class="sb-v"><span class="sb-big roll" data-roll="sv.${s}" data-label="${NAMES[s]} save" data-o="sv.${s}" data-fmt="sgn" data-ref="bd" data-name="sv.${s}" title="Click to roll"></span></div>
      <div class="sb-sub" title="Base save and ability modifier"><span class="sv-base">base <span data-o="sv.${s}.base" data-fmt="sgn"></span> ·</span> ${AB[s]} <span data-o="sv.${s}.ab" data-fmt="sgn"></span></div></div>`).join('');
  return panel('Saving throws', `<div class="pb sbox-grid sv-grid">${boxes}</div>`);
}

function compactCombat35(c){
  const hp = `<div class="hp-box">
      <div class="hp-top"><span class="sb-l">${refA('gloss', 'HP', 'Hit points', 'tag')}</span><span class="pill" id="hpState"></span></div>
      <div class="hp-nums"><label class="hp-cur" title="Current hit points"><span class="vh">Current hit points</span>${N('hp.cur', c.hp.cur)}</label><span class="hp-sl">/</span>
        <span class="hp-max" data-o="hpMax" data-ref="bd" data-name="hp" title="Max hit points"></span>
        <label class="hp-sm"><span>Temp</span>${N('hp.temp', c.hp.temp, 'aria-label="Temporary hit points"')}</label>
        <label class="hp-sm"><span>Nonlethal</span>${N('hp.nl', c.hp.nl, 'aria-label="Nonlethal damage"')}</label></div>
      <div class="meter" id="hpMeter"><i></i></div>
      <div class="hp-ctl"><button class="btn sm hp-dmg" data-act="dmg">Damage</button><input type="number" id="hpDelta" placeholder="Amount" aria-label="Damage or healing amount"><button class="btn sm hp-heal" data-act="heal">Heal</button></div></div>`;
  const big = (o, fmt, roll, label) => `<span class="sb-big${roll ? ' roll' : ''}" data-o="${o}" data-fmt="${fmt}"${roll ? ` data-roll="${o}" data-label="${label}" title="Click to roll"` : ''}></span>`;
  const boxes = [
    sbox(`<span class="sb-big" data-o="ac" data-ref="bd" data-name="ac"></span>`, refA('gloss', 'AC', 'Armor class', 'tag'), 'acc'),
    sbox(big('touch', ''), refA('gloss', 'Touch', 'Touch', 'tag')),
    sbox(big('ff', ''), refA('gloss', 'FF', 'Flat-footed', 'tag')),
    sbox(big('init', 'sgn', true, 'Initiative'), refA('gloss', 'Init', 'Initiative', 'tag')),
    sbox(`<span class="sb-big" data-o="speed"></span>`, refA('gloss', 'Speed', 'Speed (ft.)', 'tag')),
    sbox(`<span class="sb-big" data-o="bab" data-fmt="sgn" title="Your highest base attack bonus. Extra attacks at higher levels are shown on each weapon in Attacks."></span>`, refA('gloss', 'BAB', 'Base attack', 'tag')),
    sbox(big('grapple', 'sgn', true, 'Grapple'), refA('gloss', 'Grapple', 'Grapple', 'tag')),
  ].join('');
  return panel('Combat', `<div class="pb cc-wrap">${hp}<div class="sbox-grid cc-grid">${boxes}</div>
    ${D.noDex ? '<p class="hint" style="margin:0;color:var(--bad)">A condition is denying your Dex bonus to AC.</p>' : ''}${c.dr || c.sr ? `<p class="hint" style="margin:0">${c.dr ? `DR <b>${esc(c.dr)}</b>` : ''}${c.dr && c.sr ? ' · ' : ''}${c.sr ? `SR <b>${esc(c.sr)}</b>` : ''}</p>` : ''}</div>`);
}

function compactGear35(c){
  const st = bonusStatus(D);
  const rows = SLOTS.map(([k, label]) => { const it = slotItem(c, k); if (!it) return '';
    const L = it.lib ? libById(it.lib) : null;
    const name = (L ? refA('custom', L.id, it.n, 'custom') : getRef('item', it.n) ? refA('item', it.n) : `<b>${esc(it.n)}</b>`) + (it.plus && !L ? ` <b>+${it.plus}</b>` : '');
    const live = liveBonuses('item', it.id);
    return `<div class="cg-row"><span class="cg-slot">${esc(label.replace(' (held)', ''))}</span><span class="cg-n">${name}</span>${live.length ? `<span class="bchips">${bonusChips(live, st)}</span>` : ''}</div>`; }).join('');
  return panel('Gear', `<div class="cg-list">${rows || '<div class="empty">Nothing equipped. Switch this panel to Full to put items in their slots.</div>'}</div>
    <div class="pb row hint" style="border-top:1px solid var(--rule-2)">Armor check ${OT('acp')} · spell failure ${OT('asf')}% · max Dex ${OT('mdx')}</div>`);
}

function compactAttacks35(c){
  const list = [...c.attacks].sort((a, b) => (b.eq ? 1 : 0) - (a.eq ? 1 : 0));
  const rows = list.map(a => `<div class="ca-row ${a.eq ? '' : 'stowed'}" data-atk="${a.id}">
      <div class="ca-n">${getRef('item', a.n) ? refA('item', a.n) : `<b>${esc(a.n || 'Unnamed')}</b>`}<span class="hint">${esc([a.eq ? {main:'main hand', off:'off hand', both:'both hands'}[a.eq] : 'not equipped', a.crit ? 'crit ' + a.crit : '', a.note || [a.rng, a.ty].filter(x => x && x !== '—').join(' · ')].filter(Boolean).join(' · '))}</span></div>
      <div class="ca-v"><span class="cap">Attack</span><span class="out sm roll atkb" data-label="${esc(a.n)} attack" data-ref="bd" data-name="atk:${a.id}" title="Click to roll"></span></div>
      <div class="ca-v"><span class="cap">Damage</span><button class="out sm atkd ca-dmg" data-act="rollDmg" data-id="${a.id}" data-ref="bd" data-name="dmg:${a.id}" title="Click to roll damage"></button></div>
      ${a.eq ? '' : `<button class="btn sm" data-act="wieldAtk" data-id="${a.id}">Wield</button>`}${ammoRow(c, a)}</div>`).join('');
  return panel('Attacks', `<div class="ca-list">${rows || '<div class="empty">No attacks yet. Switch this panel to Full, or use the Character page, to add weapons.</div>'}</div>`,
    `<button class="btn sm pri" data-act="addAtk">Add weapon</button>`);
}

// spells ready to cast: slots, plus prepared spells (prepared casters) or spells known (spontaneous casters)
function spellsReady35(c){
  const casters = c.classes.map(k => ({k, info: casterInfo(c, k, D)})).filter(x => x.info);
  if (!casters.length) return '';
  return casters.map(({k, info}) => {
    const book = c.spells[k.n] || (c.spells[k.n] = {list:[], used:{}});
    const slots = info.slots.filter(s => s.total != null).map(s => { const used = num(book.used[s.lvl]), tot = s.total;
      return `<div class="rs-slot" data-ref="bd" data-name="slot:${esc(k.n)}:${s.lvl}"><span class="lv">${s.lvl === 0 ? '0' : ord(s.lvl)}</span><b>${Math.max(0, tot - used)}<small>/${tot}</small></b><span class="dc">DC ${s.dc}</span>
        <span class="pips">${Array.from({length: tot}, (_, i) => `<button class="pip ${i < used ? 'used' : ''}" data-act="pip" data-cls="${k.n}" data-lvl="${s.lvl}" data-n="${i}" aria-label="${ord(s.lvl)} level slot ${i + 1}"></button>`).join('')}</span></div>`; }).join('');
    const ready = book.list.filter(s => info.ci.spont || num(s.prep) > 0);
    const levels = [...new Set(ready.map(s => num(s.lvl)))].sort((a, b) => a - b);
    const rows = levels.map(L => `<div class="splv">${lvLabel(L)}</div>` + ready.filter(s => num(s.lvl) === L).map(s => {
      const i = book.list.indexOf(s), left = info.ci.spont ? null : Math.max(0, num(s.prep) - num(s.cast));
      const sd = IDX.spells.get(s.n.toLowerCase()); const meta = sd ? [sd.ct, sd.rng, sd.dur].filter(Boolean).join(' · ') : '';
      return `<div class="sp rs-sp ${left === 0 ? 'spent' : ''}"><div>${refA('spell', s.n, s.n, !sd && libByName('spell', s.n) ? 'custom' : '')}${s.dom ? ' <span class="pill gold">domain</span>' : ''}<div class="meta">${esc(meta)}</div></div>
        <div class="row" style="justify-content:flex-end;gap:6px">${left == null ? '' : `<span class="pill ${left ? 'acc' : ''}">${left} of ${num(s.prep)} left</span>`}<button class="btn sm pri" data-act="cast" data-cls="${k.n}" data-i="${i}">Cast</button></div></div>`; }).join('')).join('');
    const empty = info.ci.spont ? `No spells known yet. Add them on the <a href="#" data-tab="spells">Spells</a> page.` : `No spells prepared. Prepare them on the <a href="#" data-tab="spells">Spells</a> page.`;
    return panel(`${k.n} spells`, `<div class="pb"><div class="row hint" style="gap:14px;margin-bottom:8px"><span>Caster level <b>${info.cl}</b></span><span>${esc(info.ci.ab)} <b>${sgn(info.mod)}</b></span><span>${info.ci.spont ? 'Spells known' : 'Prepared spells'}</span>${D.asf && ['Bard','Sorcerer','Wizard'].includes(k.n) ? `<span class="pill warn">Spell failure ${D.asf}%</span>` : ''}</div>
        <div class="rs-slots">${slots}</div></div><div class="list" style="border-top:1px solid var(--rule)">${rows || `<div class="empty">${empty}</div>`}</div>`,
      `<button class="btn sm" data-tab="spells">All spells</button>`);
  }).join('');
}

// the bottom of Combat & Effects: everything you need on your turn without changing page
function trackerExtras35(c){
  const P = sheetPanels35(c);
  return `<div class="trk-extra"><div class="splv trk-h">Your character</div>
    ${P.combat}<div class="grid g2" style="align-items:start">${compactSaves35(c)}${compactAttacks35(c)}</div>
    ${spellsReady35(c)}${renderItemSpells(c)}</div>`;
}
