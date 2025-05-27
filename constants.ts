
import { TabDefinition, CreatureTemplate, AbilityScores, ActionDetail, SkillProficiencies, SidePanelTabName, SavingThrowProficiencies, RaceDetail, ClassDetail, BackgroundDetail, FeatDetail, ClassFeatureChoice, SkillDefinition, LanguageDefinition, EquipmentChoice, EquipmentOption, Item, EquipmentSlot, ItemCategory } from './types';
import { generateId } from './utils';

// --- Fundamental Constants & Simple Data ---
export const GRID_CELL_SIZE = 50;
export const INITIAL_VIEWBOX_WIDTH = 1200;
export const INITIAL_VIEWBOX_HEIGHT = 800;
export const MIN_ZOOM_WIDTH = GRID_CELL_SIZE * 1.5;
export const MAX_ZOOM_WIDTH = INITIAL_VIEWBOX_WIDTH * 4;
export const ZOOM_SENSITIVITY_WHEEL = 1.05;
export const TOKEN_DEFAULT_RADIUS = GRID_CELL_SIZE * 0.4;

export const COLORS = [
  'rgba(59, 130, 246, 0.85)', // blue-500
  'rgba(239, 68, 68, 0.85)',  // red-500
  'rgba(245, 158, 11, 0.85)', // amber-500
  'rgba(16, 185, 129, 0.85)', // emerald-500
  'rgba(139, 92, 246, 0.85)', // violet-500
  'rgba(236, 72, 153, 0.85)', // pink-500
  'rgba(34, 197, 94, 0.85)', // green-500 (for gobbos!)
  'rgba(107, 114, 128, 0.85)', // gray-500 (for orcs!)
];

export const SELECTED_TOKEN_COLOR = 'rgba(34, 197, 94, 0.9)';
export const SELECTED_TOKEN_STROKE_COLOR = 'rgba(209, 250, 229, 1)';
export const MULTI_SELECTED_TOKEN_STROKE_COLOR = 'rgba(52, 211, 153, 1)';

export const PING_COLOR = 'rgba(52, 211, 153, 0.8)';
export const PING_DURATION_MS = 1500;
export const PING_MAX_RADIUS_FACTOR = 1.5 * GRID_CELL_SIZE;
export const PING_HOLD_DURATION_MS = 300;
export const PING_MOVE_THRESHOLD_PX = 5;

export const MARQUEE_FILL_COLOR = 'rgba(59, 130, 246, 0.2)';
export const MARQUEE_STROKE_COLOR = 'rgba(59, 130, 246, 0.7)';
export const MARQUEE_STROKE_WIDTH = 1;

export const SCROLLBAR_THICKNESS = 12;
export const SCROLLBAR_COLOR = 'rgba(100, 116, 139, 0.7)';
export const SCROLLBAR_TRACK_COLOR = 'rgba(51, 65, 85, 0.3)';
export const SCROLLBAR_HOVER_COLOR = 'rgba(100, 116, 139, 0.9)';

export const WORLD_WIDTH = GRID_CELL_SIZE * 500;
export const WORLD_HEIGHT = GRID_CELL_SIZE * 500;

export const DEFAULT_ABILITY_SCORES: AbilityScores = {
  strength: 10, dexterity: 10, constitution: 10,
  intelligence: 10, wisdom: 10, charisma: 10,
};

export const DND_ABILITY_SCORES_LIST: (keyof AbilityScores)[] = [
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'
];
export const DND_STANDARD_ARRAY: number[] = [15, 14, 13, 12, 10, 8];

export const DEFAULT_SKILL_PROFICIENCIES: SkillProficiencies = {
  athletics: false, acrobatics: false, sleightOfHand: false, stealth: false,
  arcana: false, history: false, investigation: false, nature: false, religion: false,
  animalHandling: false, insight: false, medicine: false, perception: false, survival: false,
  deception: false, intimidation: false, performance: false, persuasion: false,
};

export const DEFAULT_SAVING_THROW_PROFICIENCIES: SavingThrowProficiencies = {
  strength: false, dexterity: false, constitution: false,
  intelligence: false, wisdom: false, charisma: false,
};

export const DND_SKILLS_DEFINITIONS: SkillDefinition[] = [
  { id: 'acrobatics', name: 'Acrobatics', ability: 'dexterity', description: "Your Dexterity (Acrobatics) check covers your attempt to stay on your feet in a tricky situation, such as when you’re trying to run across a sheet of ice, balance on a tightrope, or stay upright on a rocking ship’s deck. The DM might also call for a Dexterity (Acrobatics) check to see if you can perform acrobatic stunts, including dives, rolls, somersaults, and flips." },
  { id: 'animalHandling', name: 'Animal Handling', ability: 'wisdom', description: "When there is any question whether you can calm down a domesticated animal, keep a mount from getting spooked, or intuit an animal’s intentions, the DM might call for a Wisdom (Animal Handling) check. You also make a Wisdom (Animal Handling) check to control your mount when you attempt a risky maneuver." },
  { id: 'arcana', name: 'Arcana', ability: 'intelligence', description: "Your Intelligence (Arcana) check measures your ability to recall lore about spells, magic items, eldritch symbols, magical traditions, the planes of existence, and the inhabitants of those planes." },
  { id: 'athletics', name: 'Athletics', ability: 'strength', description: "Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming. Examples include: trying to climb a sheer or slippery cliff, avoid hazards while scaling a wall, or cling to a surface while something is trying to knock you off; trying to jump an unusually long distance or pull off a stunt midjump; struggling to swim or stay afloat in treacherous currents, storm-whipped waves, or areas of thick seaweed." },
  { id: 'deception', name: 'Deception', ability: 'charisma', description: "Your Charisma (Deception) check determines whether you can convincingly hide the truth, either verbally or through your actions. This deception can encompass everything from misleading others through ambiguity to telling outright lies. Typical situations include trying to fast-talk a guard, con a merchant, earn money through gambling, pass yourself off in a disguise, dull someone’s suspicions with false assurances, or maintain a straight face while telling a blatant lie." },
  { id: 'history', name: 'History', ability: 'intelligence', description: "Your Intelligence (History) check measures your ability to recall lore about historical events, legendary people, ancient kingdoms, past disputes, recent wars, and lost civilizations." },
  { id: 'insight', name: 'Insight', ability: 'wisdom', description: "Your Wisdom (Insight) check decides whether you can determine the true intentions of a creature, such as when searching out a lie or predicting someone’s next move. Doing so involves gleaning clues from body language, speech habits, and changes in mannerisms." },
  { id: 'intimidation', name: 'Intimidation', ability: 'charisma', description: "When you attempt to influence someone through overt threats, hostile actions, and physical violence, the DM might ask you to make a Charisma (Intimidation) check. Examples include trying to pry information out of a prisoner, convincing street thugs to back down from a confrontation, or using the edge of a broken bottle to convince a sneering vizier to reconsider a decision." },
  { id: 'investigation', name: 'Investigation', ability: 'intelligence', description: "When you look around for clues and make deductions based on those clues, you make an Intelligence (Investigation) check. You might deduce the location of a hidden object, discern from the appearance of a wound what kind of weapon dealt it, or determine the weakest point in a tunnel that could cause it to collapse. Poring through ancient scrolls in search of a hidden fragment of knowledge might also call for an Intelligence (Investigation) check." },
  { id: 'medicine', name: 'Medicine', ability: 'wisdom', description: "A Wisdom (Medicine) check lets you try to stabilize a dying companion or diagnose an illness." },
  { id: 'nature', name: 'Nature', ability: 'intelligence', description: "Your Intelligence (Nature) check measures your ability to recall lore about terrain, plants and animals, the weather, and natural cycles." },
  { id: 'perception', name: 'Perception', ability: 'wisdom', description: "Your Wisdom (Perception) check lets you spot, hear, or otherwise detect the presence of something. It measures your general awareness of your surroundings and the keenness of your senses. For example, you might try to hear a conversation through a closed door, eavesdrop under an open window, or hear monsters moving stealthily in the forest. Or you might try to spot things that are obscured or easy to miss, whether they are orcs lying in ambush on a road, thugs hiding in the shadows of an alley, or candlelight under a closed secret door." },
  { id: 'performance', name: 'Performance', ability: 'charisma', description: "Your Charisma (Performance) check determines how well you can delight an audience with music, dance, acting, storytelling, or some other form of entertainment." },
  { id: 'persuasion', name: 'Persuasion', ability: 'charisma', description: "When you attempt to influence someone or a group of people with tact, social graces, or good nature, the DM might ask you to make a Charisma (Persuasion) check. Typically, you use persuasion when acting in good faith, to foster friendships, make cordial requests, or exhibit proper etiquette. Examples of persuading others include convincing a chamberlain to let your party see the king, negotiating peace between warring tribes, or inspiring a crowd of townsfolk." },
  { id: 'religion', name: 'Religion', ability: 'intelligence', description: "Your Intelligence (Religion) check measures your ability to recall lore about deities, rites and prayers, religious hierarchies, holy symbols, and the practices of secret cults." },
  { id: 'sleightOfHand', name: 'Sleight of Hand', ability: 'dexterity', description: "Whenever you attempt an act of legerdemain or manual trickery, such as planting something on someone else or concealing an object on your person, make a Dexterity (Sleight of Hand) check. The DM might also call for a Dexterity (Sleight of Hand) check to determine whether you can lift a coin purse off another person or slip something out of another person’s pocket." },
  { id: 'stealth', name: 'Stealth', ability: 'dexterity', description: "Make a Dexterity (Stealth) check when you attempt to conceal yourself from enemies, slink past guards, slip away without being noticed, or sneak up on someone without being seen or heard." },
  { id: 'survival', name: 'Survival', ability: 'wisdom', description: "The DM might ask you to make a Wisdom (Survival) check to follow tracks, hunt wild game, guide your group through frozen wastelands, identify signs that owlbears live nearby, predict the weather, or avoid quicksand and other natural hazards." },
];
export const DND_SKILLS_OPTION_LIST = DND_SKILLS_DEFINITIONS.map(s => s.id);

