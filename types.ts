
export interface Point {
  x: number;
  y: number;
}

export interface Token {
  id: string;
  position: Point;
  radius: number;
  color: string;
  name?: string;
  characterId?: string;
}

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChatMessageRollDetails {
  characterName: string;
  diceExpression: string; // The core dice string, e.g., "1d20+5"
  description?: string; // Additional text, e.g., "for Acrobatics check"
  d20Value?: number; // The kept d20 roll value
  totalResult?: number;
  targetAC?: number;
  isSuccess?: boolean; // For system-resolved attack rolls
  advantageState?: 'advantage' | 'disadvantage' | 'none'; // For the primary d20 roll
  d20Rolls?: number[]; // The actual two d20 values if adv/dis was used [roll1, roll2]
}

export interface ChatMessage {
  id: string;
  text: string; // Verbose roll string or chat message
  type: 'message' | 'roll' | 'info';
  rollDetails?: ChatMessageRollDetails; // Structured data for d20 rolls
}

export interface LastD20RollDisplayInfo {
  characterName: string;
  rollType: string; // e.g., "Attack", "CON Save", "Perception Check"
  d20Value: number; // The kept d20 roll
  totalResult?: number;
  targetValue?: number; // AC or DC if known by the system from the roll message
  outcome: 'success' | 'failure' | 'critical_hit' | 'critical_miss' | 'dm_resolves';
  timestamp: number;
  advantageState?: 'advantage' | 'disadvantage' | 'none';
  d20Rolls?: number[]; // The actual two d20 values if adv/dis was used
}


export interface ContextMenuAction {
  label: string;
  action: () => void;
  disabled?: boolean;
  isVisible?: () => boolean;
  subActions?: ContextMenuAction[]; // For nested menus
}

export interface ContextMenuState {
  visible: boolean;
  screenPosition: Point;
  worldPosition: Point;
  targetTokenId?: string;
}

export interface SidePanelContextMenuState {
  visible: boolean;
  screenPosition: Point;
  itemType?: 'character' | 'creatureTemplate' | 'inventoryItem' | 'equippedItem';
  itemId?: string;
  itemName?: string;
  itemSlot?: EquipmentSlot; // For equipped items
  additionalData?: any; // For passing item details or compatible slots
}

export interface AddToGroupItem {
  id: string;
  name: string;
  type: 'character' | 'creatureTemplate';
}


export interface MarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Ping {
  id: string;
  position: Point;
  startTime: number;
  maxRadius: number;
  duration: number;
  color: string;
}

// D&D Specific Types
export interface User {
  id: string;
  name: string;
  isDM: boolean;
}

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface SkillProficiencies {
  athletics?: boolean;
  acrobatics?: boolean;
  sleightOfHand?: boolean;
  stealth?: boolean;
  arcana?: boolean;
  history?: boolean;
  investigation?: boolean;
  nature?: boolean;
  religion?: boolean;
  animalHandling?: boolean;
  insight?: boolean;
  medicine?: boolean;
  perception?: boolean;
  survival?: boolean;
  deception?: boolean;
  intimidation?: boolean;
  performance?: boolean;
  persuasion?: boolean;
}

export interface SavingThrowProficiencies {
  strength?: boolean;
  dexterity?: boolean;
  constitution?: boolean;
  intelligence?: boolean;
  wisdom?: boolean;
  charisma?: boolean;
}


export interface Area {
  id: string;
  name: string;
  description?: string;
  isExpanded?: boolean; // For UI: shows/hides NPCs/Monsters/Items within this area
}

export interface Location {
  id: string;
  name: string;
  isExpanded?: boolean; // For UI: shows/hides Areas within this Location
  isActive?: boolean; // For DM to mark active in campaign
  areas: Area[];
}

export type ItemCategory = 'weapon' | 'armor' | 'shield' | 'general' | 'consumable' | 'tool' | 'container' | 'treasure' | 'other';
export type EquipmentSlot = 
  | 'mainHand' 
  | 'offHand' 
  | 'armor' 
  | 'helmet' 
  | 'boots' 
  | 'gloves' 
  | 'amulet' 
  | 'ring1' 
  | 'ring2' 
  | 'cape' 
  | 'belt';

export interface Item {
  id: string;
  name: string;
  description: string;
  itemCategory: ItemCategory;
  slotType?: EquipmentSlot | EquipmentSlot[]; // Suggests compatible slots
  quantity?: number;
  weight?: number;
  isMagical?: boolean; // New: For identifying magic items
  attuned?: boolean; // Retained for potential direct use, though character.attunedItemIds is primary
  requiresAttunement?: boolean;
  damage?: ActionDamageEntry[]; // For weapons
  armorClass?: number; // Base AC for armor, bonus for shields
  effects?: string[]; // e.g. "Grants +1 AC", "Resistance to fire"
  properties?: string[]; // e.g. "Versatile (1d10)", "Finesse", "Heavy"
  value?: string; // e.g. "50 gp"
}


