
import { AdvantageDisadvantageSetting } from "../types";

export interface DiceTerm {
  type: 'dice';
  numDice: number;
  diceSides: number;
  rolls: number[]; // The final, kept rolls (e.g., [18] if 1d20adv rolled [18,5])
  sum: number;     // Sum of the final, kept rolls
  sign: 1 | -1;
  diceString: string; // e.g., "2d6", "d8adv", "1d20dis" (includes adv/dis keyword)

  advantageState?: 'advantage' | 'disadvantage' | 'none';
  // For single die rolls (like 1d20) or summed sets (like 2d6adv), this stores the individual results before keeping one.
  // e.g., for 1d20adv, if rolls were 18 and 5, this would be [18, 5].
  // e.g., for 2d6adv, if first 2d6 sum was 7 and second was 9, this would be [7, 9].
  allIndividualRolls?: number[]; 
}

export interface ModifierTerm {
  type: 'modifier';
  value: number; // The value of the modifier, including its sign
  modifierString: string; // e.g., "5" or "2" (absolute part)
}

export type RollComponent = DiceTerm | ModifierTerm;

export interface DiceRollResult {
  command: string; // The original full command, e.g., "/roll 1d20adv+1 for Acrobatics"
  rawInput: string; // The full string after "/roll ", e.g., "1d20adv+1 for Acrobatics"
  diceExpression: string; // The parsed dice part, e.g., "1d20adv+1"
  description: string; // The descriptive part, e.g., "for Acrobatics"
  components: RollComponent[];
  total: number;
  verbose: string; // The full output string for chat, e.g. "Roll: 1d20adv+1 for Acrobatics -> ([18,5] -> 18) + 1 = 19"
  appliedGlobalAdvantage?: AdvantageDisadvantageSetting; // Indicates if the global toggle was used
}

const MAX_COMPONENTS = 20;
const MAX_DICE_PER_GROUP = 100;
const MAX_SIDES_PER_DIE = 1000;
const MAX_MODIFIER_VALUE = 10000;

// Regex to isolate the dice expression from the start of the string
// It matches a dice term (optionally with adv/dis) or modifier, optionally followed by more + or - terms.
const DICE_EXPRESSION_REGEX = /^([+-]?\s*\d*[dD]\d+(?:adv|dis|advantage|disadvantage|disadv)?|[+-]?\s*\d+)(\s*[+-]\s*(?:\d*[dD]\d+(?:adv|dis|advantage|disadvantage|disadv)?|\d+))*/i;


