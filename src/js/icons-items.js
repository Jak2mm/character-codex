// ===================== ITEM ICONS (drawn for Character Codex) =====================
// 24×24 glyphs drawn in the badge's text colour (white) with darker detail lines. Each item shows the icon
// for what it is (sword, axe, helm, boots, potion, ring…), falling back to its type's icon.
const DK = 'rgba(0,0,0,.32)';
const ICONS = {
  // ---- weapons ----
  sword: `<path d="M20.5 3.5l-.6 3.4-9.3 9.3-2.8-2.8 9.3-9.3z" fill="currentColor"/><path d="M19.8 4.2l-10 10" stroke="${DK}" stroke-width="1"/><path d="M5.6 12.6l5.8 5.8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M8.5 17.2l-3.4 3.4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="4.3" cy="21.4" r="1.4" fill="currentColor"/>`,
  dagger: `<path d="M19 5l-1.2 3.6-5 5-2.4-2.4 5-5z" fill="currentColor"/><path d="M8.2 11.2l4.6 4.6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M10 15l-4 4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="5" cy="20" r="1.5" fill="currentColor"/>`,
  axe: `<path d="M4.5 21.5L15.5 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12.6 6.4l4.4-4.2c3.4 1.4 5.2 4.6 4.8 8.6l-5.4-1.2z" fill="currentColor"/><path d="M13.8 6.6l3.4 3" stroke="${DK}" stroke-width="1.1"/>`,
  mace: `<path d="M4.5 20.5l9-9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="8" r="4.2" fill="currentColor"/><path d="M16 2.2v2M16 11.8v2M10.2 8h2M19.8 8h2M11.9 3.9l1.4 1.4M18.7 10.7l1.4 1.4M20.1 3.9l-1.4 1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="8" r="1.4" fill="${DK}"/>`,
  hammer: `<path d="M5 20.5l8.6-8.6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M11.2 6.8l6-6 6 6-6 6z" fill="currentColor" transform="translate(-2.4 2.4) scale(.95)"/><path d="M12.6 8.7l4.4 4.4" stroke="${DK}" stroke-width="1"/>`,
  flail: `<path d="M3.5 20.5l6-6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M10.2 13.6c1.6-1.2 2.4-3 3.2-4.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="1.6 1.2"/><circle cx="16.5" cy="7" r="3.6" fill="currentColor"/><path d="M16.5 1.8v1.6M21.7 7h-1.6M20.2 3.3l-1.1 1.1M12.8 3.3l1.1 1.1M20.2 10.7l-1.1-1.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  spear: `<path d="M3.5 20.5L16 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M21 3c-.4 3-1.8 5.6-4 7.2L13.8 7C15.4 4.8 18 3.4 21 3z" fill="currentColor"/><path d="M13 11l-2-2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
  polearm: `<path d="M3.5 20.5L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 5.4c2-2 4.8-2.8 7-2.4-.4 2.2-1.2 4.4-3 6.2z" fill="currentColor"/><path d="M12.6 6.8c-2.6.4-4.6 2.6-4.8 5.2l3.6-1.2 2.6-2.6z" fill="currentColor"/>`,
  bow: `<path d="M6 2.8c7.6 1.4 13.4 7.6 15.2 15.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M6 2.8L21.2 18.2" stroke="currentColor" stroke-width="1" opacity=".85"/><path d="M3 21l12-12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M16.8 7.2l-3.6.6 3-3z" fill="currentColor"/><path d="M3 21l.2-2.6M3 21l2.6-.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  crossbow: `<path d="M12 21V6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M3 10.5c2.6-3 5.6-4.4 9-4.4s6.4 1.4 9 4.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M3 10.5L12 14l9-3.5" fill="none" stroke="currentColor" stroke-width="1" opacity=".85"/><path d="M12 2.5l-2 3.5h4z" fill="currentColor"/><rect x="10.6" y="16" width="2.8" height="3.6" rx="1" fill="${DK}"/>`,
  sling: `<path d="M5 3.5c-.8 5 1.6 9.6 6 12.6M19 3.5c.8 5-1.6 9.6-6 12.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="12" cy="17.8" rx="3.6" ry="2.6" fill="currentColor"/><circle cx="12" cy="17.4" r="1.3" fill="${DK}"/><circle cx="5" cy="3.5" r="1.3" fill="currentColor"/><circle cx="19" cy="3.5" r="1.3" fill="currentColor"/>`,
  staff: `<path d="M5.5 21.5L18.5 2.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M8.6 17l1.6 1.1M15.4 7l1.6 1.1" stroke="${DK}" stroke-width="1.4" stroke-linecap="round"/>`,
  fist: `<path d="M6 10.5V8.2a1.6 1.6 0 0 1 3.2 0V8a1.6 1.6 0 0 1 3.2 0v.2a1.6 1.6 0 0 1 3.2 0v.5a1.6 1.6 0 0 1 3.2 0V14c0 4-2.6 7-6.6 7H11c-2.8 0-5-2.2-5-5z" fill="currentColor"/><path d="M9.2 8.2v3M12.4 8.2v3M15.6 8.7v2.6M6 13.5c1.6-1.2 3.6-1 5 .4" fill="none" stroke="${DK}" stroke-width="1.1" stroke-linecap="round"/>`,
  // ---- ammunition ----
  arrow: `<path d="M4 20L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20.5 3.5l-1.2 5.3-4.1-4.1z" fill="currentColor"/><path d="M4 20l-.8-3.4M4 20l3.4.8M6.4 17.6l-.8-3.4M6.4 17.6l3.4.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  bolt: `<path d="M5 19L16.5 7.5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M20 4l-1.4 5.2-3.8-3.8z" fill="currentColor"/><path d="M5 19l-1.4-2.6M5 19l2.6 1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  bullet: `<circle cx="8" cy="15" r="4" fill="currentColor"/><circle cx="16" cy="10" r="3.4" fill="currentColor"/><circle cx="15" cy="18" r="2.6" fill="currentColor"/><circle cx="6.8" cy="13.8" r="1.1" fill="${DK}"/><circle cx="15.2" cy="9" r=".9" fill="${DK}"/>`,
  // ---- armor and clothing ----
  armor: `<path d="M8.5 3h7l1.5 2.5 3.5 1.2-1 6.3-2.5-.6V21h-10v-8.6l-2.5.6-1-6.3L7 5.5z" fill="currentColor"/><path d="M8.5 3c.6 1.6 1.9 2.4 3.5 2.4S14.9 4.6 15.5 3M7 12.4h10M7 16.6h10M12 5.4V21" stroke="${DK}" stroke-width="1.1" fill="none"/>`,
  shield: `<path d="M12 2.5l7.5 2.8v6.1c0 4.7-3.2 8.3-7.5 10.1-4.3-1.8-7.5-5.4-7.5-10.1V5.3z" fill="currentColor"/><path d="M12 5.3v13.9" stroke="${DK}" stroke-width="1.6"/>`,
  helm: `<path d="M4 13.5C4 8 7.6 3.5 12 3.5S20 8 20 13.5V20h-5.4v-5.2H9.4V20H4z" fill="currentColor"/><path d="M12 3.5V12M6.6 11.2h10.8" stroke="${DK}" stroke-width="1.3"/>`,
  gloves: `<path d="M7.5 21v-4.6L5 11.8c-.6-1.1.9-2.1 1.7-1.2l2 2.2V5.2a1.3 1.3 0 0 1 2.6 0V10V3.9a1.3 1.3 0 0 1 2.6 0V10V4.6a1.3 1.3 0 0 1 2.6 0V11V6.6a1.3 1.3 0 0 1 2.5 0v7.8c0 2.4-.8 4.2-2.2 5.2V21z" fill="currentColor"/><path d="M7.5 17.6h9.7" stroke="${DK}" stroke-width="1.3"/>`,
  boots: `<path d="M7 3h7v9.6l4.6 2c1.4.6 2.4 2 2.4 3.6V21H5.2c-.8 0-1.2-.6-1.2-1.2V18c0-1 .6-1.6 1.2-2.2L7 13.6z" fill="currentColor"/><path d="M7 6.5h7M4.2 18.6H21" stroke="${DK}" stroke-width="1.3"/>`,
  cloak: `<path d="M9 3h6l.8 2.4c2.8 3.4 4.4 9 4.7 15.6H3.5c.3-6.6 1.9-12.2 4.7-15.6z" fill="currentColor"/><circle cx="12" cy="5.4" r="1.4" fill="${DK}"/><path d="M12 6.8c-.4 5-.4 9.6 0 14.2M8 9c-1.4 3.6-2 7.6-2 12M16 9c1.4 3.6 2 7.6 2 12" stroke="${DK}" stroke-width="1" fill="none"/>`,
  belt: `<path d="M2.5 9.5h19v5h-19z" fill="currentColor"/><rect x="8.6" y="7.6" width="6.8" height="8.8" rx="1.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9.6v4.8" stroke="${DK}" stroke-width="1.6" stroke-linecap="round"/>`,
  bracers: `<path d="M5 6.5l9-3 3 3v11l-9 3-3-3z" fill="currentColor"/><path d="M5 9.5l12-3M5 14.5l12-3" stroke="${DK}" stroke-width="1.2"/><path d="M8 17.5v3" stroke="${DK}" stroke-width="1.2"/>`,
  crown: `<path d="M3.5 18.5l-1-11 5 4.5L12 4l4.5 8 5-4.5-1 11z" fill="currentColor"/><path d="M3.5 18.5h17" stroke="${DK}" stroke-width="1.4"/><circle cx="12" cy="14.6" r="1.4" fill="${DK}"/>`,
  goggles: `<path d="M2.5 11.5h19" stroke="currentColor" stroke-width="1.8"/><circle cx="7.6" cy="13" r="4" fill="currentColor"/><circle cx="16.4" cy="13" r="4" fill="currentColor"/><circle cx="7.6" cy="13" r="2" fill="${DK}"/><circle cx="16.4" cy="13" r="2" fill="${DK}"/>`,
  // ---- magic items, consumables and gear ----
  potion: `<path d="M9.5 2.5h5v1.8h-.9v4.1c2.8 1 4.7 3.6 4.7 6.7a7.3 7.3 0 0 1-14.6 0c0-3.1 1.9-5.7 4.7-6.7V4.3h-.9z" fill="currentColor"/><path d="M6.6 14.6h10.8" stroke="${DK}" stroke-width="1.6"/><circle cx="10" cy="17.2" r="1.1" fill="${DK}"/>`,
  scroll: `<path d="M7 4h11a2.5 2.5 0 0 1 0 5h-1v8.5a3 3 0 0 1-3 3H6a2.5 2.5 0 0 1 0-5h1z" fill="currentColor"/><path d="M10 10h4.5M10 13h4.5" stroke="${DK}" stroke-width="1.5" stroke-linecap="round"/>`,
  wand: `<path d="M4 20L14.5 9.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M17.5 2.5l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="currentColor"/><circle cx="20" cy="11.5" r="1" fill="currentColor"/><circle cx="12.5" cy="4" r="1" fill="currentColor"/>`,
  rod: `<path d="M5 20L15 10" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><circle cx="17.4" cy="6.6" r="3.8" fill="currentColor"/><circle cx="17.4" cy="6.6" r="1.6" fill="${DK}"/><path d="M7.6 17.4l1.6 1.6" stroke="${DK}" stroke-width="1.2"/>`,
  magestaff: `<path d="M5.5 21.5l10-14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M17.6 1.8l2.6 2.6-2.4 5-3.4-2.8z" fill="currentColor"/><path d="M14.2 5.6c-1 .4-1.6 1.6-1.4 2.8M20.2 4.4c.6 1 .4 2.4-.4 3.2" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>`,
  ring: `<circle cx="12" cy="14.5" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M9 3.5h6l1.6 2.5-4.6 4.8-4.6-4.8z" fill="currentColor"/>`,
  amulet: `<path d="M4.5 3c.4 5 3.4 8.4 7.5 9.4 4.1-1 7.1-4.4 7.5-9.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 11l4.4 4.6L12 21l-4.4-5.4z" fill="currentColor"/><path d="M12 13.8l1.8 1.9-1.8 2.2-1.8-2.2z" fill="${DK}"/>`,
  orb: `<circle cx="12" cy="10.5" r="6.5" fill="currentColor"/><path d="M8.6 7.6c.8-1.2 2-1.8 3.4-1.8" fill="none" stroke="${DK}" stroke-width="1.4" stroke-linecap="round"/><path d="M6.5 21h11l-2-4h-7z" fill="currentColor"/>`,
  book: `<path d="M5 3.5h11.5A2.5 2.5 0 0 1 19 6v14.5H6.5A2.5 2.5 0 0 1 4 18V4.5c0-.6.4-1 1-1z" fill="currentColor"/><path d="M4 18a2.5 2.5 0 0 1 2.5-2.5H19M9 7.5h6M9 10.5h4" stroke="${DK}" stroke-width="1.3" fill="none"/>`,
  gem: `<path d="M7 4h10l4 5-9 11.5L3 9z" fill="currentColor"/><path d="M3 9h18M8.5 9L12 20.5 15.5 9M7 4l1.5 5M17 4l-1.5 5M12 4l-3.5 5M12 4l3.5 5" stroke="${DK}" stroke-width="1" fill="none"/>`,
  coins: `<ellipse cx="9" cy="17.5" rx="5.5" ry="2.2" fill="currentColor"/><ellipse cx="9" cy="14.5" rx="5.5" ry="2.2" fill="currentColor" stroke="${DK}" stroke-width="1"/><ellipse cx="9" cy="11.5" rx="5.5" ry="2.2" fill="currentColor" stroke="${DK}" stroke-width="1"/><circle cx="17" cy="7" r="4" fill="currentColor" stroke="${DK}" stroke-width="1"/><path d="M17 5v4" stroke="${DK}" stroke-width="1.2"/>`,
  chalice: `<path d="M6 3h12c0 5-2.4 8.4-6 9-3.6-.6-6-4-6-9z" fill="currentColor"/><path d="M12 12v5.6M7.5 21h9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M8 6h8" stroke="${DK}" stroke-width="1.2"/>`,
  backpack: `<path d="M8 6.5V5a4 4 0 0 1 8 0v1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="4.5" y="6.5" width="15" height="14.5" rx="3" fill="currentColor"/><path d="M4.5 12h15M10 12v3h4v-3" stroke="${DK}" stroke-width="1.5" fill="none"/>`,
  tools: `<path d="M4.5 19.5l8.8-8.8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M14.4 3.6a4.6 4.6 0 0 1 5.8 5.8l-2.7-.6-1.6-1.6-.6-2.7z" fill="currentColor"/><path d="M17 15.2l3.3 3.3a1.6 1.6 0 0 1-2.3 2.3l-3.3-3.3z" fill="currentColor"/><path d="M14.4 15.6l1.4-1.4" stroke="currentColor" stroke-width="2.6"/>`,
  food: `<path d="M3.5 13.5c0-4.2 3.8-7.5 8.5-7.5s8.5 3.3 8.5 7.5V16H3.5z" fill="currentColor"/><path d="M3 17.5h18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M8.2 9.6l1.2 2M12 8.6v2.4M15.8 9.6l-1.2 2" stroke="${DK}" stroke-width="1.3" stroke-linecap="round"/>`,
  lantern: `<path d="M9.5 3.5h5M12 2v1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M7.5 6.5h9l-1 1.5v10.5l1 1.5h-9l1-1.5V8z" fill="currentColor"/><path d="M12 10.4c1.2 1.4 1.6 2.6 1 3.8-.4.8-1.2 1.2-1 1.2-.8 0-1.6-.6-1.8-1.4-.4-1.3.6-2.4 1.8-3.6z" fill="${DK}"/>`,
  rope: `<ellipse cx="12" cy="12" rx="8.5" ry="8" fill="none" stroke="currentColor" stroke-width="2.4"/><ellipse cx="12" cy="12" rx="4.8" ry="4.4" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M20 15c1.4 1.6 1.6 3.6 1 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  key: `<circle cx="7.5" cy="8.5" r="4.6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M10.8 11.8L20.5 21.5M16.2 17.2l2.4-2.4M18.6 19.6l2-2" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
  instrument: `<ellipse cx="9.5" cy="15" rx="6" ry="6" fill="currentColor"/><path d="M13.2 10.8L20.5 3.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="9.5" cy="15" r="1.8" fill="${DK}"/><path d="M19 3l2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  holy: `<circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2.5v3.5M12 18v3.5M2.5 12H6M18 12h3.5M5.3 5.3l2.4 2.4M16.3 16.3l2.4 2.4M18.7 5.3l-2.4 2.4M7.7 16.3l-2.4 2.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  clothes: `<path d="M8 3l4 2.4L16 3l5 3.4-2.2 4-2-1.2V21H7.2V9.2l-2 1.2L3 6.4z" fill="currentColor"/><path d="M12 5.4V21" stroke="${DK}" stroke-width="1.1"/>`,
};
// which icon an item gets: the first rule whose words match its name, else its type's icon
const ICON_RULES = [
  ['crossbow', /crossbow|repeating/], ['bolt', /\bbolts?\b/], ['bullet', /sling bullets?|bullets?\b/], ['arrow', /\barrows?\b/],
  ['bow', /\bbows?\b|longbow|shortbow/], ['sling', /\bsling\b|\bstaff sling\b/],
  ['dagger', /dagger|kukri|sickle|kama|siangham|punching|dart|shuriken|knife/], ['axe', /\baxe\b|battleaxe|greataxe|handaxe|waraxe|hatchet/],
  ['hammer', /hammer|maul|club|greatclub|sap\b/], ['flail', /flail|spiked chain|whip|nunchaku|morningstar/], ['mace', /\bmace\b/],
  ['polearm', /halberd|glaive|guisarme|ranseur|scythe|bardiche|partisan|naginata/], ['spear', /spear|javelin|trident|pike|lance/],
  ['magestaff', /^staff of\b/], ['staff', /quarterstaff|\bstaff\b/], ['sword', /sword|rapier|scimitar|falchion|katana|blade|saber|sabre|cutlass/], ['fist', /gauntlet\b(?!s of)|unarmed|cestus|brass knuckles/],
  ['lantern', /lantern|torch|candle|\blamp\b|sunrod/], ['ring', /\bring\b/], ['amulet', /amulet|necklace|periapt|pendant|medallion|brooch|scarab|torc|talisman|totem|charm/],
  ['shield', /shield|buckler/], ['helm', /helm|\bhat\b|\bcap\b|\bhood\b|mask/], ['crown', /crown|circlet|headband|tiara|phylactery|diadem/], ['goggles', /goggles|lenses|eyes of|spectacles/],
  ['gloves', /gloves?|gauntlets/], ['boots', /boots?|slippers|shoes|sandals/], ['cloak', /cloak|cape|mantle|robe/], ['belt', /belt|girdle|sash/], ['bracers', /bracers?|bracelet|armbands?/],
  ['armor', /armor|armour|mail\b|plate|breastplate|chainmail|chain shirt|leather|hide\b|banded|splint|scale|padded/],
  ['clothes', /vest|shirt|outfit|clothing|tunic|vestment|kit, (?:noble|explorer)/],
  ['potion', /potion|oil\b|elixir|philter|salve|flask|vial|antitoxin|alchemist/], ['scroll', /scroll/], ['wand', /\bwand\b/], ['rod', /\brod\b/],
  ['holy', /holy symbol|unholy symbol|holy water/],
  ['book', /book|tome|manual|grimoire|journal|libram|spellbook/], ['orb', /orb|crystal ball|figurine|ioun|sphere|stone of|pearl of|bead|horn of|deck of/],
  ['gem', /gem|ruby|diamond|emerald|sapphire|opal|jade|amethyst|garnet|topaz|pearl|jewel/], ['coins', /coins?|gold|platinum|silver piece|copper piece|ingot/],
  ['chalice', /chalice|goblet|cup\b|statuette|idol|crown jewels|art object/], ['key', /\bkey\b/],
  ['rope', /rope|chain\b|twine|cord/], ['food', /ration|food|bread|meal|wine|ale|cheese|meat/], ['instrument', /lute|flute|drum|harp|horn\b|instrument|lyre|bagpipe/],
  ['tools', /tools?\b|crowbar|hammer, |kit\b|pick\b|shovel|pitons?|lock|manacles|grappling|spyglass|mirror|scales/],
  ['backpack', /backpack|bag|sack|pouch|case|chest|quiver|scabbard|bandolier/],
];
const WEAPON_ICONS = ['sword', 'dagger', 'axe', 'mace', 'hammer', 'flail', 'spear', 'polearm', 'bow', 'crossbow', 'sling', 'staff', 'fist', 'magestaff'];
const TYPE_ICON = {weapon: 'sword', armor: 'armor', ammo: 'arrow', potion: 'potion', scroll: 'scroll', wand: 'wand', magic: 'ring', gear: 'backpack', treasure: 'coins'};
function iconKeyFor(it, type){
  if (it && it.icon && ICONS[it.icon]) return it.icon;
  const n = String((it && it.n) || '').toLowerCase();
  for (const [k, re] of ICON_RULES) if (re.test(n)){
    // keep the icon within the item's type (an "oil of sharpness" isn't armor; "staff of fire" is a wand)
    if (type === 'weapon' && !WEAPON_ICONS.includes(k)) continue;
    if (type === 'armor' && !['armor', 'shield', 'helm', 'gloves', 'boots', 'cloak', 'belt', 'bracers', 'clothes', 'crown', 'goggles'].includes(k)) continue;
    if (type === 'ammo' && !['arrow', 'bolt', 'bullet'].includes(k)) continue;
    if (type === 'potion' && k !== 'potion') continue;
    if (type === 'scroll' && k !== 'scroll') continue;
    return k;
  }
  return TYPE_ICON[type] || 'backpack';
}
// the four coins for the money boxes
const COIN = {pp: ['Platinum', '#e9edf2', '#9aa6b4', '#5f6b78'], gp: ['Gold', '#ffe08a', '#d4a020', '#8a6410'], sp: ['Silver', '#f2f2f2', '#b4b8bd', '#6e7378'], cp: ['Copper', '#f2b07a', '#b8652a', '#7a3d14']};
function coinIcon(k, size = 20){
  const [nm, hi, mid, lo] = COIN[k];
  return `<svg class="coin" width="${size}" height="${size}" viewBox="0 0 24 24" role="img" aria-label="${nm}"><defs><radialGradient id="cg-${k}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${hi}"/><stop offset=".6" stop-color="${mid}"/><stop offset="1" stop-color="${lo}"/></radialGradient></defs>
    <circle cx="12" cy="12" r="10.5" fill="url(#cg-${k})" stroke="${lo}" stroke-width="1"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="${lo}" stroke-width=".9" stroke-dasharray="1.2 1.1" opacity=".8"/>
    <text x="12" y="14.8" text-anchor="middle" font-size="7.6" font-weight="800" letter-spacing="-.3" font-family="Georgia,serif" fill="${lo}">${k.toUpperCase()}</text></svg>`;
}