export interface ActionDamageEntry {
  id: string;
  dice: string;
  type: string;
}

export interface AttackSettings {
  ability?: keyof AbilityScores | 'none';
  proficient?: boolean;
  bonus?: number;
}

export type ActionCategory = 'action' | 'bonus_action' | 'reaction' | 'spell' | 'feat' | 'class_feature' | 'racial_trait' | 'other';

export interface ActionDetail {
  id: string;
  name: string;
  description: string;
  actionCategory?: ActionCategory;

  isAttack?: boolean;

  attackSettings?: AttackSettings;
  range?: string;
  target?: string;
  damage?: ActionDamageEntry[];
  effects?: string[];

  spellLevel?: string;
  castingTime?: string;
  duration?: string;
  components?: { V?: boolean; S?: boolean; M?: string };
  school?: string;
  isRitual?: boolean;
  areaOfEffect?: {
    type: 'sphere' | 'cone' | 'line' | 'cube' | 'cylinder';
    size: number; 
    sizeY?: number; 
    description?: string; 
  };
  savingThrow?: { // New field for spell saves
    stat: keyof AbilityScores;
    dcOverride?: number; // If the spell has a fixed DC instead of caster's
    effectOnSave?: string; // e.g., "half damage"
    effectOnFailure?: string; // e.g., "full damage and condition"
  };

  source?: string;
  grantsCasterAdvantageOnNextAttack?: boolean; 
  imposesDisadvantageOnTargetNextAttack?: boolean; 
}

export interface TemporaryEffect {
  id: string;
  sourceName: string; // e.g., "Shield Spell"
  type: 'ac_bonus' | 'advantage_on_next_attack' | 'disadvantage_on_next_attack' | 'other';
  value?: number; // For AC bonus
  casterId: string; 
  targetCharacterId: string; // Who it's on
  // --- Duration Fields ---
  // For effects like Shield: "until the start of your next turn"
  expiresAtStartOfCastersNextTurn?: boolean; 
  // For effects lasting X rounds related to the caster
  durationCasterRounds?: number; 
  // For effects lasting X rounds related to the target
  durationTargetRounds?: number; 
  
  roundApplied: number; // Combat round it was applied
}


export interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  subclass?: string; 
  level: number;
  abilityScores: AbilityScores;
  skillProficiencies?: SkillProficiencies;
  savingThrowProficiencies?: SavingThrowProficiencies;
  maxHp: number;
  currentHp: number;
  temporaryHp?: number;
  armorClass: number; // Base AC
  speed: number;
  initiative?: number;
  proficiencyBonus?: number;
  notes: string; 
  tokenId: string;
  ownerPlayerId: string | null;
  isNPC?: boolean;
  currentLocationId?: string | null;
  currentAreaId?: string | null;
  sourceTemplateId?: string;
  actions: ActionDetail[];
  currentMovement?: number;
  isCampaignActive?: boolean;
  instanceNotes?: string; 

  languages?: string; 
  weaponProficiencies?: string; 
  armorProficiencies?: string; 
  toolProficiencies?: string; 
  hitDice?: { current: number; max: number; dieType: string }; 
  senses?: string; 
  deathSaves?: { successes: number; failures: number }; 

  itemIds: string[]; 
  equippedItems: Partial<Record<EquipmentSlot, string | null>>; 
  equipmentNotes?: string; 

  spellcastingAbility?: keyof AbilityScores;
  spellSaveDC?: number;
  spellAttackBonus?: number;
  spellSlots?: { [level: string]: { current: number, max: number } };
  preparedSpells?: string[];
  knownSpells?: string[];

  alignment?: string;
  background?: string;
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  appearanceDescription?: string;

  currency: { 
    gp: number;
    sp: number;
    cp: number;
  };
  attunementSlots: { 
    current: number;
    max: number;
  };
  attunedItemIds: string[]; 
  temporaryEffects?: TemporaryEffect[]; // Added for Shield spell and other temporary effects
}

// Type for Advantage/Disadvantage global toggle
export type AdvantageDisadvantageSetting = 'none' | 'advantage' | 'disadvantage';

export interface CharacterSheetModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCharacter: Character) => void;
  isEditable: boolean;
  onSendMessage?: (messageText: string, type?: 'message' | 'roll' | 'info') => void;
  setGlobalAdvantageState?: (state: AdvantageDisadvantageSetting) => void; 
  activePlayerCharacterId?: string | null; 
}


