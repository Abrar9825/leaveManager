import React, { useEffect } from 'react';

export default function ConfirmDeleteModal({
  isOpen,
  title = 'Delete Item?',
  message = 'Are you sure you want to delete this? This action cannot be undone.',
  itemDetails = null,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDeleting = false,
  onConfirm,
  onClose,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => {
        if (!isDeleting) onClose();
      }}
    >
      <div
        className="w-full max-w-[380px] bg-surface-container-lowest rounded-[24px] shadow-2xl border border-surface-container p-5 sm:p-6 relative overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Red Glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Danger Icon Badge */}
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center mb-3 shadow-xs">
            <span className="material-symbols-outlined text-[24px]">delete_forever</span>
          </div>

          {/* Title */}
          <h3 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
            {title}
          </h3>

          {/* Description / Warning Message */}
          <p className="text-xs text-on-surface-variant leading-relaxed mt-1.5 px-2">
            {message}
          </p>

          {/* Optional item details preview */}
          {itemDetails && (
            <div className="w-full mt-3 p-3 rounded-xl bg-surface-container-low border border-surface-container text-left">
              {itemDetails}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 mt-5">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-98 text-on-surface font-semibold text-xs transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

