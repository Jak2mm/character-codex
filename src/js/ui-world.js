// ===================== NPCs, LOCATIONS & FACTIONS =====================
const ATTITUDES = [['', 'Unknown'], ['hostile', 'Hostile'], ['unfriendly', 'Unfriendly'], ['indifferent', 'Indifferent'], ['friendly', 'Friendly'], ['helpful', 'Helpful']];
const ATT_PILL = {hostile:'bad', unfriendly:'warn', indifferent:'', friendly:'acc', helpful:'good'};
const NPC_STATUS = [['alive', 'Alive'], ['dead', 'Dead'], ['missing', 'Missing'], ['unknown', 'Unknown']];
const LOC_TYPES = ['', 'City', 'Town', 'Village', 'Keep / castle', 'Temple', 'Tavern / inn', 'Shop', 'Dungeon', 'Ruins', 'Cave', 'Wilderness', 'Region', 'Plane', 'Other'];
const LOC_STATUS = [['heard', 'Heard of'], ['visited', 'Visited'], ['cleared', 'Cleared'], ['avoid', 'Avoid']];
const REL_TYPES = ['', 'Deity', 'Pantheon', 'Church / faith', 'Cult', 'Philosophy', 'Demigod / saint', 'Spirit / ancestor', 'Other'];
const FAC_TYPES = ['', 'Guild', 'Church / temple', 'Cult', 'Noble house', 'Government', 'Military', 'Thieves / criminal', 'Mercenaries', 'Merchants', 'Arcane order', 'Tribe / clan', 'Secret society', 'Other'];
const NPC_STATS = [['cr', 'CR'], ['hp', 'HP'], ['ac', 'AC'], ['init', 'Init'], ['speed', 'Speed'], ['bab', 'BAB / Grapple'], ['fort', 'Fort'], ['ref', 'Ref'], ['will', 'Will'],
  ['str', 'Str'], ['dex', 'Dex'], ['con', 'Con'], ['int', 'Int'], ['wis', 'Wis'], ['cha', 'Cha']];
const TRUST = [['', 'Not sure yet'], ['close', 'Close friend'], ['trusted', 'Trusted'], ['neutral', 'Neutral'], ['wary', 'Wary'], ['distrust', 'Distrust']];
const TRUST_PILL = {close:'good', trusted:'acc', neutral:'', wary:'warn', distrust:'bad'};
const PC_STATUS = [['active', 'In the party'], ['away', 'Away'], ['left', 'Left the party'], ['dead', 'Dead']];
const WK = {pc:{arr:'players', tab:'players', sel:'pcSel', q:'pcQ', label:'player character', plural:'Players'}, npc:{arr:'npcs', tab:'npcs', sel:'npcSel', q:'npcQ', label:'NPC', plural:'NPCs'}, loc:{arr:'locations', tab:'locations', sel:'locSel', q:'locQ', label:'location', plural:'Locations'},
  fac:{arr:'factions', tab:'factions', sel:'facSel', q:'facQ', label:'faction', plural:'Factions'},
  rel:{arr:'religions', tab:'religions', sel:'relSel', q:'relQ', label:'religion', plural:'Religions'},
  comp:{arr:'companions', tab:'companions', sel:'compSel', q:'compQ', label:'companion', plural:'Companions'}};

async function imageToDataURL(file, max = 480){
  const url = URL.createObjectURL(file); const img = new Image(); img.src = url; await img.decode();
  const sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * sc); cv.height = Math.round(img.naturalHeight * sc);
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
  let q = .82, data = cv.toDataURL('image/jpeg', q); while (data.length > 120000 && q > .4){ q -= .1; data = cv.toDataURL('image/jpeg', q); }
  return data;
}
const today = () => new Date().toISOString().slice(0, 10);
function newWorld(kind){
  const base = {id:uid(kind), n:'', desc:'', log:[], img:''};
  if (kind === 'npc') return {...base, role:'', race:'', cls:'', align:'', attitude:'', status:'alive', loc:'', fac:'', stats:{}, attacks:'', special:''};
  if (kind === 'pc') return {...base, player:'', race:'', cls:'', align:'', role:'', trust:'', status:'active', deity:'', stats:{}, attacks:'', special:'', opinion:''};
  if (kind === 'loc') return {...base, type:'', region:'', status:'heard', parent:''};
  if (kind === 'rel') return {...base, type:'Deity', title:'', align:'', domains:'', portfolio:'', symbol:'', weapon:'', worshippers:'', temples:[], allies:'', rivals:''};
  return {...base, type:'', attitude:'', leader:'', hq:'', goals:''};
}
const wArr = (c, kind) => c[WK[kind].arr] || (c[WK[kind].arr] = []);
const wName = (c, kind, id) => { const x = wArr(c, kind).find(v => v.id === id); return x ? (x.n || 'Unnamed') : ''; };

