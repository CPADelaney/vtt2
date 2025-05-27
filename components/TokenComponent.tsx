
import React from 'react';
import { Token } from '../types';
import { SELECTED_TOKEN_COLOR, SELECTED_TOKEN_STROKE_COLOR, MULTI_SELECTED_TOKEN_STROKE_COLOR } from '../constants';

interface TokenComponentProps {
  token: Token;
  isSelected: boolean;
  isPrimarySelected?: boolean;
  isTargetingSource?: boolean;
  isDefeated?: boolean; // New prop for defeated NPCs
  onTokenMouseDown: (event: React.MouseEvent, tokenId: string) => void;
  onTokenClick: (event: React.MouseEvent, tokenId: string) => void;
  customCursor?: string; 
}

export const TokenComponent: React.FC<TokenComponentProps> = ({ 
  token, isSelected, isPrimarySelected, isTargetingSource, isDefeated,
  onTokenMouseDown, onTokenClick, customCursor 
}) => {
  let strokeColor = 'rgba(0,0,0,0.4)';
  let fillColor = token.color;
  let strokeWidth = 1.5;
  let filterEffect = '';
  let gOpacity = 1;
  let textStyleOverride: React.CSSProperties = {};

  if (isDefeated) {
    fillColor = 'rgba(128, 20, 20, 0.7)'; // Dark red
    strokeColor = 'rgba(80, 0, 0, 0.8)';
    strokeWidth = 1;
    gOpacity = 0.6; // Reduced opacity for the whole group
    textStyleOverride = { textDecoration: 'line-through', fill: 'rgba(180, 180, 180, 0.7)' };
  } else if (isTargetingSource) {
    fillColor = 'rgba(250, 204, 21, 0.9)'; 
    strokeColor = 'rgba(253, 230, 138, 1)'; 
    strokeWidth = 3;
    filterEffect = 'url(#token-glow)';
  } else if (isSelected) {
    fillColor = isPrimarySelected ? SELECTED_TOKEN_COLOR : token.color; 
    strokeColor = isPrimarySelected ? SELECTED_TOKEN_STROKE_COLOR : MULTI_SELECTED_TOKEN_STROKE_COLOR;
    strokeWidth = isPrimarySelected ? 3.5 : 2.5;
  }

  const cursorClass = isDefeated ? 'cursor-default' : (customCursor || 'cursor-pointer');

  return (
    <g
      data-token-id={token.id} 
      onMouseDown={(e) => onTokenMouseDown(e, token.id)}
      onClick={(e) => onTokenClick(e, token.id)}
      className={`${cursorClass} transition-all duration-100 ease-out hover:opacity-90`}
      transform={`translate(${token.position.x}, ${token.position.y})`}
      style={{ isolation: 'isolate', opacity: gOpacity }} 
      filter={filterEffect}
    >
      <circle
        cx={0}
        cy={0}
        r={token.radius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        style={{ transition: 'fill 0.1s ease, stroke 0.1s ease, r 0.1s ease, stroke-width 0.1s ease' }}
      />
      {token.name && (
        <text
          x={0}
          y={token.radius + 12} 
          textAnchor="middle"
          fontSize={Math.max(10, token.radius * 0.45)} 
          fill={isDefeated ? textStyleOverride.fill : (isSelected || isTargetingSource ? "white" : "rgba(235, 235, 245, 0.9)")}
          paintOrder="stroke" 
          stroke="rgba(0,0,0,0.7)" 
          strokeWidth="0.25em" 
          strokeLinejoin="round"
          className="pointer-events-none font-semibold"
          style={{ userSelect: 'none', ...textStyleOverride }}
        >
          {token.name}
        </text>
      )}
    </g>
  );
};
