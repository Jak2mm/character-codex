// ===================== MERGING DOUBLE-UPS =====================
// Two cards for the same NPC (a misspelling, a nickname, a name learned later), two notes for one session or
// two quests for the same job can be joined into one. Nothing is lost: text is combined, empty details are
// filled in, logs and objectives are joined, links, map pins and initiative entries move to the kept card, and
// the old name is changed to the kept one everywhere it was written. Undo is offered straight after.

// how alike two names are (0–1): ignores case, "the", punctuation and spaces
function nameSim(a, b){
  const n = s => String(s || '').toLowerCase().replace(/^the\s+/, '').replace(/[^\p{L}\p{N}]+/gu, '');
  a = n(a); b = n(b); if (!a || !b) return 0; if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return .85;
  const d = Array.from({length: a.length + 1}, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[a.length][b.length] / Math.max(a.length, b.length);
}
const LIKELY = .72; // names this alike are suggested as double-ups
function likelyDupes(c, kind, x){ return wArr(c, kind).filter(v => v.id !== x.id && (v.n || '').trim() && nameSim(v.n, x.n) >= LIKELY); }

// combine two pieces of text without losing either
function joinText(keep, add, from){
  keep = String(keep || '').trim(); add = String(add || '').trim();
  if (!add || keep.toLowerCase() === add.toLowerCase() || keep.toLowerCase().includes(add.toLowerCase())) return keep;
  if (!keep) return add; return `${keep}\n\n(from ${from}) ${add}`;
}
function mergeSnapshot(c, what){ APP.mergeUndo = {id: c.id, snap: JSON.stringify(c), what}; }
function mergeDone(c, msg){ markDirty(); renderAll(); toast(`${msg} <a href="#" data-mergeundo="1">Undo</a>`); }
document.addEventListener('click', e => { if (!e.target.closest('[data-mergeundo]')) return; e.preventDefault(); const u = APP.mergeUndo; if (!u || !APP.chars[u.id]) return;
  APP.chars[u.id] = migrate(JSON.parse(u.snap)); APP.mergeUndo = null; markDirty(u.id); renderAll(); toast(`Undid the merge of ${esc(u.what)}.`); });

// ---------- NPCs, players, locations, factions, religions ----------
const SHORT_FIELDS = ['role', 'race', 'cls', 'align', 'attitude', 'status', 'loc', 'fac', 'rel', 'player', 'trust', 'deity', 'type', 'region', 'parent', 'leader', 'hq', 'title', 'domains', 'portfolio', 'symbol', 'weapon', 'worshippers', 'holder', 'quest'];
const LONG_FIELDS = ['desc', 'powers', 'opinion', 'goals', 'allies', 'rivals', 'attacks', 'special'];
function mergeWorld(c, kind, keepId, goneId, keepName){
  const arr = wArr(c, kind), keep = arr.find(v => v.id === keepId), gone = arr.find(v => v.id === goneId); if (!keep || !gone || keep === gone) return;
  mergeSnapshot(c, `${gone.n || 'Unnamed'} into ${keep.n || 'Unnamed'}`);
  const oldNames = [keep.n, gone.n].filter(Boolean), from = gone.n || 'the other card';
  for (const f of SHORT_FIELDS) if ((keep[f] === '' || keep[f] == null) && gone[f] != null && gone[f] !== '') keep[f] = gone[f];
  for (const f of LONG_FIELDS) if (gone[f]) keep[f] = joinText(keep[f], gone[f], from);
  if (gone.stats){ keep.stats = keep.stats || {}; for (const [k, v] of Object.entries(gone.stats)) if (v !== '' && v != null && (keep.stats[k] === '' || keep.stats[k] == null)) keep.stats[k] = v; }
  keep.log = [...(keep.log || []), ...(gone.log || [])].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  if (!keep.img && gone.img){ keep.img = gone.img; if (gone.crop) keep.crop = gone.crop; }
  if (gone.temples) keep.temples = [...new Set([...(keep.temples || []), ...gone.temples])];
  keep.n = (keepName || keep.n || gone.n || '').trim();
  // move every link from the old card to the kept one
  const re = (o, f) => { if (o && o[f] === goneId) o[f] = keepId; };
  for (const n of c.npcs || []){ if (kind === 'loc') re(n, 'loc'); if (kind === 'fac') re(n, 'fac'); if (kind === 'rel') re(n, 'rel'); }
  for (const f of c.factions || []){ if (kind === 'npc') re(f, 'leader'); if (kind === 'loc') re(f, 'hq'); if (kind === 'rel') re(f, 'rel'); }
  if (kind === 'loc'){ for (const l of c.locations || []) re(l, 'parent'); for (const r of c.religions || []) r.temples = [...new Set((r.temples || []).map(id => id === goneId ? keepId : id))]; if (keep.parent === keepId) keep.parent = ''; }
  for (const m of c.maps || []){ const seen = new Set(); m.pins = (m.pins || []).filter(p => { if (p.kind === kind && p.ref === goneId) p.ref = keepId; const k = p.kind + ':' + p.ref; if (seen.has(k)) return false; seen.add(k); return true; }); }
  for (const k of c.keyItems || []){ if (k.holder === kind + ':' + goneId) k.holder = kind + ':' + keepId; if (kind === 'loc') re(k, 'loc'); }
  for (const e of (c.combat && c.combat.list) || []){ if (kind === 'npc') re(e, 'npc'); if (kind === 'pc') re(e, 'pc'); }
  c[WK[kind].arr] = arr.filter(v => v.id !== goneId);
  // names written in notes and cards: the dropped name becomes the kept one
  let changed = 0; const n1 = nameKey(kind, keep.n);
  for (const old of oldNames){ const n0 = nameKey(kind, old); if (n0.length < 3 || n0.toLowerCase() === n1.toLowerCase()) continue;
    changed += renameInTexts(c, n0, n1, kind + ':' + keepId).changed; }
  APP[WK[kind].sel] = keepId;
  mergeDone(c, `Merged <b>${esc(from)}</b> into <b>${esc(keep.n || 'Unnamed')}</b>${changed ? `; ${changed} mention${changed === 1 ? '' : 's'} renamed` : ''}.`);
}
function openMergeWorld(kind, id){
  const c = APP_cur(), x = wArr(c, kind).find(v => v.id === id); if (!x) return;
  const others = wArr(c, kind).filter(v => v.id !== id).map(v => ({v, s: nameSim(v.n, x.n)})).sort((a, b) => b.s - a.s || (a.v.n || '').localeCompare(b.v.n || ''));
  if (!others.length){ toast(`There's no other ${WK[kind].label} to merge with.`); return; }
  const lbl = WK[kind].label;
  const bg = openModal(`<div class="modal narrow" role="dialog" aria-label="Merge"><div class="mh"><h3>Merge ${esc(x.n || 'Unnamed')}</h3><button class="btn ghost" data-close>Cancel</button></div>
    <div class="mform"><p class="hint" style="margin:0">Use this when two cards are the same ${esc(lbl)}, for example a misspelling or a name you learned later. Everything is kept: descriptions and notes are combined, missing details filled in, logs joined, and links, map pins and mentions moved to the card you keep.</p>
      <label class="fld"><span class="cap">The other ${esc(lbl)}</span><select id="mg-other">${others.map(({v, s}) => `<option value="${v.id}">${esc(v.n || 'Unnamed')}${s >= LIKELY ? ' (looks like a double-up)' : ''}</option>`).join('')}</select></label>
      <div><span class="cap">Name to keep</span><div class="mg-names" id="mg-names"></div></div></div>
    <div class="mfoot"><span class="hint">You can undo straight after.</span><button class="btn pri" id="mg-go">Merge</button></div></div>`);
  $$('[data-close]', bg).forEach(b => b.addEventListener('click', closeModal));
  const names = () => { const o = wArr(c, kind).find(v => v.id === $('#mg-other', bg).value); const opts = [...new Set([x.n, o && o.n].map(s => (s || '').trim()).filter(Boolean))];
    $('#mg-names', bg).innerHTML = opts.map((n, i) => `<label class="mini"><input type="radio" name="mg-n" value="${esc(n)}" ${i === 0 ? 'checked' : ''}> ${esc(n)}</label>`).join('') + `<label class="mini"><input type="radio" name="mg-n" value="__own"> Something else: <input type="text" id="mg-own" style="width:auto;flex:1;min-width:140px" placeholder="Correct name"></label>`; };
  names(); $('#mg-other', bg).addEventListener('change', names);
  bg.addEventListener('input', e => { if (e.target.id === 'mg-own'){ const r = bg.querySelector('input[value="__own"]'); if (r) r.checked = true; } });
  $('#mg-go', bg).addEventListener('click', () => { const pick = bg.querySelector('input[name="mg-n"]:checked'); let nm = pick ? pick.value : x.n; if (nm === '__own') nm = $('#mg-own', bg).value.trim() || x.n;
    closeModal(); mergeWorld(c, kind, id, $('#mg-other', bg).value, nm); });
}

// ---------- game notes and quests ----------
function mergeNotes(c, keepId, goneId){
  const keep = c.notes.find(n => n.id === keepId), gone = c.notes.find(n => n.id === goneId); if (!keep || !gone) return;
  mergeSnapshot(c, `two notes`);
  const label = [gone.t || 'Untitled note', gone.date].filter(Boolean).join(', ');
  keep.body = joinText(keep.body, gone.body, label); if (!keep.t) keep.t = gone.t;
  if (gone.date && (!keep.date || gone.date < keep.date)) keep.date = gone.date;
  c.notes = c.notes.filter(n => n.id !== goneId); APP.jumpEl = 'note-' + keepId;
  mergeDone(c, `Joined <b>${esc(label)}</b> into <b>${esc(keep.t || 'this note')}</b>.`);
}
function mergeQuests(c, keepId, goneId){
  const keep = c.quests.find(q => q.id === keepId), gone = c.quests.find(q => q.id === goneId); if (!keep || !gone) return;
  mergeSnapshot(c, `two quests`);
  for (const f of ['giver', 'where', 'reward']) if (!keep[f] && gone[f]) keep[f] = gone[f];
  for (const k of c.keyItems || []) if (k.quest === goneId) k.quest = keepId;
  keep.note = joinText(keep.note, gone.note, gone.t || 'the other quest'); if (!keep.t) keep.t = gone.t;
  const have = new Set((keep.obj || []).map(o => (o.t || '').trim().toLowerCase()));
  for (const o of gone.obj || []){ const k = (o.t || '').trim().toLowerCase(); if (!k || !have.has(k)){ keep.obj.push(o); have.add(k); } else if (o.done){ const m = keep.obj.find(v => (v.t || '').trim().toLowerCase() === k); if (m) m.done = true; } }
  c.quests = c.quests.filter(q => q.id !== goneId); APP.jumpEl = 'quest-' + keepId;
  mergeDone(c, `Joined <b>${esc(gone.t || 'the other quest')}</b> into <b>${esc(keep.t || 'this quest')}</b>.`);
}
function openMergeList(what, id){
  const c = APP_cur(), arr = what === 'note' ? c.notes : c.quests, x = arr.find(v => v.id === id); if (!x) return;
  const lbl = v => what === 'note' ? [v.t || 'Untitled note', v.date].filter(Boolean).join(' · ') : (v.t || 'Untitled quest');
  const others = arr.filter(v => v.id !== id).map(v => ({v, s: nameSim(v.t, x.t)})).sort((a, b) => b.s - a.s);
  if (!others.length){ toast(`There's no other ${what} to join.`); return; }
  const bg = openModal(`<div class="modal narrow" role="dialog" aria-label="Join"><div class="mh"><h3>Join into ${esc(lbl(x))}</h3><button class="btn ghost" data-close>Cancel</button></div>
    <div class="mform"><p class="hint" style="margin:0">${what === 'note' ? 'The other note\'s text is added to the end of this one (marked with where it came from), keeping the earlier date. The other note is then removed.' : 'The other quest\'s objectives and notes are added to this one, and empty details filled in. The other quest is then removed.'}</p>
      <label class="fld"><span class="cap">${what === 'note' ? 'Note' : 'Quest'} to join into this one</span><select id="mg-other">${others.map(({v, s}) => `<option value="${v.id}">${esc(lbl(v))}${s >= LIKELY ? ' (same title?)' : ''}</option>`).join('')}</select></label></div>
    <div class="mfoot"><span class="hint">You can undo straight after.</span><button class="btn pri" id="mg-go">Join</button></div></div>`);
  $$('[data-close]', bg).forEach(b => b.addEventListener('click', closeModal));
  $('#mg-go', bg).addEventListener('click', () => { const g = $('#mg-other', bg).value; closeModal(); (what === 'note' ? mergeNotes : mergeQuests)(c, id, g); });
}
document.addEventListener('click', e => { const b = e.target.closest('[data-merge]'); if (!b) return; e.preventDefault(); const [what, id] = b.dataset.merge.split(':');
  if (what === 'note' || what === 'quest') openMergeList(what, id); else openMergeWorld(what, id); });

// a gentle hint on a card when another one has a very similar name
function dupeHint(c, kind, x){
  const d = likelyDupes(c, kind, x); if (!d.length) return '';
  return `<div class="dupe-hint">Looks similar to ${d.slice(0, 3).map(v => chipLink(kind, v)).join(' ')}. Same ${esc(WK[kind].label)}? <button class="btn sm" data-merge="${kind}:${x.id}">Merge…</button></div>`;
}
