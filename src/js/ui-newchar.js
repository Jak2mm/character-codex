// ===================== NEW CHARACTER SETUP =====================
// Picks the ruleset once (it can't be changed afterwards), plus the starting basics.
// Later this becomes the "New Character" step of the start screen.
function openNewCharacter(){
  const coreClasses = SRD.classes.filter(k => !k.prestige).map(k => k.n);
  let rs = 'dnd35';
  const card = r => `<label class="rs-card ${r.ready ? '' : 'off'}"><input type="radio" name="nc-rs" value="${r.id}" ${r.id === rs ? 'checked' : ''} ${r.ready ? '' : 'disabled'}>
      <span><b>${esc(r.name)}</b>${r.ready ? '' : ' <span class="pill">coming later</span>'}<span class="hint">${esc(r.blurb)}</span></span></label>`;
  const bg = openModal(`<div class="modal narrow" role="dialog" aria-label="New character"><div class="mh"><h3>New character</h3><button class="btn ghost" data-close>Close</button></div>
    <div class="mform">
      ${F('Character name', '<input type="text" id="nc-name" placeholder="e.g. Brother Aldric" autocomplete="off">')}
      <div><div class="cap">Ruleset</div><div class="rs-cards">${RULESETS.map(card).join('')}</div>
        <p class="hint" style="margin:6px 0 0"><b>This is chosen once.</b> A character keeps its ruleset for good, so its rules always add up. You can add homebrew to any character later.</p></div>
      <div class="fields">
        ${F('Race', `<select id="nc-race">${SRD.races.map(r => `<option ${r.n === 'Human' ? 'selected' : ''}>${esc(r.n)}</option>`).join('')}</select>`)}
        ${F('Class', `<select id="nc-class">${coreClasses.map(n => `<option ${n === 'Fighter' ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`)}
        ${F('Ability scores', `<select id="nc-abil">${ABIL_MODES.map(([v, l]) => `<option value="${v}" ${v === '25' ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`, 'wide')}
      </div>
      <p class="hint" style="margin:0">Race, class and ability scores can all be changed on the sheet afterwards.</p>
    </div>
    <div class="mfoot"><span></span><div class="row"><button class="btn" data-close>Cancel</button><button class="btn pri" id="nc-go">Create character</button></div></div></div>`);
  $$('[data-close]', bg).forEach(b => b.addEventListener('click', closeModal));
  setTimeout(() => $('#nc-name', bg).focus(), 30);
  $('#nc-name', bg).addEventListener('keydown', e => { if (e.key === 'Enter') $('#nc-go', bg).click(); });
  $('#nc-go', bg).addEventListener('click', () => {
    const c = newChar($('#nc-name', bg).value.trim() || 'New Adventurer');
    c.ruleset = ($('input[name="nc-rs"]:checked', bg) || {}).value || 'dnd35';
    c.race = $('#nc-race', bg).value; c.classes = [{n: $('#nc-class', bg).value, lvl: 1}]; c.abilMode = $('#nc-abil', bg).value;
    if (c.abilMode !== 'rolled' && c.abilMode !== 'unlocked') ABIL.forEach(a => { c.abil[a] = Object.assign({base:8, enh:0, temp:0, lvlUp:0}, c.abil[a] || {}, {base:8}); });
    APP.chars[c.id] = migrate(c); APP.curId = c.id; APP.tab = 'sheet'; markDirty(c.id); closeModal(); renderAll(); window.scrollTo({top:0});
    toast(`Created <b>${esc(c.name)}</b> (${esc(rsOf(c).short)}). ${c.abilMode === 'rolled' || c.abilMode === 'unlocked' ? 'Type in your ability scores' : `Spend your ${c.abilMode} points on ability scores`} to start.`);
  });
}
