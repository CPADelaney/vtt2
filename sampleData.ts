
import { Character, ActionDetail, AbilityScores, Item } from './types'; // FIX: (Verified) Added Item import
import { generateId } from './utils';
import { DND_SPELLS_DEFINITIONS, DEFAULT_ABILITY_SCORES } from './constants';

const getSpellByName = (name: string): ActionDetail | undefined => {
    return DND_SPELLS_DEFINITIONS.find(s => s.name.toLowerCase() === name.toLowerCase());
};

const wizardSpellsLvl20: ActionDetail[] = [
    // Cantrips
    getSpellByName("Fire Bolt"), 
    getSpellByName("Light"),
    getSpellByName("Mage Hand") || {id: generateId('spell_'), name: "Mage Hand", description: "A spectral hand appears.", spellLevel: "Cantrip", actionCategory: "spell"},
    getSpellByName("Prestidigitation") || {id: generateId('spell_'), name: "Prestidigitation", description: "Minor magical tricks.", spellLevel: "Cantrip", actionCategory: "spell"},
    // 1st
    getSpellByName("Magic Missile"), 
    getSpellByName("Shield (Spell)"), // Ensure correct name for shield spell 
    getSpellByName("Burning Hands"),
    getSpellByName("Feather Fall") || {id: generateId('spell_'), name: "Feather Fall", description: "Descend slowly.", spellLevel: "1st", actionCategory: "spell"},
    // 2nd
    getSpellByName("Misty Step") || {id: generateId('spell_'), name: "Misty Step", description: "Teleport short distance.", spellLevel: "2nd", actionCategory: "spell"},
    getSpellByName("Invisibility") || {id: generateId('spell_'), name: "Invisibility", description: "Become invisible.", spellLevel: "2nd", actionCategory: "spell"},
    getSpellByName("Web") || {id: generateId('spell_'), name: "Web", description: "Create sticky webs.", spellLevel: "2nd", actionCategory: "spell"},
    // 3rd
    getSpellByName("Fireball"), 
    getSpellByName("Counterspell") || {id: generateId('spell_'), name: "Counterspell", description: "Negate a spell.", spellLevel: "3rd", actionCategory: "spell"},
    getSpellByName("Fly") || {id: generateId('spell_'), name: "Fly", description: "Gain flying speed.", spellLevel: "3rd", actionCategory: "spell"},
    // 4th
    getSpellByName("Greater Invisibility") || {id: generateId('spell_'), name: "Greater Invisibility", description: "Improved invisibility.", spellLevel: "4th", actionCategory: "spell"},
    getSpellByName("Dimension Door") || {id: generateId('spell_'), name: "Dimension Door", description: "Teleport self and one other.", spellLevel: "4th", actionCategory: "spell"},
    // 5th
    getSpellByName("Cone of Cold") || {id: generateId('spell_'), name: "Cone of Cold", description: "Blast of cold.", spellLevel: "5th", actionCategory: "spell"},
    getSpellByName("Telekinesis") || {id: generateId('spell_'), name: "Telekinesis", description: "Move objects with mind.", spellLevel: "5th", actionCategory: "spell"},
    // 6th
    getSpellByName("Chain Lightning") || {id: generateId('spell_'), name: "Chain Lightning", description: "Lightning arcs between targets.", spellLevel: "6th", actionCategory: "spell"},
    getSpellByName("Disintegrate") || {id: generateId('spell_'), name: "Disintegrate", description: "Powerful destructive ray.", spellLevel: "6th", actionCategory: "spell"},
    // 7th
    getSpellByName("Teleport") || {id: generateId('spell_'), name: "Teleport", description: "Teleport long distances.", spellLevel: "7th", actionCategory: "spell"},
    getSpellByName("Prismatic Spray") || {id: generateId('spell_'), name: "Prismatic Spray", description: "Rainbow spray of effects.", spellLevel: "7th", actionCategory: "spell"},
    // 8th
    getSpellByName("Sunburst") || {id: generateId('spell_'), name: "Sunburst", description: "Blinding flash of light.", spellLevel: "8th", actionCategory: "spell"},
    // 9th
    getSpellByName("Meteor Swarm") || {id: generateId('spell_'), name: "Meteor Swarm", description: "Fiery orbs from the sky.", spellLevel: "9th", actionCategory: "spell"},
    getSpellByName("Wish") || {id: generateId('spell_'), name: "Wish", description: "Alter reality.", spellLevel: "9th", actionCategory: "spell"},
].filter(Boolean).map(spell => ({ ...spell, id: spell!.id || generateId('spell_'), actionCategory: 'spell' })) as ActionDetail[];


