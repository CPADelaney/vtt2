
import React from 'react';
import { LastD20RollDisplayInfo } from '../types';

interface RecentD20RollWidgetProps {
  rollInfo: LastD20RollDisplayInfo | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const RecentD20RollWidget: React.FC<RecentD20RollWidgetProps> = ({
  rollInfo,
  isCollapsed,
  onToggleCollapse,
}) => {
  const getOutcomeColor = (outcome: LastD20RollDisplayInfo['outcome']): string => {
    switch (outcome) {
      case 'success':
        return 'text-green-400';
      case 'failure':
        return 'text-red-400';
      case 'critical_hit':
        return 'text-yellow-400 font-bold';
      case 'critical_miss':
        return 'text-orange-400 font-bold';
      case 'dm_resolves':
      default:
        return 'text-sky-300';
    }
  };

  const getOutcomeText = (outcome: LastD20RollDisplayInfo['outcome']): string => {
    switch (outcome) {
      case 'success': return 'Success!';
      case 'failure': return 'Failure!';
      case 'critical_hit': return 'Critical Hit!';
      case 'critical_miss': return 'Critical Miss!';
      case 'dm_resolves': return 'DM Resolves';
      default: return 'Pending';
    }
  };

  const getAdvantageDisadvantageText = (state?: 'advantage' | 'disadvantage' | 'none') => {
    if (state === 'advantage') return '(Adv)';
    if (state === 'disadvantage') return '(Dis)';
    return '';
  };

  return (
    <div
      className="absolute bottom-4 left-4 z-20 bg-gray-800 bg-opacity-80 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl border border-gray-700 transition-all duration-300 ease-in-out"
      style={{ maxWidth: isCollapsed ? '40px' : '220px', maxHeight: isCollapsed ? '40px' : '130px' }} // Slightly wider for adv/dis text
    >
      <button
        onClick={onToggleCollapse}
        className="w-full p-1.5 text-left flex justify-between items-center bg-gray-700 hover:bg-gray-600 rounded-t-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
        aria-expanded={!isCollapsed}
        aria-controls="d20-roll-widget-content"
        title={isCollapsed ? 'Expand Roll Info' : 'Collapse Roll Info'}
      >
        {isCollapsed ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0-4.5L15 15" />
          </svg>
        ) : (
          <>
            <span className="font-semibold text-indigo-300">Last d20 Roll</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 text-indigo-300 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </>
        )}
      </button>

      {!isCollapsed && (
        <div id="d20-roll-widget-content" className="p-2 space-y-1 overflow-hidden">
          {rollInfo ? (
            <>
              <div className="truncate">
                <span className="font-medium text-gray-300">{rollInfo.characterName}</span>
                <span className="text-gray-400"> rolled </span>
                <span className="font-medium text-gray-300">{rollInfo.rollType}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-lg font-bold text-sky-300" title={`d20 roll: ${rollInfo.d20Value}${getAdvantageDisadvantageText(rollInfo.advantageState)} ${rollInfo.d20Rolls ? `from [${rollInfo.d20Rolls.join(', ')}]` : ''}`}>
                  d20: <span className={rollInfo.d20Value === 20 ? 'text-yellow-400' : rollInfo.d20Value === 1 ? 'text-orange-400' : 'text-sky-300'}>{rollInfo.d20Value}</span>
                  <span className="text-xs ml-0.5 text-sky-400">{getAdvantageDisadvantageText(rollInfo.advantageState)}</span>
                  {rollInfo.d20Rolls && (
                     <span className="text-xxs text-gray-500 ml-0.5">[{rollInfo.d20Rolls.join(',')}]</span>
                  )}
                </div>
                {rollInfo.totalResult !== undefined && (
                  <div className="text-sm text-gray-300" title={`Total result: ${rollInfo.totalResult}`}>
                    Total: <span className="font-semibold">{rollInfo.totalResult}</span>
                  </div>
                )}
              </div>
              <div className={`text-center font-semibold ${getOutcomeColor(rollInfo.outcome)} pt-1 border-t border-gray-700`}>
                {getOutcomeText(rollInfo.outcome)}
                {rollInfo.targetValue && (rollInfo.outcome === 'success' || rollInfo.outcome === 'failure') && (
                  <span className="text-gray-400 text-xxs"> (vs {rollInfo.targetValue})</span>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-500 italic">No d20 roll recorded yet.</p>
          )}
        </div>
      )}
    </div>
  );
};
