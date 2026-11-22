// ===================== NAMES ACROSS YOUR NOTES =====================
// 1. "Mentioned in": every NPC, player, location, faction, religion and map lists the notes, quests and
//    other cards that name it, with a link that jumps straight there.
// 2. Renaming: change a name and every place it was written (and so linked) changes with it.

// every piece of free text where names become links: [label, text, jump target, setter]
function linkedTexts(c){
  const out = [];
  const push = (where, text, jump, set, extra = {}) => { if (text && String(text).trim()) out.push({where, text: String(text), jump, set, ...extra}); };
  (c.notes || []).forEach(n => {
    push(`Game notes · ${n.t || 'Untitled note'}${n.date ? ' (' + n.date + ')' : ''}`, n.body, {tab: 'notes', el: 'note-' + n.id}, v => { n.body = v; }, {src: 'notes', id: n.id});
    push(`Game notes · title`, n.t, {tab: 'notes', el: 'note-' + n.id}, v => { n.t = v; }, {src: 'notes', id: n.id, title: true});
  });
  (c.quests || []).forEach(q => {
    const lbl = `Quest · ${q.t || 'Untitled quest'}`, j = {tab: 'quests', el: 'quest-' + q.id};
    push(lbl, q.note, j, v => { q.note = v; }); push(lbl + ' · quest giver', q.giver, j, v => { q.giver = v; }); push(lbl + ' · location', q.where, j, v => { q.where = v; });
    push(lbl + ' · reward', q.reward, j, v => { q.reward = v; }); (q.obj || []).forEach(o => push(lbl + ' · objective', o.t, j, v => { o.t = v; }));
  });
  for (const kind of ['pc', 'npc', 'loc', 'fac', 'rel', 'key']) for (const x of wArr(c, kind)){
    const lbl = `${WK[kind].plural.replace(/s$/, '')} · ${x.n || 'Unnamed'}`, j = {world: kind + ':' + x.id};
    for (const [f, nm] of [['desc', 'description'], ['powers', 'powers'], ['opinion', 'your opinion'], ['goals', 'goals'], ['allies', 'allied faiths'], ['rivals', 'rival faiths'], ['attacks', 'attacks'], ['special', 'special abilities']])
      push(`${lbl} · ${nm}`, x[f], j, v => { x[f] = v; }, {self: kind + ':' + x.id});
    (x.log || []).forEach(l => push(`${lbl} · what you've learned${l.date ? ' (' + l.date + ')' : ''}`, l.text, j, v => { l.text = v; }, {self: kind + ':' + x.id}));
  }
  (c.companions || []).forEach(x => push(`Companion · ${x.n || 'Unnamed'} · notes`, x.notes, {tab: 'companions'}, v => { x.notes = v; }));
  return out;
}
// how a name is matched in text: whole words, any case; "The Black Hand" also matches "Black Hand"
function nameKey(kind, n){ n = String(n || '').trim(); if (kind === 'loc' || kind === 'fac' || kind === 'rel' || kind === 'key' || kind === 'map') n = n.replace(/^the\s+/i, ''); return n; }
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nameRe = n => new RegExp('(^|[^\\p{L}\\p{N}])(' + reEsc(n) + ')(?![\\p{L}\\p{N}])', 'giu');

