import React from "react";

/**
 * Small handle rendered between two segments to indicate/configure a transition.
 */
const TransitionHandle = ({
  left,
  top,
  hasTransition,
  onDoubleClick,
  onClick,
}) => {
  const size = 18;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) onClick(e);
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDoubleClick) onDoubleClick(e);
  };

  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left: `${left - size / 2}px`,
        top: `${top - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        zIndex: 20,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role="button"
      tabIndex={0}
      aria-label={hasTransition ? "Edit transition" : "Add transition"}
    >
      <div
        className={`rounded-full border-2 flex items-center justify-center text-[9px] font-bold cursor-pointer ${
          hasTransition
            ? "bg-red-500 border-white text-white"
            : "bg-gray-700 border-gray-300 text-gray-100"
        }`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      >
        ↔
      </div>
    </div>
  );
};

export default TransitionHandle;


