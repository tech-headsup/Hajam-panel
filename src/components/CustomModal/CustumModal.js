import React from 'react';

function CustomModal({
  isOpen,
  onClose,
  children,
  className = "",
  size = "md",
  height = null, // New height prop in pixels (e.g., 400, 500, 600)
  fullscreen = false
}) {
  // Handle escape key press - Hook must be called before any early returns
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render anything if modal is not open - moved after hooks
  if (!isOpen) return null;

  // Define size classes
  const sizeClasses = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full"
  };

  // Get the size class, fallback to md if invalid size provided
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // Handle height styling
  const heightStyle = height ? { height: `${height}px` } : {};
  const heightClass = height ? '' : 'max-h-[90vh]';

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal Content */}
      <div
        className={`relative bg-white rounded-lg shadow-xl ${sizeClass} w-full ${heightClass} overflow-y-auto transform transition-all ${className}`}
        style={heightStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default CustomModal;
