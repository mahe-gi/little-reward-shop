"use client";

import React, { useEffect } from "react";
import { CheckCircleIcon, CloseIcon, HeartIcon, SparklesIcon } from "./Icons";

export type ToastType = "success" | "rose" | "info" | "warning";

export interface ToastProps {
  id?: string;
  isOpen?: boolean;
  type?: ToastType;
  title: string;
  description?: string;
  points?: number;
  duration?: number;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function Toast({
  isOpen = true,
  type = "rose",
  title,
  description,
  points,
  duration = 4000,
  onClose,
  action,
  className = "",
}: ToastProps) {
  useEffect(() => {
    if (!isOpen || duration <= 0) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const iconMap = {
    rose: <HeartIcon size={18} filled className="text-[#E06D75] animate-heartbeat" />,
    success: <CheckCircleIcon size={18} className="text-[#7E9F85]" />,
    info: <SparklesIcon size={18} className="text-[#E8A838]" />,
    warning: <SparklesIcon size={18} className="text-[#D97757]" />,
  };

  return (
    <div
      role="alert"
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] sm:max-w-md w-full px-3 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto ${className}`}
    >
      <div className="flex items-center gap-3 bg-[#FDFBF7]/95 backdrop-blur-md px-4 py-3 rounded-full border border-[#EAE6DE] shadow-[0_12px_32px_-4px_rgba(44,32,28,0.14)] text-[#1E1A18]">
        <div className="shrink-0 flex items-center justify-center p-1 rounded-full bg-[#FAF7F2]">
          {iconMap[type]}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#1E1A18] truncate leading-tight">
              {title}
            </p>
            {points !== undefined && (
              <span className="text-xs font-serif font-bold text-[#BA3F4A] bg-[#FFF2F3] px-1.5 py-0.5 rounded-full">
                +{points} pts
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-[#554B45] truncate mt-0.5 leading-snug">
              {description}
            </p>
          )}
        </div>

        {action && (
          <button
            onClick={action.onClick}
            className="shrink-0 text-xs font-semibold text-[#BA3F4A] hover:underline px-2 py-1 cursor-pointer"
          >
            {action.label}
          </button>
        )}

        <button
          onClick={onClose}
          className="shrink-0 p-1 text-[#554B45] hover:text-[#1E1A18] rounded-full hover:bg-[#EAE6DE]/40 transition-colors cursor-pointer"
          aria-label="Close notification"
        >
          <CloseIcon size={16} />
        </button>
      </div>
    </div>
  );
}
