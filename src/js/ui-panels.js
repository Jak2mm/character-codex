// ===================== CHARACTER SHEET LAYOUT (panels) =====================
// The ruleset module lists its sheet panels (rulesets/*.js). This arranges them, and lets a player
// reorder, resize, collapse or hide panels for each character with "Customise sheet".
// Hidden or collapsed panels still count in every calculation; only the display changes.
// Saved on the character as c.sheetLayout = {order:[ids], size:{id:'half'|'full'}, hidden:{id:true}, collapsed:{id:true}}
APP.sheetEdit = false;

function sheetLayoutOf(c){
  const L = c.sheetLayout = c.sheetLayout || {};
  L.order = Array.isArray(L.order) ? L.order : []; L.size = L.size || {}; L.hidden = L.hidden || {}; L.collapsed = L.collapsed || {};
  return L;
}
// the ruleset's panels in this character's order (new panels a ruleset adds later slot in at their standard place)
function orderedPanels(c){
  const defs = ruleset(c).sheet || [], L = sheetLayoutOf(c), byId = Object.fromEntries(defs.map(p => [p.id, p]));
  const out = L.order.filter(id => byId[id]).map(id => byId[id]);
  defs.forEach((p, i) => { if (!out.includes(p)){ const before = defs.slice(i + 1).map(d => out.indexOf(d)).find(j => j >= 0); out.splice(before == null || before < 0 ? out.length : before, 0, p); } });
  return out;
}
// add the collapse button into the panel's own header
function withCollapse(html, p, collapsed){
  const btn = `<button class="btn ghost sm sp-col" data-sp="collapse" data-panel="${p.id}" aria-expanded="${!collapsed}" title="${collapsed ? 'Expand' : 'Collapse'} ${esc(p.title)}">${collapsed ? '▸' : '▾'}</button>`;
  const i = html.indexOf('<div class="tools">'); return i < 0 ? html : html.slice(0, i + 19) + btn + html.slice(i + 19);
}
function renderSheet(c){
  const M = ruleset(c), L = sheetLayoutOf(c), edit = APP.sheetEdit, html = M.sheetPanels(c), list = orderedPanels(c);
  const n = list.length;
  const items = list.map((p, i) => {
    const hid = !!L.hidden[p.id]; if (hid && !edit) return '';
    const size = L.size[p.id] || p.size || 'full', col = !!L.collapsed[p.id] && !edit;
    const bar = edit ? `<div class="sp-bar"><b>${esc(p.title)}</b><span class="sp-tools">
        <button class="btn sm" data-sp="up" data-panel="${p.id}" ${i === 0 ? 'disabled' : ''} aria-label="Move ${esc(p.title)} up">↑</button>
        <button class="btn sm" data-sp="down" data-panel="${p.id}" ${i === n - 1 ? 'disabled' : ''} aria-label="Move ${esc(p.title)} down">↓</button>
        <button class="btn sm" data-sp="size" data-panel="${p.id}" title="Currently ${size} width">${size === 'full' ? 'Make half width' : 'Make full width'}</button>
        ${p.keep ? '<span class="hint">always shown</span>' : `<button class="btn sm ${hid ? 'pri' : ''}" data-sp="hide" data-panel="${p.id}">${hid ? 'Show' : 'Hide'}</button>`}</span></div>` : '';
    return `<div class="sheet-sec sp-${size}${col ? ' collapsed' : ''}${hid ? ' sp-hidden' : ''}" data-panel="${p.id}">${bar}${withCollapse(html[p.id] || '', p, col)}</div>`;
  }).join('');
  const hiddenList = list.filter(p => L.hidden[p.id]);
  const changed = L.order.length || Object.keys(L.size).length || hiddenList.length;
  const top = edit
    ? `<div class="sp-edit-banner"><div><b>Customising ${esc(c.name || 'this character')}'s sheet.</b> Move sections with ↑ ↓, switch them between half and full width, or hide the ones you don't need. Hidden sections still count in every calculation. Each character keeps its own layout.</div>
        <div class="row">${changed ? '<button class="btn sm" data-sp="reset">Reset to standard</button>' : ''}<button class="btn sm pri" data-sp="done">Done</button></div></div>`
    : '';
  const foot = !edit && hiddenList.length ? `<p class="hint sp-foot">Hidden: ${hiddenList.map(p => esc(p.title)).join(', ')}. <a href="#" data-sp="edit">Customise sheet</a> to show ${hiddenList.length === 1 ? 'it' : 'them'} again.</p>` : '';
  return `${top}<div class="sheet-grid${edit ? ' editing' : ''}">${items}</div>${foot}`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sp]'); if (!b) return; e.preventDefault();
  const c = APP_cur(); if (!c) return; const L = sheetLayoutOf(c), id = b.dataset.panel, act = b.dataset.sp;
  if (act === 'edit'){ APP.sheetEdit = true; APP.tab = 'sheet'; renderAll(); return; }
  if (act === 'done'){ APP.sheetEdit = false; renderAll(); return; }
  if (act === 'reset'){ c.sheetLayout = {}; toast('Sheet layout reset to the standard one.'); }
  if (act === 'collapse'){ L.collapsed[id] = !L.collapsed[id]; if (!L.collapsed[id]) delete L.collapsed[id]; }
  if (act === 'hide'){ L.hidden[id] = !L.hidden[id]; if (!L.hidden[id]) delete L.hidden[id]; }
  if (act === 'size'){ const p = (ruleset(c).sheet || []).find(x => x.id === id); const cur = L.size[id] || (p && p.size) || 'full'; const nx = cur === 'full' ? 'half' : 'full'; if (p && p.size === nx) delete L.size[id]; else L.size[id] = nx; }
  if (act === 'up' || act === 'down'){ const ids = orderedPanels(c).map(p => p.id); const i = ids.indexOf(id), j = act === 'up' ? i - 1 : i + 1;
    if (j >= 0 && j < ids.length){ [ids[i], ids[j]] = [ids[j], ids[i]]; L.order = ids; } }
  markDirty(); renderAll();
  if (act === 'up' || act === 'down'){ const el = document.querySelector(`.sheet-sec[data-panel="${id}"]`); if (el) el.scrollIntoView({block:'nearest'}); }
});
