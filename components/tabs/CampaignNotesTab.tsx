import React from 'react';
import { User } from '../../types';

interface CampaignNotesTabProps {
  currentUser: User;
  campaignNotes: string;
  onUpdateCampaignNotes: (notes: string) => void;
}

export const CampaignNotesTab: React.FC<CampaignNotesTabProps> = ({ currentUser, campaignNotes, onUpdateCampaignNotes }) => {
  if (!currentUser.isDM) return <p className="p-4 text-gray-500">This section is for DMs only.</p>;

  return (
    <div className="p-2 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-300 mb-2">Campaign Notes</h3>
      <textarea
        value={campaignNotes}
        onChange={(e) => onUpdateCampaignNotes(e.target.value)}
        placeholder="Jot down your secret plans, plot hooks, or reminders here..."
        className="w-full flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none text-gray-100 text-sm resize-none scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700"
      />
    </div>
  );
};