// ===================== ITEM PICTURES, TYPE ICONS AND RARITY =====================
// Every item has a picture (a stand-in until default pictures are added, or your own upload: it.img), a type icon
// (from itemCat, or your choice: it.icat) and a rarity (it.rarity, or guessed from its price). The icon sits on the
// item's top-left corner in the rarity's colour.
const ITEM_ICONS = {
  weapon: '<path d="M19 3l2 2-9.5 9.5-2-2z" fill="currentColor"/><path d="M8 13l3 3-2 2-1.2-1.2L4.5 20 4 19.5l3.2-3.3L6 15z" fill="currentColor"/><path d="M6.5 12.5l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  armor: '<path d="M12 2.5l7.5 2.8v6.1c0 4.7-3.2 8.3-7.5 10.1-4.3-1.8-7.5-5.4-7.5-10.1V5.3z" fill="currentColor"/><path d="M12 5.3v13.9" stroke="rgba(0,0,0,.28)" stroke-width="1.6"/>',
  ammo: '<path d="M4 20L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20.5 3.5l-1.2 5.3-4.1-4.1z" fill="currentColor"/><path d="M4 20l-.8-3.4M4 20l3.4.8M6.4 17.6l-.8-3.4M6.4 17.6l3.4.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  potion: '<path d="M9.5 2.5h5v1.8h-.9v4.1c2.8 1 4.7 3.6 4.7 6.7a7.3 7.3 0 0 1-14.6 0c0-3.1 1.9-5.7 4.7-6.7V4.3h-.9z" fill="currentColor"/><path d="M6.6 14.6h10.8" stroke="rgba(0,0,0,.28)" stroke-width="1.6"/><circle cx="10" cy="17.2" r="1.1" fill="rgba(0,0,0,.28)"/>',
  scroll: '<path d="M7 4h11a2.5 2.5 0 0 1 0 5h-1v8.5a3 3 0 0 1-3 3H6a2.5 2.5 0 0 1 0-5h1z" fill="currentColor"/><path d="M10 10h4.5M10 13h4.5" stroke="rgba(0,0,0,.3)" stroke-width="1.5" stroke-linecap="round"/>',
  wand: '<path d="M4 20L14.5 9.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M17.5 2.5l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="currentColor"/><circle cx="20" cy="11.5" r="1" fill="currentColor"/><circle cx="12.5" cy="4" r="1" fill="currentColor"/>',
  magic: '<circle cx="12" cy="14.5" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M9 3.5h6l1.6 2.5-4.6 4.8-4.6-4.8z" fill="currentColor"/>',
  gear: '<path d="M8 6.5V5a4 4 0 0 1 8 0v1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="4.5" y="6.5" width="15" height="14.5" rx="3" fill="currentColor"/><path d="M4.5 12h15M10 12v3h4v-3" stroke="rgba(0,0,0,.3)" stroke-width="1.5" fill="none"/>',
  treasure: '<ellipse cx="9" cy="17.5" rx="5.5" ry="2.2" fill="currentColor"/><ellipse cx="9" cy="14.5" rx="5.5" ry="2.2" fill="currentColor" stroke="rgba(0,0,0,.25)" stroke-width="1"/><ellipse cx="9" cy="11.5" rx="5.5" ry="2.2" fill="currentColor" stroke="rgba(0,0,0,.25)" stroke-width="1"/><path d="M17 3l3.5 3.5L17 11l-3.5-4.5z" fill="currentColor"/>',
};

const RARITY = {common: ['Common', '#5f6570'], uncommon: ['Uncommon', '#2a7d3a'], rare: ['Rare', '#2a5cbf'], veryrare: ['Very rare', '#7d3bbd'], legendary: ['Legendary', '#b85e05'], artifact: ['Artifact', '#b0251b']};
const ITEM_TYPE_NAMES = {weapon: 'Weapon', armor: 'Armor & shield', ammo: 'Ammunition', potion: 'Potion & oil', scroll: 'Scroll', wand: 'Wand, staff & rod', magic: 'Ring & wondrous', gear: 'Gear', treasure: 'Treasure'};
// default pictures per type go here when they're made (e.g. ITEM_PICS.weapon = 'data:image/jpeg;base64,…')
const ITEM_PICS = {};
const itemType = it => (it.icat && ITEM_CATS[it.icat]) ? it.icat : itemCat(it);
// rarity: your choice, or a guess from the price (3.5 has no rarity, so this is a rough guide you can change)
function rarityGuess(it){
  const v = itemValue(it); if (v === '') return 'common';
  return v >= 200000 ? 'legendary' : v >= 50000 ? 'veryrare' : v >= 10000 ? 'rare' : v >= 1000 ? 'uncommon' : 'common';
}
const itemRarity = it => RARITY[it.rarity] ? it.rarity : rarityGuess(it);
function itemIcon(it, size = 'md'){
  const t = itemType(it), r = itemRarity(it);
  return `<span class="ib ${size}" style="background:${RARITY[r][1]}" title="${esc(ITEM_TYPE_NAMES[t])} · ${esc(RARITY[r][0])}${RARITY[it.rarity] ? '' : ' (guessed from price)'}"><svg viewBox="0 0 24 24" aria-hidden="true">${ITEM_ICONS[t]}</svg></span>`;
}
function itemPic(it){
  const own = it.img && IMG.src(it.img), def = ITEM_PICS[itemType(it)];
  return own ? `<img src="${own}" alt="" class="ipic-img">` : def ? `<img src="${def}" alt="" class="ipic-img">` : '<span class="ipic-ph">(IMAGE)</span>';
}
// upload / reset an item's own picture
document.addEventListener('change', async e => { const id = e.target.dataset && e.target.dataset.itemimg; if (!id) return; const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (!/^image\//.test(f.type)){ toast('That file isn\'t an image.', 'warn'); return; }
  const c = APP_cur(), it = c.items.find(i => i.id === id); if (!it) return;
  try { const d = await imageToDataURL(f, 400); if (it.img) IMG.drop(it.img); it.img = IMG.put(d); markDirty(); renderAll(); } catch { toast('That image couldn\'t be read.', 'warn'); } });
