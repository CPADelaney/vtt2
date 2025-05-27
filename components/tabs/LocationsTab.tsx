
import React, { useState } from 'react';
import { Character, Location, User, Area, Item } from '../../types'; 

interface LocationsTabProps {
  currentUser: User;
  characters: Character[];
  locations: Location[];
  items: Item[]; 
  onCreateLocation: (name: string) => void;
  onToggleLocationExpand: (locationId: string) => void;
  onToggleLocationActive: (locationId: string) => void;
  onCreateArea: (locationId: string, areaName: string) => void;
  onToggleAreaExpanded: (locationId: string, areaId: string) => void;
  onSetCharacterLocationAndArea: (characterId: string, newLocationId: string | null, newAreaId: string | null) => void;
  onOpenSheet: (characterId: string) => void;
}

type LocationSubTab = 'active' | 'inactive';

export const LocationsTab: React.FC<LocationsTabProps> = ({
  currentUser,
  characters,
  locations,
  items,
  onCreateLocation,
  onToggleLocationExpand,
  onToggleLocationActive,
  onCreateArea,
  onToggleAreaExpanded,
  onSetCharacterLocationAndArea,
  onOpenSheet,
}) => {
  const [newLocationName, setNewLocationName] = useState('');
  const [newAreaInputs, setNewAreaInputs] = useState<Record<string, string>>({});
  const [draggedCharIdInternal, setDraggedCharIdInternal] = useState<string | null>(null);
  const [currentSubTab, setCurrentSubTab] = useState<LocationSubTab>('active');

  if (!currentUser.isDM) {
    return <p className="p-4 text-gray-500">This section is for DMs only.</p>;
  }

  const activeLocationsList = locations.filter(loc => loc.isActive !== false).sort((a,b) => a.name.localeCompare(b.name)); // Treat undefined as active
  const inactiveLocationsList = locations.filter(loc => loc.isActive === false).sort((a,b) => a.name.localeCompare(b.name));

  const displayedLocations = currentSubTab === 'active' ? activeLocationsList : inactiveLocationsList;

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocationName.trim()) {
      onCreateLocation(newLocationName.trim());
      setNewLocationName('');
    }
  };

  const handleNewAreaInputChange = (locationId: string, value: string) => {
    setNewAreaInputs(prev => ({ ...prev, [locationId]: value }));
  };

  const handleCreateAreaSubmit = (locationId: string) => {
    const areaName = newAreaInputs[locationId]?.trim();
    if (areaName) {
      onCreateArea(locationId, areaName);
      setNewAreaInputs(prev => ({ ...prev, [locationId]: '' }));
    }
  };
  
  const handleDragStartChar = (e: React.DragEvent<HTMLLIElement>, charId: string) => {
    setDraggedCharIdInternal(charId);
    e.dataTransfer.setData('application/x-character-id', charId);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('application/x-character-id') && draggedCharIdInternal) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };
  
  const handleDropOnLocationHeader = (e: React.DragEvent<HTMLDivElement>, targetLocationId: string) => {
    e.preventDefault();
    e.stopPropagation(); 
    const charIdFromTransfer = e.dataTransfer.getData('application/x-character-id');
    
    if (charIdFromTransfer && draggedCharIdInternal === charIdFromTransfer) {
      const character = characters.find(c => c.id === charIdFromTransfer);
      if (character && (character.currentLocationId !== targetLocationId || character.currentAreaId !== null)) {
        onSetCharacterLocationAndArea(charIdFromTransfer, targetLocationId, null);
      }
    }
    setDraggedCharIdInternal(null);
  };

  const handleDropOnArea = (e: React.DragEvent<HTMLDivElement>, targetLocationId: string, targetAreaId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const charIdFromTransfer = e.dataTransfer.getData('application/x-character-id');

    if (charIdFromTransfer && draggedCharIdInternal === charIdFromTransfer) {
      const character = characters.find(c => c.id === charIdFromTransfer);
      if (character && (character.currentLocationId !== targetLocationId || character.currentAreaId !== targetAreaId)) {
        onSetCharacterLocationAndArea(charIdFromTransfer, targetLocationId, targetAreaId);
      }
    }
    setDraggedCharIdInternal(null);
  };

  const CharacterItem: React.FC<{ char: Character; isDraggable?: boolean }> = ({ char, isDraggable = true }) => (
    <li
      key={char.id}
      draggable={isDraggable}
      onDragStart={(e) => isDraggable && handleDragStartChar(e, char.id)}
      className={`p-1.5 mb-1 rounded bg-gray-600 hover:bg-gray-550 transition-colors text-xs flex items-center justify-between
                  ${isDraggable && draggedCharIdInternal === char.id ? 'opacity-50 ring-1 ring-indigo-400' : (isDraggable ? 'cursor-grab' : '')}`}
    >
      <span
        className="text-gray-100 hover:text-indigo-300 transition-colors cursor-pointer truncate"
        title={char.name}
        onClick={() => onOpenSheet(char.id)}
      >
        {char.name}
      </span>
      <span className="text-gray-400 ml-1 text-xxs flex-shrink-0">
        ({char.isNPC ? 'NPC' : 'PC'})
      </span>
    </li>
  );

  const renderLocationGroup = (locs: Location[]) => (
    locs.map(loc => (
      <div
        key={loc.id}
        className="mb-2 p-2 border border-gray-600 rounded bg-gray-700"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDropOnLocationHeader(e, loc.id)}
      >
        <div className="flex justify-between items-center mb-1">
          <div
            className="flex-grow flex items-center cursor-pointer hover:bg-gray-650 p-1 rounded mr-2"
            onClick={() => onToggleLocationExpand(loc.id)}
          >
            <span className={`mr-2 transition-transform duration-150 ${loc.isExpanded ? 'rotate-90' : ''}`}>►</span>
            <h4 className="font-semibold text-indigo-300 truncate" title={loc.name}>{loc.name}</h4>
          </div>
          <button
            onClick={() => onToggleLocationActive(loc.id)}
            className={`px-2 py-0.5 text-xxs font-medium rounded transition-colors ${
              loc.isActive !== false ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-500 hover:bg-gray-400 text-gray-200'
            }`}
          >
            {loc.isActive !== false ? 'Active' : 'Inactive'}
          </button>
        </div>

        {loc.isExpanded && (
          <div className="pl-3 mt-1 border-l-2 border-gray-600">
            {loc.areas.map(area => (
              <div key={area.id} className="mb-1.5 p-1.5 border border-gray-500 rounded bg-gray-650"
                   onDragOver={handleDragOver}
                   onDrop={(e) => handleDropOnArea(e, loc.id, area.id)}
              >
                <div className="flex justify-between items-center cursor-pointer hover:bg-gray-600 p-0.5 rounded" onClick={() => onToggleAreaExpanded(loc.id, area.id)}>
                  <h5 className="font-medium text-indigo-200 text-xs truncate" title={area.name}>{area.name}</h5>
                  <span className={`text-xs transition-transform duration-150 ${area.isExpanded ? 'rotate-90' : ''}`}>►</span>
                </div>
                {area.isExpanded && (
                  <div className="mt-1 pl-2 border-l border-gray-500">
                    <p className="text-xxs text-gray-400 font-semibold">NPCs:</p>
                    <ul className="list-none pl-0 mb-1">
                      {characters.filter(c => c.isNPC && c.currentLocationId === loc.id && c.currentAreaId === area.id).map(char => <CharacterItem key={char.id} char={char}/>)}
                      {characters.filter(c => c.isNPC && c.currentLocationId === loc.id && c.currentAreaId === area.id).length === 0 && <li className="text-gray-500 italic text-xxs">None</li>}
                    </ul>
                    <button className="text-xxs px-1 py-0.5 bg-teal-700 hover:bg-teal-600 rounded text-white mb-1">New NPC</button>
                    
                    <p className="text-xxs text-gray-400 font-semibold mt-1">PCs:</p>
                    <ul className="list-none pl-0 mb-1">
                       {characters.filter(c => !c.isNPC && c.currentLocationId === loc.id && c.currentAreaId === area.id).map(char => <CharacterItem key={char.id} char={char}/>)}
                       {characters.filter(c => !c.isNPC && c.currentLocationId === loc.id && c.currentAreaId === area.id).length === 0 && <li className="text-gray-500 italic text-xxs">None</li>}
                    </ul>
                    <button className="text-xxs px-1 py-0.5 bg-sky-700 hover:bg-sky-600 rounded text-white mb-1">New PC</button>
                    
                    <p className="text-xxs text-gray-400 font-semibold mt-1">Items:</p>
                     <ul className="list-none pl-0 mb-1">
                      <li className="text-gray-500 italic text-xxs">No items</li>
                    </ul>
                    <button className="text-xxs px-1 py-0.5 bg-yellow-700 hover:bg-yellow-600 rounded text-white">New Item</button>
                  </div>
                )}
              </div>
            ))}
            {loc.areas.length === 0 && <p className="text-gray-500 italic text-xs py-1">No areas defined.</p>}
            
            <div className="mt-2 flex gap-1">
              <input
                type="text"
                value={newAreaInputs[loc.id] || ''}
                onChange={(e) => handleNewAreaInputChange(loc.id, e.target.value)}
                placeholder="New Area Name"
                className="flex-grow p-1 bg-gray-600 border border-gray-500 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none text-gray-100 text-xs"
              />
              <button onClick={() => handleCreateAreaSubmit(loc.id)} className="px-2 py-1 bg-indigo-700 hover:bg-indigo-600 text-white rounded-md text-xs">Add Area</button>
            </div>
          </div>
        )}
      </div>
    ))
  );

  return (
    <div className="p-2 text-sm h-full flex flex-col">
      <form onSubmit={handleLocationSubmit} className="flex gap-2 mb-3 flex-shrink-0">
        <input
          type="text"
          value={newLocationName}
          onChange={(e) => setNewLocationName(e.target.value)}
          placeholder="New Location Name"
          className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none text-gray-100 text-xs"
        />
        <button type="submit" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md text-xs">Add Location</button>
      </form>

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
          Active Locations ({activeLocationsList.length})
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
          Inactive Locations ({inactiveLocationsList.length})
        </button>
      </div>

      <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-1">
        {displayedLocations.length === 0 && (
          <p className="text-gray-500 italic pt-2">
            {currentSubTab === 'active' ? 'No active locations.' : 'No inactive locations.'}
          </p>
        )}
        {renderLocationGroup(displayedLocations)}
        
        {locations.length === 0 && currentSubTab === 'active' && (
             <p className="text-gray-500 italic mt-2">No locations created yet. Add one above!</p>
        )}
      </div>
    </div>
  );
};
