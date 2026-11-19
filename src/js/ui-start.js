// ===================== START SCREEN =====================
// Shown when the app opens (can be turned off in Options) and whenever the title is clicked:
// Continue · New Character · Load Character · Options.
const START_PREF = 'ccodex-start', THEME_PREF = 'ccodex-theme';
const startPrefOn = () => { try { return localStorage.getItem(START_PREF) !== 'off'; } catch { return true; } };
APP.startView = 'menu'; APP.startQ = ''; APP.startSort = 'recent';

// ---- appearance (also the base the class/race themes will build on) ----
function applyTheme(t){ t = t || 'auto'; if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); if (window.THEMES_READY && document.body) applyCharTheme(APP_cur()); }
function themePref(){ try { return localStorage.getItem(THEME_PREF) || 'auto'; } catch { return 'auto'; } }
applyTheme(themePref());

const START_LOGO = `<svg class="start-logo" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="none" stroke="currentColor" stroke-width="5"/>
  <polygon points="50,6 85,70 15,70" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".7"/><text x="50" y="62" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="34" fill="currentColor">C</text></svg>`;

function charSummary(c){ return [c.race, c.classes.map(k => `${k.n} ${k.lvl}`).join(' / ')].filter(Boolean).join(' '); }
function whenText(t){
  if (!t) return 'never opened'; const d = new Date(t), now = new Date(); const day = 864e5;
  const days = Math.floor((new Date(now.toDateString()) - new Date(d.toDateString())) / day);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : days < 7 ? `${days} days ago` : d.toLocaleDateString(undefined, {day: 'numeric', month: 'short', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric'});
}
const lastPlayed = c => c.lastOpened || c.updatedAt || 0;
function lastCharacter(){ const list = Object.values(APP.chars); return APP.chars[APP.curId] || list.sort((a, b) => lastPlayed(b) - lastPlayed(a))[0] || null; }
function portraitThumb(c, cls = ''){ const src = c.portrait ? IMG.src(c.portrait) : ''; return src ? `<img class="st-pic ${cls}" src="${src}" alt="">` : `<span class="st-pic st-ph ${cls}">${esc((c.name || '?').slice(0, 1).toUpperCase())}</span>`; }

function openCharacter(id){ const c = APP.chars[id]; if (!c) return; APP.curId = id; c.lastOpened = Date.now(); APP.tab = 'sheet'; markDirty(id); closeStart(); renderAll(); window.scrollTo({top: 0}); }

function startMenu(){
  const last = lastCharacter(), n = Object.keys(APP.chars).length;
  const item = (act, title, sub, extra = '') => `<button class="st-item ${extra}" data-st="${act}"><b>${title}</b><span>${sub}</span></button>`;
  return `<nav class="st-menu" aria-label="Start">
    ${last ? `<button class="st-item st-continue" data-st="continue">${portraitThumb(last)}<span class="st-cont-t"><b>Continue</b><span>${esc(last.name || 'Unnamed')} · ${esc(charSummary(last))}</span><span class="st-rs">${esc(rsOf(last).short)} · last played ${esc(whenText(lastPlayed(last)))}</span></span></button>` : ''}
    ${item('new', 'New Character', 'Choose a ruleset, race and class to begin')}
    ${item('load', 'Load Character', n ? `${n} character${n === 1 ? '' : 's'} saved on this device` : 'Open a saved character or import one')}
    ${item('options', 'Options', 'Appearance, backups, install and more')}
  </nav>`;
}
function startLoad(){
  const q = (APP.startQ || '').toLowerCase();
  let list = Object.values(APP.chars).filter(c => !q || `${c.name} ${charSummary(c)} ${c.campaign || ''} ${c.player || ''}`.toLowerCase().includes(q));
  list.sort(APP.startSort === 'name' ? (a, b) => (a.name || '').localeCompare(b.name || '') : (a, b) => lastPlayed(b) - lastPlayed(a));
  const cards = list.map(c => `<button class="st-card ${c.id === APP.curId ? 'cur' : ''}" data-st="open" data-id="${c.id}">${portraitThumb(c, 'big')}
      <span class="st-card-t"><b>${esc(c.name || 'Unnamed')}</b><span>${esc(charSummary(c))}</span>
      <span class="st-card-m"><span class="pill">${esc(rsOf(c).short)}</span>${c.campaign ? `<span class="hint">${esc(c.campaign)}</span>` : ''}</span>
      <span class="hint">Last played ${esc(whenText(lastPlayed(c)))}</span></span></button>`).join('');
  return `<div class="st-page"><div class="st-head"><button class="btn sm" data-st="menu">‹ Back</button><h2>Load Character</h2><span></span></div>
    <div class="row st-tools"><input type="search" id="st-q" placeholder="Search by name, class or campaign…" value="${esc(APP.startQ || '')}" aria-label="Search characters">
      <select id="st-sort" aria-label="Sort"><option value="recent" ${APP.startSort !== 'name' ? 'selected' : ''}>Last played</option><option value="name" ${APP.startSort === 'name' ? 'selected' : ''}>Name</option></select>
      <label class="btn sm" for="impFile">Import…</label></div>
    <div class="st-cards">${cards || `<div class="empty">${q ? 'No characters match that search.' : 'No characters yet. Choose <b>New Character</b> or import one.'}</div>`}</div></div>`;
}
function startOptions(){
  const t = themePref(), inst = document.getElementById('installApp'); const canInstall = inst && !inst.hidden;
  const n = Object.keys(APP.chars).length;
  return `<div class="st-page"><div class="st-head"><button class="btn sm" data-st="menu">‹ Back</button><h2>Options</h2><span></span></div>
    <section class="st-opt"><h3>Appearance</h3><div class="seg" role="radiogroup" aria-label="Appearance">${[['auto', 'Match my device'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<button class="${t === v ? 'on' : ''}" data-st="theme" data-v="${v}" role="radio" aria-checked="${t === v}">${l}</button>`).join('')}</div>
      <p class="hint">Each character's theme (colours, fonts, borders and background) is on the <b>Options</b> page in the menu.</p></section>
    <section class="st-opt"><h3>Start screen</h3><label class="mini"><input type="checkbox" id="st-pref" ${startPrefOn() ? 'checked' : ''}> Show this screen when the app opens</label>
      <p class="hint">You can always get back here by clicking <b>Character Codex</b> at the top of the app.</p></section>
    <section class="st-opt"><h3>Backups</h3><p class="hint" style="margin-top:0">Your characters are saved on this device. A backup file holds every character, your homebrew and all pictures, so you can keep a copy or move everything to another device.</p>
      <div class="row"><button class="btn" data-st="backup" ${n ? '' : 'disabled'}>Back up all ${n} character${n === 1 ? '' : 's'}</button><label class="btn" for="impFile">Restore or import…</label></div></section>
    <section class="st-opt st-saveloc">${saveLocationBlock()}</section>
    ${canInstall ? `<section class="st-opt"><h3>Install</h3><p class="hint" style="margin-top:0">Install Character Codex as an app on this device, with its own icon and offline use.</p><button class="btn" data-st="install">Install app</button></section>` : ''}
    <section class="st-opt"><h3>About</h3><p class="hint" style="margin-top:0">Character Codex is free and open source (MIT licence). Rules text is Open Game Content from the System Reference Document, used under the Open Game License v1.0a. Not affiliated with, endorsed or sponsored by Wizards of the Coast. Rulesets available: ${RULESETS.filter(r => r.ready).map(r => esc(r.short)).join(', ')}; coming later: ${RULESETS.filter(r => !r.ready).map(r => esc(r.short)).join(', ')}.</p>
      <a class="btn sm" href="https://github.com/Jak2mm/character-codex" target="_blank" rel="noopener">Project page</a></section>
  </div>`;
}
function renderStart(){
  const el = document.getElementById('startScreen'); if (!el) return;
  const body = APP.startView === 'load' ? startLoad() : APP.startView === 'options' ? startOptions() : startMenu();
  el.innerHTML = `<div class="st-wrap"><header class="st-brand">${START_LOGO}<h1>Character Codex</h1><p>Character sheets for open-rules tabletop games</p></header>
    <main class="st-body">${body}</main>
    <footer class="st-foot">${APP_cur() && APP.startView === 'menu' ? '<span>Press <kbd>Esc</kbd> to continue</span>' : '<span></span>'}<span>Open Game Content · OGL v1.0a</span></footer></div>`;
}
function openStart(view = 'menu'){ APP.startView = view; APP.startOpen = true; hideTip && hideTip(); renderStart(); const el = document.getElementById('startScreen'); el.hidden = false; document.body.classList.add('st-open');
  setTimeout(() => { const f = el.querySelector(view === 'load' ? '#st-q' : '.st-item'); if (f) f.focus(); }, 30); }
function closeStart(){ APP.startOpen = false; const el = document.getElementById('startScreen'); if (el) el.hidden = true; document.body.classList.remove('st-open'); }

// back up everything (all characters, homebrew and pictures) into one file
async function backupAll(){
  const chars = Object.values(APP.chars); const images = {}; chars.forEach(c => IMG.keysOf(c).forEach(k => { const d = IMG.src(k); if (d) images[k] = d; }));
  const data = JSON.stringify({format: 'charactercodex-backup', version: 1, saved: new Date().toISOString(), characters: chars, library: APP.lib.entries, images});
  const r = await saveTextFile(`character-codex-backup-${new Date().toISOString().slice(0, 10)}.json`, data);
  if (r !== 'cancelled') toast(`Backed up ${chars.length} character${chars.length === 1 ? '' : 's'}, your homebrew and pictures.`);
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-st]'); if (!b) return; e.preventDefault(); const a = b.dataset.st;
  if (a === 'continue'){ const c = lastCharacter(); if (c) openCharacter(c.id); return; }
  if (a === 'new'){ closeStart(); openNewCharacter(() => openStart('menu')); return; }
  if (a === 'load' || a === 'options' || a === 'menu'){ APP.startView = a; renderStart(); const f = document.querySelector(a === 'load' ? '#st-q' : '#startScreen .st-item, #startScreen [data-st="menu"]'); if (f) f.focus(); return; }
  if (a === 'open'){ openCharacter(b.dataset.id); return; }
  if (a === 'theme'){ try { localStorage.setItem(THEME_PREF, b.dataset.v); } catch {} applyTheme(b.dataset.v); renderStart(); return; }
  if (a === 'backup'){ backupAll(); return; }
  if (a === 'install'){ const i = document.getElementById('installApp'); if (i) i.click(); return; }
});
document.addEventListener('input', e => { if (e.target.id !== 'st-q') return; APP.startQ = e.target.value; const pos = e.target.selectionStart; renderStart(); const q = document.getElementById('st-q'); if (q){ q.focus(); q.setSelectionRange(pos, pos); } });
document.addEventListener('change', e => {
  if (e.target.id === 'st-sort'){ APP.startSort = e.target.value; renderStart(); }
  if (e.target.id === 'st-pref'){ try { localStorage.setItem(START_PREF, e.target.checked ? 'on' : 'off'); } catch {} toast(e.target.checked ? 'The start screen will show when the app opens.' : 'The app will open straight to your last character.'); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && APP.startOpen && !document.querySelector('#modalRoot .modal')){ if (APP.startView !== 'menu'){ APP.startView = 'menu'; renderStart(); } else if (APP_cur()) closeStart(); } });
// the title in the top bar opens the start screen
document.addEventListener('click', e => { if (e.target.closest('.brand h1')){ e.preventDefault(); openStart('menu'); } });
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.brand h1')){ e.preventDefault(); openStart('menu'); } });
