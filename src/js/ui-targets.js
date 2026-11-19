// ===================== WHO EACH SPELL OR CONDITION IS ON =====================
// An effect can be on your character ('self') and/or on anyone in the initiative order (by entry id).
// e.who = ['self', 'i_abc', …]; missing means just you. e.whoN remembers names, so an effect still reads
// sensibly after someone leaves the initiative order. Only effects on you change your sheet's numbers;
// the rest are tracked (countdown, notes) for the table.
// Each cast is its own effect, so haste on two allies cast in different rounds counts down separately.

const effWho = e => Array.isArray(e.who) && e.who.length ? e.who : ['self'];
const effOnSelf = e => effWho(e).includes('self');
// the initiative entry's target id ('self' for your own entry)
const initTid = x => x.me ? 'self' : x.id;
function targetName(c, id, e){
  if (id === 'self') return c.name || 'You';
  const x = ((c.combat || {}).list || []).find(v => v.id === id); if (x) return x.n || 'Unnamed';
  const n = e && e.whoN && e.whoN[id]; return n ? n + ' (left combat)' : 'Someone';
}
function effectsOn(c, tid){ return c.effects.filter(e => !e.expired && effWho(e).includes(tid)); }
function setTarget(c, e, tid, on){
  let w = [...effWho(e)]; const had = w.includes(tid);
  if (on && !had) w.push(tid); if (!on && had) w = w.filter(t => t !== tid);
  if (!w.length){ toast(`<b>${esc(e.n)}</b> must be on someone. Remove the effect with ✕ instead.`, 'warn'); return false; }
  e.who = w; e.whoN = e.whoN || {}; if (tid !== 'self') e.whoN[tid] = targetName(c, tid);
  return true;
}
// short "who" chips for an effect row
function whoChips(c, e){
  return effWho(e).map(t => `<span class="who-chip ${t === 'self' ? 'self' : ''}">${esc(targetName(c, t, e))}</span>`).join('');
}
// little pills on an initiative row: what is on this combatant right now
function initEffectPills(c, tid){
  const list = effectsOn(c, tid); if (!list.length) return '';
  return `<div class="init-effs">${list.map(e => `<span class="eff-pill ${e.kind === 'condition' ? 'cond' : e.kind === 'spell' ? 'spell' : ''}" title="${esc(e.note || e.n)}">${esc(e.n)}${e.rounds != null ? ` <small>${esc(fmtRounds(e.rounds))}</small>` : ''}</span>`).join('')}</div>`;
}

// the button on each initiative row that opens its spells & conditions menu
function effMenuBtn(c, x){ const n = effectsOn(c, initTid(x)).length;
  return `<button class="btn sm eff-btn ${n ? 'has' : ''}" data-effmenu="${initTid(x)}" aria-haspopup="dialog" title="Spells and conditions on ${esc(x.n || 'them')}">${n ? `${n} effect${n === 1 ? '' : 's'}` : 'Effects'} ▾</button>`; }

