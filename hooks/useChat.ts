
import { useState, useCallback } from 'react';
import { ChatMessage, User, ChatMessageRollDetails, AdvantageDisadvantageSetting } from '../types';
import { multiplayerService } from '../MultiplayerService';
import { generateId } from '../utils';
import { rollDice, DiceRollResult, DiceTerm } from '../services/diceRoller';

interface UseChatProps {
  currentUser: User;
  globalAdvantageState: AdvantageDisadvantageSetting;
  setGlobalAdvantageState: React.Dispatch<React.SetStateAction<AdvantageDisadvantageSetting>>;
}

export const useChat = ({ currentUser, globalAdvantageState, setGlobalAdvantageState }: UseChatProps) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const handleSendMessage = useCallback((messageText: string, type: 'message' | 'roll' | 'info' = 'message') => {
    const newId = generateId(type === 'roll' ? 'roll_' : (type === 'info' ? 'info_' : 'msg_'));
    let rollDetailsForMessage: ChatMessageRollDetails | undefined = undefined;

    let isRollAttempt = false;
    if (type === 'roll' || (type === 'message' && messageText.toLowerCase().startsWith('/roll '))) {
        isRollAttempt = true;
    }

    if (isRollAttempt) {
      const result: DiceRollResult | null = rollDice(messageText, globalAdvantageState); 
      
      if (result && result.components && result.components.length > 0) {
        const d20Term = result.components.find(c => c.type === 'dice' && c.diceSides === 20) as DiceTerm | undefined;
        
        if (d20Term && d20Term.rolls.length > 0) {
          let targetValue: number | undefined;
          const contextForTarget = result.description || result.diceExpression;
          const acMatch = contextForTarget.match(/vs AC (\d+)/i);
          const dcMatch = contextForTarget.match(/vs DC (\d+)/i); // Added for DC
          
          if (acMatch && acMatch[1]) {
            targetValue = parseInt(acMatch[1], 10);
          } else if (dcMatch && dcMatch[1]) { // Parse DC
            targetValue = parseInt(dcMatch[1], 10);
          }

          let isSuccess: boolean | undefined = undefined;
          if (targetValue !== undefined) {
            isSuccess = result.total >= targetValue;
          }

          // Determine character name for the roll from the description if available
          // e.g., "for Goblin's DEXTERITY save"
          let rollerName = currentUser.name; // Default to current user
          const forCharacterMatch = result.description?.match(/for ([\w\s']+?)'s/i);
          if (forCharacterMatch && forCharacterMatch[1]) {
            rollerName = forCharacterMatch[1].trim();
          }


          rollDetailsForMessage = {
            characterName: rollerName, 
            diceExpression: result.diceExpression,
            description: result.description || undefined,
            d20Value: d20Term.rolls[0], 
            totalResult: result.total,
            targetAC: targetValue, // Use generic targetValue, can be AC or DC
            isSuccess: isSuccess, // Set success based on DC/AC
            advantageState: d20Term.advantageState || 'none',
            d20Rolls: d20Term.allIndividualRolls, 
          };
        } else { 
           rollDetailsForMessage = {
                characterName: currentUser.name, // Fallback if no d20 term
                diceExpression: result.diceExpression,
                description: result.description || undefined,
                totalResult: result.total,
                advantageState: 'none', 
            };
        }

        if (result.appliedGlobalAdvantage && (result.appliedGlobalAdvantage === 'advantage' || result.appliedGlobalAdvantage === 'disadvantage')) {
          setGlobalAdvantageState('none');
        }
        
        // The sender of the message is still the currentUser (e.g., DM is resolving a monster's save)
        // But the rollDetails.characterName reflects who made the roll.
        multiplayerService.sendChatMessage({ 
            id: newId, 
            text: `(${currentUser.name}) ${result.verbose}`, 
            type: 'roll', 
            rollDetails: rollDetailsForMessage 
        });
      } else {
        const errorText = result ? result.verbose : `Invalid roll command from ${currentUser.name}: ${messageText}`;
        multiplayerService.sendChatMessage({ id: newId, text: errorText, type: 'info' });
      }
    } else if (type === 'info') {
      multiplayerService.sendChatMessage({ id: newId, text: messageText, type: 'info' });
    } else { 
      multiplayerService.sendChatMessage({ id: newId, text: `${currentUser.name}: ${messageText}`, type: 'message' });
    }
  }, [currentUser.name, globalAdvantageState, setGlobalAdvantageState]);
  
  const handleSystemMessage = useCallback((text: string, type: 'message' | 'roll' | 'info' = 'info') => {
    const newId = generateId(type === 'roll' ? 'roll_' : (type === 'info' ? 'info_' : 'msg_'));
    multiplayerService.sendChatMessage({ id: newId, text: text, type: type });
  }, []);

  return {
    chatMessages,
    setChatMessages,
    handleSendMessage,
    handleSystemMessage,
  };
};
