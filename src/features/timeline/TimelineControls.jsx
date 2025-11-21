import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectZoom,
  selectTimelineViewport,
  setZoom,
  adjustZoom,
  fitTimelineToContent,
} from "../ui/uiSlice";
import { selectAllSegments } from "../segments/segmentsSlice";
import { getTotalDuration } from "../../utils/timelineUtils";
import Button from "../../components/Button";

/**
 * Timeline controls component - zoom, fit to screen, etc.
 */
const TimelineControls = ({ onFitToScreen }) => {
  const dispatch = useDispatch();
  const zoom = useSelector(selectZoom);
  const viewport = useSelector(selectTimelineViewport);
  const segments = useSelector(selectAllSegments);

  const handleZoomIn = () => {
    dispatch(adjustZoom(0.1));
  };

  const handleZoomOut = () => {
    dispatch(adjustZoom(-0.1));
  };

  const handleFitToScreen = () => {
    // If parent (Timeline) provides a custom fit handler that knows
    // the actual container width, prefer that for a true "fit" behavior.
    if (onFitToScreen) {
      onFitToScreen();
      return;
    }

    // Fallback: just update the viewport based on total duration.
    const totalDuration = getTotalDuration(segments);
    if (totalDuration > 0) {
      dispatch(fitTimelineToContent({ minStart: 0, maxEnd: totalDuration }));
    }
  };

  const handleZoomChange = (e) => {
    const value = parseFloat(e.target.value);
    dispatch(setZoom(value));
  };

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <Button
        variant="secondary"
        onClick={handleFitToScreen}
        ariaLabel="Fit timeline to screen"
        className="text-xs sm:text-sm px-2 sm:px-2 py-1 sm:py-1"
      >
        Fit to Screen
      </Button>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={handleZoomOut}
          ariaLabel="Zoom out"
          className="text-xs sm:text-sm px-2 sm:px-2 py-1 sm:py-1"
        >
          −
        </Button>

        <label className="text-white text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
          <span>Zoom:</span>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={zoom}
            onChange={handleZoomChange}
            className="w-16 sm:w-24"
            aria-label="Timeline zoom level"
          />
          <span className="text-xs sm:text-sm whitespace-nowrap">
            {zoom.toFixed(1)}x
          </span>
        </label>

        <Button
          variant="secondary"
          onClick={handleZoomIn}
          ariaLabel="Zoom in"
          className="text-xs sm:text-sm px-2 sm:px-2 py-1 sm:py-1"
        >
          +
        </Button>
      </div>
    </div>
  );
};

export default TimelineControls;
