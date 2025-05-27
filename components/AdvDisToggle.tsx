
import React from 'react';
import { AdvantageDisadvantageSetting } from '../types';

interface AdvDisToggleProps {
  currentSelection: AdvantageDisadvantageSetting;
  onSelectionChange: (selection: AdvantageDisadvantageSetting) => void;
  isPlayerDM: boolean; // To disable if player is DM and this is a player-only feature
}

export const AdvDisToggle: React.FC<AdvDisToggleProps> = ({ currentSelection, onSelectionChange, isPlayerDM }) => {
  if (isPlayerDM) { // Optionally hide or disable for DM, assuming it's a player convenience
    // return null; 
  }

  const buttonClass = (value: AdvantageDisadvantageSetting) => 
    `px-2.5 py-1 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800
     ${currentSelection === value 
       ? 'bg-indigo-600 text-white focus:ring-indigo-500' 
       : 'bg-gray-600 hover:bg-gray-500 text-gray-300 focus:ring-gray-500'
     }`;

  return (
    <div className="flex items-center space-x-1 p-1 bg-gray-700 bg-opacity-60 backdrop-blur-sm rounded-lg shadow">
      <button 
        onClick={() => onSelectionChange('advantage')} 
        className={buttonClass('advantage')}
        aria-pressed={currentSelection === 'advantage'}
        title="Roll with Advantage"
      >
        Adv
      </button>
      <button 
        onClick={() => onSelectionChange('none')} 
        className={buttonClass('none')}
        aria-pressed={currentSelection === 'none'}
        title="Normal Roll"
      >
        None
      </button>
      <button 
        onClick={() => onSelectionChange('disadvantage')} 
        className={buttonClass('disadvantage')}
        aria-pressed={currentSelection === 'disadvantage'}
        title="Roll with Disadvantage"
      >
        Dis
      </button>
    </div>
  );
};
