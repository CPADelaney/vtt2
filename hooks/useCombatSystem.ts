
import { useState, useCallback } from 'react';
import { Character, User, ActionDetail, HeldAction, AttackTargetingState, SpellTargetingState, Token, SidePanelTabName } from '../types';
import { DiceRollResult, DiceTerm } from '../services/diceRoller'; 
import { multiplayerService } from '../MultiplayerService';
import { getAbilityModifier, calculateProficiencyBonus, addCharacterToInitiative, buildDamageRollCommand, getEffectiveAC } from '../utils';
import { DEFAULT_SIDE_PANEL_TAB } from '../constants';
import { rollDice } from '../services/diceRoller';


interface UseCombatSystemProps {
  currentUser: User;
  characters: Character[]; 
  getCharacterById: (characterId: string) => Character | undefined;
  tokens: Token[]; 
  setActiveSidePanelTab: React.Dispatch<React.SetStateAction<SidePanelTabName>>;
  handleSystemMessage: (message: string, type?: 'message' | 'roll' | 'info') => void;
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  spellTargetingState: SpellTargetingState; // Added
  setSpellTargetingState: React.Dispatch<React.SetStateAction<SpellTargetingState>>; // Added
}

export const useCombatSystem = (props: UseCombatSystemProps) => {
  const { 
    currentUser, characters, getCharacterById, tokens, 
    setActiveSidePanelTab, handleSystemMessage, setCharacters,
    spellTargetingState, setSpellTargetingState // Destructure new props
  } = props;

  const [combatState, setCombatState] = useState<'none' | 'pre-combat' | 'active'>('none');
  const [initiativeOrder, setInitiativeOrder] = useState<string[]>([]);
  const [currentTurnCharacterId, setCurrentTurnCharacterId] = useState<string | null>(null);
  const [roundCounter, setRoundCounter] = useState<number>(0);
  const [heldActions, setHeldActions] = useState<Record<string, HeldAction | null>>({});
  const [attackTargetingState, setAttackTargetingState] = useState<AttackTargetingState>({
    isActive: false, attackerId: null, actionId: null, actionDetails: null,
  });

  const handleEnterPreCombatMode = useCallback(() => {
    if (!currentUser.isDM) return;

    const initiativeRolls: { id: string, initiative: number, dex: number }[] = [];

    const updatedCharsState = characters.map(char => {
      let rolledInitiative: number | undefined = undefined;
      if (tokens.some(t => t.characterId === char.id)) { // Only roll for characters on map
        rolledInitiative = Math.floor(Math.random() * 20) + 1 + getAbilityModifier(char.abilityScores.dexterity);
        initiativeRolls.push({ id: char.id, initiative: rolledInitiative, dex: char.abilityScores.dexterity });
      }
      return { ...char, initiative: rolledInitiative, currentMovement: char.speed, proficiencyBonus: calculateProficiencyBonus(char.level) };
    });

    initiativeRolls.sort((a, b) => {
      if (b.initiative !== a.initiative) return b.initiative - a.initiative;
      return b.dex - a.dex;
    });

    const newInitiativeOrder = initiativeRolls.map(item => item.id);
    
    multiplayerService.sendCombatStateUpdate({
        combatState: 'pre-combat', initiativeOrder: newInitiativeOrder,
        currentTurnCharacterId: null, roundCounter: 0,
        updatedCharacters: updatedCharsState.filter(c => newInitiativeOrder.includes(c.id)) 
    });
    setActiveSidePanelTab('combat');
    handleSystemMessage(newInitiativeOrder.length > 0
      ? "Pre-Combat: Initiative rolled for characters on map. Position tokens, then Start Combat."
      : "Pre-Combat: Mode started. Add characters to the map to include them in initiative.");
  }, [currentUser.isDM, characters, tokens, setActiveSidePanelTab, handleSystemMessage]);

  const handleStartActiveCombat = useCallback(() => {
    if (!currentUser.isDM || combatState !== 'pre-combat' || initiativeOrder.length === 0) {
        handleSystemMessage("Cannot start combat. Ensure pre-combat setup is complete and there are combatants.");
        return;
    }
    const firstCharId = initiativeOrder[0];
    const firstChar = getCharacterById(firstCharId);
    multiplayerService.sendCombatStateUpdate({
        combatState: 'active', initiativeOrder: initiativeOrder,
        currentTurnCharacterId: firstCharId, roundCounter: 1,
    });
    handleSystemMessage(`Combat Started! Round 1. ${firstChar?.name || 'First combatant'}'s turn.`);
  }, [currentUser.isDM, combatState, initiativeOrder, getCharacterById, handleSystemMessage]);

  const handleEndCombat = useCallback(() => {
    if (!currentUser.isDM) return;
    const charsWithResetInitiative = characters.map(c => ({ ...c, initiative: undefined, currentMovement: c.speed, temporaryEffects: [] }));
    multiplayerService.sendCombatStateUpdate({
        combatState: 'none', initiativeOrder: [], currentTurnCharacterId: null, roundCounter: 0,
        updatedCharacters: charsWithResetInitiative
    });
    handleSystemMessage("Combat Ended.");
    setAttackTargetingState({ isActive: false, attackerId: null, actionId: null, actionDetails: null });
    setSpellTargetingState({ isActive: false, casterId: null, spell: null }); 
  }, [currentUser.isDM, characters, handleSystemMessage, setSpellTargetingState]);

  const handleEndTurn = useCallback(() => {
    if (combatState !== 'active' || !currentTurnCharacterId || initiativeOrder.length === 0) return;
    const currentActor = getCharacterById(currentTurnCharacterId);
    if (!(currentUser.isDM || (currentActor && currentActor.ownerPlayerId === currentUser.id))) {
        handleSystemMessage("Only the DM or the character's owner can advance their turn.");
        return;
    }

    const currentHeldAction = heldActions[currentTurnCharacterId];
    if (currentHeldAction) {
        handleSystemMessage(`${currentActor?.name || 'Character'}'s readied action ('${currentHeldAction.actionName}') expires as their turn ends.`);
        multiplayerService.sendHeldActionUpdate({ characterId: currentTurnCharacterId, clear: true });
    }

    const currentIndex = initiativeOrder.indexOf(currentTurnCharacterId);
    let nextIndex = (currentIndex + 1) % initiativeOrder.length;
    let nextRound = roundCounter;
    let newSystemMessage = "";

    if (nextIndex === 0) {
      nextRound += 1;
      newSystemMessage = `Round ${nextRound} begins. `;
    }
    const nextCharacterId = initiativeOrder[nextIndex];
    
    // Expire effects for the character whose turn is starting
    const characterStartingTurn = getCharacterById(nextCharacterId);
    let updatedCharactersForEffectExpiry: Character[] = [...characters];

    if (characterStartingTurn) {
        const effectsToExpireOnThisChar = (characterStartingTurn.temporaryEffects || []).filter(effect => 
            effect.expiresAtStartOfCastersNextTurn && 
            effect.casterId === nextCharacterId &&
            nextRound > effect.roundApplied 
        );

        if (effectsToExpireOnThisChar.length > 0) {
            const remainingEffects = (characterStartingTurn.temporaryEffects || []).filter(effect => 
                !effectsToExpireOnThisChar.some(expEffect => expEffect.id === effect.id)
            );
            const charWithExpiredEffects = { ...characterStartingTurn, temporaryEffects: remainingEffects };
            updatedCharactersForEffectExpiry = updatedCharactersForEffectExpiry.map(c => c.id === nextCharacterId ? charWithExpiredEffects : c);
            setCharacters(updatedCharactersForEffectExpiry); // Update local state
            multiplayerService.sendCharacterUpdate(charWithExpiredEffects); // Sync update
            effectsToExpireOnThisChar.forEach(eff => handleSystemMessage(`${characterStartingTurn.name}'s ${eff.sourceName} effect wore off.`));
        }
    }
    // Also check effects on *other* characters that might expire based on the starting character's turn
    updatedCharactersForEffectExpiry = updatedCharactersForEffectExpiry.map(char => {
        if (char.id === nextCharacterId || !char.temporaryEffects || char.temporaryEffects.length === 0) return char;
        
        const activeEffects = char.temporaryEffects.filter(effect => {
            if (effect.expiresAtStartOfCastersNextTurn && effect.casterId === nextCharacterId && nextRound > effect.roundApplied) {
                 handleSystemMessage(`${char.name}'s ${effect.sourceName} (cast by ${getCharacterById(effect.casterId)?.name}) wore off.`);
                 return false; 
            }
            return true;
        });
        if (activeEffects.length < (char.temporaryEffects || []).length) {
            const charWithUpdatedEffects = { ...char, temporaryEffects: activeEffects };
            multiplayerService.sendCharacterUpdate(charWithUpdatedEffects); // Sync update
            return charWithUpdatedEffects;
        }
        return char;
    });
    setCharacters(updatedCharactersForEffectExpiry);


    const nextCharData = getCharacterById(nextCharacterId); // Get potentially updated char data
    if (nextCharData) {
      newSystemMessage += `${nextCharData.name}'s turn.`;
      const updatedNextCharData = { ...nextCharData, currentMovement: nextCharData.speed };
      multiplayerService.sendCharacterUpdate(updatedNextCharData); 
    }
     handleSystemMessage(newSystemMessage);

    multiplayerService.sendCombatStateUpdate({
        combatState: 'active', initiativeOrder: initiativeOrder,
        currentTurnCharacterId: nextCharacterId, roundCounter: nextRound,
    });
    setAttackTargetingState({ isActive: false, attackerId: null, actionId: null, actionDetails: null });
    setSpellTargetingState({ isActive: false, casterId: null, spell: null }); 
  }, [combatState, currentTurnCharacterId, initiativeOrder, roundCounter, getCharacterById, currentUser, handleSystemMessage, heldActions, setSpellTargetingState, characters, setCharacters]);

  const handleUpdateInitiativeScore = useCallback((characterId: string, newScore: number) => {
    if (!currentUser.isDM || (combatState !== 'pre-combat' && combatState !== 'active')) return;
    const charToUpdate = characters.find(c => c.id === characterId);
    if (!charToUpdate) return;

    const updatedChar = { ...charToUpdate, initiative: newScore };
    const tempCharsForSort = characters.map(char => char.id === characterId ? updatedChar : char);
    const currentCombatantsData = initiativeOrder.map(id => tempCharsForSort.find(c => c.id === id)).filter(Boolean) as Character[];

    currentCombatantsData.sort((a, b) => {
        if (b.initiative === undefined || a.initiative === undefined) return 0;
        if (b.initiative !== a.initiative) return b.initiative - a.initiative;
        return b.abilityScores.dexterity - a.abilityScores.dexterity;
    });
    const newSortedOrder = currentCombatantsData.map(c => c.id);
    multiplayerService.sendInitiativeScoreUpdate({
        characterId, newScore, 
        updatedCharacters: characters.map(c => c.id === characterId ? updatedChar : c), 
        newInitiativeOrder: newSortedOrder
    });
  }, [currentUser.isDM, combatState, characters, initiativeOrder]);

  const handleSetHeldAction = useCallback((characterId: string, actionName: string, triggerDescription: string) => {
    if (combatState !== 'active' || characterId !== currentTurnCharacterId) {
      handleSystemMessage("Can only set held action for the current character on their turn.");
      return;
    }
    const char = getCharacterById(characterId);
    if (!char) return;
    const newHeldAction: HeldAction = { characterId, actionName, triggerDescription, roundHeld: roundCounter };
    multiplayerService.sendHeldActionUpdate(newHeldAction);
    handleSystemMessage(`${char.name} readies an action: '${actionName}', triggered by: '${triggerDescription}'.`);
    setAttackTargetingState({ isActive: false, attackerId: null, actionId: null, actionDetails: null });
    setSpellTargetingState({ isActive: false, casterId: null, spell: null }); 
  }, [combatState, currentTurnCharacterId, roundCounter, getCharacterById, handleSystemMessage, setSpellTargetingState]);

  const handleUseHeldAction = useCallback((characterId: string) => {
    const heldAction = heldActions[characterId];
    const char = getCharacterById(characterId);
    if (!heldAction || !char) return;
    handleSystemMessage(`${char.name} uses their readied action: '${heldAction.actionName}'! (Trigger: ${heldAction.triggerDescription})`);
    multiplayerService.sendHeldActionUpdate({ characterId, clear: true });
  }, [heldActions, getCharacterById, handleSystemMessage]);

  const handleInitiateAttack = useCallback((attackerId: string, action: ActionDetail) => {
    if (combatState !== 'active' || attackerId !== currentTurnCharacterId) {
      handleSystemMessage("Cannot initiate attack: Not the active character's turn or not in active combat.");
      return;
    }
    const attacker = getCharacterById(attackerId);
    if (!attacker) return;
    if (!currentUser.isDM && attacker.ownerPlayerId !== currentUser.id) {
      handleSystemMessage("You do not control this character.");
      return;
    }
    if (spellTargetingState.isActive) { 
        setSpellTargetingState({ isActive: false, casterId: null, spell: null });
    }
    setAttackTargetingState({ isActive: true, attackerId, actionId: action.id, actionDetails: action });
    handleSystemMessage(`${attacker.name} is targeting with ${action.name}. Click a target on the map.`);
  }, [combatState, currentTurnCharacterId, currentUser, getCharacterById, handleSystemMessage, spellTargetingState.isActive, setSpellTargetingState]);

  const handleCancelAttackMode = useCallback(() => {
    if (attackTargetingState.isActive) {
      const attacker = attackTargetingState.attackerId ? getCharacterById(attackTargetingState.attackerId) : null;
      handleSystemMessage(`${attacker?.name || 'Attacker'} cancelled targeting.`);
      setAttackTargetingState({ isActive: false, attackerId: null, actionId: null, actionDetails: null });
    }
  }, [attackTargetingState, getCharacterById, handleSystemMessage]);

  const handleResolveAttack = useCallback((targetTokenId: string) => {
    if (!attackTargetingState.isActive || !attackTargetingState.attackerId || !attackTargetingState.actionDetails) {
      handleCancelAttackMode(); return;
    }
    const attacker = getCharacterById(attackTargetingState.attackerId);
    const targetToken = tokens.find(t => t.id === targetTokenId);
    if (!targetToken || !targetToken.characterId) {
      handleSystemMessage("Invalid target selected for attack."); handleCancelAttackMode(); return;
    }
    const targetCharacter = getCharacterById(targetToken.characterId);
    if (!attacker || !targetCharacter) {
      handleSystemMessage("Attacker or target data not found."); handleCancelAttackMode(); return;
    }
    if (attacker.id === targetCharacter.id) {
        handleSystemMessage("Cannot target self with this action."); return;
    }
    const action = attackTargetingState.actionDetails;
    if (!action.isAttack || !action.attackSettings) {
      handleSystemMessage("Selected action is not an attack."); handleCancelAttackMode(); return;
    }

    const { attackSettings } = action;
    let abilityMod = 0;
    if (attackSettings.ability && attackSettings.ability !== 'none') {
      abilityMod = getAbilityModifier(attacker.abilityScores[attackSettings.ability]);
    }
    const profBonusValue = attacker.proficiencyBonus || calculateProficiencyBonus(attacker.level);
    const profBonusForAttack = attackSettings.proficient ? profBonusValue : 0;
    const otherBonus = attackSettings.bonus || 0;

    const d20RollResult = rollDice("/roll 1d20");
    if (!d20RollResult) { handleSystemMessage("Attack roll failed (null).", 'info'); handleCancelAttackMode(); return; }
    const d20DiceTerm = d20RollResult.components.find(c => c.type === 'dice') as DiceTerm | undefined; 
    if (!d20DiceTerm || d20DiceTerm.rolls.length === 0) { handleSystemMessage("Attack roll failed (no d20).", 'info'); handleCancelAttackMode(); return; }
    const d20Value = d20DiceTerm.rolls[0];
    
    const effectiveTargetAC = getEffectiveAC(targetCharacter); // Use effective AC
    const attackTotal = d20Value + abilityMod + profBonusForAttack + otherBonus;
    let attackRollMsg = `${attacker.name} attacks ${targetCharacter.name} with ${action.name}: Roll ${d20Value}`;
    if (attackSettings.ability && attackSettings.ability !== 'none') attackRollMsg += ` ${abilityMod >= 0 ? '+' : ''}${abilityMod}(${attackSettings.ability.slice(0,3).toUpperCase()})`;
    if (attackSettings.proficient) attackRollMsg += `+${profBonusForAttack}(Prof)`;
    if (otherBonus !== 0) attackRollMsg += ` ${otherBonus >= 0 ? '+' : ''}${otherBonus}`;
    attackRollMsg += ` = ${attackTotal} vs AC ${effectiveTargetAC}.`;

    const hits = attackTotal >= effectiveTargetAC;
    let damageRollMsg = "";
    if (hits) {
      attackRollMsg += " Hit!";
      if (action.damage && action.damage.length > 0) {
        const damageRollCommand = buildDamageRollCommand(action.damage, attacker.abilityScores, d20Value === 20);
        const damageResult = rollDice(damageRollCommand); // Not sending command string here, but dice expression
        if (damageResult) {
          const damageType = action.damage[0].type || "damage"; 
          damageRollMsg = ` for ${damageResult.total} ${damageType}. (${damageResult.verbose})`;
          const updatedTarget = { ...targetCharacter, currentHp: targetCharacter.currentHp - damageResult.total };
          multiplayerService.sendCharacterUpdate(updatedTarget); 
          if (updatedTarget.currentHp <= 0) damageRollMsg += ` ${targetCharacter.name} is down!`;
        } else { damageRollMsg = " (Damage roll failed)"; }
      } else { damageRollMsg = " (No damage)"; }
    } else { attackRollMsg += " Miss!"; }
    handleSystemMessage(attackRollMsg + damageRollMsg, 'roll');
    handleCancelAttackMode();
  }, [attackTargetingState, tokens, getCharacterById, handleCancelAttackMode, handleSystemMessage, characters]); // Added characters to dep array

  return {
    combatState, setCombatState,
    initiativeOrder, setInitiativeOrder,
    currentTurnCharacterId, setCurrentTurnCharacterId,
    roundCounter, setRoundCounter,
    heldActions, setHeldActions,
    attackTargetingState, setAttackTargetingState,
    handleEnterPreCombatMode,
    handleStartActiveCombat,
    handleEndCombat,
    handleEndTurn,
    handleUpdateInitiativeScore,
    handleSetHeldAction,
    handleUseHeldAction,
    handleInitiateAttack,
    handleCancelAttackMode,
    handleResolveAttack,
  };
};
