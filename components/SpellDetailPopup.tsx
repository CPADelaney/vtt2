
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ActionDetail, SpellDetailPopupProps } from '../types'; // Ensure SpellDetailPopupProps is in types

export const SpellDetailPopup: React.FC<SpellDetailPopupProps> = ({ spell, isOpen, onClose, positionRef }) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && positionRef?.current && popupRef.current) {
      const targetRect = positionRef.current.getBoundingClientRect();
      const popupRect = popupRef.current.getBoundingClientRect();
      
      let top = targetRect.bottom + window.scrollY + 2;
      let left = targetRect.left + window.scrollX;

      // Adjust if popup goes off-screen
      if (left + popupRect.width > window.innerWidth - 10) {
        left = window.innerWidth - popupRect.width - 10;
      }
      if (top + popupRect.height > window.innerHeight - 10) {
        top = targetRect.top + window.scrollY - popupRect.height - 2;
      }
      if (left < 10) left = 10;
      if (top < 10) top = 10;

      setPosition({ top, left });
    }
  }, [isOpen, positionRef, spell]); // Re-calculate on spell change too, as content size might differ

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) &&
          positionRef?.current && !positionRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, positionRef]);

  if (!isOpen || !spell) return null;

  const spellDetailsContent = (
    <div
      ref={popupRef}
      className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 text-xs text-gray-200 w-64 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-indigo-300 text-sm">{spell.name}</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
      </div>
      <div className="space-y-1">
        {spell.description && <p className="whitespace-pre-wrap">{spell.description}</p>}
        {spell.spellLevel && <p><strong className="text-gray-400">Level:</strong> {spell.spellLevel} {spell.school && `(${spell.school})`}</p>}
        {spell.castingTime && <p><strong className="text-gray-400">Cast Time:</strong> {spell.castingTime}</p>}
        {spell.range && <p><strong className="text-gray-400">Range:</strong> {spell.range}</p>}
        {spell.duration && <p><strong className="text-gray-400">Duration:</strong> {spell.duration}</p>}
        {spell.components && (
          <p><strong className="text-gray-400">Components:</strong> 
            {spell.components.V && " V"} 
            {spell.components.S && " S"} 
            {spell.components.M && ` M (${spell.components.M})`}
          </p>
        )}
        {spell.isRitual && <p className="text-sky-400">Ritual</p>}
        {spell.areaOfEffect && (
          <p><strong className="text-gray-400">Area:</strong> {spell.areaOfEffect.description || `${spell.areaOfEffect.size}ft ${spell.areaOfEffect.type}${spell.areaOfEffect.sizeY ? ` x ${spell.areaOfEffect.sizeY}ft` : ''}`}</p>
        )}
        {spell.damage && spell.damage.length > 0 && (
            <p><strong className="text-gray-400">Damage:</strong> {spell.damage.map(d => `${d.dice} ${d.type}`).join(', ')}</p>
        )}
        {spell.effects && spell.effects.length > 0 && (!spell.damage || spell.damage.length === 0) && (
             <p><strong className="text-gray-400">Effect:</strong> {spell.effects.join(', ')}</p>
        )}
        {spell.source && <p className="text-gray-500 italic text-xxs mt-1">Source: {spell.source}</p>}
      </div>
    </div>
  );

  return createPortal(spellDetailsContent, document.body);
};