// ---- the drop-down menus (one open at a time; reopened after the page redraws) ----
APP.pop = null; // {kind:'init'|'eff', id}
function popClose(){ APP.pop = null; const p = document.getElementById('popMenu'); if (p) p.remove(); }
function popOpen(kind, id){
  const c = APP_cur(); if (!c) return; const anchor = document.querySelector(kind === 'init' ? `[data-effmenu="${id}"]` : `[data-tgtmenu="${id}"]`); if (!anchor){ popClose(); return; }
  APP.pop = {kind, id}; let box = document.getElementById('popMenu');
  if (!box){ box = document.createElement('div'); box.id = 'popMenu'; box.className = 'pop-menu'; box.setAttribute('role', 'dialog'); document.body.appendChild(box); }
  const active = c.effects.filter(e => !e.expired);
  if (kind === 'init'){
    const name = targetName(c, id);
    box.innerHTML = `<div class="pm-h">Spells &amp; conditions on <b>${esc(name)}</b></div>
      ${active.length ? `<div class="pm-list">${active.map(e => `<label class="pm-row"><input type="checkbox" data-poptgt="${e.id}" data-tid="${id}" ${effWho(e).includes(id) ? 'checked' : ''}><span>${esc(e.n)} <span class="hint">${e.rounds != null ? esc(fmtRounds(e.rounds)) + ' left' : e.kind}${effWho(e).filter(t => t !== id).length ? ' · also on ' + esc(effWho(e).filter(t => t !== id).map(t => targetName(c, t, e)).join(', ')) : ''}</span></span></label>`).join('')}</div>` : '<p class="hint" style="margin:6px 10px">Nothing active yet.</p>'}
      <div class="pm-foot"><button class="btn sm pri" data-act="addCond" data-tid="${id}">Add condition</button><button class="btn sm" data-act="addSpellEff" data-tid="${id}">Add spell</button></div>`;
  } else {
    const e = c.effects.find(x => x.id === id); if (!e){ popClose(); return; }
    const people = [{tid: 'self', n: c.name || 'You'}, ...((c.combat || {}).list || []).filter(x => !x.me).map(x => ({tid: x.id, n: x.n || 'Unnamed'}))];
    const gone = effWho(e).filter(t => t !== 'self' && !people.some(p => p.tid === t)).map(t => ({tid: t, n: targetName(c, t, e)}));
    box.innerHTML = `<div class="pm-h"><b>${esc(e.n)}</b> is on…</div><div class="pm-list">${[...people, ...gone].map(p => `<label class="pm-row"><input type="checkbox" data-poptgt="${e.id}" data-tid="${p.tid}" ${effWho(e).includes(p.tid) ? 'checked' : ''}><span>${esc(p.n)}${p.tid === 'self' ? ' <span class="hint">(changes your sheet)</span>' : ''}</span></label>`).join('')}</div>
      <p class="hint" style="margin:4px 10px 8px">Cast it again on someone else in a later round? Add it again from their row in the initiative order, so each one counts down on its own.</p>`;
  }
  const r = anchor.getBoundingClientRect(); box.style.minWidth = Math.max(220, r.width) + 'px';
  const w = box.offsetWidth, h = box.offsetHeight;
  box.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
  box.style.top = (r.bottom + h + 8 > innerHeight && r.top - h - 4 > 8 ? r.top - h - 4 : r.bottom + 4) + 'px';
}
function popReopen(){ if (APP.pop) popOpen(APP.pop.kind, APP.pop.id); }
document.addEventListener('click', e => {
  const m = e.target.closest('[data-effmenu],[data-tgtmenu]');
  if (m){ e.preventDefault(); const kind = m.dataset.effmenu ? 'init' : 'eff', id = m.dataset.effmenu || m.dataset.tgtmenu;
    if (APP.pop && APP.pop.kind === kind && APP.pop.id === id) popClose(); else popOpen(kind, id); return; }
  const box = document.getElementById('popMenu');
  if (box && !box.contains(e.target)) popClose();
  else if (box && e.target.closest('[data-act]')) setTimeout(popClose, 0);
});
document.addEventListener('change', e => { const t = e.target; if (!t.dataset || !t.dataset.poptgt) return; const c = APP_cur(); if (!c) return;
  const ef = c.effects.find(x => x.id === t.dataset.poptgt); if (!ef) return;
  if (!setTarget(c, ef, t.dataset.tid, t.checked)){ t.checked = true; return; }
  const keep = APP.pop; markDirty(); renderAll(); APP.pop = keep; popReopen(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && APP.pop){ popClose(); } });
window.addEventListener('scroll', () => { if (APP.pop) popReopen(); }, true);

