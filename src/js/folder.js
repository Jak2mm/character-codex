// ===================== SAVE LOCATION (a folder of the player's choice) =====================
// Characters are always saved inside the app on this device. With a Save location chosen, they
// are also kept in a folder (a NAS, Dropbox, OneDrive or iCloud Drive folder), and the folder is
// read back when the app opens and whenever it comes back to the front, so two computers sharing
// the folder see each other's changes. The newest edit of each character wins.
//   Windows and Mac apps: native file commands (native/tauri/src-tauri/src/main.rs).
//   Chrome and Edge on a computer: the browser's folder access (asks once each visit).
// Inside the chosen folder everything goes in a "Character Codex" folder:
//   characters/<Name> - <id>.json   one per character (the same format as Export)
//   pictures/<key>.txt              portraits, maps and other pictures
//   homebrew.json                   the Custom Library
//   deleted.json                    characters deleted on any device, so they stay deleted
const FOLDER_KEY = 'ccodex-folder', DELETED_KEY = 'ccodex-deleted', FOLDER_SUB = 'Character Codex';
const TAURI_INVOKE = () => (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke) || (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) || null;

const FOLDER = {
  cfg: null,          // {kind:'native', path} or {kind:'browser', name}
  handle: null,       // browser: the folder handle
  state: 'off',       // off | ok | busy | needs-permission | missing | error
  msg: '', lastSync: 0, files: {}, chain: Promise.resolve(), timer: null,

  // ---------- what this device can do ----------
  kind(){ if (window.claude) return null; if (NATIVE.windows && TAURI_INVOKE()) return 'native';
    if (!NATIVE.android && typeof window.showDirectoryPicker === 'function' && window.top === window) return 'browser'; return null; },
  on(){ return !!(FOLDER.cfg && (FOLDER.state === 'ok' || FOLDER.state === 'busy')); },
  label(){ const c = FOLDER.cfg; if (!c) return ''; return c.kind === 'native' ? c.path : c.name; },

  // ---------- the file operations, for either kind ----------
  async sub(create = true){ // browser: the Character Codex folder handle (or a subfolder of it)
    const h = FOLDER.handle; return h.name === FOLDER_SUB ? h : h.getDirectoryHandle(FOLDER_SUB, {create}); },
  async dirH(dir, create){ let d = await FOLDER.sub(create); for (const p of dir.split('/').filter(Boolean)) d = await d.getDirectoryHandle(p, {create}); return d; },
  root(){ const p = FOLDER.cfg.path, sep = p.includes('\\') && !p.includes('/') ? '\\' : '/'; const last = p.split(/[\\/]/).filter(Boolean).pop();
    return last === FOLDER_SUB ? p : p.replace(/[\\/]+$/, '') + sep + FOLDER_SUB; },
  async list(dir){
    if (FOLDER.cfg.kind === 'native') return TAURI_INVOKE()('folder_list', {root: FOLDER.root(), dir});
    let d; try { d = await FOLDER.dirH(dir, false); } catch (e){ if (e && e.name === 'NotFoundError') return []; throw e; }
    const out = []; for await (const [n, h] of d.entries()) if (h.kind === 'file') out.push(n); return out;
  },
  async read(path){
    if (FOLDER.cfg.kind === 'native') return TAURI_INVOKE()('folder_read', {root: FOLDER.root(), path});
    const parts = path.split('/'), name = parts.pop();
    try { const d = await FOLDER.dirH(parts.join('/'), false); return await (await (await d.getFileHandle(name)).getFile()).text(); }
    catch (e){ if (e && (e.name === 'NotFoundError' || e.name === 'TypeMismatchError')) return null; throw e; }
  },
  async write(path, data){
    if (FOLDER.cfg.kind === 'native') return TAURI_INVOKE()('folder_write', {root: FOLDER.root(), path, data});
    const parts = path.split('/'), name = parts.pop(); const d = await FOLDER.dirH(parts.join('/'), true);
    const w = await (await d.getFileHandle(name, {create: true})).createWritable(); await w.write(data); await w.close();
  },
  async remove(path){
    if (FOLDER.cfg.kind === 'native') return TAURI_INVOKE()('folder_remove', {root: FOLDER.root(), path});
    const parts = path.split('/'), name = parts.pop();
    try { const d = await FOLDER.dirH(parts.join('/'), false); await d.removeEntry(name); } catch (e){ if (!(e && e.name === 'NotFoundError')) throw e; }
  },

  // ---------- names ----------
  charFile(c){ const n = String(c.name || 'Character').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, ' ').slice(0, 40) || 'Character'; return `${n} - ${c.id}.json`; },
  idOfFile(f){ const m = /(c-[\w-]+)\.json$/.exec(f); return m ? m[1] : null; },
  deleted(){ try { return JSON.parse(localStorage.getItem(DELETED_KEY) || '{}') || {}; } catch { return {}; } },
  setDeleted(d){ const e = Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 500); try { localStorage.setItem(DELETED_KEY, JSON.stringify(Object.fromEntries(e))); } catch {} },

  // run one folder job at a time
  run(fn){ const p = FOLDER.chain.then(fn, fn); FOLDER.chain = p.catch(() => {}); return p; },

  // ---------- start-up ----------
  async init(){
    try { FOLDER.cfg = JSON.parse(localStorage.getItem(FOLDER_KEY) || 'null'); } catch {}
    const k = FOLDER.kind(); if (!k || !FOLDER.cfg || FOLDER.cfg.kind !== k){ FOLDER.cfg = null; FOLDER.state = 'off'; return; }
    if (k === 'browser'){
      FOLDER.handle = await IDB.getMeta('folder').catch(() => null);
      if (!FOLDER.handle){ FOLDER.state = 'off'; return; }
      const p = await FOLDER.handle.queryPermission({mode: 'readwrite'}).catch(() => 'denied');
      if (p !== 'granted'){ FOLDER.state = 'needs-permission'; FOLDER.status(); return; }
    }
    await FOLDER.sync('open');
  },

  // ---------- choosing, reconnecting, stopping ----------
  async choose(){
    const k = FOLDER.kind(); if (!k) return;
    try {
      if (k === 'native'){ const p = await TAURI_INVOKE()('folder_pick'); if (!p) return; FOLDER.cfg = {kind: 'native', path: p}; }
      else { const h = await window.showDirectoryPicker({id: 'ccodex', mode: 'readwrite', startIn: 'documents'}); FOLDER.handle = h; await IDB.putMeta('folder', h); FOLDER.cfg = {kind: 'browser', name: h.name}; }
    } catch (e){ if (e && e.name === 'AbortError') return; toast('That folder couldn\'t be used. ' + esc(e && e.message || ''), 'warn'); return; }
    try { localStorage.setItem(FOLDER_KEY, JSON.stringify(FOLDER.cfg)); } catch {}
    FOLDER.lastSync = 0; const r = await FOLDER.sync('choose');
    if (FOLDER.state === 'ok') toast(`Saving to <b>${esc(FOLDER.label())}</b>.${r && r.pulled ? ` Loaded ${r.pulled} character${r.pulled === 1 ? '' : 's'} already in the folder.` : ''}`);
    rerenderOptions();
  },
  async reconnect(){
    if (!FOLDER.handle) return FOLDER.choose();
    const p = await FOLDER.handle.requestPermission({mode: 'readwrite'}).catch(() => 'denied');
    if (p !== 'granted'){ toast('The browser needs permission to use that folder. Choose it again, or stop using a folder.', 'warn'); return; }
    await FOLDER.sync('reconnect'); rerenderOptions();
  },
  stop(){
    FOLDER.cfg = null; FOLDER.handle = null; FOLDER.state = 'off'; FOLDER.files = {};
    try { localStorage.removeItem(FOLDER_KEY); } catch {} IDB.delMeta('folder').catch(() => {});
    setSync('local', 'Saved on this device'); toast('Characters are now saved on this device only. The files in the folder are left as they are.'); rerenderOptions();
  },

  // ---------- read the folder and merge it with this device ----------
  sync(why){ return FOLDER.run(() => FOLDER._sync(why)); },
  async _sync(why){
    if (!FOLDER.cfg) return;
    if (FOLDER.cfg.kind === 'native' && !(await TAURI_INVOKE()('folder_check', {root: FOLDER.cfg.path}).catch(() => false))){
      FOLDER.state = 'missing'; FOLDER.status(); return; }
    FOLDER.state = 'busy'; FOLDER.status();
    const out = {pulled: 0, pushed: 0, removed: 0};
    try {
      // deletions from any device
      const del = FOLDER.deleted(); let remoteDel = {}; try { remoteDel = JSON.parse(await FOLDER.read('deleted.json') || '{}') || {}; } catch {}
      for (const [id, t] of Object.entries(remoteDel)) if (!del[id] || del[id] < t) del[id] = t;
      FOLDER.setDeleted(del);
      // characters
      const names = (await FOLDER.list('characters')).filter(f => f.endsWith('.json')); const files = {}, folderAt = {};
      for (const f of names){ const id = FOLDER.idOfFile(f); if (id) (files[id] = files[id] || []).push(f); }
      let curChanged = false, listChanged = false;
      for (const [id, fs] of Object.entries(files)){
        if (del[id]){ for (const f of fs) await FOLDER.remove('characters/' + f); if (APP.chars[id]){ delete APP.chars[id]; APP.dirty.delete(id); out.removed++; listChanged = true; if (id === APP.curId) curChanged = true; } continue; }
        let best = null; for (const f of fs){ try { const j = JSON.parse(await FOLDER.read('characters/' + f) || 'null'); const ch = j && (j.character || (j.abil ? j : null));
          if (ch && ch.id === id && (!best || (ch.updatedAt || 0) > (best.c.updatedAt || 0))) best = {c: ch, f}; } catch {} }
        if (!best) continue;
        folderAt[id] = best.c.updatedAt || 0; FOLDER.files[id] = best.f; for (const f of fs) if (f !== best.f) await FOLDER.remove('characters/' + f).catch(() => {});
        const loc = APP.chars[id];
        if (!loc || (!APP.dirty.has(id) && (best.c.updatedAt || 0) > (loc.updatedAt || 0))){
          APP.chars[id] = migrate(clone(best.c)); out.pulled++; if (id === APP.curId) curChanged = true; else listChanged = true; }
      }
      // this device's characters that the folder hasn't got (or has an older copy of)
      for (const c of Object.values(APP.chars)){
        if (del[c.id]){ delete APP.chars[c.id]; out.removed++; listChanged = true; if (c.id === APP.curId) curChanged = true; continue; }
        if (c.example) continue; // the sample character stays on each device
        if (!(c.id in folderAt) || APP.dirty.has(c.id) || (c.updatedAt || 0) > folderAt[c.id]){ await FOLDER.putChar(c); out.pushed++; }
      }
      // homebrew
      let lib = null; try { lib = JSON.parse(await FOLDER.read('homebrew.json') || 'null'); } catch {}
      if (lib && Array.isArray(lib.entries) && !APP.libDirty && (lib.updatedAt || 0) > (APP.lib.updatedAt || 0)){ APP.lib = {entries: lib.entries, updatedAt: lib.updatedAt}; listChanged = true; }
      else if (!lib || (APP.lib.updatedAt || 0) > (lib.updatedAt || 0)) await FOLDER.putLib();
      if (Object.keys(del).length) await FOLDER.write('deleted.json', JSON.stringify(del));
      // pictures: fetch the ones this device is missing, add the ones the folder is missing
      const have = new Set((await FOLDER.list('pictures')).map(f => f.replace(/\.txt$/, '')));
      const need = new Set(); Object.values(APP.chars).forEach(c => IMG.keysOf(c).forEach(k => need.add(k)));
      for (const k of need){
        if (!/^img-[\w-]+$/.test(k)) continue;
        if (IMG.cache[k] && !have.has(k)) await FOLDER.write(`pictures/${k}.txt`, IMG.cache[k]);
        else if (!IMG.cache[k] && have.has(k)){ const d = await FOLDER.read(`pictures/${k}.txt`); if (d && d.startsWith('data:')){ IMG.cache[k] = d; IDB.put(k, d).catch(() => {}); curChanged = true; } }
      }
      // keep this device's own copy up to date
      if (!APP.chars[APP.curId]) APP.curId = (charList()[0] || {}).id || null;
      lsSet(LS_KEY, {chars: APP.chars, lib: APP.lib, curId: APP.curId});
      FOLDER.state = 'ok'; FOLDER.msg = ''; FOLDER.lastSync = Date.now(); FOLDER.status();
      if (curChanged){ const ae = document.activeElement; if (ae && ae.matches('input,textarea,select') && $('#main').contains(ae)) APP.remoteQueue = true; else renderAll(); }
      else if (listChanged) renderCharBar();
      if (APP.startOpen && (curChanged || listChanged)) renderStart();
      return out;
    } catch (e){
      if (e && e.name === 'NotAllowedError'){ FOLDER.state = 'needs-permission'; }
      else { FOLDER.state = 'error'; FOLDER.msg = String(e && e.message || e || ''); }
      FOLDER.status(); return out;
    }
  },

  // ---------- writing ----------
  async putChar(c){
    const f = FOLDER.charFile(c), old = FOLDER.files[c.id];
    await FOLDER.write('characters/' + f, JSON.stringify({format: 'charactercodex', version: 3, character: c}, null, 1));
    if (old && old !== f) await FOLDER.remove('characters/' + old).catch(() => {});
    FOLDER.files[c.id] = f;
  },
  putLib(){ return FOLDER.write('homebrew.json', JSON.stringify({format: 'charactercodex-homebrew', updatedAt: APP.lib.updatedAt || Date.now(), entries: APP.lib.entries || []}, null, 1)); },
  // called from flush() with what just changed
  afterSave(ids, lib, imgs, gone){
    if (!FOLDER.on()) return;
    FOLDER.run(async () => {
      if (!FOLDER.on()) return;
      try {
        for (const k of imgs) if (IMG.cache[k] && /^img-[\w-]+$/.test(k)) await FOLDER.write(`pictures/${k}.txt`, IMG.cache[k]);
        for (const k of gone) if (/^img-[\w-]+$/.test(k)) await FOLDER.remove(`pictures/${k}.txt`);
        for (const id of ids) if (APP.chars[id] && !APP.chars[id].example) await FOLDER.putChar(APP.chars[id]);
        if (lib) await FOLDER.putLib();
        FOLDER.state = 'ok'; FOLDER.lastSync = Date.now(); FOLDER.status();
      } catch (e){
        ids.forEach(i => APP.dirty.add(i)); if (lib) APP.libDirty = true;
        if (e && e.name === 'NotAllowedError') FOLDER.state = 'needs-permission'; else { FOLDER.state = 'error'; FOLDER.msg = String(e && e.message || e || ''); }
        FOLDER.status();
      }
    });
  },
  // a character was deleted on this device
  forget(id){
    const d = FOLDER.deleted(); d[id] = Date.now(); FOLDER.setDeleted(d);
    if (!FOLDER.on()) return; const f = FOLDER.files[id];
    FOLDER.run(async () => { try { if (f) await FOLDER.remove('characters/' + f); await FOLDER.write('deleted.json', JSON.stringify(FOLDER.deleted())); delete FOLDER.files[id]; } catch {} });
  },

  // ---------- the little "Saved" label at the top ----------
  status(){
    const s = FOLDER.state, n = FOLDER.label();
    if (s === 'ok') setSync('ok', 'Saved to folder');
    else if (s === 'busy') setSync('busy', 'Syncing folder…');
    else if (s === 'needs-permission') setSync('warn', 'Folder: allow access');
    else if (s === 'missing') setSync('warn', 'Folder not found');
    else if (s === 'error') setSync('warn', 'Folder: not saved');
    const el = document.getElementById('sync'); if (el) el.title = s === 'off' ? '' : `Save location: ${n}`;
  },
};
function rerenderOptions(){ if (APP.tab === 'options' && APP_cur()) renderAll(); if (APP.startOpen) renderStart(); }

