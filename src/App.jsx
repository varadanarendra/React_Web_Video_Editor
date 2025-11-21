import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addSegment,
  deleteSegment,
  selectAllSegments,
} from "./features/segments/segmentsSlice";
import {
  addOverlay,
  deleteOverlay,
  selectAllOverlays,
} from "./features/overlays/overlaysSlice";
import {
  selectAllTransitions,
  deleteTransition,
} from "./features/transitions/transitionsSlice";
import {
  selectPlayhead,
  setPlaying,
  setPlayheadTime,
  fitTimelineToContent,
  selectSelection,
  clearSelection,
} from "./features/ui/uiSlice";
import { store } from "./app/store";
import VideoPlayer from "./features/player/VideoPlayer";
import Timeline from "./features/timeline/Timeline";
import Button from "./components/Button";
import JsonModal from "./components/JsonModal";

/**
 * Main App component
 * Provides the overall layout and header controls
 */
function App() {
  const dispatch = useDispatch();
  const segments = useSelector(selectAllSegments);
  const overlays = useSelector(selectAllOverlays);
  const transitions = useSelector(selectAllTransitions);
  const playhead = useSelector(selectPlayhead);
  const selection = useSelector(selectSelection);
  const fileInputRef = useRef(null);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [exportJson, setExportJson] = useState("");
  const videosLoadedRef = useRef(false);

  // Load videos from public/videos on mount
  useEffect(() => {
    const loadVideosFromPublic = async () => {
      // Only load once on initial mount
      if (videosLoadedRef.current) {
        return;
      }
      videosLoadedRef.current = true;

      // If segments already exist (e.g., from persisted state), don't load
      if (segments.length > 0) {
        return;
      }

      console.log("Loading videos from public/videos directory...");

      const videoFiles = [
        { file: "vid_1.mp4", label: "Video 1" },
        { file: "vid_2.mp4", label: "Video 2" },
        { file: "vid_3.mp4", label: "Video 3" },
      ];
      let currentStartTime = 0;
      let loadedCount = 0;

      for (const { file: videoFile, label: videoLabel } of videoFiles) {
        const videoPath = `/videos/${videoFile}`;

        // Get video duration
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = videoPath;

        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.warn(
              `Timeout loading video: ${videoFile} from ${videoPath}`
            );
            resolve(); // Continue with next video if timeout
          }, 10000); // 10 second timeout

          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            const duration = video.duration;

            if (duration && duration > 0 && !isNaN(duration)) {
              console.log(
                `Loaded video: ${videoLabel} (${videoFile}) - Duration: ${duration}s`
              );
              dispatch(
                addSegment({
                  source: videoPath,
                  label: videoLabel,
                  duration: duration,
                  startTime: currentStartTime,
                  fileOffset: 0,
                })
              );

              currentStartTime += duration;
              loadedCount++;
            } else {
              console.warn(
                `Invalid duration for video: ${videoFile}`,
                duration
              );
            }
            resolve();
          };

          video.onerror = (e) => {
            clearTimeout(timeout);
            console.error(
              `Failed to load video: ${videoFile} from ${videoPath}`,
              e
            );
            console.error("Video error details:", video.error);
            resolve(); // Continue with next video even if one fails
          };
        });
      }

      console.log(
        `Finished loading videos. Successfully loaded ${loadedCount} out of ${videoFiles.length} videos.`
      );

      // Auto-fit timeline viewport to show all loaded videos
      if (loadedCount > 0) {
        const currentSegments = selectAllSegments(store.getState());
        if (currentSegments.length > 0) {
          const maxEnd = Math.max(
            ...currentSegments.map((s) => s.startTime + s.duration)
          );
          const minStart = Math.min(...currentSegments.map((s) => s.startTime));
          dispatch(
            fitTimelineToContent({
              minStart: Math.max(0, minStart),
              maxEnd: maxEnd,
            })
          );
        }
      }
    };

    loadVideosFromPublic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Handle keyboard delete for selected segments
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle delete if not typing in an input/textarea
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Handle Delete or Backspace key
      if ((e.key === "Delete" || e.key === "Backspace") && selection) {
        if (selection.type === "segment") {
          // Find the segment to delete
          const segmentToDelete = segments.find(
            (seg) => seg.id === selection.id
          );

          if (segmentToDelete) {
            // Clean up object URL if it's a blob URL (uploaded video)
            if (
              segmentToDelete.source &&
              segmentToDelete.source.startsWith("blob:")
            ) {
              URL.revokeObjectURL(segmentToDelete.source);
            }

            // Delete the segment
            dispatch(deleteSegment(selection.id));

            // Clear selection
            dispatch(clearSelection());

            // Update timeline viewport if needed
            const remainingSegments = segments.filter(
              (seg) => seg.id !== selection.id
            );
            if (remainingSegments.length > 0) {
              const maxEnd = Math.max(
                ...remainingSegments.map((s) => s.startTime + s.duration)
              );
              const minStart = Math.min(
                ...remainingSegments.map((s) => s.startTime)
              );
              dispatch(
                fitTimelineToContent({
                  minStart: Math.max(0, minStart),
                  maxEnd: maxEnd,
                })
              );
            }
          }
        } else if (selection.type === "overlay") {
          // Delete the overlay
          dispatch(deleteOverlay(selection.id));
          dispatch(clearSelection());
        } else if (selection.type === "transition") {
          // Delete a transition between segments
          dispatch(deleteTransition(selection.id));
          dispatch(clearSelection());
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selection, segments, overlays, dispatch]);

  const handleAddVideo = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    console.log(`Processing ${files.length} file(s)...`);

    for (const file of files) {
      if (file.type.startsWith("video/")) {
        console.log(`Loading video: ${file.name} (${file.type})`);

        // Create object URL for the video file
        const videoUrl = URL.createObjectURL(file);

        // Get video duration
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = videoUrl;

        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.error(`Timeout loading video metadata: ${file.name}`);
            URL.revokeObjectURL(videoUrl); // Clean up
            resolve(); // Continue with next video if timeout
          }, 10000); // 10 second timeout

          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            const duration = video.duration;

            if (duration && duration > 0 && !isNaN(duration)) {
              console.log(
                `Loaded video: ${file.name} - Duration: ${duration}s`
              );

              // Get current segments from store to ensure we have the latest state
              const currentSegments = selectAllSegments(store.getState());

              // Calculate start time (after last segment)
              const lastSegment =
                currentSegments.length > 0
                  ? [...currentSegments]
                      .sort(
                        (a, b) =>
                          a.startTime + a.duration - (b.startTime + b.duration)
                      )
                      .pop()
                  : null;
              const startTime = lastSegment
                ? lastSegment.startTime + lastSegment.duration
                : 0;

              console.log(
                `Adding segment: ${file.name} at startTime: ${startTime}s`
              );

              dispatch(
                addSegment({
                  source: videoUrl,
                  label: file.name,
                  duration: duration,
                  startTime,
                  fileOffset: 0,
                })
              );

              // Update timeline viewport to include the new segment
              // Get updated segments after dispatch (Redux dispatches are synchronous)
              const updatedSegments = selectAllSegments(store.getState());
              if (updatedSegments.length > 0) {
                const maxEnd = Math.max(
                  ...updatedSegments.map((s) => s.startTime + s.duration)
                );
                const minStart = Math.min(
                  ...updatedSegments.map((s) => s.startTime)
                );
                dispatch(
                  fitTimelineToContent({
                    minStart: Math.max(0, minStart),
                    maxEnd: maxEnd,
                  })
                );
                console.log(
                  `Updated timeline viewport to show segments from ${minStart}s to ${maxEnd}s`
                );
              }

              console.log(`Dispatched addSegment for: ${file.name}`);
            } else {
              console.warn(
                `Invalid duration for video: ${file.name}`,
                duration
              );
              URL.revokeObjectURL(videoUrl); // Clean up
            }
            resolve();
          };

          video.onerror = (error) => {
            clearTimeout(timeout);
            console.error(`Failed to load video: ${file.name}`, error);
            console.error("Video error details:", video.error);
            URL.revokeObjectURL(videoUrl); // Clean up
            resolve(); // Continue with next video even if one fails
          };
        });
      } else {
        console.warn(`Skipped non-video file: ${file.name} (${file.type})`);
      }
    }

    // Reset input
    e.target.value = "";
    console.log("Finished processing files.");
  };

  const handleAddOverlay = () => {
    if (segments.length === 0) {
      alert("Please add at least one video segment first");
      return;
    }

    // Assign overlay to all current segments by default
    const segmentIds = segments.map((s) => s.id);
    dispatch(
      addOverlay({
        segmentIds,
        startTime: 0,
        duration: 5,
        x: 0.1,
        y: 0.1,
        width: 0.3,
        height: 0.2,
        text: "Logo Overlay",
        type: "text",
      })
    );
  };

  const handlePlayAll = () => {
    if (segments.length === 0) {
      alert("Please add at least one video segment first");
      return;
    }

    const sortedSegments = [...segments].sort(
      (a, b) => a.startTime - b.startTime
    );

    // Start from current playhead position if it's inside any segment;
    // otherwise, start from the first segment.
    const currentTime = playhead.time;
    const fromCurrent =
      sortedSegments.find(
        (seg) =>
          currentTime >= seg.startTime &&
          currentTime < seg.startTime + seg.duration
      ) || sortedSegments.find((seg) => currentTime < seg.startTime);

    const startTime = fromCurrent
      ? Math.max(currentTime, fromCurrent.startTime)
      : sortedSegments[0].startTime;

    dispatch(setPlayheadTime(startTime));
    dispatch(setPlaying(true));
  };

  const handlePlayPause = () => {
    dispatch(setPlaying(!playhead.playing));
  };

  const handleRecord = () => {
    // Placeholder for record functionality
    alert("Record functionality not yet implemented");
  };

  const handleExportTimeline = () => {
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      segments: segments.map((seg) => ({
        id: seg.id,
        source: seg.source,
        label: seg.label,
        startTime: seg.startTime,
        duration: seg.duration,
        fileOffset: seg.fileOffset,
      })),
      overlays: overlays.map((overlay) => ({
        id: overlay.id,
        segmentIds: overlay.segmentIds,
        startTime: overlay.startTime,
        duration: overlay.duration,
        x: overlay.x,
        y: overlay.y,
        width: overlay.width,
        height: overlay.height,
        text: overlay.text,
        type: overlay.type,
      })),
      transitions: transitions.map((trans) => ({
        id: trans.id,
        fromSegmentId: trans.fromSegmentId,
        toSegmentId: trans.toSegmentId,
        type: trans.type,
        duration: trans.duration,
        easing: trans.easing,
      })),
    };

    // Show the JSON in a reusable popup component
    setExportJson(JSON.stringify(exportData, null, 2));
    setShowExportPanel(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h1 className="text-lg sm:text-xl font-bold">Video Editor</h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Button
              variant="default"
              onClick={handleAddVideo}
              ariaLabel="Add video file"
              className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
            >
              + Add Video
            </Button>
            <Button
              variant="default"
              onClick={handleAddOverlay}
              ariaLabel="Add overlay"
              className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
            >
              + Add Overlay
            </Button>
            <Button
              variant="primary"
              onClick={playhead.playing ? handlePlayPause : handlePlayAll}
              ariaLabel={
                playhead.playing ? "Pause playback" : "Play all segments"
              }
              className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
            >
              {playhead.playing ? "⏸ Pause" : "► Play All"}
            </Button>
            <Button
              variant="default"
              onClick={handleExportTimeline}
              ariaLabel="Export timeline"
              className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
            >
              Export Timeline
            </Button>
            <Button
              variant="danger"
              onClick={handleRecord}
              ariaLabel="Record video"
              className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
            >
              Record
            </Button>
          </div>
        </div>
      </header>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        aria-label="Select video files"
      />

      {/* Main content */}
      <main className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 max-w-full">
        {/* Video Player - centered with letterboxing */}
        <div className="w-full mb-3 sm:mb-6">
          <VideoPlayer />
        </div>

        {/* Timeline - full width */}
        <div className="w-full">
          <Timeline />
        </div>
      </main>

      {/* Export JSON modal */}
      <JsonModal
        title="Export Timeline JSON"
        isOpen={showExportPanel}
        onClose={() => setShowExportPanel(false)}
        jsonString={exportJson}
      />
    </div>
  );
}

export default App;
