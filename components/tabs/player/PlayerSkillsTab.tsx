
import React from 'react';
import { Character, AbilityScores, SkillProficiencies, PlayerSkillsTabProps } from '../../../types';
import { getAbilityModifier, calculateProficiencyBonus } from '../../../utils';
import { DND_SKILLS_DEFINITIONS } from '../../../constants';
import { Tooltip } from '../../Tooltip';

export const PlayerSkillsTab: React.FC<PlayerSkillsTabProps> = ({ activePlayerCharacter, onSendMessage, areTooltipsEnabled }) => {
  if (!activePlayerCharacter) {
    return <p className="p-4 text-gray-500 italic">No active character selected.</p>;
  }

  const char = activePlayerCharacter;
  const profBonus = char.proficiencyBonus || calculateProficiencyBonus(char.level);

  const calculateSkillModifier = (skillKey: keyof SkillProficiencies, abilityName: keyof AbilityScores): number => {
    const abilityMod = getAbilityModifier(char.abilityScores[abilityName]);
    const isProficient = char.skillProficiencies?.[skillKey] || false;
    return abilityMod + (isProficient ? profBonus : 0);
  };

  const handleRollSkill = (skillKey: keyof SkillProficiencies, skillName: string, modifier: number) => {
    if (!onSendMessage || !char) return;
    const rollExpression = `1d20${modifier >= 0 ? '+' : ''}${modifier}`;
    const command = `/roll ${rollExpression} for ${skillName} Check`;
    onSendMessage(command, 'roll');
  };

  return (
    <div className="p-3 text-sm text-gray-200 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
      <h3 className="text-xl font-semibold text-indigo-400 mb-3">Skills</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {DND_SKILLS_DEFINITIONS.map(skillDef => {
          const skillKey = skillDef.id; 
          const abilityName = skillDef.ability;
          const modifier = calculateSkillModifier(skillKey, abilityName);
          const isProficient = char.skillProficiencies?.[skillKey] || false;
          const abilityModValue = getAbilityModifier(char.abilityScores[abilityName]);
          
          const formattedSkillName = skillDef.name; 
          
          const calculationTooltipContent = `${abilityName.slice(0,3).toUpperCase()} Mod: ${abilityModValue >= 0 ? '+' : ''}${abilityModValue}${isProficient ? `\nProf Bonus: +${profBonus}` : '\nNot Proficient'}`;
          const clickToRollTooltip = `Click to roll ${formattedSkillName} Check: 1d20 ${modifier >=0 ? '+':''}${modifier}`;

          return (
            <Tooltip key={skillKey} enabled={areTooltipsEnabled} content={skillDef.description}>
              <div 
                className="flex items-center justify-between p-2 bg-gray-700 rounded-md hover:bg-gray-650 transition-colors cursor-pointer"
                onClick={() => handleRollSkill(skillKey, formattedSkillName, modifier)}
                title={clickToRollTooltip}
              >
                <div className="flex items-center">
                  {isProficient ? (
                    <span className="w-3 h-3 bg-indigo-400 rounded-full mr-2" title="Proficient"></span>
                  ) : (
                    <span className="w-3 h-3 border-2 border-gray-500 rounded-full mr-2" title="Not Proficient"></span>
                  )}
                  <span className="text-gray-200">{formattedSkillName}</span>
                  <span className="text-xs text-gray-500 ml-1">({abilityName.slice(0,3).toUpperCase()})</span>
                </div>
                <Tooltip enabled={areTooltipsEnabled} content={calculationTooltipContent} position="left">
                    <span className={`font-semibold ${modifier >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {modifier >= 0 ? '+' : ''}{modifier}
                    </span>
                </Tooltip>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};
