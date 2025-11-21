import React from 'react';

/**
 * Drag handle component for timeline interactions
 * Provides visual feedback and accessibility
 */
const DragHandle = ({ 
  onMouseDown, 
  onKeyDown,
  ariaLabel,
  className = '',
  side = 'left' // 'left' | 'right' | 'center'
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onKeyDown) onKeyDown(e);
    }
  };

  return (
    <div
      className={`absolute top-0 bottom-0 w-2 sm:w-3 cursor-ew-resize hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 z-10 touch-manipulation ${
        side === 'left' ? 'left-0' : side === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
      } ${className}`}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
    />
  );
};

export default DragHandle;

