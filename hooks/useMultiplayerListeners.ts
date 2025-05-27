
import { useEffect } from 'react';
// FIX: Added AreaDeletePayload to the import list
import { multiplayerService, CharacterDeletePayload, CharacterUpdatePayload, ChatMessagePayload, CombatStatePayload, InitiativeScoreUpdatePayload, LocationUpdatePayload, UserRoleChangePayload, CampaignNotesPayload, BulkTokenUpdatePayload, HeldActionUpdatePayload, TokenUpdatePayload, LocationActiveTogglePayload, AreaCreatePayload, AreaUpdatePayload, AreaDeletePayload, CharacterAreaUpdatePayload, ItemCreatePayload, ItemUpdatePayload, ItemDeletePayload, GroupCreatePayload, GroupUpdatePayload, GroupDeletePayload, SpellCastPayload } from '../MultiplayerService';
import { Token, ChatMessage, Character, Location, SidePanelTabName, HeldAction, AttackTargetingState, SpellTargetingState, User, Item, Area, Group, CreatureTemplate, LastD20RollDisplayInfo } from '../types';
import { SIDE_PANEL_TABS, DEFAULT_SIDE_PANEL_TAB } from '../constants';
import { addCharacterToInitiative } from '../utils';

interface UseMultiplayerListenersProps {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  
  tokens: Token[]; 
  setTokens: React.Dispatch<React.SetStateAction<Token[]>>;
  selectedTokenIds: string[]; 
  setSelectedTokenIds: React.Dispatch<React.SetStateAction<string[]>>;
  
  characters: Character[]; 
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  getCharacterById: (characterId: string) => Character | undefined;
  activePlayerCharacterId: string | null;
  setActivePlayerCharacterId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedCharacterForSheet: Character | null;
  setSelectedCharacterForSheet: React.Dispatch<React.SetStateAction<Character | null>>;
  setIsSheetModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  locations: Location[]; 
  setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
  items: Item[]; 
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  groups: Group[]; 
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  
  creatureTemplates: CreatureTemplate[]; 
  setCreatureTemplates: React.Dispatch<React.SetStateAction<CreatureTemplate[]>>;

  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  
  campaignNotes: string;
  setCampaignNotes: React.Dispatch<React.SetStateAction<string>>;
  
  combatState: 'none' | 'pre-combat' | 'active';
  setCombatState: React.Dispatch<React.SetStateAction<'none' | 'pre-combat' | 'active'>>;
  initiativeOrder: string[];
  setInitiativeOrder: React.Dispatch<React.SetStateAction<string[]>>;
  currentTurnCharacterId: string | null;
  setCurrentTurnCharacterId: React.Dispatch<React.SetStateAction<string | null>>;
  roundCounter: number;
  setRoundCounter: React.Dispatch<React.SetStateAction<number>>;
  
  heldActions: Record<string, HeldAction | null>;
  setHeldActions: React.Dispatch<React.SetStateAction<Record<string, HeldAction | null>>>;
  
  attackTargetingState: AttackTargetingState;
  setAttackTargetingState: React.Dispatch<React.SetStateAction<AttackTargetingState>>;
  
  spellTargetingState: SpellTargetingState; // New
  setSpellTargetingState: React.Dispatch<React.SetStateAction<SpellTargetingState>>; // New

  activeSidePanelTab: SidePanelTabName;
  setActiveSidePanelTab: React.Dispatch<React.SetStateAction<SidePanelTabName>>;
  
  handleSystemMessage: (message: string, type?: 'message' | 'roll' | 'info') => void;
  setLastD20RollInfo: React.Dispatch<React.SetStateAction<LastD20RollDisplayInfo | null>>; 
}

