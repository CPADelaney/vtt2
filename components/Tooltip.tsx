
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TooltipProps } from '../types';

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  enabled = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ top: 0, left: 0 });
  const childrenRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Set portal target once on mount (client-side only)
    if (typeof document !== 'undefined') {
      setPortalTarget(document.body);
    }
  }, []);


  const calculatePosition = useCallback(() => {
    if (!childrenRef.current || !tooltipRef.current) return { top: 0, left: 0 };

    const childRect = childrenRef.current.getBoundingClientRect();
    const tooltipElem = tooltipRef.current;
    
    // Ensure tooltip is rendered to measure its dimensions correctly
    tooltipElem.style.visibility = 'hidden';
    tooltipElem.style.display = 'block'; // Temporarily display to measure
    const tooltipWidth = tooltipElem.offsetWidth;
    const tooltipHeight = tooltipElem.offsetHeight;
    tooltipElem.style.display = ''; // Revert display to allow CSS to control it
    tooltipElem.style.visibility = '';


    let finalTop = 0;
    let finalLeft = 0;
    const offset = 8; // Gap between element and tooltip

    switch (position) {
      case 'bottom':
        finalTop = childRect.bottom + offset;
        finalLeft = childRect.left + childRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        finalTop = childRect.top + childRect.height / 2 - tooltipHeight / 2;
        finalLeft = childRect.left - tooltipWidth - offset;
        break;
      case 'right':
        finalTop = childRect.top + childRect.height / 2 - tooltipHeight / 2;
        finalLeft = childRect.right + offset;
        break;
      case 'top':
      default:
        finalTop = childRect.top - tooltipHeight - offset;
        finalLeft = childRect.left + childRect.width / 2 - tooltipWidth / 2;
        break;
    }

    // Adjustments to keep tooltip on screen
    if (finalLeft < offset) {
      finalLeft = offset;
    } else if (finalLeft + tooltipWidth > window.innerWidth - offset) {
      finalLeft = window.innerWidth - tooltipWidth - offset;
    }
    
    if (finalTop < offset) {
        finalTop = childRect.bottom + offset; // Try to position below if no space above
        if (finalTop + tooltipHeight > window.innerHeight - offset) { // If still no space below
            finalTop = offset; // Default to top edge
        }
    } else if (finalTop + tooltipHeight > window.innerHeight - offset) {
        finalTop = childRect.top - tooltipHeight - offset; // Try to position above if no space below
        if (finalTop < offset) { // If still no space above
            finalTop = window.innerHeight - tooltipHeight - offset; // Default to bottom edge
        }
    }
    
    // Final sanity check for vertical position
    if (finalTop < offset) finalTop = offset;
    if (finalTop + tooltipHeight > window.innerHeight - offset) finalTop = window.innerHeight - tooltipHeight - offset;


    return { top: finalTop, left: finalLeft };

  }, [position, content]); // content dependency for size changes

  const showTooltip = useCallback(() => {
    if (enabled && childrenRef.current) { 
      setIsVisible(true);
    }
  }, [enabled]);

  const hideTooltip = useCallback(() => {
    setIsVisible(false);
  }, []);
  
  useEffect(() => {
    if (isVisible && enabled && childrenRef.current && tooltipRef.current) {
      setCurrentPosition(calculatePosition());
    }
  }, [isVisible, enabled, calculatePosition, content]); // Re-calculate if content changes while visible


  if (!React.isValidElement(children)) {
    return <>{children}</>;
  }

  const childrenWithProps = React.cloneElement(children as React.ReactElement<any>, {
     onMouseEnter: showTooltip,
     onMouseLeave: hideTooltip,
     onFocus: showTooltip,
     onBlur: hideTooltip,
     'aria-describedby': isVisible && enabled ? 'tooltip-content' : undefined,
  });

  const tooltipMarkup = enabled && isVisible ? (
    <div
      id="tooltip-content"
      ref={tooltipRef}
      role="tooltip"
      className="fixed z-[100] px-2.5 py-1.5 text-xs font-normal text-white bg-gray-900 bg-opacity-90 rounded-md shadow-lg ring-1 ring-gray-700 pointer-events-none"
      style={{
        top: `${currentPosition.top}px`,
        left: `${currentPosition.left}px`,
        opacity: isVisible ? 1 : 0, 
        visibility: isVisible ? 'visible' : 'hidden',
        transition: 'opacity 0.1s ease-in-out, visibility 0.1s ease-in-out',
        transform: 'translateZ(0)', // Promote to its own layer for smoother transitions
      }}
    >
      {content}
    </div>
  ) : null;

  return (
    <>
      <div ref={childrenRef} className={`relative inline-block ${className}`}>
        {childrenWithProps}
      </div>
      {portalTarget && tooltipMarkup ? createPortal(tooltipMarkup, portalTarget) : null}
    </>
  );
};
