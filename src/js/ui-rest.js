// ===================== RESTING =====================
// Rest buttons sit under the round box. Each ruleset says which rests it has (module.rests);
// 3.5 has only a long rest (a night's rest of 8 hours). 5e will add a short rest.

// what a 3.5 night's rest does, as a list of plain-language lines (also used for the confirm box)
function longRestPlan35(c){
  const d = derive(c), lvl = totalLevel(c), cur = num(c.hp.cur), heal = Math.max(0, Math.min(d.hpMax, cur + lvl) - cur);
  const casters = c.classes.filter(k => casterInfo(c, k, d)).map(k => k.n);
  const timed = c.effects.filter(e => !e.expired && e.rounds != null);
  const tired = c.effects.filter(e => !e.expired && /^(fatigued|exhausted)$/i.test(e.n));
  const dayItems = c.items.some(it => it.used && Object.keys(it.used).length);
  const lines = [
    heal ? `Heal <b>${heal}</b> hit point${heal === 1 ? '' : 's'} (1 per character level)` : cur >= d.hpMax ? 'Hit points already full' : '',
    num(c.hp.nl) ? `Clear <b>${num(c.hp.nl)}</b> nonlethal damage` : '',
    casters.length ? `Restore spell slots and prepared spells (${casters.map(esc).join(', ')})` : '',
    dayItems ? 'Restore per-day uses of magic items' : '',
    timed.length ? `End ${timed.length} timed effect${timed.length === 1 ? '' : 's'} (${timed.slice(0, 4).map(e => esc(e.n)).join(', ')}${timed.length > 4 ? '…' : ''})` : '',
    tired.length ? `Remove ${tired.map(e => esc(e.n.toLowerCase())).join(' and ')}` : '',
    c.combat.round > 0 || c.combat.list.some(x => !x.me) ? 'End the encounter (round back to 0, initiative cleared)' : '',
  ].filter(Boolean);
  return {heal, lines, apply(){
    c.hp.cur = cur + heal; c.hp.nl = 0;
    for (const k in c.spells){ const b = c.spells[k]; if (!b) continue; b.used = {}; (b.list || []).forEach(s => s.cast = 0); }
    c.items.forEach(it => { if (it.used) it.used = {}; });
    timed.forEach(e => { e.rounds = 0; e.expired = true; });
    c.effects = c.effects.filter(e => !tired.includes(e));
    c.combat.round = 0; c.combat.turn = 0; c.combat.list = c.combat.list.filter(x => x.me);
  }};
}

function renderRestRow(){
  const el = document.getElementById('restRow'); if (!el) return; const c = APP_cur();
  const R = c ? (ruleset(c).rests || {}) : {};
  el.innerHTML = c ? `${R.short ? `<button class="btn sm" data-rest="short" title="${esc(R.short.tip || 'Short rest')}">Short rest</button>` : ''}
    ${R.long ? `<button class="btn sm" data-rest="long" title="${esc(R.long.tip || 'Long rest')}">Long rest</button>` : ''}` : '';
  el.hidden = !c || (!R.short && !R.long);
}

function openRest(kind){
  const c = APP_cur(); if (!c) return; const R = (ruleset(c).rests || {})[kind]; if (!R) return;
  const plan = R.plan(c), title = kind === 'long' ? 'Long rest' : 'Short rest';
  const bg = openModal(`<div class="modal narrow" role="dialog" aria-label="${title}"><div class="mh"><h3>${title}</h3><button class="btn ghost" data-close>Close</button></div>
    <div class="mform"><p style="margin:0">${esc(R.blurb || '')}</p>
      ${plan.lines.length ? `<ul class="rest-list">${plan.lines.map(l => `<li>${l}</li>`).join('')}</ul>` : '<p class="hint">Nothing to recover right now.</p>'}
      <p class="hint" style="margin:0">${esc(R.note || '')}</p></div>
    <div class="mfoot"><span></span><div class="row"><button class="btn" data-close>Cancel</button><button class="btn pri" id="restGo">Rest</button></div></div></div>`);
  $$('[data-close]', bg).forEach(b => b.addEventListener('click', closeModal));
  setTimeout(() => $('#restGo', bg).focus(), 30);
  $('#restGo', bg).addEventListener('click', () => { plan.apply(); markDirty(); closeModal(); renderAll();
    toast(`${title} taken.${plan.heal ? ` Healed <b>${plan.heal}</b>.` : ''}`); });
}
document.addEventListener('click', e => { const b = e.target.closest('[data-rest]'); if (b){ e.preventDefault(); openRest(b.dataset.rest); } });

const RESTS_35 = {
  long: {plan: longRestPlan35, tip: '8 hours of rest: heal, get spells back, end timed effects',
    blurb: 'A full night (8 hours) of rest. This will:',
    note: 'Prepared casters choose their spells for the new day on the Spells page. Ability damage and other long-term effects are not changed.'},
};