export const DND_LANGUAGES_DEFINITIONS: LanguageDefinition[] = [
  { id: "common", name: "Common", description: "The trade language of most civilized lands. Almost everyone speaks it.", typicalSpeakers: "Humans, Halflings, many others" },
  { id: "elvish", name: "Elvish", description: "A fluid language with subtle intonations and intricate grammar. Known for its poetry and song.", typicalSpeakers: "Elves, Half-elves" },
  { id: "dwarvish", name: "Dwarvish", description: "A harsh, guttural language full of hard consonants. Often written in runes.", typicalSpeakers: "Dwarves" },
  { id: "giant", name: "Giant", description: "A simple, blustering language used by giants and ogres.", typicalSpeakers: "Giants, Ogres" },
  { id: "gnomish", name: "Gnomish", description: "A precise language filled with technical terms and a complex system of naming.", typicalSpeakers: "Gnomes" },
  { id: "goblin", name: "Goblin", description: "A yapping, unpleasant language composed of simple words and phrases.", typicalSpeakers: "Goblins, Hobgoblins, Bugbears" },
  { id: "halfling", name: "Halfling", description: "A warm, flowing language that reflects the halfling emphasis on home and hearth.", typicalSpeakers: "Halflings" },
  { id: "orc", name: "Orc", description: "A harsh, grating language with a simple vocabulary, reflecting the orcish focus on warfare.", typicalSpeakers: "Orcs, Half-orcs" },
  { id: "abyssal", name: "Abyssal", description: "The chaotic, rasping language of demons.", typicalSpeakers: "Demons, chaotic evil cultists" },
  { id: "celestial", name: "Celestial", description: "The melodic, harmonious language of celestials.", typicalSpeakers: "Celestials (angels, devas)" },
  { id: "draconic", name: "Draconic", description: "The ancient, powerful language of dragons. Often used in magic.", typicalSpeakers: "Dragons, Dragonborn, Kobolds" },
  { id: "deep_speech", name: "Deep Speech", description: "An alien, sanity-twisting language spoken by aberrations.", typicalSpeakers: "Aboleths, Mind Flayers" },
  { id: "infernal", name: "Infernal", description: "The precise, legalistic language of devils.", typicalSpeakers: "Devils, lawful evil cultists" },
  { id: "primordial", name: "Primordial", description: "The raw, elemental language spoken by elementals. It has dialects like Auran, Aquan, Ignan, and Terran.", typicalSpeakers: "Elementals, Genies" },
  { id: "sylvan", name: "Sylvan", description: "The musical, whimsical language of fey creatures.", typicalSpeakers: "Fey (dryads, pixies, satyrs)" },
  { id: "undercommon", name: "Undercommon", description: "The trade language of the Underdark, a mishmash of various subterranean tongues.", typicalSpeakers: "Drow, Duergar, Svirfneblin, other Underdark dwellers" }
];
export const DND_LANGUAGES_OPTION_LIST = DND_LANGUAGES_DEFINITIONS.map(l => l.id);

export const DND_WEAPON_PROFICIENCIES_LIST: string[] = [
  "Simple Weapons", "Martial Weapons", 
  "Shortswords", "Longswords", "Greatswords", "Scimitars", "Rapiers", "Daggers", 
  "Handaxes", "Battleaxes", "Greataxes", 
  "Light Hammers", "Warhammers", 
  "Maces", "Flails", "Morningstars", 
  "Quarterstaffs", "Sickles", "Spears", "Pikes", "Halberds", "Glaives", 
  "Shortbows", "Longbows", "Slings", 
  "Light Crossbows", "Hand Crossbows", "Heavy Crossbows", 
  "Blowguns", "Nets"
];

export const DND_ARMOR_PROFICIENCIES_LIST: string[] = [
  "Light Armor", "Medium Armor", "Heavy Armor", "Shields"
];

export const DND_TOOL_PROFICIENCIES_LIST: string[] = [
  "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies", "Carpenter's Tools", 
  "Cartographer's Tools", "Cobbler's Tools", "Cook's Utensils", "Glassblower's Tools", 
  "Jeweler's Tools", "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies", 
  "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools", "Woodcarver's Tools", 
  "Disguise Kit", "Forgery Kit", 
  "Gaming Set (Dice)", "Gaming Set (Playing Cards)", "Gaming Set (Chess)", "Gaming Set (Dragonchess)",
  "Herbalism Kit", 
  "Musical Instrument (Bagpipes)", "Musical Instrument (Drum)", "Musical Instrument (Dulcimer)", 
  "Musical Instrument (Flute)", "Musical Instrument (Lute)", "Musical Instrument (Lyre)", 
  "Musical Instrument (Horn)", "Musical Instrument (Pan Flute)", "Musical Instrument (Shawm)", 
  "Musical Instrument (Viol)", 
  "Navigator's Tools", "Poisoner's Kit", "Thieves' Tools", 
  "Vehicles (Land)", "Vehicles (Water)"
];

export const DND_ITEMS_LIST_NAMES: string[] = [
  "Backpack", "Bedroll", "Mess Kit", "Tinderbox", "Torch", "Rations (1 day)", "Waterskin", "Rope (50 feet, hempen)", "Rope (50ft)",
  "Crowbar", "Hammer", "Piton", "Bell", "Candle", "Ink (1 ounce bottle)", "Ink Pen", "Parchment (one sheet)",
  "Little Bag of Sand", "Small Knife",
  "Chain Mail", "Leather Armor", "Shield", "Scale Mail", "Plate Armor", "Padded Armor", "Studded Leather",
  "Longsword", "Shortsword", "Dagger", "Mace", "Warhammer", "Greataxe", "Handaxe", "Javelin",
  "Longbow", "Shortbow", "Arrows (20)", "Quiver",
  "Light Crossbow", "Crossbow Bolts (20)", "Case for Crossbow Bolts", "Heavy Crossbow", "Hand Crossbow",
  "Sling", "Sling Bullets (20)",
  "Quarterstaff", "Spear", "Club", "Greatclub", "Sickle", "Scimitar", "Rapier",
  "Component Pouch", "Spellbook (blank)", "Arcane Focus (Crystal)", "Arcane Focus (Orb)", "Arcane Focus (Rod)", "Arcane Focus (Staff)", "Arcane Focus (Wand)",
  "Holy Symbol (Amulet)", "Holy Symbol (Emblem)", "Holy Symbol (Reliquary)",
  "Druidic Focus (Sprig of Mistletoe)", "Druidic Focus (Totem)", "Druidic Focus (Wooden Staff)", "Druidic Focus (Yew Wand)",
  "Dungeoneer's Pack", "Explorer's Pack", "Priest's Pack", "Scholar's Pack", "Diplomat's Pack", "Entertainer's Pack", "Burglar's Pack",
  "Potion of Healing", "Antitoxin", "Healer's Kit",
  "Thieves' Tools", "Disguise Kit", "Forgery Kit", "Herbalism Kit", "Navigator's Tools", "Poisoner's Kit",
  "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies", "Carpenter's Tools", "Cartographer's Tools",
  "Cobbler's Tools", "Cook's Utensils", "Glassblower's Tools", "Jeweler's Tools", "Leatherworker's Tools",
  "Mason's Tools", "Painter's Supplies", "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools", "Woodcarver's Tools",
  "Gaming Set (Dice)", "Gaming Set (Playing Cards)", "Gaming Set (Chess)",
  "Musical Instrument (Lute)", "Musical Instrument (Flute)", "Musical Instrument (Drum)", "Musical Instrument (Lyre)", "Musical Instrument (Horn)",
  "Common Clothes", "Traveler's Clothes", "Fine Clothes", "Robes", "Costume Clothes",
  "Belt Pouch", "Sack", "Chest", "Barrel", "Bucket", "Flask or Tankard", "Jug or Pitcher", "Pot, Iron", "Vial",
  "Gold Piece (gp)", "Silver Piece (sp)", "Copper Piece (cp)", "Electrum Piece (ep)", "Platinum Piece (pp)",
  "Insignia of Rank", "Trophy (from fallen enemy)", "Bottle of Black Ink", "Quill", "Letter from a Dead Colleague",
  "Manacles", "Mirror, Steel", "Oil (flask)", "Perfume (vial)", "Pick, Miner's", "Pole (10-foot)", "Rope, Silk (50 feet)", "Sealing Wax",
  "Shovel", "Soap", "Spyglass", "Tent, Two-Person", "Whetstone"
];

export const DND_EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'mainHand', 'offHand', 'armor', 'helmet', 'boots', 'gloves', 'amulet', 'ring1', 'ring2', 'cape', 'belt'
];


// --- Complex Data Constants (Spells, Items, Races, Classes, etc.) ---

// Spell Definitions (uses generateId indirectly via generateSpellId)
const spellIdCache = new Set<string>();
const generateSpellId = (baseName: string): string => {
  let counter = 0;
  let id = `spell_${baseName.toLowerCase().replace(/\s+/g, '_')}`;
  while(spellIdCache.has(id + (counter > 0 ? `_${counter}` : ''))) {
    counter++;
  }
  const finalId = id + (counter > 0 ? `_${counter}` : '');
  spellIdCache.add(finalId);
  return finalId;
}

