// ===================== RULESET MODULE: 3.5 SRD =====================
// A ruleset module tells the app everything that is specific to one game system:
//   id          matches RULESETS in core.js (chosen once when a character is made)
//   data        the rules content (spells, feats, classes…) for pickers and hovers
//   derive(c)   works out every number on the sheet (returns the D object)
//   sheet       the Character tab's panels, in their standard order and width ('full' or 'half');
//               players can reorder, resize, collapse or hide them per character (ui-panels.js)
//   sheetPanels(c)  builds the HTML for those panels, keyed by panel id
//   tabs        renderers for ruleset-specific tabs (anything not listed uses the shared one)
// To add a ruleset, copy this file's shape into rulesets/<id>.js and add it to JS_ORDER in tools/build.py.
registerRuleset({
  id: 'dnd35',
  data: SRD,
  derive: derive35,
  sheetPanels: sheetPanels35,
  sheet: [
    {id: 'ident',     title: 'Character',            size: 'full', keep: true},
    {id: 'abilities', title: 'Ability scores',       size: 'half'},
    {id: 'combat',    title: 'Combat',               size: 'half'},
    {id: 'saves',     title: 'Saving throws',        size: 'half'},
    {id: 'languages', title: 'Languages',            size: 'half'},
    {id: 'gear',      title: 'Gear',                 size: 'full'},
    {id: 'attacks',   title: 'Attacks',              size: 'full'},
    {id: 'bonuses',   title: 'Bonuses in effect',    size: 'full'},
    {id: 'special',   title: 'Special abilities & class features', size: 'full'},
  ],
  tabs: {skills: renderSkills, spells: renderSpells, tracker: renderTracker, items: renderItems, companions: renderCompanions},
});
