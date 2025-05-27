

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { GridCanvas, GridCanvasHandle } from './components/GridCanvas';
import { ContextMenu } from './components/ContextMenu';
import { CharacterSheetModal } from './components/CharacterSheetModal';
import { CharacterCreationModal } from './components/CharacterCreationModal';
import { AssignCharacterModal } from './components/AssignCharacterModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { AddToGroupModal } from './components/AddToGroupModal';
import { RecentD20RollWidget } from './components/RecentD20RollWidget';
import { AdvDisToggle } from './components/AdvDisToggle';
// Import new SpellSavePromptWidget
import { SpellSavePromptWidget } from './components/SpellSavePromptWidget';
// FIX: Added AbilityScores to the import list from './types'
import { Token, Point, ChatMessage, ContextMenuAction, User, Character, Location, SidePanelTabName, CharacterCreationData, CreatureTemplate, HeldAction, AttackTargetingState, SpellTargetingState, Item, Area, Group, SidePanelContextMenuState, AddToGroupItem, EquipmentSlot, LastD20RollDisplayInfo, AdvantageDisadvantageSetting, PlayerAbilitiesTabProps, ActionDetail, TemporaryEffect, PendingSpellSave, SavingThrowProficiencies, AbilityScores, ChatMessageRollDetails } from './types';
import { multiplayerService } from './MultiplayerService';
import { SidePanel } from './components/SidePanel';
// Import getCellsInCone from utils
import { generateId, getAbilityModifier, calculateProficiencyBonus, buildDamageRollCommand, parseRangeToPixels, getEffectiveAC, getCharactersInCone, getCellsInCone } from './utils';
// FIX: Import DND_ITEMS_DETAILED from constants.ts
import { SAMPLE_CREATURE_TEMPLATES, DEFAULT_PLAYER_ID, DM_PLAYER_ID_ASSOCIATION, DND_EQUIPMENT_SLOTS, GRID_CELL_SIZE, DND_SPELLS_DEFINITIONS, DND_ITEMS_DETAILED } from './constants'; 
// FIX: Added DiceTerm from './services/diceRoller'
import { rollDice, DiceTerm } from './services/diceRoller';

// Import Custom Hooks
import { useAppGlobalState } from './hooks/useAppGlobalState';
import { useChat } from './hooks/useChat';
import { useTokensAndSelection } from './hooks/useTokensAndSelection';
import { useCharactersAndModals } from './hooks/useCharactersAndModals';
import { useCombatSystem } from './hooks/useCombatSystem';
import { useLocationsAndAreas } from './hooks/useLocationsAndAreas';
import { useGroupsAndModals } from './hooks/useGroupsAndModals';
import { useContextMenusStates } from './hooks/useContextMenusStates';
import { useHPAndResources } from './hooks/useHPAndResources';
import { useInventoryManagement } from './hooks/useInventoryManagement';
import { useMultiplayerListeners } from './hooks/useMultiplayerListeners';
import { sampleWizardLvl20 } from './sampleData';