export const DND_SPELLS_DEFINITIONS: ActionDetail[] = [
  {
    id: generateSpellId('fire_bolt'),
    name: "Fire Bolt",
    description: "You hurl a mote of fire at a creature or object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 fire damage. A flammable object hit by this spell ignites if it isn't being worn or carried. This spell's damage increases by 1d10 when you reach 5th level (2d10), 11th level (3d10), and 17th level (4d10).",
    actionCategory: 'spell',
    spellLevel: "Cantrip",
    castingTime: "1 Action",
    range: "120 feet",
    components: { V: true, S: true },
    duration: "Instantaneous",
    school: "Evocation",
    isAttack: true,
    attackSettings: { ability: 'intelligence', proficient: true }, 
    damage: [{ id: generateId('dmg_fb'), dice: "1d10", type: "Fire" }],
    source: "PHB",
  },
  {
    id: generateSpellId('light'),
    name: "Light",
    description: "You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet. The light can be colored as you like. Completely covering the object with something opaque blocks the light. The spell ends if you cast it again or dismiss it as an action.",
    actionCategory: 'spell',
    spellLevel: "Cantrip",
    castingTime: "1 Action",
    range: "Touch",
    components: { V: true, M: "a firefly or phosphorescent moss" },
    duration: "1 hour",
    school: "Evocation",
    target: "One object",
    effects: ["Object sheds bright light (20-ft) and dim light (20-ft)"],
    source: "PHB"
  },
  {
    id: generateSpellId('magic_missile'),
    name: "Magic Missile",
    actionCategory: "spell", spellLevel: "1st", castingTime: "1 Action", range: "120 feet", duration: "Instantaneous",
    components: {V: true, S: true}, school: "Evocation",
    description: "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several. Higher Levels: When you cast this spell using a spell slot of 2nd level or higher, the spell creates one more dart for each slot level above 1st.",
    damage: [{id: generateId('dmg_mage_mm'), dice: "1d4+1", type: "Force"}], 
    effects: ["Hits automatically", "Creates 3 darts (more at higher levels)"],
    source: "PHB"
  },
  {
    id: generateSpellId('shield_spell'), 
    name: "Shield (Spell)", 
    actionCategory: "spell", spellLevel: "1st", castingTime: "1 Reaction (which you take when you are hit by an attack or targeted by the magic missile spell)", range: "Self", duration: "1 round",
    components: {V: true, S: true}, school: "Abjuration",
    description: "An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile.",
    effects: ["+5 bonus to AC for 1 round"],
    source: "PHB"
  },
  {
    id: generateSpellId('fireball'),
    name: "Fireball",
    description: "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one. The fire spreads around corners. It ignites flammable objects in the area that aren't being worn or carried.",
    actionCategory: 'spell',
    spellLevel: "3rd",
    castingTime: "1 Action",
    range: "150 feet",
    components: { V: true, S: true, M: "a tiny ball of bat guano and sulfur" },
    duration: "Instantaneous",
    school: "Evocation",
    damage: [{ id: generateId('dmg_fireball'), dice: "8d6", type: "Fire" }],
    areaOfEffect: { type: 'sphere', size: 20, description: "20-foot-radius sphere" },
    savingThrow: { stat: 'dexterity', effectOnSave: "half damage", effectOnFailure: "full damage" },
    source: "PHB",
  },
  {
    id: generateSpellId('truestrike'),
    name: "True Strike",
    description: "You extend your hand and point a finger at a target in range. Your magic grants you a brief insight into the target's defenses. On your next turn, you gain advantage on your first attack roll against the target, provided that this spell hasn't ended.",
    actionCategory: 'spell',
    spellLevel: "Cantrip",
    castingTime: "1 Action",
    range: "30 feet",
    components: { S: true },
    duration: "Concentration, up to 1 round",
    school: "Divination",
    effects: ["Gain advantage on your first attack roll against the target on your next turn."],
    target: "One creature",
    source: "PHB",
    grantsCasterAdvantageOnNextAttack: true,
  },
  {
    id: generateSpellId('hypnoticpattern'),
    name: "Hypnotic Pattern",
    description: "You create a twisting pattern of colors that weaves through the air inside a 30-foot cube within range. The pattern appears for a moment and vanishes. Each creature in the area who sees the pattern must make a Wisdom saving throw. On a failed save, the creature becomes charmed for the duration. While charmed by this spell, the creature is incapacitated and has a speed of 0. The spell ends for an affected creature if it takes any damage or if someone else uses an action to shake the creature out of its stupor.",
    actionCategory: 'spell',
    spellLevel: "3rd",
    castingTime: "1 Action",
    range: "120 feet",
    components: { S: true, M: "a glowing stick of incense or a crystal vial filled with phosphorescent material" },
    duration: "Concentration, up to 1 minute",
    school: "Illusion",
    areaOfEffect: { type: 'cube', size: 30, description: "30-foot cube" },
    savingThrow: { stat: 'wisdom', effectOnFailure: "Charmed (incapacitated, speed 0)"},
    source: "PHB",
  },
  {
    id: generateSpellId('leomundstinyhut'),
    name: "Leomund's Tiny Hut",
    description: "A 10-foot-radius immobile dome of force springs into existence around and above you and remains stationary for the duration. The spell ends if you leave its area. Nine creatures of Medium size or smaller can fit under the dome with you. The spell fails if its area includes a larger creature or more than nine creatures. Creatures and objects within the dome when you cast this spell can move through it freely. All other creatures and objects are barred from passing through it. Spells and other magical effects can't extend through the dome or be cast through it. The atmosphere inside the dome is comfortable and dry, regardless of the weather outside. Until the spell ends, you can command the interior to become dimly lit or dark. The dome is opaque from the outside, of any color you choose, but it is transparent from the inside.",
    actionCategory: 'spell',
    spellLevel: "3rd",
    castingTime: "1 minute",
    isRitual: true,
    range: "Self",
    components: { V: true, S: true, M: "a small crystal bead" },
    duration: "8 hours",
    school: "Evocation",
    effects: ["Creates a 10-ft radius dome of force"],
    areaOfEffect: { type: 'sphere', size: 10, description: "10-foot-radius immobile dome" },
    source: "PHB",
  },
  {
    id: generateSpellId('gust'),
    name: "Gust",
    description: "You seize the air and compel it to create one of the following effects at a point you can see within range:\n- One Medium or smaller creature that you choose must succeed on a Strength saving throw or be pushed up to 5 feet away from you.\n- You create a small blast of air capable of moving one object that is neither held nor carried and that weighs no more than 5 pounds. The object is pushed up to 10 feet away from you. It isn’t pushed with enough force to cause damage.\n- You create a harmless sensory effect using air, such as causing leaves to rustle, wind to slam shutters shut, or your clothing to ripple in a breeze.",
    actionCategory: 'spell',
    spellLevel: "Cantrip",
    castingTime: "1 Action",
    range: "30 feet",
    components: { V: true, S: true },
    duration: "Instantaneous",
    school: "Transmutation",
    effects: ["Push creature (STR save), move small object, or sensory effect"],
    target: "One creature or object or point in space",
    savingThrow: { stat: 'strength', effectOnFailure: "Pushed up to 5 feet (if creature)"},
    source: "XGtE",
  },
  {
    id: generateSpellId('bless'),
    name: "Bless",
    description: "You bless up to three creatures of your choice within range. Whenever a target makes an attack roll or a saving throw before the spell ends, the target can roll a d4 and add the number rolled to the attack roll or saving throw.",
    actionCategory: 'spell',
    spellLevel: "1st",
    castingTime: "1 Action",
    range: "30 feet",
    components: { V: true, S: true, M: "a sprinkling of holy water" },
    duration: "Concentration, up to 1 minute",
    school: "Enchantment",
    effects: ["Up to 3 targets add 1d4 to attack rolls and saving throws"],
    target: "Up to three creatures",
    source: "PHB",
  },
  {
    id: generateSpellId('burninghands'),
    name: "Burning Hands",
    description: "As you hold your hands with thumbs touching and fingers spread, a thin sheet of flames shoots forth from your outstretched fingertips. Each creature in a 15-foot cone must make a Dexterity saving throw. A creature takes 3d6 fire damage on a failed save, or half as much damage on a successful one. The fire ignites any flammable objects in the area that aren't being worn or carried.",
    actionCategory: 'spell',
    spellLevel: "1st",
    castingTime: "1 Action",
    range: "Self",
    components: { V: true, S: true },
    duration: "Instantaneous",
    school: "Evocation",
    damage: [{ id: generateId('dmg_bh'), dice: "3d6", type: "Fire" }],
    areaOfEffect: { type: 'cone', size: 15, description: "15-foot cone" },
    savingThrow: { stat: 'dexterity', effectOnSave: "half damage", effectOnFailure: "full damage" },
    source: "PHB",
  },
  {
    id: generateSpellId('lightningbolt'),
    name: "Lightning Bolt",
    description: "A stroke of lightning forming a line 100 feet long and 5 feet wide blasts out from you in a direction you choose. Each creature in the line must make a Dexterity saving throw. A creature takes 8d6 lightning damage on a failed save, or half as much damage on a successful one. The lightning ignites flammable objects in the area that aren't being worn or carried.",
    actionCategory: 'spell',
    spellLevel: "3rd",
    castingTime: "1 Action",
    range: "Self",
    components: { V: true, S: true, M: "a bit of fur and a rod of amber, crystal, or glass" },
    duration: "Instantaneous",
    school: "Evocation",
    damage: [{ id: generateId('dmg_lb'), dice: "8d6", type: "Lightning" }],
    areaOfEffect: { type: 'line', size: 100, sizeY: 5, description: "100-foot long, 5-foot wide line" },
    savingThrow: { stat: 'dexterity', effectOnSave: "half damage", effectOnFailure: "full damage" },
    source: "PHB",
  },
  {
    id: generateSpellId('grease'),
    name: "Grease",
    description: "Slick grease covers the ground in a 10-foot square centered on a point within range and turns it into difficult terrain for the duration. When the grease appears, each creature standing in its area must succeed on a Dexterity saving throw or fall prone. A creature that enters the area or ends its turn there must also succeed on a Dexterity saving throw or fall prone.",
    actionCategory: 'spell',
    spellLevel: "1st",
    castingTime: "1 Action",
    range: "60 feet",
    components: { V: true, S: true, M: "a bit of pork rind or butter" },
    duration: "1 minute",
    school: "Conjuration",
    areaOfEffect: { type: 'cube', size: 10, description: "10-foot square (difficult terrain)" }, 
    savingThrow: { stat: 'dexterity', effectOnFailure: "fall prone"},
    source: "PHB",
  },
   {
    id: generateSpellId('mage_hand'),
    name: "Mage Hand",
    description: "A spectral, floating hand appears at a point you choose within range. The hand lasts for the duration or until you dismiss it as an action. The hand vanishes if it is ever more than 30 feet away from you or if you cast this spell again. You can use your action to control the hand. You can use the hand to manipulate an object, open an unlocked door or container, stow or retrieve an item from an open container, or pour the contents out of a vial. You can move the hand up to 30 feet each time you use it. The hand can’t attack, activate magical items, or carry more than 10 pounds.",
    actionCategory: 'spell',
    spellLevel: "Cantrip",
    castingTime: "1 Action",
    range: "30 feet",
    components: { V: true, S: true },
    duration: "1 minute",
    school: "Conjuration",
    effects: ["Creates a spectral hand to manipulate objects."],
    source: "PHB",
  },
  {
    id: generateSpellId('prestidigitation'),
    name: "Prestidigitation",
    description: "This spell is a minor magical trick that novice spellcasters use for practice. You create one of the following magical effects within range: You create an instantaneous, harmless sensory effect, such as a shower of sparks, a puff of wind, faint musical notes, or an odd odor. You instantaneously light or snuff out a candle, a torch, or a small campfire. You instantaneously clean or soil an object no larger than 1 cubic foot. You chill, warm, or flavor up to 1 cubic foot of nonliving material for 1 hour. You make a color, a small mark, or a symbol appear on an object or a surface for 1 hour. You create a nonmagical trinket or an illusory image that can fit in your hand and that lasts until the end of your next turn. If you cast this spell multiple times, you can have up to three of its non-instantaneous effects active at a time, and you can dismiss such an effect as an action.",
    actionCategory: 'spell',
    spellLevel: "Cantrip",
    castingTime: "1 Action",
    range: "10 feet",
    components: { V: true, S: true },
    duration: "Up to 1 hour",
    school: "Transmutation",
    effects: ["Perform minor magical tricks."],
    source: "PHB",
  },
  {
    id: generateSpellId('feather_fall'),
    name: "Feather Fall",
    description: "Choose up to five falling creatures within range. A falling creature's rate of descent slows to 60 feet per round until the spell ends. If the creature lands before the spell ends, it takes no falling damage and can land on its feet, and the spell ends for that creature.",
    actionCategory: 'spell',
    spellLevel: "1st",
    castingTime: "1 Reaction, which you take when you or a creature within 60 feet of you falls",
    range: "60 feet",
    components: { V: true, M: "a small feather or piece of down" },
    duration: "1 minute",
    school: "Transmutation",
    target: "Up to five falling creatures",
    effects: ["Slows rate of descent for up to five creatures."],
    source: "PHB",
  },
  {
    id: generateSpellId('misty_step'),
    name: "Misty Step",
    description: "Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space that you can see.",
    actionCategory: 'spell',
    spellLevel: "2nd",
    castingTime: "1 Bonus Action",
    range: "Self",
    components: { V: true },
    duration: "Instantaneous",
    school: "Conjuration",
    effects: ["Teleport up to 30 feet to an unoccupied space you can see."],
    source: "PHB",
  },
  {
    id: generateSpellId('invisibility'),
    name: "Invisibility",
    description: "A creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target’s person. The spell ends for a target that attacks or casts a spell. At Higher Levels: When you cast this spell using a spell slot of 3rd level or higher, you can target one additional creature for each slot level above 2nd.",
    actionCategory: 'spell',
    spellLevel: "2nd",
    castingTime: "1 Action",
    range: "Touch",
    components: { V: true, S: true, M: "an eyelash encased in gum arabic" },
    duration: "Concentration, up to 1 hour",
    school: "Illusion",
    target: "One creature you touch",
    effects: ["Target becomes invisible. Ends if target attacks or casts a spell."],
    source: "PHB",
  },
  {
    id: generateSpellId('web'),
    name: "Web",
    description: "You conjure a mass of thick, sticky webbing at a point of your choice within range. The webs fill a 20-foot cube from that point for the duration. The webs are difficult terrain and lightly obscure their area. If the webs aren't anchored between two solid masses (such as walls or trees) or layered across a floor, wall, or ceiling, the conjured web collapses on itself, and the spell ends at the start of your next turn. Webs layered over a flat surface have a depth of 5 feet. Each creature that starts its turn in the webs or that enters them during its turn must make a Dexterity saving throw. On a failed save, the creature is restrained as long as it remains in the webs or until it breaks free. A creature restrained by the webs can use its action to make a Strength check against your spell save DC. If it succeeds, it is no longer restrained. The webs are flammable. Any 5-foot cube of webs exposed to fire burns away in 1 round, dealing 2d4 fire damage to any creature that starts its turn in the fire.",
    actionCategory: 'spell',
    spellLevel: "2nd",
    castingTime: "1 Action",
    range: "60 feet",
    components: { V: true, S: true, M: "a bit of spiderweb" },
    duration: "Concentration, up to 1 hour",
    school: "Conjuration",
    areaOfEffect: { type: 'cube', size: 20, description: "20-foot cube" },
    savingThrow: { stat: 'dexterity', effectOnFailure: "Restrained. STR check to break free." },
    effects: ["Creates a 20-foot cube of webs, difficult terrain, lightly obscured.", "Webs are flammable."],
    source: "PHB",
  },
  {
    id: generateSpellId('counterspell'),
    name: "Counterspell",
    description: "You attempt to interrupt a creature in the process of casting a spell. If the creature is casting a spell of 3rd level or lower, its spell fails and has no effect. If it is casting a spell of 4th level or higher, make an ability check using your spellcasting ability. The DC equals 10 + the spell’s level. On a success, the creature’s spell fails and has no effect. At Higher Levels: When you cast this spell using a spell slot of 4th level or higher, the interrupted spell has no effect if its level is less than or equal to the level of the spell slot you used.",
    actionCategory: 'spell',
    spellLevel: "3rd",
    castingTime: "1 Reaction, which you take when you see a creature within 60 feet of you casting a spell",
    range: "60 feet",
    components: { S: true },
    duration: "Instantaneous",
    school: "Abjuration",
    target: "A creature casting a spell",
    effects: ["Interrupts a spell of 3rd level or lower.", "Spellcasting ability check vs DC 10 + spell level for higher level spells."],
    source: "PHB",
  },
  {
    id: generateSpellId('fly'),
    name: "Fly",
    description: "You touch a willing creature. The target gains a flying speed of 60 feet for the duration. When the spell ends, the target falls if it is still aloft, unless it can stop the fall.",
    actionCategory: 'spell',
    spellLevel: "3rd",
    castingTime: "1 Action",
    range: "Touch",
    components: { V: true, S: true, M: "a wing feather from any bird" },
    duration: "Concentration, up to 10 minutes",
    school: "Transmutation",
    target: "One willing creature",
    effects: ["Target gains a flying speed of 60 feet."],
    source: "PHB",
  },
   {
    id: generateSpellId('greater_invisibility'),
    name: "Greater Invisibility",
    description: "You or a creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target’s person. The spell ends for a target that attacks or casts a spell.",
    actionCategory: 'spell',
    spellLevel: "4th",
    castingTime: "1 Action",
    range: "Touch",
    components: { V: true, S: true },
    duration: "Concentration, up to 1 minute",
    school: "Illusion",
    effects: ["Target becomes invisible, even when attacking or casting spells."],
    source: "PHB"
  },
  {
    id: generateSpellId('dimension_door'),
    name: "Dimension Door",
    description: "You teleport yourself from your current location to any other spot within range. You arrive at exactly the spot desired. It can be a place you can see, one you can visualize, or one you can describe by stating distance and direction, such as '200 feet straight downward' or 'upward to the northwest at a 45-degree angle, 300 feet'. You can bring along objects as long as their weight doesn’t exceed what you can carry. You can also bring one willing creature of your size or smaller who is carrying gear up to its carrying capacity. The creature must be within 5 feet of you when you cast this spell.",
    actionCategory: 'spell',
    spellLevel: "4th",
    castingTime: "1 Action",
    range: "500 feet",
    components: { V: true },
    duration: "Instantaneous",
    school: "Conjuration",
    effects: ["Teleport self and optionally one other creature up to 500 feet."],
    source: "PHB"
  },
  {
    id: generateSpellId('cone_of_cold'),
    name: "Cone of Cold",
    description: "A blast of cold air erupts from your hands. Each creature in a 60-foot cone must make a Constitution saving throw. A creature takes 8d8 cold damage on a failed save, or half as much damage on a successful one. A creature killed by this spell becomes a frozen statue until it thaws.",
    actionCategory: 'spell',
    spellLevel: "5th",
    castingTime: "1 Action",
    range: "Self (60-foot cone)",
    components: { V: true, S: true, M: "a small crystal or glass cone" },
    duration: "Instantaneous",
    school: "Evocation",
    damage: [{ id: generateId('dmg_coc'), dice: "8d8", type: "Cold" }],
    areaOfEffect: { type: 'cone', size: 60, description: "60-foot cone" },
    savingThrow: { stat: 'constitution', effectOnSave: "half damage", effectOnFailure: "full damage. Creatures killed become frozen statues." },
    source: "PHB"
  },
  {
    id: generateSpellId('telekinesis'),
    name: "Telekinesis",
    description: "You gain the ability to move or manipulate creatures or objects by thought. When you cast the spell, and as your action on each round for the duration, you can exert your will on one creature or object that you can see within range, causing the appropriate effect below. You can affect the same target round after round, or choose a new one at any time. If you switch targets, the prior target is no longer affected by the spell. Creature: You can try to move a Huge or smaller creature. Make an ability check with your spellcasting ability contested by the creature's Strength check. If you win the contest, you move the creature up to 30 feet in any direction, including upward but not beyond the range of this spell. Until the end of your next turn, the creature is restrained in your telekinetic grip. A creature lifted upward is suspended in mid-air. Object: You can try to move an object that weighs up to 1,000 pounds. If the object isn't being worn or carried, you automatically move it up to 30 feet in any direction, but not beyond the range of this spell. If the object is worn or carried by a creature, you must make an ability check with your spellcasting ability contested by that creature's Strength check. If you succeed, you pull the object away from that creature and can move it up to 30 feet in any direction but not beyond the range of this spell. You can exert fine control on objects with your telekinetic grip, such as manipulating a simple tool, opening a door or a container, stowing or retrieving an item from an open container, or pouring the contents from a vial.",
    actionCategory: 'spell',
    spellLevel: "5th",
    castingTime: "1 Action",
    range: "60 feet",
    components: { V: true, S: true },
    duration: "Concentration, up to 10 minutes",
    school: "Transmutation",
    effects: ["Move or manipulate creatures or objects with your mind."],
    source: "PHB"
  },
   {
    id: generateSpellId('chain_lightning'),
    name: "Chain Lightning",
    description: "You create a bolt of lightning that arcs toward a target of your choice that you can see within range. Three bolts then leap from that target to as many as three other targets, each of which must be within 30 feet of the first target. A target can be a creature or an object and can be targeted by only one of the bolts. A target must make a Dexterity saving throw. The target takes 10d8 lightning damage on a failed save, or half as much damage on a successful one.",
    actionCategory: 'spell',
    spellLevel: "6th",
    castingTime: "1 Action",
    range: "150 feet",
    components: { V: true, S: true, M: "a bit of fur; a piece of amber, glass, or a crystal rod; and three silver pins" },
    duration: "Instantaneous",
    school: "Evocation",
    damage: [{ id: generateId('dmg_cl'), dice: "10d8", type: "Lightning" }],
    target: "One primary target, then up to 3 secondary targets",
    savingThrow: { stat: 'dexterity', effectOnSave: "half damage", effectOnFailure: "full damage"},
    source: "PHB"
  },
  {
    id: generateSpellId('disintegrate'),
    name: "Disintegrate",
    description: "A thin green ray springs from your pointing finger to a target that you can see within range. The target can be a creature, an object, or a creation of magical force, such as the wall created by Wall of Force. A creature targeted by this spell must make a Dexterity saving throw. On a failed save, the target takes 10d6 + 40 force damage. If this damage reduces the target to 0 hit points, it is disintegrated. A disintegrated creature and everything it is wearing and carrying, except magic items, are reduced to a pile of fine gray dust. The creature can be restored to life only by means of a True Resurrection or a Wish spell. This spell automatically disintegrates a Large or smaller nonmagical object or a creation of magical force. If the target is a Huge or larger object or creation of force, this spell disintegrates a 10-foot-cube portion of it. A magic item is unaffected by this spell.",
    actionCategory: 'spell',
    spellLevel: "6th",
    castingTime: "1 Action",
    range: "60 feet",
    components: { V: true, S: true, M: "a lodestone and a pinch of dust" },
    duration: "Instantaneous",
    school: "Transmutation",
    damage: [{ id: generateId('dmg_dis'), dice: "10d6+40", type: "Force" }],
    target: "One creature, object, or creation of magical force",
    savingThrow: { stat: 'dexterity', effectOnFailure: "full damage. Target reduced to 0 HP is disintegrated." },
    source: "PHB"
  },
  {
    id: generateSpellId('teleport'),
    name: "Teleport",
    description: "This spell instantly transports you and up to eight willing creatures of your choice that you can see within range, or a single object that you can see within range, to a destination you select. If you target an object, it must be able to fit entirely inside a 10-foot cube, and it can’t be held or carried by an unwilling creature. The destination you choose must be known to you, and it must be on the same plane of existence as you. Your familiarity with the destination determines whether you arrive there successfully. The DM rolls d100 and consults the table in the PHB.",
    actionCategory: 'spell',
    spellLevel: "7th",
    castingTime: "1 Action",
    range: "10 feet",
    components: { V: true },
    duration: "Instantaneous",
    school: "Conjuration",
    effects: ["Teleports caster and up to 8 willing creatures or one object to a known destination. Mishap possible."],
    source: "PHB"
  },
  {
    id: generateSpellId('prismatic_spray'),
    name: "Prismatic Spray",
    description: "Eight multicolored rays of light flash from your hand. Each ray is a different color and has a different power and purpose. Each creature in a 60-foot cone must make a Dexterity saving throw. For each target, roll a d8 to determine which color ray affects it. (See PHB for table of effects).",
    actionCategory: 'spell',
    spellLevel: "7th",
    castingTime: "1 Action",
    range: "Self (60-foot cone)",
    components: { V: true, S: true },
    duration: "Instantaneous",
    school: "Evocation",
    areaOfEffect: { type: 'cone', size: 60, description: "60-foot cone" },
    savingThrow: { stat: 'dexterity' },
    source: "PHB"
  },
  {
    id: generateSpellId('sunburst'),
    name: "Sunburst",
    description: "Brilliant sunlight flashes in a 60-foot radius centered on a point you choose within range. Each creature in that light must make a Constitution saving throw. On a failed save, a creature takes 12d6 radiant damage and is blinded for 1 minute. On a successful save, it takes half as much damage and isn’t blinded by this spell. Undead and oozes have disadvantage on this saving throw. A creature blinded by this spell makes another Constitution saving throw at the end of each of its turns. On a successful save, it is no longer blinded. This spell dispels any darkness in its area that was created by a spell.",
    actionCategory: 'spell',
    spellLevel: "8th",
    castingTime: "1 Action",
    range: "150 feet",
    components: { V: true, S: true, M: "fire and a piece of sunstone" },
    duration: "Instantaneous",
    school: "Evocation",
    damage: [{ id: generateId('dmg_sun'), dice: "12d6", type: "Radiant" }],
    areaOfEffect: { type: 'sphere', size: 60, description: "60-foot-radius sphere" },
    savingThrow: { stat: 'constitution', effectOnSave: "half damage", effectOnFailure: "full damage and Blinded for 1 min. Dispels magical darkness." },
    source: "PHB"
  },
  {
    id: generateSpellId('meteor_swarm'),
    name: "Meteor Swarm",
    description: "Blazing orbs of fire plummet to the ground at four different points you can see within range. Each creature in a 40-foot-radius sphere centered on each point you choose must make a Dexterity saving throw. The sphere spreads around corners. A creature takes 20d6 fire damage and 20d6 bludgeoning damage on a failed save, or half as much damage on a successful one. A creature in the area of more than one fiery burst is affected only once. The spell damages objects in the area and ignites flammable objects that aren’t being worn or carried.",
    actionCategory: 'spell',
    spellLevel: "9th",
    castingTime: "1 Action",
    range: "1 mile",
    components: { V: true, S: true },
    duration: "Instantaneous",
    school: "Evocation",
    damage: [{ id: generateId('dmg_ms_fire'), dice: "20d6", type: "Fire" }, { id: generateId('dmg_ms_bludg'), dice: "20d6", type: "Bludgeoning" }],
    areaOfEffect: { type: 'sphere', size: 40, description: "Four 40-foot-radius spheres" },
    savingThrow: { stat: 'dexterity', effectOnSave: "half damage", effectOnFailure: "full damage"},
    source: "PHB"
  },
  {
    id: generateSpellId('wish'),
    name: "Wish",
    description: "Wish is the mightiest spell a mortal creature can cast. By simply speaking aloud, you can alter the very foundations of reality in accord with your desires. The basic use of this spell is to duplicate any other spell of 8th level or lower. You don’t need to meet any requirements in that spell, including costly components. The spell simply takes effect. Alternatively, you can create one of the following effects of your choice: (See PHB for list of effects and stress).",
    actionCategory: 'spell',
    spellLevel: "9th",
    castingTime: "1 Action",
    range: "Self",
    components: { V: true },
    duration: "Instantaneous",
    school: "Conjuration",
    effects: ["Duplicates any spell of 8th level or lower, or creates other powerful effects. Stressful casting may have consequences. See PHB for details."],
    source: "PHB"
  }
];

