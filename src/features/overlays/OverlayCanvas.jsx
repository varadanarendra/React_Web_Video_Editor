import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectSelection, setSelection } from '../ui/uiSlice';
import { updateOverlayGeometry } from './overlaysSlice';
import { absoluteToRelative, relativeToAbsolute, constrainOverlayGeometry, getResizeHandle } from '../../utils/geometryUtils';
import Resizer from '../../components/Resizer';

/**
 * Overlay Canvas component - renders overlays on top of video player
 * Handles drag and resize interactions
 */
const OverlayCanvas = ({ overlays, currentSegment, timelineTime }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dispatch = useDispatch();
  const selection = useSelector(selectSelection);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(null);
  const dragStartRef = useRef({ x: 0, y: 0, overlay: null });

  // Update container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle drag start
  const handleMouseDown = (e, overlay) => {
    if (e.target.closest('.resize-handle')) return;
    
    e.preventDefault();
    setIsDragging(true);
    dispatch(setSelection({ id: overlay.id, type: 'overlay' }));
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      overlay: { ...overlay },
    };
  };

  // Handle resize start
  const handleResizeStart = (e, overlayId, handle) => {
    e.stopPropagation();
    const overlay = overlays.find(o => o.id === overlayId);
    if (!overlay) return;

    setIsResizing({ overlayId, handle });
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      overlay: { ...overlay },
    };
  };

  // Handle mouse move for drag/resize
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      if (isDragging && dragStartRef.current.overlay) {
        // Drag overlay
        const overlay = dragStartRef.current.overlay;
        const deltaXRel = absoluteToRelative(deltaX, rect.width);
        const deltaYRel = absoluteToRelative(deltaY, rect.height);

        // Clamp so the entire overlay stays within the video bounds
        const maxX = Math.max(0, 1 - overlay.width);
        const maxY = Math.max(0, 1 - overlay.height);
        const newX = Math.max(0, Math.min(maxX, overlay.x + deltaXRel));
        const newY = Math.max(0, Math.min(maxY, overlay.y + deltaYRel));

        dispatch(
          updateOverlayGeometry({
            id: overlay.id,
            x: newX,
            y: newY,
          })
        );
      } else if (isResizing && dragStartRef.current.overlay) {
        // Resize overlay
        const overlay = dragStartRef.current.overlay;
        const deltaXRel = absoluteToRelative(deltaX, rect.width);
        const deltaYRel = absoluteToRelative(deltaY, rect.height);

        let updates = {};

        switch (isResizing.handle) {
          case 'nw':
            updates = {
              x: Math.max(0, overlay.x + deltaXRel),
              y: Math.max(0, overlay.y + deltaYRel),
              width: overlay.width - deltaXRel,
              height: overlay.height - deltaYRel,
            };
            break;
          case 'ne':
            updates = {
              y: Math.max(0, overlay.y + deltaYRel),
              width: overlay.width + deltaXRel,
              height: overlay.height - deltaYRel,
            };
            break;
          case 'sw':
            updates = {
              x: Math.max(0, overlay.x + deltaXRel),
              width: overlay.width - deltaXRel,
              height: overlay.height + deltaYRel,
            };
            break;
          case 'se':
            updates = {
              width: overlay.width + deltaXRel,
              height: overlay.height + deltaYRel,
            };
            break;
          case 'n':
            updates = {
              y: Math.max(0, overlay.y + deltaYRel),
              height: overlay.height - deltaYRel,
            };
            break;
          case 's':
            updates = {
              height: overlay.height + deltaYRel,
            };
            break;
          case 'w':
            updates = {
              x: Math.max(0, overlay.x + deltaXRel),
              width: overlay.width - deltaXRel,
            };
            break;
          case 'e':
            updates = {
              width: overlay.width + deltaXRel,
            };
            break;
        }

        const constrained = constrainOverlayGeometry({ ...overlay, ...updates });
        dispatch(updateOverlayGeometry({
          id: overlay.id,
          ...constrained,
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dispatch]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {overlays.map(overlay => {
        const isSelected = selection?.id === overlay.id && selection?.type === 'overlay';
        const x = relativeToAbsolute(overlay.x, containerSize.width);
        const y = relativeToAbsolute(overlay.y, containerSize.height);
        const width = relativeToAbsolute(overlay.width, containerSize.width);
        const height = relativeToAbsolute(overlay.height, containerSize.height);

        return (
          <div
            key={overlay.id}
            className="absolute pointer-events-auto"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${width}px`,
              height: `${height}px`,
              border: isSelected ? '2px solid #3b82f6' : '2px solid rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(239, 68, 68, 0.7)',
              borderRadius: '8px',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={(e) => handleMouseDown(e, overlay)}
            role="button"
            tabIndex={0}
            aria-label={`Overlay: ${overlay.text || overlay.id}`}
          >
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium p-2 overflow-hidden">
              {overlay.text || 'Overlay'}
            </div>
            
            {isSelected && (
              <Resizer
                overlay={overlay}
                onResizeStart={(e, handle) => handleResizeStart(e, overlay.id, handle)}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
                isSelected={true}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OverlayCanvas;

