
import React from 'react';
import { User, SidePanelTabName, ChatMessage, Character, Location, CharacterCreationData, CreatureTemplate, HeldAction, ActionDetail, Item, Area, Group, TabDefinition, EquipmentSlot } from '../../types';
import { SIDE_PANEL_TABS, DEFAULT_SIDE_PANEL_TAB, DEFAULT_PLAYER_ACTIVE_CHAR_TAB } from '../constants';

interface SidePanelProps {
  currentUser: User;
  activeTab: SidePanelTabName;
  onTabChange: (tabId: SidePanelTabName) => void;

  chatMessages: ChatMessage[];
  onSendMessage: (messageText: string, type?: 'message' | 'roll' | 'info') => void;

  characters: Character[];
  getCharacterById: (characterId: string) => Character | undefined;
  onOpenCharacterCreation: () => void;
  onOpenSheet: (characterId: string) => void;
  onDeleteCharacter: (characterId: string) => void;
  onAssignCharacter: (characterId: string, playerId: string | null) => void;
  onOpenAssignModal: (characterId: string) => void;

  onCreateNPC: (data: CharacterCreationData) => void;
  onToggleNpcCampaignActive: (characterId: string) => void;

  locations: Location[];
  
  // Items and Inventory Management
  items: Item[]; // Global list of all items
  getItemById: (itemId: string) => Item | undefined;
  onEquipItem: (characterId: string, itemId: string, slot: EquipmentSlot, combatState: 'none' | 'pre-combat' | 'active', currentTurnCharacterId: string | null) => void;
  onUnequipItem: (characterId: string, slot: EquipmentSlot, combatState: 'none' | 'pre-combat' | 'active', currentTurnCharacterId: string | null) => void;
  onAttuneItem: (characterId: string, itemId: string) => void;
  onEndAttunement: (characterId: string, itemId: string) => void;
  onUpdateCurrency: (characterId: string, currencyType: 'gp' | 'sp' | 'cp', newAmount: number) => void;
  
  onCreateLocation: (name: string) => void;
  onToggleLocationExpand: (locationId: string) => void;
  onToggleLocationActive: (locationId: string) => void;
  onCreateArea: (locationId: string, areaName: string) => void;
  onToggleAreaExpanded: (locationId: string, areaId: string) => void;
  onSetCharacterLocationAndArea: (characterId: string, newLocationId: string | null, newAreaId: string | null) => void;

  campaignNotes: string;
  onUpdateCampaignNotes: (notes: string) => void;

  creatureTemplates: CreatureTemplate[];
  onOpenTemplateForViewing?: (templateId: string) => void;

  combatState: 'none' | 'pre-combat' | 'active';
  initiativeOrder: string[];
  currentTurnCharacterId: string | null;
  roundCounter: number;
  onEndTurn: () => void;
  onUpdateInitiativeScore: (characterId: string, newScore: number) => void;
  heldActions: Record<string, HeldAction | null>;
  onSetHeldAction: (characterId: string, actionName: string, triggerDescription: string) => void;
  onUseHeldAction: (characterId: string) => void;
  onInitiateAttack: (attackerId: string, action: ActionDetail) => void;

  groups: Group[];
  onOpenCreateGroupModal: () => void;
  onCreateGroupWithMembers: (name: string, description?: string, initialNpcIds?: string[], initialMonsterTemplateIds?: string[]) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddCharacterToGroup: (groupId: string, characterId: string) => void;
  onRemoveCharacterFromGroup: (groupId: string, characterId: string) => void;
  onSpawnMonsterAndAddToGroup: (groupId: string, templateId: string) => void;
  onAssignGroupToLocationArea: (groupId: string, locationId: string | null, areaId: string | null) => void;

  onShowSidePanelContextMenu: (event: React.MouseEvent, itemType: 'character' | 'creatureTemplate' | 'inventoryItem' | 'equippedItem', itemId: string, itemName: string, itemSlot?: EquipmentSlot, additionalData?: any) => void;


  activePlayerCharacter: Character | null;
  onSetActivePlayerCharacterId: (characterId: string) => void;
  onUpdateSpellSlot: (level: string, change: number) => void;
  onUpdateHitDice: (characterId: string, type: 'spend' | 'regain_one' | 'regain_all', value?: number | string) => void;
  onUpdateDeathSaves: (characterId: string, type: 'success' | 'failure', increment: boolean) => void;
  
