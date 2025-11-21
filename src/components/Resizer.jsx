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

  // Handles should be positioned relative to the overlay box itself,
  // not the full video container. The overlay container is already
  // positioned at (x * containerWidth, y * containerHeight) with
  // width/height (width * containerWidth / height * containerHeight).
  // So here we only care about the local size.
  const absWidth = width * containerWidth;
  const absHeight = height * containerHeight;

  const handles = [
    // Corner handles
    { id: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
    { id: 'ne', x: absWidth, y: 0, cursor: 'nesw-resize' },
    { id: 'sw', x: 0, y: absHeight, cursor: 'nesw-resize' },
    { id: 'se', x: absWidth, y: absHeight, cursor: 'nwse-resize' },
    // Edge handles
    { id: 'n', x: absWidth / 2, y: 0, cursor: 'ns-resize' },
    { id: 's', x: absWidth / 2, y: absHeight, cursor: 'ns-resize' },
    { id: 'w', x: 0, y: absHeight / 2, cursor: 'ew-resize' },
    { id: 'e', x: absWidth, y: absHeight / 2, cursor: 'ew-resize' },
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

