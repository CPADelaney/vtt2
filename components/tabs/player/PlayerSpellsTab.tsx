
import React, { useState, useRef } from 'react';
import { Character, ActionDetail, PlayerSpellsTabProps } from '../../../types';
// FIX: Added buildDamageRollCommand to import
import { getAbilityModifier, calculateProficiencyBonus, requiresMapTargeting, buildDamageRollCommand } from '../../../utils';
import { SpellDetailPopup } from '../../SpellDetailPopup';
import { Tooltip } from '../../Tooltip';

interface PlayerSpellsTabPropsExtended extends PlayerSpellsTabProps {
  onInitiateSpellTargeting: (casterId: string, spell: ActionDetail) => void;
}


const spellLevelOrder = ["Cantrip", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
const statBoxClass = "p-2 bg-gray-700 rounded text-center shadow";
const statLabelClass = "text-xs text-gray-400 uppercase";
const statValueClass = "text-indigo-300 font-bold text-lg";

export const PlayerSpellsTab: React.FC<PlayerSpellsTabPropsExtended> = ({ 
    activePlayerCharacter, 
    onUpdateSpellSlot, 
    onSendMessage,
    areTooltipsEnabled = true,
    onInitiateSpellTargeting 
}) => {
  const [popupSpell, setPopupSpell] = useState<ActionDetail | null>(null);
  const [popupPositionRef, setPopupPositionRef] = useState<React.RefObject<HTMLElement> | null>(null);
  const [expandedSpellLevels, setExpandedSpellLevels] = useState<Record<string, boolean>>({ 
    "Cantrip": true, "1st": true, "2nd": true, "3rd": false, "4th": false, 
    "5th": false, "6th": false, "7th": false, "8th": false, "9th": false 
  });

  if (!activePlayerCharacter) {
    return <p className="p-4 text-gray-500 italic">No active character selected. Go to the 'Characters' tab to select one.</p>;
  }

  const char = activePlayerCharacter;
  const profBonus = char.proficiencyBonus || calculateProficiencyBonus(char.level);
  
  const spellcastingAbilityMod = char.spellcastingAbility 
    ? getAbilityModifier(char.abilityScores[char.spellcastingAbility]) 
    : 0;
    
  const spellSaveDC = char.spellSaveDC || (8 + profBonus + spellcastingAbilityMod);
  const spellAttackBonus = char.spellAttackBonus || (profBonus + spellcastingAbilityMod);

  const spells = char.actions.filter(action => action.actionCategory === 'spell');
  
  const spellsByLevel: { [level: string]: ActionDetail[] } = {};
  spellLevelOrder.forEach(lvl => spellsByLevel[lvl] = []);
  spells.forEach(spell => {
    const levelKey = spell.spellLevel || "Unknown";
    if (!spellsByLevel[levelKey]) spellsByLevel[levelKey] = [];
    spellsByLevel[levelKey].push(spell);
  });
  
  const handleOpenSpellPopup = (spell: ActionDetail, event: React.MouseEvent) => {
    event.stopPropagation(); 
    const buttonElement = event.currentTarget as HTMLElement;
    const ref = React.createRef<HTMLElement>();
    (ref as any).current = buttonElement; 
    setPopupPositionRef(ref);
    setPopupSpell(spell);
  };

  const handleCloseSpellPopup = () => {
    setPopupSpell(null);
    setPopupPositionRef(null);
  };

  const handleCastSpell = (spell: ActionDetail) => {
    if (!char) return;

    if (requiresMapTargeting(spell)) {
      onInitiateSpellTargeting(char.id, spell);
      handleCloseSpellPopup(); 
    } else {
      // For non-targetable spells (self, etc.)
      if (onSendMessage) {
        onSendMessage(`${char.name} casts ${spell.name}.`, 'info');
        // If spell has damage/effects not requiring a map target, could roll here
        if (spell.damage && spell.damage.length > 0 && !spell.isAttack && !spell.description.toLowerCase().includes("saving throw")) {
             const damageRollCommand = buildDamageRollCommand(spell.damage, char.abilityScores, false);
             onSendMessage(`/roll ${damageRollCommand} for ${spell.name} effect`, 'roll');
        }
      }
      if (spell.spellLevel && spell.spellLevel.toLowerCase() !== "cantrip") {
        const levelKey = spell.spellLevel.match(/\d+/)?.[0] || spell.spellLevel.toLowerCase();
        onUpdateSpellSlot(levelKey, -1);
      }
      handleCloseSpellPopup();
    }
  };

  const toggleLevelExpanded = (level: string) => {
    setExpandedSpellLevels(prev => ({ ...prev, [level]: !prev[level] }));
  };
  
  const isConcentrationSpell = (spell: ActionDetail): boolean => {
    return !!spell.duration?.toLowerCase().includes('concentration');
  };

  const renderSpellLevelCard = (level: string, cardClassName: string = "flex-1 min-w-[180px]") => {
    const levelSpells = spellsByLevel[level] || [];
    const slots = level.toLowerCase() === "cantrip" ? null : char.spellSlots?.[level.match(/\d+/)?.[0] || level.toLowerCase()];
    const isExpanded = expandedSpellLevels[level] || false;

    if (level === "Cantrip" && levelSpells.length === 0 && !char.spellSlots) return null; 
    if (level !== "Cantrip" && !slots && levelSpells.length === 0) return null; 
    
    const levelKeyForSlots = level.match(/\d+/)?.[0] || level.toLowerCase();

    return (
      <div key={level} className={`bg-gray-750 rounded-md shadow-sm ${cardClassName}`}>
        <div 
          className="p-2 flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors rounded-t-md"
          onClick={() => toggleLevelExpanded(level)}
          aria-expanded={isExpanded}
          aria-controls={`spell-level-content-${level}`}
        >
          <h4 className="text-md font-semibold text-gray-300">
              <span className={`inline-block mr-2 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}>►</span>
              {level}{level !== "Cantrip" ? " Level" : ""}
          </h4>
          {slots && (
            <div className="flex items-center space-x-1">
              <Tooltip enabled={areTooltipsEnabled} content="Decrement spell slot.">
                <button 
                    onClick={(e) => {e.stopPropagation(); onUpdateSpellSlot(levelKeyForSlots, -1);}} 
                    disabled={slots.current <= 0}
                    className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xxs rounded disabled:opacity-50"
                    aria-label={`Use a ${level} level slot`}
                >-</button>
              </Tooltip>
              <Tooltip enabled={areTooltipsEnabled} content="Visual spell slot tracker. Filled dots are available slots.">
                <div className="flex space-x-1 items-center mx-1"> 
                  {[...Array(slots.max)].map((_, i) => (
                    <span key={i} className={`w-2.5 h-2.5 rounded-full transition-colors duration-150 ${i < slots.current ? 'bg-indigo-400' : 'bg-transparent border-2 border-gray-500'}`}></span>
                  ))}
                </div>
              </Tooltip>
              <Tooltip enabled={areTooltipsEnabled} content="Increment spell slot.">
                <button 
                    onClick={(e) => {e.stopPropagation(); onUpdateSpellSlot(levelKeyForSlots, +1);}} 
                    disabled={slots.current >= slots.max}
                    className="px-1.5 py-0.5 bg-green-600 hover:bg-green-700 text-white text-xxs rounded disabled:opacity-50"
                    aria-label={`Regain a ${level} level slot`}
                >+</button>
              </Tooltip>
            </div>
          )}
        </div>
        {isExpanded && (
          <div id={`spell-level-content-${level}`} className="p-2 border-t border-gray-700">
            {levelSpells.length === 0 && <p className="text-xs text-gray-500 italic ml-2">No spells known/prepared for this level.</p>}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
              {levelSpells.map(spell => (
                <li key={spell.id} className="p-1.5 bg-gray-700 rounded-md hover:bg-gray-650 transition-colors text-xs flex items-center justify-between">
                  <div className="flex items-center flex-grow overflow-hidden">
                    {isConcentrationSpell(spell) && (
                      <Tooltip enabled={areTooltipsEnabled} content="Requires Concentration">
                        <span className="mr-1.5 text-yellow-400 font-bold text-xxs border border-yellow-500/50 rounded-sm px-0.5 py-px">C</span>
                      </Tooltip>
                    )}
                    {spell.isRitual && (
                      <Tooltip enabled={areTooltipsEnabled} content="Ritual Spell">
                        <span className="mr-1.5 text-sky-400 font-bold text-xxs border border-sky-500/50 rounded-sm px-0.5 py-px">R</span>
                      </Tooltip>
                    )}
                    <span 
                      className="font-medium text-indigo-300 cursor-pointer hover:underline truncate"
                      onClick={() => handleCastSpell(spell)}
                      title={`Cast ${spell.name}`}
                    >
                      {spell.name}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => handleOpenSpellPopup(spell, e)}
                    className="ml-2 px-1.5 py-0.5 text-gray-400 hover:text-white focus:outline-none flex-shrink-0"
                    aria-label={`View details for ${spell.name}`}
                  >
                    &#x2026; 
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const spellLevelLayoutRows = [
      ["Cantrip", "1st"],
      ["2nd", "3rd"],
      ["4th", "5th"],
      ["6th", "7th"],
      ["8th", "9th"]
  ];

  return (
    <div className="p-2 text-sm h-full flex text-gray-200">
      
      <div className="flex-shrink-0 w-28 mr-3 space-y-2">
        <Tooltip enabled={areTooltipsEnabled} content="Your Spell Save DC is 8 + Proficiency Bonus + Spellcasting Ability Modifier.">
            <div className={statBoxClass}>
                <div className={statLabelClass}>Save DC</div>
                <div className={statValueClass}>{spellSaveDC}</div>
            </div>
        </Tooltip>
        <Tooltip enabled={areTooltipsEnabled} content="Your Spell Attack Bonus is Proficiency Bonus + Spellcasting Ability Modifier.">
            <div className={statBoxClass}>
                <div className={statLabelClass}>Spell Atk</div>
                <div className={statValueClass}>+{spellAttackBonus}</div>
            </div>
        </Tooltip>
        {char.spellcastingAbility && (
            <Tooltip enabled={areTooltipsEnabled} content={`Your spellcasting ability is ${char.spellcastingAbility.charAt(0).toUpperCase() + char.spellcastingAbility.slice(1)}.`}>
                <div className={statBoxClass}>
                    <div className={statLabelClass}>Ability</div>
                    <div className={`${statValueClass} capitalize`}>{char.spellcastingAbility.slice(0,3)}</div>
                </div>
            </Tooltip>
        )}
      </div>

      
      <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-1 space-y-2">
        <h3 className="text-xl font-semibold text-indigo-400 mb-1 flex-shrink-0">Spells</h3>
        {spellLevelLayoutRows.map((row, rowIndex) => (
            <div key={`spell-layout-row-${rowIndex}`} className="flex gap-2">
                {row.map(level => renderSpellLevelCard(level, "flex-1 min-w-[calc(50%-0.25rem)]"))} {}
            </div>
        ))}
      </div>

      {popupSpell && (
        <SpellDetailPopup
          spell={popupSpell}
          isOpen={!!popupSpell}
          onClose={handleCloseSpellPopup}
          positionRef={popupPositionRef}
        />
      )}
    </div>
  );
};