export interface CreatureTemplate {
  id: string;
  name: string;
  description: string;
  race: string; 
  size: string;
  type: string; 
  alignment: string;
  armorClass: number;
  maxHp: number; 
  speed: string; 
  abilityScores: AbilityScores;
  skills?: { [skillName: string]: number }; 
  senses?: string; 
  languages?: string; 
  challengeRating?: string; 

  actions: ActionDetail[]; 

  defaultTokenRadius?: number;
  defaultTokenColor?: string;
  image?: string; 
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  characterIds: string[];
}


export type SidePanelTabName =
  | 'chat' | 'characters' | 'options' | 'npcs' | 'locations'
  | 'campaign_notes' | 'assets' | 'bestiary' | 'combat' | 'groups'
  | 'stats' | 'skills' | 'inventory' | 'abilities' | 'spells' | 'bio';

export interface TabDefinition {
  id: SidePanelTabName;
  label: string;
  component: React.FC<any>; 
  dmOnly?: boolean;
  combatOnly?: boolean;
  playerOnly?: boolean;
  requiresActiveChar?: boolean;
}

export interface CharacterCreationData {
  name: string;
  raceId: string;
  classId: string;
  backgroundId?: string;
  subclass?: string; 
  level: number; 
  
  abilityScores: AbilityScores; 
  skillProficiencies: SkillProficiencies; 

  languages: string; 
  weaponProficiencies: string; 
  armorProficiencies: string; 
  toolProficiencies: string; 
  
  hitDie: string; 
  maxHp: number; 
  armorClass: number; 
  speed: number; 
  senses: string; 

  chosenFeatId?: string;
  chosenClassFeatures?: { [choiceId: string]: string[] }; 
  startingEquipment: string[]; 
}

export interface AssignmentOption {
  id: string;
  label: string;
}

export interface CombatantUIDetail extends Character {
}

export interface HeldAction {
  characterId: string;
  actionName: string;
  triggerDescription: string;
  roundHeld: number;
}

export interface AttackTargetingState {
  isActive: boolean;
  attackerId: string | null;
  actionId: string | null; 
  actionDetails: ActionDetail | null; 
}

export interface SpellTargetingState {
  isActive: boolean;
  casterId: string | null;
  spell: ActionDetail | null;
  // For Magic Missile specific logic
  assignedDarts?: Map<string, number>; // TokenID -> number of darts
  dartsToAssign?: number; // Remaining darts to assign for current Magic Missile cast
  // For AoE spells that need a direction (like Cone, Line)
  // or a center point (like Sphere, Cube).
  // This point is relative to the world grid, not screen.
  aoeTargetPoint?: Point; 
}


export interface PlayerStatsTabProps {
  activePlayerCharacter: Character | null;
  onUpdateHitDice: (characterId: string, type: 'spend' | 'regain_one' | 'regain_all', value?: number | string) => void;
  onUpdateDeathSaves: (characterId: string, type: 'success' | 'failure', increment: boolean) => void;
  onSendMessage?: (messageText: string, type?: 'message' | 'roll' | 'info') => void;
  areTooltipsEnabled?: boolean; 
}

export interface PlayerSkillsTabProps {
  activePlayerCharacter: Character | null;
  onSendMessage?: (messageText: string, type?: 'message' | 'roll' | 'info') => void; 
  areTooltipsEnabled?: boolean; 
}

export interface PlayerAbilitiesTabProps { 
  activePlayerCharacter: Character | null;
  onSendMessage?: (messageText: string, type?: 'message' | 'roll' | 'info') => void;
  setGlobalAdvantageState?: (state: AdvantageDisadvantageSetting) => void;
  onCastReactionAbility?: (casterId: string, ability: ActionDetail) => void; 
}

export interface PlayerSpellsTabProps {
  activePlayerCharacter: Character | null;
  onUpdateSpellSlot: (level: string, change: number) => void;
  onSendMessage?: (messageText: string, type?: 'message' | 'roll' | 'info') => void;
  areTooltipsEnabled?: boolean;
  onInitiateSpellTargeting: (casterId: string, spell: ActionDetail) => void;
}


export interface PlayerInventoryTabProps {
  activePlayerCharacter: Character | null;
  currentUser: User; 
  items: Item[]; 
  getItemById: (itemId: string) => Item | undefined;
  onEquipItem: (characterId: string, itemId: string, slot: EquipmentSlot, combatState: 'none' | 'pre-combat' | 'active', currentTurnCharacterId: string | null) => void;
  onUnequipItem: (characterId: string, slot: EquipmentSlot, combatState: 'none' | 'pre-combat' | 'active', currentTurnCharacterId: string | null) => void;
  onAttuneItem: (characterId: string, itemId: string) => void;
  onEndAttunement: (characterId: string, itemId: string) => void;
  onUpdateCurrency: (characterId: string, currencyType: 'gp' | 'sp' | 'cp', newAmount: number) => void;
  onShowSidePanelContextMenu: (event: React.MouseEvent, itemType: 'inventoryItem' | 'equippedItem', itemId: string, itemName: string, slot?: EquipmentSlot, additionalData?: any) => void;
  areTooltipsEnabled?: boolean;
  combatState: 'none' | 'pre-combat' | 'active';
  currentTurnCharacterId: string | null;
}


