"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import { CloseIcon } from "./Icons";
import { triggerHaptic } from "@/lib/haptics";

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
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const startYRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const dragYRef = useRef<number>(0);

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
      setDragY(0);
      setIsDismissing(false);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDismissing) return;
    startYRef.current = e.touches[0].clientY;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null || isDismissing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0) {
      // Dragging down: 1-to-1 movement
      dragYRef.current = diff;
      setDragY(diff);
    } else {
      // Dragging up: apply rubber band resistance
      const resisted = diff * 0.18;
      dragYRef.current = resisted;
      setDragY(resisted);
    }
  };

  const handleTouchEnd = () => {
    if (startYRef.current === null || isDismissing) return;
    const finalDiff = dragYRef.current;
    const duration = Date.now() - startTimeRef.current;
    const velocity = duration > 0 ? finalDiff / duration : 0;

    setIsDragging(false);
    startYRef.current = null;

    // Threshold: dragged down > 80px or flicked downwards with velocity > 0.5px/ms
    if (finalDiff > 80 || velocity > 0.5) {
      setIsDismissing(true);
      triggerHaptic("light");
      setDragY(window.innerHeight || 600);
      setTimeout(() => {
        onClose();
        setDragY(0);
        setIsDismissing(false);
      }, 240);
    } else {
      // Snap back to 0
      dragYRef.current = 0;
      setDragY(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-[#24201D]/45 backdrop-blur-sm transition-opacity duration-300 ${
          isDismissing ? "opacity-0" : "opacity-100 animate-in fade-in"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-sheet-title" : undefined}
        style={{
          transform: `translate3d(0, ${dragY}px, 0)`,
          transition: isDragging
            ? "none"
            : "transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)",
          willChange: "transform",
        }}
        className={`relative w-full max-w-md bg-[#FDFBF7] rounded-t-[32px] border-t border-[#EAE6DE] shadow-[0_-12px_44px_rgba(0,0,0,0.16)] z-10 flex flex-col ${maxHeight} animate-in slide-in-from-bottom-6 duration-300 ease-out select-none ${className}`}
      >
        {/* Drag handle area with active touch listener */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div
            className={`w-12 h-1.5 rounded-full transition-all duration-200 ${
              isDragging ? "bg-[#BA3F4A] w-14" : "bg-[#D8D2C7] hover:bg-[#BDB5A8]"
            }`}
          />
        </div>

        {/* Header - also draggable for fluid ergonomics */}
        {(title || showCloseButton) && (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex items-start justify-between px-5 pt-1 pb-3 border-b border-[#EAE6DE]/60 select-none"
          >
            <div className="flex-1 pr-2">
              {title && (
                <h3
                  id="modal-sheet-title"
                  className="font-serif text-lg sm:text-xl font-bold text-[#1E1A18] tracking-tight"
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-[#554B45] mt-0.5 font-medium">
                  {subtitle}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 -mr-1.5 text-[#554B45] hover:text-[#1E1A18] rounded-full hover:bg-[#FAF7F2] transition-colors cursor-pointer"
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