  areTooltipsEnabled?: boolean;
  onToggleTooltips?: () => void;
  onToggleDMView?: () => void; // Add new prop
}

export const SidePanel: React.FC<SidePanelProps> = (props) => {
  const { 
    currentUser, activeTab, onTabChange, combatState, currentTurnCharacterId,
    activePlayerCharacter, areTooltipsEnabled, onToggleTooltips, 
    items, getItemById, onEquipItem, onUnequipItem, onAttuneItem, onEndAttunement, onUpdateCurrency,
    onShowSidePanelContextMenu, onToggleDMView // Destructure new prop
  } = props;

  const visibleTabs = SIDE_PANEL_TABS.filter(tab => {
    if (tab.dmOnly && !currentUser.isDM) return false;
    if (tab.playerOnly && currentUser.isDM) return false;
    if (tab.playerOnly && !activePlayerCharacter && tab.requiresActiveChar) return false;
    if (tab.id === 'combat' && combatState === 'none') return false;
    if (tab.combatOnly && combatState !== 'active' && tab.id !== 'combat') return false;
    return true;
  });

  let ActiveTabComponentDef = visibleTabs.find(tab => tab.id === activeTab);

  if (!ActiveTabComponentDef) {
    if (!currentUser.isDM && activePlayerCharacter) {
      ActiveTabComponentDef = visibleTabs.find(tab => tab.id === DEFAULT_PLAYER_ACTIVE_CHAR_TAB) || visibleTabs[0];
    } else {
      ActiveTabComponentDef = visibleTabs.find(tab => tab.id === DEFAULT_SIDE_PANEL_TAB.id) || visibleTabs[0];
    }
    if (ActiveTabComponentDef) {
      onTabChange(ActiveTabComponentDef.id);
    }
  }

  const ActiveComponent = ActiveTabComponentDef?.component;

  const componentProps = { ...props };
  if (ActiveTabComponentDef?.id === 'stats' || ActiveTabComponentDef?.id === 'skills' || ActiveTabComponentDef?.id === 'inventory') {
    (componentProps as any).areTooltipsEnabled = areTooltipsEnabled;
  }
  if (ActiveTabComponentDef?.id === 'options') {
    (componentProps as any).currentUser = currentUser; // Pass currentUser
    (componentProps as any).areTooltipsEnabled = areTooltipsEnabled;
    (componentProps as any).onToggleTooltips = onToggleTooltips;
    (componentProps as any).onToggleDMView = onToggleDMView; // Pass onToggleDMView
  }
  if (ActiveTabComponentDef?.id === 'inventory') {
    (componentProps as any).items = items;
    (componentProps as any).getItemById = getItemById;
    (componentProps as any).onEquipItem = onEquipItem;
    (componentProps as any).onUnequipItem = onUnequipItem;
    (componentProps as any).onAttuneItem = onAttuneItem;
    (componentProps as any).onEndAttunement = onEndAttunement;
    (componentProps as any).onUpdateCurrency = onUpdateCurrency;
    (componentProps as any).onShowSidePanelContextMenu = onShowSidePanelContextMenu;
    // Pass combat state and current turn character for inventory actions
    (componentProps as any).combatState = combatState;
    (componentProps as any).currentTurnCharacterId = currentTurnCharacterId;
    (componentProps as any).currentUser = currentUser; // Pass currentUser for DM checks in tab
  }


  return (
    <div className="flex flex-col flex-shrink-0 h-64 md:h-72 lg:h-80 border-t-2 border-gray-700 bg-gray-800 shadow-inner">
      <div className="flex-shrink-0 flex border-b border-gray-700 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            disabled={tab.requiresActiveChar && !activePlayerCharacter && tab.playerOnly}
            className={`px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none transition-colors duration-150 whitespace-nowrap
              ${activeTab === tab.id
                ? 'border-b-2 border-indigo-500 text-indigo-400 bg-gray-750'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }
              ${(tab.requiresActiveChar && !activePlayerCharacter && tab.playerOnly) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-grow overflow-y-auto p-1 sm:p-2 bg-gray-850">
        {ActiveComponent ? <ActiveComponent {...componentProps} /> : <div className="p-4 text-gray-500 italic">Select a tab or character.</div>}
      </div>
    </div>
  );
};
