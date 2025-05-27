
import React, { useState } from 'react';
import { User, Group, Character, CreatureTemplate, Location, Area } from '../../types';

interface GroupsTabProps {
  currentUser: User;
  groups: Group[];
  characters: Character[]; // All characters (PCs and NPCs)
  creatureTemplates: CreatureTemplate[];
  locations: Location[];
  getCharacterById: (characterId: string) => Character | undefined;
  onOpenCreateGroupModal: () => void; // Prop to open the modal
  // onCreateGroup is removed, handled by onCreateGroupWithMembers in modal
  onDeleteGroup: (groupId: string) => void;
  onAddCharacterToGroup: (groupId: string, characterId: string) => void;
  onRemoveCharacterFromGroup: (groupId: string, characterId: string) => void;
  onSpawnMonsterAndAddToGroup: (groupId: string, templateId: string) => void;
  onAssignGroupToLocationArea: (groupId: string, locationId: string | null, areaId: string | null) => void;
  onOpenSheet: (characterId: string) => void;
}

export const GroupsTab: React.FC<GroupsTabProps> = ({
  currentUser,
  groups,
  characters,
  creatureTemplates,
  locations,
  getCharacterById,
  onOpenCreateGroupModal, // Use this to open modal
  onDeleteGroup,
  onAddCharacterToGroup,
  onRemoveCharacterFromGroup,
  onSpawnMonsterAndAddToGroup,
  onAssignGroupToLocationArea,
  onOpenSheet,
}) => {
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [selectedNpcForGroup, setSelectedNpcForGroup] = useState<string>('');
  const [selectedTemplateForGroup, setSelectedTemplateForGroup] = useState<string>('');
  const [selectedLocationForGroupAssignment, setSelectedLocationForGroupAssignment] = useState<string>('');
  const [selectedAreaForGroupAssignment, setSelectedAreaForGroupAssignment] = useState<string>('');

  if (!currentUser.isDM) {
    return <p className="p-4 text-gray-500">This section is for DMs only.</p>;
  }

  const toggleExpandGroup = (groupId: string) => {
    setExpandedGroupId(prev => (prev === groupId ? null : groupId));
    setSelectedNpcForGroup('');
    setSelectedTemplateForGroup('');
    setSelectedLocationForGroupAssignment('');
    setSelectedAreaForGroupAssignment('');
  };

  const availableNpcsForGroup = (group: Group) => 
    characters.filter(c => c.isNPC && !group.characterIds.includes(c.id));

  const availableAreasForSelectedLocation = () => {
    if (!selectedLocationForGroupAssignment) return [];
    const loc = locations.find(l => l.id === selectedLocationForGroupAssignment);
    return loc ? loc.areas : [];
  };

  return (
    <div className="p-2 text-sm h-full flex flex-col">
      {/* Groups List */}
      <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-1 mb-2">
        <h3 className="text-md font-semibold text-gray-300 mb-2 sticky top-0 bg-gray-850 py-1 z-10">Existing Groups ({groups.length})</h3>
        {groups.length === 0 && <p className="text-gray-500 italic">No groups created yet. Click "Create New Group" below.</p>}
        <ul className="space-y-2">
          {groups.map(group => (
            <li key={group.id} className="p-2 bg-gray-700 rounded-md shadow">
              <div className="flex items-center justify-between">
                <div className="flex-grow cursor-pointer" onClick={() => toggleExpandGroup(group.id)}>
                  <h4 className="font-semibold text-indigo-300 hover:text-indigo-200 transition-colors">
                    <span className={`inline-block mr-1 transition-transform duration-150 ${expandedGroupId === group.id ? 'rotate-90' : ''}`}>►</span>
                    {group.name} ({group.characterIds.length} members)
                  </h4>
                  {group.description && <p className="text-xs text-gray-400 truncate italic">{group.description}</p>}
                </div>
                <button
                  onClick={() => onDeleteGroup(group.id)}
                  className="ml-2 px-2 py-1 bg-red-700 hover:bg-red-600 text-white text-xxs font-semibold rounded shadow-sm transition-colors"
                  aria-label={`Delete group ${group.name}`}
                >
                  Delete
                </button>
              </div>

              {/* Expanded Group View */}
              {expandedGroupId === group.id && (
                <div className="mt-3 pt-2 border-t border-gray-600 space-y-3">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-300 mb-1">Members:</h5>
                    {group.characterIds.length === 0 && <p className="text-xs text-gray-500 italic">No members in this group.</p>}
                    <ul className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-650 pr-1">
                      {group.characterIds.map(charId => {
                        const char = getCharacterById(charId);
                        if (!char) return null;
                        return (
                          <li key={charId} className="flex items-center justify-between p-1 bg-gray-650 rounded text-xs">
                            <span className="text-gray-200 hover:text-indigo-300 cursor-pointer truncate" onClick={() => onOpenSheet(charId)} title={char.name}>
                              {char.name} ({char.isNPC ? 'NPC' : 'PC'})
                            </span>
                            <button 
                              onClick={() => onRemoveCharacterFromGroup(group.id, charId)}
                              className="ml-1 px-1.5 py-0.5 bg-red-700 hover:bg-red-600 text-white text-xxs rounded"
                              aria-label={`Remove ${char.name} from group`}
                            >
                              Remove
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Add Existing NPC to Group */}
                  <div className="p-1.5 border border-gray-600/50 rounded bg-gray-750/30">
                     <label htmlFor={`add-npc-${group.id}`} className="block text-xs font-medium text-gray-400 mb-0.5">Add Existing NPC:</label>
                     <div className="flex gap-1">
                        <select 
                            id={`add-npc-${group.id}`}
                            value={selectedNpcForGroup}
                            onChange={(e) => setSelectedNpcForGroup(e.target.value)}
                            className="flex-grow p-1 bg-gray-600 border border-gray-500 rounded-md text-gray-100 text-xxs focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">Select NPC...</option>
                            {availableNpcsForGroup(group).map(npc => (
                                <option key={npc.id} value={npc.id}>{npc.name}</option>
                            ))}
                        </select>
                        <button 
                            onClick={() => {
                                if(selectedNpcForGroup) onAddCharacterToGroup(group.id, selectedNpcForGroup);
                                setSelectedNpcForGroup('');
                            }}
                            disabled={!selectedNpcForGroup}
                            className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xxs font-semibold rounded disabled:opacity-50"
                        >
                            Add NPC
                        </button>
                     </div>
                  </div>
                  
                  {/* Add Monster from Bestiary to Group */}
                   <div className="p-1.5 border border-gray-600/50 rounded bg-gray-750/30">
                     <label htmlFor={`add-monster-${group.id}`} className="block text-xs font-medium text-gray-400 mb-0.5">Spawn Monster to Group:</label>
                     <div className="flex gap-1">
                        <select 
                            id={`add-monster-${group.id}`}
                            value={selectedTemplateForGroup}
                            onChange={(e) => setSelectedTemplateForGroup(e.target.value)}
                             className="flex-grow p-1 bg-gray-600 border border-gray-500 rounded-md text-gray-100 text-xxs focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">Select Monster Template...</option>
                            {creatureTemplates.map(template => (
                                <option key={template.id} value={template.id}>{template.name} (CR {template.challengeRating || 'N/A'})</option>
                            ))}
                        </select>
                        <button 
                            onClick={() => {
                                if(selectedTemplateForGroup) onSpawnMonsterAndAddToGroup(group.id, selectedTemplateForGroup);
                                setSelectedTemplateForGroup('');
                            }}
                            disabled={!selectedTemplateForGroup}
                            className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xxs font-semibold rounded disabled:opacity-50"
                        >
                            Spawn Monster
                        </button>
                     </div>
                  </div>

                  {/* Assign Group to Location/Area */}
                  <div className="p-1.5 border border-gray-600/50 rounded bg-gray-750/30">
                    <label className="block text-xs font-medium text-gray-400 mb-0.5">Assign Group to Location:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-1">
                        <select
                            value={selectedLocationForGroupAssignment}
                            onChange={(e) => {
                                setSelectedLocationForGroupAssignment(e.target.value);
                                setSelectedAreaForGroupAssignment(''); // Reset area when location changes
                            }}
                            className="p-1 bg-gray-600 border border-gray-500 rounded-md text-gray-100 text-xxs focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">Select Location...</option>
                            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                        <select
                            value={selectedAreaForGroupAssignment}
                            onChange={(e) => setSelectedAreaForGroupAssignment(e.target.value)}
                            disabled={!selectedLocationForGroupAssignment || availableAreasForSelectedLocation().length === 0}
                             className="p-1 bg-gray-600 border border-gray-500 rounded-md text-gray-100 text-xxs focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-50"
                        >
                            <option value="">Select Area (Optional)...</option>
                            {availableAreasForSelectedLocation().map(area => <option key={area.id} value={area.id}>{area.name}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={() => {
                            if (selectedLocationForGroupAssignment) {
                                onAssignGroupToLocationArea(group.id, selectedLocationForGroupAssignment, selectedAreaForGroupAssignment || null);
                            } else { // Assign to "No Location"
                                onAssignGroupToLocationArea(group.id, null, null);
                            }
                            // Reset selects after assignment
                            setSelectedLocationForGroupAssignment('');
                            setSelectedAreaForGroupAssignment('');
                        }}
                        className="w-full px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xxs font-semibold rounded disabled:opacity-50"
                    >
                        Assign Group
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

       {/* Create New Group Button */}
      <div className="mt-auto pt-2 border-t border-gray-700 flex-shrink-0">
        <button 
          onClick={onOpenCreateGroupModal}
          className="w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md text-xxs transition-colors"
        >
          Create New Group
        </button>
      </div>
    </div>
  );
};
