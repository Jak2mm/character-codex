// ===================== SPELLS TAB =====================
function renderSpells(c){
  const casters = c.classes.map(k => ({k, info: casterInfo(c, k, D)})).filter(x => x.info);
  const itemSp = renderItemSpells(c);
  if (!casters.length) return itemSp + panel('Spells', `<div class="empty">None of your classes cast spells yet. Bards, clerics, druids, sorcerers and wizards cast from 1st level; paladins and rangers from 4th.<br><br>
    You can still track spell effects on you (from allies, potions or scrolls) on the <b>Combat &amp; Effects</b> tab.</div>`);
  return `<div class="grid" style="gap:14px">${casters.map(({k, info}) => spellClassPanel(c, k, info)).join('')}${itemSp}</div>`;
}
// ---- how many spells a prepared caster may prepare (3.5: one per spell slot; a cleric's domain slot takes only domain spells) ----
const prepLimitOn = c => c.prepLimit !== false;
// ---- specialist wizards (3.5 SRD): one extra spell of the specialty school per spell level; prohibited schools can't be learned or prepared ----
const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];
function spellSchool(n){ const sd = IDX.spells.get(String(n || '').toLowerCase()); const L = !sd && typeof libByName === 'function' ? libByName('spell', n) : null;
  const m = String((sd || L || {}).sch || '').match(/^(\w+)/); return m ? m[1] : ''; }
const wizBanned = c => (c.wizBanned || []).filter(Boolean);
const isProhibited = (c, cls, s) => cls === 'Wizard' && !!c.wizSchool && wizBanned(c).includes(spellSchool(s.n));
// does this spell fit the class's extra slot (a cleric's domain slot, a specialist's school slot)?
const isSpecialSpell = (c, cls, s) => cls === 'Wizard' ? !!c.wizSchool && spellSchool(s.n) === c.wizSchool : !!s.dom;
function prepUsed(book, lvl, skip = -1, c, cls){ let all = 0, plain = 0; book.list.forEach((s, i) => { if (i === skip || num(s.lvl) !== lvl) return; const p = num(s.prep); all += p; if (!(c ? isSpecialSpell(c, cls, s) : s.dom)) plain += p; }); return {all, plain}; }
// how many copies of one spell can be prepared, given everything else already prepared at that level (sp = the spell, or true/false for "fits the extra slot")
function prepRoom(c, cls, lvl, sp, skip = -1){
  const k = c.classes.find(x => x.n === cls), info = k && casterInfo(c, k, D); if (!info || info.ci.spont) return Infinity;
  if (sp && typeof sp === 'object' && isProhibited(c, cls, sp)) return 0;
  const special = sp && typeof sp === 'object' ? isSpecialSpell(c, cls, sp) : !!sp;
  const sl = info.slots.find(x => x.lvl === lvl); if (!sl || sl.total == null || !sl.scoreOK) return 0;
  const u = prepUsed(c.spells[cls], lvl, skip, c, cls); const all = sl.total - u.all, plain = sl.total - sl.dom - (sl.spec || 0) - u.plain;
  return Math.max(0, special ? all : Math.min(all, plain));
}
function prepLimitText(info, lvl){ const sl = info.slots.find(x => x.lvl === lvl) || {};
  if (sl.total == null || !sl.scoreOK) return `You can't prepare ${lvLabel(lvl).toLowerCase()} spells yet${sl.total != null ? ' (your casting score is too low)' : ''}.`;
  const n = sl.total - sl.dom - (sl.spec || 0);
  return `You can prepare ${n} ${lvl === 0 ? '0-level' : ord(lvl) + '-level'} spell${n === 1 ? '' : 's'} a day${sl.dom ? ` plus ${sl.dom} domain spell` : ''}${sl.spec ? ` plus 1 more of your specialty school (${esc(info.school || '')})` : ''} (one per spell slot).`; }