export const useMultiplayerListeners = (props: UseMultiplayerListenersProps) => {
  const {
    currentUser, setCurrentUser,
    tokens, setTokens, selectedTokenIds, setSelectedTokenIds,
    characters, setCharacters, getCharacterById, 
    activePlayerCharacterId, setActivePlayerCharacterId, 
    selectedCharacterForSheet, setSelectedCharacterForSheet, setIsSheetModalOpen,
    setLocations, setItems, setGroups, setCreatureTemplates,
    setChatMessages, setCampaignNotes,
    combatState, setCombatState, initiativeOrder, setInitiativeOrder, 
    currentTurnCharacterId, setCurrentTurnCharacterId, roundCounter, setRoundCounter,
    heldActions, setHeldActions, attackTargetingState, setAttackTargetingState,
    spellTargetingState, setSpellTargetingState, // Destructure new props
    activeSidePanelTab, setActiveSidePanelTab,
    handleSystemMessage, setLastD20RollInfo 
  } = props;

  useEffect(() => {
    const handleUserRoleChange = (payload: UserRoleChangePayload) => {
      if (payload.userId === currentUser.id) {
        setCurrentUser({ id: payload.userId, name: payload.name, isDM: payload.isDM });
        setSelectedTokenIds([]);
        setActivePlayerCharacterId(null);
         const currentTabDef = SIDE_PANEL_TABS.find(t => t.id === activeSidePanelTab);
         if (!payload.isDM && currentTabDef?.dmOnly) setActiveSidePanelTab(DEFAULT_SIDE_PANEL_TAB.id);
         if (payload.isDM && currentTabDef?.playerOnly) setActiveSidePanelTab(DEFAULT_SIDE_PANEL_TAB.id);
        if (combatState === 'none' && activeSidePanelTab === 'combat') setActiveSidePanelTab(DEFAULT_SIDE_PANEL_TAB.id);
      }
    };

    const handleTokenUpdate = (updatedToken: TokenUpdatePayload) => {
      setTokens(prevTokens => {
        const tokenIndex = prevTokens.findIndex(t => t.id === updatedToken.id);
        if (tokenIndex !== -1) {
          const newTokens = [...prevTokens];
          newTokens[tokenIndex] = updatedToken;
          return newTokens;
        } else {
          return [...prevTokens, updatedToken];
        }
      });
    };
    const handleBulkTokenUpdate = (payload: BulkTokenUpdatePayload) => {
        setTokens(prevTokens => {
            const newTokensMap = new Map(payload.map(t => [t.id, t]));
            return prevTokens.map(t => newTokensMap.get(t.id) || t)
                             .concat(payload.filter(ut => !prevTokens.some(pt => pt.id === ut.id)));
        });
    };
    const handleTokenRemovedFromMap = ({ tokenId, characterId: charIdAssociatedWithToken }: { tokenId: string, characterId?: string }) => {
        setTokens(prev => prev.filter(t => t.id !== tokenId));
        setSelectedTokenIds(prev => prev.filter(id => id !== tokenId));
        if (attackTargetingState.isActive && attackTargetingState.attackerId === charIdAssociatedWithToken) {
          setAttackTargetingState({ isActive: false, attackerId: null, actionId: null, actionDetails: null });
        }
        if (spellTargetingState.isActive && spellTargetingState.casterId === charIdAssociatedWithToken) { // Reset spell targeting if caster token removed
            setSpellTargetingState({isActive: false, casterId: null, spell: null });
        }
        if (charIdAssociatedWithToken && (combatState === 'pre-combat' || combatState === 'active')) {
            const charData = getCharacterById(charIdAssociatedWithToken);
            const oldOrder = initiativeOrder;
            let newOrder = initiativeOrder.filter(id => id !== charIdAssociatedWithToken);
            let newCurrentTurn = currentTurnCharacterId;
            let newCharactersState = characters.map(c => c.id === charIdAssociatedWithToken ? {...c, initiative: undefined, currentAreaId: null} : c);
            setCharacters(newCharactersState); 

            if (combatState === 'active' && currentTurnCharacterId === charIdAssociatedWithToken) {
                if (newOrder.length > 0) {
                    const currentIndexInOldOrder = oldOrder.indexOf(charIdAssociatedWithToken);
                    const nextIndex = currentIndexInOldOrder % newOrder.length;
                    newCurrentTurn = newOrder[nextIndex];
                     if (newCurrentTurn) {
                         const nextChar = newCharactersState.find(c => c.id === newCurrentTurn);
                         if (nextChar) handleSystemMessage(`Turn advanced to ${nextChar.name} as ${charData?.name || 'actor'} was removed.`);
                     }
                } else {
                    newCurrentTurn = null; handleSystemMessage(`Last combatant removed. Combat effectively ended.`);
                }
            }
            setInitiativeOrder(newOrder);
            setCurrentTurnCharacterId(newCurrentTurn);
            if (heldActions[charIdAssociatedWithToken]) {
                setHeldActions(prev => { const newHeld = { ...prev }; delete newHeld[charIdAssociatedWithToken!]; return newHeld; });
            }
        } else if (charIdAssociatedWithToken) {
            setCharacters(prev => prev.map(c => c.id === charIdAssociatedWithToken ? { ...c, currentAreaId: null } : c));
        }
    };
    const handleChatMessage = (message: ChatMessagePayload) => {
      setChatMessages(prev => [...prev, message]);

      if (message.type === 'roll' && message.rollDetails) {
        const details = message.rollDetails;
        let rollType = "Roll";
        
        const descriptionContext = details.description ? details.description.toLowerCase() : "";
        const diceContext = details.diceExpression ? details.diceExpression.toLowerCase() : "";
        const fullContext = `${descriptionContext} ${diceContext}`.trim();


        if (fullContext.includes("attack") || fullContext.includes("hit")) rollType = "Attack";
        else if (fullContext.includes("save") || fullContext.includes("saving throw")) {
          if (fullContext.includes("str")) rollType = "STR Save";
          else if (fullContext.includes("dex")) rollType = "DEX Save";
          else if (fullContext.includes("con")) rollType = "CON Save";
          else if (fullContext.includes("int")) rollType = "INT Save";
          else if (fullContext.includes("wis")) rollType = "WIS Save";
          else if (fullContext.includes("cha")) rollType = "CHA Save";
          else rollType = "Save";
        } else if (fullContext.includes("check") || fullContext.includes("ability")) {
          const skillKeywords = ["athletics", "acrobatics", "sleight of hand", "stealth", "arcana", "history", "investigation", "nature", "religion", "animal handling", "insight", "medicine", "perception", "survival", "deception", "intimidation", "performance", "persuasion"];
          const foundSkill = skillKeywords.find(skill => fullContext.includes(skill));
          if (foundSkill) rollType = `${foundSkill.charAt(0).toUpperCase() + foundSkill.slice(1)} Check`;
          else rollType = "Ability Check";
        } else if (fullContext.includes("initiative")) {
          rollType = "Initiative";
        }
        
        let outcome: LastD20RollDisplayInfo['outcome'] = 'dm_resolves';
        if (details.d20Value === 20 && rollType.toLowerCase().includes("attack") ) { 
            outcome = 'critical_hit';
        } else if (details.d20Value === 20) { 
            outcome = 'success';
        } else if (details.d20Value === 1 && rollType.toLowerCase().includes("attack") ) { 
            outcome = 'critical_miss';
        } else if (details.d20Value === 1) { 
            outcome = 'failure';
        } else if (details.isSuccess !== undefined) {
          outcome = details.isSuccess ? 'success' : 'failure';
        }


        const displayInfo: LastD20RollDisplayInfo = {
          characterName: details.characterName,
          rollType: rollType,
          d20Value: details.d20Value || 0,
          totalResult: details.totalResult,
          targetValue: details.targetAC,
          outcome: outcome,
          timestamp: Date.now(),
          advantageState: details.advantageState,
          d20Rolls: details.d20Rolls,
        };
        setLastD20RollInfo(displayInfo);
      }
    };
    const handleCharacterCreate = (newCharacterPayload: CharacterUpdatePayload) => {
        const charToAdd: Character = {
            ...newCharacterPayload,
            temporaryEffects: newCharacterPayload.temporaryEffects || []
        };
        setCharacters(prev => {
            if (prev.some(c => c.id === charToAdd.id)) return prev;
            return [...prev, charToAdd];
        });
    };
    const handleCharacterUpdate = (updatedCharacterPayload: CharacterUpdatePayload) => {
      setCharacters(prevChars => prevChars.map(c => {
        if (c.id === updatedCharacterPayload.id) {
          // Merge existing character with payload, ensuring temporaryEffects remains an array
          return {
            ...c,
            ...updatedCharacterPayload,
            temporaryEffects: updatedCharacterPayload.temporaryEffects || c.temporaryEffects || []
          };
        }
        return c;
      }));
      if (selectedCharacterForSheet && selectedCharacterForSheet.id === updatedCharacterPayload.id) {
        setSelectedCharacterForSheet(prevSelected => ({
            ...prevSelected!, // prevSelected is guaranteed by the if condition
            ...updatedCharacterPayload,
            temporaryEffects: updatedCharacterPayload.temporaryEffects || prevSelected!.temporaryEffects || []
        }));
      }
    };
    const handleCharacterDelete = (payload: CharacterDeletePayload) => {
      setCharacters(prev => prev.filter(c => c.id !== payload.characterId));
      setTokens(prev => prev.filter(t => t.characterId !== payload.characterId));
      setSelectedTokenIds(prev => {
        const tokenToDelete = tokens.find(t => t.characterId === payload.characterId);
        return tokenToDelete ? prev.filter(id => id !== tokenToDelete.id) : prev;
      });
      setInitiativeOrder(prev => prev.filter(id => id !== payload.characterId));
      if (currentTurnCharacterId === payload.characterId) {
        setCurrentTurnCharacterId(null); 
      }
      if (selectedCharacterForSheet && selectedCharacterForSheet.id === payload.characterId) {
        setIsSheetModalOpen(false);
        setSelectedCharacterForSheet(null);
      }
      if (activePlayerCharacterId === payload.characterId) {
        setActivePlayerCharacterId(null);
      }
       if (attackTargetingState.isActive && attackTargetingState.attackerId === payload.characterId) {
          setAttackTargetingState({ isActive: false, attackerId: null, actionId: null, actionDetails: null });
       }
       if (spellTargetingState.isActive && spellTargetingState.casterId === payload.characterId) { 
           setSpellTargetingState({isActive: false, casterId: null, spell: null });
       }
       setHeldActions(prev => { const newHeld = { ...prev }; delete newHeld[payload.characterId]; return newHeld; });
    };

    const handleCampaignNotesUpdate = (payload: CampaignNotesPayload) => setCampaignNotes(payload.notes);

    const handleCombatStateUpdate = (payload: CombatStatePayload) => {
      setCombatState(payload.combatState);
      setInitiativeOrder(payload.initiativeOrder);
      setCurrentTurnCharacterId(payload.currentTurnCharacterId);
      setRoundCounter(payload.roundCounter);
      if (payload.updatedCharacters && payload.updatedCharacters.length > 0) {
        setCharacters(prevChars => {
          let newCharStateList = [...prevChars];
          payload.updatedCharacters!.forEach(updatedCharFromPayload => {
            const index = newCharStateList.findIndex(c => c.id === updatedCharFromPayload.id);
            if (index !== -1) {
              // Merge existing character with payload
              newCharStateList[index] = {
                ...newCharStateList[index],
                ...updatedCharFromPayload,
                temporaryEffects: updatedCharFromPayload.temporaryEffects || newCharStateList[index].temporaryEffects || []
              };
            } else {
              // Add if new
              newCharStateList.push({
                ...updatedCharFromPayload,
                temporaryEffects: updatedCharFromPayload.temporaryEffects || []
              });
            }
          });
          return newCharStateList;
        });
      }
      if (payload.combatState === 'none') {
         setAttackTargetingState({ isActive: false, attackerId: null, actionId: null, actionDetails: null });
         setSpellTargetingState({isActive: false, casterId: null, spell: null });
         setHeldActions({});
      }
    };
    const handleInitiativeScoreUpdate = (payload: InitiativeScoreUpdatePayload) => {
        setCharacters(payload.updatedCharacters.map(c => ({...c, temporaryEffects: c.temporaryEffects || [] })));
        setInitiativeOrder(payload.newInitiativeOrder);
    };
    const handleHeldActionUpdate = (payload: HeldActionUpdatePayload) => {
        setHeldActions(prev => {
            const newHeld = { ...prev };
            if ('clear' in payload && payload.clear) {
                delete newHeld[payload.characterId];
            } else if ('actionName' in payload) {
                newHeld[payload.characterId] = payload;
            }
            return newHeld;
        });
    };
    const handleSpellCast = (payload: SpellCastPayload) => { 
        const caster = getCharacterById(payload.casterId);
        const target = getCharacterById(payload.targetId);
        if (caster && target) {
            handleSystemMessage(`${caster.name} casts ${payload.spellName} at ${target.name}. (Received by others)`);
        } else if (caster && payload.targetId === "AREA_EFFECT") {
             handleSystemMessage(`${caster.name} casts ${payload.spellName} targeting an area. (Received by others)`);
        }
    };

    const handleLocationCreate = (newLocation: LocationUpdatePayload) => setLocations(prev => [...prev, newLocation]);
    const handleLocationActiveToggle = (payload: LocationActiveTogglePayload) => {
      setLocations(prev => prev.map(loc => loc.id === payload.locationId ? {...loc, isActive: payload.isActive} : loc));
    };
    const handleLocationToggleExpand = (payload: { locationId: string }) => {
        setLocations(prevLocs => prevLocs.map(loc => 
            loc.id === payload.locationId ? { ...loc, isExpanded: !loc.isExpanded } : loc
        ));
    };
    const handleAreaCreate = (payload: AreaCreatePayload) => {
        setLocations(prev => prev.map(loc => 
            loc.id === payload.locationId ? { ...loc, areas: [...loc.areas, payload.area] } : loc
        ));
    };
    const handleAreaUpdate = (payload: AreaUpdatePayload) => {
         setLocations(prev => prev.map(loc => 
            loc.id === payload.locationId 
                ? { ...loc, areas: loc.areas.map(ar => ar.id === payload.area.id ? payload.area : ar) } 
                : loc
        ));
    };
    const handleAreaDelete = (payload: AreaDeletePayload) => {
        setLocations(prev => prev.map(loc => 
            loc.id === payload.locationId 
                ? { ...loc, areas: loc.areas.filter(ar => ar.id !== payload.areaId) } 
                : loc
        ));
    };
    const handleCharacterLocationUpdate = (payload: CharacterAreaUpdatePayload) => {
        setCharacters(prev => prev.map(char => 
            char.id === payload.characterId 
                ? { ...char, currentLocationId: payload.newLocationId, currentAreaId: payload.newAreaId } 
                : char
        ));
    };
    
    const handleItemCreate = (payload: ItemCreatePayload) => setItems(prev => [...prev, payload.item]);
    const handleItemUpdate = (payload: ItemUpdatePayload) => setItems(prev => prev.map(item => item.id === payload.item.id ? payload.item : item));
    const handleItemDelete = (payload: ItemDeletePayload) => setItems(prev => prev.filter(item => item.id !== payload.itemId));

    const handleGroupCreate = (payload: GroupCreatePayload) => setGroups(prev => [...prev, payload]);
    const handleGroupUpdate = (payload: GroupUpdatePayload) => setGroups(prev => prev.map(g => g.id === payload.id ? payload : g));
    const handleGroupDelete = (payload: GroupDeletePayload) => setGroups(prev => prev.filter(g => g.id !== payload.groupId));



    multiplayerService.on('userRoleChange', handleUserRoleChange);
    multiplayerService.on('tokenUpdate', handleTokenUpdate);
    multiplayerService.on('bulkTokenUpdate', handleBulkTokenUpdate);
    multiplayerService.on('tokenRemovedFromMap', handleTokenRemovedFromMap);
    multiplayerService.on('chatMessage', handleChatMessage);
    multiplayerService.on('characterCreate', handleCharacterCreate);
    multiplayerService.on('characterUpdate', handleCharacterUpdate);
    multiplayerService.on('characterDelete', handleCharacterDelete);
    multiplayerService.on('campaignNotesUpdate', handleCampaignNotesUpdate);
    multiplayerService.on('combatStateUpdate', handleCombatStateUpdate);
    multiplayerService.on('initiativeScoreUpdate', handleInitiativeScoreUpdate);
    multiplayerService.on('heldActionUpdate', handleHeldActionUpdate);
    multiplayerService.on('spellCast', handleSpellCast); 

    multiplayerService.on('locationCreate', handleLocationCreate);
    multiplayerService.on('locationActiveToggle', handleLocationActiveToggle);
    multiplayerService.on('locationToggleExpand', handleLocationToggleExpand);
    multiplayerService.on('areaCreate', handleAreaCreate);
    multiplayerService.on('areaUpdate', handleAreaUpdate);
    multiplayerService.on('areaDelete', handleAreaDelete);
    multiplayerService.on('characterLocationUpdate', handleCharacterLocationUpdate);
    multiplayerService.on('itemCreate', handleItemCreate);
    multiplayerService.on('itemUpdate', handleItemUpdate);
    multiplayerService.on('itemDelete', handleItemDelete);
    
    multiplayerService.on('groupCreate', handleGroupCreate);
    multiplayerService.on('groupUpdate', handleGroupUpdate);
    multiplayerService.on('groupDelete', handleGroupDelete);


    return () => {
      multiplayerService.off('userRoleChange', handleUserRoleChange);
      multiplayerService.off('tokenUpdate', handleTokenUpdate);
      multiplayerService.off('bulkTokenUpdate', handleBulkTokenUpdate);
      multiplayerService.off('tokenRemovedFromMap', handleTokenRemovedFromMap);
      multiplayerService.off('chatMessage', handleChatMessage);
      multiplayerService.off('characterCreate', handleCharacterCreate);
      multiplayerService.off('characterUpdate', handleCharacterUpdate);
      multiplayerService.off('characterDelete', handleCharacterDelete);
      multiplayerService.off('campaignNotesUpdate', handleCampaignNotesUpdate);
      multiplayerService.off('combatStateUpdate', handleCombatStateUpdate);
      multiplayerService.off('initiativeScoreUpdate', handleInitiativeScoreUpdate);
      multiplayerService.off('heldActionUpdate', handleHeldActionUpdate);
      multiplayerService.off('spellCast', handleSpellCast); 

      multiplayerService.off('locationCreate', handleLocationCreate);
      multiplayerService.off('locationActiveToggle', handleLocationActiveToggle);
      multiplayerService.off('locationToggleExpand', handleLocationToggleExpand);
      multiplayerService.off('areaCreate', handleAreaCreate);
      multiplayerService.off('areaUpdate', handleAreaUpdate);
      multiplayerService.off('areaDelete', handleAreaDelete);
      multiplayerService.off('characterLocationUpdate', handleCharacterLocationUpdate);
      multiplayerService.off('itemCreate', handleItemCreate);
      multiplayerService.off('itemUpdate', handleItemUpdate);
      multiplayerService.off('itemDelete', handleItemDelete);
      
      multiplayerService.off('groupCreate', handleGroupCreate);
      multiplayerService.off('groupUpdate', handleGroupUpdate);
      multiplayerService.off('groupDelete', handleGroupDelete);
    };
  }, [ 
    currentUser, setCurrentUser, tokens, setTokens, selectedTokenIds, setSelectedTokenIds,
    characters, setCharacters, getCharacterById, activePlayerCharacterId, setActivePlayerCharacterId,
    selectedCharacterForSheet, setSelectedCharacterForSheet, setIsSheetModalOpen,
    setLocations, setItems, setGroups, setCreatureTemplates,
    setChatMessages, setCampaignNotes,
    combatState, setCombatState, initiativeOrder, setInitiativeOrder, currentTurnCharacterId, setCurrentTurnCharacterId, roundCounter, setRoundCounter,
    heldActions, setHeldActions, attackTargetingState, setAttackTargetingState,
    spellTargetingState, setSpellTargetingState, 
    activeSidePanelTab, setActiveSidePanelTab,
    handleSystemMessage, setLastD20RollInfo
  ]);
};
