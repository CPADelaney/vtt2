
import React from 'react';
import { Character } from '../../../types';

interface PlayerBioTabProps {
  activePlayerCharacter: Character | null;
}

export const PlayerBioTab: React.FC<PlayerBioTabProps> = ({ activePlayerCharacter }) => {
  if (!activePlayerCharacter) {
    return <p className="p-4 text-gray-500 italic">No active character selected.</p>;
  }

  const char = activePlayerCharacter;

  const renderBioField = (label: string, value?: string | number, isInline: boolean = false) => {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) return null;
    
    if (isInline) {
        return (
            <div className="mb-1">
                <span className="text-sm font-semibold text-gray-400">{label}: </span>
                <span className="text-gray-200 text-sm">{value}</span>
            </div>
        );
    }

    return (
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-gray-400">{label}:</h4>
        <p className="text-gray-200 whitespace-pre-wrap text-xs">{value}</p>
      </div>
    );
  };

  return (
    <div className="p-3 text-sm h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
      <h3 className="text-xl font-semibold text-indigo-400 mb-3">Character: {char.name}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mb-3 p-2 bg-gray-750 rounded-md">
        {renderBioField("Level", char.level, true)}
        {renderBioField("Race", char.race, true)}
        {renderBioField("Class", char.class, true)}
        {char.subclass && renderBioField("Subclass", char.subclass, true)}
        {renderBioField("Background", char.background, true)}
        {renderBioField("Alignment", char.alignment, true)}
      </div>
      
      {renderBioField("Appearance", char.appearanceDescription)}
      {renderBioField("Personality Traits", char.personalityTraits)}
      {renderBioField("Ideals", char.ideals)}
      {renderBioField("Bonds", char.bonds)}
      {renderBioField("Flaws", char.flaws)}

      <div className="mt-3 pt-3 border-t border-gray-700">
        <h4 className="text-sm font-semibold text-gray-400 mb-1">General Notes & Backstory:</h4>
        <p className="text-gray-200 whitespace-pre-wrap text-xs">
          {char.notes || "No additional notes or backstory provided."}
        </p>
      </div>
    </div>
  );
};
