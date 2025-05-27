
import { useState, useCallback, useMemo } from 'react';
import {
    Character, CreatureTemplate, User, Token, CharacterCreationData, SidePanelTabName,
    AbilityScores, ActionDetail, HeldAction, AttackTargetingState, SpellTargetingState, Item, Area, Group,
    SidePanelContextMenuState, AddToGroupItem, SkillProficiencies, SavingThrowProficiencies,
    RaceDetail, ClassDetail, BackgroundDetail, FeatDetail, ClassFeatureChoice, LanguageDefinition, Point, ItemCategory, ChatMessageRollDetails
} from '../types';
import {
    DEFAULT_ABILITY_SCORES, DEFAULT_SKILL_PROFICIENCIES, DEFAULT_SAVING_THROW_PROFICIENCIES,
    TOKEN_DEFAULT_RADIUS, COLORS, DND_RACES_DETAILED, DND_CLASSES_DETAILED, DND_BACKGROUNDS_DETAILED,
    DND_FEATS_DETAILED, DND_LANGUAGES_DEFINITIONS, SIDE_PANEL_TABS, DEFAULT_PLAYER_ACTIVE_CHAR_TAB, DND_ITEMS_DETAILED,
    DND_SPELLS_DEFINITIONS, GRID_CELL_SIZE
} from '../constants';
import { generateId, calculateProficiencyBonus, parseSpeedFromString, parseChallengeRatingToLevel, addCharacterToInitiative, snapPointToGrid, getAbilityModifier } from '../utils';
import { multiplayerService } from '../MultiplayerService';
import { sampleWizardLvl20 } from '../sampleData';

interface UseCharactersAndModalsProps {
  currentUser: User;
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  getCharacterById: (characterId: string) => Character | undefined;

  tokens: Token[];
  combatState: 'none' | 'pre-combat' | 'active';
  initiativeOrder: string[];
  currentTurnCharacterId: string | null;
  roundCounter: number;
  activeSidePanelTab: SidePanelTabName;
  setActiveSidePanelTab: React.Dispatch<React.SetStateAction<SidePanelTabName>>;
  handleSystemMessage: (message: string, type?: 'message' | 'roll' | 'info') => void;
  setTokens: React.Dispatch<React.SetStateAction<Token[]>>;
  setSelectedTokenIds: React.Dispatch<React.SetStateAction<string[]>>;
  initialCharacters?: Character[];
  initialCreatureTemplates?: CreatureTemplate[];
  setAttackTargetingState: React.Dispatch<React.SetStateAction<AttackTargetingState>>;
  setSpellTargetingState: React.Dispatch<React.SetStateAction<SpellTargetingState>>;
  setHeldActions: React.Dispatch<React.SetStateAction<Record<string, HeldAction | null>>>;
  setInitiativeOrder: React.Dispatch<React.SetStateAction<string[]>>;
  setCurrentTurnCharacterId: React.Dispatch<React.SetStateAction<string | null>>;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  items: Item[];
  addNewItemDefinition: (item: Item) => void;
  attackTargetingState: AttackTargetingState;
  spellTargetingState: SpellTargetingState;
  characters: Character[];
}

