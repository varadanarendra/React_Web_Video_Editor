/**
 * Snapping utility functions for timeline interactions
 */

/**
 * Snap a time value to the nearest grid point
 * @param {number} time - Time in seconds
 * @param {number} gridSize - Grid size in seconds
 * @returns {number} Snapped time
 */
export const snapToGrid = (time, gridSize) => {
  return Math.round(time / gridSize) * gridSize;
};

/**
 * Snap a time value to the nearest segment edge
 * @param {number} time - Time in seconds
 * @param {Array} segments - Array of segment objects
 * @param {number} threshold - Snap threshold in seconds (default 0.1)
 * @returns {number} Snapped time (or original if no snap)
 */
export const snapToSegmentEdge = (time, segments, threshold = 0.1) => {
  let snappedTime = time;
  let minDistance = threshold;

  segments.forEach(segment => {
    const start = segment.startTime;
    const end = segment.startTime + segment.duration;
    
    const distToStart = Math.abs(time - start);
    const distToEnd = Math.abs(time - end);

    if (distToStart < minDistance) {
      minDistance = distToStart;
      snappedTime = start;
    }
    if (distToEnd < minDistance) {
      minDistance = distToEnd;
      snappedTime = end;
    }
  });

  return snappedTime;
};

/**
 * Snap time to both grid and segment edges (prioritizes closer snap)
 * @param {number} time - Time in seconds
 * @param {number} gridSize - Grid size in seconds
 * @param {Array} segments - Array of segment objects
 * @param {number} threshold - Snap threshold in seconds
 * @returns {number} Snapped time
 */
export const snapTime = (time, gridSize, segments, threshold = 0.1) => {
  const gridSnap = snapToGrid(time, gridSize);
  const edgeSnap = snapToSegmentEdge(time, segments, threshold);

  const distToGrid = Math.abs(time - gridSnap);
  const distToEdge = Math.abs(time - edgeSnap);

  // Return the closer snap, or original if both are too far
  if (distToGrid < threshold && distToEdge < threshold) {
    return distToGrid < distToEdge ? gridSnap : edgeSnap;
  } else if (distToGrid < threshold) {
    return gridSnap;
  } else if (distToEdge < threshold) {
    return edgeSnap;
  }

  return time;
};

