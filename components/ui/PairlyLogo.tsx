"use client";

import React from "react";

interface PairlyLogoProps {
  variant?: "mark" | "horizontal" | "stacked";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  subtitle?: string;
  inverted?: boolean;
}

export function PairlyLogo({
  variant = "horizontal",
  size = "md",
  className = "",
  subtitle,
  inverted = false,
}: PairlyLogoProps) {
  // Size mapping for the emblem SVG
  const emblemSizeMap = {
    sm: 28,
    md: 38,
    lg: 56,
    xl: 72,
  };

  const emblemDimension = emblemSizeMap[size];

  // Colors
  const rosePrimary = inverted ? "#F2888F" : "#E06D75";
  const roseDeep = inverted ? "#E06D75" : "#C85A63";
  const apertureColor = inverted ? "#221C1D" : "#FAF7F2";
  const textColor = inverted ? "#FAF7F2" : "#24201D";
  const subtextColor = inverted ? "#A89F99" : "#756963";

  // The official vector emblem from Stitch
  const Emblem = (
    <svg
      width={emblemDimension}
      height={emblemDimension}
      viewBox="-100 -80 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 hover:scale-105"
      aria-label="Pairly Logo Emblem"
    >
      {/* Left Wing / Partner A Loop */}
      <path
        d="M -16 -32 C -42 -60, -84 -30, -84 10 C -84 45, -48 76, 0 102 C -24 72, -48 44, -48 12 C -48 -16, -30 -36, -8 -24 Z"
        fill={rosePrimary}
      />
      {/* Right Wing / Partner B Loop */}
      <path
        d="M 16 -32 C 42 -60, 84 -30, 84 10 C 84 45, 48 76, 0 102 C 24 72, 48 44, 48 12 C 48 -16, 30 -36, 8 -24 Z"
        fill={roseDeep}
      />
      {/* Central Aperture Intersection Cut */}
      <path
        d="M 0 -10 C 13 -30, 36 -24, 36 -4 C 36 15, 12 37, 0 54 C -12 37, -36 15, -36 -4 C -36 -24, -13 -30, 0 -10 Z"
        fill={apertureColor}
      />
      {/* Core Reciprocal Connection Pearl */}
      <circle cx="0" cy="14" r="8" fill={rosePrimary} />
      <circle cx="0" cy="14" r="3.5" fill={apertureColor} />
    </svg>
  );

  if (variant === "mark") {
    return <div className={`inline-flex items-center justify-center ${className}`}>{Emblem}</div>;
  }

  if (variant === "stacked") {
    const textSizes = {
      sm: "text-xl",
      md: "text-2xl",
      lg: "text-3xl sm:text-4xl",
      xl: "text-4xl sm:text-5xl",
    };

    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        <div className="p-3 rounded-[28px] bg-white border border-[#FAD4DA] shadow-[0_12px_28px_-6px_rgba(224,109,117,0.18)] mb-3">
          {Emblem}
        </div>
        <h1
          className={`font-serif font-bold tracking-tight ${textSizes[size]}`}
          style={{ color: textColor }}
        >
          Pairly
        </h1>
        <p
          className="text-xs sm:text-sm font-sans font-medium tracking-wide mt-1 max-w-[260px]"
          style={{ color: subtextColor }}
        >
          {subtitle || "Our Little Reward Shop"}
        </p>
      </div>
    );
  }

  // Horizontal variant (default)
  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {Emblem}
      <div className="flex flex-col leading-none">
        <span
          className={`font-serif font-bold tracking-tight ${textSizes[size]}`}
          style={{ color: textColor }}
        >
          Pairly
        </span>
        {subtitle && (
          <span
            className="text-[10px] font-sans font-semibold tracking-wider uppercase mt-0.5"
            style={{ color: subtextColor }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
