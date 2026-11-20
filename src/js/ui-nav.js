// ===================== SIDEBAR MENU + TURN ORDER IN THE TOP BAR =====================
// The page menu is a sidebar that can be retracted with the ☰ button. Pages with sections
// (Character, Notes) expand to show them. On wide screens it sits beside the page and the
// open/closed choice is remembered; on narrow screens it slides in over the page.
const NAV_PREF = 'ccodex-sidebar', NAVGROUP_PREF = 'ccodex-navgroups';
const NAV_WIDE = '(min-width:901px)';
APP.navGroups = (() => { try { return JSON.parse(localStorage.getItem(NAVGROUP_PREF) || '{}') || {}; } catch { return {}; } })();

const navWide = () => matchMedia(NAV_WIDE).matches;
const sideIsOpen = () => document.body.classList.contains('side-open');
function setSide(open, remember){
  document.body.classList.toggle('side-open', !!open);
  const t = document.getElementById('navToggle'); if (t){ t.setAttribute('aria-expanded', String(!!open)); t.title = open ? 'Hide menu' : 'Show menu'; }
  const s = document.getElementById('sideScrim'); if (s) s.hidden = !(open && !navWide());
  if (remember && navWide()){ try { localStorage.setItem(NAV_PREF, open ? 'open' : 'closed'); } catch {} }
  setTopH();
}
function sideDefault(){ let p = null; try { p = localStorage.getItem(NAV_PREF); } catch {} return navWide() && p !== 'closed'; }
function setTopH(){ const t = document.querySelector('.top'); if (t) document.documentElement.style.setProperty('--toph', (t.offsetHeight || 0) + 'px'); }

function navCount(c, k){
  if (!c) return 0; const a = k === 'companions' ? c.companions : k === 'notes' ? c.notes : ['players', 'npcs', 'locations', 'factions', 'maps'].includes(k) ? c[k] : null;
  return a ? a.length : 0;
}
function renderSidebar(){
  const el = document.getElementById('sidebar'); if (!el) return;
  const c = APP_cur(); const effN = c ? c.effects.filter(e => !e.expired).length : 0;
  const cur = APP.tab, curParent = PARENT[cur] || cur;
  const link = (k, l, cls, extra = '') => `<button class="nv-link ${cls}" data-tab="${k}" ${(cls === 'nv-child' ? cur === k : curParent === k) ? 'aria-current="page"' : ''}><span>${l}</span>${extra}</button>`;
  const items = TABS.map(([k, l]) => {
    const badge = k === 'tracker' && effN ? `<span class="badge" title="${effN} active effect${effN === 1 ? '' : 's'}">${effN}</span>`
      : k === 'options' && typeof UPD !== 'undefined' && UPD.newer() ? `<span class="badge upd" title="Version ${esc(UPD.latest)} is available">New</span>` : '';
    if (!SUBTABS[k]) return `<li>${link(k, l, 'nv-top', badge)}</li>`;
    const open = APP.navGroups[k] != null ? !!APP.navGroups[k] : curParent === k;
    const kids = SUBTABS[k].map(([sk, sl]) => { const n = navCount(c, sk); return `<li>${link(sk, sl, 'nv-child', n ? `<span class="n">${n}</span>` : '')}</li>`; }).join('');
    return `<li class="nv-group ${open ? 'open' : ''}"><div class="nv-head">${link(k, l, 'nv-top', badge)}
      <button class="nv-caret" data-nav="group" data-g="${k}" aria-expanded="${open}" aria-controls="nv-${k}" title="${open ? 'Hide' : 'Show'} ${esc(l)} sections"><span aria-hidden="true">▸</span></button></div>
      <ul class="nv-sub" id="nv-${k}" ${open ? '' : 'hidden'}>${kids}</ul></li>`;
  }).join('');
  el.innerHTML = `<div class="nv-title"><span>Pages</span><button class="btn ghost sm nv-close" data-nav="close" aria-label="Hide menu" title="Hide menu">‹</button></div><ul class="nv-list">${items}</ul>`;
}

// ---- turn order shown in the round box: who is up now, and who is next ----
function initOrder(c){ return [...(c.combat.list || [])].sort((a, b) => num(b.init) - num(a.init) || num(b.mod) - num(a.mod)); }
function renderTurnInfo(){
  const el = document.getElementById('turnInfo'); if (!el) return; const c = APP_cur();
  if (!c){ el.innerHTML = ''; el.hidden = true; return; } el.hidden = false;
  const order = initOrder(c), n = order.length, cb = c.combat;
  const who = x => x ? `<b class="${x.me ? 'me' : ''}">${esc(x.n || 'Unnamed')}</b>${x.init !== '' && x.init != null ? `<span class="rc-init" title="Initiative">${esc(String(x.init))}</span>` : ''}` : '<b class="none">—</b>';
  // with no one in initiative the button just moves the round on (handy for counting down spell durations)
  if (!n){ el.innerHTML = `<button class="rc-empty" data-tab="tracker" title="Open Combat & Effects to add combatants">No one in initiative · <u>add</u></button>
    <button class="btn sm pri" id="rTurn" title="Move to the next round">${cb.round > 0 ? 'Next round' : 'Start'}</button>`; return; }
  const started = cb.round > 0, i = started ? cb.turn % n : 0, now = order[i], next = n > 1 ? order[(i + 1) % n] : null;
  el.innerHTML = `<div class="rc-lines" data-tab="tracker" title="Open the initiative order">
      <div class="rc-line"><span class="k">${started ? 'Now' : 'First'}</span>${who(now)}</div>
      <div class="rc-line nx"><span class="k">Next</span>${next ? who(next) : '<b class="none">—</b>'}</div></div>
    <button class="btn sm pri" id="rTurn" title="${started ? 'End this turn and move to the next in initiative' : 'Start combat at round 1'}">${started ? 'Next turn' : 'Start'}</button>`;
}

document.addEventListener('click', e => {
  if (e.target.closest('#navToggle')){ setSide(!sideIsOpen(), true); return; }
  if (e.target.closest('#sideScrim')){ setSide(false); return; }
  const b = e.target.closest('[data-nav]');
  if (b){ e.preventDefault();
    if (b.dataset.nav === 'close'){ setSide(false, true); document.getElementById('navToggle').focus(); return; }
    if (b.dataset.nav === 'group'){ const g = b.dataset.g; const open = APP.navGroups[g] != null ? !!APP.navGroups[g] : (PARENT[APP.tab] || APP.tab) === g;
      APP.navGroups[g] = !open; try { localStorage.setItem(NAVGROUP_PREF, JSON.stringify(APP.navGroups)); } catch {} renderSidebar(); const f = document.querySelector(`[data-nav="group"][data-g="${g}"]`); if (f) f.focus(); return; }
  }
  if (e.target.closest('#rTurn')){ const c = APP_cur(); if (!c) return; ACT.nextTurn(c); markDirty(); renderAll(); return; }
  // picking a page in the slide-in menu closes it (on wide screens it stays put)
  if (e.target.closest('#sidebar [data-tab]') && !navWide()) setTimeout(() => setSide(false), 0);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && sideIsOpen() && !navWide() && !document.querySelector('#modalRoot .modal') && !APP.startOpen) setSide(false); });
let navWasWide = navWide();
window.addEventListener('resize', () => { const w = navWide(); if (w !== navWasWide){ navWasWide = w; setSide(sideDefault()); } setTopH(); });
