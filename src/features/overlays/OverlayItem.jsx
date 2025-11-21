import React, { useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectAllSegments } from "../segments/segmentsSlice";
import { selectGrid, selectZoom, selectSelection } from "../ui/uiSlice";
import { moveOverlay, resizeOverlay } from "./overlaysSlice";
import { snapTime } from "../../utils/snappingUtils";
import { timeToPixels } from "../../utils/timelineUtils";
import DragHandle from "../../components/DragHandle";

/**
 * Overlay item component for timeline display
 * Shows overlay blocks on the timeline with drag, resize, and selection functionality
 */
const OverlayItem = ({ overlay, startTime, pixelsPerSecond, onSelect }) => {
  const dispatch = useDispatch();
  const segments = useSelector(selectAllSegments);
  const grid = useSelector(selectGrid);
  const zoom = useSelector(selectZoom);
  const selection = useSelector(selectSelection);
  const blockRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(null); // 'left' | 'right' | null
  const dragStartRef = useRef({ x: 0, startTime: 0 });

  const isSelected =
    selection && selection.type === "overlay" && selection.id === overlay.id;

  // Find the earliest segment this overlay is assigned to (for validation)
  const earliestSegment = segments
    .filter((seg) => overlay.segmentIds.includes(seg.id))
    .sort((a, b) => a.startTime - b.startTime)[0];

  if (!earliestSegment) return null;

  // Calculate absolute timeline time for the overlay
  // startTime prop is already the earliest segment's start time, so just add overlay.startTime
  const overlayAbsoluteTime = startTime + overlay.startTime;
  const left = timeToPixels(overlayAbsoluteTime, pixelsPerSecond);
  const width = timeToPixels(overlay.duration, pixelsPerSecond);
  const maxStartWithinSegment = Math.max(
    0,
    (earliestSegment?.duration || 0) - overlay.duration
  );

  const handleMouseDown = (e) => {
    if (e.target.closest(".resize-handle")) return;

    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX || (e.touches && e.touches[0].clientX),
      startTime: overlay.startTime,
    };

    if (onSelect) onSelect(overlay.id);
  };

  const handleResizeStart = (side) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(side);
    dragStartRef.current = {
      x: e.clientX || (e.touches && e.touches[0].clientX),
      startTime: overlay.startTime,
      duration: overlay.duration,
    };

    if (onSelect) onSelect(overlay.id);
  };

  React.useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - dragStartRef.current.x;
      const deltaTime = deltaX / pixelsPerSecond;

      if (isDragging) {
        // Move overlay along timeline
        let newStartTime = dragStartRef.current.startTime + deltaTime;
        // Snap to grid, but don't allow negative startTime
        const snappedTime = snapTime(newStartTime, grid, []);
        // Clamp so overlay stays within its segment duration
        newStartTime = Math.min(
          Math.max(0, snappedTime),
          maxStartWithinSegment
        );
        dispatch(
          moveOverlay({
            id: overlay.id,
            newStartTime,
          })
        );
      } else if (isResizing === "left") {
        // Resize left edge
        const newStartTime = dragStartRef.current.startTime + deltaTime;
        const newDuration = dragStartRef.current.duration - deltaTime;
        const snappedStart = snapTime(newStartTime, grid, []);
        const minDuration = 0.1;

        if (newDuration >= minDuration && snappedStart >= 0) {
          dispatch(
            resizeOverlay({
              id: overlay.id,
              newStartTime: snappedStart,
              newDuration: newDuration,
            })
          );
        }
      } else if (isResizing === "right") {
        // Resize right edge
        const newDuration = dragStartRef.current.duration + deltaTime;
        const minDuration = 0.1;

        if (newDuration >= minDuration) {
          const snappedDuration = snapTime(newDuration, grid, []);
          dispatch(
            resizeOverlay({
              id: overlay.id,
              newDuration: snappedDuration,
            })
          );
        }
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, isResizing, pixelsPerSecond, grid, overlay.id, dispatch]);

  const handleKeyDown = (e) => {
    const step = grid;
    let newStartTime = overlay.startTime;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        newStartTime = Math.max(0, overlay.startTime - step);
        dispatch(moveOverlay({ id: overlay.id, newStartTime }));
        break;
      case "ArrowRight":
        e.preventDefault();
        newStartTime = Math.min(
          overlay.startTime + step,
          maxStartWithinSegment
        );
        dispatch(
          moveOverlay({
            id: overlay.id,
            newStartTime,
          })
        );
        break;
      default:
        return;
    }
  };

  return (
    <div
      ref={blockRef}
      className={`absolute h-8 sm:h-9 rounded cursor-move touch-manipulation ${
        isSelected
          ? "bg-red-500 border-2 border-yellow-400 shadow-lg shadow-yellow-400/50"
          : "bg-red-600 border border-red-400 hover:bg-red-700"
      } focus:outline-none focus:ring-2 focus:ring-red-300`}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 20)}px`, // Minimum width for visibility
        top: "24px",
        transform: isDragging ? "scale(1.02)" : "scale(1)",
        transition: isDragging ? "none" : "transform 0.1s",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Overlay ${
        overlay.text || overlay.id
      } from ${overlayAbsoluteTime.toFixed(2)}s`}
    >
      <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] sm:text-xs font-medium px-1 sm:px-2 overflow-hidden h-full">
        <span className="truncate w-full text-center">
          {overlay.text || "Overlay"}
        </span>
      </div>

      <DragHandle
        side="left"
        onMouseDown={handleResizeStart("left")}
        className="resize-handle"
        ariaLabel={`Resize left edge of ${overlay.text || "overlay"}`}
      />
      <DragHandle
        side="right"
        onMouseDown={handleResizeStart("right")}
        className="resize-handle"
        ariaLabel={`Resize right edge of ${overlay.text || "overlay"}`}
      />
    </div>
  );
};

export default OverlayItem;
