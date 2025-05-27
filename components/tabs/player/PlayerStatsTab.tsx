
import React, { useState } from 'react';
import { Character, AbilityScores, PlayerStatsTabProps } from '../../../types';
import { getAbilityModifier, calculateProficiencyBonus, calculatePassiveScore, getEffectiveAC } from '../../../utils';
import { DND_ABILITY_SCORES_LIST } from '../../../constants';
import { DeathSaveTracker } from '../../DeathSaveTracker';
import { Tooltip } from '../../Tooltip'; 

const statBoxClass = "bg-gray-750 p-2 rounded-lg shadow-sm text-center flex flex-col justify-center items-center";
const statLabelClass = "text-xs text-gray-400 uppercase tracking-wider mb-0.5";
const statValueClass = "text-lg font-bold text-indigo-300";
const buttonClass = "px-2.5 py-1 text-xs font-medium rounded-md transition-colors";
const tinyButtonBaseClass = "flex-1 px-1.5 py-0.5 text-xxs text-white rounded-md shadow-sm transition-colors";

export const PlayerStatsTab: React.FC<PlayerStatsTabProps> = ({ activePlayerCharacter, onUpdateHitDice, onUpdateDeathSaves, onSendMessage, areTooltipsEnabled }) => {
  const [isSensesExpanded, setIsSensesExpanded] = useState(false);

  if (!activePlayerCharacter) {
    return <p className="p-4 text-gray-500 italic">No active character selected. Go to the 'Characters' tab to select one.</p>;
  }

  const char = activePlayerCharacter;
  const profBonus = char.proficiencyBonus || calculateProficiencyBonus(char.level);

  const passivePerception = calculatePassiveScore(char, 'perception', profBonus);
  const passiveInvestigation = calculatePassiveScore(char, 'investigation', profBonus);
  const passiveInsight = calculatePassiveScore(char, 'insight', profBonus);
  const effectiveAC = getEffectiveAC(char);

  const characterDetails = [
    `Lvl ${char.level}`,
    char.class,
    char.subclass,
    char.background,
    char.race,
  ].filter(Boolean).join(' | ');

  const handleRollStat = (abilityName: keyof AbilityScores) => {
    if (!onSendMessage || !char) return;
    const abilityMod = getAbilityModifier(char.abilityScores[abilityName]);
    const rollExpression = `1d20${abilityMod >= 0 ? '+' : ''}${abilityMod}`;
    const command = `/roll ${rollExpression} for ${abilityName.charAt(0).toUpperCase() + abilityName.slice(1)} Check`;
    onSendMessage(command, 'roll');
  };

  const handleRollSave = (abilityName: keyof AbilityScores) => {
    if (!onSendMessage || !char) return;
    const abilityMod = getAbilityModifier(char.abilityScores[abilityName]);
    const isProficient = char.savingThrowProficiencies?.[abilityName] || false;
    const saveBonus = abilityMod + (isProficient ? profBonus : 0);
    const rollExpression = `1d20${saveBonus >= 0 ? '+' : ''}${saveBonus}`;
    const command = `/roll ${rollExpression} for ${abilityName.charAt(0).toUpperCase() + abilityName.slice(1)} Save`;
    onSendMessage(command, 'roll');
  };

  const acTooltipContent = () => {
    let content = `Base AC: ${char.armorClass}.`;
    if (char.temporaryEffects && char.temporaryEffects.some(eff => eff.type === 'ac_bonus' && eff.value)) {
      const bonusSources = char.temporaryEffects
        .filter(eff => eff.type === 'ac_bonus' && eff.value)
        .map(eff => `${eff.value! >= 0 ? '+' : ''}${eff.value} from ${eff.sourceName}`)
        .join(', ');
      content += `\nBonuses: ${bonusSources}.\nEffective AC: ${effectiveAC}.`;
    } else {
      content += `\nEffective AC: ${effectiveAC}.`;
    }
    return content;
  };


  return (
    <div className="p-2 space-y-3 text-sm text-gray-200 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
      <div className="text-center mb-2">
        <h3 className="text-2xl font-semibold text-indigo-400">{char.name}</h3>
        {characterDetails && <p className="text-xs text-gray-400 mt-0.5">{characterDetails}</p>}
      </div>

      <div className="flex flex-row gap-3">
        <div className="w-1/4 space-y-1.5 flex-shrink-0">
          {DND_ABILITY_SCORES_LIST.map(scoreKey => {
            const scoreName = scoreKey as keyof AbilityScores;
            const abilityMod = getAbilityModifier(char.abilityScores[scoreName]);
            const isSaveProficient = char.savingThrowProficiencies?.[scoreName] || false;
            const saveBonus = abilityMod + (isSaveProficient ? profBonus : 0);
            return (
              <div key={scoreName} className="bg-gray-700 p-2 rounded-md shadow flex flex-col items-start">
                <div className="flex items-center justify-between w-full mb-1">
                  <Tooltip enabled={areTooltipsEnabled} content={`Click to roll ${scoreName} Check: 1d20 ${abilityMod >=0 ? '+':''}${abilityMod}`}>
                    <span className="text-sm text-gray-200 uppercase font-medium cursor-pointer hover:text-indigo-300" onClick={() => handleRollStat(scoreName)}>{scoreName.slice(0,3)}</span>
                  </Tooltip>
                  <span className="text-lg font-bold text-indigo-300">{char.abilityScores[scoreName]}</span>
                  <Tooltip enabled={areTooltipsEnabled} content={`Click to roll ${scoreName} Check: 1d20 ${abilityMod >=0 ? '+':''}${abilityMod}`}>
                    <span className={`text-md font-semibold cursor-pointer hover:underline ${abilityMod >= 0 ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'}`}  onClick={() => handleRollStat(scoreName)}>
                      {abilityMod >= 0 ? '+' : ''}{abilityMod}
                    </span>
                  </Tooltip>
                </div>
                <div className="flex space-x-1 mt-1 w-full">
                  <Tooltip enabled={areTooltipsEnabled} content={`Roll Ability Check: 1d20 ${abilityMod >= 0 ? '+' : ''}${abilityMod}`}>
                    <button onClick={() => handleRollStat(scoreName)} className={`${tinyButtonBaseClass} bg-sky-600 hover:bg-sky-700`} aria-label={`Roll ${scoreName} ability check`}>Stat</button>
                  </Tooltip>
                  <Tooltip enabled={areTooltipsEnabled} content={`Roll Saving Throw: 1d20 ${saveBonus >= 0 ? '+' : ''}${saveBonus} (${isSaveProficient ? "Proficient" : "Not Proficient"})`}>
                    <button onClick={() => handleRollSave(scoreName)} className={`${tinyButtonBaseClass} bg-teal-600 hover:bg-teal-700`} aria-label={`Roll ${scoreName} saving throw`}>Save</button>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>

        <div className="w-3/4 space-y-3">
            {char.currentHp <= 0 && char.deathSaves && <DeathSaveTracker deathSaves={char.deathSaves} onUpdateDeathSave={(type, increment) => onUpdateDeathSaves(char.id, type, increment)} />}
            <div className="grid grid-cols-3 gap-2">
                <Tooltip enabled={areTooltipsEnabled} content={`Max HP: ${char.maxHp}. Current: ${char.currentHp}. ${char.temporaryHp && char.temporaryHp > 0 ? `Temp HP: ${char.temporaryHp}` : ''}`}>
                    <div className={statBoxClass}>
                        <div className={statLabelClass}>HP</div>
                        <div className={statValueClass}>{char.currentHp} / {char.maxHp}</div>
                        {char.temporaryHp !== undefined && char.temporaryHp > 0 && <div className="text-xs text-sky-400 mt-0.5">(+{char.temporaryHp} Temp)</div>}
                    </div>
                </Tooltip>
                <Tooltip enabled={areTooltipsEnabled} content={`Initiative: ${getAbilityModifier(char.abilityScores.dexterity) >= 0 ? '+' : ''}${getAbilityModifier(char.abilityScores.dexterity)} (DEX). Click to roll Initiative.`}>
                    <div className={`${statBoxClass} cursor-pointer hover:bg-gray-700`} onClick={() => onSendMessage && onSendMessage(`/roll 1d20${getAbilityModifier(char.abilityScores.dexterity) >=0 ? '+':''}${getAbilityModifier(char.abilityScores.dexterity)} for Initiative`, 'roll')}>
                        <div className={statLabelClass}>Initiative</div>
                        <div className={statValueClass}>{char.initiative !== undefined ? char.initiative : `${getAbilityModifier(char.abilityScores.dexterity) >= 0 ? '+' : ''}${getAbilityModifier(char.abilityScores.dexterity)}`}</div>
                    </div>
                </Tooltip>
                <Tooltip enabled={areTooltipsEnabled} content={`Proficiency Bonus based on Level ${char.level}`}>
                    <div className={`${statBoxClass} justify-center py-1.5 px-3`}>
                        <span className={statLabelClass}>Prof. Bonus</span>
                        <span className={statValueClass}>+{profBonus}</span>
                    </div>
                </Tooltip>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <Tooltip enabled={areTooltipsEnabled} content={acTooltipContent()}>
                    <div className={statBoxClass}>
                        <div className={statLabelClass}>AC</div>
                        <div className={statValueClass}>{effectiveAC}</div>
                    </div>
                </Tooltip>
                <Tooltip enabled={areTooltipsEnabled} content="Movement Speed in feet per round.">
                    <div className={statBoxClass}>
                        <div className={statLabelClass}>Speed</div>
                        <div className={statValueClass}>{char.speed}<span className="text-sm">ft</span></div>
                    </div>
                </Tooltip>
                {char.hitDice && (
                    <Tooltip enabled={areTooltipsEnabled} content={`${char.hitDice.current} of ${char.hitDice.max} ${char.hitDice.dieType} Hit Dice available.`}>
                        <div className={`${statBoxClass} flex-col items-center justify-center py-1.5 px-3`}>
                            <div className={statLabelClass}>Hit Dice</div>
                            <div className="flex items-baseline">
                                <span className={statValueClass}>{char.hitDice.current}/{char.hitDice.max}</span>
                                <span className="text-xs text-gray-400 ml-1">({char.hitDice.dieType})</span>
                            </div>
                            <button onClick={() => onUpdateHitDice(char.id, 'spend')} disabled={char.hitDice.current <= 0} className={`${buttonClass} bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 mt-1 w-full`}>Spend HD</button>
                        </div>
                    </Tooltip>
                )}
            </div>
            <div>
                <button onClick={() => setIsSensesExpanded(!isSensesExpanded)} className="w-full flex justify-between items-center p-2 bg-gray-700 hover:bg-gray-650 rounded-md transition-colors focus:outline-none" aria-expanded={isSensesExpanded} aria-controls="senses-passive-scores-content">
                    <h4 className="text-md font-semibold text-gray-300">Senses & Passive Scores</h4>
                    <span className={`text-indigo-400 transition-transform duration-200 ${isSensesExpanded ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {isSensesExpanded && (
                <div id="senses-passive-scores-content" className="mt-1 p-2 bg-gray-750 rounded-md space-y-1 text-xs">
                    {char.senses && (<div><span className="font-medium text-gray-400">Senses: </span><span className="text-gray-200 whitespace-pre-wrap">{char.senses}</span></div>)}
                    <Tooltip enabled={areTooltipsEnabled} content={`Passive Perception: 10 + Wisdom Mod (${getAbilityModifier(char.abilityScores.wisdom)}) ${char.skillProficiencies?.perception ? `+ Prof Bonus (${profBonus})` : ''}`}>
                        <div className="flex justify-between"><span className="font-medium text-gray-400">Passive Perception:</span><span className="text-indigo-300 font-semibold">{passivePerception}</span></div>
                    </Tooltip>
                    <Tooltip enabled={areTooltipsEnabled} content={`Passive Investigation: 10 + Intelligence Mod (${getAbilityModifier(char.abilityScores.intelligence)}) ${char.skillProficiencies?.investigation ? `+ Prof Bonus (${profBonus})` : ''}`}>
                        <div className="flex justify-between"><span className="font-medium text-gray-400">Passive Investigation:</span><span className="text-indigo-300 font-semibold">{passiveInvestigation}</span></div>
                    </Tooltip>
                    <Tooltip enabled={areTooltipsEnabled} content={`Passive Insight: 10 + Wisdom Mod (${getAbilityModifier(char.abilityScores.wisdom)}) ${char.skillProficiencies?.insight ? `+ Prof Bonus (${profBonus})` : ''}`}>
                        <div className="flex justify-between"><span className="font-medium text-gray-400">Passive Insight:</span><span className="text-indigo-300 font-semibold">{passiveInsight}</span></div>
                    </Tooltip>
                </div>
                )}
            </div>
            <div className="mt-3 p-2 bg-gray-700 rounded-md">
                <h4 className="text-md font-semibold text-gray-300 mb-1">Shortcuts</h4>
                <p className="text-xs text-gray-500 italic">Quick actions and common rolls will go here. (e.g., Attack Rolls, Damage Rolls for equipped weapons)</p>
            </div>
        </div>
      </div>
    </div>
  );
};
