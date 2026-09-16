import React from "react";

export interface ResponsiveAppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ResponsiveAppShell({
  children,
  header,
  footer,
  className = "",
  contentClassName = "",
}: ResponsiveAppShellProps) {
  return (
    <div className="h-[100dvh] min-h-[100dvh] w-full bg-[#FAF7F2] md:bg-ambient-dots flex items-center justify-center p-0 md:py-6 md:px-4 overflow-hidden">
      {/* Mobile-first centered phone frame */}
      <main
        className={`w-full max-w-md h-[100dvh] min-h-[100dvh] max-h-[100dvh] md:h-[92vh] md:max-h-[920px] md:min-h-[844px] bg-[#FAF7F2] md:rounded-[36px] md:border md:border-[#EAE6DE] md:shadow-[0_20px_50px_-12px_rgba(60,45,40,0.12)] flex flex-col relative overflow-hidden ${className}`}
      >
        {/* Optional Header */}
        {header && (
          <header className="shrink-0 z-30 sticky top-0 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#EAE6DE]/60">
            {header}
          </header>
        )}

        {/* Scrollable Content Viewport */}
        <div
          className={`flex-1 overflow-y-auto hide-scrollbar flex flex-col relative ${contentClassName}`}
        >
          {children}
        </div>

        {/* Anchored Footer / BottomNav */}
        {footer && <div className="shrink-0 z-40 w-full relative">{footer}</div>}
      </main>
    </div>
  );
}
