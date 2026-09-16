"use client";

import React, { useEffect, useCallback } from "react";
import { CloseIcon } from "./Icons";

export interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  maxHeight?: string;
  className?: string;
}

export function ModalSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  showCloseButton = true,
  maxHeight = "max-h-[85vh]",
  className = "",
}: ModalSheetProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-[#24201D]/45 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-sheet-title" : undefined}
        className={`relative w-full max-w-md bg-[#FDFBF7] rounded-t-[28px] border-t border-[#EAE6DE] shadow-[0_-10px_40px_rgba(0,0,0,0.14)] z-10 flex flex-col ${maxHeight} animate-in slide-in-from-bottom-6 duration-300 ease-out ${className}`}
      >
        {/* Drag handle pill */}
        <div className="pt-3 pb-1.5 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1.5 bg-[#D8D2C7] rounded-full" />
        </div>

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-5 pt-2 pb-3 border-b border-[#EAE6DE]/60">
            <div className="flex-1 pr-2">
              {title && (
                <h3
                  id="modal-sheet-title"
                  className="font-serif text-lg sm:text-xl font-semibold text-[#24201D] tracking-tight"
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-[#756963] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 -mr-1.5 text-[#756963] hover:text-[#24201D] rounded-full hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                aria-label="Close sheet"
              >
                <CloseIcon size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 hide-scrollbar">
          {children}
        </div>

        {/* Optional Action Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[#EAE6DE]/70 bg-[#FAF7F2]/60 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
