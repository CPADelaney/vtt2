
import { useState, useCallback } from 'react';
import { Location, Area, Character, User } from '../types';
import { multiplayerService } from '../MultiplayerService';
import { generateId } from '../utils';

interface UseLocationsAndAreasProps {
  currentUser: User;
  getCharacterById: (characterId: string) => Character | undefined;
  // FIX: (Verified) Ensure handleSystemMessage type matches the one provided (originating from useChat)
  handleSystemMessage: (message: string, type?: 'message' | 'roll' | 'info') => void;
  initialLocations?: Location[];
}

export const useLocationsAndAreas = (props: UseLocationsAndAreasProps) => {
  const { currentUser, getCharacterById, handleSystemMessage, initialLocations = [] } = props;
  
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  // Items might be managed here or separately if they become more complex. For now, not directly managed by this hook.
  const [items, setItems] = useState<import('../types').Item[]>([]);


  const handleCreateLocation = useCallback((name: string) => {
    if (!currentUser.isDM || !name.trim()) return;
    const newLocation: Location = {
        id: generateId('loc_'), name: name.trim(), isExpanded: true, isActive: true, areas: []
    };
    multiplayerService.sendLocationCreate(newLocation);
  }, [currentUser.isDM]);

  const handleSetCharacterLocationAndArea = useCallback((characterId: string, newLocationId: string | null, newAreaId: string | null) => {
    if (!currentUser.isDM) return;
    const character = getCharacterById(characterId);
    if (!character) return;

    if (character.currentLocationId !== newLocationId || character.currentAreaId !== newAreaId) {
        multiplayerService.sendCharacterLocationUpdate({ characterId, newLocationId, newAreaId });
    }
  }, [currentUser.isDM, getCharacterById]);


  const handleToggleLocationExpand = useCallback((locationId: string) => {
     if (!currentUser.isDM) return;
     multiplayerService.sendLocationToggleExpand(locationId);
  }, [currentUser.isDM]);

  const handleToggleNpcCampaignActive = useCallback((characterId: string) => {
    if (!currentUser.isDM) return;
    const character = getCharacterById(characterId);
    if (!character || !character.isNPC) return;

    const updatedCharacter = {
      ...character,
      isCampaignActive: !character.isCampaignActive,
    };
    multiplayerService.sendCharacterUpdate(updatedCharacter); // Character update handled by useCharacters
    handleSystemMessage(`${character.name} campaign status set to: ${updatedCharacter.isCampaignActive ? 'Active' : 'Inactive'}.`);
  }, [currentUser.isDM, getCharacterById, handleSystemMessage]);


  const handleToggleLocationActive = useCallback((locationId: string) => {
    if (!currentUser.isDM) return;
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return;
    multiplayerService.sendLocationActiveToggle({ locationId, isActive: !location.isActive });
  }, [currentUser.isDM, locations]);

  const handleCreateArea = useCallback((locationId: string, areaName: string) => {
    if (!currentUser.isDM || !areaName.trim()) return;
    const parentLocation = locations.find(loc => loc.id === locationId);
    if (!parentLocation) return;

    const newArea: Area = {
      id: generateId('area_'), name: areaName.trim(), isExpanded: true,
    };
    multiplayerService.sendAreaCreate({ locationId, area: newArea });
  }, [currentUser.isDM, locations]);

  const handleToggleAreaExpanded = useCallback((locationId: string, areaId: string) => {
    if (!currentUser.isDM) return;
    const location = locations.find(loc => loc.id === locationId);
    const area = location?.areas.find(ar => ar.id === areaId);
    if (!area) return;

    const updatedArea = { ...area, isExpanded: !area.isExpanded };
    multiplayerService.sendAreaUpdate({ locationId, area: updatedArea });
  }, [currentUser.isDM, locations]);

  return {
    locations, setLocations,
    items, setItems, // Expose items and setter if needed elsewhere
    handleCreateLocation,
    handleSetCharacterLocationAndArea,
    handleToggleLocationExpand,
    handleToggleNpcCampaignActive, // This might belong more with character management but is often tied to location state
    handleToggleLocationActive,
    handleCreateArea,
    handleToggleAreaExpanded,
  };
};
