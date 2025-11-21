import React, { useState } from "react";
import Button from "./Button";

/**
 * Reusable modal component for showing JSON (or any text) with copy support.
 */
const JsonModal = ({ title = "Preview", isOpen, onClose, jsonString = "" }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy JSON:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-gray-900 rounded-lg shadow-xl border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-sm sm:text-base font-semibold text-white">
            {title}
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

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 py-3">
          <pre className="text-[11px] sm:text-xs md:text-sm font-mono text-gray-100 whitespace-pre break-all bg-black/60 rounded-md border border-gray-700 p-3">
            {jsonString || "{}"}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-700">
          <span className="text-[10px] sm:text-xs text-gray-400">
            {copied ? "Copied!" : "You can copy this JSON for debugging or export."}
          </span>
          <Button
            variant="primary"
            onClick={handleCopy}
            ariaLabel="Copy JSON to clipboard"
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
          >
            Copy JSON
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JsonModal;


