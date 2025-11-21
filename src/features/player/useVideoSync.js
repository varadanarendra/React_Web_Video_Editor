import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectPlayhead, setPlayheadTime } from '../ui/uiSlice';
import { selectAllSegments } from '../segments/segmentsSlice';
import { getSegmentAtTime, globalTimeToSegmentTime, segmentTimeToFileTime } from '../../utils/timelineUtils';

/**
 * Custom hook for syncing video player with Redux state
 * This is used by VideoPlayer component
 */
export const useVideoSync = (player, playAll = false) => {
  const dispatch = useDispatch();
  const playhead = useSelector(selectPlayhead);
  const segments = useSelector(selectAllSegments);
  const throttleRef = useRef(null);

  useEffect(() => {
    if (!player) return;

    const handleTimeUpdate = () => {
      if (throttleRef.current) return;
      
      throttleRef.current = setTimeout(() => {
        if (player && !player.paused()) {
          const currentTime = player.currentTime();
          const segment = getSegmentAtTime(segments, playhead.time);
          
          if (segment) {
            const segmentLocalTime = currentTime - segment.fileOffset;
            const timelineTime = segment.startTime + segmentLocalTime;
            dispatch(setPlayheadTime(timelineTime));
          }
        }
        throttleRef.current = null;
      }, 100);
    };

    player.on('timeupdate', handleTimeUpdate);

    return () => {
      player.off('timeupdate', handleTimeUpdate);
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [player, segments, playhead.time, dispatch]);

  return { playhead, segments };
};

