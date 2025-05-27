


import React from 'react';
import { User, CreatureTemplate } from '../../types';

interface BestiaryTabProps {
  currentUser: User;
  creatureTemplates: CreatureTemplate[];
  onOpenTemplateForViewing?: (templateId: string) => void;
  onShowSidePanelContextMenu: (event: React.MouseEvent, itemType: 'character' | 'creatureTemplate', itemId: string, itemName: string) => void;
}

export const BestiaryTab: React.FC<BestiaryTabProps> = ({ currentUser, creatureTemplates, onOpenTemplateForViewing, onShowSidePanelContextMenu }) => {
  if (!currentUser.isDM) {
    return <p className="p-4 text-gray-500">The Bestiary is for DMs only.</p>;
  }

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, templateId: string) => {
    event.dataTransfer.setData('application/x-creature-template-id', templateId);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="p-2 text-sm h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
      <h3 className="text-lg font-semibold text-gray-300 mb-3 sticky top-0 bg-gray-850 py-1 z-10">Bestiary</h3>
      {creatureTemplates.length === 0 && (
        <p className="text-gray-500 italic">No creature templates available.</p>
      )}
      <ul className="space-y-2">
        {creatureTemplates.map(template => (
          <li
            key={template.id}
            className="p-3 bg-gray-700 rounded-md shadow hover:bg-gray-650 transition-colors"
            aria-label={`Drag ${template.name} to map or right-click for options`}
            title={`Drag to map: ${template.name}\nType: ${template.type}\nCR: ${template.challengeRating || 'N/A'}`}
            onContextMenu={(e) => onShowSidePanelContextMenu(e, 'creatureTemplate', template.id, template.name)}
          >
            <div 
              className="flex items-center justify-between"
              draggable={true}
              onDragStart={(e) => handleDragStart(e, template.id)}
              style={{ cursor: 'grab' }} // Apply grab cursor to the draggable area
            >
                <div className="flex-grow overflow-hidden mr-2">
                    <h4 
                      className="font-semibold text-indigo-300 truncate hover:text-indigo-200 transition-colors cursor-pointer" 
                      title={template.name}
                      onClick={() => onOpenTemplateForViewing?.(template.id)} // Make name clickable
                    >
                      {template.name}
                    </h4>
                    <p className="text-xs text-gray-400 truncate" title={`${template.type} (Size: ${template.size}, CR: ${template.challengeRating || 'N/A'})`}>
                        {template.type} (CR {template.challengeRating || 'N/A'})
                    </p>
                </div>
                {template.image && (
                    <img 
                        src={template.image} 
                        alt={template.name} 
                        className="w-10 h-10 rounded object-cover flex-shrink-0 border border-gray-600 pointer-events-none" // Prevent image from being dragged separately
                        loading="lazy"
                    />
                )}
                {!template.image && (
                    <div className="w-10 h-10 rounded bg-gray-600 flex-shrink-0 border border-gray-500 text-gray-400 text-xs flex items-center justify-center pointer-events-none">
                        Img
                    </div>
                )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
