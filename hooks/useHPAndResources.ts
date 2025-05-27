


import { useCallback } from 'react';
import { Character } from '../types';
import { multiplayerService } from '../MultiplayerService';
import { getAbilityModifier } from '../utils';
// FIX: (Verified) Import DiceTerm and DiceRollResult from '../services/diceRoller'.
import { rollDice, DiceRollResult, DiceTerm } from '../services/diceRoller'; 

interface UseHPAndResourcesProps {
  getCharacterById: (characterId: string) => Character | undefined;
  // FIX: (Verified) Ensure handleSystemMessage type matches the one provided (originating from useChat)
  handleSystemMessage: (message: string, type?: 'message' | 'roll' | 'info') => void;
}

export const useHPAndResources = (props: UseHPAndResourcesProps) => {
  const { getCharacterById, handleSystemMessage } = props;

  const handleUpdateCharacterHP = useCallback((characterId: string, newHp: number) => {
    const character = getCharacterById(characterId);
    if (character) {
      const updatedChar = { ...character, currentHp: Math.max(0, Math.min(newHp, character.maxHp)) };
      multiplayerService.sendCharacterUpdate(updatedChar);
    }
  }, [getCharacterById]);
  
  const handleUpdateCharacterTempHP = useCallback((characterId: string, newTempHp: number) => {
      const character = getCharacterById(characterId);
      if (character) {
          const updatedChar = { ...character, temporaryHp: Math.max(0, newTempHp) };
          multiplayerService.sendCharacterUpdate(updatedChar);
      }
  }, [getCharacterById]);

  const handleUpdateCharacterSpellSlots = useCallback((characterId: string, level: string, change: number) => {
    const character = getCharacterById(characterId);
    if (!character || !character.spellSlots) return;

    const levelKey = level.match(/\d+/)?.[0] || level.toLowerCase();
    const currentSlots = character.spellSlots[levelKey] || { current: 0, max: 0 };
    
    const newCurrent = Math.max(0, Math.min(currentSlots.current + change, currentSlots.max));

    const updatedSpellSlots = {
        ...character.spellSlots,
        [levelKey]: { ...currentSlots, current: newCurrent }
    };
    multiplayerService.sendCharacterUpdate({ ...character, spellSlots: updatedSpellSlots });
  }, [getCharacterById]);

  const handleUpdateHitDice = useCallback((characterId: string, type: 'spend' | 'regain_one' | 'regain_all', value?: number | string) => {
    const character = getCharacterById(characterId);
    if (!character || !character.hitDice) return;

    let newCurrent = character.hitDice.current;
    const maxDice = character.hitDice.max;
    
    if (type === 'spend' && newCurrent > 0) {
        newCurrent -= 1;
        const dieType = character.hitDice.dieType;
        const conMod = getAbilityModifier(character.abilityScores.constitution);
        const rollResult = rollDice(`/roll 1${dieType}+${conMod}`);
        if (rollResult) {
            // FIX: Use DiceTerm from '../services/diceRoller'
            const firstDiceTerm = rollResult.components.find(c => c.type === 'dice') as DiceTerm | undefined; 
            const d20RollValue = firstDiceTerm ? firstDiceTerm.rolls[0] : 'N/A'; // Assuming the first dice term is the hit die itself
            // FIX: Correctly call handleSystemMessage with 'roll' type if it's a dice roll verbose output
            handleSystemMessage(`${character.name} spends a ${dieType} Hit Die, regains ${rollResult.total} HP. (Roll: 1${dieType}[${d20RollValue}] + ${conMod} = ${rollResult.total})`, 'roll');
        }
    } else if (type === 'regain_one' && newCurrent < maxDice) {
        newCurrent += 1;
    } else if (type === 'regain_all') {
        newCurrent = maxDice;
    }

    if (newCurrent !== character.hitDice.current) {
        multiplayerService.sendCharacterUpdate({ ...character, hitDice: { ...character.hitDice, current: newCurrent } });
    }
  }, [getCharacterById, handleSystemMessage]);

  const handleUpdateDeathSaves = useCallback((characterId: string, type: 'success' | 'failure', increment: boolean) => {
    const character = getCharacterById(characterId);
    if (!character || !character.deathSaves) return;

    let currentSuccesses = character.deathSaves.successes;
    let currentFailures = character.deathSaves.failures;

    if (type === 'success') {
        currentSuccesses = increment ? Math.min(3, currentSuccesses + 1) : Math.max(0, currentSuccesses -1);
    } else { 
        currentFailures = increment ? Math.min(3, currentFailures + 1) : Math.max(0, currentFailures -1);
    }
        
    const updatedSaves = { successes: currentSuccesses, failures: currentFailures };
    multiplayerService.sendCharacterUpdate({ ...character, deathSaves: updatedSaves });

    if (currentSuccesses >= 3) handleSystemMessage(`${character.name} is now stable!`);
    if (currentFailures >= 3) handleSystemMessage(`${character.name} has died!`);

  }, [getCharacterById, handleSystemMessage]);

  return {
    handleUpdateCharacterHP,
    handleUpdateCharacterTempHP,
    handleUpdateCharacterSpellSlots,
    handleUpdateHitDice,
    handleUpdateDeathSaves,
  };
};