// Item Definitions (uses generateId)
export const DND_ITEMS_DETAILED: Item[] = [
  { id: 'item_longsword', name: 'Longsword', description: 'A versatile martial melee weapon.', itemCategory: 'weapon', slotType: ['mainHand', 'offHand'], damage: [{id: generateId('dmg_'), dice: '1d8', type: 'Slashing'}], properties: ['Versatile (1d10)'], weight: 3, value: "15 gp", isMagical: false, requiresAttunement: false },
  { id: 'item_longsword_plus_1', name: '+1 Longsword', description: 'A finely crafted longsword, imbued with magic. You gain a +1 bonus to attack and damage rolls made with this weapon.', itemCategory: 'weapon', slotType: ['mainHand', 'offHand'], damage: [{id: generateId('dmg_'), dice: '1d8+1', type: 'Slashing'}], properties: ['Versatile (1d10)', '+1 Weapon'], weight: 3, value: "500 gp", isMagical: true, requiresAttunement: true, effects: ["+1 to Attack Rolls", "+1 to Damage Rolls"] },
  { id: 'item_shield', name: 'Shield', description: 'A shield made from wood or metal, carried in one hand.', itemCategory: 'shield', slotType: 'offHand', armorClass: 2, properties: [], weight: 6, value: "10 gp", isMagical: false, requiresAttunement: false },
  { id: 'item_leather_armor', name: 'Leather Armor', description: 'Padded leather armor.', itemCategory: 'armor', slotType: 'armor', armorClass: 11, properties: ['Light Armor'], weight: 10, value: "10 gp", isMagical: false, requiresAttunement: false },
  { id: 'item_chain_mail', name: 'Chain Mail', description: 'Made of interlocking metal rings, chain mail includes a layer of quilted fabric worn underneath the mail to prevent chafing and to cushion the impact of blows.', itemCategory: 'armor', slotType: 'armor', armorClass: 16, properties: ['Heavy Armor', 'Stealth Disadvantage', 'STR 13 Req.'], weight: 55, value: "75 gp", isMagical: false, requiresAttunement: false },
  { id: 'item_dagger', name: 'Dagger', description: 'A simple melee weapon.', itemCategory: 'weapon', slotType: ['mainHand', 'offHand'], damage: [{id: generateId('dmg_'), dice: '1d4', type: 'Piercing'}], properties: ['Finesse', 'Light', 'Thrown (range 20/60)'], weight: 1, value: "2 gp", isMagical: false, requiresAttunement: false },
  { id: 'item_shortbow', name: 'Shortbow', description: 'A martial ranged weapon.', itemCategory: 'weapon', slotType: 'mainHand', damage: [{id: generateId('dmg_'), dice: '1d6', type: 'Piercing'}], properties: ['Ammunition (range 80/320)', 'Two-Handed'], weight: 2, value: "25 gp", isMagical: false, requiresAttunement: false },
  { id: 'item_arrows_20', name: 'Arrows (20)', description: 'A bundle of 20 arrows.', itemCategory: 'consumable', quantity: 20, weight: 1, value: "1 gp" },
  { id: 'item_potion_healing', name: 'Potion of Healing', description: 'Regain 2d4 + 2 hit points when you drink this potion.', itemCategory: 'consumable', effects: ['Heals 2d4+2 HP'], weight: 0.5, value: "50 gp", isMagical: true, requiresAttunement: false },
  { id: 'item_backpack', name: 'Backpack', description: 'A backpack can hold 1 cubic foot/30 pounds of gear.', itemCategory: 'container', weight: 5, value: "2 gp" },
  { id: 'item_bedroll', name: 'Bedroll', description: 'A simple bedroll for sleeping.', itemCategory: 'general', weight: 7, value: "1 gp" },
  { id: 'item_torch', name: 'Torch', description: 'A wooden torch that burns for 1 hour, providing bright light in a 20-foot radius and dim light for an additional 20 feet.', itemCategory: 'general', weight: 1, value: "1 cp" },
  { id: 'item_dungeoneers_pack', name: 'Dungeoneer\'s Pack', description: 'Includes a backpack, a crowbar, a hammer, 10 pitons, 10 torches, a tinderbox, 10 days of rations, and a waterskin. The pack also has 50 feet of hempen rope strapped to the side of it.', itemCategory: 'container', weight: 61.5, value: "12 gp", effects: ["Contains multiple items"] },
  { id: 'item_explorers_pack', name: 'Explorer\'s Pack', description: 'Includes a backpack, a bedroll, a mess kit, a tinderbox, 10 torches, 10 days of rations, and a waterskin. The pack also has 50 feet of hempen rope strapped to the side of it.', itemCategory: 'container', weight: 59, value: "10 gp", effects: ["Contains multiple items"] },
  {
        id: 'item_quarterstaff_staff_of_power',
        name: 'Staff of Power',
        description: 'A potent magical staff, crackling with arcane energy.',
        itemCategory: 'weapon', 
        slotType: 'mainHand',
        damage: [{id: generateId('dmg_staff'), dice: '1d6+1', type: 'Bludgeoning'}], 
        properties: ['Versatile (1d8+1)', 'Arcane Focus'],
        weight: 4,
        value: "Priceless",
        isMagical: true,
        requiresAttunement: true,
        effects: ["+2 bonus to AC, saving throws, and spell attack rolls", "Contains various spells"]
  },
  {
        id: 'item_robe_archmagi',
        name: 'Robe of the Archmagi (Grey)',
        description: 'A finely embroidered robe worn by powerful mages.',
        itemCategory: 'armor', 
        slotType: 'armor',
        armorClass: 15, 
        properties: ['AC set to 15 + DEX Mod if unarmored', 'Advantage on saves vs. spells'], 
        weight: 1,
        value: "Priceless",
        isMagical: true,
        requiresAttunement: true,
        effects: ["Set AC to 15 + DEX Mod (max 2 if no armor prof)", "Spell Save DC +2", "Spell Attack Bonus +2", "Advantage on saving throws against spells and other magical effects"]
  }
];

