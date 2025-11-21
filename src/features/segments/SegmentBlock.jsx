import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { moveSegment, resizeSegment } from "./segmentsSlice";
import { selectGrid, selectZoom, selectSelection } from "../ui/uiSlice";
import { useSelector } from "react-redux";
import { snapTime } from "../../utils/snappingUtils";
import { timeToPixels } from "../../utils/timelineUtils";
import DragHandle from "../../components/DragHandle";

/**
 * Segment block component - draggable and resizable video segment on timeline
 */
const SegmentBlock = ({ segment, pixelsPerSecond, onSelect }) => {
  const dispatch = useDispatch();
  const grid = useSelector(selectGrid);
  const zoom = useSelector(selectZoom);
  const segments = useSelector((state) => state.segments.items);
  const selection = useSelector(selectSelection);
  const blockRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(null); // 'left' | 'right' | null
  const dragStartRef = useRef({ x: 0, startTime: 0 });

  const isSelected =
    selection && selection.type === "segment" && selection.id === segment.id;

  const left = timeToPixels(segment.startTime, pixelsPerSecond);
  const width = timeToPixels(segment.duration, pixelsPerSecond);

  const handleMouseDown = (e) => {
    if (e.target.closest(".resize-handle")) return;

    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX || (e.touches && e.touches[0].clientX),
      startTime: segment.startTime,
    };

    if (onSelect) onSelect(segment.id);
  };

  const handleResizeStart = (side) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(side);
    dragStartRef.current = {
      x: e.clientX || (e.touches && e.touches[0].clientX),
      startTime: segment.startTime,
      duration: segment.duration,
    };

    if (onSelect) onSelect(segment.id);
  };

  React.useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - dragStartRef.current.x;
      const deltaTime = deltaX / pixelsPerSecond;

      if (isDragging) {
        // Move segment
        const newStartTime = dragStartRef.current.startTime + deltaTime;
        const snappedTime = snapTime(
          newStartTime,
          grid,
          segments.filter((s) => s.id !== segment.id)
        );
        dispatch(
          moveSegment({
            id: segment.id,
            newStartTime: Math.max(0, snappedTime),
          })
        );
      } else if (isResizing === "left") {
        // Resize left edge
        const newStartTime = dragStartRef.current.startTime + deltaTime;
        const newDuration = dragStartRef.current.duration - deltaTime;
        const snappedStart = snapTime(
          newStartTime,
          grid,
          segments.filter((s) => s.id !== segment.id)
        );
        const minDuration = 0.1;

        if (newDuration >= minDuration && snappedStart >= 0) {
          dispatch(
            resizeSegment({
              id: segment.id,
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
            resizeSegment({
              id: segment.id,
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
  }, [
    isDragging,
    isResizing,
    pixelsPerSecond,
    grid,
    segments,
    segment.id,
    dispatch,
  ]);

  const handleKeyDown = (e) => {
    const step = grid;
    let newStartTime = segment.startTime;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        newStartTime = Math.max(0, segment.startTime - step);
        dispatch(moveSegment({ id: segment.id, newStartTime }));
        break;
      case "ArrowRight":
        e.preventDefault();
        newStartTime = segment.startTime + step;
        dispatch(moveSegment({ id: segment.id, newStartTime }));
        break;
      default:
        return;
    }
  };

  return (
    <div
      ref={blockRef}
      className={`absolute h-10 sm:h-10 rounded cursor-move touch-manipulation ${
        isSelected
          ? "bg-blue-500 border-2 border-yellow-400 shadow-lg shadow-yellow-400/50"
          : "bg-blue-600 border border-blue-400 hover:bg-blue-700"
      } focus:outline-none focus:ring-2 focus:ring-blue-300`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        transform: isDragging ? "scale(1.02)" : "scale(1)",
        transition: isDragging ? "none" : "transform 0.1s",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Segment ${segment.label} from ${segment.startTime.toFixed(
        2
      )}s to ${(segment.startTime + segment.duration).toFixed(2)}s`}
    >
      <div className="absolute inset-0 flex items-center justify-center text-white text-xs sm:text-sm font-medium px-1 sm:px-2 overflow-hidden">
        <span className="truncate w-full text-center">{segment.label}</span>
      </div>

      <DragHandle
        side="left"
        onMouseDown={handleResizeStart("left")}
        className="resize-handle"
        ariaLabel={`Resize left edge of ${segment.label}`}
      />
      <DragHandle
        side="right"
        onMouseDown={handleResizeStart("right")}
        className="resize-handle"
        ariaLabel={`Resize right edge of ${segment.label}`}
      />
    </div>
  );
};

export default SegmentBlock;
