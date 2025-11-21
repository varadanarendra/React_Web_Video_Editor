import React, { useRef, useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectAllSegments } from "../segments/segmentsSlice";
import { selectAllOverlays } from "../overlays/overlaysSlice";
import { selectAllTransitions } from "../transitions/transitionsSlice";
import {
  selectPlayhead,
  selectZoom,
  selectTimelineViewport,
  setPlayheadTime,
  setSelection,
  setZoom,
  fitTimelineToContent,
} from "../ui/uiSlice";
import {
  timeToPixels,
  pixelsToTime,
  getTotalDuration,
} from "../../utils/timelineUtils";
import SegmentBlock from "../segments/SegmentBlock";
import Playhead from "./Playhead";
import TimelineControls from "./TimelineControls";
import OverlayItem from "../overlays/OverlayItem";
import TransitionHandle from "../transitions/TransitionHandle";
import TransitionModal from "../transitions/TransitionModal";

/**
 * Main Timeline component
 * Displays segments, overlays, and playhead with drag/resize functionality
 */
const Timeline = () => {
  const dispatch = useDispatch();
  const segments = useSelector(selectAllSegments);
  const overlays = useSelector(selectAllOverlays);
  const transitions = useSelector(selectAllTransitions);
  const playhead = useSelector(selectPlayhead);
  const zoom = useSelector(selectZoom);
  const viewport = useSelector(selectTimelineViewport);
  const timelineRef = useRef(null);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(50);
  const [transitionConfig, setTransitionConfig] = useState(null);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, fromSegmentId, toSegmentId }

  // Calculate pixels per second based on zoom
  useEffect(() => {
    setPixelsPerSecond(50 * zoom);
  }, [zoom]);

  // Fit all content horizontally into the visible timeline area
  const handleFitToScreen = () => {
    if (!timelineRef.current) return;

    const totalDuration = getTotalDuration(segments);
    if (!totalDuration || totalDuration <= 0) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const containerWidth = rect.width;
    if (!containerWidth || containerWidth <= 0) return;

    const basePixelsPerSecond = 50;
    const paddingSeconds = 1;
    const visibleDuration = Math.max(totalDuration + paddingSeconds, 5);

    // Compute zoom so that the whole duration fits in the visible width.
    const newZoom =
      containerWidth / (visibleDuration * basePixelsPerSecond || 1);

    // Clamp to allowed zoom range
    const clampedZoom = Math.max(0.1, Math.min(10, newZoom));

    dispatch(setZoom(clampedZoom));
    dispatch(
      fitTimelineToContent({
        minStart: 0,
        maxEnd: visibleDuration,
      })
    );
  };

  const openTransitionModal = (fromSegmentId, toSegmentId) => {
    const existing = transitions.find(
      (t) => t.fromSegmentId === fromSegmentId && t.toSegmentId === toSegmentId
    );
    setTransitionConfig({
      fromSegmentId,
      toSegmentId,
      transition: existing || null,
    });
    setIsTransitionModalOpen(true);
  };

  // Double-clicking on the main video layer should open the transition modal
  // if the click is near a boundary between two adjacent segments.
  const handleSegmentLayerDoubleClick = (e) => {
    if (!timelineRef.current || segments.length < 2) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelsToTime(x, pixelsPerSecond);

    const sorted = [...segments].sort((a, b) => a.startTime - b.startTime);

    // Tolerance in seconds corresponding to ~8px on screen
    const toleranceSeconds = 8 / pixelsPerSecond;

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const boundaryTime = current.startTime + current.duration;

      if (Math.abs(time - boundaryTime) <= toleranceSeconds) {
        openTransitionModal(current.id, next.id);
        break;
      }
    }
  };

  // Right-click context menu on the main video layer to add a transition
  const handleSegmentLayerContextMenu = (e) => {
    if (!timelineRef.current || segments.length < 2) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelsToTime(x, pixelsPerSecond);

    const sorted = [...segments].sort((a, b) => a.startTime - b.startTime);

    // Find the nearest boundary between adjacent segments to where the user clicked
    let nearest = null;
    let minDiff = Infinity;

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const boundaryTime = current.startTime + current.duration;
      const diff = Math.abs(time - boundaryTime);

      if (diff < minDiff) {
        minDiff = diff;
        nearest = { fromSegmentId: current.id, toSegmentId: next.id };
      }
    }

    if (nearest) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        fromSegmentId: nearest.fromSegmentId,
        toSegmentId: nearest.toSegmentId,
      });
    }
  };

  // Close context menu on any click outside
  useEffect(() => {
    if (!contextMenu) return;

    const handleGlobalClick = (e) => {
      if (e.target.closest && e.target.closest(".timeline-context-menu")) {
        return;
      }
      setContextMenu(null);
    };

    document.addEventListener("click", handleGlobalClick);
    document.addEventListener("contextmenu", handleGlobalClick);

    return () => {
      document.removeEventListener("click", handleGlobalClick);
      document.removeEventListener("contextmenu", handleGlobalClick);
    };
  }, [contextMenu]);

  // Generate time markers
  const timeMarkers = useMemo(() => {
    const markers = [];
    const start = Math.floor(viewport.start);
    const end = Math.ceil(viewport.end);
    const step = Math.max(1, Math.floor((end - start) / 20)); // Max 20 markers

    for (let time = start; time <= end; time += step) {
      markers.push(time);
    }
    return markers;
  }, [viewport]);

  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelsToTime(x, pixelsPerSecond);
    dispatch(setPlayheadTime(Math.max(0, time)));
  };

  const handleSeek = (time) => {
    dispatch(setPlayheadTime(Math.max(0, time)));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const totalDuration = getTotalDuration(segments);
  const timelineWidth = timeToPixels(
    Math.max(viewport.end, totalDuration || 30),
    pixelsPerSecond
  );

  return (
    <div className="flex flex-col bg-gray-800 text-white rounded-lg p-2 sm:p-4">
      <div className="mb-2 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base sm:text-lg font-semibold">Timeline</h2>
        <TimelineControls onFitToScreen={handleFitToScreen} />
      </div>

      <div
        ref={timelineRef}
        className="relative bg-gray-900 rounded border border-gray-700 overflow-x-auto timeline-container touch-pan-x"
        style={{ minHeight: "180px" }}
        onClick={handleTimelineClick}
        role="application"
        aria-label="Video timeline editor"
      >
        {/* Time markers */}
        <div className="absolute top-0 left-0 right-0 h-6 sm:h-8 border-b border-gray-700 flex">
          {timeMarkers.map((time) => (
            <div
              key={time}
              className="absolute border-l border-gray-600 text-[10px] sm:text-xs text-gray-400 px-0.5 sm:px-1"
              style={{ left: `${timeToPixels(time, pixelsPerSecond)}px` }}
            >
              {formatTime(time)}
            </div>
          ))}
        </div>

        {/* Timeline tracks container */}
        <div
          className="relative mt-6 sm:mt-8"
          style={{ width: `${timelineWidth}px`, minHeight: "150px" }}
        >
          {/* Playhead */}
          <Playhead pixelsPerSecond={pixelsPerSecond} onSeek={handleSeek} />

          {/* Overlays Layer */}
          <div className="absolute top-0 left-0 right-0 h-14 sm:h-16 border-b border-gray-700">
            <div className="text-[10px] sm:text-xs text-gray-400 px-1 sm:px-2 py-1 sm:py-1.5">
              Overlays Layer
            </div>
            {overlays.map((overlay) => {
              // Calculate overlay position on timeline
              const overlayStart = segments
                .filter((seg) => overlay.segmentIds.includes(seg.id))
                .reduce((min, seg) => Math.min(min, seg.startTime), Infinity);

              if (overlayStart === Infinity) return null;

              return (
                <OverlayItem
                  key={overlay.id}
                  overlay={overlay}
                  startTime={overlayStart}
                  pixelsPerSecond={pixelsPerSecond}
                  onSelect={(id) =>
                    dispatch(setSelection({ id, type: "overlay" }))
                  }
                />
              );
            })}
          </div>

          {/* Main Video Layer */}
          <div
            className="absolute top-14 sm:top-16 left-0 right-0 h-14 sm:h-16"
            onDoubleClick={handleSegmentLayerDoubleClick}
            onContextMenu={handleSegmentLayerContextMenu}
          >
            <div className="text-[10px] sm:text-xs text-gray-400 px-1 sm:px-2 py-1 sm:py-1.5">
              Main Video Layer ({segments.length} segment
              {segments.length !== 1 ? "s" : ""})
            </div>
            {segments.length === 0 ? (
              <div className="text-[10px] sm:text-xs text-gray-500 px-2 py-1">
                No segments. Add a video to get started.
              </div>
            ) : (
              <>
                {segments.map((segment) => (
                  <SegmentBlock
                    key={segment.id}
                    segment={segment}
                    pixelsPerSecond={pixelsPerSecond}
                    onSelect={(id) =>
                      dispatch(setSelection({ id, type: "segment" }))
                    }
                  />
                ))}

                {/* Transition handles between adjacent segments */}
                {segments
                  .slice()
                  .sort((a, b) => a.startTime - b.startTime)
                  .map((seg, index, arr) => {
                    if (index === arr.length - 1) return null;
                    const nextSeg = arr[index + 1];

                    const existing = transitions.find(
                      (t) =>
                        t.fromSegmentId === seg.id &&
                        t.toSegmentId === nextSeg.id
                    );

                    if (!existing) return null;

                    const boundaryTime = seg.startTime + seg.duration;
                    const left = timeToPixels(boundaryTime, pixelsPerSecond);
                    const centerY = 14; // vertical center of segment row

                    return (
                      <TransitionHandle
                        key={`${seg.id}-${nextSeg.id}`}
                        left={left}
                        top={centerY}
                        hasTransition={true}
                        onDoubleClick={() =>
                          openTransitionModal(seg.id, nextSeg.id)
                        }
                        onClick={() => {
                          dispatch(
                            setSelection({
                              id: existing.id,
                              type: "transition",
                            })
                          );
                        }}
                      />
                    );
                  })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Timeline: {segments.length} segments, playhead at{" "}
        {playhead.time.toFixed(2)} seconds
      </div>

      {/* Right-click context menu for transitions */}
      {contextMenu && (
        <div
          className="timeline-context-menu fixed z-50 bg-gray-800 text-white text-xs rounded shadow-lg border border-gray-700"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            type="button"
            className="block w-full text-left px-3 py-2 hover:bg-gray-700"
            onClick={() => {
              openTransitionModal(
                contextMenu.fromSegmentId,
                contextMenu.toSegmentId
              );
              setContextMenu(null);
            }}
          >
            Add Transition
          </button>
        </div>
      )}

      {/* Transition configuration modal */}
      <TransitionModal
        isOpen={isTransitionModalOpen}
        fromSegment={
          transitionConfig
            ? segments.find((s) => s.id === transitionConfig.fromSegmentId)
            : null
        }
        toSegment={
          transitionConfig
            ? segments.find((s) => s.id === transitionConfig.toSegmentId)
            : null
        }
        existingTransition={transitionConfig?.transition || null}
        onClose={() => setIsTransitionModalOpen(false)}
      />
    </div>
  );
};

export default Timeline;
