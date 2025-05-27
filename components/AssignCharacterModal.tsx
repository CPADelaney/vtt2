import React from 'react';
import { Character, AssignmentOption } from '../types';
import { DEFAULT_PLAYER_ID, DM_PLAYER_ID_ASSOCIATION } from '../constants';

interface AssignCharacterModalProps {
  isOpen: boolean;
  characterToAssign: Character | null;
  onClose: () => void;
  onConfirmAssignment: (characterId: string, newOwnerId: string | null) => void;
}

const ASSIGNMENT_OPTIONS: AssignmentOption[] = [
  { id: DEFAULT_PLAYER_ID, label: 'Player 1' },
  { id: DM_PLAYER_ID_ASSOCIATION, label: 'DM (as Player)' },
  { id: "MAKE_NPC", label: 'Make NPC (Unowned)' },
  // Future: Add more players if multi-user system is implemented
];


export const AssignCharacterModal: React.FC<AssignCharacterModalProps> = ({
  isOpen,
  characterToAssign,
  onClose,
  onConfirmAssignment,
}) => {
  if (!isOpen || !characterToAssign) return null;

  const handleAssign = (optionId: string | null) => {
    onConfirmAssignment(characterToAssign.id, optionId);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-indigo-400">Assign Character: {characterToAssign.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="space-y-3">
          {ASSIGNMENT_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => handleAssign(option.id)}
              className="w-full px-4 py-3 bg-gray-700 hover:bg-indigo-600 text-gray-200 hover:text-white rounded-md transition-colors text-left"
            >
              Assign to: {option.label}
            </button>
          ))}
           <button
              onClick={() => handleAssign(null)} // Assign to Unassigned PC (ownerId: null, isNPC: false implicitly by handler)
              className="w-full px-4 py-3 bg-gray-700 hover:bg-yellow-600 text-gray-200 hover:text-white rounded-md transition-colors text-left"
            >
              Make Unassigned PC
            </button>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};