
import React, { useState, useCallback } from 'react';
import { Character, Item, EquipmentSlot, PlayerInventoryTabProps, ContextMenuAction, User } from '../../../types';
import { DND_EQUIPMENT_SLOTS } from '../../../constants';
import { getCompatibleSlotsForItem } from '../../../utils';
import { ContextMenu } from '../../ContextMenu'; 
import { Tooltip } from '../../Tooltip';

type InventorySubTab = 'carried' | 'equipped';

interface ItemContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  itemId: string | null;
  itemSlot?: EquipmentSlot; 
  isEquippedItem: boolean; 
}

export const PlayerInventoryTab: React.FC<PlayerInventoryTabProps> = ({
  activePlayerCharacter,
  currentUser, // Added currentUser
  items, 
  getItemById,
  onEquipItem,
  onUnequipItem,
  onAttuneItem, // Added
  onEndAttunement, // Added
  onUpdateCurrency, // Added
  onShowSidePanelContextMenu, 
  areTooltipsEnabled,
  combatState, // Added
  currentTurnCharacterId, // Added
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<InventorySubTab>('carried');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [itemContextMenu, setItemContextMenu] = useState<ItemContextMenuState>({
    visible: false, x: 0, y: 0, itemId: null, isEquippedItem: false,
  });
  const [editingCurrency, setEditingCurrency] = useState< 'gp' | 'sp' | 'cp' | null>(null);
  const [currencyInputValue, setCurrencyInputValue] = useState<number>(0);


  if (!activePlayerCharacter) {
    return <p className="p-4 text-gray-500 italic">No active character selected. Go to the 'Characters' tab to select one.</p>;
  }

  const char = activePlayerCharacter;

  const carriedItems = char.itemIds
    .map(id => getItemById(id))
    .filter(Boolean) as Item[];

  const toggleExpandItem = (itemId: string) => {
    setExpandedItemId(prev => (prev === itemId ? null : itemId));
    if (itemContextMenu.visible) closeItemContextMenu(); 
  };
  
  const closeItemContextMenu = useCallback(() => {
    setItemContextMenu({ visible: false, x: 0, y: 0, itemId: null, isEquippedItem: false });
  }, []);

  const handleItemRightClick = (
    event: React.MouseEvent, 
    itemId: string, 
    isEquipped: boolean, 
    slot?: EquipmentSlot
  ) => {
    event.preventDefault();
    event.stopPropagation();
    // Ensure any expanded item is closed if right-clicking a different one or non-expanded
    if (expandedItemId && expandedItemId !== itemId) setExpandedItemId(null);
    
    setItemContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      itemId: itemId,
      itemSlot: slot,
      isEquippedItem: isEquipped,
    });
  };
  
  const buildItemContextMenuActions = (): ContextMenuAction[] => {
    if (!itemContextMenu.itemId) return [{ label: 'Close', action: closeItemContextMenu}];
    const item = getItemById(itemContextMenu.itemId);
    if (!item) return [{ label: 'Close', action: closeItemContextMenu}];

    const actions: ContextMenuAction[] = [];

    if (itemContextMenu.isEquippedItem && itemContextMenu.itemSlot) {
      actions.push({
        label: `Unequip from ${itemContextMenu.itemSlot.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`,
        action: () => {
          onUnequipItem(char.id, itemContextMenu.itemSlot!, combatState, currentTurnCharacterId);
          closeItemContextMenu();
        },
      });
    } else { 
      const compatibleSlots = getCompatibleSlotsForItem(item, char);
      if (compatibleSlots.length > 0) {
          // FIX: (Verified) Property 'action' was missing for ContextMenuAction with subActions, added a no-op action.
          actions.push({
            label: `Equip ${item.name} to...`,
            action: () => {}, // No-op action for parent menu item with sub-actions
            subActions: compatibleSlots.map(slot => ({
              label: slot.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
              action: () => {
                onEquipItem(char.id, item.id, slot, combatState, currentTurnCharacterId);
                closeItemContextMenu();
              }
            }))
          });
      }
    }
    // Attunement options
    if (item.requiresAttunement) {
        if (char.attunedItemIds.includes(item.id)) {
            actions.push({ label: `End Attunement`, action: () => { onEndAttunement(char.id, item.id); closeItemContextMenu(); }});
        } else if (char.attunementSlots.current < char.attunementSlots.max) {
            actions.push({ label: `Attune Item`, action: () => { onAttuneItem(char.id, item.id); closeItemContextMenu(); }});
        } else {
             actions.push({ label: `Attune Item (Max Reached)`, disabled: true, action: () => {} });
        }
    }

    actions.push({ label: 'Close Menu', action: closeItemContextMenu });
    return actions;
  };

  const subTabButtonClass = (tabName: InventorySubTab) => 
    `px-3 py-1.5 text-xs font-medium focus:outline-none transition-colors duration-150 rounded-t-md
     ${currentSubTab === tabName 
       ? 'border-l border-t border-r border-gray-700 bg-gray-750 text-indigo-400' 
       : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
     }`;

  const getItemTooltipContent = (item: Item) => (
    <div className="text-xs space-y-0.5 max-w-xs">
      <p className="font-bold text-indigo-300">{item.name}</p>
      <p className="whitespace-pre-wrap">{item.description || "No description."}</p>
      {item.isMagical && <p className="text-purple-400">Magical Item</p>}
      {item.requiresAttunement && <p className="text-yellow-400">Requires Attunement</p>}
      {item.itemCategory && <p>Category: <span className="capitalize">{item.itemCategory}</span></p>}
      {item.slotType && <p>Slot(s): {Array.isArray(item.slotType) ? item.slotType.join(', ') : item.slotType}</p>}
      {item.damage && item.damage.length > 0 && <p>Damage: {item.damage.map(d => `${d.dice} ${d.type}`).join(', ')}</p>}
      {item.armorClass && <p>Armor Class: {item.armorClass}{item.itemCategory === 'shield' ? ' (Shield Bonus)' : ''}</p>}
      {item.effects && item.effects.length > 0 && <p>Effects: {item.effects.join(', ')}</p>}
      {item.properties && item.properties.length > 0 && <p>Properties: {item.properties.join(', ')}</p>}
      {item.weight && <p>Weight: {item.weight} lbs</p>}
      {item.value && <p>Value: {item.value}</p>}
    </div>
  );
  
  const handleCurrencyEditStart = (type: 'gp' | 'sp' | 'cp') => {
    setEditingCurrency(type);
    setCurrencyInputValue(char.currency[type]);
  };

  const handleCurrencyEditConfirm = () => {
    if (editingCurrency) {
      onUpdateCurrency(char.id, editingCurrency, currencyInputValue);
    }
    setEditingCurrency(null);
  };


  return (
    <div className="p-2 text-sm h-full flex flex-col text-gray-200">
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <h3 className="text-xl font-semibold text-indigo-400">Inventory</h3>
        <div className="text-xs text-gray-400">
           Attunement Slots: {char.attunementSlots.current} / {char.attunementSlots.max}
        </div>
      </div>

      {/* Currency Display */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs flex-shrink-0">
        {(['gp', 'sp', 'cp'] as const).map(type => (
          <div key={type} className="p-1.5 bg-gray-700 rounded">
            <span className="text-gray-400 uppercase">{type}</span>
            {editingCurrency === type && currentUser.isDM ? (
              <div className="flex items-center mt-1">
                <input 
                  type="number" 
                  value={currencyInputValue}
                  onChange={(e) => setCurrencyInputValue(parseInt(e.target.value) || 0)}
                  onBlur={handleCurrencyEditConfirm}
                  onKeyDown={(e) => e.key === 'Enter' && handleCurrencyEditConfirm()}
                  className="w-full p-1 bg-gray-600 border border-gray-500 rounded text-white text-center text-xs"
                  autoFocus
                />
              </div>
            ) : (
              <div 
                className={`text-indigo-300 font-semibold text-md ${currentUser.isDM ? 'cursor-pointer hover:bg-gray-600 rounded' : ''}`}
                onClick={() => currentUser.isDM && handleCurrencyEditStart(type)}
                title={currentUser.isDM ? "Click to edit" : ""}
              >
                {char.currency[type]}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex mb-2 border-b border-gray-700 flex-shrink-0">
        <button onClick={() => setCurrentSubTab('carried')} className={subTabButtonClass('carried')}>
          Carried ({carriedItems.length})
        </button>
        <button onClick={() => setCurrentSubTab('equipped')} className={`${subTabButtonClass('equipped')} ml-1`}>
          Equipped
        </button>
      </div>

      <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-1">
        {currentSubTab === 'carried' && (
          <div>
            {carriedItems.length === 0 && <p className="text-gray-500 italic">Your backpack is light...</p>}
            <ul className="space-y-1.5">
              {carriedItems.map(item => (
                <Tooltip key={`carried-${item.id}`} enabled={areTooltipsEnabled && expandedItemId !== item.id} content={getItemTooltipContent(item)}>
                  <li 
                    className="p-2 bg-gray-700 rounded-md hover:bg-gray-650 transition-colors"
                    onContextMenu={(e) => handleItemRightClick(e, item.id, false)}
                  >
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpandItem(item.id)}>
                      <div>
                        <span className="font-medium text-indigo-300">{item.name}</span>
                        {item.quantity && item.quantity > 1 && <span className="text-xs text-gray-400"> (x{item.quantity})</span>}
                        {item.isMagical && <span className="text-xs text-purple-400 ml-1">(Magical)</span>}
                        {item.requiresAttunement && <span className="text-xs text-yellow-400 ml-1">(Requires Attunement)</span>}
                        {char.attunedItemIds.includes(item.id) && <span className="text-xs text-green-400 ml-1">(Attuned)</span>}
                      </div>
                      <span className={`text-xs transition-transform duration-150 ${expandedItemId === item.id ? 'rotate-90' : ''}`}>►</span>
                    </div>
                    {expandedItemId === item.id && (
                      <div className="mt-1.5 pt-1.5 border-t border-gray-600 text-xs text-gray-300 space-y-0.5">
                        <p className="whitespace-pre-wrap">{item.description || "No description."}</p>
                        {item.itemCategory && <p>Category: <span className="capitalize">{item.itemCategory}</span></p>}
                        {item.weight && <p>Weight: {item.weight} lbs</p>} {item.value && <p>Value: {item.value}</p>}
                        {item.damage && item.damage.length > 0 && <p>Damage: {item.damage.map(d => `${d.dice} ${d.type}`).join(', ')}</p>}
                        {item.armorClass ? <p>AC: {item.armorClass}{item.itemCategory === 'shield' ? ' (Shield Bonus)' : ''}</p> : null}
                        {item.effects && item.effects.length > 0 && <p>Effects: {item.effects.join(', ')}</p>}
                        {item.properties && item.properties.length > 0 && <p>Properties: {item.properties.join(', ')}</p>}
                      </div>
                    )}
                  </li>
                </Tooltip>
              ))}
            </ul>
          </div>
        )}

        {currentSubTab === 'equipped' && (
          <div className="space-y-2">
            {DND_EQUIPMENT_SLOTS.map(slot => {
              const equippedItemId = char.equippedItems[slot];
              const item = equippedItemId ? getItemById(equippedItemId) : null;
              const slotName = slot.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              
              return (
                <Tooltip key={`equipped-${slot}`} enabled={areTooltipsEnabled && !!item && expandedItemId !== item?.id} content={item ? getItemTooltipContent(item) : `Empty ${slotName} slot`}>
                  <div 
                    className={`p-2 rounded-md flex items-center justify-between ${item ? 'bg-gray-600 hover:bg-gray-550' : 'bg-gray-750 border border-dashed border-gray-600'}`}
                    onContextMenu={(e) => item && handleItemRightClick(e, item.id, true, slot)}
                    onClick={() => item && toggleExpandItem(item.id)}
                  >
                    <div className="flex-grow">
                      <span className="text-xs text-gray-400 block">{slotName}</span>
                      {item ? (
                          <div>
                            <span className="font-medium text-indigo-200 hover:text-indigo-100 cursor-pointer">{item.name}</span>
                            {item.isMagical && <span className="text-xs text-purple-300 ml-1">(Magical)</span>}
                            {item.requiresAttunement && <span className="text-xs text-yellow-300 ml-1">(Req. Attune)</span>}
                            {char.attunedItemIds.includes(item.id) && <span className="text-xs text-green-300 ml-1">(Attuned)</span>}
                          </div>
                      ) : (
                        <span className="text-gray-500 italic">Empty</span>
                      )}
                    </div>
                    {item && expandedItemId === item.id && (
                       <span className={`text-xs transition-transform duration-150 rotate-90`}>►</span>
                    )}
                  </div>
                </Tooltip>
              );
            })}
             {expandedItemId && currentSubTab === 'equipped' && 
                Object.values(char.equippedItems).includes(expandedItemId) && // Ensure expanded is actually equipped
                (() => {
                    const item = getItemById(expandedItemId);
                    if (!item) return null;
                    return (
                        <div className="mt-2 p-2 bg-gray-700 rounded-md border border-gray-600 text-xs text-gray-300 space-y-0.5">
                            <h5 className="font-semibold text-indigo-300">{item.name} - Details</h5>
                            <p className="whitespace-pre-wrap">{item.description || "No description."}</p>
                            {item.itemCategory && <p>Category: <span className="capitalize">{item.itemCategory}</span></p>}
                            {item.weight && <p>Weight: {item.weight} lbs</p>} {item.value && <p>Value: {item.value}</p>}
                            {item.damage && item.damage.length > 0 && <p>Damage: {item.damage.map(d => `${d.dice} ${d.type}`).join(', ')}</p>}
                            {item.armorClass ? <p>AC: {item.armorClass}{item.itemCategory === 'shield' ? ' (Shield Bonus)' : ''}</p> : null}
                            {item.effects && item.effects.length > 0 && <p>Effects: {item.effects.join(', ')}</p>}
                            {item.properties && item.properties.length > 0 && <p>Properties: {item.properties.join(', ')}</p>}
                            {item.requiresAttunement && <p className="text-yellow-400">Requires Attunement {char.attunedItemIds.includes(item.id) ? "(Attuned)" : "(Not Attuned)"}</p>}
                        </div>
                    );
                })()
            }
          </div>
        )}
      </div>

      {itemContextMenu.visible && (
        <ContextMenu
          x={itemContextMenu.x}
          y={itemContextMenu.y}
          actions={buildItemContextMenuActions()}
          onClose={closeItemContextMenu}
        />
      )}
    </div>
  );
};
