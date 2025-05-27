import React from 'react';
import { User } from '../../types';

interface AssetsTabProps {
  currentUser: User;
  // Props will be added as asset management features are defined
}

export const AssetsTab: React.FC<AssetsTabProps> = ({ currentUser }) => {
  if (!currentUser.isDM) return <p className="p-4 text-gray-500">This section is for DMs only.</p>;

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-300 mb-2">Assets Management</h3>
      <p className="text-gray-500 italic">Image uploads, map library, handouts, etc., will be managed here.</p>
      {/* Example placeholder */}
      <div className="mt-4">
        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-md transition-colors">
            Upload Image
        </button>
      </div>
    </div>
  );
};