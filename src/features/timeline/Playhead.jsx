import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectPlayhead, selectZoom, setPlayheadTime } from '../ui/uiSlice';
import { timeToPixels } from '../../utils/timelineUtils';

/**
 * Playhead component - vertical line indicating current playback position
 * Draggable and keyboard accessible
 */
const Playhead = ({ pixelsPerSecond, onSeek }) => {
  const dispatch = useDispatch();
  const playhead = useSelector(selectPlayhead);
  const zoom = useSelector(selectZoom);
  const playheadRef = useRef(null);
  const isDraggingRef = useRef(false);

  const position = timeToPixels(playhead.time, pixelsPerSecond);

  useEffect(() => {
    const getTimelinePosition = (clientX) => {
      const timeline = document.querySelector('.timeline-container');
      if (!timeline) return null;
      
      const rect = timeline.getBoundingClientRect();
      const x = clientX - rect.left;
      return x / pixelsPerSecond;
    };

    const handleMove = (e) => {
      if (!isDraggingRef.current) return;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const time = getTimelinePosition(clientX);
      
      if (time !== null) {
        if (onSeek) {
          onSeek(time);
        } else {
          dispatch(setPlayheadTime(Math.max(0, time)));
        }
      }
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    if (isDraggingRef.current) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [pixelsPerSecond, dispatch, onSeek]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
  };

  const handleKeyDown = (e) => {
    const grid = 0.25; // Default grid size
    let newTime = playhead.time;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newTime = Math.max(0, playhead.time - grid);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newTime = playhead.time + grid;
        break;
      case 'Home':
        e.preventDefault();
        newTime = 0;
        break;
      default:
        return;
    }

    dispatch(setPlayheadTime(newTime));
    if (onSeek) onSeek(newTime);
  };

  return (
    <div
      ref={playheadRef}
      className="absolute top-0 bottom-0 w-0.5 sm:w-1 bg-red-500 z-50 cursor-ew-resize pointer-events-auto touch-manipulation"
      style={{ left: `${position}px` }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      role="slider"
      tabIndex={0}
      aria-label={`Playhead at ${playhead.time.toFixed(2)} seconds`}
      aria-valuenow={playhead.time}
      aria-valuemin={0}
      aria-valuemax={300}
    >
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500" />
    </div>
  );
};

export default Playhead;

