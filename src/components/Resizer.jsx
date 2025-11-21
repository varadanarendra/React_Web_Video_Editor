import React from 'react';

/**
 * Resizer component for overlay resizing
 * Provides handles for all edges and corners
 */
const Resizer = ({ 
  overlay, 
  onResizeStart,
  containerWidth,
  containerHeight,
  isSelected = false 
}) => {
  if (!isSelected) return null;

  const handleSize = 10; // pixels - slightly larger for touch
  const { x, y, width, height } = overlay;
  
  const absX = x * containerWidth;
  const absY = y * containerHeight;
  const absWidth = width * containerWidth;
  const absHeight = height * containerHeight;

  const handles = [
    { id: 'nw', x: absX, y: absY, cursor: 'nwse-resize' },
    { id: 'ne', x: absX + absWidth, y: absY, cursor: 'nesw-resize' },
    { id: 'sw', x: absX, y: absY + absHeight, cursor: 'nesw-resize' },
    { id: 'se', x: absX + absWidth, y: absY + absHeight, cursor: 'nwse-resize' },
    { id: 'n', x: absX + absWidth / 2, y: absY, cursor: 'ns-resize' },
    { id: 's', x: absX + absWidth / 2, y: absY + absHeight, cursor: 'ns-resize' },
    { id: 'w', x: absX, y: absY + absHeight / 2, cursor: 'ew-resize' },
    { id: 'e', x: absX + absWidth, y: absY + absHeight / 2, cursor: 'ew-resize' },
  ];

  return (
    <>
      {handles.map(handle => (
        <div
          key={handle.id}
          className="absolute bg-blue-500 border-2 border-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300 touch-manipulation"
          style={{
            left: `${handle.x - handleSize / 2}px`,
            top: `${handle.y - handleSize / 2}px`,
            width: `${handleSize}px`,
            height: `${handleSize}px`,
            cursor: handle.cursor,
            minWidth: '10px',
            minHeight: '10px',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (onResizeStart) onResizeStart(e, handle.id);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            if (onResizeStart) onResizeStart(e, handle.id);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (onResizeStart) onResizeStart(e, handle.id);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Resize handle ${handle.id}`}
        />
      ))}
    </>
  );
};

export default Resizer;

