"use client";

import React, { useEffect, useState, useRef } from "react";
import { SparklesIcon, HeartIcon } from "./Icons";

export interface PointsBadgeProps {
  points: number;
  size?: "sm" | "md" | "lg";
  variant?: "rose" | "honey" | "linen" | "terracotta";
  showHeart?: boolean;
  showPlusOnIncrease?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function PointsBadge({
  points,
  size = "md",
  variant = "honey",
  showHeart = false,
  showPlusOnIncrease = true,
  prefix = "",
  suffix = "pts",
  className = "",
}: PointsBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [diff, setDiff] = useState<number | null>(null);
  const prevPointsRef = useRef(points);

  useEffect(() => {
    if (prevPointsRef.current !== points) {
      const delta = points - prevPointsRef.current;
      setDiff(delta);
      setIsAnimating(true);

      const timer = setTimeout(() => {
        setIsAnimating(false);
        setDiff(null);
      }, 900);

      prevPointsRef.current = points;
      return () => clearTimeout(timer);
    }
  }, [points]);

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-sm gap-2",
    lg: "px-4 py-2 text-base gap-2.5",
  };

  const numberSizes = {
    sm: "text-sm",
    md: "text-base font-semibold",
    lg: "text-xl font-bold",
  };

  const variantStyles = {
    honey: "bg-[#FFF9EC] text-[#925C08] border border-[#E8A838]/30 shadow-[0_2px_8px_-2px_rgba(232,168,56,0.18)]",
    rose: "bg-[#FFF2F3] text-[#BA3F4A] border border-[#E06D75]/25 shadow-[0_2px_8px_-2px_rgba(224,109,117,0.18)]",
    terracotta: "bg-[#FFF4F0] text-[#9C4629] border border-[#D97757]/25 shadow-[0_2px_8px_-2px_rgba(217,119,87,0.18)]",
    linen: "bg-[#FDFBF7] text-[#24201D] border border-[#EAE6DE] shadow-[0_2px_8px_-2px_rgba(60,45,40,0.04)]",
  };

  return (
    <div
      className={`inline-flex items-center rounded-full font-medium transition-all select-none relative ${
        sizeStyles[size]
      } ${variantStyles[variant]} ${
        isAnimating ? "animate-point-pop" : ""
      } ${className}`}
    >
      <span className="shrink-0 text-current opacity-90">
        {showHeart ? (
          <HeartIcon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} filled />
        ) : (
          <SparklesIcon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
        )}
      </span>

      <div className="inline-flex items-baseline gap-1">
        {prefix && <span className="opacity-75 text-xs">{prefix}</span>}
        <span
          className={`font-serif tracking-tight text-current ${numberSizes[size]}`}
        >
          {points.toLocaleString()}
        </span>
        {suffix && (
          <span className="text-[11px] uppercase tracking-wider font-semibold opacity-70">
            {suffix}
          </span>
        )}
      </div>

      {diff !== null && showPlusOnIncrease && (
        <span
          className={`absolute -top-3 right-0 text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-bounce ${
            diff > 0
              ? "bg-[#7E9F85] text-white"
              : "bg-[#D97757] text-white"
          }`}
        >
          {diff > 0 ? `+${diff}` : diff}
        </span>
      )}
    </div>
  );
}
