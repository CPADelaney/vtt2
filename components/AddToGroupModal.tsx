
import React, { useState } from 'react';
import { Group, AddToGroupItem } from '../types';

interface AddToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AddToGroupItem;
  groups: Group[];
  onConfirmAddToGroup: (groupId: string, itemId: string, itemType: 'character' | 'creatureTemplate') => void;
}

export const AddToGroupModal: React.FC<AddToGroupModalProps> = ({
  isOpen,
  onClose,
  item,
  groups,
  onConfirmAddToGroup,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroupId) {
      onConfirmAddToGroup(selectedGroupId, item.id, item.type);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-indigo-400">Add "{item.name}" to Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {groups.length === 0 ? (
          <p className="text-gray-400 italic text-center my-4">No groups available. Create a group first.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="selectGroup" className="block text-sm font-medium text-gray-300 mb-1">
                Select Group:
              </label>
              <select
                id="selectGroup"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-100"
                required
              >
                <option value="" disabled>Choose a group...</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.characterIds.length} members)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedGroupId}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
              >
                Add to Group
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