export const App: React.FC = () => {
  const gridCanvasRef = useRef<GridCanvasHandle>(null);

  const {
    currentUser, setCurrentUser, activeSidePanelTab, setActiveSidePanelTab,
    campaignNotes, setCampaignNotes, areTooltipsEnabled, setAreTooltipsEnabled,
    toggleUserDMStatus
  } = useAppGlobalState();

  const [globalAdvantageState, setGlobalAdvantageState] = useState<AdvantageDisadvantageSetting>('none');
  const [pendingSpellSaves, setPendingSpellSaves] = useState<PendingSpellSave[]>([]);

  // Lifted state for authoritativeCharacters
  const [authoritativeCharacters, setAuthoritativeCharacters] = useState<Character[]>([sampleWizardLvl20].map(c => ({ ...c, temporaryEffects: c.temporaryEffects || [] })));
  const authoritativeGetCharacterById = useCallback((characterId: string): Character | undefined => {
    return authoritativeCharacters.find(char => char.id === characterId);
  }, [authoritativeCharacters]);


  const {
    items, setItems, getItemById,
    handleEquipItem, handleUnequipItem, handleAttuneItem, handleEndAttunement, handleUpdateCurrency,
    addNewItemDefinition
  } = useInventoryManagement({initialItems: DND_ITEMS_DETAILED});

  const { chatMessages, setChatMessages, handleSendMessage, handleSystemMessage } = useChat({
    currentUser,
    globalAdvantageState,
    setGlobalAdvantageState
  });
  
  const [spellTargetingState, setSpellTargetingState] = useState<SpellTargetingState>({
    isActive: false, casterId: null, spell: null, assignedDarts: undefined, dartsToAssign: undefined
  });

  const {
    tokens, setTokens: setTokensState, selectedTokenIds, setSelectedTokenIds: setSelectedTokenIdsState,
    handleTokenSelect, handleMarqueeSelect, handleTokenDragStart,
    handleTokenMove, handleTokenDragEnd, handleRemoveTokenFromMap,
  } = useTokensAndSelection({
    currentUser,
    attackTargetingState: {isActive: false, attackerId: null, actionId: null, actionDetails: null}, // Will be updated by useCombatSystem
    spellTargetingState: spellTargetingState, 
    getCharacterById: authoritativeGetCharacterById, 
    canMoveTokenOwnedBy: (ownerPlayerId, isNPC) => {
        if (currentUser.isDM) return true;
        if (isNPC) return false;
        return currentUser.id === ownerPlayerId && multiplayerService.getLocalUserId() === ownerPlayerId;
    },
    handleSystemMessage
  });

  const {
    combatState, setCombatState, initiativeOrder, setInitiativeOrder,
    currentTurnCharacterId, setCurrentTurnCharacterId, roundCounter, setRoundCounter,
    heldActions, setHeldActions, attackTargetingState, setAttackTargetingState,
    handleEnterPreCombatMode, handleStartActiveCombat, handleEndCombat, handleEndTurn,
    handleUpdateInitiativeScore, handleSetHeldAction, handleUseHeldAction,
    handleInitiateAttack, handleCancelAttackMode, handleResolveAttack,
  } = useCombatSystem({
    currentUser,
    characters: authoritativeCharacters, 
    getCharacterById: authoritativeGetCharacterById, 
    tokens: tokens,
    setActiveSidePanelTab, handleSystemMessage,
    setCharacters: setAuthoritativeCharacters,
    spellTargetingState: spellTargetingState, 
    setSpellTargetingState: setSpellTargetingState, 
  });
  
  const {
    // Destructure returned functions and state accessors, but not characters/setCharacters as they are lifted
    creatureTemplates: authoritativeCreatureTemplates, 
    setCreatureTemplates: setAuthoritativeCreatureTemplates, 
    isSheetModalOpen: isAuthoritativeSheetModalOpen,
    selectedCharacterForSheet: authoritativeSelectedCharacterForSheet,
    isSheetEditable: isAuthoritativeSheetEditable,
    isCreationModalOpen: isAuthoritativeCreationModalOpen,
    isAssignModalOpen: isAuthoritativeAssignModalOpen,
    characterForAssignment: authoritativeCharacterForAssignment,
    activePlayerCharacterId: authoritativeActivePlayerCharacterId,
    activePlayerCharacter: authoritativeActivePlayerCharacter,
    setActivePlayerCharacterId: setAuthoritativeActivePlayerCharacterId,
    canEditCharacter: authoritativeCanEditCharacter,
    handleCreateCharacterSubmit: authoritativeHandleCreateCharacterSubmit,
    handleSpawnNpcFromTemplate: authoritativeHandleSpawnNpcFromTemplate,
    handleAddTokenForCharacter: authoritativeHandleAddTokenForCharacter,
    handleOpenSheetOrSetActiveChar: authoritativeHandleOpenSheetOrSetActiveChar,
    handleOpenTemplateForViewing: authoritativeHandleOpenTemplateForViewing,
    handleSaveSheet: authoritativeHandleSaveSheet,
    handleDeleteCharacter: authoritativeHandleDeleteCharacter,
    handleOpenAssignModal: authoritativeHandleOpenAssignModal,
    handleConfirmAssignment: authoritativeHandleConfirmAssignment,
    openCharacterCreationModal: authoritativeOpenCharacterCreationModal,
    closeCharacterCreationModal: authoritativeCloseCharacterCreationModal,
    closeSheetModal: authoritativeCloseSheetModal,
    closeAssignModal: authoritativeCloseAssignModal,
  } = useCharactersAndModals({
    currentUser,
    characters: authoritativeCharacters, // Pass lifted state
    setCharacters: setAuthoritativeCharacters, // Pass lifted setter
    tokens: tokens,                      
    combatState: combatState,            
    initiativeOrder: initiativeOrder,    
    currentTurnCharacterId: currentTurnCharacterId, 
    roundCounter: roundCounter,          
    activeSidePanelTab, setActiveSidePanelTab,
    handleSystemMessage, 
    setTokens: setTokensState, 
    setSelectedTokenIds: setSelectedTokenIdsState, 
    initialCreatureTemplates: SAMPLE_CREATURE_TEMPLATES,
    setAttackTargetingState, 
    setSpellTargetingState,  
    setHeldActions,          
    setInitiativeOrder,      
    setCurrentTurnCharacterId, 
    setGroups: () => {}, // Placeholder, groups managed by useGroupsAndModals
    items,
    addNewItemDefinition,
    attackTargetingState, 
    spellTargetingState,
    getCharacterById: authoritativeGetCharacterById, // Pass the lifted getter
  });

  const canMoveTokenOwnedBy = useCallback((ownerPlayerId: string | null, isNPC?: boolean): boolean => {
    if (currentUser.isDM) return true;
    if (isNPC) return false;
    return currentUser.id === ownerPlayerId && multiplayerService.getLocalUserId() === ownerPlayerId;
  }, [currentUser]);

  const {
    locations, setLocations,
    handleCreateLocation, handleSetCharacterLocationAndArea, handleToggleLocationExpand,
    handleToggleNpcCampaignActive, handleToggleLocationActive, handleCreateArea, handleToggleAreaExpanded,
  } = useLocationsAndAreas({ currentUser, getCharacterById: authoritativeGetCharacterById, handleSystemMessage });

  const {
    groups, setGroups, isCreateGroupModalOpen, openCreateGroupModal, closeCreateGroupModal,
    isAddToGroupModalOpen, openAddToGroupModal, closeAddToGroupModal,
    itemForAddToGroup,
    handleCreateGroupWithMembers, handleDeleteGroup, handleAddCharacterToGroup,
    handleRemoveCharacterFromGroup, handleSpawnMonsterAndAddToGroup,
    handleAssignGroupToLocationArea, handleConfirmAddToGroup,
  } = useGroupsAndModals({
    currentUser, getCharacterById: authoritativeGetCharacterById, creatureTemplates: authoritativeCreatureTemplates, locations,
    handleSpawnNpcFromTemplate: authoritativeHandleSpawnNpcFromTemplate, handleSystemMessage
  });

  const {
    mapContextMenu, sidePanelContextMenu,
    handleShowMapContextMenu, handleShowSidePanelContextMenu,
    closeMapContextMenu, closeSidePanelContextMenu
  } = useContextMenusStates({
    attackTargetingState, onCancelAttackMode: handleCancelAttackMode,
    spellTargetingState, onCancelSpellTargeting: () => setSpellTargetingState({isActive: false, casterId: null, spell: null, assignedDarts: undefined, dartsToAssign: undefined}),
    selectedTokenIds, setSelectedTokenIds: setSelectedTokenIdsState, tokens, getCharacterById: authoritativeGetCharacterById,
    canMoveTokenOwnedBy, currentUserIsDM: currentUser.isDM
  });

  const {
    handleUpdateCharacterHP, handleUpdateCharacterTempHP, handleUpdateCharacterSpellSlots,
    handleUpdateHitDice, handleUpdateDeathSaves,
  } = useHPAndResources({ getCharacterById: authoritativeGetCharacterById, handleSystemMessage });

  const [lastD20RollInfo, setLastD20RollInfo] = useState<LastD20RollDisplayInfo | null>(null);
  const [isRollWidgetCollapsed, setIsRollWidgetCollapsed] = useState(false);


  useMultiplayerListeners({
    currentUser, setCurrentUser,
    tokens, setTokens: setTokensState, selectedTokenIds, setSelectedTokenIds: setSelectedTokenIdsState,
    characters: authoritativeCharacters,         
    setCharacters: setAuthoritativeCharacters,   
    getCharacterById: authoritativeGetCharacterById, 
    activePlayerCharacterId: authoritativeActivePlayerCharacterId,
    setActivePlayerCharacterId: setAuthoritativeActivePlayerCharacterId,
    selectedCharacterForSheet: authoritativeSelectedCharacterForSheet,
    setSelectedCharacterForSheet: (charOrUpdater: React.SetStateAction<Character | null>) => {
      let charToSet: Character | null = null;
      if (typeof charOrUpdater === 'function') {
        charToSet = charOrUpdater(authoritativeSelectedCharacterForSheet);
      } else {
        charToSet = charOrUpdater; 
      }

      if (charToSet) {
        authoritativeHandleOpenSheetOrSetActiveChar(charToSet.id);
      } else {
        authoritativeCloseSheetModal();
      }
    },
    setIsSheetModalOpen: (isOpenOrUpdater: React.SetStateAction<boolean>) => {
      let isOpenValue: boolean;
      if (typeof isOpenOrUpdater === 'function') {
        isOpenValue = isOpenOrUpdater(isAuthoritativeSheetModalOpen);
      } else {
        isOpenValue = isOpenOrUpdater; 
      }

      if (isOpenValue) {
        if (authoritativeSelectedCharacterForSheet) {
          authoritativeHandleOpenSheetOrSetActiveChar(authoritativeSelectedCharacterForSheet.id);
        } else {
          console.warn("setIsSheetModalOpen(true) called by multiplayer listener without a selected character.");
        }
      } else {
        authoritativeCloseSheetModal();
      }
    },
    locations, setLocations,
    items, setItems,
    groups, setGroups,
    creatureTemplates: authoritativeCreatureTemplates, 
    setCreatureTemplates: setAuthoritativeCreatureTemplates,
    chatMessages, setChatMessages,
    campaignNotes, setCampaignNotes,
    combatState, setCombatState, initiativeOrder, setInitiativeOrder,
    currentTurnCharacterId, setCurrentTurnCharacterId, roundCounter, setRoundCounter,
    heldActions, setHeldActions,
    attackTargetingState, setAttackTargetingState,
    spellTargetingState, setSpellTargetingState,
    activeSidePanelTab, setActiveSidePanelTab,
    handleSystemMessage,
    setLastD20RollInfo,
  });

  const handleAddPendingSpellSave = useCallback((
    caster: Character,
    spell: ActionDetail,
    targetCharacter: Character,
    saveStat: keyof AbilityScores,
    saveDC: number,
    effectOnSave?: string,
    effectOnFailure?: string
  ) => {
    const newSave: PendingSpellSave = {
      id: generateId('spellsave_'),
      casterId: caster.id,
      casterName: caster.name,
      spellId: spell.id,
      spellName: spell.name,
      targetCharacterId: targetCharacter.id,
      targetCharacterName: targetCharacter.name,
      saveStat: saveStat,
      saveDC: saveDC,
      timestamp: Date.now(),
      effectOnSave,
      effectOnFailure
    };
    setPendingSpellSaves(prev => [...prev, newSave]);
    handleSystemMessage(`${targetCharacter.name} needs to make a ${saveStat.toUpperCase()} saving throw (DC ${saveDC}) against ${spell.name} cast by ${caster.name}.`, "info");
  }, [handleSystemMessage]);

  const handleRollSpellSave = useCallback((saveId: string, targetId: string, stat: keyof AbilityScores, dc: number) => {
    const target = authoritativeGetCharacterById(targetId);
    const savePrompt = pendingSpellSaves.find(s => s.id === saveId);

    if (!target || !savePrompt) {
      handleSystemMessage("Error: Target or save prompt not found for spell save.", "info");
      setPendingSpellSaves(prev => prev.filter(s => s.id !== saveId));
      return;
    }

    const abilityMod = getAbilityModifier(target.abilityScores[stat]);
    const profBonus = target.proficiencyBonus || calculateProficiencyBonus(target.level);
    const isProficient = target.savingThrowProficiencies?.[stat as keyof SavingThrowProficiencies] || false;
    const saveBonus = abilityMod + (isProficient ? profBonus : 0);
    
    const rollDescription = `for ${target.name}'s ${stat.toUpperCase()} save vs ${savePrompt.spellName} (DC ${dc})`;
    const rollCommand = `/roll 1d20${saveBonus >= 0 ? '+' : ''}${saveBonus} ${rollDescription}`;

    const rollResult = rollDice(rollCommand, globalAdvantageState); 

    if (rollResult && rollResult.components.length > 0) {
      const d20Term = rollResult.components.find(c => c.type === 'dice' && c.diceSides === 20) as DiceTerm | undefined;
      const success = rollResult.total >= dc;

      const chatMessageRollDetails: ChatMessageRollDetails = {
        characterName: target.name, 
        diceExpression: rollResult.diceExpression,
        description: rollResult.description,
        d20Value: d20Term ? d20Term.rolls[0] : 0,
        totalResult: rollResult.total,
        targetAC: dc, 
        isSuccess: success,
        advantageState: d20Term?.advantageState || 'none',
        d20Rolls: d20Term?.allIndividualRolls,
      };
      
      let finalMessageText = `(System) ${rollResult.verbose} `;
      if (success) {
        finalMessageText += `Success! ${savePrompt.effectOnSave || ''}`;
      } else {
        finalMessageText += `Failure! ${savePrompt.effectOnFailure || ''}`;
      }

      multiplayerService.sendChatMessage({
        id: generateId('roll_save_'),
        text: finalMessageText,
        type: 'roll', 
        rollDetails: chatMessageRollDetails,
      });

      if (rollResult.appliedGlobalAdvantage && (rollResult.appliedGlobalAdvantage === 'advantage' || rollResult.appliedGlobalAdvantage === 'disadvantage')) {
        setGlobalAdvantageState('none');
      }

      // Auto-roll damage
      const spellDefinition = DND_SPELLS_DEFINITIONS.find(s => s.id === savePrompt.spellId || s.name === savePrompt.spellName);
      const caster = authoritativeGetCharacterById(savePrompt.casterId);

      if (spellDefinition?.damage && spellDefinition.damage.length > 0 && caster) {
        let takeHalfDamage = false;
        if (success && spellDefinition.savingThrow?.effectOnSave?.toLowerCase().includes("half damage")) {
            takeHalfDamage = true;
        }
        
        if (!success || takeHalfDamage) { 
            const damageRollCommand = buildDamageRollCommand(spellDefinition.damage, caster.abilityScores, false); 
            const damageRollResult = rollDice(`/roll ${damageRollCommand} for ${spellDefinition.name} damage to ${target.name}`);

            if (damageRollResult) {
                let damageMessage = `(System) ${spellDefinition.name} damage on ${target.name}: ${damageRollResult.verbose}`;
                let actualDamageDealt = damageRollResult.total;
                if (takeHalfDamage) {
                    actualDamageDealt = Math.floor(damageRollResult.total / 2);
                    damageMessage += ` (Target takes half: ${actualDamageDealt})`;
                }
                 multiplayerService.sendChatMessage({
                    id: generateId('dmg_roll_'),
                    text: damageMessage,
                    type: 'roll',
                 });
                 // Apply damage to target character
                 const currentTargetHp = target.currentHp; 
                 handleUpdateCharacterHP(target.id, currentTargetHp - actualDamageDealt);
            }
        }
      }


    } else {
      handleSystemMessage(`Error rolling ${stat.toUpperCase()} save for ${target.name}. Invalid roll result.`, "info");
    }
    setPendingSpellSaves(prev => prev.filter(s => s.id !== saveId));
  }, [authoritativeGetCharacterById, pendingSpellSaves, globalAdvantageState, handleSystemMessage, setGlobalAdvantageState, handleUpdateCharacterHP]);


  const handleAutoFailSpellSave = useCallback((saveId: string, targetId: string) => {
    const target = authoritativeGetCharacterById(targetId);
    const savePrompt = pendingSpellSaves.find(s => s.id === saveId);

    if (!target || !savePrompt) {
      handleSystemMessage("Error: Target or save prompt not found for auto-failing save.", "info");
      setPendingSpellSaves(prev => prev.filter(s => s.id !== saveId));
      return;
    }
    const failMessage = `${target.name} automatically fails the saving throw against ${savePrompt.spellName}. ${savePrompt.effectOnFailure || 'Full effect.'}`;
    multiplayerService.sendChatMessage({
        id: generateId('autofail_'),
        text: `(System) ${failMessage}`,
        type: 'info', 
    });

    const spellDefinition = DND_SPELLS_DEFINITIONS.find(s => s.id === savePrompt.spellId || s.name === savePrompt.spellName);
    const caster = authoritativeGetCharacterById(savePrompt.casterId);

    if (spellDefinition?.damage && spellDefinition.damage.length > 0 && caster) {
        const damageRollCommand = buildDamageRollCommand(spellDefinition.damage, caster.abilityScores, false);
        const damageRollResult = rollDice(`/roll ${damageRollCommand} for ${spellDefinition.name} damage to ${target.name}`);

        if (damageRollResult) {
            let damageMessage = `(System) ${spellDefinition.name} damage on ${target.name} (auto-failed save): ${damageRollResult.verbose}`;
            multiplayerService.sendChatMessage({
                id: generateId('dmg_roll_autofail_'),
                text: damageMessage,
                type: 'roll',
            });
            // Apply full damage to target character
            const currentTargetHp = target.currentHp; 
            handleUpdateCharacterHP(target.id, currentTargetHp - damageRollResult.total);
        }
    }

    setPendingSpellSaves(prev => prev.filter(s => s.id !== saveId));
  }, [authoritativeGetCharacterById, pendingSpellSaves, handleSystemMessage, handleUpdateCharacterHP]);


  const handleInitiateSpellTargeting = useCallback((casterId: string, spell: ActionDetail) => {
    const caster = authoritativeGetCharacterById(casterId); 
    if (!caster || !spell) {
      handleSystemMessage("Error initiating spell: caster or spell not found.", "info");
      return;
    }
    const casterToken = tokens.find(t => t.characterId === casterId);
    if (!casterToken) {
      handleSystemMessage(`${caster.name} must have a token on the map to cast a targeted spell.`, "info");
      return;
    }
    if (combatState === 'active' && casterId !== currentTurnCharacterId && !currentUser.isDM) {
      handleSystemMessage("Cannot cast spell: Not your turn.", "info");
      return;
    }
    if (attackTargetingState.isActive) {
        setAttackTargetingState({ isActive: false, attackerId: null, actionId: null, actionDetails: null });
    }

    if (spell.name.toLowerCase() === "magic missile") {
        setSpellTargetingState({ 
            isActive: true, 
            casterId, 
            spell, 
            assignedDarts: new Map(), 
            dartsToAssign: 3 
        });
        handleSystemMessage(`${caster.name} begins casting Magic Missile. Select targets (3 darts total).`, "info");
    } else {
        setSpellTargetingState({ isActive: true, casterId, spell, assignedDarts: undefined, dartsToAssign: undefined });
        const targetPrompt = spell.areaOfEffect ? "Select target point/direction on the map." : "Select a target on the map.";
        handleSystemMessage(`${caster.name} begins casting ${spell.name}. ${targetPrompt}`, "info");
    }
  }, [authoritativeGetCharacterById, tokens, combatState, currentTurnCharacterId, currentUser.isDM, handleSystemMessage, attackTargetingState.isActive, setAttackTargetingState, setSpellTargetingState]);

  const handleCancelSpellTargeting = useCallback(() => {
    if (spellTargetingState.isActive) {
      const caster = spellTargetingState.casterId ? authoritativeGetCharacterById(spellTargetingState.casterId) : null;
      const spellName = spellTargetingState.spell?.name || "spell";
      if (spellTargetingState.spell?.name.toLowerCase() === "magic missile" && (spellTargetingState.assignedDarts?.size || 0) > 0) {
        handleSystemMessage(`${caster?.name || 'Caster'} cancelled assigning darts for ${spellName}.`, "info");
      } else {
        handleSystemMessage(`${caster?.name || 'Caster'} cancelled casting ${spellName}.`, "info");
      }
      setSpellTargetingState({ isActive: false, casterId: null, spell: null, assignedDarts: undefined, dartsToAssign: undefined });
    }
  }, [spellTargetingState, authoritativeGetCharacterById, handleSystemMessage, setSpellTargetingState]);

  const handleResolveSpellTarget = useCallback((targetIdOrPoint: string | Point) => {
    if (!spellTargetingState.isActive || !spellTargetingState.casterId || !spellTargetingState.spell) {
      handleCancelSpellTargeting();
      return;
    }
    const caster = authoritativeGetCharacterById(spellTargetingState.casterId);
    const spell = spellTargetingState.spell;
     if (!caster || !spell) {
      handleSystemMessage("Error resolving spell: Caster or spell data missing.", "info");
      handleCancelSpellTargeting();
      return;
    }
    const casterMapToken = tokens.find(t => t.characterId === caster.id);
    if (!casterMapToken) {
      handleSystemMessage(`${caster.name} is not on the map, cannot cast spell.`, "info");
      handleCancelSpellTargeting();
      return;
    }

    // Logic for Single Target Spells (targetIdOrPoint is string)
    if (typeof targetIdOrPoint === 'string') {
      const targetTokenId = targetIdOrPoint;
      const targetToken = tokens.find(t => t.id === targetTokenId);
      if (!targetToken || !targetToken.characterId) {
        handleSystemMessage("Invalid target selected for spell (no token or charId on token).", "info");
        if (spell.name.toLowerCase() !== "magic missile") { 
          handleCancelSpellTargeting();
        }
        return;
      }
      const targetCharacter = authoritativeGetCharacterById(targetToken.characterId);
      if (!targetCharacter) {
        handleSystemMessage("Target character data missing.", "info");
        handleCancelSpellTargeting();
        return;
      }

      const distance = Math.sqrt(Math.pow(targetToken.position.x - casterMapToken.position.x, 2) + Math.pow(targetToken.position.y - casterMapToken.position.y, 2));
      const spellRangeInPixelsApp = parseRangeToPixels(spell.range, GRID_CELL_SIZE);
      if (spellRangeInPixelsApp !== null && distance > spellRangeInPixelsApp) {
        handleSystemMessage(`${targetCharacter.name} is out of range for ${spell.name} (Range: ${spell.range}, Target at ~${(distance / GRID_CELL_SIZE * 5).toFixed(1)}ft).`, "info");
        if (spell.name.toLowerCase() !== "magic missile") {
          handleCancelSpellTargeting();
        }
        return;
      }

      if (spell.name.toLowerCase() === "magic missile") {
        const currentAssignedDarts = spellTargetingState.assignedDarts || new Map<string, number>();
        let currentDartsToAssign = spellTargetingState.dartsToAssign !== undefined ? spellTargetingState.dartsToAssign : 3;
        if (currentDartsToAssign <= 0) {
          handleSystemMessage("All Magic Missile darts have been assigned.", "info"); return;
        }
        const newDartsForThisTarget = (currentAssignedDarts.get(targetToken.id) || 0) + 1;
        const newAssignedDartsMap = new Map(currentAssignedDarts).set(targetToken.id, newDartsForThisTarget);
        const newDartsToAssign = currentDartsToAssign - 1;
        multiplayerService.sendSpellCast({ casterId: caster.id, spellName: spell.name, spellId: spell.id, targetId: targetCharacter.id });
        if (newDartsToAssign > 0) {
          setSpellTargetingState({ ...spellTargetingState, assignedDarts: newAssignedDartsMap, dartsToAssign: newDartsToAssign });
          handleSystemMessage(`${caster.name} targets ${targetCharacter.name} with a magic missile. ${newDartsToAssign} dart(s) remaining.`, "info");
        } else {
          handleSystemMessage(`${caster.name} unleashes Magic Missile!`, "info");
          newAssignedDartsMap.forEach((numDarts, tId) => {
            const finalTargetToken = tokens.find(tk => tk.id === tId);
            const finalTargetChar = finalTargetToken?.characterId ? authoritativeGetCharacterById(finalTargetToken.characterId) : null;
            if (finalTargetChar && spell.damage) {
              handleSystemMessage(`${caster.name}'s Magic Missile strikes ${finalTargetChar.name} with ${numDarts} dart(s)! It hits automatically!`, 'info');
              // For Magic Missile, damage is per dart.
              const damagePerDart = spell.damage[0].dice; // e.g., "1d4+1"
              const totalDamageExpression = Array(numDarts).fill(damagePerDart).join('+');
              handleSendMessage(`/roll ${totalDamageExpression} for Magic Missile damage to ${finalTargetChar.name}`, 'roll');
            }
          });
          if (spell.spellLevel && spell.spellLevel.toLowerCase() !== "cantrip") {
            const levelKey = spell.spellLevel.match(/\d+/)?.[0] || spell.spellLevel.toLowerCase();
            handleUpdateCharacterSpellSlots(caster.id, levelKey, -1);
          }
          setSpellTargetingState({ isActive: false, casterId: null, spell: null, assignedDarts: undefined, dartsToAssign: undefined });
        }
        return;
      }

      if (caster.id === targetCharacter.id && spell.target?.toLowerCase().includes("other creature")) {
        handleSystemMessage(`Cannot target self with ${spell.name}. Spell requires targeting another creature.`, "info");
        handleCancelSpellTargeting(); return;
      }
      multiplayerService.sendSpellCast({ casterId: caster.id, spellName: spell.name, spellId: spell.id, targetId: targetCharacter.id });
      let castMessage = `${caster.name} casts ${spell.name} at ${targetCharacter.name}`;
      if (spell.isAttack && spell.attackSettings) {
        const targetAC = getEffectiveAC(targetCharacter);
        const spellAttackBonusValue = caster.spellAttackBonus || (calculateProficiencyBonus(caster.level) + getAbilityModifier(caster.abilityScores[caster.spellcastingAbility || 'intelligence']));
        const rollCmd = `/roll 1d20${spellAttackBonusValue >= 0 ? '+' : ''}${spellAttackBonusValue} vs AC ${targetAC} for ${spell.name} spell attack on ${targetCharacter.name}`;
        handleSendMessage(rollCmd, 'roll');
        // Damage for attack spells typically rolled after hit confirmation by DM or game logic
      } else if (spell.savingThrow) {
        const saveDC = spell.savingThrow.dcOverride || caster.spellSaveDC || (8 + calculateProficiencyBonus(caster.level) + getAbilityModifier(caster.abilityScores[caster.spellcastingAbility || 'intelligence']));
        handleAddPendingSpellSave(caster, spell, targetCharacter, spell.savingThrow.stat, saveDC, spell.savingThrow.effectOnSave, spell.savingThrow.effectOnFailure);
        // Damage for save spells will be handled by handleRollSpellSave/handleAutoFailSpellSave
      } else { // No attack, no save - direct effect or damage
        handleSystemMessage(castMessage, 'info');
        // If it's a direct damage spell (no attack, no save)
        if (spell.damage && spell.damage.length > 0) {
          const damageExpression = buildDamageRollCommand(spell.damage, caster.abilityScores, false);
          if (damageExpression && damageExpression !== "0") {
            const fullRollCommand = `/roll ${damageExpression} for ${spell.name} effect on ${targetCharacter.name}`;
            handleSendMessage(fullRollCommand, 'roll');
          }
        }
      }
    } else { // Area of Effect Spells (targetIdOrPoint is Point)
      const targetPoint = targetIdOrPoint; 
      let initialAffectedCharacters: Character[] = [];
      if (spell.areaOfEffect?.type === 'cone') {
        const coneLengthPixels = parseRangeToPixels(String(spell.areaOfEffect.size), GRID_CELL_SIZE);
        if (coneLengthPixels === null) { handleCancelSpellTargeting(); return; }
        const affectedCellCoords = getCellsInCone(casterMapToken.position, targetPoint, coneLengthPixels, 60, GRID_CELL_SIZE);
        initialAffectedCharacters.push(...getCharactersInCone(tokens, authoritativeGetCharacterById, affectedCellCoords, GRID_CELL_SIZE));
      } else if (spell.areaOfEffect?.type === 'sphere' || spell.areaOfEffect?.type === 'cube' || spell.areaOfEffect?.type === 'cylinder') {
        const radiusPixels = parseRangeToPixels(String(spell.areaOfEffect.size), GRID_CELL_SIZE);
        if (radiusPixels === null) { handleCancelSpellTargeting(); return; }
        tokens.forEach(token => {
          if (!token.characterId) return;
          const char = authoritativeGetCharacterById(token.characterId);
          if (!char) return;
          const distanceSq = (token.position.x - targetPoint.x)**2 + (token.position.y - targetPoint.y)**2;
          if (distanceSq <= radiusPixels * radiusPixels) {
            initialAffectedCharacters.push(char);
          }
        });
      } else {
        handleSystemMessage(`Spell ${spell.name} has an unhandled AoE type or is not single target.`, "info");
        handleCancelSpellTargeting(); return;
      }
      
      let finalAffectedCharacters = [...initialAffectedCharacters];
      // Exclude the caster from AoE if the spell originates from "Self"
      if (spell.range?.toLowerCase().startsWith('self') && spell.areaOfEffect) {
        finalAffectedCharacters = finalAffectedCharacters.filter(char => char.id !== caster.id);
      }


      let castMessage = `${caster.name} casts ${spell.name}!`;
      if (finalAffectedCharacters.length > 0) {
        castMessage += ` Affected: ${finalAffectedCharacters.map(c => c.name).join(', ')}.`;
        handleSystemMessage(castMessage, 'info');
        if (spell.savingThrow) {
            const saveDC = spell.savingThrow.dcOverride || caster.spellSaveDC || (8 + calculateProficiencyBonus(caster.level) + getAbilityModifier(caster.abilityScores[caster.spellcastingAbility || 'intelligence']));
            finalAffectedCharacters.forEach(affectedChar => {
                handleAddPendingSpellSave(caster, spell, affectedChar, spell.savingThrow!.stat, saveDC, spell.savingThrow!.effectOnSave, spell.savingThrow!.effectOnFailure);
            });
            // Damage for AoE save spells will be handled by handleRollSpellSave/handleAutoFailSpellSave
        } else if (spell.damage && spell.damage.length > 0) { // AoE, no save, direct damage
            const damageRollCommand = buildDamageRollCommand(spell.damage, caster.abilityScores, false);
            handleSystemMessage(`/roll ${damageRollCommand} for ${spell.name} damage (affecting ${finalAffectedCharacters.map(c=>c.name).join(', ')})`, 'roll');
        }
      } else {
        castMessage += " No one was in the area of effect.";
        handleSystemMessage(castMessage, 'info');
      }
      multiplayerService.sendSpellCast({ casterId: caster.id, spellName: spell.name, spellId: spell.id, targetId: "AREA_EFFECT" }); 
    }

    if (spell.spellLevel && spell.spellLevel.toLowerCase() !== "cantrip") {
      const levelKey = spell.spellLevel.match(/\d+/)?.[0] || spell.spellLevel.toLowerCase();
      handleUpdateCharacterSpellSlots(caster.id, levelKey, -1);
    }
    setSpellTargetingState({ isActive: false, casterId: null, spell: null, assignedDarts: undefined, dartsToAssign: undefined });
  }, [spellTargetingState, authoritativeGetCharacterById, tokens, handleSystemMessage, handleSendMessage, handleUpdateCharacterSpellSlots, setSpellTargetingState, handleCancelSpellTargeting, GRID_CELL_SIZE, handleAddPendingSpellSave]);

  const handleCastReactionAbility = useCallback((casterId: string, ability: ActionDetail) => {
    const caster = authoritativeGetCharacterById(casterId);
    if (!caster || ability.actionCategory !== 'reaction') {
      handleSystemMessage("Cannot cast: Not a valid reaction or caster not found.", "info");
      return;
    }

    if (ability.name.toLowerCase() === "shield (spell)") {
      const spellLevelKey = ability.spellLevel?.match(/\d+/)?.[0] || ability.spellLevel?.toLowerCase();
      if (spellLevelKey && spellLevelKey !== "cantrip") {
        const currentSlots = caster.spellSlots?.[spellLevelKey]?.current || 0;
        if (currentSlots <= 0) {
          handleSystemMessage(`${caster.name} has no ${ability.spellLevel} slots to cast Shield.`, "info");
          return;
        }
        handleUpdateCharacterSpellSlots(caster.id, spellLevelKey, -1);
      }

      const shieldEffect: TemporaryEffect = {
        id: generateId('effect_shield_'),
        sourceName: "Shield Spell",
        type: 'ac_bonus',
        value: 5,
        casterId: caster.id,
        targetCharacterId: caster.id,
        expiresAtStartOfCastersNextTurn: true,
        roundApplied: roundCounter,
      };
      const updatedCaster = {
        ...caster,
        temporaryEffects: [...(caster.temporaryEffects || []), shieldEffect]
      };
      setAuthoritativeCharacters(prev => prev.map(c => c.id === caster.id ? updatedCaster : c));
      multiplayerService.sendCharacterUpdate(updatedCaster);
      handleSystemMessage(`${caster.name} casts Shield! Their AC is temporarily increased by 5.`, "info");
    } else {
      handleSystemMessage(`${caster.name} uses reaction: ${ability.name}.`, "info");
    }
  }, [authoritativeGetCharacterById, roundCounter, handleSystemMessage, handleUpdateCharacterSpellSlots, setAuthoritativeCharacters]);


  const contextMenuActions = useMemo(() => {
    const actions: ContextMenuAction[] = [];
    if (currentUser.isDM) {
      actions.push({ label: 'Add Character (Player)', action: authoritativeOpenCharacterCreationModal });
      actions.push({ label: 'Add NPC', action: () => authoritativeHandleCreateCharacterSubmit({} as CharacterCreationData, true) });
    }

    if (mapContextMenu.targetTokenId) {
      const token = tokens.find(t => t.id === mapContextMenu.targetTokenId);
      const character = token?.characterId ? authoritativeGetCharacterById(token.characterId) : undefined;

      if (character) {
        actions.push({ label: `Open ${character.name}'s Sheet`, action: () => { authoritativeHandleOpenSheetOrSetActiveChar(character.id); closeMapContextMenu(); }});
        if (currentUser.isDM && !character.id.startsWith('view_template_')) {
          actions.push({ label: `Assign ${character.name}...`, action: () => { authoritativeHandleOpenAssignModal(character.id); closeMapContextMenu(); }});
          actions.push({ label: `Delete ${character.name}`, action: () => { authoritativeHandleDeleteCharacter(character.id); closeMapContextMenu(); }});
        }
        if (currentUser.isDM || (character && canMoveTokenOwnedBy(character.ownerPlayerId, character.isNPC))) {
            actions.push({ label: 'Remove Token from Map', action: () => { handleRemoveTokenFromMap(mapContextMenu.targetTokenId!); closeMapContextMenu(); }});
        }
      } else if (currentUser.isDM) {
         actions.push({ label: 'Remove Generic Token', action: () => { handleRemoveTokenFromMap(mapContextMenu.targetTokenId!); closeMapContextMenu(); }});
      }
    }
    actions.push({label: "Close Menu", action: closeMapContextMenu });
    return actions.filter(action => action.isVisible ? action.isVisible() : true);
  }, [
    mapContextMenu, tokens, currentUser, authoritativeGetCharacterById, authoritativeHandleOpenSheetOrSetActiveChar,
    authoritativeHandleDeleteCharacter, authoritativeHandleOpenAssignModal, handleRemoveTokenFromMap, canMoveTokenOwnedBy,
    authoritativeOpenCharacterCreationModal, authoritativeHandleCreateCharacterSubmit, closeMapContextMenu
  ]);

  const sidePanelContextMenuActions = useMemo(() => {
      if (!sidePanelContextMenu.itemType || !sidePanelContextMenu.itemId || !sidePanelContextMenu.itemName) return [{ label: "Close Menu", action: closeSidePanelContextMenu }];

      const actions: ContextMenuAction[] = [];
      const { itemType, itemId, itemName, itemSlot, additionalData } = sidePanelContextMenu;

      if (currentUser.isDM) {
        if (itemType === 'character') {
            const char = authoritativeGetCharacterById(itemId);
            if (char) {
              actions.push({ label: `Open ${itemName}'s Sheet`, action: () => { authoritativeHandleOpenSheetOrSetActiveChar(itemId); closeSidePanelContextMenu(); }});
              actions.push({ label: `Place ${itemName} on Map`, action: () => {
                  if (gridCanvasRef.current) authoritativeHandleAddTokenForCharacter(itemId, gridCanvasRef.current.getViewportCenter());
                  closeSidePanelContextMenu();
              }});
              if (!char.id.startsWith('view_template_')) {
                  actions.push({ label: `Assign ${itemName}...`, action: () => {authoritativeHandleOpenAssignModal(itemId); closeSidePanelContextMenu();}});
                  actions.push({ label: `Delete ${itemName}`, action: () => {authoritativeHandleDeleteCharacter(itemId); closeSidePanelContextMenu();}});
              }
              if (char.isNPC) {
                  actions.push({ label: char.isCampaignActive !== false ? "Make Inactive" : "Make Active", action: () => {handleToggleNpcCampaignActive(itemId); closeSidePanelContextMenu();}});
              }
              actions.push({ label: `Add ${itemName} to Group...`, action: () => { openAddToGroupModal({id: itemId, name: itemName, type: 'character'}); closeSidePanelContextMenu(); }});
            }
        } else if (itemType === 'creatureTemplate') {
            actions.push({ label: `View ${itemName} Details`, action: () => {authoritativeHandleOpenTemplateForViewing(itemId); closeSidePanelContextMenu();}});
            actions.push({ label: `Spawn ${itemName} on Map`, action: () => {
              if (gridCanvasRef.current) authoritativeHandleSpawnNpcFromTemplate(itemId, gridCanvasRef.current.getViewportCenter());
              closeSidePanelContextMenu();
            }});
             actions.push({ label: `Spawn ${itemName} & Add to Group...`, action: () => { openAddToGroupModal({id: itemId, name: itemName, type: 'creatureTemplate'}); closeSidePanelContextMenu(); }});
        }
      }

      if (itemType === 'inventoryItem' && authoritativeActivePlayerCharacter) {
          const item = getItemById(itemId);
          if(item){
            const compatibleSlots = additionalData as EquipmentSlot[] || [];
            if (compatibleSlots.length > 0) {
                 actions.push({
                    label: `Equip ${itemName} to...`,
                    action: () => {},
                    subActions: compatibleSlots.map(slot => ({
                        label: slot.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                        action: () => {
                            handleEquipItem({
                                characterId: authoritativeActivePlayerCharacter!.id, itemId, slot,
                                currentCharacters: authoritativeCharacters, setCharactersCallback: setAuthoritativeCharacters,
                                currentUser, combatState, currentTurnCharacterId, handleSystemMessage
                            });
                            closeSidePanelContextMenu();
                        }
                    }))
                });
            }
            if (item.requiresAttunement) {
                if (authoritativeActivePlayerCharacter.attunedItemIds.includes(item.id)) {
                    actions.push({ label: `End Attunement to ${itemName}`, action: () => { handleEndAttunement(authoritativeActivePlayerCharacter!.id, item.id, authoritativeCharacters, handleSystemMessage); closeSidePanelContextMenu(); }});
                } else if (authoritativeActivePlayerCharacter.attunementSlots.current < authoritativeActivePlayerCharacter.attunementSlots.max) {
                    actions.push({ label: `Attune to ${itemName}`, action: () => { handleAttuneItem(authoritativeActivePlayerCharacter!.id, item.id, authoritativeCharacters, handleSystemMessage); closeSidePanelContextMenu(); }});
                } else {
                     actions.push({ label: `Attune to ${itemName}`, disabled: true, action: () => {} });
                }
            }
          }
      } else if (itemType === 'equippedItem' && authoritativeActivePlayerCharacter && itemSlot) {
           actions.push({ label: `Unequip ${itemName}`, action: () => {
               handleUnequipItem({
                   characterId: authoritativeActivePlayerCharacter!.id, slot: itemSlot,
                   currentCharacters: authoritativeCharacters, setCharactersCallback: setAuthoritativeCharacters,
                   currentUser, combatState, currentTurnCharacterId, handleSystemMessage
                });
               closeSidePanelContextMenu();
            }});
      }

      actions.push({ label: "Close Menu", action: closeSidePanelContextMenu });
      return actions.filter(action => action.isVisible ? action.isVisible() : true);
  }, [
    sidePanelContextMenu, currentUser, authoritativeCharacters, authoritativeActivePlayerCharacter, authoritativeCreatureTemplates,
    getItemById, authoritativeHandleOpenSheetOrSetActiveChar, authoritativeHandleAddTokenForCharacter,
    authoritativeHandleOpenAssignModal, authoritativeHandleDeleteCharacter, handleToggleNpcCampaignActive,
    authoritativeHandleOpenTemplateForViewing, authoritativeHandleSpawnNpcFromTemplate,
    openAddToGroupModal, handleEquipItem, handleUnequipItem, handleAttuneItem, handleEndAttunement,
    closeSidePanelContextMenu, combatState, currentTurnCharacterId, handleSystemMessage, setAuthoritativeCharacters
  ]);

  const sidePanelProps = {
    currentUser, activeTab: activeSidePanelTab, onTabChange: setActiveSidePanelTab,
    chatMessages, onSendMessage: handleSendMessage,
    characters: authoritativeCharacters, getCharacterById: authoritativeGetCharacterById, onOpenCharacterCreation: authoritativeOpenCharacterCreationModal,
    onOpenSheet: authoritativeHandleOpenSheetOrSetActiveChar, onDeleteCharacter: authoritativeHandleDeleteCharacter,
    onOpenAssignModal: authoritativeHandleOpenAssignModal, onAssignCharacter: authoritativeHandleConfirmAssignment,
    onCreateNPC: (data: CharacterCreationData) => authoritativeHandleCreateCharacterSubmit(data, true),
    onToggleNpcCampaignActive: handleToggleNpcCampaignActive,
    locations, onCreateLocation: handleCreateLocation, onToggleLocationExpand: handleToggleLocationExpand,
    onToggleLocationActive: handleToggleLocationActive, onCreateArea: handleCreateArea,
    onToggleAreaExpanded: handleToggleAreaExpanded, onSetCharacterLocationAndArea: handleSetCharacterLocationAndArea,
    campaignNotes, onUpdateCampaignNotes: setCampaignNotes,
    creatureTemplates: authoritativeCreatureTemplates, onOpenTemplateForViewing: authoritativeHandleOpenTemplateForViewing,
    combatState, initiativeOrder, currentTurnCharacterId, roundCounter, onEndTurn: handleEndTurn,
    onUpdateInitiativeScore: handleUpdateInitiativeScore,
    heldActions, onSetHeldAction: handleSetHeldAction, onUseHeldAction: handleUseHeldAction,
    onInitiateAttack: handleInitiateAttack,
    onInitiateSpellTargeting: handleInitiateSpellTargeting,
    groups, onOpenCreateGroupModal: openCreateGroupModal, onCreateGroupWithMembers: handleCreateGroupWithMembers,
    onDeleteGroup: handleDeleteGroup, onAddCharacterToGroup: handleAddCharacterToGroup,
    onRemoveCharacterFromGroup: handleRemoveCharacterFromGroup, onSpawnMonsterAndAddToGroup: handleSpawnMonsterAndAddToGroup,
    onAssignGroupToLocationArea: handleAssignGroupToLocationArea,
    onShowSidePanelContextMenu: handleShowSidePanelContextMenu,
    activePlayerCharacter: authoritativeActivePlayerCharacter,
    onSetActivePlayerCharacterId: setAuthoritativeActivePlayerCharacterId,
    onUpdateSpellSlot: (level: string, change: number) => authoritativeActivePlayerCharacter && handleUpdateCharacterSpellSlots(authoritativeActivePlayerCharacter.id, level, change),
    onUpdateHitDice: handleUpdateHitDice,
    onUpdateDeathSaves: handleUpdateDeathSaves,
    areTooltipsEnabled, onToggleTooltips: () => setAreTooltipsEnabled(prev => !prev),
    items, getItemById, onEquipItem: (charId: string, itemId: string, slot: EquipmentSlot) => handleEquipItem({
      characterId: charId, itemId, slot, currentCharacters: authoritativeCharacters, setCharactersCallback: setAuthoritativeCharacters,
      currentUser, combatState, currentTurnCharacterId, handleSystemMessage
    }),
    onUnequipItem: (charId: string, slot: EquipmentSlot) => handleUnequipItem({
      characterId: charId, slot, currentCharacters: authoritativeCharacters, setCharactersCallback: setAuthoritativeCharacters,
      currentUser, combatState, currentTurnCharacterId, handleSystemMessage
    }),
    onAttuneItem: (charId: string, itemId: string) => handleAttuneItem(charId, itemId, authoritativeCharacters, handleSystemMessage),
    onEndAttunement: (charId: string, itemId: string) => handleEndAttunement(charId, itemId, authoritativeCharacters, handleSystemMessage),
    onUpdateCurrency: (charId: string, currencyType: 'gp' | 'sp' | 'cp', newAmount: number) => handleUpdateCurrency(charId, currencyType, newAmount, authoritativeCharacters),
    onToggleDMView: toggleUserDMStatus,
    setGlobalAdvantageState: setGlobalAdvantageState,
    onCastReactionAbility: handleCastReactionAbility, 
  };


  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex-grow relative">
        <GridCanvas
          ref={gridCanvasRef}
          tokens={tokens}
          selectedTokenIds={selectedTokenIds}
          onTokenSelect={handleTokenSelect}
          onTokenDragStart={handleTokenDragStart}
          onTokenMove={handleTokenMove}
          onTokenDragEnd={handleTokenDragEnd}
          onShowContextMenu={handleShowMapContextMenu}
          onMarqueeSelect={handleMarqueeSelect}
          currentUser={currentUser}
          getCharacterOwner={(tokenId) => authoritativeGetCharacterById(tokens.find(t => t.id === tokenId)?.characterId || '')?.ownerPlayerId || null}
          getCharacterIsNPC={(tokenId) => authoritativeGetCharacterById(tokens.find(t => t.id === tokenId)?.characterId || '')?.isNPC || false}
          onCharacterDrop={(charId, pos) => authoritativeHandleAddTokenForCharacter(charId, pos)}
          onCreatureTemplateDrop={(templateId, pos) => authoritativeHandleSpawnNpcFromTemplate(templateId, pos)}
          attackTargetingState={attackTargetingState}
          onResolveAttack={handleResolveAttack}
          onCancelAttackMode={handleCancelAttackMode}
          spellTargetingState={spellTargetingState}
          onResolveSpellTarget={handleResolveSpellTarget}
          onCancelSpellTargeting={handleCancelSpellTargeting}
          getCharacterById={authoritativeGetCharacterById} 
        />
        {mapContextMenu.visible && (
          <ContextMenu
            x={mapContextMenu.screenPosition.x}
            y={mapContextMenu.screenPosition.y}
            actions={contextMenuActions}
            onClose={closeMapContextMenu}
          />
        )}
        {sidePanelContextMenu.visible && (
           <ContextMenu
            x={sidePanelContextMenu.screenPosition.x}
            y={sidePanelContextMenu.screenPosition.y}
            actions={sidePanelContextMenuActions}
            onClose={closeSidePanelContextMenu}
          />
        )}
         <SpellSavePromptWidget 
            pendingSaves={pendingSpellSaves}
            onRollSave={handleRollSpellSave}
            onAutoFail={handleAutoFailSpellSave}
            currentUser={currentUser}
            getCharacterById={authoritativeGetCharacterById}
        />
        <div className="absolute bottom-20 left-4 z-30">
           <AdvDisToggle
              currentSelection={globalAdvantageState}
              onSelectionChange={setGlobalAdvantageState}
              isPlayerDM={currentUser.isDM}
           />
        </div>
         <RecentD20RollWidget
            rollInfo={lastD20RollInfo}
            isCollapsed={isRollWidgetCollapsed}
            onToggleCollapse={() => setIsRollWidgetCollapsed(!isRollWidgetCollapsed)}
        />
        {/* Combat Control Buttons Overlay */}
        <div className="absolute top-4 right-4 z-30 space-x-2">
          {currentUser.isDM && combatState === 'none' && (
            <button 
              onClick={handleEnterPreCombatMode} 
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-md transition-colors"
              title="Prepare for combat: Roll initiative for characters on map and enter pre-combat setup."
            >
              Roll Initiative!
            </button>
          )}
          {currentUser.isDM && combatState === 'pre-combat' && (
            <button 
              onClick={handleStartActiveCombat} 
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded shadow-md transition-colors"
              title="Start active combat with the current initiative order."
            >
              Start Combat
            </button>
          )}
          {currentUser.isDM && combatState === 'active' && (
            <button 
              onClick={handleEndCombat} 
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-md transition-colors"
              title="End the current combat and reset initiative."
            >
              End Combat
            </button>
          )}
        </div>
      </div>

      <SidePanel {...sidePanelProps} />

      {isAuthoritativeSheetModalOpen && authoritativeSelectedCharacterForSheet && (
        <CharacterSheetModal
          character={authoritativeSelectedCharacterForSheet}
          isOpen={isAuthoritativeSheetModalOpen}
          onClose={authoritativeCloseSheetModal}
          onSave={authoritativeHandleSaveSheet}
          isEditable={isAuthoritativeSheetEditable}
          onSendMessage={handleSendMessage}
          setGlobalAdvantageState={setGlobalAdvantageState}
          activePlayerCharacterId={authoritativeActivePlayerCharacterId}
        />
      )}
      {isAuthoritativeCreationModalOpen && (
        <CharacterCreationModal
          isOpen={isAuthoritativeCreationModalOpen}
          onClose={authoritativeCloseCharacterCreationModal}
          onCreate={authoritativeHandleCreateCharacterSubmit}
        />
      )}
      {isAuthoritativeAssignModalOpen && authoritativeCharacterForAssignment && (
        <AssignCharacterModal
          isOpen={isAuthoritativeAssignModalOpen}
          characterToAssign={authoritativeCharacterForAssignment}
          onClose={authoritativeCloseAssignModal}
          onConfirmAssignment={authoritativeHandleConfirmAssignment}
        />
      )}
       {isCreateGroupModalOpen && (
        <CreateGroupModal
          isOpen={isCreateGroupModalOpen}
          onClose={closeCreateGroupModal}
          onCreateGroupWithMembers={handleCreateGroupWithMembers}
          characters={authoritativeCharacters}
          creatureTemplates={authoritativeCreatureTemplates}
        />
      )}
      {isAddToGroupModalOpen && itemForAddToGroup && (
        <AddToGroupModal
          isOpen={isAddToGroupModalOpen}
          onClose={closeAddToGroupModal}
          item={itemForAddToGroup}
          groups={groups}
          onConfirmAddToGroup={handleConfirmAddToGroup}
        />
      )}
    </div>
  );
};