// ---- typing a name to add to initiative: suggest you, your companions, players and NPCs ----
APP.initPick = null;
function initSuggestions(c, q){
  q = q.trim().toLowerCase(); const inList = (pred) => ((c.combat || {}).list || []).some(pred);
  const out = [];
  if (!inList(x => x.me)) out.push({kind: 'self', n: c.name || 'You', sub: 'Your character', mod: num(D.init), hp: `${num(c.hp.cur)}/${num(D.hpMax)}`});
  (c.companions || []).forEach(x => { if (compInitEntry(c, x)) return; const s = compStats(c, x), V = compNums(s, x);
    out.push({kind: 'comp', id: x.id, n: compTitle(x), sub: COMP_KIND[x.kind] || 'Companion', mod: num(V.init), hp: V.hpMax === '' ? '' : `${x.hp ?? V.hpMax}/${V.hpMax}`}); });
  for (const [k, label] of [['pc', 'Player'], ['npc', 'NPC']]) (wArr(c, k) || []).forEach(x => { if (!(x.n || '').trim() || inList(e => e[k] === x.id)) return;
    const st = x.stats || {}; out.push({kind: k, id: x.id, n: x.n.trim(), sub: [label, k === 'pc' ? [x.race, x.cls].filter(Boolean).join(' ') : x.role].filter(Boolean).join(' · '), mod: numOr(st.init, 0), hp: st.hp || ''}); });
  return out.filter(o => !q || o.n.toLowerCase().includes(q)).sort((a, b) => (a.n.toLowerCase().startsWith(q) ? 0 : 1) - (b.n.toLowerCase().startsWith(q) ? 0 : 1)).slice(0, 12);
}
let IS = null; // {items, sel}
function isClose(){ IS = null; const b = document.getElementById('initSug'); if (b) b.remove(); }
function isRender(input){
  let box = document.getElementById('initSug'); if (!IS || !IS.items.length){ if (box) box.remove(); return; }
  if (!box){ box = document.createElement('div'); box.id = 'initSug'; box.className = 'mention'; box.setAttribute('role', 'listbox'); document.body.appendChild(box); }
  box.innerHTML = `<div class="mh2">Add to initiative</div>` + IS.items.map((o, i) => `<div class="mo ${i === IS.sel ? 'act' : ''}" role="option" data-isi="${i}"><span class="pin-dot pin-${o.kind === 'npc' ? 'npc' : o.kind === 'pc' ? 'pc' : 'map'}">${esc(o.n.slice(0, 1).toUpperCase())}</span><span>${esc(o.n)}</span><span class="s">${esc(o.sub)}${o.mod ? ' · init ' + sgn(o.mod) : ''}</span></div>`).join('')
    + `<div class="mfoot2">↑ ↓ to move · Enter to pick · or keep typing a new name</div>`;
  const r = input.getBoundingClientRect(); box.style.left = r.left + 'px'; box.style.minWidth = r.width + 'px';
  const h = box.offsetHeight; box.style.top = (r.bottom + h + 8 > innerHeight && r.top - h > 8 ? r.top - h - 4 : r.bottom + 4) + 'px';
}
function isPick(i){
  const o = IS && IS.items[i]; const inp = document.getElementById('newInitName'); if (!o || !inp) return;
  APP.initPick = o; inp.value = o.n; isClose(); const v = document.getElementById('newInitVal');
  if (v){ v.placeholder = `Init (${sgn(o.mod)})`; v.title = 'Type their roll, or leave it empty and Add rolls d20 ' + sgn(o.mod); v.focus(); }
}
document.addEventListener('input', e => { if (e.target.id !== 'newInitName') return; const c = APP_cur(); if (!c) return;
  if (APP.initPick && APP.initPick.n !== e.target.value){ APP.initPick = null; const v = document.getElementById('newInitVal'); if (v) v.placeholder = 'Init'; }
  const items = initSuggestions(c, e.target.value); IS = items.length && e.target.value.trim() ? {items, sel: 0} : null; isRender(e.target); });
document.addEventListener('focusin', e => { if (e.target.id !== 'newInitName') return; const c = APP_cur(); if (!c || e.target.value.trim()) return; const items = initSuggestions(c, ''); IS = items.length ? {items, sel: -1} : null; isRender(e.target); });
document.addEventListener('keydown', e => { if (!IS || e.target.id !== 'newInitName') return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); IS.sel = (IS.sel + (e.key === 'ArrowDown' ? 1 : IS.items.length - 1) + IS.items.length) % IS.items.length; isRender(e.target); }
  else if (e.key === 'Enter' && IS.sel >= 0){ e.preventDefault(); e.stopPropagation(); isPick(IS.sel); }
  else if (e.key === 'Escape'){ e.preventDefault(); isClose(); } }, true);
document.addEventListener('mousedown', e => { const o = e.target.closest && e.target.closest('#initSug [data-isi]'); if (o){ e.preventDefault(); isPick(+o.dataset.isi); } });
document.addEventListener('focusout', e => { if (e.target.id === 'newInitName') setTimeout(() => { if (document.activeElement && document.activeElement.id !== 'newInitName') isClose(); }, 0); });
// the entry Add puts in the initiative order
function initEntryFromPick(c, name, initVal){
  const o = APP.initPick && APP.initPick.n === name ? APP.initPick : null; APP.initPick = null;
  const e = {id: uid('i'), n: name, init: initVal === '' ? '' : num(initVal), hp: ''};
  if (!o) return e;
  e.mod = o.mod; e.hp = o.hp; if (o.kind === 'self') e.me = true; if (o.kind === 'comp') e.comp = o.id; if (o.kind === 'npc') e.npc = o.id; if (o.kind === 'pc') e.pc = o.id;
  if (initVal === ''){ const r = rollD(20); e.init = r + num(o.mod); toast(`<b>${esc(name)}</b> rolls initiative <b>${e.init}</b> <span style="opacity:.75">d20 ${r} ${sgn(num(o.mod))}</span>`); }
  return e;
}