export interface OptionsTabProps {
  currentUser: User; 
  areTooltipsEnabled?: boolean;
  onToggleTooltips?: () => void;
  onToggleDMView?: () => void; 
}

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  enabled?: boolean; 
}

// --- New Types for Detailed Character Creation ---
export type CharacterCreationTabName = 'race' | 'class' | 'background' | 'abilities' | 'inventory' | 'details';
export type AbilityScoreGenerationMethod = 'manual' | 'standardArray' | 'roll4d6kh3';

export interface EquipmentOption {
  id: string; 
  name: string; 
  itemsToGrant: string[]; 
}

export interface EquipmentChoice {
  id: string; 
  choose: number; 
  from: EquipmentOption[];
  description?: string; 
}


export interface FeatDetail {
  id: string;
  name: string;
  description: string;
  abilityScoreIncrease?: Partial<AbilityScores>;
  skillProficiencyOptions?: { choose: number; options: (keyof SkillProficiencies)[] }; 
  toolProficiencyOptions?: { choose: number; options: string[] }; 
  directSkillProficiencies?: (keyof SkillProficiencies)[];
  directToolProficiencies?: string[];
}

export interface SkillDefinition {
  id: keyof SkillProficiencies;
  name: string; 
  ability: keyof AbilityScores;
  description: string;
}

export interface LanguageDefinition {
  id: string; 
  name: string; 
  description: string;
  typicalSpeakers?: string;
}

export interface RaceDetail {
  id: string;
  name: string;
  flavorText: string;
  abilityScoreIncreases: Partial<AbilityScores>; 
  bonusAbilityScoreChoice?: { choose: number; amount: number; options?: (keyof AbilityScores)[] }; 
  speed: number;
  size: string;
  racialTraits: Pick<ActionDetail, 'id' | 'name' | 'description' | 'source'>[];
  languages: (string | { choose: number; from?: string[] })[]; 
  skillProficiencies?: (keyof SkillProficiencies)[]; 
  skillProficiencyOptions?: { choose: number; options: (keyof SkillProficiencies)[] }; 
  featOptions?: { choose: number }; 
}

export interface ClassFeatureChoice {
  id: string; 
  name: string; 
  description: string; 
  choose: number; 
  options: Pick<ActionDetail, 'id' | 'name' | 'description' | 'source'>[]; 
}


export interface ClassDetail {
  id: string;
  name: string;
  flavorText: string;
  hitDie: string; 
  primaryAbilities: (keyof AbilityScores)[];
  savingThrowProficiencies: (keyof AbilityScores)[];
  armorProficiencies: string[]; 
  weaponProficiencies: string[];
  toolProficienciesOptions?: { choose: number; options: string[] }; 
  skillProficienciesOptions: { choose: number; options: (keyof SkillProficiencies)[] };
  startingEquipment: (string | EquipmentChoice)[]; 
  classFeatures: (Pick<ActionDetail, 'id' | 'name' | 'description' | 'source'> | ClassFeatureChoice)[]; 
  recommendedBackgrounds?: string[]; 
  spellcastingAbility?: keyof AbilityScores;
  grantsCantrips?: Pick<ActionDetail, 'id' | 'name'>[]; 
  grantsSpells?: { level: number; choose: number; from: Pick<ActionDetail, 'id' | 'name'>[] }; 
}

export interface BackgroundDetail {
  id: string;
  name: string;
  flavorText: string;
  skillProficiencies: (keyof SkillProficiencies)[]; 
  toolProficiencies?: (string | { choose: number; options: string[] })[]; 
  languages?: (string | { choose: number; from?: string[] })[]; 
  startingEquipment: (string | EquipmentChoice)[]; 
  feature: Pick<ActionDetail, 'id' | 'name' | 'description' | 'source'>;
}

export interface SpellDetailPopupProps {
  spell: ActionDetail;
  isOpen: boolean;
  onClose: () => void;
  positionRef?: React.RefObject<HTMLElement>; 
}

// New: For Spell Save Prompts
export interface PendingSpellSave {
  id: string; // Unique ID for this save prompt
  casterId: string;
  casterName: string;
  spellId: string;
  spellName: string;
  targetCharacterId: string;
  targetCharacterName: string;
  saveStat: keyof AbilityScores;
  saveDC: number;
  timestamp: number; // To help with ordering or auto-clearing old ones
  effectOnSave?: string;
  effectOnFailure?: string;
}
