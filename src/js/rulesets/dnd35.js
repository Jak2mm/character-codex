// ===================== RULESET MODULE: 3.5 SRD =====================
// A ruleset module tells the app everything that is specific to one game system:
//   id          matches RULESETS in core.js (chosen once when a character is made)
//   data        the rules content (spells, feats, classes…) for pickers and hovers
//   derive(c)   works out every number on the sheet (returns the D object)
//   sheet       the Character tab's panels, in their standard order and width ('full' or 'half');
//               players can reorder, resize, collapse or hide them per character (ui-panels.js)
//   sheetPanels(c)  builds the HTML for those panels, keyed by panel id
//   compactPanels(c)  short versions of the panels marked compact:true (big numbers in boxes)
//   rests       which rests the game has (long / short), with what each one recovers
//   tabs        renderers for ruleset-specific tabs (anything not listed uses the shared one)
// To add a ruleset, copy this file's shape into rulesets/<id>.js and add it to JS_ORDER in tools/build.py.
registerRuleset({
  id: 'dnd35',
  data: SRD,
  derive: derive35,
  sheetPanels: sheetPanels35,
  compactPanels: c => ({abilities: compactAbilities35(c), saves: compactSaves35(c), combat: compactCombat35(c), gear: compactGear35(c), attacks: compactAttacks35(c)}),
  rests: RESTS_35,
  sheet: [
    {id: 'ident',     title: 'Character',            size: 'full', keep: true},
    {id: 'combat',    title: 'Combat',               size: 'full', compact: true},
    {id: 'abilities', title: 'Ability scores',       size: 'half', compact: true},
    {id: 'saves',     title: 'Saving throws',        size: 'half', compact: true},
    {id: 'gear',      title: 'Gear',                 size: 'full', compact: true},
    {id: 'attacks',   title: 'Attacks',              size: 'full', compact: true},
    {id: 'languages', title: 'Languages',            size: 'full'},
    {id: 'bonuses',   title: 'Bonuses in effect',    size: 'full'},
    {id: 'special',   title: 'Special abilities & class features', size: 'full'},
  ],
  tabs: {skills: renderSkills, spells: renderSpells, tracker: c => renderTracker(c, trackerExtras35(c)), items: renderItems, companions: renderCompanions},
});