function spellClassPanel(c, k, info){
  const book = c.spells[k.n] || (c.spells[k.n] = {list:[], used:{}});
  const lim = !info.ci.spont && prepLimitOn(c);
  const slots = info.slots.map(s => {
    const used = num(book.used[s.lvl]); const tot = s.total;
    const pips = tot == null ? '' : `<div class="pips">${Array.from({length: tot}, (_, i) => `<button class="pip ${i < used ? 'used' : ''}" data-act="pip" data-cls="${k.n}" data-lvl="${s.lvl}" data-n="${i}" aria-label="Slot ${i + 1}"></button>`).join('')}</div>`;
    return `<div class="slot has-why" style="${tot == null ? 'opacity:.4' : ''}" data-ref="bd" data-name="slot:${esc(k.n)}:${s.lvl}"><div class="lv">${s.lvl === 0 ? '0' : ord(s.lvl)}</div>
      <div class="ct">${tot == null ? '—' : `${Math.max(0, tot - used)}<span class="hint" style="font-size:13px">/${tot}</span>`}</div>
      <div class="dc">DC ${s.dc}${s.dom ? ' · +1 domain' : ''}${s.spec ? ' · +1 specialist' : ''}${s.bonus ? ` · +${s.bonus} bonus` : ''}</div>${!s.scoreOK && tot != null ? '<div class="dc" style="color:var(--bad)">score too low</div>' : ''}
      ${info.ci.spont || tot == null ? '' : (() => { const p = prepUsed(book, s.lvl, -1, c, k.n).all, cap = s.scoreOK ? tot : 0; return `<div class="dc prep-n ${p > cap ? 'over' : p === cap && cap ? 'full' : ''}" title="Spells prepared at this level">prepared ${p}/${cap}</div>`; })()}${pips}</div>`;
  }).join('');
  const knownLine = info.known ? `<p class="hint" style="margin:6px 0 0">Spells known: ${info.known.map((n, i) => n == null ? null : `${i === 0 ? '0' : ord(i)}: ${n}`).filter(Boolean).join(' · ')}</p>` : '';
  const levels = [...new Set(book.list.map(s => num(s.lvl)))].sort((a, b) => a - b);
  const list = levels.map(L => `<div class="splv">${lvLabel(L)}</div>` + book.list.filter(s => num(s.lvl) === L).map(s => {
    const i = book.list.indexOf(s); const sd = IDX.spells.get(s.n.toLowerCase()); const custom = !sd && libByName('spell', s.n);
    const meta = sd ? [sd.sch, sd.ct, sd.rng, sd.dur].filter(Boolean).join(' · ') : custom ? [custom.sch, custom.dur].filter(Boolean).join(' · ') : '';
    const left = info.ci.spont ? null : Math.max(0, num(s.prep) - num(s.cast));
    const banned = isProhibited(c, k.n, s), spc = k.n === 'Wizard' && isSpecialSpell(c, k.n, s);
    return `<div class="sp ${banned ? 'prohib' : ''}"><div>${refA('spell', s.n, s.n, custom ? 'custom' : '')}${s.dom ? ' <span class="pill gold">domain</span>' : ''}${spc ? ' <span class="pill gold">specialty</span>' : ''}${banned ? ' <span class="pill bad" title="Your prohibited school: you can\'t prepare or cast it">prohibited school</span>' : ''}<div class="meta">${esc(meta)}</div>${spellDmgLine(s, info.cl)}</div>
      <div class="row" style="justify-content:flex-end;gap:4px">
        ${info.ci.spont ? '' : `<span class="hint">prep</span><input type="number" style="width:52px" data-k="spells.${k.n}.list.${i}.prep" data-num="1" data-rerender="1" id="k-sp-${s.id}" value="${num(s.prep)}" min="0"${lim ? ` max="${num(s.prep) + prepRoom(c, k.n, num(s.lvl), s, i)}"` : ''}><span class="pill ${left ? 'acc' : ''}">${left} left</span>`}
        <button class="btn sm pri" data-act="cast" data-cls="${k.n}" data-i="${i}">Cast</button>
        <button class="btn ghost sm" data-act="delSpell" data-cls="${k.n}" data-i="${i}" aria-label="Remove spell">✕</button></div></div>`; }).join('')).join('');
  const wizRow = k.n === 'Wizard' ? (() => { const sch = c.wizSchool || '', ban = c.wizBanned || [], need = sch ? (sch === 'Divination' ? 1 : 2) : 0;
    const opts = (cur, other) => `<option value="">— choose —</option>${SCHOOLS.filter(x => x !== sch && x !== 'Divination' && x !== other).map(x => `<option ${cur === x ? 'selected' : ''}>${x}</option>`).join('')}`;
    const okBan = wizBanned(c).length === need;
    return `<div class="row wiz-row" style="margin-top:8px;gap:8px"><span class="cap">Specialist school</span><select data-wiz="school" style="width:auto"><option value="">None (universalist)</option>${SCHOOLS.map(x => `<option ${sch === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
      ${need ? `<span class="cap">Prohibited</span>${Array.from({length: need}, (_, j) => `<select data-wiz="ban" data-j="${j}" style="width:auto">${opts(ban[j] || '', ban[1 - j] || '')}</select>`).join('')}` : ''}
      <span class="hint">${sch ? `One extra ${esc(sch.toLowerCase())} spell per spell level each day${okBan ? '' : ` · <b style="color:var(--warn)">choose ${need} prohibited school${need === 1 ? '' : 's'}</b>`} · +2 on Spellcraft to learn ${esc(sch.toLowerCase())} spells.` : 'Specialising gives one extra spell slot of your school at every level, but you give up two other schools (one for diviners).'}</span></div>`; })() : '';
  const domains = k.n === 'Cleric' ? `<div class="row" style="margin-top:8px"><span class="cap">Domains</span>${[0, 1].map(i => `<div style="width:150px">${S('domains.' + i, c.domains[i] || '', [['', '— choose —'], ...DOMAINS], 'data-rerender="1"')}</div>${c.domains[i] ? refA('domain', c.domains[i], 'ⓘ') : ''}`).join('')}</div>` : '';
  return panel(`${k.n} spells`, `<div class="pb">
      <div class="row" style="gap:16px;margin-bottom:8px"><span><span class="cap">Caster level</span> <b>${info.cl}</b></span><span><span class="cap">Casting ability</span> <b>${info.ci.ab} ${sgn(info.mod)}</b></span>
        <span><span class="cap">Type</span> <b>${info.ci.spont ? 'Spontaneous (spells known)' : 'Prepared'}</b></span>${info.ci.spont ? '' : `<label class="mini prep-lim" title="When on, you can only prepare as many spells as you have spell slots (3.5 rules). Turn off for house rules or special cases such as a specialist wizard's extra slot."><input type="checkbox" data-k="prepLimit" data-rerender="1" ${lim ? 'checked' : ''}> Limit prepared spells to slots</label>`}${D.asf && ['Bard','Sorcerer','Wizard'].includes(k.n) ? `<span class="pill warn">Arcane spell failure ${D.asf}%</span>` : ''}</div>
      <div class="slots">${slots}</div>${knownLine}${domains}${wizRow}</div>
    <div class="list" style="border-top:1px solid var(--rule)">${list || `<div class="empty">No spells on your list yet. <b>Add spells</b> opens the ${esc(k.n.toLowerCase())} spell list with full descriptions.</div>`}</div>`,
    `<button class="btn sm pri" data-act="addSpell" data-cls="${k.n}">Add spells</button><button class="btn sm" data-act="rest" data-cls="${k.n}" title="Restore all slots and prepared spells">Rest</button>`);
}

// ===================== TRACKER TAB =====================
function renderTracker(c, extras = []){
  const cb = c.combat; const order = [...cb.list].sort((a, b) => num(b.init) - num(a.init) || num(b.mod) - num(a.mod));
  const initRows = order.map((x, i) => `<div class="init ${i === cb.turn % Math.max(1, order.length) && cb.round > 0 ? 'cur' : ''}">
    <span class="pos">${i + 1}</span><div>${I('combat.list.' + cb.list.indexOf(x) + '.n', x.n, 'aria-label="Name"')}</div>
    ${N('combat.list.' + cb.list.indexOf(x) + '.init', x.init, 'aria-label="Initiative" data-rerender="1"')}
    <div class="modcol">${N('combat.list.' + cb.list.indexOf(x) + '.mod', x.mod, 'aria-label="Init modifier (tiebreak)" placeholder="mod"')}</div>
    <div class="hpcol">${I('combat.list.' + cb.list.indexOf(x) + '.hp', x.hp, 'placeholder="HP / notes" aria-label="HP or notes"')}</div>
    ${effMenuBtn(c, x)}
    <button class="btn ghost sm" data-act="delInit" data-id="${x.id}" aria-label="Remove">✕</button>${initEffectPills(c, initTid(x))}</div>`).join('');
  const byName = (a, b) => a.n.localeCompare(b.n) || num(b.rounds) - num(a.rounds);
  const active = c.effects.filter(e => !e.expired).sort(byName), expired = c.effects.filter(e => e.expired).sort(byName);
  const effRow = e => { const i = c.effects.indexOf(e); const pct = e.rounds != null && e.total ? Math.max(0, e.rounds / e.total) : 1;
    const t = e.kind === 'spell' ? 'spell' : e.kind === 'condition' ? 'cond' : null;
    return `<div class="eff ${e.expired ? 'expired' : ''}"><div>
        <div class="row" style="gap:6px">${e.ref ? refA('feature', e.ref, e.n) : t && getRef(t, e.n) ? refA(t, e.n) : `<b>${esc(e.n)}</b>`}<span class="pill ${e.kind === 'condition' ? 'warn' : e.kind === 'spell' ? 'acc' : ''}">${esc(e.kind)}</span>
          ${e.expired ? '<span class="pill bad">ended</span>' : e.rounds == null ? '<span class="pill">no countdown</span>' : `<span class="pill good">${fmtRounds(e.rounds)} left</span>`}</div>
        ${e.rounds != null ? `<div class="meter ${pct < .25 ? 'bad' : pct < .5 ? 'warn' : 'acc'}" style="margin-top:6px"><i style="width:${pct * 100}%"></i></div>` : ''}
        <div class="who-line"><span class="cap">On</span>${whoChips(c, e)}<button class="btn sm ghost" data-tgtmenu="${e.id}" title="Choose who this is on">Change ▾</button></div>
        ${effOnSelf(e) ? effectBonusLine(c, e) : ''}
        <div style="margin-top:6px">${I('effects.' + i + '.note', e.note, 'placeholder="Effect notes (bonus, save DC, source)…"')}</div></div>
      <div class="ctl">${e.expired ? `<button class="btn sm" data-act="effRenew" data-id="${e.id}">Renew</button>` : `<span class="hint">rounds</span>${N('effects.' + i + '.rounds', e.rounds, 'min="0" aria-label="Rounds remaining" data-rerender="1"')}`}
        <button class="btn ghost sm" data-act="delEff" data-id="${e.id}" aria-label="Remove effect">✕</button></div></div>`; };
  const barbLvl = num((c.classes.find(k => k.n === 'Barbarian') || {}).lvl);
  const raging = c.effects.some(e => !e.expired && e.n === 'Barbarian Rage');
  const roundP = panel('Round counter', `<div class="pb round-big">
      <div><div class="cap">Round</div><div class="n">${cb.round}</div></div>
      <div class="grid" style="gap:6px;flex:1;min-width:220px">
        <div class="row"><button class="btn pri" data-act="nextTurn">Next turn</button><button class="btn" data-act="nextRound">Next round</button><button class="btn" data-act="prevRound">Undo round</button></div>
        <div class="row"><button class="btn sm" data-act="rollMyInit">Roll my initiative (${sgn(D.init)})</button><button class="btn sm ghost" data-act="endCombat">End encounter</button>${barbLvl && !raging ? '<button class="btn sm gold" data-act="rage">Rage</button>' : ''}</div>
        <p class="hint" style="margin:0">Each new round counts every timed effect down by one round (1 minute = 10 rounds). Effects that reach zero are marked ended so you can renew or clear them.</p>
      </div></div>`);
  const initP = panel('Initiative order', `<div class="list">${initRows || '<div class="empty">Add combatants with their initiative results. The list sorts highest first and highlights whose turn it is.</div>'}</div>
      <div class="pb row" style="border-top:1px solid var(--rule-2)"><input type="text" id="newInitName" placeholder="Name (e.g. Orc #2)" style="flex:2;min-width:140px"><input type="number" id="newInitVal" placeholder="Init" style="width:80px"><button class="btn sm pri" data-act="addInit">Add</button></div>`,
    `<button class="btn sm" data-act="sortInit">Re-sort</button><button class="btn sm ghost" data-act="clearInit">Clear</button>`);
  const effP = panel('Active spells &amp; conditions', `<div class="list">${active.map(effRow).join('') || '<div class="empty">Nothing affecting you right now. Add a condition (shaken, prone, fatigued…), a spell effect, or cast a spell from the <b>Spells</b> tab to track it here.</div>'}</div>
      ${expired.length ? `<div class="splv row" style="justify-content:space-between"><span>Ended</span><button class="btn sm" data-act="clearExpired">Clear ended</button></div><div class="list">${expired.map(effRow).join('')}</div>` : ''}`,
    `<button class="btn sm pri" data-act="addCond">Add condition</button><button class="btn sm" data-act="addSpellEff">Add spell effect</button><button class="btn sm" data-act="addCustomEff">Custom</button>`);
  // compact versions: one line per effect / combatant, no notes or explanations
  const cur = i => i === cb.turn % Math.max(1, order.length) && cb.round > 0;
  const roundC = panel('Round counter', `<div class="pb round-c"><span class="cap">Round</span><b class="n">${cb.round}</b>
      <button class="btn sm pri" data-act="nextTurn">Next turn</button><button class="btn sm" data-act="prevRound">Undo round</button><button class="btn sm" data-act="rollMyInit">Roll my initiative (${sgn(D.init)})</button><button class="btn sm ghost" data-act="endCombat">End encounter</button>${barbLvl && !raging ? '<button class="btn sm gold" data-act="rage">Rage</button>' : ''}</div>`);
  const effRowC = e => { const t = e.kind === 'spell' ? 'spell' : e.kind === 'condition' ? 'cond' : null;
    return `<div class="effc ${e.expired ? 'expired' : ''}"><span class="effc-n">${e.ref ? refA('feature', e.ref, e.n) : t && getRef(t, e.n) ? refA(t, e.n) : `<b>${esc(e.n)}</b>`} <button class="who-btn" data-tgtmenu="${e.id}" title="Who it is on (click to change)">${esc(effWho(e).map(w => targetName(c, w, e)).join(', '))} ▾</button></span><span class="pill ${e.kind === 'condition' ? 'warn' : e.kind === 'spell' ? 'acc' : ''}">${esc(e.kind)}</span>
      ${e.expired ? `<button class="btn sm" data-act="effRenew" data-id="${e.id}">Renew</button>` : e.rounds == null ? '<span class="pill">no countdown</span>' : `<span class="pill good">${fmtRounds(e.rounds)} left</span>`}
      <button class="btn ghost sm" data-act="delEff" data-id="${e.id}" aria-label="Remove effect">✕</button></div>`; };
  const effC = panel('Active spells &amp; conditions', `<div class="list">${active.map(effRowC).join('') || '<div class="empty">Nothing affecting you right now.</div>'}</div>
      ${expired.length ? `<div class="splv row" style="justify-content:space-between"><span>Ended</span><button class="btn sm" data-act="clearExpired">Clear ended</button></div><div class="list">${expired.map(effRowC).join('')}</div>` : ''}`,
    `<button class="btn sm pri" data-act="addCond">Add condition</button><button class="btn sm" data-act="addSpellEff">Add spell effect</button><button class="btn sm" data-act="addCustomEff">Custom</button>`);
  const initC = panel('Initiative order', `<div class="list">${order.map((x, i) => `<div class="initc ${cur(i) ? 'cur' : ''}"><span class="pos">${i + 1}</span><b class="${x.me ? 'me' : ''}">${esc(x.n || 'Unnamed')}</b><span class="rc-init" title="Initiative">${esc(String(x.init ?? ''))}</span>${x.hp ? `<span class="hint">${esc(x.hp)}</span>` : '<span></span>'}${effMenuBtn(c, x)}<button class="btn ghost sm" data-act="delInit" data-id="${x.id}" aria-label="Remove">✕</button>${initEffectPills(c, initTid(x))}</div>`).join('') || '<div class="empty">No one in initiative yet.</div>'}</div>
      <div class="pb row" style="border-top:1px solid var(--rule-2)"><input type="text" id="newInitName" placeholder="Name (e.g. Orc #2)" style="flex:2;min-width:140px"><input type="number" id="newInitVal" placeholder="Init" style="width:80px"><button class="btn sm pri" data-act="addInit">Add</button></div>`,
    `<button class="btn sm ghost" data-act="clearInit">Clear</button>`);
  const list = [
    {id: 'round', full: () => roundP, compact: () => roundC, def: 'full'},
    {id: 'effects', full: () => effP, compact: () => effC, def: 'full'},
    {id: 'init', full: () => initP, compact: () => initC, def: 'full'},
    ...extras];
  return `<div class="grid trk-page" style="gap:14px">${list.map(p => pagePanel(c, 'tracker', p)).join('')}</div>`;
}

// a panel on a page other than the Character sheet that can be shown Full or Compact.
// p = {id, full(), compact(), def}; the choice is saved per character in c.pageLayout[page][id]
function pagePanel(c, page, p){
  const L = ((c.pageLayout = c.pageLayout || {})[page] = c.pageLayout[page] || {});
  const mode = p.compact ? (L[p.id] || p.def || 'full') : 'full';
  const html = mode === 'compact' ? p.compact() : p.full(); if (!html) return '';
  if (!p.compact) return html;
  const seg = `<span class="sp-mode" role="group" aria-label="View">${[['full', 'Full'], ['compact', 'Compact']].map(([v, l]) => `<button class="${mode === v ? 'on' : ''}" data-pg="${page}" data-panel="${p.id}" data-v="${v}" aria-pressed="${mode === v}">${l}</button>`).join('')}</span>`;
  return html.split('<div class="tools">').join('<div class="tools">' + seg);
}
document.addEventListener('change', e => { const t = e.target; if (!t.dataset || !t.dataset.wiz) return; const c = APP_cur(); if (!c) return;
  if (t.dataset.wiz === 'school'){ c.wizSchool = t.value; c.wizBanned = (c.wizBanned || []).filter(x => x && x !== t.value && !(t.value && x === 'Divination')).slice(0, t.value === 'Divination' ? 1 : 2); }
  else { c.wizBanned = c.wizBanned || []; c.wizBanned[+t.dataset.j] = t.value; }
  const n = (c.spells.Wizard || {list: []}).list.filter(s => isProhibited(c, 'Wizard', s) && num(s.prep));
  if (n.length && prepLimitOn(c)){ n.forEach(s => { s.prep = 0; }); toast(`${n.map(s => '<b>' + esc(s.n) + '</b>').join(', ')} ${n.length === 1 ? 'is' : 'are'} now from a prohibited school, so ${n.length === 1 ? 'it was' : 'they were'} unprepared.`, 'warn'); }
  markDirty(); renderAll(); });
document.addEventListener('click', e => { const b = e.target.closest('[data-pg]'); if (!b) return; e.preventDefault(); const c = APP_cur(); if (!c) return;
  const L = ((c.pageLayout = c.pageLayout || {})[b.dataset.pg] = c.pageLayout[b.dataset.pg] || {}); L[b.dataset.panel] = b.dataset.v; markDirty(); renderAll(); });

// ===================== ITEMS TAB =====================
function drawLoad(c, D){
  const L = carry(c, D); const el = $('#loadInfo'); if (!el) return;
  const pc = (a, b, x) => Math.max(0, Math.min(1, (x - a) / (b - a))) * 100;
  if (L.ignored){ el.innerHTML = `<div class="row" style="justify-content:space-between"><span><b class="big" style="font-size:22px">Weight ignored</b></span><span class="pill good">Light load</span></div>
    <p class="hint" style="margin:4px 0 0">Item and coin weight is switched off, so you never take load penalties to Dex, checks or speed. Your gear would weigh ${L.realW} lb. (heavy load over ${L.heavy} lb.). Armor's own penalties still apply.</p>`; return; }
  el.innerHTML = `<div class="row" style="justify-content:space-between"><span><b class="big" style="font-size:26px">${L.w}</b> lb. carried${L.coinW ? ` <span class="hint">(coins ${L.coinW} lb.)</span>` : ''}</span>
    <span class="pill ${{light:'good', medium:'warn', heavy:'bad', over:'bad'}[L.load]}">${{light:'Light load', medium:'Medium load', heavy:'Heavy load', over:'Over capacity'}[L.load]}</span></div>
    <div class="loadbar"><div><i style="width:${pc(0, L.light, L.w)}%"></i></div><div><i style="width:${pc(L.light, L.medium, L.w)}%"></i></div><div><i style="width:${pc(L.medium, L.heavy, L.w)}%"></i></div></div>
    <div class="row hint" style="justify-content:space-between;font-variant-numeric:tabular-nums"><span>Light ≤ ${L.light}</span><span>Medium ≤ ${L.medium}</span><span>Heavy ≤ ${L.heavy} lb.</span></div>
    <p class="hint" style="margin:4px 0 0">Lift overhead ${L.heavy} · lift off ground ${L.heavy * 2} · push/drag ${L.heavy * 5} lb. Based on Str ${D.StrScore}, ${D.size}. ${refA('gloss', 'Load', 'Load penalties')}</p>`;
}
// ---- item types (for sorting and the colour stripe on each item) ----
const ITEM_CATS = {weapon: ['Weapons', '#b23a3a'], armor: ['Armor & shields', '#3f6aa8'], ammo: ['Ammunition', '#8a6d3b'], potion: ['Potions & oils', '#2e8b57'],
  scroll: ['Scrolls', '#c27c0e'], wand: ['Wands, staffs & rods', '#7b4fa0'], magic: ['Rings & wondrous items', '#c2407a'], gear: ['Gear', '#6b7280'], treasure: ['Treasure', '#b8960c']};
const ITEM_SORTS = {type: 'Type', loc: 'Where it is', name: 'Name (A–Z)', weight: 'Weight (heaviest first)', value: 'Value (most valuable first)'};
function itemCat(it){
  const n = String(it.n || '').toLowerCase().trim(), L = it.lib ? libById(it.lib) : null;
  if (L){ if (L.kind === 'weapon') return 'weapon'; if (L.kind === 'armor' || L.kind === 'shield') return 'armor'; if (L.kind === 'ammo') return 'ammo';
    if (/^scroll\b/.test(n)) return 'scroll'; if (/\b(potion|oil|elixir|salve)\b/.test(n)) return 'potion'; if (/\b(wand|staff|rod)\b/.test(n)) return 'wand'; return 'magic'; }
  const cx = IDX.consumables.get(n); if (cx) return cx.k === 'wand' ? 'wand' : 'potion';
  if (/^scroll\b/.test(n)) return 'scroll';
  if (/^(wand|staff|rod)s? of\b/.test(n)) return 'wand'; if (/^(potion|oil|elixir|philter)s? of\b/.test(n)) return 'potion';
  const w = IDX.weapons.get(n); if (w) return w.dM === '—' && /arrow|bolt|bullet/.test(n) ? 'ammo' : 'weapon';
  if (/\b(arrows?|bolts?|sling bullets?)\b/.test(n)) return 'ammo';
  if (IDX.armor.get(n)) return 'armor';
  const m = IDX.magic.get(n); if (m) return m.cat === 'Rod' || m.cat === 'Staff' ? 'wand' : m.cat === 'Specific Armor/Shield' ? 'armor' : m.cat === 'Specific Weapon' ? 'weapon' : 'magic';
  if (typeof MAGIC_WEAPONS !== 'undefined' && MAGIC_WEAPONS[normKey(it.n)]) return 'weapon';
  if (/^(ring|amulet|cloak|boots|gloves|gauntlets|belt|bracers|circlet|headband|helm|robe|vest|periapt|necklace|brooch|goggles|lenses|figurine|bag of|portable hole|ioun|pearl of|rope of|horn of|carpet|crystal ball)\b/.test(n) && /\+\d|of /.test(n)) return 'magic';
  if (/\b(gem|gems|diamond|ruby|rubies|emerald|sapphire|pearl|opal|jade|amethyst|garnet|topaz|jewel|jewelry|jewellery|gold bar|silver bar|ingot|statuette|chalice|goblet|crown|tiara|idol|art object|coins?)\b/.test(n) && !IDX.gear.get(n)) return 'treasure';
  return 'gear';
}
// value in gp (each), from the SRD price or your custom item's cost; '' if unknown
function itemValue(it){
  const n = String(it.n || '').toLowerCase(), L = it.lib ? libById(it.lib) : null;
  const base = n.replace(/\s*\+\d+$/, ''), like = (map, k) => map.get(k) || [...map.values()].find(x => x.n.toLowerCase().startsWith(k + ' (')) || {};
  const raw = (L && L.cost) || it.cost || like(IDX.consumables, n).price || like(IDX.magic, n).price || like(IDX.magic, base).price || ((IDX.weapons.get(n) || {}).cost) || ((IDX.armor.get(n) || {}).cost) || ((IDX.gear.get(n) || {}).cost) || '';
  const m = String(raw).replace(/,/g, '').match(/([\d.]+)\s*(pp|gp|sp|cp)?/i); if (!m) return '';
  return parseFloat(m[1]) * ({pp: 10, gp: 1, sp: .1, cp: .01}[(m[2] || 'gp').toLowerCase()]);
}
function renderItems(c){
  const sort = ITEM_SORTS[c.itemSort] ? c.itemSort : 'type';
  const wt = it => num(it.w) * num(it.qty || 1), lb = v => Math.round(v * 100) / 100;
  const row = it => { const i = c.items.indexOf(it), cat = itemCat(it);
      const has = it.t === 'custom' ? !!libById(it.lib) || !!libByName('item', it.n) : !!getRef('item', it.n);
      return `<div class="it it-cat" style="--cat:${ITEM_CATS[cat][1]}" title="${esc(ITEM_CATS[cat][0])}"><div style="min-width:0"><div class="row" style="flex-wrap:nowrap;gap:6px"><div style="flex:1;min-width:0">${I('items.' + i + '.n', it.n, 'aria-label="Item name" data-rerender="1"')}</div>${has ? refA(it.lib ? 'custom' : 'item', it.lib || it.n, 'ⓘ', it.lib ? 'custom' : '') : ''}</div>
          <div style="margin-top:4px">${I('items.' + i + '.note', it.note, 'placeholder="Notes, charges, who carries it…" style="font-size:13px;padding:3px 6px"')}</div>${itemBonusLine(c, it)}</div>
        <label class="it-f">${N('items.' + i + '.qty', it.qty, 'min="0" aria-label="Quantity" data-rerender="1"')}<span>Qty</span></label>
        <label class="it-f">${N('items.' + i + '.w', it.w, 'min="0" step="0.25" aria-label="Weight each" data-rerender="1"')}<span>Lb. each</span></label>
        <span class="it-f wt-total"><b class="w">${lb(wt(it))} lb.</b><span>Total</span></span>
        <label class="it-f loc">${S('items.' + i + '.loc', it.loc || 'carried', Object.entries(LOCS), 'data-rerender="1" aria-label="Location"')}<span>Where</span></label>
        <button class="btn ghost sm" data-act="delItem" data-id="${it.id}" aria-label="Remove item">✕</button></div>`; };
  const byName = (a, b) => String(a.n || '~').localeCompare(String(b.n || '~'));
  const head = (label, its, note = '', color = '') => `<div class="splv row it-group" style="justify-content:space-between${color ? `;--cat:${color}` : ''}"><span>${color ? '<i class="cat-dot" aria-hidden="true"></i>' : ''}${esc(label)} <span class="it-n">${its.length}</span></span><span>${lb(its.reduce((s, i) => s + wt(i), 0))} lb.${note}</span></div>`;
  let groups = '';
  if (!c.items.length) groups = '';
  else if (sort === 'type') groups = Object.keys(ITEM_CATS).map(k => { const its = c.items.filter(i => itemCat(i) === k).sort(byName); return its.length ? head(ITEM_CATS[k][0], its, '', ITEM_CATS[k][1]) + its.map(row).join('') : ''; }).join('');
  else if (sort === 'loc') groups = Object.keys(LOCS).map(loc => { const its = c.items.filter(i => (i.loc || 'carried') === loc).sort((a, b) => Object.keys(ITEM_CATS).indexOf(itemCat(a)) - Object.keys(ITEM_CATS).indexOf(itemCat(b)) || byName(a, b));
      return its.length ? head(LOCS[loc], its, loc === 'stored' || loc === 'mount' ? ' · not counted' : '') + its.map(row).join('') : ''; }).join('');
  else { const its = [...c.items].sort(sort === 'name' ? byName : sort === 'weight' ? (a, b) => wt(b) - wt(a) || byName(a, b)
      : (a, b) => { const va = itemValue(a), vb = itemValue(b); return (vb === '' ? -1 : vb * num(b.qty || 1)) - (va === '' ? -1 : va * num(a.qty || 1)) || byName(a, b); });
    groups = its.map(it => row(it) + (sort === 'value' ? '' : '')).join(''); }
  const present = Object.keys(ITEM_CATS).filter(k => c.items.some(i => itemCat(i) === k));
  const tools = c.items.length ? `<div class="pb row it-tools"><label class="row" style="gap:6px"><span class="cap">Sort by</span><select data-k="itemSort" data-rerender="1" aria-label="Sort items by">${Object.entries(ITEM_SORTS).map(([v, l]) => `<option value="${v}" ${v === sort ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${sort === 'type' ? '' : `<span class="cat-legend">${present.map(k => `<span style="--cat:${ITEM_CATS[k][1]}"><i class="cat-dot" aria-hidden="true"></i>${esc(ITEM_CATS[k][0])}</span>`).join('')}</span>`}</div>` : '';
  const items = panel('Equipment', `${tools}<div class="list">${groups || '<div class="empty">Your pack is empty. <b>Add item</b> browses SRD weapons, armor, gear and magic items with weights and descriptions; <b>New custom item</b> makes your own.</div>'}</div>`,
    `<button class="btn sm pri" data-act="addItem">Add item</button><button class="btn sm gold" data-act="newCustomItem">New custom item</button>`);
  const coins = panel('Money &amp; load', `<div class="pb grid" style="gap:12px">
      <div class="coins">${['pp','gp','sp','cp'].map(k => F(k.toUpperCase(), N('coins.' + k, c.coins[k], 'min="0" data-rerender="1"'))).join('')}</div>
      <div class="row hint" style="justify-content:space-between"><span>Total value ≈ <b>${(num(c.coins.pp) * 10 + num(c.coins.gp) + num(c.coins.sp) / 10 + num(c.coins.cp) / 100).toLocaleString(undefined, {maximumFractionDigits:2})} gp</b></span>
        <span class="row" style="gap:14px"><label><input type="checkbox" data-k="coinWeight" ${c.coinWeight ? 'checked' : ''} ${c.ignoreWeight ? 'disabled' : ''} data-rerender="1"> Coins have weight (50 per lb.)</label>
        <label><input type="checkbox" data-k="ignoreWeight" ${c.ignoreWeight ? 'checked' : ''} data-rerender="1"> Ignore all weight</label></span></div>
      <div id="loadInfo"></div></div>`);
  return `<div class="grid items-grid">${items}${coins}</div>`;
}

// ===================== NOTES TAB =====================
function renderNotes(c){
  const notes = c.notes;
  const help = APP.notesHelpHidden ? '' : `<div class="notes-help"><b>Linking names:</b> type <code>#</code> in any note, then pick from the list, for example <code>#npc</code> for your NPCs, <code>#loc</code> for locations, <code>#fac</code> factions, <code>#player</code> party members, <code>#rel</code> religions, <code>#item</code> key items or <code>#map</code> maps. You can also type <code>#</code> and the start of a name (<code>#pri</code> → Prior Hesk). Choosing one writes the exact name, so it always links. Names you type out in full still link on their own. Hover a link to see a summary, click it to open the page. Use <kbd>↑</kbd> <kbd>↓</kbd> and <kbd>Enter</kbd> to pick, <kbd>Esc</kbd> to close. <a href="#" data-act="hideNotesHelp" class="hint">Hide</a></div>`;
  return panel('Game notes', `${help}<div class="pb row"><input type="search" id="noteQ" placeholder="Search notes (every word, any order)…" value="${esc(APP.noteQ || '')}" autocomplete="off" style="flex:1;min-width:160px;background:var(--sheet);border:1px solid var(--rule);padding:6px 8px"><span class="hint" id="noteQn" aria-live="polite"></span></div>
    <div class="list" id="noteList">${notes.map(n => { const i = c.notes.indexOf(n); return `<div class="note" id="note-${n.id}" data-note="${n.id}"><div class="note-h">${I('notes.' + i + '.t', n.t, 'class="title" placeholder="Session / topic" aria-label="Note title"')}
      <input type="date" data-k="notes.${i}.date" id="k-notes.${i}.date" value="${esc(n.date)}" aria-label="Date">${c.notes.length > 1 ? `<button class="btn ghost sm" data-merge="note:${n.id}" title="Join another note into this one">Join…</button>` : ''}<button class="btn ghost sm" data-act="delNote" data-id="${n.id}" aria-label="Delete note">Delete</button></div>
      ${LT('notes.' + i + '.body', n.body, 'What happened, NPCs met, clues, loot… (names of your NPCs, locations and factions become links)', 6)}</div>`; }).join('') || `<div class="empty">${'No notes yet. <b>New note</b> starts a page for this session.'}</div>`}</div>`,
    `<button class="btn sm pri" data-act="addNote">New note</button>`);
}

// ===================== QUESTS TAB =====================
function renderQuests(c){
  const order = ['active', 'hold', 'done', 'failed'];
  const qs = [...c.quests].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  const cards = qs.map(q => { const i = c.quests.indexOf(q); const done = q.obj.filter(o => o.done).length, tot = q.obj.length; const pct = tot ? done / tot : (q.status === 'done' ? 1 : 0);
    return `<div class="quest" id="quest-${q.id}"><div class="qh">${I('quests.' + i + '.t', q.t, 'class="title" placeholder="Quest name" aria-label="Quest name"')}
        <div style="width:140px">${S('quests.' + i + '.status', q.status, Object.entries(QSTAT).map(([k, v]) => [k, v[0]]), 'data-rerender="1" aria-label="Status"')}</div>
        <span class="pill ${QSTAT[q.status][1]}">${done}/${tot} objectives</span>${c.quests.length > 1 ? `<button class="btn ghost sm" data-merge="quest:${q.id}" title="Join another quest into this one">Join…</button>` : ''}<button class="btn ghost sm" data-act="delQuest" data-id="${q.id}" aria-label="Delete quest">Delete</button></div>
      <div class="pb grid" style="gap:10px">
        <div class="meter ${q.status === 'failed' ? 'bad' : 'acc'}"><i style="width:${pct * 100}%"></i></div>
        <div class="fields">${F('Quest giver', I('quests.' + i + '.giver', q.giver))}${F('Location', I('quests.' + i + '.where', q.where))}${F('Reward', I('quests.' + i + '.reward', q.reward), 'wide')}</div>
        <div><div class="cap">Objectives</div>${q.obj.map((o, j) => `<div class="obj ${o.done ? 'done' : ''}"><input type="checkbox" data-k="quests.${i}.obj.${j}.done" ${o.done ? 'checked' : ''} data-rerender="1" aria-label="Done">
            ${I('quests.' + i + '.obj.' + j + '.t', o.t, 'placeholder="Objective"')}<button class="btn ghost sm" data-act="delObj" data-q="${q.id}" data-j="${j}" aria-label="Remove objective">✕</button></div>`).join('')}
          <button class="btn sm" style="margin-top:4px" data-act="addObj" data-q="${q.id}">Add objective</button></div>
        ${F('Notes', LT('quests.' + i + '.note', q.note, 'Leads, deadlines, who to talk to…', 3))}</div></div>`; }).join('');
  return `<div class="grid" style="gap:14px"><div class="row" style="justify-content:space-between"><span class="hint">${c.quests.filter(q => q.status === 'active').length} active · ${c.quests.filter(q => q.status === 'done').length} completed</span><button class="btn pri" data-act="addQuest">New quest</button></div>
    ${cards || '<div class="panel"><div class="empty">No quests tracked. <b>New quest</b> adds one with objectives you can tick off as the party progresses.</div></div>'}</div>`;
}

// ===================== LIBRARY TAB =====================
const LIBT = {item:'Items', feat:'Feats', spell:'Spells', ability:'Special abilities', condition:'Conditions'};
function renderLibrary(c){
  const sections = Object.entries(LIBT).map(([t, l]) => { const es = libEntries(t);
    return `<div class="splv row" style="justify-content:space-between"><span>${l} (${es.length})</span><button class="btn sm" data-act="libNew" data-t="${t}">New ${t === 'ability' ? 'ability' : t}</button></div>` +
      (es.map(e => `<div class="li" style="grid-template-columns:minmax(0,1fr) auto"><div>${refA('custom', e.id, e.n, 'custom')}<div class="hint">${esc(String(e.d || '').slice(0, 140))}${String(e.d || '').length > 140 ? '…' : ''}</div></div>
        <div class="row">${t === 'item' ? `<button class="btn sm pri" data-act="libGive" data-id="${e.id}">Add to ${esc(c.name.split(' ')[0] || 'character')}</button>` : ''}${t !== 'ability' && t !== 'item' ? `<button class="btn sm" data-act="libBon" data-id="${e.id}">Bonuses${(e.bon || []).length ? ' (' + e.bon.length + ')' : ''}</button>` : ''}<button class="btn sm" data-act="libEdit" data-id="${e.id}">Edit</button></div></div>`).join('') || `<div class="empty" style="padding:10px">No custom ${l.toLowerCase()} yet.</div>`); }).join('');
  const other = (APP.lib.entries || []).filter(e => libRs(e) !== rsOf(c).id).length;
  return panel('Custom library', `<p class="pb hint" style="margin:0;border-bottom:1px solid var(--rule-2)">Homebrew and campaign-specific entries for <b>${esc(rsOf(c).short)}</b> characters. They're shared by all your ${esc(rsOf(c).short)} characters and appear in every picker next to the official entries, with your description on hover. You can add homebrew at any time.${other ? ` (${other} more entr${other === 1 ? 'y belongs to another ruleset and only shows' : 'ies belong to other rulesets and only show'} for those characters.)` : ''}</p><div class="list">${sections}</div>`);
}
function openLibEditor(id, type, onDone){
  if ((id && (libById(id) || {}).t === 'item') || (!id && (type || 'item') === 'item')) return openItemEditor(id, onDone);
  const e = id ? clone(libById(id)) : {id: uid('L'), rs:rsOf(APP_cur()).id, t:type || 'item', n:'', d:''};
  const t = e.t;
  const extra = t === 'item' ? `<div class="fields">${F('Weight (lb.)', `<input type="number" id="le-w" step="0.25" min="0" value="${esc(e.w ?? '')}">`)}${F('Cost / value', `<input type="text" id="le-cost" value="${esc(e.cost || '')}" placeholder="e.g. 250 gp">`)}</div>`
    : t === 'spell' ? `<div class="fields">${F('Level', `<input type="text" id="le-lvl" value="${esc(e.lvl || '')}" placeholder="e.g. Sor/Wiz 2">`)}${F('School', `<input type="text" id="le-sch" value="${esc(e.sch || '')}">`)}${F('Duration', `<input type="text" id="le-dur" value="${esc(e.dur || '')}" placeholder="e.g. 1 min./level">`)}</div>`
    : t === 'feat' ? F('Prerequisites', `<input type="text" id="le-pre" value="${esc(e.pre || '')}">`) : '';
  const bg = openModal(`<div class="modal narrow" role="dialog"><div class="mh"><h3>${id ? 'Edit' : 'New'} custom ${t === 'ability' ? 'ability' : t}</h3><button class="btn ghost" data-close>Close</button></div>
    <div class="mform">${F('Name', `<input type="text" id="le-n" value="${esc(e.n)}" placeholder="Name">`)}${extra}${F('Description (shown on hover)', `<textarea id="le-d" rows="8">${esc(e.d || '')}</textarea>`)}</div>
    <div class="mfoot"><div class="confirm" id="le-delwrap">${id ? '<button class="btn ghost" id="le-del">Delete</button>' : ''}</div><div class="row"><button class="btn" data-close>Cancel</button><button class="btn pri" id="le-save">Save</button></div></div></div>`);
  $$('[data-close]', bg).forEach(b => b.addEventListener('click', closeModal));
  setTimeout(() => $('#le-n', bg).focus(), 30);
  $('#le-save', bg).addEventListener('click', () => {
    e.n = $('#le-n', bg).value.trim(); if (!e.n){ $('#le-n', bg).focus(); return; }
    e.d = $('#le-d', bg).value;
    if (t === 'item'){ e.w = num($('#le-w', bg).value); e.cost = $('#le-cost', bg).value; }
    if (t === 'spell'){ e.lvl = $('#le-lvl', bg).value; e.sch = $('#le-sch', bg).value; e.dur = $('#le-dur', bg).value; }
    if (t === 'feat'){ e.pre = $('#le-pre', bg).value; }
    const arr = APP.lib.entries; const ix = arr.findIndex(x => x.id === e.id); if (ix >= 0) arr[ix] = e; else arr.push(e);
    markLibDirty(); closeModal(); toast(`Saved <b>${esc(e.n)}</b> to your library`);
    if (onDone) onDone({name:e.n, type:'custom', key:e.id, lib:e}); renderAll();
  });
  const del = $('#le-del', bg); if (del) del.addEventListener('click', () => {
    $('#le-delwrap', bg).innerHTML = `<span class="hint">Delete for all characters?</span><button class="btn" id="le-del2" style="color:var(--bad)">Delete</button>`;
    $('#le-del2', bg).addEventListener('click', () => { APP.lib.entries = APP.lib.entries.filter(x => x.id !== e.id); markLibDirty(); closeModal(); renderAll(); });
  });
}

function itemBonusLine(c, it){
  const bl = itemBonuses(it); const st = bonusStatus(D);
  const btn = itemActions(c, it, bl);
  if (!bl.length) return `<div class="row" style="margin-top:3px;gap:4px">${btn}</div>`;
  const worn = it.loc === 'equipped'; const live = liveBonuses('item', it.id);
  return `<div class="row" style="margin-top:4px;gap:4px"><div class="bchips">${worn ? bonusChips(live, st) : bl.map(b => `<span class="bchip" style="background:transparent;color:var(--ink-2)">${esc(bonusText(b))}</span>`).join('')}</div>
    ${worn ? '' : '<span class="hint">Set to “Worn / wielded” for this to apply</span>'}${btn}</div>`;
}
function effectBonusLine(c, e){
  const live = e.expired ? [] : liveBonuses('effect', e.id); const note = effectNote(c, e); const st = bonusStatus(D);
  return `<div class="row" style="margin-top:6px;gap:4px">${live.length ? `<div class="bchips">${bonusChips(live, st)}</div>` : ''}
    <button class="btn ghost sm" data-act="effBon" data-id="${e.id}" style="padding:0 4px">${live.length || Array.isArray(e.bon) ? 'Edit bonuses' : '+ Bonus'}</button></div>${note ? `<div class="hint" style="margin-top:3px">${esc(note)}</div>` : ''}`;
}

function itemActions(c, it, bl){
  const L = it.lib ? libById(it.lib) : null; const out = [];
  if (it.t === 'consumable'){ const x = IDX.consumables.get(it.n.toLowerCase());
    if (x && x.k === 'wand') return `<span class="row" style="gap:4px"><span class="cap">Charges</span><input type="number" min="0" style="width:64px" data-k="items.${c.items.indexOf(it)}.charges" data-num="1" id="k-wc-${it.id}" value="${num(it.charges ?? x.charges)}"></span><button class="btn sm pri" data-act="castItem" data-id="${it.id}" data-i="0">Use</button>`;
    if (x) return `<button class="btn sm pri" data-act="drink" data-id="${it.id}">${x.k === 'oil' ? 'Apply' : 'Drink'}</button>${healRoll(x.sp, x.cl) ? '<span class="hint">roll or enter your own</span>' : ''}`; }
  const isW = L ? L.kind === 'weapon' : (it.t === 'weapon' && IDX.weapons.get(it.n.toLowerCase()) && IDX.weapons.get(it.n.toLowerCase()).dM !== '—') || !!MAGIC_WEAPONS[normKey(it.n)];
  const armK = L ? (L.kind === 'armor' || L.kind === 'shield' ? L.kind : '') : it.t === 'armor' && IDX.armor.get(it.n.toLowerCase()) ? (/shield|buckler/i.test(it.n) ? 'shield' : (/spikes|gauntlet/i.test(it.n) ? '' : 'armor')) : '';
  if (isW && !c.attacks.some(a => (L && a.lib === L.id) || a.n === it.n)) out.push(`<button class="btn sm" data-act="wield" data-id="${it.id}">Wield</button>`);
  const sk = itemSlotKind(it);
  if (it.slot) out.push(`<span class="pill good">${esc(SLOT_LABEL[it.slot])}</span>`);
  else if (sk) out.push(`<button class="btn sm" data-act="wear" data-id="${it.id}">Equip (${esc(sk === 'ring' ? 'Ring' : SLOT_LABEL[sk])})</button>`);
  if (L) out.push(`<button class="btn ghost sm" data-act="editItem" data-id="${L.id}" style="padding:0 4px">Edit item</button>`);
  else { out.push(`<button class="btn ghost sm" data-act="itemBon" data-id="${it.id}" style="padding:0 4px">${bl.length ? 'Edit bonuses' : '+ Bonus'}</button>`);
    out.push(`<button class="btn ghost sm" data-act="customize" data-id="${it.id}" style="padding:0 4px" title="Make an editable copy with abilities, spells and bonuses">Customize</button>`); }
  return out.join('');
}

// ---- Game notes search: filters the notes in place (typing never loses focus), every word in any order,
// across title, date and text, with matches highlighted
function noteSearch(){
  const c = APP_cur(), box = document.getElementById('noteList'); if (!c || !box) return;
  const words = (APP.noteQ || '').toLowerCase().split(/\s+/).filter(Boolean); let shown = 0;
  for (const el of box.querySelectorAll('.note[data-note]')){
    const n = c.notes.find(x => x.id === el.dataset.note); if (!n) continue;
    const hay = [n.t, n.date, n.body].join(' ').toLowerCase(), ok = words.every(w => hay.includes(w));
    el.hidden = !ok; if (ok) shown++;
    const v = el.querySelector('.lt-view'); if (v){ v.querySelectorAll('mark.nq').forEach(m => m.replaceWith(...m.childNodes)); v.normalize(); if (ok && words.length) markWords(v, words); }
  }
  let none = box.querySelector('.nq-none'); if (words.length && !shown && c.notes.length){ if (!none){ none = document.createElement('div'); none.className = 'empty nq-none'; none.textContent = 'No notes match that search.'; box.appendChild(none); } } else if (none) none.remove();
  const cnt = document.getElementById('noteQn'); if (cnt) cnt.textContent = words.length ? `${shown} of ${c.notes.length}` : '';
}
function markWords(root, words){
  const re = new RegExp('(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = []; while (walk.nextNode()) nodes.push(walk.currentNode);
  for (const t of nodes){ if (!re.test(t.nodeValue)) continue; re.lastIndex = 0; const f = document.createDocumentFragment(); let last = 0;
    t.nodeValue.replace(re, (m, g, i) => { f.append(t.nodeValue.slice(last, i)); const mk = document.createElement('mark'); mk.className = 'nq'; mk.textContent = m; f.append(mk); last = i + m.length; return m; });
    f.append(t.nodeValue.slice(last)); t.replaceWith(f); }
}
