
import React from 'react';
import { Character } from '../types';

interface DeathSaveTrackerProps {
  deathSaves: Character['deathSaves'];
  onUpdateDeathSave: (type: 'success' | 'failure', increment: boolean) => void; // True to increment, false to decrement (or toggle)
}

const Checkbox: React.FC<{checked: boolean; onChange: () => void; label: string, colorClass: string}> = ({ checked, onChange, label, colorClass }) => (
  <label className="flex items-center space-x-1.5 cursor-pointer">
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={onChange}
      className={`form-checkbox h-5 w-5 rounded-full appearance-none transition-colors duration-150 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700
                  ${checked ? `${colorClass} border-transparent` : 'bg-gray-600 border-gray-500 hover:bg-gray-500'}
                  ${checked ? `focus:ring-${colorClass.split('-')[1]}-400` : 'focus:ring-gray-400'}
                 `}
      aria-label={label}
    />
  </label>
);


export const DeathSaveTracker: React.FC<DeathSaveTrackerProps> = ({ deathSaves, onUpdateDeathSave }) => {
  if (!deathSaves) return null;

  const { successes, failures } = deathSaves;

  const handleSaveClick = (type: 'success' | 'failure', index: number) => {
    const currentValue = type === 'success' ? successes : failures;
    // If clicking the current max, decrement. If clicking one above current, increment.
    // This makes them act like toggles that can only go up to the clicked one or down from it.
    if (index + 1 === currentValue) { // Clicked the current max dot, so decrement
        onUpdateDeathSave(type, false);
    } else if (index + 1 > currentValue) { // Clicked above current, so increment up to this point
        onUpdateDeathSave(type, true); // This will effectively set it to index + 1 due to clamping in App.tsx
    } else { // Clicked below current value - effectively setting it to index + 1 by sending increment
         onUpdateDeathSave(type, true); // Send true, logic in App will handle it
    }
  };
  
  return (
    <div className="my-3 p-3 bg-red-900/30 border-2 border-red-700 rounded-lg shadow-md">
      <h4 className="text-md font-semibold text-red-300 mb-2 text-center uppercase tracking-wider">Death Saving Throws</h4>
      <div className="flex justify-around items-center">
        {/* Successes */}
        <div className="flex flex-col items-center">
          <span className="text-sm text-green-400 mb-1">Successes</span>
          <div className="flex space-x-2">
            {[0, 1, 2].map(i => (
              <Checkbox 
                key={`success-${i}`} 
                checked={successes > i} 
                onChange={() => handleSaveClick('success', i)}
                label={`Success ${i+1}`}
                colorClass="bg-green-500"
              />
            ))}
          </div>
        </div>

        {/* Failures */}
        <div className="flex flex-col items-center">
          <span className="text-sm text-red-400 mb-1">Failures</span>
          <div className="flex space-x-2">
            {[0, 1, 2].map(i => (
              <Checkbox 
                key={`failure-${i}`} 
                checked={failures > i} 
                onChange={() => handleSaveClick('failure', i)}
                label={`Failure ${i+1}`}
                colorClass="bg-red-500"
              />
            ))}
          </div>
        </div>
      </div>
       {successes >= 3 && <p className="text-center text-xs text-green-300 mt-2">Stable!</p>}
       {failures >= 3 && <p className="text-center text-xs text-red-300 mt-2 font-bold">Deceased.</p>}
    </div>
  );
};
