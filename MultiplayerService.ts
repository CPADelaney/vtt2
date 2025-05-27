
import { Token, ChatMessage, Character, User, Location, CombatantUIDetail, ActionDetail, HeldAction, Area, Item, Group } from './types';

type EventCallback = (...args: any[]) => void;

interface Listeners {
  [eventName: string]: EventCallback[];
}

// Define payload types for clarity, though not strictly enforced in this mock
export interface TokenUpdatePayload extends Token {}
export interface BulkTokenUpdatePayload extends Array<Token> {}
export interface ChatMessagePayload extends ChatMessage {}
export interface CharacterUpdatePayload extends Character {}
export interface CharacterDeletePayload { characterId: string; }
export interface LocationUpdatePayload extends Location {} // For full location updates or creation
export interface LocationActiveTogglePayload { locationId: string; isActive: boolean; }
export interface AreaCreatePayload { locationId: string; area: Area; }
export interface AreaUpdatePayload { locationId: string; area: Area; } // For name, description, isExpanded
export interface AreaDeletePayload { locationId: string; areaId: string; }
export interface CharacterAreaUpdatePayload { characterId: string; newLocationId: string | null; newAreaId: string | null; }

export interface ItemCreatePayload { item: Item; }
export interface ItemUpdatePayload { item: Item; }
export interface ItemDeletePayload { itemId: string; }

export interface GroupCreatePayload extends Group {}
export interface GroupUpdatePayload extends Group {} // For simplicity, send the whole group on update
export interface GroupDeletePayload { groupId: string; }


export interface CampaignNotesPayload { notes: string; }
export interface CombatStatePayload {
  combatState: 'none' | 'pre-combat' | 'active';
  initiativeOrder: string[];
  currentTurnCharacterId: string | null;
  roundCounter: number;
  updatedCharacters?: Character[]; // Optional: for characters updated during combat ops like initiative roll
}
export interface InitiativeScoreUpdatePayload {
    characterId: string;
    newScore: number;
    updatedCharacters: Character[]; // Characters with updated initiative scores
    newInitiativeOrder: string[]; // The newly sorted order
}
export interface UserRoleChangePayload {
  userId: string;
  isDM: boolean;
  name: string;
}
export interface PingPayload {
  position: import('./types').Point;
}

export type HeldActionUpdatePayload = HeldAction | { characterId: string; clear: true };

export interface SpellCastPayload { // New payload for spell casting
    casterId: string;
    spellName: string;
    spellId: string;
    targetId: string; 
    // Future: Add details like attack roll result, save DC if resolved by caster client
}


class MultiplayerService {
  private listeners: Listeners = {};
  private localUserId: string = "player1"; // Default, can be set

  constructor() {
    // Make methods callable directly
    this.sendTokenUpdate = this.sendTokenUpdate.bind(this);
    this.sendBulkTokenUpdate = this.sendBulkTokenUpdate.bind(this);
    this.sendChatMessage = this.sendChatMessage.bind(this);
    this.sendCharacterCreate = this.sendCharacterCreate.bind(this);
    this.sendCharacterUpdate = this.sendCharacterUpdate.bind(this);
    this.sendCharacterDelete = this.sendCharacterDelete.bind(this);
    this.sendCampaignNotesUpdate = this.sendCampaignNotesUpdate.bind(this);
    this.sendCombatStateUpdate = this.sendCombatStateUpdate.bind(this);
    this.sendInitiativeScoreUpdate = this.sendInitiativeScoreUpdate.bind(this);
    this.sendEndTurn = this.sendEndTurn.bind(this);
    this.requestUserRoleChange = this.requestUserRoleChange.bind(this);
    this.sendPing = this.sendPing.bind(this);
    this.sendTokenRemoveFromMap = this.sendTokenRemoveFromMap.bind(this);
    this.sendHeldActionUpdate = this.sendHeldActionUpdate.bind(this);
    this.sendSpellCast = this.sendSpellCast.bind(this); // New

    this.sendLocationCreate = this.sendLocationCreate.bind(this);
    this.sendLocationActiveToggle = this.sendLocationActiveToggle.bind(this);
    this.sendLocationToggleExpand = this.sendLocationToggleExpand.bind(this);
    this.sendAreaCreate = this.sendAreaCreate.bind(this);
    this.sendAreaUpdate = this.sendAreaUpdate.bind(this);
    this.sendAreaDelete = this.sendAreaDelete.bind(this);
    this.sendCharacterLocationUpdate = this.sendCharacterLocationUpdate.bind(this);
    this.sendItemCreate = this.sendItemCreate.bind(this);
    this.sendItemUpdate = this.sendItemUpdate.bind(this);
    this.sendItemDelete = this.sendItemDelete.bind(this);
    
    this.sendGroupCreate = this.sendGroupCreate.bind(this);
    this.sendGroupUpdate = this.sendGroupUpdate.bind(this);
    this.sendGroupDelete = this.sendGroupDelete.bind(this);
  }