export const DND_FEATS_DETAILED: FeatDetail[] = [
  {
    id: 'feat_skilled',
    name: 'Skilled',
    description: 'You gain proficiency in any combination of three skills or tools of your choice.',
    skillProficiencyOptions: { choose: 3, options: DND_SKILLS_OPTION_LIST },
    toolProficiencyOptions: { choose: 3, options: DND_TOOL_PROFICIENCIES_LIST },
  },
  {
    id: 'feat_tough',
    name: 'Tough',
    description: 'Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points.',
  },
  {
    id: 'feat_observant_int',
    name: 'Observant (+1 INT)',
    description: 'Increase your Intelligence score by 1, to a maximum of 20. You have a +5 bonus to your passive Wisdom (Perception) and passive Intelligence (Investigation) scores. You can read lips.',
    abilityScoreIncrease: { intelligence: 1 },
  },
  {
    id: 'feat_observant_wis',
    name: 'Observant (+1 WIS)',
    description: 'Increase your Wisdom score by 1, to a maximum of 20. You have a +5 bonus to your passive Wisdom (Perception) and passive Intelligence (Investigation) scores. You can read lips.',
    abilityScoreIncrease: { wisdom: 1 },
  },
  {
    id: 'feat_magic_initiate_bard',
    name: 'Magic Initiate (Bard)',
    description: 'Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard. You learn two cantrips of your choice from that class’s spell list. In addition, choose one 1st-level spell from that same list. You learn that spell and can cast it at its lowest level. Once you cast it, you must finish a long rest before you can cast it again using this feat. Your spellcasting ability for these spells depends on the class you chose.',
  },
];

