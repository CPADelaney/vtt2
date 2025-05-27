
import { useState, useCallback } from 'react';
// FIX: (Verified) Import Point type
import { Group, Character, CreatureTemplate, User, Location, AddToGroupItem, Point } from '../types';
import { multiplayerService } from '../MultiplayerService';
import { generateId } from '../utils';

interface UseGroupsAndModalsProps {
  currentUser: User;
  getCharacterById: (characterId: string) => Character | undefined;
  creatureTemplates: CreatureTemplate[];
  locations: Location[];
  handleSpawnNpcFromTemplate: (templateId: string, worldPosition: Point | null) => string | undefined; // From useCharacters
  // FIX: (Verified) Ensure handleSystemMessage type matches the one provided (originating from useChat)
  handleSystemMessage: (message: string, type?: 'message' | 'roll' | 'info') => void;
  initialGroups?: Group[];
}

export const useGroupsAndModals = (props: UseGroupsAndModalsProps) => {
  const { 
    currentUser, getCharacterById, creatureTemplates, locations,
    handleSpawnNpcFromTemplate, handleSystemMessage, initialGroups = [] 
  } = props;
  
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isAddToGroupModalOpen, setIsAddToGroupModalOpen] = useState(false);
  const [itemForAddToGroup, setItemForAddToGroup] = useState<AddToGroupItem | null>(null);

  const handleCreateGroupWithMembers = useCallback((
    name: string, description?: string, initialNpcCharacterIds: string[] = [], initialMonsterTemplateIds: string[] = []
  ) => {
    if (!currentUser.isDM || !name.trim()) return;

    const newGroupId = generateId('group_');
    const finalCharacterIdsInGroup: string[] = [...initialNpcCharacterIds];

    initialMonsterTemplateIds.forEach(templateId => {
      const newMonsterCharId = handleSpawnNpcFromTemplate(templateId, null);
      if (newMonsterCharId) {
        finalCharacterIdsInGroup.push(newMonsterCharId);
      }
    });

    const newGroup: Group = {
      id: newGroupId, name: name.trim(), description: description?.trim() || undefined,
      characterIds: finalCharacterIdsInGroup,
    };
    multiplayerService.sendGroupCreate(newGroup);

    handleSystemMessage(`Group "${newGroup.name}" created with ${finalCharacterIdsInGroup.length} members.`);
    setIsCreateGroupModalOpen(false);
  }, [currentUser.isDM, handleSpawnNpcFromTemplate, handleSystemMessage]);


  const handleDeleteGroup = useCallback((groupId: string) => {
    if (!currentUser.isDM) return;
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    multiplayerService.sendGroupDelete({ groupId });
    handleSystemMessage(`Group "${group.name}" deleted.`);
  }, [currentUser.isDM, groups, handleSystemMessage]);

  const handleAddCharacterToGroup = useCallback((groupId: string, characterId: string) => {
    if (!currentUser.isDM) return;
    const group = groups.find(g => g.id === groupId);
    const character = getCharacterById(characterId);
    if (!group || !character) return;
    if (group.characterIds.includes(characterId)) {
      handleSystemMessage(`${character.name} is already in group "${group.name}".`);
      return;
    }
    const updatedGroup = { ...group, characterIds: [...group.characterIds, characterId] };
    multiplayerService.sendGroupUpdate(updatedGroup);
    handleSystemMessage(`${character.name} added to group "${group.name}".`);
  }, [currentUser.isDM, groups, getCharacterById, handleSystemMessage]);

  const handleRemoveCharacterFromGroup = useCallback((groupId: string, characterId: string) => {
    if (!currentUser.isDM) return;
    const group = groups.find(g => g.id === groupId);
    const character = getCharacterById(characterId);
    if (!group || !character) return;
    if (!group.characterIds.includes(characterId)) return;

    const updatedGroup = { ...group, characterIds: group.characterIds.filter(id => id !== characterId) };
    multiplayerService.sendGroupUpdate(updatedGroup);
    handleSystemMessage(`${character.name} removed from group "${group.name}".`);
  }, [currentUser.isDM, groups, getCharacterById, handleSystemMessage]);

  const handleSpawnMonsterAndAddToGroup = useCallback((groupId: string, templateId: string) => {
    if (!currentUser.isDM) return;
    const group = groups.find(g => g.id === groupId);
    const template = creatureTemplates.find(t => t.id === templateId);
    if (!group || !template) {
      handleSystemMessage("Failed to spawn monster: Group or Template not found.");
      return;
    }

    const newCharId = handleSpawnNpcFromTemplate(templateId, null);

    if (newCharId) {
        const updatedGroup = { ...group, characterIds: [...group.characterIds, newCharId] };
        multiplayerService.sendGroupUpdate(updatedGroup);
        const spawnedChar = getCharacterById(newCharId);
        handleSystemMessage(`Spawned ${spawnedChar?.name || template.name} and added to group "${group.name}". This monster does not have a token on the map yet.`);
    } else {
        handleSystemMessage(`Failed to spawn ${template.name} for group "${group.name}".`);
    }
  }, [currentUser.isDM, groups, creatureTemplates, handleSystemMessage, handleSpawnNpcFromTemplate, getCharacterById]);

  const handleAssignGroupToLocationArea = useCallback((groupId: string, locationId: string | null, areaId: string | null) => {
    if (!currentUser.isDM) return;
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const locationName = locationId ? locations.find(l => l.id === locationId)?.name : "No Location";
    let areaName = areaId && locationId ? locations.find(l => l.id === locationId)?.areas.find(a => a.id === areaId)?.name : "";
    areaName = areaName ? ` (Area: ${areaName})` : (locationId && !areaId ? " (Location General)" : "");

    let charsAffectedCount = 0;
    group.characterIds.forEach(charId => {
      const character = getCharacterById(charId);
      if (character && (character.currentLocationId !== locationId || character.currentAreaId !== areaId)) {
        multiplayerService.sendCharacterLocationUpdate({ characterId: charId, newLocationId: locationId, newAreaId: areaId });
        charsAffectedCount++;
      }
    });
    if (charsAffectedCount > 0) {
        handleSystemMessage(`Group "${group.name}" (${charsAffectedCount} members) assigned to ${locationName}${areaName}.`);
    } else {
        handleSystemMessage(`Group "${group.name}" members are already at ${locationName}${areaName}. No changes made.`);
    }
  }, [currentUser.isDM, groups, locations, getCharacterById, handleSystemMessage]);

  const handleConfirmAddToGroup = useCallback((groupId: string, itemId: string, itemType: AddToGroupItem['type']) => {
    if (!currentUser.isDM) return;
    if (itemType === 'character') {
        handleAddCharacterToGroup(groupId, itemId);
    } else if (itemType === 'creatureTemplate') {
        handleSpawnMonsterAndAddToGroup(groupId, itemId);
    }
    setIsAddToGroupModalOpen(false);
    setItemForAddToGroup(null);
  }, [currentUser.isDM, handleAddCharacterToGroup, handleSpawnMonsterAndAddToGroup]);

  const openCreateGroupModal = useCallback(() => setIsCreateGroupModalOpen(true), []);
  const closeCreateGroupModal = useCallback(() => setIsCreateGroupModalOpen(false), []);
  const openAddToGroupModal = useCallback((item: AddToGroupItem) => {
    setItemForAddToGroup(item);
    setIsAddToGroupModalOpen(true);
  }, []);
  const closeAddToGroupModal = useCallback(() => {
    setIsAddToGroupModalOpen(false);
    setItemForAddToGroup(null);
  }, []);


  return {
    groups, setGroups,
    isCreateGroupModalOpen, openCreateGroupModal, closeCreateGroupModal,
    isAddToGroupModalOpen, openAddToGroupModal, closeAddToGroupModal,
    itemForAddToGroup,
    handleCreateGroupWithMembers,
    handleDeleteGroup,
    handleAddCharacterToGroup,
    handleRemoveCharacterFromGroup,
    handleSpawnMonsterAndAddToGroup,
    handleAssignGroupToLocationArea,
    handleConfirmAddToGroup,
  };
};
