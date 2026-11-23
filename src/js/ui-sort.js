// ===================== DROP-DOWN MENUS IN ALPHABETICAL ORDER =====================
// Every <select> in the app is sorted A–Z when it appears, so new menus are sorted without extra work.
// Kept at the top: the empty / "none" / "choose" choice and "You". Kept at the bottom: Other…, Upload…,
// Someone else, Your picture. Options inside a group (optgroup) are sorted within their group.
// Not sorted: menus that are a scale or a sequence, where the order carries meaning (rarity, attitude,
// trust, size, alignment, quest status, numbers and bonuses like +1 to +5, sort orders, point-buy modes).
const SORT_KEEP = ['.irar', '[data-k$=".attitude"]', '[data-k$=".trust"]', '[data-k="size"]', '[data-k="align"]',
  '[data-k^="quests."][data-k$=".status"]', '#nc-abil', '#k-abilMode', '[data-k^="attacks."][data-k$=".ab"]', '[data-k$=".hands"]',
  '[data-k="itemSort"]', '#st-sort', '[data-e="wpn.ab"]', '[data-e$=".mode"]', '[data-order="keep"]'].join(',');
const SORT_TOP = /^(—|-|none\b|auto\b|guess\b|work out|add\b|choose\b|all\b|not sure|you\b|— choose)/i;
const SORT_BOTTOM_V = new Set(['__other', 'upload', 'other', 'image']);
const sortLabel = o => o.textContent.trim().replace(/^the\s+/i, '');
const optCmp = (a, b) => sortLabel(a).localeCompare(sortLabel(b), undefined, {numeric: true, sensitivity: 'base'});
function sortOptionList(parent, isTop){
  const opts = [...parent.children].filter(o => o.tagName === 'OPTION'); if (opts.length < 3) return;
  const top = [], bottom = [], mid = [];
  opts.forEach((o, i) => { const l = o.textContent.trim();
    if (isTop && i === 0 && (o.value === '' || o.value === 'none' || o.value === 'me' || SORT_TOP.test(l))) top.push(o);
    else if (o.value === '' && isTop && SORT_TOP.test(l)) top.push(o);
    else if (SORT_BOTTOM_V.has(o.value) || /^(other|upload|someone else)\b/i.test(l)) bottom.push(o);
    else mid.push(o); });
  // numbers, bonuses and penalties (1, +2, −3, Off) stay in their own order
  if (mid.filter(o => /^[\d+−\-–]/.test(o.textContent.trim()) || /^off$/i.test(o.textContent.trim())).length >= mid.length / 2) return;
  const sorted = [...mid].sort(optCmp); if (sorted.every((o, i) => o === mid[i])) return;
  const first = parent.querySelector(':scope > optgroup'); // keep groups after loose options
  for (const o of [...top, ...sorted]) parent.insertBefore(o, first || null);
  for (const o of bottom) parent.appendChild(o);
}
function sortSelect(sel){
  if (sel.dataset.sorted || sel.matches(SORT_KEEP) || sel.multiple) return; sel.dataset.sorted = '1';
  const v = sel.value; sortOptionList(sel, true); sel.querySelectorAll(':scope > optgroup').forEach(g => sortOptionList(g, false));
  if (sel.value !== v) sel.value = v;
}
function sortSelectsIn(root){ if (!root || !root.querySelectorAll) return; if (root.tagName === 'SELECT') sortSelect(root); root.querySelectorAll('select').forEach(sortSelect); }
new MutationObserver(ms => { for (const m of ms){
  if (m.type === 'childList' && m.target.tagName === 'SELECT'){ delete m.target.dataset.sorted; sortSelect(m.target); continue; } // a menu refilled in place
  m.addedNodes.forEach(n => n.nodeType === 1 && sortSelectsIn(n)); } }).observe(document.documentElement, {childList: true, subtree: true});
document.addEventListener('DOMContentLoaded', () => sortSelectsIn(document.body));
sortSelectsIn(document.body);
