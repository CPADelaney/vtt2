
import React, { useState } from 'react';
import { Character, User, Location, CharacterCreationData } from '../../types';
// FIX: (Verified) Import constants for default values
import { DEFAULT_ABILITY_SCORES, DEFAULT_SKILL_PROFICIENCIES, DND_RACES_DETAILED, DND_CLASSES_DETAILED } from '../../constants'; 

interface NpcsTabProps {
  currentUser: User;
  characters: Character[];
  locations: Location[]; // To display location names
  onCreateNPC: (data: CharacterCreationData) => void;
  onOpenSheet: (characterId: string) => void;
  onOpenAssignModal: (characterId: string) => void;
  onToggleNpcCampaignActive: (characterId: string) => void;
  getCharacterById: (characterId: string) => Character | undefined; // To get location name from ID
  onShowSidePanelContextMenu: (event: React.MouseEvent, itemType: 'character' | 'creatureTemplate', itemId: string, itemName: string) => void;
}

type NpcSubTab = 'active' | 'inactive';

export const NpcsTab: React.FC<NpcsTabProps> = ({
  currentUser,
  characters,
  locations,
  onCreateNPC,
  onOpenSheet,
  onOpenAssignModal,
  onToggleNpcCampaignActive,
  onShowSidePanelContextMenu,
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<NpcSubTab>('active');

  if (!currentUser.isDM) {
    return <p className="p-4 text-gray-500">This section is for DMs only.</p>;
  }

  const allNpcs = characters.filter(char => char.isNPC);
  const activeNpcs = allNpcs.filter(npc => npc.isCampaignActive !== false); // Treat undefined as active
  const inactiveNpcs = allNpcs.filter(npc => npc.isCampaignActive === false);

  // FIX: (Verified) Define default race and class details for NPC creation
  const defaultRace = DND_RACES_DETAILED.find(r => r.id === 'human') || DND_RACES_DETAILED[0] || { id: 'human_fallback_id', name: 'Human', speed: 30, abilityScoreIncreases:{}, languages:['common'], racialTraits:[], flavorText: '', size: 'Medium' };
  const defaultRaceId = defaultRace.id;

  const defaultClassEntry = DND_CLASSES_DETAILED.find(c => c.name.toLowerCase() === 'commoner') || DND_CLASSES_DETAILED.find(c => c.id === 'fighter') || DND_CLASSES_DETAILED[0] || { id: 'commoner_fallback_id', name: 'Commoner', hitDie: 'd6', weaponProficiencies: ["Simple Weapons"], armorProficiencies: [], primaryAbilities: ['strength'], savingThrowProficiencies: ['constitution'], skillProficienciesOptions: {choose: 1, options:['athletics']}, classFeatures: [], flavorText:'' };
  const defaultClassId = defaultClassEntry.id;
  const defaultHitDie = defaultClassEntry.hitDie;
  const defaultWeaponProfs = defaultClassEntry.weaponProficiencies.join(', ');
  const defaultArmorProfs = defaultClassEntry.armorProficiencies.join(', ');


  const NpcItem: React.FC<{ npc: Character }> = ({ npc }) => {
    const locationName = npc.currentLocationId
      ? locations.find(loc => loc.id === npc.currentLocationId)?.name
      : null;
    
    const blurb = npc.notes || npc.name;

    return (
      <li
        className="mb-2 p-2.5 bg-gray-700 rounded-md shadow hover:bg-gray-650 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between"
        title={blurb} // Hover blurb
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-character-id', npc.id);
          e.dataTransfer.effectAllowed = 'copy';
        }}
        onContextMenu={(e) => onShowSidePanelContextMenu(e, 'character', npc.id, npc.name)}
      >
        <div className="flex-grow mb-2 sm:mb-0">
          <span
            className="font-semibold text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer"
            onClick={() => onOpenSheet(npc.id)}
          >
            {npc.name}
          </span>
          <p className="text-xs text-gray-400">
            {npc.race} {npc.class}, Level {npc.level}
            {locationName && (
              <span className="ml-2 text-gray-500 italic">(At: {locationName})</span>
            )}
            {!locationName && (
              <span className="ml-2 text-gray-500 italic">(No assigned location)</span>
            )}
          </p>
        </div>
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <button
            onClick={() => onToggleNpcCampaignActive(npc.id)}
            className={`px-2 py-1 text-xxs font-medium rounded-md transition-colors w-full sm:w-auto ${
              npc.isCampaignActive !== false
                ? 'bg-yellow-600 hover:bg-yellow-700 text-yellow-100'
                : 'bg-gray-500 hover:bg-gray-400 text-gray-200'
            }`}
          >
            {npc.isCampaignActive !== false ? 'Make Inactive' : 'Make Active'}
          </button>
          <button
            onClick={() => onOpenAssignModal(npc.id)}
            className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-sky-100 text-xxs font-medium rounded-md transition-colors w-full sm:w-auto"
          >
            Assign/Manage
          </button>
        </div>
      </li>
    );
  };
  
  const displayedNpcs = currentSubTab === 'active' ? activeNpcs : inactiveNpcs;

  return (
    <div className="p-2 text-sm h-full flex flex-col">
      <div className="mb-3 flex-shrink-0">
        <button
          // FIX: (Verified) Updated NPC creation payload to match CharacterCreationData
          // Ensured all required fields from CharacterCreationData are present, including startingEquipment.
          onClick={() => onCreateNPC({
            name: "New NPC",
            raceId: defaultRaceId, 
            classId: defaultClassId, 
            level: 1,
            abilityScores: DEFAULT_ABILITY_SCORES,
            skillProficiencies: DEFAULT_SKILL_PROFICIENCIES,
            languages: "Common",
            weaponProficiencies: defaultWeaponProfs,
            armorProficiencies: defaultArmorProfs,
            toolProficiencies: "",
            hitDie: defaultHitDie,
            maxHp: 10, 
            armorClass: 10,
            speed: defaultRace.speed,
            senses: "Passive Perception 10",
            startingEquipment: [], 
          })}
          className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md transition-colors"
        >
          Create New NPC
        </button>
      </div>

      <div className="flex mb-3 border-b border-gray-700 flex-shrink-0">
        <button
          onClick={() => setCurrentSubTab('active')}
          className={`px-3 py-1.5 text-xs font-medium focus:outline-none transition-colors duration-150 rounded-t-md
            ${currentSubTab === 'active' 
              ? 'border-l border-t border-r border-gray-700 bg-gray-750 text-indigo-400' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }
          `}
        >
          Active NPCs ({activeNpcs.length})
        </button>
        <button
          onClick={() => setCurrentSubTab('inactive')}
          className={`px-3 py-1.5 text-xs font-medium focus:outline-none transition-colors duration-150 rounded-t-md ml-1
            ${currentSubTab === 'inactive' 
              ? 'border-l border-t border-r border-gray-700 bg-gray-750 text-indigo-400' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }
          `}
        >
          Inactive NPCs ({inactiveNpcs.length})
        </button>
      </div>

      <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-1">
        {displayedNpcs.length === 0 && (
          <p className="text-gray-500 italic pt-2">
            {currentSubTab === 'active' ? 'No active NPCs in the campaign.' : 'No inactive NPCs.'}
          </p>
        )}
        <ul>
          {displayedNpcs.map(npc => <NpcItem key={npc.id} npc={npc} />)}
        </ul>
      </div>
    </div>
  );
};
