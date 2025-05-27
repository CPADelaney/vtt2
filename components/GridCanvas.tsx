
import React, { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Token, Point, ViewBox, MarqueeRect, Ping, User, AttackTargetingState, SpellTargetingState, Character } from '../types';
import { TokenComponent } from './TokenComponent';
import {
  GRID_CELL_SIZE, INITIAL_VIEWBOX_WIDTH, INITIAL_VIEWBOX_HEIGHT, MIN_ZOOM_WIDTH, MAX_ZOOM_WIDTH, ZOOM_SENSITIVITY_WHEEL,
  PING_COLOR, PING_DURATION_MS, PING_MAX_RADIUS_FACTOR, PING_HOLD_DURATION_MS, PING_MOVE_THRESHOLD_PX,
  MARQUEE_FILL_COLOR, MARQUEE_STROKE_COLOR, MARQUEE_STROKE_WIDTH,
  SCROLLBAR_THICKNESS, SCROLLBAR_COLOR, SCROLLBAR_TRACK_COLOR, SCROLLBAR_HOVER_COLOR,
  WORLD_WIDTH, WORLD_HEIGHT
} from '../constants';
// Import getCellsInCone from utils
import { parseRangeToPixels, getCellsInCone } from '../utils';

interface GridCanvasProps {
  tokens: Token[];
  selectedTokenIds: string[];
  onTokenSelect: (tokenId: string | null, isMultiSelect?: boolean) => void;
  onTokenDragStart: (tokenId: string, clickOffset: Point) => void;
  onTokenMove: (tokenId: string, newPosition: Point) => void;
  onTokenDragEnd: () => void;
  onShowContextMenu: (screenX: number, screenY: number, worldPoint: Point, tokenId?: string) => void;
  onMarqueeSelect: (selectedIds: string[]) => void;
  currentUser: User;
  getCharacterOwner: (tokenId: string) => string | null;
  getCharacterIsNPC: (tokenId: string) => boolean;
  onCharacterDrop: (characterId: string, worldPosition: Point) => void;
  onCreatureTemplateDrop: (templateId: string, worldPosition: Point) => void;
  attackTargetingState: AttackTargetingState;
  onResolveAttack: (targetTokenId: string) => void;
  onCancelAttackMode: () => void;
  spellTargetingState: SpellTargetingState; 
  onResolveSpellTarget: (targetIdOrPoint: string | Point) => void; 
  onCancelSpellTargeting: () => void;
  getCharacterById: (characterId: string) => Character | undefined;
}

export interface GridCanvasHandle {
  getViewportCenter: () => Point;
}


const getReachableCells = (origin: Point, rangeInPixels: number, cellSize: number): Point[] => {
  const reachableCells: Point[] = [];
  if (rangeInPixels < 0) return reachableCells;

  const maxCellOffset = Math.ceil(rangeInPixels / cellSize) + 1; // +1 to be safe with rounding
  const originCellX = Math.floor(origin.x / cellSize);
  const originCellY = Math.floor(origin.y / cellSize);

  for (let dCellX = -maxCellOffset; dCellX <= maxCellOffset; dCellX++) {
    for (let dCellY = -maxCellOffset; dCellY <= maxCellOffset; dCellY++) {
      const currentCellXIndex = originCellX + dCellX;
      const currentCellYIndex = originCellY + dCellY;

      const targetCellCenterX = currentCellXIndex * cellSize + cellSize / 2;
      const targetCellCenterY = currentCellYIndex * cellSize + cellSize / 2;

      const dx = targetCellCenterX - origin.x;
      const dy = targetCellCenterY - origin.y;
      const distanceSq = dx * dx + dy * dy;

      if (distanceSq <= rangeInPixels * rangeInPixels) {
        reachableCells.push({ x: currentCellXIndex * cellSize, y: currentCellYIndex * cellSize });
      }
    }
  }
  return reachableCells;
};

// getCellsInCone is now imported from utils.ts


