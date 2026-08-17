/**
 * Launch suggestions built from the .asphodel/paradise (PRD) card pool.
 * Counts target Standard constructed: Material ≤12 unique, Main ≥60 (max 4).
 */

function linesFromCounts(counts) {
  return counts.map(([quantity, name]) => `${quantity} ${name}`);
}

function formatSuggestionDeck({ name, blurb, material, main, sideboard = [] }) {
  return [
    `// ${name}`,
    `// ${blurb}`,
    "// Built with AdvGA from the PRD (.asphodel/paradise) card pool",
    "",
    "# Material Deck",
    "",
    ...material.map((name) => `1 ${name}`),
    "",
    "# Main Deck",
    "",
    ...linesFromCounts(main),
    "",
    "# Sideboard",
    "",
    ...linesFromCounts(sideboard),
    "",
  ].join("\n");
}

/** Dante Hemomancer — Water / Exia Mage (official starter identity). */
export const PRD_DANTE_HEMOMANCER = formatSuggestionDeck({
  name: "PRD Dante Hemomancer",
  blurb: "PRD suggestion — Water/Exia Mage. Elysian allies, empower spells, recover & sacrifice value.",
  material: [
    "Spirit of Water",
    "Dante, Prodigal Swain",
    "Dante, Aenean Initiate",
    "Dante, Hemomancer",
    "Seed of Empowerment",
    "Evaporation Synchron",
    "Wind Surge Emitter",
    "Extinguishing Synchron",
    "Revoker Bell",
    "Discharger",
    "Fanned Synchron",
    "FlameTech Manual",
  ],
  main: [
    [4, "Embryonic Hemosynth"],
    [4, "Elysian Aspirant"],
    [4, "Thanatotic Hemosynth"],
    [4, "Where Futures Stir"],
    [4, "Heighten Spellcraft"],
    [4, "Blood Surge"],
    [3, "Aenean Ward"],
    [3, "Umbilical Ritual"],
    [3, "Waterfall Sage"],
    [3, "Fractal of Insight"],
    [3, "Perfusive Envelopment"],
    [3, "Cryogenic Ritual"],
    [2, "Aenean Frozen Shunt"],
    [2, "Aenean Swelling Tides"],
    [2, "Frigid Embrittlement"],
    [2, "Vascular Collapse"],
    [2, "Rhesus Eradication"],
    [2, "Varicose Amplification"],
    [2, "Keen Tidebinder"],
    [2, "Elysian Orphan"],
    [1, "Aenean Frostlance"],
    [1, "Judas, Claret Intercessor"],
  ],
  sideboard: [
    [2, "Aenean Crystallization"],
    [2, "Frostbind"],
    [2, "Peer the Depths"],
    [2, "Sift"],
    [1, "Nascent Blast"],
    [1, "Eminence in Fury"],
    [1, "Convergent Beam"],
    [1, "Aenean Cryosalvo"],
    [1, "Bifurcating Fractal"],
    [1, "Tidal Fractal"],
    [1, "ChannelTech Charm S"],
  ],
});

/** Lorraine Arclight Saber — Fire / Arcane Warrior (official starter identity). */
export const PRD_LORRAINE_ARCLIGHT = formatSuggestionDeck({
  name: "PRD Lorraine Arclight",
  blurb: "PRD suggestion — Fire/Arcane Warrior. Champion attacks, linked gear, static-counter Arcane swings.",
  material: [
    "Spirit of Fire",
    "Lorraine, Wandering Warrior",
    "Lorraine, Honed Operative",
    "Lorraine, Arclight Saber",
    "Battery Core X",
    "FlameTech Manual",
    "Fanned Synchron",
    "AquaTech Blade X",
    "Seed of Empowerment",
    "Revoker Bell",
    "Discharger",
    "Cell Reactor",
  ],
  main: [
    [4, "Emberslash"],
    [4, "Fulgurite Coordinator"],
    [4, "Triboelectric Fortification"],
    [4, "Blistering Insurgent"],
    [4, "Package Courier"],
    [4, "Tindered Soldier"],
    [4, "Stoked Slice"],
    [4, "Conductive Strike"],
    [3, "Scars of Old"],
    [3, "FlameTech BladeCore"],
    [3, "Ionizer X Ultra"],
    [3, "Brooch X Ultra"],
    [2, "Arrest Lightning"],
    [2, "Inflamed Bladehand"],
    [2, "Outfitted Ravager"],
    [2, "Rampant Bladehand"],
    [2, "Return Stroke"],
    [2, "Rumble Coordinator"],
    [1, "Plutus, Fortune's Favor"],
    [1, "Molten Impact"],
    [1, "Vel-ocity Punch"],
    [1, "Leran, Pastoral Hymns"],
  ],
  sideboard: [
    [2, "FlameTech Shield"],
    [2, "AquaTech Shield"],
    [2, "AquaTech Shell"],
    [2, "Induction Strike"],
    [1, "Thermal Break"],
    [1, "Aenean Pointed Flare"],
    [1, "Aenean Guttering Flames"],
    [1, "Exhilarating Plume"],
    [1, "Piccarda, Night Rider"],
    [1, "Soaked Slash"],
    [1, "Fountain Bladehand"],
  ],
});

export const PRD_DECK_SUGGESTIONS = [
  {
    id: "prd-dante",
    label: "Load Dante (Water/Exia)",
    shortLabel: "Dante PRD",
    description: "Mage · Water / Exia · Elysian sacrifice & empower",
    listText: PRD_DANTE_HEMOMANCER,
    guideHref: "guides/prd-dante-hemomancer.html",
    guideLabel: "Dante guide",
  },
  {
    id: "prd-lorraine",
    label: "Load Lorraine (Fire/Arcane)",
    shortLabel: "Lorraine PRD",
    description: "Warrior · Fire / Arcane · Attacks & linked gear",
    listText: PRD_LORRAINE_ARCLIGHT,
    guideHref: "guides/prd-lorraine-arclight.html",
    guideLabel: "Lorraine guide",
  },
];

/** All illustrated play guides (shown in the Guides section). */
export const PLAY_GUIDES = [
  {
    id: "guide-fire-aggro",
    title: "Fire Aggro — Lorraine Blademaster",
    blurb: "All-sets Fire Warrior: discard fuel, champion attacks, Sword pressure.",
    href: "guides/aggro-fire-lorraine.html",
    group: "Aggro",
  },
  {
    id: "guide-water-aggro",
    title: "Water Aggro — Mordred Flawless",
    blurb: "All-sets Water Warrior: Deluge attacks and floating-memory swings.",
    href: "guides/aggro-water-mordred.html",
    group: "Aggro",
  },
  {
    id: "guide-wind-aggro",
    title: "Wind Aggro — Tristan Shadowdancer",
    blurb: "All-sets Wind Assassin: preparation, ambush, Combo Strike chains.",
    href: "guides/aggro-wind-tristan.html",
    group: "Aggro",
  },
  {
    id: "guide-prd-lorraine",
    title: "PRD Lorraine Arclight",
    blurb: ".asphodel/paradise Fire / Arcane Warrior starter shell.",
    href: "guides/prd-lorraine-arclight.html",
    group: "PRD",
  },
  {
    id: "guide-prd-dante",
    title: "PRD Dante Hemomancer",
    blurb: ".asphodel/paradise Water / Exia Mage starter shell.",
    href: "guides/prd-dante-hemomancer.html",
    group: "PRD",
  },
];