export function rollDice(
  command: string,
  globalAdvantageState?: AdvantageDisadvantageSetting
): DiceRollResult | null {
  const trimmedCommand = command.trim();
  if (!trimmedCommand.toLowerCase().startsWith('/roll ')) {
    return null;
  }

  const fullInputAfterRollCommand = trimmedCommand.substring(5).trim();

  if (!fullInputAfterRollCommand) {
    return {
      command: trimmedCommand,
      rawInput: fullInputAfterRollCommand,
      diceExpression: "",
      description: "",
      components: [],
      total: 0,
      verbose: `Invalid roll: No expression provided. Usage: /roll [expression] [description]`,
    };
  }

  let diceExpressionPart = "";
  let descriptionSuffix = "";

  const match = fullInputAfterRollCommand.match(DICE_EXPRESSION_REGEX);

  if (match && match[0]) {
    diceExpressionPart = match[0].trim();
    descriptionSuffix = fullInputAfterRollCommand.substring(diceExpressionPart.length).trim();
  } else {
    return {
      command: trimmedCommand,
      rawInput: fullInputAfterRollCommand,
      diceExpression: "",
      description: fullInputAfterRollCommand,
      components: [],
      total: 0,
      verbose: `Invalid roll: No valid dice expression found at the start of "${fullInputAfterRollCommand}".`,
    };
  }
  
  if (!diceExpressionPart) {
     return {
      command: trimmedCommand,
      rawInput: fullInputAfterRollCommand,
      diceExpression: "",
      description: fullInputAfterRollCommand,
      components: [],
      total: 0,
      verbose: `Invalid roll: Dice expression is empty in "${fullInputAfterRollCommand}".`,
    };
  }

  let normalizedDiceExpression = diceExpressionPart
    .replace(/\s*-\s*/g, " + -")
    .replace(/\s*\+\s*/g, " + ");
  
  if (normalizedDiceExpression.startsWith(" + ")) {
      normalizedDiceExpression = normalizedDiceExpression.substring(3);
  }

  const rawTerms = normalizedDiceExpression.split(/\s*\+\s*/).map(t => t.trim()).filter(t => t !== "");

  if (rawTerms.length === 0 && !diceExpressionPart.match(/^\d+$/)) {
     if (!diceExpressionPart.match(/^\d+$/) && !diceExpressionPart.match(/\d*[dD]\d+/i)) {
        return {
          command: trimmedCommand,
          rawInput: fullInputAfterRollCommand,
          diceExpression: diceExpressionPart,
          description: descriptionSuffix,
          components: [],
          total: 0,
          verbose: `Invalid roll: No valid terms found in dice expression "${diceExpressionPart}".`,
        };
     }
  }
  
  if (rawTerms.length > MAX_COMPONENTS) {
    return { command: trimmedCommand, rawInput: fullInputAfterRollCommand, diceExpression: diceExpressionPart, description: descriptionSuffix, components: [], total: 0, verbose: `Invalid roll: Exceeded maximum of ${MAX_COMPONENTS} terms.` };
  }

  const components: RollComponent[] = [];
  let total = 0;
  let appliedGlobalAdvantage: AdvantageDisadvantageSetting | undefined = undefined;
  let firstD20ProcessedForGlobalAdv = false;

  for (const term of rawTerms) {
    let currentTermString = term; 
    const isNegative = currentTermString.startsWith('-');
    const sign: 1 | -1 = isNegative ? -1 : 1;
    
    if (isNegative) {
      currentTermString = currentTermString.substring(1).trim();
    }

    const advDisMatch = currentTermString.match(/^(.*)(adv|advantage|dis|disadvantage|disadv)$/i);
    let baseDicePart = currentTermString;
    let advantageStateFromKeyword: DiceTerm['advantageState'] = 'none';

    if (advDisMatch) {
        baseDicePart = advDisMatch[1];
        const modifierKeyword = advDisMatch[2].toLowerCase();
        if (['adv', 'advantage'].includes(modifierKeyword)) {
            advantageStateFromKeyword = 'advantage';
        } else if (['dis', 'disadvantage', 'disadv'].includes(modifierKeyword)) {
            advantageStateFromKeyword = 'disadvantage';
        }
    }
    
    let finalAdvantageState: DiceTerm['advantageState'] = advantageStateFromKeyword;
    let diceStringWithAdvDis = currentTermString; 

    if (baseDicePart.toLowerCase().includes('d')) { 
      const parts = baseDicePart.toLowerCase().split('d');
      const numDiceStr = parts[0];
      const diceSidesStr = parts[1];

      const numDice = numDiceStr === "" ? 1 : parseInt(numDiceStr, 10);
      const diceSides = parseInt(diceSidesStr, 10);

      if (isNaN(numDice) || isNaN(diceSides) || numDice <= 0 || diceSides <= 0) {
        return { command: trimmedCommand, rawInput: fullInputAfterRollCommand, diceExpression: diceExpressionPart, description: descriptionSuffix, components: [], total: 0, verbose: `Invalid dice format in term: "${term}".` };
      }
      if (numDice > MAX_DICE_PER_GROUP) return { command: trimmedCommand, rawInput: fullInputAfterRollCommand, diceExpression: diceExpressionPart, description: descriptionSuffix, components: [], total: 0, verbose: `Exceeded max dice per group (${MAX_DICE_PER_GROUP}) in "${term}".` };
      if (diceSides > MAX_SIDES_PER_DIE) return { command: trimmedCommand, rawInput: fullInputAfterRollCommand, diceExpression: diceExpressionPart, description: descriptionSuffix, components: [], total: 0, verbose: `Exceeded max sides per die (${MAX_SIDES_PER_DIE}) in "${term}".` };

      // Apply global advantage/disadvantage if applicable
      if (diceSides === 20 && advantageStateFromKeyword === 'none' && globalAdvantageState && globalAdvantageState !== 'none' && !firstD20ProcessedForGlobalAdv) {
        finalAdvantageState = globalAdvantageState;
        appliedGlobalAdvantage = globalAdvantageState; // Mark that global was applied
        diceStringWithAdvDis = `${baseDicePart}${globalAdvantageState === 'advantage' ? 'adv' : 'dis'}`;
        firstD20ProcessedForGlobalAdv = true;
      }


      let keptRolls: number[] = [];
      let termSum = 0;
      let allIndividualRollsForDisplay: number[] | undefined = undefined;

      if (finalAdvantageState !== 'none') {
        const rollSet1: number[] = [];
        let sumSet1 = 0;
        for (let i = 0; i < numDice; i++) {
          const roll = Math.floor(Math.random() * diceSides) + 1;
          rollSet1.push(roll);
          sumSet1 += roll;
        }

        const rollSet2: number[] = [];
        let sumSet2 = 0;
        for (let i = 0; i < numDice; i++) {
          const roll = Math.floor(Math.random() * diceSides) + 1;
          rollSet2.push(roll);
          sumSet2 += roll;
        }
        
        allIndividualRollsForDisplay = numDice === 1 ? [rollSet1[0], rollSet2[0]] : [sumSet1, sumSet2];

        if (finalAdvantageState === 'advantage') {
          termSum = Math.max(sumSet1, sumSet2);
          keptRolls = sumSet1 >= sumSet2 ? rollSet1 : rollSet2;
        } else { // disadvantage
          termSum = Math.min(sumSet1, sumSet2);
          keptRolls = sumSet1 <= sumSet2 ? rollSet1 : rollSet2;
        }
      } else {
        for (let i = 0; i < numDice; i++) {
          const roll = Math.floor(Math.random() * diceSides) + 1;
          keptRolls.push(roll);
          termSum += roll;
        }
      }
      
      components.push({ 
        type: 'dice', numDice, diceSides, rolls: keptRolls, sum: termSum, sign, 
        diceString: diceStringWithAdvDis, 
        advantageState: finalAdvantageState, 
        allIndividualRolls: allIndividualRollsForDisplay
      });
      total += sign * termSum;

    } else { // Modifier term
      if (advantageStateFromKeyword !== 'none') { // Modifiers can't have adv/dis
        return { command: trimmedCommand, rawInput: fullInputAfterRollCommand, diceExpression: diceExpressionPart, description: descriptionSuffix, components: [], total: 0, verbose: `Invalid use of adv/dis on modifier: "${term}".` };
      }
      const modValue = parseInt(baseDicePart, 10);
      if (isNaN(modValue)) return { command: trimmedCommand, rawInput: fullInputAfterRollCommand, diceExpression: diceExpressionPart, description: descriptionSuffix, components: [], total: 0, verbose: `Invalid modifier: "${term}".` };
      if (Math.abs(modValue) > MAX_MODIFIER_VALUE) return { command: trimmedCommand, rawInput: fullInputAfterRollCommand, diceExpression: diceExpressionPart, description: descriptionSuffix, components: [], total: 0, verbose: `Modifier "${term}" exceeds max value of ${MAX_MODIFIER_VALUE}.` };
      
      components.push({ type: 'modifier', value: sign * modValue, modifierString: baseDicePart });
      total += sign * modValue;
    }
  }

  let verboseLHS = "";
  components.forEach((comp, index) => {
    let termDisplay = "";
    let effectiveSignChar = "";

    if (comp.type === 'dice') {
      if (comp.advantageState !== 'none' && comp.allIndividualRolls) {
        const keptValue = comp.sum; 
        termDisplay = `${comp.diceString.replace(comp.advantageState === 'advantage' ? /adv(antage)?$/i : /dis(advantage|adv)?$/i, '')}${comp.advantageState === 'advantage' ? 'Adv' : 'Dis'}([${comp.allIndividualRolls.join(',')}] -> ${keptValue})`;
      } else {
        termDisplay = `${comp.diceString}[${comp.rolls.join(',')}]`;
      }
      effectiveSignChar = comp.sign > 0 ? "+" : "-";
    } else { // modifier
      termDisplay = `${Math.abs(comp.value)}`;
      effectiveSignChar = comp.value >= 0 ? "+" : "-";
    }

    if (index === 0) {
      verboseLHS = (effectiveSignChar === "-" ? "- " : "") + termDisplay;
    } else {
      verboseLHS += ` ${effectiveSignChar} ` + termDisplay;
    }
  });
  
  const rollPrefix = appliedGlobalAdvantage ? `Roll (${appliedGlobalAdvantage === 'advantage' ? 'Adv' : 'Dis'} Toggle):` : "Roll:";
  const verbose = `${rollPrefix} ${fullInputAfterRollCommand} -> ${verboseLHS || diceExpressionPart} = ${total}`;

  return { 
    command: trimmedCommand, 
    rawInput: fullInputAfterRollCommand,
    diceExpression: diceExpressionPart,
    description: descriptionSuffix,
    components, 
    total, 
    verbose,
    appliedGlobalAdvantage 
  };
}
