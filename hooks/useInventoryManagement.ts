
import { useState, useCallback } from 'react';
import { Item, Character, EquipmentSlot, User } from '../types';
import { DND_ITEMS_DETAILED } from '../constants';
import { multiplayerService } from '../MultiplayerService';
import { getCompatibleSlotsForItem } from '../utils';


export interface UseInventoryManagementProps {
  initialItems?: Item[];
}

// Add combatState and currentTurnCharacterId to props for equip restrictions
interface HandleEquipUnequipProps {
  characterId: string;
  itemId?: string; // Only for equip
  slot: EquipmentSlot;
  currentCharacters: Character[];
  setCharactersCallback: React.Dispatch<React.SetStateAction<Character[]>>;
  currentUser: User;
  combatState: 'none' | 'pre-combat' | 'active';
  currentTurnCharacterId: string | null;
  handleSystemMessage: (message: string, type?: 'message' | 'roll' | 'info') => void;
}


export const useInventoryManagement = (props?: UseInventoryManagementProps) => {
  const [items, setItems] = useState<Item[]>(props?.initialItems || DND_ITEMS_DETAILED);

  const getItemById = useCallback((itemId: string): Item | undefined => {
    return items.find(item => item.id === itemId);
  }, [items]);

  const handleEquipItem = useCallback(({
    characterId, itemId: itemIdToEquip, slot, currentCharacters, setCharactersCallback, // Not directly used, but kept for signature consistency if logic changes
    currentUser, combatState, currentTurnCharacterId, handleSystemMessage
  }: HandleEquipUnequipProps & { itemId: string }) => {
    const character = currentCharacters.find(c => c.id === characterId);
    const itemToEquip = getItemById(itemIdToEquip);

    if (!character || !itemToEquip) {
      console.error("Character or item not found for equipping.", { characterId, itemIdToEquip });
      return;
    }

    // Combat restrictions
    if (combatState === 'active' && !currentUser.isDM && character.id !== currentTurnCharacterId) {
      handleSystemMessage("Cannot change equipment: Not your turn.", "info");
      return;
    }
    if (combatState === 'active' && !currentUser.isDM && (itemToEquip.itemCategory === 'armor' || itemToEquip.itemCategory === 'shield')) {
      handleSystemMessage(`Cannot don/doff ${itemToEquip.itemCategory} in combat. It takes too long.`, "info");
      return;
    }
    
    // Attunement check for equipping
    if (itemToEquip.requiresAttunement && !character.attunedItemIds.includes(itemIdToEquip)) {
        handleSystemMessage(`${itemToEquip.name} requires attunement before it can be equipped effectively.`, "info");
        // Allow equipping, but it won't grant magical benefits until attuned.
        // Or, strictly disallow: return;
    }


    const compatibleSlots = getCompatibleSlotsForItem(itemToEquip);
    if (!compatibleSlots.includes(slot)) {
        handleSystemMessage(`Item ${itemToEquip.name} cannot be equipped in slot ${slot}.`, "info");
        return;
    }

    const newEquippedItems = { ...character.equippedItems };
    let newItemIds = [...character.itemIds];

    const currentlyEquippedItemId = newEquippedItems[slot];
    if (currentlyEquippedItemId) {
      if (!newItemIds.includes(currentlyEquippedItemId)) {
        newItemIds.push(currentlyEquippedItemId);
      }
    }

    newEquippedItems[slot] = itemIdToEquip;
    newItemIds = newItemIds.filter(id => id !== itemIdToEquip);

    const updatedCharacter: Character = {
      ...character,
      equippedItems: newEquippedItems,
      itemIds: newItemIds,
    };
    
    multiplayerService.sendCharacterUpdate(updatedCharacter);
    if (combatState === 'active' && !currentUser.isDM && character.id === currentTurnCharacterId) {
        handleSystemMessage(`${character.name} uses an object interaction to equip ${itemToEquip.name}.`, "info");
    }

  }, [getItemById]);

  const handleUnequipItem = useCallback(({
    characterId, slot, currentCharacters, setCharactersCallback, // Not directly used, but kept for signature consistency
    currentUser, combatState, currentTurnCharacterId, handleSystemMessage
  }: HandleEquipUnequipProps) => {
    const character = currentCharacters.find(c => c.id === characterId);
    if (!character) {
      console.error("Character not found for unequipping.", { characterId });
      return;
    }

    const itemIdToUnequip = character.equippedItems[slot];
    if (!itemIdToUnequip) {
      console.warn(`No item equipped in slot ${slot} for character ${character.name}.`);
      return;
    }
    const itemBeingUnequipped = getItemById(itemIdToUnequip);

    // Combat restrictions
    if (combatState === 'active' && !currentUser.isDM && character.id !== currentTurnCharacterId) {
      handleSystemMessage("Cannot change equipment: Not your turn.", "info");
      return;
    }
    if (combatState === 'active' && !currentUser.isDM && itemBeingUnequipped && (itemBeingUnequipped.itemCategory === 'armor' || itemBeingUnequipped.itemCategory === 'shield')) {
      handleSystemMessage(`Cannot don/doff ${itemBeingUnequipped.itemCategory} in combat. It takes too long.`, "info");
      return;
    }

    const newEquippedItems = { ...character.equippedItems };
    newEquippedItems[slot] = null;

    let newItemIds = [...character.itemIds];
    if (!newItemIds.includes(itemIdToUnequip)) {
      newItemIds.push(itemIdToUnequip);
    }
    
    const updatedCharacter: Character = {
      ...character,
      equippedItems: newEquippedItems,
      itemIds: newItemIds,
    };

    multiplayerService.sendCharacterUpdate(updatedCharacter);
     if (combatState === 'active' && !currentUser.isDM && character.id === currentTurnCharacterId && itemBeingUnequipped) {
        handleSystemMessage(`${character.name} uses an object interaction to unequip ${itemBeingUnequipped.name}.`, "info");
    }

  }, [getItemById]);
  
  const handleAttuneItem = useCallback((characterId: string, itemId: string, currentCharacters: Character[], handleSystemMessage: (message: string, type?: 'message' | 'roll' | 'info') => void) => {
    const character = currentCharacters.find(c => c.id === characterId);
    const item = getItemById(itemId);

    if (!character || !item) { handleSystemMessage("Character or item not found for attunement.", "info"); return; }
    if (!item.requiresAttunement) { handleSystemMessage(`${item.name} does not require attunement.`, "info"); return; }
    if (character.attunedItemIds.includes(itemId)) { handleSystemMessage(`${item.name} is already attuned.`, "info"); return; }
    if (character.attunementSlots.current >= character.attunementSlots.max) { handleSystemMessage(`Cannot attune to ${item.name}: No attunement slots available.`, "info"); return; }

    const updatedCharacter: Character = {
      ...character,
      attunedItemIds: [...character.attunedItemIds, itemId],
      attunementSlots: { ...character.attunementSlots, current: character.attunementSlots.current + 1 },
    };
    multiplayerService.sendCharacterUpdate(updatedCharacter);
    handleSystemMessage(`${character.name} attuned to ${item.name}.`, "info");
  }, [getItemById]);

  const handleEndAttunement = useCallback((characterId: string, itemId: string, currentCharacters: Character[], handleSystemMessage: (message: string, type?: 'message' | 'roll' | 'info') => void) => {
    const character = currentCharacters.find(c => c.id === characterId);
    const item = getItemById(itemId);

    if (!character || !item) { handleSystemMessage("Character or item not found for ending attunement.", "info"); return; }
    if (!character.attunedItemIds.includes(itemId)) { handleSystemMessage(`${item.name} is not currently attuned.`, "info"); return; }

    const updatedCharacter: Character = {
      ...character,
      attunedItemIds: character.attunedItemIds.filter(id => id !== itemId),
      attunementSlots: { ...character.attunementSlots, current: Math.max(0, character.attunementSlots.current - 1) },
    };
    multiplayerService.sendCharacterUpdate(updatedCharacter);
    handleSystemMessage(`${character.name} ended attunement to ${item.name}.`, "info");
  }, [getItemById]);
  
  const handleUpdateCurrency = useCallback((characterId: string, currencyType: 'gp' | 'sp' | 'cp', newAmount: number, currentCharacters: Character[]) => {
      const character = currentCharacters.find(c => c.id === characterId);
      if(!character) return;

      const updatedCurrency = { ...character.currency, [currencyType]: Math.max(0, newAmount) };
      const updatedCharacter: Character = { ...character, currency: updatedCurrency };
      multiplayerService.sendCharacterUpdate(updatedCharacter);
  }, []);


  const addNewItemDefinition = useCallback((item: Item) => {
    setItems(prev => [...prev, item]);
  }, []);


  return {
    items, 
    setItems, 
    getItemById,
    handleEquipItem,
    handleUnequipItem,
    handleAttuneItem,
    handleEndAttunement,
    handleUpdateCurrency,
    addNewItemDefinition,
  };
};
