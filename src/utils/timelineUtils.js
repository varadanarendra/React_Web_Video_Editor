/**
 * Timeline utility functions for converting between time and pixel positions
 */

/**
 * Convert timeline time (seconds) to pixel position
 * @param {number} time - Time in seconds
 * @param {number} pixelsPerSecond - Pixels per second (based on zoom)
 * @returns {number} Pixel position
 */
export const timeToPixels = (time, pixelsPerSecond) => {
  return time * pixelsPerSecond;
};

/**
 * Convert pixel position to timeline time (seconds)
 * @param {number} pixels - Pixel position
 * @param {number} pixelsPerSecond - Pixels per second (based on zoom)
 * @returns {number} Time in seconds
 */
export const pixelsToTime = (pixels, pixelsPerSecond) => {
  return pixels / pixelsPerSecond;
};

/**
 * Get the total duration of all segments
 * @param {Array} segments - Array of segment objects
 * @returns {number} Total duration in seconds
 */
export const getTotalDuration = (segments) => {
  if (!segments || segments.length === 0) return 0;
  return Math.max(...segments.map(seg => seg.startTime + seg.duration));
};

/**
 * Get the segment at a specific timeline time
 * @param {Array} segments - Array of segment objects
 * @param {number} time - Timeline time in seconds
 * @returns {Object|null} Segment object or null
 */
export const getSegmentAtTime = (segments, time) => {
  return segments.find(seg => 
    time >= seg.startTime && time < seg.startTime + seg.duration
  ) || null;
};

/**
 * Convert global timeline time to segment-local time
 * @param {Object} segment - Segment object
 * @param {number} globalTime - Global timeline time
 * @returns {number|null} Local time within segment, or null if not in segment
 */
export const globalTimeToSegmentTime = (segment, globalTime) => {
  if (globalTime < segment.startTime || globalTime >= segment.startTime + segment.duration) {
    return null;
  }
  return globalTime - segment.startTime;
};

/**
 * Convert segment-local time to video file time (with offset)
 * @param {Object} segment - Segment object
 * @param {number} segmentTime - Time within segment
 * @returns {number} Time in video file
 */
export const segmentTimeToFileTime = (segment, segmentTime) => {
  return segment.fileOffset + segmentTime;
};

/**
 * Get the next segment after a given time
 * @param {Array} segments - Array of segment objects
 * @param {number} time - Timeline time
 * @returns {Object|null} Next segment or null
 */
export const getNextSegment = (segments, time) => {
  const sorted = [...segments].sort((a, b) => a.startTime - b.startTime);
  return sorted.find(seg => seg.startTime > time) || null;
};

/**
 * Get the previous segment before a given time
 * @param {Array} segments - Array of segment objects
 * @param {number} time - Timeline time
 * @returns {Object|null} Previous segment or null
 */
export const getPreviousSegment = (segments, time) => {
  const sorted = [...segments].sort((a, b) => b.startTime - a.startTime);
  return sorted.find(seg => seg.startTime + seg.duration <= time) || null;
};

