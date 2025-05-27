
import React from 'react';
import { PendingSpellSave, AbilityScores, User, Character } from '../types';

interface SpellSavePromptWidgetProps {
  pendingSaves: PendingSpellSave[];
  onRollSave: (saveId: string, targetId: string, stat: keyof AbilityScores, dc: number) => void;
  onAutoFail: (saveId: string, targetId: string) => void;
  currentUser: User;
  getCharacterById: (characterId: string) => Character | undefined;
}

export const SpellSavePromptWidget: React.FC<SpellSavePromptWidgetProps> = ({
  pendingSaves,
  onRollSave,
  onAutoFail,
  currentUser,
  getCharacterById,
}) => {
  if (pendingSaves.length === 0) {
    return null;
  }

  // Filter saves:
  // - DM sees all pending saves.
  // - Players see saves only for their owned characters that are NOT NPCs.
  const relevantSaves = currentUser.isDM
    ? pendingSaves
    : pendingSaves.filter(save => {
        const targetChar = getCharacterById(save.targetCharacterId);
        // Player should only see prompts for their own PCs (not NPCs they might somehow be associated with).
        // NPCs saves are handled by the DM.
        return targetChar && !targetChar.isNPC && targetChar.ownerPlayerId === currentUser.id;
      });

  if (relevantSaves.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 right-4 z-40 bg-gray-800 bg-opacity-90 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl border border-gray-700 p-3 space-y-3 max-w-xs md:max-w-sm max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      aria-live="polite"
      role="alertdialog"
      aria-label="Pending Spell Saves"
    >
      {relevantSaves.map(save => (
        <div key={save.id} className="p-2 bg-gray-700 rounded-md border border-gray-600">
          <p className="font-semibold text-indigo-300 mb-1">
            Spell Save: {save.targetCharacterName}
          </p>
          <p className="text-gray-300">
            Spell: <span className="font-medium">{save.spellName}</span> (from {save.casterName})
          </p>
          <p className="text-gray-300">
            Roll: <span className="font-medium uppercase">{save.saveStat.slice(0,3)}</span> Save vs DC <span className="font-medium">{save.saveDC}</span>
          </p>
          {save.effectOnFailure && <p className="text-xxs text-red-300">On Fail: {save.effectOnFailure}</p>}
          {save.effectOnSave && <p className="text-xxs text-green-300">On Success: {save.effectOnSave}</p>}

          <div className="mt-2 flex space-x-2">
            <button
              onClick={() => onRollSave(save.id, save.targetCharacterId, save.saveStat, save.saveDC)}
              className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
              aria-label={`Roll ${save.saveStat} save for ${save.targetCharacterName} against ${save.spellName}`}
            >
              Roll {save.saveStat.slice(0,3).toUpperCase()} Save
            </button>
            <button
              onClick={() => onAutoFail(save.id, save.targetCharacterId)}
              className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
              aria-label={`Automatically fail save for ${save.targetCharacterName} against ${save.spellName}`}
            >
              Auto-Fail
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