export const GridCanvas = forwardRef<GridCanvasHandle, GridCanvasProps>(({
  tokens, selectedTokenIds, onTokenSelect, onTokenDragStart, onTokenMove, onTokenDragEnd,
  onShowContextMenu, onMarqueeSelect, currentUser, getCharacterOwner, getCharacterIsNPC,
  onCharacterDrop, onCreatureTemplateDrop,
  attackTargetingState, onResolveAttack, onCancelAttackMode,
  spellTargetingState, onResolveSpellTarget, onCancelSpellTargeting,
  getCharacterById
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState<ViewBox>({ x: 0, y: 0, width: INITIAL_VIEWBOX_WIDTH, height: INITIAL_VIEWBOX_HEIGHT });

  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingToken, setIsDraggingToken] = useState(false);
  const [dragStartScreenPoint, setDragStartScreenPoint] = useState<Point | null>(null);
  const [tokenDragOffset, setTokenDragOffset] = useState<Point>({x: 0, y: 0});
  const activelyDraggedTokenIdRef = useRef<string | null>(null);

  const [isMarqueeing, setIsMarqueeing] = useState(false);
  const [marqueeStartWorldPoint, setMarqueeStartWorldPoint] = useState<Point | null>(null);
  const [marqueeCurrentWorldPoint, setMarqueeCurrentWorldPoint] = useState<Point | null>(null);

  const activePingAttemptTimerIdRef = useRef<number | null>(null);
  const [activePings, setActivePings] = useState<Ping[]>([]);

  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState<'horizontal' | 'vertical' | null>(null);
  const [hoverScrollbar, setHoverScrollbar] = useState<'horizontal' | 'vertical' | null>(null);

  const initialRightMouseDownScreenPointRef = useRef<Point | null>(null);
  const rightClickDragOccurredRef = useRef(false);

  const [conePreviewEndPoint, setConePreviewEndPoint] = useState<Point | null>(null);


  useImperativeHandle(ref, () => ({
    getViewportCenter: () => {
      return {
        x: viewBox.x + viewBox.width / 2,
        y: viewBox.y + viewBox.height / 2,
      };
    }
  }));

  const clientToWorld = useCallback((clientX: number, clientY: number): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const transformedPoint = pt.matrixTransform(ctm.inverse());
    return { x: transformedPoint.x, y: transformedPoint.y };
  }, []);


  const startPing = useCallback((worldPos: Point) => {
    const newPing: Ping = {
      id: `ping_${Date.now()}`,
      position: worldPos,
      startTime: typeof window.performance?.now === 'function' ? window.performance.now() : Date.now(),
      maxRadius: PING_MAX_RADIUS_FACTOR,
      duration: PING_DURATION_MS,
      color: PING_COLOR,
    };
    setActivePings(prev => [...prev, newPing]);
    setTimeout(() => {
        setActivePings(currentPings => currentPings.filter(p => p.id !== newPing.id));
    }, PING_DURATION_MS + 100);
  }, []);

  useEffect(() => {
    let frameId: number;

    const animationLoop = (timestamp: DOMHighResTimeStamp) => {
      setActivePings(prevPings =>
        prevPings.map(ping => {
          const elapsedTime = timestamp - ping.startTime;
          return elapsedTime < ping.duration ? ping : null;
        }).filter(Boolean) as Ping[]
      );
      frameId = requestAnimationFrame(animationLoop);
    };

    frameId = requestAnimationFrame(animationLoop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [setActivePings]);


  const handleMouseDownSVG = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const worldClickPos = clientToWorld(event.clientX, event.clientY);

    if (attackTargetingState.isActive) {
        if (event.button === 2) onCancelAttackMode(); // Right-click cancels attack mode
        // Left click targeting is handled by onTokenMouseDown
        return;
    }
    if (spellTargetingState.isActive) {
        if (event.button === 0 && spellTargetingState.spell?.areaOfEffect?.type === 'cone') {
            onResolveSpellTarget(worldClickPos); // Pass the click point for cone direction
        } else if (event.button === 0 && spellTargetingState.spell?.areaOfEffect && ['sphere', 'cube', 'cylinder'].includes(spellTargetingState.spell.areaOfEffect.type) && spellTargetingState.spell.range !== 'Self') {
            onResolveSpellTarget(worldClickPos); // For placing AoEs not centered on self
        } else if (event.button === 2) {
            onCancelSpellTargeting();
        }
        return;
    }


    if (event.button === 0) { // Left click
      const screenPosForPing = { x: event.clientX, y: event.clientY };
      setDragStartScreenPoint(screenPosForPing);

      if (activePingAttemptTimerIdRef.current) {
        clearTimeout(activePingAttemptTimerIdRef.current);
      }

      const newTimerId = window.setTimeout(() => {
        if (activePingAttemptTimerIdRef.current === newTimerId) {
          startPing(clientToWorld(screenPosForPing.x, screenPosForPing.y));
          activePingAttemptTimerIdRef.current = null;
        }
      }, PING_HOLD_DURATION_MS);
      activePingAttemptTimerIdRef.current = newTimerId;

      setIsMarqueeing(true);
      setMarqueeStartWorldPoint(worldClickPos);
      setMarqueeCurrentWorldPoint(worldClickPos);

    } else if (event.button === 2) { // Right click
      setIsPanning(true);
      setDragStartScreenPoint({ x: event.clientX, y: event.clientY });
      initialRightMouseDownScreenPointRef.current = { x: event.clientX, y: event.clientY };
      rightClickDragOccurredRef.current = false;
    }
  }, [clientToWorld, startPing, attackTargetingState.isActive, onCancelAttackMode, spellTargetingState, onResolveSpellTarget, onCancelSpellTargeting]);

  const handleTokenMouseDown = useCallback((event: React.MouseEvent<SVGGElement>, tokenId: string) => {
    event.stopPropagation();

    if (attackTargetingState.isActive) {
      if (event.button === 0) { // Left-click on token to resolve attack
        onResolveAttack(tokenId);
      } else if (event.button === 2) { // Right-click to cancel
         onCancelAttackMode();
      }
      return;
    }

    if (spellTargetingState.isActive) {
      if (event.button === 0) { // Left-click on token to resolve spell
        if (spellTargetingState.spell?.areaOfEffect?.type !== 'cone' &&
            !(spellTargetingState.spell?.areaOfEffect && ['sphere', 'cube', 'cylinder'].includes(spellTargetingState.spell.areaOfEffect.type) && spellTargetingState.spell.range !== 'Self')
        ) { 
          onResolveSpellTarget(tokenId);
        }
      } else if (event.button === 2) { // Right-click to cancel
        onCancelSpellTargeting();
      }
      return;
    }

    if (activePingAttemptTimerIdRef.current) {
        clearTimeout(activePingAttemptTimerIdRef.current);
        activePingAttemptTimerIdRef.current = null;
    }
    setIsMarqueeing(false);

    const worldClickPos = clientToWorld(event.clientX, event.clientY);
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return;

    const ownerId = getCharacterOwner(tokenId);
    const isNPC = getCharacterIsNPC(tokenId);
    const canControl = currentUser.isDM || (currentUser.id === ownerId && !isNPC);

    if (event.button === 0) { // Left click
      if (canControl) {
        setIsDraggingToken(true);
        activelyDraggedTokenIdRef.current = tokenId;
        setDragStartScreenPoint({ x: event.clientX, y: event.clientY });
        const dragOffset = {x: worldClickPos.x - token.position.x, y: worldClickPos.y - token.position.y};
        setTokenDragOffset(dragOffset);
        onTokenDragStart(tokenId, dragOffset);
      } else { // If cannot control, just select
         onTokenSelect(tokenId, event.shiftKey);
      }
    } else if (event.button === 2) { // Right click on token
        initialRightMouseDownScreenPointRef.current = { x: event.clientX, y: event.clientY };
        rightClickDragOccurredRef.current = false;
        // Context menu will be shown on mouse up if no drag occurred
    }
  }, [clientToWorld, tokens, onTokenDragStart, onTokenSelect, currentUser, getCharacterOwner, getCharacterIsNPC, attackTargetingState, onResolveAttack, onCancelAttackMode, spellTargetingState, onResolveSpellTarget, onCancelSpellTargeting]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!svgRef.current) return;
    
    const currentMouseWorldPos = clientToWorld(event.clientX, event.clientY);

    if (spellTargetingState.isActive && 
        spellTargetingState.spell?.areaOfEffect &&
        (spellTargetingState.spell.areaOfEffect.type === 'cone' || 
         (spellTargetingState.spell.areaOfEffect.type === 'sphere' && spellTargetingState.spell.range !== 'Self') ||
         (spellTargetingState.spell.areaOfEffect.type === 'cube' && spellTargetingState.spell.range !== 'Self') ||
         (spellTargetingState.spell.areaOfEffect.type === 'cylinder' && spellTargetingState.spell.range !== 'Self')
        )
    ) {
        setConePreviewEndPoint(currentMouseWorldPos);
    } else {
        if (conePreviewEndPoint !== null) { 
            setConePreviewEndPoint(null);
        }
    }
    
    if (attackTargetingState.isActive) return; // Don't process other mouse moves if attacking

    if (activePingAttemptTimerIdRef.current && dragStartScreenPoint) {
        const dx = Math.abs(event.clientX - dragStartScreenPoint.x);
        const dy = Math.abs(event.clientY - dragStartScreenPoint.y);
        if (dx > PING_MOVE_THRESHOLD_PX || dy > PING_MOVE_THRESHOLD_PX) {
            clearTimeout(activePingAttemptTimerIdRef.current);
            activePingAttemptTimerIdRef.current = null;
        }
    }

    if (isDraggingToken && dragStartScreenPoint && activelyDraggedTokenIdRef.current) {
        const currentDraggedTokenId = activelyDraggedTokenIdRef.current;
        const worldPos = clientToWorld(event.clientX, event.clientY);
        const newPosition = {
          x: worldPos.x - tokenDragOffset.x,
          y: worldPos.y - tokenDragOffset.y,
        };
        onTokenMove(currentDraggedTokenId, newPosition);
    } else if (isMarqueeing && marqueeStartWorldPoint && !activePingAttemptTimerIdRef.current && !spellTargetingState.isActive) { // Don't marquee if spell targeting
        setMarqueeCurrentWorldPoint(clientToWorld(event.clientX, event.clientY));
    } else if (isPanning && dragStartScreenPoint) {
      if (initialRightMouseDownScreenPointRef.current && !rightClickDragOccurredRef.current) {
          const totalDx = Math.abs(event.clientX - initialRightMouseDownScreenPointRef.current.x);
          const totalDy = Math.abs(event.clientY - initialRightMouseDownScreenPointRef.current.y);
          if (totalDx > PING_MOVE_THRESHOLD_PX || totalDy > PING_MOVE_THRESHOLD_PX) {
              rightClickDragOccurredRef.current = true;
          }
      }

      const dx = event.clientX - dragStartScreenPoint.x;
      const dy = event.clientY - dragStartScreenPoint.y;

      const currentSvg = svgRef.current;
      if (!currentSvg) return;
      const clientWidth = currentSvg.clientWidth || 1;
      const clientHeight = currentSvg.clientHeight || 1;
      const scaleX = viewBox.width / clientWidth;
      const scaleY = viewBox.height / clientHeight;


      setViewBox(prev => ({
        ...prev,
        x: prev.x - dx * scaleX,
        y: prev.y - dy * scaleY,
      }));
      setDragStartScreenPoint({ x: event.clientX, y: event.clientY });
    } else if (isDraggingScrollbar && dragStartScreenPoint && svgRef.current) {
        const svgRect = svgRef.current.getBoundingClientRect();
        if (isDraggingScrollbar === 'horizontal') {
            const dx = event.clientX - dragStartScreenPoint.x;
            const worldDx = dx * (WORLD_WIDTH / (svgRect.width - SCROLLBAR_THICKNESS));
            setViewBox(prev => ({...prev, x: Math.max(0, Math.min(prev.x + worldDx, WORLD_WIDTH - prev.width))}));
        } else {
            const dy = event.clientY - dragStartScreenPoint.y;
            const worldDy = dy * (WORLD_HEIGHT / (svgRect.height - SCROLLBAR_THICKNESS));
            setViewBox(prev => ({...prev, y: Math.max(0, Math.min(prev.y + worldDy, WORLD_HEIGHT - prev.height))}));
        }
        setDragStartScreenPoint({ x: event.clientX, y: event.clientY });
    }
  }, [
      isPanning, isDraggingToken, dragStartScreenPoint,
      clientToWorld, tokenDragOffset, onTokenMove,
      isMarqueeing, marqueeStartWorldPoint,
      viewBox, isDraggingScrollbar, attackTargetingState.isActive, 
      spellTargetingState.isActive, spellTargetingState.spell 
  ]);

  const memoizedHandleMouseMoveRef = useRef(handleMouseMove);
  useEffect(() => { memoizedHandleMouseMoveRef.current = handleMouseMove; }, [handleMouseMove]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (activePingAttemptTimerIdRef.current) {
        clearTimeout(activePingAttemptTimerIdRef.current);
        activePingAttemptTimerIdRef.current = null;
    }

    if (isMarqueeing && marqueeStartWorldPoint && marqueeCurrentWorldPoint && !spellTargetingState.isActive) { // Ensure not spell targeting
      const x1 = Math.min(marqueeStartWorldPoint.x, marqueeCurrentWorldPoint.x);
      const y1 = Math.min(marqueeStartWorldPoint.y, marqueeCurrentWorldPoint.y);
      const x2 = Math.max(marqueeStartWorldPoint.x, marqueeCurrentWorldPoint.x);
      const y2 = Math.max(marqueeStartWorldPoint.y, marqueeCurrentWorldPoint.y);

      const selectedIds = tokens
        .filter(token => {
          const tokenCenterX = token.position.x;
          const tokenCenterY = token.position.y;
          return tokenCenterX >= x1 && tokenCenterX <= x2 && tokenCenterY >= y1 && tokenCenterY <= y2;
        })
        .map(token => token.id);
      onMarqueeSelect(selectedIds);
    } else if (isDraggingToken && activelyDraggedTokenIdRef.current) {
        onTokenDragEnd();
    } else if (!isDraggingToken && !isMarqueeing && !isDraggingScrollbar) {
        const targetElement = event.target as SVGElement;
        const clickedTokenElement = targetElement.closest('g[data-token-id]');
        const clickedTokenId = clickedTokenElement?.getAttribute('data-token-id') || undefined;

        if (event.button === 0 && !attackTargetingState.isActive && !spellTargetingState.isActive) {
            const isBackgroundClick = !clickedTokenId && (targetElement.tagName === 'svg' || targetElement.id === "grid-pattern" || targetElement.closest('#grid-pattern'));
            if (isBackgroundClick) {
                onTokenSelect(null);
            }
        } else if (event.button === 2) { // Right click for context menu
            if (!rightClickDragOccurredRef.current && initialRightMouseDownScreenPointRef.current) {
                const worldPt = clientToWorld(event.clientX, event.clientY);
                if (!attackTargetingState.isActive && !spellTargetingState.isActive) { // Don't show context menu if targeting
                    onShowContextMenu(event.clientX, event.clientY, worldPt, clickedTokenId);
                }
            }
        }
    }

    setIsPanning(false);
    setIsDraggingToken(false);
    activelyDraggedTokenIdRef.current = null;
    setIsMarqueeing(false);
    setMarqueeStartWorldPoint(null);
    setMarqueeCurrentWorldPoint(null);
    setDragStartScreenPoint(null);
    initialRightMouseDownScreenPointRef.current = null;
    rightClickDragOccurredRef.current = false;
    setIsDraggingScrollbar(null);
  }, [
      clientToWorld, tokens, onTokenSelect, onTokenDragEnd, onMarqueeSelect, onShowContextMenu,
      isMarqueeing, marqueeStartWorldPoint, marqueeCurrentWorldPoint,
      isDraggingToken, isDraggingScrollbar,
      attackTargetingState.isActive, spellTargetingState.isActive
  ]);
  const memoizedHandleMouseUpRef = useRef(handleMouseUp);
  useEffect(() => { memoizedHandleMouseUpRef.current = handleMouseUp; }, [handleMouseUp]);


  const handleWheel = useCallback((event: WheelEvent) => {
    if (!svgRef.current) return;
    event.preventDefault();

    const svgRect = svgRef.current.getBoundingClientRect();
    const pointer = clientToWorld(event.clientX, event.clientY);

    const zoomFactor = event.deltaY < 0 ? 1 / ZOOM_SENSITIVITY_WHEEL : ZOOM_SENSITIVITY_WHEEL;
    let newWidth = viewBox.width * zoomFactor;
    let newHeight = viewBox.height * zoomFactor;

    if (newWidth < MIN_ZOOM_WIDTH) { newWidth = MIN_ZOOM_WIDTH; newHeight = MIN_ZOOM_WIDTH * (svgRect.height / svgRect.width); }
    if (newWidth > MAX_ZOOM_WIDTH) { newWidth = MAX_ZOOM_WIDTH; newHeight = MAX_ZOOM_WIDTH * (svgRect.height / svgRect.width); }

    const clientWidth = svgRect.width || 1;
    const clientHeight = svgRect.height || 1;

    if (newHeight < MIN_ZOOM_WIDTH * (clientHeight / clientWidth)) { newHeight = MIN_ZOOM_WIDTH * (clientHeight / clientWidth); newWidth = newHeight * (clientWidth / clientHeight); }
    if (newHeight > MAX_ZOOM_WIDTH * (clientHeight / clientWidth)) { newHeight = MAX_ZOOM_WIDTH * (clientHeight / clientWidth); newWidth = newHeight * (clientWidth / clientHeight); }


    const newX = pointer.x - ( (event.clientX - svgRect.left) / clientWidth) * newWidth;
    const newY = pointer.y - ( (event.clientY - svgRect.top) / clientHeight) * newHeight;

    setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });
  }, [viewBox, clientToWorld]);
  const memoizedHandleWheelRef = useRef(handleWheel);
  useEffect(() => { memoizedHandleWheelRef.current = handleWheel; }, [handleWheel]);

  const handleDragOver = useCallback((event: React.DragEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (event.dataTransfer.types.includes('application/x-character-id') || event.dataTransfer.types.includes('application/x-creature-template-id')) {
        event.dataTransfer.dropEffect = 'copy';
    } else {
        event.dataTransfer.dropEffect = 'none';
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<SVGSVGElement>) => {
    event.preventDefault();
    const characterId = event.dataTransfer.getData('application/x-character-id');
    const templateId = event.dataTransfer.getData('application/x-creature-template-id');
    const worldDropPosition = clientToWorld(event.clientX, event.clientY);

    if (characterId) {
        onCharacterDrop(characterId, worldDropPosition);
    } else if (templateId) {
        onCreatureTemplateDrop(templateId, worldDropPosition);
    }
  }, [clientToWorld, onCharacterDrop, onCreatureTemplateDrop]);

  useEffect(() => {
    const currentSvg = svgRef.current;
    if (!currentSvg) return;

    const handleGlobalMouseMove = (event: MouseEvent) => memoizedHandleMouseMoveRef.current(event);
    const handleGlobalMouseUp = (event: MouseEvent) => memoizedHandleMouseUpRef.current(event);
    const handleGlobalWheel = (event: WheelEvent) => memoizedHandleWheelRef.current(event);

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    currentSvg.addEventListener('wheel', handleGlobalWheel, { passive: false });

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      currentSvg.removeEventListener('wheel', handleGlobalWheel);
    };
  }, []);

  useEffect(() => {
    const handleGlobalKeyboardEvents = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (attackTargetingState.isActive) onCancelAttackMode();
        else if (spellTargetingState.isActive) onCancelSpellTargeting();
        else if (selectedTokenIds.length > 0) onTokenSelect(null);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyboardEvents);
    return () => window.removeEventListener('keydown', handleGlobalKeyboardEvents);
  }, [selectedTokenIds, onTokenSelect, attackTargetingState.isActive, onCancelAttackMode, spellTargetingState.isActive, onCancelSpellTargeting]);

  const scrollbarThumbWidth = svgRef.current ? Math.max(20, (viewBox.width / WORLD_WIDTH) * (svgRef.current.clientWidth - SCROLLBAR_THICKNESS)) : 0;
  const scrollbarThumbHeight = svgRef.current ? Math.max(20, (viewBox.height / WORLD_HEIGHT) * (svgRef.current.clientHeight - SCROLLBAR_THICKNESS)) : 0;
  const scrollbarThumbX = svgRef.current ? (viewBox.x / WORLD_WIDTH) * (svgRef.current.clientWidth - SCROLLBAR_THICKNESS) : 0;
  const scrollbarThumbY = svgRef.current ? (viewBox.y / WORLD_HEIGHT) * (svgRef.current.clientHeight - SCROLLBAR_THICKNESS) : 0;

  const handleScrollbarMouseDown = (event: React.MouseEvent, direction: 'horizontal' | 'vertical') => {
    event.stopPropagation();
    setIsDraggingScrollbar(direction);
    setDragStartScreenPoint({ x: event.clientX, y: event.clientY });
  };

  const attackerTokenPos = attackTargetingState.isActive && attackTargetingState.attackerId
    ? tokens.find(t => t.characterId === attackTargetingState.attackerId)?.position
    : null;
  const attackRangeInPixels = attackTargetingState.isActive && attackerTokenPos && attackTargetingState.actionDetails?.range
    ? parseRangeToPixels(attackTargetingState.actionDetails.range, GRID_CELL_SIZE)
    : null;
  const attackAreaOfEffectCells = (attackTargetingState.isActive && attackerTokenPos && attackRangeInPixels !== null && attackRangeInPixels >= 0)
    ? getReachableCells(attackerTokenPos, attackRangeInPixels, GRID_CELL_SIZE)
    : [];

  const casterTokenPos = spellTargetingState.isActive && spellTargetingState.casterId
    ? tokens.find(t => t.characterId === spellTargetingState.casterId)?.position
    : null;
  let spellAreaOfEffectCells: Point[] = [];
  let spellConePath: string | null = null;
  let spellAoeCenterPreview: Point | null = null; // For spheres not centered on caster

  if (spellTargetingState.isActive && spellTargetingState.spell && casterTokenPos) {
    const spell = spellTargetingState.spell;
    if (spell.areaOfEffect) {
        const rangePixels = parseRangeToPixels(String(spell.areaOfEffect.size), GRID_CELL_SIZE);
        
        if (rangePixels !== null && rangePixels > 0) { 
            if (spell.areaOfEffect.type === 'cone' && conePreviewEndPoint) {
                spellAreaOfEffectCells = getCellsInCone(casterTokenPos, conePreviewEndPoint, rangePixels, 60, GRID_CELL_SIZE); 
                
                const dirX = conePreviewEndPoint.x - casterTokenPos.x;
                const dirY = conePreviewEndPoint.y - casterTokenPos.y;
                const magSq = dirX * dirX + dirY * dirY;

                if (magSq > 0.001) { 
                    const angle = Math.atan2(dirY, dirX);
                    const coneAngleRad = (60 / 2) * (Math.PI / 180); 

                    const p1x = casterTokenPos.x + rangePixels * Math.cos(angle - coneAngleRad);
                    const p1y = casterTokenPos.y + rangePixels * Math.sin(angle - coneAngleRad);
                    const p2x = casterTokenPos.x + rangePixels * Math.cos(angle + coneAngleRad);
                    const p2y = casterTokenPos.y + rangePixels * Math.sin(angle + coneAngleRad);
                    spellConePath = `M ${casterTokenPos.x} ${casterTokenPos.y} L ${p1x} ${p1y} A ${rangePixels} ${rangePixels} 0 0 1 ${p2x} ${p2y} Z`;
                } else {
                  spellConePath = null; 
                }

            } else if (['sphere', 'cube', 'cylinder'].includes(spell.areaOfEffect.type) && spell.range !== 'Self' && conePreviewEndPoint) {
                 spellAoeCenterPreview = conePreviewEndPoint; // Store the intended center
                 spellAreaOfEffectCells = getReachableCells(conePreviewEndPoint, rangePixels, GRID_CELL_SIZE);
            } else if (['sphere', 'cube', 'cylinder'].includes(spell.areaOfEffect.type) && spell.range === 'Self') {
                spellAoeCenterPreview = casterTokenPos; // Centered on caster
                spellAreaOfEffectCells = getReachableCells(casterTokenPos, rangePixels, GRID_CELL_SIZE);
            }
        } else {
            spellConePath = null;
            spellAreaOfEffectCells = [];
        }
    } else if (spell.range) { 
        const rangePixels = parseRangeToPixels(spell.range, GRID_CELL_SIZE);
        if (rangePixels !== null && rangePixels >=0) { 
            spellAreaOfEffectCells = getReachableCells(casterTokenPos, rangePixels, GRID_CELL_SIZE);
        }
    }
  }


  const tokenCursor = (token: Token) => {
      if (attackTargetingState.isActive) {
          if (token.characterId === attackTargetingState.attackerId) return 'cursor-default';
          const attackerCharacter = attackTargetingState.attackerId ? getCharacterById(attackTargetingState.attackerId) : null;
          const attackerToken = attackerCharacter ? tokens.find(t => t.characterId === attackerCharacter.id) : null;
          if (attackerToken && attackRangeInPixels !== null) {
            const attackerPosition = attackerToken.position;
            const targetPosition = token.position;
            const distanceSq = (targetPosition.x - attackerPosition.x)**2 + (targetPosition.y - attackerPosition.y)**2;
            if (distanceSq <= attackRangeInPixels**2) return 'cursor-crosshair';
          }
          return 'cursor-not-allowed';
      }
      if (spellTargetingState.isActive) {
          if (token.characterId === spellTargetingState.casterId) return 'cursor-default';
          if (spellAreaOfEffectCells.some(cell => 
              token.position.x >= cell.x && token.position.x < cell.x + GRID_CELL_SIZE &&
              token.position.y >= cell.y && token.position.y < cell.y + GRID_CELL_SIZE
          )) {
              return 'cursor-crosshair';
          }
          return 'cursor-not-allowed';
      }
      const ownerId = getCharacterOwner(token.id);
      const isOwnedNPC = getCharacterIsNPC(token.id);
      if (currentUser.isDM || (currentUser.id === ownerId && !isOwnedNPC)) return 'cursor-grab';
      return 'cursor-pointer';
  };

  const handleSvgContextMenu = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
  };

  const svgCursorStyle = () => {
    if (isPanning || isDraggingToken) return 'grabbing'; 
    if (attackTargetingState.isActive) return 'crosshair';
    if (spellTargetingState.isActive) {
        if (spellTargetingState.spell?.areaOfEffect?.type === 'cone' || 
           (spellTargetingState.spell?.areaOfEffect && ['sphere', 'cube', 'cylinder'].includes(spellTargetingState.spell.areaOfEffect.type) && spellTargetingState.spell.range !== 'Self')
           ) { 
            return 'copy'; 
        }
        return 'crosshair';
    }
    return 'default';
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-white">
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDownSVG}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onContextMenu={handleSvgContextMenu}
        style={{ cursor: svgCursorStyle() }}
      >
        <defs>
          <pattern id="grid-pattern" x="0" y="0" width={GRID_CELL_SIZE} height={GRID_CELL_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID_CELL_SIZE} 0 L 0 0 0 ${GRID_CELL_SIZE}`} fill="none" stroke="rgba(150, 150, 150, 0.4)" strokeWidth="1"/>
          </pattern>
           <filter id="token-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect id="grid-background" x={viewBox.x} y={viewBox.y} width={viewBox.width} height={viewBox.height} fill="url(#grid-pattern)" />

        {attackTargetingState.isActive && attackerTokenPos && attackAreaOfEffectCells.map((cell, index) => (
          <rect
            key={`aoe-attack-cell-${index}`}
            x={cell.x}
            y={cell.y}
            width={GRID_CELL_SIZE}
            height={GRID_CELL_SIZE}
            fill="rgba(255, 0, 0, 0.15)"
            stroke="rgba(255, 0, 0, 0.3)"
            strokeWidth="0.5"
            className="pointer-events-none"
          />
        ))}

        {spellTargetingState.isActive && spellAreaOfEffectCells.map((cell, index) => (
          <rect
            key={`aoe-spell-cell-${index}`}
            x={cell.x}
            y={cell.y}
            width={GRID_CELL_SIZE}
            height={GRID_CELL_SIZE}
            fill="rgba(0, 150, 255, 0.15)"
            stroke="rgba(0, 150, 255, 0.3)"
            strokeWidth="0.5"
            className="pointer-events-none"
          />
        ))}
         {spellTargetingState.isActive && spellTargetingState.spell?.areaOfEffect?.type === 'cone' && spellConePath && (
            <path
              d={spellConePath}
              fill="rgba(0, 150, 255, 0.25)"
              stroke="rgba(0, 150, 255, 0.5)"
              strokeWidth="1"
              className="pointer-events-none"
            />
        )}
        {spellTargetingState.isActive && spellTargetingState.spell?.areaOfEffect && 
          ['sphere', 'cube', 'cylinder'].includes(spellTargetingState.spell.areaOfEffect.type) &&
          spellAoeCenterPreview && spellTargetingState.spell.areaOfEffect.size > 0 && (
          <circle
            cx={spellAoeCenterPreview.x}
            cy={spellAoeCenterPreview.y}
            r={parseRangeToPixels(String(spellTargetingState.spell.areaOfEffect.size), GRID_CELL_SIZE)}
            fill="rgba(0, 150, 255, 0.1)"
            stroke="rgba(0, 150, 255, 0.3)"
            strokeDasharray="2 2"
            strokeWidth="0.5"
            className="pointer-events-none"
          />
        )}


        {tokens.map(token => {
          const character = token.characterId ? getCharacterById(token.characterId) : undefined;
          const isDefeatedNPC = character?.isNPC && character?.currentHp <= 0;
          return (
            <TokenComponent
              key={token.id}
              token={token}
              isSelected={selectedTokenIds.includes(token.id)}
              isPrimarySelected={selectedTokenIds.length === 1 && selectedTokenIds[0] === token.id}
              isTargetingSource={
                  (attackTargetingState.isActive && token.characterId === attackTargetingState.attackerId) ||
                  (spellTargetingState.isActive && token.characterId === spellTargetingState.casterId)
              }
              isDefeated={isDefeatedNPC}
              onTokenMouseDown={handleTokenMouseDown}
              onTokenClick={(e, id) => { if(e.button === 0 && !isDraggingToken && !attackTargetingState.isActive && !spellTargetingState.isActive) onTokenSelect(id, e.shiftKey);}}
              customCursor={tokenCursor(token)}
            />
          );
        })}

        {isMarqueeing && marqueeStartWorldPoint && marqueeCurrentWorldPoint && (
          <rect
            x={Math.min(marqueeStartWorldPoint.x, marqueeCurrentWorldPoint.x)}
            y={Math.min(marqueeStartWorldPoint.y, marqueeCurrentWorldPoint.y)}
            width={Math.abs(marqueeCurrentWorldPoint.x - marqueeStartWorldPoint.x)}
            height={Math.abs(marqueeCurrentWorldPoint.y - marqueeStartWorldPoint.y)}
            fill={MARQUEE_FILL_COLOR}
            stroke={MARQUEE_STROKE_COLOR}
            strokeWidth={MARQUEE_STROKE_WIDTH / (viewBox.width / INITIAL_VIEWBOX_WIDTH)}
            className="pointer-events-none"
          />
        )}

        {activePings.map(ping => {
            const elapsedTime = (typeof window.performance?.now === 'function' ? window.performance.now() : Date.now()) - ping.startTime;
            const progress = elapsedTime / ping.duration;
            const currentRadius = ping.maxRadius * Math.sin(progress * Math.PI);
            const opacity = 1 - progress;
            return (
              <circle
                key={ping.id}
                cx={ping.position.x}
                cy={ping.position.y}
                r={currentRadius}
                fill="none"
                stroke={ping.color}
                strokeWidth={Math.max(1, 4 * (1 - progress))}
                opacity={opacity}
                className="pointer-events-none"
              />
            );
        })}
      </svg>

      {svgRef.current && svgRef.current.clientWidth < WORLD_WIDTH && (
        <div
          className="absolute bottom-0 left-0 h-3 bg-opacity-50 rounded"
          style={{
            width: `calc(100% - ${SCROLLBAR_THICKNESS}px)`,
            height: `${SCROLLBAR_THICKNESS}px`,
            backgroundColor: SCROLLBAR_TRACK_COLOR,
          }}
          onMouseEnter={() => setHoverScrollbar('horizontal')}
          onMouseLeave={() => setHoverScrollbar(null)}
        >
          <div
            className="absolute top-0 h-full rounded"
            style={{
              width: `${scrollbarThumbWidth}px`,
              left: `${scrollbarThumbX}px`,
              height: `${SCROLLBAR_THICKNESS}px`,
              backgroundColor: isDraggingScrollbar === 'horizontal' || hoverScrollbar === 'horizontal' ? SCROLLBAR_HOVER_COLOR : SCROLLBAR_COLOR,
              cursor: 'grab'
            }}
            onMouseDown={(e) => handleScrollbarMouseDown(e, 'horizontal')}
          />
        </div>
      )}
      {svgRef.current && svgRef.current.clientHeight < WORLD_HEIGHT && (
         <div
          className="absolute top-0 right-0 w-3 bg-opacity-50 rounded"
          style={{
            height: `calc(100% - ${SCROLLBAR_THICKNESS}px)`,
            width: `${SCROLLBAR_THICKNESS}px`,
            backgroundColor: SCROLLBAR_TRACK_COLOR,
          }}
          onMouseEnter={() => setHoverScrollbar('vertical')}
          onMouseLeave={() => setHoverScrollbar(null)}
        >
          <div
            className="absolute left-0 w-full rounded"
            style={{
              height: `${scrollbarThumbHeight}px`,
              top: `${scrollbarThumbY}px`,
              width: `${SCROLLBAR_THICKNESS}px`,
              backgroundColor: isDraggingScrollbar === 'vertical' || hoverScrollbar === 'vertical' ? SCROLLBAR_HOVER_COLOR : SCROLLBAR_COLOR,
              cursor: 'grab'
            }}
            onMouseDown={(e) => handleScrollbarMouseDown(e, 'vertical')}
          />
        </div>
      )}
    </div>
  );
});