function mentionsOf(c, kind, x){
  const n = nameKey(kind, x.n); if (n.length < 3) return [];
  const me = kind + ':' + x.id, out = [];
  for (const t of linkedTexts(c)){
    if (t.self === me) continue; const re = nameRe(n); const m = re.exec(t.text); if (!m) continue;
    const at = m.index + m[1].length, from = Math.max(0, at - 60), to = Math.min(t.text.length, at + m[2].length + 80);
    const snip = (from ? '…' : '') + esc(t.text.slice(from, at)) + '<b>' + esc(m[2]) + '</b>' + esc(t.text.slice(at + m[2].length, to)) + (to < t.text.length ? '…' : '');
    const count = (t.text.match(nameRe(n)) || []).length;
    out.push({where: t.where, snip: snip.replace(/\n/g, ' '), jump: t.jump, count});
  }
  return out;
}
function mentionsBlock(c, kind, x){
  const list = mentionsOf(c, kind, x); const n = (x.n || '').trim();
  const body = list.length ? `<div class="mentions">${list.map(m => `<a href="#" class="mention-row" data-mjump='${esc(JSON.stringify(m.jump))}'>
      <span class="mention-where">${esc(m.where)}${m.count > 1 ? ` <span class="pill">${m.count}×</span>` : ''}</span><span class="mention-snip">${m.snip}</span></a>`).join('')}</div>`
    : `<p class="hint" style="margin:4px 0 0">${n.length < 3 ? 'Give it a name (3 letters or more) to find where it\'s mentioned.' : `No mentions yet. Write “${esc(n)}” in a note, quest or another card (or type # to pick it) and it shows up here.`}</p>`;
  return `<div class="w-sec"><div class="cap">Mentioned in${list.length ? ` <span class="pill acc">${list.length}</span>` : ''}</div>${body}</div>`;
}
// jump to where a name was mentioned
function goMention(j){
  closeModal(); hideTip();
  if (j.world){ const [kind, id] = j.world.split(':'); APP[WK[kind].sel] = id; APP.tab = WK[kind].tab; APP[WK[kind].q] = ''; renderAll(); window.scrollTo({top: 0}); return; }
  APP.tab = j.tab; if (j.tab === 'notes') APP.noteQ = ''; APP.jumpEl = j.el || null; renderAll(); if (!j.el) window.scrollTo({top: 0});
}
afterRenderHooks.push(() => {
  const id = APP.jumpEl; if (!id) return; APP.jumpEl = null; const el = document.getElementById(id); if (!el) return;
  setTimeout(() => { el.scrollIntoView({block: 'center', behavior: 'smooth'}); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }, 30);
});
document.addEventListener('click', e => { const a = e.target.closest('[data-mjump]'); if (!a) return; e.preventDefault(); try { goMention(JSON.parse(a.dataset.mjump)); } catch {} });

// replace a name with another in every linked text; returns {changed, places}. Where the new name already
// contains the old one ("Hesk" → "Prior Hesk"), existing "Prior Hesk" isn't turned into "Prior Prior Hesk".
function renameInTexts(c, n0, n1, skipSelf){
  let changed = 0, places = 0; const guard = n1.toLowerCase().includes(n0.toLowerCase());
  for (const t of linkedTexts(c)){
    if (skipSelf && t.self === skipSelf) continue;
    if (!nameRe(n0).test(t.text)) continue; let k = 0, v = t.text; const keep = [];
    if (guard) v = v.replace(nameRe(n1), (m, pre, nm) => { keep.push(nm); return pre + '\uE000'; });
    v = v.replace(nameRe(n0), (m, pre) => { k++; return pre + n1; });
    if (guard) v = v.replace(/\uE000/g, () => keep.shift());
    if (k){ t.set(v); changed += k; places++; }
  }
  return {changed, places};
}
// ---------- renaming changes the name everywhere it was written ----------
// remembers the name when you start editing, and on leaving the box rewrites old → new in all linked text
const RENAME_FIELDS = {pc: 'players', npc: 'npcs', loc: 'locations', fac: 'factions', rel: 'religions', key: 'keyItems'};
function renameTarget(el){
  const k = el.dataset && el.dataset.k; if (!k) return null; let m = k.match(/^(players|npcs|locations|factions|religions|keyItems)\.(\d+)\.n$/);
  if (m){ const kind = Object.keys(RENAME_FIELDS).find(x => RENAME_FIELDS[x] === m[1]); const x = (APP_cur()[m[1]] || [])[+m[2]]; return x ? {kind, x} : null; }
  m = k.match(/^maps\.(\d+)\.n$/); if (m){ const x = (APP_cur().maps || [])[+m[1]]; return x ? {kind: 'map', x} : null; }
  return null;
}
document.addEventListener('focusin', e => { const t = renameTarget(e.target); if (t) e.target._oldName = t.x.n || ''; });
document.addEventListener('change', e => {
  const el = e.target, t = renameTarget(el); if (!t || el._oldName === undefined) return;
  const oldN = el._oldName, newN = (t.x.n || '').trim(); el._oldName = newN;
  const n0 = nameKey(t.kind, oldN), n1 = nameKey(t.kind, newN); if (n0.length < 3 || !n1 || n0.toLowerCase() === n1.toLowerCase()) return;
  const c = APP_cur(); const {changed, places} = renameInTexts(c, n0, n1);
  if (changed){ markDirty(); renderAll(); toast(`Renamed “${esc(oldN)}” to “${esc(newN)}” in ${changed} place${changed === 1 ? '' : 's'} across ${places} note${places === 1 ? '' : 's'} and cards.`); }
});
