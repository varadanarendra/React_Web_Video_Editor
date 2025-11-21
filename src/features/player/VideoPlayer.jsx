import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectPlayhead, setPlayheadTime, setPlaying } from "../ui/uiSlice";
import { selectAllSegments } from "../segments/segmentsSlice";
import { selectAllOverlays } from "../overlays/overlaysSlice";
import {
  getSegmentAtTime,
  globalTimeToSegmentTime,
  segmentTimeToFileTime,
} from "../../utils/timelineUtils";
import { store } from "../../app/store";
import OverlayCanvas from "../overlays/OverlayCanvas";

/**
 * Video Player component using HTML5 video
 * Handles playback synchronization with Redux state and segment switching
 */
const VideoPlayer = () => {
  const videoRef = useRef(null);
  const dispatch = useDispatch();
  const playhead = useSelector(selectPlayhead);
  const segments = useSelector(selectAllSegments);
  const overlays = useSelector(selectAllOverlays);
  const [currentSegment, setCurrentSegment] = useState(null);
  const playAllRef = useRef(false);
  const timeUpdateThrottleRef = useRef(null);
  const initializedRef = useRef(false);
  const currentSegmentRef = useRef(null);

  // Set up video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Throttled timeupdate handler
    const handleTimeUpdate = () => {
      if (timeUpdateThrottleRef.current) return;

      timeUpdateThrottleRef.current = setTimeout(() => {
        if (video && !video.paused) {
          const currentTime = video.currentTime;
          // Get current segment from state to avoid stale closure
          const state = store.getState();
          const currentSegments = selectAllSegments(state);
          const currentPlayhead = selectPlayhead(state);

          // Try to find segment by matching source first
          const videoSrc = video.src;
          let segment = currentSegmentRef.current;

          if (!segment || !videoSrc || !videoSrc.includes(segment.source)) {
            // Find segment that matches current video source
            segment = currentSegments.find((seg) => {
              if (!videoSrc) return false;
              // Check if source matches (handle both full URLs and relative paths)
              const segSource = seg.source;
              return (
                videoSrc.includes(segSource) ||
                segSource.includes(videoSrc.split("/").pop()) ||
                videoSrc.endsWith(segSource) ||
                segSource.endsWith(videoSrc.split("/").pop())
              );
            });

            // If no match by source, find by current playhead time
            if (!segment) {
              segment = getSegmentAtTime(currentSegments, currentPlayhead.time);
            }

            currentSegmentRef.current = segment;
          }

          if (segment) {
            // Convert video time to timeline time
            const segmentLocalTime = currentTime - segment.fileOffset;
            const timelineTime = segment.startTime + segmentLocalTime;
            dispatch(setPlayheadTime(timelineTime));
          }
        }
        timeUpdateThrottleRef.current = null;
      }, 100);
    };

    const handlePlay = () => {
      dispatch(setPlaying(true));
    };

    const handlePause = () => {
      dispatch(setPlaying(false));
    };

    const handleEnded = () => {
      const state = store.getState();
      const currentSegments = selectAllSegments(state);
      const activeSegment = currentSegmentRef.current;

      if (playAllRef.current && activeSegment) {
        const sortedSegments = [...currentSegments].sort(
          (a, b) => a.startTime - b.startTime
        );
        const currentIndex = sortedSegments.findIndex(
          (seg) => seg.id === activeSegment.id
        );
        const nextSegment = sortedSegments[currentIndex + 1];

        if (nextSegment) {
          switchToSegment(nextSegment);
          dispatch(setPlayheadTime(nextSegment.startTime));
          video.play().catch(console.error);
        } else {
          dispatch(setPlaying(false));
          playAllRef.current = false;
        }
      } else {
        dispatch(setPlaying(false));
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      if (timeUpdateThrottleRef.current) {
        clearTimeout(timeUpdateThrottleRef.current);
      }
    };
  }, [dispatch]);

  // Initialize with first segment when segments become available
  useEffect(() => {
    const video = videoRef.current;
    if (!video || initializedRef.current) return;

    // If segments are available but no current segment, load the first one
    if (segments.length > 0 && !currentSegment) {
      const sortedSegments = [...segments].sort(
        (a, b) => a.startTime - b.startTime
      );
      const firstSegment = sortedSegments[0];
      if (firstSegment) {
        switchToSegment(firstSegment, false); // Load but don't auto-play
        initializedRef.current = true;
      }
    }
  }, [segments, currentSegment]);

  // Update current segment based on playhead time
  useEffect(() => {
    const segment = getSegmentAtTime(segments, playhead.time);
    if (segment && segment.id !== currentSegment?.id) {
      setCurrentSegment(segment);
      currentSegmentRef.current = segment;
      initializedRef.current = true;
    }
  }, [playhead.time, segments, currentSegment]);

  // Sync player with Redux playhead state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const segment = getSegmentAtTime(segments, playhead.time);

    // Enable playAll mode if we're playing and at the start of the first segment
    if (playhead.playing && segments.length > 0) {
      const sortedSegments = [...segments].sort(
        (a, b) => a.startTime - b.startTime
      );
      const firstSegment = sortedSegments[0];
      if (Math.abs(playhead.time - firstSegment.startTime) < 0.1) {
        playAllRef.current = true;
        // Ensure first segment is loaded and positioned correctly
        if (!currentSegment || currentSegment.id !== firstSegment.id) {
          switchToSegment(firstSegment, true); // Pass shouldPlay=true
        } else {
          // Make sure we're at the right time
          const fileTime = segmentTimeToFileTime(firstSegment, 0);
          if (Math.abs(video.currentTime - fileTime) > 0.1) {
            video.currentTime = fileTime;
          }
          // If paused but should be playing, start playing
          if (video.paused) {
            video.play().catch((error) => {
              console.error("Error playing video:", error);
            });
          }
        }
      }
    }

    if (segment) {
      const segmentLocalTime = globalTimeToSegmentTime(segment, playhead.time);
      if (segmentLocalTime !== null) {
        const fileTime = segmentTimeToFileTime(segment, segmentLocalTime);

        // Update source if needed
        if (segment.id !== currentSegment?.id) {
          switchToSegment(segment, playhead.playing); // Pass playing state
        } else {
          // Only seek if significantly different and not actively playing
          // When starting playback, we need to seek to the correct position
          const needsSeek = Math.abs(video.currentTime - fileTime) > 0.1;
          if (needsSeek) {
            // If we're starting to play, seek to the correct position
            if (playhead.playing && video.paused) {
              video.currentTime = fileTime;
            } else if (!playhead.playing) {
              // If paused, always seek to match playhead
              video.currentTime = fileTime;
            }
          }
        }
      }
    }

    // Sync play/pause state
    // Only try to play if we have a valid segment and source
    if (playhead.playing && video.paused && segment) {
      // Check if video has a source and is ready
      const hasSource = video.src && video.src.length > 0;
      const isReady = video.readyState >= 2; // HAVE_CURRENT_DATA or higher

      if (hasSource) {
        if (isReady) {
          video.play().catch((error) => {
            console.error("Error playing video:", error);
            // If autoplay is blocked, try again after user interaction
            if (error.name === "NotAllowedError") {
              console.warn("Autoplay blocked. User interaction required.");
            }
          });
        } else {
          // Wait for video to be ready, then play
          const handleCanPlay = () => {
            video.play().catch((error) => {
              console.error("Error playing video after ready:", error);
            });
            video.removeEventListener("canplay", handleCanPlay);
            video.removeEventListener("loadeddata", handleCanPlay);
          };
          video.addEventListener("canplay", handleCanPlay);
          video.addEventListener("loadeddata", handleCanPlay);
        }
      }
    } else if (!playhead.playing && !video.paused) {
      video.pause();
      playAllRef.current = false;
    }
  }, [playhead, segments, currentSegment]);

  const switchToSegment = (segment, shouldPlay = false) => {
    const video = videoRef.current;
    if (!video || !segment) {
      console.warn("switchToSegment: video or segment is null", {
        video: !!video,
        segment: !!segment,
      });
      return;
    }

    // Set up a one-time handler to seek and play when video is ready
    const handleReady = () => {
      video.currentTime = segment.fileOffset;
      setCurrentSegment(segment);
      currentSegmentRef.current = segment;

      if (shouldPlay) {
        video
          .play()
          .then(() => {
            console.log("✓ Video playing");
          })
          .catch((error) => {
            console.error("Error playing video after segment switch:", error);
            // If autoplay is blocked, log it but don't fail
            if (error.name === "NotAllowedError") {
              console.warn(
                "Autoplay blocked. This is normal - user interaction may be required."
              );
            }
          });
      }
      video.removeEventListener("loadeddata", handleReady);
      video.removeEventListener("canplay", handleReady);
    };

    // Listen for when video is ready
    video.addEventListener("loadeddata", handleReady);
    video.addEventListener("canplay", handleReady);

    // Set the video source
    video.src = segment.source;
    video.load();

    // If video is already loaded, call handleReady immediately
    // But wait a bit to ensure src is set
    setTimeout(() => {
      if (video.readyState >= 2) {
        // HAVE_CURRENT_DATA
        handleReady();
      }
    }, 100);
  };

  // Get overlays visible at current time
  const visibleOverlays = overlays.filter((overlay) => {
    if (!currentSegment || !overlay.segmentIds.includes(currentSegment.id)) {
      return false;
    }
    const segmentLocalTime = globalTimeToSegmentTime(
      currentSegment,
      playhead.time
    );
    if (segmentLocalTime === null) return false;
    return (
      segmentLocalTime >= overlay.startTime &&
      segmentLocalTime < overlay.startTime + overlay.duration
    );
  });

  return (
    <div
      className="relative w-full bg-black rounded-lg overflow-hidden"
      style={{
        minHeight: "400px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="w-full relative"
        style={{
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
          playsInline
          preload="auto"
        />
        <OverlayCanvas
          overlays={visibleOverlays}
          currentSegment={currentSegment}
          timelineTime={playhead.time}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