// ---------- name links inside free text ----------
function worldIndex(c){
  const out = [];
  for (const kind of ['pc', 'npc', 'loc', 'fac', 'rel']) for (const x of wArr(c, kind)){
    let n = String(x.n || '').trim();
    if (kind === 'loc' || kind === 'fac' || kind === 'rel') n = n.replace(/^the\s+/i, ''); // "The Black Hand" also matches "Black Hand" / "the Black Hand"
    if (n.length >= 3) out.push({n, kind, id:x.id}); }
  for (const m of c.maps || []){ const n = String(m.n || '').trim().replace(/^the\s+/i, ''); if (n.length >= 3) out.push({n, kind:'map', id:m.id}); }
  return out.sort((a, b) => b.n.length - a.n.length);
}
function linkify(text, c){
  const idx = worldIndex(c); let html = esc(text || '');
  if (idx.length){
    const map = new Map(idx.map(e => [e.n.toLowerCase(), e]));
    const re = new RegExp('(^|[^\\p{L}\\p{N}])(' + idx.map(e => esc(e.n).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\p{L}\\p{N}])', 'giu');
    html = html.replace(re, (m, pre, name) => { const e = map.get(name.toLowerCase().replace(/&amp;/g, '&').replace(/&#39;/g, "'")) || idx.find(x => esc(x.n).toLowerCase() === name.toLowerCase());
      return e ? `${pre}<span class="ref wl wl-${e.kind}" tabindex="0" data-ref="world" data-name="${e.kind}:${e.id}">${name}</span>` : m; });
  }
  return html.replace(/\n/g, '<br>');
}
// a text block that reads with name links and edits on click
function LT(path, val, placeholder = 'Click to write…', rows = 4){
  return `<div class="lt" data-lt="${esc(path)}"><div class="lt-view" tabindex="0" title="Click to edit">${val ? linkify(val, APP_cur()) : `<span class="hint">${esc(placeholder)}</span>`}</div>
    <textarea data-k="${esc(path)}" id="k-${esc(path)}" rows="${rows}" hidden placeholder="${esc(placeholder)}">${esc(val || '')}</textarea></div>`;
}
document.addEventListener('click', e => {
  const v = e.target.closest('.lt-view'); if (!v || e.target.closest('.ref')) return;
  const box = v.closest('.lt'); const ta = $('textarea', box); const vh = v.offsetHeight; v.hidden = true; ta.hidden = false;
  fitTA(ta, vh); ta.focus({preventScroll:true}); ta.setSelectionRange(ta.value.length, ta.value.length);
});
// ---- text boxes keep their size: they open at least as big as the text you were reading, grow as you type,
// and remember a size you drag them to (per box, across re-renders and reloads)
APP.taH = {}; try { APP.taH = JSON.parse(localStorage.getItem('ccodex-ta') || '{}'); } catch {}
function taKey(k){ const c = APP_cur(); const m = String(k || '').match(/^(\w+)\.(\d+)\.(.+)$/); const x = m && c && Array.isArray(c[m[1]]) && c[m[1]][+m[2]];
  return (c ? c.id + ':' : '') + (x && x.id ? x.id + '.' + m[3] : k); }
function saveTA(ta){ const h = ta.offsetHeight; if (!h) return; APP.taH[taKey(ta.dataset.k)] = h; ta._h = h; clearTimeout(saveTA.t); saveTA.t = setTimeout(() => { try { localStorage.setItem('ccodex-ta', JSON.stringify(APP.taH)); } catch {} }, 400); }
function fitTA(ta, atLeast = 0){ const want = Math.max(APP.taH[taKey(ta.dataset.k)] || 0, atLeast); const top = window.scrollY;
  ta.style.height = 'auto'; const need = ta.scrollHeight + 2; ta.style.height = Math.max(need, want, 0) + 'px'; window.scrollTo({top}); ta._h = ta.offsetHeight; }
function applyTASizes(){ for (const ta of $$('textarea[data-k]')){ const h = APP.taH[taKey(ta.dataset.k)]; if (h) ta.style.height = h + 'px'; } }
document.addEventListener('input', e => { const ta = e.target; if (!ta.matches || !ta.matches('textarea[data-k]')) return;
  if (ta.scrollHeight > ta.clientHeight){ const top = window.scrollY; ta.style.height = (ta.scrollHeight + 2) + 'px'; window.scrollTo({top}); saveTA(ta); } });
// a drag of the resize handle (mouse or touch) is remembered, including making a box smaller
document.addEventListener('pointerup', () => { for (const ta of $$('textarea[data-k]')) if (ta.offsetHeight && ta._h !== undefined && Math.abs(ta.offsetHeight - ta._h) > 2) saveTA(ta); });
document.addEventListener('pointerdown', e => { const ta = e.target; if (ta.matches && ta.matches('textarea[data-k]')) ta._h = ta.offsetHeight; });
document.addEventListener('keydown', e => { const v = e.target.closest && e.target.closest('.lt-view'); if (v && e.key === 'Enter' && !e.target.closest('.ref')){ e.preventDefault(); v.click(); } });
document.addEventListener('focusout', e => {
  const ta = e.target; if (!ta.matches || !ta.matches('.lt textarea')) return;
  const box = ta.closest('.lt'); const v = $('.lt-view', box); const ph = ta.getAttribute('placeholder');
  v.innerHTML = ta.value ? linkify(ta.value, APP_cur()) : `<span class="hint">${esc(ph)}</span>`; ta.hidden = true; v.hidden = false;
});
function worldRef(key){
  const [kind, id] = String(key).split(':'); const c = APP_cur();
  if (kind === 'map'){ const m = c && (c.maps || []).find(v => v.id === id); if (!m) return null; const pins = (m.pins || []).map(p => wName(c, p.kind, p.ref)).filter(Boolean);
    return {title: m.n || 'Untitled map', sub: 'Map · click to open', html: `${m.img ? `<img src="${IMG.src(m.img)}" alt="" style="width:100%;max-height:180px;object-fit:contain;border:1px solid var(--rule)">` : ''}<p class="hint">${pins.length ? 'Pinned: ' + esc(pins.slice(0, 12).join(', ')) + (pins.length > 12 ? '…' : '') : 'No pins yet.'}</p>`}; }
  const x = c && wArr(c, kind).find(v => v.id === id); if (!x) return null;
  const last = (x.log || [])[0];
  const bits = kind === 'pc' ? [x.player ? 'played by ' + x.player : '', x.race, x.cls, x.role, (TRUST.find(t => t[0] === x.trust) || [])[1], x.status !== 'active' ? (PC_STATUS.find(t => t[0] === x.status) || [])[1] : '']
    : kind === 'npc' ? [x.role, x.race, x.cls, x.status !== 'alive' ? x.status : '', x.attitude, wName(c, 'loc', x.loc), wName(c, 'fac', x.fac)]
    : kind === 'loc' ? [x.type, x.region, wName(c, 'loc', x.parent), (LOC_STATUS.find(s => s[0] === x.status) || [])[1]]
    : kind === 'rel' ? [x.title, x.type, x.align, x.domains ? 'domains: ' + x.domains : '', x.portfolio]
    : [x.type, x.attitude ? x.attitude + ' to you' : '', x.leader ? 'led by ' + wName(c, 'npc', x.leader) : '', x.hq ? 'based at ' + wName(c, 'loc', x.hq) : ''];
  const stats = kind === 'npc' || kind === 'pc' ? NPC_STATS.filter(([k]) => (x.stats || {})[k]).map(([k, l]) => `${l} ${esc(x.stats[k])}`).join(' · ') : '';
  return {title: x.n || 'Unnamed', sub: {pc:'Player character', npc:'NPC', loc:'Location', fac:'Faction', rel:'Religion'}[kind] + ' · click to open',
    html: `${x.img ? `<span class="w-thumb" style="float:right;width:84px;height:84px;margin:0 0 6px 10px">${cropImg(x)}</span>` : ''}
      <p class="hint" style="margin-top:0">${esc(bits.filter(Boolean).join(' · '))}</p>${stats ? `<p style="font-size:13px">${stats}</p>` : ''}
      <div class="rt">${x.opinion ? `<p><b>Your opinion:</b> ${esc(x.opinion)}</p>` : ''}${x.desc ? `<p>${esc(x.desc).replace(/\n/g, '<br>')}</p>` : ''}${last ? `<p><b>Latest${last.date ? ' (' + esc(last.date) + ')' : ''}:</b> ${esc(last.text)}</p>` : ''}${!x.desc && !last ? '<p class="hint">Nothing written yet.</p>' : ''}</div>`};
}
function jumpWorld(key){ const [kind, id] = String(key).split(':');
  if (kind === 'map'){ APP.mapSel = id; APP.placing = null; APP.tab = 'maps'; closeModal(); hideTip(); renderAll(); window.scrollTo({top:0}); return; }
  APP[WK[kind].sel] = id; APP.tab = WK[kind].tab; APP[WK[kind].q] = ''; closeModal(); hideTip(); renderAll(); window.scrollTo({top:0}); }

// ---------- list & detail ----------
function worldList(kind, c){
  const arr = wArr(c, kind); const q = (APP[WK[kind].q] || '').toLowerCase(); const sel = APP[WK[kind].sel];
  const hay = x => [x.n, x.player, x.opinion, x.role, x.race, x.type, x.region, x.goals, x.desc, x.title, x.domains, x.portfolio, x.symbol, x.worshippers, ...(x.log || []).map(l => l.text)].join(' ').toLowerCase();
  const shown = arr.filter(x => !q || hay(x).includes(q)).sort((a, b) => (a.n || '~').localeCompare(b.n || '~'));
  return shown.map(x => {
    const sub = kind === 'pc' ? [x.cls, x.race, x.player ? '(' + x.player + ')' : ''] : kind === 'npc' ? [x.role, x.race, wName(c, 'loc', x.loc)] : kind === 'loc' ? [x.type, x.region || wName(c, 'loc', x.parent)] : kind === 'rel' ? [x.title || x.type, x.align] : [x.type, x.hq ? wName(c, 'loc', x.hq) : ''];
    const pill = kind === 'loc' ? `<span class="pill ${x.status === 'visited' ? 'good' : x.status === 'cleared' ? 'acc' : x.status === 'avoid' ? 'bad' : ''}">${(LOC_STATUS.find(s => s[0] === x.status) || ['', ''])[1]}</span>`
      : kind === 'pc' ? (x.status === 'dead' ? '<span class="pill bad">dead</span>' : x.status === 'left' ? '<span class="pill">left</span>' : x.trust ? `<span class="pill ${TRUST_PILL[x.trust]}">${(TRUST.find(t => t[0] === x.trust) || [])[1]}</span>` : '')
      : kind === 'npc' && x.status === 'dead' ? '<span class="pill bad">dead</span>' : x.attitude ? `<span class="pill ${ATT_PILL[x.attitude]}">${x.attitude}</span>` : '';
    return `<a href="#" class="w-item ${x.id === sel ? 'act' : ''}" data-wsel="${kind}:${x.id}">${x.img ? `<span class="w-thumb">${cropImg(x)}</span>` : `<span class="w-ph">${esc((x.n || '?').slice(0, 1).toUpperCase())}</span>`}
      <span class="w-t"><b>${esc(x.n || 'Unnamed')}</b><span class="hint">${esc(sub.filter(Boolean).join(' · '))}</span></span>${pill}</a>`; }).join('')
    || `<div class="empty">${q ? 'Nothing matches that search.' : `No ${WK[kind].plural.toLowerCase()} yet.`}</div>`;
}
function logBlock(kind, i, x){
  const arr = WK[kind].arr;
  return `<div class="w-sec"><div class="cap">What you've learned</div>
    <div class="row" style="align-items:flex-start;margin-top:4px"><textarea id="wlog-new" rows="2" placeholder="Add something new you found out… (saved with today's date)" style="flex:1;min-height:56px"></textarea><button class="btn pri" data-act="wLogAdd" data-kind="${kind}" data-id="${x.id}">Add</button></div>
    <div class="w-log">${(x.log || []).map((l, j) => `<div class="w-log-e"><div class="row" style="justify-content:space-between"><input type="date" data-k="${arr}.${i}.log.${j}.date" id="k-wl-${x.id}-${j}" value="${esc(l.date)}" style="width:auto;padding:2px 4px"><button class="btn ghost sm" data-act="wLogDel" data-kind="${kind}" data-id="${x.id}" data-j="${j}" aria-label="Delete entry">✕</button></div>
      ${LT(`${arr}.${i}.log.${j}.text`, l.text, 'Click to write…', 2)}</div>`).join('') || '<p class="hint" style="margin:6px 0 0">Nothing logged yet. Each entry is dated, so you can see how your knowledge grew.</p>'}</div></div>`;
}
// which part of a picture shows in its square frame: x.crop = {x, y} (0–100, the point kept in view) and z (zoom, 1–4)
function cropStyle(cr){ if (!cr) return ''; const x = Math.max(0, Math.min(100, num(cr.x ?? 50))), y = Math.max(0, Math.min(100, num(cr.y ?? 50))), z = Math.max(1, Math.min(4, num(cr.z) || 1));
  return `object-position:${x}% ${y}%;transform-origin:${x}% ${y}%;${z > 1 ? `transform:scale(${z});` : ''}`; }
const cropImg = (x, alt = '', cls = '') => `<img src="${IMG.src(x.img)}" alt="${esc(alt)}" ${cls ? `class="${cls}"` : ''} style="${cropStyle(x.crop)}">`;
function imgBox(kind, x){
  return `<div class="w-img">${x.img ? cropImg(x, 'Picture of ' + (x.n || ''), 'w-zoom') : `<label for="wimg-${x.id}" class="portrait-empty"><span class="pe-icon" aria-hidden="true"></span><b>Add picture</b></label>`}</div>
    <input type="file" accept="image/*" hidden id="wimg-${x.id}" data-wimg="${kind}:${x.id}">
    ${x.img ? `<div class="row" style="justify-content:center;gap:4px"><label for="wimg-${x.id}" class="btn sm">Change</label><button class="btn sm" data-act="wImgCrop" data-kind="${kind}" data-id="${x.id}" title="Choose which part of the picture shows">Adjust</button><button class="btn ghost sm" data-act="wImgDel" data-kind="${kind}" data-id="${x.id}">Remove</button></div>` : ''}`;
}
const chipLink = (kind, x) => `<a href="#" class="bchip w-chip" data-wjump="${kind}:${x.id}">${esc(x.n || 'Unnamed')}</a>`;
function worldDetail(kind, c, x, i){
  const arr = WK[kind].arr; const P = f => `${arr}.${i}.${f}`;
  const opts = k => [['', '—'], ...wArr(c, k).filter(v => v.id !== x.id).map(v => [v.id, v.n || 'Unnamed'])];
  let fields = '', extra = '', links = '';
  const statsBlock = `<div class="w-sec"><div class="row" style="justify-content:space-between"><span class="cap">Stats (fill in as you learn them)</span>
        <button class="btn sm" data-act="npcInit" data-kind="${kind}" data-id="${x.id}" title="Roll initiative and add them to the Combat tab">Add to initiative</button></div>
        <div class="w-stats">${NPC_STATS.filter(([k]) => kind === 'npc' || k !== 'cr').map(([k, l]) => F(l, I(`${P('stats')}.${k}`, (x.stats || {})[k], 'placeholder="?"'))).join('')}</div>
        <div class="fields" style="margin-top:8px">${F('Attacks', T(P('attacks'), x.attacks, 'rows="2" placeholder="e.g. Longsword +8 (1d8+3, 19–20/×2)"'), 'wide')}${F('Special abilities / spells', T(P('special'), x.special, 'rows="2" placeholder="Anything you\'ve seen them do"'), 'wide')}</div></div>`;
  if (kind === 'pc'){
    fields = `<div class="fields">${F('Character name', I(P('n'), x.n, 'data-rerender-list="pc" placeholder="Character name"'), 'wide')}${F('Played by', I(P('player'), x.player, 'placeholder="Player\'s real name"'))}${F('Party role', I(P('role'), x.role, 'placeholder="e.g. Healer, scout, face"'))}</div>
      <div class="fields">${F('Race', I(P('race'), x.race))}${F('Class / level', I(P('cls'), x.cls, 'placeholder="e.g. Fighter 3 / Rogue 1"'))}${F('Alignment', I(P('align'), x.align))}${F('Deity', I(P('deity'), x.deity))}
        ${F('How you feel about them', S(P('trust'), x.trust, TRUST, 'data-rerender="1"'))}${F('Status', S(P('status'), x.status, PC_STATUS, 'data-rerender="1"'))}</div>`;
    extra = `<div class="w-sec">${F('Your opinion of them', LT(P('opinion'), x.opinion, 'What you think of them, how far you trust them, any history between your characters…', 3))}</div>` + statsBlock;
  } else if (kind === 'npc'){
    fields = `<div class="fields">${F('Name', I(P('n'), x.n, 'data-rerender-list="npc" placeholder="Name"'), 'wide')}${F('Role / title', I(P('role'), x.role, 'placeholder="e.g. Innkeeper, cult leader"'))}${F('Faction', S(P('fac'), x.fac, opts('fac'), 'data-rerender="1"'))}</div>
      <div class="fields">${F('Race', I(P('race'), x.race))}${F('Class / level', I(P('cls'), x.cls, 'placeholder="e.g. Wizard 5"'))}${F('Alignment', I(P('align'), x.align))}
        ${F('Attitude ' + refA('skill', 'Diplomacy', 'ⓘ'), S(P('attitude'), x.attitude, ATTITUDES, 'data-rerender="1"'))}${F('Status', S(P('status'), x.status, NPC_STATUS, 'data-rerender="1"'))}${F('Where found', S(P('loc'), x.loc, opts('loc'), 'data-rerender="1"'))}${F('Faith', S(P('rel'), x.rel, opts('rel'), 'data-rerender="1"'))}</div>`;
    extra = statsBlock;
  } else if (kind === 'loc'){
    fields = `<div class="fields">${F('Name', I(P('n'), x.n, 'data-rerender-list="loc" placeholder="Name"'), 'wide')}${F('Type', S(P('type'), x.type, LOC_TYPES.map(t => [t, t || '—'])))}${F('Status', S(P('status'), x.status, LOC_STATUS, 'data-rerender="1"'))}</div>
      <div class="fields">${F('Region', I(P('region'), x.region, 'placeholder="e.g. The Vale"'))}${F('Inside / part of', S(P('parent'), x.parent, opts('loc'), 'data-rerender="1"'))}</div>`;
    const here = c.npcs.filter(n => n.loc === x.id), inside = c.locations.filter(l => l.parent === x.id), facs = c.factions.filter(f => f.hq === x.id);
    if (here.length || inside.length || facs.length) links = `<div class="bchips">${here.map(n => chipLink('npc', n)).join('')}${facs.map(f => chipLink('fac', f)).join('')}${inside.map(l => chipLink('loc', l)).join('')}</div><p class="hint" style="margin:0">People, factions and places linked here.</p>`;
  } else if (kind === 'rel'){
    fields = `<div class="fields">${F('Name', I(P('n'), x.n, 'data-rerender-list="rel" placeholder="e.g. Pelor, the Church of the Silver Flame"'), 'wide')}${F('Type', S(P('type'), x.type, REL_TYPES.map(t => [t, t || '—'])))}${F('Title', I(P('title'), x.title, 'placeholder="e.g. The Sun Father"'))}</div>
      <div class="fields">${F('Alignment', I(P('align'), x.align))}${F('Domains', I(P('domains'), x.domains, 'placeholder="e.g. Good, Healing, Strength, Sun"'))}${F('Portfolio', I(P('portfolio'), x.portfolio, 'placeholder="e.g. Sun, light, healing"'))}
        ${F('Holy symbol', I(P('symbol'), x.symbol, 'placeholder="e.g. Face of the sun"'))}${F('Favored weapon', I(P('weapon'), x.weapon, 'placeholder="e.g. Heavy mace"'))}${F('Worshippers', I(P('worshippers'), x.worshippers, 'placeholder="e.g. Farmers, healers, rangers"'))}</div>`;
    const temples = (x.temples || []).map(id => c.locations.find(l => l.id === id)).filter(Boolean);
    const free = c.locations.filter(l => !(x.temples || []).includes(l.id));
    extra = `<div class="w-sec"><div class="cap">Temples and holy sites</div><div class="bchips" style="margin-top:4px">${temples.map(l => `<span class="temple-chip">${chipLink('loc', l)}<button class="btn ghost sm" data-act="relTempleDel" data-id="${x.id}" data-loc="${l.id}" aria-label="Remove ${esc(l.n || 'location')}">✕</button></span>`).join('') || '<span class="hint">None yet.</span>'}</div>
        ${free.length ? `<select data-reltemple="${x.id}" style="width:auto;max-width:100%;margin-top:6px"><option value="">Add a location…</option>${free.map(l => `<option value="${l.id}">${esc(l.n || 'Unnamed')}</option>`).join('')}</select>` : c.locations.length ? '' : '<p class="hint" style="margin:4px 0 0">Add places on the Locations page to link temples here.</p>'}</div>
      <div class="w-sec fields">${F('Allied faiths', LT(P('allies'), x.allies, 'Friends of the faith…', 2), 'wide')}${F('Rival faiths and enemies', LT(P('rivals'), x.rivals, 'Who they oppose…', 2), 'wide')}</div>`;
    const churches = c.factions.filter(f => f.rel === x.id), followers = c.npcs.filter(n => n.rel === x.id);
    links = churches.length || followers.length ? `<div class="bchips">${churches.map(f => chipLink('fac', f)).join('')}${followers.map(n => chipLink('npc', n)).join('')}</div><p class="hint" style="margin:0">Churches and followers (set an NPC's or faction's Faith to link them).</p>` : '';
  } else {
    fields = `<div class="fields">${F('Name', I(P('n'), x.n, 'data-rerender-list="fac" placeholder="Name"'), 'wide')}${F('Type', S(P('type'), x.type, FAC_TYPES.map(t => [t, t || '—'])))}${F('Attitude to you', S(P('attitude'), x.attitude, ATTITUDES, 'data-rerender="1"'))}</div>
      <div class="fields">${F('Leader', S(P('leader'), x.leader, [['', '—'], ...c.npcs.map(n => [n.id, n.n || 'Unnamed'])], 'data-rerender="1"'))}${F('Headquarters', S(P('hq'), x.hq, [['', '—'], ...c.locations.map(l => [l.id, l.n || 'Unnamed'])], 'data-rerender="1"'))}${F('Faith', S(P('rel'), x.rel, opts('rel'), 'data-rerender="1"'))}</div>`;
    extra = `<div class="w-sec">${F('Goals', LT(P('goals'), x.goals, 'What do they want? Who are their enemies?', 3))}</div>`;
    const members = c.npcs.filter(n => n.fac === x.id);
    links = `<div class="bchips">${members.map(n => chipLink('npc', n)).join('') || '<span class="hint">No members yet: set an NPC\'s Faction to link them.</span>'}</div>`;
  }
  return `<div class="pb grid" style="gap:14px">
    <div class="w-head"><div class="w-imgcol">${imgBox(kind, x)}</div><div class="grid" style="gap:10px;min-width:0">${fields}${links}</div></div>
    ${F('Description', LT(P('desc'), x.desc, kind === 'npc' ? 'Appearance, personality, what they want…' : kind === 'loc' ? 'What it looks like, who runs it, dangers, rumours…' : kind === 'rel' ? 'Beliefs, holy days, rites, what the faithful are asked to do…' : 'Who they are, what they\'re known for…', 4))}
    ${extra}${logBlock(kind, i, x)}
    ${mentionsBlock(c, kind, x)}
    <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-act="wDel" data-kind="${kind}" data-id="${x.id}">Delete ${WK[kind].label}</button></div></div>`;
}
function renderWorld(kind, c){
  const arr = wArr(c, kind); const x = arr.find(n => n.id === APP[WK[kind].sel]) || arr[0]; if (x) APP[WK[kind].sel] = x.id;
  const intro = {pc:'Keep track of the other characters in your party: who they are, what you\'ve learned about them, and what you think of them.', npc:'Add the people you meet: their stats as you learn them, what they\'re like, and everything you find out over time.', loc:'Add towns, dungeons, inns and anywhere you go or hear about, and build up what you know about each.', fac:'Track guilds, churches, cults and noble houses: who leads them, where they\'re based, what they want, and who belongs.', rel:'Keep track of gods, faiths and cults: their domains, symbols and temples, who follows them, and what you learn about them.'}[kind];
  return `<div class="w-grid"><aside class="panel w-side"><div class="ph"><h2>${WK[kind].plural}</h2><div class="tools"><button class="btn sm pri" data-act="wNew" data-kind="${kind}">New ${WK[kind].label}</button></div></div>
      <div class="pb" style="border-bottom:1px solid var(--rule-2)"><input type="search" id="wq-${kind}" data-wq="${kind}" placeholder="Search names and notes…" value="${esc(APP[WK[kind].q] || '')}"></div>
      <div class="w-list" id="wlist-${kind}">${worldList(kind, c)}</div></aside>
    <section class="panel w-main">${x ? `<div class="ph"><h2 id="wtitle">${esc(x.n || 'Unnamed ' + WK[kind].label)}</h2></div>${worldDetail(kind, c, x, arr.indexOf(x))}` : `<div class="empty"><b>No ${WK[kind].plural.toLowerCase()} yet.</b><br>${intro}<br><br><button class="btn pri" data-act="wNew" data-kind="${kind}">New ${WK[kind].label}</button></div>`}</section></div>`;
}
const renderReligions = c => renderWorld('rel', c);
const renderPlayers = c => renderWorld('pc', c), renderNpcs = c => renderWorld('npc', c), renderLocations = c => renderWorld('loc', c), renderFactions = c => renderWorld('fac', c);

// ---------- events ----------
document.addEventListener('click', e => {
  const s = e.target.closest('[data-wsel],[data-wjump]'); if (!s) return; e.preventDefault();
  const [kind, id] = (s.dataset.wsel || s.dataset.wjump).split(':'); APP[WK[kind].sel] = id; APP.tab = WK[kind].tab; renderAll();
  if (matchMedia('(max-width: 860px)').matches){ const p = $('.w-main'); if (p) p.scrollIntoView({block:'start'}); }
});
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.wq; if (k){ APP[WK[k].q] = e.target.value; const l = $('#wlist-' + k); if (l) l.innerHTML = worldList(k, APP_cur()); return; }
  const r = e.target.dataset && e.target.dataset.rerenderList; if (!r) return;
  clearTimeout(e.target._t); e.target._t = setTimeout(() => { const l = $('#wlist-' + r); if (l) l.innerHTML = worldList(r, APP_cur()); const h = $('#wtitle'); if (h) h.textContent = e.target.value || 'Unnamed ' + WK[r].label; }, 250);
});
document.addEventListener('change', async e => { const t = e.target.dataset && e.target.dataset.wimg; if (!t) return; const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (!/^image\//.test(f.type)){ toast('That file isn\'t an image.', 'warn'); return; }
  const [kind, id] = t.split(':'); const c = APP_cur(); const x = wArr(c, kind).find(v => v.id === id);
  try { const d = await imageToDataURL(f, 600); IMG.drop(x.img); x.img = IMG.put(d); delete x.crop; markDirty(); renderAll();
    const im = new Image(); im.src = d; await im.decode(); if (Math.abs(im.naturalWidth / im.naturalHeight - 1) > .15) openCropper(x); } catch { toast('That image couldn\'t be read.', 'warn'); } });
document.addEventListener('click', e => { const im = e.target.closest('.w-zoom'); if (!im) return;
  openModal(`<div class="modal narrow" role="dialog"><div class="mh"><h3>Picture</h3><button class="btn ghost" data-close>Close</button></div><div class="mprev" style="text-align:center"><img src="${im.src}" alt="" style="max-height:70vh"></div></div>`); });

// ---- choose which part of a picture shows in its square: drag to move, slider to zoom ----
function openCropper(x){
  if (!x || !x.img) return; const cr = Object.assign({x: 50, y: 50, z: 1}, x.crop || {});
  const bg = openModal(`<div class="modal narrow" role="dialog" aria-label="Adjust picture"><div class="mh"><h3>Adjust picture</h3><button class="btn ghost" data-close>Close</button></div>
    <div class="mform"><p class="hint" style="margin:0">Drag the picture to choose what shows in the square, and zoom in for a face or upper body. The whole picture is kept; this only changes the framing.</p>
      <div class="crop-wrap"><div class="crop-frame" id="cr-frame"><img src="${IMG.src(x.img)}" alt="" draggable="false" id="cr-img"></div></div>
      <label class="row crop-zoom"><span class="cap">Zoom</span><input type="range" id="cr-z" min="1" max="4" step="0.05" value="${cr.z}" style="flex:1"><span id="cr-zv" class="hint">${cr.z.toFixed(1)}×</span></label>
      <div class="row crop-prev"><span class="cap">Preview</span><span class="w-thumb" style="width:36px;height:36px"><img id="cr-p1" src="${IMG.src(x.img)}" alt=""></span><span class="w-thumb" style="width:84px;height:84px"><img id="cr-p2" src="${IMG.src(x.img)}" alt=""></span></div></div>
    <div class="mfoot"><button class="btn ghost" id="cr-reset">Reset</button><div class="row"><button class="btn" data-close>Cancel</button><button class="btn pri" id="cr-save">Save</button></div></div></div>`);
  $$('[data-close]', bg).forEach(b => b.addEventListener('click', closeModal));
  const frame = $('#cr-frame', bg), imgs = [$('#cr-img', bg), $('#cr-p1', bg), $('#cr-p2', bg)];
  const draw = () => { const st = cropStyle(cr); imgs.forEach(i => i.setAttribute('style', st)); $('#cr-zv', bg).textContent = (+cr.z).toFixed(1) + '×'; };
  draw();
  let drag = null;
  frame.addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY, cx: cr.x, cy: cr.y}; frame.setPointerCapture(e.pointerId); frame.classList.add('drag'); });
  frame.addEventListener('pointermove', e => { if (!drag) return; const r = frame.getBoundingClientRect(), k = 100 / (r.width * (+cr.z));
    // dragging the picture right shows more of its left side
    cr.x = Math.max(0, Math.min(100, drag.cx - (e.clientX - drag.x) * k * 1.6)); cr.y = Math.max(0, Math.min(100, drag.cy - (e.clientY - drag.y) * k * 1.6)); draw(); });
  const end = () => { drag = null; frame.classList.remove('drag'); }; frame.addEventListener('pointerup', end); frame.addEventListener('pointercancel', end);
  frame.addEventListener('wheel', e => { e.preventDefault(); cr.z = Math.max(1, Math.min(4, +cr.z - Math.sign(e.deltaY) * .1)); $('#cr-z', bg).value = cr.z; draw(); }, {passive: false});
  frame.tabIndex = 0; frame.addEventListener('keydown', e => { const d = {ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, -3], ArrowDown: [0, 3]}[e.key]; if (!d) return; e.preventDefault(); cr.x = Math.max(0, Math.min(100, cr.x + d[0])); cr.y = Math.max(0, Math.min(100, cr.y + d[1])); draw(); });
  $('#cr-z', bg).addEventListener('input', e => { cr.z = +e.target.value; draw(); });
  $('#cr-reset', bg).addEventListener('click', () => { cr.x = 50; cr.y = 50; cr.z = 1; $('#cr-z', bg).value = 1; draw(); });
  $('#cr-save', bg).addEventListener('click', () => { cr.x = Math.round(cr.x); cr.y = Math.round(cr.y); cr.z = Math.round(cr.z * 100) / 100;
    if (cr.x === 50 && cr.y === 50 && cr.z === 1) delete x.crop; else x.crop = {x: cr.x, y: cr.y, z: cr.z}; markDirty(); closeModal(); renderAll(); });
}

// religions: link temples (locations)
document.addEventListener('change', e => { const id = e.target.dataset && e.target.dataset.reltemple; if (!id || !e.target.value) return; const c = APP_cur(); const x = wArr(c, 'rel').find(v => v.id === id); if (!x) return;
  x.temples = [...new Set([...(x.temples || []), e.target.value])]; markDirty(); renderAll(); });
