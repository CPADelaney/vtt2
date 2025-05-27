
import React, { useEffect, useRef, useState } from 'react';
import { ContextMenuAction, Point } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
  level?: number; // For styling/positioning nested menus
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, actions, onClose, level = 0 }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null); // Store label of action with active submenu
  const [subMenuPosition, setSubMenuPosition] = useState<Point | null>(null);
  const subMenuTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Check if the click is inside any active submenu before closing
        let targetIsSubMenu = false;
        const subMenuElements = document.querySelectorAll('.submenu-level');
        subMenuElements.forEach(el => {
            if (el.contains(event.target as Node)) {
                targetIsSubMenu = true;
            }
        });
        if (!targetIsSubMenu) {
            onClose();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (subMenuTimeoutRef.current) clearTimeout(subMenuTimeoutRef.current);
    };
  }, [onClose]);

  const handleMouseEnterAction = (action: ContextMenuAction, event: React.MouseEvent) => {
    if (subMenuTimeoutRef.current) clearTimeout(subMenuTimeoutRef.current);
    if (action.subActions && action.subActions.length > 0) {
      const targetRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setSubMenuPosition({ x: targetRect.right, y: targetRect.top });
      setActiveSubMenu(action.label);
    } else {
      // Delay hiding if moving from a submenu item to a non-submenu item or another submenu item
      // setActiveSubMenu(null); // This was causing flickering, managed by onMouseLeave from main menu div
    }
  };

  const handleMouseLeaveAction = () => {
    // No immediate hide, wait for menu mouseleave or another item mouseenter
  };
  
  const handleMouseLeaveMenu = () => {
     subMenuTimeoutRef.current = window.setTimeout(() => {
        setActiveSubMenu(null);
     }, 150); // Small delay to allow moving to submenu
  };


  const menuStyle: React.CSSProperties = {
    position: 'fixed', // Use fixed for top-level, absolute might be for children if nested differently
    top: y,
    left: x,
    zIndex: 50 + level, // Increase zIndex for nested menus
  };

  if (menuRef.current) {
    const menuRect = menuRef.current.getBoundingClientRect();
    if (x + menuRect.width > window.innerWidth) {
      menuStyle.left = level > 0 ? x - menuRect.width - (menuRef.current.parentElement?.getBoundingClientRect().width || 0) : window.innerWidth - menuRect.width - 5;
       if(menuStyle.left < 0) menuStyle.left = 5;
    }
    if (y + menuRect.height > window.innerHeight) {
      menuStyle.top = window.innerHeight - menuRect.height - 5;
      if(menuStyle.top < 0) menuStyle.top = 5;
    }
  }
  
  return (
    <div
      ref={menuRef}
      className={`absolute bg-gray-700 border border-gray-600 rounded-md shadow-2xl py-1 min-w-[180px] text-sm text-gray-200 submenu-level-${level}`}
      style={menuStyle}
      onMouseLeave={handleMouseLeaveMenu}
    >
      {actions.map((action, index) => (
        <div key={index} className="relative" 
             onMouseEnter={(e) => handleMouseEnterAction(action, e)}
             onMouseLeave={handleMouseLeaveAction}
        >
          <button
            onClick={() => {
              if (!action.disabled && !action.subActions) { // Only execute action if no subActions
                action.action();
                onClose(); // Close all menus after action
              } else if (action.subActions && action.action) {
                 // If it has subActions AND an action, it's likely a toggle or similar.
                 // For now, we prioritize subActions display. If direct action is needed,
                 // the subActions should be empty or logic handled differently.
                 // Or, if action.action is a no-op, it's fine.
                 action.action(); // Could be a no-op.
                 if (!action.subActions || action.subActions.length === 0) onClose();
              }
            }}
            disabled={action.disabled}
            className={`w-full text-left px-4 py-2 hover:bg-indigo-600 hover:text-white transition-colors flex justify-between items-center
                        ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        ${activeSubMenu === action.label ? 'bg-indigo-600 text-white' : ''}`}
          >
            {action.label}
            {action.subActions && action.subActions.length > 0 && <span className="text-xs ml-2">►</span>}
          </button>
          {activeSubMenu === action.label && action.subActions && action.subActions.length > 0 && subMenuPosition && (
            <ContextMenu
              x={subMenuPosition.x}
              y={subMenuPosition.y}
              actions={action.subActions}
              onClose={() => { setActiveSubMenu(null); /* Don't close main menu here */ }}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
};