export const useCharactersAndModals = (props: UseCharactersAndModalsProps) => {
  const {
    currentUser,
    characters: authoritativeCharactersFromProps,
    setCharacters: setAuthoritativeCharactersFromProps,
    getCharacterById: authoritativeGetCharacterByIdFromProps,
    tokens: appTokens,
    combatState,
    initiativeOrder,
    currentTurnCharacterId,
    roundCounter,
    activeSidePanelTab,
    setActiveSidePanelTab,
    handleSystemMessage,
    setTokens: setAppTokens,
    setSelectedTokenIds: setAppSelectedTokenIds,
    initialCreatureTemplates = [],
    setAttackTargetingState, setSpellTargetingState,
    setHeldActions, setInitiativeOrder, setCurrentTurnCharacterId, setGroups,
    items, addNewItemDefinition,
    attackTargetingState,
    spellTargetingState,
  } = props;

  const [creatureTemplatesInternalState, setCreatureTemplatesInternalState] = useState<CreatureTemplate[]>(initialCreatureTemplates);

  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [selectedCharacterForSheet, setSelectedCharacterForSheet] = useState<Character | null>(null);
  const [isSheetEditable, setIsSheetEditable] = useState(true);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [characterForAssignment, setCharacterForAssignment] = useState<Character | null>(null);

  const [activePlayerCharacterIdInternal, setActivePlayerCharacterIdInternal] = useState<string | null>(() => {
     if (currentUser.id === 'player1' && props.initialCharacters) {
        const wizExists = props.initialCharacters.some(c => c.id === sampleWizardLvl20.id && c.ownerPlayerId === 'player1');
        if (wizExists) return sampleWizardLvl20.id;
     }
     const firstOwnedPC = props.initialCharacters?.find(c => !c.isNPC && c.ownerPlayerId === currentUser.id);
     return firstOwnedPC ? firstOwnedPC.id : null;
  });


  const activePlayerCharacter = useMemo(() => {
    if (currentUser.isDM || !activePlayerCharacterIdInternal) return null;
    return authoritativeCharactersFromProps.find(c => c.id === activePlayerCharacterIdInternal) || null;
  }, [currentUser.isDM, activePlayerCharacterIdInternal, authoritativeCharactersFromProps]);


  const canEditCharacter = useCallback((character?: Character): boolean => {
    if (!character) return false;
    if (character.id.startsWith('view_template_')) return false;
    if (currentUser.isDM) return true;
    return currentUser.id === character.ownerPlayerId && multiplayerService.getLocalUserId() === character.ownerPlayerId;
  }, [currentUser]);

  const handleCreateCharacterSubmit = useCallback((data: CharacterCreationData, isNPCFlag: boolean = false) => {
    const newCharId = generateId('char_');
    const newTokenId = generateId('token_');

    const raceDetails = DND_RACES_DETAILED.find(r => r.id === data.raceId);
    const classDetails = DND_CLASSES_DETAILED.find(c => c.id === data.classId);
    const backgroundDetails = data.backgroundId ? DND_BACKGROUNDS_DETAILED.find(b => b.id === data.backgroundId) : undefined;
    const featDetails = data.chosenFeatId ? DND_FEATS_DETAILED.find(f => f.id === data.chosenFeatId) : undefined;

    if (!raceDetails || !classDetails) {
        console.error("Race or Class details not found during character creation.");
        handleSystemMessage("Error: Core race or class data missing. Character creation failed.");
        return;
    }

    const profBonus = calculateProficiencyBonus(data.level);
    const combinedActions: ActionDetail[] = [];
    raceDetails.racialTraits.forEach(trait => combinedActions.push({...trait, id: trait.id || generateId('action_'), actionCategory: 'racial_trait'}));

    classDetails.classFeatures.forEach(feature => {
        if ('options' in feature) {
            const choiceFeature = feature as ClassFeatureChoice;
            const selectedOptionNames = data.chosenClassFeatures?.[choiceFeature.id] || [];
            selectedOptionNames.forEach(optionName => {
                const chosenOptionDetail = choiceFeature.options.find(opt => opt.name === optionName);
                if (chosenOptionDetail) {
                    if (choiceFeature.id === 'wizard_choose_starting_spell') {
                        const spellDefinition = DND_SPELLS_DEFINITIONS.find(spell => spell.id === chosenOptionDetail.id || spell.name === chosenOptionDetail.name);
                        if (spellDefinition) {
                            combinedActions.push({...spellDefinition, id: spellDefinition.id || generateId('action_'), source: choiceFeature.name});
                        } else {
                            console.warn(`Could not find full spell definition for ${chosenOptionDetail.name} in DND_SPELLS_DEFINITIONS.`);
                            combinedActions.push({...chosenOptionDetail, id: chosenOptionDetail.id || generateId('action_'), actionCategory: 'spell', source: choiceFeature.name});
                        }
                    } else {
                        combinedActions.push({...chosenOptionDetail, id: chosenOptionDetail.id || generateId('action_'), actionCategory: 'class_feature', source: choiceFeature.name});
                    }
                }
            });
        } else {
            const directFeature = feature as Pick<ActionDetail, 'id' | 'name' | 'description' | 'source'>;
            combinedActions.push({...directFeature, id: directFeature.id || generateId('action_'), actionCategory: 'class_feature'});
        }
    });

    if (classDetails.id === 'wizard') {
        classDetails.grantsCantrips?.forEach(cantripRef => {
            const cantripDef = DND_SPELLS_DEFINITIONS.find(s => s.id === cantripRef.id || s.name === cantripRef.name);
            if (cantripDef && !combinedActions.some(a => a.id === cantripDef.id)) {
                combinedActions.push(cantripDef);
            }
        });
    }


    if (backgroundDetails?.feature) {
        combinedActions.push({...backgroundDetails.feature, id: backgroundDetails.feature.id || generateId('action_'), actionCategory: 'feat' });
    }
    if (featDetails) {
        combinedActions.push({
            id: generateId('action_feat_'),
            name: featDetails.name,
            description: featDetails.description,
            actionCategory: 'feat',
            source: 'Feat'
        });
    }

    const savingThrows: SavingThrowProficiencies = { ...DEFAULT_SAVING_THROW_PROFICIENCIES };
    classDetails.savingThrowProficiencies.forEach(save => savingThrows[save] = true);

    let finalNotes = '';
    if (featDetails) {
        finalNotes += `Feat: ${featDetails.name}\n${featDetails.description}\n\n`;
    }

    const finalLanguageNames = data.languages
        .split(',')
        .map(id => DND_LANGUAGES_DEFINITIONS.find(def => def.id === id.trim())?.name || id.trim())
        .filter(name => name)
        .join(', ');

    const startingItemIds: string[] = [];
    data.startingEquipment.forEach(itemName => {
        const itemDetail = items.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (itemDetail) {
            startingItemIds.push(itemDetail.id);
        } else {
            const placeholderItemId = generateId('item_placeholder_');
            const placeholderItem: Item = {
                id: placeholderItemId,
                name: itemName,
                description: `A basic ${itemName}.`,
                itemCategory: 'general' as ItemCategory,
                quantity: 1,
                weight: 1,
            };
            addNewItemDefinition(placeholderItem);
            startingItemIds.push(placeholderItemId);
            handleSystemMessage(`Warning: Item "${itemName}" was not fully defined. Basic version added.`);
        }
    });

    const newCharacter: Character = {
      id: newCharId, name: data.name, race: raceDetails.name, class: classDetails.name, subclass: data.subclass || '', level: data.level,
      abilityScores: data.abilityScores, skillProficiencies: data.skillProficiencies, savingThrowProficiencies: savingThrows,
      maxHp: data.maxHp, currentHp: data.maxHp, temporaryHp: 0, armorClass: data.armorClass, speed: data.speed,
      initiative: undefined, proficiencyBonus: profBonus, notes: finalNotes.trim(), tokenId: newTokenId,
      ownerPlayerId: isNPCFlag ? null : (currentUser.isDM ? null : multiplayerService.getLocalUserId()),
      isNPC: isNPCFlag, currentLocationId: null, currentAreaId: null, sourceTemplateId: undefined, actions: combinedActions,
      currentMovement: data.speed, isCampaignActive: isNPCFlag ? true : undefined,
      languages: finalLanguageNames, weaponProficiencies: data.weaponProficiencies, armorProficiencies: data.armorProficiencies,
      toolProficiencies: data.toolProficiencies, hitDice: { current: data.level, max: data.level, dieType: data.hitDie },
      senses: data.senses, deathSaves: { successes: 0, failures: 0 },
      itemIds: startingItemIds,
      equippedItems: {},
      equipmentNotes: data.startingEquipment.join(', ') || 'No specific starting equipment listed.',
      spellcastingAbility: classDetails.spellcastingAbility,
      spellSaveDC: undefined, spellAttackBonus: undefined, spellSlots: {},
      preparedSpells: [], knownSpells: [], alignment: '', background: backgroundDetails?.name || '',
      currency: { gp: 0, sp: 0, cp: 0 },
      attunementSlots: { current: 0, max: 3 },
      attunedItemIds: [],
      instanceNotes: "",
      temporaryEffects: [],
    };

    multiplayerService.sendCharacterCreate(newCharacter);
    setIsCreationModalOpen(false);

    if (!currentUser.isDM && !isNPCFlag) {
        setActivePlayerCharacterIdInternal(newCharId);
        const currentTabDef = SIDE_PANEL_TABS.find(t => t.id === activeSidePanelTab);
        if (!currentTabDef || (!currentTabDef.playerOnly && !currentTabDef.requiresActiveChar)) {
            setActiveSidePanelTab(DEFAULT_PLAYER_ACTIVE_CHAR_TAB);
        }
    }
  }, [currentUser.isDM, activeSidePanelTab, handleSystemMessage, setActiveSidePanelTab, items, addNewItemDefinition, multiplayerService.getLocalUserId()]);

  const handleSpawnNpcFromTemplate = useCallback((templateId: string, worldPosition: Point | null): string | undefined => {
    const template = creatureTemplatesInternalState.find(t => t.id === templateId);
    if (!template || !currentUser.isDM) {
      console.error("Creature template not found or insufficient permissions:", templateId);
      return undefined;
    }

    const newCharId = generateId('npc_char_');
    const newTokenId = generateId('npc_token_');
    const levelFromCR = parseChallengeRatingToLevel(template.challengeRating);
    const profBonus = calculateProficiencyBonus(levelFromCR);
    const maxHitDice = levelFromCR;

    const newActions: ActionDetail[] = template.actions.map(action => ({
      ...action, id: action.id || generateId('action_'),
      damage: action.damage?.map(d => ({ ...d, id: d.id || generateId('dmg_') })) || [],
      effects: action.effects ? [...action.effects] : [],
    }));

    const speed = parseSpeedFromString(template.speed);

    let characterShell: Character = {
      id: newCharId, name: template.name, race: template.race, class: template.type, subclass: '',
      level: levelFromCR, abilityScores: { ...template.abilityScores },
      maxHp: template.maxHp, currentHp: template.maxHp, armorClass: template.armorClass, speed: speed,
      notes: template.description || `A ${template.name}.`, tokenId: newTokenId, ownerPlayerId: null, isNPC: true,
      sourceTemplateId: template.id, currentLocationId: null, currentAreaId: null,
      actions: newActions,
      initiative: undefined,
      currentMovement: speed, isCampaignActive: true,
      skillProficiencies: { ...DEFAULT_SKILL_PROFICIENCIES },
      savingThrowProficiencies: { ...DEFAULT_SAVING_THROW_PROFICIENCIES },
      proficiencyBonus: profBonus,
      itemIds: [],
      equippedItems: {},
      spellSlots: {}, preparedSpells: [], knownSpells: [],
      languages: template.languages || '', weaponProficiencies: '', armorProficiencies: '', toolProficiencies: '',
      hitDice: { current: maxHitDice, max: maxHitDice, dieType: 'd8' },
      senses: template.senses || '', deathSaves: { successes: 0, failures: 0 },
      currency: { gp: 0, sp: 0, cp: 0 },
      attunementSlots: { current: 0, max: 3 },
      attunedItemIds: [],
      instanceNotes: "",
      temporaryEffects: [],
    };

    if (template.skills) {
        Object.keys(template.skills).forEach(skillName => {
            const skillKey = skillName.toLowerCase().replace(/\s+/g, '') as keyof SkillProficiencies;
            if (characterShell.skillProficiencies?.hasOwnProperty(skillKey)) {
                (characterShell.skillProficiencies as any)[skillKey] = true;
            }
        });
    }

    let charWithRolledInitiative = characterShell;
    let newFinalOrder = initiativeOrder;
    let initiativeRollDataForMessage: { d20Roll: number, modifier: number, total: number } | undefined = undefined;

    if (combatState === 'pre-combat' && worldPosition) {
        const initiativeResult = addCharacterToInitiative(
            characterShell,
            authoritativeCharactersFromProps,
            initiativeOrder
        );
        charWithRolledInitiative = initiativeResult.charWithInitiative;
        newFinalOrder = initiativeResult.newOrder;
        initiativeRollDataForMessage = initiativeResult.initiativeRollData;

        setAuthoritativeCharactersFromProps(prevChars => {
            const existingIndex = prevChars.findIndex(c => c.id === charWithRolledInitiative.id);
            if (existingIndex !== -1) {
                 const updatedChars = [...prevChars];
                updatedChars[existingIndex] = { ...charWithRolledInitiative };
                return updatedChars;
            }
            return [...prevChars, { ...charWithRolledInitiative }];
        });
    }

    multiplayerService.sendCharacterCreate(charWithRolledInitiative);

    if (worldPosition) {
        const newToken: Token = {
          id: newTokenId,
          position: snapPointToGrid(worldPosition, GRID_CELL_SIZE),
          radius: template.defaultTokenRadius || TOKEN_DEFAULT_RADIUS,
          color: COLORS[(authoritativeCharactersFromProps.length + appTokens.length) % COLORS.length],
          name: charWithRolledInitiative.name, characterId: newCharId,
        };
        multiplayerService.sendTokenUpdate(newToken);
        setAppSelectedTokenIds([newToken.id]);
    }

    if (combatState === 'pre-combat' && worldPosition) {
        multiplayerService.sendCombatStateUpdate({
            combatState,
            initiativeOrder: newFinalOrder,
            currentTurnCharacterId,
            roundCounter,
            updatedCharacters: [charWithRolledInitiative]
        });

        if (initiativeRollDataForMessage) {
            const rollData = initiativeRollDataForMessage;
            const chatMessageDetails: ChatMessageRollDetails = {
                characterName: charWithRolledInitiative.name,
                diceExpression: `1d20${rollData.modifier >= 0 ? '+' : ''}${rollData.modifier}`,
                description: `for Initiative`,
                d20Value: rollData.d20Roll,
                totalResult: rollData.total,
                advantageState: 'none',
            };
            const messageText = `(System) ${charWithRolledInitiative.name} rolls Initiative: 1d20[${rollData.d20Roll}] ${rollData.modifier >= 0 ? '+' : ''}${rollData.modifier} = ${rollData.total}`;
            multiplayerService.sendChatMessage({
                id: generateId('roll_init_spawn_'),
                text: messageText,
                type: 'roll',
                rollDetails: chatMessageDetails
            });
        }
    }
    return charWithRolledInitiative.id;
  }, [
      creatureTemplatesInternalState,
      authoritativeCharactersFromProps,
      setAuthoritativeCharactersFromProps,
      appTokens,
      combatState,
      initiativeOrder,
      currentTurnCharacterId,
      roundCounter,
      currentUser.isDM,
      setAppSelectedTokenIds,
      GRID_CELL_SIZE
  ]);

  const handleAddTokenForCharacter = useCallback((characterId: string, worldPosition: Point | null) => {
    const originalCharacter = authoritativeCharactersFromProps.find(c => c.id === characterId);
    if (!originalCharacter || !worldPosition) {
      console.error("Character not found or position missing for adding token:", characterId);
      return;
    }

    if (!currentUser.isDM && (originalCharacter.isNPC || originalCharacter.ownerPlayerId !== multiplayerService.getLocalUserId())) {
        handleSystemMessage(`Cannot add token for ${originalCharacter.name}. Permission denied.`);
        return;
    }
    const existingToken = appTokens.find(t => t.characterId === originalCharacter.id);

    if (existingToken) {
      multiplayerService.sendTokenUpdate({...existingToken, position: snapPointToGrid(worldPosition, GRID_CELL_SIZE)});
      setAppSelectedTokenIds([existingToken.id]);
      return;
    }

    let charToUpdate = originalCharacter;
    let finalNewOrder = initiativeOrder;
    let initiativeRollDataForMessage: { d20Roll: number, modifier: number, total: number } | undefined = undefined;

    if (combatState === 'pre-combat' && !initiativeOrder.includes(originalCharacter.id)) {
        const initiativeResult = addCharacterToInitiative(
            originalCharacter,
            authoritativeCharactersFromProps,
            initiativeOrder
        );
        charToUpdate = initiativeResult.charWithInitiative;
        finalNewOrder = initiativeResult.newOrder;
        initiativeRollDataForMessage = initiativeResult.initiativeRollData;

        setAuthoritativeCharactersFromProps(prevChars => {
            const charToAddOrUpdate = { ...charToUpdate };
            const existingIndex = prevChars.findIndex(c => c.id === charToAddOrUpdate.id);
            if (existingIndex !== -1) {
                const updatedChars = [...prevChars];
                updatedChars[existingIndex] = { ...charToAddOrUpdate };
                return updatedChars;
            }
            return [...prevChars, { ...charToAddOrUpdate }];
        });

        multiplayerService.sendCombatStateUpdate({
            combatState,
            initiativeOrder: finalNewOrder,
            currentTurnCharacterId,
            roundCounter,
            updatedCharacters: [charToUpdate]
        });

        if (initiativeRollDataForMessage) {
            const rollData = initiativeRollDataForMessage;
            const chatMessageDetails: ChatMessageRollDetails = {
                characterName: charToUpdate.name,
                diceExpression: `1d20${rollData.modifier >= 0 ? '+' : ''}${rollData.modifier}`,
                description: `for Initiative`,
                d20Value: rollData.d20Roll,
                totalResult: rollData.total,
                advantageState: 'none',
            };
            const messageText = `(System) ${charToUpdate.name} rolls Initiative: 1d20[${rollData.d20Roll}] ${rollData.modifier >= 0 ? '+' : ''}${rollData.modifier} = ${rollData.total}`;
            multiplayerService.sendChatMessage({
                id: generateId('roll_init_add_'),
                text: messageText,
                type: 'roll',
                rollDetails: chatMessageDetails
            });
        }
    }

    const newToken: Token = {
      id: charToUpdate.tokenId,
      position: snapPointToGrid(worldPosition, GRID_CELL_SIZE),
      radius: TOKEN_DEFAULT_RADIUS,
      color: COLORS[(authoritativeCharactersFromProps.length + appTokens.length) % COLORS.length],
      name: charToUpdate.name,
      characterId: charToUpdate.id,
    };

    multiplayerService.sendTokenUpdate(newToken);
    setAppSelectedTokenIds([newToken.id]);
  }, [
    authoritativeCharactersFromProps,
    setAuthoritativeCharactersFromProps,
    appTokens,
    combatState,
    initiativeOrder,
    currentTurnCharacterId,
    roundCounter,
    setAppSelectedTokenIds,
    currentUser,
    handleSystemMessage,
    GRID_CELL_SIZE
  ]);

  const handleOpenSheetOrSetActiveChar = useCallback((characterId: string) => {
    const character = authoritativeGetCharacterByIdFromProps(characterId);
    if (!character) return;

    if (currentUser.isDM) {
        setSelectedCharacterForSheet(character);
        setIsSheetEditable(canEditCharacter(character));
        setIsSheetModalOpen(true);
    } else {
        if (character.ownerPlayerId === currentUser.id) {
            setActivePlayerCharacterIdInternal(characterId);
            const currentTabDef = SIDE_PANEL_TABS.find(t => t.id === activeSidePanelTab);
            if (!currentTabDef || (!currentTabDef.playerOnly && !currentTabDef.requiresActiveChar)) {
                setActiveSidePanelTab(DEFAULT_PLAYER_ACTIVE_CHAR_TAB);
            }
        } else {
            handleSystemMessage("You can only view details for characters assigned to you.");
        }
    }
  }, [currentUser, authoritativeGetCharacterByIdFromProps, canEditCharacter, activeSidePanelTab, setActiveSidePanelTab, handleSystemMessage]);


  const handleOpenTemplateForViewing = useCallback((templateId: string) => {
    const template = creatureTemplatesInternalState.find(t => t.id === templateId);
    if (!template) return;

    const speed = parseSpeedFromString(template.speed);
    const levelFromCR = parseChallengeRatingToLevel(template.challengeRating);
    const profBonus = calculateProficiencyBonus(levelFromCR);
    const maxHitDice = levelFromCR;

    const viewOnlyCharacter: Character = {
      id: `view_template_${template.id}`, name: template.name, race: template.race, class: template.type, subclass: '',
      level: levelFromCR, abilityScores: { ...template.abilityScores },
      maxHp: typeof template.maxHp === 'string' ? 0 : template.maxHp,
      currentHp: typeof template.maxHp === 'string' ? 0 : template.maxHp,
      armorClass: template.armorClass, speed: speed, notes: template.description, tokenId: '',
      ownerPlayerId: null, isNPC: true, sourceTemplateId: template.id, currentLocationId: null,
      currentAreaId: null, actions: template.actions.map(a => ({...a, id: a.id || generateId('action_')})),
      initiative: undefined, currentMovement: speed,
      isCampaignActive: true,
      skillProficiencies: {}, savingThrowProficiencies: {}, proficiencyBonus: profBonus,
      itemIds: [], equippedItems: {}, spellSlots: {}, preparedSpells: [], knownSpells: [],
      languages: template.languages || '', weaponProficiencies: '', armorProficiencies: '', toolProficiencies: '',
      hitDice: { current: maxHitDice, max: maxHitDice, dieType: 'd8' },
      senses: template.senses || '', deathSaves: { successes: 0, failures: 0 },
      currency: { gp: 0, sp: 0, cp: 0 }, attunementSlots: { current: 0, max: 3}, attunedItemIds: [],
      instanceNotes: "",
      temporaryEffects: [],
      ...(template.skills && { skillProficiencies: Object.keys(template.skills).reduce((acc, key) => {
            if (DEFAULT_SKILL_PROFICIENCIES.hasOwnProperty(key as keyof SkillProficiencies)) {
                acc[key as keyof SkillProficiencies] = true;
            }
            return acc;
          }, {} as SkillProficiencies)
      })
    };

    setSelectedCharacterForSheet(viewOnlyCharacter);
    setIsSheetEditable(false);
    setIsSheetModalOpen(true);
  }, [creatureTemplatesInternalState]);


  const handleSaveSheet = useCallback((updatedCharacter: Character) => {
    if (updatedCharacter.id.startsWith('view_template_')) {
        setIsSheetModalOpen(false);
        setSelectedCharacterForSheet(null);
        return;
    }

    const processedActions = updatedCharacter.actions.map(action => ({
      ...action, id: action.id || generateId('action_'),
      damage: action.damage?.map(d => ({ ...d, id: d.id || generateId('dmg_') })) || []
    }));

    const profBonus = calculateProficiencyBonus(updatedCharacter.level);
    const characterToSave: Character = {
        ...updatedCharacter, actions: processedActions, proficiencyBonus: profBonus,
        spellSlots: updatedCharacter.spellSlots || {},
        skillProficiencies: updatedCharacter.skillProficiencies || { ...DEFAULT_SKILL_PROFICIENCIES },
        savingThrowProficiencies: updatedCharacter.savingThrowProficiencies || { ...DEFAULT_SAVING_THROW_PROFICIENCIES },
        languages: updatedCharacter.languages || '', weaponProficiencies: updatedCharacter.weaponProficiencies || '',
        armorProficiencies: updatedCharacter.armorProficiencies || '', toolProficiencies: updatedCharacter.toolProficiencies || '',
        hitDice: updatedCharacter.hitDice || { current: updatedCharacter.level, max: updatedCharacter.level, dieType: 'd8'},
        senses: updatedCharacter.senses || '', subclass: updatedCharacter.subclass || '',
        deathSaves: updatedCharacter.deathSaves || { successes: 0, failures: 0 },
        itemIds: updatedCharacter.itemIds || [],
        equippedItems: updatedCharacter.equippedItems || {},
        currency: updatedCharacter.currency || { gp: 0, sp: 0, cp: 0},
        attunementSlots: updatedCharacter.attunementSlots || {current: 0, max: 3},
        attunedItemIds: updatedCharacter.attunedItemIds || [],
        instanceNotes: updatedCharacter.instanceNotes || "",
        temporaryEffects: updatedCharacter.temporaryEffects || [],
    };

    multiplayerService.sendCharacterUpdate(characterToSave);
    setIsSheetModalOpen(false);
    setSelectedCharacterForSheet(null);
  }, []);

  const handleDeleteCharacter = useCallback((characterIdToDelete: string) => {
    const charToDelete = authoritativeGetCharacterByIdFromProps(characterIdToDelete);
    if (!charToDelete) return;
    if (characterIdToDelete.startsWith('view_template_')) return;

    if (!currentUser.isDM && (charToDelete.isNPC || charToDelete.ownerPlayerId !== multiplayerService.getLocalUserId())) {
      handleSystemMessage("You don't have permission to delete this character.");
      return;
    }
    if (spellTargetingState.isActive && spellTargetingState.casterId === characterIdToDelete) {
      setSpellTargetingState({ isActive: false, casterId: null, spell: null });
    }
    if (attackTargetingState.isActive && attackTargetingState.attackerId === characterIdToDelete) {
      setAttackTargetingState({ isActive: false, attackerId: null, actionId: null, actionDetails: null });
    }
    multiplayerService.sendCharacterDelete({ characterId: characterIdToDelete });
    setIsSheetModalOpen(false);
    setSelectedCharacterForSheet(null);
  }, [currentUser.isDM, authoritativeGetCharacterByIdFromProps, handleSystemMessage, setAttackTargetingState, setSpellTargetingState, spellTargetingState, attackTargetingState]);

  const handleOpenAssignModal = useCallback((characterId: string) => {
    const character = authoritativeGetCharacterByIdFromProps(characterId);
    if (!character || !currentUser.isDM) return;
    setCharacterForAssignment(character);
    setIsAssignModalOpen(true);
  }, [currentUser.isDM, authoritativeGetCharacterByIdFromProps]);

  const handleConfirmAssignment = useCallback((characterId: string, newOwnerId: string | null) => {
    const character = authoritativeGetCharacterByIdFromProps(characterId);
    if (!character || !currentUser.isDM) return;

    let updatedChar: Character;
    if (newOwnerId === "MAKE_NPC") {
        updatedChar = { ...character, ownerPlayerId: null, isNPC: true };
        handleSystemMessage(`${character.name} is now an NPC.`);
    } else {
        updatedChar = { ...character, ownerPlayerId: newOwnerId, isNPC: false };
        handleSystemMessage(`${character.name} assigned to ${newOwnerId || 'Unassigned PC'}.`);
    }

    multiplayerService.sendCharacterUpdate(updatedChar);
    setIsAssignModalOpen(false);
    setCharacterForAssignment(null);
  }, [currentUser.isDM, authoritativeGetCharacterByIdFromProps, handleSystemMessage]);

  const openCharacterCreationModal = useCallback(() => setIsCreationModalOpen(true), []);
  const closeCharacterCreationModal = useCallback(() => setIsCreationModalOpen(false), []);
  const closeSheetModal = useCallback(() => {
    setIsSheetModalOpen(false);
    setSelectedCharacterForSheet(null);
    if (selectedCharacterForSheet?.id === attackTargetingState.attackerId && attackTargetingState.isActive) {
        setAttackTargetingState({ isActive: false, attackerId: null, actionId: null, actionDetails: null });
    }
    if (selectedCharacterForSheet?.id === spellTargetingState.casterId && spellTargetingState.isActive) {
        setSpellTargetingState({ isActive: false, casterId: null, spell: null });
    }
  }, [selectedCharacterForSheet, attackTargetingState, spellTargetingState, setAttackTargetingState, setSpellTargetingState]);

  const closeAssignModal = useCallback(() => {
    setIsAssignModalOpen(false);
    setCharacterForAssignment(null);
  }, []);

  return {
    creatureTemplates: creatureTemplatesInternalState,
    setCreatureTemplates: setCreatureTemplatesInternalState,
    isSheetModalOpen, selectedCharacterForSheet, isSheetEditable,
    isCreationModalOpen, isAssignModalOpen, characterForAssignment,
    activePlayerCharacterId: activePlayerCharacterIdInternal,
    activePlayerCharacter,
    setActivePlayerCharacterId: setActivePlayerCharacterIdInternal,
    getCharacterById: authoritativeGetCharacterByIdFromProps,
    canEditCharacter,
    handleCreateCharacterSubmit, handleSpawnNpcFromTemplate, handleAddTokenForCharacter,
    handleOpenSheetOrSetActiveChar, handleOpenTemplateForViewing, handleSaveSheet,
    handleDeleteCharacter, handleOpenAssignModal, handleConfirmAssignment,
    openCharacterCreationModal, closeCharacterCreationModal, closeSheetModal, closeAssignModal,
    setIsSheetModalOpen, setSelectedCharacterForSheet,
  };
};
