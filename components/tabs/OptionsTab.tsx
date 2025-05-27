
import React from 'react';
import { OptionsTabProps } from '../../types';

export const OptionsTab: React.FC<OptionsTabProps> = ({ 
  currentUser, 
  areTooltipsEnabled, 
  onToggleTooltips,
  onToggleDMView 
}) => {
  return (
    <div className="p-4 text-gray-200">
      <h3 className="text-lg font-semibold text-gray-300 mb-3">Options</h3>
      
      <div className="space-y-3">
        <div>
          <label className="flex items-center space-x-2 text-sm cursor-pointer">
            <input 
              type="checkbox" 
              className="form-checkbox h-4 w-4 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              checked={areTooltipsEnabled}
              onChange={onToggleTooltips}
              aria-labelledby="tooltip-toggle-label"
            />
            <span id="tooltip-toggle-label">Enable Tooltips</span>
          </label>
          <p className="text-xs text-gray-400 mt-1 ml-6">
            Show helpful pop-ups when hovering over stats, skills, and other elements.
          </p>
        </div>

        {onToggleDMView && (
          <div className="pt-2 border-t border-gray-700/50">
            <button
              onClick={onToggleDMView}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors text-sm"
            >
              Switch to {currentUser.isDM ? 'Player' : 'DM'} View
            </button>
            <p className="text-xs text-gray-400 mt-1">
              Currently in {currentUser.isDM ? 'DM' : 'Player'} view.
            </p>
          </div>
        )}

        {/* Placeholder for future options */}
        <div className="pt-2 border-t border-gray-700/50">
            <label className="flex items-center space-x-2 text-sm text-gray-500 cursor-not-allowed">
            <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 opacity-50" disabled />
            <span>Enable experimental feature X (Future)</span>
            </label>
        </div>
      </div>

    </div>
  );
};