  public on(eventName: string, callback: EventCallback): void {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  public off(eventName: string, callback: EventCallback): void {
    if (!this.listeners[eventName]) return;
    this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
  }

  private emit(eventName: string, ...args: any[]): void {
    if (!this.listeners[eventName]) return;
    this.listeners[eventName].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in MultiplayerService listener for ${eventName}:`, error);
      }
    });
  }
  
  public setLocalUserId(userId: string): void {
    this.localUserId = userId;
  }

  public getLocalUserId(): string {
    return this.localUserId;
  }

  // --- Send Methods (Simulate sending to server) ---

  public sendTokenUpdate(payload: TokenUpdatePayload): void {
    this.emit('tokenUpdate', payload);
  }
  
  public sendBulkTokenUpdate(payload: BulkTokenUpdatePayload): void {
    this.emit('bulkTokenUpdate', payload);
  }

  public sendChatMessage(payload: ChatMessagePayload): void {
    this.emit('chatMessage', payload);
  }

  public sendCharacterCreate(payload: CharacterUpdatePayload): void {
    this.emit('characterCreate', payload);
  }
  
  public sendCharacterUpdate(payload: CharacterUpdatePayload): void {
    this.emit('characterUpdate', payload);
  }

  public sendCharacterDelete(payload: CharacterDeletePayload): void {
    this.emit('characterDelete', payload);
  }
  
  public sendTokenRemoveFromMap(tokenId: string, characterId?: string): void {
    this.emit('tokenRemovedFromMap', { tokenId, characterId });
  }

  public sendLocationCreate(payload: LocationUpdatePayload): void { 
    this.emit('locationCreate', payload);
  }

  public sendLocationActiveToggle(payload: LocationActiveTogglePayload): void {
    this.emit('locationActiveToggle', payload);
  }

  public sendLocationToggleExpand(locationId: string): void { 
    this.emit('locationToggleExpand', { locationId });
  }
  
  public sendAreaCreate(payload: AreaCreatePayload): void {
    this.emit('areaCreate', payload);
  }

  public sendAreaUpdate(payload: AreaUpdatePayload): void { 
    this.emit('areaUpdate', payload);
  }
  
  public sendAreaDelete(payload: AreaDeletePayload): void {
    this.emit('areaDelete', payload); 
  }

  public sendCharacterLocationUpdate(payload: CharacterAreaUpdatePayload): void { 
    this.emit('characterLocationUpdate', payload);
  }

  public sendItemCreate(payload: ItemCreatePayload): void {
    this.emit('itemCreate', payload); 
  }

  public sendItemUpdate(payload: ItemUpdatePayload): void {
    this.emit('itemUpdate', payload); 
  }
  
  public sendItemDelete(payload: ItemDeletePayload): void {
    this.emit('itemDelete', payload); 
  }

  public sendGroupCreate(payload: GroupCreatePayload): void {
    this.emit('groupCreate', payload);
  }

  public sendGroupUpdate(payload: GroupUpdatePayload): void {
    this.emit('groupUpdate', payload);
  }

  public sendGroupDelete(payload: GroupDeletePayload): void {
    this.emit('groupDelete', payload);
  }


  public sendCampaignNotesUpdate(payload: CampaignNotesPayload): void {
    this.emit('campaignNotesUpdate', payload);
  }

  public sendCombatStateUpdate(payload: CombatStatePayload): void {
    this.emit('combatStateUpdate', payload);
  }
  
  public sendInitiativeScoreUpdate(payload: InitiativeScoreUpdatePayload): void {
    this.emit('initiativeScoreUpdate', payload);
  }
  
  public sendEndTurn(payload: CombatStatePayload): void { 
      this.emit('combatStateUpdate', payload); 
  }

  public requestUserRoleChange(isDM: boolean, userId: string): void {
    const newName = isDM ? "DM" : "Player 1"; 
    this.emit('userRoleChange', { userId, isDM, name: newName });
  }
  
  public sendPing(payload: PingPayload): void {
    this.emit('ping', payload);
  }

  public sendHeldActionUpdate(payload: HeldActionUpdatePayload): void {
    this.emit('heldActionUpdate', payload);
  }

  public sendSpellCast(payload: SpellCastPayload): void { // New method
    this.emit('spellCast', payload);
  }
}

export const multiplayerService = new MultiplayerService();