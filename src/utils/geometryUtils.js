/**
 * Geometry utility functions for overlay positioning and resizing
 */

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Convert relative coordinates (0-1) to absolute pixels
 * @param {number} relative - Relative coordinate (0-1)
 * @param {number} containerSize - Container size in pixels
 * @returns {number} Absolute pixel position
 */
export const relativeToAbsolute = (relative, containerSize) => {
  return relative * containerSize;
};

/**
 * Convert absolute pixels to relative coordinates (0-1)
 * @param {number} absolute - Absolute pixel position
 * @param {number} containerSize - Container size in pixels
 * @returns {number} Relative coordinate (0-1)
 */
export const absoluteToRelative = (absolute, containerSize) => {
  return containerSize > 0 ? absolute / containerSize : 0;
};

/**
 * Constrain overlay position and size within bounds
 * @param {Object} overlay - Overlay object with x, y, width, height
 * @returns {Object} Constrained overlay geometry
 */
export const constrainOverlayGeometry = (overlay) => {
  return {
    x: clamp(overlay.x, 0, 1),
    y: clamp(overlay.y, 0, 1),
    width: clamp(overlay.width, 0.05, 1 - overlay.x),
    height: clamp(overlay.height, 0.05, 1 - overlay.y),
  };
};

/**
 * Check if a point is inside a rectangle
 * @param {number} x - Point x coordinate
 * @param {number} y - Point y coordinate
 * @param {number} rectX - Rectangle x position
 * @param {number} rectY - Rectangle y position
 * @param {number} rectWidth - Rectangle width
 * @param {number} rectHeight - Rectangle height
 * @returns {boolean} True if point is inside rectangle
 */
export const isPointInRect = (x, y, rectX, rectY, rectWidth, rectHeight) => {
  return x >= rectX && x <= rectX + rectWidth && y >= rectY && y <= rectY + rectHeight;
};

/**
 * Get resize handle hit test
 * @param {number} x - Mouse x coordinate (relative)
 * @param {number} y - Mouse y coordinate (relative)
 * @param {Object} overlay - Overlay object
 * @param {number} handleSize - Handle size in relative units
 * @returns {string|null} Handle type ('nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w') or null
 */
export const getResizeHandle = (x, y, overlay, handleSize = 0.05) => {
  const { x: ox, y: oy, width, height } = overlay;
  const right = ox + width;
  const bottom = oy + height;

  // Corner handles
  if (Math.abs(x - ox) < handleSize && Math.abs(y - oy) < handleSize) return 'nw';
  if (Math.abs(x - right) < handleSize && Math.abs(y - oy) < handleSize) return 'ne';
  if (Math.abs(x - ox) < handleSize && Math.abs(y - bottom) < handleSize) return 'sw';
  if (Math.abs(x - right) < handleSize && Math.abs(y - bottom) < handleSize) return 'se';

  // Edge handles
  if (Math.abs(x - ox) < handleSize && y >= oy && y <= bottom) return 'w';
  if (Math.abs(x - right) < handleSize && y >= oy && y <= bottom) return 'e';
  if (Math.abs(y - oy) < handleSize && x >= ox && x <= right) return 'n';
  if (Math.abs(y - bottom) < handleSize && x >= ox && x <= right) return 's';

  return null;
};

