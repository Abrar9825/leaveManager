import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-low shadow-[0_-1px_6px_rgba(23,26,53,0.02)] mt-auto border-t border-surface-container/60">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-xs">
          <span>© 2026 Leave Manager Inc.</span>
          <span className="inline-block w-1 h-1 rounded-full bg-outline-variant"></span>
          <span>Engineered with precision</span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="#leave-policy"
            onClick={(e) => e.preventDefault()}
            className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            Leave Policy
          </a>
          <a
            href="#privacy"
            onClick={(e) => e.preventDefault()}
            className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            Privacy
          </a>
          <a
            href="#support"
            onClick={(e) => e.preventDefault()}
            className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}

