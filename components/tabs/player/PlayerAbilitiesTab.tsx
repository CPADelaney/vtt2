
import React, { useState } from 'react';
import { Character, ActionDetail, PlayerAbilitiesTabProps, AdvantageDisadvantageSetting } from '../../../types'; // Added PlayerAbilitiesTabProps & AdvantageDisadvantageSetting

type AbilitySubTab = 'class_features' | 'racial_traits' | 'feats' | 'proficiencies' | 'reactions';

export const PlayerAbilitiesTab: React.FC<PlayerAbilitiesTabProps> = ({ 
  activePlayerCharacter, 
  onSendMessage, 
  setGlobalAdvantageState,
  onCastReactionAbility,
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<AbilitySubTab>('class_features');
  const [expandedAbilityId, setExpandedAbilityId] = useState<string | null>(null);

  if (!activePlayerCharacter) {
    return <p className="p-4 text-gray-500 italic">No active character selected.</p>;
  }

  const char = activePlayerCharacter;

  const filterActionsByCategory = (category: ActionDetail['actionCategory']) => {
    return char.actions.filter(action => action.actionCategory === category && !action.isAttack);
  };
  
  const reactionAbilities = char.actions.filter(action => action.actionCategory === 'reaction');

  const classFeatures = filterActionsByCategory('class_feature');
  const racialTraits = filterActionsByCategory('racial_trait');
  const feats = filterActionsByCategory('feat');
  const otherAbilities = filterActionsByCategory('other');

  let abilitiesToDisplay: ActionDetail[] = [];
  if (currentSubTab === 'class_features') abilitiesToDisplay = classFeatures;
  else if (currentSubTab === 'racial_traits') abilitiesToDisplay = racialTraits;
  else if (currentSubTab === 'feats') abilitiesToDisplay = feats;
  else if (currentSubTab === 'reactions') abilitiesToDisplay = reactionAbilities;
  
  if (currentSubTab === 'class_features' || currentSubTab === 'racial_traits') {
      abilitiesToDisplay = [...abilitiesToDisplay, ...otherAbilities.filter(oa => 
          !abilitiesToDisplay.some(ad => ad.id === oa.id) 
      )];
  }


  const toggleExpandAbility = (abilityId: string) => {
    setExpandedAbilityId(prev => (prev === abilityId ? null : abilityId));
  };

  const handleUseAbility = (ability: ActionDetail) => {
    if (ability.actionCategory === 'reaction' && onCastReactionAbility) {
        onCastReactionAbility(char.id, ability);
        return;
    }

    if (onSendMessage) {
      onSendMessage(`${char.name} uses ${ability.name}.`, 'info');
    }
    if (ability.grantsCasterAdvantageOnNextAttack && setGlobalAdvantageState) {
      setGlobalAdvantageState('advantage');
      if (onSendMessage) {
        onSendMessage(`${char.name} gains advantage on their next attack roll.`, 'info');
      }
    }
  };

  const renderAbilityList = (abilities: ActionDetail[]) => {
    if (abilities.length === 0) {
      return <p className="text-gray-500 italic">No abilities in this category.</p>;
    }
    return (
      <ul className="space-y-2">
        {abilities.map(ability => {
          const canUseAbility = 
            (ability.actionCategory === 'reaction' && onCastReactionAbility) || 
            (onSendMessage && setGlobalAdvantageState && (ability.grantsCasterAdvantageOnNextAttack || ability.actionCategory !== 'spell'));
          
          let buttonText = "Use";
          if (ability.actionCategory === 'reaction' && ability.name.toLowerCase().includes("shield")) {
            buttonText = "Cast Shield";
          }

          return (
            <li key={ability.id} className="p-2 bg-gray-700 rounded-md hover:bg-gray-650 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-grow cursor-pointer" onClick={() => toggleExpandAbility(ability.id)}>
                  <span className="font-medium text-indigo-300">{ability.name}</span>
                </div>
                {canUseAbility && ( 
                  <button 
                    onClick={() => handleUseAbility(ability)}
                    className="ml-2 px-2 py-0.5 bg-sky-600 hover:bg-sky-700 text-white text-xxs rounded shadow-sm"
                  >
                    {buttonText}
                  </button>
                )}
                <button 
                  onClick={() => toggleExpandAbility(ability.id)}
                  className="ml-2 px-1.5 py-0.5 text-gray-400 hover:text-white focus:outline-none"
                  aria-label={`View details for ${ability.name}`}
                >
                  <span className={`text-xs transition-transform duration-150 ${expandedAbilityId === ability.id ? 'rotate-90' : ''}`}>►</span>
                </button>
              </div>
              {expandedAbilityId === ability.id && (
                <div className="mt-1.5 pt-1.5 border-t border-gray-600 text-xs text-gray-300">
                  <p className="whitespace-pre-wrap">{ability.description || "No description."}</p>
                  {ability.source && <p className="mt-1 text-gray-400 italic text-xxs">Source: {ability.source}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const renderProficiencyList = (title: string, proficiencies?: string) => {
    if (!proficiencies || proficiencies.trim() === "") {
        return <p className="text-gray-500 italic text-xs">{title}: None listed.</p>;
    }
    const list = proficiencies.split(',').map(p => p.trim()).filter(p => p);
    return (
      <div>
        <h4 className="font-medium text-gray-300 mb-1">{title}:</h4>
        {list.length > 0 ? (
            <ul className="list-disc list-inside ml-2 space-y-0.5 text-gray-200 text-xs">
            {list.map((prof, index) => (
                <li key={`${title}-${index}`}>{prof}</li>
            ))}
            </ul>
        ) : (
             <p className="text-gray-500 italic text-xs">None listed.</p>
        )}
      </div>
    );
  };
  
  const subTabButtonClass = (tabName: AbilitySubTab) => 
    `px-3 py-1.5 text-xs font-medium focus:outline-none transition-colors duration-150 rounded-t-md
     ${currentSubTab === tabName 
       ? 'border-l border-t border-r border-gray-700 bg-gray-750 text-indigo-400' 
       : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
     }`;

  return (
    <div className="p-2 text-sm h-full flex flex-col">
      <div className="flex mb-3 border-b border-gray-700 flex-shrink-0 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pb-px">
        <button onClick={() => setCurrentSubTab('class_features')} className={subTabButtonClass('class_features')}>
          Class Features
        </button>
        <button onClick={() => setCurrentSubTab('racial_traits')} className={`${subTabButtonClass('racial_traits')} ml-1`}>
          Racial Traits
        </button>
        <button onClick={() => setCurrentSubTab('feats')} className={`${subTabButtonClass('feats')} ml-1`}>
          Feats
        </button>
        <button onClick={() => setCurrentSubTab('reactions')} className={`${subTabButtonClass('reactions')} ml-1`}>
          Reactions
        </button>
         <button onClick={() => setCurrentSubTab('proficiencies')} className={`${subTabButtonClass('proficiencies')} ml-1`}>
          Proficiencies
        </button>
      </div>

      <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-1">
        {currentSubTab !== 'proficiencies' && renderAbilityList(abilitiesToDisplay)}
        {currentSubTab === 'proficiencies' && (
            <div className="space-y-3 p-1">
                {renderProficiencyList("Languages", char.languages)}
                {renderProficiencyList("Weapon Proficiencies", char.weaponProficiencies)}
                {renderProficiencyList("Armor Proficiencies", char.armorProficiencies)}
                {renderProficiencyList("Tool & Other Proficiencies", char.toolProficiencies)}
            </div>
        )}
      </div>
    </div>
  );
};
