import React from 'react';

/**
 * Accessible button component with consistent styling
 */
const Button = ({ 
  children, 
  onClick, 
  variant = 'default', 
  disabled = false,
  ariaLabel,
  className = '',
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation';
  
  const variants = {
    default: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || children}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