export const DND_RACES_DETAILED: RaceDetail[] = [
  {
    id: 'human',
    name: 'Human',
    flavorText: 'Humans are the most adaptable and ambitious people among the common races. Whatever drives them, humans are the innovators, the achievers, and the pioneers of the worlds.',
    abilityScoreIncreases: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    speed: 30,
    size: 'Medium',
    racialTraits: [ { id: generateId('trait_human_versatile'), name: 'Versatile', description: 'Humans are well-rounded and adaptable.', source: 'Human Trait' } ],
    languages: ['common', { choose: 1, from: DND_LANGUAGES_OPTION_LIST.filter(l_id => l_id !== "common") }],
  },
  {
    id: 'human_variant',
    name: 'Human (Variant)',
    flavorText: 'If your campaign uses the optional feat rule, your Dungeon Master might allow these variant traits, all of which replace the human’s standard Ability Score Increase trait.',
    abilityScoreIncreases: {}, 
    bonusAbilityScoreChoice: { choose: 2, amount: 1, options: DND_ABILITY_SCORES_LIST },
    speed: 30,
    size: 'Medium',
    skillProficiencyOptions: { choose: 1, options: DND_SKILLS_OPTION_LIST },
    featOptions: { choose: 1 },
    languages: ['common', { choose: 1, from: DND_LANGUAGES_OPTION_LIST.filter(l_id => l_id !== "common") }],
    racialTraits: [{ id: generateId('trait_human_adaptable'), name: 'Adaptable Learner', description: 'You gain two +1 ability score increases of your choice, one skill proficiency of your choice, and one feat of your choice.', source: 'Human Variant Trait' }],
  },
  {
    id: 'elf',
    name: 'Elf',
    flavorText: 'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it. They live in places of ethereal beauty, in the midst of ancient forests or in spires glittering with faerie light, where soft music drifts through the air and gentle fragrances waft on the breeze.',
    abilityScoreIncreases: { dexterity: 2 },
    speed: 30,
    size: 'Medium',
    skillProficiencies: ['perception'], 
    racialTraits: [
        { id: generateId('trait_elf_darkvision'), name: 'Darkvision', description: 'Accustomed to twilit forests and the night sky, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can’t discern color in darkness, only shades of gray.', source: 'Elf Trait' },
        { id: generateId('trait_elf_keen_senses'), name: 'Keen Senses', description: 'You have proficiency in the Perception skill.', source: 'Elf Trait' },
        { id: generateId('trait_elf_fey_ancestry'), name: 'Fey Ancestry', description: 'You have advantage on saving throws against being charmed, and magic can’t put you to sleep.', source: 'Elf Trait' },
        { id: generateId('trait_elf_trance'), name: 'Trance', description: 'Elves don’t need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day. After resting in this way, you gain the same benefit that a human does from 8 hours of sleep.', source: 'Elf Trait' }
    ],
    languages: ['common', 'elvish'],
  },
];

const FIGHTER_FIGHTING_STYLE_OPTIONS: Pick<ActionDetail, 'id' | 'name' | 'description' | 'source'>[] = [
  { id: generateId('fs_archery'), name: 'Archery', description: 'What it is: You have honed your skills with ranged weaponry.\nWhat it does: You gain a +2 bonus to attack rolls you make with ranged weapons.', source: 'Fighting Style (Fighter)' },
  { id: generateId('fs_defense'), name: 'Defense', description: 'What it is: You are adept at protecting yourself in combat.\nWhat it does: While you are wearing armor, you gain a +1 bonus to AC.', source: 'Fighting Style (Fighter)' },
  { id: generateId('fs_dueling'), name: 'Dueling', description: 'What it is: You excel at fighting with a single one-handed weapon.\nWhat it does: When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.', source: 'Fighting Style (Fighter)' },
  { id: generateId('fs_greatweapon'), name: 'Great Weapon Fighting', description: 'What it is: You have mastered the art of wielding large, two-handed weapons.\nWhat it does: When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll, even if the new roll is a 1 or a 2. The weapon must have the two-handed or versatile property for you to gain this benefit.', source: 'Fighting Style (Fighter)' },
  { id: generateId('fs_protection'), name: 'Protection', description: 'What it is: You are skilled at defending your allies.\nWhat it does: When a creature you can see attacks a target other than you that is within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll. You must be wielding a shield.', source: 'Fighting Style (Fighter)' },
  { id: generateId('fs_twoweapon'), name: 'Two-Weapon Fighting', description: 'What it is: You are proficient in fighting with a weapon in each hand.\nWhat it does: When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.', source: 'Fighting Style (Fighter)' },
];