// The Save location block, shown on the Options page and the start screen's Options.
function saveLocationBlock(){
  const k = FOLDER.kind(), c = FOLDER.cfg, s = FOLDER.state;
  if (!k){
    const why = NATIVE.android ? 'On Android, characters are saved inside the app. Use Back up to keep a copy in Drive or Files.'
      : window.claude ? 'Here, characters are saved with your Claude account.'
      : 'Saving to a folder works in the Windows and Mac apps, and in Chrome or Edge on a computer. Here, characters are saved in this browser; use Back up to keep a copy.';
    return `<div><div class="cap">Save location</div><p class="hint" style="margin:4px 0 0">${why}</p></div>`;
  }
  const ago = t => { if (!t) return ''; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : new Date(t).toLocaleString(); };
  const state = !c || s === 'off' ? `<p class="hint" style="margin:4px 0 0">Characters are saved on this ${NATIVE.windows ? 'computer' : 'browser'} only. Choose a folder to also keep them there, for example a NAS, Dropbox, OneDrive or iCloud Drive folder. Every computer that uses the same folder shares the same characters, homebrew and pictures.</p>`
    : `<div class="saveloc ${s}"><b title="${esc(FOLDER.label())}">📁 ${esc(FOLDER.label())}</b><span class="hint">${
        s === 'ok' ? `Saved and synced ${ago(FOLDER.lastSync)}. Changes from other computers are picked up when the app opens or comes back to the front.`
      : s === 'busy' ? 'Syncing…'
      : s === 'needs-permission' ? 'The browser needs your OK to use this folder again (it asks once each visit).'
      : s === 'missing' ? 'This folder can\'t be found. Is the drive or NAS connected? Your characters are still saved on this computer.'
      : `The last save to the folder didn't work: ${esc(FOLDER.msg)}. Your characters are still saved on this ${NATIVE.windows ? 'computer' : 'browser'}.`}</span></div>`;
  const btns = !c || s === 'off' ? `<button class="btn sm pri" data-fold="choose">Choose folder…</button>`
    : `${s === 'needs-permission' ? '<button class="btn sm pri" data-fold="reconnect">Allow access</button>' : `<button class="btn sm" data-fold="sync">Sync now</button>`}<button class="btn sm" data-fold="choose">Change folder…</button><button class="btn sm ghost" data-fold="stop">Stop using folder</button>`;
  return `<div><div class="cap">Save location</div>${state}<div class="row" style="margin-top:6px">${btns}</div>
    ${c && s !== 'off' ? `<p class="hint" style="margin:6px 0 0">Files go in a <b>${FOLDER_SUB}</b> folder inside it. If the same character is changed on two computers before they sync, the newest change is kept.</p>` : ''}</div>`;
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-fold]'); if (!b) return; e.preventDefault(); const a = b.dataset.fold;
  if (a === 'choose') FOLDER.choose();
  else if (a === 'reconnect') FOLDER.reconnect();
  else if (a === 'stop'){ if (armConfirm(b, 'Stop using folder?')) FOLDER.stop(); }
  else if (a === 'sync') FOLDER.sync('button').then(r => { if (FOLDER.state === 'ok') toast(r && (r.pulled || r.removed) ? `Synced. ${r.pulled ? `${r.pulled} character${r.pulled === 1 ? '' : 's'} updated from the folder.` : ''}${r.removed ? ` ${r.removed} removed (deleted on another computer).` : ''}` : 'Synced. Everything is up to date.'); rerenderOptions(); });
});
// pick up changes from other computers when the app comes back to the front (at most every 10 seconds)
function folderWake(){ if (!FOLDER.on() || document.hidden) return; if (Date.now() - FOLDER.lastSync < 10000) return; FOLDER.sync('focus'); }
window.addEventListener('focus', folderWake);
document.addEventListener('visibilitychange', folderWake);
// clicking the top label when the folder needs attention: allow access (the browser needs a click for that), or open Options
document.addEventListener('click', e => {
  if (!e.target.closest('#sync') || !FOLDER.cfg || FOLDER.state === 'ok' || FOLDER.state === 'busy') return;
  if (FOLDER.state === 'needs-permission') FOLDER.reconnect(); else if (APP_cur()) { APP.tab = 'options'; renderAll(); }
});
