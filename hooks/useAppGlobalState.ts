
import { useState, useCallback } from 'react';
import { User, SidePanelTabName } from '../types';
import { multiplayerService } from '../MultiplayerService';
import { DEFAULT_SIDE_PANEL_TAB } from '../constants';

export const useAppGlobalState = () => {
  const [currentUser, setCurrentUser] = useState<User>({ 
    id: multiplayerService.getLocalUserId(), 
    name: 'Player 1', 
    isDM: multiplayerService.getLocalUserId() === 'player1' 
  });
  const [activeSidePanelTab, setActiveSidePanelTab] = useState<SidePanelTabName>(DEFAULT_SIDE_PANEL_TAB.id);
  const [campaignNotes, setCampaignNotes] = useState<string>('');
  const [areTooltipsEnabled, setAreTooltipsEnabled] = useState(true);

  const toggleUserDMStatus = useCallback(() => {
    multiplayerService.requestUserRoleChange(!currentUser.isDM, currentUser.id);
  }, [currentUser.isDM, currentUser.id]);

  return {
    currentUser, setCurrentUser,
    activeSidePanelTab, setActiveSidePanelTab,
    campaignNotes, setCampaignNotes,
    areTooltipsEnabled, setAreTooltipsEnabled,
    toggleUserDMStatus, // Expose the new function
  };
};
