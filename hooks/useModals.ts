
import { useState } from 'react';
import { Character, AddToGroupItem } from '../types';

export const useModals = () => {
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [selectedCharacterForSheet, setSelectedCharacterForSheet] = useState<Character | null>(null);
  const [isSheetEditable, setIsSheetEditable] = useState(true);

  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [characterForAssignment, setCharacterForAssignment] = useState<Character | null>(null);
  
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isAddToGroupModalOpen, setIsAddToGroupModalOpen] = useState(false);
  const [itemForAddToGroup, setItemForAddToGroup] = useState<AddToGroupItem | null>(null);

  return {
    isSheetModalOpen, setIsSheetModalOpen,
    selectedCharacterForSheet, setSelectedCharacterForSheet,
    isSheetEditable, setIsSheetEditable,
    isCreationModalOpen, setIsCreationModalOpen,
    isAssignModalOpen, setIsAssignModalOpen,
    characterForAssignment, setCharacterForAssignment,
    isCreateGroupModalOpen, setIsCreateGroupModalOpen,
    isAddToGroupModalOpen, setIsAddToGroupModalOpen,
    itemForAddToGroup, setItemForAddToGroup,
  };
};
