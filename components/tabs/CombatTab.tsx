
import React, { useState } from 'react';
import { Character, User, ActionDetail, HeldAction, Item } from '../../types';
import { getAbilityModifier, generateId, formatDamageString, calculateHitBonusString } from '../../utils'; 
import { STANDARD_ACTIONS_5E, GENERIC_BONUS_ACTIONS_5E, GENERIC_REACTIONS_5E } from '../../constants';


interface CombatTabProps {
  currentUser: User;
  characters: Character[]; 
  initiativeOrder: string[]; 
  currentTurnCharacterId: string | null;
  roundCounter: number;
  onEndTurn: () => void;
  onUpdateInitiativeScore: (characterId: string, newScore: number) => void;
  getCharacterById: (characterId: string) => Character | undefined;
  getItemById: (itemId: string) => Item | undefined; // Added to get weapon details
  onOpenSheet: (characterId: string) => void;
  combatState: 'none' | 'pre-combat' | 'active'; 
  onSendMessage: (messageText: string, type?: 'message' | 'roll' | 'info') => void; 
  heldActions: Record<string, HeldAction | null>;
  onSetHeldAction: (characterId: string, actionName: string, triggerDescription: string) => void;
  onUseHeldAction: (characterId: string) => void;
  onInitiateAttack: (attackerId: string, action: ActionDetail) => void;
}

