
// Utility functions for the Tabletop Game Engine

import { AbilityScores, ActionDetail, AttackSettings, ActionDamageEntry, Character, SkillProficiencies, Point, Item, EquipmentSlot, TemporaryEffect, Token } from './types';
// Removed: import { GRID_CELL_SIZE } from './constants';

export const generateId = (prefix: string = 'id_') => `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const getAbilityModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

export const calculateProficiencyBonus = (level: number): number => {
  if (level < 1) level = 1;
  if (level >= 1 && level <= 4) return 2;
  if (level >= 5 && level <= 8) return 3;
  if (level >= 9 && level <= 12) return 4;
  if (level >= 13 && level <= 16) return 5;
  if (level >= 17 && level <= 20) return 6;
  if (level >= 21 && level <= 24) return 7;
  if (level >= 25 && level <= 28) return 8;
  return 9; // For levels 29+
};
export const getProficiencyBonus = calculateProficiencyBonus;


interface CharacterStatsForAttackCalc {
  abilityScores: AbilityScores;
  level: number;
  proficiencyBonus?: number;
}

export const calculateHitBonusString = (
  attackSettings: AttackSettings | undefined,
  characterStats: CharacterStatsForAttackCalc,
): string => {
  if (!attackSettings) return "+0";

  let totalBonus = 0;
  const proficiency = characterStats.proficiencyBonus || calculateProficiencyBonus(characterStats.level);

  if (attackSettings.ability && attackSettings.ability !== 'none') {
    totalBonus += getAbilityModifier(characterStats.abilityScores[attackSettings.ability]);
  }
  if (attackSettings.proficient) {
    totalBonus += proficiency;
  }
  if (attackSettings.bonus) {
    totalBonus += attackSettings.bonus;
  }

  return totalBonus >= 0 ? `+${totalBonus}` : `${totalBonus}`;
};


export const formatDamageString = (
  damageEntry: ActionDamageEntry,
  abilityScores: AbilityScores
): string => {
  let diceString = damageEntry.dice;

  (Object.keys(abilityScores) as Array<keyof AbilityScores>).forEach(key => {
    const modifier = getAbilityModifier(abilityScores[key]);
    const placeholder = key.substring(0, 3).toUpperCase();
    const regex = new RegExp(`\\b${placeholder}\\b`, 'gi');

    if (diceString.includes(placeholder)) {
        if (modifier !== 0) {
            diceString = diceString.replace(regex, modifier > 0 ? `+${modifier}` : `${modifier}`);
        } else {
            if (diceString.match(new RegExp(`\\b${placeholder}\\b(\\s*(\\+|-)|$)`, 'gi'))) {
                 diceString = diceString.replace(regex, '');
            } else {
                diceString = diceString.replace(regex, `+0`);
            }
        }
    }
  });

  diceString = diceString.replace(/\s*\+\s*0\b/g, '');
  diceString = diceString.replace(/\s*-\s*0\b/g, '');
  diceString = diceString.replace(/\+\s*\+/g, '+ ');
  diceString = diceString.replace(/\+\s*-/g, '- ');
  diceString = diceString.replace(/-\s*\+/g, '- ');
  diceString = diceString.replace(/-\s*-/g, '+ ');

  diceString = diceString.trim();
  if (diceString.startsWith('+') || diceString.startsWith('-')) {
      if (diceString.length === 1 && (diceString === '+' || diceString === '-')) {
          diceString = '';
      } else if (diceString.length > 1 && (diceString.charAt(1) === ' ' || !isNaN(parseInt(diceString.charAt(1))))) {
      }
  }
   if (diceString.endsWith('+') || diceString.endsWith('-')) {
    diceString = diceString.slice(0, -1).trim();
  }
  diceString = diceString.replace(/\s\s+/g, ' ');


  return `${diceString} ${damageEntry.type}`.trim();
};

export const buildDamageRollCommand = (
  damageEntries: ActionDamageEntry[],
  baseAbilityScores: AbilityScores,
  isCritical: boolean
): string => {
  const commandTerms: string[] = [];

  damageEntries.forEach(entry => {
    if (!entry.dice || entry.dice.trim() === "") return; // Skip if dice string is empty

    let currentDiceExpression = entry.dice.trim();

    if (isCritical) {
      currentDiceExpression = currentDiceExpression.replace(/(\d+)d(\d+)/g, (match, numDice, dieSize) => {
        return `${parseInt(numDice) * 2}d${dieSize}`;
      });
    }

    (Object.keys(baseAbilityScores) as Array<keyof AbilityScores>).forEach(abiKey => {
      const modifier = getAbilityModifier(baseAbilityScores[abiKey]);
      const placeholder = abiKey.substring(0, 3).toUpperCase();
      const regex = new RegExp(`\\b${placeholder}\\b`, 'gi');
      currentDiceExpression = currentDiceExpression.replace(regex, modifier.toString());
    });

    // Ensure '+' or '-' signs are properly spaced for terms like "1d4+STR" becoming "1d4+2"
    // or "1d4-STR" becoming "1d4- -2" -> "1d4+2" if STR mod is -2
    currentDiceExpression = currentDiceExpression
        .replace(/\+\s*-/g, "- ")
        .replace(/-\s*\+/g, "- ")
        .replace(/-\s*-/g, "+ ")
        .replace(/\+\s*\+/g, "+ ");
        
    commandTerms.push(currentDiceExpression);
  });

  if (commandTerms.length === 0) return "0"; // Return "0" if no terms
  return commandTerms.join(" + ").trim(); // Return only the expression
};

export const calculatePassiveScore = (
    character: Character,
    skillName: keyof SkillProficiencies,
    proficiencyBonus: number
): number => {
    let baseAbility: keyof AbilityScores;
    switch (skillName) {
        case 'perception':
        case 'insight':
        case 'survival':
        case 'medicine':
        case 'animalHandling':
            baseAbility = 'wisdom';
            break;
        case 'investigation':
        case 'arcana':
        case 'history':
        case 'nature':
        case 'religion':
            baseAbility = 'intelligence';
            break;
        default:
            return 10;
    }

    const abilityMod = getAbilityModifier(character.abilityScores[baseAbility]);
    const isProficient = character.skillProficiencies?.[skillName] || false;

    return 10 + abilityMod + (isProficient ? proficiencyBonus : 0);
};

export const snapPointToGrid = (point: Point, gridCellSize: number): Point => ({
  x: Math.round(point.x / gridCellSize) * gridCellSize + gridCellSize / 2,
  y: Math.round(point.y / gridCellSize) * gridCellSize + gridCellSize / 2,
});

export const parseSpeedFromString = (speedStr: string): number => {
  const match = speedStr.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 30;
};

export const parseChallengeRatingToLevel = (crStr?: string): number => {
  if (!crStr) return 1;
  if (crStr.includes('/')) {
    const parts = crStr.split('/');
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
        const val = num/den;
        if (val < 1) return 1; // CR less than 1 maps to level 1 for simplicity
    }
    return 1;
  }
  const parsed = parseInt(crStr, 10);
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

export const addCharacterToInitiative = (
  character: Character, // Character shell, initiative might be undefined
  allCurrentlyKnownCharacters: Character[],
  currentInitiativeOrderIds: string[]
): { 
  charWithInitiative: Character; 
  newOrder: string[]; 
  initiativeRollData: { d20Roll: number, modifier: number, total: number } 
} => {
  const dexMod = getAbilityModifier(character.abilityScores.dexterity);
  const d20Result = Math.floor(Math.random() * 20) + 1;
  let initiativeRoll = d20Result + dexMod;

  if (isNaN(initiativeRoll)) { 
    initiativeRoll = 0;
  }

  const proficiencyBonus = character.proficiencyBonus || calculateProficiencyBonus(character.level);
  const currentMovement = character.currentMovement ?? character.speed;

  const finalCharWithInitiative = {
    ...character,
    initiative: initiativeRoll,
    proficiencyBonus,
    currentMovement,
  };

  const combatantsMap = new Map<string, Character>();

  currentInitiativeOrderIds.forEach(id => {
    if (id === finalCharWithInitiative.id) {
      combatantsMap.set(id, finalCharWithInitiative);
    } else {
      const charData = allCurrentlyKnownCharacters.find(c => c.id === id);
      if (charData) {
        combatantsMap.set(id, charData);
      }
    }
  });

  combatantsMap.set(finalCharWithInitiative.id, finalCharWithInitiative);

  const combatantsToSort = Array.from(combatantsMap.values());
  
  combatantsToSort.sort((a, b) => {
    const initA = a.initiative ?? -Infinity;
    const initB = b.initiative ?? -Infinity;

    if (initB !== initA) {
      return initB - initA;
    }
    const dexA = a.abilityScores?.dexterity || 0;
    const dexB = b.abilityScores?.dexterity || 0;
    if (dexB !== dexA) {
        return dexB - dexA;
    }
    return a.id.localeCompare(b.id);
  });
  
  const initiativeRollData = {
    d20Roll: d20Result,
    modifier: dexMod,
    total: initiativeRoll
  };

  return {
    charWithInitiative: finalCharWithInitiative, 
    newOrder: combatantsToSort.map(c => c.id), 
    initiativeRollData
  };
};


export const getCompatibleSlotsForItem = (item: Item, character?: Character): EquipmentSlot[] => {
  if (!item.slotType) return [];
  let slots: EquipmentSlot[] = Array.isArray(item.slotType) ? item.slotType : [item.slotType];

  if (item.itemCategory === 'weapon') {
    // Further logic could be added for two-handed, etc.
  } else if (item.itemCategory === 'armor') {
    slots = slots.filter(s => s === 'armor' || s === 'helmet' || s === 'boots' || s === 'gloves' || s === 'belt');
  } else if (item.itemCategory === 'shield') {
    slots = slots.filter(s => s === 'offHand');
  }
  return slots;
};

export const isSingleTargetSpell = (spell: ActionDetail): boolean => {
  if (spell.actionCategory !== 'spell') return false;
  if (spell.areaOfEffect) return false; // AoE spells are not single-target for this purpose

  const targetString = spell.target?.toLowerCase() || "";
  const rangeString = spell.range?.toLowerCase() || "";

  if (rangeString === "self" || rangeString.includes("self (")) return false;
  if (targetString.includes("self")) return false;


  const singleTargetKeywords = [
    "one creature", "a creature", "one target", "one humanoid", "one object",
    "creature you touch", "object you touch"
  ];
  if (singleTargetKeywords.some(keyword => targetString.includes(keyword))) {
    return true;
  }

  // If it has a range, is not "self", and no AoE specified, assume single target for targeting purposes.
  if (spell.range && !rangeString.includes("self") && !targetString.includes("self")) {
      if (!spell.description.toLowerCase().match(/\b(sphere|cube|cone|line|cylinder)\b/i)) {
          return true;
      }
  }

  return false;
};

export const requiresMapTargeting = (spell: ActionDetail): boolean => {
  if (spell.areaOfEffect) {
    // Most AoEs require targeting a point or directing a cone/line
    if (spell.areaOfEffect.type === 'cone' || 
        spell.areaOfEffect.type === 'line' ||
        (spell.areaOfEffect.type === 'sphere' && spell.range?.toLowerCase() !== 'self') || // Sphere not centered on self
        (spell.areaOfEffect.type === 'cube' && spell.range?.toLowerCase() !== 'self') ||   // Cube not centered on self
        (spell.areaOfEffect.type === 'cylinder' && spell.range?.toLowerCase() !== 'self') // Cylinder not centered on self
       ) {
      return true;
    }
  }
  return isSingleTargetSpell(spell);
};


// Helper to parse simple "X ft." range string to pixels
export const parseRangeToPixels = (rangeString?: string | number, gridCellSizeParam?: number): number | null => {
    if (gridCellSizeParam === undefined || gridCellSizeParam <= 0) {
        return null;
    }
    if (rangeString === undefined || rangeString === null) {
        return null;
    }

    const cellSize = gridCellSizeParam;
    let feet: number | null = null;

    if (typeof rangeString === 'number') {
        feet = rangeString;
    } else { // Type is string
        const trimmedRangeString = rangeString.trim().toLowerCase();
        if (trimmedRangeString === 'touch' || trimmedRangeString === 'self') {
            return 0.5 * cellSize; 
        }

        // Matches "X ft", "X feet", "Xft", "Xfeet", "X'" or just "X" (if no unit specified, assume feet)
        const feetMatch = trimmedRangeString.match(/^(\d+(?:\.\d+)?)\s*(?:feet|ft\.?|f(?:ee)?t|')?$/i);
        const plainNumberMatch = trimmedRangeString.match(/^(\d+(?:\.\d+)?)$/i);

        if (feetMatch && feetMatch[1]) {
            feet = parseFloat(feetMatch[1]);
        } else if (plainNumberMatch && plainNumberMatch[1]) {
            feet = parseFloat(plainNumberMatch[1]);
        }
    }

    if (feet !== null && !isNaN(feet)) {
        return (feet / 5) * cellSize; // Assuming 1 grid cell = 5 feet
    }
    
    return null;
};


export const getEffectiveAC = (character: Character | null): number => {
  if (!character) return 0;
  let effectiveAC = character.armorClass;
  if (character.temporaryEffects) {
    character.temporaryEffects.forEach(effect => {
      if (effect.type === 'ac_bonus' && effect.value) {
        effectiveAC += effect.value;
      }
    });
  }
  return effectiveAC;
};

function isPointInCone(
    pointToCheck: Point,
    coneOrigin: Point,
    normDirX: number, // Normalized direction vector X of the cone's centerline
    normDirY: number, // Normalized direction vector Y of the cone's centerline
    coneLength: number,
    halfConeAngleRad: number
): boolean {
    const vectorToPointX = pointToCheck.x - coneOrigin.x;
    const vectorToPointY = pointToCheck.y - coneOrigin.y;
    const distanceToPointSq = vectorToPointX * vectorToPointX + vectorToPointY * vectorToPointY;

    if (distanceToPointSq === 0) return true; // Origin point is in the cone
    if (distanceToPointSq > coneLength * coneLength) return false; // Point is beyond the cone's length

    const distanceToPoint = Math.sqrt(distanceToPointSq);
    const dotProduct = (vectorToPointX * normDirX) + (vectorToPointY * normDirY);
    
    // Ensure dotProduct / distanceToPoint is within [-1, 1] for acos
    const cosAngle = Math.max(-1, Math.min(1, dotProduct / distanceToPoint));
    const angleToPointRad = Math.acos(cosAngle);

    return angleToPointRad <= halfConeAngleRad;
}

export const getCellsInCone = (
  origin: Point,
  directionPoint: Point,
  coneLengthPixels: number,
  coneAngleDegrees: number,
  cellSize: number
): Point[] => { // Returns array of top-left points of affected cells
  const cellsInCone: Point[] = [];
  if (coneLengthPixels <= 0 || cellSize <= 0) return cellsInCone;

  const dirX = directionPoint.x - origin.x;
  const dirY = directionPoint.y - origin.y;
  const magSq = dirX * dirX + dirY * dirY;

  if (magSq === 0) return cellsInCone; // No direction
  const mag = Math.sqrt(magSq);

  const normDirX = dirX / mag;
  const normDirY = dirY / mag;

  const halfConeAngleRad = (coneAngleDegrees / 2) * (Math.PI / 180);
  
  const searchRadius = coneLengthPixels; 
  const maxCellOffset = Math.ceil(searchRadius / cellSize) + 2; 
  const originCellX = Math.floor(origin.x / cellSize);
  const originCellY = Math.floor(origin.y / cellSize);

  const checkedCells = new Set<string>();

  for (let dCellX = -maxCellOffset; dCellX <= maxCellOffset; dCellX++) {
    for (let dCellY = -maxCellOffset; dCellY <= maxCellOffset; dCellY++) {
      const cellXIndex = originCellX + dCellX;
      const cellYIndex = originCellY + dCellY;
      
      const cellKey = `${cellXIndex},${cellYIndex}`;
      if (checkedCells.has(cellKey)) continue;
      checkedCells.add(cellKey);

      const cellTLX = cellXIndex * cellSize;
      const cellTLY = cellYIndex * cellSize;

      const pointsToTest: Point[] = [
        { x: cellTLX + cellSize / 2, y: cellTLY + cellSize / 2 }, // Center
        { x: cellTLX, y: cellTLY },                               // Top-Left
        { x: cellTLX + cellSize, y: cellTLY },                   // Top-Right
        { x: cellTLX, y: cellTLY + cellSize },                   // Bottom-Left
        { x: cellTLX + cellSize, y: cellTLY + cellSize },       // Bottom-Right
      ];

      let cellIsAffected = false;
      for (const testPoint of pointsToTest) {
        if (isPointInCone(testPoint, origin, normDirX, normDirY, coneLengthPixels, halfConeAngleRad)) {
          cellIsAffected = true;
          break;
        }
      }

      if (cellIsAffected) {
        cellsInCone.push({ x: cellTLX, y: cellTLY });
      }
    }
  }
  return cellsInCone;
};


export const getCharactersInCone = (
  allTokens: Token[],
  getCharacterByIdCallback: (id: string) => Character | undefined,
  affectedCellsTopLeftCoords: Point[], // List of top-left {x,y} of affected cells
  cellSize: number
): Character[] => {
  const affectedCharactersMap = new Map<string, Character>();

  if (affectedCellsTopLeftCoords.length === 0 || cellSize <= 0) {
    return [];
  }

  const affectedCellSet = new Set(affectedCellsTopLeftCoords.map(p => `${p.x},${p.y}`));

  for (const token of allTokens) {
    if (!token.characterId) continue;

    // Determine the top-left coordinate of the cell the token's center is in
    const tokenCellTopLeftX = Math.floor(token.position.x / cellSize) * cellSize;
    const tokenCellTopLeftY = Math.floor(token.position.y / cellSize) * cellSize;
    const tokenCellKey = `${tokenCellTopLeftX},${tokenCellTopLeftY}`;

    if (affectedCellSet.has(tokenCellKey)) {
      if (!affectedCharactersMap.has(token.characterId)) {
        const character = getCharacterByIdCallback(token.characterId);
        if (character) {
          affectedCharactersMap.set(token.characterId, character);
        }
      }
    }
  }
  return Array.from(affectedCharactersMap.values());
};
