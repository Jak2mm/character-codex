// ===================== UPDATES AND CHANGE LOG =====================
// APP_VERSION and CHANGELOG are built into the page from src/changelog.json (tools/build.py).
//   Website / installed web app: version.json on the website says what the newest version is.
//     Update reloads the page, which fetches the new version.
//   Windows, Mac and Android apps: the newest GitHub Release says what the newest installer is.
//     Update opens that release's download page.
const UPD_REPO = 'Jak2mm/character-codex', UPD_SITE = 'https://jak2mm.github.io/character-codex/';
const UPD_KEY = 'ccodex-update', UPD_EVERY = 6 * 3600e3;

const UPD = {
  latest: null, url: '', notes: null, checked: 0, state: 'idle', err: '', // idle | checking | ok | error
  // where this copy came from decides where updates come from
  kind(){ if (window.claude) return null; if (NATIVE.any) return 'app'; return /^https?:$/.test(location.protocol) ? 'web' : 'file'; },
  newer(){ return !!(UPD.latest && verCmp(UPD.latest, APP_VERSION) > 0); },
  load(){ try { const s = JSON.parse(localStorage.getItem(UPD_KEY) || 'null'); if (s && s.for === APP_VERSION) Object.assign(UPD, {latest: s.latest, url: s.url || '', notes: s.notes || null, checked: s.checked || 0, told: s.told}); } catch {} },
  save(){ try { localStorage.setItem(UPD_KEY, JSON.stringify({for: APP_VERSION, latest: UPD.latest, url: UPD.url, notes: UPD.notes, checked: UPD.checked, told: UPD.told})); } catch {} },

  async check(quiet){
    const k = UPD.kind(); if (!k) return;
    UPD.state = 'checking'; if (!quiet) refreshUpdateUI();
    try {
      if (k === 'app'){
        const r = await fetch(`https://api.github.com/repos/${UPD_REPO}/releases/latest`, {cache: 'no-store', headers: {Accept: 'application/vnd.github+json'}});
        if (r.status === 404){ UPD.latest = APP_VERSION; UPD.url = ''; } // no installers published yet
        else { if (!r.ok) throw new Error('GitHub answered ' + r.status); const j = await r.json(); UPD.latest = String(j.tag_name || '').replace(/^v/i, '') || APP_VERSION; UPD.url = j.html_url || `https://github.com/${UPD_REPO}/releases/latest`; }
        // the website's change log describes what's new
        try { const v = await (await fetch(UPD_SITE + 'version.json?' + Date.now(), {cache: 'no-store'})).json(); UPD.notes = v.changelog || null; } catch {}
      } else {
        const base = k === 'web' && /github\.io$/.test(location.hostname) ? new URL('version.json', location.href).href : UPD_SITE + 'version.json';
        const r = await fetch(base + '?' + Date.now(), {cache: 'no-store'}); if (!r.ok) throw new Error('The website answered ' + r.status);
        const v = await r.json(); UPD.latest = v.version; UPD.notes = v.changelog || null; UPD.url = UPD_SITE;
      }
      UPD.checked = Date.now(); UPD.state = 'ok'; UPD.err = ''; UPD.save();
    } catch (e){ UPD.state = 'error'; UPD.err = navigator.onLine === false ? 'You\'re offline.' : String(e && e.message || 'Couldn\'t reach GitHub.'); }
    refreshUpdateUI();
    if (UPD.newer() && UPD.told !== UPD.latest){ UPD.told = UPD.latest; UPD.save();
      toast(`Version <b>${esc(UPD.latest)}</b> is available. <a href="#" data-upd="go">Update</a> · <a href="#" data-upd="log">What's new</a>`); }
  },

  async go(){
    const k = UPD.kind();
    if (k === 'app'){ return openLink(UPD.url || `https://github.com/${UPD_REPO}/releases/latest`); }
    if (k === 'file'){ return openLink(UPD_SITE); }
    // website: fetch the new page (the offline copy updates itself) and reload
    toast('Updating…');
    try { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); } catch {}
    try { await fetch('index.html', {cache: 'reload'}); } catch {}
    setTimeout(() => location.reload(), 300);
  },
};

// compare version numbers like 1.4.0 and 1.10.2
function verCmp(a, b){ const x = String(a).split('.').map(n => parseInt(n, 10) || 0), y = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(x.length, y.length); i++){ const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0 ? 1 : -1; } return 0; }

// open a web page in the browser (the desktop app asks Windows/macOS to open it)
async function openLink(url){
  const inv = typeof TAURI_INVOKE === 'function' && TAURI_INVOKE();
  if (NATIVE.windows && inv){ try { await inv('open_link', {url}); return; } catch {} }
  const w = window.open(url, '_blank', 'noopener'); if (!w) location.href = url;
}