export const CombatTab: React.FC<CombatTabProps> = ({
  currentUser,
  characters, 
  initiativeOrder,
  currentTurnCharacterId,
  roundCounter,
  onEndTurn,
  onUpdateInitiativeScore,
  getCharacterById,
  getItemById, // Added
  onOpenSheet,
  combatState,
  onSendMessage,
  heldActions,
  onSetHeldAction,
  onUseHeldAction,
  onInitiateAttack,
}) => {
  
  const [showHoldActionForm, setShowHoldActionForm] = useState(false);
  const [holdActionNameInput, setHoldActionNameInput] = useState('');
  const [holdActionTriggerInput, setHoldActionTriggerInput] = useState('');

  const combatants = initiativeOrder
    .map(id => getCharacterById(id))
    .filter(Boolean) as Character[];

  const currentTurnActor = currentTurnCharacterId ? getCharacterById(currentTurnCharacterId) : null;

  const handleInitiativeChange = (charId: string, value: string) => {
    const score = parseInt(value, 10);
    if (!isNaN(score)) {
      onUpdateInitiativeScore(charId, score);
    } else if (value === "") { 
        onUpdateInitiativeScore(charId, 0); 
    }
  };

  const handleConfirmHoldAction = () => {
    if (currentTurnCharacterId && holdActionNameInput.trim() && holdActionTriggerInput.trim()) {
      onSetHeldAction(currentTurnCharacterId, holdActionNameInput.trim(), holdActionTriggerInput.trim());
      setShowHoldActionForm(false);
      setHoldActionNameInput('');
      setHoldActionTriggerInput('');
    }
  };

  if (combatState === 'none') { 
    return <p className="p-4 text-gray-500 italic">No active combat or pre-combat setup. Start by clicking "Roll Initiative!" on the main map.</p>;
  }
  
  if (combatState !== 'pre-combat' && combatState !== 'active' && combatants.length === 0) {
     return <p className="p-4 text-gray-500 italic">No combatants.</p>;
  }


  const getRoundDisplay = () => {
    if (combatState === 'pre-combat') return "Pre-Combat Setup";
    if (combatState === 'active') return `Round ${roundCounter}`;
    return "Combat";
  }
  
  const canControlCurrentActor = currentTurnActor && (currentUser.isDM || currentTurnActor.ownerPlayerId === currentUser.id);
  const currentActorHasHeldAction = currentTurnActor && heldActions[currentTurnActor.id];

  const generateAttackActionFromWeapon = (actor: Character): ActionDetail | null => {
    const mainHandItemId = actor.equippedItems.mainHand;
    if (!mainHandItemId) return null;
    const weapon = getItemById(mainHandItemId);
    if (!weapon || weapon.itemCategory !== 'weapon' || !weapon.damage || weapon.damage.length === 0) return null;

    let ability: 'strength' | 'dexterity' = 'strength'; // Default for melee
    let range = "5 ft."; // Default melee range

    if (weapon.properties?.includes('Finesse')) {
      ability = actor.abilityScores.strength > actor.abilityScores.dexterity ? 'strength' : 'dexterity';
    }
    if (weapon.properties?.some(p => p.toLowerCase().includes('range'))) { // Simple check for ranged/thrown
      ability = 'dexterity'; // Default for ranged
      if (weapon.properties?.includes('Finesse') && weapon.properties?.some(p => p.toLowerCase().includes('thrown'))) {
        // Finesse + Thrown can use STR or DEX
         ability = actor.abilityScores.strength > actor.abilityScores.dexterity ? 'strength' : 'dexterity';
      }
      const rangeMatch = weapon.properties.find(p => p.toLowerCase().startsWith('range'))?.match(/\(([^)]+)\)/);
      range = rangeMatch ? rangeMatch[1] : "20/60 ft."; // Default thrown/ranged
    }
    
    // Use weapon damage dice, but ability modifier will be added by rollDice in buildDamageRollCommand
    const damageEntries = weapon.damage.map(d => ({
        ...d,
        dice: `${d.dice}${ability === 'strength' ? '+STR' : '+DEX'}` // Simplification, real parsing is harder
    }));


    return {
      id: `weapon_attack_${weapon.id}`,
      name: `Attack with ${weapon.name}`,
      description: `Make an attack with your equipped ${weapon.name}.`,
      actionCategory: 'action',
      isAttack: true,
      attackSettings: { ability, proficient: true, bonus: 0 }, // Assume proficiency with equipped weapon
      range,
      target: 'one target',
      damage: weapon.damage, // Pass original damage for buildDamageRollCommand
      effects: weapon.effects,
      source: weapon.name,
    };
  };

  const unarmedStrikeAction: ActionDetail = {
    id: 'unarmed_strike_action',
    name: 'Unarmed Strike',
    description: 'Make an unarmed strike.',
    actionCategory: 'action',
    isAttack: true,
    attackSettings: { ability: 'strength', proficient: true, bonus: 0 },
    range: '5 ft.',
    target: 'one target',
    damage: [{ id: generateId('dmg_unarmed'), dice: '1+STR', type: 'Bludgeoning' }],
    source: 'Generic Action',
  };

  const renderActionList = (title: string, actions: {name: string, description: string, originalAction?: ActionDetail}[], category: ActionDetail['actionCategory'] | 'standard' = 'standard') => (
    <div className="md:w-1/3">
      <p className="font-medium text-gray-400 mb-0.5">{title}:</p>
      <ul className="list-none pl-0 space-y-0.5">
        {actions.map((actionEntry) => {
          const canPerform = combatState === 'active' && currentTurnActor && canControlCurrentActor && !showHoldActionForm && !currentActorHasHeldAction;
          let actionToInitiate: ActionDetail | undefined = actionEntry.originalAction;

          // Special handling for the generic "Attack" action
          if (actionEntry.name === "Attack" && currentTurnActor) {
            actionToInitiate = generateAttackActionFromWeapon(currentTurnActor) || unarmedStrikeAction;
          }
          
          if (actionToInitiate?.isAttack && canPerform) {
            return (
              <li key={actionEntry.name}>
                <button
                  onClick={() => onInitiateAttack(currentTurnActor.id, actionToInitiate!)}
                  className="w-full text-left px-1.5 py-0.5 bg-red-700 hover:bg-red-600 text-red-100 text-xs rounded shadow-sm transition-colors"
                  title={`Target with: ${actionToInitiate.name}\n${actionToInitiate.description}`}
                >
                  {actionToInitiate.name}
                </button>
              </li>
            );
          }
          return (
            <li key={actionEntry.name} className="text-gray-300 truncate pl-1" title={actionEntry.description}>
              {actionEntry.name}
            </li>
          );
        })}
      </ul>
    </div>
  );

  const standardActions = STANDARD_ACTIONS_5E.map(a => ({ ...a, originalAction: currentTurnActor?.actions.find(ca => ca.name.toLowerCase() === a.name.toLowerCase() && ca.actionCategory === 'action') }));
  
  const characterActions = currentTurnActor?.actions
    .filter(action => action.actionCategory === 'action' && !STANDARD_ACTIONS_5E.some(sa => sa.name.toLowerCase() === action.name.toLowerCase()))
    .map(action => ({ name: action.name, description: action.description, originalAction: action })) || [];

  const combinedMainActions = [...standardActions, ...characterActions];

  const characterBonusActions = currentTurnActor?.actions
    .filter(action => action.actionCategory === 'bonus_action')
    .map(action => ({ name: action.name, description: action.description, originalAction: action })) || [];
  const genericBonusActions = GENERIC_BONUS_ACTIONS_5E.map(a => ({...a}));
  const combinedBonusActions = [...genericBonusActions, ...characterBonusActions];


  const characterReactions = currentTurnActor?.actions
    .filter(action => action.actionCategory === 'reaction')
    .map(action => ({ name: action.name, description: action.description, originalAction: action })) || [];
  const genericReactions = GENERIC_REACTIONS_5E.map(a => ({...a}));
  const combinedReactions = [...genericReactions, ...characterReactions];


  return (
    <div className="p-2 text-sm h-full flex flex-col">
      {/* Header: Round Display & End Turn Button */}
      <div className="flex justify-between items-center mb-2 flex-shrink-0 space-x-2">
        <h3 className="text-lg font-semibold text-indigo-300">{getRoundDisplay()}</h3>
        <div className="flex items-center space-x-2">
            {currentUser.isDM && combatState === 'active' && (
                <button
                    onClick={() => onSendMessage("DM: Does anyone want to use a Reaction? (Declare to DM)", 'info')}
                    className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold rounded shadow-md transition-colors"
                    title="Ask players if they want to use a reaction"
                >
                    Prompt Reaction?
                </button>
            )}
            {combatState === 'active' && currentTurnActor && canControlCurrentActor && !showHoldActionForm && (
            <button
                onClick={onEndTurn}
                disabled={!currentTurnCharacterId || combatState !== 'active'} 
                className={`px-3 py-1.5 text-white text-xs font-semibold rounded shadow-md transition-colors
                            ${(!currentTurnCharacterId || combatState !== 'active') 
                                ? 'bg-gray-500 cursor-not-allowed' 
                                : 'bg-green-600 hover:bg-green-700'}`}
            >
                End Turn
            </button>
            )}
        </div>
      </div>

      {/* Main content area: Two columns */}
      <div className="flex flex-row flex-grow overflow-hidden">
        
        {/* Left Column: Initiative List */}
        <div className="w-2/5 flex-shrink-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-2">
          <h4 className="text-md font-medium text-gray-300 mb-1 sticky top-0 bg-gray-850 py-1 z-10">Initiative Order</h4>
          {combatants.length === 0 && <p className="text-gray-500 italic text-xs px-1">No combatants yet.</p>}
          <ul className="space-y-1">
            {combatants.map((char) => {
              const charHeldAction = heldActions[char.id];
              const canUseHeldAction = charHeldAction && (currentUser.isDM || char.ownerPlayerId === currentUser.id);
              return (
              <li
                key={char.id}
                className={`p-2 rounded-md flex flex-col transition-all duration-150
                  ${combatState === 'active' && char.id === currentTurnCharacterId ? 'bg-indigo-700 ring-2 ring-indigo-400 shadow-lg' : 'bg-gray-700 hover:bg-gray-650'}
                  ${char.currentHp <= 0 ? 'opacity-60' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-grow overflow-hidden">
                    <span 
                        className={`font-semibold cursor-pointer hover:underline ${combatState === 'active' && char.id === currentTurnCharacterId ? 'text-white' : 'text-indigo-300'}`}
                        onClick={() => onOpenSheet(char.id)}
                        title={`View ${char.name}'s sheet`}
                    >
                        {char.name} {char.currentHp <= 0 ? '(Down)' : ''}
                    </span>
                    {currentUser.isDM && (
                      <p className={`text-xs ${combatState === 'active' && char.id === currentTurnCharacterId ? 'text-indigo-200' : 'text-gray-400'}`}>
                        HP: {char.currentHp}/{char.maxHp}, AC: {char.armorClass}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {currentUser.isDM ? (
                      <input
                        type="number"
                        value={char.initiative === undefined ? '' : char.initiative}
                        onChange={(e) => handleInitiativeChange(char.id, e.target.value)}
                        className={`w-12 p-1 text-xs rounded bg-gray-600 text-center focus:ring-1 focus:ring-indigo-400 outline-none ${combatState === 'active' && char.id === currentTurnCharacterId ? 'text-white placeholder-gray-300' : 'text-gray-200 placeholder-gray-400'}`}
                        placeholder="Init"
                      />
                    ) : (
                      <span className={`px-2 py-1 text-sm font-bold rounded ${combatState === 'active' && char.id === currentTurnCharacterId ? 'text-white' : 'text-indigo-300'}`}>
                        {char.initiative}
                      </span>
                    )}
                  </div>
                </div>
                {charHeldAction && (
                  <div className={`mt-1.5 pt-1.5 border-t text-xs ${combatState === 'active' && char.id === currentTurnCharacterId ? 'border-indigo-500' : 'border-gray-600'}`}>
                    <p className={`${combatState === 'active' && char.id === currentTurnCharacterId ? 'text-indigo-100' : 'text-gray-300'}`}>
                      <span className="font-semibold">Holding:</span> {charHeldAction.actionName}
                    </p>
                    <p className={`${combatState === 'active' && char.id === currentTurnCharacterId ? 'text-indigo-200' : 'text-gray-400'}`}>
                      <span className="font-semibold">Trigger:</span> {charHeldAction.triggerDescription}
                    </p>
                    {combatState === 'active' && canUseHeldAction && (
                      <button
                        onClick={() => onUseHeldAction(char.id)}
                        className="mt-1 px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white text-xxs font-semibold rounded shadow transition-colors"
                      >
                        Use Held Action
                      </button>
                    )}
                  </div>
                )}
              </li>
            )})}
          </ul>
        </div>

        {/* Right Column: Current Turn Actor Details / Pre-combat message */}
        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pl-2">
          {combatState === 'active' && currentTurnActor && (
            <div className="h-full">
              <h4 className="text-md font-semibold text-yellow-400 mb-1 sticky top-0 bg-gray-850 py-1 z-10">
                Current Turn: {currentTurnActor.name}
                {currentTurnActor.ownerPlayerId === currentUser.id && !currentUser.isDM && " (Your Turn!)"}
              </h4>
              
              {showHoldActionForm && canControlCurrentActor && (
                <div className="my-2 p-2 bg-gray-750 rounded border border-gray-600">
                  <h5 className="text-sm font-semibold text-yellow-300 mb-1">Ready an Action</h5>
                  <input 
                    type="text" 
                    placeholder="Action to ready (e.g., Attack Orc)" 
                    value={holdActionNameInput}
                    onChange={(e) => setHoldActionNameInput(e.target.value)}
                    className="w-full p-1.5 mb-1 bg-gray-700 border border-gray-600 rounded text-xs placeholder-gray-400"
                  />
                  <textarea 
                    placeholder="Trigger (e.g., If Orc moves into melee)" 
                    value={holdActionTriggerInput}
                    onChange={(e) => setHoldActionTriggerInput(e.target.value)}
                    rows={2}
                    className="w-full p-1.5 mb-1 bg-gray-700 border border-gray-600 rounded text-xs resize-none placeholder-gray-400"
                  />
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowHoldActionForm(false)} className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-gray-200 text-xs rounded">Cancel</button>
                    <button onClick={handleConfirmHoldAction} className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded">Confirm Hold</button>
                  </div>
                </div>
              )}

              {!showHoldActionForm && canControlCurrentActor && !currentActorHasHeldAction && combatState === 'active' && (
                <button 
                  onClick={() => setShowHoldActionForm(true)}
                  className="my-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded shadow-md transition-colors w-full"
                >
                  Hold an Action
                </button>
              )}
              {currentActorHasHeldAction && (
                 <p className="my-1 p-2 bg-gray-750 border border-yellow-500 rounded text-yellow-300 text-xs italic">
                   You are holding an action: '{heldActions[currentTurnActor.id]?.actionName}'. It will expire at the start of your next turn if not used.
                 </p>
              )}


              <div className="text-xs space-y-1 mt-1">
                <p><span className="font-medium text-gray-400">Movement:</span> {currentTurnActor.currentMovement ?? currentTurnActor.speed} / {currentTurnActor.speed} ft.</p>
                {currentUser.isDM && <p><span className="font-medium text-gray-400">HP:</span> {currentTurnActor.currentHp}/{currentTurnActor.maxHp} | <span className="font-medium text-gray-400">AC:</span> {currentTurnActor.armorClass}</p>}
                
                <div className="flex flex-col md:flex-row mt-1 space-y-2 md:space-y-0 md:space-x-2">
                  {renderActionList("Main Actions", combinedMainActions, 'action')}
                  {renderActionList("Bonus Actions", combinedBonusActions, 'bonus_action')}
                  {renderActionList("Reactions", combinedReactions, 'reaction')}
                </div>

              </div>
            </div>
          )}
          {combatState === 'active' && !currentTurnActor && initiativeOrder.length > 0 && (
             <p className="text-yellow-500 italic mt-4">Waiting for turn to start or an error occurred.</p>
          )}
           {combatState === 'active' && initiativeOrder.length === 0 && (
             <p className="text-gray-400 italic mt-4">No combatants in the order. Add characters to the map or end combat.</p>
          )}
          {combatState === 'pre-combat' && (
              <div className="h-full">
                 <h4 className="text-md font-semibold text-yellow-300 mb-1 sticky top-0 bg-gray-850 py-1 z-10">Pre-Combat Instructions</h4>
                 <p className="text-gray-400 italic whitespace-pre-wrap">
                    Position tokens on the map. Initiative has been rolled for characters on the map.
                    You can adjust initiative scores manually.
                    When ready, click 'Start Combat' on the map overlay.
                 </p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