export const DND_CLASSES_DETAILED: ClassDetail[] = [
  {
    id: 'fighter',
    name: 'Fighter',
    flavorText: 'Questing knights, conquering overlords, royal champions, elite foot soldiers, hardened mercenaries, and bandit kings—as fighters, they all share an unparalleled mastery with weapons and armor, and a thorough knowledge of the skills of combat.',
    hitDie: 'd10',
    primaryAbilities: ['strength', 'dexterity'],
    savingThrowProficiencies: ['strength', 'constitution'],
    armorProficiencies: ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields'],
    weaponProficiencies: ['Simple Weapons', 'Martial Weapons'],
    skillProficienciesOptions: { choose: 2, options: ['acrobatics', 'animalHandling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'] },
    startingEquipment: [
      { 
        id: generateId('fighter_armor_choice'), choose: 1, description: "Choose your armor:",
        from: [
          { id: generateId('fighter_chainmail_opt'), name: "Chain Mail", itemsToGrant: ["Chain Mail"] },
          { id: generateId('fighter_leather_longbow_opt'), name: "Leather Armor, Longbow, and Arrows (20)", itemsToGrant: ["Leather Armor", "Longbow", "Arrows (20)"] }
        ]
      },
      {
        id: generateId('fighter_weapon_choice_1'), choose: 1, description: "Choose your primary weapon set:",
        from: [
          { id: generateId('fighter_martial_shield_opt'), name: "A martial weapon and a shield", itemsToGrant: ["Longsword", "Shield"] }, 
          { id: generateId('fighter_two_martial_opt'), name: "Two martial weapons", itemsToGrant: ["Longsword", "Shortsword"] } 
        ]
      },
      {
        id: generateId('fighter_ranged_choice'), choose: 1, description: "Choose your secondary ranged option:",
        from: [
          { id: generateId('fighter_light_xbow_opt'), name: "A light crossbow and Crossbow Bolts (20)", itemsToGrant: ["Light Crossbow", "Crossbow Bolts (20)"] },
          { id: generateId('fighter_two_handaxes_opt'), name: "Two handaxes", itemsToGrant: ["Handaxe", "Handaxe"] }
        ]
      },
      {
        id: generateId('fighter_pack_choice'), choose: 1, description: "Choose your pack:",
        from: [
          { id: generateId('fighter_dungeoneer_pack_opt'), name: "A dungeoneer's pack", itemsToGrant: ["Dungeoneer's Pack"] },
          { id: generateId('fighter_explorer_pack_opt'), name: "An explorer's pack", itemsToGrant: ["Explorer's Pack"] }
        ]
      }
    ],
    classFeatures: [
      { 
        id: 'fighter_fighting_style_choice',
        name: 'Fighting Style', 
        description: 'You adopt a particular style of fighting as your specialty. Choose one option. You can’t take a Fighting Style option more than once, even if you later get to choose again.', 
        choose: 1,
        options: FIGHTER_FIGHTING_STYLE_OPTIONS
      } as ClassFeatureChoice,
      { id: generateId('feature_secondwind'), name: 'Second Wind', description: 'You have a limited well of stamina you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again.', source: 'Fighter Lvl 1' },
    ],
    recommendedBackgrounds: ['soldier', 'folk_hero'],
  },
  {
    id: 'wizard',
    name: 'Wizard',
    flavorText: 'Drawing on the subtle weave of magic that permeates the cosmos, wizards practice arcane magic by studying ancient tomes and manipulating the energies of the universe. They are supreme Magi, capable of incredible feats of power.',
    hitDie: 'd6',
    primaryAbilities: ['intelligence'],
    savingThrowProficiencies: ['intelligence', 'wisdom'],
    armorProficiencies: [], 
    weaponProficiencies: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light Crossbows'],
    skillProficienciesOptions: { choose: 2, options: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'] },
    spellcastingAbility: 'intelligence',
    grantsCantrips: [
        DND_SPELLS_DEFINITIONS.find(s => s.name === "Fire Bolt") as Pick<ActionDetail, 'id' | 'name' | 'description' | 'source'>,
        DND_SPELLS_DEFINITIONS.find(s => s.name === "Light") as Pick<ActionDetail, 'id' | 'name' | 'description' | 'source'>,
        DND_SPELLS_DEFINITIONS.find(s => s.name === "Mage Hand") as Pick<ActionDetail, 'id' | 'name' | 'description' | 'source'>,
    ].filter(Boolean) as Pick<ActionDetail, 'id' | 'name' | 'description' | 'source'>[],
    grantsSpells: { 
        level: 1,
        choose: 6, 
        from: [ 
            DND_SPELLS_DEFINITIONS.find(s => s.name === "Burning Hands"),
            DND_SPELLS_DEFINITIONS.find(s => s.name === "Grease"),
            DND_SPELLS_DEFINITIONS.find(s => s.name === "Magic Missile"),
            DND_SPELLS_DEFINITIONS.find(s => s.name === "Shield (Spell)"),
            DND_SPELLS_DEFINITIONS.find(s => s.name === "Feather Fall"),
            DND_SPELLS_DEFINITIONS.find(s => s.name === "Thunderwave") || {id: generateId('spell_'), name: "Thunderwave", spellLevel: "1st", description: "Wave of thunderous force."},
            DND_SPELLS_DEFINITIONS.find(s => s.name === "Sleep") || {id: generateId('spell_'), name: "Sleep", spellLevel: "1st", description: "Puts creatures to sleep."},
            DND_SPELLS_DEFINITIONS.find(s => s.name === "Charm Person") || {id: generateId('spell_'), name: "Charm Person", spellLevel: "1st", description: "Charms a humanoid."},
        ].filter(Boolean) as Pick<ActionDetail, 'id' | 'name' | 'description' | 'source'>[], 
    },
    startingEquipment: [
        {
            id: generateId('wizard_weapon_choice'), choose: 1, description: "Choose your primary weapon:",
            from: [
                { id: generateId('wiz_quarterstaff_opt'), name: "A quarterstaff", itemsToGrant: ["Quarterstaff"]},
                { id: generateId('wiz_dagger_opt'), name: "A dagger", itemsToGrant: ["Dagger"]}
            ]
        },
        {
            id: generateId('wizard_focus_choice'), choose: 1, description: "Choose your arcane focus or component pouch:",
            from: [
                { id: generateId('wiz_comp_pouch_opt'), name: "A component pouch", itemsToGrant: ["Component Pouch"]},
                { id: generateId('wiz_arcane_focus_opt'), name: "An arcane focus", itemsToGrant: ["Arcane Focus (Crystal)"]} 
            ]
        },
         {
            id: generateId('wizard_pack_choice'), choose: 1, description: "Choose your pack:",
            from: [
                { id: generateId('wiz_scholar_pack_opt'), name: "A scholar's pack", itemsToGrant: ["Scholar's Pack"]},
                { id: generateId('wiz_explorer_pack_opt'), name: "An explorer's pack", itemsToGrant: ["Explorer's Pack"]}
            ]
        },
        "Spellbook (blank)"
    ],
    classFeatures: [
        { id: generateId('feature_wiz_spellcasting'), name: 'Spellcasting', description: 'As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power. See PHB for rules on spellcasting and your spellbook.', source: 'Wizard Lvl 1' },
        { id: generateId('feature_wiz_arcanerecovery'), name: 'Arcane Recovery', description: 'You have learned to regain some of your magical energy by studying your spellbook. Once per day when you finish a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher.', source: 'Wizard Lvl 1' },
    ],
    recommendedBackgrounds: ['sage', 'acolyte'],
  },
];

const wizardClassDefForFeatures = DND_CLASSES_DETAILED.find(c => c.id === 'wizard');
if (wizardClassDefForFeatures && wizardClassDefForFeatures.grantsSpells) {
    const wizardSpellChoiceFeature: ClassFeatureChoice = {
      id: 'wizard_choose_starting_spell', 
      name: `Choose ${wizardClassDefForFeatures.grantsSpells.choose} Starting Spell(s)`,
      description: `Select ${wizardClassDefForFeatures.grantsSpells.choose} 1st-level wizard spell(s) to add to your spellbook.`,
      choose: wizardClassDefForFeatures.grantsSpells.choose,
      options: wizardClassDefForFeatures.grantsSpells.from.map(spellRef => {
        const fullSpellDef = DND_SPELLS_DEFINITIONS.find(s => s.id === spellRef.id || s.name === spellRef.name);
        return {
          id: fullSpellDef?.id || spellRef.id || generateId('spell_opt_'),
          name: fullSpellDef?.name || spellRef.name,
          description: fullSpellDef?.description || "No description available for this spell choice.", 
          source: fullSpellDef?.source || "Wizard Spell List"
        };
      })
    };
    const existingFeatureIndex = wizardClassDefForFeatures.classFeatures.findIndex(f => f.id === wizardSpellChoiceFeature.id);
    if (existingFeatureIndex > -1) {
      wizardClassDefForFeatures.classFeatures[existingFeatureIndex] = wizardSpellChoiceFeature; 
    } else {
      wizardClassDefForFeatures.classFeatures.push(wizardSpellChoiceFeature);
    }
}

export const DND_BACKGROUNDS_DETAILED: BackgroundDetail[] = [
  {
    id: 'soldier',
    name: 'Soldier',
    flavorText: 'War has been your life for as long as you care to remember. You trained as a youth, studied the use of weapons and armor, learned basic survival techniques, including how to stay alive on the battlefield.',
    skillProficiencies: ['athletics', 'intimidation'],
    toolProficiencies: [{ choose: 1, options: ["Gaming Set (Dice)", "Gaming Set (Playing Cards)", "Gaming Set (Chess)"] }, "Vehicles (Land)"],
    languages: [],
    startingEquipment: [
        "Insignia of Rank", 
        "Trophy (from fallen enemy)", 
        {
            id: generateId('soldier_gaming_set_choice'), choose: 1, description: "Choose a gaming set:",
            from: [
                {id: generateId('soldier_dice_opt'), name: "Set of bone dice", itemsToGrant: ["Gaming Set (Dice)"]},
                {id: generateId('soldier_cards_opt'), name: "Deck of cards", itemsToGrant: ["Gaming Set (Playing Cards)"]}
            ]
        },
        "Common Clothes", 
        "Belt Pouch",
        "Gold Piece (gp) (10)" 
    ],
    feature: { id: generateId('feat_militaryrank'), name: 'Military Rank', description: 'You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence, and they defer to you if they are of a lower rank. You can invoke your rank to exert influence over soldiers and requisition simple equipment or horses for temporary use. You can also usually gain access to friendly military encampments and fortresses where your rank is recognized.', source: 'Soldier Background' },
  },
  {
    id: 'sage',
    name: 'Sage',
    flavorText: 'You spent years learning the lore of the multiverse. You scoured manuscripts, studied scrolls, and listened to the greatest experts on the subjects that interest you. Your efforts have made you a master in your fields of study.',
    skillProficiencies: ['arcana', 'history'],
    toolProficiencies: [],
    languages: [{ choose: 2, from: DND_LANGUAGES_OPTION_LIST.filter(l_id => !["common", "elvish", "dwarvish", "halfling"].includes(l_id)) }], 
    startingEquipment: [
        "Bottle of Black Ink", 
        "Quill", 
        "Small Knife", 
        "Letter from a Dead Colleague", 
        "Common Clothes", 
        "Belt Pouch",
        "Gold Piece (gp) (10)"
    ],
    feature: { id: generateId('feat_researcher'), name: 'Researcher', description: "When you attempt to learn or recall a piece of lore, if you do not know that information, you often know where and from whom you can obtain it. Usually, this information comes from a library, scriptorium, university, or a sage or other learned person or creature. Your DM might rule that the knowledge you seek is secreted away in an almost inaccessible place, or that it simply cannot be found. Unearthing the deepest secrets of the multiverse can require an adventure or even a whole campaign.", source: 'Sage Background' },
  },
];

export const DND_RACES: string[] = ["Human", "Elf", "Dwarf", "Halfling", "Dragonborn", "Gnome", "Half-Elf", "Half-Orc", "Tiefling", "Other"];
export const DND_CLASSES: string[] = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard", "Other"];

export const DEFAULT_PLAYER_ID = "player1";
export const DM_PLAYER_ID_ASSOCIATION = "dm_player_persona";

export const STANDARD_ACTIONS_5E: { name: string, description: string }[] = [
    { name: "Attack", description: "Make one melee or ranged attack." },
    { name: "Cast a Spell", description: "Cast a spell with a casting time of 1 action." },
    { name: "Dash", description: "Gain extra movement for the current turn." },
    { name: "Disengage", description: "Your movement doesn't provoke opportunity attacks for the rest of the turn." },
    { name: "Dodge", description: "Focus entirely on avoiding attacks. Until the start of your next turn, any attack roll made against you has disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage." },
    { name: "Help", description: "Grant an ally advantage on an ability check or an attack roll against a creature within 5 feet of you." },
    { name: "Hide", description: "Attempt to hide, making a Dexterity (Stealth) check." },
    { name: "Ready", description: "Choose a perceivable circumstance and a reaction to take in response." },
    { name: "Search", description: "Devote your attention to finding something, making a Wisdom (Perception) or Intelligence (Investigation) check." },
    { name: "Use an Object", description: "Interact with a second object or use an object's special abilities." },
];

export const GENERIC_BONUS_ACTIONS_5E: { name: string, description: string }[] = [
    { name: "Off-Hand Attack", description: "Make an attack with a light weapon held in your other hand (if two-weapon fighting)." },
    { name: "Cast a Spell (Bonus Action)", description: "Cast a spell with a casting time of 1 bonus action." },
];

export const GENERIC_REACTIONS_5E: { name: string, description: string }[] = [
    { name: "Opportunity Attack", description: "Make a melee attack against a creature that moves out of your reach." },
];

export const SAMPLE_CREATURE_TEMPLATES: CreatureTemplate[] = [
  {
    id: 'template_goblin',
    name: "Goblin",
    description: "A small, green-skinned humanoid with a penchant for mischief and cruelty.",
    race: "Goblinoid", size: "Small", type: "Humanoid", alignment: "Neutral Evil",
    armorClass: 15, maxHp: 7, speed: "30 ft.",
    abilityScores: { strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8 },
    skills: { stealth: 6 }, senses: "Darkvision 60 ft., Passive Perception 9", languages: "Common, Goblin",
    challengeRating: "1/4",
    actions: [
      {
        id: generateId('action_gob_nimble'), name: "Nimble Escape",
        description: "The goblin can take the Disengage or Hide action as a bonus action on each of its turns.",
        actionCategory: "bonus_action", isAttack: false, source: "Goblin Racial Trait"
      },
      {
        id: generateId('action_gob_scimitar'), name: "Scimitar", description: "Melee attack with a curved blade.",
        actionCategory: "action", isAttack: true,
        attackSettings: { ability: 'dexterity', proficient: true, bonus: 0 }, range: "5 ft.", target: "one target",
        damage: [{ id: generateId('dmg_gob_scimitar'), dice: "1d6+DEX", type: "Slashing" }],
      },
      {
        id: generateId('action_gob_jav_melee'), name: "Javelin (Melee)", description: "Melee attack with a javelin.",
        actionCategory: "action", isAttack: true,
        attackSettings: { ability: 'dexterity', proficient: true, bonus: 0 }, range: "5 ft.", target: "one target",
        damage: [{ id: generateId('dmg_gob_jav_melee'), dice: "1d6+DEX", type: "Piercing" }],
      },
      {
        id: generateId('action_gob_jav_ranged'), name: "Javelin (Ranged)", description: "Ranged attack with a javelin.",
        actionCategory: "action", isAttack: true,
        attackSettings: { ability: 'dexterity', proficient: true, bonus: 0 }, range: "30/120 ft.", target: "one target",
        damage: [{ id: generateId('dmg_gob_jav_ranged'), dice: "1d6+DEX", type: "Piercing" }],
      },
      {
        id: generateId('action_gob_mock'), name: "Mock", description: "The goblin hurls insults. If the target can hear the goblin, it must succeed on a DC 10 Wisdom saving throw or have disadvantage on its next attack roll made before the end of its next turn.",
        actionCategory: "action", isAttack: false, source: "Goblin Taunt",
        savingThrow: { stat: 'wisdom', dcOverride: 10, effectOnFailure: "Disadvantage on next attack roll"},
        imposesDisadvantageOnTargetNextAttack: true, 
      }
    ],
    defaultTokenRadius: TOKEN_DEFAULT_RADIUS * 0.8, defaultTokenColor: COLORS[6],
    image: "https://www.dndbeyond.com/avatars/thumbnails/0/11/1000/1000/636252735520064138.jpeg"
  },
  {
    id: 'template_orc',
    name: "Orc", description: "Savage humanoids with a love for battle.",
    race: "Orcish", size: "Medium", type: "Humanoid", alignment: "Chaotic Evil",
    armorClass: 13, maxHp: 15, speed: "30 ft.",
    abilityScores: { strength: 16, dexterity: 12, constitution: 16, intelligence: 7, wisdom: 11, charisma: 10 },
    skills: { intimidation: 2 }, senses: "Darkvision 60 ft., Passive Perception 10", languages: "Common, Orc",
    challengeRating: "1/2",
    actions: [
      {
        id: generateId('action_orc_agg'), name: "Aggressive",
        description: "As a bonus action on its turn, the orc can move up to its speed toward a hostile creature that it can see.",
        actionCategory: "bonus_action", isAttack: false, source: "Orc Racial Trait"
      },
      {
        id: generateId('action_orc_axe'), name: "Greataxe", description: "Melee attack with a heavy axe.",
        actionCategory: "action", isAttack: true,
        attackSettings: { ability: 'strength', proficient: true, bonus: 0 }, range: "5 ft.", target: "one target",
        damage: [{ id: generateId('dmg_orc_axe'), dice: "1d12+STR", type: "Slashing" }],
      },
      {
        id: generateId('action_orc_jav_melee'), name: "Javelin (Melee)", description: "Melee attack with a javelin.",
        actionCategory: "action", isAttack: true,
        attackSettings: { ability: 'strength', proficient: true, bonus: 0 }, range: "5 ft.", target: "one target",
        damage: [{ id: generateId('dmg_orc_jav_melee'), dice: "1d6+STR", type: "Piercing" }],
      },
      {
        id: generateId('action_orc_jav_ranged'), name: "Javelin (Ranged)", description: "Ranged attack with a javelin.",
        actionCategory: "action", isAttack: true,
        attackSettings: { ability: 'strength', proficient: true, bonus: 0 }, range: "30/120 ft.", target: "one target",
        damage: [{ id:generateId('dmg_orc_jav_ranged'), dice: "1d6+STR", type: "Piercing" }],
      }
    ],
    defaultTokenRadius: TOKEN_DEFAULT_RADIUS, defaultTokenColor: COLORS[7],
    image: "https://www.dndbeyond.com/avatars/thumbnails/0/23/1000/1000/636252757739209965.jpeg"
  },
  {
    id: 'template_mage',
    name: "Mage", description: "An adept spellcaster.",
    race: "Human", size: "Medium", type: "Humanoid", alignment: "Any",
    armorClass: 12, maxHp: 40, // 9d8
    speed: "30 ft.",
    abilityScores: { strength: 9, dexterity: 14, constitution: 11, intelligence: 17, wisdom: 12, charisma: 11 },
    skills: { arcana: 7, history: 7 },
    senses: "Passive Perception 11", languages: "Common, plus any four languages",
    challengeRating: "6",
    actions: [
        {
            id: generateId('action_mage_spellcast_feature'), name: "Spellcasting (Mage)",
            description: "The mage is a 9th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 14, +6 to hit with spell attacks). The mage has a list of wizard spells prepared.",
            actionCategory: "class_feature", isAttack: false, source: "Mage Statblock Feature"
        },
        {
            id: generateId('action_mage_dagger'), name: "Dagger (Mage)",
            description: "Melee or Ranged Weapon Attack.",
            actionCategory: "action", isAttack: true,
            attackSettings: { ability: 'dexterity', proficient: true, bonus: 0}, 
            range: "5 ft. or range 20/60 ft.", target: "one target",
            damage: [{id: generateId('dmg_mage_dagger'), dice: "1d4+DEX", type: "Piercing"}],
        },
        DND_SPELLS_DEFINITIONS.find(s => s.name === "Fire Bolt")!,
        DND_SPELLS_DEFINITIONS.find(s => s.name === "Magic Missile")!,
        DND_SPELLS_DEFINITIONS.find(s => s.name === "Shield (Spell)")!,
        DND_SPELLS_DEFINITIONS.find(s => s.name === "Fireball")!,
        DND_SPELLS_DEFINITIONS.find(s => s.name === "Lightning Bolt")!,
        DND_SPELLS_DEFINITIONS.find(s => s.name === "Leomund's Tiny Hut")!,
    ].filter(Boolean) as ActionDetail[], 
    defaultTokenRadius: TOKEN_DEFAULT_RADIUS, defaultTokenColor: COLORS[4],
  }
];


// --- UI CONFIGURATION ---
// Component imports must come AFTER all data constants they might import from this file are defined.
import { ChatTab } from './components/tabs/ChatTab';
import { CharactersTab } from './components/tabs/CharactersTab';
import { OptionsTab } from './components/tabs/OptionsTab';
import { NpcsTab } from './components/tabs/NpcsTab';
import { LocationsTab } from './components/tabs/LocationsTab';
import { CampaignNotesTab } from './components/tabs/CampaignNotesTab';
import { AssetsTab } from './components/tabs/AssetsTab';
import { BestiaryTab } from './components/tabs/BestiaryTab';
import { CombatTab } from './components/tabs/CombatTab';
import { GroupsTab } from './components/tabs/GroupsTab';
import { PlayerStatsTab } from './components/tabs/player/PlayerStatsTab';
import { PlayerSkillsTab } from './components/tabs/player/PlayerSkillsTab';
import { PlayerInventoryTab } from './components/tabs/player/PlayerInventoryTab';
import { PlayerAbilitiesTab } from './components/tabs/player/PlayerAbilitiesTab';
import { PlayerSpellsTab } from './components/tabs/player/PlayerSpellsTab';
import { PlayerBioTab } from './components/tabs/player/PlayerBioTab';

export const SIDE_PANEL_TABS: TabDefinition[] = [
  { id: 'chat', label: 'Chat', component: ChatTab },
  { id: 'combat', label: 'Combat', component: CombatTab, combatOnly: true }, 
  { id: 'characters', label: 'Characters', component: CharactersTab }, 
  
  { id: 'stats', label: 'Stats', component: PlayerStatsTab, playerOnly: true, requiresActiveChar: true },
  { id: 'skills', label: 'Skills', component: PlayerSkillsTab, playerOnly: true, requiresActiveChar: true },
  { id: 'inventory', label: 'Inventory', component: PlayerInventoryTab, playerOnly: true, requiresActiveChar: true },
  { id: 'abilities', label: 'Abilities', component: PlayerAbilitiesTab, playerOnly: true, requiresActiveChar: true },
  { id: 'spells', label: 'Spells', component: PlayerSpellsTab, playerOnly: true, requiresActiveChar: true },
  { id: 'bio', label: 'Bio', component: PlayerBioTab, playerOnly: true, requiresActiveChar: true },

  { id: 'npcs', label: 'NPCs', component: NpcsTab, dmOnly: true },
  { id: 'bestiary', label: 'Bestiary', component: BestiaryTab, dmOnly: true },
  { id: 'locations', label: 'Locations', component: LocationsTab, dmOnly: true },
  { id: 'groups', label: 'Groups', component: GroupsTab, dmOnly: true },
  { id: 'campaign_notes', label: 'Campaign Notes', component: CampaignNotesTab, dmOnly: true },
  { id: 'assets', label: 'Assets', component: AssetsTab, dmOnly: true },
  
  { id: 'options', label: 'Options', component: OptionsTab }, 
];

export const DEFAULT_SIDE_PANEL_TAB: TabDefinition = SIDE_PANEL_TABS.find(t => t.id === 'chat')!;
export const DEFAULT_PLAYER_ACTIVE_CHAR_TAB: SidePanelTabName = 'stats';
