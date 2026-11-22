// ===================== HEALING: ROLL FOR ME, OR I ROLLED =====================
// Potions, healing items and cure spells ask how to heal: the app rolls, or you roll your own dice and type
// the total. Choose who's healed: you, one of your companions, or someone else (the amount is just shown).
// The potion or use is only spent when you heal, so Cancel changes nothing.
function openHeal(o){
  // o = {title, from, expr (e.g. "1d8+1"), consume(): spend the potion/use, who: 'me'}
  const c = APP_cur(); if (!c) return; const D0 = derive(c);
  const comps = c.companions || [];
  const whoOpts = [['me', `You (${num(c.hp.cur)} / ${num(D0.hpMax)} HP)`], ...comps.map(x => ['comp:' + x.id, compTitle(x)]), ['other', 'Someone else (just show the amount)']];
  const bg = openModal(`<div class="modal narrow" role="dialog" aria-label="Heal"><div class="mh"><h3>${esc(o.title)}</h3><button class="btn ghost" data-close>Cancel</button></div>
    <div class="mform"><p style="margin:0">Heals <b>${esc(o.expr)}</b>${o.from ? ` <span class="hint">(${esc(o.from)})</span>` : ''}</p>
      <label class="fld"><span class="cap">Who is healed</span><select id="hl-who">${whoOpts.map(([v, l]) => `<option value="${v}" ${v === (o.who || 'me') ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
      <div class="heal-ways">
        <button class="btn pri heal-roll" id="hl-roll"><span class="heal-die" aria-hidden="true">🎲</span> Roll for me</button>
        <div class="heal-own"><span class="cap">Or roll your own dice</span><div class="row"><input type="number" id="hl-amt" min="0" inputmode="numeric" placeholder="Total" aria-label="Total you rolled" style="width:100px"><button class="btn" id="hl-apply">Heal this much</button></div>
          <span class="hint">Type the total, including the ${esc((o.expr.match(/[+-]\s*\d+$/) || ['bonus'])[0].replace(/\s/g, ''))}.</span></div></div></div></div>`);
  $$('[data-close]', bg).forEach(b => b.addEventListener('click', closeModal));
  const go = (amount, detail) => {
    const who = $('#hl-who', bg).value; if (o.consume && o.consume() === false){ closeModal(); return; }
    let msg = `<b>${esc(o.title)}</b>: `;
    if (who === 'me'){ const max = num(derive(c).hpMax) || num(c.hp.max), before = num(c.hp.cur); c.hp.cur = Math.min(Math.max(before, max), before + amount); c.hp.nl = Math.max(0, num(c.hp.nl) - amount); msg += `healed you <b>${amount}</b>${detail}. HP ${before} → ${c.hp.cur}.`; }
    else if (who.startsWith('comp:')){ const x = comps.find(v => 'comp:' + v.id === who); const V = compNums(compStats(c, x), x), max = V.hpMax === '' ? Infinity : num(V.hpMax), cur = num(x.hp ?? (V.hpMax === '' ? 0 : V.hpMax));
      x.hp = Math.min(Math.max(cur, max), cur + amount); const e = compInitEntry(c, x); if (e) e.hp = `${x.hp}/${V.hpMax}`; msg += `healed ${esc(compTitle(x))} <b>${amount}</b>${detail}.`; }
    else msg += `heals <b>${amount}</b>${detail}.`;
    closeModal(); markDirty(); renderAll(); toast(msg);
  };
  $('#hl-roll', bg).addEventListener('click', () => { const r = rollExpr(o.expr.replace(/\s/g, '')); if (!r) return; go(r.total, ` <span style="opacity:.75">(${esc(o.expr)} → [${r.rolls.join(', ')}]${r.bonus ? ' ' + sgn(r.bonus) : ''})</span>`); });
  const own = () => { const a = Math.round(num($('#hl-amt', bg).value)); if (!(a > 0)){ $('#hl-amt', bg).focus(); return; } go(a, ' <span style="opacity:.75">(your roll)</span>'); };
  $('#hl-apply', bg).addEventListener('click', own); $('#hl-amt', bg).addEventListener('keydown', e => { if (e.key === 'Enter') own(); });
  setTimeout(() => $('#hl-roll', bg).focus(), 30);
}
// the healing a cure spell does at a caster level, as dice text (e.g. "1d8+3"), or null
function healExpr(spell, cl){ const h = HEALS[normKey(spell).replace(/’/g, "'")]; if (!h) return null; if (h[0] === '1') return '1'; const b = Math.min(num(cl), h[1]); return h[0] + (b ? '+' + b : ''); }

// ---------- Potions & oils box for Combat & Effects ----------
function potionItems(c){ return c.items.map(it => ({it, x: IDX.consumables.get(String(it.n || '').toLowerCase())})).filter(p => p.x && num(p.it.qty ?? 1) > 0)
  .sort((a, b) => a.it.n.localeCompare(b.it.n)); }
function potionsPanel(c, compact){
  const ps = potionItems(c);
  const btn = p => `<button class="btn sm pri" data-act="drink" data-id="${p.it.id}">${p.x.k === 'oil' ? 'Apply' : 'Drink'}</button>`;
  const body = !ps.length ? '<p class="hint" style="margin:0">No potions or oils. Add them on the Items page (search “potion of”).</p>'
    : compact ? `<div class="pot-chips">${ps.map(p => `<span class="pot-chip">${itemIcon(p.it, 'xs')}<span>${esc(p.it.n.replace(/^(potion|oil) of /i, ''))}${num(p.it.qty ?? 1) > 1 ? ` <b>×${num(p.it.qty)}</b>` : ''}</span>${btn(p)}</span>`).join('')}</div>`
    : `<div class="list">${ps.map(p => { const h = healExpr(p.x.sp, p.x.cl); const sd = IDX.spells.get(p.x.sp.toLowerCase());
        return `<div class="pot-row">${itemIcon(p.it, 'sm')}<div style="flex:1;min-width:0">${refA('item', p.it.n)}${num(p.it.qty ?? 1) > 1 ? ` <span class="pill">×${num(p.it.qty)}</span>` : ''}<div class="hint">${esc([h ? 'heals ' + h : '', 'CL ' + p.x.cl, sd && sd.dur && !h ? sd.dur : ''].filter(Boolean).join(' · '))}</div></div>${btn(p)}</div>`; }).join('')}</div>`;
  return panel('Potions & oils', `<div class="pb">${body}</div>`);
}
