
import React from 'react';
import { Character, User } from '../../types';

interface CharactersTabProps {
  currentUser: User;
  characters: Character[];
  onOpenCharacterCreation: () => void;
  onOpenSheet: (characterId: string) => void; // For DM: opens modal; For Player: sets active char
  onOpenAssignModal: (characterId: string) => void;
  onShowSidePanelContextMenu: (event: React.MouseEvent, itemType: 'character' | 'creatureTemplate', itemId: string, itemName: string) => void;
  activePlayerCharacterId?: string | null; // To highlight active character for player
  onSetActivePlayerCharacterId?: (characterId: string) => void; // For player to set active char
}

export const CharactersTab: React.FC<CharactersTabProps> = ({
  currentUser, characters, onOpenCharacterCreation, onOpenSheet, onOpenAssignModal,
  onShowSidePanelContextMenu, activePlayerCharacterId, onSetActivePlayerCharacterId
}) => {

  const handleCharacterClick = (char: Character) => {
    if (!currentUser.isDM && char.ownerPlayerId === currentUser.id && onSetActivePlayerCharacterId) {
      onSetActivePlayerCharacterId(char.id);
      // Also ensure onOpenSheet is called to potentially trigger tab switch if needed
      onOpenSheet(char.id);
    } else { 
      onOpenSheet(char.id);
    }
  };
  
  const MappedCharacterItem: React.FC<{char: Character}> = ({char}) => {
    const isPlayerCharacter = !char.isNPC && char.ownerPlayerId === currentUser.id;
    const isActiveForPlayer = !currentUser.isDM && isPlayerCharacter && activePlayerCharacterId === char.id;

    return (
    <li
        key={char.id}
        className={`mb-2 p-2.5 bg-gray-700 rounded-md shadow hover:bg-gray-650 transition-colors flex items-center justify-between
                    ${isActiveForPlayer ? 'ring-2 ring-indigo-400 bg-indigo-900/30' : ''}`}
        draggable={currentUser.isDM || isPlayerCharacter} // Only DM or owner can drag their char token
        onDragStart={(e) => {
            if (currentUser.isDM || isPlayerCharacter) {
                e.dataTransfer.setData('application/x-character-id', char.id);
                e.dataTransfer.effectAllowed = 'copy';
            } else {
                e.preventDefault();
            }
        }}
        onContextMenu={(e) => currentUser.isDM && onShowSidePanelContextMenu(e, 'character', char.id, char.name)} // Context menu for DM
    >
        <div className="flex-grow" onClick={() => handleCharacterClick(char)}>
            <span
                className={`font-semibold  hover:text-indigo-200 transition-colors cursor-pointer
                            ${isActiveForPlayer ? 'text-indigo-300' : 'text-indigo-400'}`}
            >
                {char.name}
            </span>
            <p className={`text-xs ${isActiveForPlayer ? 'text-gray-300' : 'text-gray-400'}`}>
                {char.race} {char.class}, Level {char.level}
                {char.isNPC && <span className="ml-2 px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded-full text-xxs">NPC</span>}

                {!char.isNPC && char.ownerPlayerId === null && currentUser.isDM && (
                  <span
                    className="ml-2 px-1.5 py-0.5 bg-yellow-600 text-yellow-100 rounded-full text-xxs hover:bg-yellow-500 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentUser.isDM) onOpenAssignModal(char.id);
                    }}
                  >
                    Unassigned PC
                  </span>
                )}
                 {!char.isNPC && char.ownerPlayerId !== null && currentUser.isDM && (
                     <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenAssignModal(char.id);
                        }}
                        className="ml-2 px-1.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-blue-100 rounded-full text-xxs transition-colors"
                     >
                        Reassign
                     </button>
                 )}
            </p>
        </div>
        <div className="flex-shrink-0 w-10 h-10 bg-gray-600 border border-gray-500 rounded text-gray-400 text-xs flex items-center justify-center ml-3">
            Sprite
        </div>
    </li>
  )};

  // PCs: Characters that are not NPCs.
  // For DM, show all PCs. For Player, show only their owned PCs.
  const playerCharactersList = characters.filter(c =>
    !c.isNPC && (currentUser.isDM || c.ownerPlayerId === currentUser.id)
  );


  return (
    <div className="p-2 text-sm">
      {/* Button is now visible to players as well */}
      <div className="mb-4">
          <button
          onClick={onOpenCharacterCreation}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors"
          >
          Create New Player Character
          </button>
      </div>
      

      <h3 className="text-lg font-semibold text-gray-300 mb-2">
        {currentUser.isDM ? "Player Characters" : "Your Characters"}
      </h3>

      {playerCharactersList.length === 0 && (
        <p className="text-gray-500 italic">
          {currentUser.isDM ? "No player characters created yet." : "You do not have any characters assigned to you, or no characters exist."}
        </p>
      )}

      <ul>
        {playerCharactersList.map(char => <MappedCharacterItem key={char.id} char={char} />)}
      </ul>
    </div>
  );
};
