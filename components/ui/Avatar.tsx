"use client";

import React, { useState } from "react";

export interface AvatarProps {
  avatar?: string | null;
  name?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fallback?: string;
  className?: string;
}

export function Avatar({
  avatar,
  name,
  alt = "Avatar",
  size = "md",
  fallback = "❤️",
  className = "",
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-lg",
    lg: "w-16 h-16 text-2xl",
    xl: "w-20 h-20 text-3xl",
  };

  const isImageUrl =
    Boolean(avatar) &&
    !imageError &&
    (avatar!.startsWith("http://") ||
      avatar!.startsWith("https://") ||
      avatar!.startsWith("/") ||
      avatar!.startsWith("data:"));

  const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : null;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden shrink-0 select-none ${sizeClasses[size]} ${className}`}
    >
      {isImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar!}
          alt={alt}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="font-semibold">
          {avatar && !imageError ? avatar : initial || fallback}
        </span>
      )}
    </div>
  );
}
