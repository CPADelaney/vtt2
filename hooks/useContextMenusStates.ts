
import { useState, useCallback } from 'react';
import { Point, ContextMenuState, SidePanelContextMenuState, AttackTargetingState, SpellTargetingState } from '../types';

interface UseContextMenusStatesProps {
  attackTargetingState: AttackTargetingState;
  onCancelAttackMode: () => void;
  spellTargetingState: SpellTargetingState; // New
  onCancelSpellTargeting: () => void; // New
  selectedTokenIds: string[];
  setSelectedTokenIds: React.Dispatch<React.SetStateAction<string[]>>;
  tokens: import('../types').Token[]; 
  getCharacterById: (id: string) => import('../types').Character | undefined;
  canMoveTokenOwnedBy: (ownerId: string | null, isNPC?: boolean) => boolean;
  currentUserIsDM: boolean;
}

export const useContextMenusStates = (props: UseContextMenusStatesProps) => {
  const { 
    attackTargetingState, onCancelAttackMode, 
    spellTargetingState, onCancelSpellTargeting, // Destructure new props
    selectedTokenIds, setSelectedTokenIds, tokens, 
    getCharacterById, canMoveTokenOwnedBy, currentUserIsDM 
  } = props;

  const [mapContextMenu, setMapContextMenu] = useState<ContextMenuState>({
    visible: false, screenPosition: { x: 0, y: 0 }, worldPosition: { x: 0, y: 0 }, targetTokenId: undefined,
  });
  const [sidePanelContextMenu, setSidePanelContextMenu] = useState<SidePanelContextMenuState>({
    visible: false, screenPosition: { x: 0, y: 0 },
  });

  const handleShowMapContextMenu = useCallback((screenX: number, screenY: number, worldPt: Point, targetTkId?: string) => {
    if (attackTargetingState.isActive) {
        onCancelAttackMode();
        return;
    }
    if (spellTargetingState.isActive) { // New: Cancel spell targeting if context menu is opened
        onCancelSpellTargeting();
        return;
    }
    if (targetTkId) {
        if (!selectedTokenIds.includes(targetTkId)) {
             const token = tokens.find(t => t.id === targetTkId);
             const character = token?.characterId ? getCharacterById(token.characterId) : undefined;
             const canControl = character ? canMoveTokenOwnedBy(character.ownerPlayerId, character.isNPC) : currentUserIsDM;
             if(canControl) setSelectedTokenIds([targetTkId]);
        }
    }
    setMapContextMenu({
      visible: true, screenPosition: { x: screenX, y: screenY }, worldPosition: worldPt, targetTokenId: targetTkId,
    });
  }, [selectedTokenIds, tokens, getCharacterById, canMoveTokenOwnedBy, currentUserIsDM, attackTargetingState.isActive, onCancelAttackMode, spellTargetingState.isActive, onCancelSpellTargeting, setSelectedTokenIds]);

  const handleShowSidePanelContextMenu = useCallback((event: React.MouseEvent, itemType: 'character' | 'creatureTemplate' | 'inventoryItem' | 'equippedItem', itemId: string, itemName: string, itemSlot?: import('../types').EquipmentSlot, additionalData?: any) => {
    event.preventDefault();
    event.stopPropagation();
    // No DM check here, player might have context menu on their items in inventory
    
    setSidePanelContextMenu({
      visible: true, screenPosition: { x: event.clientX, y: event.clientY }, itemType, itemId, itemName, itemSlot, additionalData
    });
  }, []);

  const closeMapContextMenu = useCallback(() => setMapContextMenu(prev => ({ ...prev, visible: false })), []);
  const closeSidePanelContextMenu = useCallback(() => setSidePanelContextMenu(prev => ({ ...prev, visible: false })), []);


  return {
    mapContextMenu,
    setMapContextMenu,
    sidePanelContextMenu,
    setSidePanelContextMenu,
    handleShowMapContextMenu,
    handleShowSidePanelContextMenu,
    closeMapContextMenu,
    closeSidePanelContextMenu,
  };
};