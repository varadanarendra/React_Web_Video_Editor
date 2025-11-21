import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  addTransition,
  updateTransition,
} from "./transitionsSlice";
import Button from "../../components/Button";

/**
 * Configure Transition modal
 * - Used for creating or editing a transition between two segments
 */
const TransitionModal = ({
  isOpen,
  onClose,
  fromSegment,
  toSegment,
  existingTransition,
}) => {
  const dispatch = useDispatch();
  const [type, setType] = useState("Fade");
  const [duration, setDuration] = useState(0.5);
  const [easing, setEasing] = useState("ease-in-out");

  useEffect(() => {
    if (!isOpen) return;

    if (existingTransition) {
      setType(existingTransition.type || "Fade");
      setDuration(existingTransition.duration ?? 0.5);
      setEasing(existingTransition.easing || "ease-in-out");
    } else {
      setType("Fade");
      setDuration(0.5);
      setEasing("ease-in-out");
    }
  }, [isOpen, existingTransition]);

  if (!isOpen || !fromSegment || !toSegment) return null;

  const handleApply = () => {
    const payload = {
      fromSegmentId: fromSegment.id,
      toSegmentId: toSegment.id,
      type,
      duration: Math.max(0.1, Math.min(2, Number(duration) || 0.5)),
      easing,
    };

    if (existingTransition) {
      dispatch(
        updateTransition({
          id: existingTransition.id,
          updates: payload,
        })
      );
    } else {
      dispatch(addTransition(payload));
    }

    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label="Configure Transition"
    >
      <div className="w-full max-w-xl bg-gray-900 rounded-lg shadow-xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <span>Configure Transition</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
            aria-label="Close"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-4 text-sm text-gray-100">
          <div className="text-xs sm:text-sm text-gray-300">
            Transition between{" "}
            <span className="font-semibold">{fromSegment.label}</span> and{" "}
            <span className="font-semibold">{toSegment.label}</span>
          </div>

          <div className="space-y-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-200">
              Transition Type:
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Fade">Fade</option>
              <option value="Crossfade">Crossfade</option>
              <option value="Zoom">Zoom</option>
              <option value="Slide">Slide</option>
            </select>
            <p className="text-[11px] text-gray-400">
              Select the transition effect between video segments
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-200">
              Duration (seconds):
            </label>
            <input
              type="number"
              min="0.1"
              max="2"
              step="0.1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-gray-400">
              Transition duration in seconds (0.1 - 2.0)
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-200">
              Easing:
            </label>
            <select
              value={easing}
              onChange={(e) => setEasing(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ease-in-out">Ease In-Out</option>
              <option value="ease-in">Ease In</option>
              <option value="ease-out">Ease Out</option>
              <option value="linear">Linear</option>
            </select>
            <p className="text-[11px] text-gray-400">
              Animation easing function
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-700">
          <Button
            variant="secondary"
            onClick={onClose}
            className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransitionModal;