// ---------- what Options shows ----------
function updateStatusLine(){
  const k = UPD.kind(); if (!k) return '';
  if (UPD.state === 'checking') return 'Checking…';
  if (UPD.newer()) return `Version ${esc(UPD.latest)} available`;
  if (UPD.latest) return 'Current';
  if (UPD.state === 'error') return 'Couldn\'t check';
  return 'Not checked yet';
}
function updatesBlock(){
  const k = UPD.kind();
  if (!k) return `<div><div class="cap">Version</div><p class="hint" style="margin:4px 0 0">Character Codex ${esc(APP_VERSION)}.</p></div>`;
  const ago = UPD.checked ? (() => { const m = Math.round((Date.now() - UPD.checked) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(UPD.checked).toLocaleDateString(); })() : '';
  const how = k === 'app' ? `Update opens the download page for the new ${NATIVE.android ? 'Android app' : NATIVE.mac ? 'Mac app' : 'installer'}. Install it over this one; your characters stay.`
    : k === 'file' ? 'This copy was opened from a file. Update opens the website, where you can download the newest copy.'
    : 'Update reloads the app with the newest version. Your characters stay.';
  const status = UPD.newer() ? `<div class="upd-box new"><b>Version ${esc(UPD.latest)} is available</b><span class="hint">You have ${esc(APP_VERSION)}. ${how}</span></div>`
    : UPD.state === 'error' ? `<div class="upd-box err"><b>Couldn't check for updates</b><span class="hint">${esc(UPD.err)}</span></div>`
    : UPD.latest ? `<div class="upd-box"><b>You have the newest version (${esc(APP_VERSION)})</b><span class="hint">Checked ${ago}.</span></div>` : '';
  return `<div><div class="cap">Updates</div>${status}<div class="row" style="margin-top:6px">
      ${UPD.newer() ? '<button class="btn sm pri" data-upd="go">Update</button>' : ''}<button class="btn sm" data-upd="check" ${UPD.state === 'checking' ? 'disabled' : ''}>${UPD.state === 'checking' ? 'Checking…' : 'Check for updates'}</button><button class="btn sm ghost" data-upd="log">Change log</button></div></div>`;
}
// newest first; entries newer than this copy (from the website) are marked "new"
function changelogEntries(){
  const mine = new Map(CHANGELOG.map(e => [e.v, e])); const all = [...CHANGELOG];
  for (const e of UPD.notes || []) if (e && e.v && !mine.has(e.v)) all.push(e);
  return all.sort((a, b) => verCmp(b.v, a.v));
}
function changelogBlock(limit = 99){
  return `<div class="chlog">${changelogEntries().slice(0, limit).map((e, i) => { const isNew = verCmp(e.v, APP_VERSION) > 0, isMine = e.v === APP_VERSION;
    return `<details ${i < 1 || isNew ? 'open' : ''}><summary><b>${esc(e.v)}</b>${e.title ? ` · ${esc(e.title)}` : ''}<span class="hint"> ${esc(e.date || '')}</span>${isNew ? ' <span class="pill acc">new</span>' : isMine ? ' <span class="pill">your version</span>' : ''}</summary>
      <ul>${(e.items || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul></details>`; }).join('')}</div>`;
}
// the footer: this version, and under it the newest version or "Current"
function versionFooter(){
  const s = updateStatusLine();
  return `<footer class="ver-foot"><span>Character Codex <b>${esc(APP_VERSION)}</b></span>${s ? `<span class="ver-sub ${UPD.newer() ? 'new' : ''}">${UPD.newer() ? `<a href="#" data-upd="go">${s}</a>` : s}</span>` : ''}</footer>`;
}
function openChangelog(){
  openModal(`<div class="modal"><div class="mh"><h3>Change log</h3><button class="btn ghost" data-close>Close</button></div><div class="mform">${changelogBlock()}</div></div>`);
}
function refreshUpdateUI(){ if (APP.tab === 'options' && APP_cur()) renderAll(); else renderSidebar(); if (APP.startOpen && APP.startView === 'options') renderStart(); }

document.addEventListener('click', e => {
  const b = e.target.closest('[data-upd]'); if (!b) return; e.preventDefault(); const a = b.dataset.upd;
  if (a === 'check') UPD.check(false); else if (a === 'go') UPD.go(); else if (a === 'log') openChangelog();
});
UPD.load();
// check shortly after start-up, then every few hours while the app is open
function updAuto(){ if (UPD.kind() && Date.now() - UPD.checked > UPD_EVERY && navigator.onLine !== false) UPD.check(true); }
setTimeout(updAuto, 4000); setInterval(updAuto, 3600e3);
// in the desktop app, web links open in the normal browser (the app window can't show other websites)
document.addEventListener('click', e => {
  if (!NATIVE.windows || e.defaultPrevented) return; const a = e.target.closest('a[href^="http"]'); if (!a) return;
  e.preventDefault(); openLink(a.href);
});
