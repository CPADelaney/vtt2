
import React, { useState } from 'react';
import { Character, CreatureTemplate } from '../types';
import { generateId } from '../../utils'; // For unique keys in monster spawn list

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroupWithMembers: (
    name: string, 
    description?: string, 
    initialNpcIds?: string[], 
    initialMonsterTemplateIds?: string[] // This will now be the list of template IDs to spawn
  ) => void;
  characters: Character[]; // All characters to filter NPCs from
  creatureTemplates: CreatureTemplate[]; // For monster selection
}

const labelClass = "block text-sm font-medium text-gray-300 mb-1";
const inputClass = "w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 text-xs";
const selectClass = `${inputClass} appearance-none`; 
const buttonClass = "px-3 py-1.5 text-xs font-medium rounded-md transition-colors";
const secondaryButtonClass = `${buttonClass} bg-sky-600 hover:bg-sky-700 text-white`;

interface MonsterToSpawn {
  instanceId: string; // Unique ID for the list item in the modal
  templateId: string;
  templateName: string;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroupWithMembers,
  characters,
  creatureTemplates,
}) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedNpcIds, setSelectedNpcIds] = useState<string[]>([]);
  
  // For adding multiple monsters
  const [currentMonsterTemplateSelection, setCurrentMonsterTemplateSelection] = useState<string>('');
  const [monstersToSpawnList, setMonstersToSpawnList] = useState<MonsterToSpawn[]>([]);

  if (!isOpen) return null;

  const availableNpcs = characters.filter(c => c.isNPC);

  const handleNpcSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = event.target.options;
    const value: string[] = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    setSelectedNpcIds(value);
  };
  
  const handleAddMonsterToSpawnList = () => {
    if (!currentMonsterTemplateSelection) return;
    const template = creatureTemplates.find(t => t.id === currentMonsterTemplateSelection);
    if (template) {
      setMonstersToSpawnList(prev => [
        ...prev,
        { instanceId: generateId('m_inst_'), templateId: template.id, templateName: template.name }
      ]);
    }
    // Optionally reset currentMonsterTemplateSelection here if desired after adding
  };

  const handleRemoveMonsterFromSpawnList = (instanceIdToRemove: string) => {
    setMonstersToSpawnList(prev => prev.filter(m => m.instanceId !== instanceIdToRemove));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      alert("Group Name is required.");
      return;
    }
    
    const monsterTemplateIdsToPass = monstersToSpawnList.map(m => m.templateId);

    onCreateGroupWithMembers(
      groupName.trim(),
      groupDescription.trim() || undefined,
      selectedNpcIds,
      monsterTemplateIdsToPass 
    );
    
    setGroupName('');
    setGroupDescription('');
    setSelectedNpcIds([]);
    setMonstersToSpawnList([]);
    setCurrentMonsterTemplateSelection('');
    // onClose will be called by App.tsx which sets isCreateGroupModalOpen to false
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-indigo-400">Create New Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="groupName" className={labelClass}>Group Name*</label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="groupDescription" className={labelClass}>Description (Optional)</label>
            <textarea
              id="groupDescription"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className={inputClass}
              rows={2}
            />
          </div>

          <div>
            <label htmlFor="selectNpcs" className={labelClass}>Add Existing NPCs (Ctrl/Cmd + Click for multiple)</label>
            <select
              id="selectNpcs"
              multiple
              value={selectedNpcIds}
              onChange={handleNpcSelectionChange}
              className={`${selectClass} h-24`}
            >
              {availableNpcs.length === 0 && <option disabled>No NPCs available</option>}
              {availableNpcs.map(npc => (
                <option key={npc.id} value={npc.id}>{npc.name}</option>
              ))}
            </select>
          </div>

          {/* Monster Selection Overhaul */}
          <div>
            <label htmlFor="selectMonsterTemplate" className={labelClass}>Spawn Monsters from Bestiary</label>
            <div className="flex items-center gap-2 mb-2">
              <select
                id="selectMonsterTemplate"
                value={currentMonsterTemplateSelection}
                onChange={(e) => setCurrentMonsterTemplateSelection(e.target.value)}
                className={`${selectClass} flex-grow`}
              >
                <option value="">Select Monster Template...</option>
                {creatureTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} (CR {template.challengeRating || 'N/A'})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddMonsterToSpawnList}
                disabled={!currentMonsterTemplateSelection}
                className={`${secondaryButtonClass} flex-shrink-0 disabled:opacity-50`}
              >
                Add this Monster
              </button>
            </div>
            {monstersToSpawnList.length > 0 && (
              <div className="mt-1 p-2 border border-gray-700 rounded-md bg-gray-750 max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700">
                <p className="text-xs text-gray-400 mb-1">Monsters to spawn for this group:</p>
                <ul className="space-y-1">
                  {monstersToSpawnList.map((monster) => (
                    <li key={monster.instanceId} className="flex justify-between items-center text-xs text-gray-200 bg-gray-600 px-2 py-0.5 rounded">
                      <span>{monster.templateName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMonsterFromSpawnList(monster.instanceId)}
                        className="text-red-400 hover:text-red-300 text-sm"
                        title="Remove this monster instance"
                      >
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-md transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors text-sm"
            >
              Create Group & Add Members
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
