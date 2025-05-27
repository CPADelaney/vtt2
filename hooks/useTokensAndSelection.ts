


import { useState, useCallback, useRef } from 'react';
import { Token, Point, AttackTargetingState, SpellTargetingState, Character, User } from '../types'; // User is imported
import { snapPointToGrid } from '../utils';
import { multiplayerService } from '../MultiplayerService';
// FIX: Imported GRID_CELL_SIZE from constants.
import { GRID_CELL_SIZE } from '../constants';

interface UseTokensAndSelectionProps {
  currentUser: User;
  attackTargetingState: AttackTargetingState;
  spellTargetingState: SpellTargetingState; // Added
  getCharacterById: (characterId: string) => Character | undefined;
  canMoveTokenOwnedBy: (ownerPlayerId: string | null, isNPC?: boolean) => boolean;
  handleSystemMessage: (message: string, type?: 'message' | 'roll' | 'info') => void;
  initialTokens?: Token[];
}

export const useTokensAndSelection = (props: UseTokensAndSelectionProps) => {
  const { currentUser, attackTargetingState, spellTargetingState, getCharacterById, canMoveTokenOwnedBy, handleSystemMessage } = props;
  
  const initialTokensForState = props.initialTokens ?? [];
  
  const [tokens, setTokens] = useState<Token[]>(initialTokensForState);
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  
  const groupDragStartPositions = useRef<Map<string, Point> | null>(null);
  const primaryDraggedTokenId = useRef<string | null>(null);

  const handleTokenSelect = useCallback((tokenId: string | null, isMultiSelect: boolean = false) => {
    if (attackTargetingState.isActive || spellTargetingState.isActive) return; // Disable if any targeting is active

    if (tokenId === null) {
      setSelectedTokenIds([]);
    } else {
      const token = tokens.find(t => t.id === tokenId);
      const character = token?.characterId ? getCharacterById(token.characterId) : undefined;

      if (isMultiSelect) {
        setSelectedTokenIds(prev => {
            const newSelection = prev.includes(tokenId) ? prev.filter(id => id !== tokenId) : [...prev, tokenId];
             return newSelection.filter(id => {
                const selToken = tokens.find(t => t.id === id);
                const char = selToken?.characterId ? getCharacterById(selToken.characterId) : undefined;
                return char ? canMoveTokenOwnedBy(char.ownerPlayerId, char.isNPC) : currentUser.isDM;
            });
        });
      } else {
        if (character ? canMoveTokenOwnedBy(character.ownerPlayerId, character.isNPC) : currentUser.isDM) {
            setSelectedTokenIds([tokenId]);
        } else {
            setSelectedTokenIds([]);
        }
      }
    }
  }, [tokens, getCharacterById, canMoveTokenOwnedBy, currentUser.isDM, attackTargetingState.isActive, spellTargetingState.isActive, setSelectedTokenIds]);

  const handleMarqueeSelect = useCallback((selectedIdsFromMarquee: string[]) => {
    if (attackTargetingState.isActive || spellTargetingState.isActive) return; // Disable if any targeting is active
    const controllableSelectedIds = selectedIdsFromMarquee.filter(tokenId => {
        const token = tokens.find(t => t.id === tokenId);
        const char = token?.characterId ? getCharacterById(token.characterId) : undefined;
        return char ? canMoveTokenOwnedBy(char.ownerPlayerId, char.isNPC) : currentUser.isDM;
    });
    setSelectedTokenIds(controllableSelectedIds);
  }, [tokens, getCharacterById, canMoveTokenOwnedBy, currentUser.isDM, attackTargetingState.isActive, spellTargetingState.isActive, setSelectedTokenIds]);

  const handleTokenDragStart = useCallback((tokenId: string, clickOffset: Point) => {
    if (attackTargetingState.isActive || spellTargetingState.isActive) return; // Disable if any targeting is active

    const token = tokens.find(t => t.id === tokenId);
    const character = token?.characterId ? getCharacterById(token.characterId) : undefined;
    const canControl = character ? canMoveTokenOwnedBy(character.ownerPlayerId, character.isNPC) : currentUser.isDM;

    if (!canControl) return;

    primaryDraggedTokenId.current = tokenId;

    if (selectedTokenIds.includes(tokenId) && selectedTokenIds.length > 1) {
      const controllableGroup = selectedTokenIds.filter(id => {
        const selToken = tokens.find(t => t.id === id);
        const char = selToken?.characterId ? getCharacterById(selToken.characterId) : undefined;
        return char ? canMoveTokenOwnedBy(char.ownerPlayerId, char.isNPC) : currentUser.isDM;
      });
      if (controllableGroup.length < selectedTokenIds.length || !controllableGroup.includes(tokenId)) {
        setSelectedTokenIds(canControl ? [tokenId] : []);
        groupDragStartPositions.current = null;
      } else {
         const currentPositions = new Map<string, Point>();
          controllableGroup.forEach(id => {
            const tk = tokens.find(t => t.id === id);
            if (tk) currentPositions.set(id, tk.position);
          });
          groupDragStartPositions.current = currentPositions;
      }
    } else {
      if (!selectedTokenIds.includes(tokenId) || selectedTokenIds.length !== 1) {
         setSelectedTokenIds(canControl ? [tokenId] : []);
      }
      groupDragStartPositions.current = null;
    }
  }, [selectedTokenIds, tokens, getCharacterById, canMoveTokenOwnedBy, currentUser.isDM, attackTargetingState.isActive, spellTargetingState.isActive, setSelectedTokenIds]);

  const handleTokenMove = useCallback((movedTokenId: string, newPosition: Point) => {
    if (attackTargetingState.isActive || spellTargetingState.isActive) return; // Disable if any targeting is active

    const token = tokens.find(t => t.id === movedTokenId);
    if (!token) return;
    const character = token?.characterId ? getCharacterById(token.characterId) : undefined;
    const canControl = character ? canMoveTokenOwnedBy(character.ownerPlayerId, character.isNPC) : currentUser.isDM;

    if (!canControl) return;

    if (primaryDraggedTokenId.current === movedTokenId && groupDragStartPositions.current && groupDragStartPositions.current.size > 0 && selectedTokenIds.includes(movedTokenId)) {
      const primaryOriginalPos = groupDragStartPositions.current.get(movedTokenId);
      if (!primaryOriginalPos) {
        // FIX: Pass GRID_CELL_SIZE to snapPointToGrid
        const updatedToken = { ...token, position: snapPointToGrid(newPosition, GRID_CELL_SIZE) };
        multiplayerService.sendTokenUpdate(updatedToken);
        return;
      }

      const delta: Point = { x: newPosition.x - primaryOriginalPos.x, y: newPosition.y - primaryOriginalPos.y };
      const tokensToUpdate: Token[] = [];

      tokens.forEach(t => {
          if (groupDragStartPositions.current!.has(t.id) && selectedTokenIds.includes(t.id)) { 
            const selToken = tokens.find(st => st.id === t.id); 
            if (!selToken) return;
            const charForThisToken = selToken?.characterId ? getCharacterById(selToken.characterId) : undefined;
            const canMoveThisGroupMember = charForThisToken ? canMoveTokenOwnedBy(charForThisToken.ownerPlayerId, charForThisToken.isNPC) : currentUser.isDM;
            
            const originalPos = groupDragStartPositions.current!.get(t.id)!;

            if (canMoveThisGroupMember) {
                const targetPosition = { x: originalPos.x + delta.x, y: originalPos.y + delta.y };
                // FIX: Pass GRID_CELL_SIZE to snapPointToGrid
                tokensToUpdate.push({ ...selToken, position: snapPointToGrid(targetPosition, GRID_CELL_SIZE) });
            }
          }
      });
      if (tokensToUpdate.length > 0) {
        multiplayerService.sendBulkTokenUpdate(tokensToUpdate);
      }

    } else {
      // FIX: Pass GRID_CELL_SIZE to snapPointToGrid
      const updatedToken = { ...token, position: snapPointToGrid(newPosition, GRID_CELL_SIZE) };
      multiplayerService.sendTokenUpdate(updatedToken);
    }
  }, [selectedTokenIds, tokens, getCharacterById, canMoveTokenOwnedBy, currentUser.isDM, attackTargetingState.isActive, spellTargetingState.isActive]);

  const handleTokenDragEnd = useCallback(() => {
    primaryDraggedTokenId.current = null;
    groupDragStartPositions.current = null;
  }, []);

  const handleRemoveTokenFromMap = useCallback((tokenIdToRemove: string) => {
    const tokenToRemove = tokens.find(t => t.id === tokenIdToRemove);
    if (!tokenToRemove) return;

    const character = tokenToRemove.characterId ? getCharacterById(tokenToRemove.characterId) : undefined;
    const canControl = character ? canMoveTokenOwnedBy(character.ownerPlayerId, character.isNPC) : currentUser.isDM;

    if (!canControl) {
        handleSystemMessage("You don't have permission to remove this token.");
        return;
    }

    multiplayerService.sendTokenRemoveFromMap(tokenIdToRemove, tokenToRemove.characterId);
  }, [tokens, getCharacterById, canMoveTokenOwnedBy, currentUser.isDM, handleSystemMessage]);


  return {
    tokens, setTokens,
    selectedTokenIds, setSelectedTokenIds,
    handleTokenSelect,
    handleMarqueeSelect,
    handleTokenDragStart,
    handleTokenMove,
    handleTokenDragEnd,
    handleRemoveTokenFromMap,
  };
};