export const sampleWizardLvl20: Character = {
    id: 'sample_wizard_lvl20',
    name: 'Elminster Aumar',
    race: 'Human',
    class: 'Wizard',
    subclass: 'Evocation',
    level: 20,
    abilityScores: { strength: 8, dexterity: 14, constitution: 16, intelligence: 20, wisdom: 15, charisma: 12 },
    skillProficiencies: { arcana: true, history: true, investigation: true, insight: true, perception: true },
    savingThrowProficiencies: { intelligence: true, wisdom: true },
    maxHp: 102, // (4 base) + (3 CON mod * 20 levels) = 4 + 60 = 64. Wizards get 4+CON per level, so 4+3=7 per level. 7*20=140. PHB rule: 4 (1st level) + 19 * (avg 3.5 -> 4 + CON 3) = 4 + 19*7 = 4+133 = 137. Let's use fixed value for example consistency: 102.
    currentHp: 102,
    temporaryHp: 0,
    armorClass: 12, // Base 10 + DEX 2. Mage Armor would make it 15.
    speed: 30,
    proficiencyBonus: 6,
    notes: 'A powerful archmage, known for his wisdom and mastery of the arcane. Wears simple grey robes but carries an air of immense power.',
    tokenId: generateId('token_elminster_'),
    ownerPlayerId: 'player1', // Assigned to Player 1
    isNPC: false,
    actions: wizardSpellsLvl20,
    spellcastingAbility: 'intelligence',
    spellSaveDC: 8 + 6 + 5, // 8 + PB + INT mod (20 INT)
    spellAttackBonus: 6 + 5,   // PB + INT mod
    spellSlots: {
        "1": { current: 4, max: 4 },
        "2": { current: 3, max: 3 },
        "3": { current: 3, max: 3 },
        "4": { current: 3, max: 3 },
        "5": { current: 3, max: 3 },
        "6": { current: 2, max: 2 },
        "7": { current: 2, max: 2 },
        "8": { current: 1, max: 1 },
        "9": { current: 1, max: 1 },
    },
    initiative: undefined, 
    currentLocationId: null, 
    currentAreaId: null,
    sourceTemplateId: undefined, 
    currentMovement: 30, 
    isCampaignActive: undefined,
    languages: "Common, Elvish, Draconic, Celestial, Infernal, Primordial", 
    weaponProficiencies: "Daggers, Darts, Slings, Quarterstaffs, Light Crossbows",
    armorProficiencies: "", 
    toolProficiencies: "Calligrapher's Supplies", 
    hitDice: { current: 20, max: 20, dieType: "d6" },
    senses: "Passive Perception 18 (10 + 2 WIS + 6 PROF)", // Assuming Perception proficiency
    deathSaves: { successes: 0, failures: 0 },
    itemIds: ["item_quarterstaff_staff_of_power", "item_robe_archmagi"], // Example placeholder IDs
    equippedItems: { mainHand: "item_quarterstaff_staff_of_power", armor: "item_robe_archmagi"},
    currency: { gp: 500, sp: 0, cp: 0 },
    attunementSlots: { current: 2, max: 3 }, // Assuming Staff and Robe are attuned
    attunedItemIds: ["item_quarterstaff_staff_of_power", "item_robe_archmagi"],
    alignment: "Chaotic Good", 
    background: "Sage", 
    personalityTraits: "Curious, eccentric, and fiercely protective of knowledge.",
    ideals: "The pursuit of knowledge and the balance of magic.", 
    bonds: "His many apprentices and the magical weave itself.", 
    flaws: "Often forgetful of mundane matters; can be impatient with those less magically inclined.",
    appearanceDescription: "An elderly human with a long, flowing white beard, often seen in simple grey robes, eyes twinkling with arcane power.",
    instanceNotes: "",
    preparedSpells: wizardSpellsLvl20.map(s => s.id!), // Assume all known spells are prepared for simplicity
    knownSpells: wizardSpellsLvl20.map(s => s.id!),
};

// Example items to add to constants.ts or use as placeholders
export const placeholderWizardItems: Item[] = [
    {
        id: 'item_quarterstaff_staff_of_power',
        name: 'Staff of Power',
        description: 'A potent magical staff, crackling with arcane energy.',
        itemCategory: 'weapon', // Also an arcane focus
        slotType: 'mainHand',
        damage: [{id: generateId('dmg_staff'), dice: '1d6+1', type: 'Bludgeoning'}], // Magical
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
        itemCategory: 'armor', // Technically clothing, but provides AC bonus
        slotType: 'armor',
        armorClass: 15, // Base AC set by the robe (effectively 15 + DEX from other source, but often just sets AC)
        properties: ['AC set to 15 + DEX Mod if unarmored', 'Advantage on saves vs. spells'], // Simplified properties
        weight: 1,
        value: "Priceless",
        isMagical: true,
        requiresAttunement: true,
        effects: ["Set AC to 15 + DEX Mod (max 2 if no armor prof)", "Spell Save DC +2", "Spell Attack Bonus +2", "Advantage on saving throws against spells and other magical effects"]
    }
];